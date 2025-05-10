import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Stealth } from "./stealth";
import {
  StealthAddressResult,
  StealthData,
  EphemeralKeyPair,
  StealthPluginInterface,
} from "./types";
import { log } from "../../utils/logger";
import { ethers } from "ethers";

/**
 * Plugin per la gestione delle funzionalità Stealth in ShogunCore
 */
export class StealthPlugin
  extends BasePlugin
  implements StealthPluginInterface
{
  name = "stealth";
  version = "1.0.0";
  description = "Provides stealth address functionality for ShogunCore";

  private stealth: Stealth | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    if (!core.storage) {
      throw new Error("Storage dependency not available in core");
    }

    if (!core.gun) {
      throw new Error("Gun dependency not available in core");
    }

    // Inizializziamo il modulo Stealth
    this.stealth = new Stealth(core.gun, core.storage);

    log("Stealth plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    this.stealth = null;
    super.destroy();
    log("Stealth plugin destroyed");
  }

  /**
   * Assicura che il modulo Stealth sia inizializzato
   * @private
   */
  private assertStealth(): Stealth {
    this.assertInitialized();
    if (!this.stealth) {
      throw new Error("Stealth module not initialized");
    }
    return this.stealth;
  }

  /**
   * @inheritdoc
   */
  async generateEphemeralKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    return this.assertStealth().createAccount();
  }

  /**
   * @inheritdoc
   */
  async generateStealthAddress(
    publicKey: string,
    ephemeralPrivateKey: string,
  ): Promise<StealthAddressResult> {
    return this.assertStealth().generateStealthAddress(
      publicKey,
      ephemeralPrivateKey,
    );
  }

  /**
   * @inheritdoc
   */
  async scanStealthAddresses(
    addresses: StealthData[],
    privateKeyOrSpendKey: string,
  ): Promise<StealthData[]> {
    // Implementazione per compatibilità
    console.warn(
      "scanStealthAddresses è deprecato. Usa openStealthAddress per ogni indirizzo.",
    );
    return Promise.resolve([]);
  }

  /**
   * @inheritdoc
   */
  async isStealthAddressMine(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<boolean> {
    // Implementazione per compatibilità
    console.warn("isStealthAddressMine è deprecato");
    return Promise.resolve(false);
  }

  /**
   * @inheritdoc
   */
  async getStealthPrivateKey(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<string> {
    // Implementazione per compatibilità
    console.warn("getStealthPrivateKey è deprecato. Usa openStealthAddress");
    return Promise.resolve("0x" + "0".repeat(64));
  }

  /**
   * @inheritdoc
   */
  async openStealthAddress(
    stealthAddress: string,
    encryptedRandomNumber: string,
    ephemeralPublicKey: string,
  ): Promise<ethers.Wallet> {
    // Ottieni le chiavi dell'utente
    const keys = await this.getStealthKeys();

    // Converti le chiavi stringhe in oggetti EphemeralKeyPair
    const viewingKeyPair: EphemeralKeyPair = {
      pub: keys.viewingKey,
      priv: keys.viewingKey,
      epub: keys.viewingKey,
      epriv: keys.viewingKey,
    };

    const spendingKeyPair: EphemeralKeyPair = {
      pub: keys.spendingKey,
      priv: keys.spendingKey,
      epub: keys.spendingKey,
      epriv: keys.spendingKey,
    };

    return this.assertStealth().openStealthAddress(
      stealthAddress,
      encryptedRandomNumber,
      ephemeralPublicKey,
      spendingKeyPair,
      viewingKeyPair,
    );
  }

  /**
   * @inheritdoc
   */
  async getStealthKeys(): Promise<{
    spendingKey: string;
    viewingKey: string;
  }> {
    return this.assertStealth().getStealthKeys();
  }
}
