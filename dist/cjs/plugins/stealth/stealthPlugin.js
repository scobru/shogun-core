"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StealthPlugin = void 0;
const base_1 = require("../base");
const stealth_1 = require("./stealth");
const logger_1 = require("../../utils/logger");
/**
 * Plugin per la gestione delle funzionalità Stealth in ShogunCore
 */
class StealthPlugin extends base_1.BasePlugin {
    constructor() {
        super(...arguments);
        this.name = "stealth";
        this.version = "1.0.0";
        this.description = "Provides stealth address functionality for ShogunCore";
        this.stealth = null;
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        if (!core.storage) {
            throw new Error("Storage dependency not available in core");
        }
        // Inizializziamo il modulo Stealth
        this.stealth = new stealth_1.Stealth(core.storage);
        (0, logger_1.log)("Stealth plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.stealth = null;
        super.destroy();
        (0, logger_1.log)("Stealth plugin destroyed");
    }
    /**
     * Assicura che il modulo Stealth sia inizializzato
     * @private
     */
    assertStealth() {
        this.assertInitialized();
        if (!this.stealth) {
            throw new Error("Stealth module not initialized");
        }
        return this.stealth;
    }
    /**
     * @inheritdoc
     */
    async generateEphemeralKeyPair() {
        return this.assertStealth().generateEphemeralKeyPair();
    }
    /**
     * @inheritdoc
     */
    async generateStealthAddress(publicKey, ephemeralPrivateKey) {
        return this.assertStealth().generateStealthAddress(publicKey, ephemeralPrivateKey);
    }
    /**
     * @inheritdoc
     */
    async scanStealthAddresses(addresses, privateKeyOrSpendKey) {
        return this.assertStealth().scanStealthAddresses(addresses, privateKeyOrSpendKey);
    }
    /**
     * @inheritdoc
     */
    async isStealthAddressMine(stealthData, privateKeyOrSpendKey) {
        return this.assertStealth().isStealthAddressMine(stealthData, privateKeyOrSpendKey);
    }
    /**
     * @inheritdoc
     */
    async getStealthPrivateKey(stealthData, privateKeyOrSpendKey) {
        return this.assertStealth().getStealthPrivateKey(stealthData, privateKeyOrSpendKey);
    }
    /**
     * @inheritdoc
     */
    async openStealthAddress(stealthAddress, ephemeralPublicKey, pair) {
        return this.assertStealth().openStealthAddress(stealthAddress, ephemeralPublicKey, pair);
    }
}
exports.StealthPlugin = StealthPlugin;
