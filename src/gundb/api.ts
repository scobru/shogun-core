/**
 * Simplified API layer focused on valuable helper methods.
 * Provides quick-start initialization and high-level convenience methods.
 *
 * For basic operations (get, put, set, remove, auth), use DataBase directly.
 * This class provides:
 * - Quick initialization helpers (QuickStart, AutoQuickStart)
 * - Array/Object conversion utilities for GunDB
 * - High-level user data helpers (profile, settings, collections)
 */

import { DataBase } from "./db";
import { IGunInstance } from "gun/types";

/**
 * Simple API wrapper that provides high-level helper methods.
 * For basic operations, use the DataBase instance directly via the `database` property.
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

  /**
   * Get direct access to the DataBase instance for full control.
   * Use this for basic operations like get, put, set, remove, login, etc.
   */
  get database(): DataBase {
    return this.db;
  }

  // =========================
  // Array utilities for GunDB
  // =========================

  /**
   * Convert an array to an indexed object for GunDB storage.
   * GunDB doesn't store arrays natively, so this converts them to objects indexed by ID.
   * Example: [{id: '1', ...}, {id: '2', ...}] => { "1": {...}, "2": {...} }
   * @param arr The array to convert (each item must have an 'id' property).
   * @returns The indexed object suitable for GunDB storage.
   */
  arrayToIndexedObject<T extends { id: string | number }>(
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
   * Reverses the arrayToIndexedObject conversion.
   * Example: { "1": {...}, "2": {...} } => [{id: '1', ...}, {id: '2', ...}]
   * @param indexedObj The indexed object to convert.
   * @returns The array of items.
   */
  indexedObjectToArray<T>(indexedObj: Record<string, T> | null): T[] {
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
   * @deprecated This method is unreliable with GunDB. Use direct GunDB operations instead.
   * Store an array at a global path by converting it to an indexed object.
   * @param path The global path to store the array at
   * @param arr The array to store (each item must have an 'id' property)
   * @returns True if successful, false otherwise
   */
  async putArray<T extends { id: string | number }>(
    path: string,
    arr: T[],
  ): Promise<boolean> {
    console.warn(
      "DEPRECATED: putArray() is unreliable with GunDB. Use direct GunDB operations instead.",
    );
    try {
      const indexed = this.arrayToIndexedObject(arr);
      const node = this.db.getNode(path);
      node.put(indexed);
      return true;
    } catch (error) {
      console.warn("Failed to put array:", error);
      return false;
    }
  }

  /**
   * @deprecated This method is unreliable with GunDB. Use direct GunDB operations instead.
   * Retrieve an array from a global path by converting from indexed object.
   * @param path The global path to retrieve the array from
   * @returns The array of items, or empty array on error
   */
  async getArray<T>(path: string): Promise<T[]> {
    console.warn(
      "DEPRECATED: getArray() is unreliable with GunDB. Use direct GunDB operations instead.",
    );
    try {
      const node = this.db.getNode(path);
      const indexedObj = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 2000);
        node.once((data: any) => {
          clearTimeout(timeout);
          resolve(data);
        });
      });
      return this.indexedObjectToArray<T>(indexedObj as Record<string, T> | null);
    } catch (error) {
      console.warn("Failed to get array:", error);
      return [];
    }
  }

  // =========================
  // High-level user data helpers
  // =========================

  /**
   * Get all user data (returns user's entire data tree).
   * Requires user to be logged in.
   * @returns The complete user data tree, or null if not logged in or on error.
   */
  async getAllUserData(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.db.isLoggedIn()) {
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

  /**
   * Update user profile with common fields.
   * Provides a standardized location for user profile data.
   * @param profileData Profile data to save (name, email, bio, avatar, etc.)
   * @returns True if successful, false otherwise.
   */
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    [key: string]: unknown;
  }): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user.get("profile").put(profileData).then();
      return true;
    } catch (error) {
      console.warn("Failed to update profile:", error);
      return false;
    }
  }

  /**
   * Get user profile data.
   * @returns The user profile data, or null if not found or not logged in.
   */
  async getProfile(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return null;
      }

      const user = this.db.getUser();
      const profileData = await user.get("profile").once().then();
      return profileData;
    } catch (error) {
      console.warn("Failed to get profile:", error);
      return null;
    }
  }

  /**
   * Save user settings.
   * Provides a standardized location for application settings.
   * @param settings Settings object to save.
   * @returns True if successful, false otherwise.
   */
  async saveSettings(settings: Record<string, unknown>): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user.get("settings").put(settings).then();
      return true;
    } catch (error) {
      console.warn("Failed to save settings:", error);
      return false;
    }
  }

  /**
   * Get user settings.
   * @returns The user settings, or null if not found or not logged in.
   */
  async getSettings(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return null;
      }

      const user = this.db.getUser();
      const settingsData = await user.get("settings").once().then();
      return settingsData;
    } catch (error) {
      console.warn("Failed to get settings:", error);
      return null;
    }
  }

  /**
   * Save user preferences.
   * Provides a standardized location for user preferences (distinct from settings).
   * @param preferences Preferences object to save.
   * @returns True if successful, false otherwise.
   */
  async savePreferences(
    preferences: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user.get("preferences").put(preferences).then();
      return true;
    } catch (error) {
      console.warn("Failed to save preferences:", error);
      return false;
    }
  }

  /**
   * Get user preferences.
   * @returns The user preferences, or null if not found or not logged in.
   */
  async getPreferences(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return null;
      }

      const user = this.db.getUser();
      const preferencesData = await user.get("preferences").once().then();
      return preferencesData;
    } catch (error) {
      console.warn("Failed to get preferences:", error);
      return null;
    }
  }

  /**
   * Create a user collection with initial items.
   * Provides a standardized location for user collections.
   * @param collectionName The name of the collection.
   * @param items The initial items for the collection.
   * @returns True if successful, false otherwise.
   */
  async createCollection<T = unknown>(
    collectionName: string,
    items: Record<string, T>,
  ): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user.get(`collections/${collectionName}`).put(items).then();
      return true;
    } catch (error) {
      console.warn(`Failed to create collection ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Add an item to a user collection.
   * @param collectionName The name of the collection.
   * @param itemId The ID of the item to add.
   * @param item The item data.
   * @returns True if successful, false otherwise.
   */
  async addToCollection<T = unknown>(
    collectionName: string,
    itemId: string,
    item: T,
  ): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user
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

  /**
   * Get a user collection.
   * @param collectionName The name of the collection.
   * @returns The collection data, or null if not found or not logged in.
   */
  async getCollection(
    collectionName: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return null;
      }

      const user = this.db.getUser();
      const collectionData = await user
        .get(`collections/${collectionName}`)
        .once()
        .then();
      return collectionData;
    } catch (error) {
      console.warn(`Failed to get collection ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from a user collection.
   * @param collectionName The name of the collection.
   * @param itemId The ID of the item to remove.
   * @returns True if successful, false otherwise.
   */
  async removeFromCollection(
    collectionName: string,
    itemId: string,
  ): Promise<boolean> {
    try {
      if (!this.db.isLoggedIn()) {
        console.warn("User not logged in");
        return false;
      }

      const user = this.db.getUser();
      await user
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
 * Auto Quick Start helper - creates a simple API with an existing Gun instance
 * Requires a Gun instance to be passed in
 */
export class AutoQuickStart {
  private db: DataBase;
  private simpleAPI: SimpleGunAPI;
  private gunInstance: IGunInstance;

  constructor(gunInstance: IGunInstance, appScope: string = "shogun") {
    this.gunInstance = gunInstance;
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
 * Global helper for auto quick setup - requires existing Gun instance
 */
export function autoQuickStart(
  gunInstance: IGunInstance,
  appScope: string = "shogun",
): AutoQuickStart {
  return new AutoQuickStart(gunInstance, appScope);
}
