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
- [Relay Verification](#relay-verification)
  - [RelayMembershipVerifier](#1-relaymembershipverifier)
  - [DIDVerifier](#2-didverifier)
  - [OracleBridge](#3-oraclebridge)
  - [Casi d'Uso per la Relay Verification](#casi-duso-per-la-relay-verification)
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

// Inizializzazione per ambiente Node.js
const shogun = new ShogunCore({
  gundb: {
    peers: ["https://your-gun-peer.com/gun"],
    localStorage: true,
  },
  providerUrl: "https://ethereum-rpc-url.com",
  // Abilitazione plugin integrati
  webauthn: { enabled: true },
  metamask: { enabled: true },
  stealth: { enabled: true },
  did: { enabled: true },
  walletManager: { enabled: true },
});

// Oppure per browser (consigliato per applicazioni web)
const shogunBrowser = initShogunBrowser({
  gundb: {
    peers: ["https://your-gun-peer.com/gun"],
    websocket: true,
  },
  providerUrl: "https://ethereum-rpc-url.com",
  webauthn: {
    enabled: true,
    rpName: "Your App",
    rpId: "yourdomain.com",
  },
});

// Authentication examples
// Autenticazione standard
const passwordLogin = await shogun.login("username", "password");

// Accesso ai plugin
const webauthnPlugin = shogun.getPlugin(CorePlugins.WebAuthn);
const metamaskPlugin = shogun.getPlugin(CorePlugins.MetaMask);
const walletPlugin = shogun.getPlugin(CorePlugins.Wallet);

if (webauthnPlugin) {
  const credentials = await webauthnPlugin.generateCredentials(
    "username",
    null,
    true
  ); // true = login
  if (credentials.success) {
    // Usa le credenziali per autenticare...
  }
}

if (metamaskPlugin) {
  // Login con MetaMask
  try {
    // Connessione e autenticazione con MetaMask
    const connectResult = await metamaskPlugin.connectMetaMask();
    if (connectResult.success) {
      const address = connectResult.address;
      // Login usando l'indirizzo
      const loginResult = await metamaskPlugin.loginWithMetaMask(address);
      console.log("MetaMask login result:", loginResult);
    }
  } catch (error) {
    console.error("Error during MetaMask login:", error);
  }
}

// Wallet operations
if (walletPlugin) {
  const wallet = await walletPlugin.createWallet();
  const mainWallet = walletPlugin.getMainWallet();
}

// Utilizzo dello Stealth Plugin
if (shogun.hasPlugin(CorePlugins.Stealth)) {
  const stealthPlugin = shogun.getPlugin(CorePlugins.Stealth);

  // Genera un indirizzo stealth per ricevere pagamenti in modo privato
  const stealthAddress = await stealthPlugin.generateStealthAddress();
  console.log("Indirizzo stealth generato:", stealthAddress);

  // Crea una transazione privata verso un indirizzo stealth
  const receiverStealthAddress = "0xEccetera..."; // Indirizzo stealth del destinatario
  const amount = "0.01"; // Quantità in ETH
  const txResult = await stealthPlugin.createStealthTransaction(
    receiverStealthAddress,
    amount
  );
  console.log("Transazione stealth inviata:", txResult);

  // Scansiona la blockchain per trovare pagamenti stealth indirizzati a te
  const payments = await stealthPlugin.scanStealthPayments();
  console.log("Pagamenti stealth trovati:", payments);
}

// Ottenere i plugin per categoria
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

// Example: Dynamic authentication based on user choice
function authenticateUser(
  method: "password" | "webauthn" | "metamask",
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

### Advanced GunDB Features

Shogun Core includes advanced GunDB features that allow you to build complex and robust decentralized applications.

#### Repository Pattern

The Repository Pattern provides an elegant abstraction for data access, with support for typing, transformation, and encryption.

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

#### Distributed Consensus

The Consensus module allows you to implement decentralized decision-making mechanisms based on voting.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Consensus configuration (optional)
const consensusConfig = {
  threshold: 0.66, // Require 66% of votes in favor
  timeWindow: 3600000, // 1 hour voting window
  minVotes: 5, // Require at least 5 votes
};

// Access the consensus system
const consensus = shogun.gun.consensus(consensusConfig);

// 1. Propose a change
async function proposeChange() {
  const proposalId = await consensus.proposeChange(
    "config-update",
    { maxUsers: 1000, featureFlag: true },
    { importance: "high" }
  );
  console.log(`Proposal created: ${proposalId}`);
  return proposalId;
}

// 2. Vote on a proposal
async function vote(proposalId, approve) {
  await consensus.vote(proposalId, approve, "Reason for vote");
  console.log(`Vote recorded: ${approve ? "Approved" : "Rejected"}`);
}

// 3. Check proposal status
async function checkProposal(proposalId) {
  const proposal = await consensus.getProposal(proposalId);
  console.log(`Proposal status: ${proposal.status}`);

  // Count votes
  const voteCount = await consensus.countVotes(proposalId);
  console.log(
    `Votes: ${voteCount.approvalCount} approvals, ${voteCount.rejectionCount} rejections`
  );
  console.log(
    `The proposal is ${voteCount.approved ? "approved" : "rejected or pending"}`
  );
}
```

#### Immutable Data Space (Frozen Space)

The Frozen Space provides a mechanism for immutable data, ideal for logs, audit trails, and content archiving.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Save immutable data
async function savePermanentData() {
  const data = {
    content: "This content cannot be modified",
    timestamp: Date.now(),
    author: "John Smith",
  };

  // Add to Frozen Space
  await shogun.gun.addToFrozenSpace("documents", "doc1", data);
  console.log("Document saved immutably");

  // Alternative: use content hash as key
  const contentHash = await shogun.gun.addHashedToFrozenSpace(
    "documents",
    data
  );
  console.log(`Document saved with hash: ${contentHash}`);

  return contentHash;
}

// Retrieve immutable data
async function getPermanentData(hash) {
  // Retrieve data using hash, with integrity verification
  const data = await shogun.gun.getHashedFrozenData("documents", hash, true);
  console.log("Document retrieved:", data);
  return data;
}
```

#### Authorization Certificates

The certificate system enables decentralized and delegated authorizations.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Generate authorization certificates
async function generateCertificates() {
  // Get the key pair from the current user
  const pair = shogun.gun.getCurrentUser()?.user._?.sea;

  // Generate a single certificate
  const cert = await shogun.gun.issueCert({
    pair,
    tag: "write", // Authorization type
    dot: "tasks", // Authorized path
    users: "*", // For all users ('*') or specific ('~pubKey')
  });

  // Generate multiple certificates at once
  const certs = await shogun.gun.generateCerts({
    pair,
    list: [
      { tag: "read", dot: "profiles", users: "*" },
      { tag: "write", dot: "profiles", users: "~ABCDEF" }, // Specific user
      { tag: "admin", dot: "settings", personal: true }, // For personal use only
    ],
  });

  return { cert, certs };
}

// Verify a certificate
async function verifyCertificate(cert, pubKey) {
  const isValid = await shogun.gun.verifyCert(cert, pubKey);
  console.log(`Certificate is ${isValid ? "valid" : "invalid"}`);

  // Extract policy from certificate
  const policy = await shogun.gun.extractCertPolicy(cert);
  console.log("Certificate policy:", policy);

  return isValid;
}
```

#### Managed Collections

The Collections API simplifies managing collections of data with common operations.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Access the Collections module
const collections = shogun.gun.collections();

// Add an item to a collection
async function addToCollection() {
  const itemId = await collections.add("products", {
    name: "Smartphone XYZ",
    price: 499.99,
    category: "electronics",
    inStock: true,
  });
  console.log(`Product added with ID: ${itemId}`);
  return itemId;
}

// Update an item
async function updateCollectionItem(id) {
  await collections.update("products", id, {
    price: 449.99,
    inStock: false,
  });
  console.log("Product updated");
}

// Retrieve all items
async function getAllItems() {
  const items = await collections.findAll("products");
  console.log(`Found ${items.length} products`);
  return items;
}

// Retrieve a specific item
async function getItem(id) {
  const item = await collections.findById("products", id);
  console.log("Product found:", item);
  return item;
}

// Remove an item
async function removeItem(id) {
  await collections.remove("products", id);
  console.log("Product removed");
}
```

#### Advanced Cryptographic Utilities

Shogun Core provides advanced cryptographic utilities for encryption, signing, and hash management.

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  /* config */
});

// Cryptographic operations examples
async function cryptoExamples() {
  // Generate key pair
  const keyPair = await shogun.gun.generateKeyPair();

  // Encryption
  const encrypted = await shogun.gun.encrypt("Secret message", keyPair.epriv);
  const decrypted = await shogun.gun.decrypt(encrypted, keyPair.epriv);

  // Signing and verification
  const signed = await shogun.gun.sign({ data: "Authenticated data" }, keyPair);
  const verified = await shogun.gun.verify(signed, keyPair.pub);

  // Hashing
  const textHash = await shogun.gun.hashText("Text to hash");
  const objHash = await shogun.gun.hashObj({
    complex: "object",
    with: ["arrays"],
  });

  // Short hashes (useful for identifiers)
  const shortHash = await shogun.gun.getShortHash(
    "user@example.com",
    "salt123"
  );

  // URL-safe hashes
  const safeHash = shogun.gun.safeHash(textHash);
  const originalHash = shogun.gun.unsafeHash(safeHash);

  return {
    encrypted,
    decrypted,
    verified,
    textHash,
    objHash,
    shortHash,
    safeHash,
  };
}

// End-to-end encryption between users
async function encryptForUser(receiverPub) {
  const senderPair = shogun.gun.getCurrentUser()?.user._?.sea;
  const receiverKey = { epub: receiverPub };

  // Encrypt data for a specific recipient
  const message = "This message is only readable by the recipient";
  const encrypted = await shogun.gun.encFor(message, senderPair, receiverKey);

  return encrypted;
}

// Decrypt data from a specific sender
async function decryptFromUser(senderPub, encryptedData) {
  const receiverPair = shogun.gun.getCurrentUser()?.user._?.sea;
  const senderKey = { epub: senderPub };

  // Decrypt data coming from a specific sender
  const decrypted = await shogun.gun.decFrom(
    encryptedData,
    senderKey,
    receiverPair
  );

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
import { BasePlugin } from "shogun-core/src/plugins/base";
import { ShogunCore } from "shogun-core";
import { PluginCategory } from "shogun-core/src/types/shogun";

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

Available categories include:

- `PluginCategory.Authentication`: plugins for authentication
- `PluginCategory.Wallet`: plugins for wallet management
- `PluginCategory.Privacy`: plugins for privacy and anonymization
- `PluginCategory.Identity`: plugins for decentralized identity
- `PluginCategory.Utility`: plugins for other functionalities

## Stealth Transactions

Shogun SDK supporta transazioni stealth per maggiore privacy nelle operazioni blockchain. Il plugin Stealth permette di creare indirizzi stealth che nascondono il vero destinatario di una transazione.

```typescript
import { ShogunCore, CorePlugins } from "shogun-core";

// Inizializza Shogun con il plugin Stealth abilitato
const shogun = new ShogunCore({
  // Configurazione...
  stealth: { enabled: true },
});

// Accesso al plugin Stealth
const stealthPlugin = shogun.getPlugin(CorePlugins.Stealth);

// 1. Generazione di chiavi effimere
async function generateEphemeralKeys() {
  const ephemeralKeys = await stealthPlugin.generateEphemeralKeyPair();
  console.log("Chiave privata effimera:", ephemeralKeys.privateKey);
  console.log("Chiave pubblica effimera:", ephemeralKeys.publicKey);
  return ephemeralKeys;
}

// 2. Recupero delle chiavi stealth dell'utente
async function getMyStealthKeys() {
  const stealthKeys = await stealthPlugin.getStealthKeys();
  console.log("Chiave di visualizzazione:", stealthKeys.viewingKey);
  console.log("Chiave di spesa:", stealthKeys.spendingKey);
  return stealthKeys;
}

// 3. Generazione di un indirizzo stealth per il destinatario
async function createStealthAddressForRecipient(recipientViewingPublicKey, recipientSpendingPublicKey) {
  try {
    // Genera un indirizzo stealth per il destinatario
    const stealthAddressResult = await stealthPlugin.generateStealthAddress(
      recipientViewingPublicKey,
      recipientSpendingPublicKey
    );
    
    console.log("Indirizzo stealth generato:", stealthAddressResult.stealthAddress);
    console.log("Chiave pubblica effimera:", stealthAddressResult.ephemeralPublicKey);
    console.log("Numero casuale crittografato:", stealthAddressResult.encryptedRandomNumber);
    
    return stealthAddressResult;
  } catch (error) {
    console.error("Errore nella generazione dell'indirizzo stealth:", error);
    throw error;
  }
}

// 4. Apertura di un indirizzo stealth ricevuto
async function openReceivedStealthAddress(stealthAddress, encryptedRandomNumber, ephemeralPublicKey) {
  try {
    // Apre un indirizzo stealth usando le chiavi dell'utente
    const wallet = await stealthPlugin.openStealthAddress(
      stealthAddress,
      encryptedRandomNumber,
      ephemeralPublicKey
    );
    
    console.log("Indirizzo wallet derivato:", wallet.address);
    console.log("Chiave privata wallet:", wallet.privateKey);
    
    // Questo wallet può essere usato per accedere ai fondi inviati all'indirizzo stealth
    return wallet;
  } catch (error) {
    console.error("Errore nell'apertura dell'indirizzo stealth:", error);
    throw error;
  }
}

// 5. Invio di fondi a un indirizzo stealth (usando ethers.js separatamente)
async function sendFundsToStealthAddress(stealthAddress, amountInEth) {
  try {
    // Ottieni un wallet per inviare la transazione
    const walletPlugin = shogun.getPlugin(CorePlugins.Wallet);
    const senderWallet = walletPlugin.getMainWallet();
    
    // Prepara la transazione usando ethers.js
    const tx = {
      to: stealthAddress,
      value: ethers.parseEther(amountInEth)
    };
    
    // Invia la transazione
    const txResponse = await senderWallet.sendTransaction(tx);
    console.log("Transazione inviata:", txResponse.hash);
    
    // Attendi la conferma
    const receipt = await txResponse.wait();
    console.log("Transazione confermata nel blocco:", receipt.blockNumber);
    
    return receipt;
  } catch (error) {
    console.error("Errore nell'invio di fondi all'indirizzo stealth:", error);
    throw error;
  }
}
```

### Vantaggi delle Transazioni Stealth

- **Maggiore Privacy**: Gli indirizzi stealth nascondono la vera identità del destinatario
- **Transazioni Non Collegabili**: Ogni transazione utilizza un indirizzo diverso
- **Compatibilità**: Funziona con qualsiasi portafoglio Ethereum
- **Sicurezza**: Solo il destinatario può derivare la chiave privata necessaria per accedere ai fondi

### Come Funziona

1. **Chiavi Stealth**: Ogni utente possiede una coppia di chiavi di visualizzazione e spesa
2. **Generazione Indirizzo**: Il mittente genera un indirizzo stealth unico per il destinatario usando le sue chiavi pubbliche
3. **Invio Fondi**: Il mittente trasferisce i fondi all'indirizzo stealth generato
4. **Recupero Fondi**: Il destinatario può derivare la chiave privata dell'indirizzo stealth usando l'encryptedRandomNumber e la ephemeralPublicKey forniti dal mittente
5. **Accesso Sicuro**: Solo il legittimo destinatario può calcolare la chiave privata necessaria per spostare i fondi

### Note Implementative

- Il protocollo stealth di Shogun utilizza la crittografia asimmetrica per garantire che solo il destinatario previsto possa derivare la chiave privata dell'indirizzo stealth
- L'implementazione consente la creazione di portafogli effimeri per ogni transazione
- La comunicazione delle informazioni necessarie (ephemeralPublicKey, encryptedRandomNumber) avviene off-chain tra mittente e destinatario

## Relay Verification

Shogun SDK include moduli per la verifica e l'interazione con sistemi di relay blockchain, fornendo funzionalità per verificare l'appartenenza, l'identità decentralizzata e la sincronizzazione dei dati.

### 1. RelayMembershipVerifier

Questo componente consente di verificare se un indirizzo o una chiave pubblica è autorizzato all'interno del protocollo Shogun.

```typescript
import { ShogunCore, RelayMembershipVerifier } from "shogun-core";

// Inizializza Shogun
const shogun = new ShogunCore({
  // Configurazione...
  providerUrl: "https://ethereum-rpc-url.com",
});

// Crea un'istanza RelayMembershipVerifier
const verifier = new RelayMembershipVerifier({
  contractAddress: "0xContractAddress",
  providerUrl: "https://ethereum-rpc-url.com", // Opzionale se riutilizzi il provider di ShogunCore
}, shogun); // Passa l'istanza ShogunCore per riutilizzare il provider

// Verifica se un indirizzo è autorizzato
async function checkAddressAuthorization(address) {
  const isAuthorized = await verifier.isAddressAuthorized(address);
  console.log(`L'indirizzo ${address} è ${isAuthorized ? 'autorizzato' : 'non autorizzato'}`);
  return isAuthorized;
}

// Verifica se una chiave pubblica è autorizzata
async function checkPublicKeyAuthorization(publicKey) {
  const isAuthorized = await verifier.isPublicKeyAuthorized(publicKey);
  console.log(`La chiave pubblica è ${isAuthorized ? 'autorizzata' : 'non autorizzata'}`);
  return isAuthorized;
}

// Recupera informazioni utente
async function getUserInformation(address) {
  const userInfo = await verifier.getUserInfo(address);
  if (userInfo) {
    console.log(`Informazioni utente per ${address}:`);
    console.log(`- Scadenza: ${userInfo.expires}`);
    console.log(`- Chiave pubblica: ${userInfo.pubKey}`);
  } else {
    console.log(`Nessuna informazione trovata per ${address}`);
  }
  return userInfo;
}
```

### 2. DIDVerifier

Questo componente consente di verificare e interagire con Identificatori Decentralizzati (DID) registrati nel contratto DIDRegistry.

```typescript
import { ShogunCore, DIDVerifier } from "shogun-core";

// Inizializza Shogun
const shogun = new ShogunCore({
  // Configurazione...
  providerUrl: "https://ethereum-rpc-url.com",
});

// Crea un'istanza DIDVerifier
const didVerifier = new DIDVerifier({
  contractAddress: "0xDIDRegistryAddress",
  providerUrl: "https://ethereum-rpc-url.com", // Opzionale se riutilizzi il provider di ShogunCore
}, shogun);

// Verifica un DID e ottieni il suo controller
async function verifyDecentralizedIdentifier(did) {
  const controller = await didVerifier.verifyDID(did);
  if (controller) {
    console.log(`DID ${did} verificato con successo`);
    console.log(`Controller: ${controller}`);
  } else {
    console.log(`DID ${did} non trovato o non valido`);
  }
  return controller;
}

// Autentica un utente usando il suo DID e una firma
async function authenticateUser(did, message, signature) {
  const isAuthenticated = await didVerifier.authenticateWithDID(did, message, signature);
  console.log(`Autenticazione ${isAuthenticated ? 'riuscita' : 'fallita'} per DID: ${did}`);
  return isAuthenticated;
}

// Registra un nuovo DID (richiede un signer con diritti di amministrazione)
async function registerNewDID(did, controller) {
  const success = await didVerifier.registerDID(did, controller);
  console.log(`Registrazione DID ${success ? 'completata' : 'fallita'} per ${did}`);
  return success;
}
```

### 3. OracleBridge

Questo componente consente di interagire con il contratto OracleBridge che pubblica e verifica le radici Merkle per varie epoche, facilitando la sincronizzazione sicura tra on-chain e off-chain.

```typescript
import { ShogunCore, OracleBridge } from "shogun-core";
import { ethers } from "ethers";

// Inizializza Shogun
const shogun = new ShogunCore({
  // Configurazione...
  providerUrl: "https://ethereum-rpc-url.com",
});

// Crea un'istanza OracleBridge
const oracleBridge = new OracleBridge({
  contractAddress: "0xOracleBridgeAddress",
  providerUrl: "https://ethereum-rpc-url.com", // Opzionale se riutilizzi il provider di ShogunCore
}, shogun);

// Ottieni l'ID dell'epoca corrente
async function getCurrentEpoch() {
  const epochId = await oracleBridge.getEpochId();
  console.log(`Epoca corrente: ${epochId}`);
  return epochId;
}

// Ottieni la radice Merkle per un'epoca specifica
async function getMerkleRoot(epochId) {
  const root = await oracleBridge.getRootForEpoch(epochId);
  console.log(`Radice Merkle per epoca ${epochId}: ${root}`);
  return root;
}

// Verifica se la radice Merkle corrisponde al valore atteso
async function verifyMerkleRoot(epochId, expectedRoot) {
  const isValid = await oracleBridge.verifyRoot(epochId, expectedRoot);
  console.log(`Verifica radice per epoca ${epochId}: ${isValid ? 'valida' : 'non valida'}`);
  return isValid;
}

// Pubblica una nuova radice Merkle (solo admin)
async function publishNewRoot(epochId, root, wallet) {
  // Imposta un signer con wallet.connect(provider)
  const signer = wallet.connect(new ethers.JsonRpcProvider("https://ethereum-rpc-url.com"));
  oracleBridge.setSigner(signer);
  
  const receipt = await oracleBridge.publishRoot(epochId, root);
  if (receipt) {
    console.log(`Radice pubblicata con successo per epoca ${epochId}`);
    console.log(`Transaction hash: ${receipt.hash}`);
  } else {
    console.log(`Pubblicazione fallita per epoca ${epochId}`);
  }
  return receipt;
}
```

### Casi d'Uso per la Relay Verification

I componenti di verifica relay sono particolarmente utili per:

- **Autenticazione Decentralizzata**: Verifica l'identità degli utenti attraverso DID e firme crittografiche
- **Controllo Accessi**: Limita l'accesso ai relay solo a membri autorizzati
- **Sincronizzazione Sicura**: Garantisce l'integrità dei dati tra blockchain e sistemi off-chain
- **Gestione del Consenso**: Implementa meccanismi di consenso per dati critici
- **Audit e Tracciamento**: Traccia le operazioni di sincronizzazione e verifica attraverso l'Oracle Bridge

Per ulteriori dettagli sulle API di verifica relay, consulta la documentazione tecnica.

## Browser Integration

Shogun Core can be used directly in modern web browsers. This makes it possible to create decentralized applications that run entirely from the client's browser.

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
  // Optional: attiva stealth e wallet manager
  stealth: {
    enabled: true,
  },
  walletManager: {
    enabled: true,
  },
  did: {
    enabled: true,
  },
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
        // Utilizza le credenziali per autenticare l'utente
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

// Creating a wallet
async function createWallet() {
  if (!shogun.isLoggedIn()) {
    console.error("You must log in first!");
    return;
  }

  try {
    const walletPlugin = shogun.getPlugin(CorePlugins.Wallet);
    if (walletPlugin) {
      const wallet = await walletPlugin.createWallet();
      console.log("Wallet created:", wallet);
    } else {
      console.error("Wallet plugin not available");
    }
  } catch (error) {
    console.error("Error while creating wallet:", error);
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
