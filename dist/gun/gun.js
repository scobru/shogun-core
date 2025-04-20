/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */
import Gun from "gun";
import "gun/sea";
import CONFIG from "../config";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunCollections } from "./collections";
import { GunConsensus } from "./consensus";
import * as GunErrors from "./errors";
import { encrypt, decrypt, sign, verify, generateKeyPair as genKeyPair, clearCache, isHash, encFor, decFrom, hashText, hashObj, getShortHash, safeHash, unsafeHash, safeJSONParse, } from "./encryption";
import { issueCert, generateCerts, verifyCert, extractCertPolicy, } from "./certificates";
import { GunRxJS } from "./rxjs-integration";
class GunDB {
    constructor(options = {}) {
        this.user = null;
        this.onAuthCallbacks = [];
        this._authenticating = false;
        log("Initializing GunDB");
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
            log(`Auth token received (${preview})`);
        }
        else {
            log("No auth token received");
        }
        this.gun = new Gun(config);
        this.user = this.gun.user().recall({ sessionStorage: true });
        if (this.authToken) {
            Gun.on("opt", (ctx) => {
                if (ctx.once)
                    return;
                ctx.on("out", (msg) => {
                    msg.headers = { token: this.authToken };
                    ctx.to.next(msg);
                });
            });
            log("Auth token handler configured for outgoing messages");
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
                    log(`Retry attempt ${i + 1} for ${context} in ${delay}ms`);
                    await new Promise((r) => setTimeout(r, delay));
                }
            }
        }
        throw lastError;
    }
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            log("Auth event received:", ack);
            if (ack.err) {
                ErrorHandler.handle(ErrorType.GUN, "AUTH_EVENT_ERROR", ack.err, new Error(ack.err));
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
    static withPeers(peers = CONFIG.PEERS) {
        return new GunDB({ peers });
    }
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer) {
        this.gun.opt({ peers: [peer] });
        log(`Added new peer: ${peer}`);
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
        log("Attempting user registration:", username);
        return new Promise((resolve) => {
            this.gun.user().create(username, password, async (ack) => {
                if (ack.err) {
                    logError(`Registration error: ${ack.err}`);
                    resolve({ success: false, error: ack.err });
                }
                else {
                    const loginResult = await this.login(username, password);
                    resolve(loginResult);
                }
            });
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
            log(err);
            return { success: false, error: err };
        }
        this._setAuthenticating(true);
        log(`Attempting login for user: ${username}`);
        return new Promise((resolve) => {
            try {
                this.gun.user().leave();
            }
            catch { }
            const timeout = setTimeout(() => {
                this._setAuthenticating(false);
                resolve({ success: false, error: "Login timeout" });
            }, 3000);
            this.gun.user().auth(username, password, (ack) => {
                clearTimeout(timeout);
                this._setAuthenticating(false);
                if (ack.err) {
                    log(`Login error: ${ack.err}`);
                    resolve({ success: false, error: ack.err });
                }
                else {
                    this._savePair();
                    resolve({
                        success: true,
                        userPub: this.gun.user().is?.pub,
                        username,
                    });
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
            log("Logout completed");
        }
        catch (error) {
            logError("Error during logout:", error);
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
        log(`Aggiunta dati in Frozen Space: ${node}/${key}`);
        return new Promise((resolve, reject) => {
            // Utilizziamo il pattern ::: per indicare che il dato è immutabile
            this.gun
                .get(`${node}:::`)
                .get(key)
                .put(data, (ack) => {
                if (ack && ack.err) {
                    logError(`Errore durante l'aggiunta a Frozen Space: ${ack.err}`);
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
        log(`Aggiunta dati con hash in Frozen Space: ${node}`);
        try {
            // Calcola l'hash del contenuto
            const { hash } = await this.hashObj(typeof data === "object" ? data : { value: data });
            // Salva i dati utilizzando l'hash come chiave nello spazio immutabile
            await this.addToFrozenSpace(node, hash, data);
            log(`Dati salvati con hash: ${hash}`);
            return hash;
        }
        catch (error) {
            logError(`Errore durante l'aggiunta dati con hash a Frozen Space:`, error);
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
        log(`Recupero dati con hash da Frozen Space: ${node}/${hash}`);
        const data = await this.getFrozenData(node, hash);
        if (verifyIntegrity && data) {
            // Verifica l'integrità ricalcolando l'hash dei dati
            const { hash: calculatedHash } = await this.hashObj(typeof data === "object" ? data : { value: data });
            if (calculatedHash !== hash) {
                logError(`Errore di integrità: l'hash calcolato (${calculatedHash}) non corrisponde all'hash fornito (${hash})`);
                throw new Error("Integrità dei dati compromessa");
            }
            log(`Integrità dei dati verificata`);
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
        log(`Recupero dati da Frozen Space: ${node}/${key}`);
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
        return genKeyPair();
    }
    /**
     * Accesses the Collections module for collection management
     * @returns GunCollections instance
     */
    collections() {
        if (!this._collections) {
            this._collections = new GunCollections(this);
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
            this._consensus = new GunConsensus(this, config);
        }
        return this._consensus;
    }
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx() {
        if (!this._rxjs) {
            this._rxjs = new GunRxJS(this.gun);
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
        return encrypt(value, epriv);
    }
    /**
     * Decrypts a value
     * @param value Value to decrypt
     * @param epriv Private key
     * @returns Promise resolving to decrypted value
     */
    async decrypt(value, epriv) {
        return decrypt(value, epriv);
    }
    /**
     * Signs data
     * @param data Data to sign
     * @param pair Key pair
     * @returns Promise resolving to signed data
     */
    async sign(data, pair) {
        return sign(data, pair);
    }
    /**
     * Verifies signed data
     * @param signed Signed data
     * @param pub Public key
     * @returns Promise resolving to verified data
     */
    async verify(signed, pub) {
        return verify(signed, pub);
    }
    /**
     * Clears the encryption cache
     */
    clearCryptoCache() {
        clearCache();
    }
    /**
     * Checks if a string is a hash
     * @param str String to check
     * @returns True if valid hash
     */
    isHash(str) {
        return isHash(str);
    }
    /**
     * Encrypts data between sender and receiver
     * @param data Data to encrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to encrypted data
     */
    async encFor(data, sender, receiver) {
        return encFor(data, sender, receiver);
    }
    /**
     * Decrypts data between sender and receiver
     * @param data Data to decrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to decrypted data
     */
    async decFrom(data, sender, receiver) {
        return decFrom(data, sender, receiver);
    }
    /**
     * Generates a hash for text
     * @param text Text to hash
     * @returns Promise resolving to generated hash
     */
    async hashText(text) {
        const result = await hashText(text);
        return result || "";
    }
    /**
     * Generates a hash for an object
     * @param obj Object to hash
     * @returns Promise resolving to hash and serialized object
     */
    async hashObj(obj) {
        return hashObj(obj);
    }
    /**
     * Generates a short hash
     * @param text Text to hash
     * @param salt Optional salt
     * @returns Promise resolving to short hash
     */
    async getShortHash(text, salt) {
        const result = await getShortHash(text, salt);
        return result || "";
    }
    /**
     * Converts a hash to URL-safe format
     * @param unsafe Hash to convert
     * @returns Safe hash
     */
    safeHash(unsafe) {
        return safeHash(unsafe);
    }
    /**
     * Converts a safe hash back to original format
     * @param safe Safe hash
     * @returns Original hash
     */
    unsafeHash(safe) {
        return unsafeHash(safe);
    }
    /**
     * Safely parses JSON
     * @param input Input to parse
     * @param def Default value
     * @returns Parsed object
     */
    safeJSONParse(input, def = {}) {
        return safeJSONParse(input, def);
    }
    /**
     * Issues a certificate
     * @param options Certificate options
     * @returns Promise resolving to generated certificate
     */
    async issueCert(options) {
        return issueCert(options);
    }
    /**
     * Generates multiple certificates
     * @param options Generation options
     * @returns Promise resolving to generated certificates
     */
    async generateCerts(options) {
        return generateCerts(options);
    }
    /**
     * Verifies a certificate
     * @param cert Certificate to verify
     * @param pub Public key
     * @returns Promise resolving to verification result
     */
    async verifyCert(cert, pub) {
        return verifyCert(cert, pub);
    }
    /**
     * Extracts policy from a certificate
     * @param cert Certificate
     * @returns Promise resolving to extracted policy
     */
    async extractCertPolicy(cert) {
        return extractCertPolicy(cert);
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
        log("Impostazione suggerimento password per:", username);
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
            logError("Errore durante l'impostazione del suggerimento password:", error);
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
        log("Tentativo di recupero password per:", username);
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
            logError("Errore durante il recupero del suggerimento password:", error);
            return { success: false, error: String(error) };
        }
    }
}
// Errors
GunDB.Errors = GunErrors;
export { GunDB };
