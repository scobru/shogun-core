/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { logDebug, logError, logWarning } from "../utils/logger";
import CONFIG from "../config";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "events";
/**
 * Class for MetaMask connection
 */
class MetaMask extends EventEmitter {
    constructor(config = {}) {
        super();
        this.MESSAGE_TO_SIGN = "I Love Shogun!";
        this.DEFAULT_CONFIG = {
            cacheDuration: 30 * 60 * 1000, // 30 minutes
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 30000
        };
        this.signatureCache = new Map();
        this.provider = null;
        this.customProvider = null;
        this.customWallet = null;
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        this.AUTH_DATA_TABLE = CONFIG.GUN_TABLES.AUTHENTICATIONS || "Authentications";
        this.setupProvider();
        this.setupEventListeners();
    }
    /**
     * Initialize the BrowserProvider
     */
    async setupProvider() {
        try {
            if (typeof window !== 'undefined' && window.ethereum) {
                this.provider = new ethers.BrowserProvider(window.ethereum);
                logDebug("BrowserProvider initialized successfully");
            }
            else {
                logWarning("Window.ethereum is not available");
            }
        }
        catch (error) {
            logError("Failed to initialize BrowserProvider", error);
        }
    }
    /**
     * Setup MetaMask event listeners using BrowserProvider
     */
    setupEventListeners() {
        if (this.provider) {
            this.provider.on('network', (newNetwork, oldNetwork) => {
                this.emit('chainChanged', newNetwork);
            });
            // Listen for account changes
            if (window.ethereum?.on) {
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.emit('accountsChanged', accounts);
                });
            }
        }
    }
    /**
     * Cleanup event listeners
     */
    cleanup() {
        if (this.provider) {
            this.provider.removeAllListeners();
        }
        this.removeAllListeners();
    }
    /**
     * Get cached signature if valid
     */
    getCachedSignature(address) {
        const cached = this.signatureCache.get(address);
        if (!cached)
            return null;
        const now = Date.now();
        if (now - cached.timestamp > this.config.cacheDuration) {
            this.signatureCache.delete(address);
            return null;
        }
        return cached.signature;
    }
    /**
     * Cache signature
     */
    cacheSignature(address, signature) {
        this.signatureCache.set(address, {
            signature,
            timestamp: Date.now(),
            address
        });
    }
    /**
     * Validates that the address is valid
     */
    validateAddress(address) {
        if (!address) {
            throw new Error("Address not provided");
        }
        try {
            const normalizedAddress = String(address).trim().toLowerCase();
            if (!ethers.isAddress(normalizedAddress)) {
                throw new Error("Invalid address format");
            }
            return ethers.getAddress(normalizedAddress);
        }
        catch (error) {
            ErrorHandler.handle(ErrorType.VALIDATION, "INVALID_ADDRESS", "Invalid Ethereum address provided", error);
            throw error;
        }
    }
    /**
     * Connects to MetaMask with retry logic using BrowserProvider
     */
    async connectMetaMask() {
        try {
            if (!this.provider) {
                await this.setupProvider();
                if (!this.provider) {
                    throw new Error("MetaMask is not available. Please install MetaMask extension.");
                }
            }
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    const signer = await this.provider.getSigner();
                    const address = await signer.getAddress();
                    if (!address) {
                        throw new Error("No accounts found in MetaMask");
                    }
                    const metamaskUsername = `mm_${address.toLowerCase()}`;
                    this.emit('connected', { address });
                    return { success: true, address, username: metamaskUsername };
                }
                catch (error) {
                    if (attempt === this.config.maxRetries)
                        throw error;
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                }
            }
            throw new Error("Failed to connect after retries");
        }
        catch (error) {
            ErrorHandler.handle(ErrorType.NETWORK, "METAMASK_CONNECTION_ERROR", error.message || "Unknown error while connecting to MetaMask", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generates credentials with caching
     */
    async generateCredentials(address) {
        try {
            const validAddress = this.validateAddress(address);
            // Check cache first
            const cachedSignature = this.getCachedSignature(validAddress);
            if (cachedSignature) {
                return this.generateCredentialsFromSignature(validAddress, cachedSignature);
            }
            const signature = await this.requestSignatureWithTimeout(validAddress, this.MESSAGE_TO_SIGN, this.config.timeout);
            // Cache the new signature
            this.cacheSignature(validAddress, signature);
            return this.generateCredentialsFromSignature(validAddress, signature);
        }
        catch (error) {
            ErrorHandler.handle(ErrorType.AUTHENTICATION, "CREDENTIALS_GENERATION_ERROR", error.message || "Error generating MetaMask credentials", error);
            throw error;
        }
    }
    /**
     * Generate credentials from signature
     */
    generateCredentialsFromSignature(address, signature) {
        const username = `mm_${address.toLowerCase()}`;
        const password = ethers.keccak256(ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`));
        return { username, password };
    }
    /**
     * Checks if MetaMask is available in the browser
     * @returns true if MetaMask is available
     */
    static isMetaMaskAvailable() {
        const ethereum = window.ethereum;
        return (typeof window !== "undefined" &&
            typeof ethereum !== "undefined" &&
            ethereum?.isMetaMask === true);
    }
    /**
     * Request signature using BrowserProvider
     */
    async requestSignatureWithTimeout(address, message, timeout = 30000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Timeout requesting signature"));
            }, timeout);
            try {
                if (!this.provider) {
                    throw new Error("Provider not initialized");
                }
                const signer = await this.provider.getSigner();
                const signerAddress = await signer.getAddress();
                if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                    throw new Error("Signer address does not match");
                }
                const signature = await signer.signMessage(message);
                clearTimeout(timeoutId);
                resolve(signature);
            }
            catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    /**
     * Checks if MetaMask is available
     */
    isAvailable() {
        return typeof window !== "undefined" && !!window.ethereum;
    }
    /**
     * Configure custom JSON-RPC provider
     * @param rpcUrl - RPC endpoint URL
     * @param privateKey - Wallet private key
     * @throws {Error} For invalid parameters
     */
    setCustomProvider(rpcUrl, privateKey) {
        if (!rpcUrl || typeof rpcUrl !== "string") {
            throw new Error("Invalid RPC URL");
        }
        if (!privateKey || typeof privateKey !== "string") {
            throw new Error("Invalid private key");
        }
        try {
            this.customProvider = new ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers.Wallet(privateKey, this.customProvider);
            logDebug("Custom provider configured successfully");
        }
        catch (error) {
            throw new Error(`Error configuring provider: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * Get active signer instance using BrowserProvider
     */
    async getSigner() {
        try {
            if (this.customWallet) {
                return this.customWallet;
            }
            if (!this.provider) {
                await this.setupProvider();
            }
            if (!this.provider) {
                throw new Error("Provider not initialized");
            }
            return await this.provider.getSigner();
        }
        catch (error) {
            throw new Error(`Unable to get Ethereum signer: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * Generate deterministic password from signature
     * @param signature - Cryptographic signature
     * @returns 64-character hex string
     * @throws {Error} For invalid signature
     */
    async generatePassword(signature) {
        if (!signature) {
            throw new Error("Invalid signature");
        }
        const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
        return hash.slice(2, 66); // Remove 0x and use first 32 bytes
    }
    /**
     * Verify message signature
     * @param message - Original signed message
     * @param signature - Cryptographic signature
     * @returns Recovered Ethereum address
     * @throws {Error} For invalid inputs
     */
    async verifySignature(message, signature) {
        if (!message || !signature) {
            throw new Error("Invalid message or signature");
        }
        try {
            return ethers.verifyMessage(message, signature);
        }
        catch (error) {
            throw new Error("Invalid message or signature");
        }
    }
    /**
     * Get browser-based Ethereum signer
     * @returns Browser provider signer
     * @throws {Error} If MetaMask not detected
     */
    async getEthereumSigner() {
        if (!MetaMask.isMetaMaskAvailable()) {
            throw new Error("MetaMask not found. Please install MetaMask to continue.");
        }
        try {
            const ethereum = window.ethereum;
            await ethereum.request({
                method: "eth_requestAccounts",
            });
            const provider = new ethers.BrowserProvider(ethereum);
            return provider.getSigner();
        }
        catch (error) {
            throw new Error(`Error accessing MetaMask: ${error.message || "Unknown error"}`);
        }
    }
}
if (typeof window !== "undefined") {
    window.MetaMask = MetaMask;
}
else if (typeof global !== "undefined") {
    global.MetaMask = MetaMask;
}
export { MetaMask };
