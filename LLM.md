# Shogun Core - LLM Documentation

## Overview

Shogun Core is a TypeScript SDK for building decentralized applications (dApps) with multiple authentication methods and peer-to-peer data storage using GunDB.

## Core Features

- Multiple authentication: username/password, WebAuthn, Web3 (MetaMask), Nostr, OAuth
- Decentralized storage via GunDB
- Plugin-based architecture
- RxJS reactive programming
- End-to-end encryption
- Full TypeScript support
- PKCE OAuth flow for enhanced security
- Hardware key authentication (WebAuthn)
- Web3 wallet integration
- Nostr protocol support

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

### Authentication Methods

#### Traditional Login

```typescript
// Sign up
const signUpResult = await shogun.signUp("username", "password");
if (signUpResult.success) {
  console.log("User created:", signUpResult.username);
}

// Login
const loginResult = await shogun.login("username", "password");
if (loginResult.success) {
  console.log("Logged in as:", loginResult.username);
}
```

#### Web3 Authentication

```typescript
const web3Plugin = shogun.getPlugin("web3");
if (web3Plugin) {
  // Connect to MetaMask
  const connectionResult = await web3Plugin.connectMetaMask();
  if (connectionResult.success) {
    const address = connectionResult.address;
    
    // Login with Web3
    const loginResult = await web3Plugin.login(address);
    if (loginResult.success) {
      console.log("Web3 login successful");
    }
    
    // Sign up with Web3
    const signUpResult = await web3Plugin.signUp(address);
    if (signUpResult.success) {
      console.log("Web3 registration successful");
    }
  }
}
```

#### WebAuthn Authentication

```typescript
const webauthnPlugin = shogun.getPlugin("webauthn");
if (webauthnPlugin) {
  // Check if WebAuthn is supported
  if (webauthnPlugin.isSupported()) {
    // Register
    const signUpResult = await webauthnPlugin.signUp("username");
    if (signUpResult.success) {
      console.log("WebAuthn registration successful");
    }

    // Authenticate
    const loginResult = await webauthnPlugin.login("username");
    if (loginResult.success) {
      console.log("WebAuthn authentication successful");
    }
  }
}
```

#### OAuth Authentication

```typescript
const oauthPlugin = shogun.getPlugin("oauth");
if (oauthPlugin) {
  // Login with OAuth
  const loginResult = await oauthPlugin.login("google");
  if (loginResult.success && loginResult.redirectUrl) {
    // Redirect to OAuth provider
    window.location.href = loginResult.redirectUrl;
  }

  // Sign up with OAuth
  const signUpResult = await oauthPlugin.signUp("google");
  if (signUpResult.success && signUpResult.redirectUrl) {
    // Redirect to OAuth provider
    window.location.href = signUpResult.redirectUrl;
  }

  // Handle OAuth callback (in your callback component)
  const callbackResult = await oauthPlugin.handleOAuthCallback(
    "google", 
    authCode, 
    state
  );
  if (callbackResult.success) {
    console.log("OAuth authentication successful");
  }
}
```

#### Nostr Authentication

```typescript
const nostrPlugin = shogun.getPlugin("nostr");
if (nostrPlugin) {
  // Connect to Bitcoin wallet (Nostr extension)
  const connectionResult = await nostrPlugin.connectBitcoinWallet("nostr");
  if (connectionResult.success) {
    const address = connectionResult.address;
    
    // Login with Nostr
    const loginResult = await nostrPlugin.login(address);
    if (loginResult.success) {
      console.log("Nostr login successful");
    }
    
    // Sign up with Nostr
    const signUpResult = await nostrPlugin.signUp(address);
    if (signUpResult.success) {
      console.log("Nostr registration successful");
    }
  }
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

## API Reference

### Core Methods

- `login(username: string, password: string): Promise<AuthResult>`
- `loginWithPair(pair: ISEAPair): Promise<AuthResult>` - Login with GunDB pair directly
- `signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>`
- `logout(): void`
- `isLoggedIn(): boolean`
- `getIsLoggedIn(): boolean` - Alternative method to check login status
- `getPlugin<T>(name: string): T | undefined`
- `hasPlugin(name: string): boolean`
- `getAuthenticationMethod(type: AuthMethod): any` - Get auth method by type
- `on(eventName: string, listener: Function): this`
- `off(eventName: string, listener: Function): this`
- `once(eventName: string, listener: Function): this`
- `removeAllListeners(eventName?: string): this`
- `emit(eventName: string, data?: any): boolean`
- `getRecentErrors(count?: number): ShogunError[]`
- `updateUserAlias(newAlias: string): Promise<{success: boolean, error?: string}>`
- `savePair(): void` - Save current user credentials to storage
- `exportPair(): string` - Export user pair as JSON string
- `clearAllStorageData(): void` - Clear all Gun-related data (debug method)
- `setAuthMethod(method: AuthMethod): void`
- `getAuthMethod(): AuthMethod | undefined`

### Plugin Methods

#### Web3 Plugin

- `isAvailable(): boolean`
- `connectMetaMask(): Promise<ConnectionResult>`
- `login(address: string): Promise<AuthResult>`
- `signUp(address: string): Promise<AuthResult>`
- `getProvider(): Promise<ethers.Provider>`
- `getSigner(): Promise<ethers.Signer>`
- `cleanup(): void`

#### WebAuthn Plugin

- `isSupported(): boolean`
- `signUp(username: string): Promise<AuthResult>`
- `login(username: string): Promise<AuthResult>`
- `generateCredentials(username: string): Promise<WebAuthnUniformCredentials>`
- `createAccount(username: string, credentials: WebAuthnCredentials): Promise<CredentialResult>`
- `authenticateUser(username: string, salt: string): Promise<CredentialResult>`

#### Nostr Plugin

- `isAvailable(): boolean`
- `connectBitcoinWallet(type: "alby" | "nostr" | "manual"): Promise<ConnectionResult>`
- `login(address: string): Promise<AuthResult>`
- `signUp(address: string): Promise<AuthResult>`
- `generateCredentials(address: string, signature: string, message: string): Promise<NostrConnectorCredentials>`
- `cleanup(): void`

#### OAuth Plugin

- `isSupported(): boolean`
- `getAvailableProviders(): OAuthProvider[]`
- `login(provider: string): Promise<AuthResult>`
- `signUp(provider: string): Promise<AuthResult>`
- `handleOAuthCallback(provider: string, code: string, state: string): Promise<AuthResult>`
- `initiateOAuth(provider: string): Promise<OAuthConnectionResult>`
- `completeOAuth(provider: string, authCode: string, state: string): Promise<OAuthConnectionResult>`

## Configuration Interface

```typescript
interface ShogunSDKConfig {
  gunInstance?: IGunInstance<any>;
  peers?: string[];
  scope?: string;
  authToken?: string;
  appToken?: string;

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
    usePKCE?: boolean; // Mandatory for security
    allowUnsafeClientSecret?: boolean; // Required for Google OAuth
    providers?: Record<string, OAuthProviderConfig>;
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

interface OAuthProviderConfig {
  clientId: string;
  clientSecret?: string; // Required for Google even with PKCE
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  usePKCE?: boolean; // Force PKCE for security
}
```

## Security Best Practices

### OAuth Security

1. **Always use PKCE**: Enable `usePKCE: true` for all OAuth providers
2. **State parameter validation**: Always validate the state parameter in callbacks
3. **Secure redirect URIs**: Use HTTPS in production and validate redirect URIs
4. **Client secret handling**: For Google OAuth, client secret is required even with PKCE
5. **Timeout management**: Set appropriate state timeout (10 minutes recommended)

### WebAuthn Security

1. **Relying Party configuration**: Set proper `rpName` and `rpId`
2. **User verification**: Implement proper user verification flow
3. **Credential storage**: Handle credential storage securely

### Web3 Security

1. **Provider validation**: Always validate the Web3 provider
2. **Signature verification**: Verify signatures before authentication
3. **Address validation**: Validate Ethereum addresses

### General Security

1. **Error handling**: Never expose sensitive information in error messages
2. **Session management**: Implement proper session cleanup
3. **CSRF protection**: Use state parameters and validate requests
4. **Rate limiting**: Implement rate limiting for authentication attempts

## Event System

```typescript
// Authentication events
shogun.on("auth:login", (data) => {
  console.log("User logged in:", data.username);
});

shogun.on("auth:logout", () => {
  console.log("User logged out");
});

shogun.on("auth:signup", (data) => {
  console.log("New user signed up:", data.username);
});

// OAuth specific events
shogun.on("oauth:success", (data) => {
  console.log("OAuth authentication successful:", data.provider);
});

// Error events
shogun.on("error", (error) => {
  console.error("Shogun error:", error.message);
});
```

## Error Handling

```typescript
import { ShogunError, ErrorType } from "shogun-core";

try {
  await shogun.login("username", "password");
} catch (error) {
  if (error instanceof ShogunError) {
    switch (error.type) {
      case ErrorType.AUTHENTICATION_FAILED:
        console.error("Invalid credentials");
        break;
      case ErrorType.NETWORK_ERROR:
        console.error("Network connection failed");
        break;
      case ErrorType.OAUTH_ERROR:
        console.error("OAuth authentication failed");
        break;
      default:
        console.error("Unknown error:", error.message);
    }
  }
}
```

## Browser Usage (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>
<script src="https://cdn.jsdelivr.net/npm/shogun-core/dist/browser/shogun-core.js"></script>

<script>
  const shogun = initShogun({
    peers: ["https://gun-manhattan.herokuapp.com/gun"],
    scope: "my-browser-app",
    web3: { enabled: true },
    webauthn: {
      enabled: true,
      rpName: "My Browser dApp",
      rpId: window.location.hostname,
    },
    oauth: {
      enabled: true,
      usePKCE: true,
      providers: {
        google: {
          clientId: "YOUR_CLIENT_ID",
          redirectUri: "http://localhost:3000/auth/callback",
          scope: ["openid", "email", "profile"],
        },
      },
    },
  });
</script>
```

## Common Use Cases

### 1. Simple Authentication Setup

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
});
await shogun.initialize();
```

### 2. Web3 Wallet Integration

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-dapp",
  web3: { enabled: true },
});

// Usage
const web3Plugin = shogun.getPlugin("web3");
if (web3Plugin && web3Plugin.isAvailable()) {
  const connectionResult = await web3Plugin.connectMetaMask();
  if (connectionResult.success) {
    await web3Plugin.login(connectionResult.address);
  }
}
```

### 3. Multi-Auth Application

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "my-app",
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: "My App",
    rpId: window.location.hostname,
  },
  oauth: {
    enabled: true,
    usePKCE: true,
    allowUnsafeClientSecret: true,
    providers: {
      google: { 
        clientId: "YOUR_ID",
        clientSecret: "YOUR_SECRET",
        redirectUri: "http://localhost:3000/auth/callback",
      },
    },
  },
  nostr: { enabled: true },
});

// Usage examples
const web3Plugin = shogun.getPlugin("web3");
const webauthnPlugin = shogun.getPlugin("webauthn");
const oauthPlugin = shogun.getPlugin("oauth");
const nostrPlugin = shogun.getPlugin("nostr");

// Web3 authentication
if (web3Plugin?.isAvailable()) {
  const connectionResult = await web3Plugin.connectMetaMask();
  if (connectionResult.success) {
    await web3Plugin.login(connectionResult.address);
  }
}

// WebAuthn authentication
if (webauthnPlugin?.isSupported()) {
  await webauthnPlugin.login("username");
}

// OAuth authentication
if (oauthPlugin?.isSupported()) {
  const result = await oauthPlugin.login("google");
  if (result.success && result.redirectUrl) {
    window.location.href = result.redirectUrl;
  }
}

// Nostr authentication
if (nostrPlugin?.isAvailable()) {
  const connectionResult = await nostrPlugin.connectBitcoinWallet("nostr");
  if (connectionResult.success) {
    await nostrPlugin.login(connectionResult.address);
  }
}
```

### 4. OAuth-Only Application

```typescript
const shogun = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "oauth-app",
  oauth: {
    enabled: true,
    usePKCE: true,
    allowUnsafeClientSecret: true,
    stateTimeout: 10 * 60 * 1000,
    providers: {
      google: {
        clientId: "YOUR_CLIENT_ID",
        clientSecret: "YOUR_CLIENT_SECRET",
        redirectUri: "http://localhost:3000/auth/callback",
        scope: ["openid", "email", "profile"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        usePKCE: true,
      },
    },
  },
});
```

## Troubleshooting

### OAuth Issues

1. **"Parameter not allowed for this message type: action"**: Don't add custom parameters to OAuth URLs
2. **"invalid_request"**: Check your OAuth configuration and redirect URIs
3. **"state parameter expired"**: Increase stateTimeout or handle timeouts gracefully

### WebAuthn Issues

1. **"NotSupportedError"**: Check browser compatibility
2. **"SecurityError"**: Verify rpId configuration
3. **"InvalidStateError"**: Handle user cancellation gracefully

### Web3 Issues

1. **"No provider found"**: Check if MetaMask is installed
2. **"User rejected"**: Handle user rejection gracefully
3. **"Network error"**: Check network connectivity

### Nostr Issues

1. **"Extension not found"**: Check if Nostr extension is installed
2. **"Connection failed"**: Verify wallet connection
3. **"Signature verification failed"**: Check signature validation

## Dependencies

- ethers: ^6.13.5
- rxjs: ^7.8.1
- GunDB (peer-to-peer database)
- TypeScript: ^5.8.2

## Version Information

- **API Version**: ^1.5.1
- **Current Version**: 1.5.19