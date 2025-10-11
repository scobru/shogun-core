/**
 * SHIP-03: Dual-Key Stealth Address Interface
 * 
 * @title ISHIP_03 - Privacy-Preserving Stealth Addresses
 * @notice Interface for ERC-5564 compatible stealth addresses
 * 
 * ## Abstract
 * 
 * This standard extends SHIP-00 and SHIP-02 to enable:
 * - Dual-key stealth addresses (viewing + spending keys)
 * - ERC-5564 / Fluidkey compatibility
 * - Enhanced transaction privacy
 * - Stealth address scanning and opening
 * - Deterministic key derivation from SHIP-00 identity
 * 
 * ## Specification
 * 
 * Based on:
 * - SHIP-00 for identity foundation
 * - SHIP-02 for Ethereum address derivation
 * - ERC-5564 for stealth address standard
 * - Fluidkey Stealth Account Kit
 * - ECDH for shared secret derivation
 * 
 * ## Key Concepts
 * 
 * **Viewing Key**: Used to scan blockchain for incoming stealth payments
 * **Spending Key**: Used to spend funds received at stealth addresses
 * **Ephemeral Key**: One-time key used by sender to generate stealth address
 * 
 * ## Dependencies
 * 
 * - SHIP-00: Identity and authentication foundation
 * - SHIP-02: Ethereum wallet operations
 * - @fluidkey/stealth-account-kit: ERC-5564 implementation
 * - ethers: Ethereum operations
 * 
 * ## Usage
 * 
 * ```typescript
 * const identity = new SHIP_00({ gunOptions: { peers: ['...'] } });
 * await identity.login('alice', 'password123');
 * 
 * const eth = new SHIP_02(identity);
 * await eth.initialize();
 * 
 * const stealth = new SHIP_03(identity, eth);
 * await stealth.initialize();
 * 
 * // Get stealth keys (derived from SHIP-00 identity)
 * const keys = await stealth.getStealthKeys();
 * 
 * // Generate stealth address for recipient
 * const stealthAddr = await stealth.generateStealthAddress(
 *   recipientViewingKey,
 *   recipientSpendingKey
 * );
 * ```
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Dual stealth keys (viewing + spending)
 */
export interface StealthKeys {
  viewingKey: {
    publicKey: string;
    privateKey: string;
  };
  spendingKey: {
    publicKey: string;
    privateKey: string;
  };
}

/**
 * @notice Ephemeral key pair for stealth generation
 */
export interface EphemeralKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * @notice Stealth address generation result
 */
export interface StealthAddressResult {
  success: boolean;
  stealthAddress?: string;
  ephemeralPublicKey?: string;
  viewTag?: string;
  error?: string;
}

/**
 * @notice Stealth metadata for announcements (ERC-5564)
 */
export interface StealthMetadata {
  ephemeralPublicKey: string;
  viewTag: string;
  stealthAddress: string;
  createdAt: number;
}

/**
 * @notice Announced stealth payment data
 */
export interface AnnouncedStealth {
  stealthAddress: string;
  ephemeralPublicKey: string;
  viewTag: string;
  schemeId: number; // ERC-5564 scheme ID
  announcer: string; // Address that announced
  txHash?: string;
}

/**
 * @notice Scanned stealth address that belongs to user
 */
export interface OwnedStealthAddress {
  stealthAddress: string;
  ephemeralPublicKey: string;
  privateKey: string;
  wallet: any; // ethers.Wallet
  metadata: StealthMetadata;
}

/**
 * @notice Configuration for SHIP-03
 */
export interface SHIP_03_Config {
  /** Enable ERC-5564 compatibility mode */
  erc5564Compatible?: boolean;
  /** Default scheme ID for ERC-5564 */
  defaultSchemeId?: number;
  /** Enable view tag optimization */
  enableViewTag?: boolean;
  /** Auto-scan for stealth addresses */
  autoScan?: boolean;
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_03 - Dual-Key Stealth Addresses
 * @notice Main interface for privacy-preserving stealth addresses
 */
export interface ISHIP_03 {
  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * @notice Initialize the stealth address system
   * @dev Must be called after SHIP-02 initialization
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * @notice Check if system is initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;

  // ========================================================================
  // KEY MANAGEMENT
  // ========================================================================

  /**
   * @notice Get or generate user's stealth keys (viewing + spending)
   * @dev Keys are deterministically derived from SHIP-00 identity
   * @returns Promise resolving to StealthKeys
   */
  getStealthKeys(): Promise<StealthKeys>;

  /**
   * @notice Get public stealth keys by username (alias)
   * @param username User's alias/username
   * @returns Promise resolving to public keys or null
   */
  getPublicStealthKeysByUsername(username: string): Promise<{
    viewingPublicKey: string;
    spendingPublicKey: string;
  } | null>;

  /**
   * @notice Get public stealth keys for another user by Gun public key
   * @param userPub User's SHIP-00 public key
   * @returns Promise resolving to public keys or null
   */
  getPublicStealthKeys(userPub: string): Promise<{
    viewingPublicKey: string;
    spendingPublicKey: string;
  } | null>;

  /**
   * @notice Search directory for users with published stealth keys
   * @returns Promise resolving to array of users with stealth keys
   */
  searchStealthDirectory(): Promise<Array<{
    username?: string;
    gunPub: string;
    viewingPublicKey: string;
    spendingPublicKey: string;
    timestamp?: number;
  }>>;

  /**
   * @notice Export stealth keys (encrypted)
   * @returns Promise resolving to encrypted keys JSON
   */
  exportStealthKeys(): Promise<string>;

  /**
   * @notice Import stealth keys (encrypted)
   * @param encryptedKeys Encrypted keys JSON
   * @returns Promise that resolves when import is complete
   */
  importStealthKeys(encryptedKeys: string): Promise<void>;

  /**
   * @notice Publish public stealth keys to Gun network
   * @dev Makes your stealth keys discoverable by others
   * @returns Promise that resolves when keys are published
   */
  publishStealthKeys(): Promise<void>;

  // ========================================================================
  // STEALTH ADDRESS GENERATION
  // ========================================================================

  /**
   * @notice Generate ephemeral key pair for stealth address creation
   * @returns Promise resolving to EphemeralKeyPair
   */
  generateEphemeralKeyPair(): Promise<EphemeralKeyPair>;

  /**
   * @notice Generate stealth address for a recipient
   * @param recipientViewingKey Recipient's viewing public key
   * @param recipientSpendingKey Recipient's spending public key
   * @param ephemeralPrivateKey Optional ephemeral key (auto-generated if not provided)
   * @returns Promise resolving to StealthAddressResult
   */
  generateStealthAddress(
    recipientViewingKey: string,
    recipientSpendingKey: string,
    ephemeralPrivateKey?: string
  ): Promise<StealthAddressResult>;

  /**
   * @notice Generate multiple stealth addresses (batch)
   * @param recipients Array of recipient key pairs
   * @param ephemeralPrivateKey Optional shared ephemeral key
   * @returns Promise resolving to array of results
   */
  generateMultipleStealthAddresses(
    recipients: Array<{
      viewingKey: string;
      spendingKey: string;
    }>,
    ephemeralPrivateKey?: string
  ): Promise<StealthAddressResult[]>;

  // ========================================================================
  // STEALTH ADDRESS OPENING (RECEIVING)
  // ========================================================================

  /**
   * @notice Open/unlock a stealth address to derive private key
   * @param stealthAddress The stealth address to open
   * @param ephemeralPublicKey Ephemeral public key from announcement
   * @returns Promise resolving to wallet with stealth private key
   */
  openStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<any>; // ethers.Wallet

  /**
   * @notice Check if a stealth address belongs to user
   * @param stealthAddress Address to check
   * @param ephemeralPublicKey Ephemeral public key from announcement
   * @returns Promise resolving to boolean
   */
  isStealthAddressMine(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<boolean>;

  /**
   * @notice Get private key for owned stealth address
   * @param stealthAddress The stealth address
   * @param ephemeralPublicKey Ephemeral public key from announcement
   * @returns Promise resolving to private key hex string
   */
  getStealthPrivateKey(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<string>;

  // ========================================================================
  // SCANNING
  // ========================================================================

  /**
   * @notice Scan announced stealth addresses for ownership
   * @param announcements Array of announced stealth data
   * @returns Promise resolving to owned stealth addresses
   */
  scanStealthAddresses(
    announcements: AnnouncedStealth[]
  ): Promise<OwnedStealthAddress[]>;

  /**
   * @notice Quick scan using view tags (optimization)
   * @param announcements Array with view tags
   * @returns Promise resolving to potentially owned addresses (need full verification)
   */
  quickScanWithViewTags(
    announcements: AnnouncedStealth[]
  ): Promise<AnnouncedStealth[]>;

  // ========================================================================
  // METADATA & ANNOUNCEMENTS
  // ========================================================================

  /**
   * @notice Create ERC-5564 announcement metadata
   * @param stealthAddress Generated stealth address
   * @param ephemeralPublicKey Ephemeral public key
   * @returns StealthMetadata object
   */
  createAnnouncementMetadata(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): StealthMetadata;

  /**
   * @notice Parse announcement from transaction data
   * @param txData Transaction data or logs
   * @returns Promise resolving to AnnouncedStealth or null
   */
  parseAnnouncement(txData: any): Promise<AnnouncedStealth | null>;

  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * @notice Get all owned stealth addresses
   * @returns Promise resolving to array of owned stealth addresses
   */
  getAllOwnedStealthAddresses(): Promise<OwnedStealthAddress[]>;

  /**
   * @notice Clear cache and reset state
   * @returns Promise that resolves when cleared
   */
  clearCache(): Promise<void>;

  /**
   * @notice Verify stealth address was correctly generated
   * @param stealthAddress Address to verify
   * @param ephemeralPublicKey Ephemeral key used
   * @param spendingPublicKey Spending public key
   * @returns Promise resolving to boolean
   */
  verifyStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string,
    spendingPublicKey: string
  ): Promise<boolean>;
}

// ============================================================================
// EVENTS
// ============================================================================

export type SHIP_03_Events = {
  stealthKeysGenerated: (keys: StealthKeys) => void;
  stealthAddressGenerated: (result: StealthAddressResult) => void;
  stealthAddressOpened: (wallet: any) => void;
  stealthAddressScanned: (owned: OwnedStealthAddress[]) => void;
  error: (error: Error) => void;
};

