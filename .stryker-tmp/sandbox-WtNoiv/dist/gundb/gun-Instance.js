// @ts-nocheck
"use strict";
/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
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
exports.restrictedPut = exports.derive = exports.GunErrors = exports.crypto = exports.GunRxJS = exports.Gun = exports.SEA = exports.GunInstance = void 0;
const gun_1 = __importDefault(require("gun/gun"));
exports.Gun = gun_1.default;
const sea_1 = __importDefault(require("gun/sea"));
exports.SEA = sea_1.default;
require("gun/lib/then.js");
require("gun/lib/radisk.js");
require("gun/lib/store.js");
require("gun/lib/rindexed.js");
require("gun/lib/webrtc.js");
require("gun/lib/yson.js");
const restricted_put_1 = require("./restricted-put");
Object.defineProperty(exports, "restrictedPut", { enumerable: true, get: function () { return restricted_put_1.restrictedPut; } });
const derive_1 = __importDefault(require("./derive"));
exports.derive = derive_1.default;
const errorHandler_1 = require("../utils/errorHandler");
const eventEmitter_1 = require("../utils/eventEmitter");
const gun_rxjs_1 = require("./gun-rxjs");
Object.defineProperty(exports, "GunRxJS", { enumerable: true, get: function () { return gun_rxjs_1.GunRxJS; } });
const GunErrors = __importStar(require("./errors"));
exports.GunErrors = GunErrors;
const crypto = __importStar(require("./crypto"));
exports.crypto = crypto;
/**
 * Configuration constants for timeouts and security
 */
const CONFIG = {
    TIMEOUTS: {
        LOOKUP_FROZEN_SPACE: 2000,
        LOOKUP_DIRECT_MAPPING: 1500,
        LOOKUP_ALTERNATE_KEY: 1500,
        LOOKUP_COMPREHENSIVE: 1500,
        USER_DATA_OPERATION: 5000,
        STRATEGY_TIMEOUT: 3000,
    },
    RATE_LIMITING: {
        MAX_LOGIN_ATTEMPTS: 5,
        LOGIN_COOLDOWN_MS: 300000, // 5 minutes
        MAX_SIGNUP_ATTEMPTS: 3,
        SIGNUP_COOLDOWN_MS: 600000, // 10 minutes
    },
    PASSWORD: {
        MIN_LENGTH: 12,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SPECIAL_CHARS: true,
    },
};
class GunInstance {
    gun;
    user = null;
    crypto;
    sea;
    node;
    onAuthCallbacks = [];
    eventEmitter;
    // Rate limiting storage
    rateLimitStorage = new Map();
    // Integrated modules
    _rxjs;
    constructor(gun, appScope = "shogun") {
        // Initialize event emitter
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        // Validate Gun instance
        if (!gun) {
            throw new Error("Gun instance is required but was not provided");
        }
        if (typeof gun !== "object") {
            throw new Error(`Gun instance must be an object, received: ${typeof gun}`);
        }
        if (typeof gun.user !== "function") {
            throw new Error(`Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof gun.user}`);
        }
        if (typeof gun.get !== "function") {
            throw new Error(`Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof gun.get}`);
        }
        if (typeof gun.on !== "function") {
            throw new Error(`Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof gun.on}`);
        }
        this.gun = gun;
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.subscribeToAuthEvents();
        this.crypto = crypto;
        this.sea = sea_1.default;
        this.node = null;
    }
    /**
     * Initialize the GunInstance asynchronously
     * This method should be called after construction to perform async operations
     */
    async initialize(appScope = "shogun") {
        try {
            const sessionResult = this.restoreSession();
            this.node = this.gun.get(appScope);
            if (sessionResult.success) {
                // Session automatically restored
            }
            else {
                // No previous session to restore
            }
        }
        catch (error) {
            console.error("Error during automatic session restoration:", error);
        }
    }
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            // Auth event received
            if (ack.err) {
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.GUN, "AUTH_EVENT_ERROR", ack.err, new Error(ack.err));
            }
            else {
                this.notifyAuthListeners(ack.sea?.pub || "");
            }
        });
    }
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((cb) => cb(user));
    }
    /**
     * Emits a Gun data event
     * @private
     */
    emitDataEvent(eventType, path, data, success = true, error) {
        const eventData = {
            path,
            data,
            success,
            error,
            timestamp: Date.now(),
        };
        this.eventEmitter.emit(eventType, eventData);
    }
    /**
     * Emits a Gun peer event
     * @private
     */
    emitPeerEvent(action, peer) {
        const eventData = {
            peer,
            action,
            timestamp: Date.now(),
        };
        this.eventEmitter.emit(`gun:peer:${action}`, eventData);
    }
    /**
     * Adds an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    /**
     * Removes an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    off(event, listener) {
        this.eventEmitter.off(event, listener);
    }
    /**
     * Adds a one-time event listener
     * @param event Event name
     * @param listener Event listener function
     */
    once(event, listener) {
        this.eventEmitter.once(event, listener);
    }
    /**
     * Emits an event
     * @param event Event name
     * @param data Event data
     */
    emit(event, data) {
        return this.eventEmitter.emit(event, data);
    }
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer) {
        this.gun.opt({ peers: [peer] });
        this.emitPeerEvent("add", peer);
        console.log(`Added new peer: ${peer}`);
    }
    /**
     * Removes a peer from the network
     * @param peer URL of the peer to remove
     */
    removePeer(peer) {
        try {
            // Get current peers from Gun instance
            const gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                // Remove the peer from the peers object
                delete gunOpts.peers[peer];
                // Also try to close the connection if it exists
                const peerConnection = gunOpts.peers[peer];
                if (peerConnection && typeof peerConnection.close === "function") {
                    peerConnection.close();
                }
                this.emitPeerEvent("remove", peer);
                console.log(`Removed peer: ${peer}`);
            }
            else {
                console.log(`Peer not found in current connections: ${peer}`);
            }
        }
        catch (error) {
            console.error(`Error removing peer ${peer}:`, error);
        }
    }
    /**
     * Gets the list of currently connected peers
     * @returns Array of peer URLs
     */
    getCurrentPeers() {
        try {
            const gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                return Object.keys(gunOpts.peers).filter((peer) => {
                    const peerObj = gunOpts.peers[peer];
                    // Check if peer is actually connected (not just configured)
                    return peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
                });
            }
            return [];
        }
        catch (error) {
            console.error("Error getting current peers:", error);
            return [];
        }
    }
    /**
     * Gets the list of all configured peers (connected and disconnected)
     * @returns Array of peer URLs
     */
    getAllConfiguredPeers() {
        try {
            const gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                return Object.keys(gunOpts.peers);
            }
            return [];
        }
        catch (error) {
            console.error("Error getting configured peers:", error);
            return [];
        }
    }
    /**
     * Gets detailed information about all peers
     * @returns Object with peer information
     */
    getPeerInfo() {
        try {
            const gunOpts = this.gun._.opt;
            const peerInfo = {};
            if (gunOpts && gunOpts.peers) {
                Object.keys(gunOpts.peers).forEach((peer) => {
                    const peerObj = gunOpts.peers[peer];
                    const isConnected = peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
                    const status = isConnected
                        ? "connected"
                        : peerObj && peerObj.wire
                            ? "disconnected"
                            : "not_initialized";
                    peerInfo[peer] = {
                        connected: isConnected,
                        status: status,
                    };
                });
            }
            return peerInfo;
        }
        catch (error) {
            console.error("Error getting peer info:", error);
            return {};
        }
    }
    /**
     * Reconnects to a specific peer
     * @param peer URL of the peer to reconnect
     */
    reconnectToPeer(peer) {
        try {
            // First remove the peer
            this.removePeer(peer);
            // Add it back immediately instead of with timeout
            this.addPeer(peer);
            console.log(`Reconnected to peer: ${peer}`);
        }
        catch (error) {
            console.error(`Error reconnecting to peer ${peer}:`, error);
        }
    }
    /**
     * Clears all peers and optionally adds new ones
     * @param newPeers Optional array of new peers to add
     */
    resetPeers(newPeers) {
        try {
            const gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                // Clear all existing peers
                Object.keys(gunOpts.peers).forEach((peer) => {
                    this.removePeer(peer);
                });
                // Add new peers if provided
                if (newPeers && newPeers.length > 0) {
                    newPeers.forEach((peer) => {
                        this.addPeer(peer);
                    });
                }
                console.log(`Gun database reset with ${newPeers ? newPeers.length : 0} peers: ${newPeers ? newPeers.join(", ") : "none"}`);
            }
        }
        catch (error) {
            console.error("Error resetting peers:", error);
        }
    }
    /**
     * Registers an authentication callback
     * @param callback Function to call on auth events
     * @returns Function to unsubscribe the callback
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
     * Helper method to navigate to a nested path by splitting and chaining .get() calls
     * @param node Starting Gun node
     * @param path Path string (e.g., "test/data/marco")
     * @returns Gun node at the specified path
     */
    navigateToPath(node, path) {
        if (!path || typeof path !== "string")
            return node;
        // Sanitize path to remove any control characters or invalid characters
        const sanitizedPath = path
            .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
            .replace(/[^\w\-._/]/g, "") // Only allow alphanumeric, hyphens, dots, underscores, and slashes
            .trim();
        if (!sanitizedPath)
            return node;
        // Split path by '/' and filter out empty segments
        const pathSegments = sanitizedPath
            .split("/")
            .filter((segment) => segment.length > 0)
            .map((segment) => segment.trim())
            .filter((segment) => segment.length > 0);
        // Chain .get() calls for each path segment
        return pathSegments.reduce((currentNode, segment) => {
            return currentNode.get(segment);
        }, node);
    }
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun() {
        return this.gun;
    }
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    getCurrentUser() {
        try {
            const user = this.gun.user();
            const pub = user?.is?.pub;
            return pub ? { pub, user } : null;
        }
        catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    }
    /**
     * Gets the current user instance
     * @returns User instance
     */
    getUser() {
        return this.gun.user();
    }
    /**
     * Gets a node at the specified path
     * @param path Path to the node
     * @returns Gun node
     */
    get(path) {
        return this.navigateToPath(this.gun, path);
    }
    /**
     * Gets data at the specified path (one-time read)
     * @param path Path to get the data from
     * @returns Promise resolving to the data
     */
    async getData(path) {
        return new Promise((resolve) => {
            this.navigateToPath(this.gun, path).once((data) => {
                // Emit event for the operation
                this.emitDataEvent("gun:get", path, data, true);
                resolve(data);
            });
        });
    }
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async put(path, data) {
        return new Promise((resolve) => {
            this.navigateToPath(this.gun, path).put(data, (ack) => {
                const result = ack.err
                    ? { success: false, error: ack.err }
                    : { success: true };
                // Emit event for the operation
                this.emitDataEvent("gun:put", path, data, !ack.err, ack.err);
                resolve(result);
            });
        });
    }
    /**
     * Sets data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async set(path, data) {
        return new Promise((resolve) => {
            this.navigateToPath(this.gun, path).set(data, (ack) => {
                const result = ack.err
                    ? { success: false, error: ack.err }
                    : { success: true };
                // Emit event for the operation
                this.emitDataEvent("gun:set", path, data, !ack.err, ack.err);
                resolve(result);
            });
        });
    }
    /**
     * Removes data at the specified path
     * @param path Path to remove
     * @returns Promise resolving to operation result
     */
    async remove(path) {
        return new Promise((resolve) => {
            this.navigateToPath(this.gun, path).put(null, (ack) => {
                const result = ack.err
                    ? { success: false, error: ack.err }
                    : { success: true };
                // Emit event for the operation
                this.emitDataEvent("gun:remove", path, null, !ack.err, ack.err);
                resolve(result);
            });
        });
    }
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    isLoggedIn() {
        try {
            const user = this.gun.user();
            return !!(user && user.is && user.is.pub);
        }
        catch (error) {
            console.error("Error checking login status:", error);
            return false;
        }
    }
    /**
     * Attempts to restore user session from local storage
     * @returns Promise resolving to session restoration result
     */
    restoreSession() {
        try {
            if (typeof localStorage === "undefined") {
                return { success: false, error: "localStorage not available" };
            }
            const sessionInfo = localStorage.getItem("gun/session");
            const pairInfo = localStorage.getItem("gun/pair");
            if (!sessionInfo || !pairInfo) {
                // No saved session found
                return { success: false, error: "No saved session" };
            }
            let session, pair;
            try {
                session = JSON.parse(sessionInfo);
                pair = JSON.parse(pairInfo);
            }
            catch (parseError) {
                console.error("Error parsing session data:", parseError);
                // Clear corrupted data
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Corrupted session data" };
            }
            // Validate session data structure
            if (!session.username || !session.pair || !session.userPub) {
                // Invalid session data, clearing storage
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Incomplete session data" };
            }
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                // Session expired, clearing storage
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Session expired" };
            }
            // Attempt to restore user session
            try {
                const userInstance = this.gun.user();
                if (!userInstance) {
                    console.error("Gun user instance not available");
                    localStorage.removeItem("gun/session");
                    localStorage.removeItem("gun/pair");
                    return { success: false, error: "Gun user instance not available" };
                }
                // Set the user pair
                try {
                    userInstance._ = { ...userInstance._, sea: session.pair };
                }
                catch (pairError) {
                    console.error("Error setting user pair:", pairError);
                }
                // Attempt to recall user session
                try {
                    const recallResult = userInstance.recall({ sessionStorage: true });
                    // console.log("recallResult", recallResult);
                }
                catch (recallError) {
                    console.error("Error during recall:", recallError);
                }
                // Verify session restoration success
                if (userInstance.is && userInstance.is.pub === session.userPub) {
                    this.user = userInstance;
                    // Session restored successfully for user
                    return {
                        success: true,
                        userPub: session.userPub,
                    };
                }
                else {
                    // Session restoration verification failed
                    localStorage.removeItem("gun/session");
                    localStorage.removeItem("gun/pair");
                    return { success: false, error: "Session verification failed" };
                }
            }
            catch (error) {
                console.error(`Error restoring session: ${error}`);
                this.clearGunStorage();
                return {
                    success: false,
                    error: `Session restoration failed: ${error}`,
                };
            }
        }
        catch (mainError) {
            console.error(`Error in restoreSession: ${mainError}`);
            return {
                success: false,
                error: `Session restoration failed: ${mainError}`,
            };
        }
        return { success: false, error: "No session data available" };
    }
    logout() {
        try {
            const currentUser = this.gun.user();
            if (!currentUser || !currentUser.is) {
                console.log("No user logged in, skipping logout");
                return;
            }
            // Log out user
            try {
                currentUser.leave();
            }
            catch (gunError) {
                console.error("Error during Gun logout:", gunError);
            }
            // Clear user reference
            this.user = null;
            // Clear local session data
            try {
                // Clear session data if needed
            }
            catch (error) {
                console.error("Error clearing local session data:", error);
            }
            // Clear session storage
            try {
                if (typeof sessionStorage !== "undefined") {
                    sessionStorage.removeItem("gunSessionData");
                    // Session storage cleared
                }
            }
            catch (error) {
                console.error("Error clearing session storage:", error);
            }
            // Logout completed successfully
        }
        catch (error) {
            console.error("Error during logout:", error);
        }
    }
    /**
     * Debug method: Clears all Gun-related data from local and session storage
     * This is useful for debugging and testing purposes
     * @warning This will completely reset the user's local Gun data
     */
    clearGunStorage() {
        try {
            // Clearing all Gun-related storage data...
            // Clear localStorage
            if (typeof localStorage !== "undefined") {
                try {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith("gun/")) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach((key) => localStorage.removeItem(key));
                    // Cleared items from localStorage
                }
                catch (error) {
                    console.error("Error clearing localStorage:", error);
                }
            }
            // Clear sessionStorage
            if (typeof sessionStorage !== "undefined") {
                try {
                    sessionStorage.removeItem("gunSessionData");
                    // Session storage cleared
                }
                catch (error) {
                    console.error("Error clearing sessionStorage:", error);
                }
            }
            // Clear current user
            if (this.user) {
                try {
                    this.user.leave();
                    this.user = null;
                    // User logged out
                }
                catch (logoutError) {
                    console.error("Error during logout:", logoutError);
                }
            }
            // All Gun-related storage data cleared
        }
        catch (error) {
            console.error("Error clearing storage data:", error);
        }
    }
    /**
     * Debug method: Tests Gun connectivity and returns status information
     * This is useful for debugging connection issues
     */
    async testConnectivity() {
        try {
            // Testing Gun connectivity...
            const testNode = this.gun.get("test_connectivity");
            const testValue = `test_${Date.now()}`;
            // Test write operation
            let writeResult = false;
            try {
                await new Promise((resolve, reject) => {
                    testNode.put(testValue, (ack) => {
                        if (ack.err) {
                            reject(ack.err);
                        }
                        else {
                            resolve(ack);
                        }
                    });
                });
                writeResult = true;
            }
            catch (writeError) {
                console.error("Write test failed:", writeError);
            }
            // Test read operation
            let readResult = false;
            try {
                const result = await new Promise((resolve, reject) => {
                    testNode.once((data) => {
                        if (data === testValue) {
                            resolve(data);
                        }
                        else {
                            reject("Data mismatch");
                        }
                    });
                });
                readResult = true;
            }
            catch (readError) {
                console.error("Read test failed:", readError);
            }
            const result = {
                writeTest: writeResult,
                readTest: readResult,
                peers: this.getCurrentPeers(),
                timestamp: new Date().toISOString(),
            };
            // Connectivity test completed
            return result;
        }
        catch (error) {
            console.error("Error testing connectivity:", error);
            return { error: error, timestamp: new Date().toISOString() };
        }
    }
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx() {
        if (!this._rxjs) {
            this._rxjs = new gun_rxjs_1.GunRxJS(this.gun);
        }
        return this._rxjs;
    }
    /**
     * Validates password strength according to security requirements
     */
    validatePasswordStrength(password) {
        if (password.length < CONFIG.PASSWORD.MIN_LENGTH) {
            return {
                valid: false,
                error: `Password must be at least ${CONFIG.PASSWORD.MIN_LENGTH} characters long`,
            };
        }
        const validations = [];
        if (CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            validations.push("uppercase letter");
        }
        if (CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            validations.push("lowercase letter");
        }
        if (CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
            validations.push("number");
        }
        if (CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS &&
            !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            validations.push("special character");
        }
        if (validations.length > 0) {
            return {
                valid: false,
                error: `Password must contain at least one: ${validations.join(", ")}`,
            };
        }
        return { valid: true };
    }
    /**
     * Checks rate limiting for login attempts
     */
    checkRateLimit(username, operation) {
        const key = `${operation}:${username.toLowerCase()}`;
        const now = Date.now();
        const entry = this.rateLimitStorage.get(key);
        const maxAttempts = operation === "login"
            ? CONFIG.RATE_LIMITING.MAX_LOGIN_ATTEMPTS
            : CONFIG.RATE_LIMITING.MAX_SIGNUP_ATTEMPTS;
        const cooldownMs = operation === "login"
            ? CONFIG.RATE_LIMITING.LOGIN_COOLDOWN_MS
            : CONFIG.RATE_LIMITING.SIGNUP_COOLDOWN_MS;
        if (!entry) {
            this.rateLimitStorage.set(key, { attempts: 1, lastAttempt: now });
            return { allowed: true };
        }
        // Check if still in cooldown
        if (entry.cooldownUntil && now < entry.cooldownUntil) {
            const remainingTime = Math.ceil((entry.cooldownUntil - now) / 60000);
            return {
                allowed: false,
                error: `Too many attempts. Please try again in ${remainingTime} minutes.`,
            };
        }
        // Reset if cooldown period has passed
        if (entry.cooldownUntil && now >= entry.cooldownUntil) {
            this.rateLimitStorage.set(key, { attempts: 1, lastAttempt: now });
            return { allowed: true };
        }
        // Increment attempts
        entry.attempts++;
        entry.lastAttempt = now;
        if (entry.attempts > maxAttempts) {
            entry.cooldownUntil = now + cooldownMs;
            const cooldownMinutes = Math.ceil(cooldownMs / 60000);
            return {
                allowed: false,
                error: `Too many ${operation} attempts. Please try again in ${cooldownMinutes} minutes.`,
            };
        }
        this.rateLimitStorage.set(key, entry);
        return { allowed: true };
    }
    /**
     * Resets rate limiting for successful authentication
     */
    resetRateLimit(username, operation) {
        const key = `${operation}:${username.toLowerCase()}`;
        this.rateLimitStorage.delete(key);
    }
    /**
     * Validates signup credentials with enhanced security
     */
    validateSignupCredentials(username, password, pair) {
        // Check rate limiting first
        const rateLimitCheck = this.checkRateLimit(username, "signup");
        if (!rateLimitCheck.allowed) {
            return { valid: false, error: rateLimitCheck.error };
        }
        // Validate username
        if (!username || username.length < 1) {
            return {
                valid: false,
                error: "Username must be more than 0 characters long!",
            };
        }
        // Validate username format (alphanumeric and some special chars only)
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return {
                valid: false,
                error: "Username can only contain letters, numbers, dots, underscores, and hyphens",
            };
        }
        // If using pair authentication, skip password validation
        if (pair) {
            return { valid: true };
        }
        // Validate password strength
        return this.validatePasswordStrength(password);
    }
    /**
     * Checks if user exists by attempting authentication
     */
    async checkUserExistence(username, password, pair) {
        return new Promise((resolve) => {
            if (pair) {
                this.gun.user().auth(pair, (ack) => {
                    if (ack.err) {
                        resolve({ exists: false, error: ack.err });
                    }
                    else {
                        resolve({ exists: true, userPub: this.gun.user().is?.pub });
                    }
                });
            }
            else {
                this.gun.user().auth(username, password, (ack) => {
                    if (ack.err) {
                        resolve({ exists: false, error: ack.err });
                    }
                    else {
                        resolve({ exists: true, userPub: this.gun.user().is?.pub });
                    }
                });
            }
        });
    }
    /**
     * Creates a new user in Gun
     */
    async createNewUser(username, password) {
        return new Promise((resolve) => {
            // Validate inputs before creating user
            if (!username ||
                typeof username !== "string" ||
                username.trim().length === 0) {
                resolve({ success: false, error: "Invalid username provided" });
                return;
            }
            if (!password ||
                typeof password !== "string" ||
                password.length === 0) {
                resolve({ success: false, error: "Invalid password provided" });
                return;
            }
            // Sanitize username
            const sanitizedUsername = this.sanitizeUsername(username);
            if (sanitizedUsername.length === 0) {
                resolve({
                    success: false,
                    error: "Username contains only invalid characters",
                });
                return;
            }
            this.gun.user().create(sanitizedUsername, password, (ack) => {
                if (ack.err) {
                    console.error(`User creation error: ${ack.err}`);
                    resolve({ success: false, error: ack.err });
                }
                else {
                    // Validate that we got a userPub from creation
                    const userPub = ack.pub;
                    if (!userPub ||
                        typeof userPub !== "string" ||
                        userPub.trim().length === 0) {
                        console.error("User creation successful but no userPub returned:", ack);
                        resolve({
                            success: false,
                            error: "User creation successful but no userPub returned",
                        });
                    }
                    else {
                        console.log(`User created successfully with userPub: ${userPub}`);
                        resolve({ success: true, userPub: userPub });
                    }
                }
            });
        });
    }
    /**
     * Authenticates user after creation
     */
    async authenticateNewUser(username, password, pair) {
        return new Promise((resolve) => {
            // Validate inputs before authentication
            if (!username ||
                typeof username !== "string" ||
                username.trim().length === 0) {
                resolve({ success: false, error: "Invalid username provided" });
                return;
            }
            // Skip password validation when using pair authentication
            if (!pair &&
                (!password || typeof password !== "string" || password.length === 0)) {
                resolve({ success: false, error: "Invalid password provided" });
                return;
            }
            // Sanitize username to match what was used in creation
            const sanitizedUsername = this.sanitizeUsername(username);
            if (sanitizedUsername.length === 0) {
                resolve({
                    success: false,
                    error: "Username contains only invalid characters",
                });
                return;
            }
            if (pair) {
                this.gun.user().auth(pair, (ack) => {
                    console.log(`Pair authentication after creation result:`, ack);
                    if (ack.err) {
                        console.error(`Authentication after creation failed: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        // Add a small delay to ensure user state is properly set
                        setTimeout(() => {
                            // Extract userPub from multiple possible sources
                            const userPub = ack.pub || this.gun.user().is?.pub || ack.user?.pub;
                            console.log(`Extracted userPub after pair auth: ${userPub}`);
                            console.log(`User object after pair auth:`, this.gun.user());
                            console.log(`User.is after pair auth:`, this.gun.user().is);
                            if (!userPub) {
                                console.error("Authentication successful but no userPub found");
                                resolve({
                                    success: false,
                                    error: "No userPub returned from authentication",
                                });
                            }
                            else {
                                resolve({ success: true, userPub: userPub });
                            }
                        }, 100);
                    }
                });
            }
            else {
                this.gun.user().auth(sanitizedUsername, password, (ack) => {
                    console.log(`Password authentication after creation result:`, ack);
                    if (ack.err) {
                        console.error(`Authentication after creation failed: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        // Add a small delay to ensure user state is properly set
                        setTimeout(() => {
                            // Extract userPub from multiple possible sources
                            const userPub = ack.pub || this.gun.user().is?.pub || ack.user?.pub;
                            console.log(`Extracted userPub after password auth: ${userPub}`);
                            console.log(`User object after password auth:`, this.gun.user());
                            console.log(`User.is after password auth:`, this.gun.user().is);
                            if (!userPub) {
                                console.error("Authentication successful but no userPub found");
                                resolve({
                                    success: false,
                                    error: "No userPub returned from authentication",
                                });
                            }
                            else {
                                resolve({ success: true, userPub: userPub });
                            }
                        }, 100);
                    }
                });
            }
        });
    }
    /**
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param pair Optional SEA pair for Web3 login
     * @returns Promise resolving to signup result
     */
    async signUp(username, password, pair) {
        try {
            // Validate credentials with enhanced security
            const validation = this.validateSignupCredentials(username, password, pair);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            // First, check if username already exists without authentication
            const existingUserCheck = await this.checkUsernameExists(username);
            if (existingUserCheck) {
                return {
                    success: false,
                    error: `Username '${username}' already exists. Please choose a different username or try logging in instead.`,
                };
            }
            // Create new user - use different method based on authentication type
            let createResult;
            if (pair) {
                // For Web3/plugin authentication, use pair-based creation
                createResult = await this.createNewUserWithPair(username, pair);
            }
            else {
                // For password authentication, use standard creation
                createResult = await this.createNewUser(username, password);
            }
            if (!createResult.success) {
                return { success: false, error: createResult.error };
            }
            // Add a small delay to ensure user is properly registered
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Authenticate the newly created user
            const authResult = await this.authenticateNewUser(username, password, pair);
            if (!authResult.success) {
                return { success: false, error: authResult.error };
            }
            // Validate that we have a userPub
            if (!authResult.userPub ||
                typeof authResult.userPub !== "string" ||
                authResult.userPub.trim().length === 0) {
                console.error("Authentication successful but no valid userPub returned:", authResult);
                return {
                    success: false,
                    error: "Authentication successful but no valid userPub returned",
                };
            }
            // Set the user instance
            this.user = this.gun.user();
            // Reset rate limiting on successful signup
            this.resetRateLimit(username, "signup");
            // Run post-authentication tasks
            try {
                console.log(`Running post-auth setup with userPub: ${authResult.userPub}`);
                const postAuthResult = await this.runPostAuthOnAuthResult(username, authResult.userPub, authResult);
                // Return the post-auth result which includes the complete user data
                return postAuthResult;
            }
            catch (postAuthError) {
                console.error(`Post-auth error: ${postAuthError}`);
                // Even if post-auth fails, the user was created and authenticated successfully
                return {
                    success: true,
                    userPub: authResult.userPub,
                    username: username,
                    isNewUser: true,
                    sea: this.gun.user()?._?.sea
                        ? {
                            pub: this.gun.user()._?.sea.pub,
                            priv: this.gun.user()._?.sea.priv,
                            epub: this.gun.user()._?.sea.epub,
                            epriv: this.gun.user()._?.sea.epriv,
                        }
                        : undefined,
                };
            }
        }
        catch (error) {
            console.error(`Exception during signup for ${username}: ${error}`);
            return { success: false, error: `Signup failed: ${error}` };
        }
    }
    /**
     * Creates a new user in Gun with pair-based authentication (for Web3/plugins)
     */
    async createNewUserWithPair(username, pair) {
        return new Promise((resolve) => {
            // Validate inputs before creating user
            if (!username ||
                typeof username !== "string" ||
                username.trim().length === 0) {
                resolve({ success: false, error: "Invalid username provided" });
                return;
            }
            if (!pair || !pair.pub || !pair.priv) {
                resolve({ success: false, error: "Invalid pair provided" });
                return;
            }
            // Sanitize username
            const sanitizedUsername = this.sanitizeUsername(username);
            if (sanitizedUsername.length === 0) {
                resolve({
                    success: false,
                    error: "Username contains only invalid characters",
                });
                return;
            }
            // For pair-based authentication, we don't need to call gun.user().create()
            // because the pair already contains the cryptographic credentials
            // We just need to validate that the pair is valid and return success
            console.log(`User created successfully with pair for: ${sanitizedUsername}`);
            resolve({ success: true, userPub: pair.pub });
        });
    }
    async runPostAuthOnAuthResult(username, userPub, authResult) {
        // Setting up user profile after authentication
        try {
            // Validate required parameters
            if (!username ||
                typeof username !== "string" ||
                username.trim().length === 0) {
                throw new Error("Invalid username provided");
            }
            if (!userPub ||
                typeof userPub !== "string" ||
                userPub.trim().length === 0) {
                console.error("Invalid userPub provided:", {
                    userPub,
                    type: typeof userPub,
                    authResult,
                });
                throw new Error("Invalid userPub provided");
            }
            // Additional validation for userPub format
            if (!userPub.includes(".") || userPub.length < 10) {
                console.error("Invalid userPub format:", userPub);
                throw new Error("Invalid userPub format");
            }
            // Sanitize username to prevent path issues
            const sanitizedUsername = this.sanitizeUsername(username);
            if (sanitizedUsername.length === 0) {
                throw new Error("Username contains only invalid characters");
            }
            console.log(`Setting up user profile for ${sanitizedUsername} with userPub: ${userPub}`);
            const existingUser = await new Promise((resolve) => {
                this.gun.get(userPub).once((data) => {
                    resolve(data);
                });
            });
            // Check if user already has metadata to avoid overwriting
            if (!existingUser) {
                try {
                    await new Promise((resolve, reject) => {
                        this.gun
                            .get(userPub)
                            .put({ username: sanitizedUsername }, (ack) => {
                            if (ack.err) {
                                console.error(`Error saving user metadata: ${ack.err}`);
                                reject(ack.err);
                            }
                            else {
                                // User metadata saved successfully
                                resolve(ack);
                            }
                        });
                    });
                }
                catch (metadataError) {
                    console.error(`Error saving user metadata: ${metadataError}`);
                    // Don't throw here, continue with other operations
                }
                // Create username mapping
                try {
                    await new Promise((resolve, reject) => {
                        this.node
                            .get("usernames")
                            .get(sanitizedUsername)
                            .put(userPub, (ack) => {
                            if (ack.err) {
                                reject(ack.err);
                            }
                            else {
                                // Username mapping created successfully
                                resolve(ack);
                            }
                        });
                    });
                }
                catch (mappingError) {
                    console.error(`Error creating username mapping: ${mappingError}`);
                    // Don't throw here, continue with other operations
                }
                // Add user to users collection
                try {
                    await new Promise((resolve, reject) => {
                        this.node.get("users").set(this.gun.get(userPub), (ack) => {
                            if (ack.err) {
                                reject(ack.err);
                            }
                            else {
                                // User added to collection successfully
                                resolve(ack);
                            }
                        });
                    });
                }
                catch (collectionError) {
                    console.error(`Error adding user to collection: ${collectionError}`);
                    // Don't throw here, continue with other operations
                }
            }
            return {
                success: true,
                userPub: userPub,
                username: sanitizedUsername,
                isNewUser: !existingUser || !existingUser.username,
                // Get the SEA pair from the user object
                sea: this.gun.user()?._?.sea
                    ? {
                        pub: this.gun.user()._?.sea.pub,
                        priv: this.gun.user()._?.sea.priv,
                        epub: this.gun.user()._?.sea.epub,
                        epriv: this.gun.user()._?.sea.epriv,
                    }
                    : undefined,
            };
        }
        catch (error) {
            console.error(`Error in post-authentication setup: ${error}`);
            return {
                success: false,
                error: `Post-authentication setup failed: ${error}`,
            };
        }
    }
    /**
     * Normalizes username for consistent lookup
     */
    normalizeUsername(username) {
        const normalizedUsername = username.trim().toLowerCase();
        const frozenKey = `#${normalizedUsername}`;
        const alternateKey = normalizedUsername;
        return { normalizedUsername, frozenKey, alternateKey };
    }
    /**
     * Strategy 1: Frozen space scan for immutable data
     */
    async lookupInFrozenSpace(normalizedUsername) {
        return new Promise((resolve) => {
            let found = false;
            this.node
                .get("usernames")
                .map()
                .once((mappingData, hash) => {
                if (mappingData &&
                    mappingData.username === normalizedUsername &&
                    !found) {
                    found = true;
                    resolve({
                        ...mappingData,
                        hash,
                        source: "frozen_space",
                        immutable: true,
                    });
                }
            });
            setTimeout(() => {
                if (!found)
                    resolve(null);
            }, CONFIG.TIMEOUTS.LOOKUP_FROZEN_SPACE);
        });
    }
    /**
     * Strategy 2: Direct frozen mapping lookup
     */
    async lookupDirectMapping(normalizedUsername, frozenKey) {
        return new Promise((resolve) => {
            this.node
                .get("usernames")
                .get(frozenKey)
                .once((data) => {
                if (data) {
                    resolve({
                        pub: data,
                        username: normalizedUsername,
                        source: "direct_mapping",
                        immutable: false,
                    });
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    /**
     * Strategy 3: Alternate key lookup
     */
    async lookupAlternateKey(normalizedUsername, alternateKey) {
        return new Promise((resolve) => {
            this.node
                .get("usernames")
                .get(alternateKey)
                .once((data) => {
                if (data) {
                    resolve({
                        pub: data,
                        username: normalizedUsername,
                        source: "alternate_key",
                        immutable: false,
                    });
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    /**
     * Strategy 4: Comprehensive scan fallback
     */
    async lookupComprehensiveScan(normalizedUsername, frozenKey, alternateKey) {
        return new Promise((resolve) => {
            let found = false;
            this.node
                .get("usernames")
                .map()
                .once((data, key) => {
                if ((key === frozenKey || key === alternateKey) && data && !found) {
                    found = true;
                    resolve({
                        pub: data,
                        username: normalizedUsername,
                        source: "comprehensive_scan",
                        immutable: false,
                    });
                }
            });
            setTimeout(() => {
                if (!found)
                    resolve(null);
            }, CONFIG.TIMEOUTS.LOOKUP_COMPREHENSIVE);
        });
    }
    /**
     * Creates lookup strategies array
     */
    createLookupStrategies(normalizedUsername, frozenKey, alternateKey) {
        return [
            () => this.lookupInFrozenSpace(normalizedUsername),
            () => this.lookupDirectMapping(normalizedUsername, frozenKey),
            () => this.lookupAlternateKey(normalizedUsername, alternateKey),
            () => this.lookupComprehensiveScan(normalizedUsername, frozenKey, alternateKey),
        ];
    }
    /**
     * Processes lookup result to get complete user data
     */
    async processLookupResult(result, normalizedUsername) {
        // If we found a pub, try to fetch user data
        if (typeof result.pub === "string" && result.pub) {
            const pubKey = result.pub;
            const userData = await new Promise((resolve) => {
                this.node.get(pubKey).once((data) => {
                    resolve(data || null);
                });
            });
            // Always return an object with pub and username if possible
            if (userData && userData.username) {
                return {
                    ...userData,
                    source: result.source,
                    immutable: result.immutable,
                    hash: result.hash,
                };
            }
            return {
                pub: result.pub,
                username: normalizedUsername,
                source: result.source,
                immutable: result.immutable,
                hash: result.hash,
            };
        }
        // If result is already a complete object (from frozen space)
        if (result.userPub && result.username) {
            return result;
        }
        return result;
    }
    async checkUsernameExists(username) {
        try {
            // Normalize username to handle variations
            const { normalizedUsername, frozenKey, alternateKey } = this.normalizeUsername(username);
            // Create multiple lookup strategies with frozen space priority
            const lookupStrategies = this.createLookupStrategies(normalizedUsername, frozenKey, alternateKey);
            // Sequential strategy execution with timeout
            for (const strategy of lookupStrategies) {
                try {
                    const result = await Promise.race([
                        strategy(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Lookup timeout")), CONFIG.TIMEOUTS.STRATEGY_TIMEOUT)),
                    ]);
                    if (result) {
                        return await this.processLookupResult(result, normalizedUsername);
                    }
                }
                catch (error) {
                    // Silent for timeout or network errors
                }
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Performs authentication with Gun
     */
    async performAuthentication(username, password, pair) {
        return new Promise((resolve) => {
            console.log(`Attempting authentication for user: ${username}`);
            if (pair) {
                this.gun.user().auth(pair, (ack) => {
                    console.log(`Pair authentication result:`, ack);
                    if (ack.err) {
                        console.error(`Login error for ${username}: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        resolve({ success: true, ack });
                    }
                });
            }
            else {
                this.gun.user().auth(username, password, (ack) => {
                    console.log(`Password authentication result:`, ack);
                    if (ack.err) {
                        console.error(`Login error for ${username}: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        resolve({ success: true, ack });
                    }
                });
            }
        });
    }
    /**
     * Builds login result object
     */
    buildLoginResult(username, userPub) {
        // Get the SEA pair from the user object
        const seaPair = this.gun.user()?._?.sea;
        return {
            success: true,
            userPub,
            username,
            // Include SEA pair for consistency with AuthResult interface
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
    async login(username, password, pair) {
        try {
            // Check rate limiting first
            const rateLimitCheck = this.checkRateLimit(username, "login");
            if (!rateLimitCheck.allowed) {
                return { success: false, error: rateLimitCheck.error };
            }
            const loginResult = await this.performAuthentication(username, password, pair);
            if (!loginResult.success) {
                return {
                    success: false,
                    error: `User '${username}' not found. Please check your username or register first.`,
                };
            }
            // Add a small delay to ensure user state is properly set
            await new Promise((resolve) => setTimeout(resolve, 100));
            const userPub = this.gun.user().is?.pub;
            console.log(`Login authentication successful, extracted userPub: ${userPub}`);
            console.log(`User object:`, this.gun.user());
            console.log(`User.is:`, this.gun.user().is);
            if (!userPub) {
                return {
                    success: false,
                    error: "Authentication failed: No user pub returned.",
                };
            }
            // Reset rate limiting on successful login
            this.resetRateLimit(username, "login");
            // Pass the userPub to runPostAuthOnAuthResult
            try {
                await this.runPostAuthOnAuthResult(username, userPub, {
                    success: true,
                    userPub: userPub,
                });
            }
            catch (postAuthError) {
                console.error(`Post-auth error during login: ${postAuthError}`);
                // Continue with login even if post-auth fails
            }
            // Save credentials for future sessions
            try {
                const userInfo = {
                    username,
                    pair: pair ?? null,
                    userPub: userPub,
                };
                this.saveCredentials(userInfo);
            }
            catch (saveError) {
                console.error(`Error saving credentials:`, saveError);
            }
            return this.buildLoginResult(username, userPub);
        }
        catch (error) {
            console.error(`Exception during login for ${username}: ${error}`);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Updates the user's alias (username) in Gun and saves the updated credentials
     * @param newAlias New alias/username to set
     * @returns Promise resolving to update result
     */
    async updateUserAlias(newAlias) {
        try {
            // Updating user alias to
            if (!this.user) {
                return { success: false, error: "User not authenticated" };
            }
            await new Promise((resolve, reject) => {
                this.user.get("alias").put(newAlias, (ack) => {
                    if (ack.err) {
                        reject(ack.err);
                    }
                    else {
                        resolve(ack);
                    }
                });
            });
            // User alias updated successfully to
            return { success: true };
        }
        catch (error) {
            console.error(`Error updating user alias:`, error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Encrypts session data before storage
     */
    async encryptSessionData(data) {
        try {
            // Use a derived key from device fingerprint for encryption
            const deviceInfo = navigator.userAgent +
                (typeof screen !== "undefined"
                    ? screen.width + "x" + screen.height
                    : "");
            const encryptionKey = await sea_1.default.work(deviceInfo, null, null, {
                name: "SHA-256",
            });
            if (!encryptionKey) {
                throw new Error("Failed to generate encryption key");
            }
            const encryptedData = await sea_1.default.encrypt(JSON.stringify(data), encryptionKey);
            if (!encryptedData) {
                throw new Error("Failed to encrypt session data");
            }
            return encryptedData;
        }
        catch (error) {
            console.error("Error encrypting session data:", error);
            throw error;
        }
    }
    /**
     * Decrypts session data from storage
     */
    async decryptSessionData(encryptedData) {
        try {
            // Use the same device fingerprint for decryption
            const deviceInfo = navigator.userAgent +
                (typeof screen !== "undefined"
                    ? screen.width + "x" + screen.height
                    : "");
            const encryptionKey = await sea_1.default.work(deviceInfo, null, null, {
                name: "SHA-256",
            });
            if (!encryptionKey) {
                throw new Error("Failed to generate decryption key");
            }
            const decryptedData = await sea_1.default.decrypt(encryptedData, encryptionKey);
            if (decryptedData === undefined) {
                throw new Error("Failed to decrypt session data");
            }
            return JSON.parse(decryptedData);
        }
        catch (error) {
            console.error("Error decrypting session data:", error);
            throw error;
        }
    }
    saveCredentials(userInfo) {
        try {
            const sessionInfo = {
                username: userInfo.username,
                pair: userInfo.pair,
                userPub: userInfo.userPub,
                timestamp: Date.now(),
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            };
            if (typeof sessionStorage !== "undefined") {
                // Encrypt session data before storage
                this.encryptSessionData(sessionInfo)
                    .then((encryptedData) => {
                    sessionStorage.setItem("gunSessionData", encryptedData);
                })
                    .catch((error) => {
                    console.error("Failed to encrypt and save session data:", error);
                    // Fallback to unencrypted storage (less secure)
                    sessionStorage.setItem("gunSessionData", JSON.stringify(sessionInfo));
                });
            }
        }
        catch (error) {
            console.error(`Error saving credentials: ${error}`);
        }
    }
    /**
     * Sets up security questions and password hint
     * @param username Username
     * @param password Current password
     * @param hint Password hint
     * @param securityQuestions Array of security questions
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the operation result
     */
    async setPasswordHint(username, password, hint, securityQuestions, securityAnswers) {
        // Setting password hint for
        // Verify that the user is authenticated with password
        const loginResult = await this.login(username, password);
        if (!loginResult.success) {
            return { success: false, error: "Authentication failed" };
        }
        // Check if user was authenticated with password (not with other methods)
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.pub) {
            return { success: false, error: "User not authenticated" };
        }
        try {
            // Generate a proof of work from security question answers
            const answersText = securityAnswers.join("|");
            let proofOfWork;
            try {
                // Use SEA directly if available
                if (sea_1.default && sea_1.default.work) {
                    proofOfWork = await sea_1.default.work(answersText, null, null, {
                        name: "SHA-256",
                    });
                }
                else if (this.crypto && this.crypto.hashText) {
                    proofOfWork = await this.crypto.hashText(answersText);
                }
                else {
                    throw new Error("Cryptographic functions not available");
                }
                if (!proofOfWork) {
                    throw new Error("Failed to generate hash");
                }
            }
            catch (hashError) {
                console.error("Error generating hash:", hashError);
                return { success: false, error: "Failed to generate security hash" };
            }
            // Encrypt the password hint with the proof of work
            let encryptedHint;
            try {
                if (sea_1.default && sea_1.default.encrypt) {
                    encryptedHint = await sea_1.default.encrypt(hint, proofOfWork);
                }
                else if (this.crypto && this.crypto.encrypt) {
                    encryptedHint = await this.crypto.encrypt(hint, proofOfWork);
                }
                else {
                    throw new Error("Encryption functions not available");
                }
                if (!encryptedHint) {
                    throw new Error("Failed to encrypt hint");
                }
            }
            catch (encryptError) {
                console.error("Error encrypting hint:", encryptError);
                return { success: false, error: "Failed to encrypt password hint" };
            }
            // Save to the public graph, readable by anyone but only decryptable with the right answers.
            const userPub = currentUser.pub;
            const securityPayload = {
                questions: JSON.stringify(securityQuestions),
                hint: encryptedHint,
            };
            await new Promise((resolve, reject) => {
                this.node.get(userPub)
                    .get("security")
                    .put(securityPayload, (ack) => {
                    if (ack.err) {
                        console.error("Error saving security data to public graph:", ack.err);
                        reject(new Error(ack.err));
                    }
                    else {
                        // console.log(`Security data saved to public graph for ${userPub}`);
                        resolve();
                    }
                });
            });
            return { success: true };
        }
        catch (error) {
            console.error("Error setting password hint:", error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Recovers password hint using security question answers
     * @param username Username
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the password hint
     */
    async forgotPassword(username, securityAnswers) {
        // Attempting password recovery for
        try {
            // Find the user's data
            let userData = await this.checkUsernameExists(username);
            // Patch: if userData is a string, treat as pub
            if (typeof userData === "string") {
                userData = { pub: userData, username };
            }
            if (!userData || !userData.pub) {
                return { success: false, error: "User not found" };
            }
            // Extract the public key from user data
            const userPub = userData.pub;
            // console.log(`Found user public key for password recovery: ${userPub}`);
            // Access the user's security data directly from their public key node
            const securityData = await new Promise((resolve) => {
                this.node.get(userPub).get("security").once((data) => {
                    // console.log(
                    //   `Retrieved security data for user ${username}:`,
                    //   data ? "found" : "not found",
                    // );
                    resolve(data);
                });
            });
            if (!securityData || !securityData.hint) {
                return {
                    success: false,
                    error: "No password hint found",
                };
            }
            // Generate hash from security answers
            const answersText = securityAnswers.join("|");
            let proofOfWork;
            try {
                // Use SEA directly if available
                if (sea_1.default && sea_1.default.work) {
                    proofOfWork = await sea_1.default.work(answersText, null, null, {
                        name: "SHA-256",
                    });
                }
                else if (this.crypto && this.crypto.hashText) {
                    proofOfWork = await this.crypto.hashText(answersText);
                }
                else {
                    throw new Error("Cryptographic functions not available");
                }
                if (!proofOfWork) {
                    throw new Error("Failed to generate hash");
                }
            }
            catch (hashError) {
                console.error("Error generating hash:", hashError);
                return { success: false, error: "Failed to generate security hash" };
            }
            // Decrypt the password hint with the proof of work
            let hint;
            try {
                if (sea_1.default && sea_1.default.decrypt) {
                    hint = await sea_1.default.decrypt(securityData.hint, proofOfWork);
                }
                else if (this.crypto && this.crypto.decrypt) {
                    hint = await this.crypto.decrypt(securityData.hint, proofOfWork);
                }
                else {
                    throw new Error("Decryption functions not available");
                }
            }
            catch (decryptError) {
                return {
                    success: false,
                    error: "Incorrect answers to security questions",
                };
            }
            if (hint === undefined) {
                return {
                    success: false,
                    error: "Incorrect answers to security questions",
                };
            }
            return { success: true, hint: hint };
        }
        catch (error) {
            console.error("Error recovering password hint:", error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Saves user data at the specified path
     * @param path Path to save the data (supports nested paths like "test/data/marco")
     * @param data Data to save
     * @returns Promise that resolves when the data is saved
     */
    async putUserData(path, data) {
        return new Promise((resolve, reject) => {
            const user = this.gun.user();
            if (!user.is) {
                this.emitDataEvent("gun:put", `user/${path}`, data, false, "User not authenticated");
                reject(new Error("User not authenticated"));
                return;
            }
            this.navigateToPath(user, path).put(data, (ack) => {
                if (ack.err) {
                    this.emitDataEvent("gun:put", `user/${path}`, data, false, ack.err);
                    reject(new Error(ack.err));
                }
                else {
                    this.emitDataEvent("gun:put", `user/${path}`, data, true);
                    resolve(ack);
                }
            });
        });
    }
    /**
     * Gets user data from the specified path
     * @param path Path to get the data from (supports nested paths like "test/data/marco")
     * @returns Promise that resolves with the data
     */
    async getUserData(path) {
        return new Promise((resolve, reject) => {
            // Validazione del path
            if (!path || typeof path !== "string") {
                const error = "Path must be a non-empty string";
                this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
                reject(new Error(error));
                return;
            }
            const user = this.gun.user();
            if (!user.is) {
                const error = "User not authenticated";
                this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
                reject(new Error(error));
                return;
            }
            // Timeout per evitare attese infinite
            const timeout = setTimeout(() => {
                const error = "Operation timeout";
                this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
                reject(new Error(error));
            }, CONFIG.TIMEOUTS.USER_DATA_OPERATION); // 10 secondi di timeout
            try {
                this.navigateToPath(user, path).once((data) => {
                    clearTimeout(timeout);
                    // Gestisci i riferimenti GunDB
                    if (data && typeof data === "object" && data["#"]) {
                        // È un riferimento GunDB, carica i dati effettivi
                        const referencePath = data["#"];
                        this.navigateToPath(this.gun, referencePath).once((actualData) => {
                            this.emitDataEvent("gun:get", `user/${path}`, actualData, true);
                            resolve(actualData);
                        });
                    }
                    else {
                        // Dati diretti, restituisci così come sono
                        this.emitDataEvent("gun:get", `user/${path}`, data, true);
                        resolve(data);
                    }
                });
            }
            catch (error) {
                clearTimeout(timeout);
                const errorMsg = error instanceof Error ? error.message : "Unknown error";
                this.emitDataEvent("gun:get", `user/${path}`, null, false, errorMsg);
                reject(error);
            }
        });
    }
    /**
     * Derive cryptographic keys from password and optional extras
     * Supports multiple key derivation algorithms: P-256, secp256k1 (Bitcoin), secp256k1 (Ethereum)
     * @param password - Password or seed for key derivation
     * @param extra - Additional entropy (string or array of strings)
     * @param options - Derivation options to specify which key types to generate
     * @returns Promise resolving to derived keys object
     */
    async derive(password, extra, options) {
        try {
            // Deriving cryptographic keys with options
            // Call the derive function with the provided parameters
            const derivedKeys = await (0, derive_1.default)(password, extra, options);
            // Map the returned keys to the expected format
            const result = {};
            // Map P-256 keys (already in correct format)
            if (derivedKeys.pub &&
                derivedKeys.priv &&
                derivedKeys.epub &&
                derivedKeys.epriv) {
                result.p256 = {
                    pub: derivedKeys.pub,
                    priv: derivedKeys.priv,
                    epub: derivedKeys.epub,
                    epriv: derivedKeys.epriv,
                };
            }
            // Map Bitcoin keys (privateKey -> priv, publicKey -> pub)
            if (derivedKeys.secp256k1Bitcoin) {
                result.secp256k1Bitcoin = {
                    pub: derivedKeys.secp256k1Bitcoin.publicKey,
                    priv: derivedKeys.secp256k1Bitcoin.privateKey,
                    address: derivedKeys.secp256k1Bitcoin.address,
                };
            }
            // Map Ethereum keys (privateKey -> priv, publicKey -> pub)
            if (derivedKeys.secp256k1Ethereum) {
                result.secp256k1Ethereum = {
                    pub: derivedKeys.secp256k1Ethereum.publicKey,
                    priv: derivedKeys.secp256k1Ethereum.privateKey,
                    address: derivedKeys.secp256k1Ethereum.address,
                };
            }
            // Key derivation completed successfully
            return result;
        }
        catch (error) {
            console.error("Error during key derivation:", error);
            // Use centralized error handler
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "KEY_DERIVATION_FAILED", error instanceof Error
                ? error.message
                : "Failed to derive cryptographic keys", error);
            throw error;
        }
    }
    /**
     * Derive P-256 keys (default Gun.SEA behavior)
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to P-256 keys
     */
    async deriveP256(password, extra) {
        const result = await this.derive(password, extra, { includeP256: true });
        return result.p256;
    }
    /**
     * Derive Bitcoin secp256k1 keys with P2PKH address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Bitcoin keys and address
     */
    async deriveBitcoin(password, extra) {
        const result = await this.derive(password, extra, {
            includeSecp256k1Bitcoin: true,
        });
        return result.secp256k1Bitcoin;
    }
    /**
     * Derive Ethereum secp256k1 keys with Keccak256 address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Ethereum keys and address
     */
    async deriveEthereum(password, extra) {
        const result = await this.derive(password, extra, {
            includeSecp256k1Ethereum: true,
        });
        return result.secp256k1Ethereum;
    }
    /**
     * Derive all supported key types
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to all key types
     */
    async deriveAll(password, extra) {
        const result = await this.derive(password, extra, {
            includeP256: true,
            includeSecp256k1Bitcoin: true,
            includeSecp256k1Ethereum: true,
        });
        return {
            p256: result.p256,
            secp256k1Bitcoin: result.secp256k1Bitcoin,
            secp256k1Ethereum: result.secp256k1Ethereum,
        };
    }
    /**
     * Prepares data for freezing with metadata
     */
    prepareFrozenData(data, options) {
        return {
            data: data,
            timestamp: Date.now(),
            description: options?.description || "",
            metadata: options?.metadata || {},
        };
    }
    /**
     * Generates hash for frozen data
     */
    async generateFrozenDataHash(frozenData) {
        const dataString = JSON.stringify(frozenData);
        const hash = await sea_1.default.work(dataString, null, null, {
            name: "SHA-256",
        });
        return hash ? hash : null;
    }
    /**
     * Builds the full path for frozen data
     */
    buildFrozenPath(hash, options) {
        const namespace = options?.namespace || "default";
        const customPath = options?.path || "";
        return customPath
            ? `${namespace}/${customPath}/${hash}`
            : `${namespace}/${hash}`;
    }
    /**
     * Stores frozen data in Gun
     */
    async storeFrozenData(frozenData, fullPath, hash) {
        return new Promise((resolve, reject) => {
            const targetNode = this.navigateToPath(this.gun, fullPath);
            targetNode.put(frozenData, (ack) => {
                if (ack.err) {
                    reject(new Error(`Failed to create frozen space: ${ack.err}`));
                }
                else {
                    resolve({
                        hash: hash,
                        fullPath: fullPath,
                        data: frozenData,
                    });
                }
            });
        });
    }
    /**
     * Creates a frozen space entry for immutable data
     * @param data Data to freeze
     * @param options Optional configuration
     * @returns Promise resolving to the frozen data hash
     */
    async createFrozenSpace(data, options) {
        return new Promise(async (resolve, reject) => {
            try {
                // Prepare the data to freeze
                const frozenData = this.prepareFrozenData(data, options);
                // Generate hash for the data
                const hash = await this.generateFrozenDataHash(frozenData);
                if (!hash) {
                    reject(new Error("Failed to generate hash for frozen data"));
                    return;
                }
                // Build the full path
                const fullPath = this.buildFrozenPath(hash, options);
                // Store the frozen data
                const result = await this.storeFrozenData(frozenData, fullPath, hash);
                resolve(result);
            }
            catch (error) {
                reject(new Error(`Error creating frozen space: ${error}`));
            }
        });
    }
    /**
     * Retrieves data from frozen space
     * @param hash Hash of the frozen data
     * @param namespace Optional namespace
     * @param path Optional custom path
     * @returns Promise resolving to the frozen data
     */
    async getFrozenSpace(hash, namespace = "default", path) {
        return new Promise((resolve, reject) => {
            // Costruisci il percorso completo
            const fullPath = path
                ? `${namespace}/${path}/${hash}`
                : `${namespace}/${hash}`;
            // Usa navigateToPath per gestire correttamente i percorsi con /
            const targetNode = this.navigateToPath(this.gun, fullPath);
            targetNode.once((data) => {
                if (!data) {
                    reject(new Error(`Frozen data not found: ${fullPath}`));
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    /**
     * Verifies if data matches a frozen space entry
     * @param data Data to verify
     * @param hash Expected hash
     * @param namespace Optional namespace
     * @param path Optional custom path
     * @returns Promise resolving to verification result
     */
    async verifyFrozenSpace(data, hash, namespace = "default", path) {
        try {
            // Genera hash dei dati forniti
            const dataString = JSON.stringify(data);
            const generatedHash = await sea_1.default.work(dataString, null, null, {
                name: "SHA-256",
            });
            if (!generatedHash) {
                return { verified: false, error: "Failed to generate hash" };
            }
            // Confronta gli hash
            if (generatedHash !== hash) {
                return { verified: false, error: "Hash mismatch" };
            }
            // Verifica che esista nel frozen space
            const frozenData = await this.getFrozenSpace(hash, namespace, path);
            return {
                verified: true,
                frozenData: frozenData,
            };
        }
        catch (error) {
            return {
                verified: false,
                error: `Verification failed: ${error}`,
            };
        }
    }
    // Errors
    static Errors = GunErrors;
    /**
     * Sanitizes username to prevent path construction issues
     * @param username Raw username
     * @returns Sanitized username
     */
    sanitizeUsername(username) {
        if (!username || typeof username !== "string") {
            return "";
        }
        return username
            .trim()
            .toLowerCase()
            .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
            .replace(/[^a-zA-Z0-9._-]/g, "") // Only allow alphanumeric, dots, underscores, and hyphens
            .replace(/^[^a-zA-Z]/, "") // Must start with a letter
            .substring(0, 50); // Limit length
    }
    /**
     * Changes the username for the currently authenticated user
     * @param newUsername New username to set
     * @returns Promise resolving to the operation result
     */
    async changeUsername(newUsername) {
        try {
            // Check if user is authenticated
            if (!this.isLoggedIn()) {
                return { success: false, error: "User not authenticated" };
            }
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.pub) {
                return { success: false, error: "No authenticated user found" };
            }
            const userPub = currentUser.pub;
            // Validate new username
            if (!newUsername ||
                typeof newUsername !== "string" ||
                newUsername.trim().length === 0) {
                return { success: false, error: "New username cannot be empty" };
            }
            // Sanitize new username
            const sanitizedNewUsername = this.sanitizeUsername(newUsername);
            if (sanitizedNewUsername.length === 0) {
                return {
                    success: false,
                    error: "New username contains only invalid characters",
                };
            }
            // Validate username format (alphanumeric and some special chars only)
            if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedNewUsername)) {
                return {
                    success: false,
                    error: "Username can only contain letters, numbers, dots, underscores, and hyphens",
                };
            }
            // Check if new username is already in use by another user
            const existingUserCheck = await this.checkUsernameExists(sanitizedNewUsername);
            if (existingUserCheck && existingUserCheck.pub !== userPub) {
                return {
                    success: false,
                    error: `Username '${sanitizedNewUsername}' is already in use by another user`,
                };
            }
            // Get current user data to find old username
            const currentUserData = await new Promise((resolve) => {
                this.gun.get(userPub).once((data) => {
                    resolve(data);
                });
            });
            const oldUsername = currentUserData?.username || "unknown";
            // If the new username is the same as the old one, no need to change
            if (oldUsername === sanitizedNewUsername) {
                return {
                    success: true,
                    oldUsername,
                    newUsername: sanitizedNewUsername,
                };
            }
            // Remove old username mapping if it exists
            if (oldUsername && oldUsername !== "unknown") {
                try {
                    await new Promise((resolve, reject) => {
                        this.node
                            .get("usernames")
                            .get(oldUsername)
                            .put(null, (ack) => {
                            if (ack.err) {
                                console.warn(`Warning: Could not remove old username mapping: ${ack.err}`);
                            }
                            resolve();
                        });
                    });
                }
                catch (error) {
                    console.warn(`Warning: Error removing old username mapping: ${error}`);
                    // Continue anyway, don't fail the operation
                }
            }
            // Create new username mapping
            try {
                await new Promise((resolve, reject) => {
                    this.node
                        .get("usernames")
                        .get(sanitizedNewUsername)
                        .put(userPub, (ack) => {
                        if (ack.err) {
                            reject(new Error(`Failed to create new username mapping: ${ack.err}`));
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
            catch (error) {
                return {
                    success: false,
                    error: `Failed to create new username mapping: ${error}`,
                };
            }
            // Update user metadata with new username
            try {
                await new Promise((resolve, reject) => {
                    this.gun
                        .get(userPub)
                        .put({ username: sanitizedNewUsername }, (ack) => {
                        if (ack.err) {
                            reject(new Error(`Failed to update user metadata: ${ack.err}`));
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
            catch (error) {
                // If metadata update fails, try to revert the username mapping
                try {
                    await new Promise((resolve) => {
                        this.node
                            .get("usernames")
                            .get(sanitizedNewUsername)
                            .put(null, () => resolve());
                    });
                }
                catch (revertError) {
                    console.error(`Failed to revert username mapping after metadata update failure: ${revertError}`);
                }
                return {
                    success: false,
                    error: `Failed to update user metadata: ${error}`,
                };
            }
            console.log(`Username changed successfully from '${oldUsername}' to '${sanitizedNewUsername}' for user ${userPub}`);
            return {
                success: true,
                oldUsername,
                newUsername: sanitizedNewUsername,
            };
        }
        catch (error) {
            console.error(`Error changing username: ${error}`);
            return {
                success: false,
                error: `Username change failed: ${error}`,
            };
        }
    }
}
exports.GunInstance = GunInstance;
