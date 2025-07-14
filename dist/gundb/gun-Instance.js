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
let Gun;
let SEA;
if (typeof window !== "undefined") {
    exports.Gun = Gun = require("gun/gun");
    exports.SEA = SEA = require("gun/sea");
}
else {
    exports.Gun = Gun = Promise.resolve().then(() => __importStar(require("gun/gun"))).then((module) => module.default);
    exports.SEA = SEA = Promise.resolve().then(() => __importStar(require("gun/sea"))).then((module) => module.default);
}
require("gun/lib/then.js");
require("gun/lib/radix.js");
require("gun/lib/radisk.js");
require("gun/lib/store.js");
require("gun/lib/rindexed.js");
require("gun/lib/webrtc.js");
require("gun/lib/yson.js");
const restricted_put_1 = require("./restricted-put");
Object.defineProperty(exports, "restrictedPut", { enumerable: true, get: function () { return restricted_put_1.restrictedPut; } });
const derive_1 = __importDefault(require("./derive"));
exports.derive = derive_1.default;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const eventEmitter_1 = require("../utils/eventEmitter");
const gun_rxjs_1 = require("./gun-rxjs");
Object.defineProperty(exports, "GunRxJS", { enumerable: true, get: function () { return gun_rxjs_1.GunRxJS; } });
const GunErrors = __importStar(require("./errors"));
exports.GunErrors = GunErrors;
const crypto = __importStar(require("./crypto"));
exports.crypto = crypto;
class GunInstance {
    gun;
    user = null;
    crypto;
    sea;
    node;
    onAuthCallbacks = [];
    eventEmitter;
    // Integrated modules
    _rxjs;
    constructor(gun, appScope = "shogun") {
        (0, logger_1.log)("[gunInstance]  Initializing GunDB");
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
        try {
            this.user = this.gun.user().recall({ sessionStorage: true });
        }
        catch (error) {
            (0, logger_1.logError)("Error initializing Gun user:", error);
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this.subscribeToAuthEvents();
        this.crypto = crypto;
        this.node = this.gun.get(appScope);
        this.sea = SEA;
        // Attempt to restore session immediately instead of with timeout
        this.restoreSessionOnInit();
    }
    async restoreSessionOnInit() {
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
    }
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            (0, logger_1.log)("[gunInstance]  Auth event received:", ack);
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
                this.emitPeerEvent("remove", peer);
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
            // Add it back immediately instead of with timeout
            this.addPeer(peer);
            (0, logger_1.log)(`Reconnected to peer: ${peer}`);
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
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    async signUp(username, password, pair) {
        (0, logger_1.log)("[gunInstance]  Attempting user registration:", username);
        try {
            // Validate credentials
            if (password.length < 8 && !pair) {
                const err = "Passwords must be more than 8 characters long!";
                (0, logger_1.log)(err);
                return { success: false, error: err };
            }
            if (username.length < 1) {
                const err = "Username must be more than 0 characters long!";
                (0, logger_1.log)(err);
                return { success: false, error: err };
            }
            // First, try to authenticate with Gun's native system to check if user exists
            (0, logger_1.log)(`Checking if user ${username} exists in Gun's native system...`);
            const authTestResult = await new Promise((resolve) => {
                if (pair) {
                    this.gun.user().auth(pair, (ack) => {
                        if (ack.err) {
                            // User doesn't exist or password is wrong - this is expected for new users
                            resolve({ exists: false, error: ack.err });
                        }
                        else {
                            // User exists and password is correct
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
            if (authTestResult.exists) {
                // Await the call to runPostAuthOnAuthResult
                return await this.runPostAuthOnAuthResult(authTestResult, username);
            }
            // User doesn't exist, attempt to create new user
            (0, logger_1.log)(`Creating new user: ${username}`);
            const createResult = await new Promise((resolve) => {
                if (pair) {
                    resolve({ success: true, pub: pair.pub });
                }
                else {
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
                }
            });
            if (!createResult.success) {
                return createResult;
            }
            // User created successfully, now authenticate to get the userPub
            const authResult = await new Promise((resolve) => {
                if (pair) {
                    this.gun.user().auth(pair, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Authentication after creation failed: ${ack.err}`);
                            resolve({ success: false, error: ack.err });
                        }
                        else {
                            resolve({ success: true, userPub: this.gun.user().is?.pub });
                        }
                    });
                }
                else {
                    this.gun.user().auth(username, password, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Authentication after creation failed: ${ack.err}`);
                            resolve({ success: false, error: ack.err });
                        }
                        else {
                            resolve({ success: true, userPub: this.gun.user().is?.pub });
                        }
                    });
                }
            });
            if (!authResult.success) {
                return {
                    success: false,
                    error: "User created but authentication failed",
                };
            }
            const userPub = authResult.userPub;
            (0, logger_1.log)(`User authentication successful after creation: ${username} (${userPub})`);
            await this.runPostAuthOnAuthResult(authResult, username);
            this.savePair();
            return {
                success: true,
                userPub,
                username,
                message: "User created successfully",
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Exception during signup for ${username}: ${error}`);
            return { success: false, error: String(error) };
        }
    }
    async runPostAuthOnAuthResult(authTestResult, username) {
        (0, logger_1.log)(`User ${username} already exists and password is correct, syncing with tracking system...`);
        // User exists and can authenticate, sync with tracking system
        const userPub = authTestResult.userPub;
        if (!userPub) {
            (0, logger_1.logError)("User public key (userPub) is undefined in runPostAuthOnAuthResult.");
            return { success: false, error: "User public key is missing." };
        }
        // Check if user exists in our tracking system
        const existingUser = await this.checkUsernameExists(username);
        (0, logger_1.log)("[gunInstance]  existingUser", existingUser);
        if (!existingUser) {
            (0, logger_1.log)(`User ${username} not in tracking system, adding them...`);
            // Add user to our tracking system
            const userMetadata = {
                username: username,
                pub: userPub,
                createdAt: Date.now(),
                lastLogin: Date.now(),
            };
            try {
                // Save user metadata with enhanced synchronization
                await new Promise((resolve, reject) => {
                    const userNode = this.node.get(userPub);
                    userNode.put(userMetadata, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Failed to save user metadata: ${ack.err}`);
                            reject(ack.err);
                        }
                        else {
                            (0, logger_1.log)(`User metadata saved for: ${username}`);
                            resolve();
                        }
                    });
                });
                // Create username mapping with advanced synchronization
                await new Promise((resolve, reject) => {
                    const usernamesNode = this.node.get("usernames");
                    const mappingKey = "#" + username;
                    // Use a more robust mapping strategy
                    usernamesNode.get(mappingKey).put(userPub, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Failed to create username mapping: ${ack.err}`);
                            reject(ack.err);
                            return;
                        }
                        // Advanced verification with promise-based retry
                        const verifyMapping = () => {
                            return new Promise((verifyResolve, verifyReject) => {
                                // Multiple strategies to verify mapping
                                const verificationAttempts = [
                                    // Direct lookup
                                    () => new Promise((resolve) => {
                                        usernamesNode.get(mappingKey).once((pub) => {
                                            resolve(pub === userPub);
                                        });
                                    }),
                                    // Comprehensive scan
                                    () => new Promise((resolve) => {
                                        let found = false;
                                        usernamesNode.map().once((pub, key) => {
                                            if (key === mappingKey && pub === userPub) {
                                                found = true;
                                                resolve(true);
                                            }
                                        });
                                        // Timeout to ensure thorough scanning
                                        setTimeout(() => resolve(found), 500);
                                    }),
                                ];
                                // Run verification strategies sequentially
                                const runVerifications = async () => {
                                    for (const strategy of verificationAttempts) {
                                        try {
                                            const result = await strategy();
                                            if (result) {
                                                (0, logger_1.log)(`Successfully verified username mapping for ${username}`);
                                                verifyResolve();
                                                return;
                                            }
                                        }
                                        catch (error) {
                                            (0, logger_1.logError)(`Verification strategy failed: ${error}`);
                                        }
                                    }
                                    // If all strategies fail
                                    (0, logger_1.logError)(`Failed to verify username mapping for ${username}`);
                                    verifyReject(new Error("Username mapping verification failed"));
                                };
                                runVerifications();
                            });
                        };
                        // Execute verification with timeout
                        Promise.race([
                            verifyMapping(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error("Verification timeout")), 5000)),
                        ])
                            .then(resolve)
                            .catch(reject);
                    });
                });
                // Add to users collection (non-blocking)
                this.node.get("users").set(this.node.get(userPub), (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Warning: Failed to add user to collection: ${ack.err}`);
                    }
                    else {
                        (0, logger_1.log)(`User added to collection: ${username}`);
                    }
                });
                this.savePair();
                return {
                    success: true,
                    userPub: userPub,
                    username: username,
                    message: "User successfully synced with tracking system",
                };
            }
            catch (trackingError) {
                (0, logger_1.logError)(`Critical: Could not update tracking system: ${trackingError}`);
                return {
                    success: false,
                    userPub: userPub,
                    username: username,
                    error: "Failed to synchronize user tracking system",
                };
            }
        }
        return existingUser;
    }
    async checkUsernameExists(username) {
        try {
            // Normalize username to handle variations
            const normalizedUsername = username.trim().toLowerCase();
            const frozenKey = `#${normalizedUsername}`;
            const alternateKey = normalizedUsername;
            // Multiple lookup strategies
            const lookupStrategies = [
                // 1. Direct frozen mapping
                async () => {
                    return new Promise((resolve) => {
                        this.node
                            .get("usernames")
                            .get(frozenKey)
                            .once((data) => resolve(data));
                    });
                },
                // 2. Alternate key lookup
                async () => {
                    return new Promise((resolve) => {
                        this.node
                            .get("usernames")
                            .get(alternateKey)
                            .once((data) => resolve(data));
                    });
                },
                // 3. Comprehensive scan fallback
                async () => {
                    return new Promise((resolve) => {
                        this.node.map().once((data, key) => {
                            if (key === frozenKey || key === alternateKey) {
                                resolve(data);
                            }
                        });
                    });
                },
            ];
            // Sequential strategy execution with timeout
            for (const strategy of lookupStrategies) {
                try {
                    const result = await Promise.race([
                        strategy(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Lookup timeout")), 5000)),
                    ]);
                    if (result) {
                        // If we found a pub, try to fetch user data
                        if (typeof result === "string") {
                            const userData = await new Promise((resolve) => {
                                this.node.get(result).once((data) => {
                                    (0, logger_1.log)(`[checkUsernameExists] User data for pub ${result}:`, data);
                                    resolve(data || null);
                                });
                            });
                            // Always return an object with pub and username if possible
                            if (userData && userData.username) {
                                return userData;
                            }
                            return { pub: result, username };
                        }
                        return result;
                    }
                }
                catch (error) {
                    (0, logger_1.log)(`Username lookup strategy failed: ${error}`);
                }
            }
            return null;
        }
        catch (error) {
            (0, logger_1.logError)(`Username existence check failed: ${error}`);
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
    async login(username, password, pair, callback) {
        (0, logger_1.log)(`Attempting login for user: ${username}`);
        try {
            // Attempt Gun.js authentication directly first
            // This allows login even if our custom tracking system is out of sync
            const authResult = await new Promise((resolve) => {
                if (pair) {
                    this.gun.user().auth(pair, (ack) => {
                        if (ack.err) {
                            (0, logger_1.logError)(`Login error for ${username}: ${ack.err}`);
                            resolve({ success: false, error: ack.err });
                        }
                        else {
                            (0, logger_1.log)(`Login successful for: ${username}`);
                            resolve({ success: true, ack });
                        }
                    });
                }
                else {
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
                }
            });
            if (!authResult.success) {
                // If Gun.js auth fails, the user likely doesn't exist or password is wrong
                const result = {
                    success: false,
                    error: `User '${username}' not found. Please check your username or register first.`,
                };
                if (callback)
                    callback(result);
                return result;
            }
            const userPub = this.gun.user().is?.pub;
            if (!userPub) {
                const result = {
                    success: false,
                    error: "Authentication failed: No user pub returned.",
                };
                if (callback)
                    callback(result);
                return result;
            }
            (0, logger_1.log)(`Gun.js authentication successful for: ${username} (${userPub})`);
            // Pass the userPub to runPostAuthOnAuthResult
            this.runPostAuthOnAuthResult({ success: true, userPub: userPub }, username);
            (0, logger_1.log)(`Login completed successfully for: ${username} (${userPub})`);
            this.savePair();
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
    savePair() {
        try {
            const user = this.gun.user();
            const pair = user?._?.sea;
            const userInfo = user?.is;
            if (pair && userInfo) {
                // Save the crypto pair and session info
                const sessionInfo = {
                    pub: userInfo.pub,
                    alias: userInfo.alias || "",
                    timestamp: Date.now(),
                };
                // Save to localStorage if available
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("gun/pair", JSON.stringify(pair));
                    localStorage.setItem("gun/session", JSON.stringify(sessionInfo));
                }
                // Also save to sessionStorage for cross-app sharing
                if (typeof sessionStorage !== "undefined") {
                    sessionStorage.setItem("gun/pair", JSON.stringify(pair));
                    sessionStorage.setItem("gun/session", JSON.stringify(sessionInfo));
                }
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
                (0, logger_1.log)("[gunInstance]  No saved session found");
                return { success: false, error: "No saved session" };
            }
            const session = JSON.parse(sessionInfo);
            const pair = JSON.parse(pairInfo);
            // Check if session is not too old (optional - you can adjust this)
            const sessionAge = Date.now() - session.timestamp;
            const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (sessionAge > maxSessionAge) {
                (0, logger_1.log)("[gunInstance]  Session expired, clearing storage");
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Session expired" };
            }
            (0, logger_1.log)(`Attempting to restore session for user: ${session.alias || session.pub}`);
            // Try to restore the session with Gun
            const user = this.gun.user();
            // Set the pair directly
            user._ = { sea: pair };
            // Try to recall the session without timeout
            const recallResult = user.recall({ sessionStorage: true });
            (0, logger_1.log)("recallResult", recallResult);
            if (recallResult && user.is?.pub === session.pub) {
                (0, logger_1.log)(`Session restored successfully for: ${session.alias || session.pub}`);
                return { success: true, userPub: session.pub };
            }
            else {
                (0, logger_1.log)("[gunInstance]  Session restoration failed, clearing storage");
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
                (0, logger_1.log)("[gunInstance]  No user logged in, skipping logout");
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
                (0, logger_1.log)("[gunInstance]  Local session data cleared");
            }
            // Clear sessionStorage as well
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.removeItem("gun/");
                sessionStorage.removeItem("gun/user");
                sessionStorage.removeItem("gun/auth");
                sessionStorage.removeItem("gun/pair");
                sessionStorage.removeItem("gun/session");
                (0, logger_1.log)("[gunInstance]  Session storage cleared");
            }
            (0, logger_1.log)("[gunInstance]  Logout completed successfully");
        }
        catch (error) {
            (0, logger_1.logError)("Error during logout:", error);
        }
    }
    /**
     * Debug method: Clears all Gun-related data from local and session storage
     * This is useful for debugging and testing purposes
     */
    clearAllStorageData() {
        try {
            (0, logger_1.log)("[gunInstance]  Clearing all Gun-related storage data...");
            // Clear localStorage
            if (typeof localStorage !== "undefined") {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith("gun/") || key === "pair")) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach((key) => localStorage.removeItem(key));
                (0, logger_1.log)(`Cleared ${keysToRemove.length} items from localStorage`);
            }
            // Clear sessionStorage
            if (typeof sessionStorage !== "undefined") {
                const keysToRemove = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && key.startsWith("gun/")) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach((key) => sessionStorage.removeItem(key));
                (0, logger_1.log)(`Cleared ${keysToRemove.length} items from sessionStorage`);
            }
            // Also logout if currently logged in
            if (this.isLoggedIn()) {
                this.gun.user().leave();
                (0, logger_1.log)("[gunInstance]  User logged out");
            }
            (0, logger_1.log)("[gunInstance]  All Gun-related storage data cleared");
        }
        catch (error) {
            (0, logger_1.logError)("Error clearing storage data:", error);
        }
    }
    /**
     * Debug method: Tests Gun connectivity and returns status information
     * This is useful for debugging connection issues
     */
    async testConnectivity() {
        try {
            (0, logger_1.log)("[gunInstance]  Testing Gun connectivity...");
            const result = {
                peers: this.getPeerInfo(),
                gunInstance: !!this.gun,
                userInstance: !!this.gun.user(),
                canWrite: false,
                canRead: false,
                testWriteResult: null,
                testReadResult: null,
            };
            // Test basic write operation
            try {
                const testData = { test: true, timestamp: Date.now() };
                const writeResult = await new Promise((resolve) => {
                    this.gun
                        .get("test")
                        .get("connectivity")
                        .put(testData, (ack) => {
                        resolve(ack);
                    });
                });
                result.canWrite = !writeResult?.err;
                result.testWriteResult = writeResult;
                (0, logger_1.log)("[gunInstance]  Write test result:", writeResult);
            }
            catch (writeError) {
                (0, logger_1.logError)("Write test failed:", writeError);
                result.testWriteResult = { error: String(writeError) };
            }
            // Test basic read operation
            try {
                const readResult = await new Promise((resolve) => {
                    this.gun
                        .get("test")
                        .get("connectivity")
                        .once((data) => {
                        resolve(data);
                    });
                });
                result.canRead = !!readResult;
                result.testReadResult = readResult;
                (0, logger_1.log)("[gunInstance]  Read test result:", readResult);
            }
            catch (readError) {
                (0, logger_1.logError)("Read test failed:", readError);
                result.testReadResult = { error: String(readError) };
            }
            (0, logger_1.log)("[gunInstance]  Connectivity test completed:", result);
            return result;
        }
        catch (error) {
            (0, logger_1.logError)("Error testing connectivity:", error);
            return {
                peers: {},
                gunInstance: false,
                userInstance: false,
                canWrite: false,
                canRead: false,
                testWriteResult: { error: String(error) },
                testReadResult: { error: String(error) },
            };
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
            this._rxjs = new gun_rxjs_1.GunRxJS(this.gun);
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
        (0, logger_1.log)("[gunInstance]  Setting password hint for:", username);
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
                if (SEA && SEA.work) {
                    proofOfWork = await SEA.work(answersText, null, null, {
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
                (0, logger_1.logError)("Error generating hash:", hashError);
                return { success: false, error: "Failed to generate security hash" };
            }
            // Encrypt the password hint with the proof of work
            let encryptedHint;
            try {
                if (SEA && SEA.encrypt) {
                    encryptedHint = await SEA.encrypt(hint, proofOfWork);
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
                (0, logger_1.logError)("Error encrypting hint:", encryptError);
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
                        (0, logger_1.logError)("Error saving security data to public graph:", ack.err);
                        reject(new Error(ack.err));
                    }
                    else {
                        (0, logger_1.log)(`Security data saved to public graph for ${userPub}`);
                        resolve();
                    }
                });
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
        (0, logger_1.log)("[gunInstance]  Attempting password recovery for:", username);
        try {
            // Find the user's data
            let userData = await this.checkUsernameExists(username);
            (0, logger_1.log)("[gunInstance]  userData", userData);
            // Patch: if userData is a string, treat as pub
            if (typeof userData === "string") {
                userData = { pub: userData, username };
            }
            if (!userData || !userData.pub) {
                return { success: false, error: "User not found" };
            }
            // Extract the public key from user data
            const userPub = userData.pub;
            (0, logger_1.log)(`Found user public key for password recovery: ${userPub}`);
            // Access the user's security data directly from their public key node
            const securityData = await new Promise((resolve) => {
                this.node.get(userPub).get("security").once((data) => {
                    (0, logger_1.log)(`Retrieved security data for user ${username}:`, data ? "found" : "not found");
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
                if (SEA && SEA.work) {
                    proofOfWork = await SEA.work(answersText, null, null, {
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
                (0, logger_1.logError)("Error generating hash:", hashError);
                return { success: false, error: "Failed to generate security hash" };
            }
            // Decrypt the password hint with the proof of work
            let hint;
            try {
                if (SEA && SEA.decrypt) {
                    hint = await SEA.decrypt(securityData.hint, proofOfWork);
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
        return new Promise((resolve) => {
            const user = this.gun.user();
            if (!user.is) {
                this.emitDataEvent("gun:get", `user/${path}`, null, false, "User not authenticated");
                resolve(null);
                return;
            }
            this.navigateToPath(user, path).once((data) => {
                this.emitDataEvent("gun:get", `user/${path}`, data, true);
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
            (0, logger_1.log)("[gunInstance]  Deriving cryptographic keys with options:", options);
            // Call the derive function with the provided parameters
            const derivedKeys = await (0, derive_1.default)(password, extra, options);
            (0, logger_1.log)("[gunInstance]  Key derivation completed successfully");
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
exports.GunInstance = GunInstance;
