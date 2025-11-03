"use strict";
/**
 * GunDB - Simplified database wrapper for Gun.js
 * Provides only essential signup and login functionality
 * Based on Gun.js User Authentication: https://deepwiki.com/amark/gun/6.1-user-authentication
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.derive = exports.GunErrors = exports.crypto = exports.RxJS = exports.DataBase = void 0;
const rxjs_1 = require("./rxjs");
Object.defineProperty(exports, "RxJS", { enumerable: true, get: function () { return rxjs_1.RxJS; } });
const eventEmitter_1 = require("../utils/eventEmitter");
const GunErrors = __importStar(require("./errors"));
exports.GunErrors = GunErrors;
const crypto = __importStar(require("./crypto"));
exports.crypto = crypto;
/**
 * Configuration constants
 */
const CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
    },
    TIMEOUT: 30000, // 30 seconds
};
class DataBase {
    constructor(gun, appScope = "shogun", core, sea) {
        this.user = null;
        this.onAuthCallbacks = [];
        this._isDestroyed = false;
        console.log("[DB] Initializing DataBase");
        // Initialize event emitter
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        // Validate Gun instance
        if (!gun) {
            throw new Error("Gun instance is required but was not provided");
        }
        if (typeof gun.user !== "function") {
            throw new Error("Gun instance is invalid: gun.user is not a function");
        }
        this.gun = gun;
        console.log("[DB] Gun instance validated");
        // Recall user session if available
        this.user = this.gun.user().recall({ sessionStorage: true });
        console.log("[DB] User recall completed");
        this.subscribeToAuthEvents();
        console.log("[DB] Auth events subscribed");
        this.crypto = crypto;
        // Get SEA from gun instance or global
        this.sea = sea || null;
        if (!this.sea) {
            if (this.gun.SEA) {
                this.sea = this.gun.SEA;
            }
            else if (globalThis.Gun?.SEA) {
                this.sea = globalThis.Gun.SEA;
            }
            else if (globalThis.SEA) {
                this.sea = globalThis.SEA;
            }
        }
        this._rxjs = new rxjs_1.RxJS(this.gun);
        this.node = this.gun.get(appScope);
        console.log("[DB] DataBase initialization completed");
    }
    /**
     * Initialize with app scope
     */
    initialize(appScope = "shogun") {
        console.log(`[DB] Initializing with appScope: ${appScope}`);
        this.node = this.gun.get(appScope);
        console.log("[DB] App scope node initialized");
    }
    /**
     * Subscribe to Gun auth events
     */
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            if (ack.err) {
                console.error("[DB] Auth event error:", ack.err);
            }
            else {
                this.notifyAuthListeners(ack.sea?.pub || "");
            }
        });
    }
    /**
     * Notify all auth callbacks
     */
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((cb) => cb(user));
    }
    /**
     * Register authentication callback
     */
    onAuth(callback) {
        this.onAuthCallbacks.push(callback);
        const user = this.gun.user();
        if (user && user.is)
            callback(user);
        return () => {
            const i = this.onAuthCallbacks.indexOf(callback);
            if (i !== -1)
                this.onAuthCallbacks.splice(i, 1);
        };
    }
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        try {
            const user = this.gun.user();
            return !!(user && user.is && user.is.pub);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Restore session from storage
     */
    restoreSession() {
        try {
            if (typeof sessionStorage === "undefined") {
                return { success: false, error: "sessionStorage not available" };
            }
            const sessionData = sessionStorage.getItem("gunSessionData");
            if (!sessionData) {
                return { success: false, error: "No saved session" };
            }
            const session = JSON.parse(sessionData);
            if (!session.userPub) {
                return { success: false, error: "Invalid session data" };
            }
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                sessionStorage.removeItem("gunSessionData");
                return { success: false, error: "Session expired" };
            }
            // Verify session restoration
            const user = this.gun.user();
            if (user.is && user.is.pub === session.userPub) {
                this.user = user;
                return { success: true, userPub: session.userPub };
            }
            return { success: false, error: "Session verification failed" };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Logout user
     */
    logout() {
        try {
            const currentUser = this.gun.user();
            if (currentUser && currentUser.is) {
                currentUser.leave();
            }
            this.user = null;
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.removeItem("gunSessionData");
            }
        }
        catch (error) {
            console.error("[DB] Error during logout:", error);
        }
    }
    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        if (password.length < CONFIG.PASSWORD.MIN_LENGTH) {
            return {
                valid: false,
                error: `Password must be at least ${CONFIG.PASSWORD.MIN_LENGTH} characters long`,
            };
        }
        return { valid: true };
    }
    /**
     * Validate signup credentials
     */
    validateSignupCredentials(username, password, pair) {
        if (!username || username.length < 1) {
            return {
                valid: false,
                error: "Username must be more than 0 characters long",
            };
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return {
                valid: false,
                error: "Username can only contain letters, numbers, dots, underscores, and hyphens",
            };
        }
        if (pair) {
            if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                return { valid: false, error: "Invalid pair provided" };
            }
            return { valid: true };
        }
        return this.validatePasswordStrength(password);
    }
    /**
     * Reset authentication state
     */
    resetAuthState() {
        try {
            const user = this.gun.user();
            if (user && user._) {
                const cat = user._;
                // Reset Gun's internal auth state
                cat.ing = false;
                cat.auth = null;
                cat.act = null;
            }
            user.leave();
            this.user = null;
        }
        catch (e) {
            // Ignore
        }
    }
    /**
     * Build login result
     */
    buildLoginResult(username, userPub) {
        const seaPair = this.gun.user()?._?.sea;
        return {
            success: true,
            userPub,
            username,
            sea: seaPair
                ? {
                    pub: seaPair.pub,
                    priv: seaPair.priv,
                    epub: seaPair.epub,
                    epriv: seaPair.epriv,
                }
                : undefined,
        };
    }
    /**
     * Save credentials to session storage
     */
    saveCredentials(userInfo) {
        try {
            if (typeof sessionStorage !== "undefined") {
                const sessionInfo = {
                    username: userInfo.alias,
                    pair: userInfo.pair,
                    userPub: userInfo.userPub,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                };
                sessionStorage.setItem("gunSessionData", JSON.stringify(sessionInfo));
            }
        }
        catch (error) {
            console.error("[DB] Error saving credentials:", error);
        }
    }
    /**
     * Sign up a new user
     * Based on Gun.js user().create() - https://deepwiki.com/amark/gun/6.1-user-authentication
     */
    async signUp(username, password, pair) {
        const validation = this.validateSignupCredentials(username, password, pair);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.resetAuthState();
                resolve({ success: false, error: "Signup timeout" });
            }, CONFIG.TIMEOUT);
            const callback = (ack) => {
                clearTimeout(timeoutId);
                if (ack.err) {
                    this.resetAuthState();
                    resolve({ success: false, error: ack.err });
                    return;
                }
                const user = this.gun.user();
                const userPub = user?.is?.pub;
                if (!userPub) {
                    this.resetAuthState();
                    resolve({ success: false, error: "No userPub available" });
                    return;
                }
                this.user = user;
                const sea = user?._?.sea;
                resolve({
                    success: true,
                    userPub,
                    username: normalizedUsername,
                    isNewUser: true,
                    sea: sea
                        ? {
                            pub: sea.pub,
                            priv: sea.priv,
                            epub: sea.epub,
                            epriv: sea.epriv,
                        }
                        : undefined,
                });
            };
            if (pair) {
                this.gun.user().auth(pair, callback);
            }
            else {
                this.gun.user().create(normalizedUsername, password, callback);
            }
        });
    }
    /**
     * Login with username and password
     * Based on Gun.js user().auth() - https://deepwiki.com/amark/gun/6.1-user-authentication
     */
    async login(username, password, pair) {
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.resetAuthState();
                resolve({ success: false, error: "Login timeout" });
            }, CONFIG.TIMEOUT);
            const callback = (ack) => {
                clearTimeout(timeoutId);
                if (ack.err) {
                    this.resetAuthState();
                    resolve({ success: false, error: ack.err });
                    return;
                }
                const user = this.gun.user();
                const userPub = user?.is?.pub;
                if (!userPub) {
                    this.resetAuthState();
                    resolve({ success: false, error: "No userPub available" });
                    return;
                }
                this.user = user;
                const alias = user?.is?.alias;
                const userPair = user?._?.sea;
                try {
                    this.saveCredentials({
                        alias: alias || normalizedUsername,
                        pair: pair ?? userPair,
                        userPub: userPub,
                    });
                }
                catch (saveError) {
                    // Ignore save errors
                }
                resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
            };
            if (pair) {
                this.gun.user().auth(pair, callback);
            }
            else {
                this.gun.user().auth(normalizedUsername, password, callback);
            }
        });
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        try {
            const user = this.gun.user();
            if (user && user.is && user.is.pub) {
                return {
                    pub: user.is.pub,
                    user: user,
                };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Login with SEA pair
     */
    async loginWithPair(username, pair) {
        return this.login(username, "", pair);
    }
    /**
     * Get RxJS module
     */
    rx() {
        return this._rxjs;
    }
    /**
     * Destroy database instance
     */
    destroy() {
        if (this._isDestroyed)
            return;
        console.log("[DB] Destroying DataBase instance...");
        this._isDestroyed = true;
        this.onAuthCallbacks.length = 0;
        // Clear event listeners
        this.eventEmitter.removeAllListeners();
        if (this.user) {
            try {
                this.user.leave();
            }
            catch (error) {
                // Ignore
            }
            this.user = null;
        }
        this._rxjs = undefined;
        console.log("[DB] DataBase instance destroyed");
    }
    /**
     * Aggressive auth cleanup (kept for compatibility with tests)
     */
    aggressiveAuthCleanup() {
        console.log("🧹 Performing aggressive auth cleanup...");
        this.resetAuthState();
        this.logout();
        console.log("✓ Aggressive auth cleanup completed");
    }
    /**
     * Event emitter methods for CoreInitializer compatibility
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    emit(event, data) {
        return this.eventEmitter.emit(event, data);
    }
}
exports.DataBase = DataBase;
var derive_1 = require("./derive");
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return __importDefault(derive_1).default; } });
