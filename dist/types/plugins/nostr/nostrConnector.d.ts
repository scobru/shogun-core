import { EventEmitter } from "../../utils/eventEmitter";
import { ConnectionResult, NostrConnectorCredentials, AlbyProvider, NostrProvider, NostrConnectorConfig, NostrConnectorKeyPair } from "./types";
declare global {
    interface Window {
        alby?: AlbyProvider;
        nostr?: NostrProvider;
        NostrConnector?: typeof NostrConnector;
    }
}
/**
 * Class for Bitcoin wallet connections and operations
 */
export declare class NostrConnector extends EventEmitter {
    private readonly MESSAGE_TO_SIGN;
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
     * Cleanup event listeners
     */
    cleanup(): void;
    /**
     * Get cached signature if valid
     */
    private getCachedSignature;
    /**
     * Cache signature
     */
    private cacheSignature;
    /**
     * Clear signature cache for a specific address or all addresses
     */
    clearSignatureCache(address?: string): void;
    /**
     * Validates that the address is valid
     */
    private validateAddress;
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
     * Generate credentials using the connected wallet
     */
    generateCredentials(address: string): Promise<NostrConnectorCredentials>;
    /**
     * Generate a deterministic signature for consistent authentication
     */
    private generateDeterministicSignature;
    /**
     * Generate credentials from an existing signature
     */
    private generateCredentialsFromSignature;
    /**
     * Generate a password from a signature
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Verify a signature
     */
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
    /**
     * Get the currently connected address
     */
    getConnectedAddress(): string | null;
    /**
     * Get the currently connected wallet type
     */
    getConnectedType(): "alby" | "nostr" | "manual" | null;
    /**
     * Request signature with timeout
     */
    private requestSignatureWithTimeout;
    /**
     * Request a signature from the connected wallet
     */
    private requestSignature;
}
