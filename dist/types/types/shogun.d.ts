import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "../utils/errorHandler";
import { Webauthn } from "../webauthn/webauthn";
import { MetaMask } from "../connector/metamask";
import { Stealth } from "../stealth/stealth";
import { GunDB } from "../gun/gun";
import { GunDBOptions } from "./gun";
import { WalletManager } from "../wallet/walletManager";
interface DID {
    getCurrentUserDID(): Promise<string | null>;
    resolveDID(did: string): Promise<any>;
    authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
    createDID(options?: any): Promise<string>;
    updateDIDDocument(did: string, documentUpdates: any): Promise<boolean>;
    deactivateDID(did: string): Promise<boolean>;
    registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
}
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
    webauthn?: Webauthn;
    metamask?: MetaMask;
    stealth?: Stealth;
    did?: DID;
    walletManager?: WalletManager;
    getRecentErrors(count?: number): ShogunError[];
    configureLogging(config: LoggingConfig): void;
    setRpcUrl(rpcUrl: string): boolean;
    getRpcUrl(): string | null;
    login(username: string, password: string): Promise<AuthResult>;
    loginWithWebAuthn(username: string): Promise<AuthResult>;
    loginWithMetaMask(address: string): Promise<AuthResult>;
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    signUpWithMetaMask(address: string): Promise<AuthResult>;
    signUpWithWebAuthn(username: string): Promise<AuthResult>;
    isWebAuthnSupported(): boolean;
    getMainWallet(): ethers.Wallet | null;
    createWallet(): Promise<WalletInfo>;
    loadWallets(): Promise<WalletInfo[]>;
    signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>;
    verifySignature(message: string | Uint8Array, signature: string): string;
    signTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>;
    getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
    generateNewMnemonic(): string;
    exportMnemonic(password?: string): Promise<string>;
    exportWalletKeys(password?: string): Promise<string>;
    exportGunPair(password?: string): Promise<string>;
    exportAllUserData(password: string): Promise<string>;
    importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
    importWalletKeys(walletsData: string, password?: string): Promise<number>;
    importGunPair(pairData: string, password?: string): Promise<boolean>;
    importAllUserData(backupData: string, password: string, options?: {
        importMnemonic?: boolean;
        importWallets?: boolean;
        importGunPair?: boolean;
    }): Promise<{
        success: boolean;
        mnemonicImported?: boolean;
        walletsImported?: number;
        gunPairImported?: boolean;
    }>;
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
 * Logging configuration
 */
export interface LoggingConfig {
    /** Enable logging (default: true in development, false in production) */
    enabled?: boolean;
    /** Log level: 'error', 'warning', 'info', 'debug' */
    level?: 'error' | 'warning' | 'info' | 'debug';
    /** Custom prefix for log messages */
    prefix?: string;
}
/**
 * Shogun SDK configuration
 */
export interface ShogunSDKConfig {
    /** GunDB configuration */
    gundb?: GunDBOptions;
    /** Ethereum provider URL */
    providerUrl?: string;
    /** WebAuthn configuration */
    webauthn?: WebauthnConfig;
    /** MetaMask configuration */
    metamask?: {
        /** Enable MetaMask */
        enabled?: boolean;
    };
    /** DID configuration */
    did?: DIDConfig;
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
}
export interface WalletInfo {
    wallet: any;
    path: string;
    address: string;
    getAddressString(): string;
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
export {};
