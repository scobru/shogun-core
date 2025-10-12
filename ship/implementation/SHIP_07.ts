/**
 * SHIP-07: Secure Vault Implementation
 *
 * Vault crittografato decentralizzato che dipende da SHIP-00 per l'identità.
 *
 * Dipendenze:
 * - SHIP-00 (Identity & Authentication) - per gestione utenti e chiavi
 * - GunDB - per storage decentralizzato P2P
 * - SEA - per crittografia AES-256-GCM
 *
 * Ispirato a: https://github.com/draeder/gunsafe
 */

import type { ISHIP_00, SEAPair } from "../interfaces/ISHIP_00";
import type {
  ISHIP_07,
  VaultRecord,
  VaultResult,
  VaultStats,
  RecordMetadata,
  GetOptions,
  ListOptions,
  ImportOptions,
  ExportOptions,
  EncryptedRecord,
} from "../interfaces/ISHIP_07";

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-07 Reference Implementation
 * 
 * Questa implementazione dipende da ISHIP_00 per tutte le operazioni di identità.
 * Si concentra esclusivamente sulla logica del vault crittografato.
 */
class SHIP_07 implements ISHIP_07 {
  private identity: ISHIP_00;
  private initialized: boolean = false;
  private vaultNodeName: string;
  
  // Gun nodes
  private vaultNode: any = null;
  private recordsNode: any = null;
  private metadataNode: any = null;

  // Constants
  private static readonly VAULT_VERSION = "1.0.0";
  private static readonly DEFAULT_NODE_NAME = "vault";

  /**
   * Constructor
   * @param identity ISHIP_00 instance for identity operations
   * @param vaultNodeName Optional custom vault node name
   */
  constructor(identity: ISHIP_00, vaultNodeName?: string) {
    if (!identity.isLoggedIn()) {
      throw new Error("User must be authenticated via SHIP-00 before using SHIP-07");
    }
    
    this.identity = identity;
    this.vaultNodeName = vaultNodeName || SHIP_07.DEFAULT_NODE_NAME;
    
    console.log("✅ SHIP-07 initialized");
  }

  /**
   * Get identity provider
   */
  getIdentity(): ISHIP_00 {
    return this.identity;
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize vault
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("⚠️  Vault already initialized");
      return;
    }

    try {
      // Get Gun instance from identity
      const shogun = this.identity.getShogun();
      if (!shogun || !shogun.db) {
        throw new Error("Cannot access ShogunCore from identity");
      }

      const gun = shogun.db.gun;
      if (!gun) {
        throw new Error("Cannot access GunDB");
      }

      // Get user node
      const userNode = gun.user();
      if (!userNode || !userNode.is) {
        throw new Error("User not authenticated in Gun");
      }

      // Setup vault nodes
      this.vaultNode = userNode.get(this.vaultNodeName);
      this.recordsNode = this.vaultNode.get("records");
      this.metadataNode = this.vaultNode.get("metadata");

      // Initialize metadata
      const existingMetadata = await this.metadataNode.then();
      
      if (!existingMetadata || !existingMetadata.version) {
        await this.metadataNode.put({
          version: SHIP_07.VAULT_VERSION,
          created: Date.now().toString(),
          recordCount: "0",
        }).then();
        
        console.log("📦 Vault metadata initialized");
      } else {
        console.log("📦 Existing vault found");
      }

      this.initialized = true;
      console.log("✅ Vault initialized successfully");

    } catch (error: any) {
      console.error("❌ Error initializing vault:", error);
      throw error;
    }
  }

  /**
   * Check if vault is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================

  /**
   * Store encrypted record in vault
   */
  async put(
    name: string,
    data: any,
    metadata?: RecordMetadata
  ): Promise<VaultResult> {
    if (!this.initialized) {
      return { success: false, error: "Vault not initialized" };
    }

    if (!name || name.trim() === "") {
      return { success: false, error: "Record name cannot be empty" };
    }

    try {
      // Get crypto and key pair
      const shogun = this.identity.getShogun();
      const crypto = shogun?.db?.crypto;
      const pair = this.identity.getKeyPair();
      
      if (!crypto || !pair) {
        return { success: false, error: "Cannot access encryption" };
      }

      // Encrypt data
      const dataString = JSON.stringify(data);
      const encryptedData = await crypto.encrypt(dataString, pair.epriv);

      // Encrypt metadata if provided
      let encryptedMetadata: string | undefined;
      if (metadata) {
        const metadataString = JSON.stringify(metadata);
        encryptedMetadata = await crypto.encrypt(metadataString, pair.epriv);
      }

      // Create encrypted record
      const record: EncryptedRecord = {
        data: encryptedData,
        created: Date.now().toString(),
        updated: Date.now().toString(),
        deleted: false,
        metadata: encryptedMetadata,
      };

      // Store in vault
      await this.recordsNode.get(name).put(record).then();

      // Update vault metadata
      await this.updateRecordCount();

      console.log(`✅ Record stored: ${name}`);

      return {
        success: true,
        recordName: name,
      };

    } catch (error: any) {
      console.error("❌ Error storing record:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve and decrypt record from vault
   */
  async get(name: string, options?: GetOptions): Promise<VaultRecord | null> {
    if (!this.initialized) {
      console.error("❌ Vault not initialized");
      return null;
    }

    try {
      // Retrieve encrypted record
      const encryptedRecord = await this.recordsNode.get(name).then();
      
      if (!encryptedRecord || !encryptedRecord.data) {
        return null;
      }

      // Check if deleted (unless includeDeleted)
      if (encryptedRecord.deleted && !options?.includeDeleted) {
        return null;
      }

      // Get crypto and key pair
      const shogun = this.identity.getShogun();
      const crypto = shogun?.db?.crypto;
      const pair = this.identity.getKeyPair();
      
      if (!crypto || !pair) {
        console.error("❌ Cannot access encryption");
        return null;
      }

      // Decrypt data
      const decryptedDataString = await crypto.decrypt(
        encryptedRecord.data,
        pair.epriv
      );
      
      // Try to parse JSON, if it fails, use the string as-is
      let decryptedData: any;
      try {
        decryptedData = JSON.parse(decryptedDataString);
      } catch (parseError) {
        // If JSON.parse fails, the data is likely a plain string
        // This can happen if the data was already a string value
        decryptedData = decryptedDataString;
      }

      // Decrypt metadata if present
      let decryptedMetadata: RecordMetadata | undefined;
      if (encryptedRecord.metadata) {
        try {
          const metadataString = await crypto.decrypt(
            encryptedRecord.metadata,
            pair.epriv
          );
          decryptedMetadata = JSON.parse(metadataString);
        } catch (error) {
          // Metadata decryption failed, continue without it
          console.warn("⚠️  Could not decrypt metadata");
        }
      }

      // Create vault record
      const vaultRecord: VaultRecord = {
        name,
        data: decryptedData,
        created: parseInt(encryptedRecord.created),
        updated: parseInt(encryptedRecord.updated),
        deleted: encryptedRecord.deleted,
        metadata: decryptedMetadata,
      };

      return vaultRecord;

    } catch (error) {
      console.error("❌ Error retrieving record:", error);
      return null;
    }
  }

  /**
   * Delete record from vault (soft delete)
   */
  async delete(name?: string): Promise<VaultResult> {
    if (!this.initialized) {
      return { success: false, error: "Vault not initialized" };
    }

    try {
      if (name) {
        // Delete specific record (soft delete)
        const existingRecord = await this.recordsNode.get(name).then();
        
        if (!existingRecord) {
          return { success: false, error: `Record ${name} not found` };
        }

        // Mark as deleted
        await this.recordsNode.get(name).get("deleted").put(true).then();
        await this.recordsNode.get(name).get("updated").put(Date.now().toString()).then();

        console.log(`🗑️  Record soft-deleted: ${name}`);

        return {
          success: true,
          recordName: name,
        };

      } else {
        // Delete all records (soft delete)
        const allRecords = await this.list({ includeDeleted: false });
        let deletedCount = 0;

        for (const recordName of allRecords) {
          const result = await this.delete(recordName);
          if (result.success) {
            deletedCount++;
          }
        }

        console.log(`🗑️  ${deletedCount} records soft-deleted`);

        return {
          success: true,
          recordCount: deletedCount,
        };
      }

    } catch (error: any) {
      console.error("❌ Error deleting record:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List all record names in vault
   */
  async list(options?: ListOptions): Promise<string[]> {
    if (!this.initialized) {
      console.error("❌ Vault not initialized");
      return [];
    }

    try {
      return new Promise<string[]>((resolve) => {
        const recordNames: string[] = [];

        this.recordsNode.map().once(async (record: any, key: string) => {
          // Skip metadata
          if (!record || typeof record !== "object" || key === "_") {
            return;
          }

          // Skip deleted records (unless includeDeleted)
          if (record.deleted && !options?.includeDeleted) {
            return;
          }

          // Apply filters if provided
          if (options?.filterByType || options?.filterByTag) {
      try {
            // Need to decrypt metadata to filter
            const shogun = this.identity.getShogun();
            const crypto = shogun?.db?.crypto;
            const pair = this.identity.getKeyPair();
              
              if (crypto && pair && record.metadata) {
                const metadataString = await crypto.decrypt(record.metadata, pair.epriv);
                const metadata: RecordMetadata = JSON.parse(metadataString);

                // Filter by type
                if (options.filterByType && metadata.type !== options.filterByType) {
                  return;
                }

                // Filter by tag
                if (options.filterByTag) {
                  if (!metadata.tags || !metadata.tags.includes(options.filterByTag)) {
                    return;
                  }
                }
              }
            } catch (error) {
              // Decryption failed, skip
              return;
            }
          }

          recordNames.push(key);
        });

        // Wait for Gun to return all records
        setTimeout(() => {
          // Sort if requested
          if (options?.sortBy) {
            // For now, just sort by name
            recordNames.sort();
            if (options.sortDesc) {
              recordNames.reverse();
            }
          }

          resolve(recordNames);
        }, 1000);
      });

    } catch (error) {
      console.error("❌ Error listing records:", error);
      return [];
    }
  }

  /**
   * Check if record exists
   */
  async exists(name: string): Promise<boolean> {
    const record = await this.get(name);
    return record !== null;
  }

  /**
   * Update existing record
   */
  async update(name: string, data: any): Promise<VaultResult> {
    if (!this.initialized) {
      return { success: false, error: "Vault not initialized" };
    }

    try {
      // Check if record exists
      const existingRecord = await this.get(name);
      if (!existingRecord) {
        return { success: false, error: `Record ${name} not found` };
      }

      // Keep existing metadata
      return await this.put(name, data, existingRecord.metadata);

    } catch (error: any) {
      console.error("❌ Error updating record:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }


  // ========================================================================
  // BACKUP & RESTORE
  // ========================================================================

  /**
   * Export entire vault (encrypted)
   */
  async export(password?: string, options?: ExportOptions): Promise<string> {
    if (!this.initialized) {
      throw new Error("Vault not initialized");
    }

    try {
      // Get all records
      const recordNames = await this.list({
        includeDeleted: options?.includeDeleted || false,
        filterByTag: options?.filterByTag,
        filterByType: options?.filterByType,
      });

      const records: Record<string, VaultRecord> = {};

      for (const name of recordNames) {
        const record = await this.get(name, {
          includeDeleted: options?.includeDeleted || false,
        });
        
        if (record) {
          records[name] = record;
        }
      }

      // Create export data
      const exportData = {
        version: SHIP_07.VAULT_VERSION,
        exportedAt: Date.now(),
        exportedBy: this.identity.getCurrentUser()?.pub,
        recordCount: Object.keys(records).length,
        records,
      };

      // Serialize to JSON
      const jsonString = options?.pretty
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);

      // Optionally encrypt with password
      if (password) {
        const crypto = (this.identity as any).shogun?.db?.crypto;
        if (!crypto) {
          throw new Error("Cannot access crypto");
        }

        const encryptedJson = await crypto.encrypt(jsonString, password);
        const base64 = Buffer.from(encryptedJson).toString("base64");
        
        console.log(`✅ Vault exported (encrypted, ${base64.length} chars)`);
        return base64;
      }

      // Otherwise, return as base64
      const base64 = Buffer.from(jsonString).toString("base64");
      console.log(`✅ Vault exported (${base64.length} chars)`);
      return base64;

    } catch (error: any) {
      console.error("❌ Error exporting vault:", error);
      throw error;
    }
  }

  /**
   * Import vault from backup
   */
  async import(
    backupData: string,
    password?: string,
    options?: ImportOptions
  ): Promise<VaultResult> {
    if (!this.initialized) {
      return { success: false, error: "Vault not initialized" };
    }

    try {
      // Decode base64
      let jsonString = Buffer.from(backupData, "base64").toString("utf-8");

      // Decrypt if password provided
      if (password) {
        const crypto = (this.identity as any).shogun?.db?.crypto;
        if (!crypto) {
          return { success: false, error: "Cannot access crypto" };
        }

        jsonString = await crypto.decrypt(jsonString, password);
      }

      // Parse JSON
      const importData = JSON.parse(jsonString);

      // Validate version
      if (importData.version !== SHIP_07.VAULT_VERSION) {
        console.warn(`⚠️  Version mismatch: ${importData.version} vs ${SHIP_07.VAULT_VERSION}`);
      }

      // Import records
      let importedCount = 0;
      let skippedCount = 0;

      for (const [name, record] of Object.entries(importData.records)) {
        const vaultRecord = record as VaultRecord;

        // Skip deleted records if requested
        if (options?.skipDeleted && vaultRecord.deleted) {
          skippedCount++;
          continue;
        }

        // Check if exists (if merge mode)
        const exists = await this.exists(name);
        
        if (exists) {
          if (options?.overwrite) {
            // Overwrite existing
            await this.put(name, vaultRecord.data, vaultRecord.metadata);
            importedCount++;
          } else if (!options?.merge) {
            // Skip if not merge and not overwrite
            skippedCount++;
            continue;
          } else {
            // Merge mode: skip existing
            skippedCount++;
            continue;
          }
        } else {
          // Import new record
          await this.put(name, vaultRecord.data, vaultRecord.metadata);
          importedCount++;
        }
      }

      console.log(`✅ Vault imported: ${importedCount} records (${skippedCount} skipped)`);

      return {
        success: true,
        recordCount: importedCount,
      };

    } catch (error: any) {
      console.error("❌ Error importing vault:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * Get vault statistics
   */
  async getStats(): Promise<VaultStats> {
    if (!this.initialized) {
      throw new Error("Vault not initialized");
    }

    try {
      const allRecords = await this.list({ includeDeleted: true });
      const activeRecords = await this.list({ includeDeleted: false });

      // Get metadata
      const metadata = await this.metadataNode.then();

      const stats: VaultStats = {
        totalRecords: allRecords.length,
        activeRecords: activeRecords.length,
        deletedRecords: allRecords.length - activeRecords.length,
        totalSize: 0, // TODO: Calculate actual size
        created: metadata?.created ? parseInt(metadata.created) : Date.now(),
        lastModified: Date.now(),
        recordsByType: {},
      };

      // Count by type
      for (const name of activeRecords) {
        const record = await this.get(name);
        if (record && record.metadata?.type) {
          const type = record.metadata.type;
          stats.recordsByType![type] = (stats.recordsByType![type] || 0) + 1;
        }
      }

      return stats;

    } catch (error) {
      console.error("❌ Error getting stats:", error);
      throw error;
    }
  }

  /**
   * Clear all records (soft delete all)
   */
  async clear(): Promise<VaultResult> {
    return await this.delete(); // Delete without name = delete all
  }

  /**
   * Compact vault (remove deleted records permanently)
   */
  async compact(): Promise<VaultResult> {
    if (!this.initialized) {
      return { success: false, error: "Vault not initialized" };
    }

    try {
      // Get all deleted records
      const allRecords = await this.list({ includeDeleted: true });
      let compactedCount = 0;

      for (const name of allRecords) {
        const record = await this.get(name, { includeDeleted: true });
        
        if (record && record.deleted) {
          // Permanently remove
          await this.recordsNode.get(name).put(null).then();
          compactedCount++;
        }
      }

      // Update metadata
      await this.updateRecordCount();

      console.log(`✅ Vault compacted: ${compactedCount} records permanently removed`);

      return {
        success: true,
        recordCount: compactedCount,
      };

    } catch (error: any) {
      console.error("❌ Error compacting vault:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search records by content
   */
  async search(query: string): Promise<string[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      const allRecords = await this.list({ includeDeleted: false });
      const matches: string[] = [];

      for (const name of allRecords) {
        const record = await this.get(name);
        
        if (record) {
          // Search in data (converted to string)
          const dataString = JSON.stringify(record.data).toLowerCase();
          const queryLower = query.toLowerCase();
          
          if (dataString.includes(queryLower) || name.toLowerCase().includes(queryLower)) {
            matches.push(name);
          }
        }
      }

      return matches;

    } catch (error) {
      console.error("❌ Error searching records:", error);
      return [];
    }
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Update record count in metadata
   */
  private async updateRecordCount(): Promise<void> {
    try {
      const activeRecords = await this.list({ includeDeleted: false });
      await this.metadataNode.get("recordCount").put(activeRecords.length.toString()).then();
    } catch (error) {
      console.error("❌ Error updating record count:", error);
    }
  }
}

export { SHIP_07 };

