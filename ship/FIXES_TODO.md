# 🔧 SHIP Standards - Action Plan per Correzioni

**Based on**: CONSISTENCY_REPORT.md  
**Priority**: HIGH → MEDIUM → LOW

---

## ✅ PRIORITÀ ALTA (Immediate - Must Fix)

### 1. ✅ Fix ship/README.md - Tabella SHIP (CRITICO)

**File**: `ship/README.md`  
**Linee**: 10-20

**BEFORE:**
```markdown
| # | Name | Status | Description |
|---|------|--------|-------------|
| [**SHIP-00**](./SHIP_00.md) | Decentralized Identity & Authentication | ✅ Implemented | Foundation layer for identity and authentication |
| [**SHIP-01**](./SHIP_01.md) | Decentralized Encrypted Messaging | ✅ Implemented | P2P encrypted messaging (depends on SHIP-00) |
| [**SHIP-02**](./SHIP_02.md) | Ethereum HD Wallet | ✅ Implemented | BIP-44 HD wallet, transaction signing & sending (extends SHIP-00) |
| [**SHIP-03**](./SHIP_03.md) | Dual-Key Stealth Addresses | ✅ Implemented | ERC-5564 privacy-preserving stealth addresses |
| [**SHIP-04**](./SHIP_04.md) | Multi-Modal Authentication | ✅ Implemented | OAuth, WebAuthn, Nostr, Web3 auth (extends SHIP-00) |
| [**SHIP-05**](./SHIP_05.md) | Decentralized File Storage | ✅ Implemented | Encrypted IPFS storage (depends on SHIP-00) |
| **SHIP-06** | On-Chain Storage Tracking | 💡 Proposed | Smart contract relay network, subscriptions, MB tracking |
```

**AFTER:**
```markdown
| # | Name | Status | Description |
|---|------|--------|-------------|
| [**SHIP-00**](./SHIP_00.md) | Decentralized Identity & Authentication | ✅ Implemented | Foundation layer for identity and authentication |
| [**SHIP-01**](./SHIP_01.md) | Decentralized Encrypted Messaging | ✅ Implemented | P2P encrypted messaging (depends on SHIP-00) |
| [**SHIP-02**](./SHIP_02.md) | Ethereum HD Wallet | ✅ Implemented | BIP-44 HD wallet, transaction signing & sending (extends SHIP-00) |
| [**SHIP-03**](./SHIP_03.md) | Dual-Key Stealth Addresses | ✅ Implemented | ERC-5564 privacy-preserving stealth addresses |
| [**SHIP-04**](./SHIP_04.md) | Multi-Modal Authentication | ✅ Implemented | OAuth, WebAuthn, Nostr, Web3 auth (extends SHIP-00) |
| [**SHIP-05**](./SHIP_05.md) | Decentralized File Storage | ✅ Implemented | Encrypted IPFS storage (depends on SHIP-00) |
| [**SHIP-06**](./SHIP_06.md) | Ephemeral P2P Messaging | ✅ Implemented | Real-time relay-based ephemeral messaging |
| [**SHIP-07**](./SHIP_07.md) | Secure Vault | ✅ Implemented | Encrypted key-value storage on GunDB |
| **SHIP-08** | On-Chain Storage Tracking | 💡 Proposed | Smart contract relay network, subscriptions, MB tracking |
```

---

### 2. ✅ Fix ship/README.md - Statistics (CRITICO)

**File**: `ship/README.md`  
**Linee**: 233-239

**BEFORE:**
```markdown
| Metric | Value |
|---------|--------|
| Total SHIPs | 7 (6 implemented, 1 proposed) |
| Contributors | Open to everyone! |
| Lines of Code | ~12,000+ (SHIP-00 through SHIP-05 + examples) |
| CLI Examples | 5 (identity, messenger, wallet, stealth, storage) |
| Status | Active Development 🚀 |
```

**AFTER:**
```markdown
| Metric | Value |
|---------|--------|
| Total SHIPs | 9 (7 implemented, 1 proposed) |
| Contributors | Open to everyone! |
| Lines of Code | ~18,000+ (SHIP-00 through SHIP-07 + examples) |
| CLI Examples | 7 (identity, messenger, wallet, stealth, storage, ephemeral, vault) |
| Status | Active Development 🚀 |
```

---

### 3. ✅ Fix ship/README.md - Architecture Diagram (CRITICO)

**File**: `ship/README.md`  
**Linee**: 241-255

**BEFORE:**
```
SHIP-00 (Identity Foundation)
   │
   ├─► SHIP-01 (Messaging) ✅
   ├─► SHIP-02 (HD Wallet) ✅
   │      │
   │      └─► SHIP-03 (Stealth Addresses) ✅
   │
   ├─► SHIP-04 (Multi-Modal Auth) ✅
   ├─► SHIP-05 (File Storage) ✅
   │      │
   │      └─► SHIP-06 (On-Chain Storage Tracking) 💡
```

**AFTER:**
```
SHIP-00 (Identity Foundation)
   │
   ├─► SHIP-01 (Messaging) ✅
   ├─► SHIP-02 (HD Wallet) ✅
   │      │
   │      └─► SHIP-03 (Stealth Addresses) ✅
   │
   ├─► SHIP-04 (Multi-Modal Auth) ✅
   ├─► SHIP-05 (File Storage) ✅
   │      │
   │      └─► SHIP-08 (On-Chain Storage Tracking) 💡
   │
   ├─► SHIP-06 (Ephemeral Messaging) ✅
   └─► SHIP-07 (Secure Vault) ✅
```

---

### 4. ✅ Fix ISHIP_06.ts - Remove WebTorrent References (CRITICO)

**File**: `ship/interfaces/ISHIP_06.ts`  
**Linee**: 107-117

**BEFORE:**
```typescript
/**
 * @notice Connect to ephemeral swarm
 * @dev Joins WebTorrent swarm and establishes P2P connections
 * 
 * Flow:
 * 1. Hash room ID with SHA-256 for swarm identifier
 * 2. Join WebTorrent swarm with hashed ID
 * 3. Listen for peer connections
 * 4. Exchange SEA public keys with peers
 * 5. Establish encrypted channels
 */
connect(): Promise<void>;
```

**AFTER:**
```typescript
/**
 * @notice Connect to ephemeral swarm
 * @dev Joins Gun relay network and establishes encrypted channels
 * 
 * Flow:
 * 1. Hash room ID with SHA-256 for swarm identifier (Web Crypto API)
 * 2. Create Gun nodes for ephemeral room (ephemeral/[swarmId])
 * 3. Announce presence with heartbeat (every 5s)
 * 4. Listen for peer announcements via Gun relay
 * 5. Exchange SEA public keys via presence node
 * 6. Establish encrypted message channels via ECDH
 */
connect(): Promise<void>;
```

---

### 5. ✅ Fix SHIP_07.md - Update Status (CRITICO)

**File**: `ship/SHIP_07.md`  
**Linea**: 3

**BEFORE:**
```markdown
> **Status**: 💡 Proposed
```

**AFTER:**
```markdown
> **Status**: ✅ Implemented
```

---

## ⚠️ PRIORITÀ MEDIA (Important - Should Fix)

### 6. ⚠️ Fix SHIP_05.md - Remove Relay Methods from Interface Section

**File**: `ship/SHIP_05.md`  
**Linee**: 213-270

**ACTION**: Rimuovere questa intera sezione dall'interface:

```markdown
// ============================================
// RELAY MANAGEMENT
// ============================================

/**
 * Get available storage relays
 */
getAvailableRelays(): Promise<RelayInfo[]>;

// ... (tutti i metodi relay/subscription)
```

**REASON**: Questi metodi non sono in ISHIP_05.ts e saranno parte di SHIP-08 (futuro)

**KEEP**: La menzione nella sezione "Future Improvements" va bene:

```markdown
### SHIP-08: On-Chain Storage Tracking (New SHIP)

- [ ] **Relay Network**: Smart contract registry for storage providers
- [ ] **Subscriptions**: On-chain payment and quota management
```

---

### 7. ⚠️ Fix SHIP_05.md - Clarify SEA Encryption Only

**File**: `ship/SHIP_05.md`  
**Linee**: 353-397

**BEFORE** (section header):
```markdown
### 1. SEA Encryption (from SHIP-00)

**Encryption using User's SEA Keypair:**
```

**Keep this section**, but **REMOVE** later references to:
- "Deterministic encryption from wallet signatures" (line 11, 23)
- `generateEncryptionKey()` method (line 197)

**ADD clarification:**
```markdown
### 1. SEA Encryption (from SHIP-00)

**SHIP-05 uses ONLY SEA encryption** from the user's SHIP-00 keypair.

- ✅ No wallet signatures needed
- ✅ No separate encryption keys
- ✅ No password requirements
- ✅ Same keypair as SHIP-00 identity

**Process:**
```typescript
// 1. Get SEA pair from SHIP-00 identity
const seaPair = identity.getKeyPair();

// 2. Encrypt with SEA
const encrypted = await crypto.encrypt(data, seaPair);

// 3. Upload encrypted data to IPFS
```

---

### 8. ⚠️ Fix SHIP_05.md - Remove generateEncryptionKey()

**File**: `ship/SHIP_05.md`  
**Linee**: circa 194-211

**REMOVE** this entire method from interface documentation:

```markdown
/**
 * Generate deterministic encryption key
 * @param options Key derivation options
 * @returns Encryption key
 */
generateEncryptionKey(options?: KeyDerivationOptions): Promise<string>;
```

**REASON**: Not in ISHIP_05.ts interface, not implemented

---

### 9. ⚠️ Fix SHIP_05.md - Update Scope Section

**File**: `ship/SHIP_05.md`  
**Linee**: 305-347

**UPDATE** references from "SHIP-06" to "SHIP-08":

**BEFORE:**
```markdown
### SHIP-06: On-Chain Storage Tracking (Future Proposal)

**Focus**: Payment and governance layer for storage

💡 **Will include:**
```

**AFTER:**
```markdown
### SHIP-08: On-Chain Storage Tracking (Future Proposal)

**Focus**: Payment and governance layer for storage

💡 **Will include:**
```

**AND UPDATE** diagram:

**BEFORE:**
```
SHIP-05 (Base Storage) ✅
   ↓ can be extended by
SHIP-06 (On-Chain Tracking) 💡
```

**AFTER:**
```
SHIP-05 (Base Storage) ✅
   ↓ can be extended by
SHIP-08 (On-Chain Tracking) 💡
```

---

## 📝 PRIORITÀ BASSA (Nice to Have)

### 10. 📝 Add Status Badges to All SHIP Docs

**Files**: `ship/SHIP_*.md` (all)

**Add consistent header format:**

```markdown
# SHIP-XX: [Title]

> **Status**: ✅ Implemented | 💡 Proposed  
> **Author**: Shogun Team  
> **Created**: YYYY-MM-DD  
> **Updated**: YYYY-MM-DD  
> **Dependencies**: [SHIP-00] (if applicable)
```

**Files to update:**
- ✅ SHIP-00.md (already has)
- ✅ SHIP-01.md (already has)
- ✅ SHIP-02.md (already has)
- ✅ SHIP-03.md (already has)
- ✅ SHIP-04.md (already has)
- ✅ SHIP-05.md (already has)
- ✅ SHIP-06.md (already has)
- ⚠️ SHIP-07.md (needs status update to "Implemented")

---

### 11. 📝 Create SHIP-08 Proposal Doc

**File**: `ship/SHIP_08.md` (NEW FILE)

**Content** (draft):

```markdown
# SHIP-08: On-Chain Storage Tracking

> **Status**: 💡 Proposed  
> **Author**: Shogun Team  
> **Created**: 2025-01-12  
> **Dependencies**: [SHIP-05](./SHIP_05.md) (Decentralized File Storage)

---

## Abstract

SHIP-08 extends SHIP-05 to provide on-chain payment and governance for decentralized storage. This protocol enables relay operators to monetize storage services while users pay for IPFS pinning and bandwidth.

**Key Features:**
- 💰 Smart contract relay registry
- 📊 On-chain MB usage tracking
- 💳 Subscription management
- 🏦 Automated fee distribution
- 🔍 Relay discovery and comparison

---

## Motivation

SHIP-05 provides core encrypted file storage, but lacks:
- Payment system for storage providers
- Incentive mechanism for relay operators
- Usage tracking and quota enforcement
- Decentralized relay discovery

SHIP-08 solves this with a smart contract-based payment layer.

---

## Specification

[TO BE COMPLETED]

---

## Status

This is a **proposed standard**. Implementation planned for future release.

**Discussion**: [GitHub Issues]
**Target**: Q2 2025
```

---

## 📋 Testing Checklist

After applying fixes, verify:

- [ ] `ship/README.md` table shows 7 implemented, 1 proposed
- [ ] All SHIP-06 links work correctly
- [ ] SHIP-07 shows "Implemented" status
- [ ] ISHIP_06.ts has no WebTorrent references
- [ ] SHIP_05.md doesn't list relay methods in interface
- [ ] Architecture diagram is correct
- [ ] Statistics are accurate
- [ ] All CLI examples mentioned exist
- [ ] No broken cross-references between docs

---

## 🚀 Rollout Plan

### Phase 1: Critical Fixes (Day 1)
- Fix README.md (items 1-3)
- Fix ISHIP_06.ts (item 4)
- Fix SHIP_07.md status (item 5)

### Phase 2: Documentation Cleanup (Day 2)
- Fix SHIP_05.md relay methods (item 6)
- Clarify SEA encryption (items 7-8)
- Update SHIP-06 → SHIP-08 references (item 9)

### Phase 3: Polish (Day 3)
- Add status badges (item 10)
- Create SHIP-08 proposal (item 11)
- Update all examples

---

## ✅ Success Criteria

1. **No inconsistencies** between interface and docs
2. **README.md accurate** for all SHIP standards
3. **Clear separation** between implemented and proposed features
4. **No obsolete references** (WebTorrent, wrong SHIP numbers)
5. **Consistent status badges** across all docs

---

**Created**: 2025-01-12  
**Owner**: Shogun Core Team  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours

