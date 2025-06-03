# Shogun Core Documentation

## Overview

The `ShogunCore` class is the main entry point for the Shogun SDK v1.2.5, providing access to:
- Decentralized database (GunDB) with direct authentication
- Multiple authentication methods (traditional, WebAuthn, Ethereum, Nostr)
- Extensible plugin system for custom functionality
- RxJS integration for reactive programming
- Event-driven architecture for real-time applications
- Secure storage and cryptographic utilities

## Installation

```typescript
import { ShogunCore } from "shogun-core";

const core = new ShogunCore({
  peers: ["https://relay.example.com/gun"],
  scope: "app-name"
});
```

## Configuration

The SDK can be initialized with comprehensive configuration options:

```typescript
interface ShogunSDKConfig {
  // Gun database configuration
  peers?: string[];                // Gun peer URLs for networking
  scope?: string;                  // Data namespace/app identifier
  gunInstance?: IGunInstance<any>; // Existing Gun instance (optional)
  
  // Logging configuration
  logging?: LoggingConfig;         // Custom logging settings
  
  // Operation timeouts (milliseconds)
  timeouts?: {                     
    login?: number;                // Login operation timeout
    signup?: number;               // Signup operation timeout
    operation?: number;            // General operation timeout
  };
  
  // Plugin configuration
  plugins?: {                      
    autoRegister?: ShogunPlugin[]; // Plugins to auto-register on init
  };
  
  // Built-in authentication methods
  webauthn?: WebauthnConfig;       // WebAuthn/FIDO2 configuration
  web3?: { enabled?: boolean };    // Ethereum wallet support
  nostr?: { enabled?: boolean };   // Bitcoin/Nostr protocol support
}

interface WebauthnConfig {
  enabled?: boolean;               // Enable WebAuthn authentication
  rpName?: string;                 // Relying party name
  rpId?: string;                   // Relying party identifier
}

interface LoggingConfig {
  enabled?: boolean;               // Enable/disable logging
  level?: "error" | "warning" | "info" | "debug"; // Log level
  prefix?: string;                 // Custom log prefix
}
```

## Authentication

### Basic Authentication

The SDK provides direct authentication through GunDB's native auth system:

```typescript
// Sign up a new user
const signupResult = await core.signUp("username", "password");
if (signupResult.success) {
  console.log("User created:", signupResult.userPub);
}

// Login with username and password
const loginResult = await core.login("username", "password");
if (loginResult.success) {
  console.log("User logged in:", loginResult.userPub);
  console.log("Auth method:", loginResult.authMethod); // "password"
}

// Check authentication status
const isLoggedIn = core.isLoggedIn();

// Logout the current user
core.logout();
```

### Alternative Authentication Methods

```typescript
// Access specific authentication plugins
const webauthn = core.getAuthenticationMethod("webauthn");
const web3 = core.getAuthenticationMethod("web3");
const nostr = core.getAuthenticationMethod("nostr");

// Set and get current authentication method
core.setAuthMethod("webauthn");
const currentMethod = core.getAuthMethod(); // Returns: "webauthn"
```

### Authentication Results

```typescript
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  authMethod?: "password" | "webauthn" | "web3" | "nostr";
}

interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  error?: string;
  message?: string;
  wallet?: any;
}
```

## Plugin System

ShogunCore features a robust plugin system for extensibility:

```typescript
// Register a custom plugin
core.register(myPlugin);

// Check if a plugin is registered
const hasPlugin = core.hasPlugin("MyPlugin");

// Get a plugin by name with type safety
const plugin = core.getPlugin<MyPluginType>("MyPlugin");

// Get plugins by category
const authPlugins = core.getPluginsByCategory(PluginCategory.Authentication);

// Unregister a plugin
core.unregister("MyPlugin");
```

### Plugin Categories

```typescript
enum PluginCategory {
  Authentication = "authentication",
  Wallet = "wallet",
  Privacy = "privacy",
  Identity = "identity",
  Utility = "utility"
}

enum CorePlugins {
  WebAuthn = "webauthn",
  Web3 = "web3",
  Nostr = "nostr"
}
```

### Auto-Registration

```typescript
import { HDWalletPlugin } from "@shogun/bip44";
import { StealthPlugin } from "@shogun/stealth-address";

const core = new ShogunCore({
  peers: ["https://relay.example.com/gun"],
  plugins: {
    autoRegister: [
      new HDWalletPlugin(),
      new StealthPlugin()
    ]
  }
});
```

## Events

The SDK provides a comprehensive event system for monitoring activities:

```typescript
// Authentication events
core.on("auth:login", (data) => {
  console.log("User logged in:", data.userPub);
  console.log("Username:", data.username);
});

core.on("auth:logout", () => {
  console.log("User logged out");
});

core.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
  console.log("User public key:", data.userPub);
});

// Error handling
core.on("error", (error) => {
  console.error("SDK error:", error.message);
  console.error("Error type:", error.type);
  console.error("Action:", error.action);
});

// Event management
core.off("auth:login", myListener);           // Remove specific listener
core.once("auth:login", myListener);          // Listen once
core.removeAllListeners("auth:login");        // Remove all listeners for event
core.removeAllListeners();                    // Remove all listeners
```

### Event Types

```typescript
interface ShogunEvents {
  error: (data: { action: string; message: string; type: string }) => void;
  "auth:signup": (data: { username: string; userPub: string }) => void;
  "auth:login": (data: { username: string; userPub: string }) => void;
  "auth:logout": (data: Record<string, never>) => void;
}
```

## GunDB Access

The SDK provides enhanced access to the underlying GunDB instance:

```typescript
// Access Gun instance
const gun = core.gun;

// Access current user
const user = core.user;

// Access the Gun wrapper with enhanced features
const gundb = core.gundb;

// RxJS integration for reactive programming
const rx = core.rx;

// Direct Gun operations
await gundb.put("users/profile", { name: "John", status: "online" });
const profile = await gundb.get("users/profile");

// Reactive data flows
rx.observe("users/profile").subscribe(data => {
  console.log("Profile updated:", data);
});
```

## Error Handling

```typescript
// Get recent errors with optional count
const recentErrors = core.getRecentErrors(10);

// Error types
enum ErrorType {
  Authentication = "authentication",
  Network = "network",
  Validation = "validation",
  Plugin = "plugin",
  Storage = "storage",
  Unknown = "unknown"
}

// Custom error handling
try {
  await core.login("username", "wrong-password");
} catch (error) {
  if (error.type === ErrorType.Authentication) {
    console.log("Authentication failed");
  }
}
```

## Logging

```typescript
// Configure logging
core.configureLogging({
  enabled: true,
  level: "debug",
  prefix: "MyApp"
});

// Log levels: "error", "warning", "info", "debug"
```

## Storage

The SDK provides persistent storage implementation:

```typescript
// Access storage
const storage = core.storage;

// Store and retrieve items
storage.setItem("key", "value");
const value = storage.getItem("key");
storage.removeItem("key");
storage.clear();
```

## Security Features

### Authentication State Management

```typescript
// Authentication states
enum AuthState {
  UNAUTHENTICATED = "unauthenticated",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
  AUTHENTICATION_FAILED = "authentication_failed",
  WALLET_INITIALIZING = "wallet_initializing",
  WALLET_READY = "wallet_ready",
  ERROR = "error"
}

// Check current authentication state
const isAuthenticated = core.isLoggedIn();
```

### Cryptographic Operations

```typescript
// Encryption and decryption (through gundb)
const encrypted = await core.gundb.encrypt(data, "password");
const decrypted = await core.gundb.decrypt(encrypted, "password");

// Hashing
const hash = await core.gundb.hashText("sensitive data");
```

## Built-in Plugins

ShogunCore comes with several built-in plugins:

- **WebAuthn**: Passwordless authentication using biometrics or security keys
- **Web3Connector**: Ethereum wallet integration (MetaMask, WalletConnect, etc.)
- **NostrConnector**: Bitcoin and Nostr protocol integration

## API Version

```typescript
// Current API version
console.log(ShogunCore.API_VERSION); // "2.0.0"
```

## Advanced Configuration

### Custom Gun Instance

```typescript
import Gun from "gun";
import "gun/sea";

// Create custom Gun instance
const customGun = Gun({
  peers: ["https://custom-relay.com/gun"],
  localStorage: true,
  radisk: true
});

const core = new ShogunCore({
  gunInstance: customGun,
  scope: "my-app"
});
```

### Provider Integration

```typescript
import { ethers } from "ethers";

// Access Ethereum provider (when Web3 plugin is enabled)
const provider = core.provider;
if (provider) {
  const network = await provider.getNetwork();
  console.log("Connected to:", network.name);
}
```

## Migration Guide

When upgrading from previous versions:

1. **Version 1.1.x to 1.2.x**: 
   - API remains backward compatible
   - New event system with improved error handling
   - Enhanced plugin management
   - Updated dependencies (Ethers v6, RxJS v7)

2. **Plugin Registration**: 
   - Use `register()` instead of `registerPlugin()`
   - Use `unregister()` for plugin removal

3. **Configuration**: 
   - `ethereum` config renamed to `web3`
   - `bitcoin` config renamed to `nostr`

## Best Practices

1. **Error Handling**: Always check `success` property in auth results
2. **Event Cleanup**: Remove event listeners when components unmount
3. **Plugin Management**: Register plugins before authentication
4. **Security**: Use appropriate authentication methods for your use case
5. **Performance**: Configure appropriate timeouts for your network conditions

## Exports

The SDK exports numerous utilities and types:

```typescript
// Main class
export { ShogunCore }

// Plugin types and interfaces
export * from "./types/plugin"
export * from "./types/shogun"

// Error handling
export * from "./utils/errorHandler"

// Storage implementation
export { ShogunStorage }

// GunDB integration
export { GunDB, derive }
export type { DeriveOptions }

// Plugin implementations
export { Web3Connector }
export { Webauthn }

// Contract utilities
export { RelayVerifier }
export * from "./contracts/entryPoint"
export * from "./contracts/utils"
export * from "./contracts/registry"
export * from "./contracts/relay"

// RxJS integration
export * from "./gundb/rxjs-integration"
``` 