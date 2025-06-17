import Gun from "gun";
import { OAuthConnector } from "./oauthConnector";
import { OAuthProvider } from "./types";

const oauthChain = () => {
  const oauth = new OAuthConnector();

  // Initialize the oauth chain object if it doesn't exist
  if (!(Gun.chain as any).oauth) {
    (Gun.chain as any).oauth = {};
  }

  /**
   * Check if OAuth is supported
   */
  (Gun.chain as any).oauth.isSupported = function () {
    return oauth.isSupported();
  };

  /**
   * Get available OAuth providers
   */
  (Gun.chain as any).oauth.getAvailableProviders = function () {
    return oauth.getAvailableProviders();
  };

  /**
   * Initiate OAuth flow with a provider
   */
  (Gun.chain as any).oauth.initiateOAuth = async function (
    provider: OAuthProvider,
  ) {
    return await oauth.initiateOAuth(provider);
  };

  /**
   * Complete OAuth flow
   */
  (Gun.chain as any).oauth.completeOAuth = async function (
    provider: OAuthProvider,
    authCode: string,
    state?: string,
  ) {
    return await oauth.completeOAuth(provider, authCode, state);
  };

  /**
   * Generate credentials from OAuth user info
   */
  (Gun.chain as any).oauth.generateCredentials = async function (
    userInfo: any,
    provider: OAuthProvider,
  ) {
    return await oauth.generateCredentials(userInfo, provider);
  };

  // === CONVENIENCE METHODS FOR SPECIFIC PROVIDERS ===

  /**
   * Google OAuth flow
   */
  (Gun.chain as any).oauth.google = {
    initiate: async function () {
      return await oauth.initiateOAuth("google");
    },
    complete: async function (authCode: string, state?: string) {
      return await oauth.completeOAuth("google", authCode, state);
    },
  };

  /**
   * GitHub OAuth flow
   */
  (Gun.chain as any).oauth.github = {
    initiate: async function () {
      return await oauth.initiateOAuth("github");
    },
    complete: async function (authCode: string, state?: string) {
      return await oauth.completeOAuth("github", authCode, state);
    },
  };

  /**
   * Discord OAuth flow
   */
  (Gun.chain as any).oauth.discord = {
    initiate: async function () {
      return await oauth.initiateOAuth("discord");
    },
    complete: async function (authCode: string, state?: string) {
      return await oauth.completeOAuth("discord", authCode, state);
    },
  };

  /**
   * Twitter OAuth flow
   */
  (Gun.chain as any).oauth.twitter = {
    initiate: async function () {
      return await oauth.initiateOAuth("twitter");
    },
    complete: async function (authCode: string, state?: string) {
      return await oauth.completeOAuth("twitter", authCode, state);
    },
  };

  /**
   * Setup OAuth for a specific provider with configuration
   */
  (Gun.chain as any).oauth.setup = function (
    provider: OAuthProvider,
    config: any,
  ) {
    try {
      console.log(`Setting up OAuth for ${provider}`);

      // Store configuration securely
      const configKey = `oauth_config_${provider}`;
      sessionStorage.setItem(configKey, JSON.stringify(config));

      return {
        success: true,
        provider,
        message: `OAuth configured for ${provider}`,
      };
    } catch (error: any) {
      console.error(`Error setting up OAuth for ${provider}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Get configuration for a provider
   */
  (Gun.chain as any).oauth.getConfig = function (provider: OAuthProvider) {
    try {
      const configKey = `oauth_config_${provider}`;
      const config = sessionStorage.getItem(configKey);

      if (!config) {
        return {
          success: false,
          error: `No configuration found for ${provider}`,
        };
      }

      return {
        success: true,
        config: JSON.parse(config),
      };
    } catch (error: any) {
      console.error(`Error getting config for ${provider}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Cleanup OAuth resources
   */
  (Gun.chain as any).oauth.cleanup = function () {
    try {
      oauth.cleanup();

      // Clear all OAuth related session storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("oauth_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));

      return { success: true, message: "OAuth cleanup completed" };
    } catch (error: any) {
      console.error("Error during OAuth cleanup:", error);
      return { success: false, error: error.message };
    }
  };
};

export default oauthChain;
