import { GunDB } from "./gun/gun";
import { EventEmitter } from "./utils/eventEmitter";
import { ShogunStorage } from "./storage/storage";
import { PluginCategory, CorePlugins, } from "./types/shogun";
import { log, logError, configureLogging } from "./utils/logger";
import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "./utils/errorHandler";
import { GunRxJS } from "./gun/rxjs-integration";
import { WebauthnPlugin } from "./plugins/webauthn/webauthnPlugin";
import { MetaMaskPlugin } from "./plugins/metamask/metamaskPlugin";
import { StealthPlugin } from "./plugins/stealth/stealthPlugin";
import { DIDPlugin } from "./plugins/did/didPlugin";
import { WalletPlugin } from "./plugins/wallet/walletPlugin";
export { ShogunDID } from "./plugins/did/DID";
export { ErrorHandler, ErrorType } from "./utils/errorHandler";
export { GunRxJS } from "./gun/rxjs-integration";
export * from "./plugins";
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
export class ShogunCore {
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * and plugin system.
     */
    constructor(config) {
        /** Plugin registry */
        this.plugins = new Map();
        log("Initializing ShogunSDK");
        this.config = config;
        if (config.logging) {
            configureLogging(config.logging);
            log("Logging configured with custom settings");
        }
        this.storage = new ShogunStorage();
        this.eventEmitter = new EventEmitter();
        ErrorHandler.addListener((error) => {
            this.eventEmitter.emit("error", {
                action: error.code,
                message: error.message,
                type: error.type,
            });
        });
        if (!config.gundb) {
            config.gundb = {};
            log("No GunDB configuration provided, using defaults");
        }
        if (config.gundb.authToken) {
            const tokenPreview = config.gundb.authToken;
            log(`Auth token from config: ${tokenPreview}`);
        }
        else {
            log("No auth token in config");
        }
        const gundbConfig = {
            peers: config.gundb?.peers,
            websocket: config.gundb?.websocket ?? false,
            localStorage: config.gundb?.localStorage ?? false,
            radisk: config.gundb?.radisk ?? false,
            authToken: config.gundb?.authToken,
            multicast: config.gundb?.multicast ?? false,
            axe: config.gundb?.axe ?? false,
        };
        this.gundb = new GunDB(gundbConfig);
        this.gun = this.gundb.getGun();
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.rx = new GunRxJS(this.gun);
        if (config.providerUrl) {
            this.provider = new ethers.JsonRpcProvider(config.providerUrl);
            log(`Using configured provider URL: ${config.providerUrl}`);
        }
        else {
            // Default provider (can be replaced as needed)
            this.provider = ethers.getDefaultProvider("mainnet");
            log("WARNING: Using default Ethereum provider. For production use, configure a specific provider URL.");
        }
        this.registerBuiltinPlugins(config);
        if (config.plugins?.autoRegister &&
            config.plugins.autoRegister.length > 0) {
            for (const plugin of config.plugins.autoRegister) {
                try {
                    this.register(plugin);
                    log(`Auto-registered plugin: ${plugin.name}`);
                }
                catch (error) {
                    logError(`Failed to auto-register plugin ${plugin.name}:`, error);
                }
            }
        }
        log("ShogunSDK initialized!");
    }
    /**
     * Register built-in plugins based on configuration
     * @private
     */
    registerBuiltinPlugins(config) {
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
            // Privacy plugins group
            if (config.stealth?.enabled) {
                const stealthPlugin = new StealthPlugin();
                stealthPlugin._category = PluginCategory.Privacy;
                this.register(stealthPlugin);
                log("Stealth plugin registered");
            }
            // Identity plugins group
            if (config.did?.enabled) {
                const didPlugin = new DIDPlugin();
                didPlugin._category = PluginCategory.Identity;
                this.register(didPlugin);
                log("DID plugin registered");
            }
            // Wallet plugins group
            if (config.walletManager?.enabled) {
                const walletPlugin = new WalletPlugin();
                walletPlugin._category = PluginCategory.Wallet;
                this.register(walletPlugin);
                log("Wallet plugin registered");
            }
        }
        catch (error) {
            logError("Error registering builtin plugins:", error);
        }
    }
    // *********************************************************************************************************
    // 🔌 PLUGIN MANAGER 🔌
    // *********************************************************************************************************
    /**
     * Register a new plugin with the SDK
     * @param plugin The plugin to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin) {
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
    unregister(pluginName) {
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
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Check if a plugin is registered
     * @param name Name of the plugin to check
     * @returns true if the plugin is registered, false otherwise
     */
    hasPlugin(name) {
        return this.plugins.has(name);
    }
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    getPluginsByCategory(category) {
        const result = [];
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
    getAuthenticationMethod(type) {
        switch (type) {
            case "webauthn":
                return this.getPlugin(CorePlugins.WebAuthn);
            case "metamask":
                return this.getPlugin(CorePlugins.MetaMask);
            case "password":
            default:
                // Default authentication is provided by the core class
                return {
                    login: (username, password) => this.login(username, password),
                    signUp: (username, password, confirm) => this.signUp(username, password, confirm),
                };
        }
    }
    // *********************************************************************************************************
    // 🔄 RXJS INTEGRATION 🔄
    // *********************************************************************************************************
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    observe(path) {
        return this.rx.observe(path);
    }
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match(path, matchFn) {
        return this.rx.match(path, matchFn);
    }
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxPut(path, data) {
        return this.rx.put(path, data);
    }
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    rxSet(path, data) {
        return this.rx.set(path, data);
    }
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    onceObservable(path) {
        return this.rx.once(path);
    }
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute(sources, computeFn) {
        return this.rx.compute(sources, computeFn);
    }
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    rxUserPut(path, data) {
        return this.rx.userPut(path, data);
    }
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser(path) {
        return this.rx.observeUser(path);
    }
    // *********************************************************************************************************
    // 🔐 ERROR HANDLER 🔐
    // *********************************************************************************************************
    /**
     * Retrieve recent errors logged by the system
     * @param count - Number of errors to retrieve (default: 10)
     * @returns List of most recent errors
     */
    getRecentErrors(count = 10) {
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
    configureLogging(config) {
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
    isLoggedIn() {
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
    logout() {
        try {
            if (!this.isLoggedIn()) {
                log("Logout ignored: user not authenticated");
                return;
            }
            this.gundb.logout();
            this.eventEmitter.emit("auth:logout", {});
            log("Logout completed successfully");
        }
        catch (error) {
            // Use centralized error handler
            ErrorHandler.handle(ErrorType.AUTHENTICATION, "LOGOUT_FAILED", error instanceof Error ? error.message : "Error during logout", error);
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
    async login(username, password) {
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
            const loginPromise = new Promise((resolve) => {
                this.gundb.gun.user().auth(username, password, (ack) => {
                    if (ack.err) {
                        log(`Login error: ${ack.err}`);
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    }
                    else {
                        const user = this.gundb.gun.user();
                        if (!user.is) {
                            resolve({
                                success: false,
                                error: "Login failed: user not authenticated",
                            });
                        }
                        else {
                            log("Login completed successfully");
                            const userPub = user.is?.pub || "";
                            resolve({
                                success: true,
                                userPub,
                                username,
                            });
                        }
                    }
                });
            });
            // Timeout after a configurable interval (default 15 seconds)
            const timeoutDuration = this.config?.timeouts?.login ?? 15000;
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Login timeout",
                    });
                }, timeoutDuration);
            });
            const result = await Promise.race([loginPromise, timeoutPromise]);
            if (result.success) {
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
                });
                try {
                    const did = await this.ensureUserHasDID();
                    if (did) {
                        result.did = did;
                    }
                }
                catch (didError) {
                    logError("Error ensuring DID after login:", didError);
                }
            }
            return result;
        }
        catch (error) {
            ErrorHandler.handle(ErrorType.AUTHENTICATION, "LOGIN_FAILED", error.message ?? "Unknown error during login", error);
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
    async signUp(username, password, passwordConfirmation) {
        log("Sign up");
        try {
            if (!username || !password) {
                return {
                    success: false,
                    error: "Username and password are required",
                };
            }
            if (passwordConfirmation !== undefined &&
                password !== passwordConfirmation) {
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
            const signupPromise = new Promise((resolve) => {
                this.gundb.gun.user().create(username, password, (ack) => {
                    if (ack.err) {
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    }
                    else {
                        this.gundb.gun.user().auth(username, password, (loginAck) => {
                            if (loginAck.err) {
                                resolve({
                                    success: false,
                                    error: "Registration completed but login failed",
                                });
                            }
                            else {
                                const user = this.gundb.gun.user();
                                if (!user.is) {
                                    resolve({
                                        success: false,
                                        error: "Registration completed but user not authenticated",
                                    });
                                }
                                else {
                                    resolve({
                                        success: true,
                                        userPub: user.is?.pub || "",
                                        username: username || "",
                                    });
                                }
                            }
                        });
                    }
                });
            });
            const timeoutDuration = this.config?.timeouts?.signup ?? 20000;
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: false,
                        error: "Registration timeout",
                    });
                }, timeoutDuration);
            });
            // Use Promise.race to handle timeout
            const result = await Promise.race([signupPromise, timeoutPromise]);
            if (result.success) {
                this.eventEmitter.emit("auth:signup", {
                    userPub: result.userPub ?? "",
                    username,
                });
                try {
                    const did = await this.ensureUserHasDID();
                    if (did) {
                        log(`Created DID for new user: ${did}`);
                        result.did = did;
                    }
                }
                catch (didError) {
                    logError("Error creating DID for new user:", didError);
                }
            }
            return result;
        }
        catch (error) {
            logError(`Error during registration for user ${username}:`, error);
            return {
                success: false,
                error: error.message ?? "Unknown error during registration",
            };
        }
    }
    // *********************************************************************************************************
    // 🤫 PRIVATE HELPER METHODS 🤫
    // *********************************************************************************************************
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
    async ensureUserHasDID(options) {
        try {
            const didPlugin = this.getPlugin("did");
            if (!didPlugin) {
                log("DID plugin not available, cannot ensure DID");
                return null;
            }
            return await didPlugin.ensureUserHasDID(options);
        }
        catch (error) {
            logError("Error ensuring user has DID:", error);
            return null;
        }
    }
    /**
     * Create a new user with GunDB
     * @param username - Username
     * @param password - Password
     * @returns {Promise<{success: boolean, userPub?: string, error?: string}>} Promise with success status and user public key
     * @description Creates a new user in GunDB with error handling
     */
    createUserWithGunDB(username, password) {
        log(`Ensuring user exists with GunDB: ${username}`);
        return new Promise(async (resolve) => {
            try {
                const authUser = () => {
                    return new Promise((resolveAuth) => {
                        try {
                            this.gundb.logout();
                        }
                        catch (e) {
                            /* ignore logout errors */
                        }
                        this.gundb.gun.user().auth(username, password, (ack) => {
                            if (ack.err) {
                                resolveAuth({ err: ack.err });
                            }
                            else {
                                const user = this.gundb.gun.user();
                                const userPub = user.is?.pub || "";
                                if (!user.is || !userPub) {
                                    resolveAuth({
                                        err: "Authentication failed after apparent success.",
                                    });
                                }
                                else {
                                    resolveAuth({ pub: userPub });
                                }
                            }
                        });
                    });
                };
                const createUser = () => {
                    return new Promise((resolveCreate) => {
                        try {
                            this.gundb.logout();
                        }
                        catch (e) {
                            /* ignore logout errors */
                        }
                        this.gundb.gun.user().create(username, password, (ack) => {
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
                log(`Login failed (${loginResult.err ?? "unknown reason"}), attempting user creation...`);
                const createResult = await createUser();
                if (createResult.err) {
                    log(`User creation error: ${createResult.err}`);
                    resolve({
                        success: false,
                        error: `User creation failed: ${createResult.err}`,
                    });
                    return;
                }
                log(`User created successfully, attempting login again for confirmation...`);
                loginResult = await authUser();
                if (loginResult.pub) {
                    log(`Post-creation login successful! User pub: ${loginResult.pub}`);
                    resolve({
                        success: true,
                        userPub: loginResult.pub,
                    });
                }
                else {
                    logError(`Post-creation login failed unexpectedly: ${loginResult.err}`);
                    resolve({
                        success: false,
                        error: `User created, but subsequent login failed: ${loginResult.err}`,
                    });
                }
            }
            catch (error) {
                const errorMsg = error.message ?? "Unknown error during user existence check";
                logError(`Error in createUserWithGunDB: ${errorMsg}`, error);
                resolve({
                    success: false,
                    error: errorMsg,
                });
            }
        });
    }
    // *********************************************************************************************************
    // 🔫 GUN ACTIONS 🔫
    // *********************************************************************************************************
    /**
     * Retrieves data from a Gun node at the specified path
     * @param path - The path to the Gun node
     * @returns Promise that resolves with the node data or rejects with an error
     */
    get(path) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.get(path).once((data) => {
                if (data.err) {
                    reject(data.err);
                }
                else {
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
    put(data) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.put(data, (ack) => {
                if (ack.err) {
                    reject(ack.err);
                }
                else {
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
    userPut(data) {
        return new Promise((resolve, reject) => {
            this.gundb.gun.user().put(data, (ack) => {
                if (ack.err) {
                    reject(ack.err);
                }
                else {
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
    userGet(path) {
        return new Promise((resolve, reject) => {
            this.gundb.gun
                .user()
                .get(path)
                .once((data) => {
                if (data.err) {
                    reject(data.err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    // *********************************************************************************************************
    // 🔌 PROVIDER 🔌
    // *********************************************************************************************************
    /**
     * Set the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     * @returns True if the URL was successfully set
     */
    setRpcUrl(rpcUrl) {
        try {
            if (!rpcUrl) {
                log("Invalid RPC URL provided");
                return false;
            }
            // Update the provider if it's already initialized
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            log(`RPC URL updated to: ${rpcUrl}`);
            return true;
        }
        catch (error) {
            logError("Failed to set RPC URL", error);
            return false;
        }
    }
    /**
     * Get the currently configured RPC URL
     * @returns The current provider URL or null if not set
     */
    getRpcUrl() {
        // Access the provider URL if available
        return this.provider instanceof ethers.JsonRpcProvider
            ? (this.provider.connection?.url ?? null)
            : null;
    }
    // *********************************************************************************************************
    // 📢 EVENT EMITTER 📢
    // *********************************************************************************************************
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     */
    emit(eventName, data) {
        return this.eventEmitter.emit(eventName, data);
    }
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     */
    on(eventName, listener) {
        this.eventEmitter.on(eventName, listener);
        return this;
    }
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     */
    once(eventName, listener) {
        this.eventEmitter.once(eventName, listener);
        return this;
    }
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     */
    off(eventName, listener) {
        this.eventEmitter.off(eventName, listener);
        return this;
    }
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     */
    removeAllListeners(eventName) {
        this.eventEmitter.removeAllListeners(eventName);
        return this;
    }
}
/** Current API version - used for deprecation warnings and migration guidance */
ShogunCore.API_VERSION = "2.0.0";
// Export all types
export * from "./types/shogun";
// Export classes
export { GunDB } from "./gun/gun";
export { MetaMask } from "./plugins/metamask/metamask";
export { Stealth } from "./plugins/stealth/stealth";
export { Webauthn } from "./plugins/webauthn/webauthn";
export { ShogunStorage } from "./storage/storage";
export { ShogunEventEmitter } from "./events";
