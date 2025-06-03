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
exports.GunDB = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const rxjs_integration_1 = require("./rxjs-integration");
const GunErrors = __importStar(require("./errors"));
const crypto = __importStar(require("./crypto"));
const utils = __importStar(require("./utils"));
const derive_1 = __importDefault(require("./derive"));
class GunDB {
    gun;
    user = null;
    crypto;
    utils;
    node;
    onAuthCallbacks = [];
    // Integrated modules
    _rxjs;
    constructor(gun, appScope = "shogun") {
        (0, logger_1.log)("Initializing GunDB");
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
        try {
            this.user = this.gun.user().recall({ sessionStorage: true });
        }
        catch (error) {
            (0, logger_1.logError)("Error initializing Gun user:", error);
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this.subscribeToAuthEvents();
        // bind crypto and utils
        this.crypto = crypto;
        this.utils = utils;
        this.node = this.gun.get(appScope);
        // Attempt to restore session after initialization
        setTimeout(async () => {
            try {
                const sessionResult = await this.restoreSession();
                if (sessionResult.success) {
                    (0, logger_1.log)(`Session automatically restored for user: ${sessionResult.userPub}`);
                }
                else {
                    (0, logger_1.log)(`No previous session to restore: ${sessionResult.error}`);
                }
            }
            catch (error) {
                (0, logger_1.logError)("Error during automatic session restoration:", error);
            }
        }, 500); // Give Gun time to initialize
    }
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            (0, logger_1.log)("Auth event received:", ack);
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
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer) {
        this.gun.opt({ peers: [peer] });
        (0, logger_1.log)(`Added new peer: ${peer}`);
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
                (0, logger_1.log)(`Removed peer: ${peer}`);
            }
            else {
                (0, logger_1.log)(`Peer not found in current connections: ${peer}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error removing peer ${peer}:`, error);
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
            (0, logger_1.logError)("Error getting current peers:", error);
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
            (0, logger_1.logError)("Error getting configured peers:", error);
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
            (0, logger_1.logError)("Error getting peer info:", error);
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
            // Wait a moment then add it back
            setTimeout(() => {
                this.addPeer(peer);
                (0, logger_1.log)(`Reconnected to peer: ${peer}`);
            }, 1000);
        }
        catch (error) {
            (0, logger_1.logError)(`Error reconnecting to peer ${peer}:`, error);
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
                (0, logger_1.log)(`Reset peers. New peers: ${newPeers ? newPeers.join(", ") : "none"}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error resetting peers:", error);
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
        if (!path)
            return node;
        // Split path by '/' and filter out empty segments
        const pathSegments = path
            .split("/")
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
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async put(path, data) {
        return new Promise((resolve) => {
            this.navigateToPath(this.gun, path).put(data, (ack) => {
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
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
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
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
                resolve(ack.err ? { success: false, error: ack.err } : { success: true });
            });
        });
    }
    /**
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    async signUp(username, password) {
        (0, logger_1.log)("Attempting user registration:", username);
        try {
            // Validate credentials
            if (password.length < 8) {
                const err = "Passwords must be more than 8 characters long!";
                (0, logger_1.log)(err);
                return { success: false, error: err };
            }
            if (username.length < 1) {
                const err = "Username must be more than 0 characters long!";
                (0, logger_1.log)(err);
                return { success: false, error: err };
            }
            // Check if username already exists
            (0, logger_1.log)(`Checking if username ${username} already exists...`);
            const existingUser = await this.checkUsernameExists(username);
            if (existingUser) {
                (0, logger_1.log)(`Username ${username} already exists with pub: ${existingUser.pub}`);
                return {
                    success: false,
                    error: `Username '${username}' already exists. Please try to login instead.`,
                };
            }
            // Create user directly with Gun
            const createResult = await new Promise((resolve) => {
                this.gun.user().create(username, password, (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`User creation error: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        (0, logger_1.log)(`User created successfully: ${username}`);
                        resolve({ success: true, pub: ack.pub });
                    }
                });
            });
            if (!createResult.success) {
                return createResult;
            }
            // Store user metadata with improved safety and wait for confirmation
            try {
                const userNode = this.gun.get(createResult.pub);
                const userMetadata = {
                    username: username,
                    pub: createResult.pub,
                    createdAt: Date.now(),
                };
                // Save user metadata
                await new Promise((resolve, reject) => {
                    userNode.put(userMetadata, (ack) => {
                        if (ack.err) {
                            reject(new Error(`Failed to save user metadata: ${ack.err}`));
                        }
                        else {
                            (0, logger_1.log)(`User metadata saved for: ${username}`);
                            resolve();
                        }
                    });
                });
                // Add to users collection and wait for confirmation
                await new Promise((resolve, reject) => {
                    this.gun.get("users").set(userNode, (ack) => {
                        if (ack.err) {
                            reject(new Error(`Failed to add user to collection: ${ack.err}`));
                        }
                        else {
                            (0, logger_1.log)(`User added to collection: ${username}`);
                            resolve();
                        }
                    });
                });
                // Create a username -> pub mapping for faster lookups
                await new Promise((resolve, reject) => {
                    this.gun
                        .get("usernames")
                        .get(username)
                        .put(createResult.pub, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Warning: Could not create username mapping: ${ack.err}`);
                            resolve(); // Don't fail registration for this
                        }
                        else {
                            (0, logger_1.log)(`Username mapping created: ${username} -> ${createResult.pub}`);
                            resolve();
                        }
                    });
                });
            }
            catch (metadataError) {
                (0, logger_1.logError)(`Warning: Could not store user metadata: ${metadataError}`);
                // Continue with login attempt even if metadata storage fails
            }
            // Login after creation with retry mechanism
            (0, logger_1.log)(`Attempting login after registration for: ${username}`);
            let loginAttempts = 0;
            const maxAttempts = 3;
            while (loginAttempts < maxAttempts) {
                try {
                    const loginResult = await this.login(username, password);
                    if (loginResult.success) {
                        (0, logger_1.log)(`Login after registration successful for: ${username}`);
                        return {
                            success: true,
                            userPub: loginResult.userPub,
                            username: loginResult.username,
                        };
                    }
                    else {
                        loginAttempts++;
                        if (loginAttempts < maxAttempts) {
                            (0, logger_1.log)(`Login attempt ${loginAttempts} failed, retrying...`);
                            await new Promise((resolve) => setTimeout(resolve, 1000 * loginAttempts));
                        }
                        else {
                            (0, logger_1.logError)(`Login after registration failed after ${maxAttempts} attempts: ${loginResult.error}`);
                            return {
                                success: false,
                                error: `Registration completed but login failed: ${loginResult.error}`,
                            };
                        }
                    }
                }
                catch (loginError) {
                    loginAttempts++;
                    if (loginAttempts >= maxAttempts) {
                        (0, logger_1.logError)(`Exception during post-registration login: ${loginError}`);
                        return {
                            success: false,
                            error: "Exception during post-registration login",
                        };
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1000 * loginAttempts));
                }
            }
            return {
                success: false,
                error: "Failed to login after registration",
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Unexpected error during registration flow: ${error}`);
            return {
                success: false,
                error: `Unexpected error during registration: ${error}`,
            };
        }
    }
    /**
     * Check if a username already exists in the system
     * @param username Username to check
     * @returns Promise resolving to user data if exists, null otherwise
     */
    async checkUsernameExists(username) {
        try {
            // First check the username mapping (faster)
            const mappedPub = await new Promise((resolve) => {
                this.gun
                    .get("usernames")
                    .get(username)
                    .once((pub) => {
                    resolve(pub || null);
                });
            });
            if (mappedPub) {
                // Get user data from the pub
                const userData = await new Promise((resolve) => {
                    this.gun.get(mappedPub).once((data) => {
                        resolve(data);
                    });
                });
                return userData;
            }
            // Fallback: Search through all users collection (slower but more reliable)
            const existingUser = await new Promise((resolve) => {
                let found = false;
                let timeoutId;
                const checkComplete = () => {
                    if (timeoutId)
                        clearTimeout(timeoutId);
                    if (!found) {
                        resolve(null);
                    }
                };
                this.gun
                    .get("users")
                    .map()
                    .once((userData, key) => {
                    if (!found && userData && userData.username === username) {
                        found = true;
                        clearTimeout(timeoutId);
                        resolve(userData);
                    }
                });
                // Set a timeout to avoid hanging
                timeoutId = setTimeout(checkComplete, 2000);
            });
            return existingUser;
        }
        catch (error) {
            (0, logger_1.logError)(`Error checking username existence: ${error}`);
            return null;
        }
    }
    /**
     * Logs in a user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    async login(username, password, callback) {
        (0, logger_1.log)(`Attempting login for user: ${username}`);
        try {
            // First check if user exists in the system
            const existingUser = await this.checkUsernameExists(username);
            if (!existingUser) {
                const result = {
                    success: false,
                    error: `User '${username}' not found. Please check your username or register first.`,
                };
                if (callback)
                    callback(result);
                return result;
            }
            (0, logger_1.log)(`User ${username} found in system, attempting authentication...`);
            // Authenticate with Gun directly
            const authResult = await new Promise((resolve) => {
                this.gun.user().auth(username, password, (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Login error for ${username}: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        (0, logger_1.log)(`Login successful for: ${username}`);
                        resolve({ success: true, ack });
                    }
                });
            });
            if (!authResult.success) {
                const result = { success: false, error: authResult.error };
                if (callback)
                    callback(result);
                return result;
            }
            const userPub = this.gun.user().is?.pub;
            // Verify that the logged-in user matches the expected user
            if (userPub !== existingUser.pub) {
                (0, logger_1.logError)(`Login pub mismatch: expected ${existingUser.pub}, got ${userPub}`);
                const result = {
                    success: false,
                    error: "Authentication inconsistency detected. Please try again.",
                };
                if (callback)
                    callback(result);
                return result;
            }
            // Update users collection if needed - improved null safety
            try {
                let userExists = false;
                // Check if user already exists in the collection
                await new Promise((resolve) => {
                    this.gun
                        .get("users")
                        .map()
                        .once((userData, key) => {
                        if (userData && userData.pub === userPub) {
                            userExists = true;
                        }
                    });
                    // Give it a moment to check all users
                    setTimeout(() => resolve(), 100);
                });
                // Only add user if not already in collection
                if (!userExists && userPub) {
                    const newUser = this.gun.get(userPub).put({
                        username: username,
                        pub: userPub,
                        lastLogin: Date.now(),
                    });
                    this.gun.get("users").set(newUser);
                }
                else if (userExists && userPub) {
                    // Update last login time
                    this.gun.get(userPub).get("lastLogin").put(Date.now());
                }
            }
            catch (collectionError) {
                // Log but don't fail the login for collection errors
                (0, logger_1.logError)(`Warning: Could not update user collection: ${collectionError}`);
            }
            (0, logger_1.log)(`Login successful for: ${username} (${userPub})`);
            this._savePair();
            const result = {
                success: true,
                userPub,
                username,
            };
            if (callback)
                callback(result);
            return result;
        }
        catch (error) {
            (0, logger_1.logError)(`Exception during login for ${username}: ${error}`);
            const result = { success: false, error: String(error) };
            if (callback)
                callback(result);
            return result;
        }
    }
    _savePair() {
        try {
            const user = this.gun.user();
            const pair = user?._?.sea;
            const userInfo = user?.is;
            if (pair && userInfo && typeof localStorage !== "undefined") {
                // Save the crypto pair
                localStorage.setItem("gun/pair", JSON.stringify(pair));
                // Save user session info
                const sessionInfo = {
                    pub: userInfo.pub,
                    alias: userInfo.alias || "",
                    timestamp: Date.now(),
                };
                localStorage.setItem("gun/session", JSON.stringify(sessionInfo));
                (0, logger_1.log)(`Session saved for user: ${userInfo.alias || userInfo.pub}`);
            }
        }
        catch (error) {
            (0, logger_1.logError)("Error saving auth pair and session:", error);
        }
    }
    /**
     * Attempts to restore user session from local storage
     * @returns Promise resolving to session restoration result
     */
    async restoreSession() {
        try {
            if (typeof localStorage === "undefined") {
                return { success: false, error: "localStorage not available" };
            }
            const sessionInfo = localStorage.getItem("gun/session");
            const pairInfo = localStorage.getItem("gun/pair");
            if (!sessionInfo || !pairInfo) {
                (0, logger_1.log)("No saved session found");
                return { success: false, error: "No saved session" };
            }
            const session = JSON.parse(sessionInfo);
            const pair = JSON.parse(pairInfo);
            // Check if session is not too old (optional - you can adjust this)
            const sessionAge = Date.now() - session.timestamp;
            const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (sessionAge > maxSessionAge) {
                (0, logger_1.log)("Session expired, clearing storage");
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Session expired" };
            }
            (0, logger_1.log)(`Attempting to restore session for user: ${session.alias || session.pub}`);
            // Try to restore the session with Gun
            const user = this.gun.user();
            // Set the pair directly
            user._ = { sea: pair };
            // Try to recall the session
            const recallResult = await new Promise((resolve) => {
                try {
                    user.recall({ sessionStorage: true }, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Session recall error: ${ack.err}`);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }
                catch (error) {
                    (0, logger_1.logError)(`Session recall exception: ${error}`);
                    resolve(false);
                }
                // Fallback timeout
                setTimeout(() => resolve(false), 3000);
            });
            if (recallResult && user.is?.pub === session.pub) {
                (0, logger_1.log)(`Session restored successfully for: ${session.alias || session.pub}`);
                return { success: true, userPub: session.pub };
            }
            else {
                (0, logger_1.log)("Session restoration failed, clearing storage");
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Session restoration failed" };
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error restoring session: ${error}`);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Logs out the current user using direct Gun authentication
     */
    logout() {
        try {
            // Check if the user is actually logged in before attempting to logout
            if (!this.isLoggedIn()) {
                (0, logger_1.log)("No user logged in, skipping logout");
                return;
            }
            const currentUser = this.getCurrentUser();
            (0, logger_1.log)(`Logging out user: ${currentUser?.pub || "unknown"}`);
            // Direct logout using Gun
            this.gun.user().leave();
            // Clear local storage session data
            if (typeof localStorage !== "undefined") {
                localStorage.removeItem("gun/pair");
                localStorage.removeItem("gun/session");
                // Also clear old format for backward compatibility
                localStorage.removeItem("pair");
                (0, logger_1.log)("Local session data cleared");
            }
            // Clear sessionStorage as well
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.removeItem("gun/");
                sessionStorage.removeItem("gun/user");
                sessionStorage.removeItem("gun/auth");
                (0, logger_1.log)("Session storage cleared");
            }
            (0, logger_1.log)("Logout completed successfully");
        }
        catch (error) {
            (0, logger_1.logError)("Error during logout:", error);
        }
    }
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    isLoggedIn() {
        return !!this.gun.user()?.is?.pub;
    }
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    getCurrentUser() {
        const pub = this.gun.user()?.is?.pub;
        return pub ? { pub, user: this.gun.user() } : null;
    }
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx() {
        if (!this._rxjs) {
            this._rxjs = new rxjs_integration_1.GunRxJS(this.gun);
        }
        return this._rxjs;
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
        (0, logger_1.log)("Setting password hint for:", username);
        // Verify that the user is authenticated
        const loginResult = await this.login(username, password);
        if (!loginResult.success) {
            return { success: false, error: "Authentication failed" };
        }
        try {
            // Generate a proof of work from security question answers
            const proofOfWork = (await this.crypto.hashText(securityAnswers.join("|")));
            // Encrypt the password hint with the proof of work
            // The PoW (a string) is used as the encryption key
            const encryptedHint = await this.crypto.encrypt(hint, proofOfWork);
            // Save security questions and encrypted hint
            await this.saveUserData("security", {
                questions: securityQuestions,
                hint: encryptedHint,
            });
            return { success: true };
        }
        catch (error) {
            (0, logger_1.logError)("Error setting password hint:", error);
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
        (0, logger_1.log)("Attempting password recovery for:", username);
        try {
            // Verify the user exists
            const user = this.gun.user().recall({ sessionStorage: true });
            if (!user || !user.is) {
                return { success: false, error: "User not found" };
            }
            // Retrieve security questions and encrypted hint
            const securityData = await this.getUserData("security");
            if (!securityData || !securityData.hint) {
                return {
                    success: false,
                    error: "No password hint found",
                };
            }
            // Decrypt the password hint with the proof of work
            const hint = await this.crypto.decrypt(securityData.hint, (await this.crypto.hashText(securityAnswers.join("|"))));
            if (hint === undefined) {
                return {
                    success: false,
                    error: "Incorrect answers to security questions",
                };
            }
            return { success: true, hint: hint };
        }
        catch (error) {
            (0, logger_1.logError)("Error recovering password hint:", error);
            return { success: false, error: String(error) };
        }
    }
    /**
     * Hashes text with Gun.SEA
     * @param text Text to hash
     * @returns Promise that resolves with the hashed text
     */
    async hashText(text) {
        return this.crypto.hashText(text);
    }
    /**
     * Encrypts data with Gun.SEA
     * @param data Data to encrypt
     * @param key Encryption key
     * @returns Promise that resolves with the encrypted data
     */
    async encrypt(data, key) {
        return this.crypto.encrypt(data, key);
    }
    /**
     * Decrypts data with Gun.SEA
     * @param encryptedData Encrypted data
     * @param key Decryption key
     * @returns Promise that resolves with the decrypted data
     */
    async decrypt(encryptedData, key) {
        return this.crypto.decrypt(encryptedData, key);
    }
    /**
     * Saves user data at the specified path
     * @param path Path to save the data (supports nested paths like "test/data/marco")
     * @param data Data to save
     * @returns Promise that resolves when the data is saved
     */
    async saveUserData(path, data) {
        return new Promise((resolve, reject) => {
            const user = this.gun.user();
            if (!user.is) {
                reject(new Error("User not authenticated"));
                return;
            }
            this.navigateToPath(user, path).put(data, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                }
                else {
                    resolve();
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
        return new Promise((resolve) => {
            const user = this.gun.user();
            if (!user.is) {
                resolve(null);
                return;
            }
            this.navigateToPath(user, path).once((data) => {
                resolve(data);
            });
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
            (0, logger_1.log)("Deriving cryptographic keys with options:", options);
            // Call the derive function with the provided parameters
            const derivedKeys = await (0, derive_1.default)(password, extra, options);
            (0, logger_1.log)("Key derivation completed successfully");
            return derivedKeys;
        }
        catch (error) {
            (0, logger_1.logError)("Error during key derivation:", error);
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
        return this.derive(password, extra, { includeP256: true });
    }
    /**
     * Derive Bitcoin secp256k1 keys with P2PKH address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Bitcoin keys and address
     */
    async deriveBitcoin(password, extra) {
        return this.derive(password, extra, { includeSecp256k1Bitcoin: true });
    }
    /**
     * Derive Ethereum secp256k1 keys with Keccak256 address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Ethereum keys and address
     */
    async deriveEthereum(password, extra) {
        return this.derive(password, extra, { includeSecp256k1Ethereum: true });
    }
    /**
     * Derive all supported key types
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to all key types
     */
    async deriveAll(password, extra) {
        return this.derive(password, extra, {
            includeP256: true,
            includeSecp256k1Bitcoin: true,
            includeSecp256k1Ethereum: true,
        });
    }
    // Errors
    static Errors = GunErrors;
}
exports.GunDB = GunDB;
