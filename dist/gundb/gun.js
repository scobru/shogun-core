"use strict";
/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
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
const auth_1 = __importDefault(require("./models/auth/auth"));
class GunDB {
    gun;
    user = null;
    crypto;
    utils;
    auth;
    node;
    onAuthCallbacks = [];
    _authenticating = false;
    // Integrated modules
    _rxjs;
    constructor(gun, appScope = "shogun") {
        (0, logger_1.log)("Initializing GunDB");
        this.gun = gun;
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.subscribeToAuthEvents();
        // bind crypto and utils
        this.crypto = crypto;
        this.utils = utils;
        // initialize auth manager
        this.auth = new auth_1.default(this, appScope);
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
     * Signs up a new user using AuthManager
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    async signUp(username, password) {
        (0, logger_1.log)("Attempting user registration using AuthManager:", username);
        try {
            // Validate credentials with AuthManager
            const validatedCreds = await this.auth.validate(username, password);
            // Create user with AuthManager
            const createResult = await this.auth.create({
                alias: validatedCreds.alias,
                password: validatedCreds.password,
            });
            if ("err" in createResult) {
                (0, logger_1.logError)(`User creation error: ${createResult.err}`);
                return { success: false, error: createResult.err };
            }
            // Store user metadata
            const user = this.gun.get(createResult.pub).put({
                username: username,
            });
            this.gun.get("users").set(user);
            // Login after creation
            (0, logger_1.log)(`Attempting login after registration for: ${username}`);
            try {
                // Login with the same credentials
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
     * Logs in a user using AuthManager
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    async login(username, password, callback) {
        if (this.isAuthenticating()) {
            const err = "Authentication already in progress";
            (0, logger_1.log)(err);
            return { success: false, error: err };
        }
        this._setAuthenticating(true);
        (0, logger_1.log)(`Attempting login with AuthManager for user: ${username}`);
        try {
            // Validate credentials
            const validatedCreds = await this.auth.validate(username, password);
            // Authenticate with AuthManager
            const authResult = await this.auth.auth({
                alias: validatedCreds.alias,
                password: validatedCreds.password,
            });
            this._setAuthenticating(false);
            if ("err" in authResult) {
                (0, logger_1.logError)(`Login error for ${username}: ${authResult.err}`);
                if (callback)
                    callback({ success: false, error: authResult.err });
                return { success: false, error: authResult.err };
            }
            const userPub = this.gun.user().is?.pub;
            // Update users collection if needed
            const user = this.gun.get("users").map((user) => {
                if (user.pub === userPub) {
                    return user;
                }
            });
            if (!user) {
                const user = this.gun.get(userPub).put({
                    username: username,
                });
                this.gun.get("users").set(user);
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
            this._setAuthenticating(false);
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
    isAuthenticating() {
        return this._authenticating;
    }
    _setAuthenticating(value) {
        this._authenticating = value;
    }
    /**
     * Logs out the current user using AuthManager
     */
    logout() {
        try {
            // Check if the user is actually logged in before attempting to logout
            if (!this.isLoggedIn()) {
                (0, logger_1.log)("No user logged in, skipping logout");
                return;
            }
            // Check if auth state machine is in the correct state for logout
            const currentState = auth_1.default.state.getCurrentState();
            if (currentState !== "authorized") {
                (0, logger_1.log)(`User in invalid state for logout: ${currentState}, using direct logout instead of AuthManager`);
                // Still perform Gun's direct logout for cleanup
                this.gun.user().leave();
                return;
            }
            // Use AuthManager for logout if state is correct
            this.auth
                .leave()
                .then(() => {
                (0, logger_1.log)("Logout completed via AuthManager");
            })
                .catch((err) => {
                (0, logger_1.logError)("Error during logout via AuthManager:", err);
                // Fallback to direct logout if AuthManager fails
                (0, logger_1.log)("Falling back to direct logout method");
                this.gun.user().leave();
            });
        }
        catch (error) {
            (0, logger_1.logError)("Error during logout:", error);
            // Last resort fallback
            try {
                this.gun.user().leave();
            }
            catch (fallbackError) {
                (0, logger_1.logError)("Fallback logout also failed:", fallbackError);
            }
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
