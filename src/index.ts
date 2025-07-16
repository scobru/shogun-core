import { EventEmitter } from "./utils/eventEmitter";
import { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";
import { ShogunStorage } from "./storage/storage";
import {
  IShogunCore,
  ShogunSDKConfig,
  AuthResult,
  SignUpResult,
  PluginCategory,
  CorePlugins,
  AuthMethod,
} from "./types/shogun";
import { ethers } from "ethers";
import { ShogunPlugin } from "./types/plugin";
import { WebauthnPlugin } from "./plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "./plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "./plugins/nostr/nostrConnectorPlugin";
import { OAuthPlugin } from "./plugins/oauth/oauthPlugin";

import {
  Gun,
  SEA,
  restrictedPut,
  IGunUserInstance,
  IGunInstance,
  GunInstance,
  DeriveOptions,
  GunDataEventData,
  GunPeerEventData,
  GunRxJS,
  crypto,
  derive,
  GunErrors,
} from "./gundb";
import { ISEAPair } from "gun";

export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
};

export { SEA, Gun, GunRxJS, crypto, derive, GunErrors, GunInstance };
export * from "./utils/errorHandler";
export * from "./plugins";
export * from "./types/shogun";
export type * from "./types/plugin";

/**
 * Main ShogunCore class - implements the IShogunCore interface
 *
 * This is the primary entry point for the Shogun SDK, providing access to:
 * - Decentralized database (GunInstance)
 * - Authentication methods (traditional, WebAuthn, MetaMask)
 * - Plugin system for extensibility
 * - RxJS integration for reactive programming
 *
 * @since 2.0.0
 */
export class ShogunCore implements IShogunCore {
  public static readonly API_VERSION = "^1.5.1";
  public db: GunInstance;
  public storage: ShogunStorage;
  public provider?: ethers.Provider;
  public config: ShogunSDKConfig;
  public rx!: GunRxJS;

  private _gun!: IGunInstance<any>;
  private _user: IGunUserInstance<any> | null = null;
  private readonly eventEmitter: EventEmitter;
  private readonly plugins: Map<string, ShogunPlugin> = new Map();
  private currentAuthMethod?: AuthMethod;
  private appToken?: string;

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunInstance connection,
   * and plugin system.
   */
  constructor(config: ShogunSDKConfig) {
    console.log("[index] Initializing Shogun " + ShogunCore.API_VERSION);

    this.config = config;
    this.storage = new ShogunStorage();
    this.eventEmitter = new EventEmitter();

    ErrorHandler.addListener((error: ShogunError) => {
      this.eventEmitter.emit("error", {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    if (config.authToken) {
      restrictedPut(Gun, config.authToken);
    }

    this.appToken = config.appToken;

    try {
      if (config.gunInstance) {
        this._gun = config.gunInstance;
      } else {
        this._gun = Gun({
          peers: config.peers || [],
          radisk: true,
          file: "radata",
        });
      }
    } catch (error) {
      console.error("Error creating Gun instance:", error);

      throw new Error(`Failed to create Gun instance: ${error}`);
    }

    try {
      this.db = new GunInstance(this._gun, config.scope || "");
      this._gun = this.db.gun;
      this.setupGunEventForwarding();
    } catch (error) {
      console.error("Error initializing GunInstance:", error);

      throw new Error(`Failed to initialize GunInstance: ${error}`);
    }

    try {
      this._user = this._gun.user();
    } catch (error) {
      console.error("Error initializing Gun user:", error);
      throw new Error(`Failed to initialize Gun user: ${error}`);
    }

    this._gun.on("auth", (user) => {
      console.log("[index] [INDEX}Gun auth event received", user);
      this._user = this._gun.user();
      this.eventEmitter.emit("auth:login", {
        pub: user.pub,
        alias: user.alias,
        method: "recall",
      });
    });

    this.rx = new GunRxJS(this._gun);
    this.registerBuiltinPlugins(config);

    if (
      config.plugins?.autoRegister &&
      config.plugins.autoRegister.length > 0
    ) {
      for (const plugin of config.plugins.autoRegister) {
        try {
          this.register(plugin);
        } catch (error) {
          console.error(
            `Failed to auto-register plugin ${plugin.name}:`,
            error,
          );
        }
      }
    }

    if (typeof window !== "undefined") {
      (window as any).ShogunCore = this;
      (window as any).ShogunDB = this.db;
      (window as any).ShogunGun = this.db.gun;
    } else if (typeof global !== "undefined") {
      (global as any).ShogunCore = this;
      (global as any).ShogunDB = this.db;
      (global as any).ShogunGun = this.db.gun;
    }

    console.log("[index] Shogun initialized! ");
  }

  /**
   * Initialize the SDK asynchronously
   * This method should be called after construction to perform async operations
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the GunInstance asynchronously
      await this.db.initialize();
      console.log("[index] Shogun async initialization completed");
    } catch (error) {
      console.error("Error during async initialization:", error);
      throw new Error(`Failed to initialize ShogunCore: ${error}`);
    }
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
   * Setup event forwarding from GunInstance to main event emitter
   * @private
   */
  private setupGunEventForwarding(): void {
    // Forward all Gun data events
    const gunEvents = ["gun:put", "gun:get", "gun:set", "gun:remove"];
    gunEvents.forEach((eventName) => {
      this.db.on(eventName, (data: any) => {
        this.eventEmitter.emit(eventName, data);
      });
    });

    const peerEvents = [
      "gun:peer:add",
      "gun:peer:remove",
      "gun:peer:connect",
      "gun:peer:disconnect",
    ];

    peerEvents.forEach((eventName) => {
      this.db.on(eventName, (data: any) => {
        this.eventEmitter.emit(eventName, data);
      });
    });

    console.log("[index] Gun event forwarding setup completed");
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
        console.log("[index] Webauthn plugin registered");
      }

      if (config.web3?.enabled) {
        const web3ConnectorPlugin = new Web3ConnectorPlugin();
        web3ConnectorPlugin._category = PluginCategory.Authentication;
        this.register(web3ConnectorPlugin);
        console.log("[index] Web3Connector plugin registered");
      }

      if (config.nostr?.enabled) {
        const nostrConnectorPlugin = new NostrConnectorPlugin();
        nostrConnectorPlugin._category = PluginCategory.Authentication;
        this.register(nostrConnectorPlugin);
        console.log("[index] NostrConnector plugin registered");
      }

      // Register OAuth plugin if enabled
      if (config.oauth?.enabled) {
        const oauthPlugin = new OAuthPlugin();
        oauthPlugin._category = PluginCategory.Authentication;

        // Configure the plugin with the complete OAuth configuration
        oauthPlugin.configure(config.oauth);

        this.register(oauthPlugin);
        console.log(
          "[index] OAuth plugin registered with providers:",
          config.oauth.providers,
        );
      }
    } catch (error) {
      console.error("Error registering builtin plugins:", error);
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

    if (plugin.name === CorePlugins.OAuth) {
      if (!this.appToken) {
        throw new Error("App token is required for OAuth plugin");
      }
      plugin.initialize(this, this.appToken);
    } else {
      plugin.initialize(this);
    }

    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name}`);
  }

  /**
   * Unregister a plugin from the SDK
   * @param pluginName Name of the plugin to unregister
   */
  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.log(`Plugin "${pluginName}" not found, nothing to unregister`);
      return;
    }

    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(pluginName);
    console.log(`Unregistered plugin: ${pluginName}`);
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
  getAuthenticationMethod(type: AuthMethod) {
    switch (type) {
      case "webauthn":
        return this.getPlugin(CorePlugins.WebAuthn);
      case "web3":
        return this.getPlugin(CorePlugins.Web3);
      case "nostr":
        return this.getPlugin(CorePlugins.Nostr);
      case "oauth":
        return this.getPlugin(CorePlugins.OAuth);
      case "password":
      default:
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
  // 🔐 AUTHENTICATION
  // *********************************************************************************************************

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in, false otherwise
   * @description Verifies authentication status by checking GunInstance login state
   * and presence of authentication credentials in storage
   */
  isLoggedIn(): boolean {
    return this.db.isLoggedIn();
  }

  /**
   * Perform user logout
   * @description Logs out the current user from GunInstance and emits logout event.
   * If user is not authenticated, the logout operation is ignored.
   */
  logout(): void {
    try {
      if (!this.isLoggedIn()) {
        console.log("[index] Logout ignored: user not authenticated");
        return;
      }
      this.db.logout();
      this.eventEmitter.emit("auth:logout", {});
      console.log("[index] Logout completed successfully");
    } catch (error) {
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
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
    console.log("[index] Login");
    try {
      console.log(`Login attempt for user: ${username}`);

      if (!this.currentAuthMethod) {
        this.currentAuthMethod = "password";
        console.log("[index] Authentication method set to default: password");
      }

      const result = await this.db.login(username, password, pair);

      if (result.success) {
        this.eventEmitter.emit("auth:login", {
          userPub: result.userPub ?? "",
        });

        console.log(
          `Current auth method before wallet check: ${this.currentAuthMethod}`,
        );
      } else {
        result.error = result.error || "Wrong user or password";
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
   * @param pair - Pair of keys
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account with the provided credentials.
   * Validates password requirements and emits signup event on success.
   */
  async signUp(
    username: string,
    password: string,
    passwordConfirmation?: string,
    pair?: ISEAPair | null,
  ): Promise<SignUpResult> {
    console.log("[index] Sign up");
    try {
      if (
        passwordConfirmation !== undefined &&
        password !== passwordConfirmation &&
        !pair
      ) {
        return {
          success: false,
          error: "Passwords do not match",
        };
      }

      // Emit a debug event to monitor the flow
      this.eventEmitter.emit("debug", {
        action: "signup_start",
        username,
        timestamp: Date.now(),
      });

      console.log(`Attempting user registration: ${username}`);

      const result = await this.db.signUp(username, password, pair);

      if (result.success) {
        this.eventEmitter.emit("debug", {
          action: "signup_complete",
          username,
          userPub: result.userPub,
          timestamp: Date.now(),
        });

        this.eventEmitter.emit("auth:signup", {
          userPub: result.userPub ?? "",
          username,
        });
      } else {
        this.eventEmitter.emit("debug", {
          action: "signup_failed",
          username,
          error: result.error,
          timestamp: Date.now(),
        });
      }

      return result;
    } catch (error: any) {
      console.error(`Error during registration for user ${username}:`, error);
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

  /**
   * Set the current authentication method
   * This is used by plugins to indicate which authentication method was used
   * @param method The authentication method used
   */
  setAuthMethod(method: AuthMethod): void {
    console.log(
      `Setting authentication method from '${this.currentAuthMethod}' to '${method}'`,
    );
    this.currentAuthMethod = method;
    console.log(`Authentication method successfully set to: ${method}`);
  }

  /**
   * Get the current authentication method
   * @returns The current authentication method or undefined if not set
   */
  getAuthMethod(): AuthMethod | undefined {
    return this.currentAuthMethod;
  }

  /**
   * Debug method: Clears all Gun-related data from local and session storage
   * This is useful for debugging and testing purposes
   */
  clearAllStorageData(): void {
    this.db.clearAllStorageData();
  }

  public getIsLoggedIn(): boolean {
    return !!this.user?.is;
  }
}

export default ShogunCore;

declare global {
  interface Window {
    initShogun: (config: ShogunSDKConfig) => ShogunCore;
    ShogunCore: ShogunCore;
    ShogunCoreClass: typeof ShogunCore;
  }
}

if (typeof window !== "undefined") {
  window.ShogunCoreClass = ShogunCore;
}

if (typeof window !== "undefined") {
  window.initShogun = (config: ShogunSDKConfig): ShogunCore => {
    const instance = new ShogunCore(config);
    window.ShogunCore = instance;
    return instance;
  };
}
