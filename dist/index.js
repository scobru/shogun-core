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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunEventEmitter = exports.ShogunStorage = exports.Webauthn = exports.Stealth = exports.Web3Connector = exports.GunDB = exports.ShogunCore = exports.RelayVerifier = void 0;
const gun_1 = require("./gundb/gun");
const rxjs_integration_1 = require("./gundb/rxjs-integration");
const eventEmitter_1 = require("./utils/eventEmitter");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./utils/errorHandler");
const storage_1 = require("./storage/storage");
const shogun_1 = require("./types/shogun");
const webauthnPlugin_1 = require("./plugins/webauthn/webauthnPlugin");
const web3ConnectorPlugin_1 = require("./plugins/ethereum/web3ConnectorPlugin");
const stealthPlugin_1 = require("./plugins/stealth-address/stealthPlugin");
const hdwalletPlugin_1 = require("./plugins/bip32/hdwalletPlugin");
const nostrConnectorPlugin_1 = require("./plugins/bitcoin/nostrConnectorPlugin");
const gun_2 = __importDefault(require("gun"));
var utils_1 = require("./contracts/utils");
Object.defineProperty(exports, "RelayVerifier", { enumerable: true, get: function () { return utils_1.RelayVerifier; } });
__exportStar(require("./utils/errorHandler"), exports);
__exportStar(require("./gundb/rxjs-integration"), exports);
__exportStar(require("./plugins"), exports);
__exportStar(require("./contracts/entryPoint"), exports);
__exportStar(require("./contracts/utils"), exports);
__exportStar(require("./contracts/registry"), exports);
__exportStar(require("./contracts/relay"), exports);
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
class ShogunCore {
    /** Current API version - used for deprecation warnings and migration guidance */
    static API_VERSION = "2.0.0";
    /** Gun database instance - access through gundb.gun for consistency */
    _gun;
    /** Gun user instance */
    _user = null;
    /** GunDB wrapper - the primary interface for Gun operations */
    gundb;
    /** Storage implementation */
    storage;
    /** Event emitter for SDK events */
    eventEmitter;
    /** Ethereum provider */
    provider;
    /** SDK configuration */
    config;
    /** RxJS integration */
    rx;
    /** Plugin registry */
    plugins = new Map();
    Gun;
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunDB connection,
     * and plugin system.
     */
    constructor(config) {
        (0, logger_1.log)("Initializing ShogunSDK");
        this.config = config;
        if (config.logging) {
            (0, logger_1.configureLogging)(config.logging);
            (0, logger_1.log)("Logging configured with custom settings");
        }
        this.storage = new storage_1.ShogunStorage();
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        this.Gun = gun_2.default;
        errorHandler_1.ErrorHandler.addListener((error) => {
            this.eventEmitter.emit("error", {
                action: error.code,
                message: error.message,
                type: error.type,
            });
        });
        if (config.gunInstance) {
            this._gun = config.gunInstance;
        }
        else {
            this._gun = this.Gun();
        }
        // Then initialize GunDB with the Gun instance
        this.gundb = new gun_1.GunDB(this._gun, config.scope || "");
        this._gun = this.gundb.gun;
        (0, logger_1.log)("Initialized Gun instance");
        this._user = this.gun.user().recall({ sessionStorage: true });
        this.rx = new rxjs_integration_1.GunRxJS(this.gun);
        this.registerBuiltinPlugins(config);
        if (config.plugins?.autoRegister &&
            config.plugins.autoRegister.length > 0) {
            for (const plugin of config.plugins.autoRegister) {
                try {
                    this.register(plugin);
                    (0, logger_1.log)(`Auto-registered plugin: ${plugin.name}`);
                }
                catch (error) {
                    (0, logger_1.logError)(`Failed to auto-register plugin ${plugin.name}:`, error);
                }
            }
        }
        (0, logger_1.log)("ShogunSDK initialized!");
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
     * Register built-in plugins based on configuration
     * @private
     */
    registerBuiltinPlugins(config) {
        try {
            // Authentication plugins group
            if (config.webauthn?.enabled) {
                const webauthnPlugin = new webauthnPlugin_1.WebauthnPlugin();
                webauthnPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(webauthnPlugin);
                (0, logger_1.log)("Webauthn plugin registered");
            }
            if (config.ethereum?.enabled) {
                const web3ConnectorPlugin = new web3ConnectorPlugin_1.Web3ConnectorPlugin();
                web3ConnectorPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(web3ConnectorPlugin);
                (0, logger_1.log)("Web3Connector plugin registered");
            }
            if (config.bitcoin?.enabled) {
                const nostrConnectorPlugin = new nostrConnectorPlugin_1.NostrConnectorPlugin();
                nostrConnectorPlugin._category = shogun_1.PluginCategory.Authentication;
                this.register(nostrConnectorPlugin);
                (0, logger_1.log)("NostrConnector plugin registered");
            }
            // Privacy plugins group
            if (config.stealthAddress?.enabled) {
                const stealthPlugin = new stealthPlugin_1.StealthPlugin();
                stealthPlugin._category = shogun_1.PluginCategory.Privacy;
                this.register(stealthPlugin);
                (0, logger_1.log)("Stealth plugin registered");
            }
            // Wallet plugins group
            if (config.bip32?.enabled) {
                const hdwalletPlugin = new hdwalletPlugin_1.HDWalletPlugin();
                hdwalletPlugin._category = shogun_1.PluginCategory.Wallet;
                this.register(hdwalletPlugin);
                (0, logger_1.log)("HDWallet plugin registered");
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error registering builtin plugins:", error);
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
        plugin.initialize(this);
        this.plugins.set(plugin.name, plugin);
        (0, logger_1.log)(`Registered plugin: ${plugin.name}`);
    }
    /**
     * Unregister a plugin from the SDK
     * @param pluginName Name of the plugin to unregister
     */
    unregister(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            (0, logger_1.log)(`Plugin "${pluginName}" not found, nothing to unregister`);
            return;
        }
        if (plugin.destroy) {
            plugin.destroy();
        }
        this.plugins.delete(pluginName);
        (0, logger_1.log)(`Unregistered plugin: ${pluginName}`);
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
            case "metamask":
                return this.getPlugin(shogun_1.CorePlugins.Ethereum);
            case "bitcoin":
                return this.getPlugin(shogun_1.CorePlugins.Bitcoin);
            case "password":
            default:
                // Default authentication is provided by the core class
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
        (0, logger_1.configureLogging)(config);
        (0, logger_1.log)("Logging reconfigured with new settings");
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
        return this.gundb.isLoggedIn();
    }
    /**
     * Perform user logout
     * @description Logs out the current user from GunDB and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout() {
        try {
            if (!this.isLoggedIn()) {
                (0, logger_1.log)("Logout ignored: user not authenticated");
                return;
            }
            this.gundb.logout();
            this.eventEmitter.emit("auth:logout", {});
            (0, logger_1.log)("Logout completed successfully");
        }
        catch (error) {
            // Use centralized error handler
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
    async login(username, password) {
        (0, logger_1.log)("Login");
        try {
            (0, logger_1.log)(`Login attempt for user: ${username}`);
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
            const loginPromiseWithTimeout = new Promise(async (resolve) => {
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
                    }
                    else {
                        // First resolve the success result
                        resolve({
                            success: true,
                            userPub: loginResult.userPub,
                            username: loginResult.username,
                        });
                        // Then try to access wallet credentials after auth state is updated
                        try {
                            const hdwalletPlugin = this.getPlugin(shogun_1.CorePlugins.Bip32);
                            if (hdwalletPlugin) {
                                const mainWallet = hdwalletPlugin.getMainWalletCredentials();
                                this.storage.setItem("main-wallet", JSON.stringify(mainWallet));
                            }
                        }
                        catch (walletError) {
                            // Just log the error but don't fail the login
                            (0, logger_1.logError)("Error accessing wallet credentials after login:", walletError);
                        }
                    }
                }
                catch (error) {
                    clearTimeout(timeoutId);
                    resolve({
                        success: false,
                        error: error.message || "Login error",
                    });
                }
            });
            const result = await loginPromiseWithTimeout;
            if (result.success) {
                this.eventEmitter.emit("auth:login", {
                    userPub: result.userPub ?? "",
                });
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
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param passwordConfirmation - Password confirmation
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    async signUp(username, password, passwordConfirmation) {
        (0, logger_1.log)("Sign up");
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
            // Emit a debug event to monitor the flow
            this.eventEmitter.emit("debug", {
                action: "signup_start",
                username,
                timestamp: Date.now(),
            });
            (0, logger_1.log)(`Attempting user registration: ${username}`);
            const timeoutDuration = this.config?.timeouts?.signup ?? 30000; // Default timeout of 30 seconds
            const signupPromiseWithTimeout = new Promise(async (resolve) => {
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
                    }
                    else {
                        // Emit a debug event to monitor the flow in case of failure
                        this.eventEmitter.emit("debug", {
                            action: "signup_failed",
                            username,
                            error: result.error,
                            timestamp: Date.now(),
                        });
                    }
                    resolve(result);
                }
                catch (error) {
                    clearTimeout(timeoutId);
                    resolve({
                        success: false,
                        error: error.message || "Registration error",
                    });
                }
            });
            return await signupPromiseWithTimeout;
        }
        catch (error) {
            (0, logger_1.logError)(`Error during registration for user ${username}:`, error);
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
}
exports.ShogunCore = ShogunCore;
// Export all types
__exportStar(require("./types/shogun"), exports);
// Export classes
var gun_3 = require("./gundb/gun");
Object.defineProperty(exports, "GunDB", { enumerable: true, get: function () { return gun_3.GunDB; } });
var web3Connector_1 = require("./plugins/ethereum/web3Connector");
Object.defineProperty(exports, "Web3Connector", { enumerable: true, get: function () { return web3Connector_1.Web3Connector; } });
var stealth_1 = require("./plugins/stealth-address/stealth");
Object.defineProperty(exports, "Stealth", { enumerable: true, get: function () { return stealth_1.Stealth; } });
var webauthn_1 = require("./plugins/webauthn/webauthn");
Object.defineProperty(exports, "Webauthn", { enumerable: true, get: function () { return webauthn_1.Webauthn; } });
var storage_2 = require("./storage/storage");
Object.defineProperty(exports, "ShogunStorage", { enumerable: true, get: function () { return storage_2.ShogunStorage; } });
var events_1 = require("./types/events");
Object.defineProperty(exports, "ShogunEventEmitter", { enumerable: true, get: function () { return events_1.ShogunEventEmitter; } });
