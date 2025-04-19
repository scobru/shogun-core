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
 * Verifica se una stringa è un hash di crittografia
 * @param str Stringa da verificare
 * @returns True se è un hash valido
 */
export const isHash = (str) => {
    return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
};
/**
 * Crittografa dati tra mittente e destinatario
 * @param data Dati da crittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati crittografati
 */
export const encFor = async (data, sender, receiver) => {
    if (!receiver || !receiver.epub || !sender)
        return null;
    const secret = await Gun.SEA.secret(receiver.epub, sender);
    return await Gun.SEA.encrypt(data, secret);
};
/**
 * Decrittografa dati tra mittente e destinatario
 * @param data Dati da decrittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati decrittografati
 */
export const decFrom = async (data, sender, receiver) => {
    if (!sender || !sender.epub || !receiver || !data)
        return null;
    const secret = await Gun.SEA.secret(sender.epub, receiver);
    return await Gun.SEA.decrypt(data, secret);
};
/**
 * Genera un hash SHA-256 per un testo
 * @param text Testo da hashare
 * @returns Hash generato
 */
export const hashText = async (text) => {
    return await Gun.SEA.work(text, null, null, { name: "SHA-256" });
};
/**
 * Genera un hash per un oggetto
 * @param obj Oggetto da hashare
 * @returns Hash generato e oggetto serializzato
 */
export const hashObj = async (obj) => {
    const hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
    const hash = await hashText(hashed);
    return { hash, hashed };
};
/**
 * Genera un hash corto personalizzato
 * @param text Testo da hashare
 * @param salt Sale opzionale
 * @returns Hash corto generato
 */
export const getShortHash = async (text, salt) => {
    return await Gun.SEA.work(text, null, null, {
        name: "PBKDF2",
        encode: "hex",
        salt: salt || null,
    });
};
/**
 * Converte un hash in formato sicuro per URL
 * @param unsafe Hash non sicuro
 * @returns Hash sicuro per URL
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
 * Converte un hash sicuro nel formato originale
 * @param safe Hash sicuro
 * @returns Hash originale
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
 * Analizza in modo sicuro una stringa JSON
 * @param input Stringa da analizzare
 * @param def Valore predefinito in caso di errore
 * @returns Oggetto analizzato o valore predefinito
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
