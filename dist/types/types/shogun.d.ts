import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
type Webauthn = any;
type MetaMask = any;
type Stealth = any;
type GunDB = any;
export interface AuthResult {
    success: boolean;
    userPub?: string;
    wallet?: any;
    username?: string;
    error?: string;
    credentialId?: string;
    password?: string;
}
export interface SignUpResult {
    success: boolean;
    userPub?: string;
    username?: string;
    pub?: string;
    error?: string;
    message?: string;
    wallet?: any;
}
/**
 * Payment channel configuration
 */
export interface ChannelConfig {
    /** Unique channel identifier */
    channelId: string;
    /** Ethereum address of channel creator */
    creatorAddress: string;
    /** Ethereum address of counterparty */
    counterpartyAddress: string;
    /** Initial deposit in wei */
    initialDeposit: string;
    /** Channel creation timestamp */
    createdAt: number;
    /** Dispute timeout period in seconds */
    timeoutPeriod: number;
    /** Smart contract address */
    contractAddress: string;
}
/**
 * Current state of a payment channel
 */
export interface ChannelState {
    /** Unique channel identifier */
    channelId: string;
    /** Current balance in wei (remaining for creator) */
    balance: string;
    /** Sequence number to prevent replay attacks */
    nonce: number;
    /** Creator's signature on current state */
    creatorSignature?: string;
    /** Counterparty's signature on current state */
    counterpartySignature?: string;
    /** Last update timestamp */
    lastUpdated: number;
    /** Channel status */
    status: 'open' | 'closing' | 'disputed' | 'closed';
}
/**
 * Result of a payment channel operation
 */
export interface ChannelResult {
    /** Indicates if operation was successful */
    success: boolean;
    /** Error message in case of failure */
    error?: string;
    /** Channel state after operation */
    state?: ChannelState;
    /** Ethereum transaction ID (if applicable) */
    txHash?: string;
}
export interface IShogunCore {
    gun: IGunInstance<any>;
    gundb: GunDB;
    webauthn: Webauthn;
    metamask: MetaMask;
    stealth: Stealth;
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
