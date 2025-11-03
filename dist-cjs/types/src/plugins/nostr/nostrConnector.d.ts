import { EventEmitter } from "../../utils/eventEmitter";
import { ConnectionResult, AlbyProvider, NostrProvider, NostrConnectorConfig, NostrConnectorKeyPair } from "./types";
declare global {
    interface Window {
        alby?: AlbyProvider;
        nostr?: NostrProvider;
        NostrConnector?: typeof NostrConnector;
    }
}
export declare const MESSAGE_TO_SIGN = "I Love Shogun!";
/**
 * Class for Bitcoin wallet connections and operations
 */
declare class NostrConnector extends EventEmitter {
    private readonly DEFAULT_CONFIG;
    private readonly config;
    private readonly signatureCache;
    private connectedAddress;
    private connectedType;
    private manualKeyPair;
    constructor(config?: Partial<NostrConnectorConfig>);
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Clear signature cache for a specific address or all addresses
     */
    clearSignatureCache(address?: string): void;
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable(): boolean;
    /**
     * Check if any Bitcoin wallet is available
     */
    isAvailable(): boolean;
    /**
     * Connect to a wallet type
     */
    connectWallet(type?: "alby" | "nostr" | "manual"): Promise<ConnectionResult>;
    /**
     * Connect to Nostr extension
     */
    private connectNostr;
    /**
     * Set up manual key pair for connection
     */
    private connectManual;
    /**
     * Set a manual key pair for use
     */
    setKeyPair(keyPair: NostrConnectorKeyPair): void;
    /**
     * Generate credentials using Nostr: username deterministico e chiave GunDB derivata dall'address
     */
    generateCredentials(address: string, signature: string, message: string): Promise<{
        username: string;
        key: {
            pub: string;
            priv: string;
            epub: string;
            epriv: string;
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
        };
        message: string;
        signature: string;
    }>;
    /**
     * Generate a password from a signature
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Verify a signature
     */
    verifySignature(message: string, signature: string, address: any): Promise<boolean>;
    /**
     * Get the currently connected address
     */
    getConnectedAddress(): string | null;
    /**
     * Get the currently connected wallet type
     */
    getConnectedType(): "alby" | "nostr" | "manual" | null;
    /**
     * Request a signature from the connected wallet
     */
    requestSignature(address: string, message: string): Promise<string>;
    /**
     * Cleanup event listeners
     */
    cleanup(): void;
}
export declare function deriveNostrKeys(address: string, signature: string, message: string): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
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
}>;
export { NostrConnector };
