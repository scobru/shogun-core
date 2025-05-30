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
  AuthMethod,
} from "./types/shogun";
import { ethers } from "ethers";
import { ShogunPlugin } from "./types/plugin";
import { WebauthnPlugin } from "./plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "./plugins/ethereum/web3ConnectorPlugin";
import { StealthPlugin } from "./plugins/stealth-address/stealthPlugin";
import { HDWalletPlugin } from "./plugins/bip44/hdwalletPlugin";
import { NostrConnectorPlugin } from "./plugins/bitcoin/nostrConnectorPlugin";
import { HDWallet } from "./plugins/bip44/hdwallet";
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

// Export all types
export * from "./types/shogun";

// Export classes
export { GunDB } from "./gundb/gun";
export { Web3Connector } from "./plugins/ethereum/web3Connector";
export { Stealth } from "./plugins/stealth-address/stealth";
export type {
  EphemeralKeyPair,
  StealthData,
  StealthAddressResult,
  LogLevel,
  LogMessage,
} from "./plugins/stealth-address/types";
export { Webauthn } from "./plugins/webauthn/webauthn";
export { ShogunStorage } from "./storage/storage";
export { ShogunEventEmitter } from "./types/events";

/**
 * Main ShogunCore class - implements the IShogunCore interface
 *
 * This is the primary entry point for the Shogun SDK, providing access to:
 * - Decentralized database (GunDB)
 * - Authentication methods (traditional, WebAuthn, MetaMask)
 * - Plugin system for extensibility
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
      this._gun = this.Gun({peers: config.peers});
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

      if (config.ethereum?.enabled) {
        const web3ConnectorPlugin = new Web3ConnectorPlugin();
        web3ConnectorPlugin._category = PluginCategory.Authentication;
        this.register(web3ConnectorPlugin);
        log("Web3Connector plugin registered");
      }

      if (config.bitcoin?.enabled) {
        const nostrConnectorPlugin = new NostrConnectorPlugin();
        nostrConnectorPlugin._category = PluginCategory.Authentication;
        this.register(nostrConnectorPlugin);
        log("NostrConnector plugin registered");
      }

      // Privacy plugins group
      if (config.stealthAddress?.enabled) {
        const stealthPlugin = new StealthPlugin();
        stealthPlugin._category = PluginCategory.Privacy;
        this.register(stealthPlugin);
        log("Stealth plugin registered");
      }

      // Wallet plugins group
      if (config.bip44?.enabled) {
        const hdwalletPlugin = new HDWalletPlugin();
        hdwalletPlugin._category = PluginCategory.Wallet;
        this.register(hdwalletPlugin);
        log("HDWallet plugin registered");
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
    type: AuthMethod,
  ) {
    switch (type) {
      case "webauthn":
        return this.getPlugin(CorePlugins.WebAuthn);
      case "ethereum":
        return this.getPlugin(CorePlugins.Ethereum);
      case "bitcoin":
        return this.getPlugin(CorePlugins.Bitcoin);
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
    return this.gundb.isLoggedIn();
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
            // Use the GunDB login method instead of reimplementing it here
            const loginResult = await this.gundb.login(username, password);
            clearTimeout(timeoutId);

            if (!loginResult.success) {
              resolve({
                success: false,
                error: loginResult.error || "Wrong user or password",
              });
            } else {
              // First resolve the success result
              resolve({
                success: true,
                userPub: loginResult.userPub,
                username: loginResult.username,
              });

              // Then try to access wallet credentials after auth state is updated
              try {
                const hdwalletPlugin = this.getPlugin(
                  CorePlugins.Bip32,
                ) as HDWallet;

                if (hdwalletPlugin) {
                  const mainWallet = hdwalletPlugin.getMainWalletCredentials();
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

      log(`Attempting user registration: ${username}`);

      const timeoutDuration = this.config?.timeouts?.signup ?? 30000; // Default timeout of 30 seconds

      const signupPromiseWithTimeout = new Promise<SignUpResult>(
        async (resolve) => {
          const timeoutId = setTimeout(() => {
            resolve({
              success: false,
              error: "Registration timeout",
            });
          }, timeoutDuration);

          try {
            // Use the GunDB signUp method instead of reimplementing it here
            const result = await this.gundb.signUp(username, password);
            clearTimeout(timeoutId);

            if (result.success) {
              // Emit a debug event to monitor the flow
              this.eventEmitter.emit("debug", {
                action: "signup_complete",
                username,
                userPub: result.userPub,
                timestamp: Date.now(),
              });

              // Emit the signup event
              this.eventEmitter.emit("auth:signup", {
                userPub: result.userPub ?? "",
                username,
              });
            } else {
              // Emit a debug event to monitor the flow in case of failure
              this.eventEmitter.emit("debug", {
                action: "signup_failed",
                username,
                error: result.error,
                timestamp: Date.now(),
              });
            }

            resolve(result);
          } catch (error: any) {
            clearTimeout(timeoutId);
            resolve({
              success: false,
              error: error.message || "Registration error",
            });
          }
        },
      );

      return await signupPromiseWithTimeout;
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

  // 📢 EVENT EMITTER 📢

  /**
   * Emits an event through the core's event emitter.
   * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
   * @param eventName The name of the event to emit.
   * @param data The data to pass with the event.
   * @returns {boolean} Indicates if the event had listeners.
   */
  emit(eventName: string | symbol, data?: any): boolean {
    return this.eventEmitter.emit(eventName, data);
  }

  /**
   * Add an event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  on(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.on(eventName, listener);
    return this;
  }

  /**
   * Add a one-time event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  once(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.once(eventName, listener);
    return this;
  }

  /**
   * Remove an event listener
   * @param eventName The name of the event to stop listening for
   * @param listener The callback function to remove
   * @returns {this} Returns this instance for method chaining
   */
  off(eventName: string | symbol, listener: (data: unknown) => void): this {
    this.eventEmitter.off(eventName, listener);
    return this;
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param eventName Optional. The name of the event to remove listeners for.
   * If not provided, all listeners for all events are removed.
   * @returns {this} Returns this instance for method chaining
   */
  removeAllListeners(eventName?: string | symbol): this {
    this.eventEmitter.removeAllListeners(eventName);
    return this;
  }
}


