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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseHolster = void 0;
const rxjs_holster_1 = require("./rxjs-holster");
const eventEmitter_1 = require("../utils/eventEmitter");
const crypto = __importStar(require("./crypto"));
/**
 * Holster configuration constants.
 * @internal
 */
const CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
    },
};
/**
 * DataBaseHolster
 *
 * Manages Holster user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 * This is a native Holster implementation that doesn't require Gun compatibility layer.
 */
class DataBaseHolster {
    /**
     * Constructs a new DataBaseHolster instance connected to a Holster instance.
     * @param holster The main Holster instance.
     * @param sea Optional cryptography (Holster SEA) instance; will be auto-discovered if not provided.
     * @throws If holster or holster.user() is not provided.
     */
    constructor(holster, core, sea) {
        /** Cached user instance or `null` if not logged in */
        this.user = null;
        /** Registered callbacks for auth state changes */
        this.onAuthCallbacks = [];
        /** Whether the database instance has been destroyed */
        this._isDestroyed = false;
        /** Polling interval for auth state changes */
        this.authPollInterval = null;
        /** Last known user state */
        this.lastUserState = null;
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        this.core = core;
        if (!holster) {
            throw new Error('Holster instance is required but was not provided');
        }
        if (typeof holster.user !== 'function') {
            throw new Error('Holster instance is invalid: holster.user is not a function');
        }
        this.holster = holster;
        // Holster's recall() doesn't take options, but it already checks sessionStorage first
        const userInstance = this.holster.user();
        userInstance.recall();
        this.user = userInstance.is ? userInstance : null;
        this.subscribeToAuthEvents();
        this.crypto = crypto;
        this.sea = sea || null;
        if (!this.sea) {
            if (this.holster.SEA) {
                this.sea = this.holster.SEA;
            }
            else if (globalThis.Holster?.SEA) {
                this.sea = globalThis.Holster.SEA;
            }
            else if (globalThis.SEA) {
                this.sea = globalThis.SEA;
            }
        }
        this._rxjs = new rxjs_holster_1.RxJSHolster(this.holster);
        // Create usernames node using Holster's API
        this.usernamesNode = this.holster.get('usernames');
        console.log('[DB] DataBaseHolster initialization completed');
    }
    /**
     * Initialize the database instance.
     */
    initialize() {
        // Database is already initialized in constructor
    }
    /**
     * Internal: subscribe to Holster auth state changes and notify listeners.
     * Since Holster doesn't have native auth events, we poll for changes.
     * @internal
     */
    subscribeToAuthEvents() {
        // Poll for user state changes every 100ms
        this.authPollInterval = setInterval(() => {
            const user = this.holster.user();
            const currentState = user.is;
            if (currentState !== this.lastUserState) {
                const previousState = this.lastUserState;
                this.lastUserState = currentState;
                if (currentState) {
                    // User logged in
                    this.notifyAuthListeners(currentState.pub || '');
                    // Emit auth:login event if core is available and user just logged in
                    if (this.core &&
                        typeof this.core.emit === 'function' &&
                        !previousState) {
                        this.core.emit('auth:login', {
                            userPub: currentState.pub || '',
                            username: currentState.username || '',
                            method: 'password',
                        });
                    }
                }
                else {
                    // User logged out
                    this.notifyAuthListeners('');
                    // Emit auth:logout event if core is available and user just logged out
                    if (this.core &&
                        typeof this.core.emit === 'function' &&
                        previousState) {
                        this.core.emit('auth:logout', undefined);
                    }
                }
            }
        }, 100);
    }
    /**
     * Internal: notify all onAuth callbacks with current user.
     * @param pub User's public key (pub).
     * @internal
     */
    notifyAuthListeners(pub) {
        const user = this.holster.user();
        this.onAuthCallbacks.forEach((cb) => cb(user));
    }
    /**
     * Listen for authentication/sign-in events (login, logout, etc).
     * @param callback Function to call with new user instance.
     * @returns Function to remove the registered callback.
     */
    onAuth(callback) {
        this.onAuthCallbacks.push(callback);
        const user = this.holster.user();
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
            const user = this.holster.user();
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
            const user = this.holster.user();
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
            const currentUser = this.holster.user();
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
     * Ensures that an alias/username is available in Holster for registration.
     */
    async ensureAliasAvailable(alias, timeout = 5000) {
        const available = await this.isAliasAvailable(alias, timeout);
        if (!available) {
            throw new Error(`Alias "${alias}" is already registered in Holster`);
        }
    }
    /**
     * Checks if a given alias/username is available on Holster.
     * Uses the same approach as isAliasTaken but returns the inverse.
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
                // If timeout, assume alias is available (optimistic approach)
                // This allows signup to proceed even if the check times out
                resolve(true);
            }, timeout);
            // Holster: check if username exists by looking up ~@username
            // Use the same approach as isAliasTaken for consistency
            this.holster.get(`~@${normalizedAlias}`).next(null, null, (user) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                // If user exists, alias is taken (return false)
                // If user is null/undefined, alias is available (return true)
                resolve(!user);
            });
        });
    }
    /**
     * Checks if a given alias/username is taken on Holster.
     */
    async isAliasTaken(alias) {
        return new Promise((resolve, reject) => {
            // Holster: use .get().next() for chaining
            // Check if username exists by looking up ~@username
            this.holster.get(`~@${alias}`).next(null, null, (user) => {
                // If user exists, alias is taken (return true)
                // If user is null/undefined, alias is available (return false)
                resolve(!!user);
            });
        });
    }
    /**
     * Register a new alias (username) → public key mapping on Holster.
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
            // Holster: use .next() for chaining
            this.usernamesNode
                .next(normalizedAlias, null, null)
                .put(userPub, (ack) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                if (ack && typeof ack === 'string' && ack.startsWith('error')) {
                    reject(new Error(ack));
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
     * Reset holster.user() authentication state and clear cached user.
     * @internal
     */
    resetAuthState() {
        try {
            const user = this.holster.user();
            if (user && user.is) {
                user.leave();
            }
            this.user = null;
        }
        catch (e) {
            // Ignore
        }
    }
    /**
     * Assemble a standard AuthResult object after a successful login.
     */
    buildLoginResult(username, userPub) {
        const user = this.holster.user();
        const seaPair = user.is;
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
     */
    async signUp(username, password, pair) {
        const validation = this.validateSignupCredentials(username, password, pair);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.holster.user();
        // Note: Holster might not support pair-based auth directly
        // You may need to implement this or throw an error
        if (pair) {
            return {
                success: false,
                error: 'Pair-based signup not yet supported with Holster',
            };
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
                if (createAck && createAck !== null) {
                    callbackInvoked = true;
                    this.resetAuthState();
                    resolve({ success: false, error: createAck || 'Signup failed' });
                    return;
                }
                // After create, authenticate
                user.auth(normalizedUsername, password, async (authAck) => {
                    if (callbackInvoked) {
                        return;
                    }
                    callbackInvoked = true;
                    if (authAck && authAck !== null) {
                        this.resetAuthState();
                        resolve({
                            success: false,
                            error: authAck || 'Authentication after signup failed',
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
                    const alias = user?.is?.username || normalizedUsername;
                    try {
                        this.saveCredentials({
                            alias: alias || normalizedUsername,
                            pair: {
                                pub: user.is.pub,
                                priv: user.is.priv,
                                epub: user.is.epub,
                                epriv: user.is.epriv,
                            },
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
                            method: 'password',
                        });
                    }
                    resolve({
                        success: true,
                        userPub: authenticatedUserPub,
                        username: normalizedUsername,
                        isNewUser: true,
                        sea: user.is
                            ? {
                                pub: user.is.pub,
                                priv: user.is.priv,
                                epub: user.is.epub,
                                epriv: user.is.epriv,
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
     */
    async login(username, password, pair) {
        this.resetAuthState();
        const normalizedUsername = username.trim().toLowerCase();
        const user = this.holster.user();
        return new Promise((resolve) => {
            // Holster doesn't support pair-based auth directly
            if (pair) {
                resolve({
                    success: false,
                    error: 'Pair-based login not yet supported with Holster',
                });
                return;
            }
            user.auth(normalizedUsername, password, (ack) => {
                if (ack && ack !== null) {
                    this.resetAuthState();
                    resolve({ success: false, error: ack });
                    return;
                }
                const userPub = user?.is?.pub;
                if (!userPub) {
                    this.resetAuthState();
                    resolve({ success: false, error: 'No userPub available' });
                    return;
                }
                this.user = user;
                const alias = user?.is?.username || normalizedUsername;
                try {
                    this.saveCredentials({
                        alias: alias || normalizedUsername,
                        pair: {
                            pub: user.is.pub,
                            priv: user.is.priv,
                            epub: user.is.epub,
                            epriv: user.is.epriv,
                        },
                        userPub: userPub,
                    });
                }
                catch (saveError) {
                    // Ignore save errors
                }
                // Don't emit auth:login here - let subscribeToAuthEvents() handle it via polling
                // This prevents duplicate events. The polling will detect the state change from
                // null/undefined to user.is and emit the event once.
                resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
            });
        });
    }
    /**
     * Returns the currently authenticated user's public key and Holster user instance.
     */
    getCurrentUser() {
        try {
            const user = this.holster.user();
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
     */
    getUserPub() {
        try {
            const user = this.holster.user();
            return user?.is?.pub || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Authenticate using a SEA pair directly.
     * If username doesn't exist, creates a new user with the provided pair.
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
        const user = this.holster.user();
        // Validate username
        if (!normalizedUsername || normalizedUsername.length < 1) {
            return {
                success: false,
                error: 'Username must be more than 0 characters long',
            };
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
            return {
                success: false,
                error: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
            };
        }
        // Ensure SEA is available
        if (!this.sea) {
            return {
                success: false,
                error: 'SEA cryptography not available',
            };
        }
        // Ensure wire is available
        if (!this.holster.wire) {
            return {
                success: false,
                error: 'Holster wire not available',
            };
        }
        return new Promise(async (resolve) => {
            const userPub = '~' + pair.pub;
            const soul = '~@' + normalizedUsername;
            // Check if username already exists by checking the usernames node
            try {
                const aliasAvailable = await this.isAliasAvailable(normalizedUsername);
                if (!aliasAvailable) {
                    // Username exists - check if pub matches
                    const existingPub = await new Promise((resolve) => {
                        this.usernamesNode.next(normalizedUsername, null, (pub) => {
                            resolve(pub || null);
                        });
                    });
                    if (existingPub && existingPub !== pair.pub) {
                        resolve({
                            success: false,
                            error: "Username exists but public key doesn't match",
                        });
                        return;
                    }
                    // Pub matches or username exists but no pub registered - verify user data exists
                    this.holster.wire.get({ '#': userPub, '.': ['username', 'pub', 'epub'] }, (userMsg) => {
                        if (userMsg.err || !userMsg.put || !userMsg.put[userPub]) {
                            // User data doesn't exist, create it
                            this.createUserWithPair(normalizedUsername, pair, userPub, soul, resolve);
                            return;
                        }
                        // User data exists - set user.is and authenticate
                        user.is = {
                            username: normalizedUsername,
                            pub: pair.pub,
                            epub: pair.epub,
                            priv: pair.priv,
                            epriv: pair.epriv,
                        };
                        this.user = user;
                        try {
                            this.saveCredentials({
                                alias: normalizedUsername,
                                pair: pair,
                                userPub: pair.pub,
                            });
                        }
                        catch (saveError) {
                            // Ignore save errors
                        }
                        // Don't emit auth:login here - let subscribeToAuthEvents() handle it via polling
                        // This prevents duplicate events. The polling will detect the state change from
                        // null/undefined to user.is and emit the event once.
                        resolve(this.buildLoginResult(normalizedUsername, pair.pub));
                    }, { wait: 5000 });
                    return;
                }
                // Username doesn't exist - create new user with the provided pair
                this.createUserWithPair(normalizedUsername, pair, userPub, soul, resolve);
            }
            catch (error) {
                resolve({
                    success: false,
                    error: `Error checking username: ${error.message || error}`,
                });
            }
        });
    }
    /**
     * Helper to create a user with pair and register alias.
     * @internal
     */
    async createUserWithPair(normalizedUsername, pair, userPub, soul, resolve) {
        const user = this.holster.user();
        try {
            // Ensure alias is available before creating
            await this.ensureAliasAvailable(normalizedUsername);
            // Create user data (without password-based auth since we're using pair)
            const timestamp = Date.now();
            const sig = await this.sea.signTimestamp(timestamp, pair);
            const data = {
                username: normalizedUsername,
                pub: pair.pub,
                epub: pair.epub,
                // For pair-based users, we don't store encrypted auth
                // The pair itself is the authentication mechanism
            };
            const graph = this.createGraph(userPub, data, sig, pair.pub, timestamp);
            // Put user data
            this.holster.wire.put(graph, (err) => {
                if (err) {
                    resolve({
                        success: false,
                        error: `Error creating user: ${err}`,
                    });
                    return;
                }
                // Create username -> pub mapping (required by Holster)
                const rel = { [userPub]: { '#': userPub } };
                const relGraph = this.createGraph(soul, rel, null, null, null);
                this.holster.wire.put(relGraph, async (relErr) => {
                    if (relErr) {
                        resolve({
                            success: false,
                            error: `Error creating username mapping: ${relErr}`,
                        });
                        return;
                    }
                    // Register alias in usernames node using registerAlias
                    try {
                        await this.registerAlias(normalizedUsername, pair.pub);
                    }
                    catch (registerError) {
                        console.error('[DB] Alias registration failed:', registerError);
                        // Continue anyway - the user is created, just alias registration failed
                    }
                    // Set user.is with the pair
                    user.is = {
                        username: normalizedUsername,
                        pub: pair.pub,
                        epub: pair.epub,
                        priv: pair.priv,
                        epriv: pair.epriv,
                    };
                    this.user = user;
                    try {
                        this.saveCredentials({
                            alias: normalizedUsername,
                            pair: pair,
                            userPub: pair.pub,
                        });
                    }
                    catch (saveError) {
                        // Ignore save errors
                    }
                    // Emit auth:signup event (new user created) if core is available
                    // The auth:login event will be emitted by subscribeToAuthEvents() when it detects the state change
                    if (this.core && typeof this.core.emit === 'function') {
                        this.core.emit('auth:signup', {
                            userPub: pair.pub,
                            username: normalizedUsername,
                            method: 'pair',
                        });
                    }
                    // Don't emit auth:login here - let subscribeToAuthEvents() handle it via polling
                    // This prevents duplicate events. The polling will detect the state change from
                    // null/undefined to user.is and emit the event once.
                    resolve(this.buildLoginResult(normalizedUsername, pair.pub));
                });
            });
        }
        catch (error) {
            resolve({
                success: false,
                error: `Error during user creation: ${error.message || error}`,
            });
        }
    }
    /**
     * Helper to create a graph structure compatible with Holster.
     * @internal
     */
    createGraph(soul, data, sig, pub, timestamp) {
        const g = { [soul]: { _: { '#': soul, '>': {} } } };
        for (const [key, value] of Object.entries(data)) {
            if (key !== '_' &&
                key !== '_holster_user_public_key' &&
                key !== '_holster_user_signature') {
                g[soul][key] = value;
                g[soul]._['>'][key] = timestamp || Date.now();
            }
        }
        // Store signatures if provided
        if (sig && pub && timestamp) {
            g[soul]._['s'] = {};
            if (typeof sig === 'string') {
                g[soul]._['s'][timestamp] = sig;
            }
            g[soul]['_holster_user_public_key'] = pub;
            g[soul]._['>']['_holster_user_public_key'] = timestamp;
        }
        return g;
    }
    /**
     * Legacy API: Sign in using a username and SEA pair.
     */
    async loginWithPairLegacy(username, pair) {
        return this.loginWithPair(username, pair);
    }
    /**
     * Returns the bound RxJS Holster helper (reactive streams).
     */
    rx() {
        return this._rxjs;
    }
    /**
     * Tears down the DataBaseHolster instance and performs cleanup.
     */
    destroy() {
        if (this._isDestroyed)
            return;
        console.log('[DB] Destroying DataBaseHolster instance...');
        this._isDestroyed = true;
        if (this.authPollInterval) {
            clearInterval(this.authPollInterval);
            this.authPollInterval = null;
        }
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
        console.log('[DB] DataBaseHolster instance destroyed');
    }
    /**
     * Aggressively clean up authentication state and session.
     */
    aggressiveAuthCleanup() {
        console.log('🧹 Performing aggressive auth cleanup...');
        this.resetAuthState();
        this.logout();
        console.log('✓ Aggressive auth cleanup completed');
    }
    /**
     * Register an event handler.
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    /**
     * Remove an event handler.
     */
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    /**
     * Register an event handler for a single event occurrence.
     */
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    /**
     * Emit a custom event.
     */
    emit(event, data) {
        return this.eventEmitter.emit(event, data);
    }
    /**
     * Get the Holster instance (for backward compatibility with gun property).
     * Returns a proxy that provides Gun-like API on top of Holster.
     */
    get gun() {
        return this.createGunProxy();
    }
    /**
     * Create a proxy that makes Holster look like Gun for compatibility.
     */
    createGunProxy() {
        const self = this;
        const createChainProxy = (chain) => {
            return {
                get: (nextKey) => {
                    // Convert to Holster's .next() API
                    const nextChain = chain.next(nextKey);
                    return createChainProxy(nextChain);
                },
                put: (data, callback) => {
                    chain.put(data, callback);
                    return createChainProxy(chain);
                },
                once: (callback) => {
                    // Implement .once() using .on()
                    let called = false;
                    let unsubscribe = null;
                    const wrappedCallback = (data) => {
                        if (!called) {
                            called = true;
                            callback(data);
                            // Unsubscribe immediately after callback
                            if (unsubscribe) {
                                unsubscribe();
                                unsubscribe = null;
                            }
                            else if (chain.off) {
                                chain.off(wrappedCallback);
                            }
                        }
                    };
                    // Subscribe and store unsubscribe function
                    if (chain.on) {
                        const unsub = chain.on(wrappedCallback);
                        if (typeof unsub === 'function') {
                            unsubscribe = unsub;
                        }
                    }
                    return createChainProxy(chain);
                },
                on: (callback) => {
                    chain.on(callback);
                    return () => chain.off(callback);
                },
                off: (callback) => {
                    chain.off(callback);
                    return createChainProxy(chain);
                },
                map: () => {
                    // Holster doesn't have .map(), return a proxy that uses .on() to iterate
                    return createChainProxy(chain);
                },
                then: (callback) => {
                    // Implement .then() using .once()
                    let called = false;
                    const wrappedCallback = (data) => {
                        if (!called) {
                            called = true;
                            callback(data);
                        }
                    };
                    chain.on(wrappedCallback);
                    setTimeout(() => {
                        chain.off(wrappedCallback);
                    }, 0);
                    return createChainProxy(chain);
                },
            };
        };
        return {
            get: (key) => {
                const chain = self.holster.get(key);
                return createChainProxy(chain);
            },
            user: () => self.holster.user(),
            SEA: self.holster.SEA,
            on: (event, callback) => {
                // Holster doesn't have global events, so we handle auth events via polling
                if (event === 'auth') {
                    self.onAuth(callback);
                }
            },
            off: (event, callback) => {
                // Handle event removal if needed
                if (event === 'auth') {
                    // Remove from onAuth callbacks if possible
                    const index = self.onAuthCallbacks.indexOf(callback);
                    if (index > -1) {
                        self.onAuthCallbacks.splice(index, 1);
                    }
                }
            },
        };
    }
}
exports.DataBaseHolster = DataBaseHolster;
