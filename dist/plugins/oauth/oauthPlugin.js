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
     * Constructor for OAuthPlugin
     * @param config - Initial configuration for OAuth
     */
    constructor(config) {
        super();
        if (config) {
            this.config = config;
        }
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        this.core = core;
        this.storage = new storage_1.ShogunStorage();
        // Inizializziamo il connector OAuth con la configurazione già presente
        this.oauthConnector = new oauthConnector_1.OAuthConnector(this.config);
        // Valida la configurazione di sicurezza dopo l'inizializzazione
        this.validateOAuthSecurity();
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
        // Inizializza il connector se non è già stato fatto
        if (!this.oauthConnector) {
            this.oauthConnector = new oauthConnector_1.OAuthConnector(this.config);
        }
        else {
            // Update connector configuration se già inizializzato
            this.oauthConnector.updateConfig(this.config);
        }
        // Validate security settings
        this.validateOAuthSecurity();
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.oauthConnector) {
            this.oauthConnector.cleanup();
        }
        this.oauthConnector = null;
        this.storage = null;
        super.destroy();
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
        return this.assertOAuthConnector().initiateOAuth(provider);
    }
    /**
     * @inheritdoc
     */
    async completeOAuth(provider, authCode, state) {
        return this.assertOAuthConnector().completeOAuth(provider, authCode, state);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(userInfo, provider) {
        return this.assertOAuthConnector().generateCredentials(userInfo, provider);
    }
    /**
     * Login with OAuth
     * @param provider - OAuth provider to use
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using OAuth with external providers
     * NOTE: This method only initiates the OAuth flow. The actual authentication
     * happens in handleOAuthCallback when the provider redirects back.
     */
    async login(provider) {
        try {
            const core = this.assertInitialized();
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
     * Register new user with OAuth provider
     * @param provider - OAuth provider
     * @returns {Promise<SignUpResult>} Registration result
     */
    async signUp(provider) {
        try {
            const core = this.assertInitialized();
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
                    userPub: authResult.userPub || "",
                    username: credentials.username,
                    method: "oauth",
                    provider,
                });
                // Pulisci i dati OAuth scaduti dopo un login riuscito
                this.cleanupExpiredOAuthData();
                // Return auth result with OAuth user data included
                return {
                    ...authResult,
                    sea: authResult.sea, // Include SEA pair from core
                    user: {
                        userPub: authResult.userPub,
                        username: credentials.username,
                        email: result.userInfo.email,
                        name: result.userInfo.name ||
                            result.userInfo.email ||
                            `OAuth User (${provider})`,
                        picture: result.userInfo.picture,
                        oauth: {
                            provider,
                            id: result.userInfo.id,
                            email: result.userInfo.email,
                            name: result.userInfo.name,
                            picture: result.userInfo.picture,
                            lastLogin: Date.now(),
                        },
                    },
                };
            }
            return authResult;
        }
        catch (error) {
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
            // Session is automatically saved by the login method
            loginResult.isNewUser = false;
            // Include SEA pair from core
            if (this.core.user && this.core.user._?.sea) {
                loginResult.sea = this.core.user._.sea;
            }
            return loginResult;
        }
        // If login fails, try signup
        const signupResult = await this.core.signUp(username, "", "", k);
        if (signupResult.success) {
            // Immediately login after signup
            const postSignupLogin = await this.core.login(username, "", k);
            if (postSignupLogin.success) {
                // Session is automatically saved by the login method
                postSignupLogin.isNewUser = true;
                // Include SEA pair from core
                if (this.core.user && this.core.user._?.sea) {
                    postSignupLogin.sea = this.core.user._.sea;
                }
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
