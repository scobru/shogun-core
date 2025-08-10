# Shogun Core - LLM Documentation

## Overview

Shogun Core is a TypeScript SDK for building decentralized applications (dApps) with multiple authentication methods and peer-to-peer data storage using GunDB.

## Recent Improvements

### ✅ **Type Consistency Fixes (v1.7.0)**

- **Unified Return Types**: All authentication methods now use consistent `AuthResult` and `SignUpResult` types
- **Type Safety**: Fixed TypeScript inconsistencies across all plugins
- **API Standardization**: All plugins implement unified `login()` and `signUp()` interfaces
- **Enhanced SignUpResult**: Extended to support OAuth redirects and provider-specific data

### Enhanced Event System (v1.6.0+)

- **Typed Event System**: Complete TypeScript event system with `ShogunEventMap` for type-safe event handling
- **Plugin Events**: Comprehensive event coverage for plugin registration, authentication, and data operations
- **Wallet Events**: Automatic wallet derivation events for Bitcoin and Ethereum wallets

### OAuth Enhancements (v1.5.19+)

- **Google Account Selection**: Fixed OAuth popup to force account selection with `prompt=select_account`
- **Complete User Data**: OAuth now returns full user profile including email, name, and picture
- **Enhanced Security**: Added `access_type=offline` for refresh token support
- **Type Safety**: Extended `AuthResult` interface to include OAuth user data
- **Deterministic Signatures**: Fixed Nostr signature generation for consistent authentication

## Core Features

- Multiple authentication: username/password, WebAuthn, Web3 (MetaMask), Nostr, OAuth
- Decentralized storage via GunDB
- Plugin-based architecture with unified APIs
- RxJS reactive programming
- End-to-end encryption
- Full TypeScript support with typed events
- PKCE OAuth flow for enhanced security
- Hardware key authentication (WebAuthn)
- Web3 wallet integration
- Nostr protocol support
- Automatic cryptographic wallet derivation

## Installation

```bash
npm install shogun-core
```

## Basic Usage

### Initialization

```typescript
import { ShogunCore } from "shogun-core";

const shogun = new ShogunCore({
  peers: [
    "wss://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ],
  scope: "my-app",
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: "My App",
    rpId: window.location.hostname,
  },
  nostr: { enabled: true },
  oauth: {
    enabled: true,
    usePKCE: true, // Mandatory for security
    allowUnsafeClientSecret: true, // Required for Google OAuth
    providers: {
      google: {
        clientId: "YOUR_CLIENT_ID",
        clientSecret: "YOUR_CLIENT_SECRET", // Required for Google even with PKCE
        redirectUri: "http://localhost:3000/auth/callback",
        scope: ["openid", "email", "profile"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        usePKCE: true, // Force PKCE for Google
      },
    },
  },
  plugins: {
    autoRegister: [], // Array of custom plugins to auto-register
  },
  timeouts: {
    login: 30000, // 30 seconds
    signup: 30000, // 30 seconds
    operation: 60000, // 60 seconds
  },
});

await shogun.initialize();
```

## Core API Reference

### ShogunCore (index.ts) - Main Entry Point

```typescript
class ShogunCore implements IShogunCore {
  // Core properties
  public db: GunInstance;
  public storage: ShogunStorage;
  public provider?: ethers.Provider;
  public config: ShogunSDKConfig;
  public rx: GunRxJS;
  public wallets?: Wallets;

  // Constructor & Initialization
  constructor(config: ShogunSDKConfig);
  async initialize(): Promise<void>;

  // Authentication Methods - ✅ FIXED TYPES
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null
  ): Promise<AuthResult>;
  async signUp(
    username: string,
    password: string,
    email?: string,
    pair?: ISEAPair | null
  ): Promise<SignUpResult>;
  async loginWithPair(pair: ISEAPair): Promise<AuthResult>;
  logout(): void;
  isLoggedIn(): boolean;

  // Plugin Management
  getPlugin<T>(name: string): T | undefined;
  hasPlugin(name: string): boolean;
  register(plugin: ShogunPlugin): void;
  unregister(pluginName: string): void;
  getAuthenticationMethod(type: AuthMethod): any;

  // Event System - Type Safe
  on<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this;
  off<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this;
  emit<K extends keyof ShogunEventMap>(
    eventName: K,
    data?: ShogunEventMap[K]
  ): boolean;

  // Utility Methods
  exportPair(): string;
  updateUserAlias(newAlias: string): Promise<boolean>;
  saveCredentials(credentials: any): Promise<void>;
  clearAllStorageData(): void;
  getRecentErrors(count?: number): ShogunError[];
}
```

### GunInstance (gun-Instance.ts) - Database Layer

```typescript
class GunInstance {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null;
  public crypto: typeof crypto;
  public sea: typeof SEA;

  // Constructor
  constructor(gun: IGunInstance<any>, appScope?: string);
  async initialize(appScope?: string): Promise<void>;

  // Authentication - ✅ FIXED TYPES
  async login(
    username: string,
    password: string,
    pair?: ISEAPair
  ): Promise<AuthResult>;
  async signUp(
    username: string,
    password: string,
    pair?: ISEAPair
  ): Promise<SignUpResult>;
  logout(): void;
  isLoggedIn(): boolean;

  // User Management
  async checkUsernameExists(username: string): Promise<any>;
  async updateUserAlias(
    newAlias: string
  ): Promise<{ success: boolean; error?: string }>;
  restoreSession(): { success: boolean; userPub?: string; error?: string };

  // Data Operations
  async getData(path: string): Promise<GunData>;
  async put(path: string, data: GunData): Promise<GunOperationResult>;
  async set(path: string, data: GunData): Promise<GunOperationResult>;
  async remove(path: string): Promise<GunOperationResult>;
  async putUserData(path: string, data: any): Promise<void>;
  async getUserData(path: string): Promise<any>;

  // Cryptographic Operations
  async hashText(text: string): Promise<string>;
  async encrypt(data: any, key: string): Promise<string>;
  async decrypt(encryptedData: string, key: string): Promise<any>;
  async derive(
    password: string | number,
    extra?: string[],
    options?: DeriveOptions
  ): Promise<any>;

  // Frozen Space (Immutable Data)
  async createFrozenSpace(
    data: any,
    options?: any
  ): Promise<{ hash: string; fullPath: string; data: any }>;
  async getFrozenSpace(
    hash: string,
    namespace?: string,
    path?: string
  ): Promise<any>;
  async verifyFrozenSpace(
    data: any,
    hash: string,
    namespace?: string,
    path?: string
  ): Promise<any>;

  // Peer Management
  addPeer(peer: string): void;
  removePeer(peer: string): void;
  getCurrentPeers(): string[];
  getAllConfiguredPeers(): string[];
  resetPeers(newPeers?: string[]): void;

  // Event System
  on(event: string | symbol, listener: EventListener): void;
  off(event: string | symbol, listener: EventListener): void;
  emit(event: string | symbol, data?: EventData): boolean;
}
```

## Plugin Authentication APIs

### Core Types and Interfaces - ✅ UNIFIED

```typescript
// Authentication result interface - returned by all plugin methods
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string; // User's public key in GunDB
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

// ✅ ENHANCED - Now includes all OAuth fields
interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  error?: string;
  message?: string;
  wallet?: any;
  isNewUser?: boolean;
  authMethod?: AuthMethod;
  sessionToken?: string;
  sea?: { pub: string; priv: string; epub: string; epriv: string };
  // OAuth flow support - ✅ ADDED
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  user?: OAuthUserInfo;
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

### 1. WebAuthn Plugin API - ✅ FIXED TYPES

```typescript
class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
  name = "webauthn";
  version = "1.0.0";

  // Core Authentication - ✅ CORRECT RETURN TYPES
  async login(username: string): Promise<AuthResult>;
  async signUp(username: string): Promise<SignUpResult>; // ✅ FIXED

  // Capability Checks
  isSupported(): boolean;

  // WebAuthn-specific Methods
  async generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials,
    isLogin?: boolean
  ): Promise<WebAuthnUniformCredentials>;
  async createAccount(
    username: string,
    credentials: WebAuthnCredentials | null,
    isNewDevice?: boolean
  ): Promise<CredentialResult>;
  async authenticateUser(
    username: string,
    salt: string | null,
    options?: any
  ): Promise<CredentialResult>;
  abortAuthentication(): void;
  async removeDevice(
    username: string,
    credentialId: string,
    credentials: WebAuthnCredentials
  ): Promise<{ success: boolean; updatedCredentials?: WebAuthnCredentials }>;

  // Oneshot Signing API
  async createSigningCredential(
    username: string
  ): Promise<WebAuthnSigningCredential>;
  createAuthenticator(
    credentialId: string
  ): (data: any) => Promise<AuthenticatorAssertionResponse>;
  async createDerivedKeyPair(
    credentialId: string,
    username: string,
    extra?: string[]
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }>;
  async signWithDerivedKeys(
    data: any,
    credentialId: string,
    username: string,
    extra?: string[]
  ): Promise<string>;
  async createGunUserFromSigningCredential(
    credentialId: string,
    username: string
  ): Promise<{ success: boolean; userPub?: string; error?: string }>;

  // Credential Management
  getSigningCredential(
    credentialId: string
  ): WebAuthnSigningCredential | undefined;
  listSigningCredentials(): WebAuthnSigningCredential[];
  removeSigningCredential(credentialId: string): boolean;
  getGunUserPubFromSigningCredential(credentialId: string): string | undefined;
  getHashedCredentialId(credentialId: string): string | undefined;

  // Consistency Verification
  async verifyConsistency(
    credentialId: string,
    username: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(username: string): Promise<{
    credential: WebAuthnSigningCredential;
    authenticator: Function;
    gunUser: any;
    pub: string;
    hashedCredentialId: string;
  }>;
}
```

### 2. Web3 Plugin API - ✅ FIXED TYPES

```typescript
class Web3ConnectorPlugin
  extends BasePlugin
  implements Web3ConectorPluginInterface
{
  name = "web3";
  version = "1.0.0";

  // Core Authentication - ✅ CORRECT RETURN TYPES
  async login(address: string): Promise<AuthResult>;
  async signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Connection and Availability
  isAvailable(): boolean;
  async connectMetaMask(): Promise<ConnectionResult>;
  async getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
  async getSigner(): Promise<ethers.Signer>;

  // Credential Management
  async generateCredentials(address: string): Promise<ISEAPair>;
  async generatePassword(signature: string): Promise<string>;
  async verifySignature(message: string, signature: string): Promise<string>;
  setCustomProvider(rpcUrl: string, privateKey: string): void;
  cleanup(): void;

  // Oneshot Signing API
  async createSigningCredential(
    address: string
  ): Promise<Web3SigningCredential>;
  createAuthenticator(address: string): (data: any) => Promise<string>;
  async createDerivedKeyPair(
    address: string,
    extra?: string[]
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }>;
  async signWithDerivedKeys(
    data: any,
    address: string,
    extra?: string[]
  ): Promise<string>;
  async createGunUserFromSigningCredential(
    address: string
  ): Promise<{ success: boolean; userPub?: string; error?: string }>;

  // Credential Management
  getSigningCredential(address: string): Web3SigningCredential | undefined;
  listSigningCredentials(): Web3SigningCredential[];
  removeSigningCredential(address: string): boolean;
  getGunUserPubFromSigningCredential(address: string): string | undefined;
  getPassword(address: string): string | undefined;

  // Consistency Verification
  async verifyConsistency(
    address: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(address: string): Promise<{
    credential: Web3SigningCredential;
    authenticator: Function;
    gunUser: any;
    username: string;
    password: string;
  }>;
}
```

### 3. Nostr Plugin API - ✅ FIXED TYPES

```typescript
class NostrConnectorPlugin
  extends BasePlugin
  implements NostrConnectorPluginInterface
{
  name = "nostr";
  version = "1.0.0";

  // Core Authentication - ✅ CORRECT RETURN TYPES
  async login(address: string): Promise<AuthResult>;
  async signUp(address: string): Promise<SignUpResult>; // ✅ FIXED

  // Bitcoin Wallet Specific
  async loginWithBitcoinWallet(address: string): Promise<AuthResult>;
  async signUpWithBitcoinWallet(address: string): Promise<AuthResult>;

  // Connection Methods
  isAvailable(): boolean;
  isAlbyAvailable(): boolean;
  isNostrExtensionAvailable(): boolean;
  async connectNostrWallet(): Promise<ConnectionResult>;
  async connectBitcoinWallet(
    type?: "alby" | "nostr" | "manual"
  ): Promise<ConnectionResult>;

  // Credential and Signature Management
  async generateCredentials(
    address: string,
    signature: string,
    message: string
  ): Promise<NostrConnectorCredentials>;
  async verifySignature(
    message: string,
    signature: string,
    address: string
  ): Promise<boolean>;
  async generatePassword(signature: string): Promise<string>;
  clearSignatureCache(address?: string): void;
  cleanup(): void;

  // Oneshot Signing API
  async createSigningCredential(
    address: string
  ): Promise<NostrSigningCredential>;
  createAuthenticator(address: string): (data: any) => Promise<string>;
  async createDerivedKeyPair(
    address: string,
    extra?: string[]
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }>;
  async signWithDerivedKeys(
    data: any,
    address: string,
    extra?: string[]
  ): Promise<string>;
  async createGunUserFromSigningCredential(
    address: string
  ): Promise<{ success: boolean; userPub?: string; error?: string }>;

  // Credential Management
  getSigningCredential(address: string): NostrSigningCredential | undefined;
  listSigningCredentials(): NostrSigningCredential[];
  removeSigningCredential(address: string): boolean;
  getGunUserPubFromSigningCredential(address: string): string | undefined;
  getPassword(address: string): string | undefined;

  // Consistency Verification
  async verifyConsistency(
    address: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(address: string): Promise<{
    credential: NostrSigningCredential;
    authenticator: Function;
    gunUser: any;
    username: string;
    password: string;
  }>;
}
```

### 4. OAuth Plugin API - ✅ FIXED TYPES

```typescript
class OAuthPlugin extends BasePlugin implements OAuthPluginInterface {
  name = "oauth";
  version = "1.0.0";

  // Core Authentication - ✅ CORRECT RETURN TYPES
  async login(provider: OAuthProvider): Promise<AuthResult>;
  async signUp(provider: OAuthProvider): Promise<SignUpResult>; // ✅ FIXED

  // OAuth Flow Management
  isSupported(): boolean;
  getAvailableProviders(): OAuthProvider[];
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;
  async completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string
  ): Promise<OAuthConnectionResult>;
  async handleOAuthCallback(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult>; // ✅ CORRECT - Callback completes auth

  // Credential and User Management
  async generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider
  ): Promise<OAuthCredentials>;
  getCachedUserInfo(
    userId: string,
    provider: OAuthProvider
  ): OAuthUserInfo | null;
  clearUserCache(userId?: string, provider?: OAuthProvider): void;

  // Configuration
  configure(config: Partial<OAuthConfig>): void;

  // Legacy Methods (Deprecated)
  async handleSimpleOAuth(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult>;
}
```

## Usage Examples with Fixed Types

### Traditional Authentication

```typescript
// Sign up - Returns SignUpResult ✅
const signUpResult: SignUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
  console.log("Is new user:", signUpResult.isNewUser);
}

// Login - Returns AuthResult ✅
const loginResult: AuthResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
  console.log("Auth method:", loginResult.authMethod);
}
```

### WebAuthn Authentication

```typescript
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // Register - Returns SignUpResult ✅
  const signUpResult: SignUpResult = await webauthnPlugin.signUp("username");
  if (signUpResult.success) {
    console.log("WebAuthn registration successful");
    console.log("User pub:", signUpResult.userPub);
  }

  // Login - Returns AuthResult ✅
  const loginResult: AuthResult = await webauthnPlugin.login("username");
  if (loginResult.success) {
    console.log("WebAuthn authentication successful");
  }
}
```

### Web3 Authentication

```typescript
const web3Plugin = shogun.getPlugin<Web3ConnectorPlugin>("web3");

if (web3Plugin && web3Plugin.isAvailable()) {
  const connectionResult = await web3Plugin.connectMetaMask();

  if (connectionResult.success) {
    const address = connectionResult.address!;

    // Login - Returns AuthResult ✅
    const loginResult: AuthResult = await web3Plugin.login(address);

    // Register - Returns SignUpResult ✅
    const signUpResult: SignUpResult = await web3Plugin.signUp(address);
  }
}
```

### OAuth Authentication

```typescript
const oauthPlugin = shogun.getPlugin<OAuthPlugin>("oauth");

if (oauthPlugin && oauthPlugin.isSupported()) {
  // Initiate signup - Returns SignUpResult with redirectUrl ✅
  const signUpResult: SignUpResult = await oauthPlugin.signUp("google");
  if (signUpResult.success && signUpResult.redirectUrl) {
    window.location.href = signUpResult.redirectUrl; // Redirect to Google
  }

  // Handle callback - Returns AuthResult ✅
  const callbackResult: AuthResult = await oauthPlugin.handleOAuthCallback(
    "google",
    authCode,
    state
  );

  if (callbackResult.success && callbackResult.user) {
    console.log("OAuth user:", callbackResult.user.email);
  }
}
```

## Frontend Integration

### React Hook for OAuth

```typescript
import { useCallback } from "react";

export const useOAuth = (protocol) => {
  const loginWithOAuth = useCallback(
    async (provider = "google") => {
      if (!protocol) {
        throw new Error("Protocol not available");
      }

      try {
        // Returns AuthResult ✅
        const result: AuthResult = await protocol.loginWithOAuth(provider);

        if (result.success && result.redirectUrl) {
          // The protocol handles the redirect
          console.log("OAuth login initiated, redirecting...");
          return result;
        } else if (result.success) {
          // Direct login completed
          console.log("OAuth login completed directly");
          return result;
        } else {
          throw new Error(result.error || "OAuth login failed");
        }
      } catch (error) {
        console.error("OAuth login error:", error);
        throw error;
      }
    },
    [protocol]
  );

  const registerWithOAuth = useCallback(
    async (provider = "google") => {
      if (!protocol) {
        throw new Error("Protocol not available");
      }

      try {
        // Returns SignUpResult ✅
        const result: SignUpResult = await protocol.registerWithOAuth(provider);

        if (result.success && result.redirectUrl) {
          // The protocol handles the redirect
          console.log("OAuth registration initiated, redirecting...");
          return result;
        } else if (result.success) {
          // Direct registration completed
          console.log("OAuth registration completed directly");
          return result;
        } else {
          throw new Error(result.error || "OAuth registration failed");
        }
      } catch (error) {
        console.error("OAuth registration error:", error);
        throw error;
      }
    },
    [protocol]
  );

  return {
    loginWithOAuth,
    registerWithOAuth,
  };
};
```

### Typed Event Handling

```typescript
// Type-safe event handling with full IntelliSense support
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
  console.log("Method:", data.method);
});

// Nota: in v1.7.0 l'evento `wallet:created` non è emesso dal core

// Listen for GunDB operations
shogun.on("gun:put", (data) => {
  console.log("Data written:", data.path, data.success);
});

// Listen for peer connections
shogun.on("gun:peer:connect", (data) => {
  console.log("Peer connected:", data.peer);
});

// Error handling
shogun.on("error", (error) => {
  console.error("Shogun error:", error.message, error.action);
});
```

### Cryptographic Wallets

Shogun Core automatically derives Bitcoin and Ethereum wallets from user authentication:

```typescript
// After successful authentication, wallets are automatically available
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

// Nota: in v1.7.0 l'evento `wallet:created` non è emesso dal core
```

## OAuth Security Features

- **PKCE (Proof Key for Code Exchange)**: Mandatory for all OAuth providers
- **Account Selection**: Google OAuth forces account selection with `prompt=select_account`
- **Refresh Token Support**: Google OAuth includes `access_type=offline` for refresh tokens
- **State Parameter Validation**: CSRF protection with state parameter validation
- **Secure Redirect URIs**: Validates redirect URIs to prevent authorization code interception

## Error Handling

```typescript
import { ShogunError, ErrorType } from "shogun-core";

try {
  const result: AuthResult = await shogun.login("username", "password");
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.error("Invalid credentials");
        break;
      case ErrorType.NETWORK:
        console.error("Network connection failed");
        break;
      case ErrorType.WEBAUTHN:
        console.error("WebAuthn error");
        break;
      case ErrorType.PLUGIN:
        console.error("Plugin error");
        break;
      default:
        console.error("Unknown error:", error.message);
    }
  }
}
```

## Plugin Development

### Creating Custom Plugins

```typescript
import { BasePlugin } from "shogun-core";

export class CustomAuthPlugin extends BasePlugin {
  name = "custom-auth";
  version = "1.0.0";
  description = "Custom authentication method";

  initialize(core: ShogunCore): void {
    super.initialize(core);
    // Plugin initialization logic
  }

  // ✅ MUST RETURN AuthResult
  async login(identifier: string): Promise<AuthResult> {
    const core = this.assertInitialized();

    // Custom authentication logic
    // Generate credentials, verify identity, etc.

    const result = await core.login(username, "", keypair);

    if (result.success) {
      core.emit("auth:login", {
        userPub: result.userPub,
        username: identifier,
        method: "custom",
      });
    }

    return result;
  }

  // ✅ MUST RETURN SignUpResult
  async signUp(identifier: string): Promise<SignUpResult> {
    // Custom registration logic
    const core = this.assertInitialized();

    // Custom signup logic
    const result = await core.signUp(username, "", "", keypair);

    return result;
  }

  destroy(): void {
    // Cleanup logic
    super.destroy();
  }
}
```

## Best Practices

1. **Always check plugin availability** before using plugin methods
2. **Handle errors gracefully** with proper error types
3. **Use typed events** for better development experience
4. **Implement proper cleanup** in plugin destroy methods
5. **Follow security best practices** for OAuth and Web3 integrations
6. **Use PKCE for OAuth** in browser environments
7. **Validate user input** before passing to plugin methods
8. **Monitor wallet events** for automatic wallet derivation
9. **✅ NEW: Always use correct return types** - `AuthResult` for login, `SignUpResult` for signup
10. **✅ NEW: Check type consistency** when implementing custom plugins
