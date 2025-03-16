import { ethers } from "ethers";
import { GunDB } from "../gun/gun";
import { Storage } from "../storage/storage";
import { WalletInfo } from "../types/shogun";
/**
 * Class that manages wallet functionality
 */
export declare class WalletManager {
    private gundb;
    private gun;
    private storage;
    private walletPaths;
    private mainWallet;
    private balanceCache;
    private balanceCacheTTL;
    private defaultRpcUrl;
    private configuredRpcUrl;
    constructor(gundb: GunDB, gun: any, storage: Storage);
    /**
     * Configure the RPC URL to use for connections
     * @param rpcUrl RPC provider URL
     */
    setRpcUrl(rpcUrl: string): void;
    /**
     * Get a configured JSON RPC provider
     * @returns JSON RPC Provider
     */
    getProvider(): ethers.JsonRpcProvider;
    /**
     * Initialize wallet paths
     * Load paths from both GUN and localStorage
     * @private
     */
    private initializeWalletPaths;
    /**
     * Load wallet paths from Gun
     * @private
     */
    private loadWalletPathsFromGun;
    /**
     * Load wallet paths from localStorage
     * @private
     */
    private loadWalletPathsFromLocalStorage;
    /**
     * Get a unique identifier for the current user for storage
     * @private
     */
    private getStorageUserIdentifier;
    /**
     * Save wallet paths to localStorage
     * @private
     */
    private saveWalletPathsToLocalStorage;
    /**
     * Derive a private wallet from a mnemonic and derivation path
     * @param mnemonic Mnemonic phrase
     * @param path Derivation path
     * @returns Derived wallet
     * @private
     */
    private derivePrivateKeyFromMnemonic;
    /**
     * Generate a new BIP-39 standard mnemonic compatible with all wallets
     * @returns A new 12-word BIP-39 mnemonic phrase
     */
    generateNewMnemonic(): string;
    /**
     * Get addresses that would be derived from a mnemonic using BIP-44 standard
     * This is useful to verify that wallets are correctly compatible with MetaMask and other wallets
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param count Number of addresses to derive
     * @returns An array of Ethereum addresses
     */
    getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
    /**
     * INFORMATIONAL METHOD: Retrieve the first n wallets that would have been created from a mnemonic
     * using MetaMask (for debug and verification only)
     * @deprecated Use getStandardBIP44Addresses() which implements true BIP-44 derivation
     */
    getMetaMaskCompatibleAddresses(mnemonic: string, count?: number): string[];
    /**
     * Override of main function with fixes and improvements
     */
    private generatePrivateKeyFromString;
    /**
     * Get the main wallet
     */
    getMainWallet(): ethers.Wallet | null;
    /**
     * Encrypt sensitive text using SEA
     * @param text Text to encrypt
     * @returns Encrypted text
     */
    private encryptSensitiveData;
    /**
     * Decrypt sensitive text encrypted with SEA
     * @param encryptedText Encrypted text
     * @returns Decrypted text
     */
    private decryptSensitiveData;
    /**
     * Get user's master mnemonic, first checking GunDB then localStorage
     */
    getUserMasterMnemonic(): Promise<string | null>;
    /**
     * Save user's master mnemonic to both GunDB and localStorage
     */
    saveUserMasterMnemonic(mnemonic: string): Promise<void>;
    createWallet(): Promise<WalletInfo>;
    loadWallets(): Promise<WalletInfo[]>;
    /**
     * Get wallet balance with caching to reduce RPC calls
     */
    getBalance(wallet: ethers.Wallet): Promise<string>;
    /**
     * Invalidate balance cache for an address
     */
    invalidateBalanceCache(address: string): void;
    getNonce(wallet: ethers.Wallet): Promise<number>;
    sendTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>;
    /**
     * Sign a message with a wallet
     */
    signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>;
    /**
     * Verify a signature
     */
    verifySignature(message: string | Uint8Array, signature: string): string;
    /**
     * Sign a transaction
     */
    signTransaction(wallet: ethers.Wallet, toAddress: string, value: string, provider?: ethers.JsonRpcProvider): Promise<string>;
    /**
     * Reset main wallet
     * Useful when we want to force wallet regeneration
     */
    resetMainWallet(): void;
    /**
     * Export user's mnemonic phrase
     * @param password Optional password to encrypt exported mnemonic
     * @returns The mnemonic in clear text or encrypted if password provided
     */
    exportMnemonic(password?: string): Promise<string>;
    /**
     * Export private keys of all generated wallets
     * @param password Optional password to encrypt exported data
     * @returns JSON object containing all wallets with their private keys
     */
    exportWalletKeys(password?: string): Promise<string>;
    /**
     * Esporta il pair (coppia di chiavi) di Gun dell'utente
     * @param password Password opzionale per cifrare i dati esportati
     * @returns Il pair di Gun in formato JSON
     */
    exportGunPair(password?: string): Promise<string>;
    /**
     * Esporta tutti i dati dell'utente in un unico file
     * @param password Password obbligatoria per cifrare i dati esportati
     * @returns Un oggetto JSON contenente tutti i dati dell'utente
     */
    exportAllUserData(password: string): Promise<string>;
    /**
     * Importa una frase mnemonica
     * @param mnemonicData La mnemonica o il JSON cifrato da importare
     * @param password Password opzionale per decifrare la mnemonica se cifrata
     * @returns true se l'importazione è riuscita
     */
    importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
    /**
     * Importa le chiavi private dei wallet
     * @param walletsData JSON contenente i dati dei wallet o JSON cifrato
     * @param password Password opzionale per decifrare i dati se cifrati
     * @returns Il numero di wallet importati con successo
     */
    importWalletKeys(walletsData: string, password?: string): Promise<number>;
    /**
     * Importa un pair di Gun
     * @param pairData JSON contenente il pair di Gun o JSON cifrato
     * @param password Password opzionale per decifrare i dati se cifrati
     * @returns true se l'importazione è riuscita
     */
    importGunPair(pairData: string, password?: string): Promise<boolean>;
    /**
     * Importa un backup completo
     * @param backupData JSON cifrato contenente tutti i dati dell'utente
     * @param password Password per decifrare il backup
     * @param options Opzioni di importazione (quali dati importare)
     * @returns Un oggetto con il risultato dell'importazione
     */
    importAllUserData(backupData: string, password: string, options?: {
        importMnemonic?: boolean;
        importWallets?: boolean;
        importGunPair?: boolean;
    }): Promise<{
        success: boolean;
        mnemonicImported?: boolean;
        walletsImported?: number;
        gunPairImported?: boolean;
    }>;
}
