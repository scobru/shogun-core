/**
 * SHIP-06: Secure Vault Interface
 * 
 * @title ISHIP_06 - Secure Encrypted Vault
 * @notice Interface for secure encrypted key-value storage on GunDB
 * @dev This interface depends on ISHIP_00 for identity and encryption
 * 
 * ## Abstract
 * 
 * This standard defines an interface for secure vault storage that allows:
 * - End-to-end encrypted key-value storage
 * - Soft delete with recovery
 * - Export/import for backup
 * - Rich metadata support
 * - Simple, secure, focused on storage only
 * 
 * ## Dependencies
 * 
 * - ISHIP_00: Identity and authentication layer
 * - GunDB: P2P storage
 * - SEA: Cryptography (AES-256-GCM)
 * 
 * ## Inspiration
 * 
 * Based on Gunsafe (https://github.com/draeder/gunsafe)
 * Adapted for Shogun ecosystem with SHIP-00 integration
 */

import type { ISHIP_00 } from "./ISHIP_00";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Vault record structure
 */
export interface VaultRecord {
    name: string;           // Record name/key
    data: any;              // Decrypted data (any type)
    created: number;        // Creation timestamp (Unix ms)
    updated: number;        // Last update timestamp (Unix ms)
    deleted: boolean;       // Soft delete flag
    metadata?: RecordMetadata; // Optional metadata
}

/**
 * @notice Encrypted record (stored in GunDB)
 */
export interface EncryptedRecord {
    data: string;           // Encrypted data (SEA encrypted)
    created: string;        // Creation timestamp as string
    updated: string;        // Update timestamp as string
    deleted: boolean;       // Soft delete flag
    metadata?: string;      // Encrypted metadata
}

/**
 * @notice Record metadata
 */
export interface RecordMetadata {
    type?: string;          // Data type (password, apiKey, privateKey, code, etc.)
    description?: string;   // Human-readable description
    tags?: string[];        // Tags for categorization
    expiresAt?: number;     // Expiration timestamp (Unix ms)
    [key: string]: any;     // Custom metadata fields
}

/**
 * @notice Vault operation result
 */
export interface VaultResult {
    success: boolean;
    error?: string;
    recordName?: string;
    recordCount?: number;
}

/**
 * @notice Vault statistics
 */
export interface VaultStats {
    totalRecords: number;       // Total records (including deleted)
    activeRecords: number;      // Non-deleted records
    deletedRecords: number;     // Soft-deleted records
    totalSize: number;          // Approximate size in bytes
    created: number;            // Vault creation timestamp
    lastModified: number;       // Last modification timestamp
    recordsByType?: Record<string, number>; // Count by type
}

// ============================================================================
// OPTIONS
// ============================================================================

/**
 * @notice Options for retrieving records
 */
export interface GetOptions {
    includeDeleted?: boolean;   // Include soft-deleted records (default: false)
    decrypt?: boolean;          // Return decrypted data (default: true)
}

/**
 * @notice Options for listing records
 */
export interface ListOptions {
    includeDeleted?: boolean;   // Include deleted records (default: false)
    filterByTag?: string;       // Filter by tag
    filterByType?: string;      // Filter by metadata type
    sortBy?: "name" | "created" | "updated"; // Sort order
    sortDesc?: boolean;         // Sort descending (default: false)
}

/**
 * @notice Options for importing vault
 */
export interface ImportOptions {
    merge?: boolean;            // Merge with existing records (default: false)
    overwrite?: boolean;        // Overwrite existing records (default: false)
    skipDeleted?: boolean;      // Skip deleted records (default: false)
}

/**
 * @notice Options for exporting vault
 */
export interface ExportOptions {
    includeDeleted?: boolean;   // Include deleted records (default: false)
    pretty?: boolean;           // Pretty print JSON (default: false)
    filterByTag?: string;       // Export only records with tag
    filterByType?: string;      // Export only records of type
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_07 - Secure Vault
 * @notice Main interface for secure encrypted vault
 * @dev Depends on ISHIP_00 for all identity and encryption operations
 * 
 * Constructor pattern:
 * ```typescript
 * class SecureVault implements ISHIP_07 {
 *     constructor(private identity: ISHIP_00) {}
 * }
 * ```
 */
export interface ISHIP_06 {
    
    /**
     * @notice Get the identity provider
     * @dev Returns the ISHIP_00 instance used for identity operations
     * @return Identity provider instance
     */
    getIdentity(): ISHIP_00;
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * @notice Initialize vault
     * @dev Sets up vault node structure in user's Gun space
     * 
     * Prerequisites:
     * - User must be authenticated (via ISHIP_00)
     * 
     * Flow:
     * 1. Verify user authentication
     * 2. Create vault node structure
     * 3. Initialize metadata
     */
    initialize(): Promise<void>;

    /**
     * @notice Check if vault is initialized
     * @return True if vault is initialized
     */
    isInitialized(): boolean;

    // ========================================================================
    // CRUD OPERATIONS
    // ========================================================================

    /**
     * @notice Store encrypted record in vault
     * @dev Encrypts data with SEA and stores in user's vault node
     * @param name Record name/key (must be unique)
     * @param data Data to encrypt and store (any type)
     * @param metadata Optional metadata
     * @return Operation result
     * 
     * Prerequisites:
     * - Vault must be initialized
     * - User must be authenticated
     * 
     * Flow:
     * 1. Validate record name
     * 2. Encrypt data with SEA
     * 3. Encrypt metadata if provided
     * 4. Store in gun.user().get('vault').get('records').get(name)
     * 5. Update vault metadata
     */
    put(
        name: string,
        data: any,
        metadata?: RecordMetadata
    ): Promise<VaultResult>;

    /**
     * @notice Retrieve and decrypt record from vault
     * @dev Retrieves and decrypts record from user's vault node
     * @param name Record name/key
     * @param options Retrieval options
     * @return Decrypted record or null if not found
     * 
     * Prerequisites:
     * - Vault must be initialized
     * - User must be authenticated
     * 
     * Flow:
     * 1. Retrieve encrypted record from Gun
     * 2. Decrypt data with SEA
     * 3. Decrypt metadata if present
     * 4. Return decrypted record
     */
    get(name: string, options?: GetOptions): Promise<VaultRecord | null>;

    /**
     * @notice Delete record from vault (soft delete)
     * @dev Marks record as deleted without removing data
     * @param name Record name/key (optional - deletes all if omitted)
     * @return Operation result
     * 
     * Soft Delete:
     * - Record data remains encrypted in Gun
     * - Marked as deleted (deleted: true)
     * - Can be recovered before compaction
     * - Not returned by default in list/get
     */
    delete(name?: string): Promise<VaultResult>;

    /**
     * @notice List all record names in vault
     * @dev Returns array of record names matching criteria
     * @param options List options
     * @return Array of record names
     * 
     * Flow:
     * 1. Retrieve all records from vault node
     * 2. Apply filters (deleted, tags, type)
     * 3. Sort if requested
     * 4. Return record names
     */
    list(options?: ListOptions): Promise<string[]>;

    /**
     * @notice Check if record exists
     * @param name Record name/key
     * @return True if record exists (and not deleted)
     */
    exists(name: string): Promise<boolean>;

    /**
     * @notice Update existing record
     * @dev Updates record data and timestamp
     * @param name Record name/key
     * @param data New data
     * @return Operation result
     * 
     * Flow:
     * 1. Check if record exists
     * 2. Encrypt new data
     * 3. Update record with new data
     * 4. Update timestamp
     */
    update(name: string, data: any): Promise<VaultResult>;

    // ========================================================================
    // BACKUP & RESTORE
    // ========================================================================

    /**
     * @notice Export entire vault (encrypted)
     * @dev Exports all vault records as encrypted JSON string
     * @param password Optional additional encryption password
     * @param options Export options
     * @return Encrypted vault backup as string
     * 
     * Flow:
     * 1. Retrieve all records
     * 2. Optionally filter records
     * 3. Serialize to JSON
     * 4. Optionally encrypt with additional password
     * 5. Return as base64 string
     */
    export(password?: string, options?: ExportOptions): Promise<string>;

    /**
     * @notice Import vault from backup
     * @dev Imports and decrypts vault backup
     * @param backupData Exported vault data
     * @param password Optional decryption password
     * @param options Import options
     * @return Operation result
     * 
     * Flow:
     * 1. Decode base64 backup
     * 2. Decrypt with password if provided
     * 3. Parse JSON
     * 4. For each record:
     *    - Check if exists (if merge mode)
     *    - Import or skip based on options
     * 5. Update vault metadata
     */
    import(
        backupData: string,
        password?: string,
        options?: ImportOptions
    ): Promise<VaultResult>;

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * @notice Get vault statistics
     * @dev Returns statistics about vault contents
     * @return Vault statistics
     */
    getStats(): Promise<VaultStats>;

    /**
     * @notice Clear all records (soft delete all)
     * @dev Marks all records as deleted
     * @return Operation result
     */
    clear(): Promise<VaultResult>;

    /**
     * @notice Compact vault (remove deleted records permanently)
     * @dev Permanently removes soft-deleted records
     * @return Operation result
     * 
     * ⚠️ WARNING:
     * - This operation is irreversible
     * - Deleted records cannot be recovered after compaction
     */
    compact(): Promise<VaultResult>;

    /**
     * @notice Search records by content
     * @dev Searches decrypted content (expensive operation)
     * @param query Search query
     * @return Array of matching record names
     */
    search(query: string): Promise<string[]>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * @notice Vault configuration
 */
export interface VaultConfig {
    /**
     * @notice Identity provider (SHIP-00 instance)
     */
    identity: ISHIP_00;

    /**
     * @notice Vault node name in Gun (default: "vault")
     */
    vaultNodeName?: string;

    /**
     * @notice Enable debug logging
     */
    debug?: boolean;

    /**
     * @notice Operation timeout (ms)
     */
    timeout?: number;

    /**
     * @notice Enable automatic backup
     */
    autoBackup?: boolean;

    /**
     * @notice Backup interval (ms)
     */
    backupInterval?: number;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * @notice Event emitter interface for SHIP-07
 */
export interface ISHIP_07Events {
    /**
     * Emitted when vault is initialized
     */
    initialized: () => void;

    /**
     * Emitted when record is added
     */
    recordAdded: (name: string) => void;

    /**
     * Emitted when record is updated
     */
    recordUpdated: (name: string) => void;

    /**
     * Emitted when record is deleted
     */
    recordDeleted: (name: string) => void;

    /**
     * Emitted when vault is exported
     */
    exported: (size: number) => void;

    /**
     * Emitted when vault is imported
     */
    imported: (recordCount: number) => void;

    /**
     * Emitted on error
     */
    error: (error: Error) => void;
}

// ============================================================================
// IMPLEMENTATION EXAMPLE
// ============================================================================

/**
 * Example of how to implement ISHIP_07 with ISHIP_00 dependency
 * 
 * ```typescript
 * import { ISHIP_00 } from './ISHIP_00';
 * import { ISHIP_07, VaultRecord, VaultResult } from './ISHIP_07';
 * 
 * class SecureVault implements ISHIP_07 {
 *     private vaultNode: any;
 *     private initialized: boolean = false;
 * 
 *     constructor(private identity: ISHIP_00) {
 *         if (!identity.isLoggedIn()) {
 *             throw new Error('User must be authenticated via SHIP-00');
 *         }
 *     }
 * 
 *     getIdentity(): ISHIP_00 {
 *         return this.identity;
 *     }
 * 
 *     async initialize(): Promise<void> {
 *         // Get Gun user node
 *         const gun = this.identity.shogun.db.gun;
 *         this.vaultNode = gun.user().get('vault').get('records');
 *         
 *         // Initialize vault metadata
 *         await gun.user().get('vault').get('metadata').put({
 *             version: '1.0.0',
 *             created: Date.now().toString()
 *         });
 *         
 *         this.initialized = true;
 *     }
 * 
 *     isInitialized(): boolean {
 *         return this.initialized;
 *     }
 * 
 *     async put(name: string, data: any, metadata?: RecordMetadata): Promise<VaultResult> {
 *         if (!this.initialized) {
 *             return { success: false, error: 'Vault not initialized' };
 *         }
 *         
 *         try {
 *             // Get SEA crypto
 *             const crypto = this.identity.shogun.db.crypto;
 *             const pair = this.identity.getKeyPair();
 *             
 *             if (!pair) {
 *                 return { success: false, error: 'Cannot access key pair' };
 *             }
 *             
 *             // Encrypt data
 *             const encryptedData = await crypto.encrypt(
 *                 JSON.stringify(data),
 *                 pair.epriv
 *             );
 *             
 *             // Encrypt metadata if provided
 *             const encryptedMetadata = metadata
 *                 ? await crypto.encrypt(JSON.stringify(metadata), pair.epriv)
 *                 : undefined;
 *             
 *             // Store in vault
 *             const record = {
 *                 data: encryptedData,
 *                 created: Date.now().toString(),
 *                 updated: Date.now().toString(),
 *                 deleted: false,
 *                 metadata: encryptedMetadata
 *             };
 *             
 *             await this.vaultNode.get(name).put(record);
 *             
 *             return { success: true, recordName: name };
 *         } catch (error: any) {
 *             return { success: false, error: error.message };
 *         }
 *     }
 * 
 *     async get(name: string, options?: GetOptions): Promise<VaultRecord | null> {
 *         if (!this.initialized) {
 *             return null;
 *         }
 *         
 *         try {
 *             // Retrieve from vault
 *             const encryptedRecord = await this.vaultNode.get(name).then();
 *             
 *             if (!encryptedRecord || !encryptedRecord.data) {
 *                 return null;
 *             }
 *             
 *             // Skip if deleted (unless includeDeleted)
 *             if (encryptedRecord.deleted && !options?.includeDeleted) {
 *                 return null;
 *             }
 *             
 *             // Decrypt data
 *             const crypto = this.identity.shogun.db.crypto;
 *             const pair = this.identity.getKeyPair();
 *             
 *             if (!pair) {
 *                 return null;
 *             }
 *             
 *             const decryptedData = await crypto.decrypt(
 *                 encryptedRecord.data,
 *                 pair.epriv
 *             );
 *             
 *             // Decrypt metadata if present
 *             const decryptedMetadata = encryptedRecord.metadata
 *                 ? JSON.parse(await crypto.decrypt(encryptedRecord.metadata, pair.epriv))
 *                 : undefined;
 *             
 *             return {
 *                 name,
 *                 data: JSON.parse(decryptedData),
 *                 created: parseInt(encryptedRecord.created),
 *                 updated: parseInt(encryptedRecord.updated),
 *                 deleted: encryptedRecord.deleted,
 *                 metadata: decryptedMetadata
 *             };
 *         } catch (error) {
 *             console.error('Error retrieving record:', error);
 *             return null;
 *         }
 *     }
 * 
 *     async delete(name?: string): Promise<VaultResult> {
 *         // Implementation here
 *         return { success: true };
 *     }
 * 
 *     async list(options?: ListOptions): Promise<string[]> {
 *         // Implementation here
 *         return [];
 *     }
 * 
 *     // ... implement other methods
 * }
 * 
 * // Usage
 * const identity = new SHIP_00(config);
 * await identity.login('alice', 'password123');
 * 
 * const vault = new SecureVault(identity);
 * await vault.initialize();
 * 
 * // Store encrypted data
 * await vault.put('my-password', 'super_secret', {
 *     type: 'password',
 *     description: 'GitHub password'
 * });
 * 
 * // Retrieve decrypted data
 * const record = await vault.get('my-password');
 * console.log('Password:', record?.data);
 * ```
 */

