"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunStorage = void 0;
/**
 * Storage implementation based on StorageMock
 * Provides a unified storage interface that works in both browser and non-browser environments
 * In browser environments, data is persisted to localStorage as a backup
 */
class ShogunStorage {
    store;
    isTestMode;
    useLocalStorage;
    /**
     * Initializes storage and loads any existing keypair from localStorage if available
     */
    constructor() {
        this.store = new Map();
        // Controlla se siamo in ambiente di test
        this.isTestMode = process.env.NODE_ENV === "test";
        this.useLocalStorage = false;
        // Check if localStorage is available
        if (typeof localStorage !== "undefined" && !this.isTestMode) {
            try {
                // Test localStorage access
                localStorage.setItem("_shogun_test", "_shogun_test");
                localStorage.removeItem("_shogun_test");
                this.useLocalStorage = true;
                // Load existing keypair if available
                const storedPair = localStorage.getItem("shogun_keypair");
                if (storedPair) {
                    this.store.set("keypair", JSON.parse(storedPair));
                }
            }
            catch (error) {
                this.useLocalStorage = false;
                if (!this.isTestMode) {
                    console.error("localStorage not available:", error);
                }
            }
        }
    }
    /**
     * Gets the stored keypair asynchronously
     * @returns Promise resolving to the keypair or null if not found
     */
    async getPair() {
        return this.getPairSync();
    }
    /**
     * Gets the stored keypair synchronously
     * @returns The keypair or null if not found
     */
    getPairSync() {
        return this.store.get("keypair") || null;
    }
    /**
     * Stores a keypair both in memory and localStorage if available
     * @param pair - The keypair to store
     */
    async setPair(pair) {
        this.store.set("keypair", pair);
        // Also save to localStorage in browser environments
        if (this.useLocalStorage) {
            try {
                localStorage.setItem("shogun_keypair", JSON.stringify(pair));
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error("Error saving data to localStorage:", error);
                }
            }
        }
    }
    /**
     * Clears all stored data from both memory and localStorage
     */
    clearAll() {
        this.store.clear();
        // Also clear localStorage in browser environments
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem("shogun_keypair");
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error("Error removing data from localStorage:", error);
                }
            }
        }
    }
    /**
     * Gets an item from storage
     * @param key - The key to retrieve
     * @returns The stored value as a string, or null if not found
     */
    getItem(key) {
        const value = this.store.get(key);
        return value !== undefined ? JSON.stringify(value) : null;
    }
    /**
     * Stores an item in both memory and localStorage if available
     * @param key - The key to store under
     * @param value - The value to store (must be JSON stringifiable)
     */
    setItem(key, value) {
        try {
            const parsedValue = JSON.parse(value);
            this.store.set(key, parsedValue);
            // Also save to localStorage in browser environments
            if (this.useLocalStorage) {
                try {
                    localStorage.setItem(key, value);
                }
                catch (error) {
                    if (!this.isTestMode) {
                        console.error(`Error saving ${key} to localStorage:`, error);
                    }
                }
            }
        }
        catch (error) {
            // If not valid JSON, store as string
            this.store.set(key, value);
            // Also save to localStorage in browser environments
            if (this.useLocalStorage) {
                try {
                    localStorage.setItem(key, value);
                }
                catch (error) {
                    if (!this.isTestMode) {
                        console.error(`Error saving ${key} to localStorage:`, error);
                    }
                }
            }
        }
    }
    /**
     * Removes an item from both memory and localStorage if available
     * @param key - The key to remove
     */
    removeItem(key) {
        this.store.delete(key);
        // Also remove from localStorage in browser environments
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem(key);
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error(`Error removing ${key} from localStorage:`, error);
                }
            }
        }
    }
}
exports.ShogunStorage = ShogunStorage;
