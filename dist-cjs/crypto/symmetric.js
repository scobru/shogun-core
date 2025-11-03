"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKeyFromPassword = exports.decryptWithSymmetricKey = exports.encryptWithSymmetricKey = exports.deserializeSymmetricKey = exports.generateSymmetricKey = void 0;
const hashing_1 = require("./hashing");
// Symmetric Key Generation and Encryption/Decryption Methods
const generateSymmetricKey = async () => {
    const key = await crypto.subtle.generateKey({
        name: "AES-GCM",
        length: 256, // can be 128, 192, or 256
    }, true, // whether the key is extractable
    ["encrypt", "decrypt"]);
    // Export key to JWK format for storage/transmission
    const keyJWK = await crypto.subtle.exportKey("jwk", key);
    return keyJWK;
};
exports.generateSymmetricKey = generateSymmetricKey;
const deserializeSymmetricKey = async (key) => {
    try {
        // If key is already a JWK object, use it directly
        // If it's a string, parse it first
        const jwkKey = typeof key === "string" ? JSON.parse(key) : key;
        // Validate that required JWK properties exist for symmetric keys
        if (!jwkKey.kty) {
            throw new Error('Invalid JWK: missing "kty" property');
        }
        // Ensure the key type is correct for symmetric keys
        if (jwkKey.kty !== "oct") {
            jwkKey.kty = "oct";
        }
        const deSerializedSymmetricKey = await crypto.subtle.importKey("jwk", jwkKey, {
            name: "AES-GCM",
        }, true, ["encrypt", "decrypt"]);
        return deSerializedSymmetricKey;
    }
    catch (error) {
        console.error("Error deserializing symmetric key:", error);
        throw error;
    }
};
exports.deserializeSymmetricKey = deserializeSymmetricKey;
const encryptWithSymmetricKey = async (message, key) => {
    const encodedMessage = new TextEncoder().encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // must be 12 bytes
    const encrypted = await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv: iv,
    }, key, encodedMessage);
    return {
        ciphertext: (0, hashing_1.arrayBufferToBase64)(encrypted),
        iv: (0, hashing_1.arrayBufferToBase64)(iv.buffer),
    };
};
exports.encryptWithSymmetricKey = encryptWithSymmetricKey;
const decryptWithSymmetricKey = async (encryptedData, key) => {
    const { ciphertext, iv } = encryptedData;
    const buffer = (0, hashing_1.base64ToArrayBuffer)(ciphertext);
    const ivBuffer = (0, hashing_1.base64ToArrayBuffer)(iv);
    try {
        const decrypted = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: ivBuffer,
        }, key, buffer);
        const message = new TextDecoder().decode(decrypted);
        return message;
    }
    catch (error) {
        throw new Error("Unable to decrypt message. Incorrect key.");
    }
};
exports.decryptWithSymmetricKey = decryptWithSymmetricKey;
// Password-based key derivation
const deriveKeyFromPassword = async (password, salt) => {
    const encoder = new TextEncoder();
    // Generate or use provided salt
    const actualSalt = salt || (await crypto.subtle.digest("SHA-256", encoder.encode(password)));
    // Import password as key material
    const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    // Derive AES-GCM key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: actualSalt,
        iterations: 100000, // Strong iteration count
        hash: "SHA-256",
    }, passwordKey, {
        name: "AES-GCM",
        length: 256,
    }, false, // Not extractable for security
    ["encrypt", "decrypt"]);
    return { key: derivedKey, salt: actualSalt };
};
exports.deriveKeyFromPassword = deriveKeyFromPassword;
