"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrConnectorPlugin = void 0;
const base_1 = require("../base");
const nostrConnector_1 = require("./nostrConnector");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
class NostrConnectorPlugin extends base_1.BasePlugin {
    name = "bitcoin";
    version = "1.0.0";
    description = "Provides Bitcoin wallet connection and authentication for ShogunCore";
    bitcoinConnector = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Initialize the Bitcoin wallet module
        this.bitcoinConnector = new nostrConnector_1.NostrConnector();
        (0, logger_1.log)("Bitcoin wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.bitcoinConnector) {
            this.bitcoinConnector.cleanup();
        }
        this.bitcoinConnector = null;
        super.destroy();
        (0, logger_1.log)("Bitcoin wallet plugin destroyed");
    }
    /**
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    assertBitcoinConnector() {
        this.assertInitialized();
        if (!this.bitcoinConnector) {
            throw new Error("Bitcoin wallet module not initialized");
        }
        return this.bitcoinConnector;
    }
    /**
     * @inheritdoc
     */
    isAvailable() {
        return this.assertBitcoinConnector().isAvailable();
    }
    /**
     * Check if Alby extension is available
     * Note: Alby is deprecated in favor of Nostr
     */
    isAlbyAvailable() {
        (0, logger_1.log)("Alby is deprecated, using Nostr instead");
        return this.isNostrExtensionAvailable();
    }
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable() {
        return this.assertBitcoinConnector().isNostrExtensionAvailable();
    }
    /**
     * @inheritdoc
     */
    async connectBitcoinWallet(type = "nostr") {
        // Prioritize nostr over alby (since they are functionally identical)
        // If type is alby, try to use nostr instead
        if (type === "alby") {
            (0, logger_1.log)("Alby is deprecated, using Nostr instead");
            type = "nostr";
        }
        return this.assertBitcoinConnector().connectWallet(type);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address) {
        (0, logger_1.log)("Calling credential generation for Bitcoin wallet");
        return this.assertBitcoinConnector().generateCredentials(address);
    }
    /**
     * @inheritdoc
     */
    cleanup() {
        this.assertBitcoinConnector().cleanup();
    }
    /**
     * Clear signature cache for better user recovery
     * @param address - Optional specific address to clear, or clear all if not provided
     */
    clearSignatureCache(address) {
        this.assertBitcoinConnector().clearSignatureCache(address);
    }
    /**
     * @inheritdoc
     */
    async verifySignature(message, signature, address) {
        return this.assertBitcoinConnector().verifySignature(message, signature, address);
    }
    /**
     * @inheritdoc
     */
    async generatePassword(signature) {
        return this.assertBitcoinConnector().generatePassword(signature);
    }
    /**
     * Login with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates the user using Bitcoin wallet credentials after signature verification
     */
    async login(address) {
        (0, logger_1.log)("Login with Bitcoin wallet");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Bitcoin wallet login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            (0, logger_1.log)("Generating credentials for Bitcoin wallet login...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying Bitcoin wallet signature...");
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                (0, logger_1.logError)(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            (0, logger_1.log)("Bitcoin wallet signature verified successfully.");
            // Set authentication method to bitcoin before login
            core.setAuthMethod("bitcoin");
            // Use core's login method directly - simplified approach similar to MetaMask
            (0, logger_1.log)("Logging in using core login method...");
            const loginResult = await core.login(credentials.username, credentials.password);
            if (!loginResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_LOGIN_FAILED", loginResult.error || "Failed to log in with Bitcoin credentials");
            }
            // Emit login event
            core.emit("auth:login", {
                userPub: loginResult.userPub,
                username: credentials.username,
                method: "bitcoin",
            });
            return loginResult;
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "BITCOIN_LOGIN_ERROR";
            const errorMessage = error?.message || "Unknown error during Bitcoin wallet login";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Register a new user with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account with Bitcoin wallet credentials
     */
    async signUp(address) {
        (0, logger_1.log)("Sign up with Bitcoin wallet");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Bitcoin wallet signup attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for signup");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            // Generate credentials similar to login
            (0, logger_1.log)("Generating credentials for Bitcoin wallet signup...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            // Verify signature
            (0, logger_1.log)("Verifying Bitcoin wallet signature...");
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                (0, logger_1.logError)(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            (0, logger_1.log)("Bitcoin wallet signature verified successfully.");
            // Set authentication method to bitcoin before signup
            core.setAuthMethod("bitcoin");
            // Use core's signUp method directly - simplified approach similar to MetaMask
            (0, logger_1.log)("Signing up using core signUp method...");
            const signUpResult = await core.signUp(credentials.username, credentials.password);
            if (!signUpResult.success) {
                // Check if the error is "User already created"
                if (signUpResult.error &&
                    (signUpResult.error.includes("User already created") ||
                        signUpResult.error.includes("already created") ||
                        signUpResult.error.includes("già creato"))) {
                    // User already exists, suggest login instead
                    return {
                        success: false,
                        error: "User already exists. Please try logging in instead. If login fails, try clearing the signature cache and registering again.",
                    };
                }
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_SIGNUP_FAILED", signUpResult.error || "Failed to sign up with Bitcoin credentials");
            }
            // Emit signup event
            core.emit("auth:signup", {
                userPub: signUpResult.userPub,
                username: credentials.username,
                method: "bitcoin",
            });
            return signUpResult;
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "BITCOIN_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during Bitcoin wallet signup";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Convenience method that matches the interface pattern
     */
    async loginWithBitcoinWallet(address) {
        return this.login(address);
    }
    /**
     * Convenience method that matches the interface pattern
     */
    async signUpWithBitcoinWallet(address) {
        return this.signUp(address);
    }
}
exports.NostrConnectorPlugin = NostrConnectorPlugin;
