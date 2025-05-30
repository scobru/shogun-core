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
    name = "bitcoin-wallet";
    version = "1.0.0";
    description = "Provides Bitcoin wallet connection and authentication for ShogunCore";
    nostrConnector = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Initialize the Bitcoin wallet module
        this.nostrConnector = new nostrConnector_1.NostrConnector();
        (0, logger_1.log)("Bitcoin wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.nostrConnector) {
            this.nostrConnector.cleanup();
        }
        this.nostrConnector = null;
        super.destroy();
        (0, logger_1.log)("Bitcoin wallet plugin destroyed");
    }
    /**
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    assertNostrConnector() {
        this.assertInitialized();
        if (!this.nostrConnector) {
            throw new Error("Bitcoin wallet module not initialized");
        }
        return this.nostrConnector;
    }
    /**
     * @inheritdoc
     */
    isAvailable() {
        return this.assertNostrConnector().isAvailable();
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
        return this.assertNostrConnector().isNostrExtensionAvailable();
    }
    /**
     * @inheritdoc
     */
    async connectWallet(type = "nostr") {
        // Prioritize nostr over alby (since they are functionally identical)
        // If type is alby, try to use nostr instead
        if (type === "alby") {
            (0, logger_1.log)("Alby is deprecated, using Nostr instead");
            type = "nostr";
        }
        return this.assertNostrConnector().connectWallet(type);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address) {
        (0, logger_1.log)("Calling credential generation for Bitcoin wallet");
        return this.assertNostrConnector().generateCredentials(address);
    }
    /**
     * @inheritdoc
     */
    cleanup() {
        this.assertNostrConnector().cleanup();
    }
    /**
     * @inheritdoc
     */
    async verifySignature(message, signature, address) {
        return this.assertNostrConnector().verifySignature(message, signature, address);
    }
    /**
     * @inheritdoc
     */
    async generatePassword(signature) {
        return this.assertNostrConnector().generatePassword(signature);
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
            // Use core's signUp method directly - simplified approach similar to MetaMask
            (0, logger_1.log)("Signing up using core signUp method...");
            const signUpResult = await core.signUp(credentials.username, credentials.password);
            if (!signUpResult.success) {
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
