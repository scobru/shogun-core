/**
 * OAuth Connector - Secure version for GunDB user creation
 */
// @ts-nocheck

import { EventEmitter } from "../../utils/eventEmitter";
import { OAuthConfig, OAuthProvider, OAuthUserInfo, OAuthCredentials, OAuthConnectionResult } from "./types";
/**
 * OAuth Connector
 */
export declare class OAuthConnector extends EventEmitter {
    private readonly DEFAULT_CONFIG;
    private config;
    private readonly userCache;
    private readonly memoryStorage;
    constructor(config?: Partial<OAuthConfig>);
    /**
     * Validates security configuration
     */
    private validateSecurityConfig;
    /**
     * Update the connector configuration
     * @param config - New configuration options
     */
    updateConfig(config: Partial<OAuthConfig>): void;
    /**
     * Get origin URL (browser or Node.js compatible)
     */
    private getOrigin;
    /**
     * Storage abstraction (browser sessionStorage or Node.js Map)
     */
    private setItem;
    private getItem;
    private removeItem;
    /**
     * Check if OAuth is supported
     */
    isSupported(): boolean;
    /**
     * Get available OAuth providers
     */
    getAvailableProviders(): OAuthProvider[];
    /**
     * Generate PKCE challenge for secure OAuth flow
     */
    private generatePKCEChallenge;
    /**
     * Calculate the PKCE code challenge from a code verifier.
     * Hashes the verifier using SHA-256 and then base64url encodes it.
     * @param verifier The code verifier string.
     * @returns The base64url-encoded SHA-256 hash of the verifier.
     */
    private calculatePKCECodeChallenge;
    /**
     * Encodes a buffer into a Base64URL-encoded string.
     * @param buffer The buffer to encode.
     * @returns The Base64URL-encoded string.
     */
    private base64urlEncode;
    /**
     * Generate cryptographically secure random string
     */
    private generateRandomString;
    /**
     * Initiate OAuth flow
     */
    initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult>;
    /**
     * Complete OAuth flow
     */
    completeOAuth(provider: OAuthProvider, authCode: string, state?: string): Promise<OAuthConnectionResult>;
    /**
     * Generate credentials from OAuth user info
     * Ora restituisce anche la chiave GunDB derivata (key)
     */
    generateCredentials(userInfo: OAuthUserInfo, provider: OAuthProvider): Promise<OAuthCredentials & {
        key: any;
    }>;
    /**
     * Exchange authorization code for access token
     */
    private exchangeCodeForToken;
    /**
     * Fetch user info from provider
     */
    private fetchUserInfo;
    /**
     * Normalize user info from different providers
     */
    private normalizeUserInfo;
    /**
     * Cache user info
     */
    private cacheUserInfo;
    /**
     * Get cached user info
     */
    getCachedUserInfo(userId: string, provider: OAuthProvider): OAuthUserInfo | null;
    /**
     * Clear user cache
     */
    clearUserCache(userId?: string, provider?: OAuthProvider): void;
    /**
     * Cleanup
     */
    cleanup(): void;
    /**
     * Clean up expired OAuth data from storage
     */
    private cleanupExpiredOAuthData;
}
