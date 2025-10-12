# SHIP-04: Multi-Modal Authentication

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025-10-11  
> **Updated**: 2025-10-11  
> **Depends on**: [SHIP-00](./SHIP_00.md) (Identity & Authentication)

---

## Abstract

SHIP-04 extends SHIP-00 to provide multiple authentication methods beyond traditional username/password. This protocol integrates OAuth, WebAuthn, Nostr, and Web3 authentication while maintaining compatibility with the SHIP-00 identity foundation.

**Key Innovation**: All authentication methods are converted to SHIP-00 compatible SEA keypairs using deterministic derivation, ensuring unified identity across all auth methods.

---

## Table of Contents

- [Motivation](#motivation)
- [Specification](#specification)
- [Security](#security)
- [Implementation](#implementation)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [References](#references)

---

## Motivation

### Why SHIP-04?

Modern web applications need flexible authentication options to maximize accessibility and user choice. However, supporting multiple auth methods typically fragments the identity system.

**Problems with existing multi-auth approaches:**

- ❌ **Fragmented Identity**: Each auth method creates a separate user account
- ❌ **Complex State**: Multiple identity systems to maintain
- ❌ **Poor UX**: Users can't switch between auth methods
- ❌ **Integration Challenges**: Each method needs custom implementation

**SHIP-04 solves this by unifying all methods:**

- ✅ **Single Identity**: All auth methods map to same SHIP-00 identity
- ✅ **Interchangeable**: Switch between auth methods seamlessly
- ✅ **Plugin-Based**: Leverages existing Shogun Core plugins
- ✅ **Type-Safe**: Unified TypeScript interfaces

### Supported Authentication Methods

```
SHIP-04 (Multi-Modal Auth)
   │
   ├─► OAuth (Google, GitHub, Discord, etc.)
   ├─► WebAuthn (Biometric, Passkeys)
   ├─► Nostr (Decentralized Social Protocol)
   ├─► Web3 (MetaMask, WalletConnect)
   └─► Password (via SHIP-00)
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              SHIP-04 MULTI-MODAL AUTH                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   SHIP-00    │    │   Plugins    │    │   Derive     │  │
│  │  (Identity)  │    │  (Auth Mtd)  │    │  (SEA Pair)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. User selects auth method (OAuth/Web3/etc)    │    │
│    │  2. Plugin authenticates user                    │    │
│    │  3. derive() converts to SEA keypair             │    │
│    │  4. core.login() with derived keypair            │    │
│    │  5. SHIP-00 identity established                 │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| **Identity Foundation** | SHIP-00 | Base identity and keypair |
| **OAuth** | Google/GitHub/Discord APIs | Social login |
| **WebAuthn** | W3C WebAuthn API | Biometric authentication |
| **Nostr** | Nostr Protocol | Decentralized social login |
| **Web3** | MetaMask/WalletConnect | Ethereum wallet connection |
| **Derivation** | derive() + keccak256 | Convert auth to SEA keypair |
| **Storage** | GunDB | Identity persistence |

### GunDB Node Structure

SHIP-04 uses the following standardized Gun node names:

```typescript
SHIP_04.NODES = {
  AUTH_METHOD: "current_auth_method",  // Last used auth method (in user space)
}
```

**Note**: SHIP-04 is a coordinator that delegates to plugins. Plugins manage their own storage internally (OAuth tokens, WebAuthn credentials, etc.). SHIP-04 only tracks which authentication method was last used in user's private space.

---

## Core Interface

```typescript
/**
 * SHIP-04: Multi-Modal Authentication Interface
 */
interface ISHIP_04 {
  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Initialize SHIP-04 with enabled plugins
   * Automatically initializes available authentication plugins
   */
  initialize(): Promise<void>;

  /**
   * Check if SHIP-04 is initialized
   */
  isInitialized(): boolean;

  /**
   * Get underlying SHIP-00 identity instance
   */
  getIdentity(): ISHIP_00;

  // ========================================
  // OAUTH AUTHENTICATION
  // ========================================

  /**
   * Login with OAuth provider
   * Initiates OAuth flow and returns auth URL for redirect
   *
   * @param provider - OAuth provider (google, github, discord, etc.)
   * @param redirectUri - Optional redirect URI
   * @returns OAuth authentication result
   */
  loginWithOAuth(
    provider: OAuthProvider,
    redirectUri?: string
  ): Promise<OAuthAuthResult>;

  /**
   * Handle OAuth callback after redirect
   * Completes OAuth flow and establishes SHIP-00 identity
   *
   * @param code - Authorization code from provider
   * @param provider - OAuth provider
   * @returns OAuth authentication result
   */
  handleOAuthCallback(
    code: string,
    provider: OAuthProvider
  ): Promise<OAuthAuthResult>;

  /**
   * Check if OAuth is available
   * @param provider - Optional specific provider to check
   */
  isOAuthAvailable(provider?: OAuthProvider): boolean;

  // ========================================
  // WEBAUTHN AUTHENTICATION
  // ========================================

  /**
   * Register new user with WebAuthn (biometric/passkey)
   *
   * @param username - Username to register
   * @returns WebAuthn authentication result
   */
  registerWithWebAuthn(username: string): Promise<WebAuthnAuthResult>;

  /**
   * Login with WebAuthn
   *
   * @param username - Username to login
   * @returns WebAuthn authentication result
   */
  loginWithWebAuthn(username: string): Promise<WebAuthnAuthResult>;

  /**
   * Check if WebAuthn is available in browser
   */
  isWebAuthnAvailable(): boolean;

  // ========================================
  // NOSTR AUTHENTICATION
  // ========================================

  /**
   * Connect with Nostr wallet extension
   * Uses Nostr public key to derive SHIP-00 identity
   *
   * @returns Nostr authentication result
   */
  connectNostr(): Promise<NostrAuthResult>;

  /**
   * Login with Nostr (alias for connectNostr)
   */
  loginWithNostr(): Promise<NostrAuthResult>;

  /**
   * Check if Nostr extension is available
   */
  isNostrAvailable(): boolean;

  // ========================================
  // WEB3 AUTHENTICATION
  // ========================================

  /**
   * Connect with Web3 wallet (MetaMask, etc.)
   * Uses Ethereum address to derive SHIP-00 identity
   *
   * @returns Web3 authentication result
   */
  connectWeb3(): Promise<Web3AuthResult>;

  /**
   * Login with Web3 wallet
   * @param message - Optional custom signature message
   */
  loginWithWeb3(message?: string): Promise<Web3AuthResult>;

  /**
   * Check if Web3 provider is available
   */
  isWeb3Available(): boolean;

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Get all available authentication methods
   * Returns list with availability status
   */
  getAvailableAuthMethods(): AuthMethodInfo[];

  /**
   * Get currently used authentication method
   */
  getCurrentAuthMethod(): AuthMethod | null;

  /**
   * Load last used authentication method from Gun
   */
  loadAuthMethod(): Promise<AuthMethod | null>;

  /**
   * Clear authentication state
   */
  clearAuth(): Promise<void>;
}
```

### Type Definitions

```typescript
/**
 * Authentication methods
 */
export const enum AuthMethod {
  PASSWORD = "password",      // Traditional (SHIP-00)
  OAUTH = "oauth",           // OAuth providers
  WEBAUTHN = "webauthn",     // Biometric/Passkey
  NOSTR = "nostr",           // Nostr protocol
  WEB3 = "web3",             // Web3 wallets
}

/**
 * OAuth providers
 */
export type OAuthProvider = "google" | "github" | "discord" | "twitter" | "custom";

/**
 * OAuth authentication result
 */
export interface OAuthAuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  derivedAddress?: string;
  provider?: OAuthProvider;
  email?: string;
  profilePicture?: string;
  error?: string;
}

/**
 * WebAuthn authentication result
 */
export interface WebAuthnAuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  derivedAddress?: string;
  credentialId?: string;
  error?: string;
}

/**
 * Nostr authentication result
 */
export interface NostrAuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  derivedAddress?: string;
  nostrPubkey?: string;
  relays?: string[];
  error?: string;
}

/**
 * Web3 authentication result
 */
export interface Web3AuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  derivedAddress?: string;
  walletAddress?: string;
  chainId?: number;
  walletType?: string;
  error?: string;
}

/**
 * Auth method info
 */
export interface AuthMethodInfo {
  method: AuthMethod;
  available: boolean;
  configured: boolean;
  lastUsed?: number;
}

/**
 * SHIP-04 configuration
 */
export interface SHIP_04_Config {
  enableOAuth?: boolean;
  enableWebAuthn?: boolean;
  enableNostr?: boolean;
  enableWeb3?: boolean;
  oauthProviders?: Record<OAuthProvider, any>;
  webAuthnRpName?: string;
  webAuthnRpId?: string;
  nostrRelays?: string[];
  web3Provider?: string;
}
```

---

## How It Works

### Unified Identity via Deterministic Derivation

All authentication methods are converted to SHIP-00 compatible SEA keypairs:

```typescript
// OAuth: user@gmail.com
↓ keccak256(googleId + provider)
↓ derive(password, salt)
→ SEA Pair

// Web3: 0x742d35...
↓ keccak256(address + "shogun-web3")
↓ derive(password, salt)
→ SEA Pair (same for same address)

// WebAuthn: credential-id-123
↓ keccak256(credentialId)
↓ derive(hash, salt)
→ SEA Pair (same for same credential)

// Nostr: npub1xyz...
↓ keccak256(nostrPubkey)
↓ derive(hash, salt)
→ SEA Pair (same for same pubkey)
```

**Result**: Same user, different auth methods, **same SHIP-00 identity** ✅

---

## Usage Examples

### Basic Setup

```typescript
import { SHIP_00, SHIP_04 } from 'shogun-core';

// 1. Initialize SHIP-00 identity foundation
const identity = new SHIP_00({
  gunOptions: {
    peers: ['https://peer.wallie.io/gun'],
  }
});

// 2. Initialize SHIP-04 with available auth methods
const multiAuth = new SHIP_04(identity, {
  enableOAuth: true,
  enableWebAuthn: true,
  enableNostr: true,
  enableWeb3: true,
  oauthProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      redirectUri: "http://localhost:3000/auth/callback",
    }
  }
});

await multiAuth.initialize();
console.log('✅ SHIP-04 initialized');

// 3. Check available auth methods
const methods = multiAuth.getAvailableAuthMethods();
methods.forEach(m => {
  console.log(`${m.method}: ${m.available ? '✅' : '❌'}`);
});
```

### OAuth Authentication

```typescript
// Login with Google
const result = await multiAuth.loginWithOAuth('google');

if (result.success) {
  // For browser: redirect to OAuth provider
  if (result.redirectUrl) {
    window.location.href = result.redirectUrl;
  }
}

// After OAuth callback
const callbackResult = await multiAuth.handleOAuthCallback(code, 'google');

if (callbackResult.success) {
  console.log('✅ Logged in via OAuth');
  console.log('User:', callbackResult.username);
  console.log('Email:', callbackResult.email);
  console.log('SHIP-00 pub:', callbackResult.userPub);
}
```

### WebAuthn Authentication

```typescript
// Register with biometric/passkey
const registerResult = await multiAuth.registerWithWebAuthn('alice');

if (registerResult.success) {
  console.log('✅ Registered with WebAuthn');
  console.log('User pub:', registerResult.userPub);
}

// Login with biometric
const loginResult = await multiAuth.loginWithWebAuthn('alice');

if (loginResult.success) {
  console.log('✅ Logged in with biometric');
  console.log('Credential ID:', loginResult.credentialId);
}
```

### Nostr Authentication

```typescript
// Connect Nostr wallet extension
const nostrResult = await multiAuth.connectNostr();

if (nostrResult.success) {
  console.log('✅ Connected with Nostr');
  console.log('Nostr pubkey:', nostrResult.nostrPubkey);
  console.log('SHIP-00 pub:', nostrResult.userPub);
  console.log('Relays:', nostrResult.relays);
}
```

### Web3 Authentication

```typescript
// Connect MetaMask
const web3Result = await multiAuth.connectWeb3();

if (web3Result.success) {
  console.log('✅ Connected with MetaMask');
  console.log('Wallet address:', web3Result.walletAddress);
  console.log('Chain ID:', web3Result.chainId);
  console.log('SHIP-00 pub:', web3Result.userPub);
}
```

### Check Available Methods

```typescript
// Get all available authentication methods
const methods = multiAuth.getAvailableAuthMethods();

methods.forEach(method => {
  console.log(`${method.method}:`);
  console.log(`  Available: ${method.available}`);
  console.log(`  Configured: ${method.configured}`);
  if (method.lastUsed) {
    console.log(`  Last Used: ${new Date(method.lastUsed)}`);
  }
});

// Check current auth method
const currentMethod = multiAuth.getCurrentAuthMethod();
console.log('Current method:', currentMethod);

// Load last used method from Gun
const lastMethod = await multiAuth.loadAuthMethod();
console.log('Last used method:', lastMethod);
```

---

## Security

### Deterministic Key Derivation

Each authentication method uses deterministic derivation to ensure the same user gets the same SHIP-00 identity:

#### OAuth

```typescript
// Google user: user@gmail.com (ID: 123456)
const salt = keccak256(`${googleId}_google_${email}`);
const password = generateDeterministicPassword(salt);
const seaPair = await derive(password, salt, { includeP256: true });
// → Always the same seaPair for user@gmail.com
```

#### Web3

```typescript
// Ethereum address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
const password = keccak256(`${address.toLowerCase()}:shogun-web3`);
const seaPair = await derive(password, null, { includeP256: true });
// → Always the same seaPair for this address
```

#### WebAuthn

```typescript
// Credential ID: credential-abc-123
const hashedCredentialId = keccak256(credentialId);
const seaPair = await derive(hashedCredentialId, null, { includeP256: true });
// → Always the same seaPair for this credential
```

#### Nostr

```typescript
// Nostr pubkey: npub1xyz...
const hashedPubkey = keccak256(nostrPubkey);
const password = sha256(signature); // From Nostr signature
const seaPair = await derive(password, salt, { includeP256: true });
// → Always the same seaPair for this Nostr identity
```

### Security Properties

| Property | Implementation |
|----------|---------------|
| **Deterministic** | Same auth credential → same SHIP-00 identity |
| **No Private Key Storage** | Keys derived on-the-fly from auth |
| **Plugin Isolation** | Each plugin manages its own security |
| **SHIP-00 Compatible** | All methods produce valid SEA pairs |
| **Interchangeable** | Can switch auth methods seamlessly |

### Threat Mitigation

| Threat | Mitigation |
|--------|-----------|
| **OAuth Token Theft** | Tokens managed by plugin, not exposed |
| **Credential Phishing** | WebAuthn resistant to phishing |
| **Private Key Exposure** | Keys derived, not stored |
| **Session Hijacking** | SHIP-00 session management |

---

## Implementation

### Quick Start

```typescript
import { SHIP_00, SHIP_04 } from 'shogun-core';

// Initialize
const identity = new SHIP_00({ gunOptions: { peers: [...] }});
const multiAuth = new SHIP_04(identity, {
  enableOAuth: true,
  enableWebAuthn: true,
  enableWeb3: true,
  enableNostr: true,
});

await multiAuth.initialize();

// Use any auth method
await multiAuth.connectWeb3();           // MetaMask
await multiAuth.registerWithWebAuthn('alice'); // Biometric
await multiAuth.loginWithOAuth('google'); // Social login
await multiAuth.connectNostr();          // Nostr
```

### Frontend Integration

```typescript
import { SHIP_00, SHIP_04 } from 'shogun-core';

class AuthManager {
  private identity: SHIP_00;
  private multiAuth: SHIP_04;

  async init() {
    this.identity = new SHIP_00({ gunOptions: { peers: [...] }});
    this.multiAuth = new SHIP_04(this.identity, {
      enableOAuth: true,
      oauthProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          redirectUri: `${window.location.origin}/auth/callback`,
        }
      }
    });

    await this.multiAuth.initialize();

    // Check last used method
    const lastMethod = await this.multiAuth.loadAuthMethod();
    if (lastMethod) {
      console.log('Last auth method:', lastMethod);
    }
  }

  async loginWithGoogle() {
    const result = await this.multiAuth.loginWithOAuth('google');
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
  }

  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code) {
      const result = await this.multiAuth.handleOAuthCallback(code, 'google');
      if (result.success) {
        console.log('✅ Authenticated:', result.email);
      }
    }
  }

  async loginWithMetaMask() {
    const result = await this.multiAuth.connectWeb3();
    if (result.success) {
      console.log('✅ Connected:', result.walletAddress);
    }
  }

  async loginWithPasskey() {
    const result = await this.multiAuth.loginWithWebAuthn('alice');
    if (result.success) {
      console.log('✅ Authenticated with passkey');
    }
  }
}
```

---

## Plugin Architecture

### How Plugins Work with SHIP-04

```
┌──────────────────────────────────────────────────────────┐
│ SHIP-04 (Coordinator)                                    │
│   │                                                       │
│   ├─ OAuthPlugin                                         │
│   │  ├─ initiateOAuth() → redirectUrl                    │
│   │  ├─ completeOAuth() → userInfo                       │
│   │  ├─ generateCredentials() → derive(password, salt)   │
│   │  └─ login() → core.login(username, "", derivedPair)  │
│   │                                                       │
│   ├─ WebAuthnPlugin                                      │
│   │  ├─ createCredential() → credentialId                │
│   │  ├─ deriveKeys() → derive(keccak256(credId), salt)   │
│   │  └─ login() → core.login(username, "", derivedPair)  │
│   │                                                       │
│   ├─ Web3Plugin                                          │
│   │  ├─ connectMetaMask() → address                      │
│   │  ├─ deriveKeys() → derive(keccak256(addr), salt)     │
│   │  └─ login() → core.login(address, "", derivedPair)   │
│   │                                                       │
│   └─ NostrPlugin                                         │
│      ├─ connectNostr() → nostrPubkey                     │
│      ├─ deriveKeys() → derive(signature, salt)           │
│      └─ login() → core.login(username, "", derivedPair)  │
│                                                           │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ SHIP-00 (Identity Foundation)                            │
│   All auth methods converge here                         │
│   → Same user, same identity, different auth method      │
└──────────────────────────────────────────────────────────┘
```

### Inclusive Hierarchy

```
SHIP-04 → depends on → SHIP-00 ✅

SHIP-04 can use SHIP-00 methods:
  ✅ getCurrentUser()
  ✅ getPublicKey()
  ✅ exportKeyPair()
  ✅ deriveEthereumAddress()

SHIP-00 ✗ cannot depend on SHIP-04
```

---

## Testing

### Interactive Testing

```bash
# Test in browser
cd shogun-auth-app
yarn dev

# Test OAuth
1. Click "Login with Google"
2. Authorize on Google
3. Verify SHIP-00 identity created

# Test WebAuthn
1. Click "Login with Passkey"
2. Use biometric/security key
3. Verify same SHIP-00 identity

# Test Web3
1. Click "Connect MetaMask"
2. Approve connection
3. Verify same SHIP-00 identity
```

### Programmatic Testing

```typescript
import { SHIP_00, SHIP_04 } from 'shogun-core';

async function testMultiAuth() {
  const identity = new SHIP_00(config);
  const multiAuth = new SHIP_04(identity);
  await multiAuth.initialize();

  // Test available methods
  const methods = multiAuth.getAvailableAuthMethods();
  console.log('Available methods:', methods);

  // Test Web3 (if MetaMask available)
  if (multiAuth.isWeb3Available()) {
    const result = await multiAuth.connectWeb3();
    assert(result.success);
    assert(result.userPub);
    console.log('✅ Web3 test passed');
  }

  // Test WebAuthn (if supported)
  if (multiAuth.isWebAuthnAvailable()) {
    const result = await multiAuth.registerWithWebAuthn('test-user');
    assert(result.success);
    console.log('✅ WebAuthn test passed');
  }

  // Verify current auth method is saved
  const currentMethod = multiAuth.getCurrentAuthMethod();
  assert(currentMethod !== null);
  console.log('✅ Auth method tracking works');
}
```

---

## Integration with Other SHIPs

### SHIP-04 + SHIP-02 (HD Wallet)

```typescript
import { SHIP_00, SHIP_02, SHIP_04 } from 'shogun-core';

// 1. Authenticate with MetaMask (SHIP-04)
const identity = new SHIP_00(config);
const multiAuth = new SHIP_04(identity);
await multiAuth.initialize();

const web3Result = await multiAuth.connectWeb3();
console.log('✅ Authenticated with MetaMask');

// 2. Derive HD Wallet from identity (SHIP-02)
const wallet = new SHIP_02(identity);
await wallet.initialize();

const address = await wallet.getPrimaryAddress();
console.log('📍 HD Wallet Address:', address);

// Same identity, different capabilities
console.log('MetaMask Address:', web3Result.walletAddress);
console.log('HD Wallet Address:', address);
```

### SHIP-04 + SHIP-01 (Messaging)

```typescript
import { SHIP_00, SHIP_01, SHIP_04 } from 'shogun-core';

// 1. Authenticate with OAuth (SHIP-04)
const identity = new SHIP_00(config);
const multiAuth = new SHIP_04(identity);
await multiAuth.initialize();

await multiAuth.loginWithOAuth('google');
// User is now authenticated with SHIP-00

// 2. Use messaging (SHIP-01)
const messaging = new SHIP_01(identity);

await messaging.sendMessage('bob', 'Hello from Google login!');
console.log('✅ Message sent using OAuth identity');
```

---

## Configuration Examples

### Minimal Configuration

```typescript
const multiAuth = new SHIP_04(identity, {
  enableWeb3: true, // Only MetaMask
});
```

### Full Configuration

```typescript
const multiAuth = new SHIP_04(identity, {
  enableOAuth: true,
  enableWebAuthn: true,
  enableNostr: true,
  enableWeb3: true,
  
  oauthProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      redirectUri: "http://localhost:3000/auth/callback",
      scope: ["openid", "email", "profile"],
      usePKCE: true,
    },
    github: {
      clientId: "YOUR_GITHUB_CLIENT_ID",
      redirectUri: "http://localhost:3000/auth/callback",
      scope: ["user:email"],
      usePKCE: true,
    },
  },
  
  webAuthnRpName: "My dApp",
  webAuthnRpId: window.location.hostname,
  
  nostrRelays: [
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
  ],
  
  web3Provider: "metamask",
});
```

---

## API Reference

### Configuration

```typescript
interface SHIP_04_Config {
  // Enable/disable auth methods
  enableOAuth?: boolean;         // Default: true
  enableWebAuthn?: boolean;      // Default: true
  enableNostr?: boolean;         // Default: true
  enableWeb3?: boolean;          // Default: true

  // OAuth configuration
  oauthProviders?: Record<OAuthProvider, {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope?: string[];
    usePKCE?: boolean;
  }>;

  // WebAuthn configuration
  webAuthnRpName?: string;       // Relying party name
  webAuthnRpId?: string;         // Relying party ID (domain)

  // Nostr configuration
  nostrRelays?: string[];        // Nostr relay URLs

  // Web3 configuration
  web3Provider?: string;         // "metamask" | "walletconnect"
}
```

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize()` | Initialize plugins | `Promise<void>` |
| `loginWithOAuth(provider)` | OAuth login | `Promise<OAuthAuthResult>` |
| `registerWithWebAuthn(username)` | WebAuthn register | `Promise<WebAuthnAuthResult>` |
| `loginWithWebAuthn(username)` | WebAuthn login | `Promise<WebAuthnAuthResult>` |
| `connectNostr()` | Nostr connect | `Promise<NostrAuthResult>` |
| `connectWeb3()` | Web3 connect | `Promise<Web3AuthResult>` |
| `getAvailableAuthMethods()` | List methods | `AuthMethodInfo[]` |
| `getCurrentAuthMethod()` | Get current method | `AuthMethod \| null` |
| `loadAuthMethod()` | Load from Gun | `Promise<AuthMethod \| null>` |

---

## Future Enhancements

### Planned Features

- [ ] **FIDO2 Support**: Hardware security keys
- [ ] **Passkey Sync**: Apple/Google passkey synchronization
- [ ] **Social Recovery**: Multi-sig recovery with trusted contacts
- [ ] **DID Integration**: W3C Decentralized Identifiers
- [ ] **Lens Protocol**: Social graph authentication
- [ ] **ENS Integration**: Authenticate via ENS domain

### Proposed Extensions

- **SHIP-04a**: Biometric-only mode for mobile apps
- **SHIP-04b**: Enterprise SSO integration
- **SHIP-04c**: Multi-factor authentication

---

## Comparison

### SHIP-04 vs Alternatives

| Feature | SHIP-04 | Auth0 | Firebase Auth | Magic Link |
|---------|---------|-------|---------------|------------|
| **Cost** | 🟢 Free | 🔴 $$$/month | 🟡 Free tier | 🔴 $$$/month |
| **Decentralized** | 🟢 Yes (GunDB) | 🔴 No | 🔴 No | 🔴 No |
| **Self-Hosted** | 🟢 Yes | 🔴 No | 🔴 No | 🔴 No |
| **OAuth** | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟢 Yes |
| **WebAuthn** | 🟢 Yes | 🟢 Yes | 🔴 No | 🔴 No |
| **Web3** | 🟢 Yes | 🔴 No | 🔴 No | 🟡 Partial |
| **Nostr** | 🟢 Yes | 🔴 No | 🔴 No | 🔴 No |
| **Unified Identity** | 🟢 Yes | 🔴 No | 🔴 No | 🔴 No |
| **Open Source** | 🟢 MIT | 🔴 Proprietary | 🔴 Proprietary | 🔴 Proprietary |

---

## References

- **SHIP-00**: [Identity Foundation](./SHIP_00.md)
- **Shogun Core**: [Main README](../README.md)
- **OAuth 2.0**: [RFC 6749](https://tools.ietf.org/html/rfc6749)
- **PKCE**: [RFC 7636](https://tools.ietf.org/html/rfc7636)
- **WebAuthn**: [W3C Spec](https://www.w3.org/TR/webauthn/)
- **Nostr**: [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- **EIP-1193**: [Ethereum Provider](https://eips.ethereum.org/EIPS/eip-1193)

---

## License

MIT License - see [LICENSE](../LICENSE)

---

<div align="center">

**SHIP-04: Multi-Modal Authentication** 🔐

*One Identity, Many Ways to Authenticate*

🗡️ Built with Shogun Core 🗡️

</div>

