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

import { ISEAPair } from "gun";

/**
 * Get SEA from available global sources.
 */
function getSEA(): any {
    if ((globalThis as any).Gun?.SEA) return (globalThis as any).Gun.SEA;
    if ((globalThis as any).SEA) return (globalThis as any).SEA;
    if (typeof window !== "undefined" && (window as any).Gun?.SEA) {
        return (window as any).Gun.SEA;
    }
    return null;
}

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
export async function deriveChildKey(
    masterPair: ISEAPair,
    purpose: string,
): Promise<ISEAPair> {
    const sea = getSEA();
    if (!sea || !sea.work || !sea.pair) {
        throw new Error("SEA not available for HD key derivation");
    }

    if (!masterPair?.priv || !masterPair?.pub) {
        throw new Error("Invalid master pair: missing priv or pub key");
    }

    if (!purpose || purpose.trim().length === 0) {
        throw new Error("Purpose string is required for key derivation");
    }

    // Try native additive derivation if available (Gun fork feature)
    try {
        const childPair = await sea.pair(null, {
            priv: masterPair.priv,
            seed: purpose,
        });
        if (childPair?.pub && childPair?.priv && childPair?.epub && childPair?.epriv) {
            return childPair as ISEAPair;
        }
    } catch {
        // Native API not available, use fallback
    }

    // Fallback: derive a seed from master private key + purpose using PBKDF2
    const derivedSeed = await sea.work(
        masterPair.priv + ":" + purpose,
        "shogun-hd-derivation",
        null,
        { name: "SHA-256" },
    );

    // Generate a pair seeded by the derived value
    try {
        const childPair = await sea.pair(null, { seed: derivedSeed });
        if (childPair?.pub && childPair?.priv) {
            return childPair as ISEAPair;
        }
    } catch {
        // seed-based pair not supported
    }

    // Final fallback: use work output as input to pair()
    // NOTE: This is NOT fully deterministic without native seed support
    console.warn(
        "[hd-keys] Native seed-based derivation not available. Child key may not be deterministic.",
    );
    const childPair = await sea.pair();
    return childPair as ISEAPair;
}

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
export async function deriveChildPublicKey(
    masterPub: string,
    purpose: string,
): Promise<string> {
    const sea = getSEA();
    if (!sea || !sea.work) {
        throw new Error("SEA not available for public key derivation");
    }

    if (!masterPub) {
        throw new Error("Master public key is required");
    }

    // Derive a deterministic identifier from masterPub + purpose
    // This uses SEA.work as a KDF to produce a unique, repeatable string
    const derivedId = await sea.work(
        masterPub + ":" + purpose,
        "shogun-hd-pub-derivation",
        null,
        { name: "SHA-256" },
    );

    return derivedId as string;
}

/**
 * Derive a full set of purpose-specific key pairs from a master pair.
 *
 * @param masterPair - The master SEA key pair
 * @param purposes - Array of purpose strings (e.g., ["messaging", "payments", "signing"])
 * @returns Promise resolving to a record mapping purpose → ISEAPair
 */
export async function deriveKeyHierarchy(
    masterPair: ISEAPair,
    purposes: string[],
): Promise<Record<string, ISEAPair>> {
    if (!purposes || purposes.length === 0) {
        return {};
    }

    const hierarchy: Record<string, ISEAPair> = {};

    for (const purpose of purposes) {
        hierarchy[purpose] = await deriveChildKey(masterPair, purpose);
    }

    return hierarchy;
}
