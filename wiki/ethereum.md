# Ethereum Plugin for Shogun SDK

## Overview

The Ethereum plugin for Shogun SDK provides authentication via MetaMask and other Ethereum wallets. It enables signature-based authentication, transaction signing, and direct integration with ethers.js v6.

## Architecture

The Ethereum implementation consists of these key components:

- **Web3Connector**: Core implementation that can be used independently
- **Web3ConnectorPlugin**: Integration wrapper for the Shogun Core plugin system
- **Types**: TypeScript definitions for Ethereum-specific interfaces

### File Structure

```
shogun-core/src/plugins/ethereum/
├── index.ts               - Exports all plugin components
├── web3ConnectorPlugin.ts - Plugin registration and lifecycle
├── web3Connector.ts       - Core Web3 functionality implementation 
└── types.ts               - TypeScript type definitions
```

## Usage Options

The Ethereum functionality can be used in two ways:

### 1. Through Shogun Core (Plugin System)

```typescript
import { ShogunCore } from "shogun-core";

// Enable the plugin through configuration
const shogun = new ShogunCore({
  ethereum: {
    enabled: true
  },
  // Other config options...
});

// Get the plugin
const ethereumAuth = shogun.getAuthenticationMethod("ethereum");

// Use the plugin
const result = await ethereumAuth.login(address);
```

### 2. Directly Using Web3Connector

The `Web3Connector` class can be used independently without Shogun Core:

```typescript
import { Web3Connector } from "shogun-core/plugins/ethereum";

// Create an instance with optional configuration
const web3 = new Web3Connector({
  cacheDuration: 30 * 60 * 1000, // 30 minutes
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 60000,
});

// Connect to MetaMask
const connection = await web3.connectMetaMask();
if (connection.success) {
  console.log(`Connected to address: ${connection.address}`);
  
  // Generate credentials using the connected address
  const credentials = await web3.generateCredentials(connection.address);
}
```

## Authentication Flow

The authentication process works as follows:

1. Connect to MetaMask to get the user's Ethereum address
2. Request the user to sign a message with their wallet
3. Generate credentials based on the signature
4. Use these credentials to authenticate with the system

### Example Using Web3ConnectorPlugin

```typescript
// Get the authentication method
const ethereum = shogun.getAuthenticationMethod("ethereum");

// Login with MetaMask
const result = await ethereum.login(address);
if (result.success) {
  console.log("Authenticated with MetaMask!");
}
```

### Example Using Direct Web3Connector

```typescript
const web3 = new Web3Connector();

// Connect to get the address
const connection = await web3.connectMetaMask();
if (connection.success && connection.address) {
  // Generate credentials based on signature
  const credentials = await web3.generateCredentials(connection.address);
  console.log("Generated credentials:", credentials.username);
  
  // These credentials can be used for authentication in your system
}
```

## Core Features

### Connecting to MetaMask

```typescript
// Via plugin
const plugin = shogun.getPlugin("ethereum");
const connectionResult = await plugin.connectMetaMask();

// Direct usage
const web3 = new Web3Connector();
const connectionResult = await web3.connectMetaMask();
```

### Signature Generation and Verification

```typescript
// Generate credentials (includes signature)
const credentials = await web3.generateCredentials(address);

// Verify a signature
const recoveredAddress = await web3.verifySignature(
  credentials.message,
  credentials.signature
);
```

### Provider and Signer Access

```typescript
// Get the ethers provider
const provider = await web3.getProvider();

// Get the signer
const signer = await web3.getSigner();

// Set a custom provider with private key
web3.setCustomProvider(
  "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
  "0x123...your_private_key"
);
```

## Event Handling

The Web3Connector emits events you can listen for:

```typescript
// Listen for connection events
web3.on("connected", (data) => {
  console.log("Connected to:", data.address);
});

// Listen for network changes
web3.on("chainChanged", (network) => {
  console.log("Network changed:", network);
});

// Listen for account changes
web3.on("accountsChanged", (accounts) => {
  console.log("Accounts changed:", accounts);
});

// Cleanup event listeners
web3.cleanup();
```

## Error Handling

The plugin includes comprehensive error handling:

```typescript
try {
  const connection = await web3.connectMetaMask();
} catch (error) {
  // Handle connection errors
  console.error("MetaMask connection error:", error);
}
```

## Authentication Utilities

### Generating a Password from Signature

```typescript
const password = await web3.generatePassword(signature);
```

### Checking for MetaMask Availability

```typescript
// Static method
const isAvailable = Web3Connector.isMetaMaskAvailable();

// Instance method
const isAvailable = web3.isAvailable();
```

## Implementation Notes

- The plugin uses ethers.js v6 for Ethereum interactions
- Authentication is based on message signing, not direct private key access
- Signatures are cached for a configurable duration (default: 30 minutes)
- The connection process includes retry logic for reliability