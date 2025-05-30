import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { GunDB } from "../gundb/gun";
import { Observable } from "rxjs";
import { GunRxJS } from "../gundb/rxjs-integration";
import { ShogunPlugin, PluginManager } from "./plugin";
import { ShogunStorage } from "../storage/storage";

/**
 * Categorie di plugin standard in ShogunCore
 */
export enum PluginCategory {
  /** Plugin per l'autenticazione (WebAuthn, MetaMask) */
  Authentication = "authentication",
  /** Plugin per la gestione di wallet */
  Wallet = "wallet",
  /** Plugin per la privacy e l'anonimato */
  Privacy = "privacy",
  /** Plugin per l'identità decentralizzata */
  Identity = "identity",
  /** Plugin per altre funzionalità */
  Utility = "utility",
}

/**
 * Nomi standard dei plugin integrati
 */
export enum CorePlugins {
  /** Plugin WebAuthn */
  WebAuthn = "webauthn",
  /** Plugin Ethereum */
  Ethereum = "ethereum",
  /** Plugin Stealth */
  StealthAddress = "stealth-address",
  /** Plugin HDWallet */
  Bip32 = "bip32",
  /** Plugin Bitcoin Wallet */
  Bitcoin = "bitcoin",
}

export type AuthMethod = "password" | "webauthn" | "metamask" | "bitcoin";

// Authentication result interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  password?: string;
  credentialId?: string;
  wallet?: any;
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
  gundb: GunDB;
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
  getAuthenticationMethod(type: "password" | "webauthn" | "metamask"): any;

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
  /** WebAuthn configuration */
  webauthn?: WebauthnConfig;
  /** MetaMask configuration */
  ethereum?: {
    /** Enable MetaMask */
    enabled?: boolean;
  };
  /** Bitcoin wallet configuration */
  bitcoin?: {
    /** Enable Bitcoin wallet */
    enabled?: boolean;
    /** Bitcoin network to use (default: mainnet) */
    network?: "mainnet" | "testnet";
    /** Use API for verification (default: false) */
    useApi?: boolean;
    /** API URL for verification */
    apiUrl?: string;
  };
  /** HDWallet configuration */
  bip32?: {
    /** Enable HDWallet functionalities */
    enabled?: boolean;
    /** Balance cache TTL in milliseconds (default: 30000) */
    balanceCacheTTL?: number;
  };
  /** Enable stealth functionalities */
  stealthAddress?: {
    /** Enable stealth functionalities */
    enabled?: boolean;
  };
  /** Logging configuration */
  logging?: LoggingConfig;
  /** Timeout configuration in milliseconds */
  timeouts?: {
    /** Login timeout in milliseconds (default: 15000) */
    login?: number;
    /** Signup timeout in milliseconds (default: 20000) */
    signup?: number;
    /** General operation timeout in milliseconds (default: 30000) */
    operation?: number;
  };
  /** Plugin configuration */
  plugins?: {
    /** List of plugins to automatically register on initialization */
    autoRegister?: ShogunPlugin[];
  };
}

export interface ShogunEvents {
  error: (data: { action: string; message: string }) => void;
  "auth:signup": (data: { username: string; userPub: string }) => void;
  "auth:login": (data: { username: string; userPub: string }) => void;
  "auth:logout": (data: Record<string, never>) => void;
}
