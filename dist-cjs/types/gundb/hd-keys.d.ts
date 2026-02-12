/**
 * Hierarchical Deterministic Key Derivation for GunDB
 *
 * Implements additive key derivation as documented in the Gun fork.
 * This allows deriving purpose-specific child key pairs from a master pair,
 * enabling HD-wallet-like key management for GunDB:
 *
 * - Each "purpose" (e.g., "messaging", "payments", "signing") gets its own key
 * - Child keys are deterministic: same master + purpose = same child
 * - Public-only derivation allows third parties to compute child public keys
 *   without knowing the master private key
 *
 * @module hd-keys
 */
import { ISEAPair } from 'gun';
/**
 * Derive a deterministic child key pair from a master pair and purpose string.
 *
 * Uses Gun's SEA.work to derive a seed from the master private key + purpose,
 * then generates a new pair from that seed. If the Gun fork's native
 * additive derivation is available, it uses that instead.
 *
 * @param masterPair - The master SEA key pair
 * @param purpose - Purpose string for derivation (e.g., "messaging", "payments")
 * @returns Promise resolving to a child ISEAPair
 * @throws Error if SEA is not available or masterPair is invalid
 */
export declare function deriveChildKey(masterPair: ISEAPair, purpose: string): Promise<ISEAPair>;
/**
 * Derive only the public key for a child, without needing the master private key.
 *
 * This enables third parties to compute a child's public key from the master
 * public key + purpose, using only public information. This is the HD key
 * "watch-only" capability.
 *
 * NOTE: This requires the Gun fork's additive derivation support.
 * If not available, it falls back to a hash-based approximation that
 * can be used as a deterministic identifier but NOT for cryptographic
 * operations.
 *
 * @param masterPub - The master public key
 * @param purpose - Purpose string for derivation
 * @returns Promise resolving to the derived public key string
 */
export declare function deriveChildPublicKey(masterPub: string, purpose: string): Promise<string>;
/**
 * Derive a full set of purpose-specific key pairs from a master pair.
 *
 * @param masterPair - The master SEA key pair
 * @param purposes - Array of purpose strings (e.g., ["messaging", "payments", "signing"])
 * @returns Promise resolving to a record mapping purpose → ISEAPair
 */
export declare function deriveKeyHierarchy(masterPair: ISEAPair, purposes: string[]): Promise<Record<string, ISEAPair>>;
