"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletManager = exports.ShogunEventEmitter = exports.Storage = exports.Webauthn = exports.Stealth = exports.MetaMask = exports.GunDB = exports.ShogunCore = exports.ErrorType = exports.ErrorHandler = exports.ShogunDID = void 0;
const gun_1 = require("./gun/gun");
const webauthn_1 = require("./webauthn/webauthn");
const metamask_1 = require("./connector/metamask");
const stealth_1 = require("./stealth/stealth");
const events_1 = require("events");
const storage_1 = require("./storage/storage");
const logger_1 = require("./utils/logger");
const walletManager_1 = require("./wallet/walletManager");
const config_1 = __importDefault(require("./config"));
const ethers_1 = require("ethers");
const DID_1 = require("./did/DID");
const errorHandler_1 = require("./utils/errorHandler");
var DID_2 = require("./did/DID");
Object.defineProperty(exports, "ShogunDID", { enumerable: true, get: function () { return DID_2.ShogunDID; } });
// Esportare anche i tipi per la gestione degli errori
var errorHandler_2 = require("./utils/errorHandler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return errorHandler_2.ErrorHandler; } });
Object.defineProperty(exports, "ErrorType", { enumerable: true, get: function () { return errorHandler_2.ErrorType; } });
let gun;
class ShogunCore {
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * authentication methods (WebAuthn, MetaMask), and wallet management.
     */
    constructor(config) {
        (0, logger_1.log)("Initializing ShogunSDK");
        this.storage = new storage_1.Storage();
        this.eventEmitter = new events_1.EventEmitter();
        // Configura l'error handler per emettere eventi tramite EventEmitter
        errorHandler_1.ErrorHandler.addListener((error) => {
            this.eventEmitter.emit("error", {
                action: error.code,
                message: error.message,
                type: error.type,
            });
        });
        const gundbConfig = {
            peers: config.gundb?.peers || config.peers || config_1.default.PEERS,
            websocket: config.gundb?.websocket ?? false,
            localStorage: config.gundb?.localStorage ?? false,
            radisk: config.gundb?.radisk ?? false,
        };
        this.gundb = new gun_1.GunDB(gundbConfig);
        this.gun = this.gundb.getGun();
        this.webauthn = new webauthn_1.Webauthn();
        this.metamask = new metamask_1.MetaMask();
        this.stealth = new stealth_1.Stealth(this.storage);
        this.did = new DID_1.ShogunDID(this);
        // Initialize Ethereum provider
        if (config.providerUrl) {
            this.provider = new ethers_1.ethers.JsonRpcProvider(config.providerUrl);
            (0, logger_1.log)(`Using configured provider URL: ${config.providerUrl}`);
        }
        else {
            // Default provider (can be replaced as needed)
            this.provider = ethers_1.ethers.getDefaultProvider("mainnet");
            (0, logger_1.log)("WARNING: Using default Ethereum provider. For production use, configure a specific provider URL.");
        }
        this.walletManager = new walletManager_1.WalletManager(this.gundb, this.gun, this.storage, {
            balanceCacheTTL: config.wallet?.balanceCacheTTL,
        });
        // Configure RPC URL if provided
        if (config.providerUrl) {
            this.walletManager.setRpcUrl(config.providerUrl);
        }
        (0, logger_1.log)("ShogunSDK initialized!");
    }
    /**
     * Recupera gli errori recenti registrati dal sistema
     * @param count - Numero di errori da recuperare
     * @returns Lista degli errori più recenti
     */
    getRecentErrors(count = 10) {
        return errorHandler_1.ErrorHandler.getRecentErrors(count);
    }
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunDB login state
     * and presence of authentication credentials in storage
     */
    isLoggedIn() {
        const gunLoggedIn = this.gundb.isLoggedIn();
        const gunUser = this.gun.user();
        if (gunLoggedIn) {
            return true;
        }
        // @ts-ignore - Accessing internal Gun property that is not fully typed
        const hasPair = gunUser && gunUser._ && gunUser._.sea;
        const hasLocalPair = this.storage.getItem("pair");
        return !!hasPair || !!hasLocalPair;
    }
    /**
     * Perform user logout
     * @description Logs out the current user from GunDB and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout() {
        try {
            if (!this.isLoggedIn()) {
                (0, logger_1.log)("Logout ignored: user not authenticated");
                return;
            }
            this.gundb.logout();
            this.eventEmitter.emit("auth:logout", {});
            (0, logger_1.log)("Logout completed successfully");
        }
        catch (error) {
            // Usa il gestore errori centralizzato
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGOUT_FAILED", error instanceof Error ? error.message : "Error during logout", error);
        }
    }
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    async login(username, password) {
        try {
            (0, logger_1.log)(`Login attempt for user: ${username}`);
            // Verify parameters
            if (!username || !password) {
                return {
                    success: false,
                    error: "Username and password are required",
                };
            }
            // Set timeout to avoid infinite blocks
            const loginPromise = new Promise((resolve) => {
                this.gundb.gun.user().auth(username, password, (ack) => {
                    if (ack.err) {
                        (0, logger_1.log)(`Login error: ${ack.err}`);
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    }
                    else {
                        const user = this.gundb.gun.user();
                        if (!user.is) {
                            resolve({
                                success: false,
                                error: "Login failed: user not authenticated",
                            });
                        }
                        else {
                            (0, logger_1.log)("Login completed successfully");
                            const userPub = user.is?.pub || "";
                            resolve({
                                success: true,
                                userPub,
                                username,
                            });
                        }
                    }
                });
            });
            // Timeout after 10 seconds
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Login timeout",
                    });
                }, 10000);
            });
            // Use Promise.race to handle timeout
            const result = await Promise.race([loginPromise, timeoutPromise]);
            if (result.success) {
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub || "",
                });
                // Assicuriamo che l'utente abbia un DID dopo il login
                try {
                    const did = await this.ensureUserHasDID();
                    if (did) {
                        result.did = did;
                    }
                }
                catch (didError) {
                    (0, logger_1.logError)("Error ensuring DID after login:", didError);
                }
            }
            return result;
        }
        catch (error) {
            // Usa il gestore errori centralizzato
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGIN_FAILED", error.message || "Unknown error during login", error);
            return {
                success: false,
                error: error.message || "Unknown error during login",
            };
        }
    }
    /**
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param passwordConfirmation - Password confirmation
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    async signUp(username, password, passwordConfirmation) {
        try {
            // Input validation
            if (!username || !password) {
                return {
                    success: false,
                    error: "Username and password are required",
                };
            }
            // Validate passwords match if confirmation provided
            if (passwordConfirmation !== undefined &&
                password !== passwordConfirmation) {
                return {
                    success: false,
                    error: "Passwords do not match",
                };
            }
            // Validate password length
            if (password.length < 6) {
                return {
                    success: false,
                    error: "Password must be at least 6 characters long",
                };
            }
            // Set registration timeout
            const signupPromise = new Promise((resolve) => {
                this.gundb.gun.user().create(username, password, (ack) => {
                    if (ack.err) {
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    }
                    else {
                        // Auto-login after registration
                        this.gundb.gun.user().auth(username, password, (loginAck) => {
                            if (loginAck.err) {
                                resolve({
                                    success: false,
                                    error: "Registration completed but login failed",
                                });
                            }
                            else {
                                const user = this.gundb.gun.user();
                                if (!user.is) {
                                    resolve({
                                        success: false,
                                        error: "Registration completed but user not authenticated",
                                    });
                                }
                                else {
                                    resolve({
                                        success: true,
                                        userPub: user.is?.pub || "",
                                        username: username || "",
                                    });
                                }
                            }
                        });
                    }
                });
            });
            // Timeout after 15 seconds
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Registration timeout",
                    });
                }, 15000);
            });
            // Use Promise.race to handle timeout
            const result = await Promise.race([signupPromise, timeoutPromise]);
            if (result.success) {
                this.eventEmitter.emit("auth:signup", {
                    userPub: result.userPub || "",
                    username,
                });
                // Creare automaticamente un DID per il nuovo utente
                try {
                    const did = await this.ensureUserHasDID();
                    if (did) {
                        (0, logger_1.log)(`Created DID for new user: ${did}`);
                        // Aggiungiamo l'informazione sul DID al risultato
                        result.did = did;
                    }
                }
                catch (didError) {
                    // Se la creazione del DID fallisce, logghiamo l'errore ma non facciamo fallire la registrazione
                    (0, logger_1.logError)("Error creating DID for new user:", didError);
                }
            }
            return result;
        }
        catch (error) {
            (0, logger_1.logError)(`Error during registration for user ${username}:`, error);
            return {
                success: false,
                error: error.message || "Unknown error during registration",
            };
        }
    }
    /**
     * Check if WebAuthn is supported by the browser
     * @returns {boolean} True if WebAuthn is supported, false otherwise
     * @description Verifies if the current browser environment supports WebAuthn authentication
     */
    isWebAuthnSupported() {
        return this.webauthn.isSupported();
    }
    /**
     * Perform WebAuthn login
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    async loginWithWebAuthn(username) {
        try {
            (0, logger_1.log)(`Attempting WebAuthn login for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn login");
            }
            if (!this.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            // Verify WebAuthn credentials
            const assertionResult = await this.webauthn.generateCredentials(username, null, true);
            if (!assertionResult.success) {
                throw new Error(assertionResult.error || "WebAuthn verification failed");
            }
            // Use the credential ID as the password
            const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(assertionResult.credentialId || ""));
            // Login with verified credentials
            const result = await this.login(username, hashedCredentialId);
            if (result.success) {
                (0, logger_1.log)(`WebAuthn login completed successfully for user: ${username}`);
                // Assicuriamo che l'utente abbia un DID associato
                if (!result.did) {
                    try {
                        const did = await this.ensureUserHasDID();
                        if (did) {
                            result.did = did;
                        }
                    }
                    catch (didError) {
                        (0, logger_1.logError)("Error ensuring DID for WebAuthn user:", didError);
                    }
                }
                return {
                    ...result,
                    username,
                    password: hashedCredentialId,
                    credentialId: assertionResult.credentialId,
                };
            }
            else {
                return result;
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during WebAuthn login: ${error}`);
            return {
                success: false,
                error: error.message || "Error during WebAuthn login",
            };
        }
    }
    /**
     * Register new user with WebAuthn
     * @param username - Username
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    async signUpWithWebAuthn(username) {
        try {
            (0, logger_1.log)(`Attempting WebAuthn registration for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn registration");
            }
            if (!this.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            // Generate new WebAuthn credentials
            const attestationResult = await this.webauthn.generateCredentials(username, null, false);
            if (!attestationResult.success) {
                throw new Error(attestationResult.error || "Unable to generate WebAuthn credentials");
            }
            // Use credential ID as password
            const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(attestationResult.credentialId || ""));
            // Perform registration
            const result = await this.signUp(username, hashedCredentialId);
            if (result.success) {
                (0, logger_1.log)(`WebAuthn registration completed successfully for user: ${username}`);
                // Assicuriamo che l'utente abbia un DID con informazioni WebAuthn
                if (!result.did) {
                    try {
                        const did = await this.ensureUserHasDID({
                            services: [
                                {
                                    type: "WebAuthnVerification",
                                    endpoint: `webauthn:${username}`,
                                },
                            ],
                        });
                        if (did) {
                            result.did = did;
                        }
                    }
                    catch (didError) {
                        (0, logger_1.logError)("Error creating DID for WebAuthn user:", didError);
                    }
                }
                return {
                    ...result,
                    username,
                    password: hashedCredentialId,
                    credentialId: attestationResult.credentialId,
                };
            }
            else {
                return result;
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during WebAuthn registration: ${error}`);
            return {
                success: false,
                error: error.message || "Error during WebAuthn registration",
            };
        }
    }
    /**
     * Login with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using MetaMask wallet credentials
     */
    async loginWithMetaMask(address) {
        try {
            (0, logger_1.log)(`MetaMask login attempt for address: ${address}`);
            if (!address) {
                throw new Error("Ethereum address required for MetaMask login");
            }
            // Check if MetaMask is available
            if (!this.metamask.isAvailable()) {
                throw new Error("MetaMask is not available in the browser");
            }
            // Generate credentials using MetaMask
            const credentials = await this.metamask.generateCredentials(address);
            if (!credentials.username || !credentials.password) {
                throw new Error("MetaMask credentials not generated correctly");
            }
            // Attempt login with generated credentials
            const loginPromise = this.login(credentials.username, credentials.password);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Login timeout")), 30000);
            });
            // Use race to handle timeout
            const result = await Promise.race([loginPromise, timeoutPromise]);
            if (result.success) {
                (0, logger_1.log)(`MetaMask login completed successfully for address: ${address}`);
                // Assicuriamo che l'utente abbia un DID associato
                if (!result.did) {
                    try {
                        const did = await this.ensureUserHasDID();
                        if (did) {
                            result.did = did;
                        }
                    }
                    catch (didError) {
                        (0, logger_1.logError)("Error ensuring DID for MetaMask user:", didError);
                    }
                }
                return {
                    ...result,
                    username: credentials.username,
                    password: credentials.password,
                };
            }
            else {
                (0, logger_1.logError)(`MetaMask login failed for address: ${address}`);
                return {
                    success: false,
                    error: result.error || "Error during MetaMask login",
                };
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during MetaMask login: ${error}`);
            return {
                success: false,
                error: error.message || "Unknown error during MetaMask login",
            };
        }
    }
    /**
     * Register new user with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using MetaMask wallet credentials
     */
    async signUpWithMetaMask(address) {
        try {
            (0, logger_1.log)(`MetaMask registration attempt for address: ${address}`);
            if (!address) {
                throw new Error("Ethereum address required for MetaMask registration");
            }
            // Check if MetaMask is available
            if (!this.metamask.isAvailable()) {
                throw new Error("MetaMask is not available in the browser");
            }
            // Generate credentials using MetaMask
            const credentials = await this.metamask.generateCredentials(address);
            if (!credentials.username || !credentials.password) {
                throw new Error("MetaMask credentials not generated correctly");
            }
            // Attempt registration with generated credentials
            const signupPromise = this.signUp(credentials.username, credentials.password);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Registration timeout")), 30000);
            });
            // Use race to handle timeout
            const result = await Promise.race([signupPromise, timeoutPromise]);
            if (result.success) {
                (0, logger_1.log)(`MetaMask registration completed successfully for address: ${address}`);
                // Assicuriamo che l'utente abbia un DID con informazioni MetaMask
                if (!result.did) {
                    try {
                        const did = await this.ensureUserHasDID({
                            services: [
                                {
                                    type: "EcdsaSecp256k1Verification",
                                    endpoint: `ethereum:${address}`,
                                },
                            ],
                        });
                        if (did) {
                            result.did = did;
                        }
                    }
                    catch (didError) {
                        (0, logger_1.logError)("Error creating DID for MetaMask user:", didError);
                    }
                }
                return {
                    ...result,
                    username: credentials.username,
                    password: credentials.password,
                };
            }
            else {
                (0, logger_1.logError)(`MetaMask registration failed for address: ${address}`);
                return {
                    success: false,
                    error: result.error || "Error during MetaMask registration",
                };
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error during MetaMask registration: ${error}`);
            return {
                success: false,
                error: error.message || "Unknown error during MetaMask registration",
            };
        }
    }
    // WALLET MANAGER
    /**
     * Get main wallet
     * @returns {ethers.Wallet | null} Main wallet instance or null if not available
     * @description Retrieves the primary wallet associated with the user
     */
    getMainWallet() {
        return this.walletManager.getMainWallet();
    }
    /**
     * Create new wallet
     * @returns {Promise<WalletInfo>} Created wallet information
     * @description Generates a new wallet and associates it with the user
     */
    async createWallet() {
        return this.walletManager.createWallet();
    }
    /**
     * Load wallets
     * @returns {Promise<WalletInfo[]>} Array of wallet information
     * @description Retrieves all wallets associated with the authenticated user
     */
    async loadWallets() {
        try {
            if (!this.isLoggedIn()) {
                (0, logger_1.log)("Cannot load wallets: user not authenticated");
                // Segnaliamo l'errore con il gestore centralizzato ma non interrompiamo il flusso
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "AUTH_REQUIRED", "User authentication required to load wallets", null);
                return [];
            }
            try {
                return await this.walletManager.loadWallets();
            }
            catch (walletError) {
                // Gestiamo l'errore in modo più dettagliato
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WALLET, "LOAD_WALLETS_ERROR", `Error loading wallets: ${walletError instanceof Error ? walletError.message : String(walletError)}`, walletError);
                // Ritorniamo un array vuoto ma non interrompiamo l'applicazione
                return [];
            }
        }
        catch (error) {
            // Catturiamo errori generici imprevisti
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.UNKNOWN, "UNEXPECTED_ERROR", `Unexpected error loading wallets: ${error instanceof Error ? error.message : String(error)}`, error);
            return [];
        }
    }
    /**
     * Sign message
     * @param wallet - Wallet for signing
     * @param message - Message to sign
     * @returns {Promise<string>} Message signature
     * @description Signs a message using the provided wallet
     */
    async signMessage(wallet, message) {
        return this.walletManager.signMessage(wallet, message);
    }
    /**
     * Verify signature
     * @param message - Signed message
     * @param signature - Signature to verify
     * @returns {string} Address that signed the message
     * @description Recovers the address that signed a message from its signature
     */
    verifySignature(message, signature) {
        return this.walletManager.verifySignature(message, signature);
    }
    /**
     * Sign transaction
     * @param wallet - Wallet for signing
     * @param toAddress - Recipient address
     * @param value - Amount to send
     * @returns {Promise<string>} Signed transaction
     * @description Signs a transaction using the provided wallet
     */
    async signTransaction(wallet, toAddress, value) {
        return this.walletManager.signTransaction(wallet, toAddress, value);
    }
    /**
     * Export user's mnemonic phrase
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported mnemonic data
     * @description Exports the mnemonic phrase used to generate user's wallets
     */
    async exportMnemonic(password) {
        return this.walletManager.exportMnemonic(password);
    }
    /**
     * Export private keys of all wallets
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported wallet keys
     * @description Exports private keys for all user's wallets
     */
    async exportWalletKeys(password) {
        return this.walletManager.exportWalletKeys(password);
    }
    /**
     * Export user's Gun pair
     * @param password Optional password to encrypt exported data
     * @returns {Promise<string>} Exported Gun pair
     * @description Exports the user's Gun authentication pair
     */
    async exportGunPair(password) {
        return this.walletManager.exportGunPair(password);
    }
    /**
     * Export all user data in a single file
     * @param password Required password to encrypt exported data
     * @returns {Promise<string>} Exported user data
     * @description Exports all user data including mnemonic, wallets and Gun pair
     */
    async exportAllUserData(password) {
        return this.walletManager.exportAllUserData(password);
    }
    /**
     * Import mnemonic phrase
     * @param mnemonicData Mnemonic or encrypted JSON to import
     * @param password Optional password to decrypt mnemonic if encrypted
     * @returns {Promise<boolean>} Import success status
     * @description Imports a mnemonic phrase to generate wallets
     */
    async importMnemonic(mnemonicData, password) {
        return this.walletManager.importMnemonic(mnemonicData, password);
    }
    /**
     * Import wallet private keys
     * @param walletsData JSON containing wallet data or encrypted JSON
     * @param password Optional password to decrypt data if encrypted
     * @returns {Promise<number>} Number of imported wallets
     * @description Imports wallet private keys from exported data
     */
    async importWalletKeys(walletsData, password) {
        return this.walletManager.importWalletKeys(walletsData, password);
    }
    /**
     * Import Gun pair
     * @param pairData JSON containing Gun pair or encrypted JSON
     * @param password Optional password to decrypt data if encrypted
     * @returns {Promise<boolean>} Import success status
     * @description Imports a Gun authentication pair
     */
    async importGunPair(pairData, password) {
        return this.walletManager.importGunPair(pairData, password);
    }
    /**
     * Import complete backup
     * @param backupData Encrypted JSON containing all user data
     * @param password Password to decrypt backup
     * @param options Import options (which data to import)
     * @returns {Promise<Object>} Import results for each data type
     * @description Imports a complete user data backup including mnemonic,
     * wallets and Gun pair
     */
    async importAllUserData(backupData, password, options = { importMnemonic: true, importWallets: true, importGunPair: true }) {
        return this.walletManager.importAllUserData(backupData, password, options);
    }
    /**
     * Get addresses that would be derived from a mnemonic using BIP-44 standard
     * @param mnemonic The mnemonic phrase to derive addresses from
     * @param count The number of addresses to derive
     * @returns An array of Ethereum addresses
     * @description This method is useful for verifying compatibility with other wallets
     */
    getStandardBIP44Addresses(mnemonic, count = 5) {
        return this.walletManager.getStandardBIP44Addresses(mnemonic, count);
    }
    /**
     * Generate a new BIP-39 mnemonic phrase
     * @returns {string} A new random mnemonic phrase
     * @description Generates a cryptographically secure random mnemonic phrase
     * that can be used to derive HD wallets
     */
    generateNewMnemonic() {
        try {
            // Generate a new mnemonic phrase using ethers.js
            const mnemonic = ethers_1.ethers.Wallet.createRandom().mnemonic;
            if (!mnemonic || !mnemonic.phrase) {
                throw new Error("Failed to generate mnemonic phrase");
            }
            return mnemonic.phrase;
        }
        catch (error) {
            (0, logger_1.logError)("Error generating mnemonic:", error);
            throw new Error("Failed to generate mnemonic phrase");
        }
    }
    /**
     * Set the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     * @returns True if the URL was successfully set
     */
    setRpcUrl(rpcUrl) {
        try {
            if (!rpcUrl) {
                (0, logger_1.log)("Invalid RPC URL provided");
                return false;
            }
            this.walletManager.setRpcUrl(rpcUrl);
            // Update the provider if it's already initialized
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            (0, logger_1.log)(`RPC URL updated to: ${rpcUrl}`);
            return true;
        }
        catch (error) {
            (0, logger_1.logError)("Failed to set RPC URL", error);
            return false;
        }
    }
    /**
     * Get the currently configured RPC URL
     * @returns The current provider URL or null if not set
     */
    getRpcUrl() {
        // Access the provider URL if available
        return this.provider instanceof ethers_1.ethers.JsonRpcProvider ?
            this.provider.connection?.url || null :
            null;
    }
    /**
     * Ensure the current user has a DID associated, creating one if needed
     * @param options Optional DID creation options
     * @returns Promise with the DID string or null if fails
     */
    async ensureUserHasDID(options) {
        try {
            if (!this.isLoggedIn()) {
                (0, logger_1.logError)("Cannot ensure DID: user not authenticated");
                return null;
            }
            // Verifica se l'utente ha già un DID
            let did = await this.did.getCurrentUserDID();
            // Se l'utente ha già un DID, lo restituiamo
            if (did) {
                (0, logger_1.log)(`User already has DID: ${did}`);
                // Se sono state fornite opzioni, aggiorniamo il documento DID
                if (options && Object.keys(options).length > 0) {
                    try {
                        const updated = await this.did.updateDIDDocument(did, {
                            service: options.services?.map((service, index) => ({
                                id: `${did}#service-${index + 1}`,
                                type: service.type,
                                serviceEndpoint: service.endpoint,
                            }))
                        });
                        if (updated) {
                            (0, logger_1.log)(`Updated DID document for: ${did}`);
                        }
                    }
                    catch (updateError) {
                        (0, logger_1.logError)("Error updating DID document:", updateError);
                    }
                }
                return did;
            }
            // Se l'utente non ha un DID, ne creiamo uno nuovo
            (0, logger_1.log)("Creating new DID for authenticated user");
            const userPub = this.gundb.gun.user().is?.pub || "";
            const mergedOptions = {
                network: "main",
                controller: userPub,
                ...options
            };
            did = await this.did.createDID(mergedOptions);
            // Emetti evento di creazione DID
            this.eventEmitter.emit("did:created", { did, userPub });
            (0, logger_1.log)(`Created new DID for user: ${did}`);
            return did;
        }
        catch (error) {
            (0, logger_1.logError)("Error ensuring user has DID:", error);
            return null;
        }
    }
}
exports.ShogunCore = ShogunCore;
// Export all types
__exportStar(require("./types/shogun"), exports);
// Export classes
var gun_2 = require("./gun/gun");
Object.defineProperty(exports, "GunDB", { enumerable: true, get: function () { return gun_2.GunDB; } });
var metamask_2 = require("./connector/metamask");
Object.defineProperty(exports, "MetaMask", { enumerable: true, get: function () { return metamask_2.MetaMask; } });
var stealth_2 = require("./stealth/stealth");
Object.defineProperty(exports, "Stealth", { enumerable: true, get: function () { return stealth_2.Stealth; } });
var webauthn_2 = require("./webauthn/webauthn");
Object.defineProperty(exports, "Webauthn", { enumerable: true, get: function () { return webauthn_2.Webauthn; } });
var storage_2 = require("./storage/storage");
Object.defineProperty(exports, "Storage", { enumerable: true, get: function () { return storage_2.Storage; } });
var events_2 = require("./events");
Object.defineProperty(exports, "ShogunEventEmitter", { enumerable: true, get: function () { return events_2.ShogunEventEmitter; } });
var walletManager_2 = require("./wallet/walletManager");
Object.defineProperty(exports, "WalletManager", { enumerable: true, get: function () { return walletManager_2.WalletManager; } });
