/**
 * OAuth Connector - Simple version for GunDB user creation
 */
import { logDebug, logError, logWarn } from "../../utils/logger";
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
      },
      github: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["user:email"],
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userInfoUrl: "https://api.github.com/user",
      },
      discord: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["identify", "email"],
        authUrl: "https://discord.com/api/oauth2/authorize",
        tokenUrl: "https://discord.com/api/oauth2/token",
        userInfoUrl: "https://discord.com/api/users/@me",
      },
      twitter: {
        clientId: "",
        redirectUri: `${this.getOrigin()}/auth/callback`,
        scope: ["tweet.read", "users.read"],
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        userInfoUrl: "https://api.twitter.com/2/users/me",
      },
      custom: {
        clientId: "",
        redirectUri: "",
        scope: [],
        authUrl: "",
        tokenUrl: "",
        userInfoUrl: "",
      },
    },
    usePKCE: true,
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    allowUnsafeClientSecret: true, // New flag to allow client_secret in localhost
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
    logDebug("OAuthConnector configuration updated", this.config);
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
      logError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const state = this.generateRandomString(32);
      this.setItem(`oauth_state_${provider}`, state);

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

      // Add PKCE if enabled
      if (providerConfig.usePKCE ?? this.config.usePKCE) {
        const { codeVerifier, codeChallenge } =
          await this.generatePKCEChallenge();
        this.setItem(`oauth_verifier_${provider}`, codeVerifier);
        authParams.set("code_challenge", codeChallenge);
        authParams.set("code_challenge_method", "S256");
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
      logError(`Error initiating OAuth with ${provider}:`, error);
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
    appToken?: string | null,
  ): Promise<OAuthConnectionResult> {
    const providerConfig = this.config.providers?.[provider];
    if (!providerConfig) {
      const errorMsg = `Provider '${provider}' is not configured.`;
      logError(errorMsg);
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
        logError(errorMsg, tokenData);
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
      const credentials = await this.generateCredentials(
        userInfo,
        provider,
        appToken || "",
      );

      this.emit("oauth_completed", { provider, userInfo, credentials });

      return {
        success: true,
        provider,
        userInfo,
      };
    } catch (error: any) {
      logError(`Error completing OAuth with ${provider}:`, error);
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
    appToken: string,
  ): Promise<OAuthCredentials & { key: any }> {
    const providerConfig = this.config.providers?.[provider];
    if (!providerConfig) {
      throw new Error(`Provider ${provider} is not configured.`);
    }

    // Username uniforme
    const username = generateUsernameFromIdentity(provider, userInfo);

    try {
      logDebug(`Generating credentials for ${provider} user: ${userInfo.id}`);

      // Salt deterministico per la derivazione della chiave
      const salt = `${userInfo.id}_${provider}_${userInfo.email}_shogun_oauth_${appToken}`;
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
      logDebug("OAuth credentials generated successfully");
      return credentials;
    } catch (error: any) {
      logError("Error generating OAuth credentials:", error);
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
    if (state && storedState !== state) {
      this.removeItem(`oauth_state_${provider}`); // Cleanup anche in caso di errore
      throw new Error("Invalid state parameter");
    }
    this.removeItem(`oauth_state_${provider}`); // Cleanup dopo validazione

    const tokenParams: Record<string, string> = {
      client_id: providerConfig.clientId,
      code: code,
      redirect_uri: providerConfig.redirectUri,
      grant_type: "authorization_code",
    };

    // Check for PKCE first
    const isPKCEEnabled = providerConfig.usePKCE ?? this.config.usePKCE;
    if (isPKCEEnabled) {
      logDebug("PKCE enabled, retrieving code verifier...");

      // Debug: Show all oauth-related keys in sessionStorage
      if (typeof sessionStorage !== "undefined") {
        const oauthKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("oauth_")) {
            oauthKeys.push(key);
          }
        }
        logDebug("OAuth keys in sessionStorage:", oauthKeys);
      }

      const verifier = this.getItem(`oauth_verifier_${provider}`);
      logDebug(
        `Looking for key: oauth_verifier_${provider}, found:`,
        !!verifier,
      );
      if (verifier) {
        logDebug(
          `Found code verifier for PKCE flow: ${verifier.substring(0, 10)}... (length: ${verifier.length})`,
        );
        tokenParams.code_verifier = verifier;
      } else {
        throw new Error("PKCE enabled but no code verifier found");
      }
    } else if (
      providerConfig.clientSecret &&
      providerConfig.clientSecret.trim() !== "" &&
      this.config.allowUnsafeClientSecret &&
      typeof window === "undefined"
    ) {
      // Solo Node.js/server
      tokenParams.client_secret = providerConfig.clientSecret;
    } else if (providerConfig.clientSecret && typeof window !== "undefined") {
      throw new Error(
        "Client secret must never be used in browser environments.",
      );
    } else {
      logWarn(
        "Client secret is required when PKCE is not enabled. Please enable PKCE or configure a client secret.",
      );
    }

    // Clean up verifier
    this.removeItem(`oauth_verifier_${provider}`);

    // Debug: Log what we're sending (maschera dati sensibili in produzione)
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV !== "production"
    ) {
      logDebug(
        "Token exchange parameters:",
        JSON.stringify(
          {
            ...tokenParams,
            code_verifier: tokenParams.code_verifier ? "***" : undefined,
            client_secret: tokenParams.client_secret ? "***" : undefined,
          },
          null,
          2,
        ),
      );
    }
    logDebug("PKCE enabled:", isPKCEEnabled);
    logDebug("Has code_verifier:", !!tokenParams.code_verifier);
    logDebug("Has client_secret:", !!tokenParams.client_secret);

    const urlParams = new URLSearchParams(tokenParams);
    logDebug("Request body keys:", Array.from(urlParams.keys()));
    logDebug("Request body has code_verifier:", urlParams.has("code_verifier"));
    logDebug("Request body has client_secret:", urlParams.has("client_secret"));

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

    // Salva solo dati minimi in localStorage
    try {
      const minimalCacheEntry = {
        userId: userInfo.id,
        provider,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `shogun_oauth_user_${cacheKey}`,
        JSON.stringify(minimalCacheEntry),
      );
    } catch (error) {
      logWarn("Failed to persist user info in localStorage:", error);
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

    // Then check localStorage
    try {
      const localCached = localStorage.getItem(`shogun_oauth_user_${cacheKey}`);
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
    } catch (error) {
      logWarn("Failed to read user info from localStorage:", error);
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
        localStorage.removeItem(`shogun_oauth_user_${cacheKey}`);
      } catch (error) {
        logWarn("Failed to remove user info from localStorage:", error);
      }
    } else {
      // Clear all cache
      this.userCache.clear();
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("shogun_oauth_user_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        logWarn("Failed to clear user info from localStorage:", error);
      }
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.removeAllListeners();
    this.userCache.clear();
  }
}
