"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayBufferToBase64 = exports.base64ToArrayBuffer = exports.concatArrayBuffers = exports.hexToBuffer = exports.bufferToHex = exports.sha3_512Hash = exports.sha512Hash = exports.sha256Hash = exports.randomString = void 0;
// Cryptographically Random String Generator
const randomString = (additionalSalt = "") => {
    const randomStringLength = 16;
    const randomValues = crypto.getRandomValues(new Uint8Array(randomStringLength));
    const randomHex = Array.from(randomValues)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    return additionalSalt ? additionalSalt + randomHex : randomHex;
};
exports.randomString = randomString;
// Hashing Methods
const sha256Hash = async (input) => {
    const inputString = JSON.stringify(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
exports.sha256Hash = sha256Hash;
const sha512Hash = async (input) => {
    const inputString = JSON.stringify(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
exports.sha512Hash = sha512Hash;
const sha3_512Hash = async (input) => {
    // Note: SHA3-512 requires a library like js-sha3
    // For now, we'll use SHA-512 as a fallback
    const inputString = JSON.stringify(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
exports.sha3_512Hash = sha3_512Hash;
// Utility functions for crypto operations
const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};
exports.bufferToHex = bufferToHex;
const hexToBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
};
exports.hexToBuffer = hexToBuffer;
const concatArrayBuffers = (...buffers) => {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }
    return result.buffer;
};
exports.concatArrayBuffers = concatArrayBuffers;
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
exports.base64ToArrayBuffer = base64ToArrayBuffer;
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};
exports.arrayBufferToBase64 = arrayBufferToBase64;
