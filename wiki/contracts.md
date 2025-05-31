# Shogun Protocol Contracts SDK

## Overview

The Contracts module in Shogun SDK provides interfaces and tools for interacting with the Shogun Protocol smart contracts on Ethereum and compatible blockchains. It enables subscription-based access to relay services, decentralized user registration, and protocol-level integrations.

## Architecture

The Contracts implementation consists of these key components:

- **BaseContract**: Core abstraction for contract interactions
- **Registry**: Contract for relay registration and discovery
- **SimpleRelay**: Contract for subscription management and relay services
- **EntryPoint**: Contract for protocol-level subscription coordination
- **Utils**: Helper functions for interacting with the protocol

### File Structure

```
shogun-core/src/contracts/
├── index.ts           - Exports all contract components
├── base.ts            - Base contract class and common types
├── registry.ts        - Registry contract interactions
├── relay.ts           - SimpleRelay contract interactions
├── entryPoint.ts      - EntryPoint contract interactions
└── utils.ts           - Utility functions for the protocol
```

## Smart Contract System

The Shogun Protocol consists of several interconnected smart contracts:

1. **Registry Contract**: Central registry for relay services
   - Maintains a list of registered relays
   - Provides discovery mechanisms
   - Controls relay activation status

2. **SimpleRelay Contract**: Individual relay service implementation
   - Manages user subscriptions
   - Handles subscription payments
   - Validates public key authorization
   - Can operate in standalone or protocol mode

3. **EntryPoint Contract**: Protocol coordination
   - Provides batch subscription capabilities
   - Manages service fees
   - Connects users to relays
   - Maintains protocol-wide statistics

## Usage

### Interacting with the Registry Contract

```typescript
import { Registry } from "shogun-core/contracts";

// Initialize Registry with configuration
const registry = new Registry({
  providerUrl: "https://mainnet.infura.io/v3/YOUR_API_KEY",
  registryAddress: "0x1234..."
});

// Find relay by URL
const relayAddress = await registry.findRelayByUrl("https://relay.example.com");

// Get information about a relay
const relayInfo = await registry.getRelayInfo(relayAddress);
console.log("Relay info:", relayInfo);

// Get all active relays
const relaysPage = await registry.getAllRelays(true, 0, 10);
console.log(`Found ${relaysPage.total} relays`);
```

### Working with Relay Subscriptions

```typescript
import { SimpleRelay } from "shogun-core/contracts";
import { ethers } from "ethers";

// Create a wallet to interact with the contract
const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/YOUR_API_KEY");
const wallet = new ethers.Wallet("your-private-key", provider);

// Initialize SimpleRelay with configuration
const relay = new SimpleRelay({
  signer: wallet,
  registryAddress: "0x1234...",
  relayAddress: "0x5678..."
});

// Check operational configuration
const config = await relay.getRelayOperationalConfig();
console.log("Monthly subscription price:", ethers.formatEther(config.price), "ETH");

// Subscribe for 3 months with a public key
const pubKey = "0x..."; // Your public key in hex format
const tx = await relay.subscribe(3, pubKey);
await tx.wait();
console.log("Subscription confirmed!");

// Check if subscription is active
const isActive = await relay.isSubscriptionActive(wallet.address);
console.log("Subscription active:", isActive);
```

### Using the EntryPoint for Batch Operations

```typescript
import { EntryPoint } from "shogun-core/contracts";
import { ethers } from "ethers";

// Initialize EntryPoint with configuration
const entryPoint = new EntryPoint({
  signer: wallet,
  registryAddress: "0x1234...",
  entryPointAddress: "0xabcd..."
});

// Subscribe to multiple relays at once
const relayAddresses = ["0x1111...", "0x2222...", "0x3333..."];
const pubKeys = ["0xaaa...", "0xbbb...", "0xccc..."];
const tx = await entryPoint.batchSubscribe(relayAddresses, 3, pubKeys, {
  value: ethers.parseEther("0.3") // Total payment for all subscriptions
});
await tx.wait();

// Check subscriptions
const isSubscribed = await entryPoint.batchCheckSubscriptions(wallet.address, relayAddresses);
console.log("Subscription statuses:", isSubscribed);
```

## Key Features

### Relay Discovery

Find and verify relay services:

```typescript
import { getRelayUrls, getRelayPerformance } from "shogun-core/contracts";

// Get all relay URLs
const relays = await getRelayUrls("https://mainnet.infura.io/v3/YOUR_API_KEY", "0x1234...");

// Get performance metrics for relays
const performance = await getRelayPerformance(relays);
console.log("Relay performance:", performance);
```

### Public Key Management

Register and verify public keys for relay authorization:

```typescript
// Check if a public key is registered with a relay
const isRegistered = await relay.isAuthorizedByPubKey(pubKey);

// Get all registered public keys for a user
const pubKeys = await getRegisteredPubKeys(userAddress, relayAddresses, provider);
```

### Subscription Management

Track and manage relay subscriptions:

```typescript
// Get user subscription details
const subInfo = await relay.getUserSubscriptionInfo(wallet.address);
console.log("Subscription expires:", new Date(Number(subInfo.expires) * 1000));
console.log("Registered public key:", subInfo.pubKey);

// Get subscription history
const history = await getSubscriptionHistory(wallet.address, provider);
```

### Protocol Statistics

Monitor network activity and usage:

```typescript
// Get network summary
const summary = await getNetworkSummary(provider, registryAddress, entryPointAddress);
console.log("Total users:", summary.userCount);
console.log("Total subscriptions:", summary.subscriptionCount);

// Get usage data for charts
const data = await getUsageDataForChart(entryPointAddress, provider);
```

## Relay Operation Modes

SimpleRelay contracts can operate in two modes:

1. **SINGLE Mode (0)**: Standalone operation without protocol integration
   - Direct subscription management
   - No fee sharing with protocol
   - Independent operation

2. **PROTOCOL Mode (1)**: Integrated with Registry and EntryPoint
   - Listed in central Registry
   - Subscriptions through EntryPoint
   - Fee sharing with protocol
   - Enhanced discovery and integration

```typescript
// Check relay operating mode
const modeInfo = await relay.getRelayMode();
console.log("Operating mode:", modeInfo.mode === 0 ? "SINGLE" : "PROTOCOL");
console.log("Registered in Registry:", modeInfo.isRegistered);

// Switch to protocol mode
if (modeInfo.mode === 0) {
  await relay.setRegistry(registryAddress, true, "My Relay Service");
  await relay.setEntryPoint(entryPointAddress, true);
}
```

## Event Monitoring

Subscribe to relay events for real-time updates:

```typescript
import { subscribeToRelayEvents, RelayEventType } from "shogun-core/contracts";

// Listen for new subscriptions
const unsubscribe = subscribeToRelayEvents(
  provider,
  relayAddress,
  RelayEventType.SUBSCRIPTION,
  (event) => {
    console.log("New subscription:", event);
  }
);

// Later: stop listening
unsubscribe();
```

## Implementation Notes

- The contracts module uses ethers.js v6 for blockchain interactions
- Error handling includes detailed error types and messages
- Gas optimization is built into batch operations
- All contract methods include proper error handling
- Public key management is secure and verified on-chain
- The module supports multiple provider types for flexibility 