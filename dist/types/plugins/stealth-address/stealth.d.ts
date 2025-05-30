/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { EphemeralKeyPair, StealthAddressResult } from "./types";
declare global {
    interface Window {
        Stealth?: typeof Stealth;
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            Stealth?: typeof Stealth;
        }
    }
}
declare class Stealth {
    private readonly gun;
    private logs;
    constructor(gun: any);
    /**
     * Structured logging system
     */
    private log;
    /**
     * Cleanup sensitive data from memory
     */
    cleanupSensitiveData(): Promise<void>;
    getStealthKeys(): Promise<{
        spendingKey: string;
        viewingKey: string;
    }>;
    generateAndSaveKeys(pair?: EphemeralKeyPair): Promise<void>;
    /**
     * Removes the initial tilde (~) from the public key if present
     */
    formatPublicKey(publicKey: string | null): string | null;
    /**
     * Creates a new stealth account
     */
    createAccount(): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * Generates a stealth address for a recipient
     * @param viewingPublicKey Recipient's viewing public key
     * @param spendingPublicKey Recipient's spending public key
     * @returns Promise with the stealth address result
     */
    generateStealthAddress(viewingPublicKey: string, spendingPublicKey: string): Promise<StealthAddressResult>;
    /**
     * Opens a stealth address by deriving the private key
     * @param stealthAddress Stealth address to open
     * @param encryptedRandomNumber Encrypted random number
     * @param ephemeralPublicKey Public key of the ephemeral key pair
     * @returns Promise with the wallet
     */
    openStealthAddress(stealthAddress: string, encryptedRandomNumber: string, ephemeralPublicKey: string, spendingKeyPair: EphemeralKeyPair, viewingKeyPair: EphemeralKeyPair): Promise<ethers.Wallet>;
    /**
     * Gets public key from an address
     */
    getPublicKey(publicKey: string): Promise<string | null>;
    /**
     * Derives a wallet from shared secret
     */
    deriveWalletFromSecret(secret: string): ethers.Wallet;
    /**
     * Generates a pair of stealth keys (viewing and spending)
     */
    generateStealthKeys(): {
        scanning: Promise<{
            privateKey: string;
            publicKey: string;
        }>;
        spending: Promise<{
            privateKey: string;
            publicKey: string;
        }>;
    };
    /**
     * Verifies a stealth address
     */
    verifyStealthAddress(ephemeralPublicKey: string, scanningPublicKey: string, spendingPublicKey: string, stealthAddress: string): boolean;
    private assertStealth;
}
export { Stealth };
export { Stealth as StealthAddresses };
export default Stealth;
