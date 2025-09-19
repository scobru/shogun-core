import {
  BaseConfig,
  BaseResult,
  BaseAuthResult,
  BaseCacheEntry,
} from "../../interfaces/common";
import { AuthResult, SignUpResult } from "../../interfaces/shogun";

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
  usePKCE?: boolean;
}

/**
 * OAuth configuration
 */
export interface OAuthConfig extends BaseConfig {
  providers: Partial<Record<OAuthProvider, OAuthProviderConfig>>;
  usePKCE?: boolean; // Use PKCE for security
  cacheDuration?: number; // Duration for cache
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  allowUnsafeClientSecret?: boolean;
  stateTimeout?: number; // Timeout per il state parameter (default: 10 minuti)
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
 * Credentials generated from OAuth flow
 */
export interface OAuthCredentials {
  username: string;
  password: string;
  salt?: string;
  key?: any; // Key pair for SEA
  provider: OAuthProvider;
}

/**
 * Connection result for OAuth
 */
export interface OAuthConnectionResult extends BaseResult {
  provider?: OAuthProvider;
  userInfo?: OAuthUserInfo;
  authUrl?: string; // For redirect-based auth
}

/**
 * OAuth plugin interface
 */
export interface OAuthPluginInterface {
  /**
   * Check if OAuth is supported
   */
  isSupported(): boolean;

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[];

  /**
   * Initiate OAuth flow with a provider
   */
  initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;

  /**
   * Complete OAuth flow
   */
  completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<OAuthConnectionResult>;

  /**
   * Generate credentials from OAuth user info
   */
  generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider,
    masterkey?: string,
  ): Promise<OAuthCredentials>;

  /**
   * Login with OAuth
   */
  login(provider: OAuthProvider): Promise<AuthResult>;

  /**
   * Sign up with OAuth provider
   * @param provider OAuth provider to use
   * @returns Promise with authentication result
   */
  signUp(provider: OAuthProvider): Promise<SignUpResult>;
}

/**
 * Cache entry for OAuth data
 */
export interface OAuthCache extends BaseCacheEntry<OAuthUserInfo> {
  provider: OAuthProvider;
  userId: string;
}
