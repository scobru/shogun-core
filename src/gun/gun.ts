/**
 * GunDB - Optimized class with advanced Auth integration
 */
import Gun from "gun";
import "gun/sea";
import { IGunInstance } from "gun/types";
import CONFIG from "../config";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunDBOptions } from "../types/gun";

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  error?: string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  attempts: number;
  delay: number;
}

/**
 * GunDB - Simplified Gun management with advanced Auth
 *
 * Uses the Auth class for optimized authentication handling
 */
class GunDB {
  public gun: IGunInstance<any>;
  private certificato: string | null = null;
  private onAuthCallbacks: Array<(user: any) => void> = [];
  private retryConfig: RetryConfig;
  private _authenticating: boolean = false;

  /**
   * @param options - GunDBOptions
   */
  constructor(options: Partial<GunDBOptions> = {}) {
    log("Initializing GunDB");

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
      const tokenPreview =
        options.authToken.substring(0, 3) +
        "..." +
        (options.authToken.length > 6
          ? options.authToken.substring(options.authToken.length - 3)
          : "");
      log(`Auth token received (${tokenPreview})`);
    } else {
      log("No auth token received");
    }

    // Configure GunDB with provided options
    this.gun = new Gun(config);

    // Aggiungiamo il token di autenticazione ai messaggi in uscita
    const authToken = options.authToken;

    if (authToken) {
      Gun.on("opt", function (ctx: any) {
        if (ctx.once) {
          return;
        }
        ctx.on("out", function (msg: any) {
          var to = ctx.to;
          // Adds headers for put
          msg.headers = {
            token: "thisIsTheTokenForReals",
          };
          to.next(msg); // pass to next middleware
        });
      });
      log("Auth token handler configured for outgoing messages");
    }

    // Handle authentication events
    this.subscribeToAuthEvents();
  }

  /**
   * Retry operation with exponential backoff
   */
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
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Subscribe to Gun authentication events
   */
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

  /**
   * Notify all authentication listeners
   * @param pub - Public key of authenticated user
   */
  private notifyAuthListeners(pub: string): void {
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
  static withPeers(peers: string[] = CONFIG.PEERS): GunDB {
    return new GunDB({ peers });
  }

  /**
   * Add listener for authentication events
   * @param callback - Function to call when user authenticates
   * @returns Function to remove the listener
   */
  onAuth(callback: (user: any) => void): () => void {
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
  getGun(): IGunInstance<any> {
    return this.gun;
  }

  /**
   * Get current user
   * @returns Gun user or null if not authenticated
   */
  getUser(): any {
    return this.gun.user();
  }

  /**
   * Set certificate for current user
   * @param certificate - Certificate to use
   */
  setCertificate(certificate: string): void {
    this.certificato = certificate;
    const user = this.gun.user();
    user.get("trust").get("certificate").put(certificate);
  }

  /**
   * Get current user's certificate
   * @returns Certificate or null if not available
   */
  getCertificate(): string | null {
    return this.certificato;
  }

  /**
   * Register a new user
   * @param username - Username
   * @param password - Password
   * @returns Promise resolving with user's public key
   */
  async signUp(username: string, password: string): Promise<any> {
    try {
      log("Attempting user registration:", username);

      return new Promise((resolve) => {
        this.gun.user().create(username, password, async (ack: any) => {
          if (ack.err) {
            logError(`Registration error: ${ack.err}`);
            resolve({ success: false, error: ack.err });
          } else {
            // Automatic login after registration
            const loginResult = await this.login(username, password);

            if (loginResult.success) {
              log("Registration and login completed successfully");
            } else {
              logError("Registration completed but login failed");
            }

            resolve(loginResult);
          }
        });
      });
    } catch (error) {
      logError("Error during registration:", error);
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
  login(
    username: string,
    password: string,
    callback?: (result: any) => void
  ): Promise<any> {
    log(`Attempting login for user: ${username}`);

    return new Promise((resolve, reject) => {
      if (!username || !password) {
        const error = "Username and password are required";
        log(error);
        if (callback) callback({ err: error });
        reject(new Error(error));
        return;
      }

      // Limpiezza: forziamo un reset di eventuali utenti precedenti
      try {
        this.gun.user().leave();
        log("Current user reset before login attempt");
      } catch (e) {
        // Ignoriamo errori qui
      }

      // Eseguiamo login con una nuova istanza di Gun per evitare conflitti
      log(`Performing auth with Gun for user: ${username}`);
      this.gun.user().auth(username, password, (ack: any) => {
        if (ack.err) {
          log(`Login error: ${ack.err}`);
          if (callback) callback({ err: ack.err });
          reject(new Error(ack.err));
        } else {
          log("Authentication completed successfully");
          // Salviamo il pair
          try {
            this._savePair();
            log("User auth pair saved");
          } catch (saveError) {
            log(`Warning: Error saving auth pair: ${saveError}`);
          }

          if (callback) callback(ack);
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
  private _savePair(): void {
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
    } catch (error) {
      console.error("Error saving authentication pair:", error);
    }
  }

  /**
   * Verifica se un processo di autenticazione è già in corso
   */
  private isAuthenticating(): boolean {
    return this._authenticating === true;
  }

  /**
   * Imposta il flag di autenticazione
   */
  private _setAuthenticating(value: boolean): void {
    this._authenticating = value;
  }

  /**
   * Logout current user
   */
  logout(): void {
    try {
      log("Attempting logout");
      this.gun.user().leave();
      log("Logout completed");
    } catch (error) {
      logError("Error during logout:", error);
    }
  }

  /**
   * Check if a user is currently authenticated
   * @returns true if a user is authenticated
   */
  isLoggedIn(): boolean {
    const user = this.gun.user();
    return !!(user && user.is && user.is.pub);
  }

  /**
   * Get currently authenticated user
   * @returns Current user or null if not authenticated
   */
  getCurrentUser(): any {
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
  private async saveWithRetry(
    node: any,
    data: any,
    options?: any
  ): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve, reject) => {
          node.put(
            data,
            (ack: any) => {
              if (ack.err) reject(new Error(ack.err));
              else resolve(data);
            },
            options
          );
        }),
      "data save operation"
    );
  }

  /**
   * Read data with retry logic
   */
  private async readWithRetry(node: any): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve) => {
          node.once((data: any) => resolve(data));
        }),
      "data read operation"
    );
  }

  /**
   * Save data to user node with improved error handling
   */
  async saveUserData(path: string, data: any): Promise<any> {
    try {
      if (!this.gun.user()?.is?.pub) {
        throw new Error("User not authenticated");
      }

      const options = this.certificato
        ? { opt: { cert: this.certificato } }
        : undefined;

      return await this.saveWithRetry(this.gun.user().get(path), data, options);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.GUN,
        "SAVE_USER_DATA_ERROR",
        `Error saving data to path ${path}`,
        error
      );
      throw error;
    }
  }

  /**
   * Retrieve data from user node with improved error handling
   */
  async getUserData(path: string): Promise<any> {
    try {
      if (!this.gun.user()?.is?.pub) {
        throw new Error("User not authenticated");
      }

      const data = await this.readWithRetry(this.gun.user().get(path));

      if (!data) {
        log(`No data found at ${path}`);
        return null;
      }

      log(`Data retrieved from ${path}`);
      return data;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.GUN,
        "GET_USER_DATA_ERROR",
        `Error retrieving data from path ${path}`,
        error
      );
      throw error;
    }
  }

  /**
   * Save data to public node
   */
  async savePublicData(node: string, key: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = this.certificato
        ? { opt: { cert: this.certificato } }
        : undefined;

      this.gun
        .get(node)
        .get(key)
        .put(
          data,
          (ack: any) => {
            if (ack && ack.err) {
              logError(`Error saving public data: ${ack.err}`);
              reject(new Error(ack.err));
            } else {
              log(`Public data saved to ${node}/${key}`);
              resolve(data);
            }
          },
          options
        );
    });
  }

  /**
   * Retrieve data from public node
   */
  async getPublicData(node: string, key: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun
        .get(node)
        .get(key)
        .once((data) => {
          if (!data) {
            log(`No public data found at ${node}/${key}`);
            resolve(null);
          } else {
            log(`Public data retrieved from ${node}/${key}`);
            resolve(data);
          }
        });
    });
  }

  /**
   * Generate new SEA key pair
   */
  async generateKeyPair(): Promise<any> {
    // Use SEA.pair() directly instead of this.auth.generatePair()
    return (Gun as any).SEA.pair();
  }
}

// Make class globally available
declare global {
  interface Window {
    GunDB: typeof GunDB;
  }
  namespace NodeJS {
    interface Global {
      GunDB: typeof GunDB;
    }
  }
}

if (typeof window !== "undefined") {
  window.GunDB = GunDB;
} else if (typeof global !== "undefined") {
  (global as any).GunDB = GunDB;
}

export { GunDB };
