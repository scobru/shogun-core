"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthPlugin = void 0;
const base_1 = require("../base");
const oauthConnector_1 = require("./oauthConnector");
const errorHandler_1 = require("../../utils/errorHandler");
const storage_1 = require("../../storage/storage");
/**
 * OAuth Plugin for ShogunCore
 * Provides authentication with external OAuth providers
 */
class OAuthPlugin extends base_1.BasePlugin {
    name = "oauth";
    version = "1.0.0";
    description = "Provides OAuth authentication with external providers for ShogunCore";
    oauthConnector = null;
    config = {};
    storage = null;
    /**
     * @inheritdoc
     */
    initialize(core, appToken) {
        super.initialize(core);
        // Initialize the OAuth connector
        this.oauthConnector = new oauthConnector_1.OAuthConnector(this.config);
        this.storage = new storage_1.ShogunStorage();
        if (appToken) {
            this.appToken = appToken;
        }
        else {
            throw new Error("App token is required for OAuth plugin");
        }
        // Validazione di sicurezza post-inizializzazione
        this.validateOAuthSecurity();
        console.log("[oauthPlugin]  OAuth plugin initialized successfully");
    }
    /**
     * Valida la configurazione di sicurezza OAuth
     */
    validateOAuthSecurity() {
        if (!this.oauthConnector)
            return;
        const providers = this.oauthConnector.getAvailableProviders();
        for (const provider of providers) {
            const providerConfig = this.config.providers?.[provider];
            if (!providerConfig)
                continue;
            // Verifica che PKCE sia abilitato per tutti i provider
            if (!providerConfig.usePKCE && typeof window !== "undefined") {
                console.warn(`[oauthPlugin] Provider ${provider} non ha PKCE abilitato - non sicuro per browser`);
            }
            // Verifica che non ci sia client_secret nel browser (eccetto Google con PKCE)
            if (providerConfig.clientSecret && typeof window !== "undefined") {
                if (provider === "google" && providerConfig.usePKCE) {
                    console.log(`[oauthPlugin] Provider ${provider} ha client_secret configurato - OK per Google con PKCE`);
                    // Non lanciare errore per Google con PKCE
                    continue;
                }
                else {
                    console.error(`[oauthPlugin] Provider ${provider} ha client_secret configurato nel browser - RIMUOVERE`);
                    throw new Error(`Client secret non può essere usato nel browser per ${provider}`);
                }
            }
        }
    }
    /**
     * Configure the OAuth plugin with provider settings
     * @param config - Configuration options for OAuth
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        // If connector is already initialized, update its configuration
        if (this.oauthConnector) {
            this.oauthConnector.updateConfig(this.config);
            console.log("[oauthPlugin]  OAuth connector configuration updated", this.config.providers);
        }
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.oauthConnector) {
            this.oauthConnector.cleanup();
        }
        this.oauthConnector = null;
        super.destroy();
        console.log("[oauthPlugin]  OAuth plugin destroyed");
    }
    /**
     * Ensure that the OAuth connector is initialized
     * @private
     */
    assertOAuthConnector() {
        this.assertInitialized();
        if (!this.oauthConnector) {
            throw new Error("OAuth connector not initialized");
        }
        return this.oauthConnector;
    }
    /**
     * @inheritdoc
     */
    isSupported() {
        return this.assertOAuthConnector().isSupported();
    }
    /**
     * @inheritdoc
     */
    getAvailableProviders() {
        return this.assertOAuthConnector().getAvailableProviders();
    }
    /**
     * @inheritdoc
     */
    async initiateOAuth(provider) {
        console.log(`Initiating OAuth flow with ${provider}`);
        return this.assertOAuthConnector().initiateOAuth(provider);
    }
    /**
     * @inheritdoc
     */
    async completeOAuth(provider, authCode, state) {
        console.log(`Completing OAuth flow with ${provider}`);
        return this.assertOAuthConnector().completeOAuth(provider, authCode, state, this.appToken);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(userInfo, provider) {
        console.log(`Generating credentials for ${provider} user`);
        if (!this.appToken) {
            throw new Error("App token is required for OAuth generation");
        }
        return this.assertOAuthConnector().generateCredentials(userInfo, provider, this.appToken);
    }
    /**
     * Login with OAuth
     * @param provider - OAuth provider to use
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using OAuth with external providers
     */
    async login(provider) {
        console.log(`OAuth login with ${provider}`);
        try {
            const core = this.assertInitialized();
            console.log(`OAuth login attempt with provider: ${provider}`);
            if (!provider) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "PROVIDER_REQUIRED", "OAuth provider required for OAuth login");
            }
            if (!this.isSupported()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "OAUTH_UNAVAILABLE", "OAuth is not supported in this environment");
            }
            // Check if provider is available
            const availableProviders = this.getAvailableProviders();
            if (!availableProviders.includes(provider)) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "PROVIDER_NOT_CONFIGURED", `Provider ${provider} is not configured or available`);
            }
            // Initiate OAuth flow with the provider
            const oauthResult = await this.initiateOAuth(provider);
            if (!oauthResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "OAUTH_INITIATION_FAILED", oauthResult.error || "Failed to initiate OAuth flow");
            }
            // In a browser environment, this would redirect to the OAuth provider
            // The frontend should handle the redirect and then call handleOAuthCallback
            // with the received code and state when the provider redirects back
            // Return early with the auth URL that the frontend should use for redirection
            return {
                success: true,
                redirectUrl: oauthResult.authUrl,
                pendingAuth: true,
                message: "Redirect to OAuth provider required to complete authentication",
                provider,
                authMethod: "oauth",
            };
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "OAUTH_LOGIN_ERROR";
            const errorMessage = error?.message || "Unknown error during OAuth login";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Sign up with OAuth
     * @param provider - OAuth provider to use
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using OAuth with external providers
     */
    async signUp(provider) {
        console.log(`OAuth signup with ${provider}`);
        try {
            const core = this.assertInitialized();
            console.log(`OAuth signup attempt with provider: ${provider}`);
            if (!provider) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "PROVIDER_REQUIRED", "OAuth provider required for OAuth signup");
            }
            if (!this.isSupported()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "OAUTH_UNAVAILABLE", "OAuth is not supported in this environment");
            }
            // Check if provider is available
            const availableProviders = this.getAvailableProviders();
            if (!availableProviders.includes(provider)) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "PROVIDER_NOT_CONFIGURED", `Provider ${provider} is not configured or available`);
            }
            // Initiate OAuth flow with the provider
            const oauthResult = await this.initiateOAuth(provider);
            if (!oauthResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "OAUTH_INITIATION_FAILED", oauthResult.error || "Failed to initiate OAuth flow");
            }
            // In a browser environment, this would redirect to the OAuth provider
            // The frontend should handle the redirect and then call handleOAuthCallback
            // with the received code and state when the provider redirects back
            // Return early with the auth URL that the frontend should use for redirection
            return {
                success: true,
                redirectUrl: oauthResult.authUrl,
                pendingAuth: true,
                message: "Redirect to OAuth provider required to complete registration",
                provider,
                authMethod: "oauth",
            };
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "OAUTH_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during OAuth signup";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Handle OAuth callback (for frontend integration)
     * This method would be called when the OAuth provider redirects back
     */
    async handleOAuthCallback(provider, authCode, state) {
        try {
            console.log(`Handling OAuth callback for ${provider}`);
            const core = this.assertInitialized();
            // Validazione di sicurezza pre-callback
            if (!authCode || !state) {
                throw new Error("Authorization code and state parameter are required");
            }
            // Complete the OAuth flow
            const result = await this.completeOAuth(provider, authCode, state);
            if (!result.success || !result.userInfo) {
                throw new Error(result.error || "Failed to complete OAuth flow");
            }
            // Genera credenziali da user info
            const credentials = await this.generateCredentials(result.userInfo, provider);
            // Set authentication method
            core.setAuthMethod("oauth");
            // Login o signup usando la chiave derivata
            const authResult = await this._loginOrSignUp(credentials.username, credentials.key);
            if (authResult.success) {
                // Store user info in user metadata
                if (core.user) {
                    await core.user.put({
                        oauth: {
                            provider,
                            id: result.userInfo.id,
                            email: result.userInfo.email,
                            name: result.userInfo.name,
                            picture: result.userInfo.picture,
                            lastLogin: Date.now(),
                        },
                    });
                }
                // Emit appropriate event
                const eventType = authResult.isNewUser ? "auth:signup" : "auth:login";
                core.emit(eventType, {
                    userPub: authResult.userPub,
                    username: credentials.username,
                    method: "oauth",
                    provider,
                });
                // Pulisci i dati OAuth scaduti dopo un login riuscito
                this.cleanupExpiredOAuthData();
            }
            return authResult;
        }
        catch (error) {
            console.error(`Error handling OAuth callback for ${provider}:`, error);
            // Pulisci i dati OAuth anche in caso di errore
            this.cleanupExpiredOAuthData();
            return {
                success: false,
                error: error.message || "Failed to handle OAuth callback",
            };
        }
    }
    /**
     * Pulisce i dati OAuth scaduti
     */
    cleanupExpiredOAuthData() {
        if (this.oauthConnector) {
            // Il metodo cleanupExpiredOAuthData è privato nel connector
            // quindi usiamo il metodo pubblico clearUserCache
            this.oauthConnector.clearUserCache();
        }
    }
    /**
     * Private helper to login or sign up a user
     */
    async _loginOrSignUp(username, k) {
        if (!this.core) {
            return { success: false, error: "Shogun core not available" };
        }
        // Try login first
        const loginResult = await this.core.login(username, "", k);
        if (loginResult.success) {
            this.core.db.savePair?.(); // Ensure session is saved
            loginResult.isNewUser = false;
            return loginResult;
        }
        // If login fails, try signup
        const signupResult = await this.core.signUp(username, "", "", k);
        if (signupResult.success) {
            // Immediately login after signup
            const postSignupLogin = await this.core.login(username, "", k);
            if (postSignupLogin.success) {
                this.core.db.savePair?.();
                postSignupLogin.isNewUser = true;
                return postSignupLogin;
            }
            return {
                success: false,
                error: postSignupLogin.error || "Login failed after successful signup.",
            };
        }
        // Return the original signup error for other failures
        return signupResult;
    }
    /**
     * Alias for handleOAuthCallback for backward compatibility
     * @deprecated Use handleOAuthCallback instead
     */
    async handleSimpleOAuth(provider, authCode, state) {
        console.log(`handleSimpleOAuth called (alias for handleOAuthCallback) for ${provider}`);
        return this.handleOAuthCallback(provider, authCode, state);
    }
    /**
     * Get cached user info for a user
     */
    getCachedUserInfo(userId, provider) {
        return this.assertOAuthConnector().getCachedUserInfo(userId, provider);
    }
    /**
     * Clear user info cache
     */
    clearUserCache(userId, provider) {
        this.assertOAuthConnector().clearUserCache(userId, provider);
    }
}
exports.OAuthPlugin = OAuthPlugin;
