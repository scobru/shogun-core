/**
 * SHIP-05: Decentralized File Storage Interface
 * 
 * @title ISHIP_05 - IPFS Storage with Relay Network
 * @notice Interface for decentralized file storage with encryption
 * 
 * ## Abstract
 * 
 * This standard extends SHIP-00 to enable:
 * - Encrypted file storage on IPFS
 * - Relay network management for storage providers
 * - On-chain subscription system for storage
 * - Deterministic encryption from wallet signatures
 * - File sharing with access control
 * 
 * ## Specification
 * 
 * Based on:
 * - SHIP-00 for identity foundation
 * - IPFS for decentralized storage
 * - Smart contracts for relay payment system
 * - Deterministic encryption from wallet signatures
 * 
 * ## Dependencies
 * 
 * - SHIP-00: Identity and authentication foundation
 * - IPFS: Decentralized file storage
 * - Ethereum: For relay subscription payments
 * - shogun-ipfs: IPFS wrapper library
 * 
 * ## Usage
 * 
 * ```typescript
 * const identity = new SHIP_00({ gunOptions: { peers: ['...'] } });
 * await identity.login('alice', 'password123');
 * 
 * const storage = new SHIP_05(identity);
 * await storage.initialize();
 * 
 * // Upload encrypted file
 * const result = await storage.uploadFile(file, { encrypt: true });
 * 
 * // Download and decrypt
 * const data = await storage.downloadFile(result.hash, { decrypt: true });
 * ```
 */

import type { ISHIP_00 } from "./ISHIP_00";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice File upload result
 */
export interface UploadResult {
  success: boolean;
  hash?: string;           // IPFS hash (CID)
  size?: number;           // File size in bytes
  encrypted?: boolean;     // Whether file was encrypted
  error?: string;
}

/**
 * @notice File metadata
 */
export interface FileMetadata {
  id: string;              // Unique file ID
  name: string;            // Original filename
  hash: string;            // IPFS hash
  sizeMB: number;          // Size in MB
  uploadedAt: number;      // Upload timestamp
  encrypted: boolean;      // Encryption status
  type?: string;           // MIME type
  owner?: string;          // Owner address
}


/**
 * @notice Upload options
 */
export interface UploadOptions {
  encrypt?: boolean;       // Encrypt file with wallet signature
  pin?: boolean;           // Pin to IPFS (default: true)
  metadata?: Record<string, any>; // Custom metadata
}

/**
 * @notice Download options
 */
export interface DownloadOptions {
  decrypt?: boolean;       // Decrypt file with wallet signature
  returnBlob?: boolean;    // Return as Blob instead of data URL
}

/**
 * @notice Encryption options for SEA
 */
export interface EncryptionOptions {
  useUserPair?: boolean;   // Use user's SEA pair (default: true)
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_05 - Decentralized File Storage
 * @notice Main interface for IPFS file storage with encryption
 */
export interface ISHIP_05 {
  
  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * @notice Initialize the storage system
   * @dev Must be called after SHIP-00 authentication
   * @param options Configuration options
   * @returns Promise that resolves when initialization is complete
   */
  initialize(options?: SHIP_05_Config): Promise<void>;

  /**
   * @notice Check if system is initialized
   * @returns True if initialized
   */
  isInitialized(): boolean;

  /**
   * @notice Get the underlying SHIP-00 identity provider
   * @returns SHIP-00 instance
   */
  getIdentity(): ISHIP_00;

  // ========================================================================
  // FILE OPERATIONS
  // ========================================================================

  /**
   * @notice Upload file to IPFS
   * @dev Optionally encrypts file with deterministic key from wallet signature
   * @param file File to upload (File or Buffer)
   * @param options Upload options
   * @returns Promise resolving to upload result with IPFS hash
   * 
   * Process:
   * 1. If encrypt=true, get wallet signature and generate key
   * 2. Upload to IPFS
   * 3. Record file metadata on GunDB
   */
  uploadFile(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * @notice Upload JSON data to IPFS
   * @param data JSON object to upload
   * @param options Upload options
   * @returns Promise resolving to upload result
   */
  uploadJson(
    data: any,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * @notice Download file from IPFS
   * @dev Automatically decrypts if file was encrypted by user
   * @param hash IPFS hash to download
   * @param options Download options
   * @returns Promise resolving to file data
   */
  downloadFile(
    hash: string,
    options?: DownloadOptions
  ): Promise<string | Blob>;

  /**
   * @notice Get file metadata
   * @param hash IPFS hash
   * @returns Promise resolving to file metadata or null
   */
  getFileMetadata(hash: string): Promise<FileMetadata | null>;

  /**
   * @notice Delete file from IPFS
   * @dev Removes file and updates MB usage
   * @param hash IPFS hash to delete
   * @returns Promise resolving to deletion result
   */
  deleteFile(hash: string): Promise<{ success: boolean; error?: string }>;

  /**
   * @notice Get all files uploaded by user
   * @returns Promise resolving to array of file metadata
   */
  getUserFiles(): Promise<FileMetadata[]>;

  // ========================================================================
  // ENCRYPTION
  // ========================================================================

  /**
   * @notice Encrypt data using SEA (from SHIP-00)
   * @dev Uses user's SEA keypair for encryption
   * @param data Data to encrypt (string or Buffer)
   * @param options Encryption options
   * @returns Promise resolving to encrypted data
   * 
   * Process:
   * 1. Get SEA pair from SHIP-00 identity
   * 2. Use SEA.encrypt(data, pair) for symmetric encryption
   * 3. Return encrypted string
   */
  encryptData(data: string | Buffer, options?: EncryptionOptions): Promise<string>;

  /**
   * @notice Decrypt data using SEA (from SHIP-00)
   * @dev Uses user's SEA keypair for decryption
   * @param encryptedData Encrypted data
   * @param options Encryption options
   * @returns Promise resolving to decrypted data
   */
  decryptData(encryptedData: string, options?: EncryptionOptions): Promise<string>;


  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * @notice Check if file is accessible
   * @param hash IPFS hash
   * @returns Promise resolving to boolean
   */
  isFileAccessible(hash: string): Promise<boolean>;

  /**
   * @notice Get storage usage statistics
   * @returns Promise resolving to usage stats
   */
  getStorageStats(): Promise<{
    totalFiles: number;
    totalMB: number;
    encryptedFiles: number;
    plainFiles: number;
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * @notice SHIP-05 Configuration
 */
export interface SHIP_05_Config {
  /** IPFS service configuration */
  ipfsService?: "PINATA" | "IPFS-CLIENT" | "CUSTOM";
  
  /** IPFS service config */
  ipfsConfig?: {
    pinataJwt?: string;          // Pinata JWT token
    pinataGateway?: string;      // Pinata gateway URL
    url?: string;            // IPFS Client URL (e.g. http://localhost:5001) - for IPFS-CLIENT service
    customApiUrl?: string;       // Custom gateway/relay URL
    customToken?: string;        // Auth token for custom gateway/relay
  };


  /** Max file size in MB */
  maxFileSizeMB?: number;
}

// ============================================================================
// EVENTS
// ============================================================================

export enum SHIP_05_EventType {
  FILE_UPLOADED = "fileUploaded",
  FILE_DOWNLOADED = "fileDownloaded",
  FILE_DELETED = "fileDeleted",
  ERROR = "error",
}

export interface SHIP_05_Event {
  type: SHIP_05_EventType;
  data?: any;
  timestamp: number;
}

export type SHIP_05_Events = {
  fileUploaded: (result: UploadResult) => void;
  fileDownloaded: (hash: string) => void;
  fileDeleted: (hash: string) => void;
  error: (error: Error) => void;
};

