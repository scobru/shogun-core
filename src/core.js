"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunCore = void 0;
var errorHandler_1 = require("./utils/errorHandler");
// Import managers
var PluginManager_1 = require("./managers/PluginManager");
var AuthManager_1 = require("./managers/AuthManager");
var EventManager_1 = require("./managers/EventManager");
var CoreInitializer_1 = require("./managers/CoreInitializer");
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
var ShogunCore = /** @class */ (function () {
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    function ShogunCore(config) {
        this._user = null;
        this.config = config;
        // Initialize managers
        this.eventManager = new EventManager_1.EventManager();
        this.pluginManager = new PluginManager_1.PluginManager(this);
        this.authManager = new AuthManager_1.AuthManager(this);
        this.coreInitializer = new CoreInitializer_1.CoreInitializer(this);
        // Initialize async components
        this.coreInitializer.initialize(config).catch(function (error) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Error during async initialization:", error);
            }
        });
    }
    Object.defineProperty(ShogunCore.prototype, "gun", {
        /**
         * Access to the Gun instance
         * @returns The Gun instance
         */
        get: function () {
            return this._gun;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShogunCore.prototype, "user", {
        /**
         * Access to the current user
         * @returns The current Gun user instance
         */
        get: function () {
            return this._user;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Gets the current user information
     * @returns Current user object or null
     */
    ShogunCore.prototype.getCurrentUser = function () {
        if (!this.db) {
            return null;
        }
        return this.db.getCurrentUser();
    };
    // *********************************************************************************************************
    // 🔌 PLUGIN MANAGEMENT 🔌
    // *********************************************************************************************************
    /**
     * Registers a plugin with the Shogun SDK
     * @param plugin Plugin instance to register
     * @throws Error if a plugin with the same name is already registered
     */
    ShogunCore.prototype.register = function (plugin) {
        this.pluginManager.register(plugin);
    };
    /**
     * Unregisters a plugin from the Shogun SDK
     * @param pluginName Name of the plugin to unregister
     */
    ShogunCore.prototype.unregister = function (pluginName) {
        this.pluginManager.unregister(pluginName);
    };
    /**
     * Retrieve a registered plugin by name
     * @param name Name of the plugin
     * @returns The requested plugin or undefined if not found
     * @template T Type of the plugin or its public interface
     */
    ShogunCore.prototype.getPlugin = function (name) {
        return this.pluginManager.getPlugin(name);
    };
    /**
     * Get information about all registered plugins
     * @returns Array of plugin information objects
     */
    ShogunCore.prototype.getPluginsInfo = function () {
        return this.pluginManager.getPluginsInfo();
    };
    /**
     * Get the total number of registered plugins
     * @returns Number of registered plugins
     */
    ShogunCore.prototype.getPluginCount = function () {
        return this.pluginManager.getPluginCount();
    };
    /**
     * Check if all plugins are properly initialized
     * @returns Object with initialization status for each plugin
     */
    ShogunCore.prototype.getPluginsInitializationStatus = function () {
        return this.pluginManager.getPluginsInitializationStatus();
    };
    /**
     * Validate plugin system integrity
     * @returns Object with validation results
     */
    ShogunCore.prototype.validatePluginSystem = function () {
        return this.pluginManager.validatePluginSystem();
    };
    /**
     * Attempt to reinitialize failed plugins
     * @returns Object with reinitialization results
     */
    ShogunCore.prototype.reinitializeFailedPlugins = function () {
        return this.pluginManager.reinitializeFailedPlugins();
    };
    /**
     * Check plugin compatibility with current ShogunCore version
     * @returns Object with compatibility information
     */
    ShogunCore.prototype.checkPluginCompatibility = function () {
        return this.pluginManager.checkPluginCompatibility();
    };
    /**
     * Get comprehensive debug information about the plugin system
     * @returns Complete plugin system debug information
     */
    ShogunCore.prototype.getPluginSystemDebugInfo = function () {
        return this.pluginManager.getPluginSystemDebugInfo();
    };
    /**
     * Check if a plugin is registered
     * @param name Name of the plugin to check
     * @returns true if the plugin is registered, false otherwise
     */
    ShogunCore.prototype.hasPlugin = function (name) {
        return this.pluginManager.hasPlugin(name);
    };
    /**
     * Get all plugins of a specific category
     * @param category Category of plugins to filter
     * @returns Array of plugins in the specified category
     */
    ShogunCore.prototype.getPluginsByCategory = function (category) {
        return this.pluginManager.getPluginsByCategory(category);
    };
    /**
     * Get an authentication method plugin by type
     * @param type The type of authentication method
     * @returns The authentication plugin or undefined if not available
     * This is a more modern approach to accessing authentication methods
     */
    ShogunCore.prototype.getAuthenticationMethod = function (type) {
        return this.authManager.getAuthenticationMethod(type);
    };
    // *********************************************************************************************************
    // 🔐 ERROR HANDLER 🔐
    // *********************************************************************************************************
    /**
     * Retrieve recent errors logged by the system
     * @param count - Number of errors to retrieve (default: 10)
     * @returns List of most recent errors
     */
    ShogunCore.prototype.getRecentErrors = function (count) {
        if (count === void 0) { count = 10; }
        return errorHandler_1.ErrorHandler.getRecentErrors(count);
    };
    // *********************************************************************************************************
    // 🔐 AUTHENTICATION
    // *********************************************************************************************************
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunInstance login state
     * and presence of authentication credentials in storage
     */
    ShogunCore.prototype.isLoggedIn = function () {
        return this.authManager.isLoggedIn();
    };
    /**
     * Perform user logout
     * @description Logs out the current user from GunInstance and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    ShogunCore.prototype.logout = function () {
        this.authManager.logout();
    };
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    ShogunCore.prototype.login = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.authManager.login(username, password, pair)];
            });
        });
    };
    /**
     * Login with GunDB pair directly
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly.
     * Emits login event on success.
     */
    ShogunCore.prototype.loginWithPair = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.authManager.loginWithPair(username, pair)];
            });
        });
    };
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
    ShogunCore.prototype.signUp = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.authManager.signUp(username, password, pair)];
            });
        });
    };
    // 📢 EVENT EMITTER 📢
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     * @returns {boolean} Indicates if the event had listeners.
     */
    ShogunCore.prototype.emit = function (eventName, data) {
        return this.eventManager.emit(eventName, data);
    };
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    ShogunCore.prototype.on = function (eventName, listener) {
        this.eventManager.on(eventName, listener);
        return this;
    };
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    ShogunCore.prototype.once = function (eventName, listener) {
        this.eventManager.once(eventName, listener);
        return this;
    };
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     * @returns {this} Returns this instance for method chaining
     */
    ShogunCore.prototype.off = function (eventName, listener) {
        this.eventManager.off(eventName, listener);
        return this;
    };
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     * @returns {this} Returns this instance for method chaining
     */
    ShogunCore.prototype.removeAllListeners = function (eventName) {
        this.eventManager.removeAllListeners(eventName);
        return this;
    };
    /**
     * Set the current authentication method
     * This is used by plugins to indicate which authentication method was used
     * @param method The authentication method used
     */
    ShogunCore.prototype.setAuthMethod = function (method) {
        this.authManager.setAuthMethod(method);
    };
    /**
     * Get the current authentication method
     * @returns The current authentication method or undefined if not set
     */
    ShogunCore.prototype.getAuthMethod = function () {
        return this.authManager.getAuthMethod();
    };
    /**
     * Saves the current user credentials to storage
     */
    ShogunCore.prototype.saveCredentials = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    this.storage.setItem("userCredentials", JSON.stringify(credentials));
                }
                catch (error) {
                    if (typeof console !== "undefined" && console.warn) {
                        console.warn("Failed to save credentials to storage");
                    }
                    if (typeof console !== "undefined" && console.error) {
                        console.error("Error saving credentials:", error);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    ShogunCore.prototype.getIsLoggedIn = function () {
        return !!(this.user && this.user.is);
    };
    ShogunCore.API_VERSION = "^4.0.7";
    return ShogunCore;
}());
exports.ShogunCore = ShogunCore;
// Global declarations are handled in the original core.ts file
// to avoid conflicts, we only set the window properties here
if (typeof window !== "undefined") {
    window.Shogun = function (config) {
        return new ShogunCore(config);
    };
}
exports.default = ShogunCore;
