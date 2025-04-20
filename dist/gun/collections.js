import { getId, getSet } from "./utils";
/**
 * Utility for managing collections in Gun
 * Simplifies common operations on lists and sets
 */
export class GunCollections {
    constructor(gun) {
        this.gun = gun;
    }
    /**
     * Creates a new item in a collection
     * @param collection - Collection name
     * @param data - Data to save
     * @returns Promise with the ID of the new item
     */
    async add(collection, data) {
        return new Promise((resolve, reject) => {
            try {
                const node = this.gun.get(collection);
                const id = this.generateId();
                // Create node for the item
                this.gun
                    .get(`${collection}_items`)
                    .get(id)
                    .put(data, (ack) => {
                    if (ack.err) {
                        reject(new Error(ack.err));
                        return;
                    }
                    // Add reference to collection
                    node.set(this.gun.get(`${collection}_items`).get(id), (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                            return;
                        }
                        resolve(id);
                    });
                });
            }
            catch (error) {
                reject(error);
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
    async update(collection, id, data) {
        return new Promise((resolve, reject) => {
            try {
                this.gun
                    .get(`${collection}_items`)
                    .get(id)
                    .put(data, (ack) => {
                    if (ack.err) {
                        reject(new Error(ack.err));
                        return;
                    }
                    resolve(true);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Removes an item from the collection
     * @param collection - Collection name
     * @param id - Item ID
     * @returns Promise with operation result
     */
    async remove(collection, id) {
        return new Promise((resolve, reject) => {
            try {
                // Remove the node
                this.gun
                    .get(`${collection}_items`)
                    .get(id)
                    .put(null, (ack) => {
                    if (ack.err) {
                        reject(new Error(ack.err));
                        return;
                    }
                    // Also remove reference from collection
                    // Note: Gun has no direct way to remove nodes from a set
                    // this is a partial solution
                    resolve(true);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Finds all items in a collection
     * @param collection - Collection name
     * @returns Promise with array of items
     */
    async findAll(collection) {
        return new Promise((resolve) => {
            this.gun
                .get(collection)
                .once((data) => {
                if (!data) {
                    resolve([]);
                    return;
                }
                // Get array of references
                const refs = getSet(data, getId(data));
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
    async findById(collection, id) {
        return new Promise((resolve) => {
            this.gun
                .get(`${collection}_items`)
                .get(id)
                .once((data) => {
                resolve(data);
            });
        });
    }
    /**
     * Generates a unique ID for a new item
     * @returns Unique ID
     */
    generateId() {
        return (Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15));
    }
}
