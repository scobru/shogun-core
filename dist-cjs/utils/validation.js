"use strict";
// Utility di validazione e generazione credenziali per ShogunCore
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUsername = validateUsername;
exports.validateEmail = validateEmail;
exports.validateProvider = validateProvider;
exports.generateUsernameFromIdentity = generateUsernameFromIdentity;
exports.generateDeterministicPassword = generateDeterministicPassword;
// --- VALIDAZIONE ---
/**
 * Valida uno username secondo le regole comuni
 */
function validateUsername(username) {
    if (!username || typeof username !== 'string')
        return false;
    if (username.length < 3 || username.length > 64)
        return false;
    if (!/^[a-zA-Z0-9._-]+$/.test(username))
        return false;
    return true;
}
/**
 * Valida una email
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string')
        return false;
    // Regex semplice per email
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
/**
 * Valida un provider OAuth supportato
 * @deprecated OAuth has been removed from Shogun Core
 */
function validateProvider(provider) {
    console.warn('[validation] OAuth has been removed from Shogun Core');
    return false;
}
// --- GENERAZIONE USERNAME ---
/**
 * Genera uno username uniforme a partire da provider e userInfo
 * Esempio: google_utente, github_12345, nostr_pubkey, web3_0xabc...
 */
function generateUsernameFromIdentity(provider, userInfo) {
    if (provider === 'web3' && userInfo.id) {
        return `web3_${userInfo.id.toLowerCase()}`;
    }
    if (provider === 'nostr' && userInfo.id) {
        return `nostr_${userInfo.id}`;
    }
    if (provider === 'webauthn' && userInfo.id) {
        return `webauthn_${userInfo.id}`;
    }
    if (userInfo.email && validateEmail(userInfo.email)) {
        return `${provider}_${userInfo.email.split('@')[0]}`;
    }
    if (userInfo.name) {
        return `${provider}_${userInfo.name.replace(/\s+/g, '_')}`;
    }
    if (userInfo.id) {
        return `${provider}_${userInfo.id}`;
    }
    return `${provider}_user`;
}
// --- GENERAZIONE PASSWORD DETERMINISTICA ---
const ethers_1 = require("ethers");
/**
 * Genera una password deterministica sicura a partire da un salt
 * Usare per OAuth, Web3, Nostr, ecc.
 */
function generateDeterministicPassword(salt) {
    try {
        // Restituisce una stringa hex di 32 caratteri
        return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(salt)).slice(2, 34);
    }
    catch (error) {
        // Fallback in case ethers is not available
        console.warn('ethers not available, using fallback password generation');
        return Buffer.from(salt).toString('hex').slice(0, 32);
    }
}
