"use strict";
/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GunDB = void 0;
const gun_1 = __importDefault(require("gun"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const GunErrors = __importStar(require("./errors"));
const rxjs_integration_1 = require("./rxjs-integration");
const crypto = __importStar(require("./crypto"));
const utils = __importStar(require("./utils"));
class GunDB {
    gun;
    user = null;
    crypto;
    utils;
    onAuthCallbacks = [];
    _authenticating = false;
    authToken;
    // Integrated modules
    _rxjs;
    _sea;
    constructor(gun, authToken) {
        (0, logger_1.log)("Initializing GunDB");
        this.authToken = authToken;
        this.gun = gun;
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.restrictPut(this.gun, authToken || "");
        this.subscribeToAuthEvents();
        // bind crypto and utils
        this.crypto = crypto;
        this.utils = utils;
    }
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
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((cb) => cb(user));
    }
    restrictPut(gun, authToken) {
        if (!authToken) {
            (0, logger_1.logError)("No auth token provided");
            return;
        }
        gun.on("out", function (ctx) {
            var to = this.to;
            // Adds headers for put
            ctx.headers = {
                token: authToken,
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${authToken}`,
            };
            to.next(ctx); // pass to next middleware
        });
    }
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer) {
        this.gun.opt({ peers: [peer] });
        (0, logger_1.log)(`Added new peer: ${peer}`);
    }
    /**
     * Registers an authentication callback
     * @param callback Function to call on auth events
     * @returns Function to unsubscribe the callback
     */
    onAuth(callback) {
        this.onAuthCallbacks.push(callback);
        const user = this.gun.user();
        if (user && user.is)
            callback(user);
        return () => {
            const i = this.onAuthCallbacks.indexOf(callback);
            if (i !== -1)
                this.onAuthCallbacks.splice(i, 1);
        };
    }
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun() {
        return this.gun;
    }
    /**
     * Gets the current user instance
     * @returns User instance
     */
    getUser() {
        return this.gun.user();
    }
    /**
     * Gets a node at the specified path
     * @param path Path to the node
     * @returns Gun node
     */
    get(path) {
        return this.gun.get(path);
    }
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async put(path, data) {
        return new Promise((resolve) => {
            this.gun.get(path).put(data, (ack) => {
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
            });
        });
    }
    /**
     * Sets data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async set(path, data) {
        return new Promise((resolve) => {
            this.gun.get(path).set(data, (ack) => {
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
            });
        });
    }
    /**
     * Removes data at the specified path
     * @param path Path to remove
     * @returns Promise resolving to operation result
     */
    async remove(path) {
        return new Promise((resolve) => {
            this.gun.get(path).put(null, (ack) => {
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
            });
        });
    }
    /**
     * Signs up a new user
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    async signUp(username, password) {
        (0, logger_1.log)("Attempting user registration:", username);
        // Implementiamo una versione semplificata con passaggi sequenziali invece di callback nidificati
        return new Promise((resolve) => {
            // Aggiungiamo un timeout di sicurezza per evitare chiamate bloccate
            const timeout = setTimeout(() => {
                (0, logger_1.logError)(`Timeout durante la registrazione per l'utente: ${username}`);
                resolve({ success: false, error: "Registration timeout in GunDB" });
            }, 10000); // Timeout di 10 secondi
            // Funzione per eseguire i passaggi in sequenza
            const executeSignUp = async () => {
                try {
                    // STEP 1: Creiamo l'utente
                    const createResult = await new Promise((resolveCreate) => {
                        (0, logger_1.log)(`Creating user: ${username}`);
                        this.gun.user().create(username, password, (ack) => {
                            if (ack.err) {
                                (0, logger_1.logError)(`User creation error: ${ack.err}`);
                                resolveCreate({ err: ack.err });
                            }
                            else {
                                (0, logger_1.log)(`User created successfully: ${username}`);
                                resolveCreate({ pub: ack.pub });
                            }
                        });
                    });
                    // Se la creazione fallisce, usciamo
                    if (createResult.err) {
                        clearTimeout(timeout);
                        return resolve({ success: false, error: createResult.err });
                    }
                    const user = this.gun.get(createResult.pub).put({
                        username: username,
                    });
                    this.gun.get("users").set(user);
                    // STEP 2: Effettuiamo il login
                    (0, logger_1.log)(`Attempting login after registration for: ${username}`);
                    try {
                        const loginResult = await this.login(username, password);
                        clearTimeout(timeout);
                        if (!loginResult.success) {
                            (0, logger_1.logError)(`Login after registration failed: ${loginResult.error}`);
                            return resolve({
                                success: false,
                                error: `Registration completed but login failed: ${loginResult.error}`,
                            });
                        }
                        (0, logger_1.log)(`Login after registration successful for: ${username}`);
                        return resolve(loginResult);
                    }
                    catch (loginError) {
                        clearTimeout(timeout);
                        (0, logger_1.logError)(`Exception during post-registration login: ${loginError}`);
                        return resolve({
                            success: false,
                            error: "Exception during post-registration login",
                        });
                    }
                }
                catch (error) {
                    clearTimeout(timeout);
                    (0, logger_1.logError)(`Unexpected error during registration flow: ${error}`);
                    return resolve({
                        success: false,
                        error: `Unexpected error during registration: ${error}`,
                    });
                }
            };
            // Avvia il processo di registrazione
            executeSignUp();
        });
    }
    /**
     * Logs in a user
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    async login(username, password, callback) {
        if (this.isAuthenticating()) {
            const err = "Authentication already in progress";
            (0, logger_1.log)(err);
            return { success: false, error: err };
        }
        this._setAuthenticating(true);
        (0, logger_1.log)(`Attempting login for user: ${username}`);
        return new Promise((resolve) => {
            if (this.gun.user()) {
                // Tentativo di logout pulito per evitare conflitti di autenticazione
                this.gun.user().leave();
                (0, logger_1.log)(`Previous session cleaned for: ${username}`);
            }
            // Aumentiamo il timeout a 8 secondi per dare più tempo all'operazione
            const timeout = setTimeout(() => {
                this._setAuthenticating(false);
                (0, logger_1.logError)(`Login timeout for user: ${username}`);
                resolve({ success: false, error: "Login timeout" });
            }, 8000);
            (0, logger_1.log)(`Starting authentication for: ${username}`);
            this.gun.user().auth(username, password, (ack) => {
                clearTimeout(timeout);
                this._setAuthenticating(false);
                if (ack.err) {
                    (0, logger_1.logError)(`Login error for ${username}: ${ack.err}`);
                    resolve({ success: false, error: ack.err });
                }
                else {
                    const userPub = this.gun.user().is?.pub;
                    const user = this.gun.get("users").map((user) => {
                        if (user.pub === userPub) {
                            return user;
                        }
                    });
                    // se non è dentro users, aggiungilo
                    if (!user) {
                        const user = this.gun.get(userPub).put({
                            username: username,
                        });
                        this.gun.get("users").set(user);
                    }
                    if (!user) {
                        (0, logger_1.logError)(`Authentication succeeded but no user.pub available for: ${username}`);
                        resolve({
                            success: false,
                            error: "Authentication inconsistency: user.pub not available",
                        });
                    }
                    else {
                        (0, logger_1.log)(`Login successful for: ${username} (${userPub})`);
                        this._savePair();
                        resolve({
                            success: true,
                            userPub,
                            username,
                        });
                    }
                }
            });
        });
    }
    _savePair() {
        try {
            const pair = this.gun.user()?._?.sea;
            if (pair && typeof localStorage !== "undefined") {
                localStorage.setItem("pair", JSON.stringify(pair));
            }
        }
        catch (error) {
            console.error("Error saving auth pair:", error);
        }
    }
    isAuthenticating() {
        return this._authenticating;
    }
    _setAuthenticating(value) {
        this._authenticating = value;
    }
    /**
     * Logs out the current user
     */
    logout() {
        try {
            this.gun.user().leave();
            (0, logger_1.log)("Logout completed");
        }
        catch (error) {
            (0, logger_1.logError)("Error during logout:", error);
        }
    }
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    isLoggedIn() {
        return !!this.gun.user()?.is?.pub;
    }
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    getCurrentUser() {
        const pub = this.gun.user()?.is?.pub;
        return pub ? { pub, user: this.gun.user() } : null;
    }
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx() {
        if (!this._rxjs) {
            this._rxjs = new rxjs_integration_1.GunRxJS(this.gun);
        }
        return this._rxjs;
    }
    /**
     * Imposta le domande di sicurezza e il suggerimento per la password
     * @param username Nome utente
     * @param password Password corrente
     * @param hint Suggerimento per la password
     * @param securityQuestions Array di domande di sicurezza
     * @param securityAnswers Array di risposte alle domande di sicurezza
     * @returns Promise che risolve con il risultato dell'operazione
     */
    async setPasswordHint(username, password, hint, securityQuestions, securityAnswers) {
        (0, logger_1.log)("Impostazione suggerimento password per:", username);
        // Verifica che l'utente sia autenticato
        const loginResult = await this.login(username, password);
        if (!loginResult.success) {
            return { success: false, error: "Autenticazione fallita" };
        }
        try {
            // Genera una prova di lavoro dalle risposte alle domande di sicurezza
            const proofOfWork = await this.hashText(securityAnswers.join("|"));
            // Cripta il suggerimento della password con la prova di lavoro
            // Il PoW (una stringa) viene usato come chiave di crittografia
            const encryptedHint = await this.encrypt(hint, proofOfWork);
            // Salva le domande di sicurezza e il suggerimento criptato
            await this.saveUserData("security", {
                questions: securityQuestions,
                hint: encryptedHint,
            });
            return { success: true };
        }
        catch (error) {
            (0, logger_1.logError)("Errore durante l'impostazione del suggerimento password:", error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Recupera il suggerimento della password utilizzando le risposte alle domande di sicurezza
     * @param username Nome utente
     * @param securityAnswers Array di risposte alle domande di sicurezza
     * @returns Promise che risolve con il suggerimento della password
     */
    async forgotPassword(username, securityAnswers) {
        (0, logger_1.log)("Tentativo di recupero password per:", username);
        try {
            // Verifica che l'utente esista
            const user = this.gun.user().recall({ sessionStorage: true });
            if (!user || !user.is) {
                return { success: false, error: "Utente non trovato" };
            }
            // Recupera le domande di sicurezza e il suggerimento criptato
            const securityData = await this.getUserData("security");
            if (!securityData || !securityData.hint) {
                return {
                    success: false,
                    error: "Nessun suggerimento password trovato",
                };
            }
            // Decripta il suggerimento della password con la prova di lavoro
            const hint = await this.decrypt(securityData.hint, await this.hashText(securityAnswers.join("|")));
            if (hint === undefined) {
                return {
                    success: false,
                    error: "Risposte alle domande di sicurezza errate",
                };
            }
            return { success: true, hint: hint };
        }
        catch (error) {
            (0, logger_1.logError)("Errore durante il recupero del suggerimento password:", error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Hashes text with Gun.SEA
     * @param text Text to hash
     * @returns Promise that resolves with the hashed text
     */
    async hashText(text) {
        if (!this._sea) {
            this._sea = gun_1.default.SEA;
        }
        return this._sea.work(text, undefined, undefined, { name: "SHA-256" });
    }
    /**
     * Encrypts data with Gun.SEA
     * @param data Data to encrypt
     * @param key Encryption key
     * @returns Promise that resolves with the encrypted data
     */
    async encrypt(data, key) {
        if (!this._sea) {
            this._sea = gun_1.default.SEA;
        }
        return this._sea.encrypt(data, key);
    }
    /**
     * Decrypts data with Gun.SEA
     * @param encryptedData Encrypted data
     * @param key Decryption key
     * @returns Promise that resolves with the decrypted data
     */
    async decrypt(encryptedData, key) {
        if (!this._sea) {
            this._sea = gun_1.default.SEA;
        }
        return this._sea.decrypt(encryptedData, key);
    }
    /**
     * Saves user data at the specified path
     * @param path Path to save the data
     * @param data Data to save
     * @returns Promise that resolves when the data is saved
     */
    async saveUserData(path, data) {
        return new Promise((resolve, reject) => {
            const user = this.gun.user();
            if (!user.is) {
                reject(new Error("User not authenticated"));
                return;
            }
            user.get(path).put(data, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Gets user data from the specified path
     * @param path Path to get the data from
     * @returns Promise that resolves with the data
     */
    async getUserData(path) {
        return new Promise((resolve) => {
            const user = this.gun.user();
            if (!user.is) {
                resolve(null);
                return;
            }
            user.get(path).once((data) => {
                resolve(data);
            });
        });
    }
    // Errors
    static Errors = GunErrors;
}
exports.GunDB = GunDB;
