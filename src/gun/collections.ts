import { GunDB } from "./gun";
import { getId, getSet } from "./utils";

/**
 * Interface for Gun acknowledgment
 */
interface GunAck {
  err?: string;
  [key: string]: any;
}

/**
 * Utility for managing collections in Gun
 * Simplifies common operations on lists and sets
 */
export class GunCollections {
  private readonly gun: GunDB;

  constructor(gun: GunDB) {
    this.gun = gun;
  }

  /**
   * Creates a new item in a collection
   * @param collection - Collection name
   * @param data - Data to save
   * @returns Promise with the ID of the new item
   */
  async add(collection: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const node = this.gun.get(collection);
        const id = this.generateId();

        // Create node for the item
        this.gun
          .get(`${collection}_items`)
          .get(id)
          .put(data, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }

            // Add reference to collection
            node.set(
              this.gun.get(`${collection}_items`).get(id),
              (ack: GunAck) => {
                if (ack.err) {
                  reject(new Error(ack.err));
                  return;
                }
                resolve(id);
              },
            );
          });
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Updates an existing item
   * @param collection - Collection name
   * @param id - Item ID
   * @param data - Data to update
   * @returns Promise with operation result
   */
  async update(collection: string, id: string, data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.gun
          .get(`${collection}_items`)
          .get(id)
          .put(data, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }
            resolve(true);
          });
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Removes an item from the collection
   * @param collection - Collection name
   * @param id - Item ID
   * @returns Promise with operation result
   */
  async remove(collection: string, id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Remove the node
        this.gun
          .get(`${collection}_items`)
          .get(id)
          .put(null, (ack: GunAck) => {
            if (ack.err) {
              reject(new Error(ack.err));
              return;
            }

            // Also remove reference from collection
            // Note: Gun has no direct way to remove nodes from a set
            // this is a partial solution
            resolve(true);
          });
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * Finds all items in a collection
   * @param collection - Collection name
   * @returns Promise with array of items
   */
  async findAll(collection: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.gun
        .get(collection)
        .once((data: { [x: string]: any; _?: { [x: string]: any } }) => {
          if (!data) {
            resolve([]);
            return;
          }

          // Get array of references
          const refs = getSet(data, getId(data as { _: { [x: string]: any } }));
          resolve(refs);
        });
    });
  }

  /**
   * Finds a specific item by ID
   * @param collection - Collection name
   * @param id - Item ID
   * @returns Promise with item or null
   */
  async findById(collection: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun
        .get(`${collection}_items`)
        .get(id)
        .once((data: unknown) => {
          resolve(data);
        });
    });
  }

  /**
   * Generates a unique ID for a new item
   * @returns Unique ID
   */
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
