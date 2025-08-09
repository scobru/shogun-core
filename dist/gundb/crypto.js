"use strict";
/**
 * Cryptographic utilities for GunDB integration.
 * Based on GunDB's SEA (Security, Encryption, Authorization) module.
 * @see https://github.com/amark/gun/wiki/Snippets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHash = isHash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encFor = encFor;
exports.decFrom = decFrom;
exports.hashText = hashText;
exports.hashObj = hashObj;
exports.secret = secret;
exports.getShortHash = getShortHash;
exports.safeHash = safeHash;
exports.unsafeHash = unsafeHash;
exports.safeJSONParse = safeJSONParse;
exports.randomUUID = randomUUID;
const gun_1 = require("gun");
const uuid_1 = require("uuid");
/**
 * Checks if a string is a valid GunDB hash
 * @param str - String to check
 * @returns True if string matches GunDB hash format (44 chars ending with =)
 */
function isHash(str) {
    return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
}
/**
 * Encrypts data with Gun.SEA
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Promise that resolves with the encrypted data
 */
async function encrypt(data, key) {
    if (!gun_1.SEA || !gun_1.SEA.encrypt) {
        throw new Error("SEA is not available");
    }
    return gun_1.SEA.encrypt(data, key);
}
/**
 * Decrypts data with Gun.SEA
 * @param encryptedData Encrypted data
 * @param key Decryption key
 * @returns Promise that resolves with the decrypted data
 */
async function decrypt(encryptedData, key) {
    if (!gun_1.SEA || !gun_1.SEA.decrypt) {
        throw new Error("SEA is not available");
    }
    return gun_1.SEA.decrypt(encryptedData, key);
}
/**
 * Encrypts data from a sender to a receiver using their public keys
 * @param data - Data to encrypt
 * @param sender - Sender's key pair
 * @param receiver - Receiver's public encryption key
 * @returns Promise resolving to encrypted data
 */
async function encFor(data, sender, receiver) {
    const secret = (await gun_1.SEA.secret(receiver.epub, sender));
    const encryptedData = await gun_1.SEA.encrypt(data, secret);
    return encryptedData;
}
/**
 * Decrypts data from a sender using receiver's private key
 * @param data - Data to decrypt
 * @param sender - Sender's public encryption key
 * @param receiver - Receiver's key pair
 * @returns Promise resolving to decrypted data
 */
async function decFrom(data, sender, receiver) {
    const secret = (await gun_1.SEA.secret(sender.epub, receiver));
    const decryptedData = await gun_1.SEA.decrypt(data, secret);
    return decryptedData;
}
/**
 * Creates a SHA-256 hash of text
 * @param text - Text to hash
 * @returns Promise resolving to hash string
 */
async function hashText(text) {
    if (!gun_1.SEA || !gun_1.SEA.work) {
        throw new Error("SEA is not available");
    }
    let hash = await gun_1.SEA.work(text, null, null, { name: "SHA-256" });
    return hash;
}
/**
 * Creates a hash of an object by stringifying it first
 * @param obj - Object to hash
 * @returns Promise resolving to hash and original stringified data
 */
async function hashObj(obj) {
    let hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
    let hash = await hashText(hashed);
    return { hash, hashed };
}
/**
 * Generates a shared secret between two parties
 * @param epub - Public encryption key
 * @param pair - Key pair
 * @returns Promise resolving to shared secret
 */
async function secret(epub, pair) {
    const secret = await gun_1.SEA.secret(epub, pair);
    return secret;
}
/**
 * Creates a short hash using PBKDF2
 * @param text - Text to hash
 * @param salt - Salt for hashing
 * @returns Promise resolving to hex-encoded hash
 */
async function getShortHash(text, salt) {
    return await gun_1.SEA.work(text, null, null, {
        name: "PBKDF2",
        encode: "hex",
        salt,
    });
}
/**
 * Converts unsafe characters in hash to URL-safe versions
 * @param unsafe - String containing unsafe characters
 * @returns URL-safe string with encoded characters
 */
function safeHash(unsafe) {
    if (!unsafe)
        return;
    const encode_regex = /[+=/]/g;
    return unsafe.replace(encode_regex, encodeChar);
}
/**
 * Helper function to encode individual characters
 * @param c - Character to encode
 * @returns Encoded character
 */
//@ts-ignore
function encodeChar(c) {
    switch (c) {
        case "+":
            return "-";
        case "=":
            return ".";
        case "/":
            return "_";
    }
}
/**
 * Converts URL-safe characters back to original hash characters
 * @param safe - URL-safe string
 * @returns Original string with decoded characters
 */
function unsafeHash(safe) {
    if (!safe)
        return;
    const decode_regex = /[._-]/g;
    return safe.replace(decode_regex, decodeChar);
}
/**
 * Helper function to decode individual characters
 * @param c - Character to decode
 * @returns Decoded character
 */
//@ts-ignore
function decodeChar(c) {
    switch (c) {
        case "-":
            return "+";
        case ".":
            return "=";
        case "_":
            return "/";
    }
}
/**
 * Safely parses JSON with fallback to default value
 * @param input - String to parse as JSON
 * @param def - Default value if parsing fails
 * @returns Parsed object or default value
 */
function safeJSONParse(input, def = {}) {
    if (!input) {
        return def;
    }
    else if (typeof input === "object") {
        return input;
    }
    try {
        return JSON.parse(input);
    }
    catch (e) {
        return def;
    }
}
function randomUUID() {
    const c = globalThis?.crypto;
    if (c?.randomUUID)
        return c.randomUUID();
    try {
        if (c?.getRandomValues) {
            const bytes = new Uint8Array(16);
            c.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
            bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
            const toHex = (n) => n.toString(16).padStart(2, "0");
            const b = Array.from(bytes).map(toHex).join("");
            return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}`;
        }
    }
    catch { }
    return (0, uuid_1.v4)();
}
