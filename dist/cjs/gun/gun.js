"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GunDB = void 0;
/**
 * GunDB - Optimized class with advanced Auth integration
 */
const gun_1 = __importDefault(require("gun"));
require("gun/sea");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * GunDB - Simplified Gun management with advanced Auth
 *
 * Uses the Auth class for optimized authentication handling
 */
class GunDB {
    /**
     * @param options - GunDBOptions
     */
    constructor(options = {}) {
        this.user = null;
        this.certificato = null;
        this.onAuthCallbacks = [];
        this._authenticating = false;
        (0, logger_1.log)("Initializing GunDB");
        this.retryConfig = {
            attempts: options.retryAttempts ?? 3,
            delay: options.retryDelay ?? 1000,
        };
        // Use default configuration through spread to avoid null checks
        const config = {
            peers: options.peers,
            localStorage: options.localStorage ?? false,
            radisk: options.radisk ?? false,
            multicast: options.multicast ?? false,
            axe: options.axe ?? false,
        };
        // Logghiamo l'authToken ricevuto (senza mostrare il valore completo per sicurezza)
        if (options.authToken) {
            const tokenPreview = options.authToken.substring(0, 3) +
                "..." +
                (options.authToken.length > 6
                    ? options.authToken.substring(options.authToken.length - 3)
                    : "");
            (0, logger_1.log)(`Auth token received (${tokenPreview})`);
        }
        else {
            (0, logger_1.log)("No auth token received");
        }
        // Configure GunDB with provided options
        this.gun = new gun_1.default(config);
        this.user = this.gun.user().recall({ sessionStorage: true });
        // Aggiungiamo il token di autenticazione ai messaggi in uscita
        const authToken = options.authToken;
        if (authToken) {
            gun_1.default.on("opt", function (ctx) {
                if (ctx.once) {
                    return;
                }
                ctx.on("out", function (msg) {
                    var to = ctx.to;
                    // Adds headers for put
                    msg.headers = {
                        token: "thisIsTheTokenForReals",
                    };
                    to.next(msg); // pass to next middleware
                });
            });
            (0, logger_1.log)("Auth token handler configured for outgoing messages");
        }
        // Handle authentication events
        this.subscribeToAuthEvents();
    }
    /**
     * Retry operation with exponential backoff
     */
    async retry(operation, context) {
        let lastError;
        for (let i = 0; i < this.retryConfig.attempts; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (i < this.retryConfig.attempts - 1) {
                    const delay = this.retryConfig.delay * Math.pow(2, i);
                    (0, logger_1.log)(`Retry attempt ${i + 1} for ${context} in ${delay}ms`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    /**
     * Subscribe to Gun authentication events
     */
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            (0, logger_1.log)("Auth event received:", ack);
            if (ack.err) {
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.GUN, "AUTH_EVENT_ERROR", ack.err, new Error(ack.err));
            }
            else {
                this.notifyAuthListeners(ack.sea?.pub || "");
            }
        });
    }
    /**
     * Notify all authentication listeners
     * @param pub - Public key of authenticated user
     */
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((callback) => {
            callback(user);
        });
    }
    /**
     * Create new GunDB instance with specified peers
     * @param peers - Array of peer URLs
     * @returns New GunDB instance
     */
    static withPeers(peers = config_1.default.PEERS) {
        return new GunDB({ peers });
    }
    /**
     * Add listener for authentication events
     * @param callback - Function to call when user authenticates
     * @returns Function to remove the listener
     */
    onAuth(callback) {
        this.onAuthCallbacks.push(callback);
        // If user is already authenticated, call callback immediately
        const user = this.gun.user();
        if (user && user.is) {
            callback(user);
        }
        // Return function to remove listener
        return () => {
            const index = this.onAuthCallbacks.indexOf(callback);
            if (index !== -1) {
                this.onAuthCallbacks.splice(index, 1);
            }
        };
    }
    /**
     * Get underlying Gun instance
     * @returns Gun instance
     */
    getGun() {
        return this.gun;
    }
    /**
     * Get current user
     * @returns Gun user or null if not authenticated
     */
    getUser() {
        return this.gun.user();
    }
    /**
     * Get data from a specific path
     * @param path - Path to get data from
     * @returns Node reference
     */
    get(path) {
        return this.gun.get(path);
    }
    /**
     * Put data at a specific path
     * @param path - Path to put data at
     * @param data - Data to put
     * @returns Promise with success result
     */
    async put(path, data) {
        return new Promise((resolve) => {
            this.gun.get(path).put(data, (ack) => {
                if (ack.err) {
                    resolve({ success: false, error: ack.err });
                }
                else {
                    resolve({ success: true });
                }
            });
        });
    }
    /**
     * Set data in a collection
     * @param path - Path to collection
     * @param data - Data to set
     * @returns Promise with success result
     */
    async set(path, data) {
        return new Promise((resolve) => {
            this.gun.get(path).set(data, (ack) => {
                if (ack.err) {
                    resolve({ success: false, error: ack.err });
                }
                else {
                    resolve({ success: true });
                }
            });
        });
    }
    /**
     * Set certificate for current user
     * @param certificate - Certificate to use
     */
    setCertificate(certificate) {
        this.certificato = certificate;
        const user = this.gun.user();
        user.get("trust").get("certificate").put(certificate);
    }
    /**
     * Get current user's certificate
     * @returns Certificate or null if not available
     */
    getCertificate() {
        return this.certificato;
    }
    /**
     * Register a new user
     * @param username - Username
     * @param password - Password
     * @returns Promise resolving with user's public key
     */
    async signUp(username, password) {
        try {
            (0, logger_1.log)("Attempting user registration:", username);
            return new Promise((resolve) => {
                this.gun.user().create(username, password, async (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Registration error: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        // Automatic login after registration
                        try {
                            const loginResult = await this.login(username, password);
                            if (loginResult.success) {
                                (0, logger_1.log)("Registration and login completed successfully");
                            }
                            else {
                                (0, logger_1.logError)("Registration completed but login failed");
                            }
                            resolve(loginResult);
                        }
                        catch (error) {
                            resolve({
                                success: true,
                                userPub: ack.pub,
                                username,
                                loginError: "Auto-login failed, but registration successful",
                            });
                        }
                    }
                });
            });
        }
        catch (error) {
            (0, logger_1.logError)("Error during registration:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Perform user login
     * @param username - Username
     * @param password - Password
     * @param callback - Optional callback function
     * @returns Promise that resolves with login result
     */
    login(username, password, callback) {
        (0, logger_1.log)(`Attempting login for user: ${username}`);
        return new Promise((resolve, reject) => {
            if (!username || !password) {
                const error = "Username and password are required";
                (0, logger_1.log)(error);
                if (callback)
                    callback({ err: error });
                resolve({ success: false, error });
                return;
            }
            // Limpiezza: forziamo un reset di eventuali utenti precedenti
            try {
                this.gun.user().leave();
                (0, logger_1.log)("Current user reset before login attempt");
            }
            catch (e) {
                // Ignoriamo errori qui
            }
            // Imponiamo un timeout per evitare blocchi infiniti
            const timeoutId = setTimeout(() => {
                (0, logger_1.log)("Login timeout reached - resolving with error");
                if (callback)
                    callback({ err: "Login timeout" });
                resolve({ success: false, error: "Login timeout" });
            }, 3000); // 3 secondi di timeout
            // Eseguiamo login con una nuova istanza di Gun per evitare conflitti
            (0, logger_1.log)(`Performing auth with Gun for user: ${username}`);
            this.gun.user().auth(username, password, (ack) => {
                clearTimeout(timeoutId);
                if (ack.err) {
                    (0, logger_1.log)(`Login error: ${ack.err}`);
                    if (callback)
                        callback({ err: ack.err });
                    resolve({ success: false, error: ack.err });
                }
                else {
                    (0, logger_1.log)("Authentication completed successfully");
                    // Salviamo il pair
                    try {
                        this._savePair();
                        (0, logger_1.log)("User auth pair saved");
                    }
                    catch (saveError) {
                        (0, logger_1.log)(`Warning: Error saving auth pair: ${saveError}`);
                    }
                    if (callback)
                        callback(ack);
                    resolve({
                        success: true,
                        userPub: this.gun.user().is?.pub,
                        username,
                    });
                }
            });
        });
    }
    /**
     * Salva la coppia di autenticazione dell'utente
     * @private
     */
    _savePair() {
        try {
            const user = this.gun.user();
            // @ts-ignore - Accessing Gun's internal properties
            const pair = user._ && user._.sea;
            if (pair) {
                // Salva in storage locale se disponibile
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("pair", JSON.stringify(pair));
                }
            }
        }
        catch (error) {
            console.error("Error saving authentication pair:", error);
        }
    }
    /**
     * Verifica se un processo di autenticazione è già in corso
     */
    isAuthenticating() {
        return this._authenticating === true;
    }
    /**
     * Imposta il flag di autenticazione
     */
    _setAuthenticating(value) {
        this._authenticating = value;
    }
    /**
     * Logout current user
     */
    logout() {
        try {
            (0, logger_1.log)("Attempting logout");
            this.gun.user().leave();
            (0, logger_1.log)("Logout completed");
        }
        catch (error) {
            (0, logger_1.logError)("Error during logout:", error);
        }
    }
    /**
     * Check if a user is currently authenticated
     * @returns true if a user is authenticated
     */
    isLoggedIn() {
        const user = this.gun.user();
        return !!(user && user.is && user.is.pub);
    }
    /**
     * Get currently authenticated user
     * @returns Current user or null if not authenticated
     */
    getCurrentUser() {
        const userPub = this.gun.user()?.is?.pub;
        if (!userPub) {
            return null;
        }
        return {
            pub: userPub,
            user: this.gun.user(),
        };
    }
    /**
     * Save data with retry logic
     */
    async saveWithRetry(node, data, options) {
        return this.retry(() => new Promise((resolve, reject) => {
            node.put(data, (ack) => {
                if (ack.err)
                    reject(new Error(ack.err));
                else
                    resolve(data);
            }, options);
        }), "data save operation");
    }
    /**
     * Read data with retry logic
     */
    async readWithRetry(node) {
        return this.retry(() => new Promise((resolve) => {
            node.once((data) => resolve(data));
        }), "data read operation");
    }
    /**
     * Save data to user node with improved error handling
     */
    async saveUserData(path, data) {
        try {
            if (!this.gun.user()?.is?.pub) {
                throw new Error("User not authenticated");
            }
            const options = this.certificato
                ? { opt: { cert: this.certificato } }
                : undefined;
            return await this.saveWithRetry(this.gun.user().get(path), data, options);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.GUN, "SAVE_USER_DATA_ERROR", `Error saving data to path ${path}`, error);
            throw error;
        }
    }
    /**
     * Retrieve data from user node with improved error handling
     */
    async getUserData(path) {
        try {
            if (!this.gun.user()?.is?.pub) {
                throw new Error("User not authenticated");
            }
            const data = await this.readWithRetry(this.gun.user().get(path));
            if (!data) {
                (0, logger_1.log)(`No data found at ${path}`);
                return null;
            }
            (0, logger_1.log)(`Data retrieved from ${path}`);
            return data;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.GUN, "GET_USER_DATA_ERROR", `Error retrieving data from path ${path}`, error);
            throw error;
        }
    }
    /**
     * Save data to public node
     */
    async savePublicData(node, key, data) {
        return new Promise((resolve, reject) => {
            const options = this.certificato
                ? { opt: { cert: this.certificato } }
                : undefined;
            this.gun
                .get(node)
                .get(key)
                .put(data, (ack) => {
                if (ack && ack.err) {
                    (0, logger_1.logError)(`Error saving public data: ${ack.err}`);
                    reject(new Error(ack.err));
                }
                else {
                    (0, logger_1.log)(`Public data saved to ${node}/${key}`);
                    resolve(data);
                }
            }, options);
        });
    }
    /**
     * Retrieve data from public node
     */
    async getPublicData(node, key) {
        return new Promise((resolve) => {
            this.gun
                .get(node)
                .get(key)
                .once((data) => {
                if (!data) {
                    (0, logger_1.log)(`No public data found at ${node}/${key}`);
                    resolve(null);
                }
                else {
                    (0, logger_1.log)(`Public data retrieved from ${node}/${key}`);
                    resolve(data);
                }
            });
        });
    }
    /**
     * Generate new SEA key pair
     */
    async generateKeyPair() {
        // Use SEA.pair() directly instead of this.auth.generatePair()
        return gun_1.default.SEA.pair();
    }
}
exports.GunDB = GunDB;
if (typeof window !== "undefined") {
    window.GunDB = GunDB;
}
else if (typeof global !== "undefined") {
    global.GunDB = GunDB;
}
