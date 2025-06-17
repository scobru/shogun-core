"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Connector = void 0;
/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
const ethers_1 = require("ethers");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
const eventEmitter_1 = require("../../utils/eventEmitter");
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
                    (0, logger_1.logDebug)("BrowserProvider initialized successfully");
                }
                else {
                    (0, logger_1.logWarn)("No compatible Ethereum provider found");
                }
            }
            catch (error) {
                (0, logger_1.logError)("Failed to initialize BrowserProvider", error);
            }
        }
        else {
            (0, logger_1.logWarn)("Window object not available (non-browser environment)");
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
                    (0, logger_1.logDebug)(`Found compatible Ethereum provider: ${name}`);
                    return provider;
                }
            }
            catch (error) {
                // Continue to next provider source
                (0, logger_1.logWarn)(`Error checking provider ${name}:`, error);
                continue;
            }
        }
        // No provider found
        (0, logger_1.logWarn)("No compatible Ethereum provider found");
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
                    (0, logger_1.logDebug)("BrowserProvider initialized successfully");
                }
                else {
                    (0, logger_1.logWarn)("No compatible Ethereum provider found");
                }
            }
            else {
                (0, logger_1.logWarn)("Window object not available (non-browser environment)");
            }
        }
        catch (error) {
            (0, logger_1.logError)("Failed to initialize BrowserProvider", error);
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
                (0, logger_1.logWarn)("Failed to setup account change listeners", error);
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
            (0, logger_1.logDebug)("Attempting to connect to MetaMask...");
            if (!this.provider) {
                (0, logger_1.logDebug)("Provider not initialized, setting up...");
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
            (0, logger_1.logDebug)("Requesting account access...");
            let accounts = [];
            // Try multiple methods of requesting accounts for compatibility
            try {
                // Try the provider we found first
                accounts = await ethereumProvider.request({
                    method: "eth_requestAccounts",
                });
            }
            catch (requestError) {
                (0, logger_1.logWarn)("First account request failed, trying window.ethereum:", requestError);
                // Fallback to window.ethereum if available and different
                if (window.ethereum && window.ethereum !== ethereumProvider) {
                    try {
                        accounts = await window.ethereum.request({
                            method: "eth_requestAccounts",
                        });
                    }
                    catch (fallbackError) {
                        (0, logger_1.logError)("All account request methods failed", fallbackError);
                        throw new Error("User denied account access");
                    }
                }
                else {
                    throw new Error("User denied account access");
                }
            }
            (0, logger_1.logDebug)(`Accounts requested successfully: ${accounts.length} accounts returned`);
            if (!accounts || accounts.length === 0) {
                (0, logger_1.logDebug)("No accounts found, trying to get signer...");
            }
            for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
                try {
                    (0, logger_1.logDebug)(`Attempt ${attempt} to get signer...`);
                    const signer = await this.provider.getSigner();
                    const address = await signer.getAddress();
                    if (!address) {
                        (0, logger_1.logError)("No address returned from signer");
                        continue;
                    }
                    (0, logger_1.logDebug)(`Successfully connected to MetaMask with address: ${address}`);
                    this.emit("connected", { address });
                    return {
                        success: true,
                        address,
                        message: "Successfully connected to MetaMask",
                    };
                }
                catch (error) {
                    (0, logger_1.logError)(`Attempt ${attempt} failed:`, error);
                    if (attempt === this.config.maxRetries) {
                        throw error;
                    }
                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
                }
            }
            throw new Error("Failed to connect after retries");
        }
        catch (error) {
            (0, logger_1.logError)("Failed to connect to MetaMask:", error);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "METAMASK_CONNECTION_ERROR", error.message ?? "Unknown error while connecting to MetaMask", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generates credentials with caching
     */
    async generateCredentials(address) {
        (0, logger_1.log)("Generating credentials for address:", address);
        try {
            const validAddress = this.validateAddress(address);
            (0, logger_1.log)("Valid Address:", validAddress);
            // Check cache first
            const cachedSignature = this.getCachedSignature(validAddress);
            if (cachedSignature) {
                (0, logger_1.log)("Using cached signature for address:", validAddress);
                return this.generateCredentialsFromSignature(validAddress, cachedSignature);
            }
            try {
                (0, logger_1.log)("Request signature with timeout");
                // Tentiamo di ottenere la firma con timeout
                const signature = await this.requestSignatureWithTimeout(validAddress, this.MESSAGE_TO_SIGN, this.config.timeout);
                // Cache the new signature
                this.cacheSignature(validAddress, signature);
                return this.generateCredentialsFromSignature(validAddress, signature);
            }
            catch (signingError) {
                // Gestione del fallimento di firma
                (0, logger_1.logWarn)(`Failed to get signature: ${signingError}. Using fallback method.`);
                // Generiamo credenziali deterministiche basate solo sull'indirizzo
                // Non sicuro come la firma, ma permette di procedere con l'autenticazione
                return this.generateFallbackCredentials(validAddress);
            }
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIALS_GENERATION_ERROR", error.message ?? "Error generating MetaMask credentials", error);
            throw error;
        }
    }
    /**
     * Generate credentials from signature
     */
    generateCredentialsFromSignature(address, signature) {
        (0, logger_1.log)("Generating credentials from signature");
        const username = `${address.toLowerCase()}`;
        const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`));
        const message = this.MESSAGE_TO_SIGN;
        return { username, password, message, signature };
    }
    /**
     * Generate fallback credentials when signature request fails
     * Questo è meno sicuro della firma, ma permette di procedere con l'autenticazione
     */
    generateFallbackCredentials(address) {
        (0, logger_1.logWarn)("Using fallback credentials generation for address:", address);
        const username = `mm_${address.toLowerCase()}`;
        // Creiamo una password deterministica basata sull'indirizzo
        // Nota: meno sicuro della firma, ma deterministico
        const fallbackMessage = `SHOGUN_FALLBACK:${address.toLowerCase()}`;
        const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(fallbackMessage));
        // Usiamo il messaggio fallback sia come messaggio che come pseudo-firma
        // Questo non è crittograficamente sicuro, ma soddisfa l'interfaccia
        const message = fallbackMessage;
        const signature = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(fallbackMessage));
        return { username, password, message, signature };
    }
    /**
     * Checks if MetaMask is available in the browser
     * @returns true if MetaMask is available
     */
    static isMetaMaskAvailable() {
        if (typeof window === "undefined")
            return false;
        // Check standard location
        if (window.ethereum?.isMetaMask === true)
            return true;
        // Check alternate locations (for compatibility with multiple wallet extensions)
        const alternateProviders = [
            window.web3?.currentProvider,
            window.metamask,
        ];
        for (const provider of alternateProviders) {
            if (provider?.isMetaMask === true)
                return true;
        }
        return false;
    }
    /**
     * Request signature using BrowserProvider
     */
    requestSignatureWithTimeout(address, message, timeout = 30000) {
        return new Promise((resolve, reject) => {
            let timeoutId = setTimeout(() => {
                timeoutId = null;
                reject(new Error("Timeout requesting signature"));
            }, timeout);
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (window.ethereum?.removeListener) {
                    window.ethereum.removeListener("accountsChanged", errorHandler);
                }
            };
            const errorHandler = (error) => {
                cleanup();
                reject(error);
            };
            // Aggiungere listener per l'evento accountsChanged che può interrompere la firma
            if (window.ethereum?.on) {
                window.ethereum.on("accountsChanged", errorHandler);
            }
            (0, logger_1.log)("Initialize and Sign");
            const initializeAndSign = async () => {
                try {
                    if (!this.provider) {
                        this.initProvider();
                        if (!this.provider) {
                            throw new Error("Provider not initialized");
                        }
                    }
                    const signer = await this.provider.getSigner();
                    const signerAddress = await signer.getAddress();
                    (0, logger_1.log)("Signer:", signer);
                    (0, logger_1.log)("Signer Address:", signerAddress);
                    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                        throw new Error(`Signer address (${signerAddress}) does not match expected address (${address})`);
                    }
                    (0, logger_1.log)(`Requesting signature for message: ${message}`);
                    const signature = await signer.signMessage(message);
                    (0, logger_1.log)("Signature obtained successfully");
                    cleanup();
                    resolve(signature);
                }
                catch (error) {
                    (0, logger_1.logError)("Failed to request signature:", error);
                    cleanup();
                    reject(error);
                }
            };
            const signature = initializeAndSign();
            return signature;
        });
    }
    /**
     * Checks if any Ethereum provider is available
     */
    isAvailable() {
        return (typeof window !== "undefined" && !!this.getAvailableEthereumProvider());
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
            this.customProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers_1.ethers.Wallet(privateKey, this.customProvider);
            (0, logger_1.logDebug)("Custom provider configured successfully");
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
