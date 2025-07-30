"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrConnector = exports.MESSAGE_TO_SIGN = void 0;
exports.deriveNostrKeys = deriveNostrKeys;
/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
 */
const ethers_1 = require("ethers");
const nostr_tools_1 = require("nostr-tools");
const eventEmitter_1 = require("../../utils/eventEmitter");
const derive_1 = __importDefault(require("../../gundb/derive"));
const validation_1 = require("../../utils/validation");
exports.MESSAGE_TO_SIGN = "I Love Shogun!";
/**
 * Class for Bitcoin wallet connections and operations
 */
class NostrConnector extends eventEmitter_1.EventEmitter {
    DEFAULT_CONFIG = {
        cacheDuration: 24 * 60 * 60 * 1000, // 24 hours instead of 30 minutes for better UX
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 60000,
        network: "mainnet",
        useApi: false,
    };
    config;
    signatureCache = new Map();
    // Connection state
    connectedAddress = null;
    connectedType = null;
    manualKeyPair = null;
    constructor(config = {}) {
        super();
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        this.setupEventListeners();
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Currently no global events to listen to
        // This would be the place to add listeners for wallet connections/disconnections
    }
    /**
     * Clear signature cache for a specific address or all addresses
     */
    clearSignatureCache(address) {
        if (address) {
            // Clear cache for specific address
            this.signatureCache.delete(address);
            try {
                const localStorageKey = `shogun_bitcoin_sig_${address}`;
                localStorage.removeItem(localStorageKey);
                console.log(`Cleared signature cache for address: ${address.substring(0, 10)}...`);
            }
            catch (error) {
                console.error("Error clearing signature cache from localStorage:", error);
            }
        }
        else {
            // Clear all signature caches
            this.signatureCache.clear();
            try {
                // Find and remove all shogun_bitcoin_sig_ keys
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("shogun_bitcoin_sig_")) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach((key) => localStorage.removeItem(key));
                console.log(`Cleared all signature caches (${keysToRemove.length} entries)`);
            }
            catch (error) {
                console.error("Error clearing all signature caches from localStorage:", error);
            }
        }
    }
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable() {
        return typeof window !== "undefined" && !!window.nostr;
    }
    /**
     * Check if any Bitcoin wallet is available
     */
    isAvailable() {
        return this.isNostrExtensionAvailable() || this.manualKeyPair !== null;
    }
    /**
     * Connect to a wallet type
     */
    async connectWallet(type = "nostr") {
        console.log(`Connecting to Bitcoin wallet via ${type}...`);
        try {
            let result;
            // Attempt to connect to the specified wallet type
            switch (type) {
                case "alby":
                    console.log("[nostrConnector] Alby is deprecated, redirecting to Nostr");
                    result = await this.connectNostr();
                    break;
                case "nostr":
                    result = await this.connectNostr();
                    break;
                case "manual":
                    result = await this.connectManual();
                    break;
                default:
                    throw new Error(`Unsupported wallet type: ${type}`);
            }
            if (result.success && result.address) {
                this.connectedAddress = result.address;
                this.connectedType = type;
                console.log(`Successfully connected to ${type} wallet: ${result.address}`);
                this.emit("wallet_connected", {
                    address: result.address,
                    type: this.connectedType,
                });
            }
            return result;
        }
        catch (error) {
            console.error(`Error connecting to ${type} wallet:`, error);
            return {
                success: false,
                error: error.message || "Failed to connect to wallet",
            };
        }
    }
    /**
     * Connect to Nostr extension
     */
    async connectNostr() {
        if (!this.isNostrExtensionAvailable()) {
            return {
                success: false,
                error: "Nostr extension is not available. Please install a Nostr compatible extension like nos2x, Alby, or Coracle.",
            };
        }
        try {
            console.log("[nostrConnector] Attempting to connect to Nostr extension...");
            // Get public key from Nostr extension
            const pubKey = await window.nostr.getPublicKey();
            if (!pubKey) {
                throw new Error("Could not get public key from Nostr extension");
            }
            console.log(`[nostrConnector] Successfully connected to Nostr extension: ${pubKey.substring(0, 10)}...`);
            this.connectedAddress = pubKey;
            this.connectedType = "nostr";
            // Emit connected event
            this.emit("connected", { address: pubKey, type: "nostr" });
            const username = `nostr_${pubKey.substring(0, 10)}`;
            return {
                success: true,
                address: pubKey,
                username,
                extensionType: "nostr",
            };
        }
        catch (error) {
            console.error("[nostrConnector] Nostr connection error:", error);
            // Provide more specific error messages
            if (error.message && error.message.includes("User rejected")) {
                throw new Error("Nostr connection was rejected by the user");
            }
            else if (error.message && error.message.includes("not available")) {
                throw new Error("Nostr extension is not available or not properly installed");
            }
            else {
                throw new Error(`Nostr connection error: ${error.message}`);
            }
        }
    }
    /**
     * Set up manual key pair for connection
     */
    async connectManual() {
        // For manual connection, we'd need to have a keypair set
        if (!this.manualKeyPair) {
            return {
                success: false,
                error: "No manual key pair configured. Use setKeyPair() first.",
            };
        }
        this.connectedAddress = this.manualKeyPair.address;
        this.connectedType = "manual";
        // Emit connected event
        this.emit("connected", {
            address: this.manualKeyPair.address,
            type: "manual",
        });
        const username = `btc_${this.manualKeyPair.address.substring(0, 10)}`;
        return {
            success: true,
            address: this.manualKeyPair.address,
            username,
            extensionType: "manual",
        };
    }
    /**
     * Set a manual key pair for use
     */
    setKeyPair(keyPair) {
        this.manualKeyPair = keyPair;
        if (keyPair.address) {
            this.connectedAddress = keyPair.address;
            this.connectedType = "manual";
        }
    }
    /**
     * Generate credentials using Nostr: username deterministico e chiave GunDB derivata dalla signature
     */
    async generateCredentials(address, signature, message) {
        const username = (0, validation_1.generateUsernameFromIdentity)("nostr", { id: address });
        const salt = `${username}_${signature}_${message}`;
        const key = await (0, derive_1.default)(signature, salt, { includeP256: true });
        return { username, key, message, signature };
    }
    /**
     * Generate a password from a signature
     */
    async generatePassword(signature) {
        if (!signature) {
            throw new Error("Invalid signature");
        }
        try {
            // Create a deterministic hash from the signature using a secure algorithm
            const normalizedSig = signature.toLowerCase().replace(/[^a-f0-9]/g, "");
            const passwordHash = ethers_1.ethers.sha256(ethers_1.ethers.toUtf8Bytes(normalizedSig));
            return passwordHash;
        }
        catch (error) {
            console.error("Error generating password:", error);
            throw new Error("Failed to generate password from signature");
        }
    }
    /**
     * Verify a signature
     */
    async verifySignature(message, signature, address) {
        try {
            // Ensure address is a string
            const addressStr = typeof address === "object"
                ? address.address || JSON.stringify(address)
                : String(address);
            console.log(`Verifying signature for address: ${addressStr}`);
            if (!signature || !message || !addressStr) {
                console.error("Invalid message, signature, or address for verification");
                return false;
            }
            // For Nostr wallet type, use nostr-tools for verification
            if (this.connectedType === "nostr" || this.connectedType === "alby") {
                try {
                    // Reconstruct the exact event that was signed
                    const eventData = {
                        kind: 1,
                        created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
                        tags: [],
                        content: message,
                        pubkey: addressStr,
                    };
                    const event = {
                        ...eventData,
                        id: (0, nostr_tools_1.getEventHash)(eventData),
                        sig: signature,
                    };
                    return (0, nostr_tools_1.verifyEvent)(event);
                }
                catch (verifyError) {
                    console.error("Error in Nostr signature verification:", verifyError);
                    return false;
                }
            }
            else if (this.connectedType === "manual" && this.manualKeyPair) {
                console.log("[nostrConnector] Manual verification for keypair");
                // For manual keypairs, we MUST use a secure verification method.
                if (!this.manualKeyPair.privateKey) {
                    console.error("Manual verification failed: private key is missing.");
                    return false;
                }
                try {
                    const eventData = {
                        kind: 1,
                        created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
                        tags: [],
                        content: message,
                        pubkey: addressStr,
                    };
                    const event = {
                        ...eventData,
                        id: (0, nostr_tools_1.getEventHash)(eventData),
                        sig: signature,
                    };
                    return (0, nostr_tools_1.verifyEvent)(event);
                }
                catch (manualVerifyError) {
                    console.error("Error in manual signature verification:", manualVerifyError);
                    return false;
                }
            }
            console.warn("No specific verification method available, signature cannot be fully verified");
            return false;
        }
        catch (error) {
            console.error("Error verifying signature:", error);
            return false;
        }
    }
    /**
     * Get the currently connected address
     */
    getConnectedAddress() {
        return this.connectedAddress;
    }
    /**
     * Get the currently connected wallet type
     */
    getConnectedType() {
        return this.connectedType;
    }
    /**
     * Request a signature from the connected wallet
     */
    async requestSignature(address, message) {
        if (!this.connectedType) {
            throw new Error("No wallet connected");
        }
        try {
            switch (this.connectedType) {
                case "alby":
                case "nostr":
                    if (this.connectedType === "alby") {
                        console.warn("Alby is deprecated, using Nostr functionality for signature request");
                    }
                    console.log("[nostrConnector] Requesting Nostr signature for message:", message);
                    if (!window.nostr) {
                        throw new Error("Nostr extension not available");
                    }
                    // For Nostr, we need to create an event to sign with a fixed timestamp
                    const eventData = {
                        kind: 1,
                        created_at: 0, // IMPORTANT: Use a fixed timestamp to make signatures verifiable
                        tags: [],
                        content: message,
                        pubkey: address,
                    };
                    const nostrEvent = {
                        ...eventData,
                        id: (0, nostr_tools_1.getEventHash)(eventData),
                        sig: "", // This will be filled by window.nostr.signEvent
                    };
                    const signedEvent = await window.nostr.signEvent(nostrEvent);
                    console.log("Received Nostr signature:", signedEvent.sig.substring(0, 20) + "...");
                    return signedEvent.sig;
                case "manual":
                    console.log("[nostrConnector] Using manual key pair for signature");
                    if (!this.manualKeyPair || !this.manualKeyPair.privateKey) {
                        throw new Error("No manual key pair available or private key missing");
                    }
                    // Use nostr-tools to sign securely
                    const manualEventData = {
                        kind: 1,
                        created_at: 0, // IMPORTANT: Use a fixed timestamp
                        tags: [],
                        content: message,
                        pubkey: this.manualKeyPair.address,
                    };
                    const eventTemplate = {
                        ...manualEventData,
                        id: (0, nostr_tools_1.getEventHash)(manualEventData),
                        sig: "", // This will be filled by finalizeEvent
                    };
                    const privateKeyBytes = nostr_tools_1.utils.hexToBytes(this.manualKeyPair.privateKey);
                    const signedEventManual = await (0, nostr_tools_1.finalizeEvent)(eventTemplate, privateKeyBytes);
                    console.log("Generated manual signature:", signedEventManual.sig.substring(0, 20) + "...");
                    return signedEventManual.sig;
                default:
                    throw new Error(`Unsupported wallet type: ${this.connectedType}`);
            }
        }
        catch (error) {
            console.error("Error requesting signature:", error);
            throw new Error(`Failed to get signature: ${error.message}`);
        }
    }
    /**
     * Cleanup event listeners
     */
    cleanup() {
        this.removeAllListeners();
        this.connectedAddress = null;
        this.connectedType = null;
        this.manualKeyPair = null;
    }
}
exports.NostrConnector = NostrConnector;
// Funzione helper per derivare chiavi Nostr/Bitcoin (come per Web3/WebAuthn)
async function deriveNostrKeys(address, signature, message) {
    // Puoi customizzare il salt come preferisci, qui usiamo address+signature+message
    const salt = `${address}_${signature}_${message}`;
    return await (0, derive_1.default)(signature, salt, {
        includeP256: true,
    });
}
if (typeof window !== "undefined") {
    window.NostrConnector = NostrConnector;
}
else if (typeof global !== "undefined") {
    global.NostrConnector = NostrConnector;
}
