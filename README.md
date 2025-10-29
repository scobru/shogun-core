# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v2.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration.

## Features

- 🔐 **Multiple Authentication Methods**: Password, WebAuthn (biometrics), Web3 (MetaMask), Nostr, ZK-Proof (anonymous)
- 🌐 **Decentralized Storage**: Built on GunDB for peer-to-peer data synchronization
- 🔌 **Plugin System**: Extensible architecture with built-in plugins
- 💼 **Smart Wallet**: Account Abstraction with multi-sig, social recovery, and batch transactions
- 🔑 **Automatic Crypto Identity Management**: RSA, AES, Signal Protocol, PGP, MLS, and SFrame keys
- 📱 **Reactive Programming**: RxJS integration for real-time data streams
- 🛡️ **Security**: End-to-end encryption and secure key management
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- ⭐ **Simple API**: Easy-to-use wrapper for common operations

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

### Simple API Setup (Recommended)

```typescript
import { quickStart, Gun } from "shogun-core";

// Create Gun instance
const gun = Gun({ 
  peers: ['https://gun-manhattan.herokuapp.com/gun'] 
});

// Quick start with simple API
const shogun = quickStart(gun, 'my-app');
await shogun.init();

// Use simplified API
const user = await shogun.api.signup('alice', 'password123');
if (user) {
  console.log('User created:', user.username);
  
  // User space operations
  await shogun.api.updateProfile({ 
    name: 'Alice', 
    email: 'alice@example.com' 
  });
  
  await shogun.api.saveSettings({ 
    theme: 'dark', 
    language: 'en' 
  });
  
  // Create collections
  await shogun.api.createCollection('todos', {
    '1': { text: 'Learn Shogun Core', done: false },
    '2': { text: 'Build dApp', done: false }
  });
}
```

### Advanced Setup (Full Features)

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-awesome-app",
  
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
  smartwallet: {
    enabled: true,
    factoryAddress: "0x...",
    defaultRequiredSignatures: 1,
    defaultRequiredGuardians: 2,
  },
});
```

## Simple API Methods

```typescript
const api = shogun.api;
const db = api.database; // Access database directly

// Authentication
const user = await db.signUp('username', 'password');
const loginResult = await db.login('username', 'password');
db.logout();
const isLoggedIn = db.isLoggedIn();

// Basic data operations
await db.put('path/to/data', { value: 'hello' });
const data = await db.getData('path/to/data');
await db.set('path/to/data', { value: 'updated' });
await db.remove('path/to/data');

// Profile management
await api.updateProfile({ 
  name: 'John Doe', 
  email: 'john@example.com',
  bio: 'Developer' 
});
const profile = await api.getProfile();

// Settings and preferences
await api.saveSettings({ language: 'en', notifications: true });
const settings = await api.getSettings();

// Collections
await api.createCollection('todos', {
  '1': { text: 'Learn Shogun Core', done: false },
  '2': { text: 'Build dApp', done: false }
});

await api.addToCollection('todos', '3', { 
  text: 'Deploy to production', 
  done: false 
});

const todos = await api.getCollection('todos');
await api.removeFromCollection('todos', '2');
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
const smartWalletPlugin = shogun.getPlugin("smartwallet");

// Configure signer (derive EOA from WebAuthn seed phrase)
const signUpResult = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true
});

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

## Crypto Identity Management

Shogun Core provides automatic crypto identity generation for every authenticated user. All crypto identities are created automatically during the signup process and stored securely in the decentralized database.

### Automatic Identity Generation

When a user signs up, Shogun Core automatically generates comprehensive crypto identities:

- **RSA-4096 Key Pairs**: For asymmetric encryption and digital signatures
- **AES-256 Symmetric Keys**: For fast symmetric encryption operations  
- **Signal Protocol Identities**: For end-to-end encrypted messaging
- **PGP Key Pairs**: For email encryption and digital signatures
- **MLS Groups**: For group messaging and collaboration
- **SFrame Keys**: For media encryption and streaming

### Accessing Crypto Identities

```typescript
import { CryptoIdentityManager } from "shogun-core";

// Create CryptoIdentityManager instance
const cryptoManager = new CryptoIdentityManager(shogun);

// Get current user's crypto identities
const identities = await cryptoManager.getCurrentUserIdentities();

if (identities.success && identities.identities) {
  console.log("RSA Key Pair:", !!identities.identities.rsa);
  console.log("AES Key:", !!identities.identities.aes);
  console.log("Signal Identity:", !!identities.identities.signal);
  console.log("PGP Keys:", !!identities.identities.pgp);
  console.log("MLS Group:", !!identities.identities.mls);
  console.log("SFrame Key:", !!identities.identities.sframe);
  
  // Access specific identity data
  if (identities.identities.rsa) {
    console.log("RSA Public Key:", identities.identities.rsa.publicKey);
    console.log("RSA Private Key:", identities.identities.rsa.privateKey);
  }
  
  if (identities.identities.aes) {
    console.log("AES Key:", identities.identities.aes);
  }
  
  if (identities.identities.signal) {
    console.log("Signal Identity:", identities.identities.signal);
  }
  
  if (identities.identities.pgp) {
    console.log("PGP Public Key:", identities.identities.pgp.publicKey);
    console.log("PGP Private Key:", identities.identities.pgp.privateKey);
  }
  
  if (identities.identities.mls) {
    console.log("MLS Group ID:", identities.identities.mls.groupId);
    console.log("MLS Member ID:", identities.identities.mls.memberId);
  }
  
  if (identities.identities.sframe) {
    console.log("SFrame Key ID:", identities.identities.sframe.keyId);
  }
} else {
  console.error("Failed to retrieve identities:", identities.error);
}
```

### Complete Example

```typescript
import { ShogunCore, CryptoIdentityManager } from "shogun-core";
import Gun from "gun";

// Initialize Shogun Core
const gun = Gun({ 
  peers: ['https://gun-manhattan.herokuapp.com/gun'] 
});

const shogun = new ShogunCore({
  gunInstance: gun,
  scope: "my-app"
});

// Register user (crypto identities generated automatically)
const signupResult = await shogun.signUp("alice", "password123");

if (signupResult.success) {
  console.log("User registered:", signupResult.username);
  
  // Access crypto identities
  const cryptoManager = new CryptoIdentityManager(shogun);
  const identities = await cryptoManager.getCurrentUserIdentities();
  
  if (identities.success) {
    console.log("✅ All crypto identities generated successfully");
    console.log("Identities available:", Object.keys(identities.identities || {}));
  }
}
```

### Identity Structure

The `CryptoIdentities` interface contains:

```typescript
interface CryptoIdentities {
  rsa?: JWKKeyPair;           // RSA-4096 key pair
  aes?: JsonWebKey;           // AES-256 symmetric key
  signal?: SignalUser;        // Signal Protocol identity
  pgp?: PGPKeyPair;          // PGP key pair
  mls?: {                    // MLS group membership
    groupId: string;
    memberId: string;
  };
  sframe?: {                 // SFrame media key
    keyId: number;
  };
  createdAt: number;         // Creation timestamp
  version: string;           // Identity version
}
```

### Error Handling

```typescript
const identities = await cryptoManager.getCurrentUserIdentities();

if (!identities.success) {
  switch (identities.error) {
    case "No authenticated user found":
      console.log("Please log in first");
      break;
    case "Database not available":
      console.log("Database connection issue");
      break;
    case "No SEA pair found for current user":
      console.log("User authentication issue");
      break;
    default:
      console.error("Unknown error:", identities.error);
  }
}
```

## Advanced Gun Operations

```typescript
const db = api.database;

// Store nested data with Gun chaining
await db.get('users').get('alice').get('profile').put({
  name: 'Alice Smith',
  email: 'alice@example.com',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
});

// Read nested data
const profile = await db.get('users').get('alice').get('profile').once().then();

// Update specific fields
await db.get('users').get('alice').get('profile').get('preferences').get('theme').put('light');

// Iterate over collections with .map()
db.get('users').map((user, userId) => {
  console.log(`User ${userId}:`, user);
});
```

## Browser Usage (CDN)

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
      const shogunCore = window.SHOGUN_CORE({
        peers: ["https://gun-manhattan.herokuapp.com/gun"],
        scope: "my-browser-app",
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

## Configuration Options

```typescript
interface ShogunCoreConfig {
  peers?: string[]; // GunDB peer URLs
  scope?: string; // Application scope
  authToken?: string; // GunDB super peer secret
  appToken?: string; // Application token

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
  };

  smartwallet?: {
    enabled?: boolean;
    factoryAddress?: string;
    defaultRequiredSignatures?: number;
    defaultRequiredGuardians?: number;
  };

  // Timeouts
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
}
```

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