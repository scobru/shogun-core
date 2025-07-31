import { ShogunEventMap } from "./types/events";
import { ShogunError } from "./utils/errorHandler";
import { ShogunStorage } from "./storage/storage";
import { IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, PluginCategory, AuthMethod, Wallets } from "./types/shogun";
import { ethers } from "ethers";
import { ShogunPlugin } from "./types/plugin";
import { Gun, SEA, IGunUserInstance, IGunInstance, GunInstance, DeriveOptions, GunDataEventData, GunPeerEventData, GunRxJS, crypto, derive, GunErrors } from "./gundb";
import { ISEAPair } from "gun";
export type { IGunUserInstance, IGunInstance, GunDataEventData, GunPeerEventData, DeriveOptions, };
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
export declare class ShogunCore implements IShogunCore {
    static readonly API_VERSION = "^1.6.6";
    db: GunInstance;
    storage: ShogunStorage;
    provider?: ethers.Provider;
    config: ShogunSDKConfig;
    rx: GunRxJS;
    private _gun;
    private _user;
    private readonly eventEmitter;
    private readonly plugins;
    private currentAuthMethod?;
    wallets: Wallets | undefined;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    constructor(config: ShogunSDKConfig);
    /**
     * Initialize the SDK asynchronously
     * This method should be called after construction to perform async operations
     */
    initialize(): Promise<void>;
    /**
     * Access to the Gun instance
     * @returns The Gun instance
     */
    get gun(): IGunInstance<any>;
    /**
     * Access to the current user
     * @returns The current Gun user instance
     */
    get user(): IGunUserInstance<any> | null;
    /**
     * Setup event forwarding from GunInstance to main event emitter
     * @private
     */
    private setupGunEventForwarding;
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
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    getPluginsInfo(): Array<{
        name: string;
        version: string;
        category?: PluginCategory;
        description?: string;
    }>;
    /**
     * Get the total number of registered plugins
     * @returns Number of registered plugins
     */
    getPluginCount(): number;
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    getPluginsInitializationStatus(): Record<string, {
        initialized: boolean;
        error?: string;
    }>;
    /**
     * Validate plugin system integrity
     * @returns Object with validation results
     */
    validatePluginSystem(): {
        totalPlugins: number;
        initializedPlugins: number;
        failedPlugins: string[];
        warnings: string[];
    };
    /**
     * Attempt to reinitialize failed plugins
     * @returns Object with reinitialization results
     */
    reinitializeFailedPlugins(): {
        success: string[];
        failed: Array<{
            name: string;
            error: string;
        }>;
    };
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    checkPluginCompatibility(): {
        compatible: Array<{
            name: string;
            version: string;
        }>;
        incompatible: Array<{
            name: string;
            version: string;
            reason: string;
        }>;
        unknown: Array<{
            name: string;
            version: string;
        }>;
    };
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
        initializationStatus: Record<string, {
            initialized: boolean;
            error?: string;
        }>;
        validation: {
            totalPlugins: number;
            initializedPlugins: number;
            failedPlugins: string[];
            warnings: string[];
        };
        compatibility: {
            compatible: Array<{
                name: string;
                version: string;
            }>;
            incompatible: Array<{
                name: string;
                version: string;
                reason: string;
            }>;
            unknown: Array<{
                name: string;
                version: string;
            }>;
        };
    };
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
    getAuthenticationMethod(type: AuthMethod): unknown;
    /**
     * Retrieve recent errors logged by the system
     * @param count - Number of errors to retrieve (default: 10)
     * @returns List of most recent errors
     */
    getRecentErrors(count?: number): ShogunError[];
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunInstance login state
     * and presence of authentication credentials in storage
     */
    isLoggedIn(): boolean;
    /**
     * Perform user logout
     * @description Logs out the current user from GunInstance and emits logout event.
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
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Login with GunDB pair directly
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly.
     * Emits login event on success.
     */
    loginWithPair(pair: ISEAPair): Promise<AuthResult>;
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
    signUp(username: string, password: string, passwordConfirmation?: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     * @returns {boolean} Indicates if the event had listeners.
     */
    emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K]): boolean;
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    on<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    once<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     * @returns {this} Returns this instance for method chaining
     */
    off<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     * @returns {this} Returns this instance for method chaining
     */
    removeAllListeners(eventName?: string | symbol): this;
    /**
     * Set the current authentication method
     * This is used by plugins to indicate which authentication method was used
     * @param method The authentication method used
     */
    setAuthMethod(method: AuthMethod): void;
    /**
     * Get the current authentication method
     * @returns The current authentication method or undefined if not set
     */
    getAuthMethod(): AuthMethod | undefined;
    /**
     * Debug method: Clears all Gun-related data from local and session storage
     * This is useful for debugging and testing purposes
     */
    clearAllStorageData(): void;
    /**
     * Updates the user's alias (username) in Gun and saves the updated credentials
     * @param newAlias New alias/username to set
     * @returns Promise resolving to update result
     */
    updateUserAlias(newAlias: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Saves the current user credentials to storage
     */
    savePair(): void;
    /**
     * Esporta la coppia di chiavi dell'utente corrente come stringa JSON.
     * Utile per backup o migrazione dell'account.
     * @returns {string} La coppia SEA serializzata in formato JSON, oppure stringa vuota se non disponibile.
     */
    exportPair(): string;
    getIsLoggedIn(): boolean;
}
export default ShogunCore;
declare global {
    interface Window {
        initShogun: (config: ShogunSDKConfig) => ShogunCore;
        ShogunCore: ShogunCore;
        ShogunCoreClass: typeof ShogunCore;
    }
}
