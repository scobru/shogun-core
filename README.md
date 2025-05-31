# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun SDK is a comprehensive toolkit for Web3 developers that simplifies decentralized authentication, wallet management, and data storage. It combines GunDB's decentralization with modern authentication standards and blockchain integration to provide a secure and user-friendly foundation for decentralized applications.

## Key Features

- **[Authentication](wiki/core.md#authentication)**: Multi-method auth with WebAuthn, MetaMask, and traditional approaches
- **[Storage](wiki/gundb.md)**: Decentralized with GunDB, with offline resilience and real-time sync
- **[Reactive Data](wiki/gundb.md#reactive-programming-with-rxjs)**: RxJS integration for real-time reactive data flows
- **[Wallet Management](wiki/bip44.md)**: BIP-44 standard wallet implementation with comprehensive features
- **[Privacy](wiki/stealth-address.md)**: Stealth address implementation for enhanced transaction privacy
- **[Security](wiki/core.md)**: End-to-end encryption and modern security standards

## Core Components

- **[Core SDK](wiki/core.md)**: Main SDK entry point and configuration
- **[GunDB Integration](wiki/gundb.md)**: Enhanced wrapper around GunDB with additional features
- **[WebAuthn](wiki/webauthn.md)**: Passwordless authentication with biometrics and security keys
- **[Ethereum](wiki/ethereum.md)**: MetaMask integration and Ethereum wallet support
- **[Bitcoin](wiki/bitcoin.md)**: Bitcoin and Nostr protocol integration
- **[BIP44 HD Wallet](wiki/bip44.md)**: Hierarchical deterministic wallet implementation
- **[Stealth Addresses](wiki/stealth-address.md)**: Privacy-enhancing features for blockchain transactions
- **[Contracts SDK](wiki/contracts.md)**: Tools for interacting with Shogun Protocol smart contracts

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

```typescript
import { ShogunCore } from "shogun-core";

// Initialize for Node.js environment
const shogun = new ShogunCore({
  peers: ["https://your-gun-peer.com/gun"],
  scope: "app-namespace",
  
  // Enable required plugins
  webauthn: { enabled: true },
  ethereum: { enabled: true },
  stealthAddress: { enabled: true },
  bip32: { enabled: true },
  bitcoin: { enabled: true }
});

// Authentication
const loginResult = await shogun.login("username", "password");

// Access plugins
const webauthnPlugin = shogun.getPlugin("webauthn");
const ethereumPlugin = shogun.getPlugin("ethereum");
const bip32Plugin = shogun.getPlugin("bip32");
const stealthPlugin = shogun.getPlugin("stealth");
const bitcoinPlugin = shogun.getPlugin("bitcoin");
```

## Documentation

For detailed documentation on each component, please refer to the wiki pages:

- **[Core SDK Documentation](wiki/core.md)**
- **[GunDB Integration](wiki/gundb.md)**
- **[WebAuthn Plugin](wiki/webauthn.md)**
- **[Ethereum Plugin](wiki/ethereum.md)**
- **[Bitcoin Plugin](wiki/bitcoin.md)**
- **[BIP44 HD Wallet Plugin](wiki/bip44.md)**
- **[Stealth Address Plugin](wiki/stealth-address.md)**
- **[Contracts SDK](wiki/contracts.md)**

Full technical documentation is available [here](https://shogun-core-docs.vercel.app/).

## Use Cases

Shogun is particularly suitable for:

- **dApps**: Decentralized applications requiring user authentication and wallet management
- **Web Wallets**: Implementation of crypto wallets directly in the browser
- **Social dApps**: Social applications requiring decentralized storage and crypto identities
- **Privacy-Focused Apps**: Applications needing stealth features and advanced privacy
- **Real-time Applications**: Chat apps, live dashboards, and collaborative tools using reactive data

## Contributing

Contributions are welcome! If you would like to contribute to the project, please:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Added amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
