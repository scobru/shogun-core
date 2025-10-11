# SHIP-00: Decentralized Identity & Authentication

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025  
> **Updated**: 2025-01-11

---

## Abstract

SHIP-00 defines the foundational standard for decentralized identity and authentication in the Shogun ecosystem. This protocol provides the base layer for all other SHIP standards, offering username/password authentication, key pair management, public key publication, and identity derivation on GunDB with GUN SEA.

---

## Motivation

### Why SHIP-00?

Every decentralized application needs a robust identity layer. However, most standards bundle identity with application-specific features, making reuse difficult.

**Problems with existing approaches:**

- ❌ **Tight Coupling**: Identity mixed with application logic
- ❌ **No Reusability**: Each app re-implements authentication
- ❌ **Fragmentation**: Different identity systems across apps
- ❌ **Complexity**: Hard to maintain and test

**SHIP-00 solves this with a pure identity layer:**

- ✅ **Single Responsibility**: Only handles identity and authentication
- ✅ **Reusable**: Foundation for all other SHIPs
- ✅ **Standardized**: Consistent identity across Shogun ecosystem
- ✅ **Tested**: Based on proven Shogun Core API

### Architecture Benefits

```
SHIP-00 (Identity Foundation)
   ↓
   ├── SHIP-01 (Messaging) - uses identity for E2E encryption
   ├── SHIP-02 (Address Derivation) - extends identity with blockchain
   ├── SHIP-03 (Multi-Modal Auth) - adds auth methods to identity
   └── SHIP-04 (File Storage) - uses identity for access control
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              SHIP-00 IDENTITY PROTOCOL                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GUN SEA    │    │   Key Pair   │    │    GunDB     │  │
│  │    (Auth)    │    │  Management  │    │    (P2P)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. Create/authenticate with SEA keypair         │    │
│    │  2. Publish public key on GunDB                  │    │
│    │  3. Derive blockchain addresses                  │    │
│    │  4. Manage sessions and key backup               │    │
│    │  5. User discovery and lookup                    │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology       | Role                                |
| ------------------ | ---------------- | ----------------------------------- |
| **Authentication** | GUN SEA          | Username/password + keypair generation |
| **Key Management** | SEA Pair         | Backup, export, import capabilities |
| **Identity Storage** | GunDB          | Distributed P2P user registry       |
| **Cryptography**   | secp256k1        | Same curve as Bitcoin/Ethereum      |
| **Derivation**     | BIP32-like       | Deterministic address generation    |

### GunDB Node Structure

SHIP-00 uses the following standardized Gun node names:

```typescript
SHIP_00.NODES = {
  USERS: "users",           // User registry
  PUBLIC_KEYS: "publicKeys", // Public key directory
  REGISTRY: "registry",      // User alias → pub mapping
}
```

**Note**: Most operations use Shogun Core API which manages nodes internally. These are reference names for direct Gun access when needed.

---

## Core Interface

```typescript
/**
 * SHIP-00: Decentralized Identity & Authentication Interface
 */
interface ISHIP_00 {
  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Register new user with username and password
   * Creates new SEA keypair deterministically from credentials
   *
   * @param username - Username (unique identifier)
   * @param password - Password (used for key derivation)
   * @returns Registration result with public key
   */
  signup(username: string, password: string): Promise<SignupResult>;

  /**
   * Login with username and password
   * Derives SEA keypair from credentials
   *
   * @param username - Username
   * @param password - Password
   * @returns Authentication result
   */
  login(username: string, password: string): Promise<AuthResult>;

  /**
   * Login with exported SEA key pair
   * Useful for account recovery and multi-device access
   *
   * @param seaPair - Exported SEA key pair
   * @returns Authentication result
   */
  loginWithPair(seaPair: SEAPair): Promise<AuthResult>;

  /**
   * Logout current user
   * Clears session but keeps data on GunDB
   */
  logout(): void;

  /**
   * Check if user is authenticated
   * @returns True if user is logged in
   */
  isLoggedIn(): boolean;

  // ============================================
  // KEY MANAGEMENT
  // ============================================

  /**
   * Publish public key on GunDB
   * Makes the key discoverable by other users
   *
   * @returns Publication result
   */
  publishPublicKey(): Promise<OperationResult>;

  /**
   * Export current user's SEA key pair
   * For backup and multi-device usage
   *
   * @returns SEA key pair in serializable format
   */
  exportKeyPair(): SEAPair | null;

  /**
   * Get current user's key pair
   * @returns SEA pair or null if not logged in
   */
  getKeyPair(): SEAPair | null;

  // ============================================
  // USER DISCOVERY
  // ============================================

  /**
   * Get user information by username
   * Looks up user in GunDB registry
   *
   * @param username - Username to look up
   * @returns User data or null if not found
   */
  getUserByAlias(username: string): Promise<UserData | null>;

  /**
   * Get user information by public key
   *
   * @param userPub - User's public key
   * @returns User data or null if not found
   */
  getUserByPub(userPub: string): Promise<UserData | null>;

  /**
   * Check if user exists
   *
   * @param username - Username to check
   * @returns True if user exists
   */
  userExists(username: string): Promise<boolean>;

  // ============================================
  // IDENTITY
  // ============================================

  /**
   * Get current authenticated user info
   * @returns Current user info or null
   */
  getCurrentUser(): UserIdentity | null;

  /**
   * Derive Ethereum address from SEA keypair
   * Uses deterministic derivation for consistent results
   *
   * @param publicKey - Optional public key (uses current user if not provided)
   * @returns Ethereum address (0x...)
   */
  deriveEthereumAddress(publicKey?: string): Promise<string>;

  /**
   * Get public key by username
   * Returns both signing and encryption keys
   *
   * @param username - Username
   * @returns Public keys or null if not found
   */
  getPublicKey(username: string): Promise<PublicKeyData | null>;
}
```

### Type Definitions

```typescript
/**
 * Authentication result
 */
interface AuthResult {
  success: boolean;
  userPub?: string;           // SEA public key
  username?: string;          // Username/alias
  derivedAddress?: string;    // Derived Ethereum address
  error?: string;
}

/**
 * Signup result
 */
interface SignupResult {
  success: boolean;
  userPub?: string;
  username?: string;
  derivedAddress?: string;
  error?: string;
}

/**
 * SEA key pair for authentication and encryption
 */
interface SEAPair {
  pub: string;      // Public signing key
  priv: string;     // Private signing key
  epub: string;     // Encryption public key
  epriv: string;    // Encryption private key
}

/**
 * User identity information
 */
interface UserIdentity {
  pub: string;               // Public key
  alias?: string;            // Username
  epub?: string;             // Encryption public key
  derivedAddress?: string;   // Ethereum address
}

/**
 * User data from registry
 */
interface UserData {
  userPub: string;
  username?: string;
  epub?: string;
  registeredAt?: number;
  lastSeen?: number;
}

/**
 * Public key data
 */
interface PublicKeyData {
  pub: string;      // Public signing key
  epub: string;     // Encryption public key
  algorithm?: string;
  timestamp?: string;
}

/**
 * Generic operation result
 */
interface OperationResult {
  success: boolean;
  error?: string;
}
```

---

## Security

### 1. Authentication Layer (GUN SEA)

**Deterministic Key Derivation** from username/password:

```typescript
// SEA generates keypair from credentials
const pair = await SEA.pair();

// Generated structure:
{
  pub: "...",    // Public key (ECDSA secp256k1)
  priv: "...",   // Private key (encrypted)
  epub: "...",   // Encryption public key (ECDH)
  epriv: "..."   // Encryption private key (encrypted)
}
```

**Security Properties**:

- ✅ **PBKDF2**: Password hashing with salt
- ✅ **Deterministic**: Same credentials → same keypair
- ✅ **No Plain Storage**: Private keys encrypted at rest
- ✅ **secp256k1**: Same curve as Bitcoin/Ethereum

### 2. Key Management

**Export/Import for Portability**:

```typescript
// Export for backup
const keyPair = identity.exportKeyPair();
const backup = Buffer.from(JSON.stringify(keyPair)).toString('base64');

// Import on another device
const restored = JSON.parse(Buffer.from(backup, 'base64').toString('utf-8'));
await identity.loginWithPair(restored);
```

**⚠️ SECURITY WARNING**:

- 🔴 Backup contains **private keys in plain text**
- 🔴 Must be protected like a password
- 🔴 Never share or expose backups
- 🟢 Consider additional encryption layer

### 3. Identity Derivation

**Ethereum Address Derivation**:

```typescript
// Deterministic derivation from SEA private key
const derived = await derive(seaPair.priv, null, {
  includeSecp256k1Ethereum: true,
  includeP256: false,
  includeSecp256k1Bitcoin: false,
});

const ethAddress = derived.secp256k1Ethereum.address;
```

**Properties**:

- ✅ **Deterministic**: Same keypair → same address
- ✅ **Cryptographically Secure**: Uses proven derivation
- ✅ **Cross-Chain Ready**: Can derive Bitcoin, etc.

---

## Implementation

### Quick Start

```bash
# Install dependencies
cd shogun-core
yarn install

# Interactive CLI demo
yarn identity alice password123

# Use in your app
import { SHIP_00 } from "./ship/implementation/SHIP_00";
```

### CLI Usage

The identity CLI provides an interactive interface to explore SHIP-00 features:

```bash
# Auto-login mode
yarn identity alice password123

# Manual login mode
yarn identity

# Menu options:
1. View Current User       - Show authenticated user info
2. View Public Keys        - Display signing and encryption keys
3. Export Key Pair         - Backup identity for multi-device
4. Login with Key Pair     - Restore identity from backup
5. Lookup User             - Find users by username
6. Lookup by Public Key    - Find users by Gun public key
7. Derive Ethereum Address - Get deterministic ETH address
8. Publish Public Key      - Make discoverable on network
9. Logout                  - End session
```

### Complete Example

```typescript
import { SHIP_00 } from "./implementation/SHIP_00";

// ============================================
// 1. INITIALIZATION
// ============================================

const identity = new SHIP_00({
  gunOptions: {
    peers: ["https://peer.wallie.io/gun"],
    radisk: true,
  },
});

// ============================================
// 2. REGISTRATION
// ============================================

const signupResult = await identity.signup("alice", "password123");

if (signupResult.success) {
  console.log("✅ User registered!");
  console.log("   Username:", signupResult.username);
  console.log("   Public Key:", signupResult.userPub);
  console.log("   Ethereum Address:", signupResult.derivedAddress);
} else {
  console.error("❌ Signup failed:", signupResult.error);
}

// ============================================
// 3. LOGIN
// ============================================

const loginResult = await identity.login("alice", "password123");

if (loginResult.success) {
  console.log("✅ Login successful!");
  
  // Publish public key for discovery
  await identity.publishPublicKey();
  
  // Get current user
  const currentUser = identity.getCurrentUser();
  console.log("Current user:", currentUser);
  
} else {
  console.error("❌ Login failed:", loginResult.error);
}

// ============================================
// 4. KEY BACKUP
// ============================================

// Export for backup
const keyPair = identity.exportKeyPair();
if (keyPair) {
  const backup = Buffer.from(JSON.stringify(keyPair)).toString('base64');
  console.log("🔑 Backup key pair:", backup);
  
  // Save to secure location
  // WARNING: Keep this backup secure!
}

// ============================================
// 5. USER DISCOVERY
// ============================================

// Find other users
const bobData = await identity.getUserByAlias("bob");
if (bobData) {
  console.log("Found Bob:", bobData.userPub);
  
  // Get Bob's public keys
  const bobKeys = await identity.getPublicKey("bob");
  console.log("Bob's encryption key:", bobKeys?.epub);
}

// Check if user exists
const exists = await identity.userExists("carol");
console.log("Carol exists:", exists);

// ============================================
// 6. IDENTITY DERIVATION
// ============================================

// Derive Ethereum address
const ethAddress = await identity.deriveEthereumAddress();
console.log("Ethereum address:", ethAddress);

// ============================================
// 7. MULTI-DEVICE LOGIN
// ============================================

// On another device, use backup
const restoredPair = JSON.parse(
  Buffer.from(backup, 'base64').toString('utf-8')
);

const pairLoginResult = await identity.loginWithPair(restoredPair);
if (pairLoginResult.success) {
  console.log("✅ Logged in with key pair on new device!");
}

// ============================================
// 8. LOGOUT
// ============================================

identity.logout();
console.log("👋 Logged out");
```

---

## Use Cases

### 1. Foundation for Messaging (SHIP-01)

```typescript
// SHIP-01 depends on SHIP-00
import { SHIP_00 } from "./implementation/SHIP_00";
import { SHIP_01 } from "./implementation/SHIP_01";

// Setup identity
const identity = new SHIP_00(config);
await identity.login("alice", "password123");
await identity.publishPublicKey();

// Use identity in messaging
const messaging = new SHIP_01(identity); // SHIP-01 takes SHIP-00
await messaging.sendMessage("bob", "Hello!");
```

### 2. Multi-Device Identity

```typescript
// Device 1: Export identity
const backup = identity.exportKeyPair();
const backupString = Buffer.from(JSON.stringify(backup)).toString('base64');

// Transfer securely to Device 2

// Device 2: Import identity
const identity2 = new SHIP_00(config);
const restoredPair = JSON.parse(
  Buffer.from(backupString, 'base64').toString('utf-8')
);
await identity2.loginWithPair(restoredPair);

// Same identity on both devices!
```

### 3. User Discovery System

```typescript
// Build a user directory
class UserDirectory {
  constructor(private identity: SHIP_00) {}
  
  async findUser(username: string) {
    const exists = await this.identity.userExists(username);
    if (!exists) return null;
    
    const userData = await this.identity.getUserByAlias(username);
    const publicKey = await this.identity.getPublicKey(username);
    
    return {
      ...userData,
      keys: publicKey
    };
  }
  
  async getAllUsers() {
    // Implementation using GunDB .map()
  }
}
```

---

## Testing

### Interactive CLI

```bash
# Terminal 1: Alice registers and explores identity
yarn identity alice password123

# Menu appears:
🗡️  SHIP-00 Identity Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. View Current User       - Show authenticated user info
2. View Public Keys        - Display signing and encryption keys
3. Export Key Pair         - Backup identity for multi-device
4. Login with Key Pair     - Restore identity from backup
5. Lookup User             - Find users by username
6. Lookup by Public Key    - Find users by Gun public key
7. Derive Ethereum Address - Get deterministic ETH address
8. Publish Public Key      - Make discoverable on network
9. Logout                  - End session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Alice exports her keypair
Choose option: 3

✅ KEY PAIR EXPORTED
═══════════════════════════════════════════════════════════
🔑 Base64 Format:
eyJwdWIiOiIuLi4iLCJwcml2IjoiLi4uIiwiZXB1YiI6Ii4uLiIsImVwcml2IjoiLi4uIn0=

💾 Saved to: shogun-identity-alice-1234567890.txt
⚠️  KEEP THIS SAFE! Contains your private keys!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Terminal 2: Bob looks up Alice
yarn identity bob password456

Choose option: 5  # Lookup User
Enter username to lookup: alice

✅ User Found:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Username:      alice
  Public Key:    pW9x2...
  Encryption Key: eK3m9...
  Published:     1/11/2025, 3:45:20 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Terminal 3: Alice restores on new device
yarn identity

Choose option: 2  # Login with Key Pair
Enter key pair: eyJwdWIiOiIuLi4iLCJwcml2IjoiLi4uIn0=

✅ Login Successful!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Username:        alice
  Derived Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Unit Tests

```bash
# Run all tests
yarn test

# Test SHIP-00 specifically
yarn test SHIP_00
```

---

## Relationship with Other SHIPs

### SHIP-00 as Foundation

```typescript
// All SHIPs depend on SHIP-00 for identity

// SHIP-01: Messaging
class SHIP_01 {
  constructor(private identity: ISHIP_00) {}
  // Uses identity for encryption keys
}

// SHIP-02: Address Derivation
class SHIP_02 {
  constructor(private identity: ISHIP_00) {}
  // Extends identity with more address types
}

// SHIP-04: File Storage
class SHIP_04 {
  constructor(private identity: ISHIP_00) {}
  // Uses identity for access control
}
```

---

## Future Improvements

### SHIP-00.1 (Minor Updates)

- [ ] Social recovery (multi-sig recovery)
- [ ] Key rotation mechanism
- [ ] Multi-profile support (one user, multiple personas)
- [ ] Revocation lists for compromised keys

### SHIP-00.2 (Next Version)

- [ ] Hardware key support (Ledger, Trezor)
- [ ] Biometric integration (via SHIP-03)
- [ ] Zero-knowledge proofs for privacy
- [ ] Cross-chain identity bridging

---

## References

- **Shogun Core API**: [../API.md](../API.md)
- **GunDB**: https://gun.eco/
- **GUN SEA**: https://gun.eco/docs/SEA
- **BIP32**: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- **secp256k1**: https://en.bitcoin.it/wiki/Secp256k1

---

## Authors

- **Shogun Team** - Initial work
- **Contributors** - See [GitHub Contributors](https://github.com/scobru/shogun-core/graphs/contributors)

---

## License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**SHIP-00: Decentralized Identity & Authentication**

_The Foundation of the Shogun Ecosystem_

🗡️ Built with Shogun Core 🗡️

</div>

