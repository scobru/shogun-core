import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Stealth } from "./stealth";
import {
  StealthAddressResult,
  StealthData,
  EphemeralKeyPair,
  StealthPluginInterface
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

    // Inizializziamo il modulo Stealth
    this.stealth = new Stealth(core.storage);

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
    return this.assertStealth().generateEphemeralKeyPair();
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
    return this.assertStealth().scanStealthAddresses(
      addresses,
      privateKeyOrSpendKey,
    );
  }

  /**
   * @inheritdoc
   */
  async isStealthAddressMine(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<boolean> {
    return this.assertStealth().isStealthAddressMine(
      stealthData,
      privateKeyOrSpendKey,
    );
  }

  /**
   * @inheritdoc
   */
  async getStealthPrivateKey(
    stealthData: StealthData,
    privateKeyOrSpendKey: string,
  ): Promise<string> {
    return this.assertStealth().getStealthPrivateKey(
      stealthData,
      privateKeyOrSpendKey,
    );
  }

  /**
   * @inheritdoc
   */
  async openStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string,
    pair: EphemeralKeyPair,
  ): Promise<ethers.Wallet> {
    return this.assertStealth().openStealthAddress(
      stealthAddress,
      ephemeralPublicKey,
      pair,
    );
  }
}
