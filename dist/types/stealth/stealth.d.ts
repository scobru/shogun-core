/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { ShogunStorage } from "../storage/storage";
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
    constructor(storage?: ShogunStorage);
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
     * Generates a new ephemeral key pair for stealth transactions
     * @returns Promise with the generated key pair
     */
    generateEphemeralKeyPair(): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * Generates a stealth address for the recipient's public key
     * @param recipientPublicKey Recipient's public key
     * @param ephemeralPrivateKey Ephemeral private key (optional)
     * @returns Promise with the stealth address result
     */
    generateStealthAddress(recipientPublicKey: string, ephemeralPrivateKey?: string): Promise<StealthAddressResult>;
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
    /**
     * Scans a list of stealth addresses to find ones belonging to the user
     * @param addresses Array of stealth data to scan
     * @param privateKeyOrSpendKey User's private key or spend key
     * @returns Promise with array of stealth data that belongs to the user
     */
    scanStealthAddresses(addresses: StealthData[], privateKeyOrSpendKey: string): Promise<StealthData[]>;
    /**
     * Checks if a stealth address belongs to the user
     * @param stealthData Stealth data to check
     * @param privateKeyOrSpendKey User's private key or spend key
     * @returns Promise resolving to boolean indicating ownership
     */
    isStealthAddressMine(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<boolean>;
    /**
     * Gets the private key for a stealth address
     * @param stealthData Stealth data
     * @param privateKeyOrSpendKey User's private key or spend key
     * @returns Promise with the derived private key
     */
    getStealthPrivateKey(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<string>;
}
export { Stealth, EphemeralKeyPair, StealthAddressResult };
