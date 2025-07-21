# Shogun Core - LLM Documentation

## Overview

Shogun Core is a TypeScript SDK for building decentralized applications (dApps) with multiple authentication methods and peer-to-peer data storage using GunDB.

## Core Features

- Multiple authentication: username/password, WebAuthn, Web3 (MetaMask), Nostr, OAuth
- Decentralized storage via GunDB
- Plugin-based architecture
- RxJS reactive programming
- End-to-end encryption
- Full TypeScript support

## Installation

```bash
npm install shogun-core
```

## Basic Usage

### Initialization

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  peers: [
    "wss://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ],
  scope: "my-app",
  logging: { enabled: true, level: "info" },
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: "My App",
    rpId: window.location.hostname,
  },
  nostr: { enabled: true },
  oauth: {
    enabled: true,
    usePKCE: true,
    providers: {
      google: {
        clientId: "YOUR_CLIENT_ID",
        redirectUri: "http://localhost:3000/auth/callback",
        scope: ["openid", "email", "profile"],
      },
    },
  },
});

await shogun.initialize();
```

### Authentication Methods

#### Traditional Login

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

#### Web3 Authentication

```typescript
const web3Plugin = shogun.getPlugin("web3");
if (web3Plugin) {
  const provider = await web3Plugin.getProvider();
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  await web3Plugin.login(address);
}
```

#### WebAuthn Authentication

```typescript
const webauthnPlugin = shogun.getPlugin("webauthn");
if (webauthnPlugin) {
  // Register
  await webauthnPlugin.register("username");

  // Authenticate
  const result = await webauthnPlugin.authenticate();
  if (result.success) {
    console.log("WebAuthn authentication successful");
  }
}
```

## API Reference

### Core Methods

- `login(username: string, password: string): Promise<AuthResult>`
- `signUp(username: string, password: string): Promise<SignUpResult>`
- `logout(): void`
- `isLoggedIn(): boolean`
- `getPlugin<T>(name: string): T | undefined`
- `hasPlugin(name: string): boolean`
- `on(eventName: string, listener: Function): this`
- `off(eventName: string, listener: Function): this`

### Plugin Methods

#### Web3 Plugin

- `getProvider(): Promise<ethers.Provider>`
- `login(address: string): Promise<void>`
- `logout(): void`
- `isConnected(): boolean`

#### WebAuthn Plugin

- `register(username: string): Promise<void>`
- `authenticate(): Promise<AuthResult>`
- `isSupported(): boolean`

#### Nostr Plugin

- `connect(): Promise<void>`
- `login(): Promise<void>`
- `logout(): void`

#### OAuth Plugin

- `login(provider: string): Promise<void>`
- `handleCallback(code: string): Promise<void>`
- `logout(): void`

## Configuration Interface

```typescript
interface ShogunSDKConfig {
  peers?: string[];
  scope?: string;
  authToken?: string;
  appToken?: string;

  logging?: {
    enabled?: boolean;
    level?: "none" | "error" | "warn" | "info" | "debug" | "verbose";
  };

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

  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
}
```

## Event System

```typescript
// Authentication events
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
});

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
});

// Error events
shogun.on("error", (error) => {
  console.error("Shogun error:", error.message);
});
```

## Error Handling

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

## Browser Usage (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>
<script src="https://cdn.jsdelivr.net/npm/shogun-core/dist/browser/shogun-core.js"></script>

<script>
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
</script>
```

## Common Use Cases

### 1. Simple Authentication Setup

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
});
await shogun.initialize();
```

### 2. Web3 Wallet Integration

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-dapp",
  web3: { enabled: true },
});
```

### 3. Multi-Auth Application

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: "My App",
    rpId: window.location.hostname,
  },
  oauth: {
    enabled: true,
    providers: {
      google: { clientId: "YOUR_ID" },
    },
  },
});
```

## Dependencies

- ethers: ^6.13.5
- rxjs: ^7.8.1
- GunDB (peer-to-peer database)
- TypeScript: ^5.8.2

## Version

Current version: 1.5.19
