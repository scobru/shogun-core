import { GunDB } from "./gun";
/**
 * Utility for managing collections in Gun
 * Simplifies common operations on lists and sets
 */
export declare class GunCollections {
    private readonly gun;
    constructor(gun: GunDB);
    /**
     * Creates a new item in a collection
     * @param collection - Collection name
     * @param data - Data to save
     * @returns Promise with the ID of the new item
     */
    add(collection: string, data: any): Promise<string>;
    /**
     * Updates an existing item
     * @param collection - Collection name
     * @param id - Item ID
     * @param data - Data to update
     * @returns Promise with operation result
     */
    update(collection: string, id: string, data: any): Promise<boolean>;
    /**
     * Removes an item from the collection
     * @param collection - Collection name
     * @param id - Item ID
     * @returns Promise with operation result
     */
    remove(collection: string, id: string): Promise<boolean>;
    /**
     * Finds all items in a collection
     * @param collection - Collection name
     * @returns Promise with array of items
     */
    findAll(collection: string): Promise<any[]>;
    /**
     * Finds a specific item by ID
     * @param collection - Collection name
     * @param id - Item ID
     * @returns Promise with item or null
     */
    findById(collection: string, id: string): Promise<any>;
    /**
     * Generates a unique ID for a new item
     * @returns Unique ID
     */
    private generateId;
}
