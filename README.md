# Shogun Core 📦

[![npm](https://img.shields.io/badge/npm-v1.6.17-blue)](https://www.npmjs.com/package/shogun-core)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## Overview

Shogun Core is a comprehensive SDK for building decentralized applications (dApps) that simplifies authentication, wallet management, and decentralized data storage. It combines GunDB's peer-to-peer networking with modern authentication standards and blockchain integration to provide a secure, user-friendly foundation for Web3 applications.

## Features

- 🔐 **Multiple Authentication Methods**: Traditional username/password, WebAuthn (biometrics), Web3 (MetaMask), Nostr, and OAuth
- 🌐 **Decentralized Storage**: Built on GunDB for peer-to-peer data synchronization
- 🔌 **Plugin System**: Extensible architecture with built-in plugins for various authentication methods
- 📱 **Reactive Programming**: RxJS integration for real-time data streams
- 🛡️ **Security**: End-to-end encryption and secure key management
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 📡 **Event System**: Typed event system for monitoring authentication and data changes
- 🔑 **Cryptographic Wallets**: Automatic derivation of Bitcoin and Ethereum wallets from user keys
- ✅ **Type Consistency**: Unified return types across all authentication methods

## Recent Updates (v1.6.15)

### ✅ **Type System Fixes**

- **Unified Return Types**: All authentication methods now use consistent `AuthResult` and `SignUpResult` types
- **Enhanced SignUpResult**: Extended to support OAuth redirects and provider-specific data
- **Type Safety**: Fixed TypeScript inconsistencies across all plugins
- **API Standardization**: All plugins implement unified `login()` and `signUp()` interfaces

## Installation

```bash
npm install shogun-core
# or
yarn add shogun-core
```

## Quick Start

### Basic Setup

```typescript
import { ShogunCore } from "shogun-core";

// Define your list of Gun peers
const relays = [
  "wss://ruling-mastodon-improved.ngrok-free.app/gun",
  "https://gun-manhattan.herokuapp.com/gun",
  "https://peer.wallie.io/gun",
];

// Initialize Shogun Core with plugins
const shogun = new ShogunCore({
  peers: relays,
  scope: "my-awesome-app",
  authToken: "YOUR_GUN_SUPER_PEER_SECRET", // Optional, for private peers

  // Enable and configure Web3 (e.g., MetaMask) authentication
  web3: {
    enabled: true,
  },

  // Enable and configure WebAuthn (biometrics, security keys)
  webauthn: {
    enabled: true,
    rpName: "My Awesome App", // Name of your application
    rpId: window.location.hostname, // Relying party ID
  },

  // Enable and configure Nostr
  nostr: {
    enabled: true,
  },

  // Enable and configure OAuth providers
  oauth: {
    enabled: true,
    usePKCE: true, // Recommended for SPAs
    providers: {
      google: {
        clientId: "YOUR_GOOGLE_CLIENT_ID",
        clientSecret: "YOUR_GOOGLE_CLIENT_SECRET", // For server-side flow
        redirectUri: "http://localhost:3000/auth/callback",
        scope: ["openid", "email", "profile"],
      },
    },
  },
});

// Initialize the SDK
await shogun.initialize();

console.log("Shogun Core initialized!");
```

## Plugin Authentication APIs

Shogun Core provides a unified plugin system for different authentication methods. Each plugin implements standardized `login()` and `signUp()` methods that return consistent `AuthResult` and `SignUpResult` objects.

### Core Types - ✅ **FIXED & UNIFIED**

```typescript
// Authentication result interface - used by login methods
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string; // User's public key
  username?: string; // Username or identifier
  sessionToken?: string; // Session token if applicable
  authMethod?: AuthMethod; // Authentication method used
  sea?: {
    // GunDB SEA pair for session persistence
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // OAuth-specific properties
  redirectUrl?: string; // OAuth redirect URL
  pendingAuth?: boolean; // Indicates pending OAuth flow
  message?: string; // Status message
  provider?: string; // OAuth provider name
  isNewUser?: boolean; // True if this was a registration
  user?: {
    // OAuth user data
    userPub?: string;
    username?: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email?: string;
      name?: string;
      picture?: string;
      lastLogin: number;
    };
  };
}

// Sign up result interface - used by signUp methods ✅ ENHANCED
interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  error?: string;
  message?: string;
  wallet?: any;
  isNewUser?: boolean;
  authMethod?: AuthMethod; // ✅ ADDED
  sessionToken?: string; // ✅ ADDED
  sea?: SEAPair; // SEA pair for session persistence
  // OAuth flow support - ✅ ADDED
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  user?: OAuthUserInfo; // ✅ ADDED
}

// Supported authentication methods
type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "oauth"
  | "bitcoin"
  | "pair";
```

### 1. Traditional Authentication

Direct username/password authentication using ShogunCore methods:

```typescript
// Sign up a new user - Returns SignUpResult ✅
const signUpResult: SignUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
  console.log("Is new user:", signUpResult.isNewUser);
  console.log("Auth method:", signUpResult.authMethod);
}

// Login with username and password - Returns AuthResult ✅
const loginResult: AuthResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
  console.log("User public key:", loginResult.userPub);
}
```

### 2. Web3 Plugin API

Ethereum wallet authentication via MetaMask or other Web3 providers:

```typescript
const web3Plugin = shogun.getPlugin<Web3ConnectorPlugin>("web3");

if (web3Plugin && web3Plugin.isAvailable()) {
  // Connect to MetaMask
  const connectionResult = await web3Plugin.connectMetaMask();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login with Web3 wallet - Returns AuthResult ✅
    const loginResult: AuthResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log("Web3 login successful");
      console.log("User public key:", loginResult.userPub);
    }

    // Register new user with Web3 wallet - Returns SignUpResult ✅
    const signUpResult: SignUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log("Web3 registration successful");
      console.log("Is new user:", signUpResult.isNewUser);
    }
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface Web3ConnectorPluginInterface {
  // Authentication methods
  login(address: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Connection methods
  isAvailable(): boolean;
  connectMetaMask(): Promise<ConnectionResult>;
  getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
  getSigner(): Promise<ethers.Signer>;

  // Credential management
  generateCredentials(address: string): Promise<ISEAPair>;
  generatePassword(signature: string): Promise<string>;
  verifySignature(message: string, signature: string): Promise<string>;
}
```

### 3. WebAuthn Plugin API

Biometric and hardware key authentication:

```typescript
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // Register new user with WebAuthn - Returns SignUpResult ✅
  const signUpResult: SignUpResult = await webauthnPlugin.signUp("username");
  if (signUpResult.success) {
    console.log("WebAuthn registration successful");
    console.log("User public key:", signUpResult.userPub);
  }

  // Authenticate existing user - Returns AuthResult ✅
  const loginResult: AuthResult = await webauthnPlugin.login("username");
  if (loginResult.success) {
    console.log("WebAuthn authentication successful");
    console.log("Auth method:", loginResult.authMethod); // "webauthn"
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface WebauthnPluginInterface {
  // Authentication methods
  login(username: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(username: string): Promise<SignUpResult>; // ✅ FIXED

  // Capability checks
  isSupported(): boolean;

  // WebAuthn-specific methods
  register(username: string, displayName?: string): Promise<WebAuthnCredential>;
  authenticate(username?: string): Promise<WebAuthnCredential>;
  generateCredentials(
    username: string,
    pair?: ISEAPair | null,
    login?: boolean
  ): Promise<WebAuthnUniformCredentials>;
}
```

### 4. Nostr Plugin API

Bitcoin wallet and Nostr protocol authentication:

```typescript
const nostrPlugin = shogun.getPlugin<NostrConnectorPlugin>("nostr");

if (nostrPlugin && nostrPlugin.isAvailable()) {
  // Connect to Nostr wallet (Bitcoin extension)
  const connectionResult = await nostrPlugin.connectNostrWallet();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login with Nostr/Bitcoin wallet - Returns AuthResult ✅
    const loginResult: AuthResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log("Nostr login successful");
      console.log("Auth method:", loginResult.authMethod); // "nostr"
    }

    // Register with Nostr/Bitcoin wallet - Returns SignUpResult ✅
    const signUpResult: SignUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log("Nostr registration successful");
      console.log("Is new user:", signUpResult.isNewUser);
    }
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface NostrConnectorPluginInterface {
  // Authentication methods
  login(address: string): Promise<AuthResult>; // ✅ CORRECT
  signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Connection methods
  isAvailable(): boolean;
  connectBitcoinWallet(
    type?: "alby" | "nostr" | "manual"
  ): Promise<ConnectionResult>;
  connectNostrWallet(): Promise<ConnectionResult>;

  // Credential and signature management
  generateCredentials(
    address: string,
    signature: string,
    message: string
  ): Promise<NostrConnectorCredentials>;
  verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean>;
  generatePassword(signature: string): Promise<string>;
}
```

### 5. OAuth Plugin API

Social login with external providers (Google, GitHub, etc.):

```typescript
const oauthPlugin = shogun.getPlugin<OAuthPlugin>("oauth");

if (oauthPlugin && oauthPlugin.isSupported()) {
  // Get available providers
  const providers = oauthPlugin.getAvailableProviders(); // ["google", "github", ...]

  // Initiate signup with OAuth - Returns SignUpResult with redirect ✅
  const signUpResult: SignUpResult = await oauthPlugin.signUp("google");
  if (signUpResult.success && signUpResult.redirectUrl) {
    // Redirect user to OAuth provider
    window.location.href = signUpResult.redirectUrl;
  }

  // Handle OAuth callback (after redirect back from provider) - Returns AuthResult ✅
  const callbackResult: AuthResult = await oauthPlugin.handleOAuthCallback(
    "google",
    authCode, // From URL params
    state // From URL params
  );

  if (callbackResult.success) {
    console.log("OAuth authentication successful");
    if (callbackResult.user) {
      console.log("User email:", callbackResult.user.email);
      console.log("User name:", callbackResult.user.name);
    }
  }
}

// Plugin Interface - ✅ FIXED TYPES
interface OAuthPluginInterface {
  // Authentication methods
  login(provider: OAuthProvider): Promise<AuthResult>; // ✅ CORRECT
  signUp(provider: OAuthProvider): Promise<SignUpResult>; // ✅ FIXED

  // OAuth flow management
  isSupported(): boolean;
  getAvailableProviders(): OAuthProvider[];
  initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;
  completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string
  ): Promise<OAuthConnectionResult>;
  handleOAuthCallback(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult>;

  // Credential management
  generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider
  ): Promise<OAuthCredentials>;
}
```

### Browser Usage (via CDN)

You can also use Shogun Core directly in the browser by including it from a CDN. This is ideal for static sites or lightweight applications.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Shogun Core in Browser</title>
  </head>
  <body>
    <h1>My dApp</h1>
    <!-- Required dependencies for Shogun Core -->
    <script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>

    <!-- Shogun Core library -->
    <script src="https://cdn.jsdelivr.net/npm/shogun-core/dist/browser/shogun-core.js"></script>

    <script>
      // The script exposes a global `initShogun` function
      const shogun = initShogun({
        peers: ["https://gun-manhattan.herokuapp.com/gun"],
        scope: "my-browser-app",
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "My Browser dApp",
          rpId: window.location.hostname,
        },
      });

      console.log("Shogun Core initialized in browser!", shogun);

      async function connectWallet() {
        if (shogun.hasPlugin("web3")) {
          const web3Plugin = shogun.getPlugin("web3");
          try {
            const provider = await web3Plugin.getProvider();
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            await web3Plugin.login(address);
            console.log("Logged in with address:", address);
          } catch (error) {
            console.error("Web3 login failed:", error);
          }
        }
      }
    </script>
  </body>
</html>
```

## API Reference

### Core Methods

#### Authentication

- `login(username: string, password: string): Promise<AuthResult>` - Authenticate with username/password
- `signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>` - Create new user account
- `logout(): void` - Logout current user
- `isLoggedIn(): boolean` - Check if user is authenticated

#### Plugin Management

- `getPlugin<T>(name: string): T | undefined` - Get plugin by name
- `hasPlugin(name: string): boolean` - Check if plugin exists
- `register(plugin: ShogunPlugin): void` - Register custom plugin
- `unregister(pluginName: string): void` - Remove plugin

#### Event Handling

- `on<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this` - Subscribe to typed events
- `off<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this` - Unsubscribe from events
- `emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K]): boolean` - Emit custom events

### Configuration Options

```typescript
interface ShogunSDKConfig {
  peers?: string[]; // GunDB peer URLs
  scope?: string; // Application scope
  authToken?: string; // GunDB super peer secret
  appToken?: string; // Application token

  // Plugin configurations
  webauthn?: {
    enabled?: boolean;
    rpName?: string;
    rpId?: string;
  };

  web3?: {
    enabled?: boolean;
  };

  nostr?: {
    enabled?: boolean;
  };

  oauth?: {
    enabled?: boolean;
    usePKCE?: boolean;
    providers?: Record<string, any>;
  };

  // Timeouts
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
}
```

## Event System

Shogun Core provides a comprehensive typed event system for monitoring authentication and data changes:

```typescript
// Available events with their data types
interface ShogunEventMap {
  "auth:login": AuthEventData; // User logged in
  "auth:logout": void; // User logged out
  "auth:signup": AuthEventData; // New user registered
  "wallet:created": WalletEventData; // Wallet derived from user keys
  "gun:put": GunDataEventData; // Data written to GunDB
  "gun:get": GunDataEventData; // Data read from GunDB
  "gun:set": GunDataEventData; // Data updated in GunDB
  "gun:remove": GunDataEventData; // Data removed from GunDB
  "gun:peer:add": GunPeerEventData; // Peer added
  "gun:peer:remove": GunPeerEventData; // Peer removed
  "gun:peer:connect": GunPeerEventData; // Peer connected
  "gun:peer:disconnect": GunPeerEventData; // Peer disconnected
  "plugin:registered": { name: string; version?: string; category?: string }; // Plugin registered
  "plugin:unregistered": { name: string }; // Plugin unregistered
  debug: { action: string; [key: string]: any }; // Debug information
  error: ErrorEventData; // Error occurred
}

// Listen for authentication events with full type safety
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
  console.log("Authentication method:", data.method);
  if (data.provider) {
    console.log("OAuth provider:", data.provider);
  }
});

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
});

// Listen for wallet creation (Bitcoin and Ethereum wallets derived from user keys)
shogun.on("wallet:created", (data) => {
  console.log("Wallet created:", data.address);
});

// Listen for errors
shogun.on("error", (error) => {
  console.error("Shogun error:", error.message);
});
```

## Cryptographic Wallets

Shogun Core automatically derives Bitcoin and Ethereum wallets from user authentication keys:

```typescript
// After successful authentication, wallets are available
if (shogun.wallets) {
  console.log("Bitcoin wallet:", {
    address: shogun.wallets.secp256k1Bitcoin.address,
    publicKey: shogun.wallets.secp256k1Bitcoin.publicKey,
    // privateKey is available but should be handled securely
  });

  console.log("Ethereum wallet:", {
    address: shogun.wallets.secp256k1Ethereum.address,
    publicKey: shogun.wallets.secp256k1Ethereum.publicKey,
    // privateKey is available but should be handled securely
  });
}
```

## Error Handling

Shogun Core includes comprehensive error handling with typed errors:

```typescript
import { ShogunError, ErrorType } from "shogun-core";

try {
  await shogun.login("username", "password");
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.error("Invalid credentials");
        break;
      case ErrorType.NETWORK:
        console.error("Network connection failed");
        break;
      default:
        console.error("Unknown error:", error.message);
    }
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://shogun-core-docs.vercel.app/)
- 💬 [Telegram Community](t.me/shogun_eco)
- 🐛 [Issue Tracker](https://github.com/scobru/shogun-core/issues)

# SHOGUN CORE

Core library for Shogun Ecosystem

## Testing

This project includes a comprehensive test suite that covers:

### Unit Tests

- **Validation Utils** (`src/__tests__/utils/validation.test.ts`)

  - Username validation
  - Email validation
  - OAuth provider validation
  - Username generation from identity
  - Deterministic password generation

- **Error Handler** (`src/__tests__/utils/errorHandler.test.ts`)

  - Error creation and handling
  - Error statistics and logging
  - Retry logic
  - External logger integration

- **Event Emitter** (`src/__tests__/utils/eventEmitter.test.ts`)

  - Event registration and emission
  - Listener management
  - Error handling in listeners
  - Symbol events support

- **Storage** (`src/__tests__/storage/storage.test.ts`)
  - Memory and localStorage operations
  - Error handling
  - Test mode behavior
  - Data persistence

### Integration Tests

- **ShogunCore** (`src/__tests__/integration/shogunCore.test.ts`)
  - Plugin system validation
  - Authentication methods
  - Event system
  - Configuration handling
  - Error handling

### Browser Compatibility Tests

- **Compatibility** (`src/__tests__/browser/compatibility.test.ts`)
  - localStorage availability
  - Crypto API support
  - WebAuthn detection
  - Web3 provider detection
  - Event system compatibility
  - TextEncoder/TextDecoder support
  - Fetch API compatibility
  - URL API compatibility
  - Performance API compatibility
  - Console API compatibility

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Coverage

The test suite provides comprehensive coverage of:

- ✅ **Utility Functions** - 100% coverage
- ✅ **Error Handling** - 100% coverage
- ✅ **Event System** - 100% coverage
- ✅ **Storage Operations** - 100% coverage
- ✅ **Plugin System** - API validation
- ✅ **Browser Compatibility** - Cross-browser support
- ✅ **Configuration Validation** - Config handling

## Test Philosophy

These tests are designed to be **realistic and non-intrusive**:

- **No codebase modifications** - Tests work with existing code
- **Comprehensive coverage** - All public APIs tested
- **Error resilience** - Tests error handling and edge cases
- **Browser compatibility** - Cross-browser support validation
- **Performance aware** - Tests don't impact runtime performance

## Test Structure

```
src/__tests__/
├── setup.ts                    # Global test setup
├── utils/
│   ├── validation.test.ts      # Validation utility tests
│   ├── errorHandler.test.ts    # Error handling tests
│   └── eventEmitter.test.ts    # Event system tests
├── storage/
│   └── storage.test.ts         # Storage operation tests
├── integration/
│   └── shogunCore.test.ts      # Core integration tests
└── browser/
    └── compatibility.test.ts   # Browser compatibility tests
```

## Adding New Tests

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Test both success and failure cases
4. Mock external dependencies appropriately
5. Ensure tests are isolated and repeatable
