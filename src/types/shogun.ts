import { IGunInstance } from "gun/types";
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

export type AuthMethod = "password" | "webauthn" | "web3" | "nostr" | "oauth";

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  sessionToken?: string;
  authMethod?: AuthMethod;
  // Properties for OAuth flow
  redirectUrl?: string;
  pendingAuth?: boolean;
  message?: string;
  provider?: string;
  isNewUser?: boolean;
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
}

export interface IShogunCore extends PluginManager {
  gun: IGunInstance<any>;
  db: GunInstance;
  rx: GunRxJS; // RxJS integration
  storage: ShogunStorage;
  config: ShogunSDKConfig;
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
export interface ShogunSDKConfig {
  gunInstance?: IGunInstance<any>;
  authToken?: string;
  appToken?: string;
  scope?: string;
  peers?: string[];
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
