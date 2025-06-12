import {
  BaseConfig,
  BaseResult,
  BaseAuthResult,
  BaseCacheEntry,
} from "../../types/common";
import { AuthResult } from "../../types/shogun";

/**
 * Supported OAuth providers
 */
export type OAuthProvider =
  | "google"
  | "github"
  | "discord"
  | "twitter"
  | "custom";

/**
 * ZK Proof types
 */
export interface ZKProof {
  proof: string;
  publicSignals: string[];
  verificationKey: string;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret?: string; // Optional for PKCE flow
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

/**
 * ZK-OAuth configuration
 */
export interface ZKOAuthConfig extends BaseConfig {
  providers: Record<OAuthProvider, OAuthProviderConfig>;
  zkCircuitPath?: string; // Path to ZK circuit files
  usePKCE?: boolean; // Use PKCE for security
  cacheDuration?: number; // Duration for proof cache
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string; // For OIDC
}

/**
 * User info from OAuth provider
 */
export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
  provider: OAuthProvider;
}

/**
 * ZK-OAuth credentials
 */
export interface ZKOAuthCredentials {
  /** Generated username based on ZK proof */
  username: string;
  /** Generated password from ZK proof */
  password: string;
  /** Zero-knowledge proof */
  zkProof: ZKProof;
  /** Provider used for authentication */
  provider: OAuthProvider;
  /** Encrypted user info (using Paillier) */
  encryptedUserInfo: string;
  /** Public key for verification */
  publicKey: string;
}

/**
 * Connection result for ZK-OAuth
 */
export interface ZKOAuthConnectionResult extends BaseResult {
  provider?: OAuthProvider;
  userInfo?: OAuthUserInfo;
  authUrl?: string; // For redirect-based auth
}

/**
 * ZK proof generation result
 */
export interface ZKProofResult extends BaseResult {
  proof?: ZKProof;
  credentials?: ZKOAuthCredentials;
}

/**
 * Paillier key pair for homomorphic encryption
 */
export interface PaillierKeyPair {
  publicKey: {
    n: bigint;
    g: bigint;
    bitLength: number;
  };
  privateKey: {
    lambda: bigint;
    mu: bigint;
  };
}

/**
 * ZK-OAuth plugin interface
 */
export interface ZKOAuthPluginInterface {
  /**
   * Check if ZK-OAuth is supported
   */
  isSupported(): boolean;

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[];

  /**
   * Initiate OAuth flow with a provider
   */
  initiateOAuth(provider: OAuthProvider): Promise<ZKOAuthConnectionResult>;

  /**
   * Complete OAuth flow and generate ZK proof
   */
  completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<ZKProofResult>;

  /**
   * Generate ZK credentials from OAuth user info
   */
  generateZKCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider,
  ): Promise<ZKOAuthCredentials>;

  /**
   * Verify ZK proof
   */
  verifyZKProof(proof: ZKProof): Promise<boolean>;

  /**
   * Login with ZK-OAuth
   */
  login(provider: OAuthProvider): Promise<AuthResult>;

  /**
   * Sign up with ZK-OAuth
   */
  signUp(provider: OAuthProvider): Promise<AuthResult>;

  /**
   * Generate Paillier key pair
   */
  generatePaillierKeys(bitLength?: number): Promise<PaillierKeyPair>;

  /**
   * Encrypt data using Paillier cryptosystem
   */
  encryptWithPaillier(
    data: string,
    publicKey: PaillierKeyPair["publicKey"],
  ): Promise<string>;

  /**
   * Decrypt data using Paillier cryptosystem
   */
  decryptWithPaillier(
    encryptedData: string,
    privateKey: PaillierKeyPair["privateKey"],
    publicKey: PaillierKeyPair["publicKey"],
  ): Promise<string>;
}

/**
 * ZK circuit inputs
 */
export interface ZKCircuitInputs {
  userIdHash: string;
  providerHash: string;
  timestamp: string;
  nonce: string;
}

/**
 * Cache entry for ZK proofs
 */
export interface ZKProofCache extends BaseCacheEntry<ZKProof> {
  provider: OAuthProvider;
  userIdHash: string;
}
