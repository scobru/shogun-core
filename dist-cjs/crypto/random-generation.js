"use strict";
// Random Generation Module for shogun-core
// Provides cryptographically secure and deterministic random generation
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomSeedPhrase = exports.randomPassword = exports.randomColor = exports.randomShuffle = exports.randomChoice = exports.chance = exports.createDeterministicRandom = exports.DeterministicRandom = exports.randomUUID = exports.randomBool = exports.randomFloat = exports.randomInt = exports.randomBytes = exports.generateRandomString = void 0;
// Cryptographically secure random string generation
const generateRandomString = (length = 32, additionalSalt) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = new Uint8Array(length);
    // Use crypto.getRandomValues for cryptographically secure randomness
    crypto.getRandomValues(randomBytes);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    // Add additional salt if provided
    if (additionalSalt) {
        result = additionalSalt + result;
    }
    return result;
};
exports.generateRandomString = generateRandomString;
// Generate random bytes
const randomBytes = (length) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
};
exports.randomBytes = randomBytes;
// Generate random integer in range
const randomInt = (min, max) => {
    const range = max - min + 1;
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    // Convert bytes to unsigned integer
    const randomValue = (randomBytes[0] << 24) |
        (randomBytes[1] << 16) |
        (randomBytes[2] << 8) |
        randomBytes[3];
    // Ensure positive result and use modulo
    return min + (Math.abs(randomValue) % range);
};
exports.randomInt = randomInt;
// Generate random float in range [0, 1)
const randomFloat = () => {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    // Convert bytes to float
    const randomValue = (randomBytes[0] << 24) |
        (randomBytes[1] << 16) |
        (randomBytes[2] << 8) |
        randomBytes[3];
    return randomValue / (0xffffffff + 1);
};
exports.randomFloat = randomFloat;
// Generate random boolean
const randomBool = () => {
    const randomBytes = new Uint8Array(1);
    crypto.getRandomValues(randomBytes);
    return randomBytes[0] % 2 === 0;
};
exports.randomBool = randomBool;
// Generate random UUID v4
const randomUUID = () => {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    // Set version (4) and variant bits
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // Version 4
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant bits
    // Convert to UUID string format
    const hex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join("-");
};
exports.randomUUID = randomUUID;
// Deterministic random generation using seed
class DeterministicRandom {
    constructor(seed) {
        this.seed = typeof seed === "string" ? this.hashString(seed) : seed;
    }
    // Simple hash function for string seeds
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    // Linear Congruential Generator (LCG)
    lcg() {
        this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.seed / Math.pow(2, 32);
    }
    // Generate random integer in range
    integer(min = 0, max = 100) {
        return Math.floor(this.lcg() * (max - min + 1)) + min;
    }
    // Generate random float in range
    floating(min = 0, max = 1, fixed = 4) {
        const value = this.lcg() * (max - min) + min;
        return parseFloat(value.toFixed(fixed));
    }
    // Generate random boolean
    bool() {
        return this.lcg() < 0.5;
    }
    // Generate random string
    string(length = 10, pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
        let result = "";
        for (let i = 0; i < length; i++) {
            result += pool[this.integer(0, pool.length - 1)];
        }
        return result;
    }
    // Generate random GUID (deterministic)
    guid() {
        const hex = "0123456789abcdef";
        let result = "";
        for (let i = 0; i < 32; i++) {
            result += hex[this.integer(0, 15)];
        }
        return [
            result.slice(0, 8),
            result.slice(8, 12),
            result.slice(12, 16),
            result.slice(16, 20),
            result.slice(20, 32),
        ].join("-");
    }
    // Generate random choice from array
    choice(array) {
        return array[this.integer(0, array.length - 1)];
    }
    // Shuffle array (Fisher-Yates algorithm)
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.integer(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    // Generate random color (hex)
    color() {
        return "#" + this.string(6, "0123456789abcdef");
    }
    // Generate random date in range
    date(start, end) {
        const startTime = start.getTime();
        const endTime = end.getTime();
        const randomTime = this.floating(startTime, endTime);
        return new Date(randomTime);
    }
}
exports.DeterministicRandom = DeterministicRandom;
// Factory function for deterministic random
const createDeterministicRandom = (seed) => {
    return new DeterministicRandom(seed);
};
exports.createDeterministicRandom = createDeterministicRandom;
// Chance.js-like interface for compatibility
const chance = (seed) => {
    return new DeterministicRandom(seed);
};
exports.chance = chance;
// Utility functions for random generation
const randomChoice = (array) => {
    return array[(0, exports.randomInt)(0, array.length - 1)];
};
exports.randomChoice = randomChoice;
const randomShuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (0, exports.randomInt)(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
exports.randomShuffle = randomShuffle;
const randomColor = () => {
    const hex = "0123456789abcdef";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += hex[(0, exports.randomInt)(0, 15)];
    }
    return color;
};
exports.randomColor = randomColor;
// Generate random password with specific requirements
const randomPassword = (options = {}) => {
    const { length = 12, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = true, excludeSimilar = true, } = options;
    let charset = "";
    if (includeUppercase) {
        charset += excludeSimilar
            ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
            : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (includeLowercase) {
        charset += excludeSimilar
            ? "abcdefghijkmnpqrstuvwxyz"
            : "abcdefghijklmnopqrstuvwxyz";
    }
    if (includeNumbers) {
        charset += excludeSimilar ? "23456789" : "0123456789";
    }
    if (includeSymbols) {
        charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }
    if (charset === "") {
        throw new Error("At least one character type must be included");
    }
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = (0, exports.randomInt)(0, charset.length - 1);
        password += charset[randomIndex];
    }
    return password;
};
exports.randomPassword = randomPassword;
// Generate random seed phrase (for crypto wallets)
const randomSeedPhrase = (wordCount = 12) => {
    // Common BIP39 wordlist (first 100 words for demo)
    const wordlist = [
        "abandon",
        "ability",
        "able",
        "about",
        "above",
        "absent",
        "absorb",
        "abstract",
        "absurd",
        "abuse",
        "access",
        "accident",
        "account",
        "accuse",
        "achieve",
        "acid",
        "acoustic",
        "acquire",
        "across",
        "act",
        "action",
        "actor",
        "actress",
        "actual",
        "adapt",
        "add",
        "addict",
        "address",
        "adjust",
        "admit",
        "adult",
        "advance",
        "advice",
        "aerobic",
        "affair",
        "afford",
        "afraid",
        "again",
        "age",
        "agent",
        "agree",
        "ahead",
        "aim",
        "air",
        "airport",
        "aisle",
        "alarm",
        "album",
        "alcohol",
        "alert",
        "alien",
        "all",
        "alley",
        "allow",
        "almost",
        "alone",
        "alpha",
        "already",
        "also",
        "alter",
        "always",
        "amateur",
        "amazing",
        "among",
        "amount",
        "amused",
        "analyst",
        "anchor",
        "ancient",
        "anger",
        "angle",
        "angry",
        "animal",
        "ankle",
        "announce",
        "annual",
        "another",
        "answer",
        "antenna",
        "antique",
        "anxiety",
        "any",
        "apart",
        "apology",
        "appear",
        "apple",
        "approve",
        "april",
        "arch",
        "arctic",
        "area",
        "arena",
        "argue",
        "arm",
        "armed",
        "armor",
        "army",
        "around",
        "arrange",
        "arrest",
    ];
    const phrase = [];
    for (let i = 0; i < wordCount; i++) {
        const randomIndex = (0, exports.randomInt)(0, wordlist.length - 1);
        phrase.push(wordlist[randomIndex]);
    }
    return phrase;
};
exports.randomSeedPhrase = randomSeedPhrase;
