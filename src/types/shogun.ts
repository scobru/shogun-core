import { IGunInstance } from "gun/types";
import { ethers } from "ethers";

// Type declarations for external modules
type Webauthn = any;
type MetaMask = any;
type Stealth = any;
type GunDB = any;

// Definizione dell'interfaccia DID
interface DID {
  getCurrentUserDID(): Promise<string | null>;
  resolveDID(did: string): Promise<any>;
  authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
  createDID(options?: any): Promise<string>;
  updateDIDDocument(did: string, documentUpdates: any): Promise<boolean>;
  deactivateDID(did: string): Promise<boolean>;
  registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{success: boolean, txHash?: string, error?: string}>;
}

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  password?: string;
  credentialId?: string;
  did?: string;
  wallet?: any;
}

/**
 * Sign up result interface
 */
export interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  error?: string;
  message?: string;
  wallet?: any;
  did?: string;
}

export interface IShogunCore {
  gun: IGunInstance<any>;
  gundb: GunDB;
  webauthn: Webauthn;
  metamask: MetaMask;
  stealth: Stealth;
  did : DID;

  // Direct authentication methods
  login(username: string, password: string): Promise<AuthResult>;
  loginWithWebAuthn(username: string): Promise<AuthResult>;
  loginWithMetaMask(address: string): Promise<AuthResult>;

  signUp(
    username: string,
    password: string,
    passwordConfirmation?: string,
  ): Promise<SignUpResult>;
  signUpWithMetaMask(address: string): Promise<AuthResult>;
  signUpWithWebAuthn(username: string): Promise<AuthResult>;

  // Support methods
  isWebAuthnSupported(): boolean;

  // Wallet methods
  getMainWallet(): ethers.Wallet | null;
  createWallet(): Promise<WalletInfo>;
  loadWallets(): Promise<WalletInfo[]>;
  signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array,
  ): Promise<string>;
  verifySignature(message: string | Uint8Array, signature: string): string;
  signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string,
  ): Promise<string>;
  getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
  generateNewMnemonic(): string;

  // Utility methods
  logout(): void;
  isLoggedIn(): boolean;

}

/**
 * WebAuthn configuration
 */
export interface WebauthnConfig {
  /** Enable WebAuthn */
  enabled?: boolean;
  /** Relying party name */
  rpName?: string;
  /** Relying party ID */
  rpId?: string;
}

/**
 * DID configuration
 */
export interface DIDConfig {
  /** DID registry address on blockchain */
  registryAddress?: string;
  /** Default network for DIDs */
  network?: string;
  /** Enable DID functionalities */
  enabled?: boolean;
}

/**
 * Shogun SDK configuration
 */
export interface ShogunSDKConfig {
  /** GunDB configuration */
  gundb?: {
    /** List of peers to use */
    peers: string[];
  };
  /** List of peers to use (deprecated, use gundb.peers) */
  peers?: string[];
  /** Enable websocket */
  websocket?: boolean;
  /** Ethereum provider URL */
  providerUrl?: string;
  /** Payment channel contract address */
  paymentChannelContract?: string;
  /** Enable radisk for disk storage */
  radisk?: boolean;
  /** Enable localStorage */
  localStorage?: boolean;
  /** State authority */
  stateAuthority?: string;
  /** WebAuthn configuration */
  webauthn?: WebauthnConfig;
  /** MetaMask configuration */
  metamask?: {
    /** Enable MetaMask */
    enabled?: boolean;
  };
  /** DID configuration */
  did?: DIDConfig;
}

export interface WalletInfo {
  wallet: any;
  path: string;
  address: string;
  getAddressString(): string;
}

export interface ShogunEvents {
  error: (data: { action: string; message: string }) => void;
  "auth:signup": (data: { username: string; userPub: string }) => void;
  "auth:login": (data: { username: string; userPub: string }) => void;
  "auth:logout": (data: Record<string, never>) => void;
}
