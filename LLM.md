# Shogun Core - LLM Documentation

## Overview

Shogun Core is a TypeScript SDK for building decentralized applications (dApps) with multiple authentication methods and peer-to-peer data storage using GunDB.

## Recent Improvements

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

## Plugin Authentication APIs

### Core Types and Interfaces

```typescript
// Authentication result interface - returned by all plugin methods
interface AuthResult {
  success: boolean;
  error?: string;
  userPub?: string;           // User's public key in GunDB
  username?: string;          // Username or identifier
  sessionToken?: string;      // Session token if applicable
  authMethod?: AuthMethod;    // Authentication method used
  sea?: {                     // GunDB SEA pair for session persistence
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
  // OAuth-specific properties
  redirectUrl?: string;       // OAuth redirect URL
  pendingAuth?: boolean;      // Indicates pending OAuth flow
  message?: string;          // Status message
  provider?: string;         // OAuth provider name
  isNewUser?: boolean;       // True if this was a registration
  user?: {                   // OAuth user data
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

// Supported authentication methods
type AuthMethod = "password" | "webauthn" | "web3" | "nostr" | "oauth" | "bitcoin" | "pair";

// Event system with full TypeScript support
interface ShogunEventMap {
  "auth:login": AuthEventData;
  "auth:logout": void;
  "auth:signup": AuthEventData;
  "wallet:created": WalletEventData;
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
  "debug": { action: string; [key: string]: any };
  "error": ErrorEventData;
}
```

### 1. Traditional Authentication

```typescript
// Direct username/password authentication
const signUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
}

const loginResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
}
```

### 2. Web3 Plugin API (MetaMask/Ethereum)

```typescript
const web3Plugin = shogun.getPlugin<Web3ConnectorPlugin>("web3");

if (web3Plugin && web3Plugin.isAvailable()) {
  // Connect to MetaMask
  const connectionResult = await web3Plugin.connectMetaMask();
  
  if (connectionResult.success) {
    const address = connectionResult.address!;
    
    // Login with Web3 wallet
    const loginResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log("Web3 login successful");
      console.log("User public key:", loginResult.userPub);
    }
    
    // Register new user with Web3 wallet
    const signUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log("Web3 registration successful");
    }
  }
}

// Complete Web3 Plugin Interface
interface Web3ConnectorPluginInterface {
  // Core authentication methods
  login(address: string): Promise<AuthResult>;
  signUp(address: string): Promise<AuthResult>;
  
  // Connection and availability
  isAvailable(): boolean;
  connectMetaMask(): Promise<ConnectionResult>;
  getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
  getSigner(): Promise<ethers.Signer>;
  
  // Credential management
  generateCredentials(address: string): Promise<ISEAPair>;
  generatePassword(signature: string): Promise<string>;
  verifySignature(message: string, signature: string): Promise<string>;
  setCustomProvider(rpcUrl: string, privateKey: string): void;
  cleanup(): void;
}
```

### 3. WebAuthn Plugin API (Biometrics/Hardware Keys)

```typescript
const webauthnPlugin = shogun.getPlugin<WebauthnPlugin>("webauthn");

if (webauthnPlugin && webauthnPlugin.isSupported()) {
  // Register new user with WebAuthn
  const signUpResult = await webauthnPlugin.signUp("username");
  if (signUpResult.success) {
    console.log("WebAuthn registration successful");
  }

  // Authenticate existing user
  const loginResult = await webauthnPlugin.login("username");
  if (loginResult.success) {
    console.log("WebAuthn authentication successful");
  }
}

// Complete WebAuthn Plugin Interface
interface WebauthnPluginInterface {
  // Core authentication methods
  login(username: string): Promise<AuthResult>;
  signUp(username: string): Promise<AuthResult>;
  
  // Capability checks
  isSupported(): boolean;
  
  // WebAuthn-specific methods
  register(username: string, displayName?: string): Promise<WebAuthnCredential>;
  authenticate(username?: string): Promise<WebAuthnCredential>;
  generateCredentials(username: string, pair?: ISEAPair | null, login?: boolean): Promise<WebAuthnUniformCredentials>;
  
  // Management
  cleanup(): void;
}
```

### 4. Nostr Plugin API (Bitcoin/Nostr)

```typescript
const nostrPlugin = shogun.getPlugin<NostrConnectorPlugin>("nostr");

if (nostrPlugin && nostrPlugin.isAvailable()) {
  // Connect to Nostr wallet (Bitcoin extension)
  const connectionResult = await nostrPlugin.connectNostrWallet();
  
  if (connectionResult.success) {
    const address = connectionResult.address!;
    
    // Login with Nostr/Bitcoin wallet
    const loginResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log("Nostr login successful");
    }
    
    // Register with Nostr/Bitcoin wallet
    const signUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log("Nostr registration successful");
    }
  }
}

// Complete Nostr Plugin Interface
interface NostrConnectorPluginInterface {
  // Core authentication methods
  login(address: string): Promise<AuthResult>;
  signUp(address: string): Promise<AuthResult>;
  
  // Connection methods
  isAvailable(): boolean;
  connectBitcoinWallet(type?: "alby" | "nostr" | "manual"): Promise<ConnectionResult>;
  connectNostrWallet(): Promise<ConnectionResult>;
  
  // Credential and signature management
  generateCredentials(address: string, signature: string, message: string): Promise<NostrConnectorCredentials>;
  verifySignature(message: string, signature: string, address: string): Promise<boolean>;
  generatePassword(signature: string): Promise<string>;
  clearSignatureCache(address?: string): void;
  cleanup(): void;
  
  // Nostr-specific signer methods
  createSigningCredential(address: string): Promise<NostrSigningCredential>;
  createAuthenticator(address: string): (data: any) => Promise<string>;
  createDerivedKeyPair(address: string, extra?: string[]): Promise<{ pub: string; priv: string; epub: string; epriv: string }>;
  signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string>;
}
```

### 5. OAuth Plugin API (Social Login)

```typescript
const oauthPlugin = shogun.getPlugin<OAuthPlugin>("oauth");

if (oauthPlugin && oauthPlugin.isSupported()) {
  // Get available providers
  const providers = oauthPlugin.getAvailableProviders(); // ["google", "github", ...]
  
  // Initiate login with OAuth (returns redirect URL)
  const loginResult = await oauthPlugin.login("google");
  if (loginResult.success && loginResult.redirectUrl) {
    // Redirect user to OAuth provider
    window.location.href = loginResult.redirectUrl;
  }
  
  // Handle OAuth callback (after redirect back from provider)
  const callbackResult = await oauthPlugin.handleOAuthCallback(
    "google", 
    authCode,  // From URL params
    state      // From URL params
  );
  
  if (callbackResult.success) {
    console.log("OAuth authentication successful");
    if (callbackResult.user) {
      console.log("User email:", callbackResult.user.email);
      console.log("User name:", callbackResult.user.name);
    }
  }
}

// Complete OAuth Plugin Interface
interface OAuthPluginInterface {
  // Core authentication methods
  login(provider: OAuthProvider): Promise<AuthResult>;
  signUp(provider: OAuthProvider): Promise<AuthResult>;
  
  // OAuth flow management
  isSupported(): boolean;
  getAvailableProviders(): OAuthProvider[];
  initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;
  completeOAuth(provider: OAuthProvider, authCode: string, state?: string): Promise<OAuthConnectionResult>;
  handleOAuthCallback(provider: OAuthProvider, authCode: string, state: string): Promise<AuthResult>;
  
  // Credential and user management
  generateCredentials(userInfo: OAuthUserInfo, provider: OAuthProvider): Promise<OAuthCredentials>;
  getCachedUserInfo(userId: string, provider: OAuthProvider): OAuthUserInfo | null;
  clearUserCache(userId?: string, provider?: OAuthProvider): void;
  
  // Configuration
  configure(config: Partial<OAuthConfig>): void;
}
```

## Frontend Integration

### React Hook for OAuth

```typescript
import { useCallback } from 'react';

export const useOAuth = (protocol) => {
  const loginWithOAuth = useCallback(async (provider = 'google') => {
    if (!protocol) {
      throw new Error("Protocol not available");
    }
    
    try {
      const result = await protocol.loginWithOAuth(provider);
      
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
  }, [protocol]);

  const registerWithOAuth = useCallback(async (provider = 'google') => {
    if (!protocol) {
      throw new Error("Protocol not available");
    }
    
    try {
      const result = await protocol.registerWithOAuth(provider);
      
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
  }, [protocol]);

  return {
    loginWithOAuth,
    registerWithOAuth
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

// Listen for wallet creation (automatic derivation)
shogun.on("wallet:created", (data) => {
  console.log("Wallet created:", data.address);
});

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

// Listen for wallet creation events
shogun.on("wallet:created", (data) => {
  console.log("New wallet derived:", data.address, data.path);
});
```

### OAuth Callback Component

```jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthCallback = ({ protocol }) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processing = useRef(false);

  const handleAuth = useCallback(async () => {
    if (processing.current) {
      console.warn("OAuth callback is already being processed, skipping.");
      return;
    }
    processing.current = true;

    try {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      const provider = params.get("provider") || "google";

      // Check for OAuth errors
      if (error) {
        throw new Error(
          `OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`
        );
      }

      // Security validation
      if (!code) {
        throw new Error("Authorization code not found in URL.");
      }

      if (!state) {
        throw new Error(
          "State parameter not found in URL - possible CSRF attack."
        );
      }

      console.log(`Handling OAuth callback for ${provider}`);

      // Handle OAuth callback using the protocol
      if (protocol && protocol.handleOAuthCallback) {
        const result = await protocol.handleOAuthCallback(code, state, provider);
        
        if (result && result.success) {
          console.log("OAuth authentication successful:", result);

          // Emit success event
          window.dispatchEvent(new CustomEvent('oauth:success', {
            detail: { provider, user: result.user }
          }));

          // Navigate to main page
          navigate("/", { state: { authSuccess: true } });
        } else {
          throw new Error(result?.error || "Authentication failed");
        }
      }
    } catch (e) {
      console.error("Error handling OAuth callback:", e);

      // Handle specific errors
      if (e.message?.includes("invalid_grant")) {
        setError("Your session has expired. Please try signing in again.");
        navigate("/?error=token_expired");
      } else if (e.message?.includes("state parameter expired")) {
        setError("Authentication session expired. Please try signing in again.");
        navigate("/?error=session_expired");
      } else if (e.message?.includes("CSRF")) {
        setError("Security validation failed. Please try signing in again.");
        navigate("/?error=security_error");
      } else {
        setError(e.message || "An unexpected error occurred.");
      }
    } finally {
      processing.current = false;
    }
  }, [navigate, location, protocol]);

  useEffect(() => {
    handleAuth();
  }, [handleAuth]);

  if (error) {
    return (
      <div className="oauth-callback-container">
        <div className="oauth-callback-card">
          <h2 className="oauth-callback-error">Authentication Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-card">
        <div className="loading-spinner"></div>
        <p>Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
```

### OAuth Security Features

- **PKCE (Proof Key for Code Exchange)**: Mandatory for all OAuth providers
- **Account Selection**: Google OAuth forces account selection with `prompt=select_account`
- **Refresh Token Support**: Google OAuth includes `access_type=offline` for refresh tokens
- **State Parameter Validation**: CSRF protection with state parameter validation
- **Secure Redirect URIs**: Validates redirect URIs to prevent authorization code interception

## Error Handling

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

  async signUp(identifier: string): Promise<AuthResult> {
    // Custom registration logic
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