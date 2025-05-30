# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.0.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Table of Contents

- [Overview](#overview)
- [Why Choose Shogun?](#why-choose-shogun)
  - [The Web3 Challenge](#the-web3-challenge)
  - [The Shogun Solution](#the-shogun-solution)
- [Core Features](#core-features)
  - [Authentication](#authentication)
  - [Storage](#storage)
  - [Reactive Data](#reactive-data)
  - [Wallet Management](#wallet-management)
  - [Security](#security)
- [Technologies Used](#technologies-used)
  - [Core Technologies](#core-technologies)
  - [Security & Cryptography](#security--cryptography)
  - [Development & Build Tools](#development--build-tools)
  - [Browser Support](#browser-support)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [Authentication Methods](#authentication-methods)
  - [Reactive Programming with RxJS](#reactive-programming-with-rxjs)
- [Use Cases](#use-cases)
- [Documentation](#documentation)
- [Custom Plugins](#custom-plugins)
  - [Creating a Plugin](#creating-a-plugin)
  - [Registering a Plugin](#registering-a-plugin)
  - [Using the Plugin](#using-the-plugin)
- [Stealth Transactions](#stealth-transactions)
- [Contracts SDK](#contracts-sdk)
- [Browser Integration](#browser-integration)
  - [Setup](#setup)
  - [Examples](#examples)
  - [Compatibility](#compatibility)
- [Contributing](#contribute)
- [License](#license)

## Overview

Welcome to the Shogun SDK! This powerful and user-friendly SDK is designed to simplify decentralized authentication and wallet management in Web3 applications. Whether you're building a new dApp or enhancing an existing one, Shogun SDK provides the tools you need for secure and efficient crypto operations.

## Why Choose Shogun?

### The Web3 Challenge

In today's Web3 landscape, developers face significant challenges in managing user authentication and crypto operations while maintaining security and usability. Traditional solutions often require compromises between security, usability, and decentralization.

### The Shogun Solution

Shogun combines GunDB's decentralization, modern authentication standards, and the Ethereum ecosystem into a comprehensive SDK that prioritizes both security and user experience.

## Core Features

### Authentication

- **Multi-layer Support**:
  - WebAuthn for biometric and hardware authentication
  - MetaMask integration
  - Traditional username/password
- **Flexible Implementation**: Adapt to different user needs and security requirements

### Storage

- **Decentralized with GunDB**:
  - True data decentralization
  - Offline resilience
  - Real-time synchronization
- **Local Storage Support**: Efficient client-side data persistence

### Reactive Data

- **RxJS Integration**:
  - Observe real-time data changes through Observables
  - Reactive collections with filtering and transformations
  - Computed values derived from multiple data sources
  - Simplified data flow with RxJS operators
- **Two Programming Models**:
  - Promise-based for traditional async workflows
  - Observable-based for reactive programming

### Wallet Management

- **BIP-44 Standard**: Compatible with major wallet services
- **Stealth Addresses**: Enhanced transaction privacy
- **Backup & Recovery**: Robust security measures

### Security

- **End-to-End Encryption**: Protected sensitive data
- **Modern Standards**: WebAuthn and best practices
- **Audit Trail**: Complete operation tracking

## Technologies Used

### Core Technologies

- **TypeScript**: Built with TypeScript for enhanced type safety and developer experience
- **GunDB**: Decentralized graph database for P2P data storage and synchronization
- **RxJS**: Reactive Extensions for JavaScript for powerful reactive programming
- **ethers.js**: Complete Ethereum wallet implementation and utilities
- **WebAuthn**: W3C standard for passwordless authentication

### Security & Cryptography

- **SEA.js**: GunDB's Security, Encryption, & Authorization module
- **BIP-44**: Standard protocol for deterministic wallet generation
- **Stealth Address Protocol**: Enhanced privacy for cryptocurrency transactions

### Development & Build Tools

- **Webpack**: Module bundling for browser compatibility
- **TypeDoc**: Automated documentation generation
- **Prettier**: Code formatting and style consistency

### Browser Support

- **WebCrypto API**: Native cryptographic operations
- **IndexedDB/LocalStorage**: Client-side data persistence
- **WebSocket**: Real-time P2P communication

## Getting Started

### Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

### Basic Usage

```typescript
import {
  ShogunCore,
  CorePlugins,
  PluginCategory,
  initShogunBrowser,
} from "shogun-core";

// Initialization for Node.js environment
const shogun = new ShogunCore({
  // GunDB configuration
  peers: ["https://your-gun-peer.com/gun"],
  scope: "app-namespace",
  
  // Plugin configurations
  webauthn: { 
    enabled: true 
  },
  ethereum: { 
    enabled: true 
  },
  stealthAddress: { 
    enabled: true 
  },
  bip32: { 
    enabled: true,
    balanceCacheTTL: 30000 // Optional: cache balance for 30 seconds
  },
  bitcoin: { 
    enabled: true,
    network: "mainnet" // Optional: specify network
  },
  
  // Logging configuration (optional)
  logging: {
    enabled: true,
    level: "info"
  },
  
  // Timeouts (optional)
  timeouts: {
    login: 15000,
    signup: 30000
  },
  
  // Auto-register additional custom plugins (optional)
  plugins: {
    autoRegister: []
  }
});

// Or for browser (recommended for web applications)
const shogunBrowser = initShogunBrowser({
  // GunDB configuration
  peers: ["https://your-gun-peer.com/gun"],
  scope: "app-namespace",
  
  // Plugin configurations
  webauthn: {
    enabled: true,
    rpName: "Your App",
    rpId: "yourdomain.com"
  },
  ethereum: { 
    enabled: true 
  },
  stealthAddress: { 
    enabled: true 
  },
  bip32: { 
    enabled: true 
  },
  bitcoin: {
    enabled: true
  }
});

// Authentication examples
// Standard authentication
const passwordLogin = await shogun.login("username", "password");

// Accessing plugins
const webauthnPlugin = shogun.getPlugin(CorePlugins.WebAuthn);
const ethereumPlugin = shogun.getPlugin(CorePlugins.Ethereum);
const bip32Plugin = shogun.getPlugin(CorePlugins.Bip32);
const stealthPlugin = shogun.getPlugin(CorePlugins.StealthAddress);
const bitcoinPlugin = shogun.getPlugin(CorePlugins.Bitcoin);

if (webauthnPlugin) {
  const credentials = await webauthnPlugin.generateCredentials(
    "username",
    null,
    true
  ); // true = login
  if (credentials.success) {
    // Use credentials for authentication...
  }
}

if (ethereumPlugin) {
  // Login with MetaMask
  try {
    // Connect and authenticate with MetaMask
    const connectResult = await ethereumPlugin.connectMetaMask();
    if (connectResult.success) {
      const address = connectResult.address;
      // Login using the address
      const loginResult = await ethereumPlugin.loginWithMetaMask(address);
      console.log("MetaMask login result:", loginResult);
    }
  } catch (error) {
    console.error("Error during MetaMask login:", error);
  }
}

// BIP32 Wallet operations
if (bip32Plugin) {
  const wallet = await bip32Plugin.createWallet();
  const mainWallet = bip32Plugin.getMainWallet();
}

// Using the Stealth Plugin
if (shogun.hasPlugin(CorePlugins.StealthAddress)) {
  const stealthPlugin = shogun.getPlugin(CorePlugins.StealthAddress);

  // Generate a stealth address to receive payments privately
  const stealthAddress = await stealthPlugin.generateStealthAddress();
  console.log("Generated stealth address:", stealthAddress);

  // Create a private transaction to a stealth address
  const receiverStealthAddress = "0xEccetera..."; // Receiver's stealth address
  const amount = "0.01"; // Amount in ETH
  const txResult = await stealthPlugin.createStealthTransaction(
    receiverStealthAddress,
    amount
  );
  console.log("Stealth transaction sent:", txResult);

  // Scan the blockchain to find stealth payments addressed to you
  const payments = await stealthPlugin.scanStealthPayments();
  console.log("Stealth payments found:", payments);
}

// Get plugins by category
const walletPlugins = shogun.getPluginsByCategory(PluginCategory.Wallet);
const authPlugins = shogun.getPluginsByCategory(PluginCategory.Authentication);
console.log(
  `Found ${walletPlugins.length} wallet plugins and ${authPlugins.length} auth plugins`
);
```

### Authentication Methods

Shogun provides a modern approach to access authentication methods via the `getAuthenticationMethod` API. This simplifies working with different authentication types by providing a consistent interface.

```typescript
// Recommended modern approach to access authentication methods
// Approach 1: Get the standard password authentication
const passwordAuth = shogun.getAuthenticationMethod("password");
const loginResult = await passwordAuth.login("username", "password123");
const signupResult = await passwordAuth.signUp("newuser", "securepassword");

// Approach 2: Get the WebAuthn authentication (if enabled)
const webauthnAuth = shogun.getAuthenticationMethod("webauthn");
if (webauthnAuth) {
  // WebAuthn is available
  const isSupported = await webauthnAuth.isSupported();
  if (isSupported) {
    const credentials = await webauthnAuth.generateCredentials(
      "username",
      null,
      true
    );
    // Use the credentials...
  }
}

// Approach 3: Get the MetaMask authentication (if enabled)
const metamaskAuth = shogun.getAuthenticationMethod("metamask");
if (metamaskAuth) {
  // MetaMask is available
  const isAvailable = await metamaskAuth.isAvailable();
  if (isAvailable) {
    const connectResult = await metamaskAuth.connectMetaMask();
    if (connectResult.success) {
      const loginResult = await metamaskAuth.login(connectResult.address);
      console.log("Logged in with MetaMask:", loginResult);
    }
  }
}

// Approach 4: Get the Bitcoin authentication (if enabled)
const bitcoinAuth = shogun.getAuthenticationMethod("bitcoin");
if (bitcoinAuth) {
  // Bitcoin auth is available
  const isAvailable = await bitcoinAuth.isAvailable();
  if (isAvailable) {
    const connectResult = await bitcoinAuth.connect();
    if (connectResult.success) {
      const loginResult = await bitcoinAuth.login(connectResult.address);
      console.log("Logged in with Bitcoin:", loginResult);
    }
  }
}

// Example: Dynamic authentication based on user choice
function authenticateUser(
  method: "password" | "webauthn" | "ethereum" | "bitcoin",
  username: string,
  password?: string
) {
  const auth = shogun.getAuthenticationMethod(method);

  if (!auth) {
    console.error(`Authentication method ${method} not available`);
    return Promise.resolve({ success: false, error: "Method not available" });
  }

  switch (method) {
    case "password":
      return auth.login(username, password);
    case "webauthn":
      return auth.generateCredentials(username).then((creds) => {
        if (creds.success) {
          return auth.login(username);
        }
        return { success: false, error: "WebAuthn failed" };
      });
    case "metamask":
      return auth.connectMetaMask().then((result) => {
        if (result.success) {
          return auth.login(result.address);
        }
        return { success: false, error: "MetaMask connection failed" };
      });
    case "bitcoin":
      return auth.connect().then((result) => {
        if (result.success) {
          return auth.login(result.address);
        }
        return { success: false, error: "Bitcoin connection failed" };
      });
  }
}

// Usage
authenticateUser("password", "username", "password123").then((result) => {
  console.log("Authentication result:", result);
});
```

### Reactive Programming with RxJS

Shogun SDK provides first-class RxJS integration, enabling reactive programming patterns with GunDB:

```typescript
import { map, filter } from "rxjs/operators";

// Observe a user profile in real-time
shogun.observe<{ name: string; status: string }>("users/profile/123").subscribe(
  (profile) => console.log("Profile updated:", profile),
  (error) => console.error("Error observing profile:", error)
);

// Work with reactive collections
const todos$ = shogun.match<{ id: string; task: string; completed: boolean }>(
  "todos"
);
todos$.subscribe((todos) => console.log("All todos:", todos));

// Filter collections with RxJS operators
todos$
  .pipe(map((todos) => todos.filter((todo) => !todo.completed)))
  .subscribe((pendingTodos) => console.log("Pending todos:", pendingTodos));

// Update data reactively
shogun
  .rxPut<{ name: string; status: string }>("users/profile/123", {
    name: "John Doe",
    status: "online",
  })
  .subscribe(() => console.log("Profile updated"));

// Create computed values from multiple data sources
shogun
  .compute<
    any,
    { username: string; pendingCount: number; completedCount: number }
  >(["todos", "users/profile/123"], (todos, profile) => ({
    username: profile.name,
    pendingCount: todos.filter((t) => !t.completed).length,
    completedCount: todos.filter((t) => t.completed).length,
  }))
  .subscribe((stats) => console.log("Dashboard stats:", stats));

// Work with user data
if (shogun.isLoggedIn()) {
  shogun
    .observeUser<{ theme: string; notifications: boolean }>("preferences")
    .subscribe((prefs) => console.log("User preferences:", prefs));
}
```

### Repository Pattern

The Repository Pattern provides an abstraction for data access, with support for typing, transformation, and encryption.

```typescript
import { ShogunCore, GunRepository } from "shogun-core";

// Define an interface for your data type
interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: number;
}

// Create a typed repository class
class UserRepository extends GunRepository<User> {
  constructor(shogun: ShogunCore) {
    // Initialize with options: userScope=true, encryption=true
    super(shogun.gun, "users", {
      userScope: true,
      useEncryption: true,
      encryptionKey: shogun.gun.getCurrentUser()?.user._?.sea,
    });
  }

  // Implement transformation from raw data to entity
  protected mapToEntity(data: any): User {
    return {
      id: data.id,
      name: data.name || "",
      email: data.email || "",
      role: data.role || "user",
      lastLogin: data.lastLogin || Date.now(),
    };
  }

  // Implement transformation from entity to data to save
  protected mapToData(entity: User): any {
    // Remove computed or unnecessary fields
    const { id, ...data } = entity;
    return data;
  }

  // Add entity-specific methods
  async findByRole(role: string): Promise<User[]> {
    const all = await this.findAll();
    return all.filter((user) => user.role === role);
  }
}

// Usage:
const shogun = new ShogunCore({
  /* config */
});
const userRepo = new UserRepository(shogun);

// Create a new user
const userId = await userRepo.save({
  name: "John Smith",
  email: "john@example.com",
  role: "admin",
});

// Find a specific user
const user = await userRepo.findById(userId);

// Update a user
await userRepo.update(userId, { role: "superadmin" });

// Delete a user
await userRepo.remove(userId);
```

### Certificate Management

Shogun supports certificate management for authorized data access between users.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Generate certificate for a specific permission
async function generateCertificate(publicKey, path, action) {
  try {
    // Get current user's key pair
    const pair = shogun.gun.getCurrentUser()?.user._?.sea;
    
    if (!pair) {
      console.error("User must be logged in to generate certificates");
      return null;
    }
    
    // Create a certificate for the specified path and action
    const certificate = await SEA.certify(
      [publicKey], // who the certificate is for
      [{ "*": path }], // what path they can access
      pair, // signed by current user
      null
    );
    
    // Store the certificate
    await shogun.gun.user().get("certificates")
      .get(publicKey)
      .get(action)
      .put(certificate);
      
    console.log(`Certificate for ${action} on ${path} generated`);
    return certificate;
  } catch (error) {
    console.error("Error generating certificate:", error);
    return null;
  }
}

// Verify a certificate
async function verifyCertificate(certificate, publicKey) {
  try {
    // Verify the certificate's authenticity
    const isValid = await SEA.verify(certificate, publicKey);
    console.log(`Certificate is ${isValid ? "valid" : "invalid"}`);
    return isValid;
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return false;
  }
}

// Example: Grant read access to a user's profile
async function grantProfileAccess(friendPublicKey) {
  const cert = await generateCertificate(
    friendPublicKey,
    "profile",
    "read"
  );
  return cert;
}

// Example: Grant write access to chat messages
async function grantChatAccess(friendPublicKey) {
  const cert = await generateCertificate(
    friendPublicKey,
    "messages",
    "write"
  );
  return cert;
}
```

### Advanced Cryptographic Utilities

Shogun Core provides advanced cryptographic utilities for encryption, signing, and key management.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Cryptographic operations examples
async function cryptoExamples() {
  // Get the user's key pair
  const pair = shogun.gun.getCurrentUser()?.user._?.sea;
  
  if (!pair) {
    console.error("User must be logged in to use crypto functions");
    return;
  }

  // Encryption and decryption
  const message = "Secret information";
  const encrypted = await SEA.encrypt(message, pair);
  const decrypted = await SEA.decrypt(encrypted, pair);
  console.log("Decrypted:", decrypted);

  // Signing and verification
  const data = { timestamp: Date.now(), action: "important_operation" };
  const signed = await SEA.sign(data, pair);
  const verified = await SEA.verify(signed, pair.pub);
  console.log("Verification result:", verified);

  // Hash generation
  const hash = await SEA.work("Text to hash", null, null, { name: "SHA-256" });
  console.log("Generated hash:", hash);
  
  return {
    encrypted,
    decrypted,
    signed,
    verified,
    hash
  };
}

// End-to-end encryption between users
async function encryptForUser(receiverPub, message) {
  const senderPair = shogun.gun.getCurrentUser()?.user._?.sea;
  
  if (!senderPair) {
    console.error("Sender must be logged in to encrypt messages");
    return null;
  }
  
  // Create a shared secret with the recipient's public key
  const sharedSecret = await SEA.secret(receiverPub, senderPair);
  
  // Encrypt the message with the shared secret
  const encrypted = await SEA.encrypt(message, sharedSecret);
  
  return encrypted;
}

// Decrypt data from a specific sender
async function decryptFromUser(senderPub, encryptedData) {
  const receiverPair = shogun.gun.getCurrentUser()?.user._?.sea;
  
  if (!receiverPair) {
    console.error("Receiver must be logged in to decrypt messages");
    return null;
  }
  
  // Recreate the shared secret with the sender's public key
  const sharedSecret = await SEA.secret(senderPub, receiverPair);
  
  // Decrypt the message with the shared secret
  const decrypted = await SEA.decrypt(encryptedData, sharedSecret);
  
  return decrypted;
}
```

## Use Cases

Shogun is particularly suitable for:

- **dApps**: Decentralized applications requiring user authentication and wallet management.
- **Web Wallets**: Implementation of crypto wallets directly in the browser.
- **Social dApps**: Social applications requiring decentralized storage and crypto identities.
- **Privacy-Focused Apps**: Applications needing stealth features and advanced privacy.
- **Real-time Applications**: Chat apps, live dashboards, and collaborative tools using reactive data.
- **Reactive UIs**: User interfaces that need to respond to data changes in real-time.

## Documentation

Shogun SDK includes a complete technical documentation generated with TSDoc:

Read the documentation [here](https://shogun-core-docs.vercel.app/)

- **Local documentation**: View the documentation by opening `./docs/index.html`
- **Main classes**: View `./docs/classes/` for details on the main classes
- **Interfaces**: View `./docs/interfaces/` for details on the interfaces

## Custom Plugins

Shogun SDK supports extending its functionality through custom plugins. This allows you to add new features while maintaining system modularity.

### Creating a Plugin

1. Create a new class that extends `BasePlugin` or directly implements the `ShogunPlugin` interface:

```typescript
import { BasePlugin } from "shogun-core/plugins/base";
import { ShogunCore } from "shogun-core";
import { PluginCategory } from "shogun-core/types/shogun";

// Define an interface for the plugin's public functionality
export interface MyPluginInterface {
  exampleFunction(): void;
  // Other public functions
}

// Implement the plugin by extending BasePlugin
export class MyPlugin extends BasePlugin implements MyPluginInterface {
  // Required properties
  name = "my-plugin";
  version = "1.0.0";
  description = "My custom plugin for shogun-core";

  // Initialization
  initialize(core: ShogunCore): void {
    super.initialize(core);
    // Specific initialization logic
    console.log("MyPlugin initialized");
  }

  // Implement interface functions
  exampleFunction(): void {
    const core = this.assertInitialized();
    // Implementation...
  }

  // Optional: implement destroy method
  destroy(): void {
    // Cleanup resources
    super.destroy();
  }
}
```

### Registering a Plugin

There are two ways to register a plugin with Shogun Core:

1. **Manual registration** after creating the ShogunCore instance:

```typescript
import { ShogunCore, PluginCategory } from "shogun-core";
import { MyPlugin } from "./my-plugin";

// Create ShogunCore instance
const shogun = new ShogunCore({
  // Configuration...
});

// Create and register the plugin
const myPlugin = new MyPlugin();
myPlugin._category = PluginCategory.Utility; // Optional: assign a category
shogun.register(myPlugin);
```

2. **Automatic registration** during initialization:

```typescript
import { ShogunCore } from "shogun-core";
import { MyPlugin } from "./my-plugin";

const shogun = new ShogunCore({
  // Configuration...
  plugins: {
    autoRegister: [new MyPlugin()],
  },
});
```

### Using the Plugin

Once registered, you can access the plugin in two ways:

1. **Direct access by name**:

```typescript
const plugin = shogun.getPlugin<MyPluginInterface>("my-plugin");
if (plugin) {
  plugin.exampleFunction();
}
```

2. **Access by category**:

```typescript
import { PluginCategory } from "shogun-core";

const utilityPlugins = shogun.getPluginsByCategory(PluginCategory.Utility);
console.log(`Found ${utilityPlugins.length} utility plugins`);

// Use the found plugins
utilityPlugins.forEach((plugin) => {
  console.log(`Plugin: ${plugin.name}, version: ${plugin.version}`);
});
```

### Error Handling for Plugins

Shogun provides consistent error handling for plugins through the centralized ErrorHandler:

```typescript
import { ErrorHandler, ErrorType } from "shogun-core/utils/errorHandler";

// In your plugin implementation
try {
  // Plugin operation
} catch (error) {
  // Use the appropriate error type for your plugin
  ErrorHandler.handle(
    ErrorType.PLUGIN, // Or a specific type like BIP32, ETHEREUM, BITCOIN, etc.
    "OPERATION_FAILED",
    "Failed to perform operation due to: " + error.message,
    error
  );
}
```

Available plugin-specific error types include:
- `ErrorType.WEBAUTHN` - For WebAuthn authentication errors
- `ErrorType.ETHEREUM` - For Ethereum connectivity errors
- `ErrorType.BITCOIN` - For Bitcoin wallet errors
- `ErrorType.BIP32` - For HD wallet errors
- `ErrorType.STEALTH` - For stealth address errors
- `ErrorType.PLUGIN` - For general plugin errors

## Stealth Transactions

Shogun SDK supports stealth transactions for enhanced privacy in blockchain operations. The Stealth plugin allows creating stealth addresses that hide the true recipient of a transaction.

```typescript
import { ShogunCore, CorePlugins } from "shogun-core";

// Initialize Shogun with the Stealth plugin enabled
const shogun = new ShogunCore({
  // Configuration...
  stealth: { enabled: true },
});

// Access the Stealth plugin
const stealthPlugin = shogun.getPlugin(CorePlugins.StealthAddress);

// 1. Generate ephemeral keys
async function generateEphemeralKeys() {
  const ephemeralKeys = await stealthPlugin.generateEphemeralKeyPair();
  console.log("Ephemeral private key:", ephemeralKeys.privateKey);
  console.log("Ephemeral public key:", ephemeralKeys.publicKey);
  return ephemeralKeys;
}

// 2. Retrieve the user's stealth keys
async function getMyStealthKeys() {
  const stealthKeys = await stealthPlugin.getStealthKeys();
  console.log("Viewing key:", stealthKeys.viewingKey);
  console.log("Spending key:", stealthKeys.spendingKey);
  return stealthKeys;
}

// 3. Generate a stealth address for the recipient
async function createStealthAddressForRecipient(recipientViewingPublicKey, recipientSpendingPublicKey) {
  try {
    // Generate a stealth address for the recipient
    const stealthAddressResult = await stealthPlugin.generateStealthAddress(
      recipientViewingPublicKey,
      recipientSpendingPublicKey
    );
    
    console.log("Generated stealth address:", stealthAddressResult.stealthAddress);
    console.log("Ephemeral public key:", stealthAddressResult.ephemeralPublicKey);
    console.log("Encrypted random number:", stealthAddressResult.encryptedRandomNumber);
    
    return stealthAddressResult;
  } catch (error) {
    console.error("Error generating stealth address:", error);
    throw error;
  }
}

// 4. Open a received stealth address
async function openReceivedStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey) {
  try {
    // Open a stealth address using the user's keys
    const wallet = await stealthPlugin.openStealthAddress(
      stealthAddress,
      encryptedRandomNumber,
      ephemeralPublicKey
    );
    
    console.log("Derived wallet address:", wallet.address);
    console.log("Wallet private key:", wallet.privateKey);
    
    // This wallet can be used to access funds sent to the stealth address
    return wallet;
  } catch (error) {
    console.error("Error opening stealth address:", error);
    throw error;
  }
}

// 5. Send funds to a stealth address (using ethers.js separately)
async function sendFundsToStealthAddress(stealthAddress, amountInEth) {
  try {
    // Get a wallet to send the transaction
    const bip32Plugin = shogun.getPlugin(CorePlugins.Bip32);
    const senderWallet = bip32Plugin.getMainWallet();
    
    // Prepare the transaction using ethers.js
    const tx = {
      to: stealthAddress,
      value: ethers.parseEther(amountInEth)
    };
    
    // Send the transaction
    const txResponse = await senderWallet.sendTransaction(tx);
    console.log("Transaction sent:", txResponse.hash);
    
    // Wait for confirmation
    const receipt = await txResponse.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    return receipt;
  } catch (error) {
    console.error("Error sending funds to stealth address:", error);
    throw error;
  }
}
```

### Benefits of Stealth Transactions

- **Enhanced Privacy**: Stealth addresses hide the true identity of the recipient
- **Unlinkable Transactions**: Each transaction uses a different address
- **Compatibility**: Works with any Ethereum wallet
- **Security**: Only the recipient can derive the private key needed to access the funds

### How It Works

1. **Stealth Keys**: Each user has a pair of viewing and spending keys
2. **Address Generation**: The sender generates a unique stealth address for the recipient using their public keys
3. **Sending Funds**: The sender transfers funds to the generated stealth address
4. **Funds Recovery**: The recipient can derive the private key of the stealth address using the encryptedRandomNumber and ephemeralPublicKey provided by the sender
5. **Secure Access**: Only the legitimate recipient can calculate the private key needed to move the funds

### Implementation Notes

- Shogun's stealth protocol uses asymmetric cryptography to ensure that only the intended recipient can derive the private key of the stealth address
- The implementation allows the creation of ephemeral wallets for each transaction
- The communication of necessary information (ephemeralPublicKey, encryptedRandomNumber) takes place off-chain between sender and recipient

## Contracts SDK

Shogun integrates a complete system for verification and interaction with blockchain relays, offering functionality to verify subscriptions, identities, and manage decentralized relays.

The Relay system consists of three main contracts:

1. **Registry**: Central registry of all available relays
2. **SimpleRelay**: Individual relays that manage subscriptions and public keys
3. **EntryPoint**: Centralized access point for interacting with multiple relays

```typescript
import { 
  Registry, 
  SimpleRelay, 
  EntryPoint,
  RegistryConfig,
  SimpleRelayConfig,
  EntryPointConfig
} from "shogun-core/src/contracts";

// Registry configuration
const registryConfig: RegistryConfig = {
  registryAddress: "0xRegistryContractAddress",
  providerUrl: "https://ethereum-rpc-url.com"
};

// Initialize the Registry
const registry = new Registry(registryConfig);

// Find a relay by URL
async function findRelayByUrl(url: string) {
  const relayAddress = await registry.findRelayByUrl(url);
  console.log(`Relay found at address: ${relayAddress}`);
  return relayAddress;
}

// Configuration for a specific SimpleRelay
const relayConfig: SimpleRelayConfig = {
  relayAddress: "0xRelayContractAddress",
  registryAddress: "0xRegistryContractAddress",
  providerUrl: "https://ethereum-rpc-url.com"
};

// Initialize the SimpleRelay
const relay = new SimpleRelay(relayConfig);

// Check if an address has an active subscription
async function checkSubscription(userAddress: string) {
  const isActive = await relay.isSubscriptionActive(userAddress);
  console.log(`User subscription ${userAddress} is ${isActive ? 'active' : 'inactive'}`);
  return isActive;
}

// Check if a public key is authorized
async function checkPublicKeyAuthorization(pubKey: string) {
  const isAuthorized = await relay.isAuthorizedByPubKey(pubKey);
  console.log(`Public key is ${isAuthorized ? 'authorized' : 'unauthorized'}`);
  return isAuthorized;
}

// Configuration for EntryPoint
const entryPointConfig: EntryPointConfig = {
  entryPointAddress: "0xEntryPointContractAddress",
  registryAddress: "0xRegistryContractAddress",
  providerUrl: "https://ethereum-rpc-url.com"
};

// Initialize EntryPoint
const entryPoint = new EntryPoint(entryPointConfig);

// Subscribe to a relay via URL
async function subscribeToRelayByUrl(
  relayUrl: string, 
  months: number, 
  pubKey: string,
  value: bigint
) {
  const txResponse = await entryPoint.subscribeViaUrl(relayUrl, months, pubKey, value);
  if (txResponse) {
    console.log(`Subscription created with tx hash: ${txResponse.hash}`);
    await txResponse.wait();
    console.log("Subscription confirmed!");
  }
  return txResponse;
}

// Check subscriptions across multiple relays for a user
async function checkMultipleSubscriptions(userAddress: string, relayAddresses: string[]) {
  const subscriptionStatuses = await entryPoint.batchCheckSubscriptions(
    userAddress,
    relayAddresses
  );
  
  console.log("Subscription statuses:");
  relayAddresses.forEach((addr, i) => {
    console.log(`- Relay ${addr}: ${subscriptionStatuses[i] ? 'Active' : 'Inactive'}`);
  });
  
  return subscriptionStatuses;
}

// Get network statistics
async function getSystemStatistics() {
  const stats = await entryPoint.getStatistics();
  if (stats) {
    console.log("System statistics:");
    console.log(`- Total users: ${stats.userCount}`);
    console.log(`- Total subscriptions: ${stats.totalSubscriptions}`);
    console.log(`- Total processed amount: ${ethers.formatEther(stats.totalAmountProcessed)} ETH`);
    console.log(`- Total fees collected: ${ethers.formatEther(stats.totalFeesCollected)} ETH`);
  }
  return stats;
}
```
Read more in the [Contracts SDK](https://github.com/scobru/shogun-contracts/blob/main/README.md) documentation.

### Main Features

#### Registry

- **Relay Management**: Registration, updating, and deactivation of relays
- **Relay Search**: Find relays by URL or owner
- **Relay Information**: Details about each registered relay

#### SimpleRelay

- **Subscription Management**: Verification and management of user subscriptions
- **Key Authorization**: Verification of authorized public keys
- **Operational Configuration**: Management of prices, duration, and URL

#### EntryPoint

- **Centralized Management**: Unified interface for all relays
- **Multi-Relay Subscription**: Subscribe to multiple relays in a single transaction
- **Batch Verification**: Check subscriptions and public keys across multiple relays

### Additional Utilities

The Contracts module also includes utilities for:

- Getting all registered relay URLs
- Retrieving public keys registered across multiple relays
- Viewing relay performance statistics
- Monitoring relay system events and activities

```typescript
import {
  getRelayUrls,
  getRegisteredPubKeys,
  getNetworkSummary,
  subscribeToRelayEvents,
  RelayEventType
} from "shogun-core/src/contracts";

// Example of using the utilities
async function relaySystemOverview() {
  // Get all relay URLs
  const relayUrls = await getRelayUrls(registry);
  console.log(`Found ${relayUrls.length} relays in the system`);
  
  // Get registered public keys
  const pubKeys = await getRegisteredPubKeys(registry, entryPoint);
  console.log(`Found ${Object.keys(pubKeys).length} unique public keys`);
  
  // Get network summary
  const summary = await getNetworkSummary(registry, entryPoint);
  console.log(`Active relays: ${summary.activeRelays}/${summary.totalRelays}`);
  console.log(`Average price: ${summary.averagePrice} ETH`);
  
  // Subscribe to relay events
  const unsubscribe = subscribeToRelayEvents(registry, (event) => {
    console.log(`Event ${event.type} detected at ${new Date(event.timestamp).toLocaleString()}`);
    if (event.type === RelayEventType.NEW_SUBSCRIPTION) {
      console.log(`New subscription for ${event.userAddress} on ${event.relayAddress}`);
    }
  });
  
  // To unsubscribe
  // unsubscribe();
}
```

This architecture allows developers to easily integrate relay-based verification and authentication into their projects, with options for both direct interactions with individual relays and centralized operations through the EntryPoint.

## Browser Integration

Shogun Core can be used directly in modern web browsers through the specialized browser entry point. This makes it possible to create decentralized applications that run entirely from the client's browser.

### Setup

You can include Shogun Core in two ways:

#### 1. Using script tags

```html
<script src="path/to/shogun-core.js"></script>
```

#### 2. Using npm/yarn in a frontend project

```bash
npm install shogun-core
# or
yarn add shogun-core
```

And then import it in your applications:

```javascript
// ESM
import {
  ShogunCore,
  initShogunBrowser,
  CorePlugins,
  PluginCategory,
} from "shogun-core";

// CommonJS
const {
  ShogunCore,
  initShogunBrowser,
  CorePlugins,
  PluginCategory,
} = require("shogun-core");
```

### Examples

```javascript
// Initialize Shogun with browser-optimized configuration
const shogun = initShogunBrowser({
  gundb: {
    peers: ["https://your-gun-relay.com/gun"],
    websocket: true, // Use WebSocket for communication
  },
  providerUrl: "https://ethereum-rpc-url.com",
  // WebAuthn configuration for biometric/device authentication
  webauthn: {
    enabled: true,
    rpName: "Your App",
    rpId: window.location.hostname,
  },
  // Optional: enable stealth and bip32 wallet manager
  stealth: {
    enabled: true,
  },
  bip32: {
    enabled: true,
  },
  // Enable Bitcoin support
  bitcoin: {
    enabled: true,
  }
});

// Registration
async function signup() {
  try {
    const result = await shogun.signUp("username", "password");
    console.log("Registration completed:", result);
  } catch (error) {
    console.error("Error during registration:", error);
  }
}

// Login
async function login() {
  try {
    const result = await shogun.login("username", "password");
    console.log("Login completed:", result);
  } catch (error) {
    console.error("Error during login:", error);
  }
}

// WebAuthn Login using the getAuthenticationMethod (modern way)
async function webAuthnLogin() {
  try {
    const username = document.getElementById("webauthnUsername").value;
    const authMethod = shogun.getAuthenticationMethod("webauthn");

    if (authMethod && (await authMethod.isSupported())) {
      const credentials = await authMethod.generateCredentials(
        username,
        null,
        true
      );
      if (credentials.success) {
        // Use credentials to authenticate the user
        const loginResult = await authMethod.login(username);
        console.log("WebAuthn login result:", loginResult);
      }
    } else {
      console.error("WebAuthn not supported by this browser");
    }
  } catch (error) {
    console.error("Error during WebAuthn login:", error);
  }
}

// MetaMask Login using the getAuthenticationMethod (modern way)
async function metamaskLogin() {
  try {
    const authMethod = shogun.getAuthenticationMethod("metamask");

    if (authMethod && (await authMethod.isAvailable())) {
      // Get connection
      const connectResult = await authMethod.connectMetaMask();
      if (connectResult.success) {
        // Login with the address
        const loginResult = await authMethod.login(connectResult.address);
        console.log("MetaMask login result:", loginResult);
      }
    } else {
      console.error("MetaMask not available");
    }
  } catch (error) {
    console.error("Error during MetaMask login:", error);
  }
}

// Bitcoin Login
async function bitcoinLogin() {
  try {
    const authMethod = shogun.getAuthenticationMethod("bitcoin");

    if (authMethod && (await authMethod.isAvailable())) {
      // Get connection
      const connectResult = await authMethod.connect();
      if (connectResult.success) {
        // Login with the address
        const loginResult = await authMethod.login(connectResult.address);
        console.log("Bitcoin login result:", loginResult);
      }
    } else {
      console.error("Bitcoin wallet not available");
    }
  } catch (error) {
    console.error("Error during Bitcoin login:", error);
  }
}

// Creating a wallet
async function createWallet() {
  if (!shogun.isLoggedIn()) {
    console.error("You must log in first!");
    return;
  }

  try {
    const bip32Plugin = shogun.getPlugin(CorePlugins.Bip32);
    if (bip32Plugin) {
      const wallet = await bip32Plugin.createWallet();
      console.log("Wallet created:", wallet);
    } else {
      console.error("BIP32 wallet plugin not available");
    }
  } catch (error) {
    console.error("Error while creating wallet:", error);
  }
}

// Using lazy-loaded modules
async function loadPluginsOnDemand() {
  try {
    // Import WebAuthn module
    const webauthnModule = await shogun.modules.webauthn.loadWebAuthn();
    const webauthn = new webauthnModule.Webauthn();
    
    // Import stealth module
    const stealthModule = await shogun.modules.stealth.loadStealth();
    const stealth = new stealthModule.Stealth();
    
    // Import wallet module
    const walletModule = await shogun.modules.bip32.loadHDWallet();
    
    // Import Ethereum module
    const metamaskModule = await shogun.modules.ethereum.loadMetaMask();
    
    console.log("All modules loaded successfully");
  } catch (error) {
    console.error("Error loading modules:", error);
  }
}

// Using reactive data
function setupReactiveUI() {
  // Subscribe to user profile changes
  shogun.observe("users/current").subscribe((user) => {
    document.getElementById("username").textContent = user.name;
    document.getElementById("status").className = user.online
      ? "online"
      : "offline";
  });

  // Handle real-time messages
  shogun.match("messages").subscribe((messages) => {
    const chatBox = document.getElementById("chat");
    chatBox.innerHTML = "";

    messages.forEach((msg) => {
      const msgEl = document.createElement("div");
      msgEl.className = "message";
      msgEl.textContent = `${msg.sender}: ${msg.text}`;
      chatBox.appendChild(msgEl);
    });
  });
}
```

For a complete example, check the [examples/browser-example.html](examples/browser-example.html) file.

### Compatibility

The browser version of Shogun Core:

- Supports all modern browsers (Chrome, Firefox, Safari, Edge)
- Includes necessary polyfills for node.js functionalities used by GunDB
- Automatically optimizes settings for the browser environment
- Provides WebAuthn support when available in the browser

## Contribute

Contributions are welcome! If you would like to contribute to the project, please:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Added amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
