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
require("gun/sea");
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const collections_1 = require("./collections");
const consensus_1 = require("./consensus");
const GunErrors = __importStar(require("./errors"));
const encryption_1 = require("./encryption");
const certificates_1 = require("./certificates");
const rxjs_integration_1 = require("./rxjs-integration");
class GunDB {
    gun;
    user = null;
    onAuthCallbacks = [];
    retryConfig;
    _authenticating = false;
    authToken;
    // Integrated modules
    _collections;
    _consensus;
    _rxjs;
    constructor(options = {}) {
        (0, logger_1.log)("Initializing GunDB");
        this.retryConfig = {
            attempts: options.retryAttempts ?? 3,
            delay: options.retryDelay ?? 1000,
        };
        const config = {
            peers: options.peers,
            localStorage: options.localStorage ?? false,
            radisk: options.radisk ?? false,
            multicast: options.multicast ?? false,
            axe: options.axe ?? false,
        };
        this.authToken = options.authToken;
        if (this.authToken) {
            const preview = `${this.authToken.substring(0, 3)}...${this.authToken.slice(-3)}`;
            (0, logger_1.log)(`Auth token received (${preview})`);
        }
        else {
            (0, logger_1.log)("No auth token received");
        }
        this.gun = new gun_1.default(config);
        this.user = this.gun.user().recall({ sessionStorage: true });
        if (this.authToken) {
            gun_1.default.on("opt", (ctx) => {
                if (ctx.once)
                    return;
                ctx.on("out", (msg) => {
                    msg.headers = { token: this.authToken };
                    ctx.to.next(msg);
                });
            });
            (0, logger_1.log)("Auth token handler configured for outgoing messages");
        }
        this.subscribeToAuthEvents();
    }
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
                    await new Promise((r) => setTimeout(r, delay));
                }
            }
        }
        throw lastError;
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
    /**
     * Creates a new GunDB instance with specified peers
     * @param peers Array of peer URLs to connect to
     * @returns New GunDB instance
     */
    static withPeers(peers = config_1.default.PEERS) {
        return new GunDB({ peers });
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
     * Unsets a node at the specified path
     * @param path Path to unset
     * @param node Node to unset
     * @returns Promise resolving to operation result
     */
    async unset(path, node) {
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
    async save(node, data) {
        return this.retry(() => new Promise((resolve, reject) => {
            node.put(data, (ack) => ack.err ? reject(new Error(ack.err)) : resolve(data));
        }), "data save operation");
    }
    async read(node) {
        return this.retry(() => new Promise((resolve) => {
            node.once((data) => resolve(data));
        }), "data read operation");
    }
    /**
     * Saves data to user's space
     * @param path Path in user space
     * @param data Data to save
     * @returns Promise resolving to saved data
     */
    async saveUserData(path, data) {
        if (!this.isLoggedIn())
            throw new Error("User not authenticated");
        return this.save(this.gun.user().get(path), data);
    }
    /**
     * Gets data from user's space
     * @param path Path in user space
     * @returns Promise resolving to retrieved data
     */
    async getUserData(path) {
        if (!this.isLoggedIn())
            throw new Error("User not authenticated");
        const data = await this.read(this.gun.user().get(path));
        return data || null;
    }
    /**
     * Saves data to public space
     * @param node Node name
     * @param key Key to store at
     * @param data Data to save
     * @returns Promise resolving to saved data
     */
    async savePublicData(node, key, data) {
        return new Promise((resolve, reject) => {
            this.gun
                .get(node)
                .get(key)
                .put(data, (ack) => {
                ack && ack.err ? reject(new Error(ack.err)) : resolve(data);
            });
        });
    }
    /**
     * Gets data from public space
     * @param node Node name
     * @param key Key to retrieve
     * @returns Promise resolving to retrieved data
     */
    async getPublicData(node, key) {
        return new Promise((resolve) => {
            this.gun
                .get(node)
                .get(key)
                .once((data) => resolve(data || null));
        });
    }
    /**
     * Aggiunge dati allo spazio Frozen
     * Frozen Space contiene dati che possono essere solo aggiunti, non modificati o rimossi.
     * Utilizza un pattern specifico con ::: per indicare dati immutabili.
     * @param node Node name
     * @param key Key to store at
     * @param data Data to save
     * @returns Promise resolving to operation result
     */
    async addToFrozenSpace(node, key, data) {
        (0, logger_1.log)(`Aggiunta dati in Frozen Space: ${node}/${key}`);
        return new Promise((resolve, reject) => {
            // Utilizziamo il pattern ::: per indicare che il dato è immutabile
            this.gun
                .get(`${node}:::`)
                .get(key)
                .put(data, (ack) => {
                if (ack && ack.err) {
                    (0, logger_1.logError)(`Errore durante l'aggiunta a Frozen Space: ${ack.err}`);
                    reject(new Error(ack.err));
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * Aggiunge dati allo spazio Frozen utilizzando l'hash del contenuto come chiave
     * Combina content addressing e immutabilità per massima integrità dei dati
     * @param node Nome del nodo
     * @param data Dati da salvare
     * @returns Promise che risolve con l'hash generato
     */
    async addHashedToFrozenSpace(node, data) {
        (0, logger_1.log)(`Aggiunta dati con hash in Frozen Space: ${node}`);
        try {
            // Calcola l'hash del contenuto
            const { hash } = await this.hashObj(typeof data === "object" ? data : { value: data });
            // Salva i dati utilizzando l'hash come chiave nello spazio immutabile
            await this.addToFrozenSpace(node, hash, data);
            (0, logger_1.log)(`Dati salvati con hash: ${hash}`);
            return hash;
        }
        catch (error) {
            (0, logger_1.logError)(`Errore durante l'aggiunta dati con hash a Frozen Space:`, error);
            throw error;
        }
    }
    /**
     * Recupera dati hash-addressable dallo spazio Frozen
     * @param node Nome del nodo
     * @param hash Hash del contenuto
     * @param verifyIntegrity Se true, verifica che l'hash corrisponda ai dati recuperati
     * @returns Promise che risolve con i dati recuperati
     */
    async getHashedFrozenData(node, hash, verifyIntegrity = false) {
        (0, logger_1.log)(`Recupero dati con hash da Frozen Space: ${node}/${hash}`);
        const data = await this.getFrozenData(node, hash);
        if (verifyIntegrity && data) {
            // Verifica l'integrità ricalcolando l'hash dei dati
            const { hash: calculatedHash } = await this.hashObj(typeof data === "object" ? data : { value: data });
            if (calculatedHash !== hash) {
                (0, logger_1.logError)(`Errore di integrità: l'hash calcolato (${calculatedHash}) non corrisponde all'hash fornito (${hash})`);
                throw new Error("Integrità dei dati compromessa");
            }
            (0, logger_1.log)(`Integrità dei dati verificata`);
        }
        return data;
    }
    /**
     * Ottiene dati dallo spazio Frozen
     * @param node Node name
     * @param key Key to retrieve
     * @returns Promise resolving to retrieved data
     */
    async getFrozenData(node, key) {
        (0, logger_1.log)(`Recupero dati da Frozen Space: ${node}/${key}`);
        return new Promise((resolve) => {
            this.gun
                .get(`${node}:::`)
                .get(key)
                .once((data) => resolve(data || null));
        });
    }
    /**
     * Genera un nuovo set di coppie di chiavi
     * @returns Promise resolving to generated key pair
     */
    async generateKeyPair() {
        return (0, encryption_1.generateKeyPair)();
    }
    /**
     * Accesses the Collections module for collection management
     * @returns GunCollections instance
     */
    collections() {
        if (!this._collections) {
            this._collections = new collections_1.GunCollections(this);
        }
        return this._collections;
    }
    /**
     * Accesses the Consensus module for distributed consensus
     * @param config Optional consensus configuration
     * @returns GunConsensus instance
     */
    consensus(config) {
        if (!this._consensus) {
            this._consensus = new consensus_1.GunConsensus(this, config);
        }
        return this._consensus;
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
     * Creates a typed repository
     * @param collection Collection name
     * @param repository Repository constructor
     * @param options Repository options
     * @returns Typed repository instance
     */
    repository(collection, repository, options) {
        return new repository(this, collection, options);
    }
    /**
     * Encrypts a value
     * @param value Value to encrypt
     * @param epriv Private key
     * @returns Promise resolving to encrypted value
     */
    async encrypt(value, epriv) {
        return (0, encryption_1.encrypt)(value, epriv);
    }
    /**
     * Decrypts a value
     * @param value Value to decrypt
     * @param epriv Private key
     * @returns Promise resolving to decrypted value
     */
    async decrypt(value, epriv) {
        return (0, encryption_1.decrypt)(value, epriv);
    }
    /**
     * Signs data
     * @param data Data to sign
     * @param pair Key pair
     * @returns Promise resolving to signed data
     */
    async sign(data, pair) {
        return (0, encryption_1.sign)(data, pair);
    }
    /**
     * Verifies signed data
     * @param signed Signed data
     * @param pub Public key
     * @returns Promise resolving to verified data
     */
    async verify(signed, pub) {
        return (0, encryption_1.verify)(signed, pub);
    }
    /**
     * Clears the encryption cache
     */
    clearCryptoCache() {
        (0, encryption_1.clearCache)();
    }
    /**
     * Checks if a string is a hash
     * @param str String to check
     * @returns True if valid hash
     */
    isHash(str) {
        return (0, encryption_1.isHash)(str);
    }
    /**
     * Encrypts data between sender and receiver
     * @param data Data to encrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to encrypted data
     */
    async encFor(data, sender, receiver) {
        return (0, encryption_1.encFor)(data, sender, receiver);
    }
    /**
     * Decrypts data between sender and receiver
     * @param data Data to decrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to decrypted data
     */
    async decFrom(data, sender, receiver) {
        return (0, encryption_1.decFrom)(data, sender, receiver);
    }
    /**
     * Generates a hash for text
     * @param text Text to hash
     * @returns Promise resolving to generated hash
     */
    async hashText(text) {
        const result = await (0, encryption_1.hashText)(text);
        return result || "";
    }
    /**
     * Generates a hash for an object
     * @param obj Object to hash
     * @returns Promise resolving to hash and serialized object
     */
    async hashObj(obj) {
        return (0, encryption_1.hashObj)(obj);
    }
    /**
     * Generates a short hash
     * @param text Text to hash
     * @param salt Optional salt
     * @returns Promise resolving to short hash
     */
    async getShortHash(text, salt) {
        const result = await (0, encryption_1.getShortHash)(text, salt);
        return result || "";
    }
    /**
     * Converts a hash to URL-safe format
     * @param unsafe Hash to convert
     * @returns Safe hash
     */
    safeHash(unsafe) {
        return (0, encryption_1.safeHash)(unsafe);
    }
    /**
     * Converts a safe hash back to original format
     * @param safe Safe hash
     * @returns Original hash
     */
    unsafeHash(safe) {
        return (0, encryption_1.unsafeHash)(safe);
    }
    /**
     * Safely parses JSON
     * @param input Input to parse
     * @param def Default value
     * @returns Parsed object
     */
    safeJSONParse(input, def = {}) {
        return (0, encryption_1.safeJSONParse)(input, def);
    }
    /**
     * Issues a certificate
     * @param options Certificate options
     * @returns Promise resolving to generated certificate
     */
    async issueCert(options) {
        return (0, certificates_1.issueCert)(options);
    }
    /**
     * Generates multiple certificates
     * @param options Generation options
     * @returns Promise resolving to generated certificates
     */
    async generateCerts(options) {
        return (0, certificates_1.generateCerts)(options);
    }
    /**
     * Verifies a certificate
     * @param cert Certificate to verify
     * @param pub Public key
     * @returns Promise resolving to verification result
     */
    async verifyCert(cert, pub) {
        return (0, certificates_1.verifyCert)(cert, pub);
    }
    /**
     * Extracts policy from a certificate
     * @param cert Certificate
     * @returns Promise resolving to extracted policy
     */
    async extractCertPolicy(cert) {
        return (0, certificates_1.extractCertPolicy)(cert);
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
            // Genera una prova di lavoro dalle risposte alle domande di sicurezza
            const proofOfWork = await this.hashText(securityAnswers.join("|"));
            // Decripta il suggerimento della password con la prova di lavoro
            const hint = await this.decrypt(securityData.hint, proofOfWork);
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
    // Errors
    static Errors = GunErrors;
}
exports.GunDB = GunDB;
