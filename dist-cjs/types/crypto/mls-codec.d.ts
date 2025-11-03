/**
 * MLS Message encoding/decoding utilities
 *
 * Since ts-mls doesn't export encode/decode functions from the main package,
 * we'll use JSON serialization with Uint8Array and BigInt conversion for transmission.
 * This works for KeyPackage, Welcome, Commit, and other MLS messages.
 */
/**
 * Encode a KeyPackage to JSON string for transmission
 */
export declare function encodeKeyPackage(keyPackage: any): string;
/**
 * Decode JSON string back to a KeyPackage object
 */
export declare function decodeKeyPackage(encoded: string): any;
/**
 * Encode a Welcome message to JSON string for transmission
 */
export declare function encodeWelcome(welcome: any): string;
/**
 * Decode JSON string back to a Welcome object
 */
export declare function decodeWelcome(encoded: string): any;
/**
 * Encode a Commit message to JSON string for transmission
 */
export declare function encodeCommit(commit: any): string;
/**
 * Decode JSON string back to a Commit object
 */
export declare function decodeCommit(encoded: string): any;
/**
 * Encode a RatchetTree to JSON string for transmission
 */
export declare function encodeRatchetTree(ratchetTree: any): string;
/**
 * Decode JSON string back to a RatchetTree
 */
export declare function decodeRatchetTree(encoded: string): any;
