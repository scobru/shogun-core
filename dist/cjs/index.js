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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunEventEmitter = exports.ShogunStorage = exports.Webauthn = exports.Stealth = exports.MetaMask = exports.GunDB = exports.ShogunCore = exports.GunRxJS = exports.ErrorType = exports.ErrorHandler = exports.ShogunDID = void 0;
const gun_1 = require("./gun/gun");
const events_1 = require("events");
const storage_1 = require("./storage/storage");
const shogun_1 = require("./types/shogun");
const logger_1 = require("./utils/logger");
const ethers_1 = require("ethers");
const errorHandler_1 = require("./utils/errorHandler");
const rxjs_integration_1 = require("./gun/rxjs-integration");
var DID_1 = require("./plugins/did/DID");
Object.defineProperty(exports, "ShogunDID", { enumerable: true, get: function () { return DID_1.ShogunDID; } });
// Esportare anche i tipi per la gestione degli errori
var errorHandler_2 = require("./utils/errorHandler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return errorHandler_2.ErrorHandler; } });
Object.defineProperty(exports, "ErrorType", { enumerable: true, get: function () { return errorHandler_2.ErrorType; } });
// Export RxJS integration
var rxjs_integration_2 = require("./gun/rxjs-integration");
Object.defineProperty(exports, "GunRxJS", { enumerable: true, get: function () { return rxjs_integration_2.GunRxJS; } });
// Aggiungiamo l'esportazione dei plugin
__exportStar(require("./plugins"), exports);
class ShogunCore {
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * and plugin system.
     */
    constructor(config) {
        // Collezione di plugin registrati
        this.plugins = new Map();
        (0, logger_1.log)("Initializing ShogunSDK");
        // Salviamo la configurazione
        this.config = config;
        // Inizializza la configurazione del logging
        if (config.logging) {
            (0, logger_1.configureLogging)(config.logging);
            (0, logger_1.log)("Logging configured with custom settings");
        }
        this.storage = new storage_1.ShogunStorage();
        this.eventEmitter = new events_1.EventEmitter();
        // Configura l'error handler per emettere eventi tramite EventEmitter
        errorHandler_1.ErrorHandler.addListener((error) => {
            this.eventEmitter.emit("error", {
                action: error.code,
                message: error.message,
                type: error.type,
            });
        });
        // Assicuriamoci che la configurazione di GunDB esista
        if (!config.gundb) {
            config.gundb = {};
            (0, logger_1.log)("No GunDB configuration provided, using defaults");
        }
        // Logghiamo il token di autenticazione se presente
        if (config.gundb.authToken) {
            const tokenPreview = config.gundb.authToken;
            (0, logger_1.log)(`Auth token from config: ${tokenPreview}`);
        }
        else {
            (0, logger_1.log)("No auth token in config");
        }
        const gundbConfig = {
            peers: config.gundb?.peers,
            websocket: config.gundb?.websocket ?? false,
            localStorage: config.gundb?.localStorage ?? false,
            radisk: config.gundb?.radisk ?? false,
            authToken: config.gundb?.authToken,
            multicast: config.gundb?.multicast ?? false,
            axe: config.gundb?.axe ?? false,
        };
        this.gundb = new gun_1.GunDB(gundbConfig);
        this.gun = this.gundb.getGun();
        this.user = this.gun.user().recall({ sessionStorage: true });
        // Initialize RxJS integration
        this.rx = new rxjs_integration_1.GunRxJS(this.gun);
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
        // Registriamo automaticamente i plugin in base alla configurazione
        this.registerBuiltinPlugins(config);
        // Registra i plugin personalizzati se configurati
        if (config.plugins?.autoRegister && config.plugins.autoRegister.length > 0) {
            for (const plugin of config.plugins.autoRegister) {
                try {
                    this.register(plugin);
                    (0, logger_1.log)(`Auto-registered plugin: ${plugin.name}`);
                }
                catch (error) {
                    (0, logger_1.logError)(`Failed to auto-register plugin ${plugin.name}:`, error);
                }
            }
        }
        (0, logger_1.log)("ShogunSDK initialized!");
    }
    /**
     * Registra i plugin integrati in base alla configurazione
     * @private
     */
    registerBuiltinPlugins(config) {
        try {
            // Import dinamici per i plugin integrati
            const { WebauthnPlugin } = require('./plugins/webauthn/webauthnPlugin');
            const { MetaMaskPlugin } = require('./plugins/metamask/metamaskPlugin');
            const { StealthPlugin } = require('./plugins/stealth/stealthPlugin');
            const { DIDPlugin } = require('./plugins/did/didPlugin');
            // Gruppo: Plugin di Autenticazione
            // Registra plugin Webauthn se abilitato
            if (config.webauthn?.enabled) {
                const webauthnPlugin = new WebauthnPlugin();
                webauthnPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(webauthnPlugin);
                // Per retrocompatibilità
                this.webauthn = this.getPlugin(shogun_1.CorePlugins.WebAuthn);
                (0, logger_1.log)("Webauthn plugin registered");
            }
            // Registra plugin MetaMask se abilitato
            if (config.metamask?.enabled) {
                const metamaskPlugin = new MetaMaskPlugin();
                metamaskPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(metamaskPlugin);
                // Per retrocompatibilità
                this.metamask = this.getPlugin(shogun_1.CorePlugins.MetaMask);
                (0, logger_1.log)("MetaMask plugin registered");
            }
            // Gruppo: Plugin di Privacy
            // Registra plugin Stealth se abilitato
            if (config.stealth?.enabled) {
                const stealthPlugin = new StealthPlugin();
                stealthPlugin._category = shogun_1.PluginCategory.Privacy;
                this.register(stealthPlugin);
                // Per retrocompatibilità
                this.stealth = this.getPlugin(shogun_1.CorePlugins.Stealth);
                (0, logger_1.log)("Stealth plugin registered");
            }
            // Gruppo: Plugin di Identità
            // Registra plugin DID se abilitato
            if (config.did?.enabled) {
                const didPlugin = new DIDPlugin();
                didPlugin._category = shogun_1.PluginCategory.Identity;
                this.register(didPlugin);
                // Per retrocompatibilità
                this.did = this.getPlugin(shogun_1.CorePlugins.DID);
                (0, logger_1.log)("DID plugin registered");
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error registering builtin plugins:", error);
        }
    }
    // *********************************************************************************************************
    // 🔌 PLUGIN MANAGER 🔌
    // *********************************************************************************************************
    /**
     * Registra un nuovo plugin
     * @param plugin Il plugin da registrare
     */
    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name "${plugin.name}" already registered`);
        }
        plugin.initialize(this);
        this.plugins.set(plugin.name, plugin);
        (0, logger_1.log)(`Registered plugin: ${plugin.name}`);
    }
    /**
     * Cancella la registrazione di un plugin
     * @param pluginName Nome del plugin da cancellare
     */
    unregister(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            (0, logger_1.log)(`Plugin "${pluginName}" not found, nothing to unregister`);
            return;
        }
        if (plugin.destroy) {
            plugin.destroy();
        }
        this.plugins.delete(pluginName);
        (0, logger_1.log)(`Unregistered plugin: ${pluginName}`);
    }
    /**
     * Recupera un plugin registrato per nome
     * @param name Nome del plugin
     * @returns Il plugin richiesto o undefined se non trovato
     * @template T Tipo del plugin o dell'interfaccia pubblica del plugin
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Verifica se un plugin è registrato
     * @param name Nome del plugin da verificare
     * @returns true se il plugin è registrato, false altrimenti
     */
    hasPlugin(name) {
        return this.plugins.has(name);
    }
    /**
     * Ottiene tutti i plugin di una determinata categoria
     * @param category Categoria di plugin da filtrare
     * @returns Array di plugin della categoria specificata
     */
    getPluginsByCategory(category) {
        const result = [];
        this.plugins.forEach(plugin => {
            if (plugin._category === category) {
                result.push(plugin);
            }
        });
        return result;
    }
    // *********************************************************************************************************
    // 🔄 RXJS INTEGRATION 🔄
    // *********************************************************************************************************
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    observe(path) {
        return this.rx.observe(path);
    }
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match(path, matchFn) {
        return this.rx.match(path, matchFn);
    }
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxPut(path, data) {
        return this.rx.put(path, data);
    }
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    rxSet(path, data) {
        return this.rx.set(path, data);
    }
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once(path) {
        return this.rx.once(path);
    }
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute(sources, computeFn) {
        return this.rx.compute(sources, computeFn);
    }
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxUserPut(path, data) {
        return this.rx.userPut(path, data);
    }
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser(path) {
        return this.rx.observeUser(path);
    }
    // *********************************************************************************************************
    // 🔐 ERROR HANDLER 🔐
    // *********************************************************************************************************
    /**
     * Recupera gli errori recenti registrati dal sistema
     * @param count - Numero di errori da recuperare
     * @returns Lista degli errori più recenti
     */
    getRecentErrors(count = 10) {
        return errorHandler_1.ErrorHandler.getRecentErrors(count);
    }
    // *********************************************************************************************************
    // 🔐 LOGGING 🔐
    // *********************************************************************************************************
    /**
     * Configure logging behavior for the Shogun SDK
     * @param {LoggingConfig} config - Logging configuration object containing:
     *   - level: The minimum log level to display (error, warn, info, debug, trace)
     *   - logToConsole: Whether to output logs to the console (default: true)
     *   - customLogger: Optional custom logger implementation
     *   - logTimestamps: Whether to include timestamps in logs (default: true)
     * @returns {void}
     * @description Updates the logging configuration for the SDK. Changes take effect immediately
     * for all subsequent log operations.
     */
    configureLogging(config) {
        (0, logger_1.configureLogging)(config);
        (0, logger_1.log)("Logging reconfigured with new settings");
    }
    // *********************************************************************************************************
    // 🔐 AUTHENTICATION
    // *********************************************************************************************************
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
        (0, logger_1.log)("Login");
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
            // Timeout dopo un intervallo configurabile (default 15 secondi)
            const timeoutDuration = this.config?.timeouts?.login || 15000;
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Login timeout",
                    });
                }, timeoutDuration);
            });
            // Use Promise.race to handle timeout
            const result = await Promise.race([loginPromise, timeoutPromise]);
            if (result.success) {
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub || "",
                });
                // Assicuriamoci che l'utente abbia un DID dopo il login
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
        (0, logger_1.log)("Sign up");
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
            // Timeout dopo un intervallo configurabile (default 20 secondi)
            const timeoutDuration = this.config?.timeouts?.signup || 20000;
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Registration timeout",
                    });
                }, timeoutDuration);
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
    // *********************************************************************************************************
    // 🔐 WEBAUTHN AUTHENTICATION
    // *********************************************************************************************************
    /**
     * Check if WebAuthn is supported by the browser
     * @returns {boolean} True if WebAuthn is supported, false otherwise
     * @description Verifies if the current browser environment supports WebAuthn authentication
     */
    isWebAuthnSupported() {
        // Utilizziamo il plugin WebAuthn se disponibile
        const webauthnPlugin = this.getPlugin("webauthn");
        if (webauthnPlugin) {
            return webauthnPlugin.isSupported();
        }
        // Fallback al vecchio metodo
        return this.webauthn?.isSupported() || false;
    }
    /**
     * Perform WebAuthn login
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    async loginWithWebAuthn(username) {
        (0, logger_1.log)("Login with WebAuthn");
        try {
            (0, logger_1.log)(`Attempting WebAuthn login for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn login");
            }
            if (!this.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            // Utilizziamo il plugin WebAuthn se disponibile
            const webauthnPlugin = this.getPlugin("webauthn");
            const webauthnInstance = webauthnPlugin || this.webauthn;
            // Verify WebAuthn credentials
            const assertionResult = await webauthnInstance?.generateCredentials(username, null, true);
            if (!assertionResult?.success) {
                throw new Error(assertionResult?.error || "WebAuthn verification failed");
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
        (0, logger_1.log)("Sign up with WebAuthn");
        try {
            (0, logger_1.log)(`Attempting WebAuthn registration for user: ${username}`);
            if (!username) {
                throw new Error("Username required for WebAuthn registration");
            }
            if (!this.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported by this browser");
            }
            // Utilizziamo il plugin WebAuthn se disponibile
            const webauthnPlugin = this.getPlugin("webauthn");
            const webauthnInstance = webauthnPlugin || this.webauthn;
            // Generate new WebAuthn credentials
            const attestationResult = await webauthnInstance?.generateCredentials(username, null, false);
            if (!attestationResult?.success) {
                throw new Error(attestationResult?.error || "Unable to generate WebAuthn credentials");
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
    // *********************************************************************************************************
    // 🔐 METAMASK AUTHENTICATION
    // *********************************************************************************************************
    /**
     * Login with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using MetaMask wallet credentials after signature verification
     */
    async loginWithMetaMask(address) {
        (0, logger_1.log)("Login with MetaMask");
        try {
            (0, logger_1.log)(`MetaMask login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for MetaMask login");
            }
            // Utilizziamo il plugin MetaMask se disponibile
            const metamaskPlugin = this.getPlugin("metamask");
            const metamaskInstance = metamaskPlugin || this.metamask;
            if (!metamaskInstance?.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "METAMASK_UNAVAILABLE", "MetaMask is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for MetaMask login...");
            const credentials = await metamaskInstance.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "MetaMask credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            // --- Verifica della Firma ---
            (0, logger_1.log)("Verifying MetaMask signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "MetaMask signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("MetaMask signature verified successfully.");
            // --- Fine Verifica Firma ---
            // Utilizziamo il metodo refactored per gestire login/creazione
            (0, logger_1.log)("Attempting login or user creation with verified credentials...");
            const result = await this.createUserWithGunDB(credentials.username, credentials.password);
            if (!result.success || !result.userPub) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "LOGIN_CREATE_FAILED", result.error ||
                    "Login or user creation failed after signature verification");
            }
            (0, logger_1.log)(`Login/Creation successful: ${result.userPub}`);
            // Assicuriamo che l'utente abbia un DID associato
            let did = null;
            try {
                (0, logger_1.log)("Ensuring user has a DID...");
                did = await this.ensureUserHasDID({
                    services: [
                        {
                            type: "EcdsaSecp256k1VerificationKey2019", // Tipo più specifico
                            endpoint: `ethereum:${address}`,
                        },
                    ],
                });
                if (did) {
                    (0, logger_1.log)(`DID assigned/verified: ${did}`);
                }
                else {
                    (0, logger_1.logWarn)("Could not ensure DID for user after MetaMask login.");
                }
            }
            catch (didError) {
                // Non bloccare il login se il DID fallisce, ma logga l'errore
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.DID, "DID_ENSURE_FAILED", "Error ensuring DID for MetaMask user", didError);
            }
            // Emettiamo un evento di login
            this.eventEmitter.emit("auth:login", {
                userPub: result.userPub,
                username: credentials.username,
                method: "metamask",
                did: did || undefined,
            });
            return {
                success: true,
                userPub: result.userPub,
                username: credentials.username,
                password: credentials.password, // Potrebbe non essere sicuro restituirlo
                did: did || undefined,
            };
        }
        catch (error) {
            // Cattura sia errori conformi a ShogunError che generici
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "METAMASK_LOGIN_ERROR";
            const errorMessage = error?.message || "Unknown error during MetaMask login";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message, // Ora handledError è ShogunError e ha .message
            };
        }
    }
    /**
     * Register new user with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using MetaMask wallet credentials after signature verification
     */
    async signUpWithMetaMask(address) {
        (0, logger_1.log)("Sign up with MetaMask");
        try {
            (0, logger_1.log)(`MetaMask registration attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for MetaMask registration");
            }
            // Utilizziamo il plugin MetaMask se disponibile
            const metamaskPlugin = this.getPlugin("metamask");
            const metamaskInstance = metamaskPlugin || this.metamask;
            if (!metamaskInstance?.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "METAMASK_UNAVAILABLE", "MetaMask is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for MetaMask registration...");
            const credentials = await metamaskInstance.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "MetaMask credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            // --- Verifica della Firma ---
            (0, logger_1.log)("Verifying MetaMask signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "MetaMask signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("MetaMask signature verified successfully.");
            // --- Fine Verifica Firma ---
            // Utilizziamo il metodo refactored per creare l'utente (o loggare se esiste già)
            (0, logger_1.log)("Attempting user creation (or login if exists) with verified credentials...");
            const result = await this.createUserWithGunDB(credentials.username, credentials.password);
            if (!result.success || !result.userPub) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "USER_CREATE_LOGIN_FAILED", result.error ||
                    "User creation or login failed after signature verification");
            }
            (0, logger_1.log)(`User creation/login successful: ${result.userPub}`);
            // Assicuriamo che l'utente abbia un DID associato
            let did = null;
            try {
                (0, logger_1.log)("Creating/Ensuring DID with MetaMask verification service...");
                did = await this.ensureUserHasDID({
                    services: [
                        {
                            type: "EcdsaSecp256k1VerificationKey2019", // Tipo più specifico
                            endpoint: `ethereum:${address}`,
                        },
                    ],
                });
                if (did) {
                    (0, logger_1.log)(`DID created/verified: ${did}`);
                }
                else {
                    (0, logger_1.logWarn)("Could not ensure DID for user after MetaMask signup.");
                }
            }
            catch (didError) {
                // Non bloccare la registrazione se il DID fallisce, ma logga l'errore
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.DID, "DID_ENSURE_FAILED", "Error ensuring DID for MetaMask user during signup", didError);
            }
            // Emettiamo un evento di registrazione (o login se l'utente esisteva già)
            this.eventEmitter.emit("auth:signup", {
                // Potrebbe essere logico emettere "auth:login" se l'utente esisteva già?
                userPub: result.userPub,
                username: credentials.username,
                method: "metamask",
                did: did || undefined,
            });
            return {
                success: true,
                userPub: result.userPub,
                username: credentials.username,
                password: credentials.password, // Potrebbe non essere sicuro restituirlo
                did: did || undefined,
            };
        }
        catch (error) {
            // Cattura sia errori conformi a ShogunError che generici
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "METAMASK_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during MetaMask registration";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message, // Ora handledError è ShogunError e ha .message
            };
        }
    }
    // *********************************************************************************************************
    // 🤫 PRIVATE HELPER METHODS 🤫
    // *********************************************************************************************************
    /**
     * Ensure the current user has a DID associated, creating one if needed
     * @param {DIDCreateOptions} [options] - Optional configuration for DID creation including:
     *   - network: The network to use (default: 'main')
     *   - controller: The controller of the DID (default: user's public key)
     *   - services: Array of service definitions to add to the DID document
     * @returns {Promise<string|null>} The DID identifier string or null if operation fails
     * @description Checks if the authenticated user already has a DID. If not, creates a new one.
     * If the user already has a DID and options are provided, updates the DID document accordingly.
     * @private
     */
    async ensureUserHasDID(options) {
        try {
            // Utilizziamo il plugin DID se disponibile
            const didPlugin = this.getPlugin("did");
            if (didPlugin && didPlugin.ensureUserHasDID) {
                return didPlugin.ensureUserHasDID(options);
            }
            // Fallback al vecchio metodo se il plugin non è disponibile
            if (!this.isLoggedIn()) {
                (0, logger_1.logError)("Cannot ensure DID: user not authenticated");
                return null;
            }
            // Verifica se l'utente ha già un DID
            let did = await this.did?.getCurrentUserDID();
            // Se l'utente ha già un DID, lo restituiamo
            if (did) {
                (0, logger_1.log)(`User already has DID: ${did}`);
                // Se sono state fornite opzioni, aggiorniamo il documento DID
                if (options && Object.keys(options).length > 0) {
                    try {
                        const updated = await this.did?.updateDIDDocument(did, {
                            service: options.services?.map((service, index) => ({
                                id: `${did}#service-${index + 1}`,
                                type: service.type,
                                serviceEndpoint: service.endpoint,
                            })),
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
                ...options,
            };
            did = await this.did?.createDID(mergedOptions);
            // Emetti evento di creazione DID
            this.eventEmitter.emit("did:created", { did, userPub });
            (0, logger_1.log)(`Created new DID for user: ${did}`);
            return did || null;
        }
        catch (error) {
            (0, logger_1.logError)("Error ensuring user has DID:", error);
            return null;
        }
    }
    /**
     * Create a new user with GunDB
     * @param username - Username
     * @param password - Password
     * @returns {Promise<{success: boolean, userPub?: string, error?: string}>} Promise with success status and user public key
     * @description Creates a new user in GunDB with error handling
     */
    createUserWithGunDB(username, password) {
        (0, logger_1.log)(`Ensuring user exists with GunDB: ${username}`);
        return new Promise(async (resolve) => {
            try {
                // Helper per l'autenticazione
                const authUser = () => {
                    return new Promise((resolveAuth) => {
                        // Assicurati che l'utente sia sloggato prima di autenticare
                        try {
                            this.gundb.logout();
                        }
                        catch (e) {
                            /* ignore logout errors */
                        }
                        this.gundb.gun.user().auth(username, password, (ack) => {
                            if (ack.err) {
                                resolveAuth({ err: ack.err });
                            }
                            else {
                                const user = this.gundb.gun.user();
                                const userPub = user.is?.pub || "";
                                if (!user.is || !userPub) {
                                    resolveAuth({
                                        err: "Authentication failed after apparent success.",
                                    });
                                }
                                else {
                                    resolveAuth({ pub: userPub });
                                }
                            }
                        });
                    });
                };
                // Helper per la creazione utente
                const createUser = () => {
                    return new Promise((resolveCreate) => {
                        // Assicurati che l'utente sia sloggato prima di creare
                        try {
                            this.gundb.logout();
                        }
                        catch (e) {
                            /* ignore logout errors */
                        }
                        this.gundb.gun.user().create(username, password, (ack) => {
                            resolveCreate({ err: ack.err, pub: ack.pub }); // pub might be present on success
                        });
                    });
                };
                // --- Flusso Principale ---
                (0, logger_1.log)(`Attempting login first for ${username}...`);
                let loginResult = await authUser();
                if (loginResult.pub) {
                    // Login riuscito, utente esiste già
                    (0, logger_1.log)(`Login successful for existing user. Pub: ${loginResult.pub}`);
                    resolve({
                        success: true,
                        userPub: loginResult.pub,
                    });
                    return;
                }
                // Login fallito, proviamo a creare l'utente
                (0, logger_1.log)(`Login failed (${loginResult.err || "unknown reason"}), attempting user creation...`);
                const createResult = await createUser();
                if (createResult.err) {
                    // Creazione fallita
                    (0, logger_1.log)(`User creation error: ${createResult.err}`);
                    resolve({
                        success: false,
                        error: `User creation failed: ${createResult.err}`,
                    });
                    return;
                }
                // Creazione riuscita, tentiamo di nuovo il login per conferma e per ottenere userPub
                (0, logger_1.log)(`User created successfully, attempting login again for confirmation...`);
                loginResult = await authUser();
                if (loginResult.pub) {
                    (0, logger_1.log)(`Post-creation login successful! User pub: ${loginResult.pub}`);
                    resolve({
                        success: true,
                        userPub: loginResult.pub,
                    });
                }
                else {
                    // Questo non dovrebbe accadere se la creazione è andata a buon fine
                    (0, logger_1.logError)(`Post-creation login failed unexpectedly: ${loginResult.err}`);
                    resolve({
                        success: false,
                        error: `User created, but subsequent login failed: ${loginResult.err}`,
                    });
                }
            }
            catch (error) {
                const errorMsg = error.message || "Unknown error during user existence check";
                (0, logger_1.logError)(`Error in createUserWithGunDB: ${errorMsg}`, error);
                resolve({
                    success: false,
                    error: errorMsg,
                });
            }
        });
    }
    // *********************************************************************************************************
    // 🔫 GuN ACTIONS 🔫
    // *********************************************************************************************************
    /**
     * Retrieves data from a Gun node at the specified path
     * @param path - The path to the Gun node
     * @returns Promise that resolves with the node data or rejects with an error
     */
    get(path) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.get(path).once((data) => {
                if (data.err) {
                    reject(data.err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * Stores data in Gun at the root level
     * @param data - The data to store
     * @returns Promise that resolves when data is stored or rejects with an error
     */
    put(data) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.put(data, (ack) => {
                if (ack.err) {
                    reject(ack.err);
                }
                else {
                    resolve(ack);
                }
            });
        });
    }
    /**
     * Stores data in the authenticated user's space
     * @param data - The data to store in user space
     * @returns Promise that resolves when data is stored or rejects with an error
     */
    userPut(data) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.user().put(data, (ack) => {
                if (ack.err) {
                    reject(ack.err);
                }
                else {
                    resolve(ack);
                }
            });
        });
    }
    /**
     * Retrieves data from the authenticated user's space at the specified path
     * @param path - The path to the user data
     * @returns Promise that resolves with the user data or rejects with an error
     */
    userGet(path) {
        return new Promise((resolve, reject) => {
            this.gundb.gun
                .user()
                .get(path)
                .once((data) => {
                if (data.err) {
                    reject(data.err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    // *********************************************************************************************************
    // 🔌 PROVIDER 🔌
    // *********************************************************************************************************
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
        return this.provider instanceof ethers_1.ethers.JsonRpcProvider
            ? this.provider.connection?.url || null
            : null;
    }
    /**
     * Get the main wallet for the authenticated user
     * @returns The user's main Ethereum wallet or null if not available
     * @deprecated Use getPlugin(CorePlugins.WalletManager).getMainWallet() instead
     */
    getMainWallet() {
        // Try to get the wallet from the wallet plugin if available
        const walletPlugin = this.getPlugin(shogun_1.CorePlugins.WalletManager);
        if (walletPlugin && typeof walletPlugin.getMainWallet === 'function') {
            return walletPlugin.getMainWallet();
        }
        // If no wallet plugin, return null
        return null;
    }
    // *********************************************************************************************************
    // 📢 EVENT EMITTER 📢
    // *********************************************************************************************************
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     */
    emit(eventName, ...args) {
        return this.eventEmitter.emit(eventName, ...args);
    }
}
exports.ShogunCore = ShogunCore;
// Export all types
__exportStar(require("./types/shogun"), exports);
// Export classes
var gun_2 = require("./gun/gun");
Object.defineProperty(exports, "GunDB", { enumerable: true, get: function () { return gun_2.GunDB; } });
var metamask_1 = require("./plugins/metamask/connector/metamask");
Object.defineProperty(exports, "MetaMask", { enumerable: true, get: function () { return metamask_1.MetaMask; } });
var stealth_1 = require("./plugins/stealth/stealth");
Object.defineProperty(exports, "Stealth", { enumerable: true, get: function () { return stealth_1.Stealth; } });
var webauthn_1 = require("./plugins/webauthn/webauthn");
Object.defineProperty(exports, "Webauthn", { enumerable: true, get: function () { return webauthn_1.Webauthn; } });
var storage_2 = require("./storage/storage");
Object.defineProperty(exports, "ShogunStorage", { enumerable: true, get: function () { return storage_2.ShogunStorage; } });
var events_2 = require("./events");
Object.defineProperty(exports, "ShogunEventEmitter", { enumerable: true, get: function () { return events_2.ShogunEventEmitter; } });
