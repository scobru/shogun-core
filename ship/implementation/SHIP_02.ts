/**
 * SHIP-02: Ethereum HD Wallet Implementation
 *
 * Full port of shogun-BIP44 with SHIP-00 derivation.
 * Extends SHIP-00 to provide deterministic Ethereum address derivation.
 *
 * Based on:
 * - SHIP-00 for identity foundation (replaces mnemonic dependency)
 * - BIP-32 for hierarchical deterministic wallets
 * - BIP-44 for multi-account hierarchy  
 * - Ethers.js for Ethereum operations
 * - Gun/SEA for encrypted storage
 *
 * Features:
 * ✅ Deterministic address derivation from SHIP-00 identity (no mnemonics needed)
 * ✅ BIP-44 compliant HD wallet support
 * ✅ Multiple address management
 * ✅ Transaction signing
 * ✅ Message signing and verification
 * ✅ Gun persistence with encryption
 * ✅ Export/import functionality
 * ✅ Address book management
 * 
 * Note: Stealth addresses moved to SHIP-03
 */

import type { ISHIP_00 } from "../interfaces/ISHIP_00";
import type {
  ISHIP_02,
  DerivationResult,
  StealthAddressResult,
  SignatureResult,
  Transaction,
  SignedTransaction,
  AddressEntry,
  AddressBook,
  SHIP_02_Config,
  WalletInfo,
  WalletPath,
} from "../interfaces/ISHIP_02";
import { ethers } from "ethers";

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-02 Reference Implementation
 *
 * Provides Ethereum address derivation on top of SHIP-00 identity.
 * All addresses are deterministically derived from the user's SHIP-00 keypair.
 */
class SHIP_02 implements ISHIP_02 {
  private identity: ISHIP_00;
  private config: SHIP_02_Config;
  private initialized: boolean = false;

  // GunDB Node Names for SHIP-02 storage
  public static readonly NODES = {
    ADDRESS_BOOK: "ship02_addressbook",
    MNEMONIC: "ship02_mnemonic",
    WALLET_PATHS: "ship02_wallet_paths",
  } as const;

  // Master seed derived from SHIP-00 identity OR from mnemonic
  private masterSeed: string | null = null;
  
  // Optional BIP-39 mnemonic (for MetaMask compatibility)
  private mnemonic: string | null = null;
  
  // HD Wallet for derivation
  private hdWallet: ethers.HDNodeWallet | null = null;

  // Cache of derived addresses
  private addressCache: Map<string, AddressEntry> = new Map();

  // Cache of wallets by address
  private walletCache: Map<string, ethers.HDNodeWallet | ethers.Wallet> =
    new Map();

  // Address index counter
  private nextIndex: number = 0;

  // Persistence flag
  private persistToGun: boolean = false;

  // RPC Provider for network operations
  private provider: ethers.JsonRpcProvider | null = null;
  
  // Main wallet (derived from Gun user keys, not BIP-44)
  private mainWallet: ethers.Wallet | null = null;

  // Wallet paths storage (for createWallet/loadWallets API)
  private walletPaths: { [address: string]: WalletPath } = {};

  constructor(identity: ISHIP_00, config: SHIP_02_Config = {}) {
    this.identity = identity;
    this.config = {
      defaultCoinType: config.defaultCoinType ?? 60, // Ethereum
      defaultAccount: config.defaultAccount ?? 0,
      enableStealth: config.enableStealth ?? true,
      customPathPrefix: config.customPathPrefix,
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async initialize(useMnemonic: boolean = false): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get SHIP-00 keypair
      const keyPair = this.identity.getKeyPair();
      if (!keyPair || !keyPair.epriv || !keyPair.epub) {
        throw new Error("SHIP-00 identity not authenticated");
      }

      if (useMnemonic) {
        // Option 1: Use BIP-39 mnemonic (MetaMask compatible)
        console.log("🔐 Initializing with BIP-39 mnemonic...");
        
        // Try to load existing mnemonic
        this.mnemonic = await this.loadMnemonicFromGun();
        
        if (!this.mnemonic) {
          // Generate new mnemonic
          this.mnemonic = this.generateNewMnemonic();
          await this.saveMnemonicToGun(this.mnemonic);
          console.log("✅ New BIP-39 mnemonic generated and saved");
        } else {
          console.log("✅ Existing mnemonic loaded");
        }

        // Create HD wallet from mnemonic
        this.hdWallet = ethers.HDNodeWallet.fromPhrase(this.mnemonic);
        console.log("✅ HD wallet initialized from mnemonic (MetaMask compatible)");
      } else {
        // Option 2: Derive from SHIP-00 identity (default, no mnemonic needed)
        console.log("🔐 Deriving wallet from SHIP-00 identity...");
        
        // Derive master seed from SHIP-00 keypair
        this.masterSeed = await this.deriveMasterSeed(keyPair);

        // Create HD wallet from seed
        this.hdWallet = ethers.HDNodeWallet.fromSeed(
          ethers.getBytes("0x" + this.masterSeed)
        );
        
        console.log("✅ HD wallet derived from SHIP-00 (no mnemonic needed)");
      }

      this.initialized = true;
    } catch (error: any) {
      throw new Error(`SHIP-02 initialization failed: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ========================================================================
  // BASIC DERIVATION
  // ========================================================================

  async deriveEthereumAddress(
    path: string = "m/44'/60'/0'/0/0"
  ): Promise<DerivationResult> {
    try {
      this.ensureInitialized();

      // Verify HD wallet is available
      if (!this.hdWallet) {
        throw new Error("HD wallet not initialized. Call initialize() first.");
      }

      // Derive child wallet from HD node
      const childWallet = this.hdWallet.derivePath(path);
      const address = childWallet.address;
      const publicKey = childWallet.publicKey;

      // Cache the wallet and address
      this.walletCache.set(address, childWallet);

      const entry: AddressEntry = {
        address,
        path,
        publicKey,
        index: this.nextIndex++,
        createdAt: Date.now(),
      };

      this.addressCache.set(address, entry);

      return {
        success: true,
        address,
        path,
        publicKey,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deriveMultipleAddresses(
    count: number,
    startIndex: number = 0
  ): Promise<DerivationResult[]> {
    const results: DerivationResult[] = [];

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const path = this.buildBIP44Path(
        this.config.defaultCoinType!,
        this.config.defaultAccount!,
        0,
        index
      );

      const result = await this.deriveEthereumAddress(path);
      results.push(result);
    }

    return results;
  }

  async getPrimaryAddress(): Promise<string> {
    this.ensureInitialized();

    // Verify HD wallet is available
    if (!this.hdWallet) {
      throw new Error("HD wallet not initialized. Please call initialize() before deriving addresses.");
    }

    // Check if primary address already exists in cache
    const primary = Array.from(this.addressCache.values()).find(
      (entry) => entry.index === 0
    );

    if (primary) {
      return primary.address;
    }

    // Derive primary address (index 0)
    const result = await this.deriveEthereumAddress();

    if (!result.success || !result.address) {
      const errorDetail = result.error || "Unknown error";
      throw new Error(`Failed to derive primary address: ${errorDetail}`);
    }

    return result.address;
  }

  // ========================================================================
  // BIP-44 STANDARD DERIVATION
  // ========================================================================

  async deriveBIP44Address(
    coinType: number = 60,
    account: number = 0,
    change: number = 0,
    index: number = 0
  ): Promise<DerivationResult> {
    const path = this.buildBIP44Path(coinType, account, change, index);
    return this.deriveEthereumAddress(path);
  }

  async deriveMultipleAccounts(
    accountCount: number
  ): Promise<DerivationResult[]> {
    const results: DerivationResult[] = [];

    for (let i = 0; i < accountCount; i++) {
      const result = await this.deriveBIP44Address(
        this.config.defaultCoinType,
        i,
        0,
        0
      );
      results.push(result);
    }

    return results;
  }

  // ========================================================================
  // STEALTH ADDRESSES - DEPRECATED
  // ========================================================================
  // Note: Basic stealth functionality moved to SHIP-03
  // These methods are kept for backward compatibility

  /**
   * @deprecated Use SHIP-03 for dual-key stealth addresses
   */
  async generateStealthAddress(
    recipientPublicKey?: string
  ): Promise<StealthAddressResult> {
    console.warn("⚠️  DEPRECATED: Use SHIP-03 for stealth addresses");
    return {
      success: false,
      error:
        "Stealth addresses moved to SHIP-03. Please use SHIP-03 for dual-key stealth functionality.",
    };
  }

  /**
   * @deprecated Use SHIP-03 for stealth operations
   */
  async deriveSharedSecret(publicKey: string): Promise<string> {
    console.warn("⚠️  DEPRECATED: Use SHIP-03 for stealth operations");
    throw new Error("Use SHIP-03 for stealth operations");
  }

  /**
   * @deprecated Use SHIP-03 for stealth operations
   */
  async isStealthAddress(address: string): Promise<boolean> {
    console.warn("⚠️  DEPRECATED: Use SHIP-03 for stealth operations");
    return false;
  }

  // ========================================================================
  // KEY MANAGEMENT
  // ========================================================================

  async getPrivateKeyForAddress(address: string): Promise<string> {
    this.ensureInitialized();

    const wallet = this.walletCache.get(address);
    if (!wallet) {
      throw new Error(`No wallet found for address: ${address}`);
    }

    return wallet.privateKey;
  }

  async getPublicKeyForAddress(address: string): Promise<string> {
    this.ensureInitialized();

    const entry = this.addressCache.get(address);
    if (!entry) {
      throw new Error(`No address found: ${address}`);
    }

    return entry.publicKey;
  }

  async getPathForAddress(address: string): Promise<string | undefined> {
    const entry = this.addressCache.get(address);
    return entry?.path;
  }

  // ========================================================================
  // TRANSACTION SIGNING
  // ========================================================================

  async signTransaction(
    tx: Transaction,
    address: string
  ): Promise<SignatureResult> {
    try {
      this.ensureInitialized();

      const wallet = this.walletCache.get(address);
      if (!wallet) {
        return {
          success: false,
          error: `No wallet found for address: ${address}`,
        };
      }

      // Sign the transaction
      const signedTx = await wallet.signTransaction(tx);
      const parsedTx = ethers.Transaction.from(signedTx);

      const result: SignedTransaction = {
        raw: signedTx,
        hash: parsedTx.hash!,
        from: wallet.address,
        to: tx.to,
        value: tx.value?.toString() || "0",
        data: tx.data || "0x",
        chainId: tx.chainId || 1,
        nonce: tx.nonce || 0,
        gasLimit: tx.gasLimit?.toString() || "21000",
        signature: {
          r: parsedTx.signature!.r,
          s: parsedTx.signature!.s,
          v: parsedTx.signature!.v,
        },
      };

      return {
        success: true,
        signature: parsedTx.signature!.serialized,
        signedTransaction: signedTx,
        txHash: parsedTx.hash!,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send transaction to Ethereum network
   * Combines signing + broadcasting in one step
   */
  async sendTransaction(
    tx: Transaction,
    address: string,
    waitForConfirmation: boolean = false
  ): Promise<{
    success: boolean;
    txHash?: string;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }> {
    try {
      this.ensureInitialized();

      // Verify RPC provider is configured
      if (!this.provider) {
        return {
          success: false,
          error: "RPC provider not configured. Call setRpcUrl() first.",
        };
      }

      // Get wallet for address
      const wallet = this.walletCache.get(address);
      if (!wallet) {
        return {
          success: false,
          error: `No wallet found for address: ${address}`,
        };
      }

      console.log(`📤 Sending transaction from ${address}...`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Value: ${tx.value ? ethers.formatEther(tx.value) : "0"} ETH`);

      // Connect wallet to provider
      const connectedWallet = wallet.connect(this.provider);

      // Send transaction (ethers handles signing + broadcasting)
      const txResponse = await connectedWallet.sendTransaction(tx);
      
      console.log(`✅ Transaction sent: ${txResponse.hash}`);
      console.log(`📍 View on Etherscan: https://etherscan.io/tx/${txResponse.hash}`);

      // Wait for confirmation if requested
      if (waitForConfirmation) {
        console.log(`⏳ Waiting for confirmation...`);
        const receipt = await txResponse.wait();
        
        console.log(`✅ Transaction confirmed in block ${receipt!.blockNumber}`);
        console.log(`   Gas used: ${receipt!.gasUsed.toString()}`);
        
        return {
          success: true,
          txHash: txResponse.hash,
          receipt: receipt!,
        };
      }

      return {
        success: true,
        txHash: txResponse.hash,
      };
    } catch (error: any) {
      console.error("❌ Transaction failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async signMessage(
    message: string | Uint8Array,
    address: string
  ): Promise<string> {
    this.ensureInitialized();

    const wallet = this.walletCache.get(address);
    if (!wallet) {
      throw new Error(`No wallet found for address: ${address}`);
    }

    if (typeof message === "string") {
      return wallet.signMessage(message);
    } else {
      return wallet.signMessage(message);
    }
  }

  async verifySignature(
    message: string | Uint8Array,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      let recoveredAddress: string;

      if (typeof message === "string") {
        recoveredAddress = ethers.verifyMessage(message, signature);
      } else {
        recoveredAddress = ethers.verifyMessage(message, signature);
      }

      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  // ========================================================================
  // ADDRESS MANAGEMENT
  // ========================================================================

  async getAllAddresses(): Promise<AddressEntry[]> {
    return Array.from(this.addressCache.values()).sort(
      (a, b) => a.index - b.index
    );
  }

  async getAddressByIndex(index: number): Promise<AddressEntry | undefined> {
    return Array.from(this.addressCache.values()).find(
      (entry) => entry.index === index
    );
  }

  async setAddressLabel(address: string, label: string): Promise<void> {
    const entry = this.addressCache.get(address);
    if (entry) {
      entry.label = label;
      this.addressCache.set(address, entry);
    }
  }

  async exportAddressBook(): Promise<AddressBook> {
    this.ensureInitialized();

    const addressBook: AddressBook = {
      addresses: await this.getAllAddresses(),
      masterPublicKey: this.hdWallet!.publicKey,
      derivationMethod: "bip44",
    };

    // Optionally save to Gun for backup
    if (this.persistToGun) {
      await this.saveAddressBookToGun(addressBook);
    }

    return addressBook;
  }

  async importAddressBook(addressBook: AddressBook): Promise<void> {
    this.ensureInitialized();

    // Verify master public key matches
    if (addressBook.masterPublicKey !== this.hdWallet!.publicKey) {
      throw new Error("Address book master public key mismatch");
    }

    // Re-derive all addresses from the book
    for (const entry of addressBook.addresses) {
      if (entry.path.startsWith("stealth/")) {
        // Skip stealth addresses (moved to SHIP-03)
        console.warn(`Skipping stealth address: ${entry.address}`);
        continue;
      }

      await this.deriveEthereumAddress(entry.path);

      if (entry.label) {
        await this.setAddressLabel(entry.address, entry.label);
      }
    }

    console.log(`✅ Imported ${addressBook.addresses.length} addresses`);
  }

  /**
   * Enable persistence to Gun database
   */
  enableGunPersistence(): void {
    this.persistToGun = true;
    console.log("✅ Gun persistence enabled for SHIP-02");
  }

  /**
   * Disable persistence to Gun database
   */
  disableGunPersistence(): void {
    this.persistToGun = false;
    console.log("✅ Gun persistence disabled for SHIP-02");
  }

  /**
   * Save address book to Gun (private storage)
   */
  private async saveAddressBookToGun(addressBook: AddressBook): Promise<void> {
    try {
      // Access Gun through identity
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available, skipping persistence");
        return;
      }

      const user = gun.user();
      if (!user || !user.is) {
        console.warn("User not authenticated on Gun");
        return;
      }

      // Save encrypted addressbook
      await user.get(SHIP_02.NODES.ADDRESS_BOOK).put(JSON.stringify(addressBook));
      console.log("✅ Address book saved to Gun");
    } catch (error) {
      console.error("Error saving address book to Gun:", error);
    }
  }

  /**
   * Load address book from Gun
   */
  async loadAddressBookFromGun(): Promise<AddressBook | null> {
    try {
      this.ensureInitialized();

      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available");
        return null;
      }

      const user = gun.user();
      if (!user || !user.is) {
        console.warn("User not authenticated on Gun");
        return null;
      }

      // Load addressbook
      const data = await new Promise<string | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 5000);

        user.get(SHIP_02.NODES.ADDRESS_BOOK).once((data: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(data || null);
          }
        });
      });

      if (!data) {
        console.log("No address book found on Gun");
        return null;
      }

      const addressBook = JSON.parse(data) as AddressBook;
      console.log("✅ Address book loaded from Gun");

      return addressBook;
    } catch (error) {
      console.error("Error loading address book from Gun:", error);
      return null;
    }
  }

  /**
   * Sync local cache with Gun storage
   */
  async syncWithGun(): Promise<void> {
    this.ensureInitialized();

    // Try to load from Gun first
    const remoteBook = await this.loadAddressBookFromGun();

    if (remoteBook) {
      // Merge remote addresses with local
      await this.importAddressBook(remoteBook);
    }

    // Save current state back to Gun
    if (this.persistToGun) {
      await this.exportAddressBook();
    }

    console.log("✅ Synced with Gun");
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  async ownsAddress(address: string): Promise<boolean> {
    return this.addressCache.has(address);
  }

  async getMasterPublicKey(): Promise<string> {
    this.ensureInitialized();
    return this.hdWallet!.publicKey;
  }

  async clearCache(): Promise<void> {
    this.addressCache.clear();
    this.walletCache.clear();
    this.walletPaths = {};
    this.nextIndex = 0;
    this.initialized = false;
    this.masterSeed = null;
    this.hdWallet = null;
    this.mainWallet = null;
    this.provider = null;
    console.log("✅ SHIP-02 cache cleared");
  }

  // ========================================================================
  // ADVANCED FEATURES (from shogun-BIP44)
  // ========================================================================

  // ========================================================================
  // MNEMONIC MANAGEMENT (BIP-39)
  // ========================================================================

  /**
   * Generate new BIP-39 mnemonic (12 words)
   * Compatible with MetaMask and other wallets
   */
  generateNewMnemonic(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic?.phrase || "";
  }

  /**
   * Get addresses that would be derived from a mnemonic (standard BIP-44)
   * Useful to verify compatibility with MetaMask
   */
  getStandardBIP44Addresses(mnemonic: string, count: number = 5): string[] {
    const addresses: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const path = `m/44'/60'/0'/0/${i}`;
      const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
      addresses.push(wallet.address);
    }
    
    return addresses;
  }

  /**
   * Get current mnemonic (if using mnemonic mode)
   */
  async getMnemonic(): Promise<string | null> {
    return this.mnemonic;
  }

  /**
   * Get user's master mnemonic from Gun or localStorage
   * Used by createWallet/loadWallets for frontend compatibility
   */
  async getUserMasterMnemonic(): Promise<string | null> {
    try {
      // First check if already in memory
      if (this.mnemonic) {
        return this.mnemonic;
      }

      // Try to load from Gun
      const gunMnemonic = await this.loadMnemonicFromGun();
      if (gunMnemonic) {
        this.mnemonic = gunMnemonic;
        return gunMnemonic;
      }

      // Try localStorage as fallback
      if (typeof localStorage !== "undefined") {
        const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;
        const encryptedMnemonic = localStorage.getItem(storageKey);

        if (encryptedMnemonic) {
          const decrypted = await this.decryptSensitiveData(encryptedMnemonic);
          if (decrypted) {
            this.mnemonic = decrypted;
            // Sync back to Gun
            await this.saveMnemonicToGun(decrypted);
            return decrypted;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error retrieving master mnemonic:", error);
      return null;
    }
  }

  /**
   * Export mnemonic (encrypted)
   */
  async exportMnemonic(): Promise<string | null> {
    if (!this.mnemonic) {
      return null;
    }

    return await this.encryptSensitiveData(this.mnemonic);
  }

  /**
   * Import mnemonic and re-initialize wallet
   */
  async importMnemonic(encryptedMnemonic: string): Promise<void> {
    const decrypted = await this.decryptSensitiveData(encryptedMnemonic);
    
    if (!decrypted) {
      throw new Error("Failed to decrypt mnemonic");
    }

    // Validate mnemonic
    const words = decrypted.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      throw new Error("Invalid mnemonic (must be 12 or 24 words)");
    }

    this.mnemonic = decrypted;
    
    // Re-initialize with mnemonic
    this.initialized = false;
    await this.initialize(true);

    console.log("✅ Mnemonic imported and wallet re-initialized");
  }

  /**
   * Save mnemonic to Gun (encrypted)
   */
  private async saveMnemonicToGun(mnemonic: string): Promise<void> {
    try {
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) return;

      const user = gun.user();
      if (!user || !user.is) return;

      const encrypted = await this.encryptSensitiveData(mnemonic);
      await user.get(SHIP_02.NODES.MNEMONIC).put(encrypted);
      
      console.log("✅ Mnemonic saved to Gun (encrypted)");
    } catch (error) {
      console.error("Error saving mnemonic:", error);
    }
  }

  /**
   * Load mnemonic from Gun (encrypted)
   */
  private async loadMnemonicFromGun(): Promise<string | null> {
    try {
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) return null;

      const user = gun.user();
      if (!user || !user.is) return null;

      const encrypted = await new Promise<string | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 5000);

        user.get(SHIP_02.NODES.MNEMONIC).once((data: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(data || null);
          }
        });
      });

      if (!encrypted) return null;

      return await this.decryptSensitiveData(encrypted);
    } catch (error) {
      console.error("Error loading mnemonic:", error);
      return null;
    }
  }

  /**
   * Get storage identifier for current user
   */
  getStorageUserIdentifier(): string {
    const currentUser = this.identity.getCurrentUser();
    const pub = currentUser?.pub;
    if (pub) {
      return pub.substring(0, 12); // Use part of the public key
    }
    return "guest"; // Identifier for unauthenticated users
  }

  /**
   * Encrypt sensitive data using SEA
   */
  async encryptSensitiveData(text: string): Promise<string> {
    try {
      const crypto = (this.identity as any).shogun?.db?.crypto;
      const keyPair = this.identity.getKeyPair();

      if (!crypto || !keyPair) {
        throw new Error("Crypto or keypair not available");
      }

      // Encrypt with user's keys
      const encrypted = await crypto.encrypt(text, keyPair);

      if (!encrypted) {
        throw new Error("Encryption failed");
      }

      return JSON.stringify(encrypted);
    } catch (error: any) {
      console.error("Error encrypting data:", error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data using SEA
   */
  async decryptSensitiveData(encryptedText: string): Promise<string | null> {
    try {
      const crypto = (this.identity as any).shogun?.db?.crypto;
      const keyPair = this.identity.getKeyPair();

      if (!crypto || !keyPair) {
        throw new Error("Crypto or keypair not available");
      }

      const encrypted = JSON.parse(encryptedText);
      const decrypted = await crypto.decrypt(encrypted, keyPair);

      if (!decrypted) {
        throw new Error("Decryption failed");
      }

      return decrypted;
    } catch (error) {
      console.error("Error decrypting data:", error);
      return null;
    }
  }

  /**
   * Export master seed (encrypted)
   * SECURITY: Handle with extreme care!
   */
  async exportMasterSeed(): Promise<string> {
    this.ensureInitialized();

    if (!this.masterSeed) {
      throw new Error("Master seed not available");
    }

    // Encrypt the seed
    return await this.encryptSensitiveData(this.masterSeed);
  }

  /**
   * Export all wallet data (encrypted)
   */
  async exportWalletData(): Promise<string> {
    this.ensureInitialized();

    const data = {
      addressBook: await this.exportAddressBook(),
      masterPublicKey: this.hdWallet!.publicKey,
      timestamp: Date.now(),
    };

    return await this.encryptSensitiveData(JSON.stringify(data));
  }

  /**
   * Import wallet data (encrypted)
   */
  async importWalletData(encryptedData: string): Promise<void> {
    this.ensureInitialized();

    const decrypted = await this.decryptSensitiveData(encryptedData);
    if (!decrypted) {
      throw new Error("Failed to decrypt wallet data");
    }

    const data = JSON.parse(decrypted);

    // Verify master public key matches
    if (data.masterPublicKey !== this.hdWallet!.publicKey) {
      throw new Error("Master public key mismatch - wrong identity");
    }

    // Import address book
    await this.importAddressBook(data.addressBook);

    console.log("✅ Wallet data imported successfully");
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("SHIP-02 not initialized. Call initialize() first.");
    }
  }

  /**
   * Derive master seed from SHIP-00 keypair
   */
  private async deriveMasterSeed(keyPair: any): Promise<string> {
    // Create deterministic seed from SHIP-00 keypair
    // Combine public and private encryption keys
    const seedMaterial = keyPair.epub + keyPair.epriv;

    // Hash to create 32-byte seed
    const seed = ethers.keccak256(ethers.toUtf8Bytes(seedMaterial));

    // Remove 0x prefix
    return seed.slice(2);
  }

  /**
   * Build BIP-44 derivation path
   */
  private buildBIP44Path(
    coinType: number,
    account: number,
    change: number,
    index: number
  ): string {
    if (this.config.customPathPrefix) {
      return `${this.config.customPathPrefix}/${account}'/${change}/${index}`;
    }
    return `m/44'/${coinType}'/${account}'/${change}/${index}`;
  }

  // ========================================================================
  // RPC PROVIDER MANAGEMENT
  // ========================================================================

  /**
   * Set RPC provider URL
   */
  async setRpcUrl(rpcUrl: string): Promise<void> {
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log(`✅ RPC Provider configured: ${rpcUrl}`);
    } catch (error: any) {
      console.error("Error setting RPC URL:", error);
      throw new Error(`Failed to set RPC URL: ${error.message}`);
    }
  }

  /**
   * Get current RPC provider
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get signer (main wallet connected to provider)
   */
  getSigner(): ethers.Wallet {
    if (!this.provider) {
      throw new Error("Provider not configured. Call setRpcUrl() first.");
    }

    const mainWallet = this.getMainWallet();
    return mainWallet.connect(this.provider);
  }

  /**
   * Set custom signer
   */
  async setSigner(signer: ethers.Wallet): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not configured. Call setRpcUrl() first.");
    }
    // Note: The signer will use the configured provider
    console.log(`✅ Custom signer set: ${signer.address}`);
  }

  // ========================================================================
  // FRONTEND-FRIENDLY WALLET MANAGEMENT
  // ========================================================================

  /**
   * Get main wallet (derived from Gun user keys, not BIP-44)
   * This provides a consistent "main" wallet independent of HD derivation
   */
  getMainWallet(): ethers.Wallet {
    if (!this.mainWallet) {
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) {
        throw new Error("Gun not available");
      }

      const user = gun.user();
      if (!user || !user.is) {
        throw new Error("User not authenticated");
      }

      // Check SEA keys availability
      if (!user._ || !user._.sea || !user._.sea.priv || !user._.sea.pub) {
        throw new Error("Insufficient user data to generate main wallet");
      }

      // Create deterministic seed from Gun user keys
      const userSeed = user._.sea.priv;
      const userPub = user._.sea.pub;
      const userAlias = user.is.alias;
      const seed = `${userSeed}|${userPub}|${userAlias}`;

      // Generate private key from seed
      const privateKey = this.generatePrivateKeyFromString(seed);
      this.mainWallet = new ethers.Wallet(privateKey);
    }

    return this.mainWallet;
  }

  /**
   * Get main wallet credentials
   */
  getMainWalletCredentials(): { address: string; priv: string } {
    const wallet = this.getMainWallet();
    return {
      address: wallet.address,
      priv: wallet.privateKey,
    };
  }

  /**
   * Create new wallet with auto-incremented index
   * Frontend-friendly API that returns ready-to-use wallet object
   */
  async createWallet(): Promise<WalletInfo> {
    this.ensureInitialized();

    const gun = (this.identity as any).shogun?.db?.gun;
    const user = gun?.user();
    
    if (!user || !user.is) {
      throw new Error("User not authenticated");
    }

    // Get next index
    const nextIndex = Object.keys(this.walletPaths).length;
    const path = `m/44'/60'/0'/0/${nextIndex}`;

    // Get or generate mnemonic
    let mnemonic = await this.getMnemonic();
    if (!mnemonic) {
      // If no mnemonic, use SHIP-00 derived wallet
      await this.initialize(false);
      mnemonic = await this.getMnemonic();
    }

    // Derive wallet
    let wallet: ethers.HDNodeWallet;
    if (mnemonic) {
      wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
    } else {
      // Fallback: derive from HD wallet
      wallet = this.hdWallet!.derivePath(path);
    }

    // Store path
    this.walletPaths[wallet.address] = {
      path,
      created: Date.now(),
    };

    // Cache wallet
    this.walletCache.set(wallet.address, wallet);
    this.addressCache.set(wallet.address, {
      address: wallet.address,
      path,
      publicKey: wallet.publicKey,
      index: nextIndex,
      createdAt: Date.now(),
    });

    // Save to Gun
    if (this.persistToGun) {
      await this.saveWalletPathsToGun();
    }

    console.log(`✅ Created wallet #${nextIndex}: ${wallet.address}`);

    return {
      wallet,
      path,
      address: wallet.address,
      publicKey: wallet.publicKey,
      index: nextIndex,
    };
  }

  /**
   * Load all wallets from stored paths
   * Reconstructs wallet objects from mnemonic/seed and paths
   */
  async loadWallets(): Promise<WalletInfo[]> {
    this.ensureInitialized();

    const wallets: WalletInfo[] = [];
    const mnemonic = await this.getMnemonic();

    for (const [address, pathData] of Object.entries(this.walletPaths)) {
      let wallet: ethers.HDNodeWallet;

      if (mnemonic) {
        // Derive from mnemonic
        wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, pathData.path);
      } else {
        // Derive from HD wallet (SHIP-00 based)
        wallet = this.hdWallet!.derivePath(pathData.path);
      }

      wallets.push({
        wallet,
        path: pathData.path,
        address: wallet.address,
        publicKey: wallet.publicKey,
      });

      // Update caches
      this.walletCache.set(wallet.address, wallet);
    }

    console.log(`✅ Loaded ${wallets.length} wallets`);
    return wallets;
  }

  // ========================================================================
  // ADVANCED EXPORT/IMPORT
  // ========================================================================

  /**
   * Export wallet keys for all derived addresses
   */
  async exportWalletKeys(): Promise<string> {
    this.ensureInitialized();

    const walletKeys = await this.loadWallets();
    const exportData = walletKeys.map((w) => ({
      address: w.address,
      privateKey: w.wallet.privateKey,
      path: w.path,
      publicKey: w.publicKey,
    }));

    return JSON.stringify(exportData);
  }

  /**
   * Export Gun SEA keypair
   */
  async exportGunPair(): Promise<string> {
    const keyPair = this.identity.getKeyPair();
    if (!keyPair) {
      throw new Error("No keypair available");
    }

    return JSON.stringify({
      pub: keyPair.pub,
      priv: keyPair.priv,
      epub: keyPair.epub,
      epriv: keyPair.epriv,
    });
  }

  /**
   * Export all user data (mnemonic, wallets, Gun pair)
   */
  async exportAllUserData(): Promise<string> {
    this.ensureInitialized();

    const data = {
      mnemonic: await this.exportMnemonic(),
      walletKeys: await this.exportWalletKeys(),
      gunPair: await this.exportGunPair(),
      addressBook: await this.exportAddressBook(),
      masterPublicKey: this.hdWallet!.publicKey,
      timestamp: Date.now(),
    };

    // Encrypt the entire backup
    return await this.encryptSensitiveData(JSON.stringify(data));
  }

  /**
   * Import wallet keys and restore wallets
   */
  async importWalletKeys(walletsData: string): Promise<number> {
    this.ensureInitialized();

    const wallets = JSON.parse(walletsData);
    let count = 0;

    for (const walletData of wallets) {
      // Store path
      this.walletPaths[walletData.address] = {
        path: walletData.path,
        created: Date.now(),
      };

      // Re-derive wallet
      await this.deriveEthereumAddress(walletData.path);
      
      count++;
    }

    // Save to Gun
    if (this.persistToGun) {
      await this.saveWalletPathsToGun();
    }

    console.log(`✅ Imported ${count} wallet keys`);
    return count;
  }

  /**
   * Import Gun SEA keypair
   * Note: This is a placeholder for compatibility
   * SHIP-02 doesn't manage Gun keys directly (use SHIP-00 for that)
   */
  async importGunPair(pairData: string): Promise<boolean> {
    try {
      const pair = JSON.parse(pairData);
      
      // Validate Gun pair structure
      if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        throw new Error("Invalid Gun pair structure");
      }

      console.log("⚠️  Gun pair import detected");
      console.log("💡 Gun keypair management is handled by SHIP-00");
      console.log("💡 Use identity.importKeyPair() instead for Gun key restoration");
      
      return true;
    } catch (error) {
      console.error("Error importing Gun pair:", error);
      return false;
    }
  }

  /**
   * Import all user data from backup
   */
  async importAllUserData(
    backupData: string,
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
    try {
      // Decrypt backup
      const decrypted = await this.decryptSensitiveData(backupData);
      if (!decrypted) {
        throw new Error("Failed to decrypt backup data");
      }

      const data = JSON.parse(decrypted);
      const result = {
        success: true,
        mnemonicImported: false,
        walletsImported: 0,
        gunPairImported: false,
      };

      // Import mnemonic
      if (options.importMnemonic && data.mnemonic) {
        try {
          const mnemonicDecrypted = await this.decryptSensitiveData(data.mnemonic);
          if (mnemonicDecrypted) {
            await this.importMnemonic(mnemonicDecrypted);
            result.mnemonicImported = true;
          }
        } catch (error) {
          console.error("Error importing mnemonic:", error);
        }
      }

      // Import wallet keys
      if (options.importWallets && data.walletKeys) {
        try {
          result.walletsImported = await this.importWalletKeys(data.walletKeys);
        } catch (error) {
          console.error("Error importing wallet keys:", error);
        }
      }

      // Import address book
      if (data.addressBook) {
        try {
          await this.importAddressBook(data.addressBook);
        } catch (error) {
          console.error("Error importing address book:", error);
        }
      }

      console.log(`✅ Import completed:`, result);
      return result;
    } catch (error: any) {
      console.error("Error importing all user data:", error);
      return {
        success: false,
        mnemonicImported: false,
        walletsImported: 0,
        gunPairImported: false,
      };
    }
  }

  // ========================================================================
  // WALLET PATH MANAGEMENT
  // ========================================================================

  /**
   * Initialize wallet paths from Gun storage
   */
  async initializeWalletPaths(): Promise<void> {
    try {
      this.walletPaths = {};
      await this.loadWalletPathsFromGun();
      await this.loadWalletPathsFromLocalStorage();

      const count = Object.keys(this.walletPaths).length;
      if (count === 0) {
        console.log("No wallet paths found, new wallets will be created when needed");
      } else {
        console.log(`✅ Initialized ${count} wallet paths`);
      }
    } catch (error: any) {
      console.error("Error initializing wallet paths:", error);
      throw new Error(`Failed to initialize wallet paths: ${error.message}`);
    }
  }

  /**
   * Save wallet paths to localStorage
   */
  async saveWalletPathsToLocalStorage(): Promise<void> {
    try {
      const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
      const pathsToSave = JSON.stringify(this.walletPaths);
      
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, pathsToSave);
        console.log(`✅ Saved ${Object.keys(this.walletPaths).length} wallet paths to localStorage`);
      }
    } catch (error) {
      console.error("Error saving wallet paths to localStorage:", error);
    }
  }

  /**
   * Load wallet paths from localStorage
   */
  async loadWalletPathsFromLocalStorage(): Promise<void> {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }

      const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
      const storedPaths = localStorage.getItem(storageKey);

      if (storedPaths) {
        const parsedPaths = JSON.parse(storedPaths);
        Object.entries(parsedPaths).forEach(([address, pathData]) => {
          if (!this.walletPaths[address]) {
            this.walletPaths[address] = pathData as WalletPath;
          }
        });
        console.log(`✅ Loaded wallet paths from localStorage`);
      }
    } catch (error) {
      console.error("Error loading wallet paths from localStorage:", error);
    }
  }

  /**
   * Save wallet paths to Gun
   */
  private async saveWalletPathsToGun(): Promise<void> {
    try {
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) return;

      const user = gun.user();
      if (!user || !user.is) return;

      await user.get(SHIP_02.NODES.WALLET_PATHS).put(JSON.stringify(this.walletPaths));
      console.log("✅ Wallet paths saved to Gun");
    } catch (error) {
      console.error("Error saving wallet paths to Gun:", error);
    }
  }

  /**
   * Load wallet paths from Gun
   */
  private async loadWalletPathsFromGun(): Promise<void> {
    try {
      const gun = (this.identity as any).shogun?.db?.gun;
      if (!gun) return;

      const user = gun.user();
      if (!user || !user.is) return;

      const data = await new Promise<string | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 5000);

        user.get(SHIP_02.NODES.WALLET_PATHS).once((data: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(data || null);
          }
        });
      });

      if (data) {
        const paths = JSON.parse(data);
        Object.entries(paths).forEach(([address, pathData]) => {
          this.walletPaths[address] = pathData as WalletPath;
        });
        console.log("✅ Wallet paths loaded from Gun");
      }
    } catch (error) {
      console.error("Error loading wallet paths from Gun:", error);
    }
  }

  // ========================================================================
  // PRIVATE KEY GENERATION (from shogun-BIP44)
  // ========================================================================

  /**
   * Generate deterministic private key from string seed
   * Uses same algorithm as shogun-BIP44 for compatibility
   */
  private generatePrivateKeyFromString(input: string): string {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      // MurmurHash3-style digest
      const digestSync = (data: Uint8Array): Uint8Array => {
        let h1 = 0xdeadbeef;
        let h2 = 0x41c6ce57;

        for (let i = 0; i < data.length; i++) {
          h1 = Math.imul(h1 ^ data[i], 2654435761);
          h2 = Math.imul(h2 ^ data[i], 1597334677);
        }

        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);

        const out = new Uint8Array(32);
        for (let i = 0; i < 4; i++) {
          out[i] = (h1 >> (8 * i)) & 0xff;
        }
        for (let i = 0; i < 4; i++) {
          out[i + 4] = (h2 >> (8 * i)) & 0xff;
        }
        for (let i = 8; i < 32; i++) {
          out[i] = (out[i % 8] ^ out[(i - 1) % 8]) & 0xff;
        }
        return out;
      };

      const hashArray = digestSync(data);
      const privateKey =
        "0x" +
        Array.from(hashArray)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      return privateKey;
    } catch (error) {
      console.error("Error generating private key:", error);
      throw new Error("Failed to generate private key from seed");
    }
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * Initialize wallet paths and test encryption system
   */
  async initializeWalletPathsAndTestEncryption(): Promise<void> {
    await this.initializeWalletPaths();
    // Note: testEncryptionSystem is UI-specific, skipped
    console.log("✅ Wallet paths initialized");
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.clearCache();
    console.log("✅ SHIP-02 cleanup completed");
  }
}

export { SHIP_02 };
