/**
 * SHIP-05: Decentralized File Storage Implementation
 *
 * Simple encrypted file storage on IPFS.
 * Extends SHIP-00 to provide encrypted file storage capabilities.
 *
 * Based on:
 * - SHIP-00 for identity foundation
 * - IPFS for decentralized file storage
 * - shogun-ipfs for IPFS operations
 * - Deterministic encryption from wallet signatures
 *
 * Features:
 * ✅ Encrypted file upload with wallet signature
 * ✅ Deterministic encryption keys from wallet
 * ✅ IPFS storage (Pinata, IPFS node, or custom)
 * ✅ File metadata on GunDB
 * ✅ File download and decryption
 */

import type { ISHIP_00 } from "../interfaces/ISHIP_00";
import type {
  ISHIP_05,
  UploadResult,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  EncryptionOptions,
  SHIP_05_Config,
} from "../interfaces/ISHIP_05";

import {
  ShogunIpfs,
  IpfsServiceConfig,
  ShogunIpfsConfig,
  StorageService,
  PinataServiceConfig,
  CustomGatewayConfig,
  ShogunIpfsServices,
  StorageServiceWithMetadata,
  UploadOutput,
} from "shogun-ipfs";

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-05 Reference Implementation
 *
 * Provides encrypted file storage on IPFS.
 * All encryption is deterministic based on wallet signatures.
 */
class SHIP_05 implements ISHIP_05 {
  private identity: ISHIP_00;
  private config: SHIP_05_Config;
  private initialized: boolean = false;

  // GunDB Node Names for SHIP-05 storage
  public static readonly NODES = {
    USER_FILES: "user_files", // User's file metadata
  } as const;

  // IPFS storage instance (shogun-ipfs)
  // StorageService is the return type of ShogunIpfs() factory function
  private ipfsStorage: StorageService | null = null;

  // File cache (metadata)
  private fileCache: Map<string, FileMetadata> = new Map();

  constructor(identity: ISHIP_00, config: SHIP_05_Config = {}) {
    this.identity = identity;
    this.config = {
      ipfsService: config.ipfsService ?? "CUSTOM",
      ipfsConfig: config.ipfsConfig ?? {},
      maxFileSizeMB: config.maxFileSizeMB ?? 100,
    };
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async initialize(options?: SHIP_05_Config): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure SHIP-00 is authenticated
      if (!this.identity.isLoggedIn()) {
        throw new Error("SHIP-00 identity not authenticated");
      }

      // Merge options with config
      if (options) {
        this.config = { ...this.config, ...options };
      }

      console.log("🔐 Initializing SHIP-05 (Decentralized Storage)...");

      // Initialize IPFS storage if configured
      if (this.config.ipfsService && this.config.ipfsConfig) {
        await this.initializeIPFS();
      }

      this.initialized = true;
      console.log("✅ SHIP-05 initialized successfully");
    } catch (error: any) {
      throw new Error(`SHIP-05 initialization failed: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getIdentity(): ISHIP_00 {
    return this.identity;
  }

  // ========================================================================
  // FILE OPERATIONS
  // ========================================================================

  async uploadFile(
    file: File | Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      this.ensureInitialized();

      const { encrypt = false, pin = true } = options;

      console.log("📤 Uploading file to IPFS...");
      console.log(`   Encryption: ${encrypt ? "YES" : "NO"}`);

      // Check file size
      const fileSize = file instanceof File ? file.size : file.length;
      const fileSizeMB = fileSize / (1024 * 1024);

      if (fileSizeMB > this.config.maxFileSizeMB!) {
        return {
          success: false,
          error: `File too large (${fileSizeMB.toFixed(2)} MB > ${this.config.maxFileSizeMB} MB)`,
        };
      }

      let dataToUpload: File | Buffer = file;
      let isEncrypted = false;

      // Encrypt if requested
      if (encrypt) {
        console.log("🔐 Encrypting file with SEA...");

        // Convert file to base64
        let base64Data: string;
        if (file instanceof File) {
          base64Data = await this.fileToBase64(file);
        } else {
          base64Data = file.toString("base64");
        }

        // Encrypt using SEA
        const encrypted = await this.encryptData(base64Data);
        dataToUpload = Buffer.from(encrypted);
        isEncrypted = true;
      }

      // Upload to IPFS
      const hash = await this.uploadToIPFS(dataToUpload);

      if (!hash) {
        return {
          success: false,
          error: "IPFS upload failed",
        };
      }

      // Save metadata
      const metadata: FileMetadata = {
        id: `${hash}-${Date.now()}`,
        name: file instanceof File ? file.name : "buffer",
        hash,
        sizeMB: Math.ceil(fileSizeMB * 100) / 100,
        uploadedAt: Date.now(),
        encrypted: isEncrypted,
        type: file instanceof File ? file.type : undefined,
      };

      await this.saveFileMetadata(metadata);

      console.log(`✅ File uploaded successfully: ${hash}`);

      return {
        success: true,
        hash,
        size: fileSize,
        encrypted: isEncrypted,
      };
    } catch (error: any) {
      console.error("❌ Error uploading file:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async uploadJson(
    data: any,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, "utf-8");
      return await this.uploadFile(buffer, options);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async downloadFile(
    hash: string,
    options: DownloadOptions = {}
  ): Promise<string | Blob> {
    try {
      this.ensureInitialized();

      const { decrypt = false, returnBlob = false } = options;

      console.log(`📥 Downloading file: ${hash}`);

      // Get file metadata to check if encrypted
      const metadata = await this.getFileMetadata(hash);
      const shouldDecrypt = decrypt && metadata?.encrypted;

      // Download from IPFS
      const data = await this.downloadFromIPFS(hash);

      if (!data) {
        throw new Error("File not found on IPFS");
      }

      // Decrypt if needed
      if (shouldDecrypt) {
        console.log("🔐 Decrypting file with SEA...");
        const decrypted = await this.decryptData(data);

        if (returnBlob) {
          // Convert base64 to blob
          const base64 = decrypted.includes(",")
            ? decrypted.split(",")[1]
            : decrypted;
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new Blob([bytes]);
        }

        return decrypted;
      }

      if (returnBlob && typeof data === "string") {
        // Convert to blob
        return new Blob([data]);
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error downloading file:", error);
      throw error;
    }
  }

  async getFileMetadata(hash: string): Promise<FileMetadata | null> {
    // Check cache first
    if (this.fileCache.has(hash)) {
      return this.fileCache.get(hash)!;
    }

    // Try to load from Gun
    try {
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) return null;

      const user = gun.user();
      if (!user || !user.is) return null;

      const files = await this.getUserFilesFromGun();
      const metadata = files.find((f) => f.hash === hash);

      if (metadata) {
        this.fileCache.set(hash, metadata);
      }

      return metadata || null;
    } catch (error) {
      console.error("Error loading file metadata:", error);
      return null;
    }
  }

  async deleteFile(
    hash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.ensureInitialized();

      console.log(`🗑️ Deleting file: ${hash}`);

      // Try to unpin from IPFS
      const unpinned = await this.unpinFromIPFS(hash);
      if (unpinned) {
        console.log("✅ File unpinned from IPFS");
      } else {
        console.warn("⚠️  Could not unpin from IPFS (file may not be pinned)");
      }

      // Remove from Gun
      await this.removeFileMetadata(hash);

      // Update cache
      this.fileCache.delete(hash);

      console.log("✅ File deleted successfully");

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error deleting file:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getUserFiles(): Promise<FileMetadata[]> {
    try {
      return await this.getUserFilesFromGun();
    } catch (error) {
      console.error("Error getting user files:", error);
      return [];
    }
  }

  // ========================================================================
  // ENCRYPTION (uses SEA from SHIP-00)
  // ========================================================================

  async encryptData(
    data: string | Buffer,
    options: EncryptionOptions = {}
  ): Promise<string> {
    try {
      this.ensureInitialized();

      // Get SEA pair from SHIP-00
      const seaPair = this.identity.getKeyPair();
      if (!seaPair) {
        throw new Error("SEA keypair not available. User not authenticated.");
      }

      // Access crypto from Shogun Core
      const shogun = this.identity.getShogun();
      const crypto = shogun?.db?.crypto;
      if (!crypto) {
        throw new Error("Crypto not available from Shogun Core");
      }

      // Convert Buffer to string if needed
      const dataString =
        typeof data === "string" ? data : data.toString("base64");

      console.log(
        `🔐 Encrypting data with SEA (length: ${dataString.length})...`
      );

      // Use SEA encryption with user's keypair
      const encrypted = await crypto.encrypt(dataString, seaPair);

      console.log(`✅ Data encrypted with SEA`);

      return JSON.stringify(encrypted);
    } catch (error: any) {
      console.error("❌ Error encrypting data:", error);
      throw error;
    }
  }

  async decryptData(
    encryptedData: string,
    options: EncryptionOptions = {}
  ): Promise<string> {
    try {
      this.ensureInitialized();

      // Get SEA pair from SHIP-00
      const seaPair = this.identity.getKeyPair();
      if (!seaPair) {
        throw new Error("SEA keypair not available. User not authenticated.");
      }

      // Access crypto from Shogun Core
      const shogun = this.identity.getShogun();
      const crypto = shogun?.db?.crypto;
      if (!crypto) {
        throw new Error("Crypto not available from Shogun Core");
      }

      console.log(`🔓 Decrypting data with SEA...`);

      // Parse encrypted data
      const encrypted = JSON.parse(encryptedData);

      // Use SEA decryption with user's keypair
      const decrypted = await crypto.decrypt(encrypted, seaPair);

      console.log(`✅ Data decrypted with SEA (length: ${decrypted.length})`);

      return decrypted;
    } catch (error: any) {
      console.error("❌ Error decrypting data:", error);
      throw error;
    }
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  async isFileAccessible(hash: string): Promise<boolean> {
    try {
      if (
        !this.ipfsStorage ||
        typeof this.ipfsStorage.getMetadata !== "function"
      ) {
        return false;
      }

      // Try to get metadata
      const metadata = await this.ipfsStorage.getMetadata(hash);
      return !!metadata;
    } catch {
      return false;
    }
  }

  async getStorageStats(): Promise<{
    totalFiles: number;
    totalMB: number;
    encryptedFiles: number;
    plainFiles: number;
  }> {
    try {
      const files = await this.getUserFiles();
      const encrypted = files.filter((f) => f.encrypted);
      const plain = files.filter((f) => !f.encrypted);
      const totalMB = files.reduce((sum, f) => sum + f.sizeMB, 0);

      return {
        totalFiles: files.length,
        totalMB,
        encryptedFiles: encrypted.length,
        plainFiles: plain.length,
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return {
        totalFiles: 0,
        totalMB: 0,
        encryptedFiles: 0,
        plainFiles: 0,
      };
    }
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("SHIP-05 not initialized. Call initialize() first.");
    }
  }

  private async initializeIPFS(): Promise<void> {
    try {
      const service = this.config.ipfsService;

      // Build config for shogun-ipfs (now supports all 3 services!)
      let serviceConfig: any = {};

      if (service === "PINATA") {
        serviceConfig = {
          pinataJwt: this.config.ipfsConfig?.pinataJwt,
          pinataGateway: this.config.ipfsConfig?.pinataGateway,
        } as PinataServiceConfig;
      } else if (service === "IPFS-CLIENT") {
        serviceConfig = {
          url: this.config.ipfsConfig?.url || "http://localhost:5001",
        } as IpfsServiceConfig;
      } else if (service === "CUSTOM") {
        serviceConfig = {
          url: this.config.ipfsConfig?.customApiUrl || "https://ipfs.io",
          token: this.config.ipfsConfig?.customToken,
        };
      }

      const config: ShogunIpfsConfig = {
        service: service as ShogunIpfsServices,
        config: serviceConfig,
      };

      console.log("🔧 Initializing shogun-ipfs with config:", config);

      // Initialize shogun-ipfs (returns StorageService)
      // Supports PINATA, IPFS-CLIENT, and CUSTOM!
      this.ipfsStorage = ShogunIpfs(config);

      console.log("✅ shogun-ipfs initialized");
    } catch (error) {
      console.warn(
        "⚠️ shogun-ipfs initialization failed, using fallback methods"
      );
      console.warn("   Error:", error);
      // Set to null so fallback is used
      this.ipfsStorage = null;
    }
  }

  private async uploadToIPFS(data: File | Buffer): Promise<string | null> {
    try {
      // Try shogun-ipfs first (now supports uploadBuffer for all services!)
      if (this.ipfsStorage && typeof this.ipfsStorage.uploadBuffer === 'function') {
        try {
          console.log("📤 Uploading via shogun-ipfs...");
          const buffer = data instanceof File ? Buffer.from(await data.arrayBuffer()) : data;
          const result = await this.ipfsStorage.uploadBuffer(buffer, {
            filename: data instanceof File ? data.name : "file.bin"
          });
          console.log(`✅ Upload successful via shogun-ipfs: ${result.id}`);
          return result.id;
        } catch (error) {
          console.warn("⚠️ shogun-ipfs upload failed, using fallback:", error);
          // Continue to fallback
        }
      }
      
      // Fallback: direct API calls
      console.log("📤 Uploading via direct API fallback...");
      return await this.uploadToIPFSFallback(data);
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      return null;
    }
  }

  private async uploadToIPFSFallback(
    data: File | Buffer
  ): Promise<string | null> {
    try {
      const service = this.config.ipfsService;

      // Check if running in Node.js or browser
      const isNode = typeof window === "undefined";

      if (service === "PINATA" && this.config.ipfsConfig?.pinataJwt) {
        // Pinata upload
        if (isNode) {
          // Node.js environment
          const FormData = require("form-data");
          const formData = new FormData();
          formData.append("file", data, { filename: "file" });

          const response = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.config.ipfsConfig.pinataJwt}`,
                ...formData.getHeaders(),
              },
              body: formData as any,
            }
          );

          const result = await response.json();
          return result.IpfsHash;
        } else {
          // Browser environment
          const formData = new FormData();
          let blob: Blob;
          if (data instanceof File) {
            blob = data;
          } else {
            // Convert Buffer to Uint8Array for browser
            blob = new Blob([new Uint8Array(data)]);
          }
          formData.append("file", blob);

          const response = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.config.ipfsConfig.pinataJwt}`,
              },
              body: formData,
            }
          );

          const result = await response.json();
          return result.IpfsHash;
        }
      } else if (service === "IPFS-CLIENT") {
        // IPFS node upload
        const url = this.config.ipfsConfig?.url || "http://localhost:5001";

        if (isNode) {
          const FormData = require("form-data");
          const formData = new FormData();
          formData.append("file", data);

          const response = await fetch(`${url}/api/v0/add`, {
            method: "POST",
            headers: formData.getHeaders(),
            body: formData as any,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IPFS upload failed (${response.status}): ${errorText}`);
          }

          const responseText = await response.text();
          
          // Try to parse JSON response
          let result: any;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error("❌ Response is not JSON:", responseText.substring(0, 200));
            throw new Error(`Invalid IPFS response: ${responseText.substring(0, 100)}`);
          }
          
          return result.Hash;
        } else {
          const formData = new FormData();
          let blob: Blob;
          if (data instanceof File) {
            blob = data;
          } else {
            blob = new Blob([new Uint8Array(data)]);
          }
          formData.append("file", blob);

          const response = await fetch(`${url}/api/v0/add`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          return result.Hash;
        }
      } else if (service === "CUSTOM") {
        // Custom API - generic IPFS endpoint support
        let apiUrl = this.config.ipfsConfig?.customApiUrl || "https://ipfs.io";
        // Remove trailing slash to avoid double slashes
        apiUrl = apiUrl.replace(/\/+$/, '');
        
        const token = this.config.ipfsConfig?.customToken;

        if (isNode) {
          // Use http.request with form-data for Node.js
          const https = require('https');
          const http = require('http');
          const FormData = require("form-data");
          const { URL } = require('url');
          
          const filename = data instanceof Buffer ? "encrypted-file.bin" : "file.bin";
          
          console.log(`📦 Preparing upload:`);
          console.log(`   Data type: ${data instanceof Buffer ? 'Buffer' : typeof data}`);
          console.log(`   Data length: ${data instanceof Buffer ? data.length : (data as File).size || 'unknown'}`);
          console.log(`   Filename: ${filename}`);
          
          // Helper to try upload with specific endpoint
          const tryUpload = (endpoint: string): Promise<string> => {
            return new Promise((resolve, reject) => {
              const fullUrl = `${apiUrl}${endpoint}`;
              const parsedUrl = new URL(fullUrl);
              const isHttps = parsedUrl.protocol === 'https:';
              const httpModule = isHttps ? https : http;
              
              const formData = new FormData();
              formData.append("file", data, { 
                filename: filename,
                contentType: "application/octet-stream"
              });

              const headers = formData.getHeaders();
              if (token) {
                headers["Authorization"] = `Bearer ${token}`;
                headers["token"] = token;
              }

              console.log(`📡 Trying ${fullUrl}...`);

              const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'POST',
                headers: headers
              };

              const request = httpModule.request(options, (response: any) => {
                let responseData = '';
                response.on('data', (chunk: any) => responseData += chunk);
                response.on('end', () => {
                  console.log(`📡 ${endpoint} response: ${response.statusCode}`);
                  
                  if (response.statusCode === 200) {
                    try {
                      const result = JSON.parse(responseData);
                      // Support multiple response formats
                      const hash = result.file?.hash || result.hash || result.Hash || result.cid || result.IpfsHash;
                      if (hash) {
                        resolve(hash);
                      } else {
                        reject(new Error(`No hash in response from ${endpoint}`));
                      }
                    } catch (parseError) {
                      reject(new Error(`Invalid JSON from ${endpoint}: ${responseData.substring(0, 100)}`));
                    }
                  } else {
                    reject(new Error(`${endpoint} failed (${response.statusCode}): ${responseData.substring(0, 100)}`));
                  }
                });
              });

              request.on('error', (error: any) => reject(error));
              formData.pipe(request);
            });
          };

          // Try common IPFS endpoints in order
          const endpoints = [
            '/upload',           // Relay-style endpoint
            '/api/v0/add',       // Standard IPFS API
            '/add',              // Simplified IPFS endpoint
          ];

          for (const endpoint of endpoints) {
            try {
              const hash = await tryUpload(endpoint);
              console.log(`✅ Upload successful via ${endpoint}! Hash: ${hash}`);
              return hash;
            } catch (error: any) {
              console.log(`⚠️  ${endpoint} failed: ${error.message}`);
              // Try next endpoint
            }
          }

          throw new Error('All upload endpoints failed. Check API URL and token.');
        } else {
          // Browser environment
          let apiUrl = this.config.ipfsConfig?.customApiUrl || "https://ipfs.io";
          apiUrl = apiUrl.replace(/\/+$/, ''); // Remove trailing slash
          
          const formData = new FormData();
          let blob: Blob;
          if (data instanceof File) {
            blob = data;
          } else {
            // Convert Buffer to Uint8Array for browser
            blob = new Blob([new Uint8Array(data)]);
          }
          formData.append("file", blob);

          const headers: any = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            headers["token"] = token; // shogun-relay also checks 'token' header
          }

          // Try /upload first
          let response = await fetch(`${apiUrl}/upload`, {
            method: "POST",
            headers,
            body: formData,
          });

          // Fallback to /add (with auth headers!)
          if (!response.ok) {
            const headers2: any = {};
            if (token) {
              headers2["Authorization"] = `Bearer ${token}`;
              headers2["token"] = token;
            }
            
            response = await fetch(`${apiUrl}/add`, {
              method: "POST",
              headers: headers2,
              body: formData,
            });
          }

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText.substring(0, 200)}`);
          }

          const responseText = await response.text();
          
          // Try to parse JSON
          let result: any;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error("❌ Response is not JSON:", responseText.substring(0, 200));
            throw new Error(`Invalid response: ${responseText.substring(0, 100)}`);
          }
          return (
            result.hash ||
            result.Hash ||
            result.cid ||
            result.ipfsHash ||
            result.IpfsHash
          );
        }
      }

      throw new Error(`Unsupported IPFS service: ${service}`);
    } catch (error: any) {
      console.error("Fallback upload failed:", error);
      console.error("💡 Consider installing shogun-ipfs: yarn add shogun-ipfs");
      throw error;
    }
  }

  private async unpinFromIPFS(hash: string): Promise<boolean> {
    try {
      console.log(`📍 Unpinning ${hash} from IPFS...`);

      // Try shogun-ipfs first (now supports CUSTOM gateway!)
      if (this.ipfsStorage && typeof this.ipfsStorage.unpin === "function") {
        try {
          const unpinned = await this.ipfsStorage.unpin(hash);
          if (unpinned) {
            console.log("✅ File unpinned via shogun-ipfs");
            return true;
          } else {
            console.log("ℹ️  File not found or already unpinned");
            return false;
          }
        } catch (error) {
          console.warn("⚠️ shogun-ipfs unpin failed, using fallback");
        }
      }

      const service = this.config.ipfsService;
      const isNode = typeof window === "undefined";

      // Fallback: use API directly
      if (service === "CUSTOM" && this.config.ipfsConfig?.customApiUrl) {
        const baseUrl = this.config.ipfsConfig.customApiUrl.replace(/\/+$/, '');
        const token = this.config.ipfsConfig?.customToken;

        if (isNode) {
          // Node.js - use http.request
          const https = require('https');
          const http = require('http');
          const { URL } = require('url');
          
          const fullUrl = `${baseUrl}/pins/rm`;
          const parsedUrl = new URL(fullUrl);
          const isHttps = parsedUrl.protocol === 'https:';
          const httpModule = isHttps ? https : http;
          
          return new Promise<boolean>((resolve) => {
            console.log(`📡 Unpinning via ${fullUrl}...`);
            
            const postData = JSON.stringify({ cid: hash });
            
            const options = {
              hostname: parsedUrl.hostname,
              port: parsedUrl.port || (isHttps ? 443 : 80),
              path: parsedUrl.pathname,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              } as any
            };
            
            if (token) {
              options.headers["Authorization"] = `Bearer ${token}`;
              options.headers["token"] = token;
            }
            
            const request = httpModule.request(options, (response: any) => {
              let data = '';
              response.on('data', ( chunk: any) => data += chunk);
              response.on('end', () => {
                if (response.statusCode === 200) {
                  console.log(`✅ Unpinned successfully`);
                  resolve(true);
                } else {
                  console.warn(`⚠️  Unpin failed (${response.statusCode}): ${data.substring(0, 100)}`);
                  resolve(false);
                }
              });
            });
            
            request.on('error', (error: any) => {
              console.warn(`⚠️  Unpin request error:`, error.message);
              resolve(false);
            });
            
            request.write(postData);
            request.end();
          });
        } else {
          // Browser - use fetch
          const fullUrl = `${baseUrl}/pins/rm`;
          console.log(`📡 Unpinning via ${fullUrl}...`);
          
          const headers: any = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            headers["token"] = token;
          }
          
          try {
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ cid: hash })
            });
            
            if (response.ok) {
              console.log(`✅ Unpinned successfully`);
              return true;
            } else {
              console.warn(`⚠️  Unpin failed (${response.status})`);
              return false;
            }
          } catch (error: any) {
            console.warn(`⚠️  Unpin error:`, error.message);
            return false;
          }
        }
      } else if (service === "IPFS-CLIENT") {
        // Standard IPFS API unpin
        const url = this.config.ipfsConfig?.url || "http://localhost:5001";
        
        try {
          const response = await fetch(`${url}/api/v0/pin/rm?arg=${hash}`, {
            method: 'POST'
          });
          return response.ok;
        } catch (error) {
          console.warn("⚠️  IPFS unpin error:", error);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Error unpinning from IPFS:", error);
      return false;
    }
  }

  private async downloadFromIPFS(hash: string): Promise<string | null> {
    try {
      // Try shogun-ipfs first (now supports CUSTOM gateway!)
      if (this.ipfsStorage && typeof this.ipfsStorage.get === 'function') {
        try {
          console.log("📥 Downloading via shogun-ipfs...");
          const result = await this.ipfsStorage.get(hash);
          console.log("✅ Download successful via shogun-ipfs");
          return typeof result.data === "string" ? result.data : JSON.stringify(result.data);
        } catch (error) {
          console.warn("⚠️ shogun-ipfs download failed, using fallback:", error);
          // Continue to fallback
        }
      }

      // Fallback: use configured gateway or public IPFS
      console.log("⚠️  Using fallback IPFS download");

      const service = this.config.ipfsService;
      const token = this.config.ipfsConfig?.customToken;

      if (service === "PINATA" && this.config.ipfsConfig?.pinataGateway) {
        // Pinata gateway (public, no auth needed)
        const gatewayUrl = `${this.config.ipfsConfig.pinataGateway}/ipfs/${hash}`;
        console.log(`📥 Downloading from Pinata: ${gatewayUrl}`);
        const response = await fetch(gatewayUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
        
      } else if (service === "IPFS-CLIENT") {
        // IPFS node API
        const url = this.config.ipfsConfig?.url || "http://localhost:5001";
        const gatewayUrl = `${url}/api/v0/cat?arg=${hash}`;
        console.log(`📥 Downloading from IPFS node: ${gatewayUrl}`);
        
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const response = await fetch(gatewayUrl, { 
          method: 'POST',
          headers 
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
        
      } else if (service === "CUSTOM" && this.config.ipfsConfig?.customApiUrl) {
        // Custom gateway/relay - try multiple endpoints
        const baseUrl = this.config.ipfsConfig.customApiUrl.replace(/\/+$/, '');
        const isNode = typeof window === "undefined";
        
        const endpoints = [
          { path: `/content/${hash}`, method: 'GET' },      // Relay format
          { path: `/ipfs/${hash}`, method: 'GET' },         // Gateway format
          { path: `/api/v0/cat?arg=${hash}`, method: 'POST' } // IPFS API format
        ];
        
        if (isNode) {
          // Use http.request for Node.js (more reliable than fetch)
          const https = require('https');
          const http = require('http');
          const { URL } = require('url');
          
          for (const endpoint of endpoints) {
            try {
              const fullUrl = `${baseUrl}${endpoint.path}`;
              const parsedUrl = new URL(fullUrl);
              const isHttps = parsedUrl.protocol === 'https:';
              const httpModule = isHttps ? https : http;
              
              const result = await new Promise<string>((resolve, reject) => {
                console.log(`📥 Trying ${fullUrl}...`);
                
                const options = {
                  hostname: parsedUrl.hostname,
                  port: parsedUrl.port || (isHttps ? 443 : 80),
                  path: parsedUrl.pathname + parsedUrl.search,
                  method: endpoint.method,
                  headers: {} as any
                };
                
                if (token) {
                  options.headers["Authorization"] = `Bearer ${token}`;
                  options.headers["token"] = token;
                }
                
                if (endpoint.method === 'POST') {
                  options.headers["Content-Length"] = "0";
                }
                
                const request = httpModule.request(options, (response: any) => {
                  let data = '';
                  response.on('data', (chunk: any) => data += chunk);
                  response.on('end', () => {
                    if (response.statusCode === 200) {
                      console.log(`✅ Download successful via ${endpoint.path}`);
                      resolve(data);
                    } else {
                      reject(new Error(`HTTP ${response.statusCode}`));
                    }
                  });
                });
                
                request.on('error', (error: any) => reject(error));
                request.end();
              });
              
              return result;
            } catch (error: any) {
              console.log(`⚠️  ${endpoint.path} failed: ${error.message}`);
            }
          }
          
          throw new Error('All download endpoints failed');
        } else {
          // Browser - use fetch
          for (const endpoint of endpoints) {
            try {
              const url = `${baseUrl}${endpoint.path}`;
              console.log(`📥 Trying download from: ${url}`);
              
              const headers: any = {};
              if (token) {
                headers["Authorization"] = `Bearer ${token}`;
                headers["token"] = token;
              }
              
              const response = await fetch(url, { 
                method: endpoint.method,
                headers 
              });
              
              if (response.ok) {
                console.log(`✅ Download successful via ${endpoint.path}`);
                return await response.text();
              } else {
                console.log(`⚠️  ${endpoint.path} failed (${response.status})`);
              }
            } catch (error: any) {
              console.log(`⚠️  ${endpoint.path} error: ${error.message}`);
            }
          }
          
          throw new Error('All download endpoints failed');
        }
        
      } else {
        // Default public gateway
        const gatewayUrl = `https://ipfs.io/ipfs/${hash}`;
        console.log(`📥 Downloading from public gateway: ${gatewayUrl}`);
        const response = await fetch(gatewayUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
      }
    } catch (error) {
      console.error("Error downloading from IPFS:", error);
      return null;
    }
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    try {
      // Save to Gun
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) {
        console.warn("Gun not available, metadata not persisted");
        return;
      }

      const user = gun.user();
      if (!user || !user.is) {
        console.warn("User not authenticated on Gun");
        return;
      }

      // Get current files
      const files = await this.getUserFilesFromGun();
      files.push(metadata);

      // Save updated list
      await user.get(SHIP_05.NODES.USER_FILES).put(JSON.stringify(files));

      // Update cache
      this.fileCache.set(metadata.hash, metadata);

      console.log("✅ File metadata saved to GunDB");
    } catch (error) {
      console.error("Error saving file metadata:", error);
    }
  }

  private async removeFileMetadata(hash: string): Promise<void> {
    try {
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) return;

      const user = gun.user();
      if (!user || !user.is) return;

      // Get current files
      const files = await this.getUserFilesFromGun();

      // Remove the file
      const updatedFiles = files.filter((f) => f.hash !== hash);

      // Save updated list
      await user
        .get(SHIP_05.NODES.USER_FILES)
        .put(JSON.stringify(updatedFiles));

      console.log("✅ File metadata removed from GunDB");
    } catch (error) {
      console.error("Error removing file metadata:", error);
    }
  }

  private async getUserFilesFromGun(): Promise<FileMetadata[]> {
    try {
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) return [];

      const user = gun.user();
      if (!user || !user.is) return [];

      const data = await new Promise<string | null>((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        }, 5000);

        user.get(SHIP_05.NODES.USER_FILES).once((data: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(data || null);
          }
        });
      });

      if (!data) return [];

      return JSON.parse(data) as FileMetadata[];
    } catch (error) {
      console.error("Error loading files from Gun:", error);
      return [];
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export { SHIP_05 };
