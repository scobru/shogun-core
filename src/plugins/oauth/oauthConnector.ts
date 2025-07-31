/**
 * OAuth Connector - Secure version for GunDB user creation
 */
import { EventEmitter } from "../../utils/eventEmitter";
import {
  OAuthConfig,
  OAuthProvider,
  OAuthUserInfo,
  OAuthCredentials,
  OAuthConnectionResult,
  OAuthCache,
  OAuthProviderConfig,
} from "./types";
import derive from "../../gundb/derive";
import {
  generateUsernameFromIdentity,
  generateDeterministicPassword,
} from "../../utils/validation";
import { ethers } from "ethers";

/**
 * OAuth Connector
 */
export class OAuthConnector extends EventEmitter {
  private readonly DEFAULT_CONFIG: Partial<OAuthConfig> = {
    providers: {
      google: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["openid", "email", "profile"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        usePKCE: true, // Forza PKCE per Google
      },
      github: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["user:email"],
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userInfoUrl: "https://api.github.com/user",
        usePKCE: true,
      },
      discord: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["identify", "email"],
        authUrl: "https://discord.com/api/oauth2/authorize",
        tokenUrl: "https://discord.com/api/oauth2/token",
        userInfoUrl: "https://discord.com/api/users/@me",
        usePKCE: true,
      },
      twitter: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["tweet.read", "users.read"],
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        userInfoUrl: "https://api.twitter.com/2/users/me",
        usePKCE: true,
      },
      custom: {
        clientId: "",
        redirectUri: "",
        scope: [],
        authUrl: "",
        tokenUrl: "",
        userInfoUrl: "",
        usePKCE: true,
      },
    },
    usePKCE: true, // PKCE abilitato di default per sicurezza
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    allowUnsafeClientSecret: false, // Disabilitato per sicurezza
    stateTimeout: 10 * 60 * 1000, // 10 minuti per il timeout dello state
  };

  private config: Partial<OAuthConfig>;
  private readonly userCache: Map<string, OAuthCache> = new Map();
  // Fallback storage for Node.js environment
  private readonly memoryStorage: Map<string, string> = new Map();

  constructor(config: Partial<OAuthConfig> = {}) {
    super();
    this.config = {
      ...this.DEFAULT_CONFIG,
      ...config,
      providers: {
        ...(this.DEFAULT_CONFIG.providers || {}),
        ...(config.providers || {}),
      },
    };

    // Validazione di sicurezza post-costruzione
    this.validateSecurityConfig();
  }

  /**
   * Validates security configuration
   */
  private validateSecurityConfig(): void {
    const providers = this.config.providers || {};

    for (const [providerName, providerConfig] of Object.entries(providers)) {
      if (!providerConfig) continue;

      // Verify that PKCE is enabled for all providers in browser
      if (typeof window !== "undefined" && !providerConfig.usePKCE) {
        console.warn(
          `Provider ${providerName} does not have PKCE enabled - not secure for browser`,
        );
        // Force PKCE for all providers in browser, except if already configured differently
        providerConfig.usePKCE = true;
      }

      // Verify that there is no client_secret in browser (except Google with PKCE)
      if (typeof window !== "undefined" && providerConfig.clientSecret) {
        if (providerName === "google" && providerConfig.usePKCE) {
          console.log(
            `Provider ${providerName} has client_secret configured - OK for Google with PKCE`,
          );
        } else {
          console.error(
            `Provider ${providerName} has client_secret configured in browser - REMOVE IMMEDIATELY`,
          );
          // Remove client_secret for security in browser
          delete providerConfig.clientSecret;
          console.log(
            `Provider ${providerName} client_secret removed for security in browser`,
          );
        }
      }
    }
  }

  /**
   * Update the connector configuration
   * @param config - New configuration options
   */
  updateConfig(config: Partial<OAuthConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      providers: {
        ...(this.config.providers || {}),
        ...(config.providers || {}),
      },
    };
    console.log("OAuthConnector configuration updated", this.config);
  }

  /**
   * Get origin URL (browser or Node.js compatible)
   */
  private getOrigin(): string {
    if (typeof window !== "undefined" && window.location) {
      return window.location.origin;
    }
    // Fallback for Node.js environment
    return "http://localhost:3000";
  }

  /**
   * Storage abstraction (browser sessionStorage or Node.js Map)
   */
  private setItem(key: string, value: string): void {
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined"
    ) {
      sessionStorage.setItem(key, value);
    } else {
      this.memoryStorage.set(key, value);
    }
  }

  private getItem(key: string): string | null {
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined"
    ) {
      return sessionStorage.getItem(key);
    } else {
      return this.memoryStorage.get(key) || null;
    }
  }

  private removeItem(key: string): void {
    if (
      typeof window !== "undefined" &&
      typeof sessionStorage !== "undefined"
    ) {
      sessionStorage.removeItem(key);
    } else {
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Check if OAuth is supported
   */
  isSupported(): boolean {
    // In Node.js, we can still demonstrate the functionality
    return typeof URLSearchParams !== "undefined";
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[] {
    return Object.keys(this.config.providers || {}).filter(
      (provider) => this.config.providers![provider as OAuthProvider]?.clientId,
    ) as OAuthProvider[];
  }

  /**
   * Generate PKCE challenge for secure OAuth flow
   */
  private async generatePKCEChallenge(): Promise<{
    codeVerifier: string;
    codeChallenge: string;
  }> {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.calculatePKCECodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge };
  }

  /**
   * Calculate the PKCE code challenge from a code verifier.
   * Hashes the verifier using SHA-256 and then base64url encodes it.
   * @param verifier The code verifier string.
   * @returns The base64url-encoded SHA-256 hash of the verifier.
   */
  private async calculatePKCECodeChallenge(verifier: string): Promise<string> {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle
    ) {
      // Browser environment
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      return this.base64urlEncode(hashBuffer);
    } else {
      // Node.js environment
      const crypto = require("crypto");
      const hash = crypto.createHash("sha256").update(verifier).digest();
      return this.base64urlEncode(hash);
    }
  }

  /**
   * Encodes a buffer into a Base64URL-encoded string.
   * @param buffer The buffer to encode.
   * @returns The Base64URL-encoded string.
   */
  private base64urlEncode(buffer: ArrayBuffer | Buffer): string {
    let base64string: string;

    // In Node.js, we can use the Buffer object. In the browser, we need a different approach.
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
      // Node.js path
      base64string = buffer.toString("base64");
    } else {
      // Browser path (assuming ArrayBuffer)
      const bytes = new Uint8Array(buffer as ArrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64string = window.btoa(binary);
    }

    return base64string
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    let randomValues: Uint8Array;

    if (typeof window !== "undefined" && window.crypto) {
      // Browser environment
      randomValues = new Uint8Array(length);
      window.crypto.getRandomValues(randomValues);
    } else {
      // Node.js environment
      const crypto = require("crypto");
      randomValues = new Uint8Array(crypto.randomBytes(length));
    }

    return Array.from(randomValues)
      .map((value) => charset[value % charset.length])
      .join("");
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult> {
    const providerConfig = this.config.providers?.[provider];
    if (!providerConfig) {
      const errorMsg = `Provider '${provider}' is not configured.`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Validazione di sicurezza pre-inizializzazione
    if (typeof window !== "undefined" && providerConfig.clientSecret) {
      // Google OAuth richiede client_secret anche con PKCE
      if (provider === "google" && providerConfig.usePKCE) {
        console.log(
          `Provider ${provider} has client_secret configured - OK for Google with PKCE`,
        );
      } else {
        const errorMsg = `Client secret cannot be used in browser for ${provider}`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    }

    try {
      const state = this.generateRandomString(32);
      const stateTimestamp = Date.now();

      // Salva state con timestamp per validazione timeout
      this.setItem(`oauth_state_${provider}`, state);
      this.setItem(
        `oauth_state_timestamp_${provider}`,
        stateTimestamp.toString(),
      );

      let authUrl = providerConfig.authUrl;
      const authParams = new URLSearchParams({
        client_id: providerConfig.clientId,
        redirect_uri: providerConfig.redirectUri,
        response_type: "code",
        state,
      });

      // Add scope if configured
      if (providerConfig.scope && providerConfig.scope.length > 0) {
        authParams.set("scope", providerConfig.scope.join(" "));
      }

      // Add Google-specific parameters for better UX
      if (provider === "google") {
        authParams.set("prompt", "select_account"); // Force account selection
        authParams.set("access_type", "offline"); // Get refresh token
        authParams.set("include_granted_scopes", "true"); // Include previously granted scopes
      }

      // PKCE è obbligatorio per sicurezza
      const isPKCEEnabled =
        providerConfig.usePKCE ?? this.config.usePKCE ?? true;
      if (!isPKCEEnabled && typeof window !== "undefined") {
        const errorMsg = `PKCE is required for ${provider} in browser for security reasons`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (isPKCEEnabled) {
        console.log("PKCE is enabled, generating challenge...");
        const { codeVerifier, codeChallenge } =
          await this.generatePKCEChallenge();
        console.log(
          `Generated code verifier: ${codeVerifier.substring(0, 10)}... (length: ${codeVerifier.length})`,
        );
        console.log(
          `Generated code challenge: ${codeChallenge.substring(0, 10)}... (length: ${codeChallenge.length})`,
        );

        this.setItem(`oauth_verifier_${provider}`, codeVerifier);
        this.setItem(
          `oauth_verifier_timestamp_${provider}`,
          stateTimestamp.toString(),
        );
        console.log(
          `Saved code verifier to storage with key: oauth_verifier_${provider}`,
        );

        authParams.set("code_challenge", codeChallenge);
        authParams.set("code_challenge_method", "S256");
        console.log("Added PKCE parameters to auth URL");
      }

      // If the authorization URL already contains query parameters, add the new parameters
      if (authUrl.includes("?")) {
        authUrl = `${authUrl}&${authParams.toString()}`;
      } else {
        authUrl = `${authUrl}?${authParams.toString()}`;
      }

      this.emit("oauth_initiated", { provider, authUrl });

      return {
        success: true,
        provider,
        authUrl,
      };
    } catch (error: any) {
      console.error(`Error initiating OAuth with ${provider}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Complete OAuth flow
   */
  async completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<OAuthConnectionResult> {
    const providerConfig = this.config.providers?.[provider];
    if (!providerConfig) {
      const errorMsg = `Provider '${provider}' is not configured.`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const tokenData = await this.exchangeCodeForToken(
        provider,
        providerConfig,
        authCode,
        state,
      );

      if (!tokenData.access_token) {
        const errorMsg = "No access token received from provider";
        console.error(errorMsg, tokenData);
        return { success: false, error: errorMsg };
      }

      const userInfo = await this.fetchUserInfo(
        provider,
        providerConfig,
        tokenData.access_token,
      );

      // Cache user info
      this.cacheUserInfo(userInfo.id, provider, userInfo);

      // Generate credentials
      const credentials = await this.generateCredentials(userInfo, provider);

      this.emit("oauth_completed", { provider, userInfo, credentials });

      return {
        success: true,
        provider,
        userInfo,
      };
    } catch (error: any) {
      console.error(`Error completing OAuth with ${provider}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate credentials from OAuth user info
   * Ora restituisce anche la chiave GunDB derivata (key)
   */
  async generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider,
  ): Promise<OAuthCredentials & { key: any }> {
    const providerConfig = this.config.providers?.[provider];
    if (!providerConfig) {
      throw new Error(`Provider ${provider} is not configured.`);
    }

    // Username uniforme
    const username = generateUsernameFromIdentity(provider, userInfo);

    try {
      console.log(
        `Generating credentials for ${provider} user: ${userInfo.id}`,
      );

      const saltData = `${userInfo.id}_${provider}_${userInfo.email || "no-email"}`;
      const salt = ethers.keccak256(ethers.toUtf8Bytes(saltData));
      // Password deterministica (compatibilità)
      const password = generateDeterministicPassword(salt);
      // Deriva la chiave GunDB
      const key = await derive(password, salt, { includeP256: true });

      const credentials: OAuthCredentials & { key: any } = {
        username,
        password,
        provider,
        key,
      };

      this.cacheUserInfo(userInfo.id, provider, userInfo);
      console.log("OAuth credentials generated successfully");
      return credentials;
    } catch (error: any) {
      console.error("Error generating OAuth credentials:", error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    provider: OAuthProvider,
    providerConfig: OAuthProviderConfig,
    code: string,
    state?: string,
  ): Promise<any> {
    const storedState = this.getItem(`oauth_state_${provider}`);
    const storedStateTimestamp = this.getItem(
      `oauth_state_timestamp_${provider}`,
    );

    if (!state || !storedState || state !== storedState) {
      this.removeItem(`oauth_state_${provider}`);
      this.removeItem(`oauth_state_timestamp_${provider}`);
      throw new Error("Invalid state parameter or expired");
    }

    // Validazione del timestamp dello state
    if (storedStateTimestamp) {
      const stateTimestamp = parseInt(storedStateTimestamp, 10);
      const stateTimeout = this.config.stateTimeout || 10 * 60 * 1000; // Default 10 minuti
      if (Date.now() - stateTimestamp > stateTimeout) {
        this.removeItem(`oauth_state_${provider}`);
        this.removeItem(`oauth_state_timestamp_${provider}`);
        throw new Error("State parameter expired");
      }
    }

    this.removeItem(`oauth_state_${provider}`);
    this.removeItem(`oauth_state_timestamp_${provider}`);

    const tokenParams: Record<string, string> = {
      client_id: providerConfig.clientId,
      code: code,
      redirect_uri: providerConfig.redirectUri,
      grant_type: "authorization_code",
    };

    // Check for PKCE first
    const isPKCEEnabled = providerConfig.usePKCE ?? this.config.usePKCE;
    if (isPKCEEnabled) {
      console.log("PKCE enabled, retrieving code verifier...");

      // Debug: Show all oauth-related keys in sessionStorage
      if (typeof sessionStorage !== "undefined") {
        const oauthKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("oauth_")) {
            oauthKeys.push(key);
          }
        }
        console.log("OAuth keys in sessionStorage:", oauthKeys);
      }

      const verifier = this.getItem(`oauth_verifier_${provider}`);
      const verifierTimestamp = this.getItem(
        `oauth_verifier_timestamp_${provider}`,
      );
      console.log(
        `Looking for key: oauth_verifier_${provider}, found:`,
        !!verifier,
      );
      if (verifier && verifierTimestamp) {
        const verifierTimestampInt = parseInt(verifierTimestamp, 10);
        const stateTimeout = this.config.stateTimeout || 10 * 60 * 1000; // Default 10 minuti
        if (Date.now() - verifierTimestampInt > stateTimeout) {
          console.warn(`Code verifier expired for PKCE flow for ${provider}`);
          this.removeItem(`oauth_verifier_${provider}`);
          this.removeItem(`oauth_verifier_timestamp_${provider}`);
          throw new Error("Code verifier expired");
        }
        console.log(
          `Found code verifier for PKCE flow: ${verifier.substring(0, 10)}... (length: ${verifier.length})`,
        );
        tokenParams.code_verifier = verifier;
      } else {
        // Fallback: prova a generare un nuovo verifier (non ideale ma funziona per test)
        console.warn(
          "PKCE enabled but no code verifier found. Attempting fallback...",
        );
        try {
          const { codeVerifier } = await this.generatePKCEChallenge();
          tokenParams.code_verifier = codeVerifier;
          console.log("Generated fallback code verifier");
        } catch (fallbackError) {
          throw new Error(
            "PKCE enabled but no code verifier found and fallback failed",
          );
        }
      }
    } else {
      // PKCE non abilitato - non sicuro per browser
      if (typeof window !== "undefined") {
        throw new Error(
          "PKCE is required for browser applications. Client secret cannot be used in browser.",
        );
      }

      // Solo per ambiente Node.js con client_secret
      if (
        providerConfig.clientSecret &&
        providerConfig.clientSecret.trim() !== ""
      ) {
        tokenParams.client_secret = providerConfig.clientSecret;
        console.log("Using client_secret for server-side OAuth flow");
      } else {
        throw new Error(
          "Client secret is required when PKCE is not enabled for server-side flows.",
        );
      }
    }

    // Google OAuth richiede client_secret anche con PKCE
    // Questo è un comportamento specifico di Google, non una vulnerabilità
    if (
      provider === "google" &&
      providerConfig.clientSecret &&
      providerConfig.clientSecret.trim() !== ""
    ) {
      tokenParams.client_secret = providerConfig.clientSecret;
      console.log(
        "Adding client_secret for Google OAuth (required even with PKCE)",
      );
    }

    // Clean up verifier
    this.removeItem(`oauth_verifier_${provider}`);
    this.removeItem(`oauth_verifier_timestamp_${provider}`);

    const urlParams = new URLSearchParams(tokenParams);
    console.log("Request body keys:", Array.from(urlParams.keys()));

    const response = await fetch(providerConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlParams.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
      );
    }

    return await response.json();
  }

  /**
   * Fetch user info from provider
   */
  private async fetchUserInfo(
    provider: OAuthProvider,
    providerConfig: OAuthProviderConfig,
    accessToken: string,
  ): Promise<OAuthUserInfo> {
    const response = await fetch(providerConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user info: ${response.status} ${response.statusText}`,
      );
    }

    const userData = await response.json();
    return this.normalizeUserInfo(userData, provider);
  }

  /**
   * Normalize user info from different providers
   */
  private normalizeUserInfo(
    userData: any,
    provider: OAuthProvider,
  ): OAuthUserInfo {
    switch (provider) {
      case "google":
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider,
        };
      case "github":
        return {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name || userData.login,
          picture: userData.avatar_url,
          provider,
        };
      case "discord":
        return {
          id: userData.id,
          email: userData.email,
          name: userData.username,
          picture: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
          provider,
        };
      case "twitter":
        return {
          id: userData.data.id,
          email: userData.data.email,
          name: userData.data.name,
          picture: userData.data.profile_image_url,
          provider,
        };
      default:
        return {
          id: userData.id?.toString() || "",
          email: userData.email || "",
          name: userData.name || "",
          picture: userData.picture || userData.avatar_url || "",
          provider,
        };
    }
  }

  /**
   * Cache user info
   */
  private cacheUserInfo(
    userId: string,
    provider: OAuthProvider,
    userInfo: OAuthUserInfo,
  ): void {
    const cacheKey = `${provider}_${userId}`;
    const cacheEntry: OAuthCache = {
      data: userInfo,
      provider,
      userId,
      timestamp: Date.now(),
    };

    this.userCache.set(cacheKey, cacheEntry);

    // Salva solo dati minimi in localStorage (solo se disponibile)
    try {
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        const minimalCacheEntry = {
          userId: userInfo.id,
          provider,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `shogun_oauth_user_${cacheKey}`,
          JSON.stringify(minimalCacheEntry),
        );
      }
    } catch (error) {
      console.warn("Failed to persist user info in localStorage:", error);
    }
  }

  /**
   * Get cached user info
   */
  getCachedUserInfo(
    userId: string,
    provider: OAuthProvider,
  ): OAuthUserInfo | null {
    const cacheKey = `${provider}_${userId}`;

    // First check memory cache
    const cached = this.userCache.get(cacheKey);
    if (cached) {
      // Check if cache is still valid
      if (
        this.config.cacheDuration &&
        Date.now() - cached.timestamp <= this.config.cacheDuration
      ) {
        return cached.data || null;
      }
    }

    // Then check localStorage (solo se disponibile)
    try {
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        const localCached = localStorage.getItem(
          `shogun_oauth_user_${cacheKey}`,
        );
        if (localCached) {
          const parsedCache = JSON.parse(localCached);
          if (
            this.config.cacheDuration &&
            Date.now() - parsedCache.timestamp <= this.config.cacheDuration
          ) {
            // Update memory cache
            this.userCache.set(cacheKey, parsedCache);
            return parsedCache.userInfo;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to read user info from localStorage:", error);
    }

    return null;
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId?: string, provider?: OAuthProvider): void {
    if (userId && provider) {
      const cacheKey = `${provider}_${userId}`;
      this.userCache.delete(cacheKey);
      try {
        if (
          typeof window !== "undefined" &&
          typeof localStorage !== "undefined"
        ) {
          localStorage.removeItem(`shogun_oauth_user_${cacheKey}`);
        }
      } catch (error) {
        console.warn("Failed to remove user info from localStorage:", error);
      }
    } else {
      // Clear all cache
      this.userCache.clear();
      try {
        if (
          typeof window !== "undefined" &&
          typeof localStorage !== "undefined"
        ) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("shogun_oauth_user_")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }
      } catch (error) {
        console.warn("Failed to clear user info from localStorage:", error);
      }
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.removeAllListeners();
    this.userCache.clear();
    this.cleanupExpiredOAuthData();
  }

  /**
   * Clean up expired OAuth data from storage
   */
  private cleanupExpiredOAuthData(): void {
    const stateTimeout = this.config.stateTimeout || 10 * 60 * 1000;
    const currentTime = Date.now();

    // Clean sessionStorage
    if (typeof sessionStorage !== "undefined") {
      const keysToRemove: string[] = [];

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("oauth_state_timestamp_")) {
          const timestamp = sessionStorage.getItem(key);
          if (timestamp) {
            const stateTime = parseInt(timestamp, 10);
            if (currentTime - stateTime > stateTimeout) {
              const stateKey = key.replace("_timestamp", "");
              keysToRemove.push(key, stateKey);
            }
          }
        }

        if (key && key.startsWith("oauth_verifier_timestamp_")) {
          const timestamp = sessionStorage.getItem(key);
          if (timestamp) {
            const verifierTime = parseInt(timestamp, 10);
            if (currentTime - verifierTime > stateTimeout) {
              const verifierKey = key.replace("_timestamp", "");
              keysToRemove.push(key, verifierKey);
            }
          }
        }
      }

      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired OAuth entries`);
      }
    }

    // Clean memoryStorage (Node.js)
    const memoryKeysToRemove: string[] = [];
    for (const [key, value] of this.memoryStorage.entries()) {
      if (
        key.startsWith("oauth_state_timestamp_") ||
        key.startsWith("oauth_verifier_timestamp_")
      ) {
        const timestamp = parseInt(value, 10);
        if (currentTime - timestamp > stateTimeout) {
          const baseKey = key.replace("_timestamp", "");
          memoryKeysToRemove.push(key, baseKey);
        }
      }
    }

    memoryKeysToRemove.forEach((key) => this.memoryStorage.delete(key));
    if (memoryKeysToRemove.length > 0) {
      console.log(
        `Cleaned up ${memoryKeysToRemove.length} expired OAuth entries from memory`,
      );
    }
  }
}
