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
import { log, logError, logWarn } from "../../utils/logger";
import { AuthMethod, AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
import { ethers } from "ethers";

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

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize the OAuth connector
    this.oauthConnector = new OAuthConnector(this.config);

    log("OAuth plugin initialized successfully");
  }

  /**
   * Configure the OAuth plugin with provider settings
   * @param config - Configuration options for OAuth
   */
  configure(config: Partial<OAuthConfig>): void {
    this.config = { ...this.config, ...config };

    // If connector is already initialized, update its configuration
    if (this.oauthConnector) {
      this.oauthConnector.updateConfig(this.config);
      log("OAuth connector configuration updated", this.config.providers);
    }
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.oauthConnector) {
      this.oauthConnector.cleanup();
    }
    this.oauthConnector = null;
    super.destroy();
    log("OAuth plugin destroyed");
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
    return this.assertOAuthConnector().isSupported();
  }

  /**
   * @inheritdoc
   */
  getAvailableProviders(): OAuthProvider[] {
    return this.assertOAuthConnector().getAvailableProviders();
  }

  /**
   * @inheritdoc
   */
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult> {
    log(`Initiating OAuth flow with ${provider}`);
    return this.assertOAuthConnector().initiateOAuth(provider);
  }

  /**
   * @inheritdoc
   */
  async completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<OAuthConnectionResult> {
    log(`Completing OAuth flow with ${provider}`);
    return this.assertOAuthConnector().completeOAuth(provider, authCode, state);
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider,
  ): Promise<OAuthCredentials> {
    log(`Generating credentials for ${provider} user`);
    return this.assertOAuthConnector().generateCredentials(userInfo, provider);
  }

  /**
   * Login with OAuth
   * @param provider - OAuth provider to use
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using OAuth with external providers
   */
  async login(provider: OAuthProvider): Promise<AuthResult> {
    log(`OAuth login with ${provider}`);

    try {
      const core = this.assertInitialized();
      log(`OAuth login attempt with provider: ${provider}`);

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for OAuth login",
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "OAUTH_UNAVAILABLE",
          "OAuth is not supported in this environment",
        );
      }

      // Check if provider is available
      const availableProviders = this.getAvailableProviders();
      if (!availableProviders.includes(provider)) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_NOT_CONFIGURED",
          `Provider ${provider} is not configured or available`,
        );
      }

      // Initiate OAuth flow with the provider
      const oauthResult = await this.initiateOAuth(provider);

      if (!oauthResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "OAUTH_INITIATION_FAILED",
          oauthResult.error || "Failed to initiate OAuth flow",
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

      const handledError = ErrorHandler.handle(
        errorType,
        errorCode,
        errorMessage,
        error,
      );

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
  async signUp(provider: OAuthProvider): Promise<AuthResult> {
    log(`OAuth signup with ${provider}`);

    try {
      const core = this.assertInitialized();
      log(`OAuth signup attempt with provider: ${provider}`);

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for OAuth signup",
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "OAUTH_UNAVAILABLE",
          "OAuth is not supported in this environment",
        );
      }

      // Check if provider is available
      const availableProviders = this.getAvailableProviders();
      if (!availableProviders.includes(provider)) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_NOT_CONFIGURED",
          `Provider ${provider} is not configured or available`,
        );
      }

      // Initiate OAuth flow with the provider
      const oauthResult = await this.initiateOAuth(provider);

      if (!oauthResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "OAUTH_INITIATION_FAILED",
          oauthResult.error || "Failed to initiate OAuth flow",
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

      const handledError = ErrorHandler.handle(
        errorType,
        errorCode,
        errorMessage,
        error,
      );

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
  async handleOAuthCallback(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<AuthResult> {
    try {
      log(`Handling OAuth callback for ${provider}`);
      const core = this.assertInitialized();

      // Complete the OAuth flow
      const result = await this.completeOAuth(provider, authCode, state);

      if (!result.success || !result.userInfo) {
        throw new Error(result.error || "Failed to complete OAuth flow");
      }

      // Generate credentials from user info
      const credentials = await this.generateCredentials(
        result.userInfo,
        provider,
      );

      // Set authentication method
      core.setAuthMethod("oauth" as AuthMethod);

      // Login or sign up the user
      const authResult = await this._loginOrSignUp(
        credentials.username,
        credentials.password,
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
          userPub: authResult.userPub,
          username: credentials.username,
          method: "oauth",
          provider,
        });
      }

      return authResult;
    } catch (error: any) {
      logError(`Error handling OAuth callback for ${provider}:`, error);
      return {
        success: false,
        error: error.message || "Failed to handle OAuth callback",
      };
    }
  }

  /**
   * Private helper to login or sign up a user
   */
  private async _loginOrSignUp(
    username: string,
    password?: string,
  ): Promise<AuthResult> {
    const core = this.assertInitialized();

    if (!password) {
      return {
        success: false,
        error: "Password not provided for login/signup.",
      };
    }

    log(`Attempting login for user: ${username}`);
    const loginResult = await core.login(username, password);

    if (loginResult.success) {
      log(`Login successful for user: ${username}`);
      loginResult.isNewUser = false;
      return loginResult;
    }

    if (
      loginResult.error &&
      (loginResult.error.includes("Wrong user or password") ||
        loginResult.error.includes("No such user"))
    ) {
      log(`User ${username} does not exist, attempting signup.`);
      const signupResult = await core.signUp(username, password);
      if (signupResult.success) {
        // After successful signup, login the user to establish a session
        log(`Signup successful for ${username}, now logging in.`);
        const postSignupLoginResult = await core.login(username, password);
        if (postSignupLoginResult.success) {
          postSignupLoginResult.isNewUser = true; // Mark that this was a signup flow
          return postSignupLoginResult;
        }
        // This would be an unexpected error if login fails right after signup
        return {
          success: false,
          error:
            postSignupLoginResult.error ||
            "Login failed after successful signup.",
        };
      }
      return signupResult; // Return original signup failure
    }

    return {
      success: false,
      error: loginResult.error || "An unknown error occurred during login.",
    };
  }

  /**
   * Alias for handleOAuthCallback for backward compatibility
   * @deprecated Use handleOAuthCallback instead
   */
  async handleSimpleOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<AuthResult> {
    log(
      `handleSimpleOAuth called (alias for handleOAuthCallback) for ${provider}`,
    );
    return this.handleOAuthCallback(provider, authCode, state);
  }

  /**
   * Get cached user info for a user
   */
  getCachedUserInfo(
    userId: string,
    provider: OAuthProvider,
  ): OAuthUserInfo | null {
    return this.assertOAuthConnector().getCachedUserInfo(userId, provider);
  }

  /**
   * Clear user info cache
   */
  clearUserCache(userId?: string, provider?: OAuthProvider): void {
    this.assertOAuthConnector().clearUserCache(userId, provider);
  }
}
