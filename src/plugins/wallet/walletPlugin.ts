import { ethers } from "ethers";
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { WalletManager } from "./walletManager";
import { WalletInfo } from "../../types/shogun";
import { WalletPluginInterface } from "./types";
import { log, logError } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

/**
 * Plugin per la gestione dei wallet in ShogunCore
 */
export class WalletPlugin extends BasePlugin implements WalletPluginInterface {
  name = "wallet";
  version = "1.0.0";
  description = "Provides wallet management functionality for Shogun Core";

  private walletManager: WalletManager | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    if (!core.gundb || !core.gun || !core.storage) {
      throw new Error("Core dependencies not available");
    }

    // Creiamo un nuovo WalletManager
    this.walletManager = new WalletManager(core.gun, core.storage, {
      // Recuperiamo configurazione dal core se disponibile
      balanceCacheTTL: core.config?.walletManager?.balanceCacheTTL,
      rpcUrl:
        core.provider instanceof ethers.JsonRpcProvider
          ? (core.provider as any).connection?.url
          : undefined,
    });

    log("Wallet plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    this.walletManager = null;
    super.destroy();
    log("Wallet plugin destroyed");
  }

  /**
   * Assicura che il wallet manager sia inizializzato
   * @private
   */
  private assertWalletManager(): WalletManager {
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
  getMainWallet(): ethers.Wallet | null {
    return this.assertWalletManager().getMainWallet();
  }

  /**
   * @inheritdoc
   */
  getMainWalletCredentials(): { address: string; priv: string } {
    return this.assertWalletManager().getMainWalletCredentials();
  }

  /**
   * @inheritdoc
   */
  async createWallet(): Promise<WalletInfo> {
    return this.assertWalletManager().createWallet();
  }

  /**
   * @inheritdoc
   */
  async loadWallets(): Promise<WalletInfo[]> {
    try {
      const manager = this.assertWalletManager();

      if (!this.core?.isLoggedIn()) {
        log("Cannot load wallets: user not authenticated");

        // Segnaliamo l'errore con il gestore centralizzato
        ErrorHandler.handle(
          ErrorType.AUTHENTICATION,
          "AUTH_REQUIRED",
          "User authentication required to load wallets",
          null
        );

        return [];
      }

      return await manager.loadWallets();
    } catch (error) {
      // Gestiamo l'errore in modo dettagliato
      ErrorHandler.handle(
        ErrorType.WALLET,
        "LOAD_WALLETS_ERROR",
        `Error loading wallets: ${error instanceof Error ? error.message : String(error)}`,
        error
      );

      // Ritorniamo un array vuoto
      return [];
    }
  }

  /**
   * @inheritdoc
   */
  getStandardBIP44Addresses(mnemonic: string, count: number = 5): string[] {
    return this.assertWalletManager().getStandardBIP44Addresses(
      mnemonic,
      count
    );
  }

  /**
   * @inheritdoc
   */
  generateNewMnemonic(): string {
    try {
      // Generate a new mnemonic phrase using ethers.js
      const mnemonic = ethers.Wallet.createRandom().mnemonic;
      if (!mnemonic || !mnemonic.phrase) {
        throw new Error("Failed to generate mnemonic phrase");
      }
      return mnemonic.phrase;
    } catch (error) {
      logError("Error generating mnemonic:", error);
      throw new Error("Failed to generate mnemonic phrase");
    }
  }

  /**
   * @inheritdoc
   */
  async signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array
  ): Promise<string> {
    return this.assertWalletManager().signMessage(wallet, message);
  }

  /**
   * @inheritdoc
   */
  verifySignature(message: string | Uint8Array, signature: string): string {
    return this.assertWalletManager().verifySignature(message, signature);
  }

  /**
   * @inheritdoc
   */
  async signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string
  ): Promise<string> {
    return this.assertWalletManager().signTransaction(wallet, toAddress, value);
  }

  /**
   * @inheritdoc
   */
  async exportMnemonic(password?: string): Promise<string> {
    return this.assertWalletManager().exportMnemonic(password);
  }

  /**
   * @inheritdoc
   */
  async exportWalletKeys(password?: string): Promise<string> {
    return this.assertWalletManager().exportWalletKeys(password);
  }

  /**
   * @inheritdoc
   */
  async exportGunPair(password?: string): Promise<string> {
    return this.assertWalletManager().exportGunPair(password);
  }

  /**
   * @inheritdoc
   */
  async exportAllUserData(password: string): Promise<string> {
    return this.assertWalletManager().exportAllUserData(password);
  }

  /**
   * @inheritdoc
   */
  async importMnemonic(
    mnemonicData: string,
    password?: string
  ): Promise<boolean> {
    return this.assertWalletManager().importMnemonic(mnemonicData, password);
  }

  /**
   * @inheritdoc
   */
  async importWalletKeys(
    walletsData: string,
    password?: string
  ): Promise<number> {
    return this.assertWalletManager().importWalletKeys(walletsData, password);
  }

  /**
   * @inheritdoc
   */
  async importGunPair(pairData: string, password?: string): Promise<boolean> {
    return this.assertWalletManager().importGunPair(pairData, password);
  }

  /**
   * @inheritdoc
   */
  async importAllUserData(
    backupData: string,
    password: string,
    options: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    } = { importMnemonic: true, importWallets: true, importGunPair: true }
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }> {
    return this.assertWalletManager().importAllUserData(
      backupData,
      password,
      options
    );
  }

  /**
   * @inheritdoc
   */
  setRpcUrl(rpcUrl: string): boolean {
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
    } catch (error) {
      logError("Failed to set RPC URL", error);
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  getRpcUrl(): string | null {
    if (!this.core) {
      return null;
    }

    // Accediamo all'URL del provider se disponibile
    return this.core.provider instanceof ethers.JsonRpcProvider
      ? (this.core.provider as any).connection?.url || null
      : null;
  }
}
