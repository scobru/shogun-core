/**
 * Storage implementation based on StorageMock
 * Provides a unified storage interface that works in both browser and non-browser environments
 * In browser environments, data is persisted to localStorage as a backup
 */
export declare class ShogunStorage {
    private store;
    /**
     * Initializes storage and loads any existing keypair from localStorage if available
     */
    constructor();
    /**
     * Gets the stored keypair asynchronously
     * @returns Promise resolving to the keypair or null if not found
     */
    getPair(): Promise<any>;
    /**
     * Gets the stored keypair synchronously
     * @returns The keypair or null if not found
     */
    getPairSync(): any;
    /**
     * Stores a keypair both in memory and localStorage if available
     * @param pair - The keypair to store
     */
    setPair(pair: any): Promise<void>;
    /**
     * Clears all stored data from both memory and localStorage
     */
    clearAll(): void;
    /**
     * Gets an item from storage
     * @param key - The key to retrieve
     * @returns The stored value as a string, or null if not found
     */
    getItem(key: string): string | null;
    /**
     * Stores an item in both memory and localStorage if available
     * @param key - The key to store under
     * @param value - The value to store (must be JSON stringifiable)
     */
    setItem(key: string, value: string): void;
    /**
     * Removes an item from both memory and localStorage if available
     * @param key - The key to remove
     */
    removeItem(key: string): void;
}
