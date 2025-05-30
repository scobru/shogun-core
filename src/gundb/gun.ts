/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */

import { IGunUserInstance, IGunInstance, IGunChain } from "gun";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunRxJS } from "./rxjs-integration";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
import * as utils from "./utils";
import AuthManager from "./models/auth/auth";

class GunDB {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public utils: typeof utils;
  public auth: AuthManager;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
  
  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private _authenticating: boolean = false;

  // Integrated modules
  private _rxjs?: GunRxJS;

  constructor(gun: IGunInstance<any>, appScope: string = "shogun") {
    log("Initializing GunDB");
    this.gun = gun;
    this.user = this.gun.user().recall({ sessionStorage: true });
    this.subscribeToAuthEvents();

    // bind crypto and utils
    this.crypto = crypto;
    this.utils = utils;

    // initialize auth manager
    this.auth = new AuthManager(this, appScope);

    this.node = this.gun.get(appScope);
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
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
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
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
      this.gun.get(path).set(data, (ack: any) => {
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
      this.gun.get(path).put(null, (ack: any) => {
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
    log("Attempting user registration using AuthManager:", username);

    try {
      // Validate credentials with AuthManager
      const validatedCreds = await this.auth.validate(username, password);

      // Create user with AuthManager
      const createResult = await this.auth.create({
        alias: validatedCreds.alias,
        password: validatedCreds.password,
      });

      if ("err" in createResult) {
        logError(`User creation error: ${createResult.err}`);
        return { success: false, error: createResult.err };
      }

      // Store user metadata
      const user = this.gun.get(createResult.pub).put({
        username: username,
      });

      this.gun.get("users").set(user);

      // Login after creation
      log(`Attempting login after registration for: ${username}`);
      try {
        // Login with the same credentials
        const loginResult = await this.login(username, password);

        if (!loginResult.success) {
          logError(`Login after registration failed: ${loginResult.error}`);
          return {
            success: false,
            error: `Registration completed but login failed: ${loginResult.error}`,
          };
        }

        log(`Login after registration successful for: ${username}`);
        return loginResult;
      } catch (loginError) {
        logError(`Exception during post-registration login: ${loginError}`);
        return {
          success: false,
          error: "Exception during post-registration login",
        };
      }
    } catch (error) {
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
    log(`Attempting login with AuthManager for user: ${username}`);

    try {
      // Validate credentials
      const validatedCreds = await this.auth.validate(username, password);

      // Authenticate with AuthManager
      const authResult = await this.auth.auth({
        alias: validatedCreds.alias,
        password: validatedCreds.password,
      });

      this._setAuthenticating(false);

      if ("err" in authResult) {
        logError(`Login error for ${username}: ${authResult.err}`);
        if (callback) callback({ success: false, error: authResult.err });
        return { success: false, error: authResult.err };
      }

      const userPub = this.gun.user().is?.pub;

      // Update users collection if needed
      const user = this.gun.get("users").map((user) => {
        if (user.pub === userPub) {
          return user;
        }
      });

      if (!user) {
        const user = this.gun.get(userPub!).put({
          username: username,
        });
        this.gun.get("users").set(user);
      }

      log(`Login successful for: ${username} (${userPub})`);
      this._savePair();

      const result = {
        success: true,
        userPub,
        username,
      };

      if (callback) callback(result);
      return result;
    } catch (error) {
      this._setAuthenticating(false);
      logError(`Exception during login for ${username}: ${error}`);
      const result = { success: false, error: String(error) };
      if (callback) callback(result);
      return result;
    }
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
   * Logs out the current user using AuthManager
   */
  logout(): void {
    try {
      // Check if the user is actually logged in before attempting to logout
      if (!this.isLoggedIn()) {
        log("No user logged in, skipping logout");
        return;
      }

      // Check if auth state machine is in the correct state for logout
      const currentState = AuthManager.state.getCurrentState();
      if (currentState !== "authorized") {
        log(
          `User in invalid state for logout: ${currentState}, using direct logout instead of AuthManager`,
        );
        // Still perform Gun's direct logout for cleanup
        this.gun.user().leave();
        return;
      }

      // Use AuthManager for logout if state is correct
      this.auth
        .leave()
        .then(() => {
          log("Logout completed via AuthManager");
        })
        .catch((err) => {
          logError("Error during logout via AuthManager:", err);
          // Fallback to direct logout if AuthManager fails
          log("Falling back to direct logout method");
          this.gun.user().leave();
        });
    } catch (error) {
      logError("Error during logout:", error);
      // Last resort fallback
      try {
        this.gun.user().leave();
      } catch (fallbackError) {
        logError("Fallback logout also failed:", fallbackError);
      }
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
   * Sets up security questions and password hint
   * @param username Username
   * @param password Current password
   * @param hint Password hint
   * @param securityQuestions Array of security questions
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the operation result
   */
  async setPasswordHint(
    username: string,
    password: string,
    hint: string,
    securityQuestions: string[],
    securityAnswers: string[],
  ): Promise<{ success: boolean; error?: string }> {
    log("Setting password hint for:", username);

    // Verify that the user is authenticated
    const loginResult = await this.login(username, password);
    if (!loginResult.success) {
      return { success: false, error: "Authentication failed" };
    }

    try {
      // Generate a proof of work from security question answers
      const proofOfWork = (await this.crypto.hashText(
        securityAnswers.join("|"),
      )) as string;

      // Encrypt the password hint with the proof of work
      // The PoW (a string) is used as the encryption key
      const encryptedHint = await this.crypto.encrypt(hint, proofOfWork);

      // Save security questions and encrypted hint
      await this.saveUserData("security", {
        questions: securityQuestions,
        hint: encryptedHint,
      });

      return { success: true };
    } catch (error) {
      logError("Error setting password hint:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Recovers password hint using security question answers
   * @param username Username
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the password hint
   */
  async forgotPassword(
    username: string,
    securityAnswers: string[],
  ): Promise<{ success: boolean; hint?: string; error?: string }> {
    log("Attempting password recovery for:", username);

    try {
      // Verify the user exists
      const user = this.gun.user().recall({ sessionStorage: true });
      if (!user || !user.is) {
        return { success: false, error: "User not found" };
      }

      // Retrieve security questions and encrypted hint
      const securityData = await this.getUserData("security");

      if (!securityData || !securityData.hint) {
        return {
          success: false,
          error: "No password hint found",
        };
      }

      // Decrypt the password hint with the proof of work
      const hint = await this.crypto.decrypt(
        securityData.hint,
        (await this.crypto.hashText(securityAnswers.join("|"))) as string,
      );

      if (hint === undefined) {
        return {
          success: false,
          error: "Incorrect answers to security questions",
        };
      }

      return { success: true, hint: hint as string };
    } catch (error) {
      logError("Error recovering password hint:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Hashes text with Gun.SEA
   * @param text Text to hash
   * @returns Promise that resolves with the hashed text
   */
  async hashText(text: string): Promise<string | any> {
    return this.crypto.hashText(text);
  }

  /**
   * Encrypts data with Gun.SEA
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Promise that resolves with the encrypted data
   */
  async encrypt(data: any, key: string): Promise<string> {
    return this.crypto.encrypt(data, key);
  }

  /**
   * Decrypts data with Gun.SEA
   * @param encryptedData Encrypted data
   * @param key Decryption key
   * @returns Promise that resolves with the decrypted data
   */
  async decrypt(encryptedData: string, key: string): Promise<string | any> {
    return this.crypto.decrypt(encryptedData, key);
  }

  /**
   * Saves user data at the specified path
   * @param path Path to save the data
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async saveUserData(path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.gun.user();
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
      const user = this.gun.user();
      if (!user.is) {
        resolve(null);
        return;
      }

      user.get(path).once((data: any) => {
        resolve(data);
      });
    });
  }

  // Errors
  static Errors = GunErrors;
}

export { GunDB };
