// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrConnectorPlugin = void 0;
const base_1 = require("../base");
const nostrConnector_1 = require("./nostrConnector");
const nostrSigner_1 = require("./nostrSigner");
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
        return this.isNostrExtensionAvailable();
    }
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable() {
        return this.assertBitcoinConnector().isNostrExtensionAvailable();
    }
    /**
     * Connect to Nostr wallet automatically
     * This is a convenience method for easy wallet connection
     */
    async connectNostrWallet() {
        try {
            if (!this.isNostrExtensionAvailable()) {
                return {
                    success: false,
                    error: "Nostr extension not available. Please install a Nostr extension like nos2x, Alby, or Coracle.",
                };
            }
            const result = await this.connectBitcoinWallet("nostr");
            if (result.success) {
            }
            return result;
        }
        catch (error) {
            console.error("[nostrConnectorPlugin] Error connecting to Nostr wallet:", error);
            return {
                success: false,
                error: error.message || "Unknown error connecting to Nostr wallet",
            };
        }
    }
    /**
     * @inheritdoc
     */
    async connectBitcoinWallet(type = "nostr") {
        // Prioritize nostr over alby (since they are functionally identical)
        // If type is alby, try to use nostr instead
        if (type === "alby") {
            type = "nostr";
        }
        return this.assertBitcoinConnector().connectWallet(type);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address, signature, message) {
        return this.assertBitcoinConnector().generateCredentials(address, signature, message);
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
            return await this.assertSigner().createSigningCredential(address);
        }
        catch (error) {
            console.error(`Error creating Nostr signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates an authenticator function for Nostr signing
     */
    createAuthenticator(address) {
        try {
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            console.error(`Error creating Nostr authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates a derived key pair from Nostr credential
     */
    async createDerivedKeyPair(address, extra) {
        try {
            return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
        catch (error) {
            console.error(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * Signs data with derived keys after Nostr verification
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
        catch (error) {
            console.error(`Error signing with derived keys: ${error.message}`);
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
            return await this.assertSigner().createGunUser(address, core.gun);
        }
        catch (error) {
            console.error(`Error creating Gun user from Nostr signing credential: ${error.message}`);
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
            return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
        catch (error) {
            console.error(`Error verifying Nostr consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(address) {
        try {
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
            console.error(`Error setting up consistent Nostr oneshot signing: ${error.message}`);
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
        try {
            const core = this.assertInitialized();
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            const message = nostrConnector_1.MESSAGE_TO_SIGN;
            const signature = await this.assertBitcoinConnector().requestSignature(address, message);
            const credentials = await this.generateCredentials(address, signature, message);
            if (!credentials?.username ||
                !credentials?.key ||
                !credentials.message ||
                !credentials.signature) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                console.error(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            // Deriva le chiavi da address, signature, message
            const k = await (0, nostrConnector_1.deriveNostrKeys)(address, signature, message);
            // Set authentication method to nostr before login
            core.setAuthMethod("nostr");
            // Usa le chiavi derivate per login
            const loginResult = await core.login(credentials.username, "", k);
            if (!loginResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_LOGIN_FAILED", loginResult.error || "Failed to log in with Bitcoin credentials");
            }
            // Emit login event
            core.emit("auth:login", {
                userPub: loginResult.userPub || "",
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
     * Register new user with Nostr wallet
     * @param address - Nostr address
     * @returns {Promise<SignUpResult>} Registration result
     */
    async signUp(address) {
        try {
            const core = this.assertInitialized();
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for signup");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            const message = nostrConnector_1.MESSAGE_TO_SIGN;
            const signature = await this.assertBitcoinConnector().requestSignature(address, message);
            const credentials = await this.generateCredentials(address, signature, message);
            if (!credentials?.username ||
                !credentials?.key ||
                !credentials.message ||
                !credentials.signature) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            // Verify signature
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                console.error(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            // Deriva le chiavi da address, signature, message
            const k = await (0, nostrConnector_1.deriveNostrKeys)(address, signature, message);
            // Set authentication method to nostr before signup
            core.setAuthMethod("nostr");
            // Usa le chiavi derivate per signup
            const signupResult = await core.signUp(credentials.username, "", "", k);
            if (signupResult.success) {
                // Dopo la creazione, autentica subito
                const authResult = await core.login(credentials.username, "", k);
                if (authResult.success) {
                    console.log(`Bitcoin wallet registration and login completed for user: ${credentials.username}`);
                    // Emetti eventi
                    core.emit("auth:signup", {
                        userPub: authResult.userPub || "",
                        username: credentials.username,
                        method: "bitcoin",
                    });
                    return { ...authResult };
                }
                else {
                    return { ...signupResult, error: "User created but login failed" };
                }
            }
            else {
                // Se l'errore è che l'utente esiste già, prova direttamente l'auth
                if (signupResult.error &&
                    signupResult.error.toLowerCase().includes("exist")) {
                    const authResult = await core.login(credentials.username, "", k);
                    return { ...authResult };
                }
                return signupResult;
            }
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
