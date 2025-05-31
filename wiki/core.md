# Shogun Core Documentation

## Overview

The `ShogunCore` class is the main entry point for the Shogun SDK, providing access to:
- Decentralized database (GunDB)
- Authentication methods (traditional, WebAuthn, Ethereum)
- Plugin system for extensibility
- RxJS integration for reactive programming

## Installation

```typescript
import { ShogunCore } from "shogun-core";

const core = new ShogunCore({
  peers: ["https://relay.example.com/gun"],
  scope: "app-name"
});
```

## Configuration

The SDK can be initialized with various configuration options:

```typescript
interface ShogunSDKConfig {
  peers?: string[];                // Gun peer URLs
  scope?: string;                  // Data namespace
  gunInstance?: any;               // Existing Gun instance
  logging?: LoggingConfig;         // Logging configuration
  timeouts?: {                     // Operation timeouts (ms)
    login?: number;
    signup?: number;
  };
  plugins?: {                      // Plugin configuration
    autoRegister?: ShogunPlugin[]; // Plugins to auto-register
  };
  
  // Authentication methods
  webauthn?: { enabled: boolean }; // WebAuthn support
  ethereum?: { enabled: boolean }; // Web3/Ethereum support
  bitcoin?: { enabled: boolean };  // Bitcoin/Nostr support
  
  // Privacy features
  stealthAddress?: { enabled: boolean }; // Stealth addresses
  
  // Wallet features
  bip44?: { enabled: boolean };    // HD wallet support
}
```

## Authentication

### Basic Authentication

```typescript
// Sign up a new user
const signupResult = await core.signUp("username", "password");

// Login with username and password
const loginResult = await core.login("username", "password");

// Check if user is logged in
const isLoggedIn = core.isLoggedIn();

// Logout the current user
core.logout();
```

### Alternative Authentication Methods

```typescript
// Get specific authentication method
const webauthn = core.getAuthenticationMethod("webauthn");
const ethereum = core.getAuthenticationMethod("ethereum");
const bitcoin = core.getAuthenticationMethod("bitcoin");
```

## Plugin System

ShogunCore features a robust plugin system for extensibility:

```typescript
// Register a custom plugin
core.register(myPlugin);

// Check if a plugin is registered
const hasPlugin = core.hasPlugin("MyPlugin");

// Get a plugin by name
const plugin = core.getPlugin("MyPlugin");

// Get plugins by category
const authPlugins = core.getPluginsByCategory(PluginCategory.Authentication);

// Unregister a plugin
core.unregister("MyPlugin");
```

## Events

The SDK provides an event system for monitoring activities:

```typescript
// Listen for login events
core.on("auth:login", (data) => {
  console.log("User logged in:", data.userPub);
});

// Listen for logout events
core.on("auth:logout", () => {
  console.log("User logged out");
});

// Listen for signup events
core.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
});

// Listen for errors
core.on("error", (error) => {
  console.error("SDK error:", error);
});

// Remove event listener
core.off("auth:login", myListener);

// Remove all listeners for an event
core.removeAllListeners("auth:login");
```

## GunDB Access

The SDK provides access to the underlying GunDB instance:

```typescript
// Access Gun instance
const gun = core.gun;

// Access current user
const user = core.user;

// Access the Gun wrapper
const gundb = core.gundb;

// RxJS integration
const rx = core.rx;
```

## Error Handling

```typescript
// Get recent errors
const errors = core.getRecentErrors(10);
```

## Logging

```typescript
// Configure logging
core.configureLogging({
  enabled: true,
  level: "debug",
  prefix: "ShogunSDK"
});
```

## Storage

The SDK provides a persistent storage implementation:

```typescript
// Access storage
const storage = core.storage;

// Store item
storage.setItem("key", "value");

// Retrieve item
const value = storage.getItem("key");
```

## Built-in Plugins

ShogunCore comes with several built-in plugins:

- **WebAuthn**: Passwordless authentication
- **Web3Connector**: Ethereum wallet integration
- **NostrConnector**: Bitcoin/Nostr integration
- **StealthPlugin**: Stealth address functionality
- **HDWalletPlugin**: HD wallet implementation

## Exports

The SDK exports numerous utilities and types:

- Error handling utilities
- Contract interfaces
- Plugin types
- GunDB wrappers
- Stealth address utilities
- WebAuthn functionality
- Storage implementation
