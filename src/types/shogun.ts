import { IGunInstance, IGunUserInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { GunInstance } from "../gundb/gun-Instance";
import { GunRxJS } from "../gundb/gun-rxjs";
import { ShogunPlugin, PluginManager } from "./plugin";
import { ShogunStorage } from "../storage/storage";

/**
 * Standard plugin categories in ShogunCore
 */
export enum PluginCategory {
  /** Authentication plugins (WebAuthn, MetaMask, Bitcoin) */
  Authentication = "authentication",
  /** Wallet management plugins */
  Wallet = "wallet",
  /** Privacy and anonymity plugins */
  Privacy = "privacy",
  /** Decentralized identity plugins */
  Identity = "identity",
  /** Other utility plugins */
  Utility = "utility",
}

/**
 * Standard names for built-in plugins
 */
export enum CorePlugins {
  /** WebAuthn plugin */
  WebAuthn = "webauthn",
  /** Ethereum plugin */
  Web3 = "web3",
  /** Bitcoin wallet plugin */
  Nostr = "nostr",
  /** OAuth plugin */
  OAuth = "oauth",
}

export type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "oauth"
  | "bitcoin"
  | "pair";

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  sessionToken?: string;
  authMethod?: AuthMethod;
  // Include SEA pair for session persistence
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // Properties for OAuth flow
  redirectUrl?: string;
  pendingAuth?: boolean;
  message?: string;
  provider?: string;
  isNewUser?: boolean;
  // OAuth user data
  user?: {
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email?: string;
      name?: string;
      picture?: string;
      lastLogin: number;
    };
  };
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
  isNewUser?: boolean;
  authMethod?: AuthMethod;
  sessionToken?: string;
  // Include SEA pair for session persistence
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // Properties for OAuth flow
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  // OAuth user data
  user?: {
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email?: string;
      name?: string;
      picture?: string;
      lastLogin: number;
    };
  };
}

export interface IShogunCore extends PluginManager {
  gun: IGunInstance<any>;
  db: GunInstance;
  rx: GunRxJS; // RxJS integration
  storage: ShogunStorage;
  config: ShogunCoreConfig;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  // Event emitter methods
  on(eventName: string | symbol, listener: (...args: any[]) => void): any;
  off(eventName: string | symbol, listener: (...args: any[]) => void): any;
  once(eventName: string | symbol, listener: (...args: any[]) => void): any;
  removeAllListeners(eventName?: string | symbol): any;
  emit(eventName: string | symbol, ...args: any[]): boolean;

  // Error handling methods
  getRecentErrors(count?: number): ShogunError[];

  // Direct authentication methods
  login(username: string, password: string): Promise<AuthResult>;

  signUp(
    username: string,
    password: string,
    passwordConfirmation?: string,
  ): Promise<SignUpResult>;

  // Authentication method retrieval
  getAuthenticationMethod(type: AuthMethod): any;

  // User management methods
  getCurrentUser(): { pub: string; user?: any } | null;
  changeUsername(newUsername: string): Promise<{
    success: boolean;
    error?: string;
    oldUsername?: string;
    newUsername?: string;
  }>;

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
 * Shogun SDK configuration
 */
export interface ShogunCoreConfig {
  gunInstance?: IGunInstance<any>;
  authToken?: string;
  scope?: string;
  peers?: string[];
  localStorage?: boolean;
  radisk?: boolean;
  webauthn?: WebauthnConfig;
  web3?: {
    enabled?: boolean;
  };
  nostr?: {
    enabled?: boolean;
  };
  oauth?: {
    enabled?: boolean;
    usePKCE?: boolean;
    allowUnsafeClientSecret?: boolean;
    providers?: Record<string, any>;
  };
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
  plugins?: {
    autoRegister?: ShogunPlugin[];
  };
}

export interface ShogunEvents {
  error: (data: { action: string; message: string }) => void;
  "auth:signup": (data: { username: string; userPub: string }) => void;
  "auth:login": (data: { username: string; userPub: string }) => void;
  "auth:logout": (data: Record<string, never>) => void;
}

export interface Wallets {
  secp256k1Bitcoin: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
  secp256k1Ethereum: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
}
