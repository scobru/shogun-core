# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.5.19-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration to provide a secure, user-friendly foundation for Web3 applications.

## Features

- 🔐 **Multiple Authentication Methods**: Traditional username/password, WebAuthn (biometrics), Web3 (MetaMask), Nostr, and OAuth
- 🌐 **Decentralized Storage**: Built on GunDB for peer-to-peer data synchronization
- 🔌 **Plugin System**: Extensible architecture with built-in plugins for various authentication methods
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

### Basic Setup

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

// Initialize the SDK
await shogun.initialize();

console.log("Shogun Core initialized!");
```

### Authentication Examples

#### Traditional Login

```typescript
// Sign up a new user
const signUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
}

// Login with username and password
const loginResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
}
```

#### Web3 Authentication (MetaMask)

```typescript
// Get the Web3 plugin
const web3Plugin = shogun.getPlugin("web3");
if (web3Plugin) {
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
```

#### WebAuthn Authentication

```typescript
// Get the WebAuthn plugin
const webauthnPlugin = shogun.getPlugin("webauthn");
if (webauthnPlugin) {
  try {
    // Register a new credential
    await webauthnPlugin.register("username");

    // Authenticate with existing credential
    const result = await webauthnPlugin.authenticate();
    if (result.success) {
      console.log("WebAuthn authentication successful");
    }
  } catch (error) {
    console.error("WebAuthn authentication failed:", error);
  }
}
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
        peers: ["https://gun-manhattan.herokuapp.com/gun"],
        scope: "my-browser-app",
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "My Browser dApp",
          rpId: window.location.hostname,
        },
      });

      console.log("Shogun Core initialized in browser!", shogun);

      async function connectWallet() {
        if (shogun.hasPlugin("web3")) {
          const web3Plugin = shogun.getPlugin("web3");
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

### Core Methods

#### Authentication

- `login(username: string, password: string): Promise<AuthResult>` - Authenticate with username/password
- `signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>` - Create new user account
- `logout(): void` - Logout current user
- `isLoggedIn(): boolean` - Check if user is authenticated

#### Plugin Management

- `getPlugin<T>(name: string): T | undefined` - Get plugin by name
- `hasPlugin(name: string): boolean` - Check if plugin exists
- `register(plugin: ShogunPlugin): void` - Register custom plugin
- `unregister(pluginName: string): void` - Remove plugin

#### Event Handling

- `on(eventName: string, listener: Function): this` - Subscribe to events
- `off(eventName: string, listener: Function): this` - Unsubscribe from events
- `emit(eventName: string, data?: any): boolean` - Emit custom events

### Built-in Plugins

#### Web3 Plugin

```typescript
const web3Plugin = shogun.getPlugin("web3");
// Methods: getProvider(), login(address), logout(), isConnected()
```

#### WebAuthn Plugin

```typescript
const webauthnPlugin = shogun.getPlugin("webauthn");
// Methods: register(username), authenticate(), isSupported()
```

#### Nostr Plugin

```typescript
const nostrPlugin = shogun.getPlugin("nostr");
// Methods: connect(), login(), logout()
```

#### OAuth Plugin

```typescript
const oauthPlugin = shogun.getPlugin("oauth");
// Methods: login(provider), handleCallback(code), logout()
```

### Configuration Options

```typescript
interface ShogunSDKConfig {
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

  oauth?: {
    enabled?: boolean;
    usePKCE?: boolean;
    providers?: Record<string, any>;
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

Shogun Core provides a comprehensive event system for monitoring authentication and data changes:

```typescript
// Listen for authentication events
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
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

## Error Handling

Shogun Core includes comprehensive error handling with typed errors:

```typescript
import { ShogunError, ErrorType } from "shogun-core";

try {
  await shogun.login("username", "password");
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION_FAILED:
        console.error("Invalid credentials");
        break;
      case ErrorType.NETWORK_ERROR:
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

## Support

- 📖 [Documentation](https://docs.shogun.dev)
- 💬 [Discord Community](https://discord.gg/shogun)
- 🐛 [Issue Tracker](https://github.com/scobru/shogun-core/issues)
- 📧 [Email Support](mailto:support@shogun.dev)
