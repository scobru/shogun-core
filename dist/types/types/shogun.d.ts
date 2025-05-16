import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { GunDB } from "../gun/gun";
import { Observable } from "rxjs";
import { GunRxJS } from "../gun/rxjs-integration";
import { ShogunPlugin, PluginManager } from "./plugin";
import { ShogunStorage } from "../storage/storage";
import { IGunInstance as GunInstance } from "gun";
/**
 * Categorie di plugin standard in ShogunCore
 */
export declare enum PluginCategory {
    /** Plugin per l'autenticazione (WebAuthn, MetaMask) */
    Authentication = "authentication",
    /** Plugin per la gestione di wallet */
    Wallet = "wallet",
    /** Plugin per la privacy e l'anonimato */
    Privacy = "privacy",
    /** Plugin per l'identità decentralizzata */
    Identity = "identity",
    /** Plugin per altre funzionalità */
    Utility = "utility"
}
/**
 * Nomi standard dei plugin integrati
 */
export declare enum CorePlugins {
    /** Plugin WebAuthn */
    WebAuthn = "webauthn",
    /** Plugin MetaMask */
    MetaMask = "metamask",
    /** Plugin Stealth */
    Stealth = "stealth",
    /** Plugin Wallet Manager */
    WalletManager = "wallet"
}
export type AuthMethod = "password" | "webauthn" | "metamask";
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
    /** @deprecated Use getPlugin(CorePlugins.WalletManager).getMainWallet() instead */
    getMainWallet?(): ethers.Wallet | null;
    login(username: string, password: string): Promise<AuthResult>;
    /** @deprecated Use getPlugin(CorePlugins.WebAuthn).generateCredentials() instead */
    loginWithWebAuthn?(username: string): Promise<AuthResult>;
    /** @deprecated Use getPlugin(CorePlugins.MetaMask).generateCredentials() instead */
    loginWithMetaMask?(address: string): Promise<AuthResult>;
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    /** @deprecated Use getPlugin(CorePlugins.MetaMask).generateCredentials() and signUp() instead */
    signUpWithMetaMask?(address: string): Promise<AuthResult>;
    /** @deprecated Use getPlugin(CorePlugins.WebAuthn).generateCredentials() and signUp() instead */
    signUpWithWebAuthn?(username: string): Promise<AuthResult>;
    /** @deprecated Use getPlugin(CorePlugins.WebAuthn).isSupported() instead */
    isWebAuthnSupported?(): boolean;
    getAuthenticationMethod(type: "password" | "webauthn" | "metamask"): any;
    logout(): void;
    isLoggedIn(): boolean;
    rxGet<T>(path: string | any): Observable<T>;
    match<T>(path: string | any, matchFn?: (data: any) => boolean): Observable<T[]>;
    rxPut<T>(path: string | any, data: T): Observable<T>;
    rxSet<T>(path: string | any, data: T): Observable<T>;
    rxOnce<T>(path: string | any): Observable<T>;
    compute<T, R>(sources: Array<string | Observable<any>>, computeFn: (...values: T[]) => R): Observable<R>;
    rxUserPut<T>(path: string, data: T): Observable<T>;
    observeUser<T>(path: string): Observable<T>;
    get(path: string): Promise<any>;
    put(data: Record<string, any>): Promise<any>;
    userPut(data: Record<string, any>): Promise<any>;
    userGet(path: string): Promise<any>;
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
    gun: GunInstance<any>;
    authToken?: string;
    /** WebAuthn configuration */
    webauthn?: WebauthnConfig;
    /** MetaMask configuration */
    metamask?: {
        /** Enable MetaMask */
        enabled?: boolean;
    };
    /** Wallet configuration */
    walletManager?: {
        /** Enable wallet functionalities */
        enabled?: boolean;
        /** Balance cache TTL in milliseconds (default: 30000) */
        balanceCacheTTL?: number;
    };
    /** Enable stealth functionalities */
    stealth?: {
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
