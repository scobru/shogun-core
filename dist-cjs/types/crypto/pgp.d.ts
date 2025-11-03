/**
 * PGP/OpenPGP Implementation
 * Simple and immediate PGP functionality using openpgp library
 * Provides encryption, decryption, signing, and key management
 */
export interface PGPKeyPair {
    publicKey: string;
    privateKey: string;
    keyId: string;
    fingerprint: string;
    created: Date;
}
export interface PGPEncryptedMessage {
    message: string;
    signature?: string;
    encrypted: boolean;
    signed: boolean;
}
export interface PGPSignature {
    message: string;
    signature: string;
    valid: boolean;
    keyId?: string;
}
export declare class PGPManager {
    private openpgp;
    private initialized;
    constructor();
    /**
     * Initialize PGP manager with openpgp library
     */
    initialize(): Promise<void>;
    /**
     * Generate a new PGP key pair
     */
    generateKeyPair(name: string, email: string, passphrase?: string): Promise<PGPKeyPair>;
    /**
     * Encrypt a message with public key
     */
    encryptMessage(message: string, publicKeyArmored: string, privateKeyArmored?: string, passphrase?: string): Promise<PGPEncryptedMessage>;
    /**
     * Decrypt a message with private key
     */
    decryptMessage(encryptedMessage: string, privateKeyArmored: string, passphrase?: string): Promise<string>;
    /**
     * Sign a message with private key
     */
    signMessage(message: string, privateKeyArmored: string, passphrase?: string): Promise<PGPSignature>;
    /**
     * Verify a message signature
     */
    verifySignature(message: string, signature: string, publicKeyArmored: string): Promise<PGPSignature>;
    /**
     * Get key information from armored key
     */
    getKeyInfo(keyArmored: string): Promise<any>;
    /**
     * Export key in different formats
     */
    exportKey(keyArmored: string, format?: "armored" | "binary"): Promise<string | Uint8Array>;
    /**
     * Import key from different formats
     */
    importKey(keyData: string | Uint8Array, format?: "armored" | "binary"): Promise<string>;
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Ensure the manager is initialized
     */
    private ensureInitialized;
}
export declare const createPGPManager: () => Promise<PGPManager>;
export declare const generatePGPKeyPair: (name: string, email: string, passphrase?: string) => Promise<PGPKeyPair>;
export declare const encryptPGPMessage: (message: string, publicKey: string, privateKey?: string, passphrase?: string) => Promise<PGPEncryptedMessage>;
export declare const decryptPGPMessage: (encryptedMessage: string, privateKey: string, passphrase?: string) => Promise<string>;
export declare const signPGPMessage: (message: string, privateKey: string, passphrase?: string) => Promise<PGPSignature>;
export declare const verifyPGPSignature: (message: string, signature: string, publicKey: string) => Promise<PGPSignature>;
export declare const demonstratePGP: () => Promise<{
    success: boolean;
    messageDecrypted: boolean;
    signatureValid: boolean;
    aliceKeyInfo: any;
    bobKeyInfo: any;
    demonstration: {
        keyGeneration: boolean;
        encryption: boolean;
        decryption: boolean;
        signing: boolean;
        verification: boolean;
        keyManagement: boolean;
    };
}>;
export default PGPManager;
