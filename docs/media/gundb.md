# GunDB Integration in Shogun SDK

## Overview

The GunDB module in Shogun SDK provides a robust wrapper around the GunDB decentralized database. It enhances GunDB with additional features like direct authentication, reactive data handling through RxJS, encrypted storage, and simplified data operations.

## Architecture

The GunDB implementation consists of these key components:

- **GunDB**: Core wrapper around GunDB with enhanced features and direct authentication
- **GunRxJS**: RxJS integration for reactive programming
- **Crypto**: Cryptographic utilities for secure data handling
- **Utils**: Helper functions for GunDB operations
- **Errors**: Error definitions and handling

### File Structure

```
shogun-core/src/gundb/
├── index.ts           - Exports all GunDB components
├── gun.ts             - Main GunDB wrapper implementation with direct auth
├── rxjs-integration.ts - RxJS integration for reactive data
├── crypto.ts          - Cryptographic utilities
├── utils.ts           - Helper functions
└── errors.ts          - Error definitions and handling
```

## Usage

The GunDB functionality can be accessed in two ways:

### 1. Through Shogun Core

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

The GunDB wrapper provides direct authentication through Gun's native auth system with enhanced error handling:

```typescript
// User registration - direct Gun.user().create()
const signupResult = await gundb.signUp("username", "password");

// User login - direct Gun.user().auth()
const loginResult = await gundb.login("username", "password");

// Check if user is logged in
const isLoggedIn = gundb.isLoggedIn();

// Logout - direct Gun.user().leave()
gundb.logout();

// Get current user
const currentUser = gundb.getCurrentUser();
```

### Data Operations

```typescript
// Store data
await gundb.put("users/john", { name: "John Doe" });

// Update data
await gundb.set("users/john/posts", { title: "Hello World" });

// Remove data
await gundb.remove("users/john/posts/old-post");

// Get data once
const user = await gundb.getUserData("users/john");
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
// Encrypt data
const encrypted = await gundb.encrypt({ sensitive: "data" }, "password");

// Decrypt data
const decrypted = await gundb.decrypt(encrypted, "password");

// Hash text
const hashed = await gundb.hashText("secret text");
```

### Account Recovery

```typescript
// Set password hint and security questions
await gundb.setPasswordHint(
  "username",
  "password",
  "Your hint here",
  ["Question 1", "Question 2"],
  ["Answer 1", "Answer 2"]
);

// Recover password using security questions
const recoveryResult = await gundb.forgotPassword(
  "username",
  ["Answer 1", "Answer 2"]
);
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
// Import utilities
import { utils } from "shogun-core/gundb";

// Extract node ID
const id = utils.getId(node);

// Extract public key
const pubKey = utils.getPub(id);

// Generate UUID
const uuid = utils.getUUID(gun);

// Convert Gun set to array
const items = utils.getSet(data, setId);
```

## Integration with Storage

Data can be securely saved and retrieved:

```typescript
// Save user-specific data
await gundb.saveUserData("profile", { name: "John", avatar: "url-to-image" });

// Retrieve user-specific data
const profile = await gundb.getUserData("profile");
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
  } else {
    console.log("Unknown error:", error);
  }
}
```

## Performance Considerations

- GunDB implements local caching to reduce network requests
- The RxJS integration uses `distinctUntilChanged` to prevent duplicate emissions
- Authentication tokens are cached for improved performance
- For large datasets, use the match function with filters instead of loading all data

## Implementation Notes

- Data is automatically scoped to application namespace
- Gun metadata is automatically removed from results
- Authentication state is preserved using browser storage
- Security considerations are baked into the implementation
- Reactive programming with RxJS makes building responsive UIs easier 