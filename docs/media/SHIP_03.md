# SHIP-03: Dual-Key Stealth Addresses

**Status**: ✅ Implemented  
**Depends on**: SHIP-00, SHIP-02  
**Version**: 1.0.0

---

## Abstract

SHIP-03 provides **ERC-5564 compatible dual-key stealth addresses** for privacy-preserving Ethereum transactions. Built on top of SHIP-00 and SHIP-02, it enables users to receive payments without revealing their main address on-chain.

**Key Innovation**: All stealth keys are **deterministically derived from SHIP-00 identity** using Fluidkey's signature-based key generation, eliminating the need for separate key management.

---

## Table of Contents

- [Motivation](#motivation)
- [Specification](#specification)
- [Security](#security)
- [Implementation](#implementation)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [References](#references)

---

## Motivation

### Privacy Problem

Traditional Ethereum transactions publicly link sender and receiver addresses on-chain, enabling:
- **Transaction history tracking**
- **Balance monitoring**
- **Identity correlation**

### Stealth Address Solution

Stealth addresses solve this by:
1. **Sender** generates a one-time address for **receiver**
2. **Receiver** can detect and spend from this address
3. **On-chain**: No link between receiver's main address and stealth address

### Why Dual-Key?

**Single-key stealth** requires scanning with spending key (security risk).

**Dual-key stealth** separates concerns:
- **Viewing Key**: Safe to use for scanning (can be on server)
- **Spending Key**: Only needed when spending (kept offline)

---

## Specification

### Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│ SHIP-00 Identity                                            │
│  ├─ epriv, epub (encryption keys)                           │
│  └─ Deterministic Signature                                 │
│        │                                                     │
│        ├─ Fluidkey generateKeysFromSignature()              │
│        │                                                     │
│        ├──► Viewing Key  (for scanning blockchain)          │
│        └──► Spending Key (for spending funds)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Stealth Address Generation                                  │
│                                                              │
│  Sender:                                                     │
│   1. Get receiver's (viewingPubKey, spendingPubKey)         │
│   2. Generate ephemeralPrivateKey                           │
│   3. sharedSecret = ECDH(ephemeralPriv, viewingPub)         │
│   4. stealthAddr = hash(sharedSecret) * G + spendingPub     │
│   5. Announce (stealthAddr, ephemeralPub, viewTag)          │
│                                                              │
│  Receiver:                                                   │
│   1. Scan announcements with viewingPrivateKey              │
│   2. sharedSecret = ECDH(viewingPriv, ephemeralPub)         │
│   3. stealthPriv = hash(sharedSecret) + spendingPriv        │
│   4. Derive wallet from stealthPriv to spend                │
└─────────────────────────────────────────────────────────────┘
```

### GunDB Node Structure

SHIP-03 uses the following standardized Gun node names:

```typescript
SHIP_03.NODES = {
  STEALTH_KEYS_PUBLIC: "stealth_keys_public",     // Public stealth keys (discoverable)
  STEALTH_ANNOUNCEMENTS: "stealth_announcements", // Stealth payment announcements
}
```

**Note**: Public stealth keys are published to `gun.get(userPub).get("stealth_keys_public")` (public space, under user's pub) so others can discover them for generating stealth addresses.

### Key Derivation (ERC-5564 Compatible)

```typescript
// Step 1: Keys are deterministically derived from SHIP-00 identity
// Using: keccak256("SHIP-03-VIEWING" + SHIP-00.epriv) → viewingKey
//        keccak256("SHIP-03-SPENDING" + SHIP-00.epriv) → spendingKey

// Step 2: Keys are automatically published to Gun on initialization
await stealth.initialize(); // Derives and publishes keys

// Step 3: Get your keys
const keys = await stealth.getStealthKeys();
// { viewingKey: {publicKey, privateKey}, spendingKey: {publicKey, privateKey} }

// Step 4: Manually publish keys if needed
await stealth.publishStealthKeys();
```

### Stealth Address Generation

```typescript
// Sender side
const result = generateStealthAddresses({
  ephemeralPrivateKey,
  spendingPublicKeys: [recipientSpendingPubKey],
});

// Result
{
  stealthAddress: "0x...",
  ephemeralPublicKey: "0x...",
  viewTag: "0xNN"
}
```

### Opening Stealth Address

```typescript
// Receiver side
const stealthPrivateKey = generateStealthPrivateKey({
  ephemeralPublicKey,
  viewingPrivateKey,
  spendingPrivateKey,
});

const wallet = new ethers.Wallet(stealthPrivateKey);
// wallet.address === stealthAddress ✅
```

---

## Security

### Security Model

| Component | Security Property |
|-----------|------------------|
| **Viewing Key** | Can scan without spending risk |
| **Spending Key** | Required to spend (keep offline) |
| **Ephemeral Key** | One-time use, discarded after generation |
| **View Tag** | 1-byte optimization (no security impact) |

### Attack Vectors

#### ✅ Prevented

- **Address Linkage**: Stealth addresses are unlinkable to main address
- **Transaction Tracking**: Each payment uses unique address
- **Balance Monitoring**: Adversary cannot correlate balances

#### ⚠️ Considerations

- **Viewing Key Compromise**: Adversary can see received amounts (but not spend)
- **Announcement Scanning**: Metadata reveals payment occurred (but not to whom)
- **Chain Analysis**: Timing analysis may correlate if not careful

### Best Practices

1. **Keep Spending Key Offline**: Only load when spending
2. **Scan with Viewing Key**: Use on server/light client safely
3. **Use View Tags**: Optimize scanning without security trade-off
4. **Rotate Keys**: Generate new stealth keys periodically
5. **Mix Announcements**: Don't announce immediately after generating

---

## Implementation

### Interface: `ISHIP_03`

```typescript
interface ISHIP_03 {
  // Initialization
  initialize(): Promise<void>;
  isInitialized(): boolean;

  // Key Management
  getStealthKeys(): Promise<StealthKeys>;
  getPublicStealthKeysByUsername(username: string): Promise<{...} | null>;
  getPublicStealthKeys(userPub: string): Promise<{...} | null>;
  publishStealthKeys(): Promise<void>;  // Publish keys to Gun network
  exportStealthKeys(): Promise<string>;
  importStealthKeys(encrypted: string): Promise<void>;

  // Generation
  generateEphemeralKeyPair(): Promise<EphemeralKeyPair>;
  generateStealthAddress(
    viewingKey: string,
    spendingKey: string,
    ephemeralKey?: string
  ): Promise<StealthAddressResult>;
  generateMultipleStealthAddresses(...): Promise<...>;

  // Opening/Spending
  openStealthAddress(addr: string, ephemeral: string): Promise<Wallet>;
  isStealthAddressMine(addr: string, ephemeral: string): Promise<boolean>;
  getStealthPrivateKey(addr: string, ephemeral: string): Promise<string>;

  // Scanning
  scanStealthAddresses(announcements: []): Promise<OwnedStealthAddress[]>;
  quickScanWithViewTags(announcements: []): Promise<AnnouncedStealth[]>;

  // Utilities
  createAnnouncementMetadata(...): StealthMetadata;
  parseAnnouncement(txData: any): Promise<AnnouncedStealth | null>;
  getAllOwnedStealthAddresses(): Promise<OwnedStealthAddress[]>;
  verifyStealthAddress(...): Promise<boolean>;
  clearCache(): Promise<void>;
}
```

### Types

```typescript
interface StealthKeys {
  viewingKey: {
    publicKey: string;
    privateKey: string;
  };
  spendingKey: {
    publicKey: string;
    privateKey: string;
  };
}

interface StealthAddressResult {
  success: boolean;
  stealthAddress?: string;
  ephemeralPublicKey?: string;
  viewTag?: string;
  error?: string;
}

interface AnnouncedStealth {
  stealthAddress: string;
  ephemeralPublicKey: string;
  viewTag: string;
  schemeId: number;
  announcer: string;
  txHash?: string;
}

interface OwnedStealthAddress {
  stealthAddress: string;
  ephemeralPublicKey: string;
  privateKey: string;
  wallet: ethers.Wallet;
  metadata: StealthMetadata;
}
```

---

## Usage Examples

### Basic Setup

```typescript
import { SHIP_00, SHIP_02, SHIP_03 } from 'shogun-core';

// 1. Setup identity
const identity = new SHIP_00({
  gunOptions: { peers: ['http://localhost:8765/gun'] }
});

await identity.login('alice', 'password123');

// 2. Setup HD wallet
const eth = new SHIP_02(identity);
await eth.initialize();

// 3. Setup stealth addresses
const stealth = new SHIP_03(identity, eth);
await stealth.initialize();

console.log('✅ All systems ready!');
```

### Get Your Stealth Keys

```typescript
const keys = await stealth.getStealthKeys();

console.log('Viewing Public Key:', keys.viewingKey.publicKey);
console.log('Spending Public Key:', keys.spendingKey.publicKey);

// Publish keys to Gun network (makes them discoverable)
await stealth.publishStealthKeys();
console.log('✅ Keys published - others can now find them by your username');

// Verify publication
const myKeys = await stealth.getPublicStealthKeysByUsername('alice');
console.log('Keys are discoverable:', myKeys !== null);
```

### Generate Stealth Address (Sender)

```typescript
// Option 1: Lookup by username (recommended)
const recipientKeys = await stealth.getPublicStealthKeysByUsername('bob');

// Option 2: Lookup by Gun public key
// const recipientKeys = await stealth.getPublicStealthKeys(bobPub);

if (!recipientKeys) {
  throw new Error('Recipient has not published stealth keys');
}

// Generate stealth address
const result = await stealth.generateStealthAddress(
  recipientKeys.viewingPublicKey,
  recipientKeys.spendingPublicKey
);

console.log('Stealth Address:', result.stealthAddress);
console.log('Ephemeral Key:', result.ephemeralPublicKey);
console.log('View Tag:', result.viewTag);

// Send payment to result.stealthAddress
// Announce ephemeralPublicKey on-chain or off-chain
```

### Open Stealth Address (Receiver)

```typescript
// From announcement
const stealthAddr = "0x...";
const ephemeralPubKey = "0x...";

// Check if it's mine
const isMine = await stealth.isStealthAddressMine(stealthAddr, ephemeralPubKey);

if (isMine) {
  // Open to get wallet
  const wallet = await stealth.openStealthAddress(stealthAddr, ephemeralPubKey);
  
  console.log('✅ Stealth address opened!');
  console.log('Address:', wallet.address);
  console.log('Can spend with this wallet');
}
```

### Batch Generation

```typescript
const recipients = [
  {
    viewingKey: "0x...",
    spendingKey: "0x...",
  },
  // ... more recipients
];

const results = await stealth.generateMultipleStealthAddresses(recipients);

results.forEach((r, i) => {
  console.log(`${i + 1}. ${r.stealthAddress}`);
});
```

### Scanning with View Tags

```typescript
// Get announcements from blockchain
const announcements: AnnouncedStealth[] = [
  {
    stealthAddress: "0x...",
    ephemeralPublicKey: "0x...",
    viewTag: "0x1a",
    schemeId: 0,
    announcer: "0x...",
  },
  // ... more announcements
];

// Quick scan with view tags (filter)
const potential = await stealth.quickScanWithViewTags(announcements);
console.log(`${potential.length}/${announcements.length} potential matches`);

// Full scan
const owned = await stealth.scanStealthAddresses(potential);
console.log(`Found ${owned.length} owned stealth addresses`);

// Access owned addresses
owned.forEach(addr => {
  console.log('Address:', addr.stealthAddress);
  console.log('Private Key:', addr.privateKey);
  console.log('Wallet ready:', addr.wallet.address);
});
```

### Export/Import Keys

```typescript
// Export (encrypted)
const encrypted = await stealth.exportStealthKeys();
console.log('Encrypted keys:', encrypted);

// Later, import
await stealth.importStealthKeys(encrypted);
console.log('✅ Keys restored');
```

---

## Testing

### CLI Testing

```bash
# Terminal 1: Start Gun relay
cd shogun-core
yarn gun-relay

# Terminal 2: Test stealth CLI
yarn stealth alice password123
```

### Programmatic Testing

```typescript
import { SHIP_00, SHIP_02, SHIP_03 } from 'shogun-core';

async function testStealth() {
  // Setup
  const identity = new SHIP_00();
  await identity.register('alice', 'test123');
  
  const eth = new SHIP_02(identity);
  await eth.initialize();
  
  const stealth = new SHIP_03(identity, eth);
  await stealth.initialize();
  
  // Get keys
  const keys = await stealth.getStealthKeys();
  assert(keys.viewingKey.publicKey);
  assert(keys.spendingKey.publicKey);
  
  // Generate stealth address
  const result = await stealth.generateStealthAddress(
    keys.viewingKey.publicKey,
    keys.spendingKey.publicKey
  );
  
  assert(result.success);
  assert(result.stealthAddress);
  
  // Open stealth address
  const wallet = await stealth.openStealthAddress(
    result.stealthAddress!,
    result.ephemeralPublicKey!
  );
  
  assert(wallet.address === result.stealthAddress);
  
  console.log('✅ All tests passed!');
}
```

---

## Integration with SHIP-02

SHIP-03 **requires** SHIP-02 for Ethereum operations:

```typescript
// SHIP-02: Main wallet
const primaryAddr = await eth.getPrimaryAddress();
console.log('Main Address:', primaryAddr);

// SHIP-03: Stealth addresses
const stealthResult = await stealth.generateStealthAddress(
  viewingKey,
  spendingKey
);
console.log('Stealth Address:', stealthResult.stealthAddress);

// Send from main to stealth
const tx = {
  to: stealthResult.stealthAddress,
  value: ethers.parseEther('0.1')
};

await eth.signTransaction(tx, primaryAddr);
```

---

## ERC-5564 Compatibility

SHIP-03 implements the **ERC-5564 Stealth Address Standard**:

### Announcement Event

```solidity
event Announcement(
    uint256 indexed schemeId,
    address indexed stealthAddress,
    address indexed caller,
    bytes ephemeralPubKey,
    bytes metadata
);
```

### Metadata Format

```
metadata = viewTag (1 byte) || extra data (optional)
```

### Parsing Announcements

```typescript
const announcement = await stealth.parseAnnouncement(txReceipt);

if (announcement) {
  console.log('Scheme ID:', announcement.schemeId);
  console.log('Stealth Address:', announcement.stealthAddress);
  console.log('Ephemeral Key:', announcement.ephemeralPublicKey);
  console.log('View Tag:', announcement.viewTag);
}
```

---

## Fluidkey Integration

SHIP-03 uses **@fluidkey/stealth-account-kit** for:

1. **`generateKeysFromSignature`**: Derive stealth keys from SHIP-00 signature
2. **`generateEphemeralPrivateKey`**: HD-based ephemeral key generation
3. **`generateStealthAddresses`**: Batch stealth address creation
4. **`generateStealthPrivateKey`**: Open stealth addresses

### Key Difference from Plugin

**shogun-stealth-address plugin**: Requires separate Gun storage  
**SHIP-03**: Derives keys from SHIP-00, no extra storage needed

---

## View Tag Optimization

View tags enable **fast scanning** without checking every announcement:

```typescript
// Without view tags: O(n) full checks
for (announcement of announcements) {
  const wallet = await openStealthAddress(announcement);
  if (wallet.address === announcement.stealthAddress) {
    // Found!
  }
}

// With view tags: O(n) quick filter + O(m) full checks (m << n)
const potential = await stealth.quickScanWithViewTags(announcements);
// potential.length << announcements.length

const owned = await stealth.scanStealthAddresses(potential);
```

**Performance**:
- **10,000 announcements** without view tags: ~10,000 ECDH operations
- **10,000 announcements** with view tags: ~100 ECDH operations (99% reduction)

---

## Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Announce stealth address | ~50,000 | ERC-5564 Announcement event |
| Send to stealth address | 21,000 | Standard ETH transfer |
| Spend from stealth | 21,000 | Standard ETH transfer |
| **Total** | ~92,000 | Comparable to 2 normal transfers |

---

## Comparison

| Feature | Single-Key | Dual-Key (SHIP-03) |
|---------|------------|-------------------|
| Scanning Safety | ❌ Requires spending key | ✅ Viewing key only |
| Key Separation | ❌ One key for both | ✅ Separate concerns |
| Server Scanning | ❌ Unsafe | ✅ Safe with viewing key |
| ERC-5564 Compatible | ⚠️ Limited | ✅ Full support |
| Fluidkey Compatible | ❌ No | ✅ Yes |

---

## API Reference

### Initialization

```typescript
constructor(identity: ISHIP_00, eth: ISHIP_02, config?: SHIP_03_Config)
```

```typescript
interface SHIP_03_Config {
  erc5564Compatible?: boolean;  // Default: true
  defaultSchemeId?: number;      // Default: 0
  enableViewTag?: boolean;       // Default: true
  autoScan?: boolean;            // Default: false
}
```

### Core Methods

#### `getStealthKeys(): Promise<StealthKeys>`

Get user's stealth keys (viewing + spending).

#### `generateStealthAddress(viewingKey, spendingKey, ephemeralKey?): Promise<StealthAddressResult>`

Generate stealth address for recipient.

#### `openStealthAddress(address, ephemeralKey): Promise<ethers.Wallet>`

Open stealth address to derive spending wallet.

#### `scanStealthAddresses(announcements): Promise<OwnedStealthAddress[]>`

Scan announcements for owned stealth addresses.

#### `quickScanWithViewTags(announcements): Promise<AnnouncedStealth[]>`

Quick filter using view tags (optimization).

---

## CLI Usage

```bash
# Start CLI
yarn stealth alice password123

# Menu options:
1. Show my stealth keys
2. Generate stealth address
3. Open stealth address (spend)
4. Batch generate stealth addresses
5. Scan for stealth payments
6. Export stealth keys
7. Show wallet info (SHIP-02)
8. Logout
```

---

## References

- **ERC-5564**: [Stealth Addresses Standard](https://eips.ethereum.org/EIPS/eip-5564)
- **Fluidkey**: [Stealth Account Kit](https://github.com/fluidkey/stealth-account-kit)
- **SHIP-00**: [Identity & Authentication](./SHIP_00.md)
- **SHIP-02**: [HD Wallet](./SHIP_02.md)

---

## Related SHIPs

- ✅ **SHIP-00**: Identity Foundation (base layer)
- ✅ **SHIP-02**: HD Wallet (transaction signing)
- ✅ **SHIP-04**: Multi-Modal Auth (flexible login)

## Future Enhancements

- [ ] On-chain announcement registry
- [ ] ERC-5564 messenger contract integration
- [ ] Mobile scanning with viewing key
- [ ] Multi-chain support (Polygon, Arbitrum, etc.)
- [ ] Hardware wallet integration for spending key

---

<div align="center">

**SHIP-03: Privacy-Preserving Payments** 🎭

Built with ❤️ by the Shogun Team

</div>

