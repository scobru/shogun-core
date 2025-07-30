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
  public static readonly API_VERSION = "^1.6.6";
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
          radisk: false,
          localStorage: false,
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
      this._user = this._gun.user().recall({ sessionStorage: true });
    } catch (error) {
      console.error("Error initializing Gun user:", error);
      throw new Error(`Failed to initialize Gun user: ${error}`);
    }

    this._gun.on("auth", (user) => {
      this._user = this._gun.user().recall({ sessionStorage: true });
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
      console.log(
        `[ShogunCore] Auto-registering ${config.plugins.autoRegister.length} plugins...`,
      );

      for (const plugin of config.plugins.autoRegister) {
        try {
          if (!plugin) {
            console.warn(
              "[ShogunCore] Skipping null/undefined plugin in auto-registration",
            );
            continue;
          }

          console.log(
            `[ShogunCore] Auto-registering plugin: ${plugin.name || "unnamed"}`,
          );
          this.register(plugin);
          console.log(
            `[ShogunCore] Auto-registered plugin: ${plugin.name || "unnamed"}`,
          );
        } catch (error) {
          console.error(
            `[ShogunCore] Failed to auto-register plugin ${plugin?.name || "unknown"}:`,
            error,
          );
          ErrorHandler.handle(
            ErrorType.PLUGIN,
            "AUTO_REGISTRATION_FAILED",
            `Failed to auto-register plugin ${plugin?.name || "unknown"}: ${error instanceof Error ? error.message : String(error)}`,
            error,
          );
        }
      }

      console.log(
        `[ShogunCore] Auto-registration completed. Total plugins: ${this.plugins.size}`,
      );
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
  }

  /**
   * Initialize the SDK asynchronously
   * This method should be called after construction to perform async operations
   */
  async initialize(): Promise<void> {
    try {
      await this.db.initialize();
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
  }

  /**
   * Register built-in plugins based on configuration
   * @private
   */
  private registerBuiltinPlugins(config: ShogunSDKConfig): void {
    try {
      console.log("[ShogunCore] Starting built-in plugins registration...");

      // Disabilita WebAuthn in ambiente server
      const isServerEnvironment = typeof window === "undefined";
      if (isServerEnvironment && config.webauthn?.enabled) {
        console.warn(
          "[ShogunCore] WebAuthn disabled - not supported in server environment",
        );
        config.webauthn.enabled = false;
      }

      if (config.webauthn?.enabled) {
        console.log("[ShogunCore] Registering WebAuthn plugin...");
        const webauthnPlugin = new WebauthnPlugin();
        webauthnPlugin._category = PluginCategory.Authentication;
        this.register(webauthnPlugin);
        console.log("[ShogunCore] WebAuthn plugin registered successfully");
      }

      if (config.web3?.enabled) {
        console.log("[ShogunCore] Registering Web3 plugin...");
        const web3ConnectorPlugin = new Web3ConnectorPlugin();
        web3ConnectorPlugin._category = PluginCategory.Authentication;
        this.register(web3ConnectorPlugin);
        console.log("[ShogunCore] Web3 plugin registered successfully");
      }

      if (config.nostr?.enabled) {
        console.log("[ShogunCore] Registering Nostr plugin...");
        const nostrConnectorPlugin = new NostrConnectorPlugin();
        nostrConnectorPlugin._category = PluginCategory.Authentication;
        this.register(nostrConnectorPlugin);
        console.log("[ShogunCore] Nostr plugin registered successfully");
      }

      if (config.oauth?.enabled) {
        console.log("[ShogunCore] Registering OAuth plugin...");
        const oauthPlugin = new OAuthPlugin();
        oauthPlugin._category = PluginCategory.Authentication;
        oauthPlugin.configure(config.oauth);
        this.register(oauthPlugin);
        console.log("[ShogunCore] OAuth plugin registered successfully");
      }

      console.log(
        `[ShogunCore] Built-in plugins registration completed. Total plugins: ${this.plugins.size}`,
      );
    } catch (error) {
      console.error("[ShogunCore] Error registering builtin plugins:", error);
      ErrorHandler.handle(
        ErrorType.PLUGIN,
        "BUILTIN_PLUGIN_REGISTRATION_FAILED",
        `Failed to register built-in plugins: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  // 🔌 PLUGIN MANAGER 🔌

  /**
   * Register a new plugin with the SDK
   * @param plugin The plugin to register
   * @throws Error if a plugin with the same name is already registered
   */
  register(plugin: ShogunPlugin): void {
    try {
      // Validazione del plugin
      if (!plugin) {
        throw new Error("Plugin cannot be null or undefined");
      }

      if (!plugin.name || typeof plugin.name !== "string") {
        throw new Error("Plugin must have a valid name property");
      }

      if (!plugin.initialize || typeof plugin.initialize !== "function") {
        throw new Error(
          `Plugin ${plugin.name} must implement the initialize method`,
        );
      }

      // Verifica se il plugin è già registrato
      if (this.plugins.has(plugin.name)) {
        throw new Error(`Plugin with name "${plugin.name}" already registered`);
      }

      console.log(
        `[ShogunCore] Registering plugin: ${plugin.name} (version: ${plugin.version || "unknown"})`,
      );

      // Inizializzazione del plugin con gestione speciale per OAuth
      if (plugin.name === CorePlugins.OAuth) {
        if (!this.appToken) {
          throw new Error("App token is required for OAuth plugin");
        }
        plugin.initialize(this, this.appToken);
      } else {
        plugin.initialize(this);
      }

      // Registrazione del plugin
      this.plugins.set(plugin.name, plugin);

      console.log(`[ShogunCore] Plugin ${plugin.name} registered successfully`);

      // Emetti evento di registrazione plugin
      this.eventEmitter.emit("plugin:registered", {
        name: plugin.name,
        version: plugin.version,
        category: plugin._category,
      });
    } catch (error) {
      console.error(
        `[ShogunCore] Failed to register plugin ${plugin?.name || "unknown"}:`,
        error,
      );
      ErrorHandler.handle(
        ErrorType.PLUGIN,
        "PLUGIN_REGISTRATION_FAILED",
        `Failed to register plugin ${plugin?.name || "unknown"}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw error; // Rilancia l'errore per permettere al chiamante di gestirlo
    }
  }

  /**
   * Unregister a plugin from the SDK
   * @param pluginName Name of the plugin to unregister
   */
  unregister(pluginName: string): void {
    try {
      if (!pluginName || typeof pluginName !== "string") {
        throw new Error("Plugin name must be a valid string");
      }

      const plugin = this.plugins.get(pluginName);
      if (!plugin) {
        console.warn(
          `[ShogunCore] Plugin "${pluginName}" not found for unregistration`,
        );
        return;
      }

      console.log(`[ShogunCore] Unregistering plugin: ${pluginName}`);

      // Distruggi il plugin se ha un metodo destroy
      if (plugin.destroy && typeof plugin.destroy === "function") {
        try {
          plugin.destroy();
          console.log(
            `[ShogunCore] Plugin ${pluginName} destroyed successfully`,
          );
        } catch (destroyError) {
          console.error(
            `[ShogunCore] Error destroying plugin ${pluginName}:`,
            destroyError,
          );
          ErrorHandler.handle(
            ErrorType.PLUGIN,
            "PLUGIN_DESTROY_FAILED",
            `Failed to destroy plugin ${pluginName}: ${destroyError instanceof Error ? destroyError.message : String(destroyError)}`,
            destroyError,
          );
        }
      }

      // Rimuovi il plugin dalla mappa
      this.plugins.delete(pluginName);

      console.log(
        `[ShogunCore] Plugin ${pluginName} unregistered successfully`,
      );

      // Emetti evento di deregistrazione plugin
      this.eventEmitter.emit("plugin:unregistered", {
        name: pluginName,
      });
    } catch (error) {
      console.error(
        `[ShogunCore] Failed to unregister plugin ${pluginName}:`,
        error,
      );
      ErrorHandler.handle(
        ErrorType.PLUGIN,
        "PLUGIN_UNREGISTRATION_FAILED",
        `Failed to unregister plugin ${pluginName}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  /**
   * Retrieve a registered plugin by name
   * @param name Name of the plugin
   * @returns The requested plugin or undefined if not found
   * @template T Type of the plugin or its public interface
   */
  getPlugin<T>(name: string): T | undefined {
    if (!name || typeof name !== "string") {
      console.warn("[ShogunCore] Invalid plugin name provided to getPlugin");
      return undefined;
    }

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`[ShogunCore] Plugin "${name}" not found`);
      return undefined;
    }

    return plugin as T;
  }

  /**
   * Get information about all registered plugins
   * @returns Array of plugin information objects
   */
  getPluginsInfo(): Array<{
    name: string;
    version: string;
    category?: PluginCategory;
    description?: string;
  }> {
    const pluginsInfo: Array<{
      name: string;
      version: string;
      category?: PluginCategory;
      description?: string;
    }> = [];

    this.plugins.forEach((plugin) => {
      pluginsInfo.push({
        name: plugin.name,
        version: plugin.version || "unknown",
        category: plugin._category,
        description: plugin.description,
      });
    });

    return pluginsInfo;
  }

  /**
   * Get the total number of registered plugins
   * @returns Number of registered plugins
   */
  getPluginCount(): number {
    return this.plugins.size;
  }

  /**
   * Check if all plugins are properly initialized
   * @returns Object with initialization status for each plugin
   */
  getPluginsInitializationStatus(): Record<
    string,
    { initialized: boolean; error?: string }
  > {
    const status: Record<string, { initialized: boolean; error?: string }> = {};

    this.plugins.forEach((plugin, name) => {
      try {
        // Verifica se il plugin ha un metodo per controllare l'inizializzazione
        if (typeof (plugin as any).assertInitialized === "function") {
          (plugin as any).assertInitialized();
          status[name] = { initialized: true };
        } else {
          // Fallback: verifica se il plugin ha un riferimento al core
          status[name] = {
            initialized: !!(plugin as any).core,
            error: !(plugin as any).core
              ? "No core reference found"
              : undefined,
          };
        }
      } catch (error) {
        status[name] = {
          initialized: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    return status;
  }

  /**
   * Validate plugin system integrity
   * @returns Object with validation results
   */
  validatePluginSystem(): {
    totalPlugins: number;
    initializedPlugins: number;
    failedPlugins: string[];
    warnings: string[];
  } {
    const status = this.getPluginsInitializationStatus();
    const totalPlugins = Object.keys(status).length;
    const initializedPlugins = Object.values(status).filter(
      (s) => s.initialized,
    ).length;
    const failedPlugins = Object.entries(status)
      .filter(([_, s]) => !s.initialized)
      .map(([name, _]) => name);
    const warnings: string[] = [];

    if (totalPlugins === 0) {
      warnings.push("No plugins registered");
    }

    if (failedPlugins.length > 0) {
      warnings.push(`Failed plugins: ${failedPlugins.join(", ")}`);
    }

    return {
      totalPlugins,
      initializedPlugins,
      failedPlugins,
      warnings,
    };
  }

  /**
   * Attempt to reinitialize failed plugins
   * @returns Object with reinitialization results
   */
  reinitializeFailedPlugins(): {
    success: string[];
    failed: Array<{ name: string; error: string }>;
  } {
    const status = this.getPluginsInitializationStatus();
    const failedPlugins = Object.entries(status)
      .filter(([_, s]) => !s.initialized)
      .map(([name, _]) => name);

    const success: string[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    failedPlugins.forEach((pluginName) => {
      try {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
          failed.push({ name: pluginName, error: "Plugin not found" });
          return;
        }

        console.log(
          `[ShogunCore] Attempting to reinitialize plugin: ${pluginName}`,
        );

        // Reinizializza il plugin
        if (pluginName === CorePlugins.OAuth) {
          if (!this.appToken) {
            failed.push({
              name: pluginName,
              error: "App token required for OAuth plugin",
            });
            return;
          }
          plugin.initialize(this, this.appToken);
        } else {
          plugin.initialize(this);
        }

        success.push(pluginName);
        console.log(
          `[ShogunCore] Successfully reinitialized plugin: ${pluginName}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        failed.push({ name: pluginName, error: errorMessage });
        console.error(
          `[ShogunCore] Failed to reinitialize plugin ${pluginName}:`,
          error,
        );
      }
    });

    return { success, failed };
  }

  /**
   * Check plugin compatibility with current ShogunCore version
   * @returns Object with compatibility information
   */
  checkPluginCompatibility(): {
    compatible: Array<{ name: string; version: string }>;
    incompatible: Array<{ name: string; version: string; reason: string }>;
    unknown: Array<{ name: string; version: string }>;
  } {
    const compatible: Array<{ name: string; version: string }> = [];
    const incompatible: Array<{
      name: string;
      version: string;
      reason: string;
    }> = [];
    const unknown: Array<{ name: string; version: string }> = [];

    this.plugins.forEach((plugin) => {
      const pluginInfo = {
        name: plugin.name,
        version: plugin.version || "unknown",
      };

      // Verifica se il plugin ha informazioni di compatibilità
      if (typeof (plugin as any).getCompatibilityInfo === "function") {
        try {
          const compatibilityInfo = (plugin as any).getCompatibilityInfo();
          if (compatibilityInfo && compatibilityInfo.compatible) {
            compatible.push(pluginInfo);
          } else {
            incompatible.push({
              ...pluginInfo,
              reason:
                compatibilityInfo?.reason || "Unknown compatibility issue",
            });
          }
        } catch (error) {
          unknown.push(pluginInfo);
        }
      } else {
        // Se non ha informazioni di compatibilità, considera sconosciuto
        unknown.push(pluginInfo);
      }
    });

    return { compatible, incompatible, unknown };
  }

  /**
   * Get comprehensive debug information about the plugin system
   * @returns Complete plugin system debug information
   */
  getPluginSystemDebugInfo(): {
    shogunCoreVersion: string;
    totalPlugins: number;
    plugins: Array<{
      name: string;
      version: string;
      category?: PluginCategory;
      description?: string;
      initialized: boolean;
      error?: string;
    }>;
    initializationStatus: Record<
      string,
      { initialized: boolean; error?: string }
    >;
    validation: {
      totalPlugins: number;
      initializedPlugins: number;
      failedPlugins: string[];
      warnings: string[];
    };
    compatibility: {
      compatible: Array<{ name: string; version: string }>;
      incompatible: Array<{ name: string; version: string; reason: string }>;
      unknown: Array<{ name: string; version: string }>;
    };
  } {
    const pluginsInfo = this.getPluginsInfo();
    const initializationStatus = this.getPluginsInitializationStatus();

    const plugins = pluginsInfo.map((info) => ({
      ...info,
      initialized: initializationStatus[info.name]?.initialized || false,
      error: initializationStatus[info.name]?.error,
    }));

    return {
      shogunCoreVersion: ShogunCore.API_VERSION,
      totalPlugins: this.getPluginCount(),
      plugins,
      initializationStatus,
      validation: this.validatePluginSystem(),
      compatibility: this.checkPluginCompatibility(),
    };
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
        return;
      }
      this.db.logout();
      this.eventEmitter.emit("auth:logout", {});
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
    try {
      if (!this.currentAuthMethod) {
        this.currentAuthMethod = "password";
      }

      const result = await this.db.login(username, password, pair);

      if (result.success) {
        // Include SEA pair in the response
        const seaPair = (this.user?._ as any)?.sea;
        if (seaPair) {
          (result as any).sea = seaPair;
        }

        this.eventEmitter.emit("auth:login", {
          userPub: result.userPub ?? "",
        });
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
   * Login with GunDB pair directly
   * @param pair - GunDB SEA pair for authentication
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Authenticates user using a GunDB pair directly.
   * Emits login event on success.
   */
  async loginWithPair(pair: ISEAPair): Promise<AuthResult> {
    try {
      if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        return {
          success: false,
          error: "Invalid pair structure - missing required keys",
        };
      }

      // Use the new loginWithPair method from GunInstance
      const result = await this.db.login("", "", pair);

      if (result.success) {
        // Include SEA pair in the response
        const seaPair = (this.user?._ as any)?.sea;
        if (seaPair) {
          (result as any).sea = seaPair;
        }

        this.currentAuthMethod = "pair";
        this.eventEmitter.emit("auth:login", {
          userPub: result.userPub ?? "",
        });
      } else {
        result.error =
          result.error || "Authentication failed with provided pair";
      }

      return result;
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "PAIR_LOGIN_FAILED",
        error.message ?? "Unknown error during pair login",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Unknown error during pair login",
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

      this.eventEmitter.emit("debug", {
        action: "signup_start",
        username,
        timestamp: Date.now(),
      });

      const result = await this.db.signUp(username, password, pair);

      if (result.success) {
        // Include SEA pair in the response
        const seaPair = (this.user?._ as any)?.sea;
        if (seaPair) {
          (result as any).sea = seaPair;
        }

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
    this.currentAuthMethod = method;
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

  /**
   * Updates the user's alias (username) in Gun and saves the updated credentials
   * @param newAlias New alias/username to set
   * @returns Promise resolving to update result
   */
  async updateUserAlias(
    newAlias: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[ShogunCore] Updating user alias to: ${newAlias}`);

      if (!this.db) {
        return { success: false, error: "Database not initialized" };
      }

      return await this.db.updateUserAlias(newAlias);
    } catch (error) {
      console.error(`[ShogunCore] Error updating user alias:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Saves the current user credentials to storage
   */
  savePair(): void {
    try {
      console.log(`[ShogunCore] Saving user credentials`);

      if (!this.db) {
        console.warn(
          "[ShogunCore] Database not initialized, cannot save credentials",
        );
        return;
      }

      this.db.savePair();
    } catch (error) {
      console.error(`[ShogunCore] Error saving credentials:`, error);
    }
  }

  // esporta la coppia utente come json
  /**
   * Esporta la coppia di chiavi dell'utente corrente come stringa JSON.
   * Utile per backup o migrazione dell'account.
   * @returns {string} La coppia SEA serializzata in formato JSON, oppure stringa vuota se non disponibile.
   */
  exportPair(): string {
    if (
      !this.user ||
      !this.user._ ||
      typeof (this.user._ as any).sea === "undefined"
    ) {
      return "";
    }
    return JSON.stringify((this.user._ as any).sea);
  }

  public getIsLoggedIn(): boolean {
    return !!(this.user && this.user.is);
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
