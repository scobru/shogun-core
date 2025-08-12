import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { OAuthConnector } from "./oauthConnector";
import {
  OAuthPluginInterface,
  OAuthConfig,
  OAuthProvider,
  OAuthConnectionResult,
  OAuthCredentials,
  OAuthUserInfo,
} from "./types";
import { AuthResult, SignUpResult, AuthMethod } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
import { ShogunStorage } from "../../storage/storage";
import { ISEAPair } from "gun";

/**
 * OAuth Plugin for ShogunCore
 * Provides authentication with external OAuth providers
 */
export class OAuthPlugin extends BasePlugin implements OAuthPluginInterface {
  name = "oauth";
  version = "1.0.0";
  description =
    "Provides OAuth authentication with external providers for ShogunCore";

  private oauthConnector: OAuthConnector | null = null;
  private config: Partial<OAuthConfig> = {};
  private storage: ShogunStorage | null = null;

  /**
   * Constructor for OAuthPlugin
   * @param config - Initial configuration for OAuth
   */
  constructor(config?: Partial<OAuthConfig>) {
    super();
    if (config) {
      this.config = config;
    }
  }

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    this.core = core;
    this.storage = new ShogunStorage();

    // Inizializziamo il connector OAuth con la configurazione già presente
    this.oauthConnector = new OAuthConnector(this.config);

    // Valida la configurazione di sicurezza dopo l'inizializzazione
    this.validateOAuthSecurity();
  }

  /**
   * Valida la configurazione di sicurezza OAuth
   */
  private validateOAuthSecurity(): void {
    if (!this.oauthConnector) return;

    const providers = this.oauthConnector.getAvailableProviders();

    for (const provider of providers) {
      const providerConfig = this.config.providers?.[provider];
      if (!providerConfig) continue;

      // Verifica che PKCE sia abilitato per tutti i provider
      if (!providerConfig.usePKCE && typeof window !== "undefined") {
        console.warn(
          `[oauthPlugin] Provider ${provider} non ha PKCE abilitato - non sicuro per browser`
        );
      }

      // Verifica che non ci sia client_secret nel browser (eccetto Google con PKCE)
      if (providerConfig.clientSecret && typeof window !== "undefined") {
        if (provider === "google" && providerConfig.usePKCE) {
          // Non lanciare errore per Google con PKCE
          continue;
        } else {
          console.error(
            `[oauthPlugin] Provider ${provider} ha client_secret configurato nel browser - RIMUOVERE`
          );
          throw new Error(
            `Client secret non può essere usato nel browser per ${provider}`
          );
        }
      }
    }
  }

  /**
   * Configure the OAuth plugin with provider settings
   * @param config - Configuration options for OAuth
   */
  configure(config: Partial<OAuthConfig>): void {
    // Deep merge provider maps to preserve both existing and new providers
    const mergedProviders = {
      ...(this.config.providers || {}),
      ...((config as any)?.providers || {}),
    } as any;
    this.config = { ...this.config, ...config, providers: mergedProviders };

    // Inizializza il connector se non è già stato fatto
    if (!this.oauthConnector) {
      this.oauthConnector = new OAuthConnector(this.config);
    } else {
      // Update connector configuration se già inizializzato
      const conn = this.oauthConnector as any;
      if (typeof conn.updateConfig === "function") {
        conn.updateConfig(this.config);
      } else {
        // Fallback: recreate connector
        this.oauthConnector = new OAuthConnector(this.config);
      }
    }

    // Validate security settings
    this.validateOAuthSecurity();
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.oauthConnector) {
      const conn = this.oauthConnector as any;
      if (typeof conn.cleanup === "function") {
        conn.cleanup();
      }
    }
    this.oauthConnector = null;
    this.storage = null;
    super.destroy();
  }

  /**
   * Ensure that the OAuth connector is initialized
   * @private
   */
  private assertOAuthConnector(): OAuthConnector {
    this.assertInitialized();
    if (!this.oauthConnector) {
      throw new Error("OAuth connector not initialized");
    }
    return this.oauthConnector;
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    try {
      const conn = this.assertOAuthConnector() as any;
      return typeof conn.isSupported === "function" ? conn.isSupported() : true;
    } catch {
      // If connector is not available, return false
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  getAvailableProviders(): OAuthProvider[] {
    try {
      const conn = this.assertOAuthConnector() as any;
      return typeof conn.getAvailableProviders === "function"
        ? conn.getAvailableProviders()
        : [];
    } catch {
      // If connector is not available, return empty array
      return [];
    }
  }

  /**
   * @inheritdoc
   */
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult> {
    const conn = this.assertOAuthConnector() as any;
    return conn.initiateOAuth(provider);
  }

  /**
   * @inheritdoc
   */
  async completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string
  ): Promise<OAuthConnectionResult> {
    const conn = this.assertOAuthConnector() as any;
    return conn.completeOAuth(provider, authCode, state);
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider
  ): Promise<OAuthCredentials> {
    const conn = this.assertOAuthConnector() as any;
    return conn.generateCredentials(userInfo, provider);
  }

  /**
   * Login with OAuth
   * @param provider - OAuth provider to use
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using OAuth with external providers
   * NOTE: This method only initiates the OAuth flow. The actual authentication
   * happens in handleOAuthCallback when the provider redirects back.
   */
  async login(provider: OAuthProvider): Promise<AuthResult> {
    try {
      const core = this.assertInitialized();

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for OAuth login"
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "OAUTH_UNAVAILABLE",
          "OAuth is not supported in this environment"
        );
      }

      // Check if provider is available
      const availableProviders = this.getAvailableProviders();
      if (!availableProviders.includes(provider)) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_NOT_CONFIGURED",
          `Provider ${provider} is not configured or available`
        );
      }

      // Initiate OAuth flow with the provider
      const oauthResult = await this.initiateOAuth(provider);

      if (!oauthResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "OAUTH_INITIATION_FAILED",
          oauthResult.error || "Failed to initiate OAuth flow"
        );
      }

      // In a browser environment, this would redirect to the OAuth provider
      // The frontend should handle the redirect and then call handleOAuthCallback
      // with the received code and state when the provider redirects back

      // Return early with the auth URL that the frontend should use for redirection
      return {
        success: true,
        redirectUrl: oauthResult.authUrl,
        pendingAuth: true,
        message:
          "Redirect to OAuth provider required to complete authentication",
        provider,
        authMethod: "oauth",
      };
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "OAUTH_LOGIN_ERROR";
      const errorMessage = error?.message || "Unknown error during OAuth login";

      ErrorHandler.handle(errorType, errorCode, errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register new user with OAuth provider
   * @param provider - OAuth provider
   * @returns {Promise<SignUpResult>} Registration result
   */
  async signUp(provider: OAuthProvider): Promise<SignUpResult> {
    try {
      const core = this.assertInitialized();

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for OAuth signup"
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "OAUTH_UNAVAILABLE",
          "OAuth is not supported in this environment"
        );
      }

      // Check if provider is available
      const availableProviders = this.getAvailableProviders();
      if (!availableProviders.includes(provider)) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_NOT_CONFIGURED",
          `Provider ${provider} is not configured or available`
        );
      }

      // Initiate OAuth flow with the provider
      const oauthResult = await this.initiateOAuth(provider);

      if (!oauthResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "OAUTH_INITIATION_FAILED",
          oauthResult.error || "Failed to initiate OAuth flow"
        );
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
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "OAUTH_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during OAuth signup";

      ErrorHandler.handle(errorType, errorCode, errorMessage, error);
      return { success: false, error: errorMessage } as any;
    }
  }

  /**
   * Handle OAuth callback (for frontend integration)
   * This method would be called when the OAuth provider redirects back
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult> {
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
      const credentials = await this.generateCredentials(
        result.userInfo,
        provider
      );

      // Set authentication method
      core.setAuthMethod("oauth" as AuthMethod);

      // Login o signup usando la chiave derivata
      const authResult = await this._loginOrSignUp(
        credentials.username,
        credentials.key
      );

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
            } as any,
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
            name:
              result.userInfo.name ||
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
    } catch (error: any) {
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
  private cleanupExpiredOAuthData(): void {
    if (this.oauthConnector) {
      // Il metodo cleanupExpiredOAuthData è privato nel connector
      // quindi usiamo il metodo pubblico clearUserCache
      const conn = this.oauthConnector as any;
      if (typeof conn.clearUserCache === "function") {
        conn.clearUserCache();
      }
    }
  }

  /**
   * Private helper to login or sign up a user
   */
  private async _loginOrSignUp(
    username: string,
    k: ISEAPair | null
  ): Promise<AuthResult> {
    if (!this.core) {
      return { success: false, error: "Shogun core not available" };
    }

    // Try login first
    const loginResult = await this.core.login(username, "", k);
    if (loginResult.success) {
      // Session is automatically saved by the login method
      loginResult.isNewUser = false;
      // Include SEA pair from core
      if (this.core.user && (this.core.user._ as any)?.sea) {
        loginResult.sea = (this.core.user._ as any).sea;
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
        if (this.core.user && (this.core.user._ as any)?.sea) {
          postSignupLogin.sea = (this.core.user._ as any).sea;
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
  async handleSimpleOAuth(
    provider: OAuthProvider,
    authCode: string,
    state: string
  ): Promise<AuthResult> {
    return this.handleOAuthCallback(provider, authCode, state);
  }

  /**
   * Get cached user info for a user
   */
  getCachedUserInfo(
    userId: string,
    provider: OAuthProvider
  ): OAuthUserInfo | null {
    const key = `oauth_user_${provider}_${userId}`;
    const storage = this.storage as any;
    if (storage?.get) {
      return storage.get(key) ?? null;
    }
    return null;
  }

  /**
   * Clear user info cache
   */
  clearUserCache(userId?: string, provider?: OAuthProvider): void {
    const key =
      userId && provider ? `oauth_user_${provider}_${userId}` : "oauth_user_";
    const storage = this.storage as any;
    storage?.remove?.(key);
  }
}
