# Bitcoin Plugin for Shogun SDK

## Overview

The Bitcoin plugin for Shogun SDK provides authentication and interactions via Nostr protocol and Bitcoin wallets. It enables signing messages with Bitcoin keys, authentication via Nostr, and integration with Lightning and Bitcoin infrastructure.

## Architecture

The Bitcoin implementation consists of these key components:

- **NostrConnector**: Core implementation that can be used independently
- **NostrConnectorPlugin**: Integration wrapper for the Shogun Core plugin system
- **Types**: TypeScript definitions for Nostr and Bitcoin-specific interfaces

### File Structure

```
shogun-core/src/plugins/bitcoin/
├── index.ts                - Exports all plugin components
├── nostrConnectorPlugin.ts - Plugin registration and lifecycle
├── nostrConnector.ts       - Core Nostr functionality implementation
└── types.ts                - TypeScript type definitions
```

## Usage Options

The Bitcoin functionality can be used in two ways:

### 1. Through Shogun Core (Plugin System)

```typescript
import { ShogunCore } from "shogun-core";

// Enable the plugin through configuration
const shogun = new ShogunCore({
  bitcoin: {
    enabled: true
  },
  // Other config options...
});

// Get the plugin
const bitcoinAuth = shogun.getAuthenticationMethod("bitcoin");

// Use the plugin
const result = await bitcoinAuth.login(publicKey);
```

### 2. Directly Using NostrConnector

The `NostrConnector` class can be used independently without Shogun Core:

```typescript
import { NostrConnector } from "shogun-core/plugins/bitcoin";

// Create an instance with optional configuration
const nostr = new NostrConnector({
  cacheDuration: 30 * 60 * 1000, // 30 minutes
  relays: ["wss://relay.damus.io", "wss://relay.nostr.info"]
});

// Connect to wallet
const connection = await nostr.connect();
if (connection.success) {
  console.log(`Connected with public key: ${connection.publicKey}`);
  
  // Generate credentials based on signature
  const credentials = await nostr.generateCredentials(connection.publicKey);
}
```

## Authentication Flow

The authentication process works as follows:

1. Connect to a Nostr-compatible wallet (NIP-07 extension like nos2x or Alby)
2. Request the user to sign a challenge with their key
3. Generate credentials based on the signature
4. Use these credentials to authenticate with the system

### Example Using NostrConnectorPlugin

```typescript
// Get the authentication method
const bitcoin = shogun.getAuthenticationMethod("bitcoin");

// Login with Bitcoin/Nostr
const result = await bitcoin.login(publicKey);
if (result.success) {
  console.log("Authenticated with Nostr!");
}
```

### Example Using Direct NostrConnector

```typescript
const nostr = new NostrConnector();

// Connect to get the public key
const connection = await nostr.connect();
if (connection.success && connection.publicKey) {
  // Generate credentials based on signature
  const credentials = await nostr.generateCredentials(connection.publicKey);
  console.log("Generated credentials:", credentials.username);
  
  // These credentials can be used for authentication in your system
}
```

## Core Features

### Connecting to Nostr

```typescript
// Via plugin
const plugin = shogun.getPlugin("bitcoin");
const connectionResult = await plugin.connect();

// Direct usage
const nostr = new NostrConnector();
const connectionResult = await nostr.connect();
```

### Signature Generation and Verification

```typescript
// Generate credentials (includes signature)
const credentials = await nostr.generateCredentials(publicKey);

// Verify a signature
const recoveredKey = await nostr.verifySignature(
  credentials.message,
  credentials.signature
);
```

## NIP-07 Integration

The plugin integrates with the NIP-07 browser extension standard:

```typescript
// Check if NIP-07 extension is available
const isAvailable = nostr.isAvailable();

// Get public key via NIP-07
const publicKey = await nostr.getPublicKey();

// Sign event via NIP-07
const signedEvent = await nostr.signEvent({
  kind: 1,
  content: "Hello, Nostr!",
  tags: [],
  created_at: Math.floor(Date.now() / 1000)
});
```

## Event Handling

The NostrConnector emits events you can listen for:

```typescript
// Listen for connection events
nostr.on("connected", (data) => {
  console.log("Connected with public key:", data.publicKey);
});

// Cleanup event listeners
nostr.cleanup();
```

## Error Handling

The plugin includes comprehensive error handling:

```typescript
try {
  const connection = await nostr.connect();
} catch (error) {
  // Handle connection errors
  console.error("Nostr connection error:", error);
}
```

## Authentication Utilities

### Generating a Password from Signature

```typescript
const password = await nostr.generatePassword(signature);
```

### Checking for Nostr Availability

```typescript
// Check if NIP-07 extension is available
const isAvailable = nostr.isAvailable();
```

## Relay Configuration

Configure which Nostr relays to use:

```typescript
// Set custom relays
nostr.setRelays(["wss://relay.damus.io", "wss://relay.nostr.info"]);

// Get current relays
const relays = nostr.getRelays();
```

## Implementation Notes

- The plugin implements the NIP-07 standard for browser extensions
- Authentication is based on message signing, not direct private key access
- Signatures are cached for a configurable duration (default: 30 minutes)
- The plugin provides integration with the broader Nostr ecosystem 