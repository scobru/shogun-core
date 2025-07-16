"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Connector = void 0;
/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
const ethers_1 = require("ethers");
const errorHandler_1 = require("../../utils/errorHandler");
const eventEmitter_1 = require("../../utils/eventEmitter");
const derive_1 = __importDefault(require("../../gundb/derive"));
/**
 * Class for MetaMask connection
 */
class Web3Connector extends eventEmitter_1.EventEmitter {
    MESSAGE_TO_SIGN = "I Love Shogun!";
    DEFAULT_CONFIG = {
        cacheDuration: 30 * 60 * 1000, // 30 minutes
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 60000,
    };
    config;
    signatureCache = new Map();
    provider = null;
    customProvider = null;
    customWallet = null;
    constructor(config = {}) {
        super();
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        this.initProvider();
        this.setupEventListeners();
    }
    /**
     * Initialize the provider synchronously with fallback mechanisms
     * to handle conflicts between multiple wallet providers
     */
    initProvider() {
        if (typeof window !== "undefined") {
            try {
                // Check if ethereum is available from any provider
                const ethereumProvider = this.getAvailableEthereumProvider();
                if (ethereumProvider) {
                    this.provider = new ethers_1.ethers.BrowserProvider(ethereumProvider);
                    console.log("BrowserProvider initialized successfully");
                }
                else {
                    console.warn("No compatible Ethereum provider found");
                }
            }
            catch (error) {
                console.error("Failed to initialize BrowserProvider", error);
            }
        }
        else {
            console.warn("Window object not available (non-browser environment)");
        }
    }
    /**
     * Get available Ethereum provider from multiple possible sources
     */
    getAvailableEthereumProvider() {
        if (typeof window === "undefined")
            return undefined;
        // Define provider sources with priority order
        const providerSources = [
            // Check if we have providers in the _ethereumProviders registry (from index.html)
            {
                source: () => window._ethereumProviders && window._ethereumProviders[0],
                name: "Registry Primary",
            },
            { source: () => window.ethereum, name: "Standard ethereum" },
            {
                source: () => window.web3?.currentProvider,
                name: "Legacy web3",
            },
            { source: () => window.metamask, name: "MetaMask specific" },
            {
                source: () => window.ethereum?.providers?.find((p) => p.isMetaMask),
                name: "MetaMask from providers array",
            },
            {
                source: () => window.ethereum?.providers?.[0],
                name: "First provider in array",
            },
            // Try known provider names
            {
                source: () => window.enkrypt?.providers?.ethereum,
                name: "Enkrypt",
            },
            {
                source: () => window.coinbaseWalletExtension,
                name: "Coinbase",
            },
            { source: () => window.trustWallet, name: "Trust Wallet" },
            // Use special registry if available
            {
                source: () => Array.isArray(window._ethereumProviders)
                    ? window._ethereumProviders.find((p) => !p._isProxy)
                    : undefined,
                name: "Registry non-proxy",
            },
        ];
        // Try each provider source
        for (const { source, name } of providerSources) {
            try {
                const provider = source();
                if (provider && typeof provider.request === "function") {
                    console.log(`Found compatible Ethereum provider: ${name}`);
                    return provider;
                }
            }
            catch (error) {
                // Continue to next provider source
                console.warn(`Error checking provider ${name}:`, error);
                continue;
            }
        }
        // No provider found
        console.warn("No compatible Ethereum provider found");
        return undefined;
    }
    /**
     * Initialize the BrowserProvider (async method for explicit calls)
     */
    async setupProvider() {
        try {
            if (typeof window !== "undefined") {
                // Check if ethereum is available from any provider
                const ethereumProvider = this.getAvailableEthereumProvider();
                if (ethereumProvider) {
                    this.provider = new ethers_1.ethers.BrowserProvider(ethereumProvider);
                    console.log("BrowserProvider initialized successfully");
                }
                else {
                    console.warn("No compatible Ethereum provider found");
                }
            }
            else {
                console.warn("Window object not available (non-browser environment)");
            }
        }
        catch (error) {
            console.error("Failed to initialize BrowserProvider", error);
        }
    }
    /**
     * Setup MetaMask event listeners using BrowserProvider
     */
    setupEventListeners() {
        if (this.provider) {
            // Listen for network changes through ethers provider
            this.provider.on("network", (newNetwork, oldNetwork) => {
                this.emit("chainChanged", newNetwork);
            });
            // Listen for account changes through the detected provider
            try {
                const ethereumProvider = this.getAvailableEthereumProvider();
                if (ethereumProvider?.on) {
                    ethereumProvider.on("accountsChanged", (accounts) => {
                        this.emit("accountsChanged", accounts);
                    });
                    // Also listen for chainChanged events directly
                    ethereumProvider.on("chainChanged", (chainId) => {
                        this.emit("chainChanged", { chainId });
                    });
                }
            }
            catch (error) {
                console.warn("Failed to setup account change listeners", error);
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
        // Check for invalid/empty signature
        if (!cached.signature ||
            typeof cached.signature !== "string" ||
            cached.signature.length < 16) {
            console.warn(`Invalid cached signature for address ${address} (length: ${cached.signature ? cached.signature.length : 0}), deleting from cache.`);
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
            address,
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
            if (!ethers_1.ethers.isAddress(normalizedAddress)) {
                throw new Error("Invalid address format");
            }
            return ethers_1.ethers.getAddress(normalizedAddress);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.VALIDATION, "INVALID_ADDRESS", "Invalid Ethereum address provided", error);
            throw error;
        }
    }
    /**
     * Connects to MetaMask with retry logic using BrowserProvider
     */
    async connectMetaMask() {
        try {
            console.log("Attempting to connect to MetaMask...");
            if (!this.provider) {
                console.log("Provider not initialized, setting up...");
                this.initProvider();
                if (!this.provider) {
                    throw new Error("MetaMask is not available. Please install MetaMask extension.");
                }
            }
            // First check if we can get the provider
            const ethereumProvider = this.getAvailableEthereumProvider();
            if (!ethereumProvider) {
                throw new Error("No compatible Ethereum provider found");
            }
            // Richiedi esplicitamente l'accesso all'account MetaMask
            console.log("Requesting account access...");
            let accounts = [];
            // Try multiple methods of requesting accounts for compatibility
            try {
                // Try the provider we found first
                accounts = await ethereumProvider.request({
                    method: "eth_requestAccounts",
                });
            }
            catch (requestError) {
                console.warn("First account request failed, trying window.ethereum:", requestError);
                // Fallback to window.ethereum if available and different
                if (window.ethereum && window.ethereum !== ethereumProvider) {
                    try {
                        accounts = await window.ethereum.request({
                            method: "eth_requestAccounts",
                        });
                    }
                    catch (fallbackError) {
                        console.error("All account request methods failed", fallbackError);
                        throw new Error("User denied account access");
                    }
                }
                else {
                    throw new Error("User denied account access");
                }
            }
            console.log(`Accounts requested successfully: ${accounts.length} accounts returned`);
            if (!accounts || accounts.length === 0) {
                console.log("No accounts found, trying to get signer...");
            }
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    console.log(`Attempt ${attempt} to get signer...`);
                    const signer = await this.provider.getSigner();
                    const address = await signer.getAddress();
                    if (!address) {
                        console.error("No address returned from signer");
                        throw new Error("No address returned from signer");
                    }
                    console.log(`Successfully connected to MetaMask with address: ${address}`);
                    this.emit("connected", { address });
                    return {
                        success: true,
                        address,
                    };
                }
                catch (error) {
                    console.error(`Attempt ${attempt} failed:`, error);
                    if (attempt === this.config.maxRetries) {
                        throw error;
                    }
                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
                }
            }
            throw new Error("Failed to get signer after all attempts");
        }
        catch (error) {
            console.error("Failed to connect to MetaMask:", error);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "METAMASK_CONNECTION_ERROR", error.message ?? "Unknown error while connecting to MetaMask", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generates credentials for the given address
     */
    async generateCredentials(address) {
        try {
            console.log("[web3Connector] Generating credentials for address:", address);
            const validAddress = this.validateAddress(address);
            console.log("[web3Connector] Valid Address:", validAddress);
            // Check if we have a cached signature
            const cachedSignature = this.getCachedSignature(validAddress);
            if (cachedSignature) {
                console.log("[web3Connector] Using cached signature for address:", validAddress);
                return this.generateCredentialsFromSignature(validAddress, cachedSignature);
            }
            // Request signature with timeout
            console.log("[web3Connector] Request signature with timeout");
            let signature;
            try {
                signature = await this.requestSignatureWithTimeout(validAddress, this.MESSAGE_TO_SIGN, this.config.timeout);
            }
            catch (signingError) {
                // Gestione del fallimento di firma
                console.warn(`Failed to get signature: ${signingError}. Using fallback method.`);
                throw signingError;
            }
            // Cache the signature
            this.cacheSignature(validAddress, signature);
            return this.generateCredentialsFromSignature(validAddress, signature);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "CREDENTIALS_GENERATION_ERROR", error.message ?? "Error generating MetaMask credentials", error);
            throw error;
        }
    }
    /**
     * Generates credentials from a signature
     */
    async generateCredentialsFromSignature(address, signature) {
        console.log("[web3Connector] Generating credentials from signature");
        const hashedAddress = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(address));
        const salt = `${address}_${signature}`;
        return await (0, derive_1.default)(hashedAddress, salt, {
            includeP256: true,
        });
    }
    /**
     * Generates fallback credentials (for testing/development)
     */
    generateFallbackCredentials(address) {
        console.warn("Using fallback credentials generation for address:", address);
        // Generate a deterministic but insecure fallback
        const fallbackSignature = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(address + "fallback"));
        return {
            username: address.toLowerCase(),
            password: fallbackSignature,
            message: this.MESSAGE_TO_SIGN,
            signature: fallbackSignature,
        };
    }
    /**
     * Checks if MetaMask is available
     */
    static isMetaMaskAvailable() {
        if (typeof window === "undefined") {
            return false;
        }
        // Check multiple possible sources
        const sources = [
            () => window.ethereum,
            () => window.web3?.currentProvider,
            () => window.metamask,
            () => window._ethereumProviders?.[0],
        ];
        for (const source of sources) {
            try {
                const provider = source();
                if (provider && typeof provider.request === "function") {
                    return true;
                }
            }
            catch {
                // Continue to next source
            }
        }
        return false;
    }
    /**
     * Requests signature with timeout
     */
    requestSignatureWithTimeout(address, message, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Signature request timed out"));
            }, timeout);
            const cleanup = () => {
                clearTimeout(timeoutId);
            };
            const errorHandler = (error) => {
                cleanup();
                reject(error);
            };
            const initializeAndSign = async () => {
                try {
                    console.log("[web3Connector] Initialize and Sign");
                    const signer = await this.provider.getSigner();
                    const signerAddress = await signer.getAddress();
                    console.log("[web3Connector] Signer:", signer);
                    console.log("[web3Connector] Signer Address:", signerAddress);
                    // Verify the signer address matches the expected address
                    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                        throw new Error(`Signer address (${signerAddress}) does not match expected address (${address})`);
                    }
                    console.log(`Requesting signature for message: ${message}`);
                    const signature = await signer.signMessage(message);
                    console.log("[web3Connector] Signature obtained successfully");
                    cleanup();
                    resolve(signature);
                }
                catch (error) {
                    console.error("Failed to request signature:", error);
                    errorHandler(error);
                }
            };
            initializeAndSign();
        });
    }
    /**
     * Checks if the connector is available
     */
    isAvailable() {
        return Web3Connector.isMetaMaskAvailable();
    }
    /**
     * Sets a custom provider for testing/development
     */
    setCustomProvider(rpcUrl, privateKey) {
        try {
            this.customProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers_1.ethers.Wallet(privateKey, this.customProvider);
            console.log("Custom provider configured successfully");
        }
        catch (error) {
            throw new Error(`Error configuring provider: ${error.message ?? "Unknown error"}`);
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
                this.initProvider();
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
     * Get active provider instance using BrowserProvider
     */
    async getProvider() {
        if (this.customProvider) {
            return this.customProvider;
        }
        if (!this.provider) {
            this.initProvider();
        }
        return this.provider;
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
        const hash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(signature));
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
            return ethers_1.ethers.verifyMessage(message, signature);
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
        if (!Web3Connector.isMetaMaskAvailable()) {
            throw new Error("MetaMask not found. Please install MetaMask to continue.");
        }
        try {
            const ethereum = window.ethereum;
            await ethereum.request({
                method: "eth_requestAccounts",
            });
            const provider = new ethers_1.ethers.BrowserProvider(ethereum);
            return provider.getSigner();
        }
        catch (error) {
            throw new Error(`Error accessing MetaMask: ${error.message ?? "Unknown error"}`);
        }
    }
}
exports.Web3Connector = Web3Connector;
if (typeof window !== "undefined") {
    window.Web3Connector = Web3Connector;
}
else if (typeof global !== "undefined") {
    global.Web3Connector = Web3Connector;
}
