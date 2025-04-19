import "gun/sea";
/**
 * Encrypts a value using SEA encryption
 * @param value Value to encrypt
 * @param epriv Private encryption key
 * @returns Encrypted value
 */
export declare const encrypt: (value: any, epriv: any) => Promise<string>;
/**
 * Decrypts a value using SEA encryption
 * @param value Encrypted value to decrypt
 * @param epriv Private encryption key
 * @returns Decrypted value
 */
export declare const decrypt: (value: string, epriv: any) => Promise<any>;
/**
 * Signs data with a key pair
 * @param data Data to sign
 * @param pair Key pair containing private and public keys
 * @returns Signed data
 */
export declare const sign: (data: any, pair: {
    priv: string;
    pub: string;
}) => Promise<string>;
/**
 * Verifies signed data using a public key
 * @param signed Signed data to verify
 * @param pub Public key or object containing public key
 * @returns Verified data
 */
export declare const verify: (signed: string, pub: string | {
    pub: string;
}) => Promise<any>;
/**
 * Generates a new SEA key pair
 * @returns Generated key pair
 */
export declare const generateKeyPair: () => Promise<import("gun").ISEAPair>;
/**
 * Clears the encryption cache
 */
export declare const clearCache: () => void;
/**
 * Verifica se una stringa è un hash di crittografia
 * @param str Stringa da verificare
 * @returns True se è un hash valido
 */
export declare const isHash: (str: any) => boolean;
/**
 * Crittografa dati tra mittente e destinatario
 * @param data Dati da crittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati crittografati
 */
export declare const encFor: (data: any, sender: any, receiver: any) => Promise<string | null>;
/**
 * Decrittografa dati tra mittente e destinatario
 * @param data Dati da decrittografare
 * @param sender Chiave del mittente
 * @param receiver Chiave del destinatario
 * @returns Dati decrittografati
 */
export declare const decFrom: (data: any, sender: any, receiver: any) => Promise<any>;
/**
 * Genera un hash SHA-256 per un testo
 * @param text Testo da hashare
 * @returns Hash generato
 */
export declare const hashText: (text: string) => Promise<string | undefined>;
/**
 * Genera un hash per un oggetto
 * @param obj Oggetto da hashare
 * @returns Hash generato e oggetto serializzato
 */
export declare const hashObj: (obj: any) => Promise<{
    hash: string | undefined;
    hashed: string;
}>;
/**
 * Genera un hash corto personalizzato
 * @param text Testo da hashare
 * @param salt Sale opzionale
 * @returns Hash corto generato
 */
export declare const getShortHash: (text: string, salt?: string) => Promise<string | undefined>;
/**
 * Converte un hash in formato sicuro per URL
 * @param unsafe Hash non sicuro
 * @returns Hash sicuro per URL
 */
export declare const safeHash: (unsafe: string | undefined) => string | undefined;
/**
 * Converte un hash sicuro nel formato originale
 * @param safe Hash sicuro
 * @returns Hash originale
 */
export declare const unsafeHash: (safe: string | undefined) => string | undefined;
/**
 * Analizza in modo sicuro una stringa JSON
 * @param input Stringa da analizzare
 * @param def Valore predefinito in caso di errore
 * @returns Oggetto analizzato o valore predefinito
 */
export declare const safeJSONParse: (input: any, def?: {}) => any;
