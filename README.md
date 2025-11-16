# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v2.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's or Holster's peer-to-peer networking with modern authentication standards and blockchain integration.

**Now supports both Gun and Holster!** You can use either database backend - Gun for maximum compatibility or Holster for modern ES modules and improved performance.

## Features

- 🔐 **Multiple Authentication Methods**: Password, WebAuthn (biometrics), Web3 (MetaMask), Nostr, ZK-Proof (anonymous)
- 🌐 **Decentralized Storage**: Built on GunDB or Holster for peer-to-peer data synchronization
- 🔄 **Dual Database Support**: Use Gun (maximum compatibility) or Holster (modern ES modules, improved performance)
- 🔌 **Plugin System**: Extensible architecture with built-in plugins
- 💼 **Smart Wallet**: Account Abstraction with multi-sig, social recovery, and batch transactions
- 📱 **Reactive Programming**: RxJS integration for real-time data streams
- 🛡️ **Security**: End-to-end encryption and secure key management
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

### Using Gun (Default)

```typescript
import { ShogunCore } from "shogun-core";
import Gun from "gun";

// Create Gun instance first
const gun = Gun({ 
  peers: ['https://gun-manhattan.herokuapp.com/gun'] 
});

// Initialize Shogun Core with the Gun instance
const shogun = new ShogunCore({
  gunInstance: gun,
  
  // Enable authentication plugins
  web3: { enabled: true },
  webauthn: { 
    enabled: true,
    rpName: "My Awesome App",
    rpId: window.location.hostname,
  },
  nostr: { enabled: true },
  zkproof: { 
    enabled: true,
    defaultGroupId: "my-app-users",
  },
});

// Register Smart Wallet plugin separately if needed
import { SmartWalletPlugin } from "shogun-core";

const smartWalletPlugin = new SmartWalletPlugin({
  enabled: true,
  factoryAddress: "0x...",
  defaultRequiredSignatures: 1,
  defaultRequiredGuardians: 2,
});

shogun.register(smartWalletPlugin);
```

### Using Holster (Alternative)

```typescript
import { ShogunCore } from "shogun-core";
import Holster from "@mblaney/holster";

// Create Holster instance first
const holster = Holster({ 
  peers: ['ws://localhost:8765'] 
});

// Initialize Shogun Core with the Holster instance
const shogun = new ShogunCore({
  holsterInstance: holster,  // Use Holster instead of Gun
  
  // Enable authentication plugins (same as Gun)
  web3: { enabled: true },
  webauthn: { 
    enabled: true,
    rpName: "My Awesome App",
    rpId: window.location.hostname,
  },
  nostr: { enabled: true },
  zkproof: { 
    enabled: true,
    defaultGroupId: "my-app-users",
  },
});

// All other APIs work the same way!
```

## Basic Database Operations

```typescript
const db = shogun.db;

// Store data using Gun chaining
await db.get('users').get('alice').get('profile').put({
  name: 'Alice Smith',
  email: 'alice@example.com'
});

// Read data
const profile = await db.get('users').get('alice').get('profile').once().then();

// Update specific fields
await db.get('users').get('alice').get('profile').get('name').put('Alice Johnson');

// Iterate over collections with .map()
db.get('users').map((user, userId) => {
  console.log(`User ${userId}:`, user);
});
```

## Authentication Methods

### 1. Traditional Authentication

```typescript
// Sign up
const signUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
}

// Login
const loginResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
}
```

### 2. Web3 Plugin API

```typescript
const web3Plugin = shogun.getPlugin("web3");

if (web3Plugin && web3Plugin.isAvailable()) {
  const connectionResult = await web3Plugin.connectMetaMask();
  
  if (connectionResult.success) {
    const address = connectionResult.address!;
    
    // Login with Web3 wallet
    const loginResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log("Web3 login successful");
    }
    
    // Register new user
    const signUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log("Web3 registration successful");
    }
  }
}
```

### 3. WebAuthn Plugin API

```typescript
const webauthnPlugin = shogun.getPlugin("webauthn");

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // Register with seed phrase for multi-device support
  const signUpResult = await webauthnPlugin.signUp("username", {
    generateSeedPhrase: true
  });
  
  if (signUpResult.success && signUpResult.seedPhrase) {
    console.log("🔑 SAVE THESE 12 WORDS:", signUpResult.seedPhrase);
  }

  // Import account on another device
  const importResult = await webauthnPlugin.importFromSeed(
    "username",
    "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
  );
  
  // Authenticate
  const loginResult = await webauthnPlugin.login("username");
  if (loginResult.success) {
    console.log("WebAuthn authentication successful");
  }
}
```

### 4. Nostr Plugin API

```typescript
const nostrPlugin = shogun.getPlugin("nostr");

if (nostrPlugin && nostrPlugin.isAvailable()) {
  const connectionResult = await nostrPlugin.connectNostrWallet();
  
  if (connectionResult.success) {
    const address = connectionResult.address!;
    
    const loginResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log("Nostr login successful");
    }
    
    const signUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log("Nostr registration successful");
    }
  }
}
```

### 5. ZK-Proof Plugin API

```typescript
const zkPlugin = shogun.getPlugin("zkproof");

if (zkPlugin && zkPlugin.isAvailable()) {
  // Sign up with ZK-Proof (creates anonymous identity)
  const signUpResult = await zkPlugin.signUp();
  
  if (signUpResult.success && signUpResult.seedPhrase) {
    console.log("🔑 SAVE THIS TRAPDOOR:", signUpResult.seedPhrase);
  }

  // Login with trapdoor (anonymous authentication)
  const loginResult = await zkPlugin.login(trapdoor);
  if (loginResult.success) {
    console.log("ZK-Proof login successful (anonymous)");
  }
}
```

### 6. Smart Wallet Plugin API

```typescript
import { SmartWalletPlugin } from "shogun-core";

// Register Smart Wallet plugin
const smartWalletPlugin = new SmartWalletPlugin({
  enabled: true,
  factoryAddress: "0x...", // Smart Wallet Factory contract address
  defaultRequiredSignatures: 1,
  defaultRequiredGuardians: 2,
});

shogun.register(smartWalletPlugin);

// Configure signer (derive EOA from WebAuthn seed phrase)
const webauthnPlugin = shogun.getPlugin("webauthn");
const signUpResult = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true
});

import { derive } from "shogun-core";

const wallet = await derive(signUpResult.seedPhrase!, "alice", {
  includeSecp256k1Ethereum: true
});

await smartWalletPlugin.setSigner(wallet.secp256k1Ethereum.privateKey);

// Create Smart Wallet with guardians
const result = await smartWalletPlugin.createWalletWithGuardians(
  wallet.secp256k1Ethereum.address,
  [guardian1, guardian2],
  1,  // 1 signature required
  2   // 2 guardians for recovery
);

if (result.success) {
  console.log("Smart Wallet created:", result.walletAddress);
}
```

## Browser Usage (CDN)

### With Gun

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Shogun Core in Browser</title>
  </head>
  <body>
    <h1>My dApp</h1>
    <script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/shogun-core/dist/browser/shogun-core.js"></script>

    <script>
      // Create Gun instance first
      const gun = Gun({ 
        peers: ["https://gun-manhattan.herokuapp.com/gun"] 
      });

      // Initialize Shogun Core
      const shogunCore = new window.SHOGUN_CORE({
        gunInstance: gun,
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "My Browser dApp",
          rpId: window.location.hostname,
        },
      });

      console.log("Shogun Core initialized in browser!", shogunCore);
    </script>
  </body>
</html>
```

### With Holster (ES Modules)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Shogun Core with Holster</title>
  </head>
  <body>
    <h1>My dApp</h1>
    <script type="module">
      import Holster from 'https://cdn.jsdelivr.net/npm/@mblaney/holster/build/holster.js';
      import { ShogunCore } from 'https://cdn.jsdelivr.net/npm/shogun-core/dist/src/index.js';

      // Create Holster instance
      const holster = Holster({ 
        peers: ['ws://localhost:8765'] 
      });

      // Initialize Shogun Core
      const shogunCore = new ShogunCore({
        holsterInstance: holster,
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "My Browser dApp",
          rpId: window.location.hostname,
        },
      });

      console.log("Shogun Core initialized with Holster!", shogunCore);
    </script>
  </body>
</html>
```

## Event System

```typescript
// Listen for authentication events
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
  console.log("Authentication method:", data.method);
});

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
});

// Listen for errors
shogun.on("error", (error) => {
  console.error("Shogun error:", error.message);
});
```

## Database Backend: Gun vs Holster

Shogun Core supports both Gun and Holster as database backends. Choose based on your needs:

### Gun (Default)
- **Pros**: Maximum compatibility, large ecosystem, battle-tested
- **Cons**: Older codebase, CommonJS modules
- **Best for**: Existing projects, maximum compatibility

### Holster
- **Pros**: Modern ES modules, improved performance, cleaner API
- **Cons**: Newer project, smaller ecosystem
- **Best for**: New projects, modern build systems, performance-critical apps

**Note**: The API is identical regardless of which backend you choose. Shogun Core handles all the differences internally.

### Differences to be aware of:
- **Pair-based authentication**: Currently only supported with Gun (username/password works with both)
- **Event system**: Gun has native events, Holster uses polling (handled automatically)
- **Chaining API**: Gun uses `.get().get()`, Holster uses `.get().next()` (handled automatically via proxy)

## Configuration Options

```typescript
interface ShogunCoreConfig {
  gunInstance?: IGunInstance<any>; // Optional: existing Gun instance (required if holsterInstance not provided)
  holsterInstance?: any; // Optional: existing Holster instance (required if gunInstance not provided)
  
  // Plugin configurations
  webauthn?: {
    enabled?: boolean;
    rpName?: string;
    rpId?: string;
  };

  web3?: {
    enabled?: boolean;
  };

  nostr?: {
    enabled?: boolean;
  };

  zkproof?: {
    enabled?: boolean;
    defaultGroupId?: string;
    deterministic?: boolean;
    minEntropy?: number;
  };

  postAuth?: {
    enabled?: boolean;
  };

  // Timeouts
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };

  plugins?: {
    autoRegister?: ShogunPlugin[];
  };

  disableAutoRecall?: boolean; // Disable automatic session recall on init
  silent?: boolean; // Disable console logs
}
```

**Note**: 
- Either `gunInstance` or `holsterInstance` must be provided (but not both)
- `SmartWalletPlugin` must be registered separately using `shogun.register()` as it's not included in the main configuration

## Migration Guide

### From Gun to Holster

If you're currently using Gun and want to switch to Holster:

1. **Install Holster**:
   ```bash
   npm install @mblaney/holster
   # or
   yarn add @mblaney/holster
   ```

2. **Update your initialization**:
   ```typescript
   // Before (Gun)
   import Gun from "gun";
   const gun = Gun({ peers: [...] });
   const shogun = new ShogunCore({ gunInstance: gun });

   // After (Holster)
   import Holster from "@mblaney/holster";
   const holster = Holster({ peers: [...] });
   const shogun = new ShogunCore({ holsterInstance: holster });
   ```

3. **That's it!** All other code remains the same. The API is identical.

### Limitations when using Holster

- Pair-based authentication (`loginWithPair()`) is not yet supported - use username/password instead
- Some advanced Gun features may not be available
- Event system uses polling instead of native events (handled automatically)

## Testing

```bash
# Install dependencies
yarn install

# Run all tests with coverage
yarn test:ci

# Watch mode
yarn test:watch

# Coverage report
yarn coverage

# Plugin tests only
yarn test src/__tests__/plugins
```

## Support

- 📖 [Documentation](https://shogun-core-docs.vercel.app/)
- 💬 [Telegram Community](t.me/shogun_eco)
- 🐛 [Issue Tracker](https://github.com/scobru/shogun-core/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.