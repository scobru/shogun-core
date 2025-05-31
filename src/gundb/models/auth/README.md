# Authentication State Machine

## Overview

The authentication system in ShogunCore now uses a centralized state machine to manage all authentication states, eliminating redundancies and providing a single source of truth for authentication status.

**All authentication methods** (GunDB login/signup, Web3/MetaMask, and Nostr/Bitcoin wallet) now use the same state machine for consistent behavior.

## States

The state machine manages the following states:

- **`disconnected`**: User is disconnected and ready for authentication
- **`creating`**: User account creation in progress  
- **`pending`**: User authentication in progress
- **`authorized`**: User is authenticated and ready
- **`leaving`**: User logout in progress
- **`wallet_initializing`**: Wallet initialization in progress
- **`wallet_ready`**: Wallet is ready and available

## Events

The state machine responds to these events:

- **`create`**: Start user creation process
- **`authenticate`**: Start authentication process
- **`disconnect`**: Start logout process
- **`fail`**: Operation failed
- **`success`**: Operation succeeded
- **`wallet_init_start`**: Start wallet initialization
- **`wallet_init_success`**: Wallet initialization succeeded
- **`wallet_init_fail`**: Wallet initialization failed

## Usage

### Basic State Checking

```typescript
import AuthManager from "./auth";

// Check current state
const currentState = AuthManager.state.getCurrentState();
console.log(`Current state: ${currentState}`);

// Get human-readable description
const description = AuthManager.state.getStateDescription();
console.log(`State description: ${description}`);

// Check if busy
const isBusy = AuthManager.state.isBusy();
console.log(`Is busy: ${isBusy}`);
```

### Authentication Flow

```typescript
// Check if authentication can be started
if (AuthManager.state.canStartAuth()) {
  // Proceed with login/signup
  const result = await gundb.login(username, password);
} else {
  console.log("Cannot start auth:", AuthManager.state.getStateDescription());
}
```

### Plugin Authentication

All authentication plugins (Web3, Nostr) now respect the state machine:

```typescript
// Web3/MetaMask authentication
const web3Plugin = shogun.getPlugin("ethereum");
if (web3Plugin && AuthManager.state.canStartAuth()) {
  const result = await web3Plugin.login(ethereumAddress);
  // State machine prevents concurrent authentication
}

// Nostr/Bitcoin wallet authentication
const nostrPlugin = shogun.getPlugin("bitcoin");
if (nostrPlugin && AuthManager.state.canStartAuth()) {
  const result = await nostrPlugin.login(bitcoinAddress);
  // State machine prevents concurrent authentication
}
```

### State Subscription

```typescript
// Subscribe to state changes
const unsubscribe = AuthManager.state.subscribe((state) => {
  console.log(`State changed to: ${state}`);
  
  // React to specific states
  switch (state) {
    case 'authorized':
      console.log('User is now authenticated!');
      break;
    case 'disconnected':
      console.log('User logged out');
      break;
    case 'pending':
      console.log('Authentication in progress...');
      break;
  }
});

// Don't forget to unsubscribe when done
unsubscribe();
```

### Waiting for States

```typescript
// Wait for authentication to complete
const success = await AuthManager.state.waitForState('authorized', 10000);
if (success) {
  console.log('Authentication completed!');
} else {
  console.log('Authentication timed out');
}
```

## Available Methods

### State Machine Methods

- `getCurrentState()`: Get current state
- `getStateDescription()`: Get human-readable state description
- `isBusy()`: Check if in a busy state (creating, pending, leaving, wallet_initializing)
- `canStartAuth()`: Check if authentication can be started (disconnected state)
- `canLogout()`: Check if logout can be performed
- `isAuthenticated()`: Check if user is authenticated
- `isWalletReady()`: Check if wallet is ready
- `subscribe(callback)`: Subscribe to state changes
- `waitForState(state, timeout)`: Wait for a specific state

### GunDB Integration Methods

The `GunDB` class now provides these state-aware methods:

- `isAuthenticating()`: Check if authentication is in progress
- `getAuthState()`: Get current authentication state
- `getAuthStateDescription()`: Get state description
- `isAuthenticated()`: Check if authenticated
- `isWalletReady()`: Check if wallet is ready
- `canStartAuth()`: Check if auth can be started

## Refactoring Summary

### What Was Removed

1. **Redundant `_authenticating` flag** in `GunDB` class
2. **Manual state tracking** methods (`isAuthenticating()`, `_setAuthenticating()`)
3. **Inconsistent state checks** across different methods
4. **Plugin-specific authentication state management**

### What Was Improved

1. **Centralized state management** through the state machine
2. **Consistent state checking** using utility methods
3. **Better error messages** with state descriptions
4. **Proper state transitions** for all authentication operations
5. **Wallet state management** integration
6. **Unified plugin authentication** (Web3, Nostr, etc.)

### Benefits

- **Single source of truth** for authentication state
- **Consistent behavior** across all authentication methods
- **Better debugging** with descriptive state information
- **Reduced complexity** by eliminating redundant code
- **Improved reliability** through proper state management
- **Prevention of concurrent authentication** operations
- **Unified plugin architecture** for authentication

## Plugin Integration

### Web3/MetaMask Plugin

The Web3 plugin now uses the state machine to:
- Check if authentication is in progress before starting
- Provide consistent error messages
- Integrate with the centralized authentication flow

### Nostr/Bitcoin Wallet Plugin

The Nostr plugin now uses the state machine to:
- Check if authentication is in progress before starting
- Provide consistent error messages
- Integrate with the centralized authentication flow

### Adding New Authentication Plugins

When creating new authentication plugins, follow this pattern:

```typescript
async login(credentials: any): Promise<AuthResult> {
  // Check if authentication is already in progress
  if (AuthManager.state.isBusy()) {
    throw createError(
      ErrorType.AUTHENTICATION,
      "AUTH_IN_PROGRESS",
      `Authentication operation already in progress. ${AuthManager.state.getStateDescription()}`,
    );
  }

  // Your authentication logic here...
  
  // Use core.login() which handles the state machine
  const result = await core.login(username, password);
  
  return result;
}
```

## Example Usage

See `examples/state-machine-usage.ts` for a complete demonstration of the state machine functionality with all authentication methods.

## Migration Guide

If you were previously using:

```typescript
// OLD - Don't use
if (gundb.isAuthenticating()) {
  // This was using the redundant flag
}
```

Replace with:

```typescript
// NEW - Use this
if (AuthManager.state.isBusy()) {
  // This uses the centralized state machine
}

// Or use the GunDB wrapper
if (gundb.isAuthenticating()) {
  // This now delegates to the state machine
}
```

The public API remains the same, but now everything is backed by the state machine for consistency and reliability. 