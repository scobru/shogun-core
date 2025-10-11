# Shogun Core - SHIP Standards

This folder contains the **SHIP (Shogun Interface Proposals)** specifications developed for the Shogun project, which define standards for decentralized authentication, P2P storage, and encrypted messaging.

> **SHIP = Shogun Interface Proposals** 🗡️  
> Open and implementable standards for the Shogun ecosystem

---

## 📋 Available SHIPs

| # | Name | Status | Description |
|---|------|--------|-------------|
| [**SHIP-00**](./SHIP_00.md) | Decentralized Identity & Authentication | ✅ Implemented | Foundation layer for identity and authentication |
| [**SHIP-01**](./SHIP_01.md) | Decentralized Encrypted Messaging | ✅ Implemented | P2P encrypted messaging (depends on SHIP-00) |
| [**SHIP-02**](./SHIP_02.md) | Ethereum Address Derivation | ✅ Implemented | Deterministic HD wallet derivation (extends SHIP-00) |
| [**SHIP-03**](./SHIP_03.md) | Dual-Key Stealth Addresses | ✅ Implemented | ERC-5564 privacy-preserving stealth addresses |
| **SHIP-04** | Multi-Modal Authentication | 📋 Planned | WebAuthn, OAuth, Nostr, Web3 auth (extends SHIP-00) |
| **SHIP-05** | Encrypted File Storage | 💡 Proposed | Decentralized file storage with IPFS |

---

## 🚀 Quick Start

### SHIP-00: Identity Foundation

```bash
cd shogun-core
yarn install

# Interactive CLI demo
yarn identity alice password123

# Use SHIP-00 in your code
import { SHIP_00 } from "./ship/implementation/SHIP_00";
```

**Read the complete specification**: [SHIP_00.md](./SHIP_00.md)

### SHIP-01: Decentralized Messaging

```bash
cd shogun-core
yarn install
yarn messenger alice password123
```

**Read the complete specification**: [SHIP_01.md](./SHIP_01.md)

### SHIP-02: Ethereum Address Derivation

```bash
cd shogun-core
yarn install
yarn wallet alice password123
```

**Read the complete specification**: [SHIP_02.md](./SHIP_02.md)

### SHIP-03: Dual-Key Stealth Addresses

```typescript
import { SHIP_00, SHIP_02, SHIP_03 } from 'shogun-core';

const identity = new SHIP_00();
await identity.login('alice', 'password');

const eth = new SHIP_02(identity);
await eth.initialize();

const stealth = new SHIP_03(identity, eth);
await stealth.initialize();

// Get stealth keys
const keys = await stealth.getStealthKeys();
```

**Read the complete specification**: [SHIP_03.md](./SHIP_03.md)

---

## 🛠️ Project Structure

```
ship/
├── README.md                          # This file (SHIP index)
├── SHIP_00.md                         # Identity & Authentication spec
├── SHIP_01.md                         # Decentralized Messaging spec
├── SHIP_02.md                         # Ethereum HD Wallet spec
├── SHIP_03.md                         # Dual-Key Stealth Addresses spec
├── interfaces/
│   ├── ISHIP_00.ts                   # Identity interface
│   ├── ISHIP_01.ts                   # Messaging interface
│   ├── ISHIP_02.ts                   # HD Wallet interface
│   └── ISHIP_03.ts                   # Stealth addresses interface
├── implementation/
│   ├── SHIP_00.ts                    # Identity implementation
│   ├── SHIP_01.ts                    # Messaging implementation
│   ├── SHIP_02.ts                    # HD Wallet implementation
│   └── SHIP_03.ts                    # Stealth addresses implementation
└── examples/
    ├── identity-cli.ts               # Identity CLI example (SHIP-00)
    ├── messenger-cli.ts              # Messaging CLI example (SHIP-01)
    ├── wallet-cli.ts                 # Wallet CLI example (SHIP-02)
    └── stealth-cli.ts                # Stealth CLI example (SHIP-03)
```

---

## 📖 Resources

### Documentation
- **Shogun Core**: [../README.md](../README.md)
- **API Documentation**: [../API.md](../API.md)

### SHIP Specifications
- **SHIP-00 (Identity)**: [SHIP_00.md](./SHIP_00.md)
- **SHIP-01 (Messaging)**: [SHIP_01.md](./SHIP_01.md)
- **SHIP-02 (HD Wallet)**: [SHIP_02.md](./SHIP_02.md)
- **SHIP-03 (Stealth Addresses)**: [SHIP_03.md](./SHIP_03.md)

---

## 🤝 How to Contribute

Want to propose a new SHIP? Here's the process:

1. **Fork** the repository
2. **Create** a branch for your proposal
3. **Write** the specification:
   - `SHIP_XX.md` - Complete specification in markdown
   - `interfaces/ISHIP_XX.ts` - TypeScript interface
   - `implementation/SHIP_XX.ts` - Implementation (optional)
   - `examples/SHIP_XX-*.ts` - Practical examples
4. **Update** this README with the new SHIP
5. **Open** a Pull Request

### SHIP Template

Each SHIP must include:
- 📝 **Abstract** - What it does (2-3 lines)
- 🎯 **Motivation** - Why it's needed
- 📐 **Specification** - Detailed interface
- 🔐 **Security** - Security considerations
- 💻 **Implementation** - Reference code
- 📚 **Examples** - Usage examples
- 🧪 **Testing** - How to test

---

## 💬 Community & Links

- 💬 **Telegram**: [t.me/shogun_eco](https://t.me/shogun_eco)
- 💻 **GitHub**: [github.com/scobru/shogun-core](https://github.com/scobru/shogun-core)
- 🐦 **Discord**: Coming soon

---

## 📊 Statistics

| Metric | Value |
|---------|--------|
| Total SHIPs | 6 (4 implemented, 2 planned) |
| Contributors | Open to everyone! |
| Lines of Code | ~7000+ (SHIP-00 + SHIP-01 + SHIP-02 + SHIP-03) |
| Status | Active Development 🚀 |

## 🏗️ SHIP Architecture

```
SHIP-00 (Identity Foundation)
   │
   ├─► SHIP-01 (Messaging) ✅
   ├─► SHIP-02 (HD Wallet) ✅
   │      │
   │      └─► SHIP-03 (Stealth Addresses) ✅
   │
   ├─► SHIP-04 (Multi-Modal Auth) 📋
   └─► SHIP-05 (File Storage) 💡
```

**SHIP-00** is the foundational layer that all other SHIPs depend on for identity and authentication.

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**Developed with ❤️ by the Shogun Team**

🗡️ **SHIP = Shogun Interface Proposals** 🗡️

*Building the decentralized future, one proposal at a time*

</div>


