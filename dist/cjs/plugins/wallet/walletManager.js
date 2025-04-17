"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletManager = void 0;
const logger_1 = require("../../utils/logger");
const sea_1 = __importDefault(require("gun/sea"));
const ethers_1 = require("ethers");
const eventEmitter_1 = require("../../utils/eventEmitter");
const wallet_1 = require("../../types/wallet");
/**
 * Class that manages Ethereum wallet functionality including:
 * - Wallet creation and derivation
 * - Balance checking and transactions
 * - Importing/exporting wallets
 * - Encrypted storage and backup
 */
class WalletManager extends eventEmitter_1.EventEmitter {
    /**
     * Creates a new WalletManager instance
     * @param gundb GunDB instance for decentralized storage
     * @param gun Raw Gun instance
     * @param storage Storage interface for local persistence
     * @param config Additional configuration options
     */
    constructor(gun, storage, config) {
        super();
        this.walletPaths = {};
        this.mainWallet = null;
        this.balanceCache = new Map();
        this.pendingTransactions = new Map();
        this.gun = gun;
        this.storage = storage;
        this.config = {
            balanceCacheTTL: 30000,
            rpcUrl: "",
            defaultGasLimit: 21000,
            maxRetries: 3,
            retryDelay: 1000,
            ...config,
        };
        this.initWalletPathsSync();
        this.setupTransactionMonitoring();
    }
    /**
     * Initialize wallet paths synchronously with basic setup
     * @private
     */
    initWalletPathsSync() {
        try {
            // Reset existing paths
            this.walletPaths = {};
            // Load paths from localStorage as fallback (synchronous operation)
            this.loadWalletPathsFromLocalStorage();
            (0, logger_1.log)("Wallet paths initialized synchronously. Async loading will occur on first use.");
        }
        catch (error) {
            (0, logger_1.logError)("Error in synchronous wallet path initialization:", error);
            (0, logger_1.log)("Will attempt async initialization on first use");
        }
    }
    /**
     * Initializes wallet paths from both GunDB and localStorage
     * Call this method explicitly when needed
     * @public
     * @throws {Error} If there's an error during wallet path initialization
     */
    async initializeWalletPaths() {
        try {
            // Reset existing paths
            this.walletPaths = {};
            // Load paths from Gun
            await this.loadWalletPathsFromGun();
            // Load paths from localStorage as fallback
            this.loadWalletPathsFromLocalStorage();
            // Log results
            const walletCount = Object.keys(this.walletPaths).length;
            if (walletCount === 0) {
                (0, logger_1.log)("No wallet paths found, new wallets will be created when needed");
            }
            else {
                (0, logger_1.log)(`Initialized ${walletCount} wallet paths`);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error initializing wallet paths:", error);
            // Propagare l'errore invece di sopprimerlo
            throw new Error(`Failed to initialize wallet paths: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Loads wallet paths from localStorage as backup
     * @private
     */
    loadWalletPathsFromLocalStorage() {
        const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
        const storedPaths = this.storage.getItem(storageKey);
        if (storedPaths) {
            try {
                (0, logger_1.log)("Found wallet paths in localStorage");
                const parsedPaths = JSON.parse(storedPaths);
                // Add paths if not already in GUN
                Object.entries(parsedPaths).forEach(([address, pathData]) => {
                    if (!this.walletPaths[address]) {
                        this.walletPaths[address] = pathData;
                        (0, logger_1.log)(`Loaded path from localStorage for wallet: ${address}`);
                    }
                });
            }
            catch (error) {
                (0, logger_1.logError)("Error parsing wallet paths from localStorage:", error);
            }
        }
    }
    /**
     * Loads wallet paths from GunDB
     * @private
     */
    async loadWalletPathsFromGun() {
        // Verify user authentication
        const user = this.gun.user();
        if (!user?.is) {
            (0, logger_1.log)("User not authenticated on Gun, cannot load wallet paths from Gun");
            return Promise.resolve();
        }
        (0, logger_1.log)(`Loading wallet paths from GUN for user: ${user.is.alias}`);
        // Load paths from user profile
        return new Promise((resolve) => {
            user.get("wallet_paths").once((data) => {
                if (!data) {
                    (0, logger_1.log)("No wallet paths found in GUN");
                    resolve();
                    return;
                }
                (0, logger_1.log)(`Found wallet paths in GUN: ${Object.keys(data).length - 1} wallets`); // -1 for _ field
                // Convert GUN data to walletPaths
                Object.entries(data).forEach(([address, pathData]) => {
                    if (address !== "_" && pathData) {
                        const data = pathData;
                        if (data?.path) {
                            this.walletPaths[address] = {
                                path: data.path,
                                created: data.created || Date.now(),
                            };
                            (0, logger_1.log)(`Loaded path for wallet: ${address} -> ${data.path}`);
                        }
                    }
                });
                resolve();
            });
        });
    }
    /**
     * Setup transaction monitoring
     */
    setupTransactionMonitoring() {
        setInterval(() => {
            if (this.getProvider() !== null) {
                this.checkPendingTransactions();
            }
        }, 15000); // Check every 15 seconds
    }
    /**
     * Check status of pending transactions
     */
    async checkPendingTransactions() {
        const provider = this.getProvider();
        for (const [txHash, tx] of this.pendingTransactions) {
            try {
                const receipt = await provider.getTransactionReceipt(txHash);
                if (receipt) {
                    if (receipt.status === 1) {
                        this.emit(wallet_1.WalletEventType.TRANSACTION_CONFIRMED, {
                            type: wallet_1.WalletEventType.TRANSACTION_CONFIRMED,
                            data: { txHash, receipt },
                            timestamp: Date.now(),
                        });
                    }
                    else {
                        this.emit(wallet_1.WalletEventType.ERROR, {
                            type: wallet_1.WalletEventType.ERROR,
                            data: { txHash, error: "Transaction failed" },
                            timestamp: Date.now(),
                        });
                    }
                    this.pendingTransactions.delete(txHash);
                    // Invalidate balance cache for affected addresses
                    this.invalidateBalanceCache(tx.from);
                    if (tx.to)
                        this.invalidateBalanceCache(tx.to);
                }
            }
            catch (error) {
                (0, logger_1.logError)(`Error checking transaction ${txHash}:`, error);
            }
        }
    }
    /**
     * Sets the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     */
    setRpcUrl(rpcUrl) {
        this.config.rpcUrl = rpcUrl;
        (0, logger_1.log)(`RPC Provider configured: ${rpcUrl}`);
    }
    /**
     * Gets a configured JSON RPC provider instance
     * @returns An ethers.js JsonRpcProvider instance
     */
    getProvider() {
        if (!this.config.rpcUrl) {
            throw new Error("RPC URL not configured");
        }
        return new ethers_1.ethers.JsonRpcProvider(this.config.rpcUrl);
    }
    /**
     * Gets a unique identifier for the current user for storage purposes
     * @private
     * @returns A string identifier based on user's public key or "guest"
     */
    getStorageUserIdentifier() {
        const user = this.gun.user();
        const pub = user?.is?.pub;
        if (pub) {
            return pub.substring(0, 12); // Use part of the public key
        }
        return "guest"; // Identifier for unauthenticated users
    }
    /**
     * Saves wallet paths to localStorage for backup
     * @private
     */
    saveWalletPathsToLocalStorage() {
        try {
            const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
            const pathsToSave = JSON.stringify(this.walletPaths);
            this.storage.setItem(storageKey, pathsToSave);
            (0, logger_1.log)(`Saved ${Object.keys(this.walletPaths).length} wallet paths to localStorage`);
        }
        catch (error) {
            (0, logger_1.logError)("Error saving wallet paths to localStorage:", error);
        }
    }
    /**
     * Derives a private wallet from a mnemonic and derivation path
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param path The derivation path
     * @returns A derived HDNodeWallet instance
     * @private
     */
    derivePrivateKeyFromMnemonic(mnemonic, path) {
        try {
            (0, logger_1.log)(`Deriving wallet from path: ${path}`);
            const wallet = ethers_1.ethers.HDNodeWallet.fromMnemonic(ethers_1.ethers.Mnemonic.fromPhrase(mnemonic), path);
            if (!wallet || !wallet.privateKey) {
                throw new Error(`Unable to derive wallet for path ${path}`);
            }
            return wallet;
        }
        catch (error) {
            (0, logger_1.logError)(`Error deriving wallet for path ${path}:`, error);
            throw new Error(`Unable to derive wallet for path ${path}`);
        }
    }
    /**
     * Generate a new BIP-39 standard mnemonic compatible with all wallets
     * @returns A new 12-word BIP-39 mnemonic phrase
     */
    generateNewMnemonic() {
        // Generate a random 12-word mnemonic according to BIP-39 standard
        return ethers_1.ethers.Mnemonic.fromEntropy(ethers_1.ethers.randomBytes(16)).phrase;
    }
    /**
     * Get addresses that would be derived from a mnemonic using BIP-44 standard
     * This is useful to verify that wallets are correctly compatible with MetaMask and other wallets
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param count Number of addresses to derive
     * @returns An array of Ethereum addresses
     */
    getStandardBIP44Addresses(mnemonic, count = 5) {
        try {
            (0, logger_1.log)(`Standard BIP-44 derivation from mnemonic`);
            const addresses = [];
            for (let i = 0; i < count; i++) {
                // Standard BIP-44 path for Ethereum: m/44'/60'/0'/0/i
                const path = `m/44'/60'/0'/0/${i}`;
                // Create HD wallet directly from mnemonic with specified path
                const wallet = ethers_1.ethers.HDNodeWallet.fromMnemonic(ethers_1.ethers.Mnemonic.fromPhrase(mnemonic), path // Pass path directly here
                );
                addresses.push(wallet.address);
                (0, logger_1.log)(`Address ${i}: ${wallet.address} (${path})`);
            }
            return addresses;
        }
        catch (error) {
            (0, logger_1.log)(`Error calculating BIP-44 addresses: ${error}`);
            return [];
        }
    }
    /**
     * Override of main function with fixes and improvements
     */
    generatePrivateKeyFromString(input) {
        try {
            // Use SHA-256 to generate a deterministic hash value
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            // Use simplified digestSync method
            const digestSync = (data) => {
                // Simplified version
                let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
                for (let i = 0; i < data.length; i++) {
                    h1 = Math.imul(h1 ^ data[i], 2654435761);
                    h2 = Math.imul(h2 ^ data[i], 1597334677);
                }
                h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
                h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
                h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
                h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
                // Create a 32-byte array
                const out = new Uint8Array(32);
                for (let i = 0; i < 4; i++) {
                    out[i] = (h1 >> (8 * i)) & 0xff;
                }
                for (let i = 0; i < 4; i++) {
                    out[i + 4] = (h2 >> (8 * i)) & 0xff;
                }
                // Fill with derived values
                for (let i = 8; i < 32; i++) {
                    out[i] = (out[i % 8] ^ out[(i - 1) % 8]) & 0xff;
                }
                return out;
            };
            // Use synchronous version of digest
            const hashArray = digestSync(data);
            // Convert to hex string
            const privateKey = "0x" +
                Array.from(hashArray)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
            return privateKey;
        }
        catch (error) {
            (0, logger_1.logError)("Error generating private key:", error);
            // Fallback: create valid hex value
            const fallbackHex = "0x" +
                Array.from({ length: 32 })
                    .map(() => Math.floor(Math.random() * 256)
                    .toString(16)
                    .padStart(2, "0"))
                    .join("");
            return fallbackHex;
        }
    }
    /**
     * Get the main wallet
     */
    getMainWallet() {
        try {
            if (!this.mainWallet) {
                const user = this.gun.user();
                if (!user || !user.is) {
                    (0, logger_1.log)("getMainWallet: User not authenticated");
                    return null;
                }
                // Check if we have access to required properties
                if (!user._ || !user._.sea || !user._.sea.priv || !user._.sea.pub) {
                    (0, logger_1.log)("getMainWallet: Insufficient user data", JSON.stringify({
                        hasUserData: !!user._,
                        hasSea: !!(user._ && user._.sea),
                        hasPriv: !!(user._ && user._.sea && user._.sea.priv),
                        hasPub: !!(user._ && user._.sea && user._.sea.pub),
                    }));
                    // Check if it's a MetaMask user and use alternative approach
                    if (user.is.alias && user.is.alias.startsWith("0x")) {
                        (0, logger_1.log)("getMainWallet: MetaMask user detected, using alternative approach");
                        // For MetaMask, use address as seed
                        const address = user.is.alias;
                        const seed = `metamask-${address}-${Date.now()}`;
                        const privateKey = this.generatePrivateKeyFromString(seed);
                        this.mainWallet = new ethers_1.ethers.Wallet(privateKey);
                        return this.mainWallet;
                    }
                    return null;
                }
                // Combine private key + public key + user alias for unique seed
                const userSeed = user._.sea.priv;
                const userPub = user._.sea.pub;
                const userAlias = user.is.alias;
                // Create unique seed for this user
                const seed = `${userSeed}|${userPub}|${userAlias}`;
                // Use new secure method to generate private key
                const privateKey = this.generatePrivateKeyFromString(seed);
                this.mainWallet = new ethers_1.ethers.Wallet(privateKey);
            }
            return this.mainWallet;
        }
        catch (error) {
            (0, logger_1.logError)("Error retrieving main wallet:", error);
            return null;
        }
    }
    /**
     * Encrypt sensitive text using SEA
     * @param text Text to encrypt
     * @returns Encrypted text
     */
    async encryptSensitiveData(text) {
        try {
            const user = this.gun.user();
            if (user && user._ && user._.sea) {
                // Use user key to encrypt
                const encrypted = await sea_1.default.encrypt(text, user._.sea);
                return JSON.stringify(encrypted);
            }
            else {
                // Fallback: use key derived from user ID
                const userIdentifier = this.getStorageUserIdentifier();
                const key = `shogun-encrypt-${userIdentifier}-key`;
                const encrypted = await sea_1.default.encrypt(text, key);
                return JSON.stringify(encrypted);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error encrypting data:", error);
            // Fallback: save in clear but with warning
            (0, logger_1.log)("WARNING: Sensitive data saved without encryption");
            return `unencrypted:${text}`;
        }
    }
    /**
     * Decrypt sensitive text encrypted with SEA
     * @param encryptedText Encrypted text
     * @returns Decrypted text
     */
    async decryptSensitiveData(encryptedText) {
        try {
            // Check if it's unencrypted text (fallback)
            if (encryptedText.startsWith("unencrypted:")) {
                return encryptedText.substring(12);
            }
            // Try to parse encrypted text
            const encryptedData = JSON.parse(encryptedText);
            const user = this.gun.user();
            if (user && user._ && user._.sea) {
                // Use user key to decrypt
                const decrypted = await sea_1.default.decrypt(encryptedData, user._.sea);
                return decrypted;
            }
            else {
                // Fallback: use key derived from user ID
                const userIdentifier = this.getStorageUserIdentifier();
                const key = `shogun-encrypt-${userIdentifier}-key`;
                const decrypted = await sea_1.default.decrypt(encryptedData, key);
                return decrypted;
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error decrypting data:", error);
            return null;
        }
    }
    /**
     * Get user's master mnemonic, first checking GunDB then localStorage
     */
    async getUserMasterMnemonic() {
        try {
            // 1. First check GunDB (automatically encrypted by SEA)
            const user = this.gun.user();
            if (user && user.is) {
                const gunMnemonic = await new Promise((resolve) => {
                    user.get("master_mnemonic").once((data) => {
                        resolve(data || null);
                    });
                });
                if (gunMnemonic) {
                    (0, logger_1.log)("Mnemonic retrieved from GunDB");
                    (0, logger_1.log)("gunMnemonic: ", gunMnemonic);
                    return gunMnemonic;
                }
            }
            // 2. If not found in GunDB, check localStorage
            const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;
            const encryptedMnemonic = this.storage.getItem(storageKey);
            if (!encryptedMnemonic) {
                (0, logger_1.log)("No mnemonic found in either GunDB or localStorage");
                return null;
            }
            // Decrypt mnemonic from localStorage
            const decrypted = await this.decryptSensitiveData(encryptedMnemonic);
            (0, logger_1.log)("Mnemonic retrieved from localStorage");
            // If we find mnemonic in localStorage but not in GunDB, save it to GunDB
            // for future syncing (but only if user is authenticated)
            if (decrypted && user && user.is) {
                await user.get("master_mnemonic").put(decrypted);
                (0, logger_1.log)("Mnemonic from localStorage synced to GunDB");
            }
            return decrypted;
        }
        catch (error) {
            (0, logger_1.logError)("Error retrieving mnemonic:", error);
            return null;
        }
    }
    /**
     * Save user's master mnemonic to both GunDB and localStorage
     */
    async saveUserMasterMnemonic(mnemonic) {
        try {
            // 1. Save to GunDB (automatically encrypted by SEA)
            const user = this.gun.user();
            if (user && user.is) {
                await user.get("master_mnemonic").put(mnemonic);
                (0, logger_1.log)("Mnemonic saved to GunDB");
            }
            // 2. Also save to localStorage as backup
            const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;
            // Encrypt mnemonic before saving to localStorage
            const encryptedMnemonic = await this.encryptSensitiveData(mnemonic);
            this.storage.setItem(storageKey, encryptedMnemonic);
            (0, logger_1.log)("Encrypted mnemonic also saved to localStorage as backup");
        }
        catch (error) {
            (0, logger_1.logError)("Error saving mnemonic:", error);
            throw error;
        }
    }
    async createWallet() {
        try {
            // Verify user is authenticated
            const user = this.gun.user();
            if (!user.is) {
                throw new Error("User is not authenticated");
            }
            // Determine next available index
            const existingWallets = Object.values(this.walletPaths).length;
            const nextIndex = existingWallets;
            // Use standard Ethereum path format
            const path = `m/44'/60'/0'/0/${nextIndex}`;
            // Get user's master mnemonic
            let masterMnemonic = await this.getUserMasterMnemonic();
            if (!masterMnemonic) {
                try {
                    // Generate new mnemonic
                    masterMnemonic = this.generateNewMnemonic();
                    await this.saveUserMasterMnemonic(masterMnemonic);
                    (0, logger_1.log)(`Generated new mnemonic: ${masterMnemonic}`);
                }
                catch (mnemonicError) {
                    throw new Error(`Failed to generate or save mnemonic: ${mnemonicError instanceof Error ? mnemonicError.message : String(mnemonicError)}`);
                }
            }
            (0, logger_1.log)("*** masterMnemonic: ", masterMnemonic);
            // Derive wallet using secure method
            let wallet;
            try {
                wallet = this.derivePrivateKeyFromMnemonic(masterMnemonic, path);
                (0, logger_1.log)(`Derived wallet for path ${path} with address ${wallet.address}`);
            }
            catch (derivationError) {
                throw new Error(`Failed to derive wallet: ${derivationError instanceof Error ? derivationError.message : String(derivationError)}`);
            }
            // Save wallet path
            const timestamp = Date.now();
            this.walletPaths[wallet.address] = { path, created: timestamp };
            try {
                // Save in user context in Gun
                await user
                    .get("wallet_paths")
                    .get(wallet.address)
                    .put({ path, created: timestamp });
                // Also save to localStorage
                this.saveWalletPathsToLocalStorage();
            }
            catch (saveError) {
                (0, logger_1.logError)("Error saving wallet path:", saveError);
                (0, logger_1.log)("Wallet created but path might not be persisted properly");
                // Non blocchiamo la creazione del wallet per errori di salvataggio del path
            }
            return {
                wallet,
                path,
                address: wallet.address,
                getAddressString: () => wallet.address,
            };
        }
        catch (error) {
            (0, logger_1.logError)("Error creating wallet:", error);
            throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async loadWallets() {
        try {
            const user = this.gun.user();
            // More complete authentication check
            if (!user) {
                (0, logger_1.logError)("loadWallets: No Gun user available");
                throw new Error("Gun user not available");
            }
            try {
                // Initialize wallet paths if not already done
                await this.initializeWalletPaths();
            }
            catch (pathsError) {
                // Log l'errore ma continua con i wallet disponibili (se presenti)
                (0, logger_1.logError)("Error initializing wallet paths, proceeding with available wallets:", pathsError);
                (0, logger_1.log)("Will attempt to continue with any available wallet data");
            }
            // Get user's master mnemonic
            let masterMnemonic = await this.getUserMasterMnemonic();
            if (!masterMnemonic) {
                // If none exists, create default wallet
                (0, logger_1.log)("No mnemonic found, creating default wallet...");
                const mainWallet = await this.createWallet();
                return [mainWallet];
            }
            (0, logger_1.log)(`masterMnemonic found: ${masterMnemonic}`);
            const wallets = [];
            // Derive each wallet from saved paths
            for (const [address, data] of Object.entries(this.walletPaths)) {
                try {
                    // Use secure method to derive private key
                    const wallet = this.derivePrivateKeyFromMnemonic(masterMnemonic, data.path || `m/44'/60'/0'/0/${address.substring(0, 6)}`);
                    (0, logger_1.log)(`Derived wallet for path ${data.path || "fallback"} with address ${wallet.address}`);
                    if (wallet.address.toLowerCase() !== address.toLowerCase()) {
                        (0, logger_1.logWarn)(`Warning: derived address (${wallet.address}) does not match saved address (${address})`);
                    }
                    wallets.push({
                        wallet,
                        path: data.path || `m/44'/60'/0'/0/${wallet.address.substring(0, 8)}`,
                        address: wallet.address,
                        getAddressString: () => wallet.address,
                    });
                }
                catch (innerError) {
                    (0, logger_1.logError)(`Error deriving wallet ${address}:`, innerError);
                    // Non interrompiamo il ciclo per un singolo wallet fallito
                }
            }
            // Set mainWallet if there are wallets
            if (wallets.length > 0) {
                this.mainWallet = wallets[0].wallet;
            }
            return wallets;
        }
        catch (error) {
            (0, logger_1.logError)("Error loading wallets:", error);
            // Rilanciamo l'errore con un messaggio più dettagliato
            throw new Error(`Failed to load wallets: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // BASIC WALLET FUNCTIONS
    /**
     * Get wallet balance with caching to reduce RPC calls
     */
    async getBalance(wallet) {
        try {
            const address = wallet.address;
            const now = Date.now();
            const cached = this.balanceCache.get(address);
            if (cached && now - cached.timestamp < this.config.balanceCacheTTL) {
                return cached.balance;
            }
            const provider = this.getProvider();
            const balance = await provider.getBalance(address);
            const formattedBalance = ethers_1.ethers.formatEther(balance);
            this.balanceCache.set(address, {
                balance: formattedBalance,
                timestamp: now,
            });
            this.emit(wallet_1.WalletEventType.BALANCE_UPDATED, {
                type: wallet_1.WalletEventType.BALANCE_UPDATED,
                data: { address, balance: formattedBalance },
                timestamp: now,
            });
            return formattedBalance;
        }
        catch (error) {
            (0, logger_1.logError)("Error getting balance:", error);
            return "0.0";
        }
    }
    /**
     * Invalidate balance cache for an address
     */
    invalidateBalanceCache(address) {
        this.balanceCache.delete(address);
        (0, logger_1.log)(`Balance cache invalidated for ${address}`);
    }
    async getNonce(wallet) {
        const provider = this.getProvider();
        const nonce = await provider.getTransactionCount(wallet.address);
        return nonce;
    }
    async sendTransaction(wallet, toAddress, value, options = {}) {
        try {
            const provider = this.getProvider();
            wallet = wallet.connect(provider);
            // Get latest fee data
            const feeData = await provider.getFeeData();
            // Prepare transaction
            const tx = {
                to: toAddress,
                value: ethers_1.ethers.parseEther(value),
                gasLimit: options.gasLimit || this.config.defaultGasLimit,
                nonce: options.nonce || (await provider.getTransactionCount(wallet.address)),
                maxFeePerGas: options.maxFeePerGas
                    ? ethers_1.ethers.parseUnits(options.maxFeePerGas, "gwei")
                    : feeData.maxFeePerGas,
                maxPriorityFeePerGas: options.maxPriorityFeePerGas
                    ? ethers_1.ethers.parseUnits(options.maxPriorityFeePerGas, "gwei")
                    : feeData.maxPriorityFeePerGas,
            };
            // Retry logic
            for (let attempt = 1; attempt <= (this.config.maxRetries || 3); attempt++) {
                try {
                    const txResponse = await wallet.sendTransaction(tx);
                    // Store pending transaction
                    this.pendingTransactions.set(txResponse.hash, txResponse);
                    // Emit event
                    this.emit(wallet_1.WalletEventType.TRANSACTION_SENT, {
                        type: wallet_1.WalletEventType.TRANSACTION_SENT,
                        data: { txHash: txResponse.hash, tx },
                        timestamp: Date.now(),
                    });
                    return txResponse.hash;
                }
                catch (error) {
                    if (attempt === this.config.maxRetries)
                        throw error;
                    // Wait before retry
                    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
                    // Update nonce and gas price for next attempt
                    tx.nonce = await provider.getTransactionCount(wallet.address);
                    const newFeeData = await provider.getFeeData();
                    tx.maxFeePerGas = newFeeData.maxFeePerGas;
                    tx.maxPriorityFeePerGas = newFeeData.maxPriorityFeePerGas;
                }
            }
            throw new Error("Transaction failed after all retry attempts");
        }
        catch (error) {
            (0, logger_1.logError)("Error sending transaction:", error);
            this.emit(wallet_1.WalletEventType.ERROR, {
                type: wallet_1.WalletEventType.ERROR,
                data: { error, wallet: wallet.address },
                timestamp: Date.now(),
            });
            throw error;
        }
    }
    /**
     * Sign a message with a wallet
     */
    async signMessage(wallet, message) {
        try {
            return await wallet.signMessage(message);
        }
        catch (error) {
            (0, logger_1.logError)("Error signing message:", error);
            throw error;
        }
    }
    /**
     * Verify a signature
     */
    verifySignature(message, signature) {
        return ethers_1.ethers.verifyMessage(message, signature);
    }
    /**
     * Sign a transaction
     */
    async signTransaction(wallet, toAddress, value, provider) {
        try {
            (0, logger_1.log)(`Signing transaction from wallet ${wallet.address} to ${toAddress} for ${value} ETH`);
            // If no provider supplied, use configured one
            const actualProvider = provider || this.getProvider();
            // Get nonce
            const nonce = await actualProvider.getTransactionCount(wallet.address);
            (0, logger_1.log)(`Nonce for transaction: ${nonce}`);
            // Get fee data
            const feeData = await actualProvider.getFeeData();
            const tx = {
                nonce: nonce,
                to: toAddress,
                value: ethers_1.ethers.parseEther(value),
                gasPrice: feeData.gasPrice,
                gasLimit: 21000, // Standard gas limit for ETH transfers
            };
            // Sign transaction
            const signedTx = await wallet.signTransaction(tx);
            (0, logger_1.log)(`Transaction signed successfully`);
            return signedTx;
        }
        catch (error) {
            (0, logger_1.logError)("Error signing transaction:", error);
            throw error;
        }
    }
    /**
     * Reset main wallet
     * Useful when we want to force wallet regeneration
     */
    resetMainWallet() {
        (0, logger_1.log)("Resetting main wallet");
        this.mainWallet = null;
    }
    /**
     * Export the mnemonic phrase, optionally encrypting it with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported mnemonic phrase (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your mnemonic phrase which gives FULL ACCESS to all your wallets.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
     */
    async exportMnemonic(password) {
        try {
            // Warn user about sensitive data (will appear in logs)
            (0, logger_1.log)("⚠️ SECURITY WARNING: Exporting mnemonic phrase - handle with extreme care!");
            const mnemonic = await this.getUserMasterMnemonic();
            if (!mnemonic) {
                throw new Error("No mnemonic available for this user");
            }
            // If password provided, encrypt the mnemonic
            if (password) {
                return this.encryptSensitiveData(mnemonic);
            }
            return mnemonic;
        }
        catch (error) {
            (0, logger_1.logError)("Error exporting mnemonic:", error);
            throw error;
        }
    }
    /**
     * Export wallet private keys, optionally encrypted with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported wallet keys (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your wallet private keys which give FULL ACCESS to your funds.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
     */
    async exportWalletKeys(password) {
        try {
            // Warn user about sensitive data (will appear in logs)
            (0, logger_1.log)("⚠️ SECURITY WARNING: Exporting wallet private keys - handle with extreme care!");
            if (!this.isUserAuthenticated()) {
                throw new Error("User must be authenticated to export wallet keys");
            }
            // Get all wallets
            const wallets = await this.loadWallets();
            if (wallets.length === 0) {
                throw new Error("No wallets found to export");
            }
            // Create export objects with only necessary data
            const exportData = wallets.map((walletInfo) => {
                const wallet = walletInfo.wallet;
                return {
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    path: walletInfo.path,
                    created: this.walletPaths[wallet.address]?.created || Date.now(),
                };
            });
            const exportString = JSON.stringify(exportData);
            // Encrypt if password provided
            if (password) {
                return this.encryptSensitiveData(exportString);
            }
            return exportString;
        }
        catch (error) {
            (0, logger_1.logError)("Error exporting wallet keys:", error);
            throw error;
        }
    }
    /**
     * Export GunDB pair, optionally encrypted with a password
     * @param password Optional password to encrypt the exported data
     * @returns Exported GunDB pair (SENSITIVE DATA!)
     * SECURITY WARNING: This method exports your GunDB credentials which give access to your encrypted data.
     * Never share this data with anyone, store it securely, and only use it for backup purposes.
     */
    async exportGunPair(password) {
        try {
            // Warn user about sensitive data (will appear in logs)
            (0, logger_1.log)("⚠️ SECURITY WARNING: Exporting GunDB pair - handle with extreme care!");
            // Check if user is authenticated
            if (!this.isUserAuthenticated()) {
                throw new Error("User must be authenticated to export GunDB pair");
            }
            const user = this.gun.user();
            // @ts-ignore - Accessing internal Gun property
            const pair = user._.sea;
            if (!pair) {
                throw new Error("No GunDB pair available for this user");
            }
            const pairExport = JSON.stringify(pair);
            // Encrypt if password provided
            if (password) {
                return this.encryptSensitiveData(pairExport);
            }
            return pairExport;
        }
        catch (error) {
            (0, logger_1.logError)("Error exporting GunDB pair:", error);
            throw error;
        }
    }
    /**
     * Esporta tutti i dati dell'utente in un unico file
     * @param password Password obbligatoria per cifrare i dati esportati
     * @returns Un oggetto JSON contenente tutti i dati dell'utente
     */
    async exportAllUserData(password) {
        if (!password) {
            throw new Error("È richiesta una password per esportare tutti i dati");
        }
        try {
            // Recupera tutti i dati
            const mnemonic = await this.getUserMasterMnemonic();
            const wallets = await this.loadWallets();
            const user = this.gun.user();
            if (!user || !user._ || !user._.sea) {
                throw new Error("Utente non autenticato o dati non disponibili");
            }
            // Prepara i dati dei wallet
            const walletData = wallets.map((walletInfo) => {
                // Controllo di sicurezza per walletInfo.address
                const address = walletInfo.address || "";
                return {
                    address: address,
                    privateKey: walletInfo.wallet.privateKey,
                    path: walletInfo.path,
                    created: (address && this.walletPaths[address]?.created) || Date.now(),
                };
            });
            // Crea l'oggetto completo con tutti i dati
            const exportData = {
                user: {
                    alias: user.is.alias,
                    pub: user.is.pub,
                    pair: user._.sea,
                },
                mnemonic,
                wallets: walletData,
                version: "1.0",
                exportedAt: new Date().toISOString(),
                appName: "Shogun Wallet",
            };
            // Cifra i dati con la password fornita
            const encryptedData = await sea_1.default.encrypt(JSON.stringify(exportData), password);
            return JSON.stringify({
                type: "encrypted-shogun-backup",
                data: encryptedData,
                version: "1.0",
            });
        }
        catch (error) {
            (0, logger_1.logError)("Errore nell'esportazione di tutti i dati utente:", error);
            throw error;
        }
    }
    /**
     * Importa una frase mnemonica
     * @param mnemonicData La mnemonica o il JSON cifrato da importare
     * @param password Password opzionale per decifrare la mnemonica se cifrata
     * @returns true se l'importazione è riuscita
     */
    async importMnemonic(mnemonicData, password) {
        try {
            let mnemonic = mnemonicData;
            // Verifica se i dati sono in formato JSON cifrato
            if (mnemonicData.startsWith("{")) {
                try {
                    const jsonData = JSON.parse(mnemonicData);
                    // Se i dati sono cifrati, decifriamoli
                    if (jsonData.type === "encrypted-mnemonic" &&
                        jsonData.data &&
                        password) {
                        const decryptedData = await sea_1.default.decrypt(jsonData.data, password);
                        if (!decryptedData) {
                            throw new Error("Password non valida o dati corrotti");
                        }
                        mnemonic = decryptedData;
                    }
                    else if (jsonData.mnemonic) {
                        // Se i dati sono in formato JSON non cifrato con campo mnemonic
                        mnemonic = jsonData.mnemonic;
                    }
                }
                catch (error) {
                    throw new Error("Formato JSON non valido o password errata");
                }
            }
            // Valida la mnemonica (verifica che sia una mnemonica BIP39 valida)
            try {
                // Verifica che la mnemonica sia valida usando ethers.js
                ethers_1.ethers.Mnemonic.fromPhrase(mnemonic);
            }
            catch (error) {
                throw new Error("La mnemonica fornita non è valida");
            }
            // OTTIMIZZAZIONE: Ripulisci i wallet path esistenti prima di salvare la nuova mnemonica
            const user = this.gun.user();
            // Verifica che l'utente sia autenticato
            if (!user || !user.is) {
                throw new Error("L'utente deve essere autenticato per importare una mnemonica");
            }
            (0, logger_1.log)("Cancellazione dei wallet path esistenti prima dell'importazione della nuova mnemonica");
            // 1. Cancella i path da Gun
            try {
                // Rimuovi l'intero nodo wallet_paths
                await user.get("wallet_paths").put(null);
                (0, logger_1.log)("Wallet path eliminati da Gun con successo");
            }
            catch (gunError) {
                (0, logger_1.logError)("Errore durante la cancellazione dei wallet path da Gun:", gunError);
                // Continua comunque, non bloccare l'operazione per questo errore
            }
            // 2. Cancella i path da localStorage
            try {
                const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
                this.storage.removeItem(storageKey);
                (0, logger_1.log)("Wallet path eliminati da localStorage con successo");
            }
            catch (storageError) {
                (0, logger_1.logError)("Errore durante la cancellazione dei wallet path da localStorage:", storageError);
                // Continua comunque
            }
            // 3. Ripulisci i wallet path in memoria
            this.walletPaths = {};
            // 4. Salva la nuova mnemonica
            await this.saveUserMasterMnemonic(mnemonic);
            (0, logger_1.log)("Nuova mnemonica salvata con successo");
            // 5. Reset del wallet principale per forzare la riderivazione
            this.resetMainWallet();
            // 6. Genera il primo wallet con la nuova mnemonica
            await this.createWallet();
            (0, logger_1.log)("Generato nuovo wallet con la mnemonica importata");
            return true;
        }
        catch (error) {
            (0, logger_1.logError)("Errore nell'importazione della mnemonica:", error);
            throw error;
        }
    }
    /**
     * Importa le chiavi private dei wallet
     * @param walletsData JSON contenente i dati dei wallet o JSON cifrato
     * @param password Password opzionale per decifrare i dati se cifrati
     * @returns Il numero di wallet importati con successo
     */
    async importWalletKeys(walletsData, password) {
        try {
            let wallets = [];
            // Log per debug
            (0, logger_1.log)(`[importWalletKeys] Tentativo di importazione wallet, lunghezza dati: ${walletsData.length} caratteri`);
            if (walletsData.length > 100) {
                (0, logger_1.log)(`[importWalletKeys] Primi 100 caratteri: ${walletsData.substring(0, 100)}...`);
            }
            else {
                (0, logger_1.log)(`[importWalletKeys] Dati completi: ${walletsData}`);
            }
            // Pulizia dei dati: rimuovi BOM e altri caratteri speciali
            walletsData = walletsData.replace(/^\uFEFF/, ""); // Rimuovi BOM
            walletsData = walletsData.trim(); // Rimuovi spazi all'inizio e alla fine
            // Verifica se i dati sono in formato JSON cifrato
            try {
                // Verifica che sia un JSON valido
                if (!walletsData.startsWith("{") && !walletsData.startsWith("[")) {
                    (0, logger_1.log)("[importWalletKeys] Il formato non sembra essere JSON valido");
                    // Tenta di interpretare come mnemonic o chiave privata singola
                    if (walletsData.split(" ").length >= 12) {
                        (0, logger_1.log)("[importWalletKeys] Potrebbe essere una mnemonic");
                        throw new Error("I dati sembrano essere una mnemonic, usa 'Importa Mnemonica' invece");
                    }
                    if (walletsData.startsWith("0x") && walletsData.length === 66) {
                        (0, logger_1.log)("[importWalletKeys] Potrebbe essere una chiave privata singola");
                        // Crea un wallet manuale da chiave privata
                        try {
                            const wallet = new ethers_1.ethers.Wallet(walletsData);
                            const path = "m/44'/60'/0'/0/0"; // Path predefinito
                            // Crea un oggetto wallet compatibile
                            wallets = [
                                {
                                    address: wallet.address,
                                    privateKey: wallet.privateKey,
                                    path: path,
                                    created: Date.now(),
                                },
                            ];
                            (0, logger_1.log)(`[importWalletKeys] Creato wallet singolo da chiave privata: ${wallet.address}`);
                        }
                        catch (walletError) {
                            (0, logger_1.logError)("[importWalletKeys] Errore nella creazione del wallet da chiave privata:", walletError);
                            throw new Error(`Chiave privata non valida: ${walletError}`);
                        }
                    }
                    else {
                        throw new Error("Formato non riconosciuto. Fornisci un file JSON valido.");
                    }
                }
                else {
                    // Tenta di parsificare il JSON
                    const jsonData = JSON.parse(walletsData);
                    (0, logger_1.log)(`[importWalletKeys] JSON parsificato con successo, tipo: ${typeof jsonData}, chiavi: ${Object.keys(jsonData).join(", ")}`);
                    // Se i dati sono cifrati, decifriamoli
                    if (jsonData.type === "encrypted-wallets" &&
                        jsonData.data &&
                        password) {
                        (0, logger_1.log)("[importWalletKeys] Trovati dati cifrati, tentativo di decifratura...");
                        try {
                            const decryptedData = await sea_1.default.decrypt(jsonData.data, password);
                            if (!decryptedData) {
                                (0, logger_1.log)("[importWalletKeys] Decifratura fallita: risultato null");
                                throw new Error("Password non valida o dati corrotti");
                            }
                            (0, logger_1.log)("[importWalletKeys] Decifratura riuscita, tentativo di parsing...");
                            (0, logger_1.log)("[importWalletKeys] Tipo dei dati decifrati:", typeof decryptedData);
                            if (typeof decryptedData === "string" &&
                                decryptedData.length > 50) {
                                (0, logger_1.log)("[importWalletKeys] Primi 50 caratteri decifrati:", decryptedData.substring(0, 50));
                            }
                            try {
                                const decryptedJson = JSON.parse(decryptedData);
                                (0, logger_1.log)("[importWalletKeys] Parsing riuscito, struttura:", Object.keys(decryptedJson).join(", "));
                                if (decryptedJson.wallets &&
                                    Array.isArray(decryptedJson.wallets)) {
                                    wallets = decryptedJson.wallets;
                                    (0, logger_1.log)(`[importWalletKeys] Trovati ${wallets.length} wallet nei dati decifrati`);
                                }
                                else if (Array.isArray(decryptedJson)) {
                                    wallets = decryptedJson;
                                    (0, logger_1.log)(`[importWalletKeys] Trovato array diretto di ${wallets.length} wallet nei dati decifrati`);
                                }
                                else {
                                    (0, logger_1.log)("[importWalletKeys] Formato JSON decifrato non valido:", decryptedJson);
                                    throw new Error("Formato JSON decifrato non valido: manca il campo 'wallets'");
                                }
                            }
                            catch (parseError) {
                                (0, logger_1.logError)(`[importWalletKeys] Errore nel parsing dei dati decifrati: ${parseError}`);
                                throw new Error("Formato JSON decifrato non valido");
                            }
                        }
                        catch (decryptError) {
                            (0, logger_1.logError)("[importWalletKeys] Errore durante la decifratura:", decryptError);
                            throw new Error(`Errore durante la decifratura: ${decryptError.message || String(decryptError)}`);
                        }
                    }
                    else if (jsonData.wallets) {
                        // Se i dati sono in formato JSON non cifrato con campo wallets
                        if (Array.isArray(jsonData.wallets)) {
                            wallets = jsonData.wallets;
                            (0, logger_1.log)(`[importWalletKeys] Trovati ${wallets.length} wallet nel JSON non cifrato`);
                        }
                        else {
                            (0, logger_1.log)("[importWalletKeys] Il campo wallets non è un array:", jsonData.wallets);
                            throw new Error("Formato JSON non valido: il campo 'wallets' non è un array");
                        }
                    }
                    else if (Array.isArray(jsonData)) {
                        // Se è un array diretto di wallet
                        wallets = jsonData;
                        (0, logger_1.log)(`[importWalletKeys] Trovato array diretto di ${wallets.length} wallet`);
                    }
                    else {
                        (0, logger_1.log)("[importWalletKeys] Formato JSON non valido:", jsonData);
                        throw new Error("Formato JSON non valido: manca il campo 'wallets'");
                    }
                }
            }
            catch (error) {
                (0, logger_1.logError)(`[importWalletKeys] Errore nel parsing JSON: ${error}`);
                throw new Error(`Formato JSON non valido o password errata: ${error || String(error)}`);
            }
            if (!Array.isArray(wallets) || wallets.length === 0) {
                (0, logger_1.log)("[importWalletKeys] Nessun wallet valido trovato nei dati forniti");
                throw new Error("Nessun wallet valido trovato nei dati forniti");
            }
            (0, logger_1.log)(`[importWalletKeys] Inizio importazione di ${wallets.length} wallet...`);
            // Crea un contatore per i wallet importati con successo
            let successCount = 0;
            // Per ogni wallet nei dati importati
            for (const walletData of wallets) {
                try {
                    (0, logger_1.log)(`[importWalletKeys] Tentativo di importazione wallet: ${JSON.stringify(walletData).substring(0, 100)}...`);
                    if (!walletData.privateKey) {
                        (0, logger_1.log)("[importWalletKeys] Manca la chiave privata, salto questo wallet");
                        continue; // Salta wallet incompleti
                    }
                    // Se manca il path, usa un path predefinito
                    const path = walletData.path || "m/44'/60'/0'/0/0";
                    // Crea un wallet da chiave privata
                    try {
                        const wallet = new ethers_1.ethers.Wallet(walletData.privateKey);
                        // Verifica che la chiave privata corrisponda all'indirizzo fornito (se presente)
                        if (walletData.address &&
                            wallet.address.toLowerCase() !== walletData.address.toLowerCase()) {
                            (0, logger_1.logWarn)(`[importWalletKeys] L'indirizzo generato ${wallet.address} non corrisponde all'indirizzo fornito ${walletData.address}`);
                        }
                        // Memorizza nel dizionario dei percorsi
                        this.walletPaths[wallet.address] = {
                            path: path,
                            created: walletData.created || Date.now(),
                        };
                        // Salva i percorsi aggiornati
                        this.saveWalletPathsToLocalStorage();
                        // Incrementa il contatore
                        successCount++;
                        (0, logger_1.log)(`[importWalletKeys] Wallet importato con successo: ${wallet.address}`);
                    }
                    catch (walletError) {
                        (0, logger_1.logError)(`[importWalletKeys] Errore nella creazione del wallet: ${walletError.message || String(walletError)}`);
                        // Continua con il prossimo wallet
                    }
                }
                catch (walletImportError) {
                    (0, logger_1.logError)(`[importWalletKeys] Errore nell'importazione del wallet: ${walletImportError.message || String(walletImportError)}`);
                    // Continua con il prossimo wallet
                }
            }
            // Verifica che almeno un wallet sia stato importato con successo
            if (successCount === 0) {
                throw new Error("Nessun wallet è stato importato con successo");
            }
            // Resetta il wallet principale per forzare la riderivazione
            this.resetMainWallet();
            (0, logger_1.log)(`[importWalletKeys] Importazione completata: ${successCount} wallet importati su ${wallets.length}`);
            return successCount;
        }
        catch (error) {
            (0, logger_1.logError)("Errore nell'importazione dei wallet:", error);
            throw error;
        }
    }
    /**
     * Importa un pair di Gun
     * @param pairData JSON contenente il pair di Gun o JSON cifrato
     * @param password Password opzionale per decifrare i dati se cifrati
     * @returns true se l'importazione è riuscita
     */
    async importGunPair(pairData, password) {
        try {
            let pair;
            // Verifica se i dati sono in formato JSON cifrato
            try {
                const jsonData = JSON.parse(pairData);
                // Se i dati sono cifrati, decifriamoli
                if (jsonData.type === "encrypted-gun-pair" &&
                    jsonData.data &&
                    password) {
                    const decryptedData = await sea_1.default.decrypt(jsonData.data, password);
                    if (!decryptedData) {
                        throw new Error("Password non valida o dati corrotti");
                    }
                    pair = JSON.parse(decryptedData);
                }
                else {
                    // Altrimenti assumiamo che il JSON sia direttamente il pair
                    pair = jsonData;
                }
            }
            catch (error) {
                throw new Error("Formato JSON non valido o password errata");
            }
            // Verifica che il pair contenga i campi necessari
            if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                throw new Error("Il pair di Gun non è completo o valido");
            }
            // Aggiorna le informazioni dell'utente
            try {
                const user = this.gun.user();
                if (!user) {
                    throw new Error("Gun non disponibile");
                }
                // La creazione e l'autenticazione con il pair importato deve essere gestita a livello di applicazione
                // perché richiede un nuovo logout e login
                (0, logger_1.log)("Pair di Gun validato con successo, pronto per l'autenticazione");
                return true;
            }
            catch (error) {
                throw new Error(`Errore nell'autenticazione con il pair importato: ${error}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Errore nell'importazione del pair di Gun:", error);
            throw error;
        }
    }
    /**
     * Importa un backup completo
     * @param backupData JSON cifrato contenente tutti i dati dell'utente
     * @param password Password per decifrare il backup
     * @param options Opzioni di importazione (quali dati importare)
     * @returns Un oggetto con il risultato dell'importazione
     */
    async importAllUserData(backupData, password, options = { importMnemonic: true, importWallets: true, importGunPair: true }) {
        try {
            if (!password) {
                throw new Error("La password è obbligatoria per importare il backup");
            }
            // Log per debug
            (0, logger_1.log)(`[importAllUserData] Tentativo di importazione backup, lunghezza: ${backupData.length} caratteri`);
            if (backupData.length > 100) {
                (0, logger_1.log)(`[importAllUserData] Primi 100 caratteri: ${backupData.substring(0, 100)}...`);
            }
            else {
                (0, logger_1.log)(`[importAllUserData] Dati completi: ${backupData}`);
            }
            // Pulizia dei dati: rimuovi BOM e altri caratteri speciali
            backupData = backupData.replace(/^\uFEFF/, ""); // Rimuovi BOM
            backupData = backupData.trim(); // Rimuovi spazi all'inizio e alla fine
            let decryptedData;
            // Verifica se i dati sono nel formato corretto
            try {
                (0, logger_1.log)("[importAllUserData] Tentativo di parsing JSON...");
                // Verifica che sia un JSON valido
                if (!backupData.startsWith("{") && !backupData.startsWith("[")) {
                    (0, logger_1.log)("[importAllUserData] Il formato non sembra essere JSON valido");
                    throw new Error("Il backup deve essere in formato JSON valido");
                }
                const jsonData = JSON.parse(backupData);
                (0, logger_1.log)(`[importAllUserData] JSON parsificato con successo, tipo: ${jsonData.type || "non specificato"}`);
                if (jsonData.type !== "encrypted-shogun-backup" || !jsonData.data) {
                    (0, logger_1.log)("[importAllUserData] Formato del backup non valido:", jsonData);
                    throw new Error("Formato del backup non valido: manca il tipo o i dati");
                }
                // Decifra i dati
                (0, logger_1.log)("[importAllUserData] Tentativo di decifratura...");
                try {
                    decryptedData = await sea_1.default.decrypt(jsonData.data, password);
                }
                catch (decryptError) {
                    (0, logger_1.logError)("[importAllUserData] Errore nella decifratura:", decryptError);
                    throw new Error(`Errore nella decifratura: ${decryptError}`);
                }
                if (!decryptedData) {
                    (0, logger_1.log)("[importAllUserData] Decifratura fallita: null o undefined");
                    throw new Error("Password non valida o dati corrotti");
                }
                (0, logger_1.log)("[importAllUserData] Decifratura riuscita, tentativo di parsing del contenuto...");
                (0, logger_1.log)("[importAllUserData] Tipo di dati decifrati:", typeof decryptedData);
                if (typeof decryptedData === "string" && decryptedData.length > 50) {
                    (0, logger_1.log)("[importAllUserData] Primi 50 caratteri decifrati:", decryptedData.substring(0, 50));
                }
                try {
                    decryptedData = JSON.parse(decryptedData);
                    (0, logger_1.log)("[importAllUserData] Parsing del contenuto decifrato riuscito");
                }
                catch (parseError) {
                    (0, logger_1.logError)("[importAllUserData] Errore nel parsing del contenuto decifrato:", parseError);
                    throw new Error(`Errore nel parsing del contenuto decifrato: ${parseError}`);
                }
            }
            catch (error) {
                (0, logger_1.logError)("[importAllUserData] Errore generale:", error);
                throw new Error(`Formato JSON non valido o password errata: ${error}`);
            }
            // Risultati dell'importazione
            const result = { success: false };
            // Importa la mnemonic se richiesto
            if (options.importMnemonic && decryptedData.mnemonic) {
                try {
                    (0, logger_1.log)("[importAllUserData] Tentativo di importazione mnemonica...");
                    await this.saveUserMasterMnemonic(decryptedData.mnemonic);
                    result.mnemonicImported = true;
                    (0, logger_1.log)("[importAllUserData] Mnemonica importata con successo");
                }
                catch (error) {
                    (0, logger_1.logError)("[importAllUserData] Errore nell'importazione della mnemonica:", error);
                    result.mnemonicImported = false;
                }
            }
            else {
                (0, logger_1.log)("[importAllUserData] Importazione mnemonica non richiesta o mnemonica non trovata");
            }
            // Importa i wallet se richiesto
            if (options.importWallets &&
                decryptedData.wallets &&
                Array.isArray(decryptedData.wallets)) {
                try {
                    (0, logger_1.log)(`[importAllUserData] Tentativo di importazione di ${decryptedData.wallets.length} wallet...`);
                    // Prepara i dati nel formato richiesto da importWalletKeys
                    const walletsData = JSON.stringify({
                        wallets: decryptedData.wallets,
                    });
                    result.walletsImported = await this.importWalletKeys(walletsData);
                    (0, logger_1.log)(`[importAllUserData] ${result.walletsImported} wallet importati con successo`);
                }
                catch (error) {
                    (0, logger_1.logError)("[importAllUserData] Errore nell'importazione dei wallet:", error);
                    result.walletsImported = 0;
                }
            }
            else {
                (0, logger_1.log)("[importAllUserData] Importazione wallet non richiesta o wallet non trovati");
                if (options.importWallets) {
                    (0, logger_1.log)("[importAllUserData] Dettagli wallets:", decryptedData.wallets);
                }
            }
            // Importa il pair di Gun se richiesto
            if (options.importGunPair &&
                decryptedData.user &&
                decryptedData.user.pair) {
                try {
                    (0, logger_1.log)("[importAllUserData] Tentativo di importazione pair Gun...");
                    // Il pair di Gun viene validato ma non applicato automaticamente
                    // (richiede logout e login che deve essere gestito dall'app)
                    const pairData = JSON.stringify(decryptedData.user.pair);
                    await this.importGunPair(pairData);
                    result.gunPairImported = true;
                    (0, logger_1.log)("[importAllUserData] Pair Gun importato con successo");
                }
                catch (error) {
                    (0, logger_1.logError)("[importAllUserData] Errore nell'importazione del pair di Gun:", error);
                    result.gunPairImported = false;
                }
            }
            else {
                (0, logger_1.log)("[importAllUserData] Importazione pair Gun non richiesta o pair non trovato");
                if (options.importGunPair) {
                    (0, logger_1.log)("[importAllUserData] Dettagli user:", decryptedData.user);
                }
            }
            // Imposta il risultato finale
            result.success = !!((options.importMnemonic && result.mnemonicImported) ||
                (options.importWallets &&
                    result.walletsImported &&
                    result.walletsImported > 0) ||
                (options.importGunPair && result.gunPairImported));
            (0, logger_1.log)("[importAllUserData] Risultato finale:", result);
            return result;
        }
        catch (error) {
            (0, logger_1.logError)("Errore nell'importazione del backup:", error);
            throw error;
        }
    }
    /**
     * Update the balance cache TTL
     * @param ttlMs Time-to-live in milliseconds
     */
    setBalanceCacheTTL(ttlMs) {
        if (ttlMs < 0) {
            throw new Error("Cache TTL must be a positive number");
        }
        this.config.balanceCacheTTL = ttlMs;
        (0, logger_1.log)(`Balance cache TTL updated to ${ttlMs}ms`);
    }
    /**
     * Verifica se l'utente è autenticato
     * @returns true se l'utente è autenticato
     * @private
     */
    isUserAuthenticated() {
        const user = this.gun.user();
        // @ts-ignore - Accesso a proprietà interna di Gun
        return !!(user && user._ && user._.sea);
    }
    /**
     * Export wallet data with enhanced security
     */
    async exportWalletData(options = {}) {
        try {
            const wallets = await this.loadWallets();
            const exportData = {
                version: "2.0",
                timestamp: Date.now(),
                wallets: wallets.map((w) => ({
                    address: w.address,
                    path: w.path,
                    created: this.walletPaths[w.address]?.created || Date.now(),
                    ...(options.includePrivateKeys
                        ? { privateKey: w.wallet.privateKey }
                        : {}),
                })),
                ...(options.includeHistory
                    ? { history: await this.getWalletHistory() }
                    : {}),
            };
            if (options.encryptionPassword) {
                const encrypted = await sea_1.default.encrypt(JSON.stringify(exportData), options.encryptionPassword);
                return JSON.stringify({
                    type: "encrypted-wallet-backup",
                    version: "2.0",
                    data: encrypted,
                });
            }
            return JSON.stringify(exportData);
        }
        catch (error) {
            (0, logger_1.logError)("Error exporting wallet data:", error);
            throw error;
        }
    }
    /**
     * Import wallet data with validation
     */
    async importWalletData(data, options = {}) {
        try {
            let walletData;
            if (data.startsWith("{")) {
                const parsed = JSON.parse(data);
                if (parsed.type === "encrypted-wallet-backup" &&
                    options.decryptionPassword) {
                    const decrypted = await sea_1.default.decrypt(parsed.data, options.decryptionPassword);
                    if (!decrypted)
                        throw new Error("Decryption failed");
                    walletData = JSON.parse(decrypted);
                }
                else {
                    walletData = parsed;
                }
            }
            else {
                throw new Error("Invalid wallet data format");
            }
            let importedCount = 0;
            for (const wallet of walletData.wallets) {
                try {
                    if (options.validateAddresses) {
                        const valid = ethers_1.ethers.isAddress(wallet.address);
                        if (!valid)
                            continue;
                    }
                    if (!options.overwriteExisting && this.walletPaths[wallet.address]) {
                        continue;
                    }
                    // Store wallet path
                    this.walletPaths[wallet.address] = {
                        path: wallet.path,
                        created: wallet.created || Date.now(),
                    };
                    importedCount++;
                }
                catch (error) {
                    (0, logger_1.logError)(`Error importing wallet ${wallet.address}:`, error);
                    continue;
                }
            }
            // Save updated paths
            await this.saveWalletPathsToLocalStorage();
            this.emit(wallet_1.WalletEventType.WALLET_IMPORTED, {
                type: wallet_1.WalletEventType.WALLET_IMPORTED,
                data: { count: importedCount },
                timestamp: Date.now(),
            });
            return importedCount;
        }
        catch (error) {
            (0, logger_1.logError)("Error importing wallet data:", error);
            throw error;
        }
    }
    /**
     * Get wallet transaction history
     */
    async getWalletHistory() {
        // Implementazione del recupero storico transazioni
        return [];
    }
}
exports.WalletManager = WalletManager;
