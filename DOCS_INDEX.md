# Shogun Core - Documentation Index

> **Master Index**: Complete guide to all Shogun Core documentation

---

## 📚 **Main Documentation**

### 1. **Getting Started**
- **[README.md](./README.md)** - Quick start, installation, basic usage
  - Installation instructions
  - Quick start examples
  - Simple API usage
  - Plugin authentication
  - Event system basics

### 2. **API Reference**
- **[API.md](./API.md)** - Complete API documentation
  - Core API methods
  - Plugin APIs (OAuth, WebAuthn, Web3, Nostr)
  - Type definitions
  - Advanced features
  - Error handling
  - Event system
  - Usage examples

---

## 🗡️ **SHIP Standards** (Protocol Specifications)

### Overview
- **[ship/README.md](./ship/README.md)** - SHIP standards index
  - All SHIP standards listed
  - Architecture diagrams
  - Inclusive hierarchy principle
  - Quick start for each SHIP

### SHIP Specifications

| SHIP | Name | File | Status | Description |
|------|------|------|--------|-------------|
| **00** | Identity & Authentication | [SHIP_00.md](./ship/SHIP_00.md) | ✅ Implemented | Foundation layer for all SHIPs |
| **01** | Decentralized Messaging | [SHIP_01.md](./ship/SHIP_01.md) | ✅ Implemented | E2E encrypted P2P messaging |
| **02** | Ethereum HD Wallet | [SHIP_02.md](./ship/SHIP_02.md) | ✅ Implemented | BIP-44 wallet + transaction sending |
| **03** | Stealth Addresses | [SHIP_03.md](./ship/SHIP_03.md) | ✅ Implemented | ERC-5564 privacy addresses |
| **04** | Multi-Modal Auth | [SHIP_04.md](./ship/SHIP_04.md) | ✅ Implemented | OAuth/WebAuthn/Web3/Nostr |
| **05** | File Storage | TBD | 💡 Proposed | Encrypted file storage |

---

## 🎯 **Quick Navigation**

### I want to...

#### **Get Started**
→ Read [README.md](./README.md)

#### **Learn the API**
→ Read [API.md](./API.md)

#### **Understand Authentication**
→ Read [SHIP-00: Identity](./ship/SHIP_00.md)  
→ Read [SHIP-04: Multi-Modal Auth](./ship/SHIP_04.md)

#### **Build a Chat App**
→ Read [SHIP-01: Messaging](./ship/SHIP_01.md)  
→ See [messenger-cli.ts](./ship/examples/messenger-cli.ts)

#### **Build a Wallet**
→ Read [SHIP-02: HD Wallet](./ship/SHIP_02.md)  
→ See [wallet-cli.ts](./ship/examples/wallet-cli.ts)

#### **Add Privacy**
→ Read [SHIP-03: Stealth Addresses](./ship/SHIP_03.md)  
→ See [stealth-cli.ts](./ship/examples/stealth-cli.ts)

#### **Use OAuth/WebAuthn/Web3**
→ Read [SHIP-04: Multi-Modal Auth](./ship/SHIP_04.md)  
→ See [API.md - Plugin APIs](./API.md#plugin-apis)

---

## 📖 **Documentation Structure**

```
shogun-core/
│
├── README.md                  # 🚀 Start here
├── API.md                     # 📚 Complete API reference
├── LLM.md                     # ⚠️  Deprecated (→ API.md)
├── DOCS_INDEX.md              # 📋 This file (master index)
│
└── ship/                      # 🗡️ SHIP Standards
    ├── README.md              # SHIP index
    │
    ├── SHIP_00.md             # Identity & Auth spec
    ├── SHIP_01.md             # Messaging spec
    ├── SHIP_02.md             # HD Wallet spec
    ├── SHIP_03.md             # Stealth Address spec
    ├── SHIP_04.md             # Multi-Modal Auth spec
    │
    ├── interfaces/            # TypeScript interfaces
    │   ├── ISHIP_00.ts
    │   ├── ISHIP_01.ts
    │   ├── ISHIP_02.ts
    │   ├── ISHIP_03.ts
    │   └── ISHIP_04.ts
    │
    ├── implementation/        # Reference implementations
    │   ├── SHIP_00.ts
    │   ├── SHIP_01.ts
    │   ├── SHIP_02.ts
    │   ├── SHIP_03.ts
    │   └── SHIP_04.ts
    │
    └── examples/              # CLI examples
        ├── identity-cli.ts    # SHIP-00 demo
        ├── messenger-cli.ts   # SHIP-01 demo
        ├── wallet-cli.ts      # SHIP-02 demo
        └── stealth-cli.ts     # SHIP-03 demo
```

---

## 🎓 **Learning Path**

### Beginner

1. **[README.md](./README.md)** - Understand what Shogun Core is
2. **[SHIP-00](./ship/SHIP_00.md)** - Learn identity foundation
3. **Try CLI**: `yarn identity alice password123`
4. **[API.md - Simple API](./API.md#-new-simple-api)** - Build your first app

### Intermediate

1. **[SHIP-01](./ship/SHIP_01.md)** - Add encrypted messaging
2. **[SHIP-02](./ship/SHIP_02.md)** - Add wallet functionality
3. **Try CLI**: `yarn messenger alice password123`
4. **Try CLI**: `yarn wallet alice password123`
5. **[API.md - Plugin APIs](./API.md#plugin-apis)** - Use authentication plugins

### Advanced

1. **[SHIP-03](./ship/SHIP_03.md)** - Implement privacy features
2. **[SHIP-04](./ship/SHIP_04.md)** - Multi-modal authentication
3. **Try CLI**: `yarn stealth alice password123`
4. **[API.md - Advanced Features](./API.md#advanced-api-features)** - Master all features
5. **Contribute**: Propose SHIP-05 or improve existing SHIPs

---

## 🔍 **Find Information By Topic**

### Authentication
- **Traditional (username/password)**: [SHIP-00](./ship/SHIP_00.md) + [API.md](./API.md#basic-authentication)
- **OAuth (Google/GitHub)**: [SHIP-04](./ship/SHIP_04.md) + [API.md](./API.md#5-oauth-plugin-api)
- **WebAuthn (Biometric)**: [SHIP-04](./ship/SHIP_04.md) + [API.md](./API.md#3-webauthn-plugin-api)
- **Web3 (MetaMask)**: [SHIP-04](./ship/SHIP_04.md) + [API.md](./API.md#2-web3-plugin-api)
- **Nostr**: [SHIP-04](./ship/SHIP_04.md) + [API.md](./API.md#4-nostr-plugin-api)

### Messaging
- **E2E Encrypted Chat**: [SHIP-01](./ship/SHIP_01.md)
- **Channel/Group Messages**: [SHIP-01](./ship/SHIP_01.md#token-based-messaging)
- **Message History**: [SHIP-01](./ship/SHIP_01.md#usage-examples)

### Blockchain
- **HD Wallet**: [SHIP-02](./ship/SHIP_02.md)
- **BIP-44 Derivation**: [SHIP-02](./ship/SHIP_02.md#bip-44-accounts)
- **Transaction Signing**: [SHIP-02](./ship/SHIP_02.md#transaction-signing--sending)
- **Transaction Sending (RPC)**: [SHIP-02](./ship/SHIP_02.md#transaction-signing--sending)
- **Stealth Addresses**: [SHIP-03](./ship/SHIP_03.md)

### Data Storage
- **Simple API**: [API.md - Simple API](./API.md#-new-simple-api)
- **User Data**: [API.md - User Space](./API.md#user-space-operations)
- **Collections**: [API.md - Collections](./API.md#collections)
- **Advanced Chaining**: [README.md - Chaining](./README.md#-new-advanced-chaining-operations)

### Security
- **Key Management**: [SHIP-00](./ship/SHIP_00.md#security)
- **Message Encryption**: [SHIP-01](./ship/SHIP_01.md#security)
- **Deterministic Derivation**: [SHIP-04](./ship/SHIP_04.md#deterministic-key-derivation)
- **Password Recovery**: [API.md - Password Recovery](./API.md#password-recovery--security-system)
- **Error Handling**: [API.md - Error Handling](./API.md#error-handling--debugging)

---

## 📊 **Documentation Statistics**

| File | Lines | Topic | Status |
|------|-------|-------|--------|
| README.md | ~1,200 | Getting started | ✅ Current |
| API.md | ~1,400 | API reference | ✅ Current |
| LLM.md | ~50 | Legacy | ⚠️ Deprecated |
| ship/README.md | ~250 | SHIP index | ✅ Current |
| ship/SHIP_00.md | ~760 | Identity spec | ✅ Current |
| ship/SHIP_01.md | ~840 | Messaging spec | ✅ Current |
| ship/SHIP_02.md | ~680 | HD Wallet spec | ✅ Current |
| ship/SHIP_03.md | ~700 | Stealth spec | ✅ Current |
| ship/SHIP_04.md | ~600 | Multi-Auth spec | ✅ Current |
| **Total** | **~6,500 lines** | Complete docs | ✅ Consolidated |

---

## 🔄 **Documentation Maintenance**

### Active Documentation (Keep Updated)

✅ **Must Maintain**:
- `README.md` - Always current for new users
- `API.md` - Source of truth for API
- `ship/README.md` - SHIP standards index
- `ship/SHIP_*.md` - All SHIP specifications

### Deprecated Documentation

⚠️ **Deprecated** (keep for historical reference):
- `LLM.md` - Redirects to API.md

### Update Checklist

When adding new features:
- [ ] Update relevant SHIP spec (`SHIP_*.md`)
- [ ] Update interface (`interfaces/ISHIP_*.ts`)
- [ ] Update implementation (`implementation/SHIP_*.ts`)
- [ ] Update API.md if core API changes
- [ ] Update README.md if affects getting started
- [ ] Add example to CLI if applicable
- [ ] Update this index if structure changes

---

## 🤝 **Contributing to Documentation**

### Proposing a New SHIP

1. Read [ship/README.md - How to Contribute](./ship/README.md#-how-to-contribute)
2. Create `ship/SHIP_XX.md` following the template
3. Implement `interfaces/ISHIP_XX.ts`
4. Implement `implementation/SHIP_XX.ts`
5. Add CLI example if applicable
6. Update this index

### Improving Existing Docs

1. Identify which file needs update (use this index)
2. Make changes maintaining structure
3. Update cross-references if needed
4. Test examples still work
5. Submit PR

---

## 📞 **Support & Community**

- 📖 **Documentation Portal**: https://shogun-core-docs.vercel.app/
- 💬 **Telegram**: https://t.me/shogun_eco
- 💻 **GitHub**: https://github.com/scobru/shogun-core
- 🐛 **Issue Tracker**: https://github.com/scobru/shogun-core/issues

---

<div align="center">

**Shogun Core Documentation**

*Complete, Consolidated, Current*

🗡️ Built with care by the Shogun Team 🗡️

Last Updated: 2025-10-11

</div>

