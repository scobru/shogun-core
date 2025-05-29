import { GunDB } from "./gundb/gun";
import { GunRxJS } from "./gundb/rxjs-integration";
import { EventEmitter } from "./utils/eventEmitter";
import { log, logError, configureLogging } from "./utils/logger";
import { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";
import { ShogunStorage } from "./storage/storage";
import {
  IShogunCore,
  ShogunSDKConfig,
  AuthResult,
  SignUpResult,
  LoggingConfig,
  PluginCategory,
  CorePlugins,
} from "./types/shogun";
import { ethers } from "ethers";
import { Observable } from "rxjs";
import { ShogunPlugin } from "./types/plugin";
import { WebauthnPlugin } from "./plugins/webauthn/webauthnPlugin";
import { MetaMaskPlugin } from "./plugins/metamask/metamaskPlugin";
import { StealthPlugin } from "./plugins/stealth/stealthPlugin";
import { WalletPlugin } from "./plugins/wallet/walletPlugin";
import { BitcoinWalletPlugin } from "./plugins/bitcoin/bitcoinPlugin";
import { WalletManager } from "./plugins";

import Gun from "gun";
import { IGunUserInstance, IGunInstance } from "gun";

export { RelayVerifier } from "./contracts/utils";

export * from "./utils/errorHandler";
export * from "./gundb/rxjs-integration";
export * from "./plugins";
export * from "./contracts/entryPoint";
export * from "./contracts/utils";
export * from "./contracts/registry";
export * from "./contracts/relay";
export type * from "./contracts/entryPoint";
export type * from "./contracts/relay";
export type * from "./contracts/registry";
export type * from "./contracts/base";
export type * from "./contracts/utils";
export type * from "./types/plugin";
export type * from "./utils/errorHandler";

/**
 * Main ShogunCore class - implements the IShogunCore interface
 *
 * This is the primary entry point for the Shogun SDK, providing access to:
 * - Decentralized database (GunDB)
 * - Authentication methods (traditional, WebAuthn, MetaMask)
 * - Plugin system for extensibility
 * - DID (Decentralized Identity) management
 * - RxJS integration for reactive programming
 *
 * @since 2.0.0
 */
export class ShogunCore implements IShogunCore {
  /** Current API version - used for deprecation warnings and migration guidance */
  public static readonly API_VERSION = "2.0.0";

  /** Gun database instance - access through gundb.gun for consistency */
  private _gun!: IGunInstance<any>;

  /** Gun user instance */
  private _user: IGunUserInstance<any> | null = null;

  /** GunDB wrapper - the primary interface for Gun operations */
  public gundb: GunDB;

  /** Storage implementation */
  public storage: ShogunStorage;

  /** Event emitter for SDK events */
  private readonly eventEmitter: EventEmitter;

  /** Ethereum provider */
  public provider?: ethers.Provider;

  /** SDK configuration */
  public config: ShogunSDKConfig;

  /** RxJS integration */
  public rx!: GunRxJS;

  /** Plugin registry */
  private readonly plugins: Map<string, ShogunPlugin> = new Map();

  private Gun: any;

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunDB connection,
   * and plugin system.
   */
  constructor(config: ShogunSDKConfig) {
    log("Initializing ShogunSDK");
    this.config = config;

    if (config.logging) {
      configureLogging(config.logging);
      log("Logging configured with custom settings");
    }

    this.storage = new ShogunStorage();
    this.eventEmitter = new EventEmitter();
    this.Gun = Gun;
    ErrorHandler.addListener((error: ShogunError) => {
      this.eventEmitter.emit("error", {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    if (config.gunInstance) {
      this._gun = config.gunInstance;
    } else {
      this._gun = this.Gun();
    }

    // Then initialize GunDB with the Gun instance
    this.gundb = new GunDB(this._gun, config.scope || "");

    this._gun = this.gundb.gun;
    log("Initialized Gun instance");

    this._user = this.gun.user().recall({ sessionStorage: true });
    this.rx = new GunRxJS(this.gun);
    this.registerBuiltinPlugins(config);

    if (
      config.plugins?.autoRegister &&
      config.plugins.autoRegister.length > 0
    ) {
      for (const plugin of config.plugins.autoRegister) {
        try {
          this.register(plugin);
          log(`Auto-registered plugin: ${plugin.name}`);
        } catch (error) {
          logError(`Failed to auto-register plugin ${plugin.name}:`, error);
        }
      }
    }
    log("ShogunSDK initialized!");
  }

  /**
   * Access to the Gun instance
   * @returns The Gun instance
   */
  get gun(): IGunInstance<any> {
    return this._gun;
  }

  /**
   * Access to the current user
   * @returns The current Gun user instance
   */
  get user(): IGunUserInstance<any> | null {
    return this._user;
  }

  /**
   * Register built-in plugins based on configuration
   * @private
   */
  private registerBuiltinPlugins(config: ShogunSDKConfig): void {
    try {
      // Authentication plugins group
      if (config.webauthn?.enabled) {
        const webauthnPlugin = new WebauthnPlugin();
        webauthnPlugin._category = PluginCategory.Authentication;
        this.register(webauthnPlugin);
        log("Webauthn plugin registered");
      }

      if (config.metamask?.enabled) {
        const metamaskPlugin = new MetaMaskPlugin();
        metamaskPlugin._category = PluginCategory.Authentication;
        this.register(metamaskPlugin);
        log("MetaMask plugin registered");
      }

      if (config.bitcoinWallet?.enabled) {
        const bitcoinWalletPlugin = new BitcoinWalletPlugin();
        bitcoinWalletPlugin._category = PluginCategory.Authentication;
        this.register(bitcoinWalletPlugin);
        log("Bitcoin wallet plugin registered");
      }

      // Privacy plugins group
      if (config.stealth?.enabled) {
        const stealthPlugin = new StealthPlugin();
        stealthPlugin._category = PluginCategory.Privacy;
        this.register(stealthPlugin);
        log("Stealth plugin registered");
      }

      // Wallet plugins group
      if (config.walletManager?.enabled) {
        const walletPlugin = new WalletPlugin();
        walletPlugin._category = PluginCategory.Wallet;
        this.register(walletPlugin);
        log("Wallet plugin registered");
      }
    } catch (error) {
      logError("Error registering builtin plugins:", error);
    }
  }

  // 🔌 PLUGIN MANAGER 🔌

  /**
   * Register a new plugin with the SDK
   * @param plugin The plugin to register
   * @throws Error if a plugin with the same name is already registered
   */
  register(plugin: ShogunPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name "${plugin.name}" already registered`);
    }

    plugin.initialize(this);
    this.plugins.set(plugin.name, plugin);
    log(`Registered plugin: ${plugin.name}`);
  }

  /**
   * Unregister a plugin from the SDK
   * @param pluginName Name of the plugin to unregister
   */
  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      log(`Plugin "${pluginName}" not found, nothing to unregister`);
      return;
    }

    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(pluginName);
    log(`Unregistered plugin: ${pluginName}`);
  }

  /**
   * Retrieve a registered plugin by name
   * @param name Name of the plugin
   * @returns The requested plugin or undefined if not found
   * @template T Type of the plugin or its public interface
   */
  getPlugin<T>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  /**
   * Check if a plugin is registered
   * @param name Name of the plugin to check
   * @returns true if the plugin is registered, false otherwise
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all plugins of a specific category
   * @param category Category of plugins to filter
   * @returns Array of plugins in the specified category
   */
  getPluginsByCategory(category: PluginCategory): ShogunPlugin[] {
    const result: ShogunPlugin[] = [];
    this.plugins.forEach((plugin) => {
      if (plugin._category === category) {
        result.push(plugin);
      }
    });
    return result;
  }

  /**
   * Get an authentication method plugin by type
   * @param type The type of authentication method
   * @returns The authentication plugin or undefined if not available
   * This is a more modern approach to accessing authentication methods
   */
  getAuthenticationMethod(
    type: "password" | "webauthn" | "metamask" | "bitcoin",
  ) {
    switch (type) {
      case "webauthn":
        return this.getPlugin(CorePlugins.WebAuthn);
      case "metamask":
        return this.getPlugin(CorePlugins.MetaMask);
      case "bitcoin":
        return this.getPlugin(CorePlugins.BitcoinWallet);
      case "password":
      default:
        // Default authentication is provided by the core class
        return {
          login: (username: string, password: string) => {
            this.login(username, password);
          },
          signUp: (username: string, password: string, confirm?: string) => {
            this.signUp(username, password, confirm);
          },
        };
    }
  }

  // 🔄 RXJS INTEGRATION 🔄

  /**
   * Observe a Gun node for changes
   * @param path - Path to observe (can be a string or a Gun chain)
   * @returns Observable that emits whenever the node changes
   */
  rxGet<T>(path: string): Observable<T> {
    return this.rx.observe<T>(path);
  }

  /**
   * Match data based on Gun's '.map()' and convert to Observable
   * @param path - Path to the collection
   * @param matchFn - Optional function to filter results
   * @returns Observable array of matched items
   */
  match<T>(
    path: string | any,
    matchFn?: (data: any) => boolean,
  ): Observable<T[]> {
    return this.rx.match<T>(path, matchFn);
  }

  /**
   * Put data and return an Observable
   * @param path - Path where to put the data
   * @param oata - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  rxPut<T>(path: string | any, data: T): Observable<T> {
    return this.rx.put<T>(path, data);
  }

  /**
   * Set data on a node and return an Observable
   * @param path - Path to the collection
   * @param data - Data to set
   * @returns Observable that completes when the set is acknowledged
   */
  rxSet<T>(path: string | any, data: T): Observable<T> {
    return this.rx.set<T>(path, data);
  }

  /**
   * Get data once and return as Observable
   * @param path - Path to get data from
   * @returns Observable that emits the data once
   */
  rxOnce<T>(path: string | any): Observable<T> {
    return this.rx.once<T>(path);
  }

  /**
   * Compute derived values from gun data
   * @param sources - Array of paths or observables to compute from
   * @param computeFn - Function that computes a new value from the sources
   * @returns Observable of computed values
   */
  compute<T, R>(
    sources: Array<string | Observable<any>>,
    computeFn: (...values: T[]) => R,
  ): Observable<R> {
    return this.rx.compute<T, R>(sources, computeFn);
  }

  /**
   * User put data and return an Observable (for authenticated users)
   * @param path - Path where to put the data
   * @param data - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  rxUserPut<T>(path: string, data: T): Observable<T> {
    return this.rx.userPut<T>(path, data);
  }

  /**
   * Observe user data
   * @param path - Path to observe in user space
   * @returns Observable that emits whenever the user data changes
   */
  observeUser<T>(path: string): Observable<T> {
    return this.rx.observeUser<T>(path);
  }

  // *********************************************************************************************************
  // 🔐 ERROR HANDLER 🔐
  // *********************************************************************************************************

  /**
   * Retrieve recent errors logged by the system
   * @param count - Number of errors to retrieve (default: 10)
   * @returns List of most recent errors
   */
  getRecentErrors(count: number = 10): ShogunError[] {
    return ErrorHandler.getRecentErrors(count);
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
  configureLogging(config: LoggingConfig): void {
    configureLogging(config);
    log("Logging reconfigured with new settings");
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
  isLoggedIn(): boolean {
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
  logout(): void {
    try {
      if (!this.isLoggedIn()) {
        log("Logout ignored: user not authenticated");
        return;
      }

      this.gundb.logout();
      this.eventEmitter.emit("auth:logout", {});
      log("Logout completed successfully");
    } catch (error) {
      // Use centralized error handler
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "LOGOUT_FAILED",
        error instanceof Error ? error.message : "Error during logout",
        error,
      );
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
  async login(username: string, password: string): Promise<AuthResult> {
    log("Login");
    try {
      log(`Login attempt for user: ${username}`);

      // Verify parameters
      if (!username || !password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      // Timeout after a configurable interval (default 15 seconds)
      const timeoutDuration = this.config?.timeouts?.login ?? 15000;

      // Use a Promise with timeout for the login operation
      const loginPromiseWithTimeout = new Promise<AuthResult>(
        async (resolve) => {
          const timeoutId = setTimeout(() => {
            resolve({
              success: false,
              error: "Login timeout",
            });
          }, timeoutDuration);

          try {
            // Use a direct approach that avoids the state machine issues
            let loginSuccess = false;
            let userPub = "";

            // Reset user state to avoid state machine conflicts
            try {
              // Clear any previous user data
              const gunUser = this.gun.user();
              if (gunUser && gunUser._) {
                const userRoot = gunUser._ as any;
                if (userRoot.sea) {
                  userRoot.sea = null;
                }
              }
            } catch (e) {
              // Ignore errors during reset
            }

            // Try to authenticate
            await new Promise<void>((resolveAuth) => {
              this.gun.user().auth(username, password, (ack: any) => {
                if (ack.err) {
                  log(`Authentication failed: ${ack.err}`);
                  resolveAuth();
                } else {
                  // Authentication succeeded
                  loginSuccess = true;

                  // Get the user's public key - we need to handle this safely
                  try {
                    const user = this.gun.user();
                    // Access pub property safely using optional chaining and type coercion
                    if (user && user.is && user.is.pub) {
                      // Convert to string in a type-safe way
                      userPub = `${user.is.pub}`;
                    }

                    log(`Login successful for: ${username} (${userPub})`);
                  } catch (e) {
                    log(`Warning: Could not get user public key: ${e}`);
                  }
                  resolveAuth();
                }
              });
            });

            clearTimeout(timeoutId);

            if (!loginSuccess) {
              resolve({
                success: false,
                error: "Wrong user or password",
              });
            } else {
              // First resolve the success result
              resolve({
                success: true,
                userPub: userPub,
                username: username,
              });

              // Then try to access wallet credentials after auth state is updated
              try {
                const walletPlugin = this.getPlugin(
                  CorePlugins.WalletManager,
                ) as WalletManager;

                if (walletPlugin) {
                  const mainWallet = walletPlugin.getMainWalletCredentials();
                  this.storage.setItem(
                    "main-wallet",
                    JSON.stringify(mainWallet),
                  );
                }
              } catch (walletError: any) {
                // Just log the error but don't fail the login
                logError(
                  "Error accessing wallet credentials after login:",
                  walletError,
                );
              }
            }
          } catch (error: any) {
            clearTimeout(timeoutId);
            resolve({
              success: false,
              error: error.message || "Login error",
            });
          }
        },
      );

      const result = await loginPromiseWithTimeout;

      if (result.success) {
        this.eventEmitter.emit("auth:login", {
          userPub: result.userPub ?? "",
        });
      }

      return result;
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "LOGIN_FAILED",
        error.message ?? "Unknown error during login",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Unknown error during login",
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
  async signUp(
    username: string,
    password: string,
    passwordConfirmation?: string,
  ): Promise<SignUpResult> {
    log("Sign up");
    try {
      if (!username || !password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      if (
        passwordConfirmation !== undefined &&
        password !== passwordConfirmation
      ) {
        return {
          success: false,
          error: "Passwords do not match",
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long",
        };
      }

      // Emit a debug event to monitor the flow
      this.eventEmitter.emit("debug", {
        action: "signup_start",
        username,
        timestamp: Date.now(),
      });

      log(`Inizializzazione registrazione per utente: ${username}`);
      log(`Attempting user registration: ${username}`);

      // Try a more direct approach that can better handle username existence checks
      try {
        // First, let's check if the user already exists by trying to authenticate
        // We'll use a random password to avoid decryption errors
        let userExists = false;
        const randomPassword = Math.random().toString(36).substring(2);

        await new Promise<void>((resolve) => {
          // Reset user state
          try {
            const gunUser = this.gun.user();
            if (gunUser && gunUser._) {
              const userRoot = gunUser._ as any;
              if (userRoot.sea) {
                userRoot.sea = null;
              }
            }
          } catch (e) {
            // Ignore errors during reset
          }

          // Try authentication with the username but a random password
          this.gun.user().auth(username, randomPassword, (ack: any) => {
            // If we get an error like "Wrong user or password", the user exists
            if (
              ack.err &&
              (ack.err === "Wrong user or password" ||
                ack.err.includes("Could not decrypt"))
            ) {
              userExists = true;
              log(`Username "${username}" already exists`);
            }
            resolve();
          });
        });

        if (userExists) {
          // The username already exists, return a clear error
          return {
            success: false,
            error: `Username "${username}" is already taken. Please choose a different username.`,
          };
        }

        // If we get here, let's try to create the user
        const signupPromise = new Promise<SignUpResult>((resolve) => {
          // Reset user state again
          try {
            const gunUser = this.gun.user();
            if (gunUser && gunUser._) {
              const userRoot = gunUser._ as any;
              if (userRoot.sea) {
                userRoot.sea = null;
              }
            }
          } catch (e) {
            // Ignore errors during reset
          }

          // Create the user
          this.gun.user().create(username, password, (createAck: any) => {
            if (createAck.err) {
              // If we get "User already created!" here despite our check, it might be a race condition
              if (createAck.err === "User already created!") {
                resolve({
                  success: false,
                  error: `Username "${username}" is already taken. Please choose a different username.`,
                });
              } else {
                resolve({
                  success: false,
                  error: createAck.err || "Registration failed in GunDB",
                });
              }
            } else {
              // User created successfully, now try to authenticate
              this.gun.user().auth(username, password, (authAck: any) => {
                if (authAck.err) {
                  resolve({
                    success: false,
                    error: `User created but authentication failed: ${authAck.err}`,
                  });
                } else {
                  const user = this.gun.user();
                  const userPub = user.is?.pub ? `${user.is.pub}` : "";

                  resolve({
                    success: true,
                    userPub: userPub,
                    username: username,
                  });
                }
              });
            }
          });
        });

        const timeoutDuration = this.config?.timeouts?.signup ?? 30000; // Default timeout of 30 seconds
        const timeoutPromise = new Promise<SignUpResult>((resolve) => {
          setTimeout(() => {
            logError(
              `Timeout at ShogunCore level during user registration: ${username}`,
            );

            // Emit a debug event to monitor the flow
            this.eventEmitter.emit("debug", {
              action: "signup_timeout",
              username,
              timestamp: Date.now(),
            });

            resolve({
              success: false,
              error: "Registration timeout at ShogunCore level",
            });
          }, timeoutDuration);
        });

        // Use Promise.race to handle timeout
        const result = await Promise.race([signupPromise, timeoutPromise]);

        if (result.success) {
          log(`Registration completed successfully for: ${username}`);
          this.eventEmitter.emit("auth:signup", {
            userPub: result.userPub ?? "",
            username,
          });

          // Emit a debug event to monitor the flow
          this.eventEmitter.emit("debug", {
            action: "signup_complete",
            username,
            userPub: result.userPub,
            timestamp: Date.now(),
          });

          return result;
        }

        // Emit a debug event to monitor the flow in case of failure
        this.eventEmitter.emit("debug", {
          action: "signup_failed",
          username,
          error: result.error,
          timestamp: Date.now(),
        });

        return result;
      } catch (registrationError: any) {
        logError(
          `Error during registration process for user ${username}:`,
          registrationError,
        );

        return {
          success: false,
          error:
            registrationError.message ||
            `Registration failed: ${String(registrationError)}`,
        };
      }
    } catch (error: any) {
      logError(`Error during registration for user ${username}:`, error);

      // Emit a debug event to monitor the flow in case of exception
      this.eventEmitter.emit("debug", {
        action: "signup_exception",
        username,
        error: error.message || "Unknown error",
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: error.message ?? "Unknown error during registration",
      };
    }
  }

  // 🤫 PRIVATE HELPER METHODS 🤫

  /**
   * Create a new user with GunDB
   * @param username - Username
   * @param password - Password
   * @returns {Promise<{success: boolean, userPub?: string, error?: string}>} Promise with success status and user public key
   * @description Creates a new user in GunDB with error handling
   */
  private createUserWithGunDB(
    username: string,
    password: string,
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    log(`Ensuring user exists with GunDB: ${username}`);

    return new Promise(async (resolve) => {
      try {
        // Create a safer way to reset the user state without triggering state machine errors
        const resetUserState = () => {
          try {
            // Instead of trying to manipulate internal Gun properties which causes TypeScript errors,
            // let's use a more direct approach to clear the current user state

            // First check if we have a user instance
            if (this.gun && this.gun.user) {
              // Create a new empty user instance which effectively resets the state
              // without triggering state machine transitions
              const emptyUser = this.gun.user();

              // This approach avoids direct manipulation of internal properties
              // while still achieving the goal of resetting user state
              if (emptyUser && typeof emptyUser.is === "undefined") {
                log("User state reset successful");
              }
            }
          } catch (e) {
            log("Error during user state reset (non-critical):", e);
          }
        };

        const authUser = (): Promise<{ err?: string; pub?: string }> => {
          return new Promise((resolveAuth) => {
            // Reset user state before authentication attempt
            resetUserState();

            this.gun.user().auth(username, password, (ack: any) => {
              if (ack.err) {
                resolveAuth({ err: ack.err });
              } else {
                const user = this.gundb.gun.user();
                const userPub = user.is?.pub || "";
                if (!user.is || !userPub) {
                  resolveAuth({
                    err: "Authentication failed after apparent success.",
                  });
                } else {
                  resolveAuth({ pub: userPub });
                }
              }
            });
          });
        };

        const createUser = (): Promise<{ err?: string; pub?: string }> => {
          return new Promise((resolveCreate) => {
            // Reset user state before user creation attempt
            resetUserState();

            this.gundb.gun.user().create(username, password, (ack: any) => {
              resolveCreate({ err: ack.err, pub: ack.pub }); // pub might be present on success
            });
          });
        };

        log(`Attempting login first for ${username}...`);
        let loginResult = await authUser();

        if (loginResult.pub) {
          log(`Login successful for existing user. Pub: ${loginResult.pub}`);
          resolve({
            success: true,
            userPub: loginResult.pub,
          });
          return;
        }

        log(
          `Login failed (${loginResult.err ?? "unknown reason"}), attempting user creation...`,
        );
        const createResult = await createUser();

        if (createResult.err) {
          log(`User creation error: ${createResult.err}`);
          resolve({
            success: false,
            error: `User creation failed: ${createResult.err}`,
          });
          return;
        }

        log(
          `User created successfully, attempting login again for confirmation...`,
        );
        loginResult = await authUser();

        if (loginResult.pub) {
          log(`Post-creation login successful! User pub: ${loginResult.pub}`);
          resolve({
            success: true,
            userPub: loginResult.pub,
          });
        } else {
          logError(
            `Post-creation login failed unexpectedly: ${loginResult.err}`,
          );
          resolve({
            success: false,
            error: `User created, but subsequent login failed: ${loginResult.err}`,
          });
        }
      } catch (error: any) {
        const errorMsg =
          error.message ?? "Unknown error during user existence check";
        logError(`Error in createUserWithGunDB: ${errorMsg}`, error);
        resolve({
          success: false,
          error: errorMsg,
        });
      }
    });
  }

  // 🔫 GUN ACTIONS 🔫

  /**
   * Retrieves data from a Gun node at the specified path
   * @param path - The path to the Gun node
   * @returns Promise that resolves with the node data or rejects with an error
   */
  get(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gundb.gun.get(path).once((data) => {
        if (data.err) {
          reject(data.err as Error);
        } else {
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
  put(data: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gundb.gun.put(data, (ack: any) => {
        if (ack.err) {
          reject(ack.err as Error);
        } else {
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
  userPut(data: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gundb.gun.user().put(data, (ack: any) => {
        if (ack.err) {
          reject(ack.err as Error);
        } else {
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
  userGet(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gundb.gun
        .user()
        .get(path)
        .once((data) => {
          if (data.err) {
            reject(data.err as Error);
          } else {
            resolve(data);
          }
        });
    });
  }

  // 📢 EVENT EMITTER 📢

  /**
   * Emits an event through the core's event emitter.
   * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
   * @param eventName The name of the event to emit.
   * @param data The data to pass with the event.
   */
  emit(eventName: string | symbol, data?: any): boolean {
    return this.eventEmitter.emit(eventName, data);
  }

  /**
   * Add an event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   */
  on(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.on(eventName, listener);
    return this;
  }

  /**
   * Add a one-time event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   */
  once(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.once(eventName, listener);
    return this;
  }

  /**
   * Remove an event listener
   * @param eventName The name of the event to stop listening for
   * @param listener The callback function to remove
   */
  off(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.off(eventName, listener);
    return this;
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param eventName Optional. The name of the event to remove listeners for.
   * If not provided, all listeners for all events are removed.
   */
  removeAllListeners(eventName?: string | symbol): this {
    this.eventEmitter.removeAllListeners(eventName);
    return this;
  }
}

// Export all types
export * from "./types/shogun";

// Export classes
export { GunDB } from "./gundb/gun";
export { MetaMask } from "./plugins/metamask/metamask";
export { Stealth } from "./plugins/stealth/stealth";
export type {
  EphemeralKeyPair,
  StealthData,
  StealthAddressResult,
  LogLevel,
  LogMessage,
} from "./plugins/stealth/types";
export { Webauthn } from "./plugins/webauthn/webauthn";
export { ShogunStorage } from "./storage/storage";
export { ShogunEventEmitter } from "./types/events";
