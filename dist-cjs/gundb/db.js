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
                // Clear any pending auth operations
                if (cat.auth) {
                    cat.auth = null;
                }
            }
            try {
                user.leave();
            }
            catch (leaveError) {
                // Ignore leave errors
            }
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
        console.log("[DB] Signup validation:", validation);
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
        // If the caller provides a key pair, try direct auth first (pair-based signup)
        // Gun's API doesn't natively allow us to register with a pair directly,
        // but we can try creating and then authenticating immediately with the pair,
        // to allow for direct access for known keys.
        if (pair) {
            // Try to directly authenticate with the pair FIRST
            // If this user already exists and the pair is valid, just log in
            try {
                const loginResult = await new Promise((resolve) => {
                    let callbackInvoked = false;
                    user.auth(pair, (ack) => {
                        if (callbackInvoked) {
                            return;
                        }
                        callbackInvoked = true;
                        if (ack.err) {
                            // Could not login with pair, try to create user with username/password
                            resolve({ success: false, error: ack.err });
                            return;
                        }
                        const userPub = user?.is?.pub;
                        if (!userPub) {
                            this.resetAuthState();
                            resolve({ success: false, error: "No userPub available" });
                            return;
                        }
                        this.user = user;
                        const alias = user?.is?.alias;
                        const userPair = user?._?.sea;
                        this.saveCredentials({
                            alias: alias || normalizedUsername,
                            pair: pair ?? userPair,
                            userPub: userPub,
                        });
                        resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                    });
                });
                // If we got a successful result, return it
                if (loginResult && loginResult.success) {
                    return loginResult;
                }
                // If pair auth failed, continue to create user with username/password
            }
            catch (e) {
                // fallback to create user
                // (continue below)
            }
        }
        console.log("[DB] Falling back to classic username/password account creation");
        // Fallback to classic username/password account creation
        const result = await new Promise((resolve) => {
            let callbackInvoked = false;
            user.create(normalizedUsername, password, (createAck) => {
                if (callbackInvoked) {
                    return;
                }
                console.log("[DB] Signup callback received:", JSON.stringify(createAck));
                // Check for error: ack.err or ack.ok !== 0 means error
                if (createAck.err ||
                    (createAck.ok !== undefined && createAck.ok !== 0)) {
                    callbackInvoked = true;
                    this.resetAuthState();
                    resolve({ success: false, error: createAck.err || "Signup failed" });
                    return;
                }
                // After create, we need to authenticate to get the user fully logged in
                // Use ack.pub if available for the userPub
                const userPub = createAck.pub;
                if (!userPub) {
                    callbackInvoked = true;
                    this.resetAuthState();
                    resolve({
                        success: false,
                        error: "No userPub available from signup",
                    });
                    return;
                }
                // Now authenticate with the username/password to complete the login
                user.auth(normalizedUsername, password, (authAck) => {
                    if (callbackInvoked) {
                        return;
                    }
                    callbackInvoked = true;
                    if (authAck.err) {
                        this.resetAuthState();
                        resolve({
                            success: false,
                            error: authAck.err || "Authentication after signup failed",
                        });
                        return;
                    }
                    // Verify user is authenticated
                    const authenticatedUserPub = user?.is?.pub;
                    if (!authenticatedUserPub) {
                        this.resetAuthState();
                        resolve({
                            success: false,
                            error: "User not authenticated after signup",
                        });
                        return;
                    }
                    this.user = user;
                    const alias = user?.is?.alias;
                    const userPair = user?._?.sea;
                    try {
                        this.saveCredentials({
                            alias: alias || normalizedUsername,
                            pair: pair ?? userPair,
                            userPub: authenticatedUserPub,
                        });
                    }
                    catch (saveError) {
                        // Ignore save errors
                    }
                    const sea = user?._?.sea;
                    resolve({
                        success: true,
                        userPub: authenticatedUserPub,
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
                });
            });
        });
        return result;
    }
    /**
     * Login with username and password
     * Based on Gun.js user().auth() - https://deepwiki.com/amark/gun/6.1-user-authentication
     */
    async login(username, password, pair) {
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
        console.log("[DB] Login with username:", normalizedUsername);
        return new Promise((resolve) => {
            if (pair) {
                user.auth(pair, (ack) => {
                    if (ack.err) {
                        this.resetAuthState();
                        resolve({ success: false, error: ack.err });
                        return;
                    }
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
                });
            }
            else {
                user.auth(normalizedUsername, password, (ack) => {
                    if (ack.err) {
                        this.resetAuthState();
                        resolve({ success: false, error: ack.err });
                        return;
                    }
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
                });
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
     * Get current user's public key
     * @returns {string | null} User's public key or null if not logged in
     */
    getUserPub() {
        try {
            const user = this.gun.user();
            return user?.is?.pub || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Login with SEA pair directly
     * @param username - Username for identification
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly without password
     */
    async loginWithPair(username, pair) {
        // Validate pair structure
        if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
            return {
                success: false,
                error: "Invalid pair structure - missing required keys",
            };
        }
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
        console.log("[DB] Login with pair for username:", normalizedUsername);
        return new Promise((resolve) => {
            user.auth(pair, (ack) => {
                if (ack.err) {
                    this.resetAuthState();
                    resolve({ success: false, error: ack.err });
                    return;
                }
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
            });
        });
    }
    /**
     * Login with SEA pair
     */
    // Legacy method - kept for backward compatibility
    async loginWithPairLegacy(username, pair) {
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
