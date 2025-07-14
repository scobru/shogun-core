"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthConnector = void 0;
/**
 * OAuth Connector - Simple version for GunDB user creation
 */
const logger_1 = require("../../utils/logger");
const eventEmitter_1 = require("../../utils/eventEmitter");
const derive_1 = __importDefault(require("../../gundb/derive"));
const validation_1 = require("../../utils/validation");
/**
 * OAuth Connector
 */
class OAuthConnector extends eventEmitter_1.EventEmitter {
    DEFAULT_CONFIG = {
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
    config;
    userCache = new Map();
    // Fallback storage for Node.js environment
    memoryStorage = new Map();
    constructor(config = {}) {
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
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config,
            providers: {
                ...(this.config.providers || {}),
                ...(config.providers || {}),
            },
        };
        (0, logger_1.logDebug)("OAuthConnector configuration updated", this.config);
    }
    /**
     * Get origin URL (browser or Node.js compatible)
     */
    getOrigin() {
        if (typeof window !== "undefined" && window.location) {
            return window.location.origin;
        }
        // Fallback for Node.js environment
        return "http://localhost:3000";
    }
    /**
     * Storage abstraction (browser sessionStorage or Node.js Map)
     */
    setItem(key, value) {
        if (typeof window !== "undefined" &&
            typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(key, value);
        }
        else {
            this.memoryStorage.set(key, value);
        }
    }
    getItem(key) {
        if (typeof window !== "undefined" &&
            typeof sessionStorage !== "undefined") {
            return sessionStorage.getItem(key);
        }
        else {
            return this.memoryStorage.get(key) || null;
        }
    }
    removeItem(key) {
        if (typeof window !== "undefined" &&
            typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(key);
        }
        else {
            this.memoryStorage.delete(key);
        }
    }
    /**
     * Check if OAuth is supported
     */
    isSupported() {
        // In Node.js, we can still demonstrate the functionality
        return typeof URLSearchParams !== "undefined";
    }
    /**
     * Get available OAuth providers
     */
    getAvailableProviders() {
        return Object.keys(this.config.providers || {}).filter((provider) => this.config.providers[provider]?.clientId);
    }
    /**
     * Generate PKCE challenge for secure OAuth flow
     */
    async generatePKCEChallenge() {
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
    async calculatePKCECodeChallenge(verifier) {
        if (typeof window !== "undefined" &&
            window.crypto &&
            window.crypto.subtle) {
            // Browser environment
            const encoder = new TextEncoder();
            const data = encoder.encode(verifier);
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
            return this.base64urlEncode(hashBuffer);
        }
        else {
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
    base64urlEncode(buffer) {
        let base64string;
        // In Node.js, we can use the Buffer object. In the browser, we need a different approach.
        if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
            // Node.js path
            base64string = buffer.toString("base64");
        }
        else {
            // Browser path (assuming ArrayBuffer)
            const bytes = new Uint8Array(buffer);
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
    generateRandomString(length) {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        let randomValues;
        if (typeof window !== "undefined" && window.crypto) {
            // Browser environment
            randomValues = new Uint8Array(length);
            window.crypto.getRandomValues(randomValues);
        }
        else {
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
    async initiateOAuth(provider) {
        const providerConfig = this.config.providers?.[provider];
        if (!providerConfig) {
            const errorMsg = `Provider '${provider}' is not configured.`;
            (0, logger_1.logError)(errorMsg);
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
                const { codeVerifier, codeChallenge } = await this.generatePKCEChallenge();
                this.setItem(`oauth_verifier_${provider}`, codeVerifier);
                authParams.set("code_challenge", codeChallenge);
                authParams.set("code_challenge_method", "S256");
            }
            // If the authorization URL already contains query parameters, add the new parameters
            if (authUrl.includes("?")) {
                authUrl = `${authUrl}&${authParams.toString()}`;
            }
            else {
                authUrl = `${authUrl}?${authParams.toString()}`;
            }
            this.emit("oauth_initiated", { provider, authUrl });
            return {
                success: true,
                provider,
                authUrl,
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Error initiating OAuth with ${provider}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Complete OAuth flow
     */
    async completeOAuth(provider, authCode, state, appToken) {
        const providerConfig = this.config.providers?.[provider];
        if (!providerConfig) {
            const errorMsg = `Provider '${provider}' is not configured.`;
            (0, logger_1.logError)(errorMsg);
            return { success: false, error: errorMsg };
        }
        try {
            const tokenData = await this.exchangeCodeForToken(provider, providerConfig, authCode, state);
            if (!tokenData.access_token) {
                const errorMsg = "No access token received from provider";
                (0, logger_1.logError)(errorMsg, tokenData);
                return { success: false, error: errorMsg };
            }
            const userInfo = await this.fetchUserInfo(provider, providerConfig, tokenData.access_token);
            // Cache user info
            this.cacheUserInfo(userInfo.id, provider, userInfo);
            // Generate credentials
            const credentials = await this.generateCredentials(userInfo, provider, appToken || "");
            this.emit("oauth_completed", { provider, userInfo, credentials });
            return {
                success: true,
                provider,
                userInfo,
            };
        }
        catch (error) {
            (0, logger_1.logError)(`Error completing OAuth with ${provider}:`, error);
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
    async generateCredentials(userInfo, provider, appToken) {
        const providerConfig = this.config.providers?.[provider];
        if (!providerConfig) {
            throw new Error(`Provider ${provider} is not configured.`);
        }
        // Username uniforme
        const username = (0, validation_1.generateUsernameFromIdentity)(provider, userInfo);
        try {
            (0, logger_1.logDebug)(`Generating credentials for ${provider} user: ${userInfo.id}`);
            // Salt deterministico per la derivazione della chiave
            const salt = `${userInfo.id}_${provider}_${userInfo.email}_shogun_oauth_${appToken}`;
            // Password deterministica (compatibilità)
            const password = (0, validation_1.generateDeterministicPassword)(salt);
            // Deriva la chiave GunDB
            const key = await (0, derive_1.default)(password, salt, { includeP256: true });
            const credentials = {
                username,
                password,
                provider,
                key,
            };
            this.cacheUserInfo(userInfo.id, provider, userInfo);
            (0, logger_1.logDebug)("OAuth credentials generated successfully");
            return credentials;
        }
        catch (error) {
            (0, logger_1.logError)("Error generating OAuth credentials:", error);
            throw error;
        }
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(provider, providerConfig, code, state) {
        const storedState = this.getItem(`oauth_state_${provider}`);
        if (state && storedState !== state) {
            this.removeItem(`oauth_state_${provider}`); // Cleanup anche in caso di errore
            throw new Error("Invalid state parameter");
        }
        this.removeItem(`oauth_state_${provider}`); // Cleanup dopo validazione
        const tokenParams = {
            client_id: providerConfig.clientId,
            code: code,
            redirect_uri: providerConfig.redirectUri,
            grant_type: "authorization_code",
        };
        // Check for PKCE first
        const isPKCEEnabled = providerConfig.usePKCE ?? this.config.usePKCE;
        if (isPKCEEnabled) {
            (0, logger_1.logDebug)("PKCE enabled, retrieving code verifier...");
            // Debug: Show all oauth-related keys in sessionStorage
            if (typeof sessionStorage !== "undefined") {
                const oauthKeys = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && key.startsWith("oauth_")) {
                        oauthKeys.push(key);
                    }
                }
                (0, logger_1.logDebug)("OAuth keys in sessionStorage:", oauthKeys);
            }
            const verifier = this.getItem(`oauth_verifier_${provider}`);
            (0, logger_1.logDebug)(`Looking for key: oauth_verifier_${provider}, found:`, !!verifier);
            if (verifier) {
                (0, logger_1.logDebug)(`Found code verifier for PKCE flow: ${verifier.substring(0, 10)}... (length: ${verifier.length})`);
                tokenParams.code_verifier = verifier;
            }
            else {
                throw new Error("PKCE enabled but no code verifier found");
            }
        }
        else if (providerConfig.clientSecret &&
            providerConfig.clientSecret.trim() !== "" &&
            this.config.allowUnsafeClientSecret &&
            typeof window === "undefined") {
            // Solo Node.js/server
            tokenParams.client_secret = providerConfig.clientSecret;
        }
        else if (providerConfig.clientSecret && typeof window !== "undefined") {
            throw new Error("Client secret must never be used in browser environments.");
        }
        else {
            (0, logger_1.logWarn)("Client secret is required when PKCE is not enabled. Please enable PKCE or configure a client secret.");
        }
        // Clean up verifier
        this.removeItem(`oauth_verifier_${provider}`);
        // Debug: Log what we're sending (maschera dati sensibili in produzione)
        if (typeof process !== "undefined" &&
            process.env &&
            process.env.NODE_ENV !== "production") {
            (0, logger_1.logDebug)("Token exchange parameters:", JSON.stringify({
                ...tokenParams,
                code_verifier: tokenParams.code_verifier ? "***" : undefined,
                client_secret: tokenParams.client_secret ? "***" : undefined,
            }, null, 2));
        }
        (0, logger_1.logDebug)("PKCE enabled:", isPKCEEnabled);
        (0, logger_1.logDebug)("Has code_verifier:", !!tokenParams.code_verifier);
        (0, logger_1.logDebug)("Has client_secret:", !!tokenParams.client_secret);
        const urlParams = new URLSearchParams(tokenParams);
        (0, logger_1.logDebug)("Request body keys:", Array.from(urlParams.keys()));
        (0, logger_1.logDebug)("Request body has code_verifier:", urlParams.has("code_verifier"));
        (0, logger_1.logDebug)("Request body has client_secret:", urlParams.has("client_secret"));
        const response = await fetch(providerConfig.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: urlParams.toString(),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
        return await response.json();
    }
    /**
     * Fetch user info from provider
     */
    async fetchUserInfo(provider, providerConfig, accessToken) {
        const response = await fetch(providerConfig.userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        }
        const userData = await response.json();
        return this.normalizeUserInfo(userData, provider);
    }
    /**
     * Normalize user info from different providers
     */
    normalizeUserInfo(userData, provider) {
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
    cacheUserInfo(userId, provider, userInfo) {
        const cacheKey = `${provider}_${userId}`;
        const cacheEntry = {
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
            localStorage.setItem(`shogun_oauth_user_${cacheKey}`, JSON.stringify(minimalCacheEntry));
        }
        catch (error) {
            (0, logger_1.logWarn)("Failed to persist user info in localStorage:", error);
        }
    }
    /**
     * Get cached user info
     */
    getCachedUserInfo(userId, provider) {
        const cacheKey = `${provider}_${userId}`;
        // First check memory cache
        const cached = this.userCache.get(cacheKey);
        if (cached) {
            // Check if cache is still valid
            if (this.config.cacheDuration &&
                Date.now() - cached.timestamp <= this.config.cacheDuration) {
                return cached.data || null;
            }
        }
        // Then check localStorage
        try {
            const localCached = localStorage.getItem(`shogun_oauth_user_${cacheKey}`);
            if (localCached) {
                const parsedCache = JSON.parse(localCached);
                if (this.config.cacheDuration &&
                    Date.now() - parsedCache.timestamp <= this.config.cacheDuration) {
                    // Update memory cache
                    this.userCache.set(cacheKey, parsedCache);
                    return parsedCache.userInfo;
                }
            }
        }
        catch (error) {
            (0, logger_1.logWarn)("Failed to read user info from localStorage:", error);
        }
        return null;
    }
    /**
     * Clear user cache
     */
    clearUserCache(userId, provider) {
        if (userId && provider) {
            const cacheKey = `${provider}_${userId}`;
            this.userCache.delete(cacheKey);
            try {
                localStorage.removeItem(`shogun_oauth_user_${cacheKey}`);
            }
            catch (error) {
                (0, logger_1.logWarn)("Failed to remove user info from localStorage:", error);
            }
        }
        else {
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
            }
            catch (error) {
                (0, logger_1.logWarn)("Failed to clear user info from localStorage:", error);
            }
        }
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.removeAllListeners();
        this.userCache.clear();
    }
}
exports.OAuthConnector = OAuthConnector;
