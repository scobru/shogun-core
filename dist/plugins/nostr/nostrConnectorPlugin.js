"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrConnectorPlugin = void 0;
const base_1 = require("../base");
const nostrConnector_1 = require("./nostrConnector");
const nostrSigner_1 = require("./nostrSigner");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
class NostrConnectorPlugin extends base_1.BasePlugin {
    name = "nostr";
    version = "1.0.0";
    description = "Provides Bitcoin wallet connection and authentication for ShogunCore";
    bitcoinConnector = null;
    signer = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Initialize the Bitcoin wallet module
        this.bitcoinConnector = new nostrConnector_1.NostrConnector();
        this.signer = new nostrSigner_1.NostrSigner(this.bitcoinConnector);
        (0, logger_1.log)("Bitcoin wallet plugin initialized with signer support");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.bitcoinConnector) {
            this.bitcoinConnector.cleanup();
        }
        this.bitcoinConnector = null;
        this.signer = null;
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
     * Assicura che il signer sia inizializzato
     * @private
     */
    assertSigner() {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("Nostr signer not initialized");
        }
        return this.signer;
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
    // === NOSTR SIGNER METHODS ===
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    async createSigningCredential(address) {
        try {
            (0, logger_1.log)(`Creating Nostr signing credential for address: ${address}`);
            return await this.assertSigner().createSigningCredential(address);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Nostr signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates an authenticator function for Nostr signing
     */
    createAuthenticator(address) {
        try {
            (0, logger_1.log)(`Creating Nostr authenticator for address: ${address}`);
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Nostr authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates a derived key pair from Nostr credential
     */
    async createDerivedKeyPair(address, extra) {
        try {
            (0, logger_1.log)(`Creating derived key pair for address: ${address}`);
            return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * Signs data with derived keys after Nostr verification
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            (0, logger_1.log)(`Signing data with derived keys for address: ${address}`);
            return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error signing with derived keys: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get signing credential by address
     */
    getSigningCredential(address) {
        return this.assertSigner().getCredential(address);
    }
    /**
     * List all signing credentials
     */
    listSigningCredentials() {
        return this.assertSigner().listCredentials();
    }
    /**
     * Remove a signing credential
     */
    removeSigningCredential(address) {
        return this.assertSigner().removeCredential(address);
    }
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from Nostr signing credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUserFromSigningCredential(address) {
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Creating Gun user from Nostr signing credential: ${address}`);
            return await this.assertSigner().createGunUser(address, core.gun);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Gun user from Nostr signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(address) {
        return this.assertSigner().getGunUserPub(address);
    }
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address) {
        return this.assertSigner().getPassword(address);
    }
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    async verifyConsistency(address, expectedUserPub) {
        try {
            (0, logger_1.log)(`Verifying Nostr consistency for address: ${address}`);
            return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
        catch (error) {
            (0, logger_1.logError)(`Error verifying Nostr consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(address) {
        try {
            (0, logger_1.log)(`Setting up consistent Nostr oneshot signing for: ${address}`);
            // 1. Create signing credential (with consistent password generation)
            const credential = await this.createSigningCredential(address);
            // 2. Create authenticator
            const authenticator = this.createAuthenticator(address);
            // 3. Create Gun user (same as normal approach)
            const gunUser = await this.createGunUserFromSigningCredential(address);
            return {
                credential,
                authenticator,
                gunUser,
                username: credential.username,
                password: credential.password,
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Error setting up consistent Nostr oneshot signing: ${error.message}`);
            throw error;
        }
    }
    // === EXISTING METHODS ===
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
            // Set authentication method to nostr before login
            core.setAuthMethod("nostr");
            // Use core's login method with direct GunDB authentication
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
            // Set authentication method to nostr before signup
            core.setAuthMethod("nostr");
            // Use core's signUp method with direct GunDB authentication
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
