/**
 * SHIP-03: Dual-Key Stealth Address Implementation
 *
 * Full port of shogun-stealth-address with Fluidkey integration.
 * Extends SHIP-00 and SHIP-02 to provide ERC-5564 compatible stealth addresses.
 *
 * Based on:
 * - SHIP-00 for identity foundation
 * - SHIP-02 for Ethereum operations
 * - ERC-5564 for stealth address standard
 * - Fluidkey Stealth Account Kit
 * - @scure/bip32 for HD key derivation
 *
 * Features:
 * ✅ Dual-key stealth (viewing + spending keys)
 * ✅ ERC-5564 / Fluidkey compatible
 * ✅ Deterministic derivation from SHIP-00
 * ✅ View tag optimization for scanning
 * ✅ Announcement metadata
 * ✅ Batch generation
 * ✅ Fluidkey generateStealthAddresses
 * ✅ Fluidkey generateStealthPrivateKey
 */

import type { ISHIP_00 } from "../interfaces/ISHIP_00";
import type { ISHIP_02 } from "../interfaces/ISHIP_02";
import type {
  ISHIP_03,
  StealthKeys,
  EphemeralKeyPair,
  StealthAddressResult,
  StealthMetadata,
  AnnouncedStealth,
  OwnedStealthAddress,
  SHIP_03_Config,
} from "../interfaces/ISHIP_03";
import { ethers, SigningKey } from "ethers";

// Fluidkey Stealth Account Kit (optional - graceful degradation if not available)
let generateKeysFromSignature: any;
let extractViewingPrivateKeyNode: any;
let generateEphemeralPrivateKey: any;
let generateStealthAddresses: any;
let generateStealthPrivateKey: any;
let HDKey: any;

try {
  const fluidkey = require("@fluidkey/stealth-account-kit");
  generateKeysFromSignature = fluidkey.generateKeysFromSignature;
  extractViewingPrivateKeyNode = fluidkey.extractViewingPrivateKeyNode;
  generateEphemeralPrivateKey = fluidkey.generateEphemeralPrivateKey;
  generateStealthAddresses = fluidkey.generateStealthAddresses;
  generateStealthPrivateKey = fluidkey.generateStealthPrivateKey;
  
  const scure = require("@scure/bip32");
  HDKey = scure.HDKey;
} catch (error) {
  console.warn("⚠️  Fluidkey/scure not available. Install with: yarn add @fluidkey/stealth-account-kit @scure/bip32");
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Normalize hex string with optional length validation
 */
function normalizeHex(str: string, length?: number): string {
  if (!str) return "";
  let s = str.toLowerCase();
  if (!s.startsWith("0x")) s = "0x" + s;
  if (length && s.length !== 2 + length * 2) {
    s = "0x" + s.slice(2).padStart(length * 2, "0").slice(0, length * 2);
  }
  return s;
}

/**
 * Normalize public key to compressed format (33 bytes)
 */
function normalizePublicKey(publicKey: string): string {
  try {
    let normalized = publicKey;

    if (normalized.startsWith("0x")) {
      normalized = normalized.slice(2);
    }

    // If uncompressed (130 hex chars = 65 bytes), compress it
    if (normalized.length === 130) {
      return SigningKey.computePublicKey("0x" + normalized, true);
    }

    // If already compressed (66 hex chars = 33 bytes), ensure 0x prefix
    if (normalized.length === 66) {
      return "0x" + normalized;
    }

    // If it's 64 hex chars (missing prefix byte), add 0x04 for uncompressed
    if (normalized.length === 64) {
      return SigningKey.computePublicKey("0x04" + normalized, true);
    }

    throw new Error(`Invalid public key length: ${normalized.length}`);
  } catch (error) {
    console.error("Error normalizing public key:", error);
    throw error;
  }
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-03 Reference Implementation
 *
 * Full Fluidkey-compatible stealth address system derived from SHIP-00.
 * All keys are deterministically derived from the user's SHIP-00 identity.
 */
class SHIP_03 implements ISHIP_03 {
  private identity: ISHIP_00;
  private eth: ISHIP_02;
  private config: SHIP_03_Config;
  private initialized: boolean = false;

  // GunDB Node Names for SHIP-03 storage
  public static readonly NODES = {
    STEALTH_KEYS_PUBLIC: "stealth_keys_public",
    STEALTH_ANNOUNCEMENTS: "stealth_announcements",
  } as const;

  // Stealth keys (derived from SHIP-00)
  private viewingKey: { publicKey: string; privateKey: string } | null = null;
  private spendingKey: { publicKey: string; privateKey: string } | null = null;

  // Cache of owned stealth addresses
  private ownedStealthAddresses: Map<string, OwnedStealthAddress> = new Map();

  // Cache of announcements
  private announcementCache: Map<string, AnnouncedStealth> = new Map();

  constructor(identity: ISHIP_00, eth: ISHIP_02, config: SHIP_03_Config = {}) {
    this.identity = identity;
    this.eth = eth;
    this.config = {
      erc5564Compatible: config.erc5564Compatible ?? true,
      defaultSchemeId: config.defaultSchemeId ?? 0,
      enableViewTag: config.enableViewTag ?? true,
      autoScan: config.autoScan ?? false,
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure SHIP-00 is authenticated
      if (!this.identity.isLoggedIn()) {
        throw new Error("SHIP-00 identity not authenticated");
      }

      // Ensure SHIP-02 is initialized
      if (!this.eth.isInitialized()) {
        throw new Error("SHIP-02 not initialized");
      }

      // Derive stealth keys from SHIP-00 identity
      await this.deriveStealthKeysFromIdentity();

      this.initialized = true;
      console.log("✅ SHIP-03 initialized with Fluidkey stealth addresses");
      console.log("📍 Viewing Public Key:", this.viewingKey?.publicKey);
      console.log("📍 Spending Public Key:", this.spendingKey?.publicKey);
    } catch (error: any) {
      throw new Error(`SHIP-03 initialization failed: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ========================================================================
  // KEY MANAGEMENT
  // ========================================================================

  async getStealthKeys(): Promise<StealthKeys> {
    this.ensureInitialized();

    if (!this.viewingKey || !this.spendingKey) {
      throw new Error("Stealth keys not initialized");
    }

    return {
      viewingKey: {
        publicKey: this.viewingKey.publicKey,
        privateKey: this.viewingKey.privateKey,
      },
      spendingKey: {
        publicKey: this.spendingKey.publicKey,
        privateKey: this.spendingKey.privateKey,
      },
    };
  }

  /**
   * Get public stealth keys by username (alias)
   * Resolves username → Gun pub → stealth keys
   */
  async getPublicStealthKeysByUsername(username: string): Promise<{
    viewingPublicKey: string;
    spendingPublicKey: string;
  } | null> {
    try {
      console.log(`🔍 Looking up stealth keys for username: ${username}`);

      // Use SHIP-00 to resolve username → Gun public key
      const userData = await this.identity.getUserByAlias(username);
      
      if (!userData || !userData.userPub) {
        console.log(`❌ User not found: ${username}`);
        return null;
      }

      console.log(`✅ Resolved ${username} → ${userData.userPub.slice(0, 20)}...`);

      // Get stealth keys using Gun public key
      return await this.getPublicStealthKeys(userData.userPub);
    } catch (error) {
      console.error("Error getting stealth keys by username:", error);
      return null;
    }
  }

  /**
   * Get public stealth keys by Gun public key
   */
  async getPublicStealthKeys(userPub: string): Promise<{
    viewingPublicKey: string;
    spendingPublicKey: string;
  } | null> {
    try {
      // Access Gun through identity
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available");
        return null;
      }

      console.log(`🔍 Loading stealth keys for pub: ${userPub.slice(0, 20)}...`);

      // Get user's published stealth keys
      const data = await new Promise<any>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log("⏱️  Timeout waiting for stealth keys");
            resolve(null);
          }
        }, 5000);

        gun
          .get(userPub)
          .get(SHIP_03.NODES.STEALTH_KEYS_PUBLIC)
          .once((data: any) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(data || null);
            }
          });
      });

      if (!data || !data.viewingKey || !data.spendingKey) {
        console.log(`❌ No stealth keys found for user: ${userPub.slice(0, 20)}...`);
        console.log("💡 User may not have initialized SHIP-03 yet");
        return null;
      }

      console.log("✅ Stealth keys found:");
      console.log(`  Viewing: ${data.viewingKey.slice(0, 20)}...`);
      console.log(`  Spending: ${data.spendingKey.slice(0, 20)}...`);

      return {
        viewingPublicKey: data.viewingKey,
        spendingPublicKey: data.spendingKey,
      };
    } catch (error) {
      console.error("Error getting public stealth keys:", error);
      return null;
    }
  }

  /**
   * Search stealth keys in directory (all published keys)
   * Returns list of users who have published stealth keys
   */
  async searchStealthDirectory(): Promise<Array<{
    username?: string;
    gunPub: string;
    viewingPublicKey: string;
    spendingPublicKey: string;
    timestamp?: number;
  }>> {
    try {
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available");
        return [];
      }

      console.log("🔍 Searching stealth address directory...");

      // In production, this would query a directory index
      // For now, return empty array
      console.warn("⚠️  Directory search not yet implemented");
      console.log("💡 Users can share their username or Gun pub for stealth payments");

      return [];
    } catch (error) {
      console.error("Error searching directory:", error);
      return [];
    }
  }

  async exportStealthKeys(): Promise<string> {
    this.ensureInitialized();

    const keys = await this.getStealthKeys();

    // Encrypt keys using SHIP-00 SEA
    const shogun = this.identity.getShogun();
    const crypto = shogun?.db?.crypto;
    const keyPair = this.identity.getKeyPair();

    if (!crypto || !keyPair) {
      // Fallback: return as JSON (should encrypt in production)
      console.warn("Crypto not available, exporting unencrypted");
      return JSON.stringify(keys);
    }

    // Encrypt with user's own keys
    const encrypted = await crypto.encrypt(JSON.stringify(keys), keyPair);
    return JSON.stringify(encrypted);
  }

  async importStealthKeys(encryptedKeys: string): Promise<void> {
    this.ensureInitialized();

    // Decrypt if needed
    const shogun = this.identity.getShogun();
    const crypto = shogun?.db?.crypto;
    const keyPair = this.identity.getKeyPair();

    let keys: StealthKeys;

    if (crypto && keyPair) {
      try {
        const encrypted = JSON.parse(encryptedKeys);
        const decrypted = await crypto.decrypt(encrypted, keyPair);
        keys = JSON.parse(decrypted);
      } catch {
        // If decrypt fails, try parsing as plain JSON
        keys = JSON.parse(encryptedKeys);
      }
    } else {
      keys = JSON.parse(encryptedKeys);
    }

    this.viewingKey = keys.viewingKey;
    this.spendingKey = keys.spendingKey;

    console.log("✅ Stealth keys imported");
  }

  // ========================================================================
  // STEALTH ADDRESS GENERATION (FLUIDKEY)
  // ========================================================================

  async generateEphemeralKeyPair(): Promise<EphemeralKeyPair> {
    // Use Fluidkey's method if we have viewing key
    if (this.viewingKey) {
      try {
        const cleanPriv = this.viewingKey.privateKey.startsWith("0x")
          ? this.viewingKey.privateKey.slice(2)
          : this.viewingKey.privateKey;

        const hdKey = HDKey.fromMasterSeed(Buffer.from(cleanPriv, "hex"));

        const result = generateEphemeralPrivateKey({
          viewingPrivateKeyNode: hdKey,
          nonce: BigInt(Date.now()), // Use timestamp as nonce
          chainId: 1,
          coinType: 60,
        });

        const ephemeralWallet = new ethers.Wallet(result.ephemeralPrivateKey);

        return {
          publicKey: ephemeralWallet.signingKey.publicKey,
          privateKey: result.ephemeralPrivateKey,
        };
      } catch (error) {
        console.warn("Fluidkey ephemeral key generation failed, using fallback:", error);
      }
    }

    // Fallback: random ephemeral key
    const ephemeralWallet = ethers.Wallet.createRandom();
    return {
      publicKey: ephemeralWallet.signingKey.publicKey,
      privateKey: ephemeralWallet.privateKey,
    };
  }

  async generateStealthAddress(
    recipientViewingKey: string,
    recipientSpendingKey: string,
    ephemeralPrivateKey?: string
  ): Promise<StealthAddressResult> {
    try {
      this.ensureInitialized();

      console.log("🔐 Generating stealth address using Fluidkey...");

      // Normalize public keys
      const normalizedViewingKey = normalizePublicKey(recipientViewingKey);
      const normalizedSpendingKey = normalizePublicKey(recipientSpendingKey);

      console.log("📍 Normalized viewing key:", normalizedViewingKey);
      console.log("📍 Normalized spending key:", normalizedSpendingKey);

      // Generate or use provided ephemeral key
      let ephemeralKey = ephemeralPrivateKey;
      if (!ephemeralKey) {
        const ephemeralPair = await this.generateEphemeralKeyPair();
        ephemeralKey = ephemeralPair.privateKey;
      }

      // Ensure 0x prefix
      if (!ephemeralKey.startsWith("0x")) {
        ephemeralKey = "0x" + ephemeralKey;
      }

      console.log("🔑 Using ephemeral key (first 10 chars):", ephemeralKey.slice(0, 10) + "...");

      // Use Fluidkey's generateStealthAddresses
      const result = generateStealthAddresses({
        ephemeralPrivateKey: ephemeralKey as `0x${string}`,
        spendingPublicKeys: [normalizedSpendingKey as `0x${string}`],
      });

      const stealthAddress = result.stealthAddresses[0];
      const ephemeralWallet = new ethers.Wallet(ephemeralKey);
      const ephemeralPublicKey = ephemeralWallet.signingKey.publicKey;

      console.log("✅ Stealth address generated:", stealthAddress);
      console.log("📍 Ephemeral public key:", ephemeralPublicKey);

      // Generate view tag if enabled
      let viewTag: string | undefined;
      if (this.config.enableViewTag) {
        // Compute shared secret for view tag
        const sharedSecret = ephemeralWallet.signingKey.computeSharedSecret(
          normalizedViewingKey
        );
        const hashedSecret = ethers.keccak256(sharedSecret);
        viewTag = hashedSecret.slice(0, 6); // First byte as 0xNN
      }

      return {
        success: true,
        stealthAddress,
        ephemeralPublicKey,
        viewTag,
      };
    } catch (error: any) {
      console.error("❌ Error generating stealth address:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateMultipleStealthAddresses(
    recipients: Array<{ viewingKey: string; spendingKey: string }>,
    ephemeralPrivateKey?: string
  ): Promise<StealthAddressResult[]> {
    try {
      this.ensureInitialized();

      // Generate ephemeral key if not provided
      let ephemeralKey = ephemeralPrivateKey;
      if (!ephemeralKey) {
        const ephemeralPair = await this.generateEphemeralKeyPair();
        ephemeralKey = ephemeralPair.privateKey;
      }

      if (!ephemeralKey.startsWith("0x")) {
        ephemeralKey = "0x" + ephemeralKey;
      }

      // Normalize all spending keys
      const normalizedSpendingKeys = recipients.map((r) =>
        normalizePublicKey(r.spendingKey)
      ) as `0x${string}`[];

      // Use Fluidkey batch generation
      const result = generateStealthAddresses({
        ephemeralPrivateKey: ephemeralKey as `0x${string}`,
        spendingPublicKeys: normalizedSpendingKeys,
      });

      const ephemeralWallet = new ethers.Wallet(ephemeralKey);
      const ephemeralPublicKey = ephemeralWallet.signingKey.publicKey;

      // Map results
      const results: StealthAddressResult[] = result.stealthAddresses.map(
        (addr: string, idx: number) => ({
          success: true,
          stealthAddress: addr,
          ephemeralPublicKey,
          viewTag: this.config.enableViewTag
            ? this.computeViewTag(
                ephemeralKey!,
                recipients[idx].viewingKey
              )
            : undefined,
        })
      );

      console.log(`✅ Generated ${results.length} stealth addresses (batch)`);

      return results;
    } catch (error: any) {
      console.error("❌ Error generating multiple stealth addresses:", error);
      return [
        {
          success: false,
          error: error.message,
        },
      ];
    }
  }

  // ========================================================================
  // STEALTH ADDRESS OPENING (FLUIDKEY)
  // ========================================================================

  async openStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<any> {
    this.ensureInitialized();

    if (!this.viewingKey || !this.spendingKey) {
      throw new Error("Stealth keys not available");
    }

    console.log("🔓 Opening stealth address using Fluidkey...");
    console.log("📍 Stealth address:", stealthAddress);
    console.log("📍 Ephemeral public key:", ephemeralPublicKey);

    try {
      // Normalize ephemeral public key
      const normalizedEphemeralKey = normalizePublicKey(ephemeralPublicKey);

      console.log("📍 Using keys:");
      console.log("  Viewing private:", this.viewingKey.privateKey.slice(0, 10) + "...");
      console.log("  Spending private:", this.spendingKey.privateKey.slice(0, 10) + "...");
      console.log("  Ephemeral public:", normalizedEphemeralKey.slice(0, 20) + "...");

      // Try using Fluidkey first
      let stealthWallet: ethers.Wallet;

      if (generateStealthPrivateKey) {
        try {
          console.log("🔐 Trying Fluidkey generateStealthPrivateKey...");

          // Fluidkey uses only ephemeralPublicKey and spendingPrivateKey
          // The viewing key is used to compute shared secret separately
          const result = generateStealthPrivateKey({
            ephemeralPublicKey: normalizedEphemeralKey as `0x${string}`,
            spendingPrivateKey: this.spendingKey.privateKey as `0x${string}`,
          });

          console.log("🔑 Fluidkey result:", result);

          // Extract stealthPrivateKey from result
          const stealthPrivateKey = result.stealthPrivateKey;
          console.log("🔑 Stealth private key:", stealthPrivateKey.slice(0, 10) + "...");

          stealthWallet = new ethers.Wallet(stealthPrivateKey);
          console.log("✅ Wallet created from Fluidkey private key");
        } catch (fluidkeyError) {
          console.warn("⚠️  Fluidkey failed, using fallback method:", fluidkeyError);
          
          // Fallback: Manual computation
          stealthWallet = await this.openStealthAddressFallback(
            stealthAddress,
            normalizedEphemeralKey
          );
        }
      } else {
        console.warn("⚠️  Fluidkey not available, using fallback method");
        
        // Fallback: Manual computation
        stealthWallet = await this.openStealthAddressFallback(
          stealthAddress,
          normalizedEphemeralKey
        );
      }

      // Verify the derived address matches
      if (
        stealthWallet.address.toLowerCase() !== stealthAddress.toLowerCase()
      ) {
        throw new Error(
          `Derived address mismatch: ${stealthWallet.address} !== ${stealthAddress}`
        );
      }

      // Compute view tag for metadata
      const viewingWallet = new ethers.Wallet(this.viewingKey.privateKey);
      const sharedSecret = viewingWallet.signingKey.computeSharedSecret(
        normalizedEphemeralKey
      );
      const hashedSecret = ethers.keccak256(sharedSecret);
      const viewTag = hashedSecret.slice(0, 6);

      // Cache the owned stealth address
      const metadata: StealthMetadata = {
        ephemeralPublicKey: normalizedEphemeralKey,
        viewTag,
        stealthAddress,
        createdAt: Date.now(),
      };

      const ownedAddress: OwnedStealthAddress = {
        stealthAddress,
        ephemeralPublicKey: normalizedEphemeralKey,
        privateKey: stealthWallet.privateKey,
        wallet: stealthWallet,
        metadata,
      };

      this.ownedStealthAddresses.set(stealthAddress, ownedAddress);

      console.log("✅ Stealth address opened successfully");

      return stealthWallet;
    } catch (error: any) {
      console.error("❌ Error opening stealth address:", error);
      throw error;
    }
  }

  async isStealthAddressMine(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<boolean> {
    try {
      const wallet = await this.openStealthAddress(
        stealthAddress,
        ephemeralPublicKey
      );
      return wallet.address.toLowerCase() === stealthAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  async getStealthPrivateKey(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): Promise<string> {
    const wallet = await this.openStealthAddress(
      stealthAddress,
      ephemeralPublicKey
    );
    return wallet.privateKey;
  }

  // ========================================================================
  // SCANNING
  // ========================================================================

  async scanStealthAddresses(
    announcements: AnnouncedStealth[]
  ): Promise<OwnedStealthAddress[]> {
    this.ensureInitialized();

    console.log(`🔍 Scanning ${announcements.length} stealth announcements...`);

    const owned: OwnedStealthAddress[] = [];

    for (const announcement of announcements) {
      try {
        const isMine = await this.isStealthAddressMine(
          announcement.stealthAddress,
          announcement.ephemeralPublicKey
        );

        if (isMine) {
          const ownedAddress = this.ownedStealthAddresses.get(
            announcement.stealthAddress
          );
          if (ownedAddress) {
            owned.push(ownedAddress);
          }
        }
      } catch (error) {
        // Skip invalid announcements
        console.warn("Invalid announcement:", announcement.stealthAddress, error);
      }
    }

    console.log(
      `✅ Scanned ${announcements.length} announcements, found ${owned.length} owned`
    );

    return owned;
  }

  async quickScanWithViewTags(
    announcements: AnnouncedStealth[]
  ): Promise<AnnouncedStealth[]> {
    this.ensureInitialized();

    if (!this.config.enableViewTag) {
      // If view tags disabled, return all for full scan
      return announcements;
    }

    const potentiallyOwned: AnnouncedStealth[] = [];

    for (const announcement of announcements) {
      // Quick check using view tag (if available)
      if (announcement.viewTag && this.viewingKey) {
        try {
          const normalizedEphemeralKey = normalizePublicKey(
            announcement.ephemeralPublicKey
          );

          const viewingWallet = new ethers.Wallet(this.viewingKey.privateKey);
          const sharedSecret = viewingWallet.signingKey.computeSharedSecret(
            normalizedEphemeralKey
          );
          const hashedSecret = ethers.keccak256(sharedSecret);
          const computedViewTag = hashedSecret.slice(0, 6);

          // If view tags match, this might be ours
          if (computedViewTag === announcement.viewTag) {
            potentiallyOwned.push(announcement);
          }
        } catch (error) {
          // Include in full scan if view tag check fails
          potentiallyOwned.push(announcement);
        }
      } else {
        // No view tag, include in full scan
        potentiallyOwned.push(announcement);
      }
    }

    console.log(
      `🔍 View tag quick scan: ${potentiallyOwned.length}/${announcements.length} potential matches`
    );

    return potentiallyOwned;
  }

  // ========================================================================
  // METADATA & ANNOUNCEMENTS
  // ========================================================================

  createAnnouncementMetadata(
    stealthAddress: string,
    ephemeralPublicKey: string
  ): StealthMetadata {
    // Compute view tag
    let viewTag = "0x00";
    if (this.config.enableViewTag && this.viewingKey) {
      try {
        const normalizedEphemeralKey = normalizePublicKey(ephemeralPublicKey);
        const viewingWallet = new ethers.Wallet(this.viewingKey.privateKey);
        const sharedSecret = viewingWallet.signingKey.computeSharedSecret(
          normalizedEphemeralKey
        );
        const hashedSecret = ethers.keccak256(sharedSecret);
        viewTag = hashedSecret.slice(0, 6);
      } catch (error) {
        console.warn("Error computing view tag:", error);
        viewTag = "0x00";
      }
    }

    return {
      ephemeralPublicKey: normalizePublicKey(ephemeralPublicKey),
      viewTag,
      stealthAddress,
      createdAt: Date.now(),
    };
  }

  async parseAnnouncement(txData: any): Promise<AnnouncedStealth | null> {
    try {
      // Parse ERC-5564 Announcement event from transaction logs
      // event Announcement(
      //   uint256 indexed schemeId,
      //   address indexed stealthAddress,
      //   address indexed caller,
      //   bytes ephemeralPubKey,
      //   bytes metadata
      // )

      if (!txData || !txData.logs) {
        return null;
      }

      // ERC-5564 Announcement event signature
      const announcementTopic = ethers.id(
        "Announcement(uint256,address,address,bytes,bytes)"
      );

      for (const log of txData.logs) {
        if (log.topics[0] === announcementTopic) {
          // Parse event data
          const schemeId = parseInt(log.topics[1], 16);
          const stealthAddress = ethers.getAddress("0x" + log.topics[2].slice(26));
          const announcer = ethers.getAddress("0x" + log.topics[3].slice(26));

          // Decode ephemeral public key and metadata from data
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["bytes", "bytes"],
            log.data
          );

          const ephemeralPublicKey = ethers.hexlify(decoded[0]);
          const metadata = ethers.hexlify(decoded[1]);

          // Extract view tag from metadata (first byte)
          const viewTag = metadata.slice(0, 6);

          return {
            stealthAddress,
            ephemeralPublicKey,
            viewTag,
            schemeId,
            announcer,
            txHash: txData.hash,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error parsing announcement:", error);
      return null;
    }
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  async getAllOwnedStealthAddresses(): Promise<OwnedStealthAddress[]> {
    return Array.from(this.ownedStealthAddresses.values());
  }

  async clearCache(): Promise<void> {
    this.ownedStealthAddresses.clear();
    this.announcementCache.clear();
    console.log("✅ SHIP-03 cache cleared");
  }

  async verifyStealthAddress(
    stealthAddress: string,
    ephemeralPublicKey: string,
    spendingPublicKey: string
  ): Promise<boolean> {
    try {
      if (!this.viewingKey || !this.spendingKey) {
        return false;
      }

      const normalizedEphemeralKey = normalizePublicKey(ephemeralPublicKey);
      const normalizedSpendingKey = normalizePublicKey(spendingPublicKey);

      // Use Fluidkey to regenerate stealth private key
      const stealthPrivateKey = generateStealthPrivateKey({
        ephemeralPublicKey: normalizedEphemeralKey as `0x${string}`,
        viewingPrivateKey: this.viewingKey.privateKey as `0x${string}`,
        spendingPrivateKey: this.spendingKey.privateKey as `0x${string}`,
      });

      const derivedWallet = new ethers.Wallet(stealthPrivateKey);
      return (
        derivedWallet.address.toLowerCase() === stealthAddress.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Ensure system is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("SHIP-03 not initialized. Call initialize() first.");
    }
  }

  /**
   * Derive stealth keys deterministically from SHIP-00 identity
   *
   * Uses simple deterministic derivation instead of Fluidkey's generateKeysFromSignature
   * because it requires specific EIP-712 signature format.
   * 
   * We use Fluidkey only for:
   * - generateStealthAddresses (address generation)
   * - generateStealthPrivateKey (opening addresses)
   */
  private async deriveStealthKeysFromIdentity(): Promise<void> {
    try {
      // Get SHIP-00 keypair
      const keyPair = this.identity.getKeyPair();
      if (!keyPair || !keyPair.epriv || !keyPair.epub) {
        throw new Error("SHIP-00 identity keypair not available");
      }

      console.log("🔐 Deriving stealth keys from SHIP-00 identity...");

      // Derive viewing key deterministically from SHIP-00
      // Path: keccak256("SHIP-03-VIEWING" + epriv)
      const viewingSeed = ethers.keccak256(
        ethers.toUtf8Bytes("SHIP-03-VIEWING" + keyPair.epriv)
      );
      const viewingWallet = new ethers.Wallet(viewingSeed);

      this.viewingKey = {
        privateKey: viewingWallet.privateKey,
        publicKey: viewingWallet.signingKey.publicKey,
      };

      // Derive spending key deterministically from SHIP-00
      // Path: keccak256("SHIP-03-SPENDING" + epriv)
      const spendingSeed = ethers.keccak256(
        ethers.toUtf8Bytes("SHIP-03-SPENDING" + keyPair.epriv)
      );
      const spendingWallet = new ethers.Wallet(spendingSeed);

      this.spendingKey = {
        privateKey: spendingWallet.privateKey,
        publicKey: spendingWallet.signingKey.publicKey,
      };

      console.log("✅ Stealth keys derived from SHIP-00 (deterministic)");
      console.log("📍 Keys are compatible with Fluidkey stealth address operations");

      // Automatically publish public keys to Gun network
      await this.publishStealthKeys();
    } catch (error: any) {
      console.error("❌ Error deriving stealth keys:", error);
      throw error;
    }
  }

  /**
   * Publish public stealth keys to Gun for others to use (PUBLIC METHOD)
   */
  async publishStealthKeys(): Promise<void> {
    try {
      if (!this.viewingKey || !this.spendingKey) {
        return;
      }

      // Access Gun through identity
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available, skipping key publication");
        return;
      }

      const user = gun.user();
      if (!user || !user.is) {
        console.warn("User not authenticated on Gun");
        return;
      }

      const userPub = user.is.pub;

      // Publish public keys (NOT private keys!)
      const publicKeys = {
        viewingKey: this.viewingKey.publicKey,
        spendingKey: this.spendingKey.publicKey,
        timestamp: Date.now(),
      };

      // IMPORTANT: Save to PUBLIC path (not private user space)
      // gun.get(~userPub) would be private, gun.get(userPub) is public
      await new Promise<void>((resolve, reject) => {
        gun
          .get(userPub)
          .get(SHIP_03.NODES.STEALTH_KEYS_PUBLIC)
          .put(publicKeys, (ack: any) => {
            if (ack.err) {
              console.error("Error publishing stealth keys:", ack.err);
              reject(new Error(ack.err));
            } else {
              console.log("✅ Public stealth keys published to Gun network");
              console.log(`📍 Published at: ${userPub.slice(0, 20)}/${SHIP_03.NODES.STEALTH_KEYS_PUBLIC}`);
              resolve();
            }
          });
      });
    } catch (error) {
      console.error("Error publishing stealth keys:", error);
      // Don't throw - allow initialization to continue
    }
  }

  /**
   * Compute view tag for quick scanning
   */
  private computeViewTag(
    ephemeralPrivateKey: string,
    viewingPublicKey: string
  ): string {
    try {
      const ephemeralWallet = new ethers.Wallet(ephemeralPrivateKey);
      const normalizedViewingKey = normalizePublicKey(viewingPublicKey);

      const sharedSecret = ephemeralWallet.signingKey.computeSharedSecret(
        normalizedViewingKey
      );
      const hashedSecret = ethers.keccak256(sharedSecret);

      return hashedSecret.slice(0, 6); // First byte as 0xNN
    } catch {
      return "0x00";
    }
  }

  /**
   * Fallback method to open stealth address (manual ECDH computation)
   * Used when Fluidkey is not available or fails
   */
  private async openStealthAddressFallback(
    stealthAddress: string,
    normalizedEphemeralKey: string
  ): Promise<ethers.Wallet> {
    if (!this.viewingKey || !this.spendingKey) {
      throw new Error("Stealth keys not available");
    }

    console.log("🔧 Using fallback (manual ECDH)...");

    // Step 1: Compute shared secret (viewingPrivateKey * ephemeralPublicKey)
    const viewingWallet = new ethers.Wallet(this.viewingKey.privateKey);
    const sharedSecret = viewingWallet.signingKey.computeSharedSecret(
      normalizedEphemeralKey
    );

    console.log("🔑 Shared secret:", sharedSecret.slice(0, 20) + "...");

    // Step 2: Hash shared secret
    const hashedSecret = ethers.keccak256(sharedSecret);
    console.log("🔑 Hashed secret:", hashedSecret.slice(0, 20) + "...");

    // Step 3: Add to spending private key (mod secp256k1 order)
    const stealthPrivateKey = this.addPrivateKeys(
      hashedSecret,
      this.spendingKey.privateKey
    );

    console.log("🔑 Stealth private key:", stealthPrivateKey.slice(0, 10) + "...");

    // Step 4: Create wallet
    const stealthWallet = new ethers.Wallet(stealthPrivateKey);
    console.log("✅ Fallback wallet created:", stealthWallet.address);

    return stealthWallet;
  }

  /**
   * Add two private keys using modular arithmetic (secp256k1)
   */
  private addPrivateKeys(key1: string, key2: string): string {
    // secp256k1 curve order
    const n = BigInt(
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"
    );

    const k1 = BigInt(key1);
    const k2 = BigInt(key2);

    // Add and mod by curve order
    const sum = (k1 + k2) % n;

    // Convert back to hex with 0x prefix
    return "0x" + sum.toString(16).padStart(64, "0");
  }
}

export { SHIP_03 };
