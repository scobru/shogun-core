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
export declare enum PluginCategory {
    /** Authentication plugins (WebAuthn, MetaMask, Bitcoin) */
    Authentication = "authentication",
    /** Wallet management plugins */
    Wallet = "wallet",
    /** Privacy and anonymity plugins */
    Privacy = "privacy",
    /** Decentralized identity plugins */
    Identity = "identity",
    /** Other utility plugins */
    Utility = "utility"
}
/**
 * Standard names for built-in plugins
 */
export declare enum CorePlugins {
    /** WebAuthn plugin */
    WebAuthn = "webauthn",
    /** Ethereum plugin */
    Web3 = "web3",
    /** Bitcoin wallet plugin */
    Nostr = "nostr",
    /** OAuth plugin */
    OAuth = "oauth"
}
export type AuthMethod = "password" | "webauthn" | "web3" | "nostr" | "oauth";
export interface AuthResult {
    success: boolean;
    error?: string;
    userPub?: string;
    username?: string;
    sessionToken?: string;
    authMethod?: AuthMethod;
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
    gundb: GunInstance;
    rx: GunRxJS;
    storage: ShogunStorage;
    config: ShogunSDKConfig;
    provider?: ethers.Provider;
    signer?: ethers.Signer;
    on(eventName: string | symbol, listener: (...args: any[]) => void): any;
    off(eventName: string | symbol, listener: (...args: any[]) => void): any;
    once(eventName: string | symbol, listener: (...args: any[]) => void): any;
    removeAllListeners(eventName?: string | symbol): any;
    emit(eventName: string | symbol, ...args: any[]): boolean;
    getRecentErrors(count?: number): ShogunError[];
    configureLogging(config: LoggingConfig): void;
    login(username: string, password: string): Promise<AuthResult>;
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    getAuthenticationMethod(type: AuthMethod): any;
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
    error: (data: {
        action: string;
        message: string;
    }) => void;
    "auth:signup": (data: {
        username: string;
        userPub: string;
    }) => void;
    "auth:login": (data: {
        username: string;
        userPub: string;
    }) => void;
    "auth:logout": (data: Record<string, never>) => void;
}
