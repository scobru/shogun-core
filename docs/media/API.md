# Shogun Core API Reference

## Overview

Comprehensive API documentation for Shogun Core with unified type system, consistent authentication interfaces, and simplified API layer.

### Recent Improvements (v2.0.0)

- **⭐ NEW: Simple API Layer**: Easy-to-use wrapper for common operations with minimal complexity
- **⭐ NEW: User Space Management**: Complete CRUD operations for user-specific data storage
- **⭐ NEW: Quick Start Functions**: `quickStart()` and `QuickStart` class for rapid initialization
- **⭐ NEW: Improved Type System**: Reduced `any` usage with better TypeScript types
- **⭐ NEW: Configuration Presets**: Pre-built configurations for common use cases
- Type consistency across all plugins: unified `AuthResult` and `SignUpResult`
- Typed event system with `ShogunEventMap` for safer listeners
- OAuth hardening: PKCE support, improved Google flow, richer user profile
- Simplified public surface area to focus on core auth + GunDB storage
- Password recovery via security questions retained and documented

Note: This file is the single source of truth for Shogun Core docs. The former `LLM.md` has been merged here for consistency and maintenance.

## ⭐ **NEW: Simple API Components**

### SimpleGunAPI (simple-api.ts)

Easy-to-use wrapper for common GunDB operations with minimal complexity.

```typescript
class SimpleGunAPI {
  // Authentication
  async signup(username: string, password: string): Promise<{ userPub: string; username: string } | null>;
  async login(username: string, password: string): Promise<{ userPub: string; username: string } | null>;
  logout(): void;
  isLoggedIn(): boolean;

  // Basic data operations
  async get<T = unknown>(path: string): Promise<T | null>;
  async put<T = unknown>(path: string, data: T): Promise<boolean>;
  async set<T = unknown>(path: string, data: T): Promise<boolean>;
  async remove(path: string): Promise<boolean>;

  // Advanced chaining operations
  getNode(path: string): any; // Get Gun node for advanced operations like .map()
  node(path: string): any; // Get Gun node for direct chaining (recommended)
  chain(path: string): ChainingWrapper; // Get simplified chaining wrapper

  // User space operations
  async putUserData<T = unknown>(path: string, data: T): Promise<boolean>;
  async getUserData<T = unknown>(path: string): Promise<T | null>;
  async setUserData<T = unknown>(path: string, data: T): Promise<boolean>;
  async removeUserData(path: string): Promise<boolean>;
  async getAllUserData(): Promise<Record<string, unknown> | null>;

  // Array operations (GunDB doesn't handle arrays well, so we convert them to indexed objects)
  arrayToIndexedObject<T extends { id: string | number }>(arr: T[]): Record<string, T>;
  indexedObjectToArray<T>(indexedObj: Record<string, T> | null): T[];

  // User array operations
  async putUserArray<T extends { id: string | number }>(path: string, arr: T[]): Promise<boolean>;
  async getUserArray<T>(path: string): Promise<T[]>;
  async addToUserArray<T extends { id: string | number }>(path: string, item: T): Promise<boolean>;
  async removeFromUserArray<T extends { id: string | number }>(path: string, itemId: string | number): Promise<boolean>;
  async updateInUserArray<T extends { id: string | number }>(path: string, itemId: string | number, updates: Partial<T>): Promise<boolean>;

  // Global array operations
  async putArray<T extends { id: string | number }>(path: string, arr: T[]): Promise<boolean>;
  async getArray<T>(path: string): Promise<T[]>;
  async addToArray<T extends { id: string | number }>(path: string, item: T): Promise<boolean>;
  async removeFromArray<T extends { id: string | number }>(path: string, itemId: string | number): Promise<boolean>;
  async updateInArray<T extends { id: string | number }>(path: string, itemId: string | number, updates: Partial<T>): Promise<boolean>;

  // Profile management
  async updateProfile(profileData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    [key: string]: unknown;
  }): Promise<boolean>;
  async getProfile(): Promise<Record<string, unknown> | null>;

  // Settings and preferences
  async saveSettings(settings: Record<string, unknown>): Promise<boolean>;
  async getSettings(): Promise<Record<string, unknown> | null>;
  async savePreferences(preferences: Record<string, unknown>): Promise<boolean>;
  async getPreferences(): Promise<Record<string, unknown> | null>;

  // Collections
  async createCollection<T = unknown>(collectionName: string, items: Record<string, T>): Promise<boolean>;
  async addToCollection<T = unknown>(collectionName: string, itemId: string, item: T): Promise<boolean>;
  async getCollection(collectionName: string): Promise<Record<string, unknown> | null>;
  async removeFromCollection(collectionName: string, itemId: string): Promise<boolean>;

  // Path utilities
  getUserNode(path: string): any; // Get deconstructed path node for user space
  getGlobalNode(path: string): any; // Get deconstructed path node for global space

  // Utility methods
  getCurrentUser(): { pub: string; username?: string } | null;
  async userExists(alias: string): Promise<boolean>;
  async getUser(alias: string): Promise<{ userPub: string; username: string } | null>;
}
```

### QuickStart (simple-api.ts)

Rapid initialization helper for quick setup.

```typescript
class QuickStart {
  constructor(gunInstance: any, appScope: string = 'shogun');
  async init(): Promise<void>;
  get api(): SimpleGunAPI;
  get database(): DataBase;
}

// Global helper function
function quickStart(gunInstance: any, appScope?: string): QuickStart;
```

### AutoQuickStart (simple-api.ts)

Auto initialization helper that creates Gun instance automatically.

```typescript
class AutoQuickStart {
  constructor(config?: {
    peers?: string[];
    appScope?: string;
    [key: string]: any;
  });
  async init(): Promise<void>;
  get api(): SimpleGunAPI;
  get database(): DataBase;
  get gun(): any; // Get the Gun instance for advanced usage
}

// Global helper function
function autoQuickStart(config?: {
  peers?: string[];
  appScope?: string;
  [key: string]: any;
}): AutoQuickStart;
```

### Factory Functions

```typescript
// Create a simple API instance from existing DataBase
function createSimpleAPI(db: DataBase): SimpleGunAPI;
```

### Improved Types (improved-types.ts)

Better TypeScript types to reduce `any` usage.

```typescript
// Core types
export type GunInstance = IGunInstance<any>;
export type GunUserInstance = IGunUserInstance<any>;
export type GunChain = IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;

// Data types
export interface GunData {
  [key: string]: unknown;
}

export interface GunNodeData {
  [key: string]: unknown;
  _?: {
    "#": string;
    ">": Record<string, number>;
  };
}

// Operation results
export interface TypedGunOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  ack?: {
    err?: string;
    ok?: number;
    pub?: string;
  };
}

// Authentication results
export interface TypedAuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  error?: string;
  ack?: {
    err?: string;
    ok?: number;
    pub?: string;
    sea?: ISEAPair;
  };
  sea?: ISEAPair;
}
```

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

### DataBase (db.ts)

Database layer providing GunDB integration with core authentication and data operations.

```typescript
class DataBase {
  // Core Properties
  public gun: GunInstance;
  public user: GunUserInstance | null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: GunChain;

  // Construction & Lifecycle
  constructor(gun: GunInstance, appScope?: string);
  async initialize(appScope?: string): Promise<void>;

  // Authentication API - ✅ SIMPLIFIED & FIXED TYPES
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

  // Data Operations
  get(path: string): any;
  async getData(path: string): Promise<GunData>;
  async put(path: string, data: GunData): Promise<GunOperationResult>;
  async set(path: string, data: GunData): Promise<GunOperationResult>;
  async remove(path: string): Promise<GunOperationResult>;
  async putUserData(path: string, data: any): Promise<void>;
  async getUserData(path: string): Promise<any>;

  // Password Recovery System
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

  // Peer Management
  addPeer(peer: string): void;
  removePeer(peer: string): void;
  getCurrentPeers(): string[];
  getAllConfiguredPeers(): string[];
  resetPeers(newPeers?: string[]): void;

  // Utilities
  getGun(): GunInstance;
  getCurrentUser(): UserInfo | null;
  getUser(): GunUser;
  rx(): GunRxJS;

  // Event System
  on(event: string | symbol, listener: EventListener): void;
  off(event: string | symbol, listener: EventListener): void;
  once(event: string | symbol, listener: EventListener): void;
  emit(event: string | symbol, data?: EventData): boolean;
}
```

````

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

  // WebAuthn-specific methods
  register(username: string, displayName?: string): Promise<WebAuthnCredential>;
  authenticate(username?: string): Promise<WebAuthnCredential>;

  // Lifecycle
  initialize(core: ShogunCore): void;
  destroy(): void;
}
````

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
interface ShogunCoreConfig {
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

### ⭐ **NEW: Simple API Usage**

```typescript
import { quickStart, Gun } from "shogun-core";

// Quick setup
const gun = Gun({ peers: ['https://gun-manhattan.herokuapp.com/gun'] });
const shogun = quickStart(gun, 'my-app');
await shogun.init();

// Authentication
const user = await shogun.api.signup('alice', 'password123');
if (user) {
  console.log('User created:', user.username);
  
  // User space operations
  await shogun.api.updateProfile({ 
    name: 'Alice', 
    email: 'alice@example.com',
    bio: 'Developer' 
  });
  
  await shogun.api.saveSettings({ 
    theme: 'dark', 
    language: 'en',
    notifications: true 
  });
  
  // Create collections
  await shogun.api.createCollection('todos', {
    '1': { text: 'Learn Shogun Core', done: false },
    '2': { text: 'Build dApp', done: false }
  });
  
  // Add more items
  await shogun.api.addToCollection('todos', '3', { 
    text: 'Deploy to production', 
    done: false 
  });
  
  // Array operations (GunDB doesn't handle arrays well, so we convert them to indexed objects)
  const todos = [
    { id: '1', text: 'Learn Shogun Core', done: false },
    { id: '2', text: 'Build dApp', done: false }
  ];

  // Save array as indexed object
  await shogun.api.putUserArray('todos', todos);

  // Get array back
  const userTodos = await shogun.api.getUserArray('todos');

  // Add item to array
  await shogun.api.addToUserArray('todos', { id: '3', text: 'Deploy', done: false });

  // Update item in array
  await shogun.api.updateInUserArray('todos', '1', { done: true });

  // Remove item from array
  await shogun.api.removeFromUserArray('todos', '2');

  // Global array operations (not user-specific)
  await shogun.api.putArray('global/posts', [
    { id: '1', title: 'Hello World', author: 'alice' },
    { id: '2', title: 'GunDB is awesome', author: 'bob' }
  ]);

  const globalPosts = await shogun.api.getArray('global/posts');

  // Advanced chaining operations
  await shogun.api.node('users').get('alice').get('profile').put({ name: 'Alice' });
  const profile = await shogun.api.node('users').get('alice').get('profile').once();

  // Simplified chaining wrapper
  await shogun.api.chain('users').get('alice').get('settings').put({ theme: 'dark' });
  const settings = await shogun.api.chain('users').get('alice').get('settings').once();

  // Get Gun node for advanced operations like .map()
  const userNode = shogun.api.getNode('users');
  userNode.map((user, userId) => console.log(`User ${userId}:`, user));

  // Path utilities for advanced operations
  const userNode = shogun.api.getUserNode('profile'); // User space
  const globalNode = shogun.api.getGlobalNode('posts'); // Global space
  
  // Retrieve data
  const profile = await shogun.api.getProfile();
  const settings = await shogun.api.getSettings();
  const todos = await shogun.api.getCollection('todos');
  
  console.log('Profile:', profile);
  console.log('Settings:', settings);
  console.log('Todos:', todos);
}
```

### AutoQuickStart Usage

```typescript
import { autoQuickStart } from "shogun-core";

// Auto setup with automatic Gun instance creation
const shogun = autoQuickStart({
  peers: ['https://gun-manhattan.herokuapp.com/gun'],
  appScope: 'my-app'
});
await shogun.init();

// Use the same API
const user = await shogun.api.signup('alice', 'password123');
if (user) {
  console.log('User created:', user.username);
  
  // All the same operations as above
  await shogun.api.updateProfile({ name: 'Alice' });
  await shogun.api.saveSettings({ theme: 'dark' });
}

// Access the Gun instance if needed
const gunInstance = shogun.gun;
console.log('Gun instance:', gunInstance);
```

### Factory Function Usage

```typescript
import { createSimpleAPI, DataBase, createGun } from "shogun-core";

// Create DataBase instance
const gun = createGun({ peers: ['https://gun-manhattan.herokuapp.com/gun'] });
const db = new DataBase(gun, 'my-app');
await db.initialize();

// Create SimpleGunAPI from existing DataBase
const api = createSimpleAPI(db);

// Use the API
const user = await api.signup('alice', 'password123');
```

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

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("auth:signup", (data: AuthEventData) => {
  console.log(`New user signed up: ${data.username}`);
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

// Password recovery
await shogun.db.setPasswordHint(
  "username",
  "password",
  "My favorite color",
  ["What is your favorite color?"],
  ["blue"]
);
```

## Security Features

- **Password Recovery System**: Secure password hints with security questions
- **Session Encryption**: Secure session data storage
- **PKCE OAuth Flow**: Protection against authorization code interception
- **Type Safety**: Compile-time validation of API usage
- **Event-driven Architecture**: Real-time monitoring and debugging
- **Simplified Architecture**: Reduced attack surface through feature removal

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

## Frontend Integration

### React Hook for OAuth

```typescript
import { useCallback } from "react";

export const useOAuth = (protocol) => {
  const loginWithOAuth = useCallback(
    async (provider = "google") => {
      if (!protocol) throw new Error("Protocol not available");
      const result: AuthResult = await protocol.loginWithOAuth(provider);
      if (result.success && result.redirectUrl) return result; // redirect phase
      if (result.success) return result; // direct completion
      throw new Error(result.error || "OAuth login failed");
    },
    [protocol],
  );

  const registerWithOAuth = useCallback(
    async (provider = "google") => {
      if (!protocol) throw new Error("Protocol not available");
      const result: SignUpResult = await protocol.registerWithOAuth(provider);
      if (result.success && result.redirectUrl) return result; // redirect phase
      if (result.success) return result; // direct completion
      throw new Error(result.error || "OAuth registration failed");
    },
    [protocol],
  );

  return { loginWithOAuth, registerWithOAuth };
};
```

## Advanced API Features

### Advanced Plugin Management

Shogun Core provides comprehensive plugin management capabilities beyond basic registration and retrieval:

```typescript
// Get detailed plugin information
const pluginsInfo = shogun.getPluginsInfo();
console.log(`Total plugins: ${pluginsInfo.length}`);
pluginsInfo.forEach(plugin => {
  console.log(`${plugin.name} v${plugin.version} - ${plugin.description}`);
});

// Check plugin initialization status
const initStatus = shogun.getPluginsInitializationStatus();
Object.entries(initStatus).forEach(([name, status]) => {
  console.log(`${name}: ${status.initialized ? 'OK' : 'FAILED'}${status.error ? ` - ${status.error}` : ''}`);
});

// Validate plugin system health
const validation = shogun.validatePluginSystem();
console.log(`Initialized: ${validation.initializedPlugins}/${validation.totalPlugins}`);
if (validation.failedPlugins.length > 0) {
  console.log('Failed plugins:', validation.failedPlugins);
}

// Check plugin compatibility
const compatibility = shogun.checkPluginCompatibility();
console.log('Compatible plugins:', compatibility.compatible);
console.log('Incompatible plugins:', compatibility.incompatible);

// Get comprehensive debug information
const debugInfo = shogun.getPluginSystemDebugInfo();
console.log('Plugin system debug info:', debugInfo);

// Reinitialize failed plugins
const reinitResult = shogun.reinitializeFailedPlugins();
console.log('Reinitialized:', reinitResult.success);
console.log('Still failed:', reinitResult.failed);

// Get plugins by category
const authPlugins = shogun.getPluginsByCategory('authentication');
const walletPlugins = shogun.getPluginsByCategory('wallet');
```

### Peer Network Management

Manage GunDB peer connections dynamically:

```typescript
// Add new peers to the network
shogun.db.addPeer('https://new-peer.example.com/gun');
shogun.db.addPeer('wss://websocket-peer.example.com/gun');

// Remove peers
shogun.db.removePeer('https://old-peer.example.com/gun');

// Get current connected peers
const connectedPeers = shogun.db.getCurrentPeers();
console.log('Connected peers:', connectedPeers);

// Get all configured peers (connected and disconnected)
const allPeers = shogun.db.getAllConfiguredPeers();
console.log('All configured peers:', allPeers);

// Get detailed peer information
const peerInfo = shogun.db.getPeerInfo();
Object.entries(peerInfo).forEach(([peer, info]) => {
  console.log(`${peer}: ${info.status} (connected: ${info.connected})`);
});

// Reconnect to a specific peer
shogun.db.reconnectToPeer('https://disconnected-peer.example.com/gun');

// Reset all peers and add new ones
shogun.db.resetPeers([
  'https://primary-peer.example.com/gun',
  'https://backup-peer.example.com/gun'
]);
```

### Advanced User Management System

Comprehensive user lookup and management capabilities:

```typescript
// Get user by alias/username
const userInfo = await shogun.db.getUserByAlias('alice');
if (userInfo) {
  console.log(`User: ${userInfo.username}`);
  console.log(`Public Key: ${userInfo.userPub}`);
  console.log(`Encryption Key: ${userInfo.epub}`);
  console.log(`Registered: ${new Date(userInfo.registeredAt)}`);
  console.log(`Last Seen: ${new Date(userInfo.lastSeen)}`);
}

// Get user by public key
const userByPub = await shogun.db.getUserDataByPub(userPub);
console.log('User data:', userByPub);

// Get user public key by encryption key
const pubByEpub = await shogun.db.getUserPubByEpub(epubKey);
console.log('User public key:', pubByEpub);

// Get user alias by public key
const aliasByPub = await shogun.db.getUserAliasByPub(userPub);
console.log('User alias:', aliasByPub);

// Get all registered users (for admin purposes)
const allUsers = await shogun.db.getAllRegisteredUsers();
console.log(`Total registered users: ${allUsers.length}`);

// Update user's last seen timestamp
await shogun.db.updateUserLastSeen(userPub);
```

### Password Recovery & Security System

Secure password hint system with security questions:

```typescript
// Set up password recovery with security questions
const securityResult = await shogun.db.setPasswordHintWithSecurity(
  'alice',
  'currentPassword',
  'My favorite color is blue',
  [
    'What is your favorite color?',
    'What was your first pet\'s name?',
    'What city were you born in?'
  ],
  ['blue', 'fluffy', 'rome']
);

if (securityResult.success) {
  console.log('Password recovery system set up successfully');
} else {
  console.error('Failed to set up password recovery:', securityResult.error);
}

// Recover password using security answers
const recoveryResult = await shogun.db.forgotPassword(
  'alice',
  ['blue', 'fluffy', 'rome']
);

if (recoveryResult.success) {
  console.log('Password hint:', recoveryResult.hint);
} else {
  console.error('Password recovery failed:', recoveryResult.error);
}
```

### Error Handling & Debugging

Comprehensive error tracking and debugging capabilities:

```typescript
// Get recent errors for debugging
const recentErrors = shogun.getRecentErrors(20);
console.log(`Recent errors (${recentErrors.length}):`);
recentErrors.forEach((error, index) => {
  console.log(`${index + 1}. [${error.type}] ${error.message}`);
  console.log(`   Timestamp: ${new Date(error.timestamp)}`);
  console.log(`   Stack: ${error.stack}`);
});

// Handle errors with specific error types
try {
  await shogun.login('invalid_user', 'wrong_password');
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.log('Authentication failed - check credentials');
        break;
      case ErrorType.NETWORK:
        console.log('Network error - check connection');
        break;
      case ErrorType.GUN:
        console.log('GunDB error - check peers');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

### Event System Complete Reference

Comprehensive event handling with type safety:

```typescript
// Listen to all authentication events
shogun.on('auth:login', (data: AuthEventData) => {
  console.log(`User ${data.username} logged in via ${data.method}`);
  if (data.provider) {
    console.log(`OAuth provider: ${data.provider}`);
  }
});

shogun.on('auth:logout', () => {
  console.log('User logged out');
});

shogun.on('auth:signup', (data: AuthEventData) => {
  console.log(`New user registered: ${data.username}`);
});

// Plugin system events
shogun.on('plugin:registered', (data) => {
  console.log(`Plugin registered: ${data.name} v${data.version}`);
  if (data.category) {
    console.log(`Category: ${data.category}`);
  }
});

shogun.on('plugin:unregistered', (data) => {
  console.log(`Plugin unregistered: ${data.name}`);
});

// Debug events
shogun.on('debug', (data) => {
  console.log(`Debug [${data.action}]:`, data);
});

// Error events
shogun.on('error', (error: ErrorEventData) => {
  console.error(`Shogun Error: ${error.message}`);
  console.error(`Type: ${error.type}`);
  console.error(`Stack: ${error.stack}`);
});

// Database-level event handling
shogun.db.on('data:put', (data) => {
  console.log('Data stored:', data);
});

shogun.db.on('data:get', (data) => {
  console.log('Data retrieved:', data);
});

// One-time event listeners
shogun.once('auth:login', (data) => {
  console.log('First login detected:', data.username);
});

// Remove event listeners
const loginHandler = (data: AuthEventData) => {
  console.log('Login event:', data);
};
shogun.on('auth:login', loginHandler);
// Later...
shogun.off('auth:login', loginHandler);

// Remove all listeners for a specific event
shogun.removeAllListeners('auth:login');

// Remove all listeners
shogun.removeAllListeners();
```

### Database Lifecycle Management

Advanced database initialization and management:

```typescript
// Initialize database with custom scope
await shogun.db.initialize('my-custom-app-scope');

// Get database utilities
const gunInstance = shogun.db.getGun();
const currentUser = shogun.db.getCurrentUser();
const userInstance = shogun.db.getUser();

// Access RxJS reactive programming
const rxjs = shogun.db.rx();
rxjs.from('users/alice/profile').subscribe(data => {
  console.log('Profile updated:', data);
});

// Session management
shogun.db.recall(); // Restore session
shogun.db.leave();  // Leave session

// Get application scope
const appScope = shogun.db.getAppScope();
console.log('App scope:', appScope);

// Check authentication status
const isAuthenticated = shogun.db.isAuthenticated();
const userPub = shogun.db.getUserPub();
console.log(`Authenticated: ${isAuthenticated}, User: ${userPub}`);
```

## Testing

Shogun Core includes a comprehensive test suite with 659 passing tests covering all major functionality:

### Test Coverage

- **✅ Plugin System**: Complete plugin functionality testing (OAuth, Web3, WebAuthn, Nostr)
- **✅ Simple API**: Full coverage of SimpleGunAPI with 56 comprehensive tests
- **✅ Authentication Methods**: All authentication flows tested with proper error handling
- **✅ Data Operations**: CRUD operations, user space management, and collections
- **✅ Error Handling**: Comprehensive error scenarios and edge cases
- **✅ Browser Compatibility**: Cross-browser support validation
- **✅ Integration Tests**: End-to-end functionality testing

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test suites
yarn test --testPathPattern="plugins"
yarn test --testPathPattern="gundb/api.test.ts"

# Run with coverage
yarn test:ci
```

### Test Philosophy

Tests are designed to be **realistic and non-intrusive**:
- No codebase modifications required
- Comprehensive coverage of all public APIs
- Error resilience and edge case handling
- Browser compatibility validation
- Performance-aware testing

## Best Practices

1. Always check plugin availability before use
2. Handle errors with typed `ErrorType` categories
3. Prefer typed events (`ShogunEventMap`) for listeners
4. Clean up plugin resources via `destroy()` when unmounting
5. Enforce PKCE for OAuth in browsers; validate redirect URIs and state
6. Validate inputs (username, provider) before calling plugin APIs
7. Return `AuthResult` for login and `SignUpResult` for signup from plugins
8. Use peer management to ensure network connectivity
9. Implement proper error handling with `getRecentErrors()` for debugging
10. Set up password recovery system for production applications
11. Monitor plugin system health with validation methods
12. Use event system for real-time application state management
