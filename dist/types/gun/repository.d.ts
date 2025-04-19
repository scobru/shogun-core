import { GunDB } from "./gun";
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
 * Generic repository for Gun
 * Implements the repository pattern with optional encryption support
 */
export declare abstract class GunRepository<T> implements Repository<T> {
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
    constructor(gun: GunDB, collection: string, options?: {
        useEncryption?: boolean;
        userScope?: boolean;
        encryptionKey?: any;
    });
    /**
     * Finds an item by ID
     * @param id - ID of the item to find
     * @returns Promise with the item or null
     */
    findById(id: string): Promise<T | null>;
    /**
     * Finds all items in the collection
     * @returns Promise with an array of items
     */
    findAll(): Promise<T[]>;
    /**
     * Saves a new item
     * @param data - Data to save
     * @returns Promise with the ID of the new item
     */
    save(data: T): Promise<string>;
    /**
     * Updates an existing item
     * @param id - ID of the item
     * @param data - Data to update
     * @returns Promise with the result of the operation
     */
    update(id: string, data: Partial<T>): Promise<boolean>;
    /**
     * Removes an item
     * @param id - ID of the item
     * @returns Promise with the result of the operation
     */
    remove(id: string): Promise<boolean>;
    /**
     * Gets the base node for this collection
     * @returns Gun node
     */
    protected getBaseNode(): any;
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
    protected generateId(): string;
}
