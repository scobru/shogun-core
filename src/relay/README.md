# Shogun Core Relay Module

This module provides interfaces to interact with Shogun's smart contracts for relay verification, DID management, and oracle services.

## Recent Updates

The OracleBridge class has been updated to include support for the `rootTimestamps` feature added to the smart contract. This allows checking when a Merkle root for a specific epoch was published.

### New Method

- `getRootTimestamp(epochId: number | bigint): Promise<bigint>`: Retrieves the timestamp when a Merkle root was published for a specific epoch.

## Usage Example

```typescript
import { OracleBridge } from '@shogun/core';

const oracle = new OracleBridge({
  contractAddress: '0x...',
  providerUrl: 'https://...'
});

// Get the current epoch ID
const epochId = await oracle.getEpochId();

// Get the timestamp when the root was published
const timestamp = await oracle.getRootTimestamp(epochId - 1);
console.log(`Root for epoch ${epochId - 1} was published at ${new Date(Number(timestamp) * 1000)}`);
```

## Components

### RelayMembershipVerifier

Verifies if an address or public key is authorized in the Shogun protocol.

### DIDVerifier

Manages and verifies Decentralized Identifiers (DIDs).

### OracleBridge

Interacts with the OracleBridge contract to publish and verify Merkle roots for relay uptime proofs. 