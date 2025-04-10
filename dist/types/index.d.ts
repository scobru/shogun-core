import { GunDB } from "./gun/gun";
import { Webauthn } from "./plugins/webauthn/webauthn";
import { MetaMask } from "./plugins/metamask/connector/metamask";
import { Stealth } from "./plugins/stealth/stealth";
import { ShogunStorage } from "./storage/storage";
import { IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, LoggingConfig, PluginCategory, DID } from "./types/shogun";
import { IGunInstance } from "gun/types";
import { ethers } from "ethers";
import { ShogunError } from "./utils/errorHandler";
import { IGunUserInstance } from "gun";
import { GunRxJS } from "./gun/rxjs-integration";
import { Observable } from "rxjs";
import { ShogunPlugin } from "./types/plugin";
export { ShogunDID, DIDDocument, DIDResolutionResult, DIDCreateOptions, } from "./plugins/did/DID";
export { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";
export { GunRxJS } from "./gun/rxjs-integration";
export * from "./plugins";
export { ShogunPlugin, PluginManager } from "./types/plugin";
export declare class ShogunCore implements IShogunCore {
    gun: IGunInstance<any>;
    user: IGunUserInstance<any> | null;
    gundb: GunDB;
    did?: DID;
    storage: ShogunStorage;
    private eventEmitter;
    provider?: ethers.Provider;
    config: ShogunSDKConfig;
    rx: GunRxJS;
    webauthn?: Webauthn;
    metamask?: MetaMask;
    stealth?: Stealth;
    private plugins;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * and plugin system.
     */
    constructor(config: ShogunSDKConfig);
    /**
     * Registra i plugin integrati in base alla configurazione
     * @private
     */
    private registerBuiltinPlugins;
    /**
     * Registra un nuovo plugin
     * @param plugin Il plugin da registrare
     */
    register(plugin: ShogunPlugin): void;
    /**
     * Cancella la registrazione di un plugin
     * @param pluginName Nome del plugin da cancellare
     */
    unregister(pluginName: string): void;
    /**
     * Recupera un plugin registrato per nome
     * @param name Nome del plugin
     * @returns Il plugin richiesto o undefined se non trovato
     * @template T Tipo del plugin o dell'interfaccia pubblica del plugin
     */
    getPlugin<T>(name: string): T | undefined;
    /**
     * Verifica se un plugin è registrato
     * @param name Nome del plugin da verificare
     * @returns true se il plugin è registrato, false altrimenti
     */
    hasPlugin(name: string): boolean;
    /**
     * Ottiene tutti i plugin di una determinata categoria
     * @param category Categoria di plugin da filtrare
     * @returns Array di plugin della categoria specificata
     */
    getPluginsByCategory(category: PluginCategory): ShogunPlugin[];
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    observe<T>(path: string | any): Observable<T>;
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
     * @param data - Data to put
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
    once<T>(path: string | any): Observable<T>;
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
     * Recupera gli errori recenti registrati dal sistema
     * @param count - Numero di errori da recuperare
     * @returns Lista degli errori più recenti
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
     * Check if WebAuthn is supported by the browser
     * @returns {boolean} True if WebAuthn is supported, false otherwise
     * @description Verifies if the current browser environment supports WebAuthn authentication
     */
    isWebAuthnSupported(): boolean;
    /**
     * Perform WebAuthn login
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    loginWithWebAuthn(username: string): Promise<AuthResult>;
    /**
     * Register new user with WebAuthn
     * @param username - Username
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    signUpWithWebAuthn(username: string): Promise<AuthResult>;
    /**
     * Login with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using MetaMask wallet credentials after signature verification
     */
    loginWithMetaMask(address: string): Promise<AuthResult>;
    /**
     * Register new user with MetaMask
     * @param address - Ethereum address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using MetaMask wallet credentials after signature verification
     */
    signUpWithMetaMask(address: string): Promise<AuthResult>;
    /**
     * Ensure the current user has a DID associated, creating one if needed
     * @param {DIDCreateOptions} [options] - Optional configuration for DID creation including:
     *   - network: The network to use (default: 'main')
     *   - controller: The controller of the DID (default: user's public key)
     *   - services: Array of service definitions to add to the DID document
     * @returns {Promise<string|null>} The DID identifier string or null if operation fails
     * @description Checks if the authenticated user already has a DID. If not, creates a new one.
     * If the user already has a DID and options are provided, updates the DID document accordingly.
     * @private
     */
    private ensureUserHasDID;
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
     * Set the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     * @returns True if the URL was successfully set
     */
    setRpcUrl(rpcUrl: string): boolean;
    /**
     * Get the currently configured RPC URL
     * @returns The current provider URL or null if not set
     */
    getRpcUrl(): string | null;
    /**
     * Get the main wallet for the authenticated user
     * @returns The user's main Ethereum wallet or null if not available
     * @deprecated Use getPlugin(CorePlugins.WalletManager).getMainWallet() instead
     */
    getMainWallet(): ethers.Wallet | null;
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     */
    emit(eventName: string | symbol, ...args: any[]): boolean;
}
export * from "./types/shogun";
export { GunDB } from "./gun/gun";
export { MetaMask } from "./plugins/metamask/connector/metamask";
export { Stealth } from "./plugins/stealth/stealth";
export { EphemeralKeyPair, StealthData, StealthAddressResult, LogLevel, LogMessage, } from "./types/stealth";
export { Webauthn } from "./plugins/webauthn/webauthn";
export { ShogunStorage } from "./storage/storage";
export { ShogunEventEmitter } from "./events";
