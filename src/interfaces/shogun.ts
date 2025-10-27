import { IGunInstance, IGunUserInstance } from "gun/types";
import { ISEAPair } from "gun";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { DataBase } from "../gundb/db";
import { RxJS } from "../gundb/rxjs";
import { ShogunPlugin, PluginManager } from "./plugin";
import { ShogunStorage } from "../storage/storage";
import { ShogunEventMap } from "./events";
import {
  TransportLayer,
  TransportConfig,
} from "../gundb/transport/TransportLayer";

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
  /** Messages plugins */
  Messages = "messages",
  /** Messaging plugins */
  Other = "other",
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
  /** Zero-Knowledge Proof plugin */
  ZkProof = "zkproof",
}

export type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "zkproof"
  | "pair";

export interface AuthEventData {
  userPub?: string;
  username?: string;
  method: "password" | "webauthn" | "web3" | "nostr" | "zkproof" | "pair";
  provider?: string;
}

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
  // Properties for external auth flows
  redirectUrl?: string;
  pendingAuth?: boolean;
  message?: string;
  provider?: string;
  isNewUser?: boolean;
  // User data (extended for compatibility)
  user?: {
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
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
  // Multi-device support (WebAuthn and ZK-Proof with seed phrase)
  seedPhrase?: string; // BIP39 mnemonic or trapdoor for account recovery and multi-device access
  // Properties for external auth flows
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  // User data (extended for compatibility)
  user?: {
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

export interface IShogunCore extends PluginManager {
  transport: TransportLayer;
  _gun: IGunInstance<any>; // Internal gun instance (for backward compatibility)
  user: IGunUserInstance | null;
  _user: IGunUserInstance | null; // Internal user instance
  db: DataBase;
  rx: RxJS; // RxJS integration
  storage: ShogunStorage;
  config: ShogunCoreConfig;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  wallets?: Wallets;
  pluginManager: any; // PluginManager instance

  // Event emitter methods with proper typing
  on<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this;
  off<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this;
  once<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this;
  removeAllListeners(eventName?: string | symbol): this;
  emit<K extends keyof ShogunEventMap>(
    eventName: K,
    data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K],
  ): boolean;

  // Error handling methods
  getRecentErrors(count?: number): ShogunError[];

  // Initialization method
  initialize(): Promise<void>;

  // Authentication methods
  login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult>;
  loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
  signUp(
    username: string,
    password?: string,
    pair?: ISEAPair | null,
  ): Promise<SignUpResult>;

  // Authentication method management
  getAuthenticationMethod(type: AuthMethod): any;
  setAuthMethod(method: AuthMethod): void;
  getAuthMethod(): AuthMethod | undefined;

  // User management methods
  getCurrentUser(): { pub: string; user?: any } | null;
  getIsLoggedIn(): boolean;

  // Utility methods
  logout(): void;
  isLoggedIn(): boolean;
  saveCredentials(credentials: any): Promise<void>;
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
  // Transport layer configuration
  transport?: TransportConfig;

  // Backward compatibility with Gun
  gunInstance?: IGunInstance<any>;
  gunOptions?: any;

  // Plugin configurations
  webauthn?: WebauthnConfig;
  web3?: {
    enabled?: boolean;
  };
  nostr?: {
    enabled?: boolean;
  };
  zkproof?: {
    enabled?: boolean;
    defaultGroupId?: string;
    deterministic?: boolean;
    minEntropy?: number;
  };

  // Timeout configurations
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };

  // Plugin management
  plugins?: {
    autoRegister?: ShogunPlugin[];
  };

  // Other options
  disableAutoRecall?: boolean; // 🔧 Disable automatic session recall on init
  silent?: boolean; // 🔧 Disable console logs
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
