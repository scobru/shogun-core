import { ShogunEventMap } from './interfaces/events';
import { ErrorHandler, ShogunError } from './utils/errorHandler';
import { ShogunStorage } from './storage/storage';
import {
  IShogunCore,
  ShogunCoreConfig,
  AuthResult,
  SignUpResult,
  PluginCategory,
  AuthMethod,
  Wallets,
} from './interfaces/shogun';
import { ethers } from 'ethers';
import { ShogunPlugin } from './interfaces/plugin';
import { ISEAPair, IGunInstance, IGunUserInstance } from 'gun';
import { DataBase, RxJS } from './gundb';
import { DataBaseHolster } from './gundb/db-holster';

// Import managers
import { PluginManager } from './managers/PluginManager';
import { AuthManager } from './managers/AuthManager';
import { EventManager } from './managers/EventManager';
import { CoreInitializer } from './managers/CoreInitializer';

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
  public static readonly API_VERSION = '^6.2.1';
  public db!: DataBase | DataBaseHolster;
  public storage!: ShogunStorage;
  public provider?: ethers.Provider;
  public config: ShogunCoreConfig;
  public rx!: RxJS;

  public _gun!: IGunInstance<any>;
  public _user: IGunUserInstance | null = null;
  public wallets: Wallets | undefined;

  // Managers
  public pluginManager: PluginManager;
  private authManager: AuthManager;
  private eventManager: EventManager;
  private coreInitializer: CoreInitializer;

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunInstance connection,
   * and plugin system.
   */
  constructor(config: ShogunCoreConfig) {
    this.config = config;

    // Initialize managers
    this.eventManager = new EventManager();
    this.pluginManager = new PluginManager(this);
    this.authManager = new AuthManager(this);
    this.coreInitializer = new CoreInitializer(this);

    // Initialize async components
    this.coreInitializer.initialize(config).catch((error: any) => {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Error during async initialization:', error);
      }
    });
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
  get user(): IGunUserInstance | null {
    return this._user;
  }

  /**
   * Gets the current user information
   * @returns Current user object or null
   */
  getCurrentUser(): { pub: string; user?: any } | null {
    if (!this.db) {
      return null;
    }
    return this.db.getCurrentUser();
  }

  // *********************************************************************************************************
  // 🔌 PLUGIN MANAGEMENT 🔌
  // *********************************************************************************************************

  /**
   * Registers a plugin with the Shogun SDK
   * @param plugin Plugin instance to register
   * @throws Error if a plugin with the same name is already registered
   */
  register(plugin: ShogunPlugin): void {
    this.pluginManager.register(plugin);
  }

  /**
   * Unregisters a plugin from the Shogun SDK
   * @param pluginName Name of the plugin to unregister
   */
  unregister(pluginName: string): void {
    this.pluginManager.unregister(pluginName);
  }

  /**
   * Retrieve a registered plugin by name
   * @param name Name of the plugin
   * @returns The requested plugin or undefined if not found
   * @template T Type of the plugin or its public interface
   */
  getPlugin<T = ShogunPlugin>(name: string): T | undefined {
    return this.pluginManager.getPlugin<T>(name);
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
    return this.pluginManager.getPluginsInfo();
  }

  /**
   * Get the total number of registered plugins
   * @returns Number of registered plugins
   */
  getPluginCount(): number {
    return this.pluginManager.getPluginCount();
  }

  /**
   * Check if all plugins are properly initialized
   * @returns Object with initialization status for each plugin
   */
  getPluginsInitializationStatus(): Record<
    string,
    { initialized: boolean; error?: string }
  > {
    return this.pluginManager.getPluginsInitializationStatus();
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
    return this.pluginManager.validatePluginSystem();
  }

  /**
   * Attempt to reinitialize failed plugins
   * @returns Object with reinitialization results
   */
  reinitializeFailedPlugins(): {
    success: string[];
    failed: Array<{ name: string; error: string }>;
  } {
    return this.pluginManager.reinitializeFailedPlugins();
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
    return this.pluginManager.checkPluginCompatibility();
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
    return this.pluginManager.getPluginSystemDebugInfo();
  }

  /**
   * Check if a plugin is registered
   * @param name Name of the plugin to check
   * @returns true if the plugin is registered, false otherwise
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.hasPlugin(name);
  }

  /**
   * Get all plugins of a specific category
   * @param category Category of plugins to filter
   * @returns Array of plugins in the specified category
   */
  getPluginsByCategory(category: PluginCategory): ShogunPlugin[] {
    return this.pluginManager.getPluginsByCategory(category);
  }

  /**
   * Get an authentication method plugin by type
   * @param type The type of authentication method
   * @returns The authentication plugin or undefined if not available
   * This is a more modern approach to accessing authentication methods
   */
  getAuthenticationMethod(type: AuthMethod) {
    return this.authManager.getAuthenticationMethod(type);
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
    return this.authManager.isLoggedIn();
  }

  /**
   * Perform user logout
   * @description Logs out the current user from GunInstance and emits logout event.
   * If user is not authenticated, the logout operation is ignored.
   */
  logout(): void {
    this.authManager.logout();
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
    return this.authManager.login(username, password, pair);
  }

  /**
   * Login with GunDB pair directly
   * @param pair - GunDB SEA pair for authentication
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Authenticates user using a GunDB pair directly.
   * Emits login event on success.
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
    return this.authManager.loginWithPair(username, pair);
  }

  /**
   * Register a new user with provided credentials
   * @param username - Username
   * @param password - Password
   * @param email - Email (optional)
   * @param pair - Pair of keys
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account with the provided credentials.
   * Validates password requirements and emits signup event on success.
   */
  async signUp(
    username: string,
    password?: string,
    pair?: ISEAPair | null,
  ): Promise<SignUpResult> {
    return this.authManager.signUp(username, password, pair);
  }

  // 📢 EVENT EMITTER 📢

  /**
   * Emits an event through the core's event emitter.
   * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
   * @param eventName The name of the event to emit.
   * @param data The data to pass with the event.
   * @returns {boolean} Indicates if the event had listeners.
   */
  emit<K extends keyof ShogunEventMap>(
    eventName: K,
    data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K],
  ): boolean {
    return this.eventManager.emit(eventName, data);
  }

  /**
   * Add an event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  on<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this {
    this.eventManager.on(eventName, listener);
    return this;
  }

  /**
   * Add a one-time event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  once<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this {
    this.eventManager.once(eventName, listener);
    return this;
  }

  /**
   * Remove an event listener
   * @param eventName The name of the event to stop listening for
   * @param listener The callback function to remove
   * @returns {this} Returns this instance for method chaining
   */
  off<K extends keyof ShogunEventMap>(
    eventName: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): this {
    this.eventManager.off(eventName, listener);
    return this;
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param eventName Optional. The name of the event to remove listeners for.
   * If not provided, all listeners for all events are removed.
   * @returns {this} Returns this instance for method chaining
   */
  removeAllListeners(eventName?: string | symbol): this {
    this.eventManager.removeAllListeners(eventName);
    return this;
  }

  /**
   * Set the current authentication method
   * This is used by plugins to indicate which authentication method was used
   * @param method The authentication method used
   */
  setAuthMethod(method: AuthMethod): void {
    this.authManager.setAuthMethod(method);
  }

  /**
   * Get the current authentication method
   * @returns The current authentication method or undefined if not set
   */
  getAuthMethod(): AuthMethod | undefined {
    return this.authManager.getAuthMethod();
  }

  /**
   * Saves the current user credentials to storage
   */
  async saveCredentials(credentials: any): Promise<void> {
    try {
      this.storage.setItem('userCredentials', JSON.stringify(credentials));
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Failed to save credentials to storage');
      }
      if (typeof console !== 'undefined' && console.error) {
        console.error(`Error saving credentials:`, error);
      }
    }
  }

  public getIsLoggedIn(): boolean {
    return !!(this.user && this.user.is);
  }
}

// Global declarations are handled in the original core.ts file
// to avoid conflicts, we only set the window properties here
if (typeof window !== 'undefined') {
  (window as any).Shogun = (config: ShogunCoreConfig): ShogunCore => {
    return new ShogunCore(config);
  };
}

export default ShogunCore;
