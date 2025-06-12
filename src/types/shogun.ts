import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { GunInstance } from "../gundb/gunInstance";
import { GunRxJS } from "../gundb/rxjs-integration";
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
}

export type AuthMethod = "password" | "webauthn" | "web3" | "nostr";

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  authMethod?: AuthMethod;
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
}

export interface IShogunCore extends PluginManager {
  gun: IGunInstance<any>;
  gundb: GunInstance;
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

  // Logging configuration
  configureLogging(config: LoggingConfig): void;

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
 * Logging configuration
 */
export interface LoggingConfig {
  /** Enable logging (default: true in development, false in production) */
  enabled?: boolean;
  /** Log level: 'error', 'warning', 'info', 'debug' */
  level?: "error" | "warning" | "info" | "debug";
  /** Custom prefix for log messages */
  prefix?: string;
}

/**
 * Shogun SDK configuration
 */
export interface ShogunSDKConfig {
  gunInstance?: IGunInstance<any>;
  scope?: string;
  peers?: string[];
  webauthn?: WebauthnConfig;
  web3?: {
    enabled?: boolean;
  };
  nostr?: {
    enabled?: boolean;
  };
  logging?: LoggingConfig;
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

/**
 * Authentication states for the state machine
 */
export enum AuthState {
  UNAUTHENTICATED = "unauthenticated",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
  AUTHENTICATION_FAILED = "authentication_failed",
  WALLET_INITIALIZING = "wallet_initializing",
  WALLET_READY = "wallet_ready",
  ERROR = "error",
}

/**
 * Authentication events that trigger state transitions
 */
export enum AuthEvent {
  LOGIN_START = "login_start",
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  WALLET_INIT_START = "wallet_init_start",
  WALLET_INIT_SUCCESS = "wallet_init_success",
  WALLET_INIT_FAILED = "wallet_init_failed",
  ERROR = "error",
}

/**
 * Authentication state machine context
 */
export interface AuthContext {
  userPub?: string;
  username?: string;
  error?: string;
  walletCount?: number;
}

/**
 * Authentication state machine interface
 */
export interface AuthStateMachine {
  currentState: AuthState;
  context: AuthContext;
  transition(event: AuthEvent, data?: Partial<AuthContext>): void;
  canTransition(event: AuthEvent): boolean;
  isAuthenticated(): boolean;
  isWalletReady(): boolean;
  waitForState(targetState: AuthState, timeoutMs?: number): Promise<boolean>;
}
