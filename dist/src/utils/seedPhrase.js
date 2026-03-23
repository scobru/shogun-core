/**
 * Seed Phrase Utilities for Multi-Device Authentication
 * Provides BIP39-compatible seed phrase generation and validation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { generateMnemonic, mnemonicToSeed as scureMnemonicToSeed, mnemonicToSeedSync, validateMnemonic, } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
/**
 * Generate a new 12-word BIP39 mnemonic seed phrase
 * @returns {string} 12-word mnemonic seed phrase
 */
export function generateSeedPhrase() {
    return generateMnemonic(wordlist, 128); // 128 bits = 12 words
}
/**
 * Validate a BIP39 mnemonic seed phrase
 * @param {string} mnemonic - The seed phrase to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateSeedPhrase(mnemonic) {
    try {
        return validateMnemonic(mnemonic, wordlist);
    }
    catch (error) {
        return false;
    }
}
/**
 * Derive a deterministic seed from mnemonic and username
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} username - Username to include in derivation
 * @returns {Promise<Uint8Array>} 64-byte seed for key derivation
 */
export function mnemonicToSeedAsync(mnemonic, username) {
    return __awaiter(this, void 0, void 0, function () {
        var passphrase;
        return __generator(this, function (_a) {
            if (!validateSeedPhrase(mnemonic)) {
                throw new Error('Invalid mnemonic seed phrase');
            }
            passphrase = "shogun-".concat(username);
            return [2 /*return*/, scureMnemonicToSeed(mnemonic, passphrase)];
        });
    });
}
/**
 * Derive a deterministic seed from mnemonic and username (Synchronous)
 * @param {string} mnemonic - The BIP39 mnemonic seed phrase
 * @param {string} username - Username to include in derivation
 * @returns {Uint8Array} 64-byte seed for key derivation
 * @deprecated Use mnemonicToSeedAsync instead to avoid blocking the main thread
 */
export function mnemonicToSeed(mnemonic, username) {
    if (!validateSeedPhrase(mnemonic)) {
        throw new Error('Invalid mnemonic seed phrase');
    }
    var passphrase = "shogun-".concat(username);
    return mnemonicToSeedSync(mnemonic, passphrase);
}
/**
 * Convert seed to deterministic password for GunDB
 * @param {Uint8Array} seed - The seed from mnemonic
 * @returns {string} Hex-encoded password
 */
export function seedToPassword(seed) {
    // Hash the seed to create a deterministic password
    var hash = sha256(seed);
    return bytesToHex(hash);
}
/**
 * Derive GunDB credentials from mnemonic
 * @param {string} mnemonic - The BIP39 mnemonic
 * @param {string} username - Username for derivation
 * @returns {Promise<{password: string; seed: Uint8Array}>} Credentials for GunDB
 */
export function deriveCredentialsFromMnemonic(mnemonic, username) {
    return __awaiter(this, void 0, void 0, function () {
        var seed, password;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mnemonicToSeedAsync(mnemonic, username)];
                case 1:
                    seed = _a.sent();
                    password = seedToPassword(seed);
                    return [2 /*return*/, {
                            password: password,
                            seed: seed,
                        }];
            }
        });
    });
}
/**
 * Format seed phrase for display (with word numbers)
 * @param {string} mnemonic - The seed phrase
 * @returns {string} Formatted seed phrase with numbers
 */
export function formatSeedPhrase(mnemonic) {
    var words = mnemonic.split(' ');
    return words.map(function (word, index) { return "".concat(index + 1, ". ").concat(word); }).join('\n');
}
/**
 * Normalize and clean user input for seed phrase
 * @param {string} input - User-provided seed phrase
 * @returns {string} Normalized seed phrase
 */
export function normalizeSeedPhrase(input) {
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
export function seedToKeyPair(mnemonic, username) {
    return __awaiter(this, void 0, void 0, function () {
        var generatePairFromMnemonic;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, import('../gundb/crypto.js')];
                case 1:
                    generatePairFromMnemonic = (_a.sent()).generatePairFromMnemonic;
                    return [2 /*return*/, generatePairFromMnemonic(mnemonic, username)];
            }
        });
    });
}
