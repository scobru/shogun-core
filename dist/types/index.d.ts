import { GunDB } from "./gun/gun";
import { ShogunStorage } from "./storage/storage";
import { IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, LoggingConfig, PluginCategory } from "./types/shogun";
import { IGunUserInstance } from "gun";
import { ethers } from "ethers";
import { ShogunError } from "./utils/errorHandler";
import { GunRxJS } from "./gun/rxjs-integration";
import { Observable } from "rxjs";
import { ShogunPlugin } from "./types/plugin";
import { GunInstance } from "./gun/types";
export * from "./utils/errorHandler";
export type * from "./utils/errorHandler";
export * from "./gun/rxjs-integration";
export * from "./plugins";
export type * from "./types/plugin";
export * from "./contracts/entryPoint";
export * from "./contracts/utils";
export * from "./contracts/registry";
export * from "./contracts/relay";
export type * from "./contracts/entryPoint";
export type * from "./contracts/relay";
export type * from "./contracts/registry";
export type * from "./contracts/base";
export type * from "./contracts/utils";
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
export declare class ShogunCore implements IShogunCore {
    /** Current API version - used for deprecation warnings and migration guidance */
    static readonly API_VERSION = "2.0.0";
    /** Gun database instance */
    gun: GunInstance<any>;
    /** Gun user instance */
    user: IGunUserInstance<any> | null;
    /** GunDB wrapper */
    gundb: GunDB;
    /** Storage implementation */
    storage: ShogunStorage;
    /** Event emitter for SDK events */
    private readonly eventEmitter;
    /** Ethereum provider */
    provider?: ethers.Provider;
    /** SDK configuration */
    config: ShogunSDKConfig;
    /** RxJS integration */
    rx: GunRxJS;
    /** Plugin registry */
    private readonly plugins;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * and plugin system.
     */
    constructor(config: ShogunSDKConfig);
    /**
     * Register built-in plugins based on configuration
     * @private
     */
    private registerBuiltinPlugins;
    /**
     * Register a new plugin with the SDK
     * @param plugin The plugin to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin: ShogunPlugin): void;
    /**
     * Unregister a plugin from the SDK
     * @param pluginName Name of the plugin to unregister
     */
    unregister(pluginName: string): void;
    /**
     * Retrieve a registered plugin by name
     * @param name Name of the plugin
     * @returns The requested plugin or undefined if not found
     * @template T Type of the plugin or its public interface
     */
    getPlugin<T>(name: string): T | undefined;
    /**
     * Check if a plugin is registered
     * @param name Name of the plugin to check
     * @returns true if the plugin is registered, false otherwise
     */
    hasPlugin(name: string): boolean;
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    getPluginsByCategory(category: PluginCategory): ShogunPlugin[];
    /**
     * Get an authentication method plugin by type
     * @param type The type of authentication method
     * @returns The authentication plugin or undefined if not available
     * This is a more modern approach to accessing authentication methods
     */
    getAuthenticationMethod(type: "password" | "webauthn" | "metamask"): unknown;
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    rxGet<T>(path: string): Observable<T>;
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match<T>(path: string | any, matchFn?: (data: any) => boolean): Observable<T[]>;
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param oata - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxPut<T>(path: string | any, data: T): Observable<T>;
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    rxSet<T>(path: string | any, data: T): Observable<T>;
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    rxOnce<T>(path: string | any): Observable<T>;
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute<T, R>(sources: Array<string | Observable<any>>, computeFn: (...values: T[]) => R): Observable<R>;
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxUserPut<T>(path: string, data: T): Observable<T>;
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser<T>(path: string): Observable<T>;
    /**
     * Retrieve recent errors logged by the system
     * @param count - Number of errors to retrieve (default: 10)
     * @returns List of most recent errors
     */
    getRecentErrors(count?: number): ShogunError[];
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
    configureLogging(config: LoggingConfig): void;
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunDB login state
     * and presence of authentication credentials in storage
     */
    isLoggedIn(): boolean;
    /**
     * Perform user logout
     * @description Logs out the current user from GunDB and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout(): void;
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    login(username: string, password: string): Promise<AuthResult>;
    /**
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param passwordConfirmation - Password confirmation
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    /**
     * Create a new user with GunDB
     * @param username - Username
     * @param password - Password
     * @returns {Promise<{success: boolean, userPub?: string, error?: string}>} Promise with success status and user public key
     * @description Creates a new user in GunDB with error handling
     */
    private createUserWithGunDB;
    /**
     * Retrieves data from a Gun node at the specified path
     * @param path - The path to the Gun node
     * @returns Promise that resolves with the node data or rejects with an error
     */
    get(path: string): Promise<any>;
    /**
     * Stores data in Gun at the root level
     * @param data - The data to store
     * @returns Promise that resolves when data is stored or rejects with an error
     */
    put(data: Record<string, any>): Promise<any>;
    /**
     * Stores data in the authenticated user's space
     * @param data - The data to store in user space
     * @returns Promise that resolves when data is stored or rejects with an error
     */
    userPut(data: Record<string, any>): Promise<any>;
    /**
     * Retrieves data from the authenticated user's space at the specified path
     * @param path - The path to the user data
     * @returns Promise that resolves with the user data or rejects with an error
     */
    userGet(path: string): Promise<any>;
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     */
    emit(eventName: string | symbol, data?: any): boolean;
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     */
    on(eventName: string | symbol, listener: (data: unknown) => void): this;
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     */
    once(eventName: string | symbol, listener: (data: unknown) => void): this;
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     */
    off(eventName: string | symbol, listener: (data: unknown) => void): this;
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     */
    removeAllListeners(eventName?: string | symbol): this;
}
export * from "./types/shogun";
export { GunDB } from "./gun/gun";
export { MetaMask } from "./plugins/metamask/metamask";
export { Stealth } from "./plugins/stealth/stealth";
export type { EphemeralKeyPair, StealthData, StealthAddressResult, LogLevel, LogMessage, } from "./plugins/stealth/types";
export { Webauthn } from "./plugins/webauthn/webauthn";
export { ShogunStorage } from "./storage/storage";
export { ShogunEventEmitter } from "./types/events";
