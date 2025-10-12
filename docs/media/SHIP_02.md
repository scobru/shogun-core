# SHIP-02: Ethereum Address Derivation

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025  
> **Updated**: 2025-10-11

---

## Abstract

SHIP-02 extends SHIP-00 to provide deterministic Ethereum address derivation from user identity. This protocol enables hierarchical deterministic (HD) wallet functionality, BIP-44 compliance, stealth address generation, and transaction signing - all derived from a single SHIP-00 identity.

---

## Motivation

### Why SHIP-02?

SHIP-00 provides a solid identity foundation, but decentralized applications often need blockchain addresses for transactions and asset management. Creating a separate wallet disconnected from identity leads to fragmentation and poor UX.

**Problems with existing approaches:**

- ❌ **Fragmented Identity**: Wallet addresses separate from app identity
- ❌ **Multiple Seeds**: Users must backup both app identity and wallet seeds
- ❌ **No Privacy**: Reusing same address for all transactions
- ❌ **Complex Integration**: Difficult to connect identity with blockchain

**SHIP-02 solves this by extending SHIP-00:**

- ✅ **Unified Identity**: Ethereum addresses derived from SHIP-00 identity
- ✅ **Single Backup**: One identity backup includes all derived addresses
- ✅ **Privacy-Enhanced**: Stealth addresses for anonymous transactions
- ✅ **BIP-44 Compliant**: Interoperable with standard HD wallets
- ✅ **Seamless Integration**: Native blockchain support in identity layer

### Architecture Benefits

```
SHIP-00 (Identity Foundation)
   ↓
SHIP-02 (Address Derivation)
   ↓
   ├── BIP-44 HD Wallet
   ├── Multiple Accounts
   ├── Stealth Addresses
   └── Transaction Signing
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              SHIP-02 ADDRESS DERIVATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   SHIP-00    │    │   BIP-32/44  │    │   Ethers.js  │  │
│  │  (Identity)  │    │  (HD Wallet) │    │  (Ethereum)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. Derive seed from SHIP-00 keypair             │    │
│    │  2. Create HD wallet from seed                   │    │
│    │  3. Derive addresses via BIP-44                  │    │
│    │  4. Generate stealth addresses via ECDH          │    │
│    │  5. Sign transactions with derived keys          │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| **Identity Foundation** | SHIP-00 | Base identity and keypair |
| **HD Derivation** | BIP-32 | Hierarchical deterministic wallets |
| **Account Standard** | BIP-44 | Multi-account hierarchy (m/44'/60'/account'/change/index) |
| **Ethereum** | Ethers.js | Wallet creation and signing |
| **Privacy** | ECDH | Stealth address generation |
| **Cryptography** | secp256k1 | Ethereum elliptic curve |
| **Storage** | GunDB + localStorage | Encrypted backup and sync |

### GunDB Node Structure

SHIP-02 uses the following standardized Gun node names for persistent storage:

```typescript
SHIP_02.NODES = {
  ADDRESS_BOOK: "addressbook",   // Derived addresses and labels
  MNEMONIC: "mnemonic",          // BIP-39 mnemonic (encrypted)
  WALLET_PATHS: "wallet_paths",  // HD wallet derivation paths
}
```

**Note**: Nodes are stored in user's private space (`gun.user().get("mnemonic")`), so no namespace conflicts.

All data is encrypted using SHIP-00 SEA keys before storage.

---

## Core Interface

```typescript
/**
 * SHIP-02: Ethereum Address Derivation Interface
 */
interface ISHIP_02 {
  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize address derivation system
   * Derives master seed from SHIP-00 identity
   */
  initialize(): Promise<void>;

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean;

  // ============================================
  // BASIC DERIVATION
  // ============================================

  /**
   * Derive Ethereum address from identity
   *
   * @param path - BIP-32 derivation path (default: m/44'/60'/0'/0/0)
   * @returns Derivation result with address and public key
   */
  deriveEthereumAddress(path?: string): Promise<DerivationResult>;

  /**
   * Derive multiple addresses sequentially
   *
   * @param count - Number of addresses to derive
   * @param startIndex - Starting index (default: 0)
   * @returns Array of derivation results
   */
  deriveMultipleAddresses(
    count: number,
    startIndex?: number
  ): Promise<DerivationResult[]>;

  /**
   * Get primary (default) Ethereum address
   * @returns Primary address string
   */
  getPrimaryAddress(): Promise<string>;

  // ============================================
  // BIP-44 STANDARD
  // ============================================

  /**
   * Derive address using BIP-44 path
   * Path: m/44'/coinType'/account'/change/index
   *
   * @param coinType - Coin type (60 for Ethereum)
   * @param account - Account index
   * @param change - Change chain (0=external, 1=internal)
   * @param index - Address index
   */
  deriveBIP44Address(
    coinType?: number,
    account?: number,
    change?: number,
    index?: number
  ): Promise<DerivationResult>;

  /**
   * Derive multiple accounts
   */
  deriveMultipleAccounts(accountCount: number): Promise<DerivationResult[]>;

  // ============================================
  // STEALTH ADDRESSES
  // ============================================

  /**
   * Generate stealth address for private transactions
   * Uses ECDH to create one-time addresses
   *
   * @param recipientPublicKey - Optional recipient public key
   * @returns Stealth address result
   */
  generateStealthAddress(
    recipientPublicKey?: string
  ): Promise<StealthAddressResult>;

  /**
   * Derive shared secret with another public key
   */
  deriveSharedSecret(publicKey: string): Promise<string>;

  // ============================================
  // TRANSACTION SIGNING
  // ============================================

  /**
   * Sign Ethereum transaction
   *
   * @param tx - Transaction object
   * @param address - Address to sign with
   * @returns Signature result with signed transaction
   */
  signTransaction(tx: Transaction, address: string): Promise<SignatureResult>;

  /**
   * Sign arbitrary message
   */
  signMessage(message: string | Uint8Array, address: string): Promise<string>;

  /**
   * Verify message signature
   */
  verifySignature(
    message: string | Uint8Array,
    signature: string,
    address: string
  ): Promise<boolean>;

  // ============================================
  // ADDRESS MANAGEMENT
  // ============================================

  /**
   * Get all derived addresses
   */
  getAllAddresses(): Promise<AddressEntry[]>;

  /**
   * Export address book for backup
   */
  exportAddressBook(): Promise<AddressBook>;

  /**
   * Verify ownership of address
   */
  ownsAddress(address: string): Promise<boolean>;
}
```

---

## Derivation Flow

### 1. Master Seed Derivation

```
SHIP-00 Keypair (epriv + epub)
         ↓
   Deterministic Hash (keccak256)
         ↓
    Master Seed (32 bytes)
         ↓
    HD Wallet Root
```

### 2. BIP-44 Address Derivation

```
m / purpose' / coin_type' / account' / change / address_index
│     │           │           │         │         │
│     │           │           │         │         └─ Address index (0, 1, 2, ...)
│     │           │           │         └─────────── Change chain (0=external, 1=internal)
│     │           │           └─────────────────────── Account (0, 1, 2, ...)
│     │           └─────────────────────────────────── Coin type (60 = Ethereum)
│     └─────────────────────────────────────────────── Purpose (44 = BIP-44)
└────────────────────────────────────────────────────── Master key

Example: m/44'/60'/0'/0/0 (First Ethereum address)
```

### 3. Stealth Address Generation

```
1. Generate ephemeral keypair (r, R = r*G)
2. Compute shared secret: s = r * P (where P is recipient public key)
3. Derive stealth private key: k = H(s, R)
4. Compute stealth address: A = k*G
5. Return (A, R, viewTag) to sender
```

---

## Security Model

### Threat Mitigation

| Threat | Mitigation |
|--------|-----------|
| **Seed Exposure** | Seed derived from SHIP-00, never stored directly |
| **Address Reuse** | HD wallet enables unlimited addresses from one seed |
| **Transaction Linking** | Stealth addresses prevent transaction correlation |
| **Private Key Theft** | Keys cached in memory only, cleared on logout |
| **Replay Attacks** | Chain ID and nonce validation in signing |

### Best Practices

1. **Backup**: Export SHIP-00 keypair (includes all derived addresses)
2. **Privacy**: Use different addresses for different purposes
3. **Stealth**: Use stealth addresses for sensitive transactions
4. **Verification**: Always verify address ownership before signing
5. **Clear Cache**: Call `clearCache()` when switching users

---

## Usage Examples

### Basic Setup

```typescript
import { SHIP_00 } from "shogun-core";
import { SHIP_02 } from "shogun-core";

// 1. Setup identity with SHIP-00
const identity = new SHIP_00({
  gunOptions: { peers: ["https://peer.wallie.io/gun"] }
});

await identity.login("alice", "password123");

// 2. Initialize SHIP-02
const addressDerivation = new SHIP_02(identity);
await addressDerivation.initialize();

// 3. Get primary Ethereum address
const primaryAddress = await addressDerivation.getPrimaryAddress();
console.log("Primary address:", primaryAddress);
// Output: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Multiple Addresses

```typescript
// Derive 5 addresses
const addresses = await addressDerivation.deriveMultipleAddresses(5);

addresses.forEach((result, index) => {
  if (result.success) {
    console.log(`Address ${index}:`, result.address);
    console.log(`Path:`, result.path);
  }
});

// Output:
// Address 0: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (m/44'/60'/0'/0/0)
// Address 1: 0x8f7e9c3b1a5d4e2c9f8b7a6c5d4e3f2b1a0c9d8e (m/44'/60'/0'/0/1)
// ...
```

### BIP-44 Accounts

```typescript
// Derive specific BIP-44 path
const result = await addressDerivation.deriveBIP44Address(
  60,  // Ethereum
  0,   // Account 0
  0,   // External chain
  5    // Index 5
);

console.log("Address:", result.address);
console.log("Path:", result.path);
// Output:
// Address: 0x1234...
// Path: m/44'/60'/0'/0/5
```

### Stealth Addresses

```typescript
// Generate stealth address
const stealth = await addressDerivation.generateStealthAddress();

if (stealth.success) {
  console.log("Stealth address:", stealth.address);
  console.log("Ephemeral public key:", stealth.ephemeralPublicKey);
  console.log("View tag:", stealth.viewTag);
}

// Use stealth address for private transaction
const tx = {
  to: stealth.address,
  value: ethers.parseEther("1.0")
};
```

### Transaction Signing & Sending

```typescript
// ============================================
// OPTION 1: Send Transaction (Recommended)
// ============================================

// Configure RPC provider first
await addressDerivation.setRpcUrl("https://sepolia.infura.io/v3/YOUR_KEY");

// Get primary address
const primaryAddress = await addressDerivation.getPrimaryAddress();

// Prepare transaction
const tx = {
  to: "0x8f7e9c3b1a5d4e2c9f8b7a6c5d4e3f2b1a0c9d8e",
  value: ethers.parseEther("0.1"), // 0.1 ETH
};

// Send transaction (sign + broadcast in one call)
const result = await addressDerivation.sendTransaction(
  tx,
  primaryAddress,
  true // wait for confirmation
);

if (result.success) {
  console.log("✅ Transaction sent!");
  console.log("TX Hash:", result.txHash);
  console.log("Block:", result.receipt?.blockNumber);
  console.log("Gas Used:", result.receipt?.gasUsed.toString());
}

// ============================================
// OPTION 2: Sign Only (Advanced Use)
// ============================================

const signResult = await addressDerivation.signTransaction(tx, primaryAddress);

if (signResult.success) {
  console.log("Signed TX:", signResult.signedTransaction);
  console.log("TX Hash:", signResult.txHash);
  
  // Manually broadcast:
  const provider = addressDerivation.getProvider();
  await provider.sendTransaction(signResult.signedTransaction);
}
```

### Message Signing

```typescript
const address = await addressDerivation.getPrimaryAddress();
const message = "Hello, Shogun!";

// Sign message
const signature = await addressDerivation.signMessage(message, address);
console.log("Signature:", signature);

// Verify signature
const isValid = await addressDerivation.verifySignature(
  message,
  signature,
  address
);
console.log("Valid:", isValid); // true
```

### Address Management

```typescript
// Get all addresses
const allAddresses = await addressDerivation.getAllAddresses();
console.log(`Total addresses: ${allAddresses.length}`);

// Set label for address
await addressDerivation.setAddressLabel(
  primaryAddress,
  "Main Wallet"
);

// Export address book for backup
const addressBook = await addressDerivation.exportAddressBook();
console.log("Address book:", addressBook);

// Check ownership
const owns = await addressDerivation.ownsAddress(primaryAddress);
console.log("Owns address:", owns); // true
```

### Frontend-Friendly Wallet API

SHIP-02 provides convenient methods for frontend applications:

```typescript
// Set RPC provider for transactions
await addressDerivation.setRpcUrl("https://mainnet.infura.io/v3/YOUR_KEY");

// Get main wallet (derived from Gun keys, not BIP-44)
const mainWallet = addressDerivation.getMainWallet();
console.log("Main wallet:", mainWallet.address);

// Create new wallet with auto-incremented index
const wallet1 = await addressDerivation.createWallet();
console.log("Wallet 1:", wallet1.address, wallet1.path);

const wallet2 = await addressDerivation.createWallet();
console.log("Wallet 2:", wallet2.address, wallet2.path);

// Load all created wallets
const allWallets = await addressDerivation.loadWallets();
console.log(`Loaded ${allWallets.length} wallets`);

// Export everything for backup
const completeBackup = await addressDerivation.exportAllUserData();
// Contains: mnemonic, wallet keys, Gun pair, address book (all encrypted)
```

### Advanced Export/Import

```typescript
// Export wallet keys only
const walletKeys = await addressDerivation.exportWalletKeys();

// Export Gun SEA keypair
const gunPair = await addressDerivation.exportGunPair();

// Export complete backup (encrypted)
const backup = await addressDerivation.exportAllUserData();

// Import wallet keys
const count = await addressDerivation.importWalletKeys(walletKeys);
console.log(`Imported ${count} wallets`);

// Import complete backup with options
const result = await addressDerivation.importAllUserData(backup, {
  importMnemonic: true,
  importWallets: true,
  importGunPair: false, // Gun pair managed by SHIP-00
});
console.log("Import result:", result);
```

---

## Testing

### Unit Tests

```typescript
describe("SHIP-02: Address Derivation", () => {
  let identity: SHIP_00;
  let addressDerivation: SHIP_02;

  beforeEach(async () => {
    identity = new SHIP_00({
      gunOptions: { peers: ["http://localhost:8765/gun"] }
    });
    await identity.signup("testuser", "testpass123");
    
    addressDerivation = new SHIP_02(identity);
    await addressDerivation.initialize();
  });

  test("should derive primary address", async () => {
    const address = await addressDerivation.getPrimaryAddress();
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test("should derive BIP-44 addresses", async () => {
    const result = await addressDerivation.deriveBIP44Address(60, 0, 0, 0);
    expect(result.success).toBe(true);
    expect(result.path).toBe("m/44'/60'/0'/0/0");
  });

  test("should generate stealth address", async () => {
    const stealth = await addressDerivation.generateStealthAddress();
    expect(stealth.success).toBe(true);
    expect(stealth.address).toBeDefined();
    expect(stealth.ephemeralPublicKey).toBeDefined();
  });

  test("should sign transaction", async () => {
    const address = await addressDerivation.getPrimaryAddress();
    const tx = {
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      value: "1000000000000000000", // 1 ETH
      chainId: 1
    };
    
    const result = await addressDerivation.signTransaction(tx, address);
    expect(result.success).toBe(true);
    expect(result.signedTransaction).toBeDefined();
  });

  test("should verify address ownership", async () => {
    const address = await addressDerivation.getPrimaryAddress();
    const owns = await addressDerivation.ownsAddress(address);
    expect(owns).toBe(true);
  });
});
```

### Integration Tests

```bash
# Run SHIP-02 tests
yarn test ship/implementation/SHIP_02.test.ts

# Test with messenger CLI
yarn messenger:wallet alice password123
```

---

## Implementation Notes

### Performance Considerations

- **Address Caching**: Derived addresses cached in memory for fast access
- **Lazy Derivation**: Addresses only derived when requested
- **Batch Operations**: Use `deriveMultipleAddresses()` for bulk derivation

### Memory Management

- **Cache Size**: Keep cache small for mobile devices
- **Clear Cache**: Call `clearCache()` when switching users
- **Wallet References**: Wallets stored in WeakMap for automatic GC

### Browser Compatibility

- **WebCrypto**: Uses native crypto for better performance
- **BigInt**: Requires modern browsers (no IE11)
- **ethers.js**: Universal compatibility (Node + Browser)

---

## Future Extensions

### Planned Features

- **Multi-Chain**: Support for Bitcoin, Solana, etc.
- **Hardware Wallets**: Ledger/Trezor integration
- **ENS Integration**: Resolve ENS names to SHIP-00 identities
- **Gas Optimization**: Transaction batching and estimation
- **Payment Channels**: State channels for micro-payments

### Related SHIPs

- ✅ **SHIP-00**: Identity Foundation (base layer)
- ✅ **SHIP-03**: Stealth Addresses (privacy extension)
- ✅ **SHIP-04**: Multi-Modal Auth (flexible login)

### Proposed Extensions

- 💡 **SHIP-02a**: Bitcoin address derivation
- 💡 **SHIP-02b**: Hardware wallet integration
- 💡 **SHIP-02c**: Multi-signature wallets

---

## References

- **BIP-32**: [Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- **BIP-44**: [Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- **Ethers.js**: [Documentation](https://docs.ethers.org/)
- **Stealth Addresses**: [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564)
- **SHIP-00**: [Identity Foundation](./SHIP_00.md)

---

## License

MIT License - see [LICENSE](../LICENSE)

---

<div align="center">

**Developed with ❤️ by the Shogun Team**

🗡️ **SHIP-02: Ethereum Address Derivation** 🗡️

*Your identity, your keys, your blockchain*

</div>

