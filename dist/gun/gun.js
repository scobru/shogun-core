/**
 * GunDB - Optimized class with advanced Auth integration
 */
import Gun from "gun";
import "gun/sea";
import CONFIG from "../config";
import { log, logError } from "../utils/logger";
/**
 * GunDB - Simplified Gun management with advanced Auth
 *
 * Uses the Auth class for optimized authentication handling
 */
class GunDB {
    /**
     * @param options - GunDBOptions
     */
    constructor(options = {}) {
        this.certificato = null;
        this.onAuthCallbacks = [];
        log("Initializing GunDB");
        // Use default configuration through spread to avoid null checks
        const config = {
            peers: options.peers || CONFIG.PEERS,
            localStorage: options.localStorage ?? false,
            radisk: options.radisk ?? false,
            multicast: options.multicast ?? false,
            axe: options.axe ?? false
        };
        // Configure GunDB with provided options
        this.gun = Gun(config);
        // Handle authentication events
        this.subscribeToAuthEvents();
    }
    /**
     * Subscribe to Gun authentication events
     */
    subscribeToAuthEvents() {
        this.gun.on("auth", (ack) => {
            log("Auth event received:", ack);
            if (ack.err) {
                logError("Authentication error:", ack.err);
            }
            else {
                this.notifyAuthListeners(ack.sea?.pub || "");
            }
        });
    }
    /**
     * Notify all authentication listeners
     * @param pub - Public key of authenticated user
     */
    notifyAuthListeners(pub) {
        const user = this.gun.user();
        this.onAuthCallbacks.forEach((callback) => {
            callback(user);
        });
    }
    /**
     * Create new GunDB instance with specified peers
     * @param peers - Array of peer URLs
     * @returns New GunDB instance
     */
    static withPeers(peers = CONFIG.PEERS) {
        return new GunDB({ peers });
    }
    /**
     * Add listener for authentication events
     * @param callback - Function to call when user authenticates
     * @returns Function to remove the listener
     */
    onAuth(callback) {
        this.onAuthCallbacks.push(callback);
        // If user is already authenticated, call callback immediately
        const user = this.gun.user();
        if (user && user.is) {
            callback(user);
        }
        // Return function to remove listener
        return () => {
            const index = this.onAuthCallbacks.indexOf(callback);
            if (index !== -1) {
                this.onAuthCallbacks.splice(index, 1);
            }
        };
    }
    /**
     * Get underlying Gun instance
     * @returns Gun instance
     */
    getGun() {
        return this.gun;
    }
    /**
     * Get current user
     * @returns Gun user or null if not authenticated
     */
    getUser() {
        return this.gun.user();
    }
    /**
     * Set certificate for current user
     * @param certificate - Certificate to use
     */
    setCertificate(certificate) {
        this.certificato = certificate;
        const user = this.gun.user();
        user.get("trust").get("certificate").put(certificate);
    }
    /**
     * Get current user's certificate
     * @returns Certificate or null if not available
     */
    getCertificate() {
        return this.certificato;
    }
    /**
     * Register a new user
     * @param username - Username
     * @param password - Password
     * @returns Promise resolving with user's public key
     */
    async signUp(username, password) {
        try {
            log("Attempting user registration:", username);
            return new Promise((resolve) => {
                this.gun.user().create(username, password, async (ack) => {
                    if (ack.err) {
                        logError(`Registration error: ${ack.err}`);
                        resolve({ success: false, error: ack.err });
                    }
                    else {
                        // Automatic login after registration
                        const loginResult = await this.login(username, password);
                        if (loginResult.success) {
                            log("Registration and login completed successfully");
                        }
                        else {
                            logError("Registration completed but login failed");
                        }
                        resolve(loginResult);
                    }
                });
            });
        }
        catch (error) {
            logError("Error during registration:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Login a user
     * @param username - Username
     * @param password - Password
     * @returns Promise resolving with login result
     */
    async login(username, password) {
        try {
            log("Login attempt for:", username);
            return new Promise((resolve) => {
                this.gun.user().auth(username, password, (ack) => {
                    if (ack.err) {
                        logError(`Login error: ${ack.err}`);
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    }
                    else {
                        const user = this.gun.user();
                        if (!user.is) {
                            resolve({
                                success: false,
                                error: "Login failed: user not authenticated",
                            });
                        }
                        else {
                            log("Login completed successfully");
                            const userPub = user.is?.pub || "";
                            resolve({
                                success: true,
                                userPub,
                                username,
                            });
                        }
                    }
                });
            });
        }
        catch (error) {
            logError("Error during login:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Logout current user
     */
    logout() {
        try {
            log("Attempting logout");
            this.gun.user().leave();
            log("Logout completed");
        }
        catch (error) {
            logError("Error during logout:", error);
        }
    }
    /**
     * Check if a user is currently authenticated
     * @returns true if a user is authenticated
     */
    isLoggedIn() {
        const user = this.gun.user();
        return !!(user && user.is && user.is.pub);
    }
    /**
     * Get currently authenticated user
     * @returns Current user or null if not authenticated
     */
    getCurrentUser() {
        const userPub = this.gun.user()?.is?.pub;
        if (!userPub) {
            return null;
        }
        return {
            pub: userPub,
            user: this.gun.user(),
        };
    }
    /**
     * Save data to user node
     */
    async saveUserData(path, data) {
        if (!this.gun.user()?.is?.pub) {
            throw new Error("User not authenticated");
        }
        return new Promise((resolve, reject) => {
            const options = this.certificato
                ? { opt: { cert: this.certificato } }
                : undefined;
            this.gun
                .user()
                .get(path)
                .put(data, (ack) => {
                if (ack && ack.err) {
                    logError(`Error saving data: ${ack.err}`);
                    reject(new Error(ack.err));
                }
                else {
                    log(`Data saved to ${path}`);
                    resolve(data);
                }
            }, options);
        });
    }
    /**
     * Retrieve data from user node
     */
    async getUserData(path) {
        if (!this.gun.user()?.is?.pub) {
            throw new Error("User not authenticated");
        }
        return new Promise((resolve) => {
            this.gun
                .user()
                .get(path)
                .once((data) => {
                if (!data) {
                    log(`No data found at ${path}`);
                    resolve(null);
                }
                else {
                    log(`Data retrieved from ${path}`);
                    resolve(data);
                }
            });
        });
    }
    /**
     * Save data to public node
     */
    async savePublicData(node, key, data) {
        return new Promise((resolve, reject) => {
            const options = this.certificato
                ? { opt: { cert: this.certificato } }
                : undefined;
            this.gun
                .get(node)
                .get(key)
                .put(data, (ack) => {
                if (ack && ack.err) {
                    logError(`Error saving public data: ${ack.err}`);
                    reject(new Error(ack.err));
                }
                else {
                    log(`Public data saved to ${node}/${key}`);
                    resolve(data);
                }
            }, options);
        });
    }
    /**
     * Retrieve data from public node
     */
    async getPublicData(node, key) {
        return new Promise((resolve) => {
            this.gun
                .get(node)
                .get(key)
                .once((data) => {
                if (!data) {
                    log(`No public data found at ${node}/${key}`);
                    resolve(null);
                }
                else {
                    log(`Public data retrieved from ${node}/${key}`);
                    resolve(data);
                }
            });
        });
    }
    /**
     * Generate new SEA key pair
     */
    async generateKeyPair() {
        // Use SEA.pair() directly instead of this.auth.generatePair()
        return Gun.SEA.pair();
    }
}
if (typeof window !== "undefined") {
    window.GunDB = GunDB;
}
else if (typeof global !== "undefined") {
    global.GunDB = GunDB;
}
export { GunDB };
