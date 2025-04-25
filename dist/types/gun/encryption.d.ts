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
 * Checks if a string is a cryptographic hash
 * @param str String to verify
 * @returns True if it's a valid hash
 */
export declare const isHash: (str: any) => boolean;
/**
 * Encrypts data between sender and receiver
 * @param data Data to encrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Encrypted data
 */
export declare const encFor: (data: any, sender: any, receiver: any) => Promise<string | null>;
/**
 * Decrypts data between sender and receiver
 * @param data Data to decrypt
 * @param sender Sender's key
 * @param receiver Receiver's key
 * @returns Decrypted data
 */
export declare const decFrom: (data: any, sender: any, receiver: any) => Promise<any>;
/**
 * Generates a SHA-256 hash for text
 * @param text Text to hash
 * @returns Generated hash
 */
export declare const hashText: (text: string) => Promise<string | undefined>;
/**
 * Generates a hash for an object
 * @param obj Object to hash
 * @returns Generated hash and serialized object
 */
export declare const hashObj: (obj: any) => Promise<{
    hash: string | undefined;
    hashed: string;
}>;
/**
 * Generates a custom short hash
 * @param text Text to hash
 * @param salt Optional salt
 * @returns Generated short hash
 */
export declare const getShortHash: (text: string, salt?: string) => Promise<string | undefined>;
/**
 * Converts a hash to URL-safe format
 * @param unsafe Unsafe hash
 * @returns URL-safe hash
 */
export declare const safeHash: (unsafe: string | undefined) => string | undefined;
/**
 * Converts a URL-safe hash back to original format
 * @param safe Safe hash
 * @returns Original hash
 */
export declare const unsafeHash: (safe: string | undefined) => string | undefined;
/**
 * Safely parses a JSON string
 * @param input String to parse
 * @param def Default value if parsing fails
 * @returns Parsed object or default value
 */
export declare const safeJSONParse: (input: any, def?: {}) => any;
