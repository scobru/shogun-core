"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaMask = void 0;
/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
const ethers_1 = require("ethers");
const logger_1 = require("../../utils/logger");
const config_1 = __importDefault(require("../../config"));
const errorHandler_1 = require("../../utils/errorHandler");
const events_1 = require("events");
/**
 * Class for MetaMask connection
 */
class MetaMask extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.MESSAGE_TO_SIGN = "I Love Shogun!";
        this.DEFAULT_CONFIG = {
            cacheDuration: 30 * 60 * 1000, // 30 minutes
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 60000,
        };
        this.signatureCache = new Map();
        this.provider = null;
        this.customProvider = null;
        this.customWallet = null;
        this.config = { ...this.DEFAULT_CONFIG, ...config };
        this.AUTH_DATA_TABLE =
            config_1.default.GUN_TABLES.AUTHENTICATIONS || "Authentications";
        this.setupProvider();
        this.setupEventListeners();
    }
    /**
     * Initialize the BrowserProvider
     */
    async setupProvider() {
        try {
            if (typeof window !== "undefined" && window.ethereum) {
                this.provider = new ethers_1.ethers.BrowserProvider(window.ethereum);
                (0, logger_1.logDebug)("BrowserProvider initialized successfully");
            }
            else {
                (0, logger_1.logWarn)("Window.ethereum is not available");
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
            this.provider.on("network", (newNetwork, oldNetwork) => {
                this.emit("chainChanged", newNetwork);
            });
            // Listen for account changes
            if (window.ethereum?.on) {
                window.ethereum.on("accountsChanged", (accounts) => {
                    this.emit("accountsChanged", accounts);
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
                await this.setupProvider();
                if (!this.provider) {
                    throw new Error("MetaMask is not available. Please install MetaMask extension.");
                }
            }
            // Richiedi esplicitamente l'accesso all'account MetaMask
            (0, logger_1.logDebug)("Requesting account access...");
            let accounts = [];
            if (window.ethereum) {
                try {
                    accounts = await window.ethereum.request({
                        method: "eth_requestAccounts",
                    });
                    (0, logger_1.logDebug)(`Accounts requested successfully: ${accounts.length} accounts returned`);
                }
                catch (requestError) {
                    (0, logger_1.logError)("Error requesting MetaMask accounts:", requestError);
                    throw new Error("User denied account access");
                }
            }
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
                        throw new Error("No accounts found in MetaMask");
                    }
                    (0, logger_1.logDebug)(`Signer address obtained: ${address}`);
                    const metamaskUsername = `mm_${address.toLowerCase()}`;
                    // Emetti evento connesso
                    this.emit("connected", { address });
                    (0, logger_1.logDebug)(`MetaMask connected successfully with address: ${address}`);
                    return { success: true, address, username: metamaskUsername };
                }
                catch (error) {
                    (0, logger_1.logError)(`Error in connection attempt ${attempt}:`, error);
                    if (attempt === this.config.maxRetries)
                        throw error;
                    (0, logger_1.logDebug)(`Retrying in ${this.config.retryDelay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
                }
            }
            throw new Error("Failed to connect after retries");
        }
        catch (error) {
            (0, logger_1.logError)("Failed to connect to MetaMask:", error);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "METAMASK_CONNECTION_ERROR", error.message || "Unknown error while connecting to MetaMask", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generates credentials with caching
     */
    async generateCredentials(address) {
        (0, logger_1.logDebug)("Generating credentials for address:", address);
        try {
            const validAddress = this.validateAddress(address);
            // Check cache first
            const cachedSignature = this.getCachedSignature(validAddress);
            if (cachedSignature) {
                (0, logger_1.logDebug)("Using cached signature for address:", validAddress);
                return this.generateCredentialsFromSignature(validAddress, cachedSignature);
            }
            try {
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
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIALS_GENERATION_ERROR", error.message || "Error generating MetaMask credentials", error);
            throw error;
        }
    }
    /**
     * Generate credentials from signature
     */
    generateCredentialsFromSignature(address, signature) {
        const username = `mm_${address.toLowerCase()}`;
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
            let timeoutId = setTimeout(() => {
                timeoutId = null;
                reject(new Error("Timeout requesting signature"));
            }, timeout);
            try {
                if (!this.provider) {
                    await this.setupProvider();
                    if (!this.provider) {
                        throw new Error("Provider not initialized");
                    }
                }
                // Preparare il signer
                let signer;
                try {
                    signer = await this.provider.getSigner();
                }
                catch (error) {
                    (0, logger_1.logError)("Failed to get signer:", error);
                    throw new Error(`Failed to get signer: ${error.message}`);
                }
                // Verifica l'indirizzo del signer
                let signerAddress;
                try {
                    signerAddress = await signer.getAddress();
                }
                catch (error) {
                    (0, logger_1.logError)("Failed to get signer address:", error);
                    throw new Error(`Failed to get signer address: ${error.message}`);
                }
                if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                    throw new Error(`Signer address (${signerAddress}) does not match expected address (${address})`);
                }
                // Eseguire la firma con handling migliorato
                (0, logger_1.logDebug)(`Requesting signature for message: ${message}`);
                // Aggiungere un event handler temporaneo per eventuali errori della window.ethereum
                const errorHandler = (error) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    reject(error);
                };
                // Aggiungere anche listener per l'evento accountsChanged che può interrompere la firma
                if (window.ethereum?.on) {
                    window.ethereum.on("accountsChanged", errorHandler);
                }
                try {
                    const signature = await signer.signMessage(message);
                    (0, logger_1.logDebug)("Signature obtained successfully");
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    // Rimuoviamo i listener
                    if (window.ethereum?.removeListener) {
                        window.ethereum.removeListener("accountsChanged", errorHandler);
                    }
                    resolve(signature);
                }
                catch (error) {
                    (0, logger_1.logError)("Error during message signing:", error);
                    // Rimuoviamo i listener
                    if (window.ethereum?.removeListener) {
                        window.ethereum.removeListener("accountsChanged", errorHandler);
                    }
                    throw error;
                }
            }
            catch (error) {
                (0, logger_1.logError)("Failed to request signature:", error);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
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
            this.customProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers_1.ethers.Wallet(privateKey, this.customProvider);
            (0, logger_1.logDebug)("Custom provider configured successfully");
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
        if (!MetaMask.isMetaMaskAvailable()) {
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
            throw new Error(`Error accessing MetaMask: ${error.message || "Unknown error"}`);
        }
    }
}
exports.MetaMask = MetaMask;
if (typeof window !== "undefined") {
    window.MetaMask = MetaMask;
}
else if (typeof global !== "undefined") {
    global.MetaMask = MetaMask;
}
