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
 * GunDB configuration constants.
 * @internal
 */
const CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
    },
};
/**
 * DataBase
 *
 * Manages GunDB user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 */
class DataBase {
    /**
     * Constructs a new DataBase instance connected to a GunDB instance.
     * @param gun The main GunDB instance.
     * @param core Optionally, the root Gun instance (unused in this context).
     * @param sea Optional cryptography (Gun SEA) instance; will be auto-discovered if not provided.
     * @throws If gun or gun.user() is not provided.
     */
    constructor(gun, core, sea) {
        /** Cached user instance or `null` if not logged in */
        this.user = null;
        /** Registered callbacks for auth state changes */
        this.onAuthCallbacks = [];
        /** Whether the database instance has been destroyed */
        this._isDestroyed = false;
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        this.core = core;
        if (!gun) {
            throw new Error('Gun instance is required but was not provided');
        }
        if (typeof gun.user !== 'function') {
            throw new Error('Gun instance is invalid: gun.user is not a function');
        }
        this.gun = gun;
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.subscribeToAuthEvents();
        this.crypto = crypto;
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
        this.usernamesNode = this.gun.get('usernames');
        console.log('[DB] DataBase initialization completed');
    }
    /**
     * Initialize the database instance.
     */
    initialize() {
        // Database is already initialized in constructor
    }
    /**
     * Internal: subscribe to GunDB "auth" events and notify listeners.
     * Listeners are invoked on authentication status change.
     * @internal
     */
    subscribeToAuthEvents() {
        this.gun.on('auth', (ack) => {
            if (ack.err) {
                console.error('[DB] Auth event error:', ack.err);
            }
            else {
                this.notifyAuthListeners(ack.sea?.pub || '');
            }
        });
    }
    /**
     * Internal: notify all onAuth callbacks with current user.
     * @param pub User's public key (pub).
     * @internal
     */
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((cb) => cb(user));
    }
    /**
     * Listen for authentication/sign-in events (login, logout, etc).
     * @param callback Function to call with new user instance.
     * @returns Function to remove the registered callback.
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
     * Check if a user is currently logged in (there is a valid session).
     * @returns `true` if logged in; otherwise `false`.
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
     * Attempt to restore a previously saved session from sessionStorage.
     * @returns Object indicating success, error, and userPub if restored.
     */
    restoreSession() {
        try {
            if (typeof sessionStorage === 'undefined') {
                return { success: false, error: 'sessionStorage not available' };
            }
            const sessionData = sessionStorage.getItem('gunSessionData');
            if (!sessionData) {
                return { success: false, error: 'No saved session' };
            }
            const session = JSON.parse(sessionData);
            if (!session.userPub) {
                return { success: false, error: 'Invalid session data' };
            }
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                sessionStorage.removeItem('gunSessionData');
                return { success: false, error: 'Session expired' };
            }
            // Verify session restoration
            const user = this.gun.user();
            if (user.is && user.is.pub === session.userPub) {
                this.user = user;
                return { success: true, userPub: session.userPub };
            }
            return { success: false, error: 'Session verification failed' };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Log out the current user, clear local state and remove session from storage.
     */
    logout() {
        try {
            const wasLoggedIn = !!this.user;
            const currentUser = this.gun.user();
            if (currentUser && currentUser.is) {
                currentUser.leave();
            }
            this.user = null;
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('gunSessionData');
            }
            // Emit auth:logout event if core is available and user was logged in
            if (wasLoggedIn && this.core && typeof this.core.emit === 'function') {
                this.core.emit('auth:logout', undefined);
            }
        }
        catch (error) {
            console.error('[DB] Error during logout:', error);
        }
    }
    /**
     * Validate that a provided password meets minimum length requirements.
     * @param password Password string to validate.
     * @returns Object indicating validity and, if invalid, an error.
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
     * Validate a signup request's username, password, and/or cryptographic pair.
     * @param username Username string.
     * @param password Password string.
     * @param pair Optional cryptographic SEA pair.
     * @returns Object with validation status and optional error.
     */
    validateSignupCredentials(username, password, pair) {
        if (!username || username.length < 1) {
            return {
                valid: false,
                error: 'Username must be more than 0 characters long',
            };
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return {
                valid: false,
                error: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
            };
        }
        if (pair) {
            if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                return { valid: false, error: 'Invalid pair provided' };
            }
            return { valid: true };
        }
        return this.validatePasswordStrength(password);
    }
    /**
     * Ensures that an alias/username is available in GunDB for registration.
     * @param alias Username to check.
     * @param timeout Timeout in milliseconds (default 5000ms).
     * @throws If the alias is already taken.
     */
    async ensureAliasAvailable(alias, timeout = 5000) {
        const available = await this.isAliasAvailable(alias, timeout);
        if (!available) {
            throw new Error(`Alias "${alias}" is already registered in Gun`);
        }
    }
    /**
     * Checks if a given alias/username is available on GunDB.
     * @param alias Username to check for availability.
     * @param timeout Timeout in ms (default: 5000).
     * @returns Promise resolving to `true` if available; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    async isAliasAvailable(alias, timeout = 5000) {
        if (typeof alias !== 'string' || !alias.trim()) {
            throw new Error('Alias must be a non-empty string');
        }
        const normalizedAlias = alias.trim().toLowerCase();
        return new Promise((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                reject(new Error('Timeout while checking alias availability'));
            }, timeout);
            this.usernamesNode.get(normalizedAlias).once((existingPub) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                resolve(!existingPub);
            });
        });
    }
    /**
     * Checks if a given alias/username is taken on GunDB.
     * @param alias Username to check for availability.
     * @returns Promise resolving to `true` if taken; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    async isAliasTaken(alias) {
        return new Promise((resolve, reject) => {
            // Check if username exists by looking up ~@username
            this.gun.get(`~@${alias}`).once((user) => {
                // If user exists, alias is taken (return true)
                // If user is null/undefined, alias is available (return false)
                resolve(!!user);
            });
        });
    }
    /**
     * Register a new alias (username) → public key mapping on GunDB.
     * @param alias The username/alias to register.
     * @param userPub The user's public key.
     * @param timeout Timeout in ms (default 5000).
     * @throws If alias/userPub is invalid or the alias cannot be registered.
     */
    async registerAlias(alias, userPub, timeout = 5000) {
        if (!alias || !alias.trim()) {
            throw new Error('Alias must be provided for registration');
        }
        if (!userPub) {
            throw new Error('userPub must be provided for alias registration');
        }
        const normalizedAlias = alias.trim().toLowerCase();
        const available = await this.isAliasAvailable(normalizedAlias, timeout).catch((error) => {
            console.error('[DB] Alias availability check failed:', error);
            throw error;
        });
        const taken = await this.isAliasTaken(normalizedAlias);
        if (taken) {
            throw new Error(`Alias "${normalizedAlias}" is already taken`);
        }
        if (!available) {
            throw new Error(`Alias "${normalizedAlias}" is no longer available for registration`);
        }
        await new Promise((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled)
                    return;
                settled = true;
                reject(new Error('Timeout while registering alias'));
            }, timeout);
            this.usernamesNode.get(normalizedAlias).put(userPub, (ack) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                if (ack && ack.err) {
                    reject(new Error(String(ack.err)));
                    return;
                }
                resolve();
            });
        }).catch((error) => {
            console.error('[DB] Failed to register alias:', error);
            throw error;
        });
    }
    /**
     * Reset gun.user() authentication state and clear cached user.
     * @internal
     */
    resetAuthState() {
        try {
            const user = this.gun.user();
            if (user && user._) {
                const cat = user._;
                cat.ing = false;
                cat.auth = null;
                cat.act = null;
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
     * Assemble a standard AuthResult object after a successful login.
     * @param username Resulting username.
     * @param userPub Public key (pub) for logged-in user.
     * @returns AuthResult.
     * @internal
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
     * Save credentials for the current session to sessionStorage, if available.
     * @param userInfo The credentials and user identity to store.
     */
    saveCredentials(userInfo) {
        try {
            if (typeof sessionStorage !== 'undefined') {
                const sessionInfo = {
                    username: userInfo.alias,
                    pair: userInfo.pair,
                    userPub: userInfo.userPub,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                };
                sessionStorage.setItem('gunSessionData', JSON.stringify(sessionInfo));
            }
        }
        catch (error) {
            console.error('[DB] Error saving credentials:', error);
        }
    }
    /**
     * Register and authenticate a new user account.
     * @param username The username to create/account for.
     * @param password The user's password.
     * @param pair Optional cryptographic pair (for `auth` instead of password).
     * @returns SignUpResult Promise.
     */
    async signUp(username, password, pair) {
        const validation = this.validateSignupCredentials(username, password, pair);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
        if (pair) {
            try {
                const loginResult = await new Promise((resolve) => {
                    let callbackInvoked = false;
                    user.auth(pair, (ack) => {
                        if (callbackInvoked) {
                            return;
                        }
                        callbackInvoked = true;
                        if (ack.err) {
                            resolve({ success: false, error: ack.err });
                            return;
                        }
                        const userPub = user?.is?.pub;
                        if (!userPub) {
                            this.resetAuthState();
                            resolve({ success: false, error: 'No userPub available' });
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
                        // Emit auth:signup event if core is available (pair-based signup)
                        if (this.core && typeof this.core.emit === 'function') {
                            this.core.emit('auth:signup', {
                                userPub: userPub,
                                username: normalizedUsername,
                                method: 'pair',
                            });
                        }
                        resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                    });
                });
                if (loginResult && loginResult.success) {
                    return loginResult;
                }
            }
            catch (e) {
                // fallback to create user
                // (continue below)
            }
        }
        try {
            await this.ensureAliasAvailable(normalizedUsername);
        }
        catch (aliasError) {
            return {
                success: false,
                error: aliasError instanceof Error ? aliasError.message : String(aliasError),
            };
        }
        const result = await new Promise((resolve) => {
            let callbackInvoked = false;
            user.create(normalizedUsername, password, (createAck) => {
                if (callbackInvoked) {
                    return;
                }
                if (createAck.err ||
                    (createAck.ok !== undefined && createAck.ok !== 0)) {
                    callbackInvoked = true;
                    this.resetAuthState();
                    resolve({ success: false, error: createAck.err || 'Signup failed' });
                    return;
                }
                const userPub = createAck.pub;
                if (!userPub) {
                    callbackInvoked = true;
                    this.resetAuthState();
                    resolve({
                        success: false,
                        error: 'No userPub available from signup',
                    });
                    return;
                }
                user.auth(normalizedUsername, password, async (authAck) => {
                    if (callbackInvoked) {
                        return;
                    }
                    callbackInvoked = true;
                    if (authAck.err) {
                        this.resetAuthState();
                        resolve({
                            success: false,
                            error: authAck.err || 'Authentication after signup failed',
                        });
                        return;
                    }
                    const authenticatedUserPub = user?.is?.pub;
                    if (!authenticatedUserPub) {
                        this.resetAuthState();
                        resolve({
                            success: false,
                            error: 'User not authenticated after signup',
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
                    try {
                        await this.registerAlias(alias || normalizedUsername, authenticatedUserPub);
                    }
                    catch (registerError) {
                        console.error('[DB] Alias registration failed:', registerError);
                    }
                    // Emit auth:signup event if core is available
                    if (this.core && typeof this.core.emit === 'function') {
                        this.core.emit('auth:signup', {
                            userPub: authenticatedUserPub,
                            username: normalizedUsername,
                            method: pair ? 'pair' : 'password',
                        });
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
     * Sign in (authenticate) as an existing user by username/password or SEA pair.
     * @param username Username to log in as.
     * @param password User's password (or "" if using pair).
     * @param pair Optional cryptographic SEA pair.
     * @returns AuthResult Promise.
     */
    async login(username, password, pair) {
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
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
                        resolve({ success: false, error: 'No userPub available' });
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
                    // Emit auth:login event if core is available (pair-based login)
                    if (this.core && typeof this.core.emit === 'function') {
                        this.core.emit('auth:login', {
                            userPub: userPub,
                            username: alias || normalizedUsername,
                            method: 'pair',
                        });
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
                        resolve({ success: false, error: 'No userPub available' });
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
                    // Emit auth:login event if core is available (password-based login)
                    if (this.core && typeof this.core.emit === 'function') {
                        this.core.emit('auth:login', {
                            userPub: userPub,
                            username: alias || normalizedUsername,
                            method: 'password',
                        });
                    }
                    resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                });
            }
        });
    }
    /**
     * Returns the currently authenticated user's public key and Gun user instance, if logged in.
     * @returns Object containing `pub` (public key) and optionally `user`, or `null`.
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
     * Get current user's public key.
     * @returns User's public key or null if not logged in.
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
     * Authenticate using a SEA pair directly (no password required).
     * @param username The user's username for identification (not cryptographically enforced).
     * @param pair GunDB SEA pair for authentication.
     * @returns Promise with authentication result.
     * @description Authenticates user using a GunDB pair directly without password.
     */
    async loginWithPair(username, pair) {
        // Validate pair structure
        if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
            return {
                success: false,
                error: 'Invalid pair structure - missing required keys',
            };
        }
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.gun.user();
        console.log('[DB] Login with pair for username:', normalizedUsername);
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
                    resolve({ success: false, error: 'No userPub available' });
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
                // Emit auth:login event if core is available (loginWithPair)
                if (this.core && typeof this.core.emit === 'function') {
                    this.core.emit('auth:login', {
                        userPub: userPub,
                        username: alias || normalizedUsername,
                        method: 'pair',
                    });
                }
                resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
            });
        });
    }
    /**
     * Legacy API: Sign in using a username and SEA pair (password parameter is unused).
     * @param username Username to sign in as.
     * @param pair SEA key pair.
     * @returns AuthResult Promise.
     */
    async loginWithPairLegacy(username, pair) {
        return this.login(username, '', pair);
    }
    /**
     * Returns the bound RxJS GunDB helper (reactive streams).
     * @returns RxJS instance.
     */
    rx() {
        return this._rxjs;
    }
    /**
     * Tears down the DataBase instance and performs cleanup of all resources/listeners.
     * No further actions should be performed on this instance after destruction.
     */
    destroy() {
        if (this._isDestroyed)
            return;
        console.log('[DB] Destroying DataBase instance...');
        this._isDestroyed = true;
        this.onAuthCallbacks.length = 0;
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
        console.log('[DB] DataBase instance destroyed');
    }
    /**
     * Aggressively clean up authentication state and session. Typically used for error recovery.
     */
    aggressiveAuthCleanup() {
        console.log('🧹 Performing aggressive auth cleanup...');
        this.resetAuthState();
        this.logout();
        console.log('✓ Aggressive auth cleanup completed');
    }
    /**
     * Register an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    /**
     * Remove an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    /**
     * Register an event handler for a single event occurrence.
     * @param event Event name.
     * @param listener Listener function.
     */
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    /**
     * Emit a custom event.
     * @param event Event name.
     * @param data Optional associated data.
     * @returns `true` if listeners were notified; otherwise `false`.
     */
    emit(event, data) {
        return this.eventEmitter.emit(event, data);
    }
}
exports.DataBase = DataBase;
var derive_1 = require("./derive");
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return __importDefault(derive_1).default; } });
