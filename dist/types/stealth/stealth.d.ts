/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { Storage } from "../storage/storage";
import { EphemeralKeyPair, StealthData, StealthAddressResult } from "../types/stealth";
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
    readonly STEALTH_DATA_TABLE: string;
    private lastEphemeralKeyPair;
    private lastMethodUsed;
    private storage;
    private readonly STEALTH_HISTORY_KEY;
    private logs;
    constructor(storage?: Storage);
    /**
     * Structured logging system
     */
    private log;
    /**
     * Cleanup sensitive data from memory
     */
    cleanupSensitiveData(): Promise<void>;
    /**
     * Validate stealth data
     */
    private validateStealthData;
    /**
     * Removes the initial tilde (~) from the public key if present
     */
    formatPublicKey(publicKey: string | null): string | null;
    /**
     * Creates a new stealth account
     */
    createAccount(): Promise<EphemeralKeyPair>;
    /**
     * Generates a stealth address for the recipient's public key
     */
    generateStealthAddress(recipientPublicKey: string): Promise<StealthAddressResult>;
    /**
     * Opens a stealth address by deriving the private key
     */
    openStealthAddress(stealthAddress: string, ephemeralPublicKey: string, pair: EphemeralKeyPair): Promise<ethers.Wallet>;
    /**
     * Standard method to open a stealth address (used as fallback)
     */
    private openStealthAddressStandard;
    /**
     * Gets public key from an address
     */
    getPublicKey(publicKey: string): Promise<string | null>;
    /**
     * Saves stealth keys in user profile
     * @returns The stealth keys to save
     */
    prepareStealthKeysForSaving(stealthKeyPair: EphemeralKeyPair): EphemeralKeyPair;
    /**
     * Derives a wallet from shared secret
     */
    deriveWalletFromSecret(secret: string): ethers.Wallet;
    /**
     * Saves stealth data in storage with validation
     */
    saveStealthHistory(address: string, data: StealthData): void;
}
export { Stealth, EphemeralKeyPair, StealthAddressResult };
