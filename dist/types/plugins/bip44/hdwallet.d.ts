import { ethers } from "ethers";
import { EventEmitter } from "../../utils/eventEmitter";
import { WalletPath as IWalletPath, BalanceCache as IBalanceCache, WalletExport as IWalletExport, WalletConfig, TransactionOptions, WalletBackupOptions, WalletImportOptions, WalletInfo } from "./types";
export type WalletPath = IWalletPath;
export type BalanceCache = IBalanceCache;
export type WalletExport = IWalletExport;
/**
 * Class that manages Ethereum wallet functionality including:
 * - Wallet creation and derivation
 * - Balance checking and transactions
 * - Importing/exporting wallets
 * - Encrypted storage and backup
 */
export declare class HDWallet extends EventEmitter {
    private readonly gun;
    private walletPaths;
    private mainWallet;
    private readonly balanceCache;
    private readonly pendingTransactions;
    private readonly config;
    private transactionMonitoringInterval;
    private provider;
    private signer;
    /**
     * Creates a new WalletManager instance
     * @param gun Raw Gun instance
     * @param storage Storage interface for local persistence
     * @param config Additional configuration options
     */
    constructor(gun: any, config?: Partial<WalletConfig>);
    /**
     * Initialize wallet paths synchronously with basic setup
     * @private
     */
    private initWalletPathsSync;
    /**
     * Initializes wallet paths from both GunDB and localStorage
     * Call this method explicitly when needed
     * @public
     * @throws {Error} If there's an error during wallet path initialization
     */
    initializeWalletPaths(): Promise<void>;
    /**
     * Loads wallet paths from localStorage as backup
     * @private
     */
    private loadWalletPathsFromLocalStorage;
    /**
     * Loads wallet paths from GunDB
     * @private
     */
    private loadWalletPathsFromGun;
    /**
     * Setup transaction monitoring
     */
    private setupTransactionMonitoring;
    cleanup(): void;
    /**
     * Check status of pending transactions
     */
    private checkPendingTransactions;
    /**
     * Sets the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     */
    setRpcUrl(rpcUrl: string): void;
    /**
     * Gets a configured JSON RPC provider instance
     * @returns An ethers.js JsonRpcProvider instance
     */
    getProvider(): ethers.JsonRpcProvider | null;
    getSigner(): ethers.Wallet;
    setSigner(signer: ethers.Wallet): void;
    /**
     * Gets a unique identifier for the current user for storage purposes
     * @private
     * @returns A string identifier based on user's public key or "guest"
     */
    private getStorageUserIdentifier;
    /**
     * Saves wallet paths to localStorage for backup
     * @private
     */
    private saveWalletPathsToLocalStorage;
    /**
     * Derives a private wallet from a mnemonic and derivation path
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param path The derivation path
     * @returns A derived HDNodeWallet instance
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
     * Override of main function with fixes and improvements
     */
    private generatePrivateKeyFromString;
    /**
     * Get the main wallet
     */
    getMainWallet(): ethers.Wallet;
    /**
     * Get the main wallet credentials
     */
    getMainWalletCredentials(): {
        address: string;
        priv: string;
    };
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
    /**
     * Wait for user authentication with retry logic
     * @private
     */
    private waitForAuthentication;
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
    sendTransaction(wallet: ethers.Wallet, toAddress: string, value: string, options?: TransactionOptions): Promise<string>;
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
     * Export the mnemonic phrase, optionally encrypting it with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported mnemonic phrase (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your mnemonic phrase which gives FULL ACCESS to all your wallets.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
     */
    exportMnemonic(password?: string): Promise<string>;
    /**
     * Export wallet private keys, optionally encrypted with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported wallet keys (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your wallet private keys which give FULL ACCESS to your funds.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
     */
    exportWalletKeys(password?: string): Promise<string>;
    /**
     * Export GunDB pair, optionally encrypted with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported GunDB pair (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your GunDB credentials which give access to your encrypted data.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
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
    /**
     * Update the balance cache TTL
     * @param ttlMs Time-to-live in milliseconds
     */
    setBalanceCacheTTL(ttlMs: number): void;
    /**
     * Verifica se l'utente è autenticato
     * @returns true se l'utente è autenticato
     * @private
     */
    private isUserAuthenticated;
    /**
     * Export wallet data with enhanced security
     */
    exportWalletData(options?: WalletBackupOptions): Promise<string>;
    /**
     * Import wallet data with validation
     */
    importWalletData(data: string, options?: WalletImportOptions): Promise<number>;
    /**
     * Get wallet transaction history
     */
    private getWalletHistory;
    /**
     * Deriva un wallet da un percorso derivazione
     * @param path Percorso di derivazione BIP-44 (es: m/44'/60'/0'/0/0)
     * @returns Wallet derivato
     */
    deriveWallet(path: string): Promise<ethers.Wallet>;
    /**
     * Salva il percorso di derivazione di un wallet
     * @param address Indirizzo del wallet
     * @param path Percorso di derivazione
     */
    saveWalletPath(address: string, path: string): Promise<void>;
    /**
     * Salva una transazione pendente
     * @param tx Transazione da salvare
     */
    savePendingTransaction(tx: any): Promise<void>;
    /**
     * Ottiene il mnemonic dell'utente
     * @returns Mnemonic dell'utente
     */
    getUserMnemonic(): Promise<string | null>;
    /**
     * Ottiene il saldo del wallet principale
     * @returns Saldo formattato come stringa
     */
    getWalletBalance(): Promise<string>;
    /**
     * Verifica se l'utente è loggato
     * @returns true se l'utente è loggato, false altrimenti
     */
    isLogged(): boolean;
    /**
     * Ottiene tutti i wallet dell'utente
     * @returns Array di wallet
     */
    getWallets(): Promise<any[]>;
    /**
     * Crea e carica un wallet con un percorso specifico
     * @param path Percorso di derivazione
     * @returns Informazioni sul wallet
     */
    createAndLoadWallet(path: string): Promise<any>;
}
