"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebauthnPlugin = void 0;
const base_1 = require("../base");
const webauthn_1 = require("./webauthn");
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
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo WebAuthn
        this.webauthn = new webauthn_1.Webauthn(core.gun);
        (0, logger_1.log)("WebAuthn plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.webauthn = null;
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
            const loginResult = await core.login(username, hashedCredentialId);
            if (loginResult.success) {
                (0, logger_1.log)(`WebAuthn login completed successfully for user: ${username}`);
                return {
                    ...loginResult,
                    username,
                    credentialId: assertionResult.credentialId,
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
                    username,
                    credentialId: attestationResult.credentialId,
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
    /**
     * Legacy method for WebAuthn login - use login() instead
     * @deprecated Use login(username) instead
     */
    async loginWithWebAuthn(username) {
        return this.login(username);
    }
    /**
     * Legacy method for WebAuthn signup - use signUp() instead
     * @deprecated Use signUp(username) instead
     */
    async signUpWithWebAuthn(username) {
        return this.signUp(username);
    }
}
exports.WebauthnPlugin = WebauthnPlugin;
