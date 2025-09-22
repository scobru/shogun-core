/**
 * Simplified API layer to reduce complexity for common use cases
 * Provides quick-start methods that wrap the full DataBase functionality
 */
import { DataBase } from "./db";
/**
 * Simple API wrapper that provides common operations with minimal complexity
 */
export declare class SimpleGunAPI {
    private db;
    constructor(db: DataBase);
    /**
     * Quick data operations - simplified interface
     */
    get<T = unknown>(path: string): Promise<T | null>;
    getNode(path: string): any;
    node(path: string): any;
    chain(path: string): {
        get: (subPath: string) => any;
        put: (data: any) => Promise<boolean>;
        set: (data: any) => Promise<boolean>;
        once: () => Promise<any>;
        then: () => Promise<any>;
        map: (callback: (value: any, key: string) => any) => any;
    };
    put<T = unknown>(path: string, data: T): Promise<boolean>;
    set<T = unknown>(path: string, data: T): Promise<boolean>;
    remove(path: string): Promise<boolean>;
    /**
     * Quick authentication - simplified interface
     */
    login(username: string, password: string): Promise<{
        userPub: string;
        username: string;
    } | null>;
    signup(username: string, password: string): Promise<{
        userPub: string;
        username: string;
    } | null>;
    logout(): void;
    isLoggedIn(): boolean;
    /**
     * Quick user data operations - simplified interface
     */
    getUserData<T = unknown>(path: string): Promise<T | null>;
    putUserData<T = unknown>(path: string, data: T): Promise<boolean>;
    setUserData<T = unknown>(path: string, data: T): Promise<boolean>;
    removeUserData(path: string): Promise<boolean>;
    /**
     * Array utilities for GunDB
     * GunDB doesn't handle arrays well, so we convert them to indexed objects
     */
    private getIndexedObjectFromArray;
    private getArrayFromIndexedObject;
    arrayToIndexedObject<T extends {
        id: string | number;
    }>(arr: T[]): Record<string, T>;
    indexedObjectToArray<T>(indexedObj: Record<string, T> | null): T[];
    putUserArray<T extends {
        id: string | number;
    }>(path: string, arr: T[]): Promise<boolean>;
    getUserArray<T>(path: string): Promise<T[]>;
    addToUserArray<T extends {
        id: string | number;
    }>(path: string, item: T): Promise<boolean>;
    removeFromUserArray<T extends {
        id: string | number;
    }>(path: string, itemId: string | number): Promise<boolean>;
    updateInUserArray<T extends {
        id: string | number;
    }>(path: string, itemId: string | number, updates: Partial<T>): Promise<boolean>;
    putArray<T extends {
        id: string | number;
    }>(path: string, arr: T[]): Promise<boolean>;
    getArray<T>(path: string): Promise<T[]>;
    addToArray<T extends {
        id: string | number;
    }>(path: string, item: T): Promise<boolean>;
    removeFromArray<T extends {
        id: string | number;
    }>(path: string, itemId: string | number): Promise<boolean>;
    updateInArray<T extends {
        id: string | number;
    }>(path: string, itemId: string | number, updates: Partial<T>): Promise<boolean>;
    /**
     * Path utilities
     */
    getUserNode(path: string): any;
    getGlobalNode(path: string): any;
    /**
     * Quick utility methods
     */
    getCurrentUser(): {
        pub: string;
        username?: string;
    } | null;
    userExists(alias: string): Promise<boolean>;
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
