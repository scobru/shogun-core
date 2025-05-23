/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */

import Gun, { GunOptions } from "gun";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunInstance } from "./types";
import * as GunErrors from "./errors";
import { GunRxJS } from "./rxjs-integration";
import * as crypto from "./crypto";
import * as utils from "./utils";
import GunPlus from "./gun_plus_instance";

class GunDB {
  public gunPlus: GunPlus;
  public crypto: typeof crypto;
  public utils: typeof utils;

  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private _authenticating: boolean = false;
  private readonly authToken?: string | null;

  // For backward compatibility
  public get gun(): GunInstance<any> {
    return this.gunPlus.gun;
  }

  // Integrated modules
  private _rxjs?: GunRxJS;

  constructor(appScopeOrGun: string | GunInstance<any>, optionsOrAuthToken?: GunOptions | string, authTokenParam?: string) {
    log("Initializing GunDB");

    // Handle different constructor signature formats for backward compatibility
    let app_scope: string = "";
    let options: GunOptions = {};
    let authToken: string | undefined;

    if (typeof appScopeOrGun === "string") {
      // New signature: (app_scope: string, options: GunOptions, authToken?: string)
      app_scope = appScopeOrGun;
      options = optionsOrAuthToken as GunOptions || {};
      authToken = authTokenParam;
    } else {
      // Old signature: (gun: GunInstance<any>, authToken?: string)
      // In this case, we're reusing an existing Gun instance
      options = { gun: appScopeOrGun };
      authToken = optionsOrAuthToken as string;
    }

    this.authToken = authToken;
    this.gunPlus = new GunPlus({ Gun, SEA: Gun.SEA }, app_scope, options);

    this.restrictPut(this.gunPlus.gun, authToken || "");
    this.subscribeToAuthEvents();

    // bind crypto and utils
    this.crypto = crypto;
    this.utils = utils;
  }

  private subscribeToAuthEvents() {
    this.gunPlus.gun.on("auth", (ack: any) => {
      log("Auth event received:", ack);

      if (ack.err) {
        ErrorHandler.handle(
          ErrorType.GUN,
          "AUTH_EVENT_ERROR",
          ack.err,
          new Error(ack.err),
        );
      } else {
        this.notifyAuthListeners(ack.sea?.pub || "");
      }
    });
  }

  private notifyAuthListeners(pub: string): void {
    const user = this.gunPlus.user;
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  public restrictPut(gun: GunInstance<any>, authToken: string) {
    if (!authToken) {
      logError("No auth token provided");
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
  addPeer(peer: string): void {
    this.gunPlus.gun.opt({ peers: [peer] });
    log(`Added new peer: ${peer}`);
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: (user: any) => void): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.gunPlus.gun.user();

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
  getGun(): GunInstance<any> {
    return this.gunPlus.gun;
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): any {
    return this.gunPlus.user;
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Gun node
   */
  get(path: string): any {
    return this.gunPlus.gun.get(path);
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gunPlus.gun.get(path).put(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
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
      this.gunPlus.gun.get(path).set(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
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
      this.gunPlus.gun.get(path).put(null, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
        );
      });
    });
  }

  /**
   * Signs up a new user using AuthManager
   * @param username Username
   * @param password Password
   * @returns Promise resolving to signup result
   */
  async signUp(username: string, password: string): Promise<any> {
    log("Attempting user registration:", username);

    if (this.isAuthenticating()) {
      const err = "Authentication already in progress";
      log(err);
      return { success: false, error: err };
    }

    this._setAuthenticating(true);

    try {
      // Validate and scope the credentials
      const validated = await this.gunPlus.user.validate(username, password);

      // Use AuthManager's create method directly
      const createResult = await this.gunPlus.user.create(validated);

      if ('err' in createResult) {
        this._setAuthenticating(false);
        return { success: false, error: createResult.err };
      }

      // Add user to users list
      this.gunPlus.gun.get(createResult.pub).put({
        username: username,
      });
      this.gunPlus.gun.get("users").set(this.gunPlus.gun.get(createResult.pub));

      // Log in after registration
      log(`Attempting login after registration for: ${username}`);
      const loginResult = await this.login(username, password);
      this._setAuthenticating(false);

      if (!loginResult.success) {
        logError(`Login after registration failed: ${loginResult.error}`);
        return {
          success: false,
          error: `Registration completed but login failed: ${loginResult.error}`,
        };
      }

      log(`Login after registration successful for: ${username}`);
      return loginResult;
    } catch (error) {
      this._setAuthenticating(false);
      logError(`Unexpected error during registration flow: ${error}`);
      return {
        success: false,
        error: `Unexpected error during registration: ${error}`,
      };
    }
  }

  /**
   * Logs in a user using AuthManager
   * @param username Username
   * @param password Password
   * @param callback Optional callback for login result
   * @returns Promise resolving to login result
   */
  async login(
    username: string,
    password: string,
    callback?: (result: any) => void,
  ): Promise<any> {
    if (this.isAuthenticating()) {
      const err = "Authentication already in progress";
      log(err);
      return { success: false, error: err };
    }

    this._setAuthenticating(true);
    log(`Attempting login for user: ${username}`);

    try {
      // Clean up previous session
      if (this.gunPlus.user) {
        this.gunPlus.user.leave();
        log(`Previous session cleaned for: ${username}`);
      }

      // Validate and scope the credentials
      const validated = await this.gunPlus.user.validate(username, password);

      // Use AuthManager's auth method directly
      const authResult = await this.gunPlus.user.auth(validated);
      this._setAuthenticating(false);

      if ('err' in authResult) {
        logError(`Login error for ${username}: ${authResult.err}`);
        return { success: false, error: authResult.err };
      }

      // Get user from public key
      const userPub = this.gunPlus.user.pair({ strict: true }).pub;

      // Check if user exists in users list, add if not
      const user = this.gunPlus.gun.get("users").map((user) => {
        if (user.pub === userPub) {
          return user;
        }
      });

      if (!user) {
        const newUser = this.gunPlus.gun.get(userPub).put({
          username: username,
        });
        this.gunPlus.gun.get("users").set(newUser);
      }

      log(`Login successful for: ${username} (${userPub})`);
      this._savePair();

      if (callback) {
        callback({ success: true, userPub, username });
      }

      return {
        success: true,
        userPub,
        username,
      };
    } catch (error) {
      this._setAuthenticating(false);
      logError(`Error during login: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  private _savePair(): void {
    try {
      const pair = this.gunPlus.user.pair();
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
   * Logs out the current user using AuthManager
   */
  logout(): void {
    try {
      this.gunPlus.user.leave();
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
    return !!this.gunPlus.user.pair();
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): any {
    const pair = this.gunPlus.user.pair();
    return pair ? { pub: pair.pub, user: this.gunPlus.user } : null;
  }

  /**
   * Accesses the RxJS module for reactive programming
   * @returns GunRxJS instance
   */
  rx(): GunRxJS {
    if (!this._rxjs) {
      this._rxjs = new GunRxJS(this.gunPlus.gun);
    }
    return this._rxjs;
  }

  /**
   * Creates a readable stream from a Gun path or chain
   * @param path Path to stream data from, or a Gun chain
   * @returns ReadableStream that emits changes from the specified path
   */
  stream(path: string | any): ReadableStream<any> {
    const { on_stream } = require("./models/streams");
    
    // If a string path is provided, convert it to a Gun chain
    const chain = typeof path === "string" 
      ? this.gunPlus.gun.get(path) 
      : path;
      
    return on_stream(chain);
  }

  /**
   * Creates a GunNode for the specified path
   * @param path Path to create a node for
   * @returns GunNode instance for the specified path
   */
  node(path: string): any {
    const GunNode = require("./models/gun-node").default;
    return new GunNode(this.gunPlus.gun.get(path));
  }

  /**
   * Creates a certificate that allows other users to write to specific parts of the user's graph
   * @param grantees Array of public keys to grant access to
   * @param policies Array of policies that define what paths/keys can be written to
   * @returns Promise resolving to the certificate string
   * @example
   * // Allow anyone to write to paths containing their public key
   * const cert = await gundb.certify([{pub: "*"}], [gundb.policies.contains_pub]);
   */
  async certify(grantees: {pub: string}[] = [{pub: "*"}], policies: any[] = []): Promise<string> {
    // Get the policies and make_certificate function from the cert module
    const { policies: policyPresets, make_certificate } = require("./models/auth/cert");
    
    // Default to the contains_pub policy if none provided
    const policiesToUse = policies.length > 0 ? policies : [policyPresets.contains_pub];
    
    // Get the current user's key pair
    const pair = this.gunPlus.user.pair({ strict: true });
    
    // Create and return the certificate
    return make_certificate(grantees, policiesToUse, pair);
  }

  /**
   * Access to predefined certificate policies
   */
  get policies() {
    return require("./models/auth/cert").policies;
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
    securityAnswers: string[],
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
        error,
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
    securityAnswers: string[],
  ): Promise<{ success: boolean; hint?: string; error?: string }> {
    log("Tentativo di recupero password per:", username);

    try {
      // Verifica che l'utente esista
      const user = this.gunPlus.gun.user().recall({ sessionStorage: true });
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
      const hint = await this.decrypt(
        securityData.hint,
        await this.hashText(securityAnswers.join("|")),
      );

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

  /**
   * Saves user data at the specified path
   * @param path Path to save the data
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async saveUserData(path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.gunPlus.gun.user();
      if (!user.is) {
        reject(new Error("User not authenticated"));
        return;
      }

      user.get(path).put(data, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
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
  async getUserData(path: string): Promise<any> {
    return new Promise((resolve) => {
      const user = this.gunPlus.gun.user();
      if (!user.is) {
        resolve(null);
        return;
      }

      user.get(path).once((data: any) => {
        resolve(data);
      });
    });
  }

  /**
   * Hashes text with crypto module
   * @param text Text to hash
   * @returns Promise that resolves with the hashed text
   */
  async hashText(text: string): Promise<string | any> {
    return this.crypto.hashText(text);
  }

  /**
   * Encrypts data using SEA
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Promise that resolves with the encrypted data
   */
  async encrypt(data: any, key: string): Promise<string> {
    return this.crypto.encrypt(data, key);
  }

  /**
   * Decrypts data using SEA
   * @param encryptedData Encrypted data
   * @param key Decryption key
   * @returns Promise that resolves with the decrypted data
   */
  async decrypt(encryptedData: string, key: string): Promise<string | any> {

    return this.crypto.decrypt(encryptedData, key);
  }

  // Errors
  static Errors = GunErrors;
}

export { GunDB };
