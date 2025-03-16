# Shogun SDK

## Overview

Welcome to the Shogun SDK! This powerful and user-friendly SDK is designed to simplify decentralized authentication and wallet management. With support for various authentication methods including standard username/password, MetaMask, and WebAuthn, Shogun SDK integrates seamlessly with GunDB for decentralized user authentication. Whether you're building a new application or enhancing an existing one, Shogun SDK provides the tools you need to manage user authentication and crypto wallets efficiently.

## Key Features

- **Multi-layer Authentication**: Supports username/password, MetaMask, and WebAuthn.
- **Wallet Management**: Easily manage crypto wallets, mnemonics, and keys.
- **GunDB Integration**: Decentralized user authentication with GunDB.
- **Stealth Addresses**: Create and manage stealth addresses for enhanced privacy.
- **Storage Solutions**: Simple key-value storage with support for localStorage.

## Installation

```bash
npm install shogun-core
# o
yarn add shogun-core
```

## Basic Usage Example   

```typescript
import { ShogunSDK } from 'shogun-core';

// Initialize the SDK
const shogun = new ShogunSDK({
  peers: ['https://your-gun-peer.com/gun'],
  localStorage: true
});

// Authentication with username/password
const loginResult = await shogun.login('username', 'password');

// Or with MetaMask
const metaMaskLoginResult = await shogun.loginWithMetaMask('ethereumAddress');

// Or with WebAuthn
const webAuthnLoginResult = await shogun.loginWithWebAuthn('username');
```

## Full Documentation

Shogun SDK includes a complete technical documentation generated with TSDoc:

- **Local documentation**: View the documentation by opening `./docs/index.html`
- **Main classes**: View `./docs/classes/` for details on the main classes
- **Interfaces**: View `./docs/interfaces/` for details on the interfaces

## System Requirements and Compatibility

- **Modern browsers** with support for WebAuthn (Chrome, Firefox, Edge, Safari)
- **Node.js** 14 or higher
- Compatible with **ethers.js** v6

## Contribute

Contributions are welcome! If you would like to contribute to the project, please:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Added amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Browser Usage

Shogun Core can be used directly in modern web browsers. This makes it possible to create decentralized applications that run entirely from the client's browser.

### Installation

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
import { ShogunCore, initShogunBrowser } from 'shogun-core';

// CommonJS
const { ShogunCore, initShogunBrowser } = require('shogun-core');
```

### Browser Usage Examples

```javascript
// Initialize Shogun with browser-optimized configuration
const shogun = initShogunBrowser({
  peers: ['https://your-gun-relay.com/gun'],
  websocket: true, // Use WebSocket for communication
  // WebAuthn configuration for biometric/device authentication
  webauthn: {
    enabled: true,
    rpName: 'Your App',
    rpId: window.location.hostname
  }
});

// Registration
async function signup() {
  try {
    const result = await shogun.signUp('username', 'password');
    console.log('Registration completed:', result);
  } catch (error) {
    console.error('Error during registration:', error);
  }
}

// Login
async function login() {
  try {
    const result = await shogun.login('username', 'password');
    console.log('Login completed:', result);
  } catch (error) {
    console.error('Error during login:', error);
  }
}

// Creating a wallet
async function createWallet() {
  if (!shogun.isLoggedIn()) {
    console.error('You must log in first!');
    return;
  }
  
  try {
    const wallet = await shogun.createWallet();
    console.log('Wallet created:', wallet);
  } catch (error) {
    console.error('Error while creating wallet:', error);
  }
}
```

For a complete example, check the [examples/browser-example.html](examples/browser-example.html) file.

### Compatibility Notes

The browser version of Shogun Core:

- Supports all modern browsers (Chrome, Firefox, Safari, Edge)
- Includes necessary polyfills for node.js functionalities used by GunDB
- Automatically optimizes settings for the browser environment
- Provides WebAuthn support when available in the browser

