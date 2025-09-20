import { GunInstance, GunUserInstance } from "../gundb/types";
import { ISEAPair } from "gun";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { DataBase } from "../gundb/db";
import { RxJS } from "../gundb/rxjs";
import { ShogunPlugin, PluginManager } from "./plugin";
import { ShogunStorage } from "../storage/storage";
import { ShogunEventMap } from "./events";
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
    Utility = "utility",
    /** Messages plugins */
    Messages = "messages",
    /** Messaging plugins */
    Other = "other"
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
export type AuthMethod = "password" | "webauthn" | "web3" | "nostr" | "oauth" | "pair";
export interface AuthResult {
    success: boolean;
    error?: string;
    userPub?: string;
    username?: string;
    sessionToken?: string;
    authMethod?: AuthMethod;
    sea?: {
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    };
    redirectUrl?: string;
    pendingAuth?: boolean;
    message?: string;
    provider?: string;
    isNewUser?: boolean;
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
    sea?: {
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    };
    redirectUrl?: string;
    pendingAuth?: boolean;
    provider?: string;
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
    gun: GunInstance;
    _gun: GunInstance;
    user: GunUserInstance | null;
    _user: GunUserInstance | null;
    db: DataBase;
    rx: RxJS;
    storage: ShogunStorage;
    config: ShogunCoreConfig;
    provider?: ethers.Provider;
    signer?: ethers.Signer;
    wallets?: Wallets;
    pluginManager: any;
    on<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    off<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    once<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    removeAllListeners(eventName?: string | symbol): this;
    emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K]): boolean;
    getRecentErrors(count?: number): ShogunError[];
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    loginWithPair(pair: ISEAPair): Promise<AuthResult>;
    signUp(username: string, password?: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    getAuthenticationMethod(type: AuthMethod): any;
    setAuthMethod(method: AuthMethod): void;
    getAuthMethod(): AuthMethod | undefined;
    getCurrentUser(): {
        pub: string;
        user?: any;
    } | null;
    getIsLoggedIn(): boolean;
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
    gunInstance?: GunInstance;
    gunOptions?: any;
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
