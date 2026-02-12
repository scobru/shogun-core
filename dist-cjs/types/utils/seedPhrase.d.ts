/**
 * Seed Phrase Utilities for Multi-Device Authentication
 * Provides BIP39-compatible seed phrase generation and validation
 */
/**
 * Generate a new 12-word BIP39 mnemonic seed phrase
 * @returns {string} 12-word mnemonic seed phrase
 */
export declare function generateSeedPhrase(): string;
/**
 * Validate a BIP39 mnemonic seed phrase
 * @param {string} mnemonic - The seed phrase to validate
 * @returns {boolean} True if valid, false otherwise
 */
export declare function validateSeedPhrase(mnemonic: string): boolean;
/**
 * Derive a deterministic seed from mnemonic and username
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} username - Username to include in derivation
 * @returns {Uint8Array} 64-byte seed for key derivation
 */
export declare function mnemonicToSeed(mnemonic: string, username: string): Uint8Array;
/**
 * Convert seed to deterministic password for GunDB
 * @param {Uint8Array} seed - The seed from mnemonic
 * @returns {string} Hex-encoded password
 */
export declare function seedToPassword(seed: Uint8Array): string;
/**
 * Derive GunDB credentials from mnemonic
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {{password: string; seed: Uint8Array}} Credentials for GunDB
 */
export declare function deriveCredentialsFromMnemonic(mnemonic: string, username: string): {
    password: string;
    seed: Uint8Array;
};
/**
 * Format seed phrase for display (with word numbers)
 * @param {string} mnemonic - The seed phrase
 * @returns {string} Formatted seed phrase with numbers
 */
export declare function formatSeedPhrase(mnemonic: string): string;
/**
 * Normalize and clean user input for seed phrase
 * @param {string} input - User-provided seed phrase
 * @returns {string} Normalized seed phrase
 */
export declare function normalizeSeedPhrase(input: string): string;
/**
 * Convert mnemonic to SEA Key Pair directly
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {Promise<any>} SEA Key Pair
 */
export declare function seedToKeyPair(mnemonic: string, username: string): Promise<any>;
