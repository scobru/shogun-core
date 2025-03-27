import { GunDB } from "./gun/gun";
import { Webauthn } from "./webauthn/webauthn";
import { MetaMask } from "./connector/metamask";
import { Stealth } from "./stealth/stealth";
import { IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, WalletInfo } from "./types/shogun";
import { IGunInstance } from "gun/types/gun";
import { ethers } from "ethers";
import { ShogunDID } from "./did/DID";
import { ShogunError } from "./utils/errorHandler";
export { ShogunDID, DIDDocument, DIDResolutionResult, DIDCreateOptions, } from "./did/DID";
export { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";
export declare class ShogunCore implements IShogunCore {
    gun: IGunInstance<any>;
    gundb: GunDB;
    webauthn: Webauthn;
    metamask: MetaMask;
    stealth: Stealth;
    did: ShogunDID;
    private storage;
    private eventEmitter;
    private walletManager;
    private provider?;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * authentication methods (WebAuthn, MetaMask), and wallet management.
     */
    constructor(config: ShogunSDKConfig);
    /**
     * Recupera gli errori recenti registrati dal sistema
     * @param count - Numero di errori da recuperare
     * @returns Lista degli errori più recenti
     */
    getRecentErrors(count?: number): ShogunError[];
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunDB login state
     * and presence of authentication credentials in storage
     */
    isLoggedIn(): boolean;
    /**
     * Perform user logout
     * @description Logs out the current user from GunDB and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout(): void;
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    login(username: string, password: string): Promise<AuthResult>;
    /**
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param passwordConfirmation - Password confirmation
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    /**
     * Check if WebAuthn is supported by the browser
     * @returns {boolean} True if WebAuthn is supported, false otherwise
     * @description Verifies if the current browser environment supports WebAuthn authentication
     */
    isWebAuthnSupported(): boolean;
    /**
     * Perform WebAuthn login
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    loginWithWebAuthn(username: string): Promise<AuthResult>;
    /**
     * Register new user with WebAuthn
     * @param username - Username
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    signUpWithWebAuthn(username: string): Promise<AuthResult>;
    /**
     * Login with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using MetaMask wallet credentials
     */
    loginWithMetaMask(address: string): Promise<AuthResult>;
    /**
     * Register new user with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using MetaMask wallet credentials
     */
    signUpWithMetaMask(address: string): Promise<AuthResult>;
    /**
     * Get main wallet
     * @returns {ethers.Wallet | null} Main wallet instance or null if not available
     * @description Retrieves the primary wallet associated with the user
     */
    getMainWallet(): ethers.Wallet | null;
    /**
     * Create new wallet
     * @returns {Promise<WalletInfo>} Created wallet information
     * @description Generates a new wallet and associates it with the user
     */
    createWallet(): Promise<WalletInfo>;
    /**
     * Load wallets
     * @returns {Promise<WalletInfo[]>} Array of wallet information
     * @description Retrieves all wallets associated with the authenticated user
     */
    loadWallets(): Promise<WalletInfo[]>;
    /**
     * Sign message
     * @param wallet - Wallet for signing
     * @param message - Message to sign
     * @returns {Promise<string>} Message signature
     * @description Signs a message using the provided wallet
     */
    signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>;
    /**
     * Verify signature
     * @param message - Signed message
     * @param signature - Signature to verify
     * @returns {string} Address that signed the message
     * @description Recovers the address that signed a message from its signature
     */
    verifySignature(message: string | Uint8Array, signature: string): string;
    /**
     * Sign transaction
     * @param wallet - Wallet for signing
     * @param toAddress - Recipient address
     * @param value - Amount to send
     * @returns {Promise<string>} Signed transaction
     * @description Signs a transaction using the provided wallet
     */
    signTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>;
    /**
     * Export user's mnemonic phrase
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported mnemonic data
     * @description Exports the mnemonic phrase used to generate user's wallets
     */
    exportMnemonic(password?: string): Promise<string>;
    /**
     * Export private keys of all wallets
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported wallet keys
     * @description Exports private keys for all user's wallets
     */
    exportWalletKeys(password?: string): Promise<string>;
    /**
     * Export user's Gun pair
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported Gun pair
     * @description Exports the user's Gun authentication pair
     */
    exportGunPair(password?: string): Promise<string>;
    /**
     * Export all user data in a single file
     * @param password Required password to encrypt exported data
     * @returns {Promise<string>} Exported user data
     * @description Exports all user data including mnemonic, wallets and Gun pair
     */
    exportAllUserData(password: string): Promise<string>;
    /**
     * Import mnemonic phrase
     * @param mnemonicData Mnemonic or encrypted JSON to import
     * @param password Optional password to decrypt mnemonic if encrypted
     * @returns {Promise<boolean>} Import success status
     * @description Imports a mnemonic phrase to generate wallets
     */
    importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
    /**
     * Import wallet private keys
     * @param walletsData JSON containing wallet data or encrypted JSON
     * @param password Optional password to decrypt data if encrypted
     * @returns {Promise<number>} Number of imported wallets
     * @description Imports wallet private keys from exported data
     */
    importWalletKeys(walletsData: string, password?: string): Promise<number>;
    /**
     * Import Gun pair
     * @param pairData JSON containing Gun pair or encrypted JSON
     * @param password Optional password to decrypt data if encrypted
     * @returns {Promise<boolean>} Import success status
     * @description Imports a Gun authentication pair
     */
    importGunPair(pairData: string, password?: string): Promise<boolean>;
    /**
     * Import complete backup
     * @param backupData Encrypted JSON containing all user data
     * @param password Password to decrypt backup
     * @param options Import options (which data to import)
     * @returns {Promise<Object>} Import results for each data type
     * @description Imports a complete user data backup including mnemonic,
     * wallets and Gun pair
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
     * Get addresses that would be derived from a mnemonic using BIP-44 standard
     * @param mnemonic The mnemonic phrase to derive addresses from
     * @param count The number of addresses to derive
     * @returns An array of Ethereum addresses
     * @description This method is useful for verifying compatibility with other wallets
     */
    getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
    /**
     * Generate a new BIP-39 mnemonic phrase
     * @returns {string} A new random mnemonic phrase
     * @description Generates a cryptographically secure random mnemonic phrase
     * that can be used to derive HD wallets
     */
    generateNewMnemonic(): string;
    /**
     * Set the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     * @returns True if the URL was successfully set
     */
    setRpcUrl(rpcUrl: string): boolean;
    /**
     * Get the currently configured RPC URL
     * @returns The current provider URL or null if not set
     */
    getRpcUrl(): string | null;
    /**
     * Ensure the current user has a DID associated, creating one if needed
     * @param options Optional DID creation options
     * @returns Promise with the DID string or null if fails
     */
    private ensureUserHasDID;
}
export * from "./types/shogun";
export { GunDB } from "./gun/gun";
export { MetaMask } from "./connector/metamask";
export { Stealth } from "./stealth/stealth";
export { EphemeralKeyPair, StealthData, StealthAddressResult, LogLevel, LogMessage } from "./types/stealth";
export { Webauthn } from "./webauthn/webauthn";
export { Storage } from "./storage/storage";
export { ShogunEventEmitter } from "./events";
export { WalletManager } from "./wallet/walletManager";
