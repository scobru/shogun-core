# SHIP-06: Secure Vault

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025-01-11  
> **Depends on**: [SHIP-00](./SHIP_00.md) (Identity & Authentication)  
> **Inspired by**: [Gunsafe](https://github.com/draeder/gunsafe)

---

## Abstract

SHIP-06 defines a standard for **secure encrypted vault** storage on GunDB. It provides a decentralized, encrypted key-value store where users can securely store sensitive data such as passwords, private keys, API tokens, and other confidential information. All data is encrypted using Gun's SEA suite before storage, ensuring privacy and security.

**Key Features**:
- ✅ End-to-end encrypted storage on GunDB
- ✅ Key-value store with named records
- ✅ Support for executable code storage (sandboxed)
- ✅ Soft delete with recovery capability
- ✅ Export/Import for backup
- ✅ Multi-device synchronization
- ✅ Zero knowledge - server cannot read data

---

## Motivation

### Why SHIP-06?

Modern applications need secure storage for sensitive data:

- 🔑 **Passwords**: Store encrypted passwords safely
- 💼 **API Keys**: Secure storage for API tokens
- 🔐 **Private Keys**: Safely store crypto private keys
- 📝 **Secrets**: Application secrets and configs
- 💾 **Backup**: Encrypted backups of critical data

### Problems with Current Solutions

| Problem                | Traditional Solutions  | SHIP-07 Solution         |
| ---------------------- | ---------------------- | ------------------------ |
| **Centralized**        | 🔴 Single point failure| 🟢 Decentralized P2P     |
| **Server Access**      | 🔴 Server can read     | 🟢 E2E encrypted         |
| **Vendor Lock-in**     | 🔴 Proprietary APIs    | 🟢 Open standard         |
| **Costs**              | 🔴 Subscription fees   | 🟢 Zero operational cost |
| **Privacy**            | 🔴 Trust required      | 🟢 Zero knowledge        |
| **Multi-device Sync**  | 🟡 Complex setup       | 🟢 Automatic via GunDB   |

### Comparison with Alternatives

| Feature              | SHIP-06        | 1Password        | Bitwarden        | LocalStorage  |
| -------------------- | -------------- | ---------------- | ---------------- | ------------- |
| **Decentralized**    | 🟢 Yes         | 🔴 No            | 🟡 Self-host     | 🟢 Yes        |
| **E2E Encryption**   | 🟢 Yes         | 🟢 Yes           | 🟢 Yes           | 🔴 No         |
| **Multi-device**     | 🟢 Auto sync   | 🟢 Yes           | 🟢 Yes           | 🔴 No         |
| **Cost**             | 🟢 Free        | 🔴 $3-8/mo       | 🟡 Free/Self     | 🟢 Free       |
| **Open Source**      | 🟢 MIT         | 🔴 Proprietary   | 🟢 GPL-3.0       | N/A           |
| **Zero Knowledge**   | 🟢 Yes         | 🟢 Yes           | 🟢 Yes           | 🔴 No         |

---

## Relationship with SHIP-00

SHIP-06 **depends on** [SHIP-00](./SHIP_00.md) for:

- ✅ User authentication and authorization
- ✅ SEA encryption/decryption operations
- ✅ Key pair management
- ✅ Access to GunDB user node

```typescript
import { SHIP_00 } from "./implementation/SHIP_00";
import { SHIP_06 } from "./implementation/SHIP_06";

// Setup identity with SHIP-00
const identity = new SHIP_00(config);
await identity.login("alice", "password123");

// Use identity in SHIP-06 for secure vault
const vault = new SHIP_06(identity);
await vault.initialize();

// Store encrypted data
await vault.put("my-api-key", "sk_live_123456789");
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                SHIP-06 SECURE VAULT PROTOCOL                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GUN SEA    │    │    GunDB     │    │  User Node   │  │
│  │ (Encryption) │    │   (Storage)  │    │  (Private)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. User authenticated via SHIP-00                │    │
│    │  2. Access user's private Gun node                │    │
│    │  3. Encrypt data with SEA (AES-256-GCM)           │    │
│    │  4. Store encrypted data in vault node            │    │
│    │  5. Data synced across devices via GunDB          │    │
│    │  6. Retrieve and decrypt when needed              │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology  | Role                              |
| ------------------ | ----------- | --------------------------------- |
| **Authentication** | SHIP-00     | User identity and auth            |
| **Encryption**     | GUN SEA     | AES-256-GCM encryption            |
| **Storage**        | GunDB       | Decentralized P2P storage         |
| **User Space**     | Gun.user()  | Private encrypted user node       |
| **Synchronization**| Gun sync    | Automatic multi-device sync       |

### GunDB Node Structure

SHIP-06 uses the following node structure:

```typescript
// User's vault node
gun.user().get('vault').get('records').get(recordName)

// Node structure:
{
  vault: {
    records: {
      "my-password": {
        data: "encrypted_content",
        created: "1234567890",
        updated: "1234567890",
        deleted: false,
        metadata: { ... }
      },
      "api-key": {
        data: "encrypted_content",
        created: "1234567890",
        updated: "1234567890",
        deleted: false,
        metadata: { ... }
      }
    },
    metadata: {
      version: "1.0.0",
      recordCount: 2
    }
  }
}
```

### Security Model

```
┌──────────────────────────────────────────────────┐
│                  Security Layers                  │
├──────────────────────────────────────────────────┤
│                                                   │
│  Layer 1: Authentication (SHIP-00)               │
│  ├─ Username/Password                             │
│  └─ SEA key pair derivation                       │
│                                                   │
│  Layer 2: User Node Encryption (Gun)             │
│  ├─ Gun.user() creates encrypted space            │
│  └─ Only authenticated user can write             │
│                                                   │
│  Layer 3: Data Encryption (SEA)                  │
│  ├─ Each record encrypted individually            │
│  ├─ AES-256-GCM encryption                        │
│  └─ Cannot be read without user's key pair        │
│                                                   │
│  Layer 4: Transport Encryption                   │
│  ├─ TLS/HTTPS for relay connections               │
│  └─ Encrypted P2P connections                     │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Core Interface

```typescript
/**
 * SHIP-06: Secure Vault Interface
 */
interface ISHIP_06 {
  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Get the identity provider
   * @returns ISHIP_00 instance
   */
  getIdentity(): ISHIP_00;

  /**
   * Initialize vault
   * Sets up vault node structure
   */
  initialize(): Promise<void>;

  /**
   * Check if vault is initialized
   */
  isInitialized(): boolean;

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Store encrypted record in vault
   * @param name Record name/key
   * @param data Data to encrypt and store (any type)
   * @param metadata Optional metadata
   */
  put(name: string, data: any, metadata?: RecordMetadata): Promise<VaultResult>;

  /**
   * Retrieve and decrypt record from vault
   * @param name Record name/key
   * @param options Retrieval options
   */
  get(name: string, options?: GetOptions): Promise<VaultRecord | null>;

  /**
   * Delete record from vault (soft delete)
   * @param name Record name/key (optional - deletes all if omitted)
   */
  delete(name?: string): Promise<VaultResult>;

  /**
   * List all record names in vault
   * @param options List options
   */
  list(options?: ListOptions): Promise<string[]>;

  /**
   * Check if record exists
   * @param name Record name/key
   */
  exists(name: string): Promise<boolean>;

  /**
   * Update existing record
   * @param name Record name/key
   * @param data New data
   */
  update(name: string, data: any): Promise<VaultResult>;

  // ============================================
  // EXECUTABLE CODE STORAGE
  // ============================================

  /**
   * Store executable code in vault
   * @param name Record name/key
   * @param code JavaScript code as string
   * @param metadata Optional metadata
   */
  putCode(name: string, code: string, metadata?: RecordMetadata): Promise<VaultResult>;

  /**
   * Execute stored code (sandboxed)
   * @param name Record name/key
   * @param context Execution context (variables)
   * @param options Execution options
   */
  executeCode(
    name: string,
    context?: Record<string, any>,
    options?: ExecuteOptions
  ): Promise<any>;

  // ============================================
  // BACKUP & RESTORE
  // ============================================

  /**
   * Export entire vault (encrypted)
   * @param password Optional additional encryption password
   */
  export(password?: string): Promise<string>;

  /**
   * Import vault from backup
   * @param backupData Exported vault data
   * @param password Optional decryption password
   * @param options Import options
   */
  import(
    backupData: string,
    password?: string,
    options?: ImportOptions
  ): Promise<VaultResult>;

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Get vault statistics
   */
  getStats(): Promise<VaultStats>;

  /**
   * Clear all records (soft delete all)
   */
  clear(): Promise<VaultResult>;

  /**
   * Compact vault (remove deleted records permanently)
   */
  compact(): Promise<VaultResult>;
}
```

### Type Definitions

```typescript
/**
 * Vault record structure
 */
interface VaultRecord {
  name: string; // Record name/key
  data: any; // Decrypted data
  created: number; // Creation timestamp
  updated: number; // Last update timestamp
  deleted: boolean; // Soft delete flag
  metadata?: RecordMetadata; // Optional metadata
}

/**
 * Record metadata
 */
interface RecordMetadata {
  type?: string; // Data type (password, apiKey, privateKey, etc.)
  description?: string; // Human-readable description
  tags?: string[]; // Tags for categorization
  expiresAt?: number; // Expiration timestamp
  [key: string]: any; // Custom metadata
}

/**
 * Vault operation result
 */
interface VaultResult {
  success: boolean;
  error?: string;
  recordName?: string;
  recordCount?: number;
}

/**
 * Get options
 */
interface GetOptions {
  includeDeleted?: boolean; // Include soft-deleted records
  decrypt?: boolean; // Return decrypted data (default: true)
}

/**
 * List options
 */
interface ListOptions {
  includeDeleted?: boolean; // Include deleted records
  filterByTag?: string; // Filter by tag
  filterByType?: string; // Filter by metadata type
}

/**
 * Code execution options
 */
interface ExecuteOptions {
  useGlobal?: boolean; // Use global scope (eval) vs Function
  timeout?: number; // Execution timeout (ms)
  allowAsync?: boolean; // Allow async code
}

/**
 * Import options
 */
interface ImportOptions {
  merge?: boolean; // Merge with existing records
  overwrite?: boolean; // Overwrite existing records
  skipDeleted?: boolean; // Skip deleted records
}

/**
 * Vault statistics
 */
interface VaultStats {
  totalRecords: number; // Total records (including deleted)
  activeRecords: number; // Non-deleted records
  deletedRecords: number; // Soft-deleted records
  totalSize: number; // Approximate size in bytes
  created: number; // Vault creation timestamp
  lastModified: number; // Last modification timestamp
}
```

---

## Implementation

### Quick Start

```bash
# Install dependencies
cd shogun-core
yarn install

# Start vault CLI
yarn vault alice password123
```

### Complete Example

```typescript
import { SHIP_00 } from "./implementation/SHIP_00";
import { SHIP_06 } from "./implementation/SHIP_06";

// ============================================
// 1. IDENTITY SETUP (SHIP-00)
// ============================================

const identity = new SHIP_00({
  gunOptions: {
    peers: ["https://relay.shogun-eco.xyz/gun"],
    radisk: true,
  },
});

// ============================================
// 2. AUTHENTICATION (SHIP-00)
// ============================================

await identity.login("alice", "password123");
console.log("✅ Authenticated as alice");

// ============================================
// 3. INITIALIZE VAULT (SHIP-06)
// ============================================

const vault = new SHIP_06(identity);
await vault.initialize();
console.log("✅ Vault initialized");

// ============================================
// 4. STORE ENCRYPTED DATA
// ============================================

// Store password
await vault.put("github-password", "super_secret_pass", {
  type: "password",
  description: "GitHub account password",
  tags: ["github", "auth"],
});

// Store API key
await vault.put("stripe-api-key", "sk_live_123456789", {
  type: "apiKey",
  description: "Stripe production API key",
  tags: ["stripe", "production"],
});

// Store private key
await vault.put("eth-private-key", "0x1234567890abcdef...", {
  type: "privateKey",
  description: "Ethereum wallet private key",
  tags: ["ethereum", "wallet"],
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
});

console.log("✅ Data stored securely");

// ============================================
// 5. RETRIEVE ENCRYPTED DATA
// ============================================

const githubPass = await vault.get("github-password");
console.log("GitHub password:", githubPass?.data);

const stripeKey = await vault.get("stripe-api-key");
console.log("Stripe API key:", stripeKey?.data);

// ============================================
// 6. LIST RECORDS
// ============================================

const allRecords = await vault.list();
console.log("All records:", allRecords);

const passwordRecords = await vault.list({ filterByType: "password" });
console.log("Password records:", passwordRecords);

// ============================================
// 7. UPDATE RECORD
// ============================================

await vault.update("github-password", "new_super_secret_pass");
console.log("✅ Password updated");

// ============================================
// 8. DELETE RECORD (SOFT DELETE)
// ============================================

await vault.delete("old-api-key");
console.log("✅ Record soft-deleted");

// ============================================
// 9. EXECUTABLE CODE STORAGE
// ============================================

// Store executable code
await vault.putCode("password-generator", `
  function generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  return generatePassword(length);
`, {
  type: "code",
  description: "Password generator utility",
  tags: ["utility", "security"],
});

// Execute stored code
const newPassword = await vault.executeCode("password-generator", {
  length: 20,
});
console.log("Generated password:", newPassword);

// ============================================
// 10. BACKUP & RESTORE
// ============================================

// Export vault
const backup = await vault.export("backup-password-123");
console.log("✅ Vault exported");
console.log("Backup size:", backup.length, "characters");

// Import vault (on another device)
await vault.import(backup, "backup-password-123", {
  merge: true,
});
console.log("✅ Vault imported");

// ============================================
// 11. STATISTICS
// ============================================

const stats = await vault.getStats();
console.log("Vault statistics:", stats);
```

---

## Use Cases

### 1. Password Manager

```typescript
// Store passwords securely
await vault.put("gmail-password", "mySecurePass123!", {
  type: "password",
  description: "Gmail account",
  tags: ["email", "personal"],
});

// Retrieve password
const gmailPass = await vault.get("gmail-password");
console.log("Gmail password:", gmailPass?.data);

// Auto-fill form
document.getElementById("password").value = gmailPass?.data;
```

### 2. API Key Storage

```typescript
// Store API keys
await vault.put("openai-api-key", process.env.OPENAI_API_KEY, {
  type: "apiKey",
  description: "OpenAI GPT-4 API key",
  tags: ["openai", "ai"],
});

// Use API key in application
const apiKey = await vault.get("openai-api-key");
const openai = new OpenAI({ apiKey: apiKey?.data });
```

### 3. Private Key Storage

```typescript
// Store crypto wallet private key
await vault.put("eth-wallet", wallet.privateKey, {
  type: "privateKey",
  description: "Main Ethereum wallet",
  tags: ["ethereum", "wallet", "production"],
});

// Recover wallet
const privateKey = await vault.get("eth-wallet");
const recoveredWallet = new ethers.Wallet(privateKey?.data);
```

### 4. Application Secrets

```typescript
// Store application secrets
await vault.put("app-config", {
  databaseUrl: "mongodb://...",
  jwtSecret: "secret-key-123",
  apiKeys: {
    stripe: "sk_live_...",
    sendgrid: "SG.xxx...",
  },
}, {
  type: "config",
  description: "Production app configuration",
});

// Load configuration
const config = await vault.get("app-config");
process.env.DATABASE_URL = config?.data.databaseUrl;
```

### 5. Secure Notes

```typescript
// Store secure notes
await vault.put("recovery-codes", "Code 1: 123-456\nCode 2: 789-012", {
  type: "note",
  description: "2FA recovery codes",
  tags: ["security", "backup"],
});
```

---

## Security Considerations

### ✅ Security Strengths

1. **Triple Encryption**:
   - User's data encrypted with SEA
   - Gun user node encrypted
   - Transport layer encryption (TLS)

2. **Zero Knowledge**: 
   - Server cannot read data
   - Only user with credentials can decrypt

3. **Decentralized**:
   - No single point of failure
   - Data replicated across peers

4. **Perfect Forward Secrecy**:
   - Compromise of one record doesn't affect others

### ⚠️ Security Limitations

1. **Password Strength**: Security depends on password strength
2. **Key Loss**: Lost password = lost data (no recovery)
3. **Local Storage**: Data cached locally (encrypted)
4. **Executable Code**: Code execution can be dangerous if not sandboxed properly

### 🔒 Best Practices

```typescript
// 1. Use strong passwords
await identity.login("alice", "VeryStr0ng!P@ssw0rd#2024");

// 2. Regular backups
const backup = await vault.export("strong-backup-password");
fs.writeFileSync("vault-backup.enc", backup);

// 3. Set expiration for sensitive data
await vault.put("temp-token", "token-123", {
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
});

// 4. Use metadata for organization
await vault.put("data", "value", {
  tags: ["production", "critical"],
  type: "apiKey",
});

// 5. Be careful with executable code
await vault.executeCode("script", context, {
  timeout: 5000, // 5 second timeout
  useGlobal: false, // Don't use eval (safer)
});
```

---

## Comparison with Gunsafe

SHIP-06 is inspired by [Gunsafe](https://github.com/draeder/gunsafe) but adapted for the Shogun ecosystem:

| Feature              | Gunsafe           | SHIP-06                  |
| -------------------- | ----------------- | ------------------------ |
| **Identity**         | Custom key pair   | SHIP-00 integration      |
| **Storage**          | Gun.user()        | Gun.user().get('vault')  |
| **Encryption**       | SEA encrypt       | SEA encrypt              |
| **Code Execution**   | Function/eval     | Sandboxed execution      |
| **TypeScript**       | No                | Full TypeScript support  |
| **Backup/Restore**   | Manual            | Built-in export/import   |
| **Metadata**         | Limited           | Rich metadata support    |
| **Soft Delete**      | Yes               | Yes                      |

**Credits**: Thanks to [@draeder](https://github.com/draeder) for the original Gunsafe implementation!

---

## Future Improvements

### SHIP-06.1 (Minor Update)

- [ ] Record versioning (history)
- [ ] Sharing encrypted records with other users
- [ ] Record templates
- [ ] Auto-expiration of records
- [ ] Encrypted file attachments

### Related SHIPs

- ✅ **SHIP-00**: Identity (required)
- ✅ **SHIP-05**: File Storage (related)

---

## Testing

```bash
# Terminal: Test vault operations
yarn vault alice pass123

# Commands:
> put github-password mySecretPass123
> get github-password
> list
> delete github-password
> export
```

---

## References

- **Gunsafe**: https://github.com/draeder/gunsafe
- **GunDB**: https://gun.eco/
- **GUN SEA**: https://gun.eco/docs/SEA
- **AES-GCM**: https://en.wikipedia.org/wiki/Galois/Counter_Mode

---

## License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**SHIP-06: Secure Vault**

_Decentralized. Encrypted. Zero Knowledge._

🗡️ Built with Shogun Core 🗡️

</div>

