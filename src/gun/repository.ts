import { GunDB } from "./gun";
import { encrypt, decrypt } from "./encryption";

/**
 * Base interface for repositories
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(data: T): Promise<string>;
  update(id: string, data: Partial<T>): Promise<boolean>;
  remove(id: string): Promise<boolean>;
}

/**
 * Interface for Gun acknowledgment
 */
interface GunAck {
  err?: string;
  [key: string]: any;
}

/**
 * Generic repository for Gun
 * Implements the repository pattern with optional encryption support
 */
export abstract class GunRepository<T> implements Repository<T> {
  protected gun: GunDB;
  protected collection: string;
  protected useEncryption: boolean;
  protected userScope: boolean;
  protected encryptionKey?: any;

  /**
   * Initializes a new repository
   * @param gun - GunDB instance
   * @param collection - Name of the collection
   * @param options - Repository options
   */
  constructor(
    gun: GunDB,
    collection: string,
    options: {
      useEncryption?: boolean;
      userScope?: boolean;
      encryptionKey?: any;
    } = {},
  ) {
    this.gun = gun;
    this.collection = collection;
    this.useEncryption = options.useEncryption || false;
    this.userScope = options.userScope || false;
    this.encryptionKey = options.encryptionKey;
  }

  /**
   * Finds an item by ID
   * @param id - ID of the item to find
   * @returns Promise with the item or null
   */
  async findById(id: string): Promise<T | null> {
    return new Promise((resolve) => {
      const node = this.getBaseNode().get(id);

      node.once(async (data: any) => {
        if (!data) {
          resolve(null);
          return;
        }

        if (this.useEncryption && this.encryptionKey) {
          try {
            const decrypted = await decrypt(data, this.encryptionKey);
            resolve(this.mapToEntity(decrypted));
          } catch (error) {
            console.error("Error during decryption:", error);
            resolve(null);
          }
        } else {
          resolve(this.mapToEntity(data));
        }
      });
    });
  }

  /**
   * Finds all items in the collection
   * @returns Promise with an array of items
   */
  async findAll(): Promise<T[]> {
    return new Promise((resolve) => {
      const items: T[] = [];

      this.getBaseNode()
        .map()
        .once(async (data: any, id: string) => {
          if (!data || id === "_") return;

          try {
            let item = data;
            if (this.useEncryption && this.encryptionKey) {
              item = await decrypt(data, this.encryptionKey);
            }

            items.push(this.mapToEntity(item));
          } catch (error) {
            console.error("Error during reading:", error);
          }
        });

      // Gun does not have a simple way to know when .map() has finished
      // so we wait a bit before resolving
      setTimeout(() => {
        resolve(items);
      }, 100);
    });
  }

  /**
   * Saves a new item
   * @param data - Data to save
   * @returns Promise with the ID of the new item
   */
  async save(data: T): Promise<string> {
    const id = this.generateId();

    // Prepare the data
    const entityData = this.mapToData(data);

    return new Promise(async (resolve, reject) => {
      try {
        // Encrypt the data if necessary
        const saveData =
          this.useEncryption && this.encryptionKey
            ? await encrypt(entityData, this.encryptionKey)
            : entityData;

        // Save the data
        this.getBaseNode()
          .get(id)
          .put(saveData, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }
            resolve(id);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Updates an existing item
   * @param id - ID of the item
   * @param data - Data to update
   * @returns Promise with the result of the operation
   */
  async update(id: string, data: Partial<T>): Promise<boolean> {
    // First get the existing item
    const existing = await this.findById(id);
    if (!existing) return false;

    // Merge the data
    const updated = { ...existing, ...data };
    const entityData = this.mapToData(updated as T);

    return new Promise(async (resolve, reject) => {
      try {
        // Encrypt the data if necessary
        const saveData =
          this.useEncryption && this.encryptionKey
            ? await encrypt(entityData, this.encryptionKey)
            : entityData;

        // Update the data
        this.getBaseNode()
          .get(id)
          .put(saveData, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }
            resolve(true);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Removes an item
   * @param id - ID of the item
   * @returns Promise with the result of the operation
   */
  async remove(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.getBaseNode()
          .get(id)
          .put(null, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }
            resolve(true);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Gets the base node for this collection
   * @returns Gun node
   */
  protected getBaseNode(): any {
    if (this.userScope) {
      if (!this.gun.isLoggedIn()) {
        throw new Error("Operation requires authentication");
      }
      return this.gun.getUser().get(this.collection);
    }

    return this.gun.get(this.collection);
  }

  /**
   * Maps raw data to a domain entity
   * To be implemented in child classes
   * @param data - Raw data
   * @returns Typed entity
   */
  protected abstract mapToEntity(data: any): T;

  /**
   * Maps a domain entity to data to be saved
   * To be implemented in child classes
   * @param entity - Typed entity
   * @returns Data to be saved
   */
  protected abstract mapToData(entity: T): any;

  /**
   * Generates a unique ID
   * @returns Unique ID
   */
  protected generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
