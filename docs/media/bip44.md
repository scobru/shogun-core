# BIP44 HD Wallet Plugin for Shogun SDK

## Overview

The BIP44 HD Wallet plugin for Shogun SDK provides hierarchical deterministic wallet functionality based on the BIP44 standard. It enables the creation, management, and secure storage of cryptocurrency wallets derived from a single seed phrase, supporting multiple accounts and chains.

## Architecture

The HD Wallet implementation consists of these key components:

- **HDWallet**: Core implementation that can be used independently
- **HDWalletPlugin**: Integration wrapper for the Shogun Core plugin system
- **Types**: TypeScript definitions for HD wallet functionality

### File Structure

```
shogun-core/src/plugins/bip44/
├── index.ts           - Exports all plugin components
├── hdwalletPlugin.ts  - Plugin registration and lifecycle
├── hdwallet.ts        - Core HD wallet implementation
└── types.ts           - TypeScript type definitions
```

## Usage Options

The HD Wallet functionality can be used in two ways:

### 1. Through Shogun Core (Plugin System)

```typescript
import { ShogunCore } from "shogun-core";

// Enable the plugin through configuration
const shogun = new ShogunCore({
  bip32: {
    enabled: true,
    balanceCacheTTL: 60000 // Optional: cache balance for 1 minute
  },
  // Other config options...
});

// Get the plugin
const hdwalletPlugin = shogun.getPlugin("hdwallet");

// Use the plugin
const walletInfo = await hdwalletPlugin.createWallet();
console.log("Created wallet at address:", walletInfo.address);
```

### 2. Directly Using HDWallet

The `HDWallet` class can be used independently without Shogun Core:

```typescript
import { HDWallet } from "shogun-core/plugins/bip44";
import Gun from "gun";

// Create a Gun instance
const gun = Gun();

// Create an HDWallet instance with optional configuration
const hdwallet = new HDWallet(gun, {
  balanceCacheTTL: 30000,
  rpcUrl: "https://mainnet.infura.io/v3/YOUR_API_KEY",
  defaultGasLimit: 21000
});

// Generate a new wallet
const walletInfo = await hdwallet.createWallet();
console.log("Created wallet at address:", walletInfo.address);
```

## Core Features

### Wallet Creation and Management

```typescript
// Generate a new mnemonic
const mnemonic = hdwalletPlugin.generateNewMnemonic();

// Create a new wallet (auto-derives from stored mnemonic)
const walletInfo = await hdwalletPlugin.createWallet();

// Load all user wallets
const wallets = await hdwalletPlugin.loadWallets();

// Get main wallet
const mainWallet = hdwalletPlugin.getMainWallet();
```

### Key Derivation

The plugin implements BIP44 derivation paths to create consistent hierarchical wallets:

```typescript
// Get multiple addresses from a mnemonic using BIP44 paths
const addresses = hdwalletPlugin.getStandardBIP44Addresses(mnemonic, 5);
```

### Transaction Signing

```typescript
// Sign a message
const signature = await hdwalletPlugin.signMessage(wallet, "Hello, World!");

// Verify a signature
const address = hdwalletPlugin.verifySignature("Hello, World!", signature);

// Sign a transaction
const signedTx = await hdwalletPlugin.signTransaction(wallet, recipientAddress, "0.1");
```

### Wallet Backup and Recovery

```typescript
// Export mnemonic (encrypted with password)
const encryptedMnemonic = await hdwalletPlugin.exportMnemonic("strong-password");

// Export wallet private keys (encrypted with password)
const encryptedKeys = await hdwalletPlugin.exportWalletKeys("strong-password");

// Export Gun user pair (for account recovery)
const encryptedGunPair = await hdwalletPlugin.exportGunPair("strong-password");

// Export all user data
const completeBackup = await hdwalletPlugin.exportAllUserData("strong-password");

// Import from backups
const mnemonicImported = await hdwalletPlugin.importMnemonic(encryptedMnemonic, "strong-password");
const walletsImported = await hdwalletPlugin.importWalletKeys(encryptedKeys, "strong-password");
const gunPairImported = await hdwalletPlugin.importGunPair(encryptedGunPair, "strong-password");

// Import all user data at once
const importResult = await hdwalletPlugin.importAllUserData(completeBackup, "strong-password");
```

### Ethereum Network Configuration

```typescript
// Set RPC URL for Ethereum provider
hdwalletPlugin.setRpcUrl("https://mainnet.infura.io/v3/YOUR_API_KEY");

// Get current RPC URL
const rpcUrl = hdwalletPlugin.getRpcUrl();

// Get provider and signer
const provider = hdwalletPlugin.getProvider();
const signer = hdwalletPlugin.getSigner();
```

## Integration with GunDB

The plugin securely stores wallet data in GunDB:

```typescript
// Wallets are automatically stored in GunDB when created
const walletInfo = await hdwalletPlugin.createWallet();

// Wallets can be loaded from GunDB
const wallets = await hdwalletPlugin.loadWallets();
```

## Security Considerations

- Mnemonics and private keys are encrypted before storage
- Sensitive data can be exported in encrypted format
- The plugin supports multiple backup and recovery options
- All wallet operations require user authentication

## Implementation Notes

- The plugin uses ethers.js v6 for Ethereum interactions
- Keys are generated using cryptographically secure random functions
- BIP44 derivation paths follow the Ethereum standard (m/44'/60'/0'/0/x)
- Balance caching improves performance by reducing network requests
- Transaction monitoring tracks the status of pending transactions 