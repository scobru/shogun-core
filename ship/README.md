# Shogun Core - SHIP Standards

This folder contains the **SHIP (Shogun Interface Proposals)** specifications developed for the Shogun project, which define standards for decentralized authentication, P2P storage, and encrypted messaging.

> **SHIP = Shogun Interface Proposals** 🗡️  
> Open and implementable standards for the Shogun ecosystem

---

## 📋 Available SHIPs

| # | Name | Status | Description |
|---|------|--------|-------------|
| [**SHIP-01**](./SHIP_01.md) | Decentralized Encrypted Messaging | ✅ Implemented | P2P encrypted messaging on GunDB with GUN SEA |
| **SHIP-02** | Ethereum Address Derivation | 🚧 In Progress | Deterministic address derivation from SEA keypair |
| **SHIP-03** | Multi-Modal Authentication | 📋 Planned | WebAuthn, OAuth, Nostr, Web3 authentication |
| **SHIP-04** | Encrypted File Storage | 💡 Proposed | Decentralized file storage with IPFS |

---

## 🚀 Quick Start

### SHIP-01: Decentralized Messaging

```bash
cd shogun-core
yarn install
yarn chat alice password123
```

**Read the complete specification**: [SHIP_01.md](./SHIP_01.md)

---

## 🛠️ Project Structure

```
eip/
├── README.md                          # This file (SHIP index)
├── SHIP_01.md                         # Detailed SHIP-01 specification
├── interfaces/
│   └── ISHIP_01.ts                   # TypeScript interface
├── implementation/
│   └── SHIP_01.ts                    # Reference implementation
└── examples/
    └── chat-cli-SHIP_01.ts           # Practical CLI example
```

---

## 📖 Resources

### Documentation
- **Shogun Core**: [../README.md](../README.md)
- **API Documentation**: [../API.md](../API.md)

### SHIP Specifications
- **Complete SHIP-01**: [SHIP_01.md](./SHIP_01.md)

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
| Total SHIPs | 6 (1 live, 2 in progress, 3 proposed) |
| Contributors | Open to everyone! |
| Lines of Code | ~2000+ (SHIP-01) |
| Status | Active Development 🚀 |

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**Developed with ❤️ by the Shogun Team**

🗡️ **SHIP = Shogun Interface Proposals** 🗡️

*Building the decentralized future, one proposal at a time*

</div>


