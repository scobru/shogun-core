/**
 * Cryptographic utilities for GunDB integration.
 * Based on GunDB's SEA (Security, Encryption, Authorization) module.
 * @see https://github.com/amark/gun/wiki/Snippets
 */
// @ts-nocheck

import { ISEAPair } from "gun";
/**
 * Checks if a string is a valid GunDB hash
 * @param str - String to check
 * @returns True if string matches GunDB hash format (44 chars ending with =)
 */
export declare function isHash(str: string): boolean;
/**
 * Encrypts data with Gun.SEA
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Promise that resolves with the encrypted data
 */
export declare function encrypt(data: any, key: string): Promise<string>;
/**
 * Decrypts data with Gun.SEA
 * @param encryptedData Encrypted data
 * @param key Decryption key
 * @returns Promise that resolves with the decrypted data
 */
export declare function decrypt(encryptedData: string, key: string): Promise<string | any>;
/**
 * Encrypts data from a sender to a receiver using their public keys
 * @param data - Data to encrypt
 * @param sender - Sender's key pair
 * @param receiver - Receiver's public encryption key
 * @returns Promise resolving to encrypted data
 */
export declare function encFor(data: any, sender: ISEAPair, receiver: {
    epub: string;
}): Promise<string>;
/**
 * Decrypts data from a sender using receiver's private key
 * @param data - Data to decrypt
 * @param sender - Sender's public encryption key
 * @param receiver - Receiver's key pair
 * @returns Promise resolving to decrypted data
 */
export declare function decFrom(data: any, sender: {
    epub: string;
}, receiver: ISEAPair): Promise<any>;
/**
 * Creates a SHA-256 hash of text
 * @param text - Text to hash
 * @returns Promise resolving to hash string
 */
export declare function hashText(text: string): Promise<string | undefined>;
/**
 * Creates a hash of an object by stringifying it first
 * @param obj - Object to hash
 * @returns Promise resolving to hash and original stringified data
 */
export declare function hashObj(obj: any): Promise<{
    hash: string | undefined;
    hashed: string;
}>;
/**
 * Generates a shared secret between two parties
 * @param epub - Public encryption key
 * @param pair - Key pair
 * @returns Promise resolving to shared secret
 */
export declare function secret(epub: string, pair: ISEAPair): Promise<string | undefined>;
/**
 * Creates a short hash using PBKDF2
 * @param text - Text to hash
 * @param salt - Salt for hashing
 * @returns Promise resolving to hex-encoded hash
 */
export declare function getShortHash(text: string, salt: string): Promise<string | undefined>;
/**
 * Converts unsafe characters in hash to URL-safe versions
 * @param unsafe - String containing unsafe characters
 * @returns URL-safe string with encoded characters
 */
export declare function safeHash(unsafe: {
    replace: (arg0: RegExp, arg1: (c: any) => "-" | "." | "_" | undefined) => any;
}): any;
/**
 * Converts URL-safe characters back to original hash characters
 * @param safe - URL-safe string
 * @returns Original string with decoded characters
 */
export declare function unsafeHash(safe: {
    replace: (arg0: RegExp, arg1: (c: any) => "=" | "+" | "/" | undefined) => any;
}): any;
/**
 * Safely parses JSON with fallback to default value
 * @param input - String to parse as JSON
 * @param def - Default value if parsing fails
 * @returns Parsed object or default value
 */
export declare function safeJSONParse(input: string, def?: {}): any;
export declare function randomUUID(): string;
