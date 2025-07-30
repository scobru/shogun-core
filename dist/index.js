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
exports.ShogunCore = exports.GunInstance = exports.GunErrors = exports.derive = exports.crypto = exports.GunRxJS = exports.Gun = exports.SEA = void 0;
const eventEmitter_1 = require("./utils/eventEmitter");
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
    static API_VERSION = "^1.6.0";
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
    appToken;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    constructor(config) {
        this.config = config;
        this.storage = new storage_1.ShogunStorage();
        this.eventEmitter = new eventEmitter_1.EventEmitter();
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
        this.appToken = config.appToken;
        try {
            if (config.gunInstance) {
                this._gun = config.gunInstance;
            }
            else {
                this._gun = (0, gundb_1.Gun)({
                    peers: config.peers || [],
                    radisk: false,
                    localStorage: false,
                });
            }
        }
        catch (error) {
            console.error("Error creating Gun instance:", error);
            throw new Error(`Failed to create Gun instance: ${error}`);
        }
        try {
            this.db = new gundb_1.GunInstance(this._gun, config.scope || "");
            this._gun = this.db.gun;
            this.setupGunEventForwarding();
        }
        catch (error) {
            console.error("Error initializing GunInstance:", error);
            throw new Error(`Failed to initialize GunInstance: ${error}`);
        }
        try {
            this._user = this._gun.user();
        }
        catch (error) {
            console.error("Error initializing Gun user:", error);
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this._gun.on("auth", (user) => {
            this._user = this._gun.user();
            this.eventEmitter.emit("auth:login", {
                pub: user.pub,
                alias: user.alias,
                method: "recall",
            });
        });
        this.rx = new gundb_1.GunRxJS(this._gun);
        this.registerBuiltinPlugins(config);
        if (config.plugins?.autoRegister &&
            config.plugins.autoRegister.length > 0) {
            for (const plugin of config.plugins.autoRegister) {
                try {
                    this.register(plugin);
                }
                catch (error) {
                    console.error(`Failed to auto-register plugin ${plugin.name}:`, error);
                }
            }
        }
        if (typeof window !== "undefined") {
            window.ShogunCore = this;
            window.ShogunDB = this.db;
            window.ShogunGun = this.db.gun;
        }
        else if (typeof global !== "undefined") {
            global.ShogunCore = this;
            global.ShogunDB = this.db;
            global.ShogunGun = this.db.gun;
        }
    }
    /**
     * Initialize the SDK asynchronously
     * This method should be called after construction to perform async operations
     */
    async initialize() {
        try {
            await this.db.initialize();
        }
        catch (error) {
            console.error("Error during async initialization:", error);
            throw new Error(`Failed to initialize ShogunCore: ${error}`);
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
            if (config.webauthn?.enabled) {
                const webauthnPlugin = new webauthnPlugin_1.WebauthnPlugin();
                webauthnPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(webauthnPlugin);
            }
            if (config.web3?.enabled) {
                const web3ConnectorPlugin = new web3ConnectorPlugin_1.Web3ConnectorPlugin();
                web3ConnectorPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(web3ConnectorPlugin);
            }
            if (config.nostr?.enabled) {
                const nostrConnectorPlugin = new nostrConnectorPlugin_1.NostrConnectorPlugin();
                nostrConnectorPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(nostrConnectorPlugin);
            }
            if (config.oauth?.enabled) {
                const oauthPlugin = new oauthPlugin_1.OAuthPlugin();
                oauthPlugin._category = shogun_1.PluginCategory.Authentication;
                oauthPlugin.configure(config.oauth);
                this.register(oauthPlugin);
            }
        }
        catch (error) {
            console.error("Error registering builtin plugins:", error);
        }
    }
    // 🔌 PLUGIN MANAGER 🔌
    /**
     * Register a new plugin with the SDK
     * @param plugin The plugin to register
     * @throws Error if a plugin with the same name is already registered
     */
    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name "${plugin.name}" already registered`);
        }
        if (plugin.name === shogun_1.CorePlugins.OAuth) {
            if (!this.appToken) {
                throw new Error("App token is required for OAuth plugin");
            }
            plugin.initialize(this, this.appToken);
        }
        else {
            plugin.initialize(this);
        }
        this.plugins.set(plugin.name, plugin);
    }
    /**
     * Unregister a plugin from the SDK
     * @param pluginName Name of the plugin to unregister
     */
    unregister(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            return;
        }
        if (plugin.destroy) {
            plugin.destroy();
        }
        this.plugins.delete(pluginName);
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
                    login: (username, password) => {
                        this.login(username, password);
                    },
                    signUp: (username, password, confirm) => {
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
            this.eventEmitter.emit("auth:logout", {});
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
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
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
                this.currentAuthMethod = "pair";
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
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
    async signUp(username, password, passwordConfirmation, pair) {
        try {
            if (passwordConfirmation !== undefined &&
                password !== passwordConfirmation &&
                !pair) {
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
            }
            else {
                this.eventEmitter.emit("debug", {
                    action: "signup_failed",
                    username,
                    error: result.error,
                    timestamp: Date.now(),
                });
            }
            return result;
        }
        catch (error) {
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
     * Debug method: Clears all Gun-related data from local and session storage
     * This is useful for debugging and testing purposes
     */
    clearAllStorageData() {
        this.db.clearAllStorageData();
    }
    /**
     * Updates the user's alias (username) in Gun and saves the updated credentials
     * @param newAlias New alias/username to set
     * @returns Promise resolving to update result
     */
    async updateUserAlias(newAlias) {
        try {
            console.log(`[ShogunCore] Updating user alias to: ${newAlias}`);
            if (!this.db) {
                return { success: false, error: "Database not initialized" };
            }
            return await this.db.updateUserAlias(newAlias);
        }
        catch (error) {
            console.error(`[ShogunCore] Error updating user alias:`, error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Saves the current user credentials to storage
     */
    savePair() {
        try {
            console.log(`[ShogunCore] Saving user credentials`);
            if (!this.db) {
                console.warn("[ShogunCore] Database not initialized, cannot save credentials");
                return;
            }
            this.db.savePair();
        }
        catch (error) {
            console.error(`[ShogunCore] Error saving credentials:`, error);
        }
    }
    // esporta la coppia utente come json
    /**
     * Esporta la coppia di chiavi dell'utente corrente come stringa JSON.
     * Utile per backup o migrazione dell'account.
     * @returns {string} La coppia SEA serializzata in formato JSON, oppure stringa vuota se non disponibile.
     */
    exportPair() {
        if (!this.user ||
            !this.user._ ||
            typeof this.user._.sea === "undefined") {
            return "";
        }
        return JSON.stringify(this.user._.sea);
    }
    getIsLoggedIn() {
        return !!(this.user && this.user.is);
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
