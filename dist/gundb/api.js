"use strict";
/**
 * Simplified API layer to reduce complexity for common use cases
 * Provides quick-start methods that wrap the full DataBase functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoQuickStart = exports.QuickStart = exports.SimpleGunAPI = void 0;
exports.createSimpleAPI = createSimpleAPI;
exports.quickStart = quickStart;
exports.autoQuickStart = autoQuickStart;
const db_1 = require("./db");
/**
 * Simple API wrapper that provides common operations with minimal complexity
 */
class SimpleGunAPI {
    constructor(db) {
        this.db = db;
    }
    /**
     * Quick data operations - simplified interface
     */
    // Simple get - returns data directly or null
    async get(path) {
        try {
            const result = await this.db.getData(path);
            return result;
        }
        catch (error) {
            console.warn(`Failed to get data from ${path}:`, error);
            return null;
        }
    }
    // Get Gun node - returns Gun node for chaining operations like .map()
    getNode(path) {
        return this.db.get(path);
    }
    // Get Gun node for direct chaining - returns the actual Gun node for full chaining support
    node(path) {
        return this.db.get(path);
    }
    // Get Gun node with chaining support - returns a wrapper that supports chaining
    chain(path) {
        const node = this.db.get(path);
        return {
            get: (subPath) => this.chain(`${path}/${subPath}`),
            put: async (data) => {
                try {
                    const result = await this.db.put(path, data);
                    return result.success;
                }
                catch (error) {
                    console.warn(`Failed to put data to ${path}:`, error);
                    return false;
                }
            },
            set: async (data) => {
                try {
                    const result = await this.db.set(path, data);
                    return result.success;
                }
                catch (error) {
                    console.warn(`Failed to set data to ${path}:`, error);
                    return false;
                }
            },
            once: async () => {
                try {
                    return await this.db.getData(path);
                }
                catch (error) {
                    console.warn(`Failed to get data from ${path}:`, error);
                    return null;
                }
            },
            then: async () => {
                try {
                    return await this.db.getData(path);
                }
                catch (error) {
                    console.warn(`Failed to get data from ${path}:`, error);
                    return null;
                }
            },
            map: (callback) => {
                return node.map ? node.map(callback) : null;
            },
        };
    }
    // Simple put - returns success boolean
    async put(path, data) {
        try {
            const result = await this.db.put(path, data);
            return result.success;
        }
        catch (error) {
            console.warn(`Failed to put data to ${path}:`, error);
            return false;
        }
    }
    // Simple set - returns success boolean
    async set(path, data) {
        try {
            const result = await this.db.set(path, data);
            return result.success;
        }
        catch (error) {
            console.warn(`Failed to set data to ${path}:`, error);
            return false;
        }
    }
    // Simple remove - returns success boolean
    async remove(path) {
        try {
            const result = await this.db.remove(path);
            return result.success;
        }
        catch (error) {
            console.warn(`Failed to remove data from ${path}:`, error);
            return false;
        }
    }
    /**
     * Quick authentication - simplified interface
     */
    // Simple login - returns user info or null
    async login(username, password) {
        try {
            const result = await this.db.login(username, password);
            if (result.success && result.userPub) {
                return {
                    userPub: result.userPub,
                    username: result.username || username,
                };
            }
            return null;
        }
        catch (error) {
            console.warn(`Login failed for ${username}:`, error);
            return null;
        }
    }
    // Simple signup - returns user info or null
    async signup(username, password) {
        try {
            const result = await this.db.signUp(username, password);
            if (result.success && result.userPub) {
                return {
                    userPub: result.userPub,
                    username: result.username || username,
                };
            }
            return null;
        }
        catch (error) {
            console.warn(`Signup failed for ${username}:`, error);
            return null;
        }
    }
    // Simple logout
    logout() {
        this.db.logout();
    }
    // Simple check if logged in
    isLoggedIn() {
        return this.db.isLoggedIn();
    }
    /**
     * Quick user data operations - simplified interface
     */
    // Simple user data get - using direct user node
    async getUserData(path) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return null;
            }
            const data = await this.db.user.get(path).once().then();
            return data;
        }
        catch (error) {
            console.warn(`Failed to get user data from ${path}:`, error);
            return null;
        }
    }
    // Simple user data put - using direct user node
    async putUserData(path, data) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get(path).put(data).then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to put user data to ${path}:`, error);
            return false;
        }
    }
    // Simple user data set (alternative to put) - using direct user node
    async setUserData(path, data) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get(path).put(data).then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to set user data to ${path}:`, error);
            return false;
        }
    }
    // Simple user data remove - using direct user node
    async removeUserData(path) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get(path).put(null).then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to remove user data from ${path}:`, error);
            return false;
        }
    }
    /**
     * Array utilities for GunDB
     * GunDB doesn't handle arrays well, so we convert them to indexed objects
     */
    // Convert array to indexed object for GunDB storage
    // [{ id: '1', name: 'Dog'}, { id: '2', name: 'Cat'}]
    // becomes { "1": { id: '1', name: 'Dog'}, "2": { id: '2', name: 'Cat'} }
    getIndexedObjectFromArray(arr) {
        // Filter out null/undefined items and ensure they have valid id
        const validItems = (arr || []).filter((item) => item &&
            typeof item === "object" &&
            item.id !== null &&
            item.id !== undefined);
        return validItems.reduce((acc, item) => {
            return {
                ...acc,
                [item.id]: item,
            };
        }, {});
    }
    // Convert indexed object back to array
    // { "1": { id: '1', name: 'Dog'}, "2": { id: '2', name: 'Cat'} }
    // becomes [{ id: '1', name: 'Dog'}, { id: '2', name: 'Cat'}]
    getArrayFromIndexedObject(indexedObj) {
        if (!indexedObj || typeof indexedObj !== "object") {
            return [];
        }
        // Remove GunDB metadata and convert to array
        const cleanObj = { ...indexedObj };
        delete cleanObj._; // Remove GunDB metadata
        // Filter out null/undefined values and ensure they are valid objects
        return Object.values(cleanObj).filter((item) => item && typeof item === "object");
    }
    // Public method to convert array to indexed object
    arrayToIndexedObject(arr) {
        return this.getIndexedObjectFromArray(arr);
    }
    // Public method to convert indexed object to array
    indexedObjectToArray(indexedObj) {
        return this.getArrayFromIndexedObject(indexedObj);
    }
    /**
     * Path utilities
     */
    // Public method to get deconstructed path node for user space
    // Useful for advanced operations that need direct GunDB node access
    getUserNode(path) {
        if (!this.isLoggedIn()) {
            throw new Error("User not logged in");
        }
        // Use the database's path deconstruction
        return this.db.getUser().get(path);
    }
    // Public method to get deconstructed path node for global space
    // Useful for advanced operations that need direct GunDB node access
    getGlobalNode(path) {
        // Use the database's path deconstruction
        return this.db.get(path);
    }
    /**
     * Quick utility methods
     */
    // Get current user info
    getCurrentUser() {
        const user = this.db.getCurrentUser();
        if (user) {
            return {
                pub: user.pub,
                username: user.alias,
            };
        }
        return null;
    }
    // Check if user exists by alias
    async userExists(alias) {
        try {
            const user = await this.db.getUserByAlias(alias);
            return user !== null;
        }
        catch (error) {
            console.warn(`Failed to check if user exists: ${alias}`, error);
            return false;
        }
    }
    // Get user by alias
    async getUser(alias) {
        try {
            const user = await this.db.getUserByAlias(alias);
            if (user) {
                return {
                    userPub: user.userPub,
                    username: user.username,
                };
            }
            return null;
        }
        catch (error) {
            console.warn(`Failed to get user: ${alias}`, error);
            return null;
        }
    }
    /**
     * Advanced user space operations
     */
    // Get all user data (returns user's entire data tree)
    async getAllUserData() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            const user = this.db.getUser();
            if (user && user.is) {
                const userData = await new Promise((resolve, reject) => {
                    user.once((data) => {
                        resolve(data);
                    });
                });
                return userData;
            }
            return null;
        }
        catch (error) {
            console.warn("Failed to get all user data:", error);
            return null;
        }
    }
    // Update user profile (common use case) - using direct user node
    async updateProfile(profileData) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get("profile").put(profileData).then();
            return true;
        }
        catch (error) {
            console.warn("Failed to update profile:", error);
            return false;
        }
    }
    // Get user profile - using direct user node
    async getProfile() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return null;
            }
            const profileData = await this.db.user.get("profile").once().then();
            return profileData;
        }
        catch (error) {
            console.warn("Failed to get profile:", error);
            return null;
        }
    }
    // Save user settings - using direct user node
    async saveSettings(settings) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get("settings").put(settings).then();
            return true;
        }
        catch (error) {
            console.warn("Failed to save settings:", error);
            return false;
        }
    }
    // Get user settings - using direct user node
    async getSettings() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return null;
            }
            const settingsData = await this.db.user.get("settings").once().then();
            return settingsData;
        }
        catch (error) {
            console.warn("Failed to get settings:", error);
            return null;
        }
    }
    // Save user preferences - using direct user node
    async savePreferences(preferences) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get("preferences").put(preferences).then();
            return true;
        }
        catch (error) {
            console.warn("Failed to save preferences:", error);
            return false;
        }
    }
    // Get user preferences - using direct user node
    async getPreferences() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return null;
            }
            const preferencesData = await this.db.user
                .get("preferences")
                .once()
                .then();
            return preferencesData;
        }
        catch (error) {
            console.warn("Failed to get preferences:", error);
            return null;
        }
    }
    // Create a user collection - using direct user node
    async createCollection(collectionName, items) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user.get(`collections/${collectionName}`).put(items).then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to create collection ${collectionName}:`, error);
            return false;
        }
    }
    // Add item to collection - using direct user node
    async addToCollection(collectionName, itemId, item) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user
                .get(`collections/${collectionName}/${itemId}`)
                .put(item)
                .then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to add item to collection ${collectionName}:`, error);
            return false;
        }
    }
    // Get collection - using direct user node
    async getCollection(collectionName) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return null;
            }
            const collectionData = await this.db.user
                .get(`collections/${collectionName}`)
                .once()
                .then();
            return collectionData;
        }
        catch (error) {
            console.warn(`Failed to get collection ${collectionName}:`, error);
            return null;
        }
    }
    // Remove item from collection - using direct user node
    async removeFromCollection(collectionName, itemId) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            if (!this.db.user) {
                console.warn("User node not available");
                return false;
            }
            await this.db.user
                .get(`collections/${collectionName}/${itemId}`)
                .put(null)
                .then();
            return true;
        }
        catch (error) {
            console.warn(`Failed to remove item from collection ${collectionName}:`, error);
            return false;
        }
    }
}
exports.SimpleGunAPI = SimpleGunAPI;
/**
 * Factory function to create a simple API instance
 */
function createSimpleAPI(db) {
    return new SimpleGunAPI(db);
}
/**
 * Quick start helper - creates a simple API with minimal configuration
 */
class QuickStart {
    constructor(gunInstance, appScope = "shogun") {
        this.db = new db_1.DataBase(gunInstance, appScope);
        this.simpleAPI = new SimpleGunAPI(this.db);
    }
    // Initialize the database
    async init() {
        await this.db.initialize();
    }
    // Get the simple API
    get api() {
        return this.simpleAPI;
    }
    // Get the full database instance for advanced usage
    get database() {
        return this.db;
    }
}
exports.QuickStart = QuickStart;
/**
 * Auto Quick Start helper - creates a simple API with automatic Gun instance creation
 * No need to pass a Gun instance, it creates one automatically
 */
class AutoQuickStart {
    constructor(config) {
        const gunConfig = {
            peers: config?.peers || [],
            ...config,
        };
        // Remove appScope from gunConfig as it's not a Gun configuration option
        delete gunConfig.appScope;
        this.gunInstance = (0, db_1.createGun)(gunConfig);
        const appScope = config?.appScope || "shogun";
        this.db = new db_1.DataBase(this.gunInstance, appScope);
        this.simpleAPI = new SimpleGunAPI(this.db);
    }
    // Initialize the database
    async init() {
        await this.db.initialize();
    }
    // Get the simple API
    get api() {
        return this.simpleAPI;
    }
    // Get the full database instance for advanced usage
    get database() {
        return this.db;
    }
    // Get the Gun instance for advanced usage
    get gun() {
        return this.gunInstance;
    }
}
exports.AutoQuickStart = AutoQuickStart;
/**
 * Global helper for quick setup
 */
function quickStart(gunInstance, appScope) {
    return new QuickStart(gunInstance, appScope);
}
/**
 * Global helper for auto quick setup - creates Gun instance automatically
 */
function autoQuickStart(config) {
    return new AutoQuickStart(config);
}
