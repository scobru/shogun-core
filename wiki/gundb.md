# GunDB Integration in Shogun Core v1.2.5

## Overview

The GunDB module in Shogun Core provides a comprehensive wrapper around the GunDB decentralized database. It enhances GunDB with additional features like direct authentication, reactive data handling through RxJS, encrypted storage, peer management, and simplified data operations with automatic session restoration.

## Architecture

The GunDB implementation consists of these key components:

- **GunDB**: Core wrapper around GunDB with enhanced features and direct authentication
- **GunRxJS**: RxJS integration for reactive programming
- **Crypto**: Cryptographic utilities for secure data handling
- **Utils**: Helper functions for GunDB operations
- **Derive**: Key derivation utilities for multiple blockchain protocols
- **Errors**: Error definitions and handling

### File Structure

```
shogun-core/src/gundb/
├── index.ts              - Exports all GunDB components
├── gun.ts                - Main GunDB wrapper implementation with direct auth
├── rxjs-integration.ts   - RxJS integration for reactive data
├── crypto.ts             - Cryptographic utilities
├── utils.ts              - Helper functions
├── derive.ts             - Multi-protocol key derivation
└── errors.ts             - Error definitions and handling
```

## Usage

The GunDB functionality can be accessed in two ways:

### 1. Through Shogun Core (Recommended)

```typescript
import { ShogunCore } from "shogun-core";

// Initialize Shogun with GunDB configuration
const shogun = new ShogunCore({
  peers: ["https://relay.example.com/gun"],
  scope: "myapp"
});

// Access GunDB through Shogun
const gundb = shogun.gundb;

// Store data
await gundb.put("users/john", { name: "John Doe", age: 30 });

// Retrieve data
const user = await gundb.getUserData("users/john");
```

### 2. Directly Using GunDB Class

```typescript
import { GunDB } from "shogun-core/gundb";
import Gun from "gun";
import "gun/sea";

// Create a Gun instance
const gun = Gun({
  peers: ["https://relay.example.com/gun"]
});

// Create a GunDB instance with application scope
const gundb = new GunDB(gun, "myapp");

// Store and retrieve data
await gundb.put("users/john", { name: "John Doe", age: 30 });
const user = await gundb.get("users/john");
```

## Core Features

### Direct Authentication

The GunDB wrapper provides direct authentication through Gun's native auth system with enhanced error handling and automatic session restoration:

```typescript
// User registration - direct Gun.user().create()
const signupResult = await gundb.signUp("username", "password");
if (signupResult.success) {
  console.log("User created:", signupResult.userPub);
}

// User login - direct Gun.user().auth()
const loginResult = await gundb.login("username", "password");
if (loginResult.success) {
  console.log("User authenticated:", loginResult.userPub);
}

// Check if user is logged in
const isLoggedIn = gundb.isLoggedIn();

// Logout - direct Gun.user().leave()
gundb.logout();

// Get current user
const currentUser = gundb.getCurrentUser();

// Automatic session restoration
const sessionResult = await gundb.restoreSession();
if (sessionResult.success) {
  console.log("Session restored for:", sessionResult.userPub);
}
```

### Enhanced Data Operations

```typescript
// Store data with automatic scoping
await gundb.put("users/john", { name: "John Doe", status: "online" });

// Update data using set (creates new entries in Gun sets)
await gundb.set("users/john/posts", { title: "Hello World", timestamp: Date.now() });

// Remove data (sets to null)
await gundb.remove("users/john/posts/old-post");

// Get data once
const user = await gundb.get("users/john");

// Save user-specific data (requires authentication)
await gundb.saveUserData("profile", { bio: "Developer", avatar: "url" });

// Retrieve user-specific data
const profile = await gundb.getUserData("profile");
```

### Peer Management

Advanced peer management capabilities for network optimization:

```typescript
// Add a new peer to the network
gundb.addPeer("https://new-relay.com/gun");

// Remove a peer from the network
gundb.removePeer("https://old-relay.com/gun");

// Get currently connected peers
const connectedPeers = gundb.getCurrentPeers();
console.log("Connected peers:", connectedPeers);

// Get all configured peers (connected and disconnected)
const allPeers = gundb.getAllConfiguredPeers();
console.log("All configured peers:", allPeers);

// Get detailed peer information
const peerInfo = gundb.getPeerInfo();
/*
{
  "https://relay1.com/gun": { connected: true, status: "connected" },
  "https://relay2.com/gun": { connected: false, status: "disconnected" }
}
*/

// Reconnect to a specific peer
gundb.reconnectToPeer("https://relay.com/gun");

// Reset peers with new configuration
gundb.resetPeers(["https://new-relay1.com/gun", "https://new-relay2.com/gun"]);
```

### Reactive Programming with RxJS

```typescript
// Get RxJS integration
const rx = gundb.rx();

// Observe data changes
rx.observe("users/john").subscribe(user => {
  console.log("User updated:", user);
});

// Get data once as observable
rx.once("users/john").subscribe(user => {
  console.log("User retrieved:", user);
});

// Set data with observable
rx.put("users/john", { name: "John Doe", status: "online" })
  .subscribe(() => {
    console.log("User updated successfully");
  });

// Match data using filters
rx.match("users", user => user.status === "online")
  .subscribe(onlineUsers => {
    console.log("Online users:", onlineUsers);
  });
```

### Encryption and Security

```typescript
// Encrypt sensitive data
const encrypted = await gundb.encrypt({ 
  creditCard: "1234-5678-9012-3456",
  ssn: "123-45-6789"
}, "encryption-password");

// Decrypt data
const decrypted = await gundb.decrypt(encrypted, "encryption-password");

// Hash text securely
const hashed = await gundb.hashText("sensitive information");
console.log("Hash:", hashed);
```

### Account Recovery System

```typescript
// Set password hint and security questions during registration
await gundb.setPasswordHint(
  "username",
  "password",
  "Your favorite pet's name",
  ["What city were you born in?", "What was your first car?"],
  ["New York", "Honda Civic"]
);

// Recover password using security questions
const recoveryResult = await gundb.forgotPassword(
  "username",
  ["New York", "Honda Civic"]
);

if (recoveryResult.success) {
  console.log("Password hint:", recoveryResult.hint);
}
```

### Multi-Protocol Key Derivation

Support for multiple blockchain protocols through the derive system:

```typescript
// Generic key derivation
const genericKeys = await gundb.derive("password", "optional-extra-data");

// Bitcoin-specific derivation
const bitcoinKeys = await gundb.deriveBitcoin("password", "extra-data");

// Ethereum-specific derivation  
const ethereumKeys = await gundb.deriveEthereum("password", "extra-data");

// P256 curve derivation (for WebAuthn/FIDO2)
const p256Keys = await gundb.deriveP256("password", "extra-data");

// Derive all protocol keys at once
const allKeys = await gundb.deriveAll("password", "extra-data");
/*
{
  bitcoin: { ... },
  ethereum: { ... },
  p256: { ... },
  generic: { ... }
}
*/
```

### Event Handling

```typescript
// Listen for authentication events
const unsubscribe = gundb.onAuth(user => {
  console.log("User authenticated:", user);
});

// Stop listening
unsubscribe();
```

## Utility Functions

The GunDB module includes various utility functions for common operations:

```typescript
// Import utilities directly
import { utils } from "shogun-core/gundb";

// Extract node ID
const id = utils.getId(node);

// Extract public key
const pubKey = utils.getPub(id);

// Generate UUID
const uuid = utils.getUUID(gun);

// Convert Gun set to array
const items = utils.getSet(data, setId);

// Access utilities through gundb instance
const nodeId = gundb.utils.getId(someNode);
const publicKey = gundb.utils.getPub(nodeId);
```

## Error Handling

The GunDB module provides comprehensive error handling:

```typescript
// Import error types
import { GunErrors } from "shogun-core/gundb";

try {
  await gundb.login("username", "wrong-password");
} catch (error) {
  if (error instanceof GunErrors.AuthenticationError) {
    console.log("Authentication failed:", error.message);
  } else if (error instanceof GunErrors.TimeoutError) {
    console.log("Operation timed out:", error.message);
  } else if (error instanceof GunErrors.NetworkError) {
    console.log("Network error:", error.message);
  } else {
    console.log("Unknown error:", error);
  }
}

// Access errors through static property
const ErrorTypes = GunDB.Errors;
```

## Advanced Configuration

### Custom Gun Instance

```typescript
import Gun from "gun";
import "gun/sea";
import "gun/lib/radix";
import "gun/lib/radisk";

// Create Gun instance with custom configuration
const gun = Gun({
  peers: ["https://relay1.com/gun", "https://relay2.com/gun"],
  localStorage: true,
  radisk: true,
  multicast: true
});

const gundb = new GunDB(gun, "my-advanced-app");
```

### Integration with Storage

Data can be securely saved and retrieved with automatic user scoping:

```typescript
// Save user-specific data (requires authentication)
await gundb.saveUserData("settings", { 
  theme: "dark", 
  notifications: true,
  language: "en"
});

// Retrieve user-specific data
const settings = await gundb.getUserData("settings");
console.log("User settings:", settings);
```

## Performance Considerations

- **Local Caching**: GunDB implements aggressive local caching to reduce network requests
- **RxJS Optimizations**: The RxJS integration uses `distinctUntilChanged` to prevent duplicate emissions
- **Session Persistence**: Authentication tokens and sessions are cached using browser storage
- **Peer Load Balancing**: Use multiple peers for improved reliability and performance
- **Data Filtering**: Use the match function with filters instead of loading all data for large datasets

## Security Features

- **End-to-End Encryption**: All sensitive data can be encrypted before storage
- **Direct Authentication**: Uses Gun's native authentication without intermediaries
- **Session Management**: Secure session handling with automatic restoration
- **Password Recovery**: Secure password hint and security question system
- **Key Derivation**: Support for multiple cryptographic protocols and standards

## Implementation Notes

- **Automatic Scoping**: Data is automatically scoped to application namespace
- **Metadata Cleanup**: Gun metadata is automatically removed from results
- **Session Restoration**: Authentication state is preserved across browser sessions
- **Network Resilience**: Automatic peer reconnection and failover
- **Cross-Platform**: Works in both browser and Node.js environments
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Migration from Previous Versions

### Version 1.1.x to 1.2.x Changes:

1. **Enhanced Peer Management**: New methods for dynamic peer management
2. **Automatic Session Restoration**: Sessions are now automatically restored on initialization
3. **Multi-Protocol Key Derivation**: Added support for Bitcoin, Ethereum, and P256 key derivation
4. **Improved Error Handling**: More specific error types and better error messages
5. **Enhanced Security**: Improved encryption and password recovery systems

### Upgrading Code:

```typescript
// Old way (still works)
const user = await gundb.get("user/profile");

// New way (recommended for user data)
const profile = await gundb.getUserData("profile");

// New peer management features
gundb.addPeer("https://new-relay.com/gun");
const peers = gundb.getCurrentPeers();

// New key derivation capabilities
const keys = await gundb.deriveAll("password");
```

## Best Practices

1. **Error Handling**: Always wrap database operations in try-catch blocks
2. **Session Management**: Check `isLoggedIn()` before user-specific operations
3. **Peer Configuration**: Use multiple peers for redundancy
4. **Data Encryption**: Encrypt sensitive data before storage
5. **Memory Management**: Unsubscribe from RxJS observables when components unmount
6. **Network Optimization**: Use peer management features to optimize connectivity 