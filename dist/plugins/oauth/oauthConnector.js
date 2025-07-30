"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthConnector = void 0;
/**
 * OAuth Connector - Secure version for GunDB user creation
 */
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
        // Validazione di sicurezza post-costruzione
        this.validateSecurityConfig();
    }
    /**
     * Valida la configurazione di sicurezza
     */
    validateSecurityConfig() {
        const providers = this.config.providers || {};
        for (const [providerName, providerConfig] of Object.entries(providers)) {
            if (!providerConfig)
                continue;
            // Verifica che PKCE sia abilitato per tutti i provider nel browser
            if (typeof window !== "undefined" && !providerConfig.usePKCE) {
                console.warn(`Provider ${providerName} non ha PKCE abilitato - non sicuro per browser`);
            }
            // Verifica che non ci sia client_secret nel browser (eccetto Google con PKCE)
            if (typeof window !== "undefined" && providerConfig.clientSecret) {
                if (providerName === "google" && providerConfig.usePKCE) {
                    console.log(`Provider ${providerName} ha client_secret configurato - OK per Google con PKCE`);
                }
                else {
                    console.error(`Provider ${providerName} ha client_secret configurato nel browser - RIMUOVERE IMMEDIATAMENTE`);
                    throw new Error(`Client secret non può essere usato nel browser per ${providerName}`);
                }
            }
        }
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
        console.log("OAuthConnector configuration updated", this.config);
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
            console.error(errorMsg);
            return { success: false, error: errorMsg };
        }
        // Validazione di sicurezza pre-inizializzazione
        if (typeof window !== "undefined" && providerConfig.clientSecret) {
            // Google OAuth richiede client_secret anche con PKCE
            if (provider === "google" && providerConfig.usePKCE) {
                console.log(`Provider ${provider} ha client_secret configurato - OK per Google con PKCE`);
            }
            else {
                const errorMsg = `Client secret non può essere usato nel browser per ${provider}`;
                console.error(errorMsg);
                return { success: false, error: errorMsg };
            }
        }
        try {
            const state = this.generateRandomString(32);
            const stateTimestamp = Date.now();
            // Salva state con timestamp per validazione timeout
            this.setItem(`oauth_state_${provider}`, state);
            this.setItem(`oauth_state_timestamp_${provider}`, stateTimestamp.toString());
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
            const isPKCEEnabled = providerConfig.usePKCE ?? this.config.usePKCE ?? true;
            if (!isPKCEEnabled && typeof window !== "undefined") {
                const errorMsg = `PKCE è obbligatorio per ${provider} nel browser per motivi di sicurezza`;
                console.error(errorMsg);
                return { success: false, error: errorMsg };
            }
            if (isPKCEEnabled) {
                console.log("PKCE is enabled, generating challenge...");
                const { codeVerifier, codeChallenge } = await this.generatePKCEChallenge();
                console.log(`Generated code verifier: ${codeVerifier.substring(0, 10)}... (length: ${codeVerifier.length})`);
                console.log(`Generated code challenge: ${codeChallenge.substring(0, 10)}... (length: ${codeChallenge.length})`);
                this.setItem(`oauth_verifier_${provider}`, codeVerifier);
                this.setItem(`oauth_verifier_timestamp_${provider}`, stateTimestamp.toString());
                console.log(`Saved code verifier to storage with key: oauth_verifier_${provider}`);
                authParams.set("code_challenge", codeChallenge);
                authParams.set("code_challenge_method", "S256");
                console.log("Added PKCE parameters to auth URL");
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
    async completeOAuth(provider, authCode, state, appToken) {
        const providerConfig = this.config.providers?.[provider];
        if (!providerConfig) {
            const errorMsg = `Provider '${provider}' is not configured.`;
            console.error(errorMsg);
            return { success: false, error: errorMsg };
        }
        try {
            const tokenData = await this.exchangeCodeForToken(provider, providerConfig, authCode, state);
            if (!tokenData.access_token) {
                const errorMsg = "No access token received from provider";
                console.error(errorMsg, tokenData);
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
    async generateCredentials(userInfo, provider, appToken) {
        const providerConfig = this.config.providers?.[provider];
        if (!providerConfig) {
            throw new Error(`Provider ${provider} is not configured.`);
        }
        // Username uniforme
        const username = (0, validation_1.generateUsernameFromIdentity)(provider, userInfo);
        try {
            console.log(`Generating credentials for ${provider} user: ${userInfo.id}`);
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
            console.log("OAuth credentials generated successfully");
            return credentials;
        }
        catch (error) {
            console.error("Error generating OAuth credentials:", error);
            throw error;
        }
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(provider, providerConfig, code, state) {
        const storedState = this.getItem(`oauth_state_${provider}`);
        const storedStateTimestamp = this.getItem(`oauth_state_timestamp_${provider}`);
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
        const tokenParams = {
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
            const verifierTimestamp = this.getItem(`oauth_verifier_timestamp_${provider}`);
            console.log(`Looking for key: oauth_verifier_${provider}, found:`, !!verifier);
            if (verifier && verifierTimestamp) {
                const verifierTimestampInt = parseInt(verifierTimestamp, 10);
                const stateTimeout = this.config.stateTimeout || 10 * 60 * 1000; // Default 10 minuti
                if (Date.now() - verifierTimestampInt > stateTimeout) {
                    console.warn(`Code verifier expired for PKCE flow for ${provider}`);
                    this.removeItem(`oauth_verifier_${provider}`);
                    this.removeItem(`oauth_verifier_timestamp_${provider}`);
                    throw new Error("Code verifier expired");
                }
                console.log(`Found code verifier for PKCE flow: ${verifier.substring(0, 10)}... (length: ${verifier.length})`);
                tokenParams.code_verifier = verifier;
            }
            else {
                // Fallback: prova a generare un nuovo verifier (non ideale ma funziona per test)
                console.warn("PKCE enabled but no code verifier found. Attempting fallback...");
                try {
                    const { codeVerifier } = await this.generatePKCEChallenge();
                    tokenParams.code_verifier = codeVerifier;
                    console.log("Generated fallback code verifier");
                }
                catch (fallbackError) {
                    throw new Error("PKCE enabled but no code verifier found and fallback failed");
                }
            }
        }
        else {
            // PKCE non abilitato - non sicuro per browser
            if (typeof window !== "undefined") {
                throw new Error("PKCE è obbligatorio per applicazioni browser. Client secret non può essere usato nel browser.");
            }
            // Solo per ambiente Node.js con client_secret
            if (providerConfig.clientSecret &&
                providerConfig.clientSecret.trim() !== "") {
                tokenParams.client_secret = providerConfig.clientSecret;
                console.log("Using client_secret for server-side OAuth flow");
            }
            else {
                throw new Error("Client secret is required when PKCE is not enabled for server-side flows.");
            }
        }
        // Google OAuth richiede client_secret anche con PKCE
        // Questo è un comportamento specifico di Google, non una vulnerabilità
        if (provider === "google" &&
            providerConfig.clientSecret &&
            providerConfig.clientSecret.trim() !== "") {
            tokenParams.client_secret = providerConfig.clientSecret;
            console.log("Adding client_secret for Google OAuth (required even with PKCE)");
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
        // Salva solo dati minimi in localStorage (solo se disponibile)
        try {
            if (typeof window !== "undefined" &&
                typeof localStorage !== "undefined") {
                const minimalCacheEntry = {
                    userId: userInfo.id,
                    provider,
                    timestamp: Date.now(),
                };
                localStorage.setItem(`shogun_oauth_user_${cacheKey}`, JSON.stringify(minimalCacheEntry));
            }
        }
        catch (error) {
            console.warn("Failed to persist user info in localStorage:", error);
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
        // Then check localStorage (solo se disponibile)
        try {
            if (typeof window !== "undefined" &&
                typeof localStorage !== "undefined") {
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
        }
        catch (error) {
            console.warn("Failed to read user info from localStorage:", error);
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
                if (typeof window !== "undefined" &&
                    typeof localStorage !== "undefined") {
                    localStorage.removeItem(`shogun_oauth_user_${cacheKey}`);
                }
            }
            catch (error) {
                console.warn("Failed to remove user info from localStorage:", error);
            }
        }
        else {
            // Clear all cache
            this.userCache.clear();
            try {
                if (typeof window !== "undefined" &&
                    typeof localStorage !== "undefined") {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith("shogun_oauth_user_")) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach((key) => localStorage.removeItem(key));
                }
            }
            catch (error) {
                console.warn("Failed to clear user info from localStorage:", error);
            }
        }
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.removeAllListeners();
        this.userCache.clear();
        this.cleanupExpiredOAuthData();
    }
    /**
     * Pulisce i dati OAuth scaduti dallo storage
     */
    cleanupExpiredOAuthData() {
        const stateTimeout = this.config.stateTimeout || 10 * 60 * 1000;
        const currentTime = Date.now();
        // Pulisci sessionStorage
        if (typeof sessionStorage !== "undefined") {
            const keysToRemove = [];
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
        // Pulisci memoryStorage (Node.js)
        const memoryKeysToRemove = [];
        for (const [key, value] of this.memoryStorage.entries()) {
            if (key.startsWith("oauth_state_timestamp_") ||
                key.startsWith("oauth_verifier_timestamp_")) {
                const timestamp = parseInt(value, 10);
                if (currentTime - timestamp > stateTimeout) {
                    const baseKey = key.replace("_timestamp", "");
                    memoryKeysToRemove.push(key, baseKey);
                }
            }
        }
        memoryKeysToRemove.forEach((key) => this.memoryStorage.delete(key));
        if (memoryKeysToRemove.length > 0) {
            console.log(`Cleaned up ${memoryKeysToRemove.length} expired OAuth entries from memory`);
        }
    }
}
exports.OAuthConnector = OAuthConnector;
