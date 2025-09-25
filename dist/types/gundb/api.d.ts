/**
 * Simplified API layer to reduce complexity for common use cases.
 * Provides quick-start methods that wrap the full DataBase functionality.
 */
import { GunMessageGet, GunMessagePut } from "gun";
import { DataBase } from "./db";
/**
 * Simple API wrapper that provides common operations with minimal complexity.
 */
export declare class SimpleGunAPI {
    private db;
    /**
     * Create a new SimpleGunAPI instance.
     * @param db The DataBase instance to use.
     */
    constructor(db: DataBase);
    /**
     * Get data at a given path.
     * @param path The path to retrieve data from.
     * @returns The data at the path, or null if not found or on error.
     */
    get<T = unknown>(path: string): Promise<T | null>;
    /**
     * Get the Gun node at a given path for chaining operations.
     * @param path The path to the node.
     * @returns The Gun node.
     */
    getNode(path: string): any;
    /**
     * Get the Gun node at a given path for direct chaining.
     * @param path The path to the node.
     * @returns The Gun node.
     */
    node(path: string): any;
    /**
     * Get a chainable wrapper for a Gun node at a given path.
     * @param path The path to the node.
     * @returns An object with chainable methods: get, put, set, once, then, map.
     */
    chain(path: string): {
        get: (subPath: string) => GunMessageGet<any, any>;
        put: (data: any) => Promise<GunMessagePut>;
        set: (data: any) => Promise<GunMessagePut>;
        once: () => Promise<any>;
        then: () => Promise<any>;
        map: (callback: (value: any, key: string) => any) => any;
    };
    /**
     * Put data at a given path.
     * @param path The path to put data to.
     * @param data The data to put.
     * @returns The GunMessagePut result.
     */
    put<T = unknown>(path: string, data: T): Promise<GunMessagePut>;
    /**
     * Set data at a given path (alternative to put).
     * @param path The path to set data to.
     * @param data The data to set.
     * @returns The GunMessagePut result.
     */
    set<T = unknown>(path: string, data: T): Promise<GunMessagePut>;
    /**
     * Remove data at a given path.
     * @param path The path to remove data from.
     * @returns The GunMessagePut result.
     */
    remove(path: string): Promise<GunMessagePut>;
    /**
     * Log in a user.
     * @param username The username.
     * @param password The password.
     * @returns The user info if successful, or null.
     */
    login(username: string, password: string): Promise<{
        userPub: string;
        username: string;
    } | null>;
    /**
     * Sign up a new user.
     * @param username The username.
     * @param password The password.
     * @returns The user info if successful, or null.
     */
    signup(username: string, password: string): Promise<{
        userPub: string;
        username: string;
    } | null>;
    /**
     * Log out the current user.
     */
    logout(): void;
    /**
     * Check if a user is currently logged in.
     * @returns True if logged in, false otherwise.
     */
    isLoggedIn(): boolean;
    /**
     * Get user data at a given path (requires login).
     * @param path The path to the user data.
     * @returns The user data, or null if not found or on error.
     */
    getUserData<T = unknown>(path: string): Promise<T | null>;
    /**
     * Put user data at a given path (requires login).
     * @param path The path to put data to.
     * @param data The data to put.
     * @returns True if successful, false otherwise.
     */
    putUserData<T = unknown>(path: string, data: T): Promise<boolean>;
    /**
     * Set user data at a given path (alternative to put, requires login).
     * @param path The path to set data to.
     * @param data The data to set.
     * @returns True if successful, false otherwise.
     */
    setUserData<T = unknown>(path: string, data: T): Promise<boolean>;
    /**
     * Remove user data at a given path (requires login).
     * @param path The path to remove data from.
     * @returns True if successful, false otherwise.
     */
    removeUserData(path: string): Promise<boolean>;
    /**
     * Convert an array to an indexed object for GunDB storage.
     * Example: [{id: '1', ...}, {id: '2', ...}] => { "1": {...}, "2": {...} }
     * @param arr The array to convert.
     * @returns The indexed object.
     * @private
     */
    private getIndexedObjectFromArray;
    /**
     * Convert an indexed object back to an array.
     * Example: { "1": {...}, "2": {...} } => [{id: '1', ...}, {id: '2', ...}]
     * @param indexedObj The indexed object to convert.
     * @returns The array.
     * @private
     */
    private getArrayFromIndexedObject;
    /**
     * Convert an array to an indexed object for GunDB storage (public method).
     * @param arr The array to convert.
     * @returns The indexed object.
     */
    arrayToIndexedObject<T extends {
        id: string | number;
    }>(arr: T[]): Record<string, T>;
    /**
     * Convert an indexed object to an array (public method).
     * @param indexedObj The indexed object to convert.
     * @returns The array.
     */
    indexedObjectToArray<T>(indexedObj: Record<string, T> | null): T[];
    /**
     * Get the GunDB user node at a given path (requires login).
     * Useful for advanced operations that need direct GunDB node access.
     * @param path The path to the user node.
     * @returns The Gun node.
     * @throws If not logged in.
     */
    getUserNode(path: string): any;
    /**
     * Get the GunDB global node at a given path.
     * Useful for advanced operations that need direct GunDB node access.
     * @param path The path to the global node.
     * @returns The Gun node.
     */
    getGlobalNode(path: string): any;
    /**
     * Get the current user info.
     * @returns The current user info, or null if not logged in.
     */
    getCurrentUser(): {
        pub: string;
        username?: string;
    } | null;
    /**
     * Check if a user exists by alias.
     * @param alias The user alias.
     * @returns True if the user exists, false otherwise.
     */
    userExists(alias: string): Promise<boolean>;
    /**
     * Get user info by alias.
     * @param alias The user alias.
     * @returns The user info, or null if not found.
     */
    getUser(alias: string): Promise<{
        userPub: string;
        username: string;
    } | null>;
    /**
     * Advanced user space operations
     */
    getAllUserData(): Promise<Record<string, unknown> | null>;
    updateProfile(profileData: {
        name?: string;
        email?: string;
        bio?: string;
        avatar?: string;
        [key: string]: unknown;
    }): Promise<boolean>;
    getProfile(): Promise<Record<string, unknown> | null>;
    saveSettings(settings: Record<string, unknown>): Promise<boolean>;
    getSettings(): Promise<Record<string, unknown> | null>;
    savePreferences(preferences: Record<string, unknown>): Promise<boolean>;
    getPreferences(): Promise<Record<string, unknown> | null>;
    createCollection<T = unknown>(collectionName: string, items: Record<string, T>): Promise<boolean>;
    addToCollection<T = unknown>(collectionName: string, itemId: string, item: T): Promise<boolean>;
    getCollection(collectionName: string): Promise<Record<string, unknown> | null>;
    removeFromCollection(collectionName: string, itemId: string): Promise<boolean>;
}
/**
 * Factory function to create a simple API instance
 */
export declare function createSimpleAPI(db: DataBase): SimpleGunAPI;
/**
 * Quick start helper - creates a simple API with minimal configuration
 */
export declare class QuickStart {
    private db;
    private simpleAPI;
    constructor(gunInstance: any, appScope?: string);
    init(): Promise<void>;
    get api(): SimpleGunAPI;
    get database(): DataBase;
}
/**
 * Auto Quick Start helper - creates a simple API with automatic Gun instance creation
 * No need to pass a Gun instance, it creates one automatically
 */
export declare class AutoQuickStart {
    private db;
    private simpleAPI;
    private gunInstance;
    constructor(config?: {
        peers?: string[];
        appScope?: string;
        [key: string]: any;
    });
    init(): Promise<void>;
    get api(): SimpleGunAPI;
    get database(): DataBase;
    get gun(): any;
}
/**
 * Global helper for quick setup
 */
export declare function quickStart(gunInstance: any, appScope?: string): QuickStart;
/**
 * Global helper for auto quick setup - creates Gun instance automatically
 */
export declare function autoQuickStart(config?: {
    peers?: string[];
    appScope?: string;
    [key: string]: any;
}): AutoQuickStart;
