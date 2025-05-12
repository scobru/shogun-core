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
    name = "stealth";
    version = "1.0.0";
    description = "Provides stealth address functionality for ShogunCore";
    stealth = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        if (!core.storage) {
            throw new Error("Storage dependency not available in core");
        }
        if (!core.gun) {
            throw new Error("Gun dependency not available in core");
        }
        // Inizializziamo il modulo Stealth
        this.stealth = new stealth_1.Stealth(core.gun, core.storage);
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
        return this.assertStealth().createAccount();
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
        // Implementazione per compatibilità
        console.warn("scanStealthAddresses è deprecato. Usa openStealthAddress per ogni indirizzo.");
        return Promise.resolve([]);
    }
    /**
     * @inheritdoc
     */
    async isStealthAddressMine(stealthData, privateKeyOrSpendKey) {
        // Implementazione per compatibilità
        console.warn("isStealthAddressMine è deprecato");
        return Promise.resolve(false);
    }
    /**
     * @inheritdoc
     */
    async getStealthPrivateKey(stealthData, privateKeyOrSpendKey) {
        // Implementazione per compatibilità
        console.warn("getStealthPrivateKey è deprecato. Usa openStealthAddress");
        return Promise.resolve("0x" + "0".repeat(64));
    }
    /**
     * @inheritdoc
     */
    async openStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey) {
        // Ottieni le chiavi dell'utente
        const keys = await this.getStealthKeys();
        // Converti le chiavi stringhe in oggetti EphemeralKeyPair
        const viewingKeyPair = {
            pub: keys.viewingKey,
            priv: keys.viewingKey,
            epub: keys.viewingKey,
            epriv: keys.viewingKey,
        };
        const spendingKeyPair = {
            pub: keys.spendingKey,
            priv: keys.spendingKey,
            epub: keys.spendingKey,
            epriv: keys.spendingKey,
        };
        return this.assertStealth().openStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey, spendingKeyPair, viewingKeyPair);
    }
    /**
     * @inheritdoc
     */
    async getStealthKeys() {
        return this.assertStealth().getStealthKeys();
    }
}
exports.StealthPlugin = StealthPlugin;
