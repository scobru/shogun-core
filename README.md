# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v2.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/scobru/shogun-core)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration to provide a secure, user-friendly foundation for Web3 applications.

## Features

- 🔐 **Multiple Authentication Methods**: Traditional username/password, WebAuthn (biometrics), Web3 (MetaMask), and Nostr
- 🌐 **Decentralized Storage**: Built on GunDB for peer-to-peer data synchronization
- 🔌 **Plugin System**: Extensible architecture with built-in plugins for various authentication methods
- 📱 **Reactive Programming**: RxJS integration for real-time data streams
- 🛡️ **Security**: End-to-end encryption and secure key management
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 📡 **Event System**: Typed event system for monitoring authentication and data changes
- 🔑 **Password Recovery**: Secure password hint system with security questions
- ✅ **Type Consistency**: Unified return types across all authentication methods
- 🚀 **Simplified Architecture**: Focused on core functionality with reduced complexity
- ⭐ **Simple API**: Easy-to-use wrapper for common operations with minimal complexity
- 🔗 **Advanced Chaining**: Powerful chaining operations for complex nested data structures
- 👤 **User Space Management**: Complete CRUD operations for user-specific data storage
- ⚡ **Quick Start**: Rapid initialization with pre-configured setups
- 🎛️ **Configuration Presets**: Pre-built configurations for common use cases

## Recent Updates (v2.0.1)

### 🔧 **Critical Bug Fixes**

- **🔧 FIXED: Remove Operations**: Fixed critical bug in `remove()` and `removeUserData()` methods that was causing `TypeError: Cannot read properties of null (reading 'err')`
- **🔧 IMPROVED: User Data Operations**: Rewrote all user data methods to use direct Gun user node for better reliability and error handling
- **🔧 ENHANCED: Error Handling**: Added proper null checking and improved error logging throughout the user data operations

### ✅ **Major API Improvements & Simplification (v2.1.0)**

- **⭐ STREAMLINED: Simple API Layer**: Simplified `SimpleGunAPI` to focus on high-level helpers only
  - Direct database access via `api.database` for basic operations (get, put, auth, etc.)
  - Helper methods for standardized data: profile, settings, preferences, collections
  - Array/Object conversion utilities for GunDB
  - Removed redundant wrapper methods to reduce complexity
- **⭐ NEW: Quick Start Functions**: `quickStart()`, `autoQuickStart()` classes for rapid initialization
- **⭐ NEW: Improved Type System**: Reduced `any` usage with better TypeScript types
- **⭐ NEW: Configuration Presets**: Pre-built configurations for common use cases
- **⭐ NEW: Advanced API Features**: Comprehensive plugin management, peer network control, advanced user management, and security systems
- **Enhanced Advanced Features**: Maintained and improved advanced plugin management, peer network management, and user tracking systems
- **Streamlined Event System**: Enhanced event system with better type safety and comprehensive event handling
- **Improved Maintainability**: Better organized codebase with clear separation of concerns
- **Better Performance**: Optimized operations with reduced abstraction layers

### 🔧 **Bug Fixes & Improvements**

**Fixed Critical Remove Operations Bug**:
- Fixed `TypeError: Cannot read properties of null (reading 'err')` in `remove()` and `removeUserData()` methods
- Added proper null checking: `ack && ack.err` instead of just `ack.err`
- All user data operations now use direct Gun user node for better reliability
- Improved error handling and logging throughout user data operations

### ⚠️ **BREAKING CHANGES**

- **🚨 REMOVED: Array Functions**: `putUserArray()`, `getUserArray()`, `addToUserArray()`, `removeFromUserArray()`, `updateInUserArray()` have been **REMOVED** due to GunDB compatibility issues
- **⚠️ DEPRECATED: Global Array Functions**: `putArray()`, `getArray()`, `addToArray()`, `removeFromArray()`, `updateInArray()` are deprecated and show warnings
- **✅ MIGRATION**: Use **Collections** or **Direct GunDB Operations** instead (see examples below)

## Recent Updates (v1.7.0)

### ✅ **Type System Fixes**

- **Unified Return Types**: All authentication methods now use consistent `AuthResult` and `SignUpResult` types
- **Enhanced SignUpResult**: Extended to support provider-specific authentication data
- **Type Safety**: Fixed TypeScript inconsistencies across all plugins
- **API Standardization**: All plugins implement unified `login()` and `signUp()` interfaces

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

### ⭐ **NEW: Simple API Setup (Recommended)**

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

// Define your list of Gun peers
const relays = [
  "wss://ruling-mastodon-improved.ngrok-free.app/gun",
  "https://gun-manhattan.herokuapp.com/gun",
  "https://peer.wallie.io/gun",
];

// Initialize Shogun Core with plugins
const shogun = new ShogunCore({
  peers: relays,
  scope: "my-awesome-app",
  authToken: "YOUR_GUN_SUPER_PEER_SECRET", // Optional, for private peers

  // Enable and configure Web3 (e.g., MetaMask) authentication
  web3: {
    enabled: true,
  },

  // Enable and configure WebAuthn (biometrics, security keys)
  webauthn: {
    enabled: true,
    rpName: "My Awesome App", // Name of your application
    rpId: window.location.hostname, // Relying party ID
  },

  // Enable and configure Nostr
  nostr: {
    enabled: true,
  },
});

// Initialize the SDK
await shogun.initialize();

console.log("Shogun Core initialized!");
```

## ⭐ **NEW: Simple API**

The Simple API provides an easy-to-use interface for common operations with minimal complexity. Perfect for beginners or when you need quick setup.

### Simple API Methods

```typescript
import { quickStart, Gun } from "shogun-core";

const gun = Gun({ peers: ['https://gun-manhattan.herokuapp.com/gun'] });
const shogun = quickStart(gun, 'my-app');
await shogun.init();

const api = shogun.api;
const db = api.database; // Access database directly for basic operations

// ===== BASIC OPERATIONS (use database) =====

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

// Gun node for advanced operations like .map()
const userNode = db.get('users');
userNode.map((user, userId) => console.log(`User ${userId}:`, user));

// ===== HELPER METHODS (use api) =====

// Profile management (standardized location)
await api.updateProfile({ 
  name: 'John Doe', 
  email: 'john@example.com',
  bio: 'Developer' 
});
const profile = await api.getProfile();

// Settings and preferences (standardized locations)
await api.saveSettings({ language: 'en', notifications: true });
const settings = await api.getSettings();

await api.savePreferences({ theme: 'dark', fontSize: 14 });
const preferences = await api.getPreferences();

// Collections (standardized location for user collections)
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

// Array utilities for GunDB
const items = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' }
];
const indexed = api.arrayToIndexedObject(items); // Convert for GunDB storage
const restored = api.indexedObjectToArray(indexed); // Convert back
```

## 🔗 **Advanced Gun Operations**

For advanced Gun.js operations, use the database instance directly via `api.database` or `shogun.database`:

```typescript
const db = api.database; // or shogun.database

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

// Complex chaining for nested structures
await db.get('projects').get('my-app').get('tasks').get('1').put({
  title: 'Implement authentication',
  status: 'completed',
  assignee: 'alice'
});

// Access Gun instance directly if needed
const gunInstance = db.gun;
gunInstance.get('some-path').on((data) => {
  console.log('Real-time data:', data);
});
```

### Chaining Examples

```typescript
const db = shogun.database; // or api.database

// User management system
await db.get('users').get('alice').put({
  profile: {
    name: 'Alice',
    email: 'alice@example.com'
  },
  settings: {
    theme: 'dark',
    notifications: true
  },
  posts: {
    '1': { title: 'Hello World', content: 'My first post' },
    '2': { title: 'GunDB is awesome', content: 'Learning decentralized storage' }
  }
});

// Blog system
await db.get('blog').get('posts').get('2024-01-15').put({
  title: 'Getting Started with Shogun Core',
  author: 'alice',
  content: 'Shogun Core makes decentralized apps easy...',
  tags: ['tutorial', 'decentralized', 'web3'],
  comments: {
    '1': { author: 'bob', text: 'Great tutorial!' },
    '2': { author: 'charlie', text: 'Very helpful, thanks!' }
  }
});

// E-commerce system
await db.get('shop').get('products').get('laptop-001').put({
  name: 'Gaming Laptop',
  price: 1299.99,
  stock: 15,
  reviews: {
    '1': { user: 'alice', rating: 5, comment: 'Amazing performance!' },
    '2': { user: 'bob', rating: 4, comment: 'Good value for money' }
  }
});

// Read complex nested data
const product = await db.get('shop').get('products').get('laptop-001').once().then();
console.log('Product:', product.name);
console.log('Reviews:', product.reviews);

// Update nested data
await db.get('shop').get('products').get('laptop-001').get('stock').put(12);
```

### Best Practices

1. **Use `api.database` or `shogun.database` for direct Gun operations**
2. **Use `api` helper methods for standardized data** - profile, settings, collections
3. **Keep paths descriptive** - Use meaningful path segments like `users/alice/profile`
4. **Handle errors appropriately** - Chaining operations can fail, always check results
5. **Use helper methods for conventions** - updateProfile(), saveSettings(), etc. provide standardized locations

## Plugin Authentication APIs

Shogun Core provides a unified plugin system for different authentication methods. Each plugin implements standardized `login()` and `signUp()` methods that return consistent `AuthResult` and `SignUpResult` objects.

### Core Types - ✅ **FIXED & UNIFIED**

```typescript
// Authentication result interface - used by login methods
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string; // User's public key
  username?: string; // Username or identifier
  sessionToken?: string; // Session token if applicable
  authMethod?: AuthMethod; // Authentication method used
  sea?: {
    // GunDB SEA pair for session persistence
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // OAuth-specific properties
  redirectUrl?: string; // OAuth redirect URL
  pendingAuth?: boolean; // Indicates pending OAuth flow
  message?: string; // Status message
  provider?: string; // OAuth provider name
  isNewUser?: boolean; // True if this was a registration
  user?: {
    // OAuth user data
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email?: string;
      name?: string;
      picture?: string;
      lastLogin: number;
    };
  };
}

// Sign up result interface - used by signUp methods ✅ ENHANCED
interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  error?: string;
  message?: string;
  wallet?: any;
  isNewUser?: boolean;
  authMethod?: AuthMethod; // ✅ ADDED
  sessionToken?: string; // ✅ ADDED
  sea?: { pub: string; priv: string; epub: string; epriv: string }; // SEA pair for session persistence
  // OAuth flow support - ✅ ADDED
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  user?: OAuthUserInfo; // ✅ ADDED
}

// Supported authentication methods
type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "bitcoin"
  | "pair";
```

### 1. Traditional Authentication

Direct username/password authentication using ShogunCore methods:

```typescript
// Sign up a new user - Returns SignUpResult ✅
const signUpResult: SignUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
  console.log("Is new user:", signUpResult.isNewUser);
  console.log("Auth method:", signUpResult.authMethod);
}

// Login with username and password - Returns AuthResult ✅
const loginResult: AuthResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
  console.log("User public key:", loginResult.userPub);
}
```

### 2. Web3 Plugin API

Ethereum wallet authentication via MetaMask or other Web3 providers:

```typescript
const web3Plugin = shogun.getPlugin<Web3ConnectorPlugin>("web3");

if (web3Plugin && web3Plugin.isAvailable()) {
  // Connect to MetaMask
  const connectionResult = await web3Plugin.connectMetaMask();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login with Web3 wallet - Returns AuthResult ✅
    const loginResult: AuthResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log("Web3 login successful");
      console.log("User public key:", loginResult.userPub);
    }

    // Register new user with Web3 wallet - Returns SignUpResult ✅
    const signUpResult: SignUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log("Web3 registration successful");
      console.log("Is new user:", signUpResult.isNewUser);
    }
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface Web3ConnectorPluginInterface {
  // Authentication methods
  login(address: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Connection methods
  isAvailable(): boolean;
  connectMetaMask(): Promise<ConnectionResult>;
  getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
  getSigner(): Promise<ethers.Signer>;

  // Credential management
  generateCredentials(address: string): Promise<ISEAPair>;
  generatePassword(signature: string): Promise<string>;
  verifySignature(message: string, signature: string): Promise<string>;
}
```

### 3. WebAuthn Plugin API

Biometric and hardware key authentication with **multi-device support via seed phrase**:

```typescript
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // ⭐ NEW: Register with seed phrase for multi-device support
  const signUpResult: SignUpResult = await webauthnPlugin.signUp("username", {
    generateSeedPhrase: true // Generate BIP39 seed phrase (default: true)
  });
  
  if (signUpResult.success) {
    console.log("WebAuthn registration successful");
    console.log("User public key:", signUpResult.userPub);
    
    // ⚠️ CRITICAL: Display seed phrase to user for backup
    if (signUpResult.seedPhrase) {
      console.log("🔑 SAVE THESE 12 WORDS:");
      console.log(signUpResult.seedPhrase);
      alert(`IMPORTANT: Write down these 12 words to access your account from other devices:\n\n${signUpResult.seedPhrase}`);
    }
  }

  // ⭐ NEW: Import account on another device using seed phrase
  const importResult = await webauthnPlugin.importFromSeed(
    "username",
    "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
  );
  
  if (importResult.success) {
    console.log("Account imported successfully!");
  }

  // Authenticate existing user - Returns AuthResult ✅
  const loginResult: AuthResult = await webauthnPlugin.login("username");
  if (loginResult.success) {
    console.log("WebAuthn authentication successful");
    console.log("Auth method:", loginResult.authMethod); // "webauthn"
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface WebauthnPluginInterface {
  // Authentication methods
  login(username: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(username: string): Promise<SignUpResult>; // ✅ FIXED

  // Capability checks
  isSupported(): boolean;

  // WebAuthn-specific methods
  register(username: string, displayName?: string): Promise<WebAuthnCredential>;
  authenticate(username?: string): Promise<WebAuthnCredential>;
  generateCredentials(
    username: string,
    pair?: ISEAPair | null,
    login?: boolean
  ): Promise<WebAuthnUniformCredentials>;
}
```

### 4. Nostr Plugin API

Bitcoin wallet and Nostr protocol authentication:

```typescript
const nostrPlugin = shogun.getPlugin<NostrConnectorPlugin>("nostr");

if (nostrPlugin && nostrPlugin.isAvailable()) {
  // Connect to Nostr wallet (Bitcoin extension)
  const connectionResult = await nostrPlugin.connectNostrWallet();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login with Nostr/Bitcoin wallet - Returns AuthResult ✅
    const loginResult: AuthResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log("Nostr login successful");
      console.log("Auth method:", loginResult.authMethod); // "nostr"
    }

    // Register with Nostr/Bitcoin wallet - Returns SignUpResult ✅
    const signUpResult: SignUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log("Nostr registration successful");
      console.log("Is new user:", signUpResult.isNewUser);
    }
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface NostrConnectorPluginInterface {
  // Authentication methods
  login(address: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Connection methods
  isAvailable(): boolean;
  connectBitcoinWallet(
    type?: "alby" | "nostr" | "manual"
  ): Promise<ConnectionResult>;
  connectNostrWallet(): Promise<ConnectionResult>;

  // Credential and signature management
  generateCredentials(
    address: string,
    signature: string,
    message: string
  ): Promise<NostrConnectorCredentials>;
  verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean>;
  generatePassword(signature: string): Promise<string>;
}
```

## ⭐ Multi-Device Support with Seed Phrases

WebAuthn authentication now supports **multi-device access** through BIP39 seed phrases, solving the device-bound limitation of traditional WebAuthn.

### The Problem with Traditional WebAuthn

WebAuthn credentials are **device-specific** by design:
- Each device generates unique, non-exportable credentials
- Cannot transfer credentials between devices
- Changing devices means losing access to your account

### The Shogun Core Solution: Seed Phrases

When you register with WebAuthn, Shogun Core generates a **12-word BIP39 mnemonic** (seed phrase):

```typescript
const signUpResult = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true  // Default: true
});

// ⚠️ CRITICAL: User MUST save these words!
console.log("Your seed phrase:", signUpResult.seedPhrase);
// Example: "abandon ability able about above absent absorb abstract absurd abuse access accident"
```

### Benefits

✅ **Same Account, Multiple Devices**: Access your account from any device
✅ **Account Recovery**: Restore access if you lose your device
✅ **Decentralized**: No need for password reset emails or centralized recovery
✅ **Compatible**: Works with any BIP39-compatible wallet
✅ **Secure**: 128-bit entropy, cryptographically secure

### Usage Examples

#### Registration on First Device (iPhone)

```typescript
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");

// Register with Face ID
const result = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: true
});

if (result.success && result.seedPhrase) {
  // Display to user with clear warning
  showSeedPhraseBackupUI(result.seedPhrase);
  // Example: "ability abandon about above absent absorb abstract absurd abuse access accident account"
}
```

#### Import on Second Device (Windows PC)

```typescript
// User enters their 12-word seed phrase
const seedPhrase = getUserInputSeedPhrase();

// Import account using seed phrase
const result = await webauthnPlugin.importFromSeed("alice", seedPhrase);

if (result.success) {
  console.log("Account imported! You can now use Windows Hello.");
}
```

### User Interface Example

```tsx
// React component for seed phrase backup
function SeedPhraseBackup({ seedPhrase }: { seedPhrase: string }) {
  const words = seedPhrase.split(' ');
  
  return (
    <div className="seed-phrase-backup">
      <h2>🔑 Save Your Recovery Phrase</h2>
      <p><strong>Write down these 12 words in order</strong></p>
      <p className="warning">
        ⚠️ Without these words, you cannot recover your account or access it from other devices!
      </p>
      
      <div className="word-grid">
        {words.map((word, index) => (
          <div key={index} className="word-item">
            <span className="word-number">{index + 1}.</span>
            <span className="word-text">{word}</span>
          </div>
        ))}
      </div>
      
      <div className="actions">
        <button onClick={() => downloadSeedPhrase(seedPhrase)}>
          📥 Download as Text File
        </button>
        <button onClick={() => printSeedPhrase(seedPhrase)}>
          🖨️ Print on Paper
        </button>
      </div>
      
      <label>
        <input type="checkbox" required />
        I have safely stored my 12-word recovery phrase
      </label>
    </div>
  );
}
```

### Security Best Practices

1. **Never store seed phrases digitally** - Write them on paper
2. **Keep multiple backups** - Store in different secure locations
3. **Never share your seed phrase** - Anyone with it can access your account
4. **Verify before moving on** - Double-check you wrote it correctly
5. **Use steel backup** - For maximum durability (fire/water proof)

### Legacy Device-Bound Mode

If you don't need multi-device support, you can disable seed phrase generation:

```typescript
const result = await webauthnPlugin.signUp("alice", {
  generateSeedPhrase: false  // Device-bound only
});
// No seed phrase returned - traditional WebAuthn behavior
```

### Browser Usage (via CDN)

You can also use Shogun Core directly in the browser by including it from a CDN. This is ideal for static sites or lightweight applications.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Shogun Core in Browser</title>
  </head>
  <body>
    <h1>My dApp</h1>
    <!-- Required dependencies for Shogun Core -->
    <script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>

    <!-- Shogun Core library -->
    <script src="https://cdn.jsdelivr.net/npm/shogun-core/dist/browser/shogun-core.js"></script>

    <script>
      // Access the global Shogun Core function
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

      async function connectWallet() {
        if (shogunCore.hasPlugin("web3")) {
          const web3Plugin = shogunCore.getPlugin("web3");
          try {
            const provider = await web3Plugin.getProvider();
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            await web3Plugin.login(address);
            console.log("Logged in with address:", address);
          } catch (error) {
            console.error("Web3 login failed:", error);
          }
        }
      }
    </script>
  </body>
</html>
```

## API Reference

### ⭐ **Simple API Methods**

#### Authentication
- `signup(username: string, password: string): Promise<UserInfo | null>` - Create new user account
- `login(username: string, password: string): Promise<UserInfo | null>` - Authenticate with username/password
- `logout(): void` - Logout current user
- `isLoggedIn(): boolean` - Check if user is authenticated

#### Data Operations
- `get<T>(path: string): Promise<T | null>` - Get data from path
- `put<T>(path: string, data: T): Promise<boolean>` - Store data at path
- `set<T>(path: string, data: T): Promise<boolean>` - Update data at path
- `remove(path: string): Promise<boolean>` - Remove data from path

#### Advanced Chaining Operations (NEW!)
- `node(path: string): GunNode` - Get Gun node for direct chaining (recommended)
- `chain(path: string): ChainingWrapper` - Get simplified chaining wrapper
- `getNode(path: string): GunNode` - Get Gun node for advanced operations like .map()

#### User Space Operations
- `putUserData<T>(path: string, data: T): Promise<boolean>` - Store user-specific data
- `getUserData<T>(path: string): Promise<T | null>` - Get user-specific data
- `setUserData<T>(path: string, data: T): Promise<boolean>` - Update user-specific data
- `removeUserData(path: string): Promise<boolean>` - Remove user-specific data
- `getAllUserData(): Promise<Record<string, unknown> | null>` - Get all user data

#### Profile & Settings
- `updateProfile(profileData: ProfileData): Promise<boolean>` - Update user profile
- `getProfile(): Promise<Record<string, unknown> | null>` - Get user profile
- `saveSettings(settings: Record<string, unknown>): Promise<boolean>` - Save user settings
- `getSettings(): Promise<Record<string, unknown> | null>` - Get user settings
- `savePreferences(preferences: Record<string, unknown>): Promise<boolean>` - Save user preferences
- `getPreferences(): Promise<Record<string, unknown> | null>` - Get user preferences

#### Collections
- `createCollection<T>(name: string, items: Record<string, T>): Promise<boolean>` - Create user collection
- `addToCollection<T>(name: string, itemId: string, item: T): Promise<boolean>` - Add item to collection
- `getCollection(name: string): Promise<Record<string, unknown> | null>` - Get collection
- `removeFromCollection(name: string, itemId: string): Promise<boolean>` - Remove item from collection

#### Utility Functions
- `arrayToIndexedObject<T>(arr: T[]): Record<string, T>` - Convert array to indexed object (helper)
- `indexedObjectToArray<T>(indexedObj: Record<string, T>): T[]` - Convert indexed object to array (helper)

#### ⚠️ **REMOVED FUNCTIONS**
The following array functions have been **REMOVED** due to GunDB compatibility issues:
- `putUserArray()`, `getUserArray()`, `addToUserArray()`, `removeFromUserArray()`, `updateInUserArray()`

**Use collections or direct GunDB operations instead** (see examples above).

### Advanced API Methods

#### Core Authentication
- `login(username: string, password: string): Promise<AuthResult>` - Authenticate with username/password
- `loginWithPair(pair: ISEAPair): Promise<AuthResult>` - Authenticate directly with a GunDB SEA pair
- `signUp(username: string, password: string, email?: string, pair?: ISEAPair | null): Promise<SignUpResult>` - Create new user account
- `logout(): void` - Logout current user
- `isLoggedIn(): boolean` - Check if user is authenticated
- `setAuthMethod(method: AuthMethod): void` - Set authentication method
- `getAuthMethod(): AuthMethod | undefined` - Get current authentication method
- `saveCredentials(credentials: any): Promise<void>` - Save user credentials

#### Plugin Management
- `getPlugin<T>(name: string): T | undefined` - Get plugin by name
- `hasPlugin(name: string): boolean` - Check if plugin exists
- `register(plugin: ShogunPlugin): void` - Register custom plugin
- `unregister(pluginName: string): void` - Remove plugin
- `getPluginsInfo(): Array<{name: string; version: string; category?: PluginCategory; description?: string}>` - Get detailed plugin information
- `getPluginCount(): number` - Get total number of plugins
- `getPluginsInitializationStatus(): Record<string, {initialized: boolean; error?: string}>` - Check plugin initialization status
- `getPluginsByCategory(category: PluginCategory): ShogunPlugin[]` - Get plugins by category
- `validatePluginSystem(): {...}` - Validate plugin system health
- `reinitializeFailedPlugins(): {...}` - Reinitialize failed plugins
- `checkPluginCompatibility(): {...}` - Check plugin compatibility
- `getPluginSystemDebugInfo(): {...}` - Get comprehensive debug information

#### Peer Network Management (Database)
- `addPeer(peer: string): void` - Add new peer to network
- `removePeer(peer: string): void` - Remove peer from network
- `getCurrentPeers(): string[]` - Get currently connected peers
- `getAllConfiguredPeers(): string[]` - Get all configured peers
- `getPeerInfo(): {[peer: string]: {connected: boolean; status: string}}` - Get detailed peer information
- `reconnectToPeer(peer: string): void` - Reconnect to specific peer
- `resetPeers(newPeers?: string[]): void` - Reset all peers and optionally add new ones

#### Advanced User Management (Database)
- `getUserByAlias(alias: string): Promise<{...}>` - Get user by alias/username
- `getUserDataByPub(userPub: string): Promise<{...}>` - Get user by public key
- `getUserPubByEpub(epub: string): Promise<string | null>` - Get user public key by encryption key
- `getUserAliasByPub(userPub: string): Promise<string | null>` - Get user alias by public key
- `getAllRegisteredUsers(): Promise<Array<{...}>>` - Get all registered users
- `updateUserLastSeen(userPub: string): Promise<void>` - Update user's last seen timestamp

#### Password Recovery & Security (Database)
- `setPasswordHintWithSecurity(username: string, password: string, hint: string, securityQuestions: string[], securityAnswers: string[]): Promise<{success: boolean; error?: string}>` - Set up password recovery
- `forgotPassword(username: string, securityAnswers: string[]): Promise<{success: boolean; hint?: string; error?: string}>` - Recover password

#### Error Handling & Debugging
- `getRecentErrors(count?: number): ShogunError[]` - Get recent errors for debugging

#### Event Handling
- `on<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this` - Subscribe to typed events
- `off<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this` - Unsubscribe from events
- `once<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this` - Subscribe to one-time events
- `emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K]): boolean` - Emit custom events
- `removeAllListeners(eventName?: string | symbol): this` - Remove all event listeners

### Configuration Options

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


  // Timeouts
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
}
```

## Event System

Shogun Core provides a comprehensive typed event system for monitoring authentication and data changes:

```typescript
// Available events with their data types
interface ShogunEventMap {
  "auth:login": AuthEventData; // User logged in
  "auth:logout": void; // User logged out
  "auth:signup": AuthEventData; // New user registered
  "plugin:registered": { name: string; version?: string; category?: string }; // Plugin registered
  "plugin:unregistered": { name: string }; // Plugin unregistered
  debug: { action: string; [key: string]: any }; // Debug information
  error: ErrorEventData; // Error occurred
}

// Listen for authentication events with full type safety
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
  console.log("Authentication method:", data.method);
  if (data.provider) {
    console.log("OAuth provider:", data.provider);
  }
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

## Password Recovery System

Shogun Core includes a secure password recovery system using security questions:

```typescript
// Set password hint with security questions
await shogun.db.setPasswordHint(
  "username",
  "password",
  "My favorite color",
  ["What is your favorite color?", "What was your first pet's name?"],
  ["blue", "fluffy"]
);

// Recover password using security answers
const result = await shogun.db.forgotPassword("username", ["blue", "fluffy"]);

if (result.success) {
  console.log("Password hint:", result.hint);
}
```

Note: The cryptographic wallet derivation feature has been removed in v1.9.5 to simplify the architecture.

## Error Handling

Shogun Core includes comprehensive error handling with typed errors:

```typescript
import { ShogunError, ErrorType } from "shogun-core";

try {
  await shogun.login("username", "password");
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.error("Invalid credentials");
        break;
      case ErrorType.NETWORK:
        console.error("Network connection failed");
        break;
      default:
        console.error("Unknown error:", error.message);
    }
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## SHIP Standards (Shogun Interface Proposals)

Shogun Core implements **SHIP standards** - modular, composable protocols for decentralized applications:

- **[SHIP-00](./ship/SHIP_00.md)**: Identity & Authentication Foundation
- **[SHIP-01](./ship/SHIP_01.md)**: Decentralized Encrypted Messaging
- **[SHIP-02](./ship/SHIP_02.md)**: Ethereum HD Wallet & Transaction Sending
- **[SHIP-03](./ship/SHIP_03.md)**: Dual-Key Stealth Addresses (ERC-5564)
- **[SHIP-04](./ship/SHIP_04.md)**: Multi-Modal Authentication (OAuth/WebAuthn/Web3/Nostr)

See [ship/README.md](./ship/README.md) for complete SHIP documentation and examples.

## Advanced Features

For advanced use cases and comprehensive API coverage, see the [Advanced API Features](./API.md#advanced-api-features) section which includes:

- **Advanced Plugin Management**: Plugin health monitoring, compatibility checking, and system validation
- **Peer Network Management**: Dynamic peer connection management and network monitoring
- **Advanced User Management**: Comprehensive user lookup, tracking, and metadata management
- **Password Recovery & Security**: Secure password hint system with security questions
- **Error Handling & Debugging**: Advanced error tracking and debugging capabilities
- **Event System**: Complete event handling reference with type safety
- **Database Lifecycle**: Advanced database initialization and management

## Support

- 📖 [Documentation](https://shogun-core-docs.vercel.app/)
- 📚 [Advanced API Reference](./API.md#advanced-api-features)
- 💬 [Telegram Community](t.me/shogun_eco)
- 🐛 [Issue Tracker](https://github.com/scobru/shogun-core/issues)

# SHOGUN CORE

Core library for Shogun Ecosystem

## Testing

This project includes a comprehensive test suite that covers all major functionality and has been recently updated to align with the current codebase structure.

### ✅ **Test Suite Status (Updated)**

- **✅ All Tests Passing**: 659/659 tests pass successfully
- **✅ Plugin System**: Complete plugin functionality testing
- **✅ Authentication Methods**: All auth methods (WebAuthn, Web3, Nostr, OAuth) tested
- **✅ Simple API**: Full coverage of SimpleGunAPI functionality
- **✅ Error Handling**: Comprehensive error handling and edge case testing
- **✅ Browser Compatibility**: Cross-browser support validation
- **✅ Integration Tests**: End-to-end functionality testing

### Test Coverage

This project includes a comprehensive test suite that covers:

### Unit Tests

- **Validation Utils** (`src/__tests__/utils/validation.test.ts`)
  - Username validation
  - Email validation
  - OAuth provider validation
  - Username generation from identity
  - Deterministic password generation

- **Error Handler** (`src/__tests__/utils/errorHandler.test.ts`)
  - Error creation and handling
  - Error statistics and logging
  - Retry logic
  - External logger integration

- **Event Emitter** (`src/__tests__/utils/eventEmitter.test.ts`)
  - Event registration and emission
  - Listener management
  - Error handling in listeners
  - Symbol events support

- **Storage** (`src/__tests__/storage/storage.test.ts`)
  - Memory and localStorage operations
  - Error handling
  - Test mode behavior
  - Data persistence

### Integration Tests

- **ShogunCore** (`src/__tests__/integration/shogunCore.test.ts`)
  - Plugin system validation
  - Authentication methods
  - Event system
  - Configuration handling
  - Error handling

### Browser Compatibility Tests

- **Compatibility** (`src/__tests__/browser/compatibility.test.ts`)
  - localStorage availability
  - Crypto API support
  - WebAuthn detection
  - Web3 provider detection
  - Event system compatibility
  - TextEncoder/TextDecoder support
  - Fetch API compatibility
  - URL API compatibility
  - Performance API compatibility
  - Console API compatibility

## Running Tests

You can eseguire i test sia dalla root del monorepo sia entrando nella cartella `shogun-core`.

Inside `shogun-core/` directory:

```bash
# Install deps
yarn install

# Tutti i test (una sola esecuzione) con coverage
yarn test:ci

# Watch mode
yarn test:watch

# Coverage (report HTML in coverage/lcov-report/index.html)
yarn coverage

# Solo i test dei plugin
yarn test src/__tests__/plugins

# Evita conflitti di config Jest (se servisse)
yarn jest --ci --coverage --watchAll=false --config jest.config.js
```

From repository root (senza cambiare directory):

```bash
# Install deps
yarn --cwd shogun-core install

# Tutti i test con coverage (CI‑like)
yarn --cwd shogun-core test:ci

# Solo plugin tests
yarn --cwd shogun-core test src/__tests__/plugins

# Coverage
yarn --cwd shogun-core coverage

# Watch mode
yarn --cwd shogun-core test:watch

# Se compaiono più configurazioni Jest, specifica esplicitamente il config file
yarn --cwd shogun-core jest --ci --coverage --watchAll=false --config jest.config.js
```

CI & QA scripts:

```bash
# Mutation testing (Stryker) – più lento, richiede devDeps installate
yarn --cwd shogun-core mutation

# SAST (Semgrep) – richiede semgrep installato (es. `pip install semgrep`)
yarn --cwd shogun-core sast
```

## Test Coverage

The test suite provides comprehensive coverage of:

- ✅ **Utility Functions** - 100% coverage
- ✅ **Error Handling** - 100% coverage
- ✅ **Event System** - 100% coverage
- ✅ **Storage Operations** - 100% coverage
- ✅ **Plugin System** - API validation
- ✅ **Browser Compatibility** - Cross-browser support
- ✅ **Configuration Validation** - Config handling

## Test Philosophy

These tests are designed to be **realistic and non-intrusive**:

- **No codebase modifications** - Tests work with existing code
- **Comprehensive coverage** - All public APIs tested
- **Error resilience** - Tests error handling and edge cases
- **Browser compatibility** - Cross-browser support validation
- **Performance aware** - Tests don't impact runtime performance

## Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup
├── utils/
│   ├── validation.test.ts      # Validation utility tests
│   ├── errorHandler.test.ts    # Error handling tests
│   └── eventEmitter.test.ts    # Event system tests
├── storage/
│   └── storage.test.ts         # Storage operation tests
├── integration/
│   └── shogunCore.test.ts      # Core integration tests
└── browser/
    └── compatibility.test.ts   # Browser compatibility tests
```

## Adding New Tests

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Test both success and failure cases
4. Mock external dependencies appropriately
5. Ensure tests are isolated and repeatable
