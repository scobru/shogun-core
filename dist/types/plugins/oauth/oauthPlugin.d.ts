import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { OAuthPluginInterface, OAuthConfig, OAuthProvider, OAuthConnectionResult, OAuthCredentials, OAuthUserInfo } from "./types";
import { AuthResult } from "../../types/shogun";
/**
 * OAuth Plugin for ShogunCore
 * Provides authentication with external OAuth providers
 */
export declare class OAuthPlugin extends BasePlugin implements OAuthPluginInterface {
    name: string;
    version: string;
    description: string;
    private oauthConnector;
    private config;
    private storage;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore, appToken?: string): void;
    /**
     * Configure the OAuth plugin with provider settings
     * @param config - Configuration options for OAuth
     */
    configure(config: Partial<OAuthConfig>): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Ensure that the OAuth connector is initialized
     * @private
     */
    private assertOAuthConnector;
    /**
     * @inheritdoc
     */
    isSupported(): boolean;
    /**
     * @inheritdoc
     */
    getAvailableProviders(): OAuthProvider[];
    /**
     * @inheritdoc
     */
    initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;
    /**
     * @inheritdoc
     */
    completeOAuth(provider: OAuthProvider, authCode: string, state?: string): Promise<OAuthConnectionResult>;
    /**
     * @inheritdoc
     */
    generateCredentials(userInfo: OAuthUserInfo, provider: OAuthProvider): Promise<OAuthCredentials>;
    /**
     * Login with OAuth
     * @param provider - OAuth provider to use
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using OAuth with external providers
     */
    login(provider: OAuthProvider): Promise<AuthResult>;
    /**
     * Sign up with OAuth
     * @param provider - OAuth provider to use
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using OAuth with external providers
     */
    signUp(provider: OAuthProvider): Promise<AuthResult>;
    /**
     * Handle OAuth callback (for frontend integration)
     * This method would be called when the OAuth provider redirects back
     */
    handleOAuthCallback(provider: OAuthProvider, authCode: string, state: string): Promise<AuthResult>;
    /**
     * Private helper to login or sign up a user
     */
    private _loginOrSignUp;
    /**
     * Alias for handleOAuthCallback for backward compatibility
     * @deprecated Use handleOAuthCallback instead
     */
    handleSimpleOAuth(provider: OAuthProvider, authCode: string, state: string): Promise<AuthResult>;
    /**
     * Get cached user info for a user
     */
    getCachedUserInfo(userId: string, provider: OAuthProvider): OAuthUserInfo | null;
    /**
     * Clear user info cache
     */
    clearUserCache(userId?: string, provider?: OAuthProvider): void;
}
