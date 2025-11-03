"use strict";
/**
 * Seed Phrase Utilities for Multi-Device Authentication
 * Provides BIP39-compatible seed phrase generation and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeedPhrase = generateSeedPhrase;
exports.validateSeedPhrase = validateSeedPhrase;
exports.mnemonicToSeed = mnemonicToSeed;
exports.seedToPassword = seedToPassword;
exports.deriveCredentialsFromMnemonic = deriveCredentialsFromMnemonic;
exports.formatSeedPhrase = formatSeedPhrase;
exports.normalizeSeedPhrase = normalizeSeedPhrase;
const bip39_1 = require("@scure/bip39");
const english_1 = require("@scure/bip39/wordlists/english");
const sha256_1 = require("@noble/hashes/sha256");
const utils_1 = require("@noble/hashes/utils");
/**
 * Generate a new 12-word BIP39 mnemonic seed phrase
 * @returns {string} 12-word mnemonic seed phrase
 */
function generateSeedPhrase() {
    return (0, bip39_1.generateMnemonic)(english_1.wordlist, 128); // 128 bits = 12 words
}
/**
 * Validate a BIP39 mnemonic seed phrase
 * @param {string} mnemonic - The seed phrase to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateSeedPhrase(mnemonic) {
    try {
        return (0, bip39_1.validateMnemonic)(mnemonic, english_1.wordlist);
    }
    catch (error) {
        return false;
    }
}
/**
 * Derive a deterministic seed from mnemonic and username
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} username - Username to include in derivation
 * @returns {Uint8Array} 64-byte seed for key derivation
 */
function mnemonicToSeed(mnemonic, username) {
    if (!validateSeedPhrase(mnemonic)) {
        throw new Error("Invalid mnemonic seed phrase");
    }
    // Use username as additional entropy in the passphrase
    // This ensures different users with same seed phrase get different keys
    const passphrase = `shogun-${username}`;
    return (0, bip39_1.mnemonicToSeedSync)(mnemonic, passphrase);
}
/**
 * Convert seed to deterministic password for GunDB
 * @param {Uint8Array} seed - The seed from mnemonic
 * @returns {string} Hex-encoded password
 */
function seedToPassword(seed) {
    // Hash the seed to create a deterministic password
    const hash = (0, sha256_1.sha256)(seed);
    return (0, utils_1.bytesToHex)(hash);
}
/**
 * Derive GunDB credentials from mnemonic
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {{password: string; seed: Uint8Array}} Credentials for GunDB
 */
function deriveCredentialsFromMnemonic(mnemonic, username) {
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
function formatSeedPhrase(mnemonic) {
    const words = mnemonic.split(" ");
    return words.map((word, index) => `${index + 1}. ${word}`).join("\n");
}
/**
 * Normalize and clean user input for seed phrase
 * @param {string} input - User-provided seed phrase
 * @returns {string} Normalized seed phrase
 */
function normalizeSeedPhrase(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/[^\w\s]/g, ""); // Remove special characters
}
