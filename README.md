# Shogun SDK

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/scobru/shogun-core/actions)
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)](https://coveralls.io/github/scobru/shogun-core)

<!-- [![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)](https://coveralls.io/github/yourusername/shogun-core) -->

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
