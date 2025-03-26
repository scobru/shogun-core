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
const logger_1 = require("../utils/logger");
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Class for MetaMask connection
 */
class MetaMask {
    constructor() {
        /** Custom JSON-RPC provider */
        this.customProvider = null;
        /** Wallet for custom provider */
        this.customWallet = null;
        /** Fixed message for signing */
        this.MESSAGE_TO_SIGN = "I Love Shogun!";
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000;
        this.AUTH_DATA_TABLE =
            config_1.default.GUN_TABLES.AUTHENTICATIONS || "Authentications";
    }
    /**
     * Validates that the address is valid
     * @param address Address to validate
     * @returns Normalized address
     * @throws Error if address is not valid
     */
    validateAddress(address) {
        if (!address) {
            throw new Error("Address not provided");
        }
        // Normalize address
        const normalizedAddress = String(address).trim().toLowerCase();
        try {
            // Verify if it's a valid address with ethers
            if (!ethers_1.ethers.isAddress(normalizedAddress)) {
                throw new Error("Invalid address format");
            }
            // Format address correctly
            return ethers_1.ethers.getAddress(normalizedAddress);
        }
        catch (e) {
            throw new Error("Invalid Ethereum address");
        }
    }
    /**
     * Generates a secure password from signature
     * @param signature Signature to generate password from
     * @returns Generated password
     */
    generateSecurePassword(signature) {
        if (!signature) {
            throw new Error("Invalid signature");
        }
        // hash the signature
        const hash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(signature));
        return hash.slice(2, 66);
    }
    /**
     * Connects to MetaMask
     * @returns Connection result
     */
    async connectMetaMask() {
        try {
            // Check if MetaMask is available
            if (!MetaMask.isMetaMaskAvailable()) {
                const error = "MetaMask is not available. Please install MetaMask extension.";
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "METAMASK_NOT_AVAILABLE", error, null);
                return {
                    success: false,
                    error,
                };
            }
            const ethereum = window.ethereum;
            try {
                // Request authorization to access accounts
                const accounts = await ethereum.request({
                    method: "eth_requestAccounts",
                });
                // Verify if there are available accounts
                if (!accounts || accounts.length === 0) {
                    const error = "No accounts found in MetaMask";
                    errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "NO_METAMASK_ACCOUNTS", error, null);
                    return {
                        success: false,
                        error,
                    };
                }
                // Validate and normalize address
                const address = this.validateAddress(accounts[0]);
                const metamaskUsername = `mm_${address.toLowerCase()}`;
                return {
                    success: true,
                    address,
                    username: metamaskUsername,
                };
            }
            catch (error) {
                (0, logger_1.logError)("Error accessing MetaMask:", error);
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "METAMASK_ACCESS_ERROR", error.message || "Error connecting to MetaMask", error);
                return {
                    success: false,
                    error: error.message || "Error connecting to MetaMask",
                };
            }
        }
        catch (error) {
            (0, logger_1.logError)("General error in connectMetaMask:", error);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.NETWORK, "METAMASK_CONNECTION_ERROR", error.message || "Unknown error while connecting to MetaMask", error);
            return {
                success: false,
                error: error.message || "Unknown error while connecting to MetaMask",
            };
        }
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
     * Generates credentials for MetaMask authentication
     */
    async generateCredentials(address) {
        try {
            if (!address) {
                throw new Error("Ethereum address required");
            }
            (0, logger_1.log)("Requesting message signature: " + this.MESSAGE_TO_SIGN);
            let signature = null;
            let retries = 0;
            while (!signature && retries < this.MAX_RETRIES) {
                try {
                    // Request signature with timeout
                    signature = await this.requestSignatureWithTimeout(address, this.MESSAGE_TO_SIGN);
                }
                catch (error) {
                    retries++;
                    if (retries < this.MAX_RETRIES) {
                        (0, logger_1.log)(`Attempt ${retries + 1} of ${this.MAX_RETRIES}...`);
                        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (!signature) {
                throw new Error("Unable to get signature after attempts");
            }
            (0, logger_1.log)("Signature obtained, generating password...");
            // Generate deterministic username and password
            const username = `mm_${address.toLowerCase()}`;
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`));
            return {
                username,
                password,
            };
        }
        catch (error) {
            (0, logger_1.logError)("Error generating MetaMask credentials:", error);
            throw new Error(`MetaMask error: ${error.message}`);
        }
    }
    /**
     * Requests signature with timeout
     */
    async requestSignatureWithTimeout(address, message, timeout = 30000) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Timeout requesting signature"));
            }, timeout);
            try {
                if (!window.ethereum) {
                    throw new Error("MetaMask not found");
                }
                const provider = new ethers_1.ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                // Verify address matches
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
            this.customProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers_1.ethers.Wallet(privateKey, this.customProvider);
            (0, logger_1.logDebug)("Custom provider configured successfully");
        }
        catch (error) {
            throw new Error(`Error configuring provider: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * Get active signer instance
     * @returns Ethers.js Signer
     * @throws {Error} If no signer available
     */
    async getSigner() {
        try {
            if (this.customWallet) {
                return this.customWallet;
            }
            const signer = await this.getEthereumSigner();
            if (!signer) {
                throw new Error("No Ethereum signer available");
            }
            return signer;
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
MetaMask.TIMEOUT_MS = 5000;
if (typeof window !== "undefined") {
    window.MetaMask = MetaMask;
}
else if (typeof global !== "undefined") {
    global.MetaMask = MetaMask;
}
