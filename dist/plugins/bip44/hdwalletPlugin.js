"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDWalletPlugin = void 0;
const ethers_1 = require("ethers");
const base_1 = require("../base");
const hdwallet_1 = require("./hdwallet");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione dei wallet in ShogunCore
 */
class HDWalletPlugin extends base_1.BasePlugin {
    name = "hdwallet";
    version = "1.0.0";
    description = "Provides wallet management functionality for Shogun Core";
    hdwallet = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        if (!core.gundb || !core.gun) {
            throw new Error("Core dependencies not available");
        }
        // Creiamo un nuovo WalletManager
        this.hdwallet = new hdwallet_1.HDWallet(core.gun, {
            // Recuperiamo configurazione dal core se disponibile
            balanceCacheTTL: core.config?.bip44?.balanceCacheTTL,
            rpcUrl: core.provider instanceof ethers_1.ethers.JsonRpcProvider
                ? core.provider.connection?.url
                : undefined,
        });
        (0, logger_1.log)("Wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.hdwallet = null;
        super.destroy();
        (0, logger_1.log)("Wallet plugin destroyed");
    }
    /**
     * Assicura che il wallet manager sia inizializzato
     * @private
     */
    assertHDWallet() {
        this.assertInitialized();
        if (!this.hdwallet) {
            throw new Error("Wallet manager not initialized");
        }
        return this.hdwallet;
    }
    // --- IMPLEMENTAZIONE METODI WALLET ---
    /**
     * @inheritdoc
     */
    getMainWallet() {
        return this.assertHDWallet().getMainWallet();
    }
    /**
     * @inheritdoc
     */
    getMainWalletCredentials() {
        return this.assertHDWallet().getMainWalletCredentials();
    }
    /**
     * @inheritdoc
     */
    async createWallet() {
        return this.assertHDWallet().createWallet();
    }
    /**
     * @inheritdoc
     */
    async loadWallets() {
        try {
            const manager = this.assertHDWallet();
            if (!this.core?.isLoggedIn()) {
                (0, logger_1.log)("Cannot load wallets: user not authenticated");
                // Segnaliamo l'errore con il gestore centralizzato
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "AUTH_REQUIRED", "User authentication required to load wallets", null);
                return [];
            }
            return await manager.loadWallets();
        }
        catch (error) {
            // Gestiamo l'errore in modo dettagliato
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WALLET, "LOAD_WALLETS_ERROR", `Error loading wallets: ${error instanceof Error ? error.message : String(error)}`, error);
            // Ritorniamo un array vuoto
            return [];
        }
    }
    /**
     * @inheritdoc
     */
    getStandardBIP44Addresses(mnemonic, count = 5) {
        return this.assertHDWallet().getStandardBIP44Addresses(mnemonic, count);
    }
    /**
     * @inheritdoc
     */
    generateNewMnemonic() {
        try {
            // Generate a new mnemonic phrase using ethers.js
            const mnemonic = ethers_1.ethers.Wallet.createRandom().mnemonic;
            if (!mnemonic || !mnemonic.phrase) {
                throw new Error("Failed to generate mnemonic phrase");
            }
            return mnemonic.phrase;
        }
        catch (error) {
            (0, logger_1.logError)("Error generating mnemonic:", error);
            throw new Error("Failed to generate mnemonic phrase");
        }
    }
    /**
     * @inheritdoc
     */
    async signMessage(wallet, message) {
        return this.assertHDWallet().signMessage(wallet, message);
    }
    /**
     * @inheritdoc
     */
    verifySignature(message, signature) {
        return this.assertHDWallet().verifySignature(message, signature);
    }
    /**
     * @inheritdoc
     */
    async signTransaction(wallet, toAddress, value) {
        return this.assertHDWallet().signTransaction(wallet, toAddress, value);
    }
    /**
     * @inheritdoc
     */
    async exportMnemonic(password) {
        return this.assertHDWallet().exportMnemonic(password);
    }
    /**
     * @inheritdoc
     */
    async exportWalletKeys(password) {
        return this.assertHDWallet().exportWalletKeys(password);
    }
    /**
     * @inheritdoc
     */
    async exportGunPair(password) {
        return this.assertHDWallet().exportGunPair(password);
    }
    /**
     * @inheritdoc
     */
    async exportAllUserData(password) {
        return this.assertHDWallet().exportAllUserData(password);
    }
    /**
     * @inheritdoc
     */
    async importMnemonic(mnemonicData, password) {
        return this.assertHDWallet().importMnemonic(mnemonicData, password);
    }
    /**
     * @inheritdoc
     */
    async importWalletKeys(walletsData, password) {
        return this.assertHDWallet().importWalletKeys(walletsData, password);
    }
    /**
     * @inheritdoc
     */
    async importGunPair(pairData, password) {
        return this.assertHDWallet().importGunPair(pairData, password);
    }
    /**
     * @inheritdoc
     */
    async importAllUserData(backupData, password, options = { importMnemonic: true, importWallets: true, importGunPair: true }) {
        return this.assertHDWallet().importAllUserData(backupData, password, options);
    }
    /**
     * @inheritdoc
     */
    setRpcUrl(rpcUrl) {
        try {
            if (!rpcUrl) {
                (0, logger_1.log)("Invalid RPC URL provided");
                return false;
            }
            this.assertHDWallet().setRpcUrl(rpcUrl);
            // Aggiorniamo anche il provider nel core se accessibile
            if (this.core) {
                this.core.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            }
            (0, logger_1.log)(`RPC URL updated to: ${rpcUrl}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to set RPC URL", error);
            return false;
        }
    }
    /**
     * @inheritdoc
     */
    getRpcUrl() {
        if (!this.core) {
            return null;
        }
        // Accediamo all'URL del provider se disponibile
        return this.core.provider instanceof ethers_1.ethers.JsonRpcProvider
            ? this.core.provider.connection?.url || null
            : null;
    }
    /**
     * @inheritdoc
     */
    setSigner(signer) {
        this.assertHDWallet().setSigner(signer);
    }
    /**
     * @inheritdoc
     */
    getSigner() {
        return this.assertHDWallet().getSigner();
    }
    /**
     * @inheritdoc
     */
    getProvider() {
        return this.assertHDWallet().getProvider();
    }
}
exports.HDWalletPlugin = HDWalletPlugin;
