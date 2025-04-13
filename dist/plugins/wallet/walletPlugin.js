import { ethers } from "ethers";
import { BasePlugin } from "../base";
import { WalletManager } from "./walletManager";
import { log, logError } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
/**
 * Plugin per la gestione dei wallet in ShogunCore
 */
export class WalletPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        this.name = "wallet";
        this.version = "1.0.0";
        this.description = "Provides wallet management functionality for Shogun Core";
        this.walletManager = null;
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        if (!core.gundb || !core.gun || !core.storage) {
            throw new Error("Core dependencies not available");
        }
        // Creiamo un nuovo WalletManager
        this.walletManager = new WalletManager(core.gundb, core.gun, core.storage, {
            // Recuperiamo configurazione dal core se disponibile
            balanceCacheTTL: core.config?.walletManager?.balanceCacheTTL,
            rpcUrl: core.provider instanceof ethers.JsonRpcProvider
                ? core.provider.connection?.url
                : undefined,
        });
        log("Wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.walletManager = null;
        super.destroy();
        log("Wallet plugin destroyed");
    }
    /**
     * Assicura che il wallet manager sia inizializzato
     * @private
     */
    assertWalletManager() {
        this.assertInitialized();
        if (!this.walletManager) {
            throw new Error("Wallet manager not initialized");
        }
        return this.walletManager;
    }
    // --- IMPLEMENTAZIONE METODI WALLET ---
    /**
     * @inheritdoc
     */
    getMainWallet() {
        return this.assertWalletManager().getMainWallet();
    }
    /**
     * @inheritdoc
     */
    async createWallet() {
        return this.assertWalletManager().createWallet();
    }
    /**
     * @inheritdoc
     */
    async loadWallets() {
        try {
            const manager = this.assertWalletManager();
            if (!this.core?.isLoggedIn()) {
                log("Cannot load wallets: user not authenticated");
                // Segnaliamo l'errore con il gestore centralizzato
                ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_REQUIRED", "User authentication required to load wallets", null);
                return [];
            }
            return await manager.loadWallets();
        }
        catch (error) {
            // Gestiamo l'errore in modo dettagliato
            ErrorHandler.handle(ErrorType.WALLET, "LOAD_WALLETS_ERROR", `Error loading wallets: ${error instanceof Error ? error.message : String(error)}`, error);
            // Ritorniamo un array vuoto
            return [];
        }
    }
    /**
     * @inheritdoc
     */
    getStandardBIP44Addresses(mnemonic, count = 5) {
        return this.assertWalletManager().getStandardBIP44Addresses(mnemonic, count);
    }
    /**
     * @inheritdoc
     */
    generateNewMnemonic() {
        try {
            // Generate a new mnemonic phrase using ethers.js
            const mnemonic = ethers.Wallet.createRandom().mnemonic;
            if (!mnemonic || !mnemonic.phrase) {
                throw new Error("Failed to generate mnemonic phrase");
            }
            return mnemonic.phrase;
        }
        catch (error) {
            logError("Error generating mnemonic:", error);
            throw new Error("Failed to generate mnemonic phrase");
        }
    }
    /**
     * @inheritdoc
     */
    async signMessage(wallet, message) {
        return this.assertWalletManager().signMessage(wallet, message);
    }
    /**
     * @inheritdoc
     */
    verifySignature(message, signature) {
        return this.assertWalletManager().verifySignature(message, signature);
    }
    /**
     * @inheritdoc
     */
    async signTransaction(wallet, toAddress, value) {
        return this.assertWalletManager().signTransaction(wallet, toAddress, value);
    }
    /**
     * @inheritdoc
     */
    async exportMnemonic(password) {
        return this.assertWalletManager().exportMnemonic(password);
    }
    /**
     * @inheritdoc
     */
    async exportWalletKeys(password) {
        return this.assertWalletManager().exportWalletKeys(password);
    }
    /**
     * @inheritdoc
     */
    async exportGunPair(password) {
        return this.assertWalletManager().exportGunPair(password);
    }
    /**
     * @inheritdoc
     */
    async exportAllUserData(password) {
        return this.assertWalletManager().exportAllUserData(password);
    }
    /**
     * @inheritdoc
     */
    async importMnemonic(mnemonicData, password) {
        return this.assertWalletManager().importMnemonic(mnemonicData, password);
    }
    /**
     * @inheritdoc
     */
    async importWalletKeys(walletsData, password) {
        return this.assertWalletManager().importWalletKeys(walletsData, password);
    }
    /**
     * @inheritdoc
     */
    async importGunPair(pairData, password) {
        return this.assertWalletManager().importGunPair(pairData, password);
    }
    /**
     * @inheritdoc
     */
    async importAllUserData(backupData, password, options = { importMnemonic: true, importWallets: true, importGunPair: true }) {
        return this.assertWalletManager().importAllUserData(backupData, password, options);
    }
    /**
     * @inheritdoc
     */
    setRpcUrl(rpcUrl) {
        try {
            if (!rpcUrl) {
                log("Invalid RPC URL provided");
                return false;
            }
            this.assertWalletManager().setRpcUrl(rpcUrl);
            // Aggiorniamo anche il provider nel core se accessibile
            if (this.core) {
                this.core.provider = new ethers.JsonRpcProvider(rpcUrl);
            }
            log(`RPC URL updated to: ${rpcUrl}`);
            return true;
        }
        catch (error) {
            logError("Failed to set RPC URL", error);
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
        return this.core.provider instanceof ethers.JsonRpcProvider
            ? this.core.provider.connection?.url || null
            : null;
    }
}
