# WebAuthn Plugin for Shogun SDK

## Overview

The WebAuthn plugin for Shogun SDK provides passwordless authentication using the Web Authentication API. It enables biometric authentication (fingerprint, facial recognition) and security key authentication (USB keys, NFC devices) in web applications.

## Architecture

The WebAuthn implementation consists of these key components:

- **Webauthn**: Core implementation that can be used independently
- **WebauthnPlugin**: Integration wrapper for the Shogun Core plugin system
- **Types**: TypeScript definitions for WebAuthn-specific interfaces

### File Structure

```
shogun-core/src/plugins/webauthn/
├── index.ts            - Exports all plugin components
├── webauthnPlugin.ts   - Plugin registration and lifecycle
├── webauthn.ts         - Core WebAuthn functionality implementation
└── types.ts            - TypeScript type definitions
```

## Usage Options

The WebAuthn functionality can be used in two ways:

### 1. Through Shogun Core (Plugin System)

```typescript
import { ShogunCore } from "shogun-core";

// Enable the plugin through configuration
const shogun = new ShogunCore({
  webauthn: {
    enabled: true
  },
  // Other config options...
});

// Get the plugin
const webauthnAuth = shogun.getAuthenticationMethod("webauthn");

// Use the plugin
const result = await webauthnAuth.login(username);
```

### 2. Directly Using Webauthn

The `Webauthn` class can be used independently without Shogun Core:

```typescript
import { Webauthn } from "shogun-core/plugins/webauthn";

// Create an instance with optional configuration
const webauthn = new Webauthn({
  rpName: "My Application",
  rpID: window.location.hostname,
  userVerification: "preferred"
});

// Register a new credential
const registrationResult = await webauthn.registerCredential({
  username: "user123",
  displayName: "John Doe"
});

// Authenticate with the credential
const authResult = await webauthn.authenticate("user123");
```

## Authentication Flow

### Registration Process

1. Application requests credential creation for a user
2. Browser prompts user to verify identity (biometric or security key)
3. Browser creates a new credential and returns attestation
4. Server stores the credential for future authentication

### Authentication Process

1. Application requests authentication for a user
2. Server sends challenge to the browser
3. Browser prompts user to verify identity
4. Browser generates assertion signature
5. Server verifies the signature against stored credentials

## Core Features

### Credential Registration

```typescript
// Via plugin
const plugin = shogun.getPlugin("webauthn");
const registrationResult = await plugin.register({
  username: "user123",
  displayName: "John Doe"
});

// Direct usage
const webauthn = new Webauthn();
const registrationResult = await webauthn.registerCredential({
  username: "user123",
  displayName: "John Doe"
});
```

### Authentication

```typescript
// Via plugin
const plugin = shogun.getPlugin("webauthn");
const authResult = await plugin.login("user123");

// Direct usage
const webauthn = new Webauthn();
const authResult = await webauthn.authenticate("user123");
```

### Credential Management

```typescript
// Get stored credentials
const credentials = await webauthn.getCredentials("user123");

// Delete a credential
await webauthn.removeCredential("credentialId");
```

## Environment Detection

The plugin automatically detects if WebAuthn is supported in the current environment:

```typescript
// Check if WebAuthn is available
const isSupported = webauthn.isWebAuthnSupported();

// Check if user verification is available
const hasUserVerification = webauthn.hasUserVerification();
```

## Integration with Shogun Core

When used with Shogun Core, the plugin integrates with GunDB for credential storage:

```typescript
// The plugin automatically stores credentials in GunDB
const result = await webauthnAuth.register({
  username: "user123",
  displayName: "John Doe"
});

// And retrieves them during authentication
const authResult = await webauthnAuth.login("user123");
```

## Error Handling

The plugin includes comprehensive error handling for WebAuthn operations:

```typescript
try {
  const result = await webauthn.registerCredential({
    username: "user123",
    displayName: "John Doe"
  });
} catch (error) {
  if (error.name === "NotSupportedError") {
    console.error("WebAuthn is not supported in this browser");
  } else if (error.name === "NotAllowedError") {
    console.error("User declined the WebAuthn operation");
  } else {
    console.error("WebAuthn error:", error);
  }
}
```

## Advanced Configuration

The plugin can be customized with various options:

```typescript
const webauthn = new Webauthn({
  rpName: "My Application",         // Relying Party name
  rpID: window.location.hostname,   // Relying Party ID (domain)
  userVerification: "preferred",    // User verification requirement
  authenticatorAttachment: "cross-platform", // Security key type
  attestation: "direct",            // Attestation conveyance
  timeout: 60000,                   // Operation timeout in milliseconds
});
```

## Implementation Notes

- The plugin implements the W3C Web Authentication API
- Authentication is passwordless and phishing-resistant
- Credentials are bound to the origin and cannot be used on different websites
- User verification can be configured based on security requirements 