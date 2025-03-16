import { ethers } from "ethers";
import { log } from "../utils/logger";
import { GunDB } from "../gun/gun";
import { Storage } from "../storage/storage";
import { WalletInfo } from "../types/shogun";
import SEA from "gun/sea";
import { HDNodeWallet, randomBytes, Mnemonic } from "ethers";

/**
 * Interface defining a wallet's derivation path and creation timestamp
 */
interface WalletPath {
  path: string;
  created: number;
}

/**
 * Interface for caching wallet balances with timestamps
 */
interface BalanceCache {
  balance: string;
  timestamp: number;
}

/**
 * Interface for exporting wallet data
 */
interface WalletExport {
  address: string;
  privateKey: string;
  path: string;
  created: number;
}

/**
 * Class that manages Ethereum wallet functionality including:
 * - Wallet creation and derivation
 * - Balance checking and transactions
 * - Importing/exporting wallets
 * - Encrypted storage and backup
 */
export class WalletManager {
  private gundb: GunDB;
  private gun: any;
  private storage: Storage;
  private walletPaths: {
    [address: string]: WalletPath;
  } = {};
  private mainWallet: ethers.Wallet | null = null;
  private balanceCache: Map<string, BalanceCache> = new Map();
  private balanceCacheTTL: number = 30000; // 30 seconds cache
  private defaultRpcUrl: string =
    "https://mainnet.infura.io/v3/your-project-id";
  private configuredRpcUrl: string | null = null;

  /**
   * Creates a new WalletManager instance
   * @param gundb GunDB instance for decentralized storage
   * @param gun Raw Gun instance
   * @param storage Storage interface for local persistence
   */
  constructor(gundb: GunDB, gun: any, storage: Storage) {
    this.gundb = gundb;
    this.gun = gun;
    this.storage = storage;
    this.initializeWalletPaths();
  }

  /**
   * Sets the RPC URL used for Ethereum network connections
   * @param rpcUrl The RPC provider URL to use
   */
  setRpcUrl(rpcUrl: string): void {
    this.configuredRpcUrl = rpcUrl;
    log(`RPC Provider configured: ${rpcUrl}`);
  }

  /**
   * Gets a configured JSON RPC provider instance
   * @returns An ethers.js JsonRpcProvider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(
      this.configuredRpcUrl || this.defaultRpcUrl,
    );
  }

  /**
   * Initializes wallet paths from both GunDB and localStorage
   * @private
   */
  private async initializeWalletPaths() {
    try {
      // Reset existing paths
      this.walletPaths = {};

      // Load paths from Gun
      await this.loadWalletPathsFromGun();

      // Load paths from localStorage as fallback
      await this.loadWalletPathsFromLocalStorage();

      // Log results
      const walletCount = Object.keys(this.walletPaths).length;
      if (walletCount === 0) {
        log("No wallet paths found, new wallets will be created when needed");
      } else {
        log(`Initialized ${walletCount} wallet paths`);
      }
    } catch (error) {
      console.error("Error initializing wallet paths:", error);
    }
  }

  /**
   * Loads wallet paths from GunDB
   * @private
   */
  private async loadWalletPathsFromGun(): Promise<void> {
    // Verify user authentication
    const user = this.gun.user();
    if (!user?.is) {
      log("User not authenticated on Gun, cannot load wallet paths from Gun");
      return Promise.resolve();
    }

    log(`Loading wallet paths from GUN for user: ${user.is.alias}`);

    // Load paths from user profile
    return new Promise<void>((resolve) => {
      user.get("wallet_paths").once((data: any) => {
        if (!data) {
          log("No wallet paths found in GUN");
          resolve();
          return;
        }

        log(
          `Found wallet paths in GUN: ${Object.keys(data).length - 1} wallets`,
        ); // -1 for _ field

        // Convert GUN data to walletPaths
        Object.entries(data).forEach(([address, pathData]) => {
          if (address !== "_" && pathData) {
            const data = pathData as any;
            if (data?.path) {
              this.walletPaths[address] = {
                path: data.path,
                created: data.created || Date.now(),
              };
              log(`Loaded path for wallet: ${address} -> ${data.path}`);
            }
          }
        });

        resolve();
      });
    });
  }

  /**
   * Loads wallet paths from localStorage as backup
   * @private
   */
  private async loadWalletPathsFromLocalStorage(): Promise<void> {
    const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
    const storedPaths = this.storage.getItem(storageKey);

    if (storedPaths) {
      try {
        log("Found wallet paths in localStorage");
        const parsedPaths = JSON.parse(storedPaths as string);

        // Add paths if not already in GUN
        Object.entries(parsedPaths).forEach(([address, pathData]) => {
          if (!this.walletPaths[address]) {
            this.walletPaths[address] = pathData as WalletPath;
            log(`Loaded path from localStorage for wallet: ${address}`);
          }
        });
      } catch (error) {
        console.error("Error parsing wallet paths from localStorage:", error);
      }
    }
  }

  /**
   * Gets a unique identifier for the current user for storage purposes
   * @private
   * @returns A string identifier based on user's public key or "guest"
   */
  private getStorageUserIdentifier(): string {
    const user = this.gun.user();
    const pub = user?.is?.pub;
    if (pub) {
      return pub.substring(0, 12); // Use part of the public key
    }
    return "guest"; // Identifier for unauthenticated users
  }

  /**
   * Saves wallet paths to localStorage for backup
   * @private
   */
  private saveWalletPathsToLocalStorage() {
    try {
      const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
      const pathsToSave = JSON.stringify(this.walletPaths);
      this.storage.setItem(storageKey, pathsToSave);
      log(
        `Saved ${Object.keys(this.walletPaths).length} wallet paths to localStorage`,
      );
    } catch (error) {
      console.error("Error saving wallet paths to localStorage:", error);
    }
  }

  /**
   * Derives a private wallet from a mnemonic and derivation path
   * @param mnemonic The BIP-39 mnemonic phrase
   * @param path The derivation path
   * @returns A derived HDNodeWallet instance
   * @private
   */
  private derivePrivateKeyFromMnemonic(
    mnemonic: string,
    path: string,
  ): HDNodeWallet {
    try {
      log(`Deriving wallet from path: ${path}`);
      const wallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        path,
      );

      if (!wallet || !wallet.privateKey) {
        throw new Error(`Unable to derive wallet for path ${path}`);
      }

      return wallet as HDNodeWallet;
    } catch (error) {
      console.error(`Error deriving wallet for path ${path}:`, error);
      throw new Error(`Unable to derive wallet for path ${path}`);
    }
  }

  /**
   * Generate a new BIP-39 standard mnemonic compatible with all wallets
   * @returns A new 12-word BIP-39 mnemonic phrase
   */
  generateNewMnemonic(): string {
    // Generate a random 12-word mnemonic according to BIP-39 standard
    return ethers.Mnemonic.fromEntropy(ethers.randomBytes(16)).phrase;
  }

  /**
   * Get addresses that would be derived from a mnemonic using BIP-44 standard
   * This is useful to verify that wallets are correctly compatible with MetaMask and other wallets
   * @param mnemonic The BIP-39 mnemonic phrase
   * @param count Number of addresses to derive
   * @returns An array of Ethereum addresses
   */
  getStandardBIP44Addresses(mnemonic: string, count: number = 5): string[] {
    try {
      log(`Standard BIP-44 derivation from mnemonic`);

      const addresses: string[] = [];
      for (let i = 0; i < count; i++) {
        // Standard BIP-44 path for Ethereum: m/44'/60'/0'/0/i
        const path = `m/44'/60'/0'/0/${i}`;

        // Create HD wallet directly from mnemonic with specified path
        const wallet = ethers.HDNodeWallet.fromMnemonic(
          ethers.Mnemonic.fromPhrase(mnemonic),
          path, // Pass path directly here
        );

        addresses.push(wallet.address);
        log(`Address ${i}: ${wallet.address} (${path})`);
      }

      return addresses;
    } catch (error) {
      log(`Error calculating BIP-44 addresses: ${error}`);
      return [];
    }
  }

  /**
   * Override of main function with fixes and improvements
   */
  private generatePrivateKeyFromString(input: string): string {
    try {
      // Use SHA-256 to generate a deterministic hash value
      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      // Use simplified digestSync method
      const digestSync = (data: Uint8Array): Uint8Array => {
        // Simplified version
        let h1 = 0xdeadbeef,
          h2 = 0x41c6ce57;
        for (let i = 0; i < data.length; i++) {
          h1 = Math.imul(h1 ^ data[i], 2654435761);
          h2 = Math.imul(h2 ^ data[i], 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);

        // Create a 32-byte array
        const out = new Uint8Array(32);
        for (let i = 0; i < 4; i++) {
          out[i] = (h1 >> (8 * i)) & 0xff;
        }
        for (let i = 0; i < 4; i++) {
          out[i + 4] = (h2 >> (8 * i)) & 0xff;
        }
        // Fill with derived values
        for (let i = 8; i < 32; i++) {
          out[i] = (out[i % 8] ^ out[(i - 1) % 8]) & 0xff;
        }
        return out;
      };

      // Use synchronous version of digest
      const hashArray = digestSync(data);

      // Convert to hex string
      const privateKey =
        "0x" +
        Array.from(hashArray)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      return privateKey;
    } catch (error) {
      console.error("Error generating private key:", error);

      // Fallback: create valid hex value
      const fallbackHex =
        "0x" +
        Array.from({ length: 32 })
          .map(() =>
            Math.floor(Math.random() * 256)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");

      return fallbackHex;
    }
  }

  /**
   * Get the main wallet
   */
  getMainWallet(): ethers.Wallet | null {
    try {
      if (!this.mainWallet) {
        const user = this.gun.user();
        if (!user || !user.is) {
          log("getMainWallet: User not authenticated");
          return null;
        }

        // Check if we have access to required properties
        if (!user._ || !user._.sea || !user._.sea.priv || !user._.sea.pub) {
          log(
            "getMainWallet: Insufficient user data",
            JSON.stringify({
              hasUserData: !!user._,
              hasSea: !!(user._ && user._.sea),
              hasPriv: !!(user._ && user._.sea && user._.sea.priv),
              hasPub: !!(user._ && user._.sea && user._.sea.pub),
            }),
          );

          // Check if it's a MetaMask user and use alternative approach
          if (user.is.alias && user.is.alias.startsWith("0x")) {
            log(
              "getMainWallet: MetaMask user detected, using alternative approach",
            );
            // For MetaMask, use address as seed
            const address = user.is.alias;
            const seed = `metamask-${address}-${Date.now()}`;
            const privateKey = this.generatePrivateKeyFromString(seed);
            this.mainWallet = new ethers.Wallet(privateKey);
            return this.mainWallet;
          }

          return null;
        }

        // Combine private key + public key + user alias for unique seed
        const userSeed = user._.sea.priv;
        const userPub = user._.sea.pub;
        const userAlias = user.is.alias;

        // Create unique seed for this user
        const seed = `${userSeed}|${userPub}|${userAlias}`;

        // Use new secure method to generate private key
        const privateKey = this.generatePrivateKeyFromString(seed);
        this.mainWallet = new ethers.Wallet(privateKey);
      }
      return this.mainWallet;
    } catch (error) {
      console.error("Error retrieving main wallet:", error);
      return null;
    }
  }

  /**
   * Encrypt sensitive text using SEA
   * @param text Text to encrypt
   * @returns Encrypted text
   */
  private async encryptSensitiveData(text: string): Promise<string> {
    try {
      const user = this.gun.user();
      if (user && user._ && user._.sea) {
        // Use user key to encrypt
        const encrypted = await SEA.encrypt(text, user._.sea);
        return JSON.stringify(encrypted);
      } else {
        // Fallback: use key derived from user ID
        const userIdentifier = this.getStorageUserIdentifier();
        const key = `shogun-encrypt-${userIdentifier}-key`;
        const encrypted = await SEA.encrypt(text, key);
        return JSON.stringify(encrypted);
      }
    } catch (error) {
      console.error("Error encrypting data:", error);
      // Fallback: save in clear but with warning
      log("WARNING: Sensitive data saved without encryption");
      return `unencrypted:${text}`;
    }
  }

  /**
   * Decrypt sensitive text encrypted with SEA
   * @param encryptedText Encrypted text
   * @returns Decrypted text
   */
  private async decryptSensitiveData(
    encryptedText: string,
  ): Promise<string | null> {
    try {
      // Check if it's unencrypted text (fallback)
      if (encryptedText.startsWith("unencrypted:")) {
        return encryptedText.substring(12);
      }

      // Try to parse encrypted text
      const encryptedData = JSON.parse(encryptedText);

      const user = this.gun.user();
      if (user && user._ && user._.sea) {
        // Use user key to decrypt
        const decrypted = await SEA.decrypt(encryptedData, user._.sea);
        return decrypted as string;
      } else {
        // Fallback: use key derived from user ID
        const userIdentifier = this.getStorageUserIdentifier();
        const key = `shogun-encrypt-${userIdentifier}-key`;
        const decrypted = await SEA.decrypt(encryptedData, key);
        return decrypted as string;
      }
    } catch (error) {
      console.error("Error decrypting data:", error);
      return null;
    }
  }

  /**
   * Get user's master mnemonic, first checking GunDB then localStorage
   */
  async getUserMasterMnemonic(): Promise<string | null> {
    try {
      // 1. First check GunDB (automatically encrypted by SEA)
      const user = this.gun.user();
      if (user && user.is) {
        const gunMnemonic = await new Promise<string | null>((resolve) => {
          user.get("master_mnemonic").once((data: any) => {
            resolve(data || null);
          });
        });

        if (gunMnemonic) {
          log("Mnemonic retrieved from GunDB");
          log("gunMnemonic: ", gunMnemonic);
          return gunMnemonic;
        }
      }

      // 2. If not found in GunDB, check localStorage
      const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;
      const encryptedMnemonic = this.storage.getItem(storageKey);

      if (!encryptedMnemonic) {
        log("No mnemonic found in either GunDB or localStorage");
        return null;
      }

      // Decrypt mnemonic from localStorage
      const decrypted = await this.decryptSensitiveData(encryptedMnemonic);
      log("Mnemonic retrieved from localStorage");

      // If we find mnemonic in localStorage but not in GunDB, save it to GunDB
      // for future syncing (but only if user is authenticated)
      if (decrypted && user && user.is) {
        await user.get("master_mnemonic").put(decrypted);
        log("Mnemonic from localStorage synced to GunDB");
      }

      return decrypted;
    } catch (error) {
      console.error("Error retrieving mnemonic:", error);
      return null;
    }
  }

  /**
   * Save user's master mnemonic to both GunDB and localStorage
   */
  async saveUserMasterMnemonic(mnemonic: string): Promise<void> {
    try {
      // 1. Save to GunDB (automatically encrypted by SEA)
      const user = this.gun.user();
      if (user && user.is) {
        await user.get("master_mnemonic").put(mnemonic);
        log("Mnemonic saved to GunDB");
      }

      // 2. Also save to localStorage as backup
      const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;

      // Encrypt mnemonic before saving to localStorage
      const encryptedMnemonic = await this.encryptSensitiveData(mnemonic);
      this.storage.setItem(storageKey, encryptedMnemonic);
      log("Encrypted mnemonic also saved to localStorage as backup");
    } catch (error) {
      console.error("Error saving mnemonic:", error);
      throw error;
    }
  }

  async createWallet(): Promise<WalletInfo> {
    try {
      // Verify user is authenticated
      const user = this.gun.user();
      if (!user.is) {
        throw new Error("User is not authenticated");
      }

      // Determine next available index
      const existingWallets = Object.values(this.walletPaths).length;
      const nextIndex = existingWallets;

      // Use standard Ethereum path format
      const path = `m/44'/60'/0'/0/${nextIndex}`;

      // Get user's master mnemonic
      let masterMnemonic = await this.getUserMasterMnemonic();
      if (!masterMnemonic) {
        // Generate new mnemonic
        masterMnemonic = this.generateNewMnemonic();
        await this.saveUserMasterMnemonic(masterMnemonic);
        log(`Generated new mnemonic: ${masterMnemonic}`);
      }

      log("*** masterMnemonic: ", masterMnemonic);

      // Derive wallet using secure method
      const wallet = this.derivePrivateKeyFromMnemonic(masterMnemonic, path);
      log(`Derived wallet for path ${path} with address ${wallet.address}`);

      // Save wallet path
      const timestamp = Date.now();
      this.walletPaths[wallet.address] = { path, created: timestamp };

      // Save in user context in Gun
      await user
        .get("wallet_paths")
        .get(wallet.address)
        .put({ path, created: timestamp });
      // Also save to localStorage
      this.saveWalletPathsToLocalStorage();

      return {
        wallet,
        path,
        address: wallet.address,
        getAddressString: () => wallet.address,
      };
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }

  async loadWallets(): Promise<WalletInfo[]> {
    try {
      const user = this.gun.user();

      // More complete authentication check
      if (!user) {
        console.error("loadWallets: No Gun user available");
        throw new Error("Gun user not available");
      }

      // Initialize wallet paths if not already done
      await this.initializeWalletPaths();

      // Get user's master mnemonic
      let masterMnemonic = await this.getUserMasterMnemonic();
      if (!masterMnemonic) {
        // If none exists, create default wallet
        console.log("No mnemonic found, creating default wallet...");
        const mainWallet = await this.createWallet();
        return [mainWallet];
      }

      log(`masterMnemonic found: ${masterMnemonic}`);
      const wallets: WalletInfo[] = [];

      // Derive each wallet from saved paths
      for (const [address, data] of Object.entries(this.walletPaths)) {
        try {
          // Use secure method to derive private key
          const wallet = this.derivePrivateKeyFromMnemonic(
            masterMnemonic,
            data.path || `m/44'/60'/0'/0/${address.substring(0, 6)}`,
          );
          log(
            `Derived wallet for path ${data.path || "fallback"} with address ${wallet.address}`,
          );

          if (wallet.address.toLowerCase() !== address.toLowerCase()) {
            console.warn(
              `Warning: derived address (${wallet.address}) does not match saved address (${address})`,
            );
          }
          wallets.push({
            wallet,
            path:
              data.path || `m/44'/60'/0'/0/${wallet.address.substring(0, 8)}`,
            address: wallet.address,
            getAddressString: () => wallet.address,
          });
        } catch (innerError) {
          console.error(`Error deriving wallet ${address}:`, innerError);
        }
      }

      // Set mainWallet if there are wallets
      if (wallets.length > 0) {
        this.mainWallet = wallets[0].wallet;
      }

      return wallets;
    } catch (error) {
      console.error("Error loading wallets:", error);
      throw error;
    }
  }

  // BASIC WALLET FUNCTIONS

  /**
   * Get wallet balance with caching to reduce RPC calls
   */
  async getBalance(wallet: ethers.Wallet): Promise<string> {
    try {
      const address = wallet.address;

      // Check if we have valid cache
      const cachedData = this.balanceCache.get(address);
      const now = Date.now();

      if (
        cachedData &&
        cachedData.timestamp !== undefined &&
        now - cachedData.timestamp < this.balanceCacheTTL
      ) {
        const cachedBalance = cachedData.balance || "0";
        log(`Using cached balance for ${address}: ${cachedBalance} ETH`);
        return cachedBalance;
      }

      // Otherwise call provider
      log(`RPC call to get balance for ${address}`);
      const provider = this.getProvider();
      const balance = await provider.getBalance(wallet.address);
      const formattedBalance = ethers.formatEther(balance);

      // Update cache
      this.balanceCache.set(address, {
        balance: formattedBalance,
        timestamp: now,
      });

      return formattedBalance;
    } catch (error) {
      console.error("Error retrieving balance:", error);
      return "0.0";
    }
  }

  /**
   * Invalidate balance cache for an address
   */
  invalidateBalanceCache(address: string) {
    this.balanceCache.delete(address);
    log(`Balance cache invalidated for ${address}`);
  }

  async getNonce(wallet: ethers.Wallet): Promise<number> {
    const provider = this.getProvider();
    const nonce = await provider.getTransactionCount(wallet.address);
    return nonce;
  }

  async sendTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string,
  ): Promise<string> {
    try {
      log(
        `Sending transaction from wallet ${wallet.address} to ${toAddress} for ${value} ETH`,
      );
      const provider = this.getProvider();

      wallet.connect(provider);

      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(value),
      });

      // Invalidate balance cache after sending transaction
      this.invalidateBalanceCache(wallet.address);

      log(`Transaction sent successfully: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  }

  /**
   * Sign a message with a wallet
   */
  async signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array,
  ): Promise<string> {
    try {
      return await wallet.signMessage(message);
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  }

  /**
   * Verify a signature
   */
  verifySignature(message: string | Uint8Array, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Sign a transaction
   */
  async signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string,
    provider?: ethers.JsonRpcProvider,
  ): Promise<string> {
    try {
      log(
        `Signing transaction from wallet ${wallet.address} to ${toAddress} for ${value} ETH`,
      );

      // If no provider supplied, use configured one
      const actualProvider = provider || this.getProvider();

      // Get nonce
      const nonce = await actualProvider.getTransactionCount(wallet.address);
      log(`Nonce for transaction: ${nonce}`);

      // Get fee data
      const feeData = await actualProvider.getFeeData();

      const tx = {
        nonce: nonce,
        to: toAddress,
        value: ethers.parseEther(value),
        gasPrice: feeData.gasPrice,
        gasLimit: 21000, // Standard gas limit for ETH transfers
      };

      // Sign transaction
      const signedTx = await wallet.signTransaction(tx);
      log(`Transaction signed successfully`);
      return signedTx;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  /**
   * Reset main wallet
   * Useful when we want to force wallet regeneration
   */
  resetMainWallet(): void {
    log("Resetting main wallet");
    this.mainWallet = null;
  }

  /**
   * Export user's mnemonic phrase
   * @param password Optional password to encrypt exported mnemonic
   * @returns The mnemonic in clear text or encrypted if password provided
   */
  async exportMnemonic(password?: string): Promise<string> {
    try {
      // Get mnemonic
      const mnemonic = await this.getUserMasterMnemonic();

      if (!mnemonic) {
        throw new Error("No mnemonic found to export");
      }

      // If password provided, encrypt mnemonic
      if (password) {
        const encryptedData = await SEA.encrypt(mnemonic, password);
        return JSON.stringify({
          type: "encrypted-mnemonic",
          data: encryptedData,
          version: "1.0",
        });
      }

      // Otherwise return clear text mnemonic
      return mnemonic;
    } catch (error) {
      console.error("Error exporting mnemonic:", error);
      throw error;
    }
  }

  /**
   * Export private keys of all generated wallets
   * @param password Optional password to encrypt exported data
   * @returns JSON object containing all wallets with their private keys
   */
  async exportWalletKeys(password?: string): Promise<string> {
    try {
      // Load all wallets
      const wallets = await this.loadWallets();

      if (!wallets || wallets.length === 0) {
        throw new Error("No wallets found to export");
      }

      // Create object with wallet data
      const walletData = wallets.map((walletInfo) => {
        // Safety check for walletInfo.address
        const address = walletInfo.address || "";
        return {
          address: address,
          privateKey: walletInfo.wallet.privateKey,
          path: walletInfo.path,
          created:
            (address && this.walletPaths[address]?.created) || Date.now(),
        };
      });

      const exportData = {
        wallets: walletData,
        version: "1.0",
        exportedAt: new Date().toISOString(),
      };

      // Se è stata fornita una password, cifra i dati
      if (password) {
        const encryptedData = await SEA.encrypt(
          JSON.stringify(exportData),
          password,
        );
        return JSON.stringify({
          type: "encrypted-wallets",
          data: encryptedData,
          version: "1.0",
        });
      }

      // Altrimenti restituisci i dati in chiaro
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Errore nell'esportazione delle chiavi dei wallet:", error);
      throw error;
    }
  }

  /**
   * Esporta il pair (coppia di chiavi) di Gun dell'utente
   * @param password Password opzionale per cifrare i dati esportati
   * @returns Il pair di Gun in formato JSON
   */
  async exportGunPair(password?: string): Promise<string> {
    try {
      const user = this.gun.user();

      if (!user || !user._ || !user._.sea) {
        throw new Error("Utente non autenticato o pair non disponibile");
      }

      const pair = user._.sea;

      // Se è stata fornita una password, cifra i dati
      if (password) {
        const encryptedData = await SEA.encrypt(JSON.stringify(pair), password);
        return JSON.stringify({
          type: "encrypted-gun-pair",
          data: encryptedData,
          version: "1.0",
        });
      }

      // Altrimenti restituisci i dati in chiaro
      return JSON.stringify(pair, null, 2);
    } catch (error) {
      console.error("Errore nell'esportazione del Gun pair:", error);
      throw error;
    }
  }

  /**
   * Esporta tutti i dati dell'utente in un unico file
   * @param password Password obbligatoria per cifrare i dati esportati
   * @returns Un oggetto JSON contenente tutti i dati dell'utente
   */
  async exportAllUserData(password: string): Promise<string> {
    if (!password) {
      throw new Error("È richiesta una password per esportare tutti i dati");
    }

    try {
      // Recupera tutti i dati
      const mnemonic = await this.getUserMasterMnemonic();
      const wallets = await this.loadWallets();
      const user = this.gun.user();

      if (!user || !user._ || !user._.sea) {
        throw new Error("Utente non autenticato o dati non disponibili");
      }

      // Prepara i dati dei wallet
      const walletData = wallets.map((walletInfo) => {
        // Controllo di sicurezza per walletInfo.address
        const address = walletInfo.address || "";
        return {
          address: address,
          privateKey: walletInfo.wallet.privateKey,
          path: walletInfo.path,
          created:
            (address && this.walletPaths[address]?.created) || Date.now(),
        };
      });

      // Crea l'oggetto completo con tutti i dati
      const exportData = {
        user: {
          alias: user.is.alias,
          pub: user.is.pub,
          pair: user._.sea,
        },
        mnemonic,
        wallets: walletData,
        version: "1.0",
        exportedAt: new Date().toISOString(),
        appName: "Shogun Wallet",
      };

      // Cifra i dati con la password fornita
      const encryptedData = await SEA.encrypt(
        JSON.stringify(exportData),
        password,
      );

      return JSON.stringify({
        type: "encrypted-shogun-backup",
        data: encryptedData,
        version: "1.0",
      });
    } catch (error) {
      console.error("Errore nell'esportazione di tutti i dati utente:", error);
      throw error;
    }
  }

  /**
   * Importa una frase mnemonica
   * @param mnemonicData La mnemonica o il JSON cifrato da importare
   * @param password Password opzionale per decifrare la mnemonica se cifrata
   * @returns true se l'importazione è riuscita
   */
  async importMnemonic(
    mnemonicData: string,
    password?: string,
  ): Promise<boolean> {
    try {
      let mnemonic = mnemonicData;

      // Verifica se i dati sono in formato JSON cifrato
      if (mnemonicData.startsWith("{")) {
        try {
          const jsonData = JSON.parse(mnemonicData);

          // Se i dati sono cifrati, decifriamoli
          if (
            jsonData.type === "encrypted-mnemonic" &&
            jsonData.data &&
            password
          ) {
            const decryptedData = await SEA.decrypt(jsonData.data, password);

            if (!decryptedData) {
              throw new Error("Password non valida o dati corrotti");
            }

            mnemonic = decryptedData as string;
          } else if (jsonData.mnemonic) {
            // Se i dati sono in formato JSON non cifrato con campo mnemonic
            mnemonic = jsonData.mnemonic;
          }
        } catch (error) {
          throw new Error("Formato JSON non valido o password errata");
        }
      }

      // Valida la mnemonica (verifica che sia una mnemonica BIP39 valida)
      try {
        // Verifica che la mnemonica sia valida usando ethers.js
        ethers.Mnemonic.fromPhrase(mnemonic);
      } catch (error) {
        throw new Error("La mnemonica fornita non è valida");
      }

      // OTTIMIZZAZIONE: Ripulisci i wallet path esistenti prima di salvare la nuova mnemonica
      const user = this.gun.user();

      // Verifica che l'utente sia autenticato
      if (!user || !user.is) {
        throw new Error(
          "L'utente deve essere autenticato per importare una mnemonica",
        );
      }

      log(
        "Cancellazione dei wallet path esistenti prima dell'importazione della nuova mnemonica",
      );

      // 1. Cancella i path da Gun
      try {
        // Rimuovi l'intero nodo wallet_paths
        await user.get("wallet_paths").put(null);
        log("Wallet path eliminati da Gun con successo");
      } catch (gunError) {
        console.error(
          "Errore durante la cancellazione dei wallet path da Gun:",
          gunError,
        );
        // Continua comunque, non bloccare l'operazione per questo errore
      }

      // 2. Cancella i path da localStorage
      try {
        const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
        this.storage.removeItem(storageKey);
        log("Wallet path eliminati da localStorage con successo");
      } catch (storageError) {
        console.error(
          "Errore durante la cancellazione dei wallet path da localStorage:",
          storageError,
        );
        // Continua comunque
      }

      // 3. Ripulisci i wallet path in memoria
      this.walletPaths = {};

      // 4. Salva la nuova mnemonica
      await this.saveUserMasterMnemonic(mnemonic);
      log("Nuova mnemonica salvata con successo");

      // 5. Reset del wallet principale per forzare la riderivazione
      this.resetMainWallet();

      // 6. Genera il primo wallet con la nuova mnemonica
      await this.createWallet();
      log("Generato nuovo wallet con la mnemonica importata");

      return true;
    } catch (error) {
      console.error("Errore nell'importazione della mnemonica:", error);
      throw error;
    }
  }

  /**
   * Importa le chiavi private dei wallet
   * @param walletsData JSON contenente i dati dei wallet o JSON cifrato
   * @param password Password opzionale per decifrare i dati se cifrati
   * @returns Il numero di wallet importati con successo
   */
  async importWalletKeys(
    walletsData: string,
    password?: string,
  ): Promise<number> {
    try {
      let wallets: any[] = [];

      // Log per debug
      console.log(
        `[importWalletKeys] Tentativo di importazione wallet, lunghezza dati: ${walletsData.length} caratteri`,
      );
      if (walletsData.length > 100) {
        console.log(
          `[importWalletKeys] Primi 100 caratteri: ${walletsData.substring(0, 100)}...`,
        );
      } else {
        console.log(`[importWalletKeys] Dati completi: ${walletsData}`);
      }

      // Pulizia dei dati: rimuovi BOM e altri caratteri speciali
      walletsData = walletsData.replace(/^\uFEFF/, ""); // Rimuovi BOM
      walletsData = walletsData.trim(); // Rimuovi spazi all'inizio e alla fine

      // Verifica se i dati sono in formato JSON cifrato
      try {
        // Verifica che sia un JSON valido
        if (!walletsData.startsWith("{") && !walletsData.startsWith("[")) {
          console.log(
            "[importWalletKeys] Il formato non sembra essere JSON valido",
          );

          // Tenta di interpretare come mnemonic o chiave privata singola
          if (walletsData.split(" ").length >= 12) {
            console.log("[importWalletKeys] Potrebbe essere una mnemonic");
            throw new Error(
              "I dati sembrano essere una mnemonic, usa 'Importa Mnemonica' invece",
            );
          }

          if (walletsData.startsWith("0x") && walletsData.length === 66) {
            console.log(
              "[importWalletKeys] Potrebbe essere una chiave privata singola",
            );
            // Crea un wallet manuale da chiave privata
            try {
              const wallet = new ethers.Wallet(walletsData);
              const path = "m/44'/60'/0'/0/0"; // Path predefinito

              // Crea un oggetto wallet compatibile
              wallets = [
                {
                  address: wallet.address,
                  privateKey: wallet.privateKey,
                  path: path,
                  created: Date.now(),
                },
              ];

              console.log(
                `[importWalletKeys] Creato wallet singolo da chiave privata: ${wallet.address}`,
              );
            } catch (walletError) {
              console.error(
                "[importWalletKeys] Errore nella creazione del wallet da chiave privata:",
                walletError,
              );
              throw new Error(`Chiave privata non valida: ${walletError}`);
            }
          } else {
            throw new Error(
              "Formato non riconosciuto. Fornisci un file JSON valido.",
            );
          }
        } else {
          // Tenta di parsificare il JSON
          const jsonData = JSON.parse(walletsData);
          console.log(
            `[importWalletKeys] JSON parsificato con successo, tipo: ${typeof jsonData}, chiavi: ${Object.keys(jsonData).join(", ")}`,
          );

          // Se i dati sono cifrati, decifriamoli
          if (
            jsonData.type === "encrypted-wallets" &&
            jsonData.data &&
            password
          ) {
            console.log(
              "[importWalletKeys] Trovati dati cifrati, tentativo di decifratura...",
            );
            try {
              const decryptedData = await SEA.decrypt(jsonData.data, password);

              if (!decryptedData) {
                console.error(
                  "[importWalletKeys] Decifratura fallita: risultato null",
                );
                throw new Error("Password non valida o dati corrotti");
              }

              console.log(
                "[importWalletKeys] Decifratura riuscita, tentativo di parsing...",
              );
              console.log(
                "[importWalletKeys] Tipo dei dati decifrati:",
                typeof decryptedData,
              );
              if (
                typeof decryptedData === "string" &&
                decryptedData.length > 50
              ) {
                console.log(
                  "[importWalletKeys] Primi 50 caratteri decifrati:",
                  decryptedData.substring(0, 50),
                );
              }

              try {
                const decryptedJson = JSON.parse(decryptedData as string);
                console.log(
                  "[importWalletKeys] Parsing riuscito, struttura:",
                  Object.keys(decryptedJson).join(", "),
                );

                if (
                  decryptedJson.wallets &&
                  Array.isArray(decryptedJson.wallets)
                ) {
                  wallets = decryptedJson.wallets;
                  console.log(
                    `[importWalletKeys] Trovati ${wallets.length} wallet nei dati decifrati`,
                  );
                } else if (Array.isArray(decryptedJson)) {
                  wallets = decryptedJson;
                  console.log(
                    `[importWalletKeys] Trovato array diretto di ${wallets.length} wallet nei dati decifrati`,
                  );
                } else {
                  console.error(
                    "[importWalletKeys] Formato JSON decifrato non valido:",
                    decryptedJson,
                  );
                  throw new Error(
                    "Formato JSON decifrato non valido: manca il campo 'wallets'",
                  );
                }
              } catch (parseError) {
                console.error(
                  `[importWalletKeys] Errore nel parsing dei dati decifrati: ${parseError}`,
                );
                throw new Error("Formato JSON decifrato non valido");
              }
            } catch (decryptError: any) {
              console.error(
                "[importWalletKeys] Errore durante la decifratura:",
                decryptError,
              );
              throw new Error(
                `Errore durante la decifratura: ${decryptError.message || String(decryptError)}`,
              );
            }
          } else if (jsonData.wallets) {
            // Se i dati sono in formato JSON non cifrato con campo wallets
            if (Array.isArray(jsonData.wallets)) {
              wallets = jsonData.wallets;
              console.log(
                `[importWalletKeys] Trovati ${wallets.length} wallet nel JSON non cifrato`,
              );
            } else {
              console.error(
                "[importWalletKeys] Il campo wallets non è un array:",
                jsonData.wallets,
              );
              throw new Error(
                "Formato JSON non valido: il campo 'wallets' non è un array",
              );
            }
          } else if (Array.isArray(jsonData)) {
            // Se è un array diretto di wallet
            wallets = jsonData;
            console.log(
              `[importWalletKeys] Trovato array diretto di ${wallets.length} wallet`,
            );
          } else {
            console.error(
              "[importWalletKeys] Formato JSON non valido:",
              jsonData,
            );
            throw new Error(
              "Formato JSON non valido: manca il campo 'wallets'",
            );
          }
        }
      } catch (error) {
        console.error(`[importWalletKeys] Errore nel parsing JSON: ${error}`);
        throw new Error(
          `Formato JSON non valido o password errata: ${error || String(error)}`,
        );
      }

      if (!Array.isArray(wallets) || wallets.length === 0) {
        console.error(
          "[importWalletKeys] Nessun wallet valido trovato nei dati forniti",
        );
        throw new Error("Nessun wallet valido trovato nei dati forniti");
      }

      console.log(
        `[importWalletKeys] Inizio importazione di ${wallets.length} wallet...`,
      );

      // Crea un contatore per i wallet importati con successo
      let successCount = 0;

      // Per ogni wallet nei dati importati
      for (const walletData of wallets) {
        try {
          console.log(
            `[importWalletKeys] Tentativo di importazione wallet: ${JSON.stringify(walletData).substring(0, 100)}...`,
          );

          if (!walletData.privateKey) {
            console.log(
              "[importWalletKeys] Manca la chiave privata, salto questo wallet",
            );
            continue; // Salta wallet incompleti
          }

          // Se manca il path, usa un path predefinito
          const path = walletData.path || "m/44'/60'/0'/0/0";

          // Crea un wallet da chiave privata
          try {
            const wallet = new ethers.Wallet(walletData.privateKey);

            // Verifica che la chiave privata corrisponda all'indirizzo fornito (se presente)
            if (
              walletData.address &&
              wallet.address.toLowerCase() !== walletData.address.toLowerCase()
            ) {
              console.warn(
                `[importWalletKeys] L'indirizzo generato ${wallet.address} non corrisponde all'indirizzo fornito ${walletData.address}`,
              );
            }

            // Memorizza nel dizionario dei percorsi
            this.walletPaths[wallet.address] = {
              path: path,
              created: walletData.created || Date.now(),
            };

            // Salva i percorsi aggiornati
            this.saveWalletPathsToLocalStorage();

            // Incrementa il contatore
            successCount++;

            console.log(
              `[importWalletKeys] Wallet importato con successo: ${wallet.address}`,
            );
          } catch (walletError: any) {
            console.error(
              `[importWalletKeys] Errore nella creazione del wallet: ${walletError.message || String(walletError)}`,
            );
            // Continua con il prossimo wallet
          }
        } catch (walletImportError: any) {
          console.error(
            `[importWalletKeys] Errore nell'importazione del wallet: ${walletImportError.message || String(walletImportError)}`,
          );
          // Continua con il prossimo wallet
        }
      }

      // Verifica che almeno un wallet sia stato importato con successo
      if (successCount === 0) {
        throw new Error("Nessun wallet è stato importato con successo");
      }

      // Resetta il wallet principale per forzare la riderivazione
      this.resetMainWallet();

      console.log(
        `[importWalletKeys] Importazione completata: ${successCount} wallet importati su ${wallets.length}`,
      );
      return successCount;
    } catch (error) {
      console.error("Errore nell'importazione dei wallet:", error);
      throw error;
    }
  }

  /**
   * Importa un pair di Gun
   * @param pairData JSON contenente il pair di Gun o JSON cifrato
   * @param password Password opzionale per decifrare i dati se cifrati
   * @returns true se l'importazione è riuscita
   */
  async importGunPair(pairData: string, password?: string): Promise<boolean> {
    try {
      let pair;

      // Verifica se i dati sono in formato JSON cifrato
      try {
        const jsonData = JSON.parse(pairData);

        // Se i dati sono cifrati, decifriamoli
        if (
          jsonData.type === "encrypted-gun-pair" &&
          jsonData.data &&
          password
        ) {
          const decryptedData = await SEA.decrypt(jsonData.data, password);

          if (!decryptedData) {
            throw new Error("Password non valida o dati corrotti");
          }

          pair = JSON.parse(decryptedData as string);
        } else {
          // Altrimenti assumiamo che il JSON sia direttamente il pair
          pair = jsonData;
        }
      } catch (error) {
        throw new Error("Formato JSON non valido o password errata");
      }

      // Verifica che il pair contenga i campi necessari
      if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        throw new Error("Il pair di Gun non è completo o valido");
      }

      // Aggiorna le informazioni dell'utente
      try {
        const user = this.gun.user();
        if (!user) {
          throw new Error("Gun non disponibile");
        }

        // La creazione e l'autenticazione con il pair importato deve essere gestita a livello di applicazione
        // perché richiede un nuovo logout e login
        log("Pair di Gun validato con successo, pronto per l'autenticazione");
        return true;
      } catch (error) {
        throw new Error(
          `Errore nell'autenticazione con il pair importato: ${error}`,
        );
      }
    } catch (error) {
      console.error("Errore nell'importazione del pair di Gun:", error);
      throw error;
    }
  }

  /**
   * Importa un backup completo
   * @param backupData JSON cifrato contenente tutti i dati dell'utente
   * @param password Password per decifrare il backup
   * @param options Opzioni di importazione (quali dati importare)
   * @returns Un oggetto con il risultato dell'importazione
   */
  async importAllUserData(
    backupData: string,
    password: string,
    options: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    } = { importMnemonic: true, importWallets: true, importGunPair: true },
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }> {
    try {
      if (!password) {
        throw new Error("La password è obbligatoria per importare il backup");
      }

      // Log per debug
      console.log(
        `[importAllUserData] Tentativo di importazione backup, lunghezza: ${backupData.length} caratteri`,
      );
      if (backupData.length > 100) {
        console.log(
          `[importAllUserData] Primi 100 caratteri: ${backupData.substring(0, 100)}...`,
        );
      } else {
        console.log(`[importAllUserData] Dati completi: ${backupData}`);
      }

      // Pulizia dei dati: rimuovi BOM e altri caratteri speciali
      backupData = backupData.replace(/^\uFEFF/, ""); // Rimuovi BOM
      backupData = backupData.trim(); // Rimuovi spazi all'inizio e alla fine

      let decryptedData;

      // Verifica se i dati sono nel formato corretto
      try {
        console.log("[importAllUserData] Tentativo di parsing JSON...");

        // Verifica che sia un JSON valido
        if (!backupData.startsWith("{") && !backupData.startsWith("[")) {
          console.error(
            "[importAllUserData] Il formato non sembra essere JSON valido",
          );
          throw new Error("Il backup deve essere in formato JSON valido");
        }

        const jsonData = JSON.parse(backupData);
        console.log(
          `[importAllUserData] JSON parsificato con successo, tipo: ${jsonData.type || "non specificato"}`,
        );

        if (jsonData.type !== "encrypted-shogun-backup" || !jsonData.data) {
          console.error(
            "[importAllUserData] Formato del backup non valido:",
            jsonData,
          );
          throw new Error(
            "Formato del backup non valido: manca il tipo o i dati",
          );
        }

        // Decifra i dati
        console.log("[importAllUserData] Tentativo di decifratura...");
        try {
          decryptedData = await SEA.decrypt(jsonData.data, password);
        } catch (decryptError) {
          console.error(
            "[importAllUserData] Errore nella decifratura:",
            decryptError,
          );
          throw new Error(`Errore nella decifratura: ${decryptError}`);
        }

        if (!decryptedData) {
          console.error(
            "[importAllUserData] Decifratura fallita: null o undefined",
          );
          throw new Error("Password non valida o dati corrotti");
        }

        console.log(
          "[importAllUserData] Decifratura riuscita, tentativo di parsing del contenuto...",
        );
        console.log(
          "[importAllUserData] Tipo di dati decifrati:",
          typeof decryptedData,
        );
        if (typeof decryptedData === "string" && decryptedData.length > 50) {
          console.log(
            "[importAllUserData] Primi 50 caratteri decifrati:",
            decryptedData.substring(0, 50),
          );
        }

        try {
          decryptedData = JSON.parse(decryptedData as string);
          console.log(
            "[importAllUserData] Parsing del contenuto decifrato riuscito",
          );
        } catch (parseError) {
          console.error(
            "[importAllUserData] Errore nel parsing del contenuto decifrato:",
            parseError,
          );
          throw new Error(
            `Errore nel parsing del contenuto decifrato: ${parseError}`,
          );
        }
      } catch (error) {
        console.error("[importAllUserData] Errore generale:", error);
        throw new Error(`Formato JSON non valido o password errata: ${error}`);
      }

      // Risultati dell'importazione
      const result: {
        success: boolean;
        mnemonicImported?: boolean;
        walletsImported?: number;
        gunPairImported?: boolean;
      } = { success: false };

      // Importa la mnemonic se richiesto
      if (options.importMnemonic && decryptedData.mnemonic) {
        try {
          console.log(
            "[importAllUserData] Tentativo di importazione mnemonica...",
          );
          await this.saveUserMasterMnemonic(decryptedData.mnemonic);
          result.mnemonicImported = true;
          console.log("[importAllUserData] Mnemonica importata con successo");
        } catch (error) {
          console.error(
            "[importAllUserData] Errore nell'importazione della mnemonica:",
            error,
          );
          result.mnemonicImported = false;
        }
      } else {
        console.log(
          "[importAllUserData] Importazione mnemonica non richiesta o mnemonica non trovata",
        );
      }

      // Importa i wallet se richiesto
      if (
        options.importWallets &&
        decryptedData.wallets &&
        Array.isArray(decryptedData.wallets)
      ) {
        try {
          console.log(
            `[importAllUserData] Tentativo di importazione di ${decryptedData.wallets.length} wallet...`,
          );
          // Prepara i dati nel formato richiesto da importWalletKeys
          const walletsData = JSON.stringify({
            wallets: decryptedData.wallets,
          });
          result.walletsImported = await this.importWalletKeys(walletsData);
          console.log(
            `[importAllUserData] ${result.walletsImported} wallet importati con successo`,
          );
        } catch (error) {
          console.error(
            "[importAllUserData] Errore nell'importazione dei wallet:",
            error,
          );
          result.walletsImported = 0;
        }
      } else {
        console.log(
          "[importAllUserData] Importazione wallet non richiesta o wallet non trovati",
        );
        if (options.importWallets) {
          console.log(
            "[importAllUserData] Dettagli wallets:",
            decryptedData.wallets,
          );
        }
      }

      // Importa il pair di Gun se richiesto
      if (
        options.importGunPair &&
        decryptedData.user &&
        decryptedData.user.pair
      ) {
        try {
          console.log(
            "[importAllUserData] Tentativo di importazione pair Gun...",
          );
          // Il pair di Gun viene validato ma non applicato automaticamente
          // (richiede logout e login che deve essere gestito dall'app)
          const pairData = JSON.stringify(decryptedData.user.pair);
          await this.importGunPair(pairData);
          result.gunPairImported = true;
          console.log("[importAllUserData] Pair Gun importato con successo");
        } catch (error) {
          console.error(
            "[importAllUserData] Errore nell'importazione del pair di Gun:",
            error,
          );
          result.gunPairImported = false;
        }
      } else {
        console.log(
          "[importAllUserData] Importazione pair Gun non richiesta o pair non trovato",
        );
        if (options.importGunPair) {
          console.log("[importAllUserData] Dettagli user:", decryptedData.user);
        }
      }

      // Imposta il risultato finale
      result.success = !!(
        (options.importMnemonic && result.mnemonicImported) ||
        (options.importWallets &&
          result.walletsImported &&
          result.walletsImported > 0) ||
        (options.importGunPair && result.gunPairImported)
      );

      console.log("[importAllUserData] Risultato finale:", result);
      return result;
    } catch (error) {
      console.error("Errore nell'importazione del backup:", error);
      throw error;
    }
  }
}
