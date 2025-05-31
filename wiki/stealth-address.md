# Stealth Address Plugin for Shogun SDK

## Overview

The Stealth Address plugin for Shogun SDK provides privacy-enhancing features for blockchain transactions. It implements stealth address technology that allows users to receive funds without revealing their public address, creating a unique one-time address for each transaction that only the recipient can access.

## Architecture

The Stealth Address implementation consists of these key components:

- **Stealth**: Core implementation that can be used independently
- **StealthPlugin**: Integration wrapper for the Shogun Core plugin system
- **Types**: TypeScript definitions for stealth address functionality

### File Structure

```
shogun-core/src/plugins/stealth-address/
├── index.ts            - Exports all plugin components
├── stealthPlugin.ts    - Plugin registration and lifecycle
├── stealth.ts          - Core stealth address implementation
└── types.ts            - TypeScript type definitions
```

## Usage Options

The Stealth Address functionality can be used in two ways:

### 1. Through Shogun Core (Plugin System)

```typescript
import { ShogunCore } from "shogun-core";

// Enable the plugin through configuration
const shogun = new ShogunCore({
  stealthAddress: {
    enabled: true
  },
  // Other config options...
});

// Get the plugin
const stealthPlugin = shogun.getPlugin("stealth");

// Use the plugin
const stealthAddress = await stealthPlugin.generateStealthAddress(
  recipientPublicKey,
  ephemeralPrivateKey
);
```

### 2. Directly Using Stealth

The `Stealth` class can be used independently without Shogun Core:

```typescript
import { Stealth } from "shogun-core/plugins/stealth-address";
import Gun from "gun";

// Create a Gun instance
const gun = Gun();

// Create a Stealth instance
const stealth = new Stealth(gun);

// Generate a stealth address
const result = await stealth.generateStealthAddress(
  viewingPublicKey,
  spendingPublicKey
);
```

## How Stealth Addresses Work

Stealth addresses use a cryptographic mechanism to generate one-time addresses:

1. Sender generates an ephemeral key pair
2. Sender uses recipient's public viewing key to create a shared secret
3. Shared secret is used to derive a one-time stealth address
4. Recipient can scan the blockchain and identify payments using their private viewing key
5. Only the recipient can spend from the stealth address using their private spending key

## Core Features

### Generating Keys

```typescript
// Generate ephemeral key pair
const keyPair = await stealthPlugin.generateEphemeralKeyPair();

// Get user's stealth keys
const keys = await stealthPlugin.getStealthKeys();
```

### Creating Stealth Addresses

```typescript
// Generate a stealth address for a recipient
const stealthResult = await stealthPlugin.generateStealthAddress(
  recipientPublicKey,
  ephemeralPrivateKey
);

console.log("Stealth address:", stealthResult.stealthAddress);
console.log("Ephemeral public key:", stealthResult.ephemeralPublicKey);
console.log("Encrypted random number:", stealthResult.encryptedRandomNumber);
```

### Accessing Stealth Funds

```typescript
// Open a stealth address to access funds
const wallet = await stealthPlugin.openStealthAddress(
  stealthAddress,
  encryptedRandomNumber,
  ephemeralPublicKey
);

// The wallet can now be used to access and transfer funds
console.log("Wallet address:", wallet.address);
```

## Integration with Ethereum

The Stealth Address plugin integrates with Ethereum to provide privacy for ETH and token transfers:

```typescript
// Get an ethers.js wallet for the stealth address
const wallet = await stealthPlugin.openStealthAddress(
  stealthAddress,
  encryptedRandomNumber,
  ephemeralPublicKey
);

// Use the wallet to send transactions
const tx = await wallet.sendTransaction({
  to: recipient,
  value: ethers.parseEther("0.1")
});
```

## Key Management

The plugin stores stealth keys securely in GunDB:

```typescript
// Keys are automatically generated and saved when needed
await stealth.generateAndSaveKeys();

// Keys can be retrieved when needed
const keys = await stealth.getStealthKeys();
```

## Security Considerations

- Stealth addresses significantly enhance privacy but are not fully anonymous
- The plugin securely stores keys using GunDB's encryption capabilities
- Users should protect their viewing and spending keys carefully
- Sensitive data is cleaned up from memory after use

```typescript
// Clean up sensitive data
await stealth.cleanupSensitiveData();
```

## Implementation Notes

- The plugin uses ethers.js for Ethereum integration
- Keys are securely stored in GunDB user space
- The implementation follows cryptographic best practices for key derivation
- The plugin provides structured logging for debugging and auditing 