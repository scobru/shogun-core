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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GunDB = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const rxjs_integration_1 = require("./rxjs-integration");
const GunErrors = __importStar(require("./errors"));
const crypto = __importStar(require("./crypto"));
const utils = __importStar(require("./utils"));
require("gun/sea");
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
        return this.gun.get(path);
    }
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    async put(path, data) {
        return new Promise((resolve) => {
            this.gun.get(path).put(data, (ack) => {
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
            this.gun.get(path).set(data, (ack) => {
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
            this.gun.get(path).put(null, (ack) => {
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
            // Store user metadata with improved safety
            try {
                const user = this.gun.get(createResult.pub).put({
                    username: username,
                    pub: createResult.pub,
                });
                this.gun.get("users").set(user);
            }
            catch (metadataError) {
                (0, logger_1.logError)(`Warning: Could not store user metadata: ${metadataError}`);
                // Continue with login attempt even if metadata storage fails
            }
            // Login after creation
            (0, logger_1.log)(`Attempting login after registration for: ${username}`);
            try {
                const loginResult = await this.login(username, password);
                if (!loginResult.success) {
                    (0, logger_1.logError)(`Login after registration failed: ${loginResult.error}`);
                    return {
                        success: false,
                        error: `Registration completed but login failed: ${loginResult.error}`,
                    };
                }
                (0, logger_1.log)(`Login after registration successful for: ${username}`);
                return loginResult;
            }
            catch (loginError) {
                (0, logger_1.logError)(`Exception during post-registration login: ${loginError}`);
                return {
                    success: false,
                    error: "Exception during post-registration login",
                };
            }
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
     * Logs in a user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    async login(username, password, callback) {
        (0, logger_1.log)(`Attempting login for user: ${username}`);
        try {
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
                    });
                    this.gun.get("users").set(newUser);
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
            const pair = this.gun.user()?._?.sea;
            if (pair && typeof localStorage !== "undefined") {
                localStorage.setItem("pair", JSON.stringify(pair));
            }
        }
        catch (error) {
            console.error("Error saving auth pair:", error);
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
            // Direct logout using Gun
            this.gun.user().leave();
            (0, logger_1.log)("Logout completed");
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
     * @param path Path to save the data
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
            user.get(path).put(data, (ack) => {
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
     * @param path Path to get the data from
     * @returns Promise that resolves with the data
     */
    async getUserData(path) {
        return new Promise((resolve) => {
            const user = this.gun.user();
            if (!user.is) {
                resolve(null);
                return;
            }
            user.get(path).once((data) => {
                resolve(data);
            });
        });
    }
    // Errors
    static Errors = GunErrors;
}
exports.GunDB = GunDB;
