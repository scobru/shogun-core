"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaMaskPlugin = void 0;
const base_1 = require("../base");
const metamask_1 = require("./connector/metamask");
const logger_1 = require("../../utils/logger");
/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
class MetaMaskPlugin extends base_1.BasePlugin {
    constructor() {
        super(...arguments);
        this.name = "metamask";
        this.version = "1.0.0";
        this.description = "Provides MetaMask wallet connection and authentication for ShogunCore";
        this.metamask = null;
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo MetaMask
        this.metamask = new metamask_1.MetaMask();
        (0, logger_1.log)("MetaMask plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.metamask) {
            this.metamask.cleanup();
        }
        this.metamask = null;
        super.destroy();
        (0, logger_1.log)("MetaMask plugin destroyed");
    }
    /**
     * Assicura che il modulo MetaMask sia inizializzato
     * @private
     */
    assertMetaMask() {
        this.assertInitialized();
        if (!this.metamask) {
            throw new Error("MetaMask module not initialized");
        }
        return this.metamask;
    }
    /**
     * @inheritdoc
     */
    isAvailable() {
        return this.assertMetaMask().isAvailable();
    }
    /**
     * @inheritdoc
     */
    async connectMetaMask() {
        return this.assertMetaMask().connectMetaMask();
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address) {
        return this.assertMetaMask().generateCredentials(address);
    }
    /**
     * @inheritdoc
     */
    cleanup() {
        this.assertMetaMask().cleanup();
    }
    /**
     * @inheritdoc
     */
    setCustomProvider(rpcUrl, privateKey) {
        this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
    }
    /**
     * @inheritdoc
     */
    async getSigner() {
        return this.assertMetaMask().getSigner();
    }
    /**
     * @inheritdoc
     */
    async generatePassword(signature) {
        return this.assertMetaMask().generatePassword(signature);
    }
    /**
     * @inheritdoc
     */
    async verifySignature(message, signature) {
        return this.assertMetaMask().verifySignature(message, signature);
    }
}
exports.MetaMaskPlugin = MetaMaskPlugin;
