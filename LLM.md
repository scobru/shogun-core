# Shogun Core - LLM Documentation

## Overview

Shogun Core is a TypeScript SDK for building decentralized applications (dApps) with multiple authentication methods and peer-to-peer data storage using GunDB.

## Recent Improvements

### OAuth Enhancements (v1.5.19+)

- **Google Account Selection**: Fixed OAuth popup to force account selection with `prompt=select_account`
- **Complete User Data**: OAuth now returns full user profile including email, name, and picture
- **Enhanced Security**: Added `access_type=offline` for refresh token support
- **Type Safety**: Extended `AuthResult` interface to include OAuth user data
- **Deterministic Signatures**: Fixed Nostr signature generation for consistent authentication

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
    // Access OAuth user data
    if (callbackResult.user) {
      console.log("User email:", callbackResult.user.email);
      console.log("User name:", callbackResult.user.name);
      console.log("User picture:", callbackResult.user.picture);
      console.log("OAuth provider:", callbackResult.user.oauth?.provider);
    }
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

### OAuth Security Features

- **PKCE (Proof Key for Code Exchange)**: Mandatory for all OAuth providers
- **Account Selection**: Google OAuth forces account selection with `prompt=select_account`
- **Refresh Token Support**: Google OAuth includes `access_type=offline` for refresh tokens
- **State Parameter Validation**: CSRF protection with state parameter validation
- **Secure Redirect URIs**: Validates redirect URIs to prevent authorization code interception

## API Reference

### Core Methods

- `