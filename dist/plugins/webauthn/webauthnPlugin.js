"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebauthnPlugin = void 0;
const base_1 = require("../base");
const webauthn_1 = require("./webauthn");
const webauthnSigner_1 = require("./webauthnSigner");
const logger_1 = require("../../utils/logger");
const ethers_1 = require("ethers");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
class WebauthnPlugin extends base_1.BasePlugin {
    name = "webauthn";
    version = "1.0.0";
    description = "Provides WebAuthn authentication functionality for ShogunCore";
    webauthn = null;
    signer = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo WebAuthn
        this.webauthn = new webauthn_1.Webauthn(core.gun);
        this.signer = new webauthnSigner_1.WebAuthnSigner(this.webauthn);
        (0, logger_1.log)("WebAuthn plugin initialized with signer support");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.webauthn = null;
        this.signer = null;
        super.destroy();
        (0, logger_1.log)("WebAuthn plugin destroyed");
    }
    /**
     * Assicura che il modulo WebAuthn sia inizializzato
     * @private
     */
    assertWebauthn() {
        this.assertInitialized();
        if (!this.webauthn) {
            throw new Error("WebAuthn module not initialized");
        }
        return this.webauthn;
    }
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    assertSigner() {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("WebAuthn signer not initialized");
        }
        return this.signer;
    }
    /**
     * @inheritdoc
     */
    isSupported() {
        return this.assertWebauthn().isSupported();
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(username, existingCredential, isLogin = false) {
        return this.assertWebauthn().generateCredentials(username, existingCredential, isLogin);
    }
    /**
     * @inheritdoc
     */
    async createAccount(username, credentials, isNewDevice = false) {
        return this.assertWebauthn().createAccount(username, credentials, isNewDevice);
    }
    /**
     * @inheritdoc
     */
    async authenticateUser(username, salt, options) {
        return this.assertWebauthn().authenticateUser(username, salt, options);
    }
    /**
     * @inheritdoc
     */
    abortAuthentication() {
        this.assertWebauthn().abortAuthentication();
    }
    /**
     * @inheritdoc
     */
    async removeDevice(username, credentialId, credentials) {
        return this.assertWebauthn().removeDevice(username, credentialId, credentials);
    }
    /**
     * @inheritdoc
     */
    async createSigningCredential(username) {
        try {
            (0, logger_1.log)(`Creating signing credential for user: ${username}`);
            return await this.assertSigner().createSigningCredential(username);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    createAuthenticator(credentialId) {
        try {
            (0, logger_1.log)(`Creating authenticator for credential: ${credentialId}`);
            return this.assertSigner().createAuthenticator(credentialId);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    async createDerivedKeyPair(credentialId, username, extra) {
        try {
            (0, logger_1.log)(`Creating derived key pair for credential: ${credentialId}`);
            return await this.assertSigner().createDerivedKeyPair(credentialId, username, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    async signWithDerivedKeys(data, credentialId, username, extra) {
        try {
            (0, logger_1.log)(`Signing data with derived keys for credential: ${credentialId}`);
            return await this.assertSigner().signWithDerivedKeys(data, credentialId, username, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error signing with derived keys: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    getSigningCredential(credentialId) {
        return this.assertSigner().getCredential(credentialId);
    }
    /**
     * @inheritdoc
     */
    listSigningCredentials() {
        return this.assertSigner().listCredentials();
    }
    /**
     * @inheritdoc
     */
    removeSigningCredential(credentialId) {
        return this.assertSigner().removeCredential(credentialId);
    }
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from WebAuthn signing credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUserFromSigningCredential(credentialId, username) {
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Creating Gun user from signing credential: ${credentialId}`);
            return await this.assertSigner().createGunUser(credentialId, username, core.gun);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Gun user from signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(credentialId) {
        return this.assertSigner().getGunUserPub(credentialId);
    }
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    getHashedCredentialId(credentialId) {
        return this.assertSigner().getHashedCredentialId(credentialId);
    }
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    async verifyConsistency(credentialId, username, expectedUserPub) {
        try {
            (0, logger_1.log)(`Verifying consistency for credential: ${credentialId}`);
            return await this.assertSigner().verifyConsistency(credentialId, username, expectedUserPub);
        }
        catch (error) {
            (0, logger_1.logError)(`Error verifying consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(username) {
        try {
            (0, logger_1.log)(`Setting up consistent oneshot signing for: ${username}`);
            // 1. Create signing credential (with consistent hashing)
            const credential = await this.createSigningCredential(username);
            // 2. Create authenticator
            const authenticator = this.createAuthenticator(credential.id);
            // 3. Create Gun user (same as normal approach)
            const gunUser = await this.createGunUserFromSigningCredential(credential.id, username);
            return {
                credential,
                authenticator,
                gunUser,
                pub: credential.pub,
                hashedCredentialId: credential.hashedCredentialId,
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Error setting up consistent oneshot signing: ${error.message}`);
            throw error;
        }
    }
    /**
     * Login with WebAuthn
     * This is the recommended method for WebAuthn authentication
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    async login(username) {
        (0, logger_1.log)("Login with WebAuthn");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Attempting WebAuthn login for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn login");
            }
            if (!this.isSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            const assertionResult = await this.generateCredentials(username, null, true);
            if (!assertionResult?.success) {
                throw new Error(assertionResult?.error || "WebAuthn verification failed");
            }
            const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(assertionResult.credentialId || ""));
            // Set authentication method to webauthn before login
            core.setAuthMethod("webauthn");
            const loginResult = await core.login(username, hashedCredentialId);
            if (loginResult.success) {
                (0, logger_1.log)(`WebAuthn login completed successfully for user: ${username}`);
                return {
                    ...loginResult,
                };
            }
            else {
                return loginResult;
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during WebAuthn login: ${error}`);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_LOGIN_ERROR", error.message || "Error during WebAuthn login", error);
            return {
                success: false,
                error: error.message || "Error during WebAuthn login",
            };
        }
    }
    /**
     * Register new user with WebAuthn
     * This is the recommended method for WebAuthn registration
     * @param username - Username
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    async signUp(username) {
        (0, logger_1.log)("Sign up with WebAuthn");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Attempting WebAuthn registration for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn registration");
            }
            if (!this.isSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            const attestationResult = await this.generateCredentials(username, null, false);
            if (!attestationResult?.success) {
                throw new Error(attestationResult?.error || "Unable to generate WebAuthn credentials");
            }
            const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(attestationResult.credentialId || ""));
            // Set authentication method to webauthn before signup
            core.setAuthMethod("webauthn");
            const signupResult = await core.signUp(username, hashedCredentialId);
            if (signupResult.success) {
                (0, logger_1.log)(`WebAuthn registration completed successfully for user: ${username}`);
                // Emettiamo un evento personalizzato per il registrazione WebAuthn
                core.emit("webauthn:register", {
                    username,
                    credentialId: attestationResult.credentialId,
                });
                // Also emit the standard auth:signup event for consistency
                core.emit("auth:signup", {
                    userPub: signupResult.userPub,
                    username,
                    method: "webauthn",
                });
                return {
                    ...signupResult,
                };
            }
            else {
                return signupResult;
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during WebAuthn registration: ${error}`);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_SIGNUP_ERROR", error.message || "Error during WebAuthn registration", error);
            return {
                success: false,
                error: error.message || "Error during WebAuthn registration",
            };
        }
    }
}
exports.WebauthnPlugin = WebauthnPlugin;
