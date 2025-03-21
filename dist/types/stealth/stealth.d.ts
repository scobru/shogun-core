/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { Storage } from "../storage/storage";
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
interface StealthKeyPair {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
}
interface StealthAddressResult {
    stealthAddress: string;
    ephemeralPublicKey: string;
    recipientPublicKey: string;
}
declare class Stealth {
    readonly STEALTH_DATA_TABLE: string;
    private lastEphemeralKeyPair;
    private lastMethodUsed;
    private storage;
    private readonly STEALTH_HISTORY_KEY;
    constructor(storage?: Storage);
    /**
     * Removes the initial tilde (~) from the public key if present
     */
    formatPublicKey(publicKey: string | null): string | null;
    /**
     * Creates a new stealth account
     */
    createAccount(): Promise<StealthKeyPair>;
    /**
     * Generates a stealth address for the recipient's public key
     */
    generateStealthAddress(recipientPublicKey: string): Promise<StealthAddressResult>;
    /**
     * Opens a stealth address by deriving the private key
     */
    openStealthAddress(stealthAddress: string, ephemeralPublicKey: string, pair: StealthKeyPair): Promise<ethers.Wallet>;
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
    prepareStealthKeysForSaving(stealthKeyPair: StealthKeyPair): StealthKeyPair;
    /**
     * Derives a wallet from shared secret
     */
    deriveWalletFromSecret(secret: string): ethers.Wallet;
    /**
     * Saves stealth data in storage
     */
    saveStealthHistory(address: string, data: any): void;
}
export { Stealth, StealthKeyPair, StealthAddressResult };
