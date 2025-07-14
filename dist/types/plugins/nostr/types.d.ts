import { BaseConfig, BaseResult, BaseCacheEntry } from "../../types/common";
import { AuthResult } from "../../types/shogun";
/**
 * Result of connection attempt
 */
export interface ConnectionResult extends BaseResult {
    address?: string;
    username?: string;
    randomPassword?: string;
    extensionType?: "alby" | "nostr" | "manual";
}
/**
 * Structure for credentials generated via Bitcoin wallet
 */
export interface NostrConnectorCredentials {
    /** Generated username based on the address */
    username: string;
    /** Chiave GunDB derivata dalla signature */
    key: any;
    /** Original message signed by the user */
    message: string;
    /** Signature provided by the wallet */
    signature: string;
}
/**
 * Alby extension interface
 */
export interface AlbyProvider {
    isAlby?: boolean;
    enable: () => Promise<any>;
    signMessage?: (message: string, address?: string) => Promise<string>;
    getPublicKey?: () => Promise<string>;
    getInfo?: () => Promise<any>;
}
/**
 * Nostr extension interface
 */
export interface NostrProvider {
    getPublicKey: () => Promise<string>;
    signEvent: (event: any) => Promise<any>;
    nip04: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
    };
}
/**
 * Cache entry for signatures
 */
export interface SignatureCache extends BaseCacheEntry<string> {
    signature: string;
    address: string;
}
/**
 * Bitcoin wallet configuration options
 */
export interface NostrConnectorConfig extends BaseConfig {
    cacheDuration?: number;
    network?: "mainnet" | "testnet";
    useApi?: boolean;
    apiUrl?: string;
}
/**
 * Bitcoin Key pair interface
 */
export interface NostrConnectorKeyPair {
    privateKey: string;
    publicKey: string;
    address: string;
    type: "legacy" | "segwit" | "taproot" | "nostr";
}
/**
 * Interface for the Bitcoin wallet plugin
 */
export interface NostrConnectorPluginInterface {
    /**
     * Check if any Bitcoin wallet is available in the browser
     * @returns true if a wallet is available, false otherwise
     */
    isAvailable(): boolean;
    /**
     * Connect to a Bitcoin wallet
     * @param type Type of wallet to connect to
     * @returns Promise with the connection result
     */
    connectBitcoinWallet(type?: "alby" | "nostr" | "manual"): Promise<ConnectionResult>;
    /**
     * Generate credentials using a Bitcoin wallet
     * @param address Bitcoin address
     * @returns Promise with the generated credentials
     */
    generateCredentials(address: string, signature: string, message: string): Promise<NostrConnectorCredentials>;
    /**
     * Release resources and clean up event listeners
     */
    cleanup(): void;
    /**
     * Generate a password based on a signature
     * @param signature Signature
     * @returns Promise with the generated password
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Verify a signature
     * @param message Signed message
     * @param signature Signature to verify
     * @param address The Bitcoin address that supposedly created the signature
     * @returns Promise that resolves to true if the signature is valid
     */
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
    /**
     * Login with Bitcoin wallet
     * @param address Bitcoin address
     * @returns Promise with the operation result
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Signup with Bitcoin wallet
     * @param address Bitcoin address
     * @returns Promise with the operation result
     */
    signUp(address: string): Promise<AuthResult>;
}
