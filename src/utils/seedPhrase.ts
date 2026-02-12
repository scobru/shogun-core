/**
 * Seed Phrase Utilities for Multi-Device Authentication
 * Provides BIP39-compatible seed phrase generation and validation
 */

import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Generate a new 12-word BIP39 mnemonic seed phrase
 * @returns {string} 12-word mnemonic seed phrase
 */
export function generateSeedPhrase(): string {
  return generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validate a BIP39 mnemonic seed phrase
 * @param {string} mnemonic - The seed phrase to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateSeedPhrase(mnemonic: string): boolean {
  try {
    return validateMnemonic(mnemonic, wordlist);
  } catch (error) {
    return false;
  }
}

/**
 * Derive a deterministic seed from mnemonic and username
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} username - Username to include in derivation
 * @returns {Uint8Array} 64-byte seed for key derivation
 */
export function mnemonicToSeed(mnemonic: string, username: string): Uint8Array {
  if (!validateSeedPhrase(mnemonic)) {
    throw new Error('Invalid mnemonic seed phrase');
  }

  // Use username as additional entropy in the passphrase
  // This ensures different users with same seed phrase get different keys
  const passphrase = `shogun-${username}`;
  return mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Convert seed to deterministic password for GunDB
 * @param {Uint8Array} seed - The seed from mnemonic
 * @returns {string} Hex-encoded password
 */
export function seedToPassword(seed: Uint8Array): string {
  // Hash the seed to create a deterministic password
  const hash = sha256(seed);
  return bytesToHex(hash);
}

/**
 * Derive GunDB credentials from mnemonic
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {{password: string; seed: Uint8Array}} Credentials for GunDB
 */
export function deriveCredentialsFromMnemonic(
  mnemonic: string,
  username: string,
): { password: string; seed: Uint8Array } {
  const seed = mnemonicToSeed(mnemonic, username);
  const password = seedToPassword(seed);

  return {
    password,
    seed,
  };
}

/**
 * Format seed phrase for display (with word numbers)
 * @param {string} mnemonic - The seed phrase
 * @returns {string} Formatted seed phrase with numbers
 */
export function formatSeedPhrase(mnemonic: string): string {
  const words = mnemonic.split(' ');
  return words.map((word, index) => `${index + 1}. ${word}`).join('\n');
}

/**
 * Normalize and clean user input for seed phrase
 * @param {string} input - User-provided seed phrase
 * @returns {string} Normalized seed phrase
 */
export function normalizeSeedPhrase(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Convert mnemonic to SEA Key Pair directly
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {Promise<any>} SEA Key Pair
 */
export async function seedToKeyPair(
  mnemonic: string,
  username: string,
): Promise<any> {
  const { generatePairFromMnemonic } = await import('../gundb/crypto');
  return generatePairFromMnemonic(mnemonic, username);
}
