/**
 * Simplified API layer to reduce complexity for common use cases
 * Provides quick-start methods that wrap the full DataBase functionality
 */
import { DataBase } from "./db";
/**
 * Simple API wrapper that provides common operations with minimal complexity
 */
export class SimpleGunAPI {
    db;
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
    // Simple user data get
    async getUserData(path) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            return (await this.db.getUserData(path));
        }
        catch (error) {
            console.warn(`Failed to get user data from ${path}:`, error);
            return null;
        }
    }
    // Simple user data put
    async putUserData(path, data) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            await this.db.putUserData(path, data);
            return true;
        }
        catch (error) {
            console.warn(`Failed to put user data to ${path}:`, error);
            return false;
        }
    }
    // Simple user data set (alternative to put)
    async setUserData(path, data) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            // Use the user's gun instance directly for set operations
            const user = this.db.getUser();
            if (user && user.is) {
                await new Promise((resolve, reject) => {
                    user.get(path).set(data, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                return true;
            }
            return false;
        }
        catch (error) {
            console.warn(`Failed to set user data to ${path}:`, error);
            return false;
        }
    }
    // Simple user data remove
    async removeUserData(path) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            const user = this.db.getUser();
            if (user && user.is) {
                await new Promise((resolve, reject) => {
                    user.get(path).put(null, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                return true;
            }
            return false;
        }
        catch (error) {
            console.warn(`Failed to remove user data from ${path}:`, error);
            return false;
        }
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
                username: user.username,
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
    // Update user profile (common use case)
    async updateProfile(profileData) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.putUserData("profile", profileData);
        }
        catch (error) {
            console.warn("Failed to update profile:", error);
            return false;
        }
    }
    // Get user profile
    async getProfile() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            return await this.getUserData("profile");
        }
        catch (error) {
            console.warn("Failed to get profile:", error);
            return null;
        }
    }
    // Save user settings
    async saveSettings(settings) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.putUserData("settings", settings);
        }
        catch (error) {
            console.warn("Failed to save settings:", error);
            return false;
        }
    }
    // Get user settings
    async getSettings() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            return await this.getUserData("settings");
        }
        catch (error) {
            console.warn("Failed to get settings:", error);
            return null;
        }
    }
    // Save user preferences
    async savePreferences(preferences) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.putUserData("preferences", preferences);
        }
        catch (error) {
            console.warn("Failed to save preferences:", error);
            return false;
        }
    }
    // Get user preferences
    async getPreferences() {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            return await this.getUserData("preferences");
        }
        catch (error) {
            console.warn("Failed to get preferences:", error);
            return null;
        }
    }
    // Create a user collection (for storing multiple items)
    async createCollection(collectionName, items) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.putUserData(`collections/${collectionName}`, items);
        }
        catch (error) {
            console.warn(`Failed to create collection ${collectionName}:`, error);
            return false;
        }
    }
    // Add item to collection
    async addToCollection(collectionName, itemId, item) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.putUserData(`collections/${collectionName}/${itemId}`, item);
        }
        catch (error) {
            console.warn(`Failed to add item to collection ${collectionName}:`, error);
            return false;
        }
    }
    // Get collection
    async getCollection(collectionName) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return null;
            }
            return await this.getUserData(`collections/${collectionName}`);
        }
        catch (error) {
            console.warn(`Failed to get collection ${collectionName}:`, error);
            return null;
        }
    }
    // Remove item from collection
    async removeFromCollection(collectionName, itemId) {
        try {
            if (!this.isLoggedIn()) {
                console.warn("User not logged in");
                return false;
            }
            return await this.removeUserData(`collections/${collectionName}/${itemId}`);
        }
        catch (error) {
            console.warn(`Failed to remove item from collection ${collectionName}:`, error);
            return false;
        }
    }
}
/**
 * Factory function to create a simple API instance
 */
export function createSimpleAPI(db) {
    return new SimpleGunAPI(db);
}
/**
 * Quick start helper - creates a simple API with minimal configuration
 */
export class QuickStart {
    db;
    simpleAPI;
    constructor(gunInstance, appScope = "shogun") {
        this.db = new DataBase(gunInstance, appScope);
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
/**
 * Global helper for quick setup
 */
export function quickStart(gunInstance, appScope) {
    return new QuickStart(gunInstance, appScope);
}
