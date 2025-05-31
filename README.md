# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.1.4-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun SDK is a comprehensive toolkit for Web3 developers that simplifies decentralized authentication, wallet management, and data storage. It combines GunDB's decentralization with modern authentication standards and blockchain integration to provide a secure and user-friendly foundation for decentralized applications.

## Key Features

- **[Authentication](wiki/core.md#authentication)**: Multi-method auth with WebAuthn, Ethereum wallets, and traditional approaches
- **[Storage](wiki/gundb.md)**: Decentralized with GunDB, with offline resilience and real-time sync
- **[Reactive Data](wiki/gundb.md#reactive-programming-with-rxjs)**: RxJS integration for real-time reactive data flows
- **[Security](wiki/core.md)**: End-to-end encryption and modern security standards

## Core Components

- **[Core SDK](wiki/core.md)**: Main SDK entry point and configuration
- **[GunDB Integration](wiki/gundb.md)**: Enhanced wrapper around GunDB with additional features
- **[WebAuthn](wiki/webauthn.md)**: Passwordless authentication with biometrics and security keys
- **[Ethereum](wiki/ethereum.md)**: Ethereum wallet integration and authentication
- **[Bitcoin](wiki/bitcoin.md)**: Bitcoin and Nostr protocol integration
- **[Contracts SDK](wiki/contracts.md)**: Tools for interacting with Shogun Protocol smart contracts

## Additional Plugins

For extended functionality, install these separate plugins:

- **[@shogun/bip44](https://github.com/scobru/shogun-BIP44)**: BIP-44 HD wallet management
- **[@shogun/stealth-address](https://github.com/scobru/shogun-stealth-address)**: Privacy-enhancing stealth addresses

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core

# Optional plugins
npm install @shogun/bip44 @shogun/stealth-address
```

## Quick Start

```typescript
import { ShogunCore } from "shogun-core";

// Initialize for Node.js environment
const shogun = new ShogunCore({
  peers: ["https://your-gun-peer.com/gun"],
  scope: "app-namespace",
  
  // Enable core plugins
  webauthn: { enabled: true },
  ethereum: { enabled: true },
  bitcoin: { enabled: true }
});

// Authentication
const loginResult = await shogun.login("username", "password");

// Access core plugins
const webauthnPlugin = shogun.getPlugin("webauthn");
const ethereumPlugin = shogun.getPlugin("ethereum");
const bitcoinPlugin = shogun.getPlugin("bitcoin");

// Optional: Use external plugins
import { HDWalletPlugin } from "@shogun/bip44";
import { StealthPlugin } from "@shogun/stealth-address";

shogun.registerPlugin(new HDWalletPlugin());
shogun.registerPlugin(new StealthPlugin());

const bip44Plugin = shogun.getPlugin("bip44");
const stealthPlugin = shogun.getPlugin("stealth");
```

## Documentation

For detailed documentation on each component, please refer to the wiki pages:

- **[Core SDK Documentation](wiki/core.md)**
- **[GunDB Integration](wiki/gundb.md)**
- **[WebAuthn Plugin](wiki/webauthn.md)**
- **[Ethereum Plugin](wiki/ethereum.md)**
- **[Bitcoin Plugin](wiki/bitcoin.md)**
- **[Contracts SDK](wiki/contracts.md)**

External plugin documentation:
- **[BIP44 HD Wallet Plugin](https://github.com/scobru/shogun-BIP44)**
- **[Stealth Address Plugin](https://github.com/scobru/shogun-stealth-address)**

Full technical documentation is available [here](https://shogun-core-docs.vercel.app/).

## Use Cases

Shogun is particularly suitable for:

- **dApps**: Decentralized applications requiring user authentication and wallet management
- **Web Wallets**: Implementation of crypto wallets directly in the browser
- **Social dApps**: Social applications requiring decentralized storage and crypto identities
- **Privacy-Focused Apps**: Applications needing stealth features and advanced privacy (with optional plugins)
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
