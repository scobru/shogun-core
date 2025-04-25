/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */

import Gun, { IGunInstance, IGunUserInstance } from "gun";
import CONFIG from "../config";

import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunDBOptions } from "./types";
import { GunCollections } from "./collections";
import { GunConsensus } from "./consensus";
import * as GunErrors from "./errors";
import {
  encrypt,
  decrypt,
  sign,
  verify,
  generateKeyPair as genKeyPair,
  clearCache,
  isHash,
  encFor,
  decFrom,
  hashText,
  hashObj,
  getShortHash,
  safeHash,
  unsafeHash,
  safeJSONParse,
} from "./encryption";
import {
  issueCert,
  generateCerts,
  verifyCert,
  extractCertPolicy,
} from "./certificates";
import { GunRepository } from "./repository";
import { GunRxJS } from "./rxjs-integration";

interface RetryConfig {
  attempts: number;
  delay: number;
}

class GunDB {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private readonly retryConfig: RetryConfig;
  private _authenticating: boolean = false;
  private readonly authToken?: string;

  // Integrated modules
  private _collections?: GunCollections;
  private _consensus?: GunConsensus;
  private _rxjs?: GunRxJS;

  constructor(options: Partial<GunDBOptions> = {}) {
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
    } else {
      log("No auth token received");
    }

    this.gun = new Gun(config);
    this.user = this.gun.user().recall({ sessionStorage: true });

    if (this.authToken) {
      Gun.on("opt", (ctx: any) => {
        if (ctx.once) return;
        ctx.on("out", (msg: any) => {
          msg.headers = { token: this.authToken };
          ctx.to.next(msg);
        });
      });
      log("Auth token handler configured for outgoing messages");
    }

    this.subscribeToAuthEvents();
  }

  private async retry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < this.retryConfig.attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < this.retryConfig.attempts - 1) {
          const delay = this.retryConfig.delay * Math.pow(2, i);
          log(`Retry attempt ${i + 1} for ${context} in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError!;
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
      log("Auth event received:", ack);

      if (ack.err) {
        ErrorHandler.handle(
          ErrorType.GUN,
          "AUTH_EVENT_ERROR",
          ack.err,
          new Error(ack.err)
        );
      } else {
        this.notifyAuthListeners(ack.sea?.pub || "");
      }
    });
  }

  private notifyAuthListeners(pub: string): void {
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Creates a new GunDB instance with specified peers
   * @param peers Array of peer URLs to connect to
   * @returns New GunDB instance
   */
  static withPeers(peers: string[] = CONFIG.PEERS): GunDB {
    return new GunDB({ peers });
  }

  /**
   * Adds a new peer to the network
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
    log(`Added new peer: ${peer}`);
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: (user: any) => void): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.gun.user();
    if (user && user.is) callback(user);
    return () => {
      const i = this.onAuthCallbacks.indexOf(callback);
      if (i !== -1) this.onAuthCallbacks.splice(i, 1);
    };
  }

  /**
   * Gets the Gun instance
   * @returns Gun instance
   */
  getGun(): IGunInstance<any> {
    return this.gun;
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): any {
    return this.gun.user();
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Gun node
   */
  get(path: string): any {
    return this.gun.get(path);
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  /**
   * Sets data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async set(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).set(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(null, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  /**
   * Unsets a node at the specified path
   * @param path Path to unset
   * @param node Node to unset
   * @returns Promise resolving to operation result
   */
  async unset(path: string, node: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(null, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  /**
   * Signs up a new user
   * @param username Username
   * @param password Password
   * @returns Promise resolving to signup result
   */
  async signUp(username: string, password: string): Promise<any> {
    log("Attempting user registration:", username);

    // Implementiamo una versione semplificata con passaggi sequenziali invece di callback nidificati
    return new Promise((resolve) => {
      // Aggiungiamo un timeout di sicurezza per evitare chiamate bloccate
      const timeout = setTimeout(() => {
        logError(`Timeout durante la registrazione per l'utente: ${username}`);
        resolve({ success: false, error: "Registration timeout in GunDB" });
      }, 10000); // Timeout di 10 secondi

      // Funzione per eseguire i passaggi in sequenza
      const executeSignUp = async () => {
        try {
          // STEP 1: Creiamo l'utente
          const createResult = await new Promise<{
            err?: string;
            pub?: string;
          }>((resolveCreate) => {
            log(`Creating user: ${username}`);
            this.gun.user().create(username, password, (ack: any) => {
              if (ack.err) {
                logError(`User creation error: ${ack.err}`);
                resolveCreate({ err: ack.err });
              } else {
                log(`User created successfully: ${username}`);
                resolveCreate({ pub: ack.pub });
              }
            });
          });

          // Se la creazione fallisce, usciamo
          if (createResult.err) {
            clearTimeout(timeout);
            return resolve({ success: false, error: createResult.err });
          }

          const user = this.gun.get(createResult.pub!).put({
            username: username,
          });

          this.gun.get("users").set(user);

          // STEP 2: Effettuiamo il login
          log(`Attempting login after registration for: ${username}`);
          try {
            const loginResult = await this.login(username, password);
            clearTimeout(timeout);

            if (!loginResult.success) {
              logError(`Login after registration failed: ${loginResult.error}`);
              return resolve({
                success: false,
                error: `Registration completed but login failed: ${loginResult.error}`,
              });
            }

            log(`Login after registration successful for: ${username}`);
            return resolve(loginResult);
          } catch (loginError) {
            clearTimeout(timeout);
            logError(`Exception during post-registration login: ${loginError}`);
            return resolve({
              success: false,
              error: "Exception during post-registration login",
            });
          }
        } catch (error) {
          clearTimeout(timeout);
          logError(`Unexpected error during registration flow: ${error}`);
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
  async login(
    username: string,
    password: string,
    callback?: (result: any) => void
  ): Promise<any> {
    if (this.isAuthenticating()) {
      const err = "Authentication already in progress";
      log(err);
      return { success: false, error: err };
    }

    this._setAuthenticating(true);
    log(`Attempting login for user: ${username}`);

    return new Promise((resolve) => {
      if (this.gun.user()) {
        // Tentativo di logout pulito per evitare conflitti di autenticazione
        this.gun.user().leave();
        log(`Previous session cleaned for: ${username}`);
      }

      // Aumentiamo il timeout a 8 secondi per dare più tempo all'operazione
      const timeout = setTimeout(() => {
        this._setAuthenticating(false);
        logError(`Login timeout for user: ${username}`);
        resolve({ success: false, error: "Login timeout" });
      }, 8000);

      log(`Starting authentication for: ${username}`);
      this.gun.user().auth(username, password, (ack: any) => {
        clearTimeout(timeout);
        this._setAuthenticating(false);

        if (ack.err) {
          logError(`Login error for ${username}: ${ack.err}`);
          resolve({ success: false, error: ack.err });
        } else {
          const userPub = this.gun.user().is?.pub;
          const user = this.gun.get("users").map((user) => {
            if (user.pub === userPub) {
              return user;
            }
          });
          // se non è dentro users, aggiungilo
          if (!user) {
            const user = this.gun.get(userPub!).put({
              username: username,
            });
            this.gun.get("users").set(user);
          }

          if (!user) {
            logError(
              `Authentication succeeded but no user.pub available for: ${username}`
            );
            resolve({
              success: false,
              error: "Authentication inconsistency: user.pub not available",
            });
          } else {
            log(`Login successful for: ${username} (${userPub})`);
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

  private _savePair(): void {
    try {
      const pair = (this.gun.user() as any)?._?.sea;
      if (pair && typeof localStorage !== "undefined") {
        localStorage.setItem("pair", JSON.stringify(pair));
      }
    } catch (error) {
      console.error("Error saving auth pair:", error);
    }
  }

  private isAuthenticating(): boolean {
    return this._authenticating;
  }

  private _setAuthenticating(value: boolean): void {
    this._authenticating = value;
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    try {
      this.gun.user().leave();
      log("Logout completed");
    } catch (error) {
      logError("Error during logout:", error);
    }
  }

  /**
   * Checks if a user is currently logged in
   * @returns True if logged in
   */
  isLoggedIn(): boolean {
    return !!this.gun.user()?.is?.pub;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): any {
    const pub = this.gun.user()?.is?.pub;
    return pub ? { pub, user: this.gun.user() } : null;
  }

  private async save(node: any, data: any): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve, reject) => {
          node.put(data, (ack: any) =>
            ack.err ? reject(new Error(ack.err)) : resolve(data)
          );
        }),
      "data save operation"
    );
  }

  private async read(node: any): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve) => {
          node.once((data: any) => resolve(data));
        }),
      "data read operation"
    );
  }

  /**
   * Saves data to user's space
   * @param path Path in user space
   * @param data Data to save
   * @returns Promise resolving to saved data
   */
  async saveUserData(path: string, data: any): Promise<any> {
    if (!this.isLoggedIn()) throw new Error("User not authenticated");
    return this.save(this.gun.user().get(path), data);
  }

  /**
   * Gets data from user's space
   * @param path Path in user space
   * @returns Promise resolving to retrieved data
   */
  async getUserData(path: string): Promise<any> {
    if (!this.isLoggedIn()) throw new Error("User not authenticated");
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
  async savePublicData(node: string, key: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gun
        .get(node)
        .get(key)
        .put(data, (ack: any) => {
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
  async getPublicData(node: string, key: string): Promise<any> {
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
  async addToFrozenSpace(node: string, key: string, data: any): Promise<any> {
    log(`Aggiunta dati in Frozen Space: ${node}/${key}`);
    return new Promise((resolve, reject) => {
      // Utilizziamo il pattern ::: per indicare che il dato è immutabile
      this.gun
        .get(`${node}:::`)
        .get(key)
        .put(data, (ack: any) => {
          if (ack && ack.err) {
            logError(`Errore durante l'aggiunta a Frozen Space: ${ack.err}`);
            reject(new Error(ack.err));
          } else {
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
  async addHashedToFrozenSpace(node: string, data: any): Promise<string> {
    log(`Aggiunta dati con hash in Frozen Space: ${node}`);
    try {
      // Calcola l'hash del contenuto
      const { hash } = await this.hashObj(
        typeof data === "object" ? data : { value: data }
      );

      // Salva i dati utilizzando l'hash come chiave nello spazio immutabile
      await this.addToFrozenSpace(node, hash, data);

      log(`Dati salvati con hash: ${hash}`);
      return hash;
    } catch (error) {
      logError(
        `Errore durante l'aggiunta dati con hash a Frozen Space:`,
        error
      );
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
  async getHashedFrozenData(
    node: string,
    hash: string,
    verifyIntegrity: boolean = false
  ): Promise<any> {
    log(`Recupero dati con hash da Frozen Space: ${node}/${hash}`);
    const data = await this.getFrozenData(node, hash);

    if (verifyIntegrity && data) {
      // Verifica l'integrità ricalcolando l'hash dei dati
      const { hash: calculatedHash } = await this.hashObj(
        typeof data === "object" ? data : { value: data }
      );
      if (calculatedHash !== hash) {
        logError(
          `Errore di integrità: l'hash calcolato (${calculatedHash}) non corrisponde all'hash fornito (${hash})`
        );
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
  async getFrozenData(node: string, key: string): Promise<any> {
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
  async generateKeyPair(): Promise<any> {
    return genKeyPair();
  }

  /**
   * Accesses the Collections module for collection management
   * @returns GunCollections instance
   */
  collections(): GunCollections {
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
  consensus(config?: any): GunConsensus {
    if (!this._consensus) {
      this._consensus = new GunConsensus(this, config);
    }
    return this._consensus;
  }

  /**
   * Accesses the RxJS module for reactive programming
   * @returns GunRxJS instance
   */
  rx(): GunRxJS {
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
  repository<T, R extends GunRepository<T>>(
    collection: string,
    repository: new (gun: GunDB, collection: string, options?: any) => R,
    options?: any
  ): R {
    return new repository(this, collection, options);
  }

  /**
   * Encrypts a value
   * @param value Value to encrypt
   * @param epriv Private key
   * @returns Promise resolving to encrypted value
   */
  async encrypt(value: any, epriv: any): Promise<string> {
    return encrypt(value, epriv);
  }

  /**
   * Decrypts a value
   * @param value Value to decrypt
   * @param epriv Private key
   * @returns Promise resolving to decrypted value
   */
  async decrypt(value: string, epriv: any): Promise<any> {
    return decrypt(value, epriv);
  }

  /**
   * Signs data
   * @param data Data to sign
   * @param pair Key pair
   * @returns Promise resolving to signed data
   */
  async sign(data: any, pair: { priv: string; pub: string }): Promise<string> {
    return sign(data, pair);
  }

  /**
   * Verifies signed data
   * @param signed Signed data
   * @param pub Public key
   * @returns Promise resolving to verified data
   */
  async verify(signed: string, pub: string | { pub: string }): Promise<any> {
    return verify(signed, pub);
  }

  /**
   * Clears the encryption cache
   */
  clearCryptoCache(): void {
    clearCache();
  }

  /**
   * Checks if a string is a hash
   * @param str String to check
   * @returns True if valid hash
   */
  isHash(str: any): boolean {
    return isHash(str);
  }

  /**
   * Encrypts data between sender and receiver
   * @param data Data to encrypt
   * @param sender Sender
   * @param receiver Receiver
   * @returns Promise resolving to encrypted data
   */
  async encFor(data: any, sender: any, receiver: any): Promise<any> {
    return encFor(data, sender, receiver);
  }

  /**
   * Decrypts data between sender and receiver
   * @param data Data to decrypt
   * @param sender Sender
   * @param receiver Receiver
   * @returns Promise resolving to decrypted data
   */
  async decFrom(data: any, sender: any, receiver: any): Promise<any> {
    return decFrom(data, sender, receiver);
  }

  /**
   * Generates a hash for text
   * @param text Text to hash
   * @returns Promise resolving to generated hash
   */
  async hashText(text: string): Promise<string> {
    const result = await hashText(text);
    return result || "";
  }

  /**
   * Generates a hash for an object
   * @param obj Object to hash
   * @returns Promise resolving to hash and serialized object
   */
  async hashObj(obj: any): Promise<any> {
    return hashObj(obj);
  }

  /**
   * Generates a short hash
   * @param text Text to hash
   * @param salt Optional salt
   * @returns Promise resolving to short hash
   */
  async getShortHash(text: string, salt?: string): Promise<string> {
    const result = await getShortHash(text, salt);
    return result || "";
  }

  /**
   * Converts a hash to URL-safe format
   * @param unsafe Hash to convert
   * @returns Safe hash
   */
  safeHash(unsafe: string | undefined): string | undefined {
    return safeHash(unsafe);
  }

  /**
   * Converts a safe hash back to original format
   * @param safe Safe hash
   * @returns Original hash
   */
  unsafeHash(safe: string | undefined): string | undefined {
    return unsafeHash(safe);
  }

  /**
   * Safely parses JSON
   * @param input Input to parse
   * @param def Default value
   * @returns Parsed object
   */
  safeJSONParse(input: any, def = {}): any {
    return safeJSONParse(input, def);
  }

  /**
   * Issues a certificate
   * @param options Certificate options
   * @returns Promise resolving to generated certificate
   */
  async issueCert(options: {
    pair: any;
    tag?: string;
    dot?: string;
    users?: string;
    personal?: boolean;
  }): Promise<string> {
    return issueCert(options);
  }

  /**
   * Generates multiple certificates
   * @param options Generation options
   * @returns Promise resolving to generated certificates
   */
  async generateCerts(options: {
    pair: any;
    list: Array<{
      tag: string;
      dot?: string;
      users?: string;
      personal?: boolean;
    }>;
  }): Promise<Record<string, string>> {
    return generateCerts(options);
  }

  /**
   * Verifies a certificate
   * @param cert Certificate to verify
   * @param pub Public key
   * @returns Promise resolving to verification result
   */
  async verifyCert(cert: string, pub: string | { pub: string }): Promise<any> {
    return verifyCert(cert, pub);
  }

  /**
   * Extracts policy from a certificate
   * @param cert Certificate
   * @returns Promise resolving to extracted policy
   */
  async extractCertPolicy(cert: string): Promise<any> {
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
  async setPasswordHint(
    username: string,
    password: string,
    hint: string,
    securityQuestions: string[],
    securityAnswers: string[]
  ): Promise<{ success: boolean; error?: string }> {
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
    } catch (error) {
      logError(
        "Errore durante l'impostazione del suggerimento password:",
        error
      );
      return { success: false, error: String(error) };
    }
  }

  /**
   * Recupera il suggerimento della password utilizzando le risposte alle domande di sicurezza
   * @param username Nome utente
   * @param securityAnswers Array di risposte alle domande di sicurezza
   * @returns Promise che risolve con il suggerimento della password
   */
  async forgotPassword(
    username: string,
    securityAnswers: string[]
  ): Promise<{ success: boolean; hint?: string; error?: string }> {
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

      return { success: true, hint: hint as string };
    } catch (error) {
      logError("Errore durante il recupero del suggerimento password:", error);
      return { success: false, error: String(error) };
    }
  }

  // Errors
  static Errors = GunErrors;
}

export { GunDB };
