"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StealthAddresses = exports.Stealth = void 0;
/**
 * Manages stealth logic using Gun and SEA
 */
const ethers_1 = require("ethers");
const storage_1 = require("../../storage/storage");
const sea_1 = __importDefault(require("gun/sea"));
class Stealth {
    STEALTH_DATA_TABLE;
    storage;
    gun;
    logs = [];
    constructor(gun, storage) {
        this.STEALTH_DATA_TABLE = "Stealth";
        this.storage = storage || new storage_1.ShogunStorage();
        this.gun = gun;
    }
    /**
     * Structured logging system
     */
    log(level, message, data) {
        const logMessage = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
        };
        this.logs.push(logMessage);
        console[level](`[${logMessage.timestamp}] ${message}`, data);
    }
    /**
     * Cleanup sensitive data from memory
     */
    async cleanupSensitiveData() {
        try {
            this.logs = [];
            this.log("info", "Sensitive data cleanup completed");
        }
        catch (error) {
            this.log("error", "Error during cleanup", error);
            throw error;
        }
    }
    async getStealthKeys() {
        const keys = await this.assertStealth().getStealthKeys();
        return {
            spendingKey: keys.spendingKey,
            viewingKey: keys.viewingKey
        };
    }
    // Generate Viewving and Spending Key and save it tu gun userspace
    async generateAndSaveKeys(pair) {
        const existingViewingKey = this.gun
            .user()
            .get("stealth")
            .get("viewingKey")
            .once();
        const existingSpendingKey = this.gun
            .user()
            .get("stealth")
            .get("spendingKey")
            .once();
        if (existingViewingKey || existingSpendingKey) {
            return;
        }
        const ephemeralKeyPairS = await this.createAccount();
        const ephemeralKeyPairV = await this.createAccount();
        let user;
        if (pair) {
            user = await this.gun.user().auth(pair);
        }
        else {
            user = this.gun.user();
        }
        const encryptedViewingKey = await sea_1.default.encrypt(ephemeralKeyPairV, user()._.sea);
        const encryptedSpendingKey = await sea_1.default.encrypt(ephemeralKeyPairS, user()._.sea);
        this.gun.user().get("stealth").get("viewingKey").put(encryptedViewingKey);
        this.gun.user().get("stealth").get("spendingKey").put(encryptedSpendingKey);
        this.log("info", "Stealth keys generated and saved for address", pair?.pub || user?.is?.alias);
    }
    /**
     * Removes the initial tilde (~) from the public key if present
     */
    formatPublicKey(publicKey) {
        if (!publicKey) {
            return null;
        }
        const trimmedKey = publicKey.trim();
        if (!trimmedKey) {
            return null;
        }
        if (!/^[~]?[\w+/=\-_.]+$/.test(trimmedKey)) {
            return null;
        }
        return trimmedKey.startsWith("~") ? trimmedKey.slice(1) : trimmedKey;
    }
    /**
     * Creates a new stealth account
     */
    async createAccount() {
        const ephemeralKeyPair = await this.assertStealth().createAccount();
        return {
            privateKey: ephemeralKeyPair.privateKey,
            publicKey: ephemeralKeyPair.publicKey
        };
    }
    /**
     * Generates a stealth address for a recipient
     * @param viewingPublicKey Recipient's viewing public key
     * @param spendingPublicKey Recipient's spending public key
     * @returns Promise with the stealth address result
     */
    async generateStealthAddress(viewingPublicKey, spendingPublicKey) {
        return this.assertStealth().generateStealthAddress(viewingPublicKey, spendingPublicKey);
    }
    /**
     * Opens a stealth address by deriving the private key
     * @param stealthAddress Stealth address to open
     * @param encryptedRandomNumber Encrypted random number
     * @param ephemeralPublicKey Public key of the ephemeral key pair
     * @returns Promise with the wallet
     */
    async openStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey, spendingKeyPair, viewingKeyPair) {
        return this.assertStealth().openStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey, spendingKeyPair, viewingKeyPair);
    }
    /**
     * Gets public key from an address
     */
    async getPublicKey(publicKey) {
        return this.formatPublicKey(publicKey);
    }
    /**
     * Derives a wallet from shared secret
     */
    deriveWalletFromSecret(secret) {
        const stealthPrivateKey = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(secret));
        return new ethers_1.ethers.Wallet(stealthPrivateKey);
    }
    /**
     * Generates a pair of stealth keys (viewing and spending)
     */
    generateStealthKeys() {
        return {
            scanning: this.createAccount(),
            spending: this.createAccount(),
        };
    }
    /**
     * Verifies a stealth address
     */
    verifyStealthAddress(ephemeralPublicKey, scanningPublicKey, spendingPublicKey, stealthAddress) {
        // Metodo per verificare un indirizzo stealth
        return true;
    }
    assertStealth() {
        if (!this.gun.user()) {
            throw new Error("Stealth not initialized");
        }
        return this;
    }
}
exports.Stealth = Stealth;
exports.StealthAddresses = Stealth;
// Esposizione globale se in ambiente browser
if (typeof window !== "undefined") {
    window.Stealth = Stealth;
}
else if (typeof global !== "undefined") {
    global.Stealth = Stealth;
}
exports.default = Stealth;
