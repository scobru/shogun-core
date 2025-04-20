import Gun from "gun";
import "gun/sea";
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
export const encrypt = async (value, epriv) => {
    const encrypted = await Gun.SEA.encrypt(value, { epriv });
    addToCache(encrypted, value);
    return encrypted;
};
/**
 * Decrypts a value using SEA encryption
 * @param value Encrypted value to decrypt
 * @param epriv Private encryption key
 * @returns Decrypted value
 */
export const decrypt = async (value, epriv) => {
    if (seaMemo.has(value))
        return seaMemo.get(value);
    const decrypted = await Gun.SEA.decrypt(value, { epriv });
    if (decrypted !== undefined)
        addToCache(value, decrypted);
    return decrypted;
};
/**
 * Signs data with a key pair
 * @param data Data to sign
 * @param pair Key pair containing private and public keys
 * @returns Signed data
 */
export const sign = async (data, pair) => {
    return await Gun.SEA.sign(data, pair);
};
/**
 * Verifies signed data using a public key
 * @param signed Signed data to verify
 * @param pub Public key or object containing public key
 * @returns Verified data
 */
export const verify = async (signed, pub) => {
    return await Gun.SEA.verify(signed, pub);
};
/**
 * Generates a new SEA key pair
 * @returns Generated key pair
 */
export const generateKeyPair = async () => {
    return await Gun.SEA.pair();
};
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
export const clearCache = () => {
    seaMemo.clear();
};
/**
 * Checks if a string is a cryptographic hash
 * @param str String to verify
 * @returns True if it's a valid hash
 */
export const isHash = (str) => {
    return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
};
/**
 * Encrypts data between sender and receiver
 * @param data Data to encrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Encrypted data
 */
export const encFor = async (data, sender, receiver) => {
    if (!receiver || !receiver.epub || !sender)
        return null;
    const secret = await Gun.SEA.secret(receiver.epub, sender);
    return await Gun.SEA.encrypt(data, secret);
};
/**
 * Decrypts data between sender and receiver
 * @param data Data to decrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Decrypted data
 */
export const decFrom = async (data, sender, receiver) => {
    if (!sender || !sender.epub || !receiver || !data)
        return null;
    const secret = await Gun.SEA.secret(sender.epub, receiver);
    return await Gun.SEA.decrypt(data, secret);
};
/**
 * Generates a SHA-256 hash for text
 * @param text Text to hash
 * @returns Generated hash
 */
export const hashText = async (text) => {
    return await Gun.SEA.work(text, null, null, { name: "SHA-256" });
};
/**
 * Generates a hash for an object
 * @param obj Object to hash
 * @returns Generated hash and serialized object
 */
export const hashObj = async (obj) => {
    const hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
    const hash = await hashText(hashed);
    return { hash, hashed };
};
/**
 * Generates a custom short hash
 * @param text Text to hash
 * @param salt Optional salt
 * @returns Generated short hash
 */
export const getShortHash = async (text, salt) => {
    return await Gun.SEA.work(text, null, null, {
        name: "PBKDF2",
        encode: "hex",
        salt: salt || null,
    });
};
/**
 * Converts a hash to URL-safe format
 * @param unsafe Unsafe hash
 * @returns URL-safe hash
 */
export const safeHash = (unsafe) => {
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
/**
 * Converts a URL-safe hash back to original format
 * @param safe Safe hash
 * @returns Original hash
 */
export const unsafeHash = (safe) => {
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
/**
 * Safely parses a JSON string
 * @param input String to parse
 * @param def Default value if parsing fails
 * @returns Parsed object or default value
 */
export const safeJSONParse = (input, def = {}) => {
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
