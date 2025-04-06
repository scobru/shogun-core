# Shogun SDK

## Table of Contents
- [Overview](#overview)
- [Why Choose Shogun?](#why-choose-shogun)
  - [The Web3 Challenge](#the-web3-challenge)
  - [The Shogun Solution](#the-shogun-solution)
- [Core Features](#core-features)
  - [Authentication](#authentication)
  - [Storage](#storage)
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
- [Use Cases](#use-cases)
- [Documentation](#documentation)
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
import { ShogunCore, initShogunBrowser } from "shogun-core";

// Inizializzazione per ambiente Node.js
const shogun = new ShogunCore({
  gundb: {
    peers: ["https://your-gun-peer.com/gun"],
    localStorage: true,
  },
  providerUrl: "https://ethereum-rpc-url.com",
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
    rpId: "yourdomain.com"
  }
});

// Authentication examples
const webAuthnLogin = await shogun.loginWithWebAuthn('username');
const metaMaskLogin = await shogun.loginWithMetaMask('0x1234...abcd');
const passwordLogin = await shogun.login('username', 'password');

// Wallet operations
const wallet = await shogun.createWallet();

// Login con MetaMask
async function metamaskLogin() {
  try {
    // Prima ottieni l'indirizzo da MetaMask
    const provider = window.ethereum;
    if (!provider) {
      throw new Error("MetaMask non è installato!");
    }
    
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts[0]; // Indirizzo dell'utente
    
    const result = await shogun.loginWithMetaMask(address);
    console.log("Login with MetaMask completed:", result);
  } catch (error) {
    console.error("Error during MetaMask login:", error);
  }
}
```

## Use Cases

Shogun is particularly suitable for:

- **dApps**: Decentralized applications requiring user authentication and wallet management.
- **Web Wallets**: Implementation of crypto wallets directly in the browser.
- **Social dApps**: Social applications requiring decentralized storage and crypto identities.
- **Privacy-Focused Apps**: Applications needing stealth features and advanced privacy.

## Documentation

Shogun SDK includes a complete technical documentation generated with TSDoc:

Read the documentation [here](https://shogun-core-docs.vercel.app/)

- **Local documentation**: View the documentation by opening `./docs/index.html`
- **Main classes**: View `./docs/classes/` for details on the main classes
- **Interfaces**: View `./docs/interfaces/` for details on the interfaces

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
import { ShogunCore, initShogunBrowser } from "shogun-core";

// CommonJS
const { ShogunCore, initShogunBrowser } = require("shogun-core");
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
    enabled: true
  },
  walletManager: {
    enabled: true
  },
  did: {
    enabled: true
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

// Creating a wallet
async function createWallet() {
  if (!shogun.isLoggedIn()) {
    console.error("You must log in first!");
    return;
  }

  try {
    const wallet = await shogun.createWallet();
    console.log("Wallet created:", wallet);
  } catch (error) {
    console.error("Error while creating wallet:", error);
  }
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
