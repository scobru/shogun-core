/**
 * Simplified API layer to reduce complexity for common use cases.
 * Provides quick-start methods that wrap the full DataBase functionality.
 */

import { GunMessageGet, GunMessagePut } from "gun";
import { DataBase, createGun } from "./db";

/**
 * Simple API wrapper that provides common operations with minimal complexity.
 */
export class SimpleGunAPI {
  private db: DataBase;

  /**
   * Create a new SimpleGunAPI instance.
   * @param db The DataBase instance to use.
   */
  constructor(db: DataBase) {
    this.db = db;
  }

  // =========================
  // Quick data operations
  // =========================

  /**
   * Get data at a given path.
   * @param path The path to retrieve data from.
   * @returns The data at the path, or null if not found or on error.
   */
  async get<T = unknown>(path: string): Promise<T | null> {
    try {
      const result = await this.db.getData(path);
      return result as T;
    } catch (error) {
      console.warn(`Failed to get data from ${path}:`, error);
      return null;
    }
  }

  /**
   * Get the Gun node at a given path for chaining operations.
   * @param path The path to the node.
   * @returns The Gun node.
   */
  getNode(path: string): any {
    return this.db.get(path);
  }

  /**
   * Get the Gun node at a given path for direct chaining.
   * @param path The path to the node.
   * @returns The Gun node.
   */
  node(path: string): any {
    return this.db.get(path);
  }

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
  } {
    const node = this.db.get(path);

    return {
      get: (subPath: string) => this.chain(`${path}/${subPath}`),
      put: async (data: any) => {
        try {
          const result = await this.db.put(path, data);
          return result;
        } catch (error) {
          console.warn(`Failed to put data to ${path}:`, error);
          return { err: String(error) };
        }
      },
      set: async (data: any) => {
        try {
          const result = await this.db.set(path, data);
          return result;
        } catch (error) {
          console.warn(`Failed to set data to ${path}:`, error);
          return { err: String(error) };
        }
      },
      once: async () => {
        try {
          return await this.db.getData(path);
        } catch (error) {
          console.warn(`Failed to get data from ${path}:`, error);
          return null;
        }
      },
      then: async () => {
        try {
          return await this.db.getData(path);
        } catch (error) {
          console.warn(`Failed to get data from ${path}:`, error);
          return null;
        }
      },
      map: (callback: (value: any, key: string) => any) => {
        return node.map ? node.map(callback) : null;
      },
    };
  }

  /**
   * Put data at a given path.
   * @param path The path to put data to.
   * @param data The data to put.
   * @returns The GunMessagePut result.
   */
  async put<T = unknown>(path: string, data: T): Promise<GunMessagePut> {
    try {
      const result = await this.db.put(path, data);
      return result;
    } catch (error) {
      console.warn(`Failed to put data to ${path}:`, error);
      return { err: String(error) };
    }
  }

  /**
   * Set data at a given path (alternative to put).
   * @param path The path to set data to.
   * @param data The data to set.
   * @returns The GunMessagePut result.
   */
  async set<T = unknown>(path: string, data: T): Promise<GunMessagePut> {
    try {
      const result = await this.db.set(path, data);
      return result;
    } catch (error) {
      console.warn(`Failed to set data to ${path}:`, error);
      return { err: String(error) };
    }
  }

  /**
   * Remove data at a given path.
   * @param path The path to remove data from.
   * @returns The GunMessagePut result.
   */
  async remove(path: string): Promise<GunMessagePut> {
    try {
      const result = await this.db.remove(path);
      return result;
    } catch (error) {
      console.warn(`Failed to remove data from ${path}:`, error);
      return { err: String(error) };
    }
  }

  // =========================
  // Quick authentication
  // =========================

  /**
   * Log in a user.
   * @param username The username.
   * @param password The password.
   * @returns The user info if successful, or null.
   */
  async login(
    username: string,
    password: string,
  ): Promise<{ userPub: string; username: string } | null> {
    try {
      const result = await this.db.login(username, password);
      if (result.success && result.userPub) {
        return {
          userPub: result.userPub,
          username: result.username || username,
        };
      }
      return null;
    } catch (error) {
      console.warn(`Login failed for ${username}:`, error);
      return null;
    }
  }

  /**
   * Sign up a new user.
   * @param username The username.
   * @param password The password.
   * @returns The user info if successful, or null.
   */
  async signup(
    username: string,
    password: string,
  ): Promise<{ userPub: string; username: string } | null> {
    try {
      const result = await this.db.signUp(username, password);
      if (result.success && result.userPub) {
        return {
          userPub: result.userPub,
          username: result.username || username,
        };
      }
      return null;
    } catch (error) {
      console.warn(`Signup failed for ${username}:`, error);
      return null;
    }
  }

  /**
   * Log out the current user.
   */
  logout(): void {
    this.db.logout();
  }

  /**
   * Check if a user is currently logged in.
   * @returns True if logged in, false otherwise.
   */
  isLoggedIn(): boolean {
    return this.db.isLoggedIn();
  }

  // =========================
  // Quick user data operations
  // =========================

  /**
   * Get user data at a given path (requires login).
   * @param path The path to the user data.
   * @returns The user data, or null if not found or on error.
   */
  async getUserData<T = unknown>(path: string): Promise<T | null> {
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
      return data as T;
    } catch (error) {
      console.warn(`Failed to get user data from ${path}:`, error);
      return null;
    }
  }

  /**
   * Put user data at a given path (requires login).
   * @param path The path to put data to.
   * @param data The data to put.
   * @returns True if successful, false otherwise.
   */
  async putUserData<T = unknown>(path: string, data: T): Promise<boolean> {
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
    } catch (error) {
      console.warn(`Failed to put user data to ${path}:`, error);
      return false;
    }
  }

  /**
   * Set user data at a given path (alternative to put, requires login).
   * @param path The path to set data to.
   * @param data The data to set.
   * @returns True if successful, false otherwise.
   */
  async setUserData<T = unknown>(path: string, data: T): Promise<boolean> {
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
    } catch (error) {
      console.warn(`Failed to set user data to ${path}:`, error);
      return false;
    }
  }

  /**
   * Remove user data at a given path (requires login).
   * @param path The path to remove data from.
   * @returns True if successful, false otherwise.
   */
  async removeUserData(path: string): Promise<boolean> {
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
    } catch (error) {
      console.warn(`Failed to remove user data from ${path}:`, error);
      return false;
    }
  }

  // =========================
  // Array utilities for GunDB
  // =========================

  /**
   * Convert an array to an indexed object for GunDB storage.
   * Example: [{id: '1', ...}, {id: '2', ...}] => { "1": {...}, "2": {...} }
   * @param arr The array to convert.
   * @returns The indexed object.
   * @private
   */
  private getIndexedObjectFromArray<T extends { id: string | number }>(
    arr: T[],
  ): Record<string, T> {
    // Filter out null/undefined items and ensure they have valid id
    const validItems = (arr || []).filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.id !== null &&
        item.id !== undefined,
    );

    return validItems.reduce(
      (acc, item) => {
        return {
          ...acc,
          [item.id]: item,
        };
      },
      {} as Record<string, T>,
    );
  }

  /**
   * Convert an indexed object back to an array.
   * Example: { "1": {...}, "2": {...} } => [{id: '1', ...}, {id: '2', ...}]
   * @param indexedObj The indexed object to convert.
   * @returns The array.
   * @private
   */
  private getArrayFromIndexedObject<T>(
    indexedObj: Record<string, T> | null,
  ): T[] {
    if (!indexedObj || typeof indexedObj !== "object") {
      return [];
    }

    // Remove GunDB metadata and convert to array
    const cleanObj = { ...indexedObj };
    delete (cleanObj as any)._; // Remove GunDB metadata

    // Filter out null/undefined values and ensure they are valid objects
    return Object.values(cleanObj).filter(
      (item) => item && typeof item === "object",
    );
  }

  /**
   * Convert an array to an indexed object for GunDB storage (public method).
   * @param arr The array to convert.
   * @returns The indexed object.
   */
  arrayToIndexedObject<T extends { id: string | number }>(
    arr: T[],
  ): Record<string, T> {
    return this.getIndexedObjectFromArray(arr);
  }

  /**
   * Convert an indexed object to an array (public method).
   * @param indexedObj The indexed object to convert.
   * @returns The array.
   */
  indexedObjectToArray<T>(indexedObj: Record<string, T> | null): T[] {
    return this.getArrayFromIndexedObject(indexedObj);
  }

  // =========================
  // Path utilities
  // =========================

  /**
   * Get the GunDB user node at a given path (requires login).
   * Useful for advanced operations that need direct GunDB node access.
   * @param path The path to the user node.
   * @returns The Gun node.
   * @throws If not logged in.
   */
  getUserNode(path: string): any {
    if (!this.isLoggedIn()) {
      throw new Error("User not logged in");
    }
    // Use the database's path deconstruction
    return this.db.getUser().get(path);
  }

  /**
   * Get the GunDB global node at a given path.
   * Useful for advanced operations that need direct GunDB node access.
   * @param path The path to the global node.
   * @returns The Gun node.
   */
  getGlobalNode(path: string): any {
    // Use the database's path deconstruction
    return this.db.get(path);
  }

  // =========================
  // Quick utility methods
  // =========================

  /**
   * Get the current user info.
   * @returns The current user info, or null if not logged in.
   */
  getCurrentUser(): { pub: string; username?: string } | null {
    const user = this.db.getCurrentUser();
    if (user) {
      return {
        pub: user.pub,
        username: user.alias,
      };
    }
    return null;
  }

  /**
   * Check if a user exists by alias.
   * @param alias The user alias.
   * @returns True if the user exists, false otherwise.
   */
  async userExists(alias: string): Promise<boolean> {
    try {
      const user = await this.db.getUserByAlias(alias);
      return user !== null;
    } catch (error) {
      console.warn(`Failed to check if user exists: ${alias}`, error);
      return false;
    }
  }

  /**
   * Get user info by alias.
   * @param alias The user alias.
   * @returns The user info, or null if not found.
   */
  async getUser(
    alias: string,
  ): Promise<{ userPub: string; username: string } | null> {
    try {
      const user = await this.db.getUserByAlias(alias);
      if (user) {
        return {
          userPub: user.userPub,
          username: user.username,
        };
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get user: ${alias}`, error);
      return null;
    }
  }

  /**
   * Advanced user space operations
   */

  // Get all user data (returns user's entire data tree)
  async getAllUserData(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.isLoggedIn()) {
        console.warn("User not logged in");
        return null;
      }
      const user = this.db.getUser();

      const pubkey = user.is?.pub;

      const node = this.db.get(`${pubkey}`);
      if (node) {
        const userData = await new Promise<any>((resolve, reject) => {
          node.once((data: any) => {
            resolve(data);
          });
        });
        return userData;
      }
      return null;
    } catch (error) {
      console.warn("Failed to get all user data:", error);
      return null;
    }
  }

  // Update user profile (common use case) - using direct user node
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    [key: string]: unknown;
  }): Promise<boolean> {
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
    } catch (error) {
      console.warn("Failed to update profile:", error);
      return false;
    }
  }

  // Get user profile - using direct user node
  async getProfile(): Promise<Record<string, unknown> | null> {
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
    } catch (error) {
      console.warn("Failed to get profile:", error);
      return null;
    }
  }

  // Save user settings - using direct user node
  async saveSettings(settings: Record<string, unknown>): Promise<boolean> {
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
    } catch (error) {
      console.warn("Failed to save settings:", error);
      return false;
    }
  }

  // Get user settings - using direct user node
  async getSettings(): Promise<Record<string, unknown> | null> {
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
    } catch (error) {
      console.warn("Failed to get settings:", error);
      return null;
    }
  }

  // Save user preferences - using direct user node
  async savePreferences(
    preferences: Record<string, unknown>,
  ): Promise<boolean> {
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
    } catch (error) {
      console.warn("Failed to save preferences:", error);
      return false;
    }
  }

  // Get user preferences - using direct user node
  async getPreferences(): Promise<Record<string, unknown> | null> {
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
    } catch (error) {
      console.warn("Failed to get preferences:", error);
      return null;
    }
  }

  // Create a user collection - using direct user node
  async createCollection<T = unknown>(
    collectionName: string,
    items: Record<string, T>,
  ): Promise<boolean> {
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
    } catch (error) {
      console.warn(`Failed to create collection ${collectionName}:`, error);
      return false;
    }
  }

  // Add item to collection - using direct user node
  async addToCollection<T = unknown>(
    collectionName: string,
    itemId: string,
    item: T,
  ): Promise<boolean> {
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
    } catch (error) {
      console.warn(
        `Failed to add item to collection ${collectionName}:`,
        error,
      );
      return false;
    }
  }

  // Get collection - using direct user node
  async getCollection(
    collectionName: string,
  ): Promise<Record<string, unknown> | null> {
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
    } catch (error) {
      console.warn(`Failed to get collection ${collectionName}:`, error);
      return null;
    }
  }

  // Remove item from collection - using direct user node
  async removeFromCollection(
    collectionName: string,
    itemId: string,
  ): Promise<boolean> {
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
    } catch (error) {
      console.warn(
        `Failed to remove item from collection ${collectionName}:`,
        error,
      );
      return false;
    }
  }
}

/**
 * Factory function to create a simple API instance
 */
export function createSimpleAPI(db: DataBase): SimpleGunAPI {
  return new SimpleGunAPI(db);
}

/**
 * Quick start helper - creates a simple API with minimal configuration
 */
export class QuickStart {
  private db: DataBase;
  private simpleAPI: SimpleGunAPI;

  constructor(gunInstance: any, appScope: string = "shogun") {
    this.db = new DataBase(gunInstance, appScope);
    this.simpleAPI = new SimpleGunAPI(this.db);
  }

  // Initialize the database
  async init(): Promise<void> {
    await this.db.initialize();
  }

  // Get the simple API
  get api(): SimpleGunAPI {
    return this.simpleAPI;
  }

  // Get the full database instance for advanced usage
  get database(): DataBase {
    return this.db;
  }
}

/**
 * Auto Quick Start helper - creates a simple API with automatic Gun instance creation
 * No need to pass a Gun instance, it creates one automatically
 */
export class AutoQuickStart {
  private db: DataBase;
  private simpleAPI: SimpleGunAPI;
  private gunInstance: any;

  constructor(config?: {
    peers?: string[];
    appScope?: string;
    [key: string]: any;
  }) {
    const gunConfig = {
      peers: config?.peers || [],
      ...config,
    };

    // Remove appScope from gunConfig as it's not a Gun configuration option
    delete gunConfig.appScope;

    this.gunInstance = createGun(gunConfig);
    const appScope = config?.appScope || "shogun";

    this.db = new DataBase(this.gunInstance, appScope);
    this.simpleAPI = new SimpleGunAPI(this.db);
  }

  // Initialize the database
  async init(): Promise<void> {
    await this.db.initialize();
  }

  // Get the simple API
  get api(): SimpleGunAPI {
    return this.simpleAPI;
  }

  // Get the full database instance for advanced usage
  get database(): DataBase {
    return this.db;
  }

  // Get the Gun instance for advanced usage
  get gun(): any {
    return this.gunInstance;
  }
}

/**
 * Global helper for quick setup
 */
export function quickStart(gunInstance: any, appScope?: string): QuickStart {
  return new QuickStart(gunInstance, appScope);
}

/**
 * Global helper for auto quick setup - creates Gun instance automatically
 */
export function autoQuickStart(config?: {
  peers?: string[];
  appScope?: string;
  [key: string]: any;
}): AutoQuickStart {
  return new AutoQuickStart(config);
}
