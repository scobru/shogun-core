"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebauthnPlugin = void 0;
const base_1 = require("../base");
const webauthn_1 = require("./webauthn");
const logger_1 = require("../../utils/logger");
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
class WebauthnPlugin extends base_1.BasePlugin {
    constructor() {
        super(...arguments);
        this.name = "webauthn";
        this.version = "1.0.0";
        this.description = "Provides WebAuthn authentication functionality for ShogunCore";
        this.webauthn = null;
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo WebAuthn
        this.webauthn = new webauthn_1.Webauthn();
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
}
exports.WebauthnPlugin = WebauthnPlugin;
