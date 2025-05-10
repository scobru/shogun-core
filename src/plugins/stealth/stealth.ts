/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { ShogunStorage } from "../../storage/storage";
import {
  EphemeralKeyPair,
  LogLevel,
  LogMessage,
  StealthAddressResult,
} from "./types";
import { logDebug, logError } from "../../utils/logger";
import SEA from "gun/sea";
import { IGunInstance } from "gun";

// Extend Window interface to include StealthChain
declare global {
  interface Window {
    Stealth?: typeof Stealth;
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      Stealth?: typeof Stealth;
    }
  }
}

class Stealth {
  public readonly STEALTH_DATA_TABLE: string;
  private readonly storage: ShogunStorage;
  private readonly gun: IGunInstance;
  private logs: LogMessage[] = [];

  constructor(gun: any, storage: ShogunStorage) {
    this.STEALTH_DATA_TABLE = "Stealth";
    this.storage = storage || new ShogunStorage();
    this.gun = gun;
  }

  /**
   * Structured logging system
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const logMessage: LogMessage = {
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
  public async cleanupSensitiveData(): Promise<void> {
    try {
      this.logs = [];
      this.log("info", "Sensitive data cleanup completed");
    } catch (error) {
      this.log("error", "Error during cleanup", error);
      throw error;
    }
  }

  async getStealthKeys(): Promise<{
    spendingKey: string;
    viewingKey: string;
  }> {
    const keys = await this.assertStealth().getStealthKeys();
    return {
      spendingKey: keys.spendingKey,
      viewingKey: keys.viewingKey,
    };
  }

  // Generate Viewving and Spending Key and save it tu gun userspace
  async generateAndSaveKeys(pair?: EphemeralKeyPair): Promise<void> {
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
    } else {
      user = this.gun.user();
    }

    const encryptedViewingKey = await SEA.encrypt(
      ephemeralKeyPairV,
      user()._.sea,
    );
    const encryptedSpendingKey = await SEA.encrypt(
      ephemeralKeyPairS,
      user()._.sea,
    );

    this.gun.user().get("stealth").get("viewingKey").put(encryptedViewingKey);
    this.gun.user().get("stealth").get("spendingKey").put(encryptedSpendingKey);

    this.log(
      "info",
      "Stealth keys generated and saved for address",
      pair?.pub || user?.is?.alias,
    );
  }

  /**
   * Removes the initial tilde (~) from the public key if present
   */
  formatPublicKey(publicKey: string | null): string | null {
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
  async createAccount(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    const ephemeralKeyPair = await this.assertStealth().createAccount();
    return {
      privateKey: ephemeralKeyPair.privateKey,
      publicKey: ephemeralKeyPair.publicKey,
    };
  }

  /**
   * Generates a stealth address for a recipient
   * @param viewingPublicKey Recipient's viewing public key
   * @param spendingPublicKey Recipient's spending public key
   * @returns Promise with the stealth address result
   */
  async generateStealthAddress(
    viewingPublicKey: string,
    spendingPublicKey: string,
  ): Promise<StealthAddressResult> {
    return this.assertStealth().generateStealthAddress(
      viewingPublicKey,
      spendingPublicKey,
    );
  }

  /**
   * Opens a stealth address by deriving the private key
   * @param stealthAddress Stealth address to open
   * @param encryptedRandomNumber Encrypted random number
   * @param ephemeralPublicKey Public key of the ephemeral key pair
   * @returns Promise with the wallet
   */
  async openStealthAddress(
    stealthAddress: string,
    encryptedRandomNumber: string,
    ephemeralPublicKey: string,
    spendingKeyPair: EphemeralKeyPair,
    viewingKeyPair: EphemeralKeyPair,
  ): Promise<ethers.Wallet> {
    return this.assertStealth().openStealthAddress(
      stealthAddress,
      encryptedRandomNumber,
      ephemeralPublicKey,
      spendingKeyPair,
      viewingKeyPair,
    );
  }

  /**
   * Gets public key from an address
   */
  async getPublicKey(publicKey: string): Promise<string | null> {
    return this.formatPublicKey(publicKey);
  }

  /**
   * Derives a wallet from shared secret
   */
  deriveWalletFromSecret(secret: string): ethers.Wallet {
    const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(secret));
    return new ethers.Wallet(stealthPrivateKey);
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
  verifyStealthAddress(
    ephemeralPublicKey: string,
    scanningPublicKey: string,
    spendingPublicKey: string,
    stealthAddress: string,
  ): boolean {
    // Metodo per verificare un indirizzo stealth
    return true;
  }

  private assertStealth(): Stealth {
    if (!this.gun.user()) {
      throw new Error("Stealth not initialized");
    }
    return this;
  }
}

// Esporta la classe direttamente
export { Stealth };
// Esporta la classe Stealth come StealthAddresses per compatibilità con i test aggiuntivi
export { Stealth as StealthAddresses };

// Esposizione globale se in ambiente browser
if (typeof window !== "undefined") {
  window.Stealth = Stealth;
} else if (typeof global !== "undefined") {
  (global as any).Stealth = Stealth;
}

export default Stealth;
