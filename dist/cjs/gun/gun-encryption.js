"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJSONParse = exports.unsafeHash = exports.safeHash = exports.getShortHash = exports.hashObj = exports.hashText = exports.decFrom = exports.encFor = exports.isHash = exports.clearCache = exports.generateKeyPair = exports.verify = exports.sign = exports.decrypt = exports.encrypt = void 0;
const gun_1 = __importDefault(require("gun"));
require("gun/sea");
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
 * Verifica se una stringa è un hash di crittografia
 * @param str Stringa da verificare
 * @returns True se è un hash valido
 */
const isHash = (str) => {
    return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
};
exports.isHash = isHash;
/**
 * Crittografa dati tra mittente e destinatario
 * @param data Dati da crittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati crittografati
 */
const encFor = async (data, sender, receiver) => {
    if (!receiver || !receiver.epub || !sender)
        return null;
    const secret = await gun_1.default.SEA.secret(receiver.epub, sender);
    return await gun_1.default.SEA.encrypt(data, secret);
};
exports.encFor = encFor;
/**
 * Decrittografa dati tra mittente e destinatario
 * @param data Dati da decrittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati decrittografati
 */
const decFrom = async (data, sender, receiver) => {
    if (!sender || !sender.epub || !receiver || !data)
        return null;
    const secret = await gun_1.default.SEA.secret(sender.epub, receiver);
    return await gun_1.default.SEA.decrypt(data, secret);
};
exports.decFrom = decFrom;
/**
 * Genera un hash SHA-256 per un testo
 * @param text Testo da hashare
 * @returns Hash generato
 */
const hashText = async (text) => {
    return await gun_1.default.SEA.work(text, null, null, { name: "SHA-256" });
};
exports.hashText = hashText;
/**
 * Genera un hash per un oggetto
 * @param obj Oggetto da hashare
 * @returns Hash generato e oggetto serializzato
 */
const hashObj = async (obj) => {
    const hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
    const hash = await (0, exports.hashText)(hashed);
    return { hash, hashed };
};
exports.hashObj = hashObj;
/**
 * Genera un hash corto personalizzato
 * @param text Testo da hashare
 * @param salt Sale opzionale
 * @returns Hash corto generato
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
 * Converte un hash in formato sicuro per URL
 * @param unsafe Hash non sicuro
 * @returns Hash sicuro per URL
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
 * Converte un hash sicuro nel formato originale
 * @param safe Hash sicuro
 * @returns Hash originale
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
 * Analizza in modo sicuro una stringa JSON
 * @param input Stringa da analizzare
 * @param def Valore predefinito in caso di errore
 * @returns Oggetto analizzato o valore predefinito
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
