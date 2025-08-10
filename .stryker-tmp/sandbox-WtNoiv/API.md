# Shogun Core API Reference

## Overview

Comprehensive API documentation for Shogun Core v1.7.0 with unified type system and consistent authentication interfaces.

## Core Components

### ShogunCore (index.ts)

Main entry point and orchestrator for all SDK functionality.

```typescript
class ShogunCore implements IShogunCore {
  // Core Properties
  public db: GunInstance;
  public storage: ShogunStorage;
  public provider?: ethers.Provider;
  public config: ShogunSDKConfig;
  public rx: GunRxJS;
  public wallets?: Wallets;

  // Construction & Lifecycle
  constructor(config: ShogunSDKConfig);
  async initialize(): Promise<void>;

  // Authentication API - ✅ UNIFIED TYPES
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
  getIsLoggedIn(): boolean;

  // Plugin Management
  getPlugin<T>(name: string): T | undefined;
  hasPlugin(name: string): boolean;
  register(plugin: ShogunPlugin): void;
  unregister(pluginName: string): void;
  getPluginsInfo(): Array<{
    name: string;
    version: string;
    category?: PluginCategory;
    description?: string;
  }>;
  getPluginCount(): number;
  getAuthenticationMethod(type: AuthMethod): any;

  // Event System (Type-Safe)
  on<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this;
  off<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this;
  once<K extends keyof ShogunEventMap>(eventName: K, listener: Function): this;
  emit<K extends keyof ShogunEventMap>(
    eventName: K,
    data?: ShogunEventMap[K]
  ): boolean;
  removeAllListeners(eventName?: string | symbol): this;

  // User Management
  exportPair(): string;
  updateUserAlias(newAlias: string): Promise<boolean>;
  saveCredentials(credentials: any): Promise<void>;
  clearAllStorageData(): void;
  setAuthMethod(method: AuthMethod): void;
  getAuthMethod(): AuthMethod | undefined;

  // Error Handling
  getRecentErrors(count?: number): ShogunError[];
}
```

### GunInstance (gun-Instance.ts)

Database layer providing GunDB integration with enhanced security and rate limiting.

```typescript
class GunInstance {
  // Core Properties
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;

  // Construction & Lifecycle
  constructor(gun: IGunInstance<any>, appScope?: string);
  async initialize(appScope?: string): Promise<void>;

  // Authentication API - ✅ FIXED TYPES
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null
  ): Promise<AuthResult>;
  async signUp(
    username: string,
    password: string,
    pair?: ISEAPair | null
  ): Promise<SignUpResult>;
  logout(): void;
  isLoggedIn(): boolean;
  restoreSession(): { success: boolean; userPub?: string; error?: string };

  // User Management
  async checkUsernameExists(username: string): Promise<any>;
  async updateUserAlias(
    newAlias: string
  ): Promise<{ success: boolean; error?: string }>;
  clearGunStorage(): void;

  // Data Operations
  get(path: string): any;
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
    extra?: string | string[],
    options?: DeriveOptions
  ): Promise<any>;
  async deriveP256(
    password: string | number,
    extra?: string | string[]
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }>;
  async deriveBitcoin(
    password: string | number,
    extra?: string | string[]
  ): Promise<{ pub: string; priv: string; address: string }>;
  async deriveEthereum(
    password: string | number,
    extra?: string | string[]
  ): Promise<{ pub: string; priv: string; address: string }>;

  // Frozen Space (Immutable Data Storage)
  async createFrozenSpace(
    data: any,
    options?: {
      namespace?: string;
      path?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
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
  ): Promise<{ verified: boolean; frozenData?: any; error?: string }>;

  // Peer Management
  addPeer(peer: string): void;
  removePeer(peer: string): void;
  getCurrentPeers(): string[];
  getAllConfiguredPeers(): string[];
  resetPeers(newPeers?: string[]): void;
  reconnectToPeer(peer: string): void;
  getPeerInfo(): { [peer: string]: { connected: boolean; status: string } };

  // Password Recovery
  async setPasswordHint(
    username: string,
    password: string,
    hint: string,
    securityQuestions: string[],
    securityAnswers: string[]
  ): Promise<{ success: boolean; error?: string }>;
  async forgotPassword(
    username: string,
    securityAnswers: string[]
  ): Promise<{ success: boolean; hint?: string; error?: string }>;

  // Utilities
  getGun(): IGunInstance<any>;
  getCurrentUser(): UserInfo | null;
  getUser(): GunUser;
  rx(): GunRxJS;
  async testConnectivity(): Promise<any>;

  // Event System
  on(event: string | symbol, listener: EventListener): void;
  off(event: string | symbol, listener: EventListener): void;
  once(event: string | symbol, listener: EventListener): void;
  emit(event: string | symbol, data?: EventData): boolean;
}
```

## Plugin APIs

### WebAuthn Plugin (webauthnPlugin.ts)

Biometric and hardware key authentication with oneshot signing capabilities.

```typescript
class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
  name = "webauthn";
  version = "1.0.0";
  description = "Provides WebAuthn authentication functionality for ShogunCore";

  // Core Authentication - ✅ CORRECT TYPES
  async login(username: string): Promise<AuthResult>;
  async signUp(username: string): Promise<SignUpResult>;

  // Capability Detection
  isSupported(): boolean;

  // WebAuthn Core Operations
  async generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials | null,
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

  // Consistency & Verification
  async verifyConsistency(
    credentialId: string,
    username: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(
    username: string
  ): Promise<{
    credential: WebAuthnSigningCredential;
    authenticator: Function;
    gunUser: any;
    pub: string;
    hashedCredentialId: string;
  }>;

  // Lifecycle
  initialize(core: ShogunCore): void;
  destroy(): void;
}
```

### Web3 Plugin (web3ConnectorPlugin.ts)

Ethereum wallet integration with MetaMask and other Web3 providers.

```typescript
class Web3ConnectorPlugin
  extends BasePlugin
  implements Web3ConectorPluginInterface
{
  name = "web3";
  version = "1.0.0";
  description = "Ethereum wallet authentication for ShogunCore";

  // Core Authentication - ✅ CORRECT TYPES
  async login(address: string): Promise<AuthResult>;
  async signUp(address: string): Promise<SignUpResult>;

  // Connection & Availability
  isAvailable(): boolean;
  async connectMetaMask(): Promise<ConnectionResult>;
  async getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
  async getSigner(): Promise<ethers.Signer>;
  setCustomProvider(rpcUrl: string, privateKey: string): void;

  // Credential Management
  async generateCredentials(address: string): Promise<ISEAPair>;
  async generatePassword(signature: string): Promise<string>;
  async verifySignature(message: string, signature: string): Promise<string>;
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

  // Consistency & Verification
  async verifyConsistency(
    address: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(
    address: string
  ): Promise<{
    credential: Web3SigningCredential;
    authenticator: Function;
    gunUser: any;
    username: string;
    password: string;
  }>;

  // Lifecycle
  initialize(core: ShogunCore): void;
  destroy(): void;
}
```

### Nostr Plugin (nostrConnectorPlugin.ts)

Bitcoin wallet and Nostr protocol authentication.

```typescript
class NostrConnectorPlugin
  extends BasePlugin
  implements NostrConnectorPluginInterface
{
  name = "nostr";
  version = "1.0.0";
  description = "Bitcoin wallet and Nostr authentication for ShogunCore";

  // Core Authentication - ✅ CORRECT TYPES
  async login(address: string): Promise<AuthResult>;
  async signUp(address: string): Promise<SignUpResult>;

  // Bitcoin Wallet Specific
  async loginWithBitcoinWallet(address: string): Promise<AuthResult>;
  async signUpWithBitcoinWallet(address: string): Promise<AuthResult>;

  // Connection & Availability
  isAvailable(): boolean;
  isAlbyAvailable(): boolean;
  isNostrExtensionAvailable(): boolean;
  async connectNostrWallet(): Promise<ConnectionResult>;
  async connectBitcoinWallet(
    type?: "alby" | "nostr" | "manual"
  ): Promise<ConnectionResult>;

  // Credential & Signature Management
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

  // Consistency & Verification
  async verifyConsistency(
    address: string,
    expectedUserPub?: string
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }>;
  async setupConsistentOneshotSigning(
    address: string
  ): Promise<{
    credential: NostrSigningCredential;
    authenticator: Function;
    gunUser: any;
    username: string;
    password: string;
  }>;

  // Lifecycle
  initialize(core: ShogunCore): void;
  destroy(): void;
}
```

### OAuth Plugin (oauthPlugin.ts)

Social login with external providers using secure PKCE flow.

```typescript
class OAuthPlugin extends BasePlugin implements OAuthPluginInterface {
  name = "oauth";
  version = "1.0.0";
  description = "OAuth authentication for ShogunCore with PKCE support";

  // Core Authentication - ✅ CORRECT TYPES
  async login(provider: OAuthProvider): Promise<AuthResult>;
  async signUp(provider: OAuthProvider): Promise<SignUpResult>;

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
  ): Promise<AuthResult>;

  // Credential & User Management
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

  // Legacy Support (Deprecated)
  async handleSimpleOAuth(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult>;

  // Lifecycle
  initialize(core: ShogunCore): void;
  destroy(): void;
}
```

## Type Definitions

### Core Authentication Types

```typescript
// Authentication result - used by login methods
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;
  username?: string;
  sessionToken?: string;
  authMethod?: AuthMethod;
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // OAuth-specific
  redirectUrl?: string;
  pendingAuth?: boolean;
  message?: string;
  provider?: string;
  isNewUser?: boolean;
  user?: {
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

// Sign up result - used by signUp methods ✅ ENHANCED
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
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // OAuth flow support
  redirectUrl?: string;
  pendingAuth?: boolean;
  provider?: string;
  user?: {
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

// Authentication methods
type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "oauth"
  | "bitcoin"
  | "pair";

// OAuth providers
type OAuthProvider = "google" | "github" | "discord" | "twitter" | "custom";
```

### Event System Types

```typescript
interface ShogunEventMap {
  "auth:login": AuthEventData;
  "auth:logout": void;
  "auth:signup": AuthEventData;
  // Nota: in v1.7.0 l'evento `wallet:created` non è emesso dal core
  "gun:put": GunDataEventData;
  "gun:get": GunDataEventData;
  "gun:set": GunDataEventData;
  "gun:remove": GunDataEventData;
  "gun:peer:add": GunPeerEventData;
  "gun:peer:remove": GunPeerEventData;
  "gun:peer:connect": GunPeerEventData;
  "gun:peer:disconnect": GunPeerEventData;
  "plugin:registered": { name: string; version?: string; category?: string };
  "plugin:unregistered": { name: string };
  debug: { action: string; [key: string]: any };
  error: ErrorEventData;
}

interface AuthEventData {
  userPub?: string;
  username?: string;
  method: AuthMethod;
  provider?: string;
}

interface WalletEventData {
  address: string;
  path?: string;
}
```

### Configuration Types

```typescript
interface ShogunSDKConfig {
  gunInstance?: IGunInstance<any>;
  authToken?: string;
  scope?: string;
  peers?: string[];
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
    allowUnsafeClientSecret?: boolean;
    providers?: Record<string, any>;
  };
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
  plugins?: {
    autoRegister?: ShogunPlugin[];
  };
}
```

## Usage Examples

### Basic Authentication

```typescript
// Traditional username/password
const signUpResult: SignUpResult = await shogun.signUp("username", "password");
const loginResult: AuthResult = await shogun.login("username", "password");

// WebAuthn biometric
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");
const signUpResult: SignUpResult = await webauthnPlugin.signUp("username");
const loginResult: AuthResult = await webauthnPlugin.login("username");

// Web3 wallet
const web3Plugin = shogun.getPlugin<Web3ConnectorPlugin>("web3");
await web3Plugin.connectMetaMask();
const signUpResult: SignUpResult = await web3Plugin.signUp(address);
const loginResult: AuthResult = await web3Plugin.login(address);

// OAuth social login
const oauthPlugin = shogun.getPlugin<OAuthPlugin>("oauth");
const signUpResult: SignUpResult = await oauthPlugin.signUp("google");
const callbackResult: AuthResult = await oauthPlugin.handleOAuthCallback(
  "google",
  code,
  state
);
```

### Event Handling

```typescript
// Type-safe event listeners
shogun.on("auth:login", (data: AuthEventData) => {
  console.log(`User ${data.username} logged in via ${data.method}`);
});

shogun.on("wallet:created", (data: WalletEventData) => {
  console.log(`Wallet created: ${data.address}`);
});

shogun.on("error", (error: ErrorEventData) => {
  console.error(`Error: ${error.message}`);
});
```

### Data Operations

```typescript
// GunDB data operations
await shogun.db.put("path/to/data", { value: "hello" });
const data = await shogun.db.get("path/to/data");

// User-specific data
await shogun.db.putUserData("preferences", { theme: "dark" });
const prefs = await shogun.db.getUserData("preferences");

// Immutable data (Frozen Space)
const { hash } = await shogun.db.createFrozenSpace({ important: "data" });
const frozenData = await shogun.db.getFrozenSpace(hash);
```

## Security Features

- **Rate Limiting**: Built-in protection against brute force attacks
- **Enhanced Password Validation**: Configurable strength requirements
- **Session Encryption**: Secure session data storage
- **PKCE OAuth Flow**: Protection against authorization code interception
- **Type Safety**: Compile-time validation of API usage
- **Event-driven Architecture**: Real-time monitoring and debugging

## Error Handling

```typescript
try {
  const result: AuthResult = await shogun.login("username", "password");
  if (!result.success) {
    console.error("Login failed:", result.error);
  }
} catch (error) {
  if (error instanceof ShogunError) {
    console.error(`${error.type}: ${error.message}`);
  }
}
```
