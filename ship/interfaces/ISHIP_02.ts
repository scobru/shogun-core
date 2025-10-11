/**
 * SHIP-02: Ethereum Address Derivation Interface
 * 
 * @title ISHIP_02 - Deterministic Address Derivation
 * @notice Interface for deriving Ethereum addresses from SHIP-00 identity
 * 
 * ## Abstract
 * 
 * This standard extends SHIP-00 to enable:
 * - Deterministic Ethereum address derivation from identity keys
 * - BIP-32/BIP-44 hierarchical deterministic (HD) wallet support
 * - Stealth address generation for enhanced privacy
 * - Multiple address management from single identity
 * - Transaction signing with derived keys
 * 
 * ## Specification
 * 
 * Based on:
 * - SHIP-00 for identity foundation
 * - BIP-32 for hierarchical deterministic wallets
 * - BIP-44 for multi-account hierarchy
 * - Ethers.js for Ethereum operations
 * - ECDH for stealth address generation
 * 
 * ## Dependencies
 * 
 * - SHIP-00: Identity and authentication foundation
 * - ethers: Ethereum wallet and signing operations
 * 
 * ## Usage
 * 
 * SHIP-02 enables wallet functionality on top of SHIP-00 identity:
 * ```typescript
 * const identity = new SHIP_00({ gunOptions: { peers: ['...'] } });
 * await identity.login('alice', 'password123');
 * 
 * const addressDerivation = new SHIP_02(identity);
 * await addressDerivation.initialize();
 * 
 * const ethAddress = await addressDerivation.deriveEthereumAddress();
 * ```
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Result of address derivation operation
 */
export interface DerivationResult {
  success: boolean;
  address?: string;
  path?: string;
  publicKey?: string;
  error?: string;
}

/**
 * @notice Stealth address generation result
 */
export interface StealthAddressResult {
  success: boolean;
  address?: string;
  ephemeralPublicKey?: string;
  viewTag?: string;
  sharedSecret?: string;
  error?: string;
}

/**
 * @notice Transaction signing result
 */
export interface SignatureResult {
  success: boolean;
  signature?: string;
  signedTransaction?: string;
  txHash?: string;
  error?: string;
}

/**
 * @notice Address book entry
 */
export interface AddressEntry {
  address: string;
  path: string;
  publicKey: string;
  index: number;
  label?: string;
  createdAt: number;
}

/**
 * @notice Exported address book
 */
export interface AddressBook {
  addresses: AddressEntry[];
  masterPublicKey: string;
  derivationMethod: 'bip44' | 'simple' | 'stealth';
}

/**
 * @notice Wallet info with ready-to-use wallet object (frontend-friendly)
 */
export interface WalletInfo {
  wallet: any; // ethers.HDNodeWallet or ethers.Wallet
  path: string;
  address: string;
  publicKey?: string;
  index?: number;
}

/**
 * @notice Wallet path metadata
 */
export interface WalletPath {
  path: string;
  created: number;
}

/**
 * @notice Event types for SHIP-02 wallet operations
 */
export enum SHIP_02_EventType {
  WALLET_CREATED = "walletCreated",
  ADDRESS_DERIVED = "addressDerived",
  TRANSACTION_SIGNED = "transactionSigned",
  MNEMONIC_GENERATED = "mnemonicGenerated",
  SYNC_COMPLETED = "syncCompleted",
  ERROR = "error"
}

/**
 * @notice Event data for SHIP-02 operations
 */
export interface SHIP_02_Event {
  type: SHIP_02_EventType;
  data?: any;
  timestamp: number;
}

/**
 * @notice Transaction object for signing
 */
export interface Transaction {
  to: string;
  value?: string | bigint;
  data?: string;
  gasLimit?: string | bigint;
  gasPrice?: string | bigint;
  maxFeePerGas?: string | bigint;
  maxPriorityFeePerGas?: string | bigint;
  nonce?: number;
  chainId?: number;
  type?: number;
}

/**
 * @notice Signed transaction
 */
export interface SignedTransaction {
  raw: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: number;
  nonce: number;
  gasLimit: string;
  signature: {
    r: string;
    s: string;
    v: number;
  };
}

/**
 * @notice Configuration options for SHIP-02
 */
export interface SHIP_02_Config {
  /** Default coin type (60 for Ethereum) */
  defaultCoinType?: number;
  /** Default account index */
  defaultAccount?: number;
  /** Enable stealth address support */
  enableStealth?: boolean;
  /** Custom derivation path prefix */
  customPathPrefix?: string;
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_02 - Ethereum Address Derivation
 * @notice Main interface for deterministic address derivation from SHIP-00 identity
 */
export interface ISHIP_02 {
  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * @notice Initialize the address derivation system
   * @dev Must be called before using any derivation methods
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * @notice Check if system is initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;

  // ========================================================================
  // BASIC DERIVATION
  // ========================================================================

  /**
   * @notice Derive a single Ethereum address from identity
   * @param path Optional BIP-32 derivation path (default: m/44'/60'/0'/0/0)
   * @returns Promise resolving to DerivationResult
   */
  deriveEthereumAddress(path?: string): Promise<DerivationResult>;

  /**
   * @notice Derive multiple Ethereum addresses sequentially
   * @param count Number of addresses to derive
   * @param startIndex Starting index (default: 0)
   * @returns Promise resolving to array of DerivationResults
   */
  deriveMultipleAddresses(
    count: number,
    startIndex?: number
  ): Promise<DerivationResult[]>;

  /**
   * @notice Get the primary (default) Ethereum address
   * @returns Promise resolving to primary address string
   */
  getPrimaryAddress(): Promise<string>;

  // ========================================================================
  // BIP-44 STANDARD DERIVATION
  // ========================================================================

  /**
   * @notice Derive address using BIP-44 standard path
   * @param coinType Coin type (default: 60 for Ethereum)
   * @param account Account index (default: 0)
   * @param change Change chain (0 = external, 1 = internal)
   * @param index Address index
   * @returns Promise resolving to DerivationResult
   */
  deriveBIP44Address(
    coinType?: number,
    account?: number,
    change?: number,
    index?: number
  ): Promise<DerivationResult>;

  /**
   * @notice Derive multiple accounts following BIP-44
   * @param accountCount Number of accounts to derive
   * @returns Promise resolving to array of DerivationResults
   */
  deriveMultipleAccounts(accountCount: number): Promise<DerivationResult[]>;

  // ========================================================================
  // STEALTH ADDRESSES
  // ========================================================================

  /**
   * @notice Generate a stealth address for private transactions
   * @param recipientPublicKey Optional recipient public key for dual-key stealth
   * @returns Promise resolving to StealthAddressResult
   */
  generateStealthAddress(
    recipientPublicKey?: string
  ): Promise<StealthAddressResult>;

  /**
   * @notice Derive shared secret for stealth address
   * @param publicKey Public key to derive shared secret with
   * @returns Promise resolving to shared secret hex string
   */
  deriveSharedSecret(publicKey: string): Promise<string>;

  /**
   * @notice Check if an address is a stealth address
   * @param address Address to check
   * @returns Promise resolving to boolean
   */
  isStealthAddress(address: string): Promise<boolean>;

  // ========================================================================
  // KEY MANAGEMENT
  // ========================================================================

  /**
   * @notice Get private key for a specific derived address
   * @param address The Ethereum address
   * @returns Promise resolving to private key hex string
   * @dev SECURITY: Handle with extreme care!
   */
  getPrivateKeyForAddress(address: string): Promise<string>;

  /**
   * @notice Get public key for a specific derived address
   * @param address The Ethereum address
   * @returns Promise resolving to public key hex string
   */
  getPublicKeyForAddress(address: string): Promise<string>;

  /**
   * @notice Get derivation path for a specific address
   * @param address The Ethereum address
   * @returns Promise resolving to derivation path string or undefined
   */
  getPathForAddress(address: string): Promise<string | undefined>;

  // ========================================================================
  // TRANSACTION SIGNING
  // ========================================================================

  /**
   * @notice Sign a transaction with a derived address
   * @param tx Transaction object to sign
   * @param address Address to sign with
   * @returns Promise resolving to SignatureResult
   */
  signTransaction(tx: Transaction, address: string): Promise<SignatureResult>;

  /**
   * @notice Sign arbitrary message with a derived address
   * @param message Message to sign (string or bytes)
   * @param address Address to sign with
   * @returns Promise resolving to signature hex string
   */
  signMessage(message: string | Uint8Array, address: string): Promise<string>;

  /**
   * @notice Verify signature for a message
   * @param message Original message
   * @param signature Signature to verify
   * @param address Expected signer address
   * @returns Promise resolving to boolean (true if valid)
   */
  verifySignature(
    message: string | Uint8Array,
    signature: string,
    address: string
  ): Promise<boolean>;

  // ========================================================================
  // ADDRESS MANAGEMENT
  // ========================================================================

  /**
   * @notice Get all derived addresses
   * @returns Promise resolving to array of AddressEntry
   */
  getAllAddresses(): Promise<AddressEntry[]>;

  /**
   * @notice Get address by index
   * @param index Address index
   * @returns Promise resolving to AddressEntry or undefined
   */
  getAddressByIndex(index: number): Promise<AddressEntry | undefined>;

  /**
   * @notice Set label for an address
   * @param address Address to label
   * @param label Human-readable label
   * @returns Promise that resolves when label is set
   */
  setAddressLabel(address: string, label: string): Promise<void>;

  /**
   * @notice Export address book
   * @returns Promise resolving to AddressBook
   */
  exportAddressBook(): Promise<AddressBook>;

  /**
   * @notice Import address book (for recovery)
   * @param addressBook AddressBook to import
   * @returns Promise that resolves when import is complete
   */
  importAddressBook(addressBook: AddressBook): Promise<void>;

  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * @notice Verify ownership of an address
   * @param address Address to verify
   * @returns Promise resolving to boolean (true if owned)
   */
  ownsAddress(address: string): Promise<boolean>;

  /**
   * @notice Get the master public key (xpub)
   * @returns Promise resolving to extended public key string
   */
  getMasterPublicKey(): Promise<string>;

  /**
   * @notice Clear all cached keys and addresses
   * @dev Use with caution - requires re-initialization
   * @returns Promise that resolves when cache is cleared
   */
  clearCache(): Promise<void>;

  // ========================================================================
  // RPC PROVIDER MANAGEMENT
  // ========================================================================

  /**
   * @notice Set RPC provider URL for network operations
   * @param rpcUrl The RPC endpoint URL
   * @returns Promise that resolves when provider is configured
   */
  setRpcUrl(rpcUrl: string): Promise<void>;

  /**
   * @notice Get current RPC provider
   * @returns RPC provider instance or null
   */
  getProvider(): any; // ethers.JsonRpcProvider | null

  /**
   * @notice Get signer connected to provider
   * @returns Signer instance for transactions
   */
  getSigner(): any; // ethers.Wallet

  /**
   * @notice Set custom signer
   * @param signer Custom wallet to use as signer
   * @returns Promise that resolves when signer is set
   */
  setSigner(signer: any): Promise<void>; // ethers.Wallet

  // ========================================================================
  // FRONTEND-FRIENDLY WALLET MANAGEMENT
  // ========================================================================

  /**
   * @notice Create a new wallet with auto-incremented index
   * @returns Promise resolving to WalletInfo with ready-to-use wallet object
   */
  createWallet(): Promise<WalletInfo>;

  /**
   * @notice Load all wallets from stored paths
   * @returns Promise resolving to array of WalletInfo objects
   */
  loadWallets(): Promise<WalletInfo[]>;

  /**
   * @notice Get main wallet derived from Gun user keys
   * @dev This is different from BIP-44 derivation - uses Gun SEA keys directly
   * @returns Main wallet instance
   */
  getMainWallet(): any; // ethers.Wallet

  /**
   * @notice Get main wallet credentials (address + private key)
   * @returns Object with address and private key
   */
  getMainWalletCredentials(): { address: string; priv: string };

  // ========================================================================
  // ADVANCED EXPORT/IMPORT
  // ========================================================================

  /**
   * @notice Export wallet keys for all derived addresses
   * @returns Promise resolving to JSON string with all wallet keys
   */
  exportWalletKeys(): Promise<string>;

  /**
   * @notice Export Gun SEA keypair
   * @returns Promise resolving to JSON string with Gun pair
   */
  exportGunPair(): Promise<string>;

  /**
   * @notice Export all user data (mnemonic, wallets, Gun pair)
   * @returns Promise resolving to encrypted backup string
   */
  exportAllUserData(): Promise<string>;

  /**
   * @notice Import wallet keys and restore multiple wallets
   * @param walletsData JSON string with wallet keys
   * @returns Promise resolving to number of wallets imported
   */
  importWalletKeys(walletsData: string): Promise<number>;

  /**
   * @notice Import Gun SEA keypair
   * @param pairData JSON string with Gun pair
   * @returns Promise resolving to boolean success status
   */
  importGunPair(pairData: string): Promise<boolean>;

  /**
   * @notice Import all user data from backup
   * @param backupData Encrypted backup string
   * @param options Import options (which data to import)
   * @returns Promise resolving to import results
   */
  importAllUserData(
    backupData: string,
    options?: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    }
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }>;

  // ========================================================================
  // WALLET PATH MANAGEMENT
  // ========================================================================

  /**
   * @notice Initialize wallet paths from Gun storage
   * @returns Promise that resolves when paths are loaded
   */
  initializeWalletPaths(): Promise<void>;

  /**
   * @notice Save wallet paths to localStorage backup
   * @returns Promise that resolves when saved
   */
  saveWalletPathsToLocalStorage(): Promise<void>;

  /**
   * @notice Load wallet paths from localStorage
   * @returns Promise that resolves when loaded
   */
  loadWalletPathsFromLocalStorage(): Promise<void>;

  /**
   * @notice Initialize wallet paths and test encryption system
   * @dev Convenience method that combines initialization and testing
   * @returns Promise that resolves when initialization and testing complete
   */
  initializeWalletPathsAndTestEncryption(): Promise<void>;

  /**
   * @notice Cleanup resources and timers
   * @dev Call before destroying instance
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup(): Promise<void>;
}

// ============================================================================
// EVENTS (for future event emitter support)
// ============================================================================

export type SHIP_02_Events = {
  addressDerived: (result: DerivationResult) => void;
  stealthGenerated: (result: StealthAddressResult) => void;
  transactionSigned: (result: SignatureResult) => void;
  error: (error: Error) => void;
};

