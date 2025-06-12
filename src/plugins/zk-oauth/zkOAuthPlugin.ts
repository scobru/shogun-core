import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { ZKOAuthConnectorMinimal } from "./zkOAuthConnector";
import {
  ZKOAuthPluginInterface,
  ZKOAuthConfig,
  OAuthProvider,
  ZKOAuthConnectionResult,
  ZKProofResult,
  ZKOAuthCredentials,
  OAuthUserInfo,
  ZKProof,
  PaillierKeyPair,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * ZK-OAuth Plugin for ShogunCore
 * Provides zero-knowledge authentication with external OAuth providers
 */
export class ZKOAuthPlugin
  extends BasePlugin
  implements ZKOAuthPluginInterface
{
  name = "zk-oauth";
  version = "1.0.0";
  description =
    "Provides zero-knowledge OAuth authentication with external providers for ShogunCore";

  private zkOAuthConnector: ZKOAuthConnectorMinimal | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize the ZK-OAuth connector (minimal version without Paillier)
    this.zkOAuthConnector = new ZKOAuthConnectorMinimal();

    log("ZK-OAuth plugin initialized successfully (minimal version)");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.zkOAuthConnector) {
      this.zkOAuthConnector.cleanup();
    }
    this.zkOAuthConnector = null;
    super.destroy();
    log("ZK-OAuth plugin destroyed");
  }

  /**
   * Ensure that the ZK-OAuth connector is initialized
   * @private
   */
  private assertZKOAuthConnector(): ZKOAuthConnectorMinimal {
    this.assertInitialized();
    if (!this.zkOAuthConnector) {
      throw new Error("ZK-OAuth connector not initialized");
    }
    return this.zkOAuthConnector;
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    return this.assertZKOAuthConnector().isSupported();
  }

  /**
   * @inheritdoc
   */
  getAvailableProviders(): OAuthProvider[] {
    return this.assertZKOAuthConnector().getAvailableProviders();
  }

  /**
   * @inheritdoc
   */
  async initiateOAuth(
    provider: OAuthProvider,
  ): Promise<ZKOAuthConnectionResult> {
    log(`Initiating ZK-OAuth flow with ${provider}`);
    return this.assertZKOAuthConnector().initiateOAuth(provider);
  }

  /**
   * @inheritdoc
   */
  async completeOAuth(
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ): Promise<ZKProofResult> {
    log(`Completing ZK-OAuth flow with ${provider}`);
    return this.assertZKOAuthConnector().completeOAuth(
      provider,
      authCode,
      state,
    );
  }

  /**
   * @inheritdoc
   */
  async generateZKCredentials(
    userInfo: OAuthUserInfo,
    provider: OAuthProvider,
  ): Promise<ZKOAuthCredentials> {
    log(`Generating ZK credentials for ${provider} user`);
    return this.assertZKOAuthConnector().generateZKCredentialsMinimal(
      userInfo,
      provider,
    );
  }

  /**
   * @inheritdoc
   */
  async verifyZKProof(proof: ZKProof): Promise<boolean> {
    return this.assertZKOAuthConnector().verifyZKProof(proof);
  }

  /**
   * Generate Paillier keys (not available in minimal version)
   * @deprecated Use the full ZKOAuthConnector if you need Paillier encryption
   */
  async generatePaillierKeys(
    bitLength: number = 2048,
  ): Promise<PaillierKeyPair> {
    throw new Error(
      "Paillier encryption not available in minimal ZK-OAuth version. Use ZKOAuthConnector for Paillier support.",
    );
  }

  /**
   * @inheritdoc
   */
  async encryptWithPaillier(
    data: string,
    publicKey: PaillierKeyPair["publicKey"],
  ): Promise<string> {
    throw new Error(
      "Paillier encryption not available in minimal ZK-OAuth version. Use ZKOAuthConnector for Paillier support.",
    );
  }

  /**
   * @inheritdoc
   */
  async decryptWithPaillier(
    encryptedData: string,
    privateKey: PaillierKeyPair["privateKey"],
    publicKey: PaillierKeyPair["publicKey"],
  ): Promise<string> {
    throw new Error(
      "Paillier encryption not available in minimal ZK-OAuth version. Use ZKOAuthConnector for Paillier support.",
    );
  }

  /**
   * Login with ZK-OAuth
   * @param provider - OAuth provider to use
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using zero-knowledge proofs with external OAuth providers
   */
  async login(provider: OAuthProvider): Promise<AuthResult> {
    log(`ZK-OAuth login with ${provider}`);

    try {
      const core = this.assertInitialized();
      log(`ZK-OAuth login attempt with provider: ${provider}`);

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for ZK-OAuth login",
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "ZK_OAUTH_UNAVAILABLE",
          "ZK-OAuth is not supported in this environment",
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

      // For login, we need to handle the OAuth flow
      // This would typically involve redirecting to the provider
      // and then handling the callback

      // For now, we'll simulate a successful OAuth flow
      // In a real implementation, this would be handled by the frontend
      logWarn(
        "ZK-OAuth login requires OAuth flow completion - this is a placeholder",
      );

      // Simulate successful authentication
      const mockCredentials: ZKOAuthCredentials = {
        username: `zk_${provider}_user`,
        password: "mock_password_from_zk_proof",
        zkProof: {
          proof: "mock_proof",
          publicSignals: ["signal1", "signal2"],
          verificationKey: "mock_vk",
        },
        provider,
        encryptedUserInfo: "encrypted_user_data",
        publicKey: "mock_public_key",
      };

      // Set authentication method to zk-oauth before login
      core.setAuthMethod("zk-oauth");

      // Use core's login method with ZK-generated credentials
      log("Logging in using core login method with ZK credentials...");
      const loginResult = await core.login(
        mockCredentials.username,
        mockCredentials.password,
      );

      if (!loginResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "ZK_OAUTH_LOGIN_FAILED",
          loginResult.error || "Failed to log in with ZK-OAuth credentials",
        );
      }

      // Emit login event
      core.emit("auth:login", {
        userPub: loginResult.userPub,
        username: mockCredentials.username,
        method: "zk-oauth",
        provider,
      });

      return loginResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "ZK_OAUTH_LOGIN_ERROR";
      const errorMessage =
        error?.message || "Unknown error during ZK-OAuth login";

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
   * Sign up with ZK-OAuth
   * @param provider - OAuth provider to use
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account using zero-knowledge proofs with external OAuth providers
   */
  async signUp(provider: OAuthProvider): Promise<AuthResult> {
    log(`ZK-OAuth signup with ${provider}`);

    try {
      const core = this.assertInitialized();
      log(`ZK-OAuth signup attempt with provider: ${provider}`);

      if (!provider) {
        throw createError(
          ErrorType.VALIDATION,
          "PROVIDER_REQUIRED",
          "OAuth provider required for ZK-OAuth signup",
        );
      }

      if (!this.isSupported()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "ZK_OAUTH_UNAVAILABLE",
          "ZK-OAuth is not supported in this environment",
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

      // For signup, we need to handle the OAuth flow
      // This would typically involve redirecting to the provider
      // and then handling the callback

      // For now, we'll simulate a successful OAuth flow
      // In a real implementation, this would be handled by the frontend
      logWarn(
        "ZK-OAuth signup requires OAuth flow completion - this is a placeholder",
      );

      // Simulate successful authentication and credential generation
      const mockCredentials: ZKOAuthCredentials = {
        username: `zk_${provider}_user`,
        password: "mock_password_from_zk_proof",
        zkProof: {
          proof: "mock_proof",
          publicSignals: ["signal1", "signal2"],
          verificationKey: "mock_vk",
        },
        provider,
        encryptedUserInfo: "encrypted_user_data",
        publicKey: "mock_public_key",
      };

      // Verify the ZK proof
      const isValidProof = await this.verifyZKProof(mockCredentials.zkProof);
      if (!isValidProof) {
        throw createError(
          ErrorType.SECURITY,
          "ZK_PROOF_VERIFICATION_FAILED",
          "Zero-knowledge proof verification failed",
        );
      }

      // Set authentication method to zk-oauth before signup
      core.setAuthMethod("zk-oauth");

      // Use core's signUp method with ZK-generated credentials
      log("Signing up using core signUp method with ZK credentials...");
      const signUpResult = await core.signUp(
        mockCredentials.username,
        mockCredentials.password,
      );

      if (!signUpResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "ZK_OAUTH_SIGNUP_FAILED",
          signUpResult.error || "Failed to sign up with ZK-OAuth credentials",
        );
      }

      // Emit signup event
      core.emit("auth:signup", {
        userPub: signUpResult.userPub,
        username: mockCredentials.username,
        method: "zk-oauth",
        provider,
      });

      return signUpResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "ZK_OAUTH_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during ZK-OAuth signup";

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

      // Complete the OAuth flow and generate ZK proof
      const result = await this.completeOAuth(provider, authCode, state);

      if (!result.success || !result.credentials) {
        throw new Error(result.error || "Failed to complete OAuth flow");
      }

      const core = this.assertInitialized();

      // Set authentication method
      core.setAuthMethod("zk-oauth");

      // Try to login first (user might already exist)
      let authResult = await core.login(
        result.credentials.username,
        result.credentials.password,
      );

      // If login fails, try to sign up
      if (!authResult.success) {
        authResult = await core.signUp(
          result.credentials.username,
          result.credentials.password,
        );
      }

      if (authResult.success) {
        // Emit appropriate event
        const eventType = authResult.userPub ? "auth:login" : "auth:signup";
        core.emit(eventType, {
          userPub: authResult.userPub,
          username: result.credentials.username,
          method: "zk-oauth",
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
   * Get cached ZK proof for a user
   */
  getCachedZKProof(userId: string, provider: OAuthProvider): ZKProof | null {
    return this.assertZKOAuthConnector().getCachedZKProof(userId, provider);
  }

  /**
   * Clear ZK proof cache
   */
  clearZKProofCache(userId?: string, provider?: OAuthProvider): void {
    this.assertZKOAuthConnector().clearZKProofCache(userId, provider);
  }
}
