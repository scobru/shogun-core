"use strict";
/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.derive = exports.GunErrors = exports.crypto = exports.RxJS = exports.SEA = exports.DataBase = void 0;
var sea_1 = require("gun/sea");
exports.SEA = sea_1.default;
var derive_1 = require("./derive");
exports.derive = derive_1.default;
var errorHandler_1 = require("../utils/errorHandler");
var eventEmitter_1 = require("../utils/eventEmitter");
var rxjs_1 = require("./rxjs");
Object.defineProperty(exports, "RxJS", { enumerable: true, get: function () { return rxjs_1.RxJS; } });
var GunErrors = require("./errors");
exports.GunErrors = GunErrors;
var crypto = require("./crypto");
exports.crypto = crypto;
var CryptoIdentityManager_1 = require("../managers/CryptoIdentityManager");
/**
 * Configuration constants for timeouts and security
 */
var CONFIG = {
    TIMEOUTS: {
        USER_DATA_OPERATION: 5000,
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: false,
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBERS: false,
        REQUIRE_SPECIAL_CHARS: false,
    },
};
var DataBase = /** @class */ (function () {
    function DataBase(gun, appScope, core) {
        if (appScope === void 0) { appScope = "shogun"; }
        this.user = null;
        this.onAuthCallbacks = [];
        console.log("[DB] Initializing DataBase");
        // Store core reference
        this.core = core;
        // Initialize event emitter
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        // Validate Gun instance
        if (!gun) {
            throw new Error("Gun instance is required but was not provided");
        }
        if (typeof gun !== "object") {
            throw new Error("Gun instance must be an object, received: ".concat(typeof gun));
        }
        if (typeof gun.user !== "function") {
            throw new Error("Gun instance is invalid: gun.user is not a function. Received gun.user type: ".concat(typeof gun.user));
        }
        if (typeof gun.get !== "function") {
            throw new Error("Gun instance is invalid: gun.get is not a function. Received gun.get type: ".concat(typeof gun.get));
        }
        if (typeof gun.on !== "function") {
            throw new Error("Gun instance is invalid: gun.on is not a function. Received gun.on type: ".concat(typeof gun.on));
        }
        this.gun = gun;
        console.log("[DB] Gun instance validated");
        // Recall only if NOT disabled and there's a "pair" in sessionStorage
        this.user = this.gun.user().recall({ sessionStorage: true });
        console.log("[DB] User recall completed");
        this.subscribeToAuthEvents();
        console.log("[DB] Auth events subscribed");
        this.crypto = crypto;
        this.sea = sea_1.default;
        this._rxjs = new rxjs_1.RxJS(this.gun);
        this.node = null;
        console.log("[DB] DataBase initialization completed");
    }
    /**
     * Initialize the GunInstance asynchronously
     * This method should be called after construction to perform async operations
     */
    DataBase.prototype.initialize = function (appScope) {
        if (appScope === void 0) { appScope = "shogun"; }
        console.log("[DB] Initializing with appScope: ".concat(appScope));
        try {
            var sessionResult = this.restoreSession();
            console.log("[DB] Session restore result: ".concat(sessionResult.success ? "success" : "failed"));
            this.node = this.gun.get(appScope);
            console.log("[DB] App scope node initialized");
            // Initialize CryptoIdentityManager
            this._cryptoIdentityManager = new CryptoIdentityManager_1.CryptoIdentityManager(this.core, this);
            console.log("[DB] CryptoIdentityManager initialized");
            if (sessionResult.success) {
                console.log("[DB] Session automatically restored");
            }
            else {
                console.log("[DB] No previous session to restore");
            }
        }
        catch (error) {
            console.error("[DB] Error during automatic session restoration:", error);
        }
    };
    DataBase.prototype.subscribeToAuthEvents = function () {
        var _this = this;
        this.gun.on("auth", function (ack) {
            // Auth event received
            var _a;
            if (ack.err) {
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.GUN, "AUTH_EVENT_ERROR", ack.err, new Error(ack.err));
            }
            else {
                _this.notifyAuthListeners(((_a = ack.sea) === null || _a === void 0 ? void 0 : _a.pub) || "");
            }
        });
    };
    DataBase.prototype.notifyAuthListeners = function (pub) {
        var user = this.gun.user();
        this.onAuthCallbacks.forEach(function (cb) { return cb(user); });
    };
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    DataBase.prototype.addPeer = function (peer) {
        console.log("[PEER] Adding peer: ".concat(peer));
        this.gun.opt({ peers: [peer] });
        console.log("[PEER] Peer added successfully");
    };
    /**
     * Removes a peer from the network
     * @param peer URL of the peer to remove
     */
    DataBase.prototype.removePeer = function (peer) {
        console.log("[PEER] Removing peer: ".concat(peer));
        try {
            // Get current peers from Gun instance
            var gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                // Remove the peer from the peers object
                delete gunOpts.peers[peer];
                // Also try to close the connection if it exists
                var peerConnection = gunOpts.peers[peer];
                if (peerConnection && typeof peerConnection.close === "function") {
                    peerConnection.close();
                }
                console.log("[PEER] Peer removed successfully");
            }
            else {
                console.error("[PEER] Peer not found in current connections: ".concat(peer));
            }
        }
        catch (error) {
            console.error("[PEER] Error removing peer ".concat(peer, ":"), error);
        }
    };
    /**
     * Gets the list of currently connected peers
     * @returns Array of peer URLs
     */
    DataBase.prototype.getCurrentPeers = function () {
        try {
            var gunOpts_1 = this.gun._.opt;
            if (gunOpts_1 && gunOpts_1.peers) {
                return Object.keys(gunOpts_1.peers).filter(function (peer) {
                    var peerObj = gunOpts_1.peers[peer];
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
    };
    /**
     * Gets the list of all configured peers (connected and disconnected)
     * @returns Array of peer URLs
     */
    DataBase.prototype.getAllConfiguredPeers = function () {
        try {
            var gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                return Object.keys(gunOpts.peers);
            }
            return [];
        }
        catch (error) {
            console.error("Error getting configured peers:", error);
            return [];
        }
    };
    /**
     * Gets detailed information about all peers
     * @returns Object with peer information
     */
    DataBase.prototype.getPeerInfo = function () {
        try {
            var gunOpts_2 = this.gun._.opt;
            var peerInfo_1 = {};
            if (gunOpts_2 && gunOpts_2.peers) {
                Object.keys(gunOpts_2.peers).forEach(function (peer) {
                    var peerObj = gunOpts_2.peers[peer];
                    var isConnected = peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
                    var status = isConnected
                        ? "connected"
                        : peerObj && peerObj.wire
                            ? "disconnected"
                            : "not_initialized";
                    peerInfo_1[peer] = {
                        connected: isConnected,
                        status: status,
                    };
                });
            }
            return peerInfo_1;
        }
        catch (error) {
            console.error("Error getting peer info:", error);
            return {};
        }
    };
    /**
     * Reconnects to a specific peer
     * @param peer URL of the peer to reconnect
     */
    DataBase.prototype.reconnectToPeer = function (peer) {
        try {
            // First remove the peer
            this.removePeer(peer);
            // Add it back immediately instead of with timeout
            this.addPeer(peer);
        }
        catch (error) {
            console.error("Error reconnecting to peer ".concat(peer, ":"), error);
        }
    };
    /**
     * Clears all peers and optionally adds new ones
     * @param newPeers Optional array of new peers to add
     */
    DataBase.prototype.resetPeers = function (newPeers) {
        var _this = this;
        try {
            var gunOpts = this.gun._.opt;
            if (gunOpts && gunOpts.peers) {
                // Clear all existing peers
                Object.keys(gunOpts.peers).forEach(function (peer) {
                    _this.removePeer(peer);
                });
                // Add new peers if provided
                if (newPeers && newPeers.length > 0) {
                    newPeers.forEach(function (peer) {
                        _this.addPeer(peer);
                    });
                }
            }
        }
        catch (error) {
            console.error("Error resetting peers:", error);
        }
    };
    /**
     * Registers an authentication callback
     * @param callback Function to call on auth events
     * @returns Function to unsubscribe the callback
     */
    DataBase.prototype.onAuth = function (callback) {
        var _this = this;
        this.onAuthCallbacks.push(callback);
        var user = this.gun.user();
        if (user && user.is)
            callback(user);
        return function () {
            var i = _this.onAuthCallbacks.indexOf(callback);
            if (i !== -1)
                _this.onAuthCallbacks.splice(i, 1);
        };
    };
    /**
     * Helper method to navigate to a nested path by splitting and chaining .get() calls
     * @param node Starting Gun node
     * @param path Path string (e.g., "test/data/marco")
     * @returns Gun node at the specified path
     */
    DataBase.prototype.navigateToPath = function (node, path) {
        if (!path || typeof path !== "string")
            return node;
        // Split path by '/' and filter out empty segments
        var pathSegments = path
            .split("/")
            .map(function (segment) { return segment.trim(); })
            .filter(function (segment) { return segment.length > 0; });
        // Chain .get() calls for each path segment
        var currentNode = node;
        for (var _i = 0, pathSegments_1 = pathSegments; _i < pathSegments_1.length; _i++) {
            var segment = pathSegments_1[_i];
            currentNode = currentNode.get(segment);
        }
        return currentNode;
    };
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    DataBase.prototype.getGun = function () {
        return this.gun;
    };
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    DataBase.prototype.getCurrentUser = function () {
        var _a, _b, _c, _d;
        try {
            var _user = this.gun.user();
            return ((_a = _user === null || _user === void 0 ? void 0 : _user.is) === null || _a === void 0 ? void 0 : _a.pub)
                ? {
                    pub: (_b = _user === null || _user === void 0 ? void 0 : _user.is) === null || _b === void 0 ? void 0 : _b.pub,
                    epub: (_c = _user === null || _user === void 0 ? void 0 : _user.is) === null || _c === void 0 ? void 0 : _c.epub,
                    alias: (_d = _user === null || _user === void 0 ? void 0 : _user.is) === null || _d === void 0 ? void 0 : _d.alias,
                    user: _user,
                }
                : null;
        }
        catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    };
    /**
     * Gets the current user instance
     * @returns User instance
     */
    DataBase.prototype.getUser = function () {
        return this.gun.user();
    };
    /**
     * Gets a node at the specified path
     * @param path Path to the node
     * @returns Gun node
     */
    DataBase.prototype.get = function (path) {
        return this.navigateToPath(this.node, path);
    };
    /**
     * Gets data at the specified path (one-time read)
     * @param path Path to get the data from
     * @returns Promise resolving to the data
     */
    DataBase.prototype.getData = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var node;
            return __generator(this, function (_a) {
                node = this.navigateToPath(this.node, path);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        node.once(function (data) {
                            resolve(data);
                        });
                    })];
            });
        });
    };
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    DataBase.prototype.put = function (path, data) {
        return __awaiter(this, void 0, void 0, function () {
            var node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        node = this.navigateToPath(this.node, path);
                        return [4 /*yield*/, node.put(data).then()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Sets data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    DataBase.prototype.set = function (path, data) {
        return __awaiter(this, void 0, void 0, function () {
            var node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        node = this.navigateToPath(this.node, path);
                        return [4 /*yield*/, node.set(data).then()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Removes data at the specified path
     * @param path Path to remove
     * @returns Promise resolving to operation result
     */
    DataBase.prototype.remove = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        node = this.navigateToPath(this.node, path);
                        return [4 /*yield*/, node.put(null).then()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    DataBase.prototype.isLoggedIn = function () {
        try {
            var user = this.gun.user();
            return !!(user && user.is && user.is.pub);
        }
        catch (error) {
            console.error("Error checking login status:", error);
            return false;
        }
    };
    /**
     * Attempts to restore user session from local storage
     * @returns Promise resolving to session restoration result
     */
    DataBase.prototype.restoreSession = function () {
        try {
            if (typeof localStorage === "undefined") {
                return { success: false, error: "localStorage not available" };
            }
            // Check for session data in sessionStorage first (new format)
            var sessionData = sessionStorage.getItem("gunSessionData");
            if (!sessionData) {
                // Fallback to old localStorage format
                var sessionInfo = localStorage.getItem("gun/session");
                var pairInfo = localStorage.getItem("gun/pair");
                if (!sessionInfo || !pairInfo) {
                    // No saved session found
                    return { success: false, error: "No saved session" };
                }
                var session_1, pair = void 0;
                try {
                    session_1 = JSON.parse(sessionInfo);
                    pair = JSON.parse(pairInfo);
                }
                catch (parseError) {
                    console.error("Error parsing session data:", parseError);
                    // Clear corrupted data
                    localStorage.removeItem("gun/session");
                    localStorage.removeItem("gun/pair");
                    return { success: false, error: "Corrupted session data" };
                }
                // Convert old format to new format
                sessionData = JSON.stringify({
                    username: session_1.username,
                    pair: pair,
                    userPub: session_1.userPub,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                });
            }
            var session = void 0;
            try {
                session = JSON.parse(sessionData);
            }
            catch (parseError) {
                console.error("Error parsing session data:", parseError);
                // Clear corrupted data
                sessionStorage.removeItem("gunSessionData");
                return { success: false, error: "Corrupted session data" };
            }
            // Validate session data structure
            if (!session.username || !session.userPub) {
                // Invalid session data, clearing storage
                sessionStorage.removeItem("gunSessionData");
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Incomplete session data" };
            }
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                // Session expired, clearing storage
                sessionStorage.removeItem("gunSessionData");
                localStorage.removeItem("gun/session");
                localStorage.removeItem("gun/pair");
                return { success: false, error: "Session expired" };
            }
            // Attempt to restore user session
            try {
                var userInstance = this.gun.user();
                if (!userInstance) {
                    console.error("Gun user instance not available");
                    sessionStorage.removeItem("gunSessionData");
                    localStorage.removeItem("gun/session");
                    localStorage.removeItem("gun/pair");
                    return { success: false, error: "Gun user instance not available" };
                }
                // Set the user pair if available
                if (session.pair) {
                    try {
                        userInstance._ = __assign(__assign({}, userInstance._), { sea: session.pair });
                    }
                    catch (pairError) {
                        console.error("Error setting user pair:", pairError);
                    }
                }
                // Attempt to recall user session
                try {
                    if (typeof sessionStorage !== "undefined" &&
                        sessionStorage.getItem("pair")) {
                        var recallResult = userInstance.recall({ sessionStorage: true });
                    }
                    else {
                        var recallResult = userInstance;
                    }
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
                    sessionStorage.removeItem("gunSessionData");
                    localStorage.removeItem("gun/session");
                    localStorage.removeItem("gun/pair");
                    return { success: false, error: "Session verification failed" };
                }
            }
            catch (error) {
                console.error("Error restoring session: ".concat(error));
                return {
                    success: false,
                    error: "Session restoration failed: ".concat(error),
                };
            }
        }
        catch (mainError) {
            console.error("Error in restoreSession: ".concat(mainError));
            return {
                success: false,
                error: "Session restoration failed: ".concat(mainError),
            };
        }
        return { success: false, error: "No session data available" };
    };
    DataBase.prototype.logout = function () {
        try {
            var currentUser = this.gun.user();
            if (!currentUser || !currentUser.is) {
                return;
            }
            // Log out user
            try {
                currentUser.leave();
                // Force clear any pending authentication
                if (currentUser._ && currentUser._.sea) {
                    currentUser._.sea = null;
                }
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
    };
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    DataBase.prototype.rx = function () {
        return this._rxjs;
    };
    /**
     * Validates password strength according to security requirements
     */
    DataBase.prototype.validatePasswordStrength = function (password) {
        if (password.length < CONFIG.PASSWORD.MIN_LENGTH) {
            return {
                valid: false,
                error: "Password must be at least ".concat(CONFIG.PASSWORD.MIN_LENGTH, " characters long"),
            };
        }
        var validations = [];
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
                error: "Password must contain at least one: ".concat(validations.join(", ")),
            };
        }
        return { valid: true };
    };
    /**
     * Validates signup credentials with enhanced security
     */
    DataBase.prototype.validateSignupCredentials = function (username, password, pair) {
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
            if (!pair.pub ||
                !pair.priv ||
                !pair.epub ||
                !pair.epriv) {
                return {
                    valid: false,
                    error: "Invalid pair provided",
                };
            }
            if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                return {
                    valid: false,
                    error: "Invalid pair provided",
                };
            }
            return { valid: true };
        }
        // Validate password strength
        return this.validatePasswordStrength(password);
    };
    /**
     * Creates a new user in Gun
     */
    DataBase.prototype.createNewUser = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
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
                        // Normalize username
                        var normalizedUsername = username.trim().toLowerCase();
                        if (normalizedUsername.length === 0) {
                            resolve({
                                success: false,
                                error: "Username cannot be empty",
                            });
                            return;
                        }
                        _this.gun.user().create(normalizedUsername, password, function (ack) {
                            if (ack.err) {
                                console.error("User creation error: ".concat(ack.err));
                                // Reset auth state after failed creation to prevent blocking future operations
                                _this.resetAuthState();
                                resolve({ success: false, error: ack.err });
                            }
                            else {
                                // Validate that we got a userPub from creation
                                var userPub = ack.pub;
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
                                    resolve({ success: true, userPub: userPub });
                                }
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Authenticates user after creation
     */
    DataBase.prototype.authenticateNewUser = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
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
                        // Normalize username to match what was used in creation
                        var normalizedUsername = username.trim().toLowerCase();
                        if (normalizedUsername.length === 0) {
                            resolve({
                                success: false,
                                error: "Username cannot be empty",
                            });
                            return;
                        }
                        if (pair) {
                            _this.gun.user().auth(pair, function (ack) {
                                if (ack.err) {
                                    console.error("Authentication after creation failed: ".concat(ack.err));
                                    // Reset auth state on error to prevent blocking future operations
                                    _this.resetAuthState();
                                    resolve({ success: false, error: ack.err });
                                }
                                else {
                                    // Add a small delay to ensure user state is properly set
                                    setTimeout(function () {
                                        var _a, _b;
                                        // Extract userPub from multiple possible sources
                                        var userPub = ack.pub || ((_a = _this.gun.user().is) === null || _a === void 0 ? void 0 : _a.pub) || ((_b = ack.user) === null || _b === void 0 ? void 0 : _b.pub);
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
                            _this.gun.user().auth(normalizedUsername, password, function (ack) {
                                if (ack.err) {
                                    console.error("Authentication after creation failed: ".concat(ack.err));
                                    // Reset auth state on error to prevent blocking future operations
                                    _this.resetAuthState();
                                    resolve({ success: false, error: ack.err });
                                }
                                else {
                                    // Add a small delay to ensure user state is properly set
                                    setTimeout(function () {
                                        var _a, _b;
                                        // Extract userPub from multiple possible sources
                                        var userPub = ack.pub || ((_a = _this.gun.user().is) === null || _a === void 0 ? void 0 : _a.pub) || ((_b = ack.user) === null || _b === void 0 ? void 0 : _b.pub);
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
                    })];
            });
        });
    };
    /**
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param pair Optional SEA pair for Web3 login
     * @returns Promise resolving to signup result
     */
    DataBase.prototype.signUp = function (username_1, password_1, pair_1) {
        return __awaiter(this, arguments, void 0, function (username, password, pair, retryCount, maxRetries) {
            var validation, baseDelay, jitter, delay_1, createResult, authResult, postAuthResult, postAuthError_1, error_1;
            var _a, _b, _c, _d, _e, _f;
            if (retryCount === void 0) { retryCount = 0; }
            if (maxRetries === void 0) { maxRetries = 3; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 14, , 15]);
                        validation = this.validateSignupCredentials(username, password, pair);
                        if (!validation.valid) {
                            return [2 /*return*/, { success: false, error: validation.error }];
                        }
                        if (!this.isAuthInProgress()) return [3 /*break*/, 3];
                        if (!(retryCount < maxRetries)) return [3 /*break*/, 2];
                        console.warn("Authentication in progress during signup, retrying... (".concat(retryCount + 1, "/").concat(maxRetries, ")"));
                        this.resetAuthState();
                        baseDelay = 100 * Math.pow(2, retryCount);
                        jitter = Math.random() * 100;
                        delay_1 = Math.min(baseDelay + jitter, 2000);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                    case 1:
                        _g.sent();
                        return [2 /*return*/, this.signUp(username, password, pair, retryCount + 1, maxRetries)];
                    case 2:
                        console.error("Max retries exceeded for signup due to concurrent operations");
                        this.resetAuthState();
                        return [2 /*return*/, {
                                success: false,
                                error: "Signup failed after multiple retries due to concurrent operations",
                            }];
                    case 3:
                        createResult = void 0;
                        if (!pair) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createNewUserWithPair(username, pair)];
                    case 4:
                        // For Web3/plugin authentication, use pair-based creation
                        createResult = _g.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.createNewUser(username, password)];
                    case 6:
                        // For password authentication, use standard creation
                        createResult = _g.sent();
                        _g.label = 7;
                    case 7:
                        if (!createResult.success) {
                            // Reset auth state after failed creation to prevent blocking future operations
                            this.resetAuthState();
                            return [2 /*return*/, { success: false, error: createResult.error }];
                        }
                        // Add a small delay to ensure user is properly registered
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 8:
                        // Add a small delay to ensure user is properly registered
                        _g.sent();
                        return [4 /*yield*/, this.authenticateNewUser(username, password, pair)];
                    case 9:
                        authResult = _g.sent();
                        if (!authResult.success) {
                            return [2 /*return*/, { success: false, error: authResult.error }];
                        }
                        // Validate that we have a userPub
                        if (!authResult.userPub ||
                            typeof authResult.userPub !== "string" ||
                            authResult.userPub.trim().length === 0) {
                            console.error("Authentication successful but no valid userPub returned:", authResult);
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Authentication successful but no valid userPub returned",
                                }];
                        }
                        // Set the user instance
                        this.user = this.gun.user();
                        _g.label = 10;
                    case 10:
                        _g.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.runPostAuthOnAuthResult(username, authResult.userPub, authResult)];
                    case 11:
                        postAuthResult = _g.sent();
                        // Return the post-auth result which includes the complete user data
                        return [2 /*return*/, postAuthResult];
                    case 12:
                        postAuthError_1 = _g.sent();
                        console.error("Post-auth error: ".concat(postAuthError_1));
                        // Even if post-auth fails, the user was created and authenticated successfully
                        return [2 /*return*/, {
                                success: true,
                                userPub: authResult.userPub,
                                username: username,
                                isNewUser: true,
                                sea: ((_b = (_a = this.gun.user()) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea)
                                    ? {
                                        pub: (_c = this.gun.user()._) === null || _c === void 0 ? void 0 : _c.sea.pub,
                                        priv: (_d = this.gun.user()._) === null || _d === void 0 ? void 0 : _d.sea.priv,
                                        epub: (_e = this.gun.user()._) === null || _e === void 0 ? void 0 : _e.sea.epub,
                                        epriv: (_f = this.gun.user()._) === null || _f === void 0 ? void 0 : _f.sea.epriv,
                                    }
                                    : undefined,
                            }];
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        error_1 = _g.sent();
                        console.error("Exception during signup for ".concat(username, ": ").concat(error_1));
                        return [2 /*return*/, { success: false, error: "Signup failed: ".concat(error_1) }];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new user in Gun with pair-based authentication (for Web3/plugins)
     */
    DataBase.prototype.createNewUserWithPair = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
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
                        // Normalize username
                        var normalizedUsername = username.trim().toLowerCase();
                        if (normalizedUsername.length === 0) {
                            resolve({
                                success: false,
                                error: "Username cannot be empty",
                            });
                            return;
                        }
                        // For pair-based authentication, we don't need to call gun.user().create()
                        // because the pair already contains the cryptographic credentials
                        // We just need to validate that the pair is valid and return success
                        resolve({ success: true, userPub: pair.pub });
                    })];
            });
        });
    };
    DataBase.prototype.runPostAuthOnAuthResult = function (username, userPub, authResult) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedUsername, existingUser, isNewUser, userInstance, userSea, epub, trackingResult, cryptoSetupResult, cryptoError_1, result, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("[POSTAUTH] Starting post-auth setup for user: ".concat(username, ", userPub: ").concat(userPub));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        console.log("[POSTAUTH] Validating parameters for user: ".concat(username));
                        // Validate required parameters
                        if (!username ||
                            typeof username !== "string" ||
                            username.trim().length === 0) {
                            console.error("[POSTAUTH] Invalid username provided: ".concat(username));
                            throw new Error("Invalid username provided");
                        }
                        if (!userPub ||
                            typeof userPub !== "string" ||
                            userPub.trim().length === 0) {
                            console.error("[POSTAUTH] Invalid userPub provided:", {
                                userPub: userPub,
                                type: typeof userPub,
                                authResult: authResult,
                            });
                            throw new Error("Invalid userPub provided");
                        }
                        // Additional validation for userPub format
                        if (!userPub.includes(".") || userPub.length < 10) {
                            console.error("[POSTAUTH] Invalid userPub format: ".concat(userPub));
                            throw new Error("Invalid userPub format");
                        }
                        console.log("[POSTAUTH] Parameters validated for user: ".concat(username));
                        normalizedUsername = username.trim().toLowerCase();
                        if (normalizedUsername.length === 0) {
                            console.error("[POSTAUTH] Normalized username is empty for user: ".concat(username));
                            throw new Error("Username cannot be empty");
                        }
                        console.log("[POSTAUTH] Normalized username: ".concat(normalizedUsername));
                        console.log("[POSTAUTH] Checking if user exists: ".concat(userPub));
                        return [4 /*yield*/, this.gun.get(userPub).then()];
                    case 2:
                        existingUser = _b.sent();
                        isNewUser = !existingUser || !existingUser.alias;
                        console.log("[POSTAUTH] User is ".concat(isNewUser ? "NEW" : "EXISTING", ": ").concat(userPub));
                        userInstance = this.gun.user();
                        userSea = (_a = userInstance === null || userInstance === void 0 ? void 0 : userInstance._) === null || _a === void 0 ? void 0 : _a.sea;
                        epub = userSea === null || userSea === void 0 ? void 0 : userSea.epub;
                        console.log("[POSTAUTH] User epub retrieved: ".concat(epub ? "yes" : "no"));
                        // Enhanced user tracking system
                        console.log("[POSTAUTH] Setting up comprehensive user tracking for: ".concat(normalizedUsername));
                        return [4 /*yield*/, this.setupComprehensiveUserTracking(normalizedUsername, userPub, epub)];
                    case 3:
                        trackingResult = _b.sent();
                        if (!trackingResult) {
                            console.error("[POSTAUTH] Comprehensive user tracking setup failed for: ".concat(normalizedUsername));
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Comprehensive user tracking setup failed",
                                }];
                        }
                        console.log("[POSTAUTH] User tracking setup completed successfully for: ".concat(normalizedUsername));
                        if (!(this._cryptoIdentityManager && userSea)) return [3 /*break*/, 8];
                        console.log("[POSTAUTH] Setting up crypto identities for: ".concat(normalizedUsername));
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this._cryptoIdentityManager.setupCryptoIdentities(normalizedUsername, userSea, false)];
                    case 5:
                        cryptoSetupResult = _b.sent();
                        if (cryptoSetupResult.success) {
                            console.log("\u2705 [POSTAUTH] Crypto identities setup completed for: ".concat(normalizedUsername));
                        }
                        else {
                            console.error("\u274C [POSTAUTH] Crypto identities setup failed for: ".concat(normalizedUsername), cryptoSetupResult.error);
                            // Don't fail the entire auth process if crypto setup fails
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        cryptoError_1 = _b.sent();
                        console.error("\u274C [POSTAUTH] Crypto identities setup error for: ".concat(normalizedUsername), cryptoError_1);
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        console.log("\u2139\uFE0F [POSTAUTH] Skipping crypto identities setup - manager not available or no SEA pair");
                        _b.label = 9;
                    case 9:
                        result = {
                            success: true,
                            userPub: userPub,
                            username: normalizedUsername,
                            isNewUser: isNewUser,
                            // Get the SEA pair from the user object
                            sea: userSea
                                ? {
                                    pub: userSea.pub,
                                    priv: userSea.priv,
                                    epub: userSea.epub,
                                    epriv: userSea.epriv,
                                }
                                : undefined,
                        };
                        console.log("[POSTAUTH] Post-auth setup completed successfully for user: ".concat(username));
                        return [2 /*return*/, result];
                    case 10:
                        error_2 = _b.sent();
                        console.error("[POSTAUTH] Error in post-authentication setup for ".concat(username, ":"), error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: "Post-authentication setup failed: ".concat(error_2),
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sets up comprehensive user tracking system for agile user lookup
     * Creates multiple indexes for efficient user discovery
     */
    DataBase.prototype.setupComprehensiveUserTracking = function (username, userPub, epub) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasIndexResult, usernameMappingResult, userRegistryResult, reverseLookupResult, epubIndexResult, userMetadataResult, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[TRACKING] Starting comprehensive user tracking setup for: ".concat(username, ", userPub: ").concat(userPub));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        // 1. Create alias index: ~@alias -> userPub (for GunDB compatibility)
                        console.log("[TRACKING] Step 1: Creating alias index for ".concat(username));
                        return [4 /*yield*/, this.createAliasIndex(username, userPub)];
                    case 2:
                        aliasIndexResult = _a.sent();
                        if (!aliasIndexResult) {
                            console.error("[TRACKING] Failed to create alias index for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 1 completed: Alias index created for ".concat(username));
                        // 2. Create username mapping: usernames/alias -> userPub
                        console.log("[TRACKING] Step 2: Creating username mapping for ".concat(username));
                        return [4 /*yield*/, this.createUsernameMapping(username, userPub)];
                    case 3:
                        usernameMappingResult = _a.sent();
                        if (!usernameMappingResult) {
                            console.error("[TRACKING] Failed to create username mapping for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 2 completed: Username mapping created for ".concat(username));
                        // 3. Create user registry: users/userPub -> user data
                        console.log("[TRACKING] Step 3: Creating user registry for ".concat(username));
                        return [4 /*yield*/, this.createUserRegistry(username, userPub, epub)];
                    case 4:
                        userRegistryResult = _a.sent();
                        if (!userRegistryResult) {
                            console.error("[TRACKING] Failed to create user registry for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 3 completed: User registry created for ".concat(username));
                        // 4. Create reverse lookup: userPub -> alias
                        console.log("[TRACKING] Step 4: Creating reverse lookup for ".concat(username));
                        return [4 /*yield*/, this.createReverseLookup(username, userPub)];
                    case 5:
                        reverseLookupResult = _a.sent();
                        if (!reverseLookupResult) {
                            console.error("[TRACKING] Failed to create reverse lookup for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 4 completed: Reverse lookup created for ".concat(username));
                        if (!epub) return [3 /*break*/, 7];
                        console.log("[TRACKING] Step 5: Creating epub index for ".concat(username));
                        return [4 /*yield*/, this.createEpubIndex(epub, userPub)];
                    case 6:
                        epubIndexResult = _a.sent();
                        if (!epubIndexResult) {
                            console.error("[TRACKING] Failed to create epub index for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 5 completed: Epub index created for ".concat(username));
                        return [3 /*break*/, 8];
                    case 7:
                        console.log("[TRACKING] Step 5 skipped: No epub available for ".concat(username));
                        _a.label = 8;
                    case 8:
                        // 6. Create user metadata in user's own node
                        console.log("[TRACKING] Step 6: Creating user metadata for ".concat(username));
                        return [4 /*yield*/, this.createUserMetadata(username, userPub, epub)];
                    case 9:
                        userMetadataResult = _a.sent();
                        if (!userMetadataResult) {
                            console.error("[TRACKING] Failed to create user metadata for ".concat(username));
                            return [2 /*return*/, false];
                        }
                        console.log("[TRACKING] Step 6 completed: User metadata created for ".concat(username));
                        console.log("[TRACKING] Comprehensive user tracking setup completed successfully for: ".concat(username));
                        return [2 /*return*/, true];
                    case 10:
                        error_3 = _a.sent();
                        console.error("[TRACKING] Error in comprehensive user tracking setup for ".concat(username, ":"), error_3);
                        // Don't throw - continue with other operations
                        return [2 /*return*/, false];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates alias index following GunDB pattern: ~@alias -> userPub
     */
    DataBase.prototype.createAliasIndex = function (username, userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var aliasData_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    aliasData_1 = {
                        username: username,
                        userPub: userPub,
                        createdAt: Date.now(),
                    };
                    return [2 /*return*/, new Promise(function (resolve) {
                            // Add timeout to prevent hanging
                            var timeout = setTimeout(function () {
                                console.error("Alias index creation timeout for ".concat(username));
                                resolve(false);
                            }, 5000); // 5 second timeout
                            // Store alias mapping in a simple way
                            _this.node
                                .get("aliases")
                                .get(username)
                                .put(aliasData_1, function (ack) {
                                clearTimeout(timeout); // Clear timeout since callback fired
                                if (ack && ack.err) {
                                    console.error("Error creating alias index: ".concat(ack.err));
                                    resolve(false);
                                }
                                else {
                                    console.log("\u2713 Alias index created for ".concat(username));
                                    resolve(true);
                                }
                            });
                        })];
                }
                catch (error) {
                    console.error("Error creating alias index: ".concat(error));
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates username mapping: usernames/alias -> userPub
     */
    DataBase.prototype.createUsernameMapping = function (username, userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, new Promise(function (resolve) {
                            _this.node
                                .get("usernames")
                                .get(username)
                                .put(userPub, function (ack) {
                                if (ack && ack.err) {
                                    console.error("Error creating username mapping: ".concat(ack.err));
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        })];
                }
                catch (error) {
                    console.error("Error creating username mapping: ".concat(error));
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates user registry: users/userPub -> user data
     */
    DataBase.prototype.createUserRegistry = function (username, userPub, epub) {
        return __awaiter(this, void 0, void 0, function () {
            var userData_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    userData_1 = {
                        username: username,
                        userPub: userPub,
                        epub: epub,
                        registeredAt: Date.now().toString(),
                        lastSeen: Date.now().toString(),
                    };
                    return [2 /*return*/, new Promise(function (resolve) {
                            _this.node
                                .get("users")
                                .get(userPub)
                                .put(userData_1, function (ack) {
                                if (ack && ack.err) {
                                    console.error("Error creating user registry: ".concat(ack.err));
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        })];
                }
                catch (error) {
                    console.error("Error creating user registry: ".concat(error));
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates reverse lookup: userPub -> alias
     */
    DataBase.prototype.createReverseLookup = function (username, userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var ack, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.node
                                .get("userAliases")
                                .get(userPub)
                                .put(username)
                                .then()];
                    case 1:
                        ack = _a.sent();
                        if (ack.err) {
                            console.error("Error creating reverse lookup: ".concat(ack.err));
                            return [2 /*return*/, false];
                        }
                        else {
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error creating reverse lookup: ".concat(error_4));
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates epub index: epubKeys/epub -> userPub
     */
    DataBase.prototype.createEpubIndex = function (epub, userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, new Promise(function (resolve) {
                            _this.node
                                .get("epubKeys")
                                .get(epub)
                                .put(userPub, function (ack) {
                                if (ack && ack.err) {
                                    console.error("Error creating epub index: ".concat(ack.err));
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        })];
                }
                catch (error) {
                    console.error("Error creating epub index: ".concat(error));
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates user metadata in user's own node
     */
    DataBase.prototype.createUserMetadata = function (username, userPub, epub) {
        return __awaiter(this, void 0, void 0, function () {
            var userMetadata_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    userMetadata_1 = {
                        username: username,
                        epub: epub,
                        registeredAt: Date.now(),
                        lastSeen: Date.now(),
                    };
                    return [2 /*return*/, new Promise(function (resolve) {
                            _this.gun.get(userPub).put(userMetadata_1, function (ack) {
                                if (ack && ack.err) {
                                    console.error("Error creating user metadata: ".concat(ack.err));
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        })];
                }
                catch (error) {
                    console.error("Error creating user metadata: ".concat(error));
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets user information by alias using the comprehensive tracking system
     * @param alias Username/alias to lookup
     * @returns Promise resolving to user information or null if not found
     */
    DataBase.prototype.getUserByAlias = function (alias) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedAlias, aliasData, userPub, userData, error_5, userPub, userData, error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        normalizedAlias = alias.trim().toLowerCase();
                        if (!normalizedAlias) {
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.gun.get("~@".concat(normalizedAlias)).then()];
                    case 2:
                        aliasData = _a.sent();
                        if (!(aliasData && aliasData["~pubKeyOfUser"])) return [3 /*break*/, 4];
                        userPub = aliasData["~pubKeyOfUser"]["#"] || aliasData["~pubKeyOfUser"];
                        if (!userPub) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getUserDataByPub(userPub)];
                    case 3:
                        userData = _a.sent();
                        if (userData) {
                            return [2 /*return*/, userData];
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        console.error("GunDB alias lookup failed for ".concat(normalizedAlias, ":"), error_5);
                        return [3 /*break*/, 6];
                    case 6:
                        _a.trys.push([6, 10, , 11]);
                        return [4 /*yield*/, this.node
                                .get("usernames")
                                .get(normalizedAlias)
                                .then()];
                    case 7:
                        userPub = _a.sent();
                        if (!userPub) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.getUserDataByPub(userPub)];
                    case 8:
                        userData = _a.sent();
                        if (userData) {
                            return [2 /*return*/, userData];
                        }
                        _a.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_6 = _a.sent();
                        console.error("Username mapping lookup failed for ".concat(normalizedAlias, ":"), error_6);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, null];
                    case 12:
                        error_7 = _a.sent();
                        console.error("Error looking up user by alias ".concat(alias, ":"), error_7);
                        return [2 /*return*/, null];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets user information by public key
     * @param userPub User's public key
     * @returns Promise resolving to user information or null if not found
     */
    DataBase.prototype.getUserDataByPub = function (userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var userData, error_8, userNodeData, error_9, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        if (!userPub || typeof userPub !== "string") {
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.node.get("users").get(userPub).then()];
                    case 2:
                        userData = _a.sent();
                        if (userData && userData.username) {
                            return [2 /*return*/, {
                                    userPub: userData.userPub || userPub,
                                    epub: userData.epub || null,
                                    username: userData.username,
                                    registeredAt: userData.registeredAt || 0,
                                    lastSeen: userData.lastSeen || 0,
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        console.error("User registry lookup failed for ".concat(userPub, ":"), error_8);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.gun.get(userPub).then()];
                    case 5:
                        userNodeData = _a.sent();
                        if (userNodeData && userNodeData.username) {
                            return [2 /*return*/, {
                                    userPub: userPub,
                                    epub: userNodeData.epub || null,
                                    username: userNodeData.username,
                                    registeredAt: userNodeData.registeredAt || 0,
                                    lastSeen: userNodeData.lastSeen || 0,
                                }];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_9 = _a.sent();
                        console.error("User node lookup failed for ".concat(userPub, ":"), error_9);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, null];
                    case 8:
                        error_10 = _a.sent();
                        console.error("Error looking up user data by pub ".concat(userPub, ":"), error_10);
                        return [2 /*return*/, null];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets user public key by encryption public key (epub)
     * @param epub User's encryption public key
     * @returns Promise resolving to user public key or null if not found
     */
    DataBase.prototype.getUserPubByEpub = function (epub) {
        return __awaiter(this, void 0, void 0, function () {
            var userPub, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!epub || typeof epub !== "string") {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.node.get("epubKeys").get(epub).then()];
                    case 1:
                        userPub = _a.sent();
                        return [2 /*return*/, userPub || null];
                    case 2:
                        error_11 = _a.sent();
                        console.error("Error looking up user pub by epub ".concat(epub, ":"), error_11);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets user alias by public key
     * @param userPub User's public key
     * @returns Promise resolving to user alias or null if not found
     */
    DataBase.prototype.getUserAliasByPub = function (userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var alias, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!userPub || typeof userPub !== "string") {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.node.get("userAliases").get(userPub).then()];
                    case 1:
                        alias = _a.sent();
                        return [2 /*return*/, alias || null];
                    case 2:
                        error_12 = _a.sent();
                        console.error("Error looking up user alias by pub ".concat(userPub, ":"), error_12);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets all registered users (for admin purposes)
     * @returns Promise resolving to array of user information
     */
    DataBase.prototype.getAllRegisteredUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var users, usersNode;
            return __generator(this, function (_a) {
                try {
                    users = [];
                    usersNode = this.node.get("users");
                    // Note: This is a simplified approach. In a real implementation,
                    // you might want to use Gun's map functionality or iterate through
                    // known user public keys
                    return [2 /*return*/, users];
                }
                catch (error) {
                    console.error("Error getting all registered users:", error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Updates user's last seen timestamp
     * @param userPub User's public key
     */
    DataBase.prototype.updateUserLastSeen = function (userPub) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, error_13, error_14, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        if (!userPub || typeof userPub !== "string") {
                            return [2 /*return*/];
                        }
                        timestamp = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.node
                                .get("users")
                                .get(userPub)
                                .get("lastSeen")
                                .put(timestamp)
                                .then()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        console.error("Failed to update lastSeen in user registry:", error_13);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.gun.get(userPub).get("lastSeen").put(timestamp).then()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_14 = _a.sent();
                        console.error("Failed to update lastSeen in user node:", error_14);
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_15 = _a.sent();
                        console.error("Error updating user last seen for ".concat(userPub, ":"), error_15);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Resets Gun.js authentication state to allow new auth operations
     */
    DataBase.prototype.resetAuthState = function () {
        try {
            var currentUser = this.gun.user();
            if (currentUser && currentUser._) {
                // Reset the authentication flag
                if (currentUser._.sea) {
                    currentUser._.sea = null;
                }
                // Reset the ing flag that prevents concurrent operations
                if (currentUser._.ing) {
                    currentUser._.ing = false;
                }
                // Force clear any pending authentication callbacks
                if (currentUser._.auth) {
                    currentUser._.auth = null;
                }
                // Clear any pending operations
                if (currentUser._.act) {
                    currentUser._.act = null;
                }
                // Clear any pending callbacks
                if (currentUser._.cb) {
                    currentUser._.cb = null;
                }
                // Clear any pending retries
                if (currentUser._.retries) {
                    currentUser._.retries = 0;
                }
                // Clear any pending timeouts
                if (currentUser._.timeout) {
                    clearTimeout(currentUser._.timeout);
                    currentUser._.timeout = null;
                }
            }
            // Also try to call leave() to ensure clean state
            try {
                currentUser.leave();
            }
            catch (leaveError) {
                // Ignore leave errors, just trying to clean up
            }
            // Force clear the user reference to ensure clean state
            this.user = null;
            console.log("Auth state reset completed");
        }
        catch (error) {
            console.warn("Error resetting auth state:", error);
        }
    };
    /**
     * Performs authentication with Gun with retry mechanism
     */
    DataBase.prototype.performAuthentication = function (username_1, password_1, pair_1) {
        return __awaiter(this, arguments, void 0, function (username, password, pair, retryCount, maxRetries) {
            var _this = this;
            if (retryCount === void 0) { retryCount = 0; }
            if (maxRetries === void 0) { maxRetries = 3; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        // Check if there's already an authentication operation in progress
                        var currentUser = _this.gun.user();
                        if (currentUser && currentUser._ && currentUser._.ing) {
                            if (retryCount < maxRetries) {
                                console.warn("Authentication already in progress, retrying... (".concat(retryCount + 1, "/").concat(maxRetries, ")"));
                                _this.resetAuthState();
                                // For the first retry, try to create a fresh authentication context
                                if (retryCount === 0) {
                                    _this.createFreshAuthContext();
                                }
                                // Add exponential backoff delay with jitter
                                var baseDelay = 200 * Math.pow(2, retryCount);
                                var jitter = Math.random() * 200;
                                var delay = Math.min(baseDelay + jitter, 3000);
                                setTimeout(function () {
                                    _this.performAuthentication(username, password, pair, retryCount + 1, maxRetries)
                                        .then(resolve)
                                        .catch(function (error) {
                                        return resolve({ success: false, error: String(error) });
                                    });
                                }, delay);
                                return;
                            }
                            else {
                                console.error("Max retries exceeded for authentication");
                                _this.resetAuthState();
                                resolve({
                                    success: false,
                                    error: "Authentication failed after multiple retries",
                                });
                                return;
                            }
                        }
                        _this.performAuthenticationInternal(username, password, pair, resolve);
                    })];
            });
        });
    };
    /**
     * Internal authentication method with timeout
     */
    DataBase.prototype.performAuthenticationInternal = function (username, password, pair, resolve) {
        var _this = this;
        var resolved = false;
        var timeout = 30000; // 15 second timeout for individual auth attempts
        var timeoutId = setTimeout(function () {
            if (!resolved) {
                resolved = true;
                console.error("Authentication timeout for ".concat(username, " after ").concat(timeout, "ms"));
                _this.resetAuthState();
                resolve({
                    success: false,
                    error: "Authentication timeout after ".concat(timeout, "ms"),
                });
            }
        }, timeout);
        var authCallback = function (ack) {
            if (resolved)
                return;
            resolved = true;
            clearTimeout(timeoutId);
            if (ack.err) {
                console.error("Login error for ".concat(username, ": ").concat(ack.err));
                // Reset auth state on error to prevent blocking future attempts
                _this.resetAuthState();
                resolve({ success: false, error: ack.err });
            }
            else {
                resolve({ success: true, ack: ack });
            }
        };
        if (pair) {
            this.gun.user().auth(pair, authCallback);
        }
        else {
            this.gun.user().auth(username, password, authCallback);
        }
    };
    /**
     * Builds login result object
     */
    DataBase.prototype.buildLoginResult = function (username, userPub) {
        var _a, _b;
        // Get the SEA pair from the user object
        var seaPair = (_b = (_a = this.gun.user()) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea;
        return {
            success: true,
            userPub: userPub,
            username: username,
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
    };
    /**
     * Performs login with username and password
     * @param username Username
     * @param password Password
     * @param pair SEA pair (optional)
     * @returns Promise resolving to AuthResult object
     */
    DataBase.prototype.login = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var loginResult, errorMessage, userPub, alias, userPair, postAuthError_2, lastSeenError_1, userInfo, error_16;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.performAuthentication(username, password, pair)];
                    case 1:
                        loginResult = _e.sent();
                        if (!loginResult.success) {
                            errorMessage = "User '".concat(username, "' not found. Please check your username or register first.");
                            if (loginResult.error) {
                                if (loginResult.error.includes("already being created or authenticated")) {
                                    errorMessage =
                                        "Authentication is already in progress. Please wait and try again.";
                                }
                                else if (loginResult.error.includes("Wrong user or password")) {
                                    errorMessage =
                                        "Invalid username or password. Please check your credentials.";
                                }
                                else if (loginResult.error.includes("User already created")) {
                                    errorMessage =
                                        "User already exists. Please try logging in instead.";
                                }
                                else {
                                    errorMessage = loginResult.error;
                                }
                            }
                            return [2 /*return*/, {
                                    success: false,
                                    error: errorMessage,
                                }];
                        }
                        // Add a small delay to ensure user state is properly set
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 2:
                        // Add a small delay to ensure user state is properly set
                        _e.sent();
                        userPub = (_a = this.gun.user().is) === null || _a === void 0 ? void 0 : _a.pub;
                        alias = (_b = this.gun.user().is) === null || _b === void 0 ? void 0 : _b.alias;
                        userPair = (_d = (_c = this.gun.user()) === null || _c === void 0 ? void 0 : _c._) === null || _d === void 0 ? void 0 : _d.sea;
                        if (!alias) {
                            alias = username;
                        }
                        if (!userPub) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Authentication failed: No user pub returned.",
                                }];
                        }
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.runPostAuthOnAuthResult(alias, userPub, {
                                success: true,
                                userPub: userPub,
                            })];
                    case 4:
                        _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        postAuthError_2 = _e.sent();
                        console.error("Post-auth error during login: ".concat(postAuthError_2));
                        return [3 /*break*/, 6];
                    case 6:
                        _e.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.updateUserLastSeen(userPub)];
                    case 7:
                        _e.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        lastSeenError_1 = _e.sent();
                        console.error("Error updating last seen: ".concat(lastSeenError_1));
                        return [3 /*break*/, 9];
                    case 9:
                        // Save credentials for future sessions
                        try {
                            userInfo = {
                                alias: username,
                                pair: pair !== null && pair !== void 0 ? pair : userPair,
                                userPub: userPub,
                            };
                            this.saveCredentials(userInfo);
                        }
                        catch (saveError) {
                            console.error("Error saving credentials:", saveError);
                        }
                        return [2 /*return*/, this.buildLoginResult(username, userPub)];
                    case 10:
                        error_16 = _e.sent();
                        console.error("Exception during login for ".concat(username, ": ").concat(error_16));
                        return [2 /*return*/, { success: false, error: String(error_16) }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Performs login with GunDB pair directly
     * @param username Username
     * @param pair SEA pair
     * @returns Promise resolving to AuthResult object
     */
    DataBase.prototype.loginWithPair = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var loginResult, lastSeenError_2, error_17;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.performAuthentication(username, "", pair)];
                    case 1:
                        loginResult = _b.sent();
                        if (!loginResult.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "User '".concat(username, "' not found. Please check your username or register first."),
                                }];
                        }
                        return [4 /*yield*/, this.runPostAuthOnAuthResult(username, pair.pub || "", {
                                success: true,
                                userPub: pair.pub,
                            })];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.updateUserLastSeen(pair.pub)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        lastSeenError_2 = _b.sent();
                        console.error("Error updating last seen: ".concat(lastSeenError_2));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, this.buildLoginResult(username, ((_a = this.gun.user().is) === null || _a === void 0 ? void 0 : _a.pub) || "")];
                    case 7:
                        error_17 = _b.sent();
                        console.error("Exception during login with pair: ".concat(error_17));
                        return [2 /*return*/, { success: false, error: String(error_17) }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DataBase.prototype.saveCredentials = function (userInfo) {
        try {
            var sessionInfo = {
                username: userInfo.alias,
                pair: userInfo.pair,
                userPub: userInfo.userPub,
                timestamp: Date.now(),
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            };
            if (typeof sessionStorage !== "undefined") {
                // Save session data directly (unencrypted)
                sessionStorage.setItem("gunSessionData", JSON.stringify(sessionInfo));
            }
        }
        catch (error) {
            console.error("Error saving credentials: ".concat(error));
        }
    };
    /**
     * Sets up security questions and password hint
     * @param username Username
     * @param password Current password
     * @param hint Password hint
     * @param securityQuestions Array of security questions
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the operation result
     */
    DataBase.prototype.setPasswordHintWithSecurity = function (username, password, hint, securityQuestions, securityAnswers) {
        return __awaiter(this, void 0, void 0, function () {
            var loginResult, currentUser, answersText, proofOfWork, hashError_1, encryptedHint, encryptError_1, userPub, securityPayload, ack, error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.login(username, password)];
                    case 1:
                        loginResult = _a.sent();
                        if (!loginResult.success) {
                            return [2 /*return*/, { success: false, error: "Authentication failed" }];
                        }
                        currentUser = this.getCurrentUser();
                        if (!currentUser || !currentUser.pub) {
                            return [2 /*return*/, { success: false, error: "User not authenticated" }];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 20, , 21]);
                        answersText = securityAnswers.join("|");
                        proofOfWork = void 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 10]);
                        if (!(sea_1.default && sea_1.default.work)) return [3 /*break*/, 5];
                        return [4 /*yield*/, sea_1.default.work(answersText, null, null, {
                                name: "SHA-256",
                            })];
                    case 4:
                        proofOfWork = _a.sent();
                        return [3 /*break*/, 8];
                    case 5:
                        if (!(this.crypto && this.crypto.hashText)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.crypto.hashText(answersText)];
                    case 6:
                        proofOfWork = _a.sent();
                        return [3 /*break*/, 8];
                    case 7: throw new Error("Cryptographic functions not available");
                    case 8:
                        if (!proofOfWork) {
                            throw new Error("Failed to generate hash");
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        hashError_1 = _a.sent();
                        console.error("Error generating hash:", hashError_1);
                        return [2 /*return*/, { success: false, error: "Failed to generate security hash" }];
                    case 10:
                        encryptedHint = void 0;
                        _a.label = 11;
                    case 11:
                        _a.trys.push([11, 17, , 18]);
                        if (!(sea_1.default && sea_1.default.encrypt)) return [3 /*break*/, 13];
                        return [4 /*yield*/, sea_1.default.encrypt(hint, proofOfWork)];
                    case 12:
                        encryptedHint = _a.sent();
                        return [3 /*break*/, 16];
                    case 13:
                        if (!(this.crypto && this.crypto.encrypt)) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.crypto.encrypt(hint, proofOfWork)];
                    case 14:
                        encryptedHint = _a.sent();
                        return [3 /*break*/, 16];
                    case 15: throw new Error("Encryption functions not available");
                    case 16:
                        if (!encryptedHint) {
                            throw new Error("Failed to encrypt hint");
                        }
                        return [3 /*break*/, 18];
                    case 17:
                        encryptError_1 = _a.sent();
                        console.error("Error encrypting hint:", encryptError_1);
                        return [2 /*return*/, { success: false, error: "Failed to encrypt password hint" }];
                    case 18:
                        userPub = currentUser.pub;
                        securityPayload = {
                            questions: JSON.stringify(securityQuestions),
                            hint: encryptedHint,
                        };
                        return [4 /*yield*/, this.node.get(userPub)
                                .get("security")
                                .put(securityPayload)
                                .then()];
                    case 19:
                        ack = _a.sent();
                        if (ack.err) {
                            console.error("Error saving security data to public graph:", ack.err);
                            throw new Error(ack.err);
                        }
                        return [2 /*return*/, { success: true }];
                    case 20:
                        error_18 = _a.sent();
                        console.error("Error setting password hint:", error_18);
                        return [2 /*return*/, { success: false, error: String(error_18) }];
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recovers password hint using security question answers
     * @param username Username
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the password hint
     */
    DataBase.prototype.forgotPassword = function (username, securityAnswers) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedUsername, userPub, securityData, answersText, proofOfWork, hashError_2, hint, decryptError_1, error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 19, , 20]);
                        normalizedUsername = username.trim().toLowerCase();
                        return [4 /*yield*/, this.node.get("usernames").get(normalizedUsername).then()];
                    case 1:
                        userPub = (_a.sent()) ||
                            null;
                        if (!userPub) {
                            return [2 /*return*/, { success: false, error: "User not found" }];
                        }
                        return [4 /*yield*/, this.node.get(userPub)
                                .get("security")
                                .then()];
                    case 2:
                        securityData = _a.sent();
                        if (!securityData || !securityData.hint) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "No password hint found",
                                }];
                        }
                        answersText = securityAnswers.join("|");
                        proofOfWork = void 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 10]);
                        if (!(sea_1.default && sea_1.default.work)) return [3 /*break*/, 5];
                        return [4 /*yield*/, sea_1.default.work(answersText, null, null, {
                                name: "SHA-256",
                            })];
                    case 4:
                        proofOfWork = _a.sent();
                        return [3 /*break*/, 8];
                    case 5:
                        if (!(this.crypto && this.crypto.hashText)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.crypto.hashText(answersText)];
                    case 6:
                        proofOfWork = _a.sent();
                        return [3 /*break*/, 8];
                    case 7: throw new Error("Cryptographic functions not available");
                    case 8:
                        if (!proofOfWork) {
                            throw new Error("Failed to generate hash");
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        hashError_2 = _a.sent();
                        console.error("Error generating hash:", hashError_2);
                        return [2 /*return*/, { success: false, error: "Failed to generate security hash" }];
                    case 10:
                        hint = void 0;
                        _a.label = 11;
                    case 11:
                        _a.trys.push([11, 17, , 18]);
                        if (!(sea_1.default && sea_1.default.decrypt)) return [3 /*break*/, 13];
                        return [4 /*yield*/, sea_1.default.decrypt(securityData.hint, proofOfWork)];
                    case 12:
                        hint = _a.sent();
                        return [3 /*break*/, 16];
                    case 13:
                        if (!(this.crypto && this.crypto.decrypt)) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.crypto.decrypt(securityData.hint, proofOfWork)];
                    case 14:
                        hint = _a.sent();
                        return [3 /*break*/, 16];
                    case 15: throw new Error("Decryption functions not available");
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        decryptError_1 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: "Incorrect answers to security questions",
                            }];
                    case 18:
                        if (hint === undefined) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Incorrect answers to security questions",
                                }];
                        }
                        return [2 /*return*/, { success: true, hint: hint }];
                    case 19:
                        error_19 = _a.sent();
                        console.error("Error recovering password hint:", error_19);
                        return [2 /*return*/, { success: false, error: String(error_19) }];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    DataBase.prototype.on = function (event, listener) {
        this.eventEmitter.on(event, listener);
    };
    /**
     * Removes an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    DataBase.prototype.off = function (event, listener) {
        this.eventEmitter.off(event, listener);
    };
    /**
     * Adds a one-time event listener
     * @param event Event name
     * @param listener Event listener function
     */
    DataBase.prototype.once = function (event, listener) {
        this.eventEmitter.once(event, listener);
    };
    /**
     * Emits an event
     * @param event Event name
     * @param data Event data
     */
    DataBase.prototype.emit = function (event, data) {
        return this.eventEmitter.emit(event, data);
    };
    /**
     * Recall user session
     */
    DataBase.prototype.recall = function (options) {
        if (this.user) {
            if (typeof sessionStorage !== "undefined" &&
                sessionStorage.getItem("pair")) {
                this.user.recall({ sessionStorage: true });
            }
            else {
                this.user;
            }
        }
    };
    /**
     * Leave user session
     */
    DataBase.prototype.leave = function () {
        if (this.user) {
            this.user.leave();
        }
    };
    /**
     * Set user data
     */
    DataBase.prototype.setUserData = function (data) {
        if (this.user) {
            this.user.put(data);
        }
    };
    /**
     * Set password hint
     */
    DataBase.prototype.setPasswordHint = function (hint) {
        if (this.user) {
            try {
                this.user.get("passwordHint").put(hint);
            }
            catch (error) {
                // Handle case where user.get returns undefined
                console.warn("Could not set password hint:", error);
            }
        }
    };
    /**
     * Get password hint
     */
    DataBase.prototype.getPasswordHint = function () {
        if (this.user) {
            // Access passwordHint from user data, not from is object
            return this.user.passwordHint || null;
        }
        return null;
    };
    /**
     * Save session to storage
     */
    DataBase.prototype.saveSession = function (session) {
        if (this.user) {
            if (typeof sessionStorage !== "undefined" &&
                sessionStorage.getItem("pair")) {
                this.user.recall({ sessionStorage: true });
            }
            else {
                this.user;
            }
        }
    };
    /**
     * Load session from storage
     */
    DataBase.prototype.loadSession = function () {
        if (this.user) {
            if (typeof sessionStorage !== "undefined" &&
                sessionStorage.getItem("pair")) {
                return this.user.recall({ sessionStorage: true });
            }
            else {
                return this.user;
            }
        }
        return null;
    };
    /**
     * Clear session
     */
    DataBase.prototype.clearSession = function () {
        if (this.user) {
            this.user.leave();
        }
    };
    /**
     * Get app scope
     */
    DataBase.prototype.getAppScope = function () {
        var _a, _b;
        return ((_b = (_a = this.node) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.soul) || "shogun";
    };
    /**
     * Get user public key
     */
    DataBase.prototype.getUserPub = function () {
        var _a;
        if (this.user) {
            return ((_a = this.user.is) === null || _a === void 0 ? void 0 : _a.pub) || null;
        }
        return null;
    };
    /**
     * Check if user is authenticated
     */
    DataBase.prototype.isAuthenticated = function () {
        var _a, _b;
        return ((_b = (_a = this.user) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub) ? true : false;
    };
    /**
     * Check if an authentication operation is currently in progress
     */
    DataBase.prototype.isAuthInProgress = function () {
        try {
            var currentUser = this.gun.user();
            return !!(currentUser && currentUser._ && currentUser._.ing);
        }
        catch (error) {
            console.warn("Error checking auth progress:", error);
            return false;
        }
    };
    /**
     * Force reset authentication state (useful for debugging or recovery)
     */
    DataBase.prototype.forceResetAuthState = function () {
        this.resetAuthState();
    };
    /**
     * Aggressive cleanup for problematic users
     * This method performs a complete reset of all authentication state
     */
    DataBase.prototype.aggressiveAuthCleanup = function () {
        try {
            console.log("🧹 Performing aggressive auth cleanup...");
            // Reset all auth state
            this.resetAuthState();
            // Clear all Gun.js internal state
            var currentUser = this.gun.user();
            if (currentUser && currentUser._) {
                // Clear all possible internal flags
                var internalState_1 = currentUser._;
                Object.keys(internalState_1).forEach(function (key) {
                    if (typeof internalState_1[key] === "boolean") {
                        internalState_1[key] = false;
                    }
                    else if (typeof internalState_1[key] === "object" &&
                        internalState_1[key] !== null) {
                        if (key === "sea" ||
                            key === "auth" ||
                            key === "act" ||
                            key === "cb") {
                            internalState_1[key] = null;
                        }
                    }
                });
            }
            // Force logout
            try {
                currentUser.leave();
            }
            catch (error) {
                // Ignore errors
            }
            // Clear user reference
            this.user = null;
            // Clear all session storage
            if (typeof sessionStorage !== "undefined") {
                try {
                    var keys = Object.keys(sessionStorage);
                    keys.forEach(function (key) {
                        if (key.includes("gun") ||
                            key.includes("user") ||
                            key.includes("auth")) {
                            sessionStorage.removeItem(key);
                        }
                    });
                }
                catch (error) {
                    // Ignore errors
                }
            }
            // Clear all local storage
            if (typeof localStorage !== "undefined") {
                try {
                    var keys = Object.keys(localStorage);
                    keys.forEach(function (key) {
                        if (key.includes("gun") ||
                            key.includes("user") ||
                            key.includes("auth")) {
                            localStorage.removeItem(key);
                        }
                    });
                }
                catch (error) {
                    // Ignore errors
                }
            }
            console.log("✓ Aggressive auth cleanup completed");
        }
        catch (error) {
            console.error("Error during aggressive cleanup:", error);
        }
    };
    /**
     * Creates a completely fresh authentication context
     * This is a more aggressive approach when normal reset doesn't work
     */
    DataBase.prototype.createFreshAuthContext = function () {
        try {
            // Reset all auth state
            this.resetAuthState();
            // Create a completely new user instance
            var freshUser = this.gun.user();
            this.user = freshUser;
            // Clear any cached authentication data
            if (typeof sessionStorage !== "undefined") {
                try {
                    sessionStorage.removeItem("gunSessionData");
                    sessionStorage.removeItem("gunUserData");
                }
                catch (error) {
                    console.warn("Error clearing session storage:", error);
                }
            }
            console.log("Fresh authentication context created");
        }
        catch (error) {
            console.error("Error creating fresh auth context:", error);
        }
    };
    // Errors
    DataBase.Errors = GunErrors;
    return DataBase;
}());
exports.DataBase = DataBase;
