# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.3.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration to provide a secure, user-friendly foundation for Web3 applications.

## Key Features

- **[Multi-Method Authentication](wiki/core.md#authentication)**: Support for traditional passwords, WebAuthn biometrics, Ethereum wallets, and Nostr/Bitcoin protocols
- **[Decentralized Storage](wiki/gundb.md)**: Built on GunDB with offline resilience, real-time sync, and peer-to-peer networking
- **[Reactive Data Flows](wiki/gundb.md#reactive-programming-with-rxjs)**: RxJS integration for building responsive, real-time user interfaces
- **[Enterprise Security](wiki/core.md#security)**: End-to-end encryption, secure key management, and modern cryptographic standards
- **[Plugin Architecture](wiki/core.md#plugin-system)**: Extensible system for adding custom authentication methods and functionality

## Core Components

- **[Core SDK](wiki/core.md)**: Main SDK entry point, configuration, and plugin management
- **[GunDB Integration](wiki/gundb.md)**: Enhanced wrapper around GunDB with direct authentication and RxJS support
- **[WebAuthn Plugin](wiki/webauthn.md)**: Passwordless authentication with biometrics and security keys
- **[Web3 Plugin](wiki/web3.md)**: Ethereum wallet integration and blockchain authentication
- **[Nostr Plugin](wiki/nostr.md)**: Bitcoin and Nostr protocol integration for decentralized identity

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

```typescript
import { ShogunCore } from "shogun-core";

// Initialize Shogun Core
const shogun = new ShogunCore({
  peers: ["https://your-gun-peer.com/gun"],
  scope: "my-app",
  
  // Configure logging
  logging: {
    enabled: true,
    level: "info"
  }
});

// Basic authentication
const loginResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("User logged in:", loginResult.userPub);
}

// Access built-in plugins
const webauthnPlugin = shogun.getPlugin("webauthn");
const web3Plugin = shogun.getPlugin("web3");
const nostrPlugin = shogun.getPlugin("nostr");

// Work with decentralized data
const gundb = shogun.gundb;
await gundb.put("user/profile", { name: "John Doe", status: "online" });
const profile = await gundb.get("user/profile");

// Reactive data with RxJS
shogun.observe("user/profile").subscribe(profile => {
  console.log("Profile updated:", profile);
});
```

## Advanced Usage

### Event Handling

```typescript
// Listen for authentication events
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.userPub);
});

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("error", (error) => {
  console.error("SDK error:", error);
});
```

## Documentation

For detailed documentation on each component:

### Core Documentation
- **[Core SDK API](wiki/core.md)** - Main SDK initialization, configuration, and authentication
- **[GunDB Integration](wiki/gundb.md)** - Decentralized database operations and reactive data

### Plugin Documentation
- **[WebAuthn Plugin](wiki/webauthn.md)** - Biometric and security key authentication
- **[Web3 Plugin](wiki/web3.md)** - Ethereum wallet integration
- **[Nostr Plugin](wiki/nostr.md)** - Bitcoin and Nostr protocol support

### Technical Documentation
Full API documentation is available in the `/docs` directory after building.

## Use Cases

Shogun Core is ideal for building:

- **Decentralized Social Networks**: Chat apps, forums, and social platforms with user-owned data
- **Web3 Wallets**: Browser-based cryptocurrency wallets with multiple authentication options
- **Enterprise dApps**: Business applications requiring secure, decentralized data storage
- **Gaming Platforms**: Real-time multiplayer games with decentralized leaderboards and assets
- **Privacy-Focused Applications**: Apps requiring anonymous interactions and privacy features
- **Collaborative Tools**: Real-time document editing, project management, and team coordination

## Browser Compatibility

Shogun Core supports all modern browsers with:
- WebAuthn API support (Chrome 67+, Firefox 60+, Safari 14+)
- WebCrypto API support
- IndexedDB support
- WebSocket support for real-time synchronization

## Node.js Support

Full Node.js support for server-side applications, testing, and automation.

## Contributing

We welcome contributions! Please follow our contribution guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://conventionalcommits.org/) for commit messages.

## License

MIT License - see [LICENSE](LICENSE) file for details.
