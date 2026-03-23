# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v2.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It utilizes GunDB's peer-to-peer networking with modern authentication standards and blockchain integration.

## Features

- 🔐 **Multiple Authentication Methods**: Password, WebAuthn (biometrics), Web3 (MetaMask), Nostr, Challenge (Server-Signed)
- 🌐 **Decentralized Storage**: Built on GunDB for peer-to-peer data synchronization
- 🔌 **Plugin System**: Extensible architecture with built-in plugins
- 🛡️ **Security**: End-to-end encryption and secure key management
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

### Basic Initialization

```typescript
import { ShogunCore } from 'shogun-core';
import Gun from 'gun';

// Create Gun instance first
const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
});

// Initialize Shogun Core with the Gun instance
const shogun = new ShogunCore({
  gunInstance: gun,

  // Enable authentication plugins
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: 'My Awesome App',
    rpId: window.location.hostname,
  },
  nostr: { enabled: true },
  zkproof: {
    enabled: true,
    defaultGroupId: 'my-app-users',
  },
});
```



## Database API Reference

The `shogun.db` instance provides a high-level API for interacting with the decentralized database.

### 1. Connection & Session Management

- `db.isLoggedIn(): boolean`: Returns `true` if a user is currently authenticated.
- `db.getCurrentUser(): { pub: string; user?: any } | null`: Returns the current user's public key and instance.
- `db.getUserPub(): string | null`: Returns the current user's public key.
- `db.onAuth(callback: (user: any) => void): () => void`: Listens for authentication changes. Returns an unsubscribe function.
- `db.restoreSession(): Promise<RestoreResult>`: Attempts to restore a previous session from `sessionStorage`.

### 2. Promise-based Advanced Utilities (Firegun API)
*Note: These methods provide full Promise support and auto-retries.*

```typescript
const db = shogun.db;

// Fetch data with auto-retry and 5s timeout
const data = await db.Get('public/posts/123');

// Save data (supports deep object merging)
await db.Put('public/settings', { theme: 'dark' });

// Insert into a collection with a random key
await db.Set('public/logs', { event: 'login', time: Date.now() });

// Recursive load of nested nodes
const fullData = await db.Load('public/complex-node');

// "Delete" a node (Tombstoning)
await db.Del('public/temp-data');

// Deeply nullify all keys in a node
await db.purge('public/old-config');
```

### 3. Real-time Subscriptions
```typescript
// Listen to changes with an identifier for easy unsubscription
db.On('public/feed', (data) => console.log('Update:', data), 'myListener');

// Stop listening
db.Off('myListener');

// One-time fetch of initial state + future changes
db.Listen('public/status', (status) => console.log('Status:', status));
```

### 4. User-Space Operations
These methods automatically prefix the path with `~pubkey/` of the logged-in user.

- `db.userGet(path: string)`: Read from current user's graph.
- `db.userPut(path: string, data: any)`: Write to current user's graph.
- `db.userDel(path: string)`: Delete node from user's graph.
- `db.userLoad(path: string)`: Recursively load user-space data.

### 5. Advanced Features
- **Content Addressing**: `db.addContentAdressing('#key', data)` hashes data using SHA-256 for immutable storage.
- **Security**: `db.generatePublicCert()` creates a public certificate for P2P interactions.
- **Cleanup**: `db.aggressiveAuthCleanup()` forcefully clears all local auth state.

## Authentication API

Shogun Core provides a unified authentication interface. Plugins (Web3, WebAuthn, etc.) extend this system.

### Core Methods

```typescript
// 1. Traditional Signup/Login
await shogun.signUp('alice', 'Password123!');
await shogun.login('alice', 'Password123!');

// 2. Pair-based Authentication
const pair = await shogun.db.crypto.createPair();
await shogun.loginWithPair('alice', pair);

// 3. Mnemonic Seed Authentication
const mnemonic = 'word1 word2 ...';
await shogun.loginWithSeed('alice', mnemonic);

// 4. Session Check & Logout
if (shogun.isLoggedIn()) {
  console.log('User Pub:', shogun.db.getUserPub());
  shogun.logout();
}
```

### 2. Web3 Plugin API

```typescript
const web3Plugin = shogun.getPlugin('web3');

if (web3Plugin && web3Plugin.isAvailable()) {
  const connectionResult = await web3Plugin.connectMetaMask();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login with Web3 wallet
    const loginResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log('Web3 login successful');
    }

    // Register new user
    const signUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log('Web3 registration successful');
    }
  }
}
```

### 3. WebAuthn Plugin API

```typescript
const webauthnPlugin = shogun.getPlugin('webauthn');

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // Register with seed phrase for multi-device support
  const signUpResult = await webauthnPlugin.signUp('username', {
    generateSeedPhrase: true,
  });

  if (signUpResult.success && signUpResult.seedPhrase) {
    console.log('🔑 SAVE THESE 12 WORDS:', signUpResult.seedPhrase);
  }

  // Import account on another device
  const importResult = await webauthnPlugin.importFromSeed(
    'username',
    'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
  );

  // Authenticate
  const loginResult = await webauthnPlugin.login('username');
  if (loginResult.success) {
    console.log('WebAuthn authentication successful');
  }
}
```

### 4. Nostr Plugin API

```typescript
const nostrPlugin = shogun.getPlugin('nostr');

if (nostrPlugin && nostrPlugin.isAvailable()) {
  const connectionResult = await nostrPlugin.connectNostrWallet();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    const loginResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log('Nostr login successful');
    }

    const signUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log('Nostr registration successful');
    }
  }
}
```

### 7. Challenge Auth Plugin API

The `Challenge` plugin allows for server-signed challenges to verify user authenticity without exposing private keys directly, useful for certain server-side integrations.

```typescript
const challengePlugin = shogun.getPlugin('challenge');

if (challengePlugin) {
  // Initiate a challenge
  const challenge = await challengePlugin.createChallenge();

  // User signs the challenge
  const signature = await user.sign(challenge);

  // Verify the signature
  const isValid = await challengePlugin.verify(challenge, signature);
}
```

### 8. Mnemonic & HD Keys

Shogun Core supports BIP39 mnemonics and Hierarchical Deterministic (HD) key derivation, allowing you to generate multiple purpose-specific keys from a single seed.

```typescript
import {
  generateSeedPhrase,
  validateSeedPhrase,
  seedToKeyPair,
  deriveChildKey,
} from 'shogun-core';

// 1. Generate a new 12-word mnemonic
const mnemonic = generateSeedPhrase();
console.log('Secret Mnemonic:', mnemonic);

// 2. Validate a mnemonic
const isValid = validateSeedPhrase(mnemonic);

// 3. Convert mnemonic to a master SEA pair
const masterPair = await seedToKeyPair(mnemonic, 'my-username');

// 4. Derive child keys for specific purposes (HD Wallet style)
const chatPair = await deriveChildKey(masterPair, 'messaging');
const walletPair = await deriveChildKey(masterPair, 'payment');

console.log('Master Pub:', masterPair.pub);
console.log('Chat Pub:', chatPair.pub);
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
        peers: ['https://gun-manhattan.herokuapp.com/gun'],
      });

      // Initialize Shogun Core
      const shogunCore = new window.SHOGUN_CORE({
        gunInstance: gun,
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: 'My Browser dApp',
          rpId: window.location.hostname,
        },
      });

      console.log('Shogun Core initialized in browser!', shogunCore);
    </script>
  </body>
</html>
```



## Event System

```typescript
// Listen for authentication events
shogun.on('auth:login', (data) => {
  console.log('User logged in:', data.username);
  console.log('Authentication method:', data.method);
});

shogun.on('auth:logout', () => {
  console.log('User logged out');
});

shogun.on('auth:signup', (data) => {
  console.log('New user signed up:', data.username);
});

// Listen for errors
shogun.on('error', (error) => {
  console.error('Shogun error:', error.message);
});
```



## Configuration Options

```typescript
interface ShogunCoreConfig {
  gunInstance?: IGunInstance<any>; // Optional: existing Gun instance

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
