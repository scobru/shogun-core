// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebauthnPlugin = void 0;
const base_1 = require("../base");
const webauthn_1 = require("./webauthn");
const webauthnSigner_1 = require("./webauthnSigner");
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
        // Verifica se siamo in ambiente browser
        if (typeof window === "undefined") {
            console.warn("[webauthnPlugin] WebAuthn plugin disabled - not in browser environment");
            return;
        }
        // Verifica se WebAuthn è supportato
        if (!this.isSupported()) {
            console.warn("[webauthnPlugin] WebAuthn not supported in this environment");
            return;
        }
        // Inizializziamo il modulo WebAuthn
        this.webauthn = new webauthn_1.Webauthn(core.gun);
        this.signer = new webauthnSigner_1.WebAuthnSigner(this.webauthn);
        console.log("[webauthnPlugin] WebAuthn plugin initialized with signer support");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.webauthn = null;
        this.signer = null;
        super.destroy();
        console.log("[webauthnPlugin] WebAuthn plugin destroyed");
    }
    /**
     * Assicura che il modulo Webauthn sia inizializzato
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
        // Verifica se siamo in ambiente browser
        if (typeof window === "undefined") {
            return false;
        }
        // Se il plugin non è stato inizializzato, verifica direttamente il supporto
        if (!this.webauthn) {
            return typeof window.PublicKeyCredential !== "undefined";
        }
        return this.webauthn.isSupported();
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
            return await this.assertSigner().createSigningCredential(username);
        }
        catch (error) {
            console.error(`Error creating signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    createAuthenticator(credentialId) {
        try {
            return this.assertSigner().createAuthenticator(credentialId);
        }
        catch (error) {
            console.error(`Error creating authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    async createDerivedKeyPair(credentialId, username, extra) {
        try {
            return await this.assertSigner().createDerivedKeyPair(credentialId, username, extra);
        }
        catch (error) {
            console.error(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * @inheritdoc
     */
    async signWithDerivedKeys(data, credentialId, username, extra) {
        try {
            return await this.assertSigner().signWithDerivedKeys(data, credentialId, username, extra);
        }
        catch (error) {
            console.error(`Error signing with derived keys: ${error.message}`);
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
            return await this.assertSigner().createGunUser(credentialId, username, core.gun);
        }
        catch (error) {
            console.error(`Error creating Gun user from signing credential: ${error.message}`);
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
            return await this.assertSigner().verifyConsistency(credentialId, username, expectedUserPub);
        }
        catch (error) {
            console.error(`Error verifying consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(username) {
        try {
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
            console.error(`Error setting up consistent oneshot signing: ${error.message}`);
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
        try {
            const core = this.assertInitialized();
            if (!username) {
                throw new Error("Username required for WebAuthn login");
            }
            if (!this.isSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            const credentials = await this.generateCredentials(username, null, true);
            if (!credentials?.success) {
                throw new Error(credentials?.error || "WebAuthn verification failed");
            }
            // Usa le chiavi derivate per login
            core.setAuthMethod("webauthn");
            const loginResult = await core.login(username, "", credentials.key);
            if (loginResult.success) {
                return {
                    ...loginResult,
                };
            }
            else {
                return loginResult;
            }
        }
        catch (error) {
            console.error(`Error during WebAuthn login: ${error}`);
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
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    async signUp(username) {
        try {
            const core = this.assertInitialized();
            if (!username) {
                throw new Error("Username required for WebAuthn registration");
            }
            if (!this.isSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            const credentials = await this.generateCredentials(username, null, false);
            if (!credentials?.success) {
                throw new Error(credentials?.error || "Unable to generate WebAuthn credentials");
            }
            // Usa le chiavi derivate per signup
            core.setAuthMethod("webauthn");
            const signupResult = await core.signUp(username, "", "", credentials.key);
            if (signupResult.success) {
                return {
                    ...signupResult,
                };
            }
            else {
                return signupResult;
            }
        }
        catch (error) {
            console.error(`Error during WebAuthn registration: ${error}`);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_SIGNUP_ERROR", error.message || "Error during WebAuthn registration", error);
            return {
                success: false,
                error: error.message || "Error during WebAuthn registration",
            };
        }
    }
}
exports.WebauthnPlugin = WebauthnPlugin;
