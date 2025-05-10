"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJSONParse = exports.unsafeHash = exports.safeHash = exports.getShortHash = exports.hashObj = exports.hashText = exports.decFrom = exports.encFor = exports.isHash = exports.clearCache = exports.generateKeyPair = exports.verify = exports.sign = exports.decrypt = exports.encrypt = void 0;
const gun_1 = __importDefault(require("gun"));
/** Cache for encrypted/decrypted values */
const seaMemo = new Map();
/** Maximum cache size to prevent memory issues */
const MAX_CACHE_SIZE = 1000;
/**
 * Encrypts a value using SEA encryption
 * @param value Value to encrypt
 * @param epriv Private encryption key
 * @returns Encrypted value
 */
const encrypt = async (value, epriv) => {
    const encrypted = await gun_1.default.SEA.encrypt(value, { epriv });
    addToCache(encrypted, value);
    return encrypted;
};
exports.encrypt = encrypt;
/**
 * Decrypts a value using SEA encryption
 * @param value Encrypted value to decrypt
 * @param epriv Private encryption key
 * @returns Decrypted value
 */
const decrypt = async (value, epriv) => {
    if (seaMemo.has(value))
        return seaMemo.get(value);
    const decrypted = await gun_1.default.SEA.decrypt(value, { epriv });
    if (decrypted !== undefined)
        addToCache(value, decrypted);
    return decrypted;
};
exports.decrypt = decrypt;
/**
 * Signs data with a key pair
 * @param data Data to sign
 * @param pair Key pair containing private and public keys
 * @returns Signed data
 */
const sign = async (data, pair) => {
    return await gun_1.default.SEA.sign(data, pair);
};
exports.sign = sign;
/**
 * Verifies signed data using a public key
 * @param signed Signed data to verify
 * @param pub Public key or object containing public key
 * @returns Verified data
 */
const verify = async (signed, pub) => {
    return await gun_1.default.SEA.verify(signed, pub);
};
exports.verify = verify;
/**
 * Generates a new SEA key pair
 * @returns Generated key pair
 */
const generateKeyPair = async () => {
    return await gun_1.default.SEA.pair();
};
exports.generateKeyPair = generateKeyPair;
/**
 * Adds a key-value pair to the cache, managing size limits
 * @param key Cache key
 * @param value Cache value
 */
const addToCache = (key, value) => {
    if (seaMemo.size >= MAX_CACHE_SIZE) {
        // Remove first inserted key (FIFO)
        const firstKey = seaMemo.keys().next().value;
        seaMemo.delete(firstKey);
    }
    seaMemo.set(key, value);
};
/**
 * Clears the encryption cache
 */
const clearCache = () => {
    seaMemo.clear();
};
exports.clearCache = clearCache;
/**
 * Checks if a string is a cryptographic hash
 * @param str String to verify
 * @returns True if it's a valid hash
 */
const isHash = (str) => {
    return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
};
exports.isHash = isHash;
/**
 * Encrypts data between sender and receiver
 * @param data Data to encrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Encrypted data
 */
const encFor = async (data, sender, receiver) => {
    if (!receiver || !receiver.epub || !sender)
        return null;
    const secret = await gun_1.default.SEA.secret(receiver.epub, sender);
    return await gun_1.default.SEA.encrypt(data, secret);
};
exports.encFor = encFor;
/**
 * Decrypts data between sender and receiver
 * @param data Data to decrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Decrypted data
 */
const decFrom = async (data, sender, receiver) => {
    if (!sender || !sender.epub || !receiver || !data)
        return null;
    const secret = await gun_1.default.SEA.secret(sender.epub, receiver);
    return await gun_1.default.SEA.decrypt(data, secret);
};
exports.decFrom = decFrom;
/**
 * Generates a SHA-256 hash for text
 * @param text Text to hash
 * @returns Generated hash
 */
const hashText = async (text) => {
    return await gun_1.default.SEA.work(text, null, null, { name: "SHA-256" });
};
exports.hashText = hashText;
/**
 * Generates a hash for an object
 * @param obj Object to hash
 * @returns Generated hash and serialized object
 */
const hashObj = async (obj) => {
    const hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
    const hash = await (0, exports.hashText)(hashed);
    return { hash, hashed };
};
exports.hashObj = hashObj;
/**
 * Generates a custom short hash
 * @param text Text to hash
 * @param salt Optional salt
 * @returns Generated short hash
 */
const getShortHash = async (text, salt) => {
    return await gun_1.default.SEA.work(text, null, null, {
        name: "PBKDF2",
        encode: "hex",
        salt: salt || null,
    });
};
exports.getShortHash = getShortHash;
/**
 * Converts a hash to URL-safe format
 * @param unsafe Unsafe hash
 * @returns URL-safe hash
 */
const safeHash = (unsafe) => {
    if (!unsafe)
        return undefined;
    const encode_regex = /[+=/]/g;
    return unsafe.replace(encode_regex, (c) => {
        switch (c) {
            case "+":
                return "-";
            case "=":
                return ".";
            case "/":
                return "_";
            default:
                return c;
        }
    });
};
exports.safeHash = safeHash;
/**
 * Converts a URL-safe hash back to original format
 * @param safe Safe hash
 * @returns Original hash
 */
const unsafeHash = (safe) => {
    if (!safe)
        return undefined;
    const decode_regex = /[._-]/g;
    return safe.replace(decode_regex, (c) => {
        switch (c) {
            case "-":
                return "+";
            case ".":
                return "=";
            case "_":
                return "/";
            default:
                return c;
        }
    });
};
exports.unsafeHash = unsafeHash;
/**
 * Safely parses a JSON string
 * @param input String to parse
 * @param def Default value if parsing fails
 * @returns Parsed object or default value
 */
const safeJSONParse = (input, def = {}) => {
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
};
exports.safeJSONParse = safeJSONParse;
