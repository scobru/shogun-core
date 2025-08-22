"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunCore = exports.Relay = exports.GunInstance = exports.GunErrors = exports.derive = exports.crypto = exports.GunRxJS = exports.Gun = exports.SEA = void 0;
const events_1 = require("./types/events");
const errorHandler_1 = require("./utils/errorHandler");
const storage_1 = require("./storage/storage");
const shogun_1 = require("./types/shogun");
const webauthnPlugin_1 = require("./plugins/webauthn/webauthnPlugin");
const web3ConnectorPlugin_1 = require("./plugins/web3/web3ConnectorPlugin");
const nostrConnectorPlugin_1 = require("./plugins/nostr/nostrConnectorPlugin");
const oauthPlugin_1 = require("./plugins/oauth/oauthPlugin");
const gundb_1 = require("./gundb");
Object.defineProperty(exports, "Gun", { enumerable: true, get: function () { return gundb_1.Gun; } });
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return gundb_1.SEA; } });
Object.defineProperty(exports, "GunInstance", { enumerable: true, get: function () { return gundb_1.GunInstance; } });
Object.defineProperty(exports, "GunRxJS", { enumerable: true, get: function () { return gundb_1.GunRxJS; } });
Object.defineProperty(exports, "crypto", { enumerable: true, get: function () { return gundb_1.crypto; } });
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return gundb_1.derive; } });
Object.defineProperty(exports, "GunErrors", { enumerable: true, get: function () { return gundb_1.GunErrors; } });
Object.defineProperty(exports, "Relay", { enumerable: true, get: function () { return gundb_1.Relay; } });
__exportStar(require("./utils/errorHandler"), exports);
__exportStar(require("./plugins"), exports);
__exportStar(require("./types/shogun"), exports);
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
class ShogunCore {
    static API_VERSION = "^1.6.6";
    db;
    storage;
    provider;
    config;
    rx;
    _gun;
    _user = null;
    eventEmitter;
    plugins = new Map();
    currentAuthMethod;
    wallets;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    constructor(config) {
        // Polyfill console for environments where it might be missing
        if (typeof console === "undefined") {
            global.console = {
                log: () => { },
                warn: () => { },
                error: () => { },
                info: () => { },
                debug: () => { },
            };
        }
        this.config = config;
        this.storage = new storage_1.ShogunStorage();
        this.eventEmitter = new events_1.ShogunEventEmitter();
        errorHandler_1.ErrorHandler.addListener((error) => {
            this.eventEmitter.emit("error", {
                action: error.code,
                message: error.message,
                type: error.type,
            });
        });
        if (config.authToken) {
            (0, gundb_1.restrictedPut)(gundb_1.Gun, config.authToken);
        }
        try {
            if (config.gunInstance) {
                this._gun = config.gunInstance;
            }
            else {
                this._gun = (0, gundb_1.Gun)({
                    peers: config.peers || [],
                    radisk: config.radisk || false,
                    localStorage: config.localStorage || false,
                });
            }
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error creating Gun instance:", error);
            }
            throw new Error(`Failed to create Gun instance: ${error}`);
        }
        try {
            this.db = new gundb_1.GunInstance(this._gun, config.scope || "");
            this._gun = this.db.gun;
            this.setupGunEventForwarding();
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error initializing GunInstance:", error);
            }
            throw new Error(`Failed to initialize GunInstance: ${error}`);
        }
        try {
            this._user = this._gun.user().recall({ sessionStorage: true });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error initializing Gun user:", error);
            }
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this._gun.on("auth", (user) => {
            this._user = this._gun.user().recall({ sessionStorage: true });
            this.eventEmitter.emit("auth:login", {
                userPub: user.pub,
                method: "password",
            });
        });
        this.rx = new gundb_1.GunRxJS(this._gun);
        this.registerBuiltinPlugins(config);
        // Initialize async components
        this.initialize().catch((error) => {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Error during async initialization:", error);
            }
        });
    }
    /**
     * Initialize the Shogun SDK asynchronously
     * This method handles initialization tasks that require async operations
     */
    async initialize() {
        try {
            await this.db.initialize();
            this.eventEmitter.emit("debug", {
                action: "core_initialized",
                timestamp: Date.now(),
            });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error during Shogun Core initialization:", error);
            }
            throw error;
        }
    }
    /**
     * Access to the Gun instance
     * @returns The Gun instance
     */
    get gun() {
        return this._gun;
    }
    /**
     * Access to the current user
     * @returns The current Gun user instance
     */
    get user() {
        return this._user;
    }
    /**
     * Gets the current user information
     * @returns Current user object or null
     */
    getCurrentUser() {
        if (!this.db) {
            return null;
        }
        return this.db.getCurrentUser();
    }
    /**
     * Setup event forwarding from GunInstance to main event emitter
     * @private
     */
    setupGunEventForwarding() {
        const gunEvents = ["gun:put", "gun:get", "gun:set", "gun:remove"];
        gunEvents.forEach((eventName) => {
            this.db.on(eventName, (data) => {
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
            this.db.on(eventName, (data) => {
                this.eventEmitter.emit(eventName, data);
            });
        });
    }
    /**
     * Register built-in plugins based on configuration
     * @private
     */
    registerBuiltinPlugins(config) {
        try {
            // Register OAuth plugin if configuration is provided
            if (config.oauth) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("OAuth plugin will be registered with provided configuration");
                }
                const oauthPlugin = new oauthPlugin_1.OAuthPlugin();
                if (typeof oauthPlugin.configure === "function") {
                    oauthPlugin.configure(config.oauth);
                }
                this.registerPlugin(oauthPlugin);
            }
            // Register WebAuthn plugin if configuration is provided
            if (config.webauthn) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("WebAuthn plugin will be registered with provided configuration");
                }
                const webauthnPlugin = new webauthnPlugin_1.WebauthnPlugin();
                if (typeof webauthnPlugin.configure === "function") {
                    webauthnPlugin.configure(config.webauthn);
                }
                this.registerPlugin(webauthnPlugin);
            }
            // Register Web3 plugin if configuration is provided
            if (config.web3) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Web3 plugin will be registered with provided configuration");
                }
                const web3Plugin = new web3ConnectorPlugin_1.Web3ConnectorPlugin();
                if (typeof web3Plugin.configure === "function") {
                    web3Plugin.configure(config.web3);
                }
                this.registerPlugin(web3Plugin);
            }
            // Register Nostr plugin if configuration is provided
            if (config.nostr) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Nostr plugin will be registered with provided configuration");
                }
                const nostrPlugin = new nostrConnectorPlugin_1.NostrConnectorPlugin();
                if (typeof nostrPlugin.configure === "function") {
                    nostrPlugin.configure(config.nostr);
                }
                this.registerPlugin(nostrPlugin);
            }
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error registering builtin plugins:", error);
            }
        }
    }
    /**
     * Registers a plugin with the Shogun SDK
     * @param plugin Plugin instance to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin) {
        this.registerPlugin(plugin);
    }
    /**
     * Unregisters a plugin from the Shogun SDK
     * @param pluginName Name of the plugin to unregister
     */
    unregister(pluginName) {
        this.unregisterPlugin(pluginName);
    }
    /**
     * Internal method to register a plugin
     * @param plugin Plugin instance to register
     */
    registerPlugin(plugin) {
        try {
            if (!plugin.name) {
                if (typeof console !== "undefined" && console.error) {
                    console.error("Plugin registration failed: Plugin must have a name");
                }
                return;
            }
            if (this.plugins.has(plugin.name)) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`);
                }
                return;
            }
            // Initialize plugin with core instance
            plugin.initialize(this);
            this.plugins.set(plugin.name, plugin);
            this.eventEmitter.emit("plugin:registered", {
                name: plugin.name,
                version: plugin.version || "unknown",
                category: plugin._category || "unknown",
            });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error registering plugin "${plugin.name}":`, error);
            }
        }
    }
    /**
     * Internal method to unregister a plugin
     * @param name Name of the plugin to unregister
     */
    unregisterPlugin(name) {
        try {
            const plugin = this.plugins.get(name);
            if (!plugin) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn(`Plugin "${name}" not found for unregistration`);
                }
                return false;
            }
            // Destroy plugin if it has a destroy method
            if (typeof plugin.destroy === "function") {
                try {
                    plugin.destroy();
                }
                catch (destroyError) {
                    if (typeof console !== "undefined" && console.error) {
                        console.error(`Error destroying plugin "${name}":`, destroyError);
                    }
                }
            }
            this.plugins.delete(name);
            this.eventEmitter.emit("plugin:unregistered", {
                name: plugin.name,
            });
            return true;
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error unregistering plugin "${name}":`, error);
            }
            return false;
        }
    }
    /**
     * Retrieve a registered plugin by name
     * @param name Name of the plugin
     * @returns The requested plugin or undefined if not found
     * @template T Type of the plugin or its public interface
     */
    getPlugin(name) {
        if (!name || typeof name !== "string") {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Invalid plugin name provided to getPlugin");
            }
            return undefined;
        }
        const plugin = this.plugins.get(name);
        if (!plugin) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn(`Plugin "${name}" not found`);
            }
            return undefined;
        }
        return plugin;
    }
    /**
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    getPluginsInfo() {
        const pluginsInfo = [];
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
    getPluginCount() {
        return this.plugins.size;
    }
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    getPluginsInitializationStatus() {
        const status = {};
        this.plugins.forEach((plugin, name) => {
            try {
                // Verifica se il plugin ha un metodo per controllare l'inizializzazione
                if (typeof plugin.assertInitialized === "function") {
                    plugin.assertInitialized();
                    status[name] = { initialized: true };
                }
                else {
                    // Fallback: verifica se il plugin ha un riferimento al core
                    status[name] = {
                        initialized: !!plugin.core,
                        error: !plugin.core
                            ? "No core reference found"
                            : undefined,
                    };
                }
            }
            catch (error) {
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
    validatePluginSystem() {
        const status = this.getPluginsInitializationStatus();
        const totalPlugins = Object.keys(status).length;
        const initializedPlugins = Object.values(status).filter((s) => s.initialized).length;
        const failedPlugins = Object.entries(status)
            .filter(([_, s]) => !s.initialized)
            .map(([name, _]) => name);
        const warnings = [];
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
    reinitializeFailedPlugins() {
        const status = this.getPluginsInitializationStatus();
        const failedPlugins = Object.entries(status)
            .filter(([_, s]) => !s.initialized)
            .map(([name, _]) => name);
        const success = [];
        const failed = [];
        failedPlugins.forEach((pluginName) => {
            try {
                const plugin = this.plugins.get(pluginName);
                if (!plugin) {
                    failed.push({ name: pluginName, error: "Plugin not found" });
                    return;
                }
                // Reinizializza il plugin
                if (pluginName === shogun_1.CorePlugins.OAuth) {
                    // Rimuovo la chiamata a initialize
                    plugin.initialize(this);
                }
                else {
                    // Rimuovo la chiamata a initialize
                    plugin.initialize(this);
                }
                success.push(pluginName);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                failed.push({ name: pluginName, error: errorMessage });
                if (typeof console !== "undefined" && console.error) {
                    console.error(`[ShogunCore] Failed to reinitialize plugin ${pluginName}:`, error);
                }
            }
        });
        return { success, failed };
    }
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    checkPluginCompatibility() {
        const compatible = [];
        const incompatible = [];
        const unknown = [];
        this.plugins.forEach((plugin) => {
            const pluginInfo = {
                name: plugin.name,
                version: plugin.version || "unknown",
            };
            // Verifica se il plugin ha informazioni di compatibilità
            if (typeof plugin.getCompatibilityInfo === "function") {
                try {
                    const compatibilityInfo = plugin.getCompatibilityInfo();
                    if (compatibilityInfo && compatibilityInfo.compatible) {
                        compatible.push(pluginInfo);
                    }
                    else {
                        incompatible.push({
                            ...pluginInfo,
                            reason: compatibilityInfo?.reason || "Unknown compatibility issue",
                        });
                    }
                }
                catch (error) {
                    unknown.push(pluginInfo);
                }
            }
            else {
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
    getPluginSystemDebugInfo() {
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
                return this.getPlugin(shogun_1.CorePlugins.WebAuthn);
            case "web3":
                return this.getPlugin(shogun_1.CorePlugins.Web3);
            case "nostr":
                return this.getPlugin(shogun_1.CorePlugins.Nostr);
            case "oauth":
                return this.getPlugin(shogun_1.CorePlugins.OAuth);
            case "password":
            default:
                return {
                    login: async (username, password) => {
                        return await this.login(username, password);
                    },
                    signUp: async (username, password, confirm) => {
                        return await this.signUp(username, password, confirm);
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
    getRecentErrors(count = 10) {
        return errorHandler_1.ErrorHandler.getRecentErrors(count);
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
    isLoggedIn() {
        return this.db.isLoggedIn();
    }
    /**
     * Perform user logout
     * @description Logs out the current user from GunInstance and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout() {
        try {
            if (!this.isLoggedIn()) {
                return;
            }
            this.db.logout();
            this.eventEmitter.emit("auth:logout");
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGOUT_FAILED", error instanceof Error ? error.message : "Error during logout", error);
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
    async login(username, password, pair) {
        try {
            if (!this.currentAuthMethod) {
                this.currentAuthMethod = "password";
            }
            const result = await this.db.login(username, password, pair);
            if (result.success) {
                // Include SEA pair in the response
                const seaPair = this.user?._?.sea;
                if (seaPair) {
                    result.sea = seaPair;
                }
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
                    method: this.currentAuthMethod === "pair"
                        ? "password"
                        : this.currentAuthMethod || "password",
                });
            }
            else {
                result.error = result.error || "Wrong user or password";
            }
            return result;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGIN_FAILED", error.message ?? "Unknown error during login", error);
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
    async loginWithPair(pair) {
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
                const seaPair = this.user?._?.sea;
                if (seaPair) {
                    result.sea = seaPair;
                }
                this.currentAuthMethod = "pair";
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
                    method: "password",
                });
            }
            else {
                result.error =
                    result.error || "Authentication failed with provided pair";
            }
            return result;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "PAIR_LOGIN_FAILED", error.message ?? "Unknown error during pair login", error);
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
    async signUp(username, password = "", email = "", pair) {
        try {
            if (!this.db) {
                throw new Error("Database not initialized");
            }
            const result = await this.db.signUp(username, password, pair);
            if (result.success) {
                // Update current authentication method
                this.currentAuthMethod = pair ? "web3" : "password";
                this.eventEmitter.emit("auth:signup", {
                    userPub: result.userPub,
                    username,
                    method: this.currentAuthMethod,
                });
                this.eventEmitter.emit("debug", {
                    action: "signup_success",
                    userPub: result.userPub,
                    method: this.currentAuthMethod,
                });
            }
            else {
                this.eventEmitter.emit("debug", {
                    action: "signup_failed",
                    error: result.error,
                    username,
                });
            }
            return result;
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error during registration for user ${username}:`, error);
            }
            this.eventEmitter.emit("debug", {
                action: "signup_error",
                error: error instanceof Error ? error.message : String(error),
                username,
            });
            return {
                success: false,
                error: `Registration failed: ${error instanceof Error ? error.message : String(error)}`,
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
    emit(eventName, data) {
        return this.eventEmitter.emit(eventName, data);
    }
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    on(eventName, listener) {
        this.eventEmitter.on(eventName, listener);
        return this;
    }
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    once(eventName, listener) {
        this.eventEmitter.once(eventName, listener);
        return this;
    }
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     * @returns {this} Returns this instance for method chaining
     */
    off(eventName, listener) {
        this.eventEmitter.off(eventName, listener);
        return this;
    }
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     * @returns {this} Returns this instance for method chaining
     */
    removeAllListeners(eventName) {
        this.eventEmitter.removeAllListeners(eventName);
        return this;
    }
    /**
     * Set the current authentication method
     * This is used by plugins to indicate which authentication method was used
     * @param method The authentication method used
     */
    setAuthMethod(method) {
        this.currentAuthMethod = method;
    }
    /**
     * Get the current authentication method
     * @returns The current authentication method or undefined if not set
     */
    getAuthMethod() {
        return this.currentAuthMethod;
    }
    /**
     * Saves the current user credentials to storage
     */
    async saveCredentials(credentials) {
        try {
            this.storage.setItem("userCredentials", JSON.stringify(credentials));
        }
        catch (error) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Failed to save credentials to storage");
            }
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error saving credentials:`, error);
            }
        }
    }
    getIsLoggedIn() {
        return !!(this.user && this.user.is);
    }
    /**
     * Changes the username for the currently authenticated user
     * @param newUsername New username to set
     * @returns Promise resolving to the operation result
     */
    async changeUsername(newUsername) {
        try {
            if (!this.db) {
                throw new Error("Database not initialized");
            }
            const result = await this.db.changeUsername(newUsername);
            if (result.success) {
                this.eventEmitter.emit("auth:username_changed", {
                    oldUsername: result.oldUsername,
                    newUsername: result.newUsername,
                    userPub: this.getCurrentUser()?.pub,
                });
                this.eventEmitter.emit("debug", {
                    action: "username_changed",
                    oldUsername: result.oldUsername,
                    newUsername: result.newUsername,
                });
            }
            else {
                this.eventEmitter.emit("debug", {
                    action: "username_change_failed",
                    error: result.error,
                    newUsername,
                });
            }
            return result;
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error(`Error changing username to ${newUsername}:`, error);
            }
            this.eventEmitter.emit("debug", {
                action: "username_change_error",
                error: error instanceof Error ? error.message : String(error),
                newUsername,
            });
            return {
                success: false,
                error: `Username change failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
exports.ShogunCore = ShogunCore;
exports.default = ShogunCore;
if (typeof window !== "undefined") {
    window.ShogunCoreClass = ShogunCore;
}
if (typeof window !== "undefined") {
    window.initShogun = (config) => {
        const instance = new ShogunCore(config);
        window.ShogunCore = instance;
        return instance;
    };
}
