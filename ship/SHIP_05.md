# SHIP-05: Decentralized File Storage

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025-01-11  
> **Updated**: 2025-01-11

---

## Abstract

SHIP-05 defines a standard interface for decentralized encrypted file storage on IPFS. This protocol extends SHIP-00 to enable secure file storage using SEA encryption from the user's SHIP-00 identity.

**Key Features:**
- 🔐 Encrypted file upload using SEA (from SHIP-00)
- 📦 IPFS storage (Pinata, IPFS node, or custom gateway)
- 🗂️ File metadata management on GunDB
- 🔓 File download and decryption with SEA keypair
- 📊 Storage statistics
- 🔑 No additional passwords needed (uses SHIP-00 identity)

> **Note**: On-chain storage tracking (relay network, subscriptions, MB tracking) will be covered in **SHIP-06** (future proposal)

---

## Motivation

### Why SHIP-05?

Decentralized applications need reliable file storage, but existing solutions have limitations:

**Problems with existing approaches:**

- ❌ **Centralized Storage**: Files on single servers (vulnerable to censorship)
- ❌ **Complex IPFS**: Direct IPFS usage requires node management
- ❌ **No Encryption**: Most IPFS solutions don't encrypt by default
- ❌ **Key Management**: Users must remember encryption passwords
- ❌ **Poor Integration**: Identity separate from storage

**SHIP-05 solves this with:**

- ✅ **Decentralized**: IPFS storage (censorship-resistant)
- ✅ **Encrypted by Default**: Uses SEA encryption from SHIP-00
- ✅ **No Extra Passwords**: Uses same keypair as SHIP-00 identity
- ✅ **Identity Integration**: Seamless with SHIP-00 authentication
- ✅ **Simple API**: Easy to use, hard to misuse

### Architecture Benefits

```
SHIP-05 (Storage)
   ↓ depends on
SHIP-00 (Identity)
   ↓ provides
SEA Keypair → Encryption/Decryption
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              SHIP-05 STORAGE PROTOCOL                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │     IPFS     │    │  Encryption  │    │    GunDB     │  │
│  │   Storage    │    │   (SEA)      │    │  (Metadata)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. Get SEA keypair from SHIP-00                 │    │
│    │  2. Encrypt file with SEA                        │    │
│    │  3. Upload to IPFS                               │    │
│    │  4. Save metadata on GunDB                       │    │
│    │  5. Download and decrypt with same SEA pair      │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology       | Role                                |
| ------------------ | ---------------- | ----------------------------------- |
| **Storage**        | IPFS             | Decentralized file storage          |
| **Encryption**     | GUN SEA          | File encryption with user keypair   |
| **Metadata**       | GunDB            | File metadata storage               |
| **Identity**       | SHIP-00          | Authentication & keypair provider   |

### GunDB Node Structure

```typescript
SHIP_05.NODES = {
  USER_FILES: "user_files",        // User's file metadata (in user space)
}
```

**Note**: Nodes are stored in user's private space (`gun.user().get("user_files")`), so no namespace conflicts.

---

## Core Interface

```typescript
/**
 * SHIP-05: Decentralized File Storage Interface
 */
interface ISHIP_05 {
  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize storage system
   * @param options Configuration options
   */
  initialize(options?: SHIP_05_Config): Promise<void>;

  /**
   * Check if initialized
   */
  isInitialized(): boolean;

  /**
   * Get underlying identity provider
   */
  getIdentity(): ISHIP_00;

  // ============================================
  // FILE OPERATIONS
  // ============================================

  /**
   * Upload file to IPFS
   * @param file File or Buffer to upload
   * @param options Upload options (encrypt, pin, metadata)
   * @returns Upload result with IPFS hash
   */
  uploadFile(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Upload JSON data to IPFS
   * @param data JSON object
   * @param options Upload options
   */
  uploadJson(
    data: any,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Download file from IPFS
   * @param hash IPFS hash
   * @param options Download options (decrypt, returnBlob)
   */
  downloadFile(
    hash: string,
    options?: DownloadOptions
  ): Promise<string | Blob>;

  /**
   * Get file metadata
   * @param hash IPFS hash
   */
  getFileMetadata(hash: string): Promise<FileMetadata | null>;

  /**
   * Delete file from IPFS
   * @param hash IPFS hash
   */
  deleteFile(hash: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Get all user files
   */
  getUserFiles(): Promise<FileMetadata[]>;

  // ============================================
  // ENCRYPTION
  // ============================================

  /**
   * Generate deterministic encryption key
   * @param options Key derivation options
   * @returns Encryption key
   */
  generateEncryptionKey(options?: KeyDerivationOptions): Promise<string>;

  /**
   * Encrypt data
   * @param data Data to encrypt
   * @param key Encryption key
   */
  encryptData(data: string | Buffer, key: string): Promise<string>;

  /**
   * Decrypt data
   * @param encryptedData Encrypted data
   * @param key Encryption key
   */
  decryptData(encryptedData: string, key: string): Promise<string>;

  // ============================================
  // RELAY MANAGEMENT
  // ============================================

  /**
   * Get available storage relays
   */
  getAvailableRelays(): Promise<RelayInfo[]>;

  /**
   * Get current relay
   */
  getCurrentRelay(): RelayInfo | null;

  /**
   * Select relay for operations
   * @param relayAddress Relay contract address
   */
  selectRelay(relayAddress: string): Promise<void>;

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  /**
   * Subscribe to relay
   * @param relayAddress Relay to subscribe to
   * @param mb MB to purchase
   */
  subscribeToRelay(
    relayAddress: string,
    mb: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }>;

  /**
   * Add MB to existing subscription
   * @param relayAddress Relay address
   * @param mb Additional MB
   */
  addMBToSubscription(
    relayAddress: string,
    mb: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }>;

  /**
   * Get subscription status
   * @param userAddress Optional user address
   */
  getSubscriptionStatus(
    userAddress?: string
  ): Promise<SubscriptionStatus | null>;

  /**
   * Calculate subscription cost
   * @param mb Amount of MB
   */
  calculateSubscriptionCost(mb: number): Promise<string>;

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Sync MB usage with relay
   */
  syncMBUsage(): Promise<{ mbUsed: number; fileCount: number }>;

  /**
   * Sync with blockchain contract
   */
  syncWithContract(): Promise<void>;

  /**
   * Check if file is accessible
   * @param hash IPFS hash
   */
  isFileAccessible(hash: string): Promise<boolean>;

  /**
   * Get storage statistics
   */
  getStorageStats(): Promise<{
    totalFiles: number;
    totalMB: number;
    encryptedFiles: number;
    plainFiles: number;
  }>;
}
```

---

## Scope & Separation of Concerns

### SHIP-05: Core Storage (This Specification)

**Focus**: Encrypted file storage primitives

✅ **Includes:**
- File encryption/decryption with SEA (uses SHIP-00 keypair)
- IPFS upload/download
- File metadata management on GunDB
- Basic file operations (CRUD)

❌ **Does NOT include:**
- Smart contract interactions
- Payment/subscription systems
- Relay network management
- On-chain storage tracking
- Fee distribution

### SHIP-06: On-Chain Storage Tracking (Future Proposal)

**Focus**: Payment and governance layer for storage

💡 **Will include:**
- Smart contract relay registry
- Subscription management (on-chain payments)
- MB usage tracking (on-chain state)
- Relay discovery and selection
- Fee distribution to relay operators
- Storage quota enforcement

**Why separate?**

1. **Modularity**: SHIP-05 works standalone without blockchain
2. **Flexibility**: Can use different payment systems (SHIP-06, Lightning, etc.)
3. **Simplicity**: SHIP-05 has single responsibility (encryption + IPFS)
4. **Reusability**: SHIP-05 can be used in any context (with or without payments)

```
SHIP-05 (Base Storage) ✅
   ↓ can be extended by
SHIP-06 (On-Chain Tracking) 💡
```

---

## Security

### 1. SEA Encryption (from SHIP-00)

**Encryption using User's SEA Keypair:**

```typescript
// Step 1: Get SEA pair from SHIP-00
const seaPair = identity.getKeyPair();
// seaPair = { pub, priv, epub, epriv }

// Step 2: Access crypto from Shogun Core
const crypto = shogun.db.crypto;

// Step 3: Encrypt data with user's SEA pair
const encrypted = await crypto.encrypt(data, seaPair);

// Step 4: Only the user with this SEA pair can decrypt
const decrypted = await crypto.decrypt(encrypted, seaPair);
```

**Security Properties:**

- ✅ **User-Bound**: Only user with SEA keypair can decrypt
- ✅ **No Extra Password**: Uses same identity as SHIP-00
- ✅ **AES-256-GCM**: SEA uses industry-standard encryption
- ✅ **Recoverable**: As long as you have SHIP-00 identity, you can decrypt

### 2. File Encryption

**Encryption Flow:**

```typescript
// 1. Convert file to base64
const base64 = await fileToBase64(file);

// 2. Encrypt with SEA (uses SHIP-00 keypair automatically)
const encrypted = await storage.encryptData(base64);

// 3. Upload encrypted data to IPFS
const result = await storage.uploadFile(file, { encrypt: true });
```

**Properties:**

- ✅ **End-to-End**: Files encrypted before leaving device
- ✅ **Private**: Only wallet owner can decrypt
- ✅ **IPFS Native**: Works with any IPFS gateway
- ✅ **Metadata Preserved**: File info stored on GunDB

### 3. Access Control

**File Sharing (Future Enhancement):**

```typescript
// Share file with another user (planned for SHIP-05.1)
await storage.shareFile(hash, recipientPub, {
  permissions: ['read'],
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

---

## Implementation

### Quick Start

```bash
# Install dependencies
cd shogun-core
yarn install

# Interactive CLI demo
yarn storage alice password123

# Use in your app
import { SHIP_00, SHIP_05 } from 'shogun-core';
```

### CLI Usage

```bash
# Auto-login mode
yarn storage alice password123

# Manual login mode
yarn storage

# Menu options:
1. Upload File (Encrypted)  - Upload file with SEA encryption
2. Download File            - Download and decrypt file
3. View Your Files          - List all uploaded files
4. Delete File              - Remove file from IPFS
5. Storage Statistics       - View usage stats
6. Test Encryption System   - Test SEA encryption
7. Change IPFS Service      - Switch between Pinata/IPFS/Custom
8. Logout                   - End session
9. Exit                     - Close application
```

### Complete Example

```typescript
import { SHIP_00 } from "./implementation/SHIP_00";
import { SHIP_05 } from "./implementation/SHIP_05";
import { ethers } from "ethers";

// ============================================
// 1. SETUP
// ============================================

// Initialize identity (SHIP-00)
const identity = new SHIP_00({
  gunOptions: {
    peers: ["https://peer.wallie.io/gun"],
    radisk: true,
  },
});

await identity.login("alice", "password123");

// Initialize storage (SHIP-05)
// No wallet needed - uses SEA keypair from identity!
const storage = new SHIP_05(identity, {
  ipfsService: "PINATA", // or "IPFS-CLIENT" or "CUSTOM"
  ipfsConfig: {
    pinataJwt: "your-pinata-jwt",
    pinataGateway: "https://gateway.pinata.cloud",
  },
  maxFileSizeMB: 100,
});

await storage.initialize();

// ============================================
// 2. FILE UPLOAD (ENCRYPTED)
// ============================================

const file = new File(["Hello, IPFS!"], "message.txt");

// Upload with encryption
const uploadResult = await storage.uploadFile(file, {
  encrypt: true,  // Encrypt with SEA (from SHIP-00)
  pin: true,      // Pin to IPFS
});

console.log("File uploaded:");
console.log(`  Hash: ${uploadResult.hash}`);
console.log(`  Size: ${uploadResult.size} bytes`);
console.log(`  Encrypted: ${uploadResult.encrypted}`);

// ============================================
// 5. FILE DOWNLOAD (DECRYPTED)
// ============================================

// Download and decrypt
const data = await storage.downloadFile(uploadResult.hash!, {
  decrypt: true,
  returnBlob: false,
});

console.log("File downloaded and decrypted:");
console.log(data);

// ============================================
// 6. FILE MANAGEMENT
// ============================================

// List all files
const files = await storage.getUserFiles();

console.log(`You have ${files.length} files:`);
files.forEach(file => {
  console.log(`  ${file.name} - ${file.sizeMB} MB - ${file.encrypted ? '🔒' : '📄'}`);
});

// Get storage stats
const stats = await storage.getStorageStats();
console.log(`Total: ${stats.totalMB} MB in ${stats.totalFiles} files`);
console.log(`Encrypted: ${stats.encryptedFiles}, Plain: ${stats.plainFiles}`);

// ============================================
// 7. DELETE FILE
// ============================================

const deleteResult = await storage.deleteFile(uploadResult.hash!);
if (deleteResult.success) {
  console.log("File deleted successfully");
}

// ============================================
// 8. MB USAGE SYNC
// ============================================

// Sync MB usage with relay
const usage = await storage.syncMBUsage();
console.log(`MB used: ${usage.mbUsed} (${usage.fileCount} files)`);

// Sync with blockchain contract
await storage.syncWithContract();
```

---

## Encryption Deep Dive

### SEA Encryption (from SHIP-00)

SHIP-05 uses GUN SEA encryption with the user's SHIP-00 keypair:

```typescript
/**
 * Encryption Process:
 * 
 * 1. Get SEA pair from SHIP-00 (pub, priv, epub, epriv)
 * 2. Use SEA.encrypt(data, pair) - AES-256-GCM encryption
 * 3. SEA handles key derivation internally
 * 4. Encrypted data can only be decrypted with same SEA pair
 * 
 * Result: Same SHIP-00 identity → can decrypt (always)
 */

// Get SEA pair from authenticated SHIP-00 identity
const seaPair = identity.getKeyPair();

// Encrypt file data
const encrypted = await crypto.encrypt(fileData, seaPair);

// Only user with same SEA keypair can decrypt
const decrypted = await crypto.decrypt(encrypted, seaPair);
```

**Benefits:**

- ✅ **No Extra Setup**: Uses existing SHIP-00 keypair
- ✅ **Proven Crypto**: SEA uses AES-256-GCM
- ✅ **Secure**: Only identity owner can decrypt
- ✅ **Recoverable**: Backup SHIP-00 keypair = recover all files

**Security Note:**

- 🔐 Encryption uses SEA keypair from SHIP-00
- 🔐 Must be logged in with same identity to decrypt
- 🔐 Losing SHIP-00 keypair = losing access to encrypted files
- 🔐 **IMPORTANT**: Backup your SHIP-00 keypair (see SHIP-00 `exportKeyPair()`)

---

## Relay Network

### Relay Smart Contract

SHIP-05 uses an on-chain payment system for storage:

```solidity
// RelayPaymentRouter.sol (simplified)
contract RelayPaymentRouter {
    // Relay registration
    function registerRelay(string memory url) external;
    
    // Subscription
    function subscribeToRelay(address relay) external payable;
    function addMBToSubscription(address relay) external payable;
    
    // Queries
    function getSubscriptionDetails(address user, address relay) 
        external view returns (
            uint256 startTime,
            uint256 endTime, 
            uint256 amountPaid,
            uint256 mbAllocated,
            bool isActive
        );
    
    // Pricing
    function calculateAmountFromMB(uint256 mb) 
        external view returns (uint256);
}
```

### Relay Discovery

```typescript
// Get all available relays
const relays = await storage.getAvailableRelays();

// Each relay provides:
interface RelayInfo {
  address: string;         // Contract address
  name: string;            // Relay name
  url: string;             // API endpoint
  pricePerGB: string;      // Price in ETH
  isActive: boolean;       // Status
  totalSubscribers: number;
}
```

### Subscription Management

```typescript
// Subscribe for 100 MB storage
const result = await storage.subscribeToRelay(relay.address, 100);

// Check status
const status = await storage.getSubscriptionStatus();
console.log(`Remaining: ${status.mbRemaining} MB`);
console.log(`Days left: ${status.daysRemaining}`);

// Add more storage
await storage.addMBToSubscription(relay.address, 50);
```

---

## Use Cases

### 1. Encrypted Profile Pictures

```typescript
// Upload profile picture (encrypted)
const avatar = document.getElementById('avatar').files[0];

const result = await storage.uploadFile(avatar, {
  encrypt: true,
  metadata: { type: 'avatar' }
});

// Save IPFS hash to user profile
await gun.user().get('profile').put({
  avatar: result.hash,
  avatarEncrypted: true
});

// Later: Download and decrypt
const avatarData = await storage.downloadFile(result.hash, {
  decrypt: true,
  returnBlob: true
});

// Display in UI
const url = URL.createObjectURL(avatarData);
document.getElementById('avatar-img').src = url;
```

### 2. Document Management

```typescript
// Upload encrypted documents
class DocumentManager {
  constructor(private storage: ISHIP_05) {}

  async uploadDocument(file: File, tags: string[]) {
    const result = await this.storage.uploadFile(file, {
      encrypt: true,
      metadata: {
        tags,
        uploadedBy: this.storage.getIdentity().getCurrentUser()?.alias
      }
    });

    return result.hash;
  }

  async downloadDocument(hash: string) {
    return await this.storage.downloadFile(hash, { decrypt: true });
  }

  async listDocuments(tag?: string) {
    const files = await this.storage.getUserFiles();
    
    if (tag) {
      return files.filter(f => 
        f.metadata?.tags?.includes(tag)
      );
    }
    
    return files;
  }
}
```

### 3. NFT Metadata Storage

```typescript
// Store NFT metadata on IPFS
const metadata = {
  name: "Shogun Warrior #1",
  description: "A legendary warrior",
  image: "ipfs://...",
  attributes: [
    { trait_type: "Strength", value: 95 },
    { trait_type: "Speed", value: 87 }
  ]
};

// Upload to IPFS (not encrypted for public NFTs)
const result = await storage.uploadJson(metadata, {
  encrypt: false,
  pin: true
});

// Use in NFT contract
const tokenURI = `ipfs://${result.hash}`;
await nftContract.mint(tokenURI);
```

---

## Testing

### Interactive CLI

```bash
# Terminal 1: Alice uploads files
yarn storage alice password123

🗡️  SHIP-05 Storage Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Upload File (Encrypted)
2. Download File
3. View Your Files
4. Delete File
5. View Available Relays
6. View Subscription Status
7. Subscribe to Relay
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Alice subscribes
Choose option: 7

Available relays:
1. relay.shogun-eco.xyz - 0.001 ETH/GB

Select relay: 1
Enter MB to purchase: 100

💰 Cost: 0.1 ETH for 100 MB
Confirm subscription? yes

✅ Subscription Created!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TX Hash: 0x...
  Storage: 100 MB
  Relay: relay.shogun-eco.xyz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Alice uploads a file
Choose option: 1

Enter file path: ./secret-document.pdf
Encrypt file? (y/n): y

✅ Upload Successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IPFS Hash: QmXg9Pp2ytZ6xLMB...
  Size: 2.5 MB
  Encrypted: YES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Relationship with Other SHIPs

### SHIP-05 Depends on SHIP-00

```typescript
// SHIP-05 uses SHIP-00 for:
// 1. User authentication
// 2. GunDB access for metadata
// 3. Wallet signature for encryption

class SHIP_05 {
  constructor(private identity: ISHIP_00) {
    // SHIP-00 must be authenticated
    if (!identity.isLoggedIn()) {
      throw new Error('SHIP-00 authentication required');
    }
  }

  async uploadFile(file: File, options: UploadOptions) {
    // Get SEA pair from SHIP-00 for encryption
    const seaPair = this.identity.getKeyPair();
    
    // Encrypt with SEA if requested
    if (options.encrypt) {
      const encrypted = await this.encryptData(fileData); // Uses SEA
    }
    
    // ... upload logic
  }
}
```

### Standalone Usage

```typescript
// SHIP-05 only needs SHIP-00 (no SHIP-02 required!)
import { SHIP_00, SHIP_05 } from 'shogun-core';

const identity = new SHIP_00(config);
await identity.login('alice', 'password123');

// Initialize storage - uses SEA from identity automatically
const storage = new SHIP_05(identity, {
  ipfsService: 'PINATA',
  ipfsConfig: {
    pinataJwt: 'your-jwt',
  },
  maxFileSizeMB: 100,
});

await storage.initialize();

// Upload encrypted file (SEA encryption automatic)
const result = await storage.uploadFile(file, { encrypt: true });
```

---

## Future Improvements

### SHIP-05.1 (Minor Updates)

- [ ] **Proper AES-256-GCM**: Replace base64 with real encryption
- [ ] **File Sharing**: Share files with other users (ECDH encryption)
- [ ] **Access Control**: Time-limited file access
- [ ] **Folder Support**: Organize files in folders
- [ ] **Batch Operations**: Upload/download multiple files
- [ ] **Compression**: Automatic file compression before upload

### SHIP-06: On-Chain Storage Tracking (New SHIP)

- [ ] **Relay Network**: Smart contract registry for storage providers
- [ ] **Subscriptions**: On-chain payment and quota management
- [ ] **MB Tracking**: On-chain storage usage tracking
- [ ] **Fee Distribution**: Automatic payment to relay operators
- [ ] **Relay Discovery**: Find and compare storage providers

### SHIP-05.2 (Next Version)

- [ ] **Streaming Upload**: Large file support with chunking
- [ ] **CDN Integration**: Content delivery optimization
- [ ] **Version Control**: File versioning and history
- [ ] **Collaborative Editing**: Real-time file collaboration

---

## Configuration

### Complete Configuration

```typescript
const config: SHIP_05_Config = {
  // IPFS service
  ipfsService: "PINATA", // or "IPFS-CLIENT" or "CUSTOM"
  
  // IPFS service config
  ipfsConfig: {
    pinataJwt: "your-pinata-jwt",
    pinataGateway: "https://gateway.pinata.cloud",
    // OR for IPFS node:
    // ipfsUrl: "http://localhost:5001"
    // OR for custom:
    // customApiUrl: "https://relay.example.com/api/v1"
  },

  // Options
  maxFileSizeMB: 100, // Max file size limit
};

// Initialize with SHIP-00 identity (provides SEA keypair)
const storage = new SHIP_05(identity, config);
await storage.initialize();
```

---

## API Reference

### Upload Methods

```typescript
// Upload file
uploadFile(file: File | Buffer, options?: UploadOptions): Promise<UploadResult>

// Upload JSON
uploadJson(data: any, options?: UploadOptions): Promise<UploadResult>

// Options
interface UploadOptions {
  encrypt?: boolean;       // Default: false
  pin?: boolean;           // Default: true
  metadata?: Record<string, any>;
}
```

### Download Methods

```typescript
// Download file
downloadFile(hash: string, options?: DownloadOptions): Promise<string | Blob>

// Options
interface DownloadOptions {
  decrypt?: boolean;       // Default: false
  returnBlob?: boolean;    // Default: false
}
```

### Subscription Methods

```typescript
// Subscribe
subscribeToRelay(relayAddress: string, mb: number): Promise<Result>

// Add MB
addMBToSubscription(relayAddress: string, mb: number): Promise<Result>

// Get status
getSubscriptionStatus(userAddress?: string): Promise<SubscriptionStatus | null>

// Calculate cost
calculateSubscriptionCost(mb: number): Promise<string>
```

---

## References

- **SHIP-00**: [SHIP_00.md](./SHIP_00.md)
- **Shogun Core API**: [../API.md](../API.md)
- **IPFS**: https://ipfs.io/
- **shogun-ipfs**: [../../shogun-ipfs/README.md](../../shogun-ipfs/README.md)
- **GunDB**: https://gun.eco/

---

## Authors

- **Shogun Team** - Initial work
- **Contributors** - See [GitHub Contributors](https://github.com/scobru/shogun-core/graphs/contributors)

---

## License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**SHIP-05: Decentralized File Storage**

_Encrypted, Scalable, Decentralized_

🗡️ Built with Shogun Core 🗡️

</div>

