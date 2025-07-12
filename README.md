# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.3.0-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration to provide a secure, user-friendly foundation for Web3 applications.

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

This example demonstrates how to initialize `ShogunCore` in a Node.js or browser project using a bundler like Webpack or Vite.

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

  // Enable and configure logging
  logging: {
    enabled: true,
    level: "info", // "none", "error", "warn", "info", "debug", "verbose"
  },

  // Enable and configure Web3 (e.g., MetaMask) authentication
  web3: { 
    enabled: true 
  },

  // Enable and configure WebAuthn (biometrics, security keys)
  webauthn: {
    enabled: true,
    rpName: "My Awesome App", // Name of your application
  },

  // Enable and configure Nostr
  nostr: { 
    enabled: true 
  },

  // Enable and configure OAuth providers
  oauth: {
    enabled: true,
    usePKCE: true, // Recommended for SPAs
    providers: {
      google: {
        clientId: "YOUR_GOOGLE_CLIENT_ID",
        clientSecret: "YOUR_GOOGLE_CLIENT_SECRET", // For server-side flow
        redirectUri: "http://localhost:3000/auth/callback",
        scope: ["openid", "email", "profile"],
      },
    },
  },
});

// Basic authentication
const loginResult = await shogun.login("username", "password");

console.log("Shogun Core initialized!");

// You can now use the instance to interact with plugins and data
// For example, to initiate a Web3 login:
// const web3Plugin = shogun.getPlugin("web3");
// if (web3Plugin) {
//   const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//   await web3Plugin.login(accounts[0]);
// }
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
        // The script exposes a global `initShogun` function
        const shogun = initShogun({
            peers: ['https://gun-manhattan.herokuapp.com/gun'],
            scope: 'my-browser-app',
            web3: { enabled: true },
            webauthn: {
                enabled: true,
                rpName: 'My Browser dApp',
                rpId: window.location.hostname,
            }
        });

        console.log('Shogun Core initialized in browser!', shogun);

        async function connectWallet() {
            if (shogun.hasPlugin('web3')) {
                const web3Plugin = shogun.getPlugin('web3');
                try {
                    const provider = await web3Plugin.getProvider();
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    await web3Plugin.login(address);
                    console.log('Logged in with address:', address);
                } catch (error) {
                    console.error('Web3 login failed:', error);
                }
            }
        }
    </script>
</body>
</html>
```

## Advanced Usage

### Event Handling

```
```