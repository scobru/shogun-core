import { OAuthPlugin } from "../../../plugins/oauth/oauthPlugin";
import { OAuthConfig, OAuthProvider } from "../../../plugins/oauth/types";
import { ShogunCore } from "../../../index";

// Mock dependencies
jest.mock("../../../plugins/oauth/oauthConnector");
jest.mock("../../../storage/storage");
jest.mock("../../../utils/errorHandler");

const MockOAuthConnector =
  require("../../../plugins/oauth/oauthConnector").OAuthConnector;
const MockShogunStorage = require("../../../storage/storage").ShogunStorage;

describe("OAuthPlugin", () => {
  let plugin: OAuthPlugin;
  let mockCore: ShogunCore;
  let mockConnector: any;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockConnector = {
      getAvailableProviders: jest.fn().mockReturnValue(["google", "github"]),
      initiateOAuth: jest.fn(),
      completeOAuth: jest.fn(),
      generateCredentials: jest.fn(),
    };

    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    };

    MockOAuthConnector.mockImplementation(() => mockConnector);
    MockShogunStorage.mockImplementation(() => mockStorage);

    mockCore = {
      // Add minimal mock properties as needed
    } as any;

    plugin = new OAuthPlugin();
  });

  describe("Constructor", () => {
    it("should create OAuthPlugin with default config", () => {
      expect(plugin.name).toBe("oauth");
      expect(plugin.version).toBe("1.0.0");
      expect(plugin.description).toContain("OAuth authentication");
    });

    it("should create OAuthPlugin with custom config", () => {
      const config: Partial<OAuthConfig> = {
        providers: {
          google: {
            clientId: "test-client-id",
            usePKCE: true,
          },
        },
      };

      const customPlugin = new OAuthPlugin(config);
      expect(customPlugin).toBeInstanceOf(OAuthPlugin);
    });
  });

  describe("initialize", () => {
    it("should initialize plugin with core", () => {
      plugin.initialize(mockCore);

      expect(plugin["core"]).toBe(mockCore);
      expect(MockShogunStorage).toHaveBeenCalled();
      expect(MockOAuthConnector).toHaveBeenCalled();
    });

    it("should initialize with existing config", () => {
      const config: Partial<OAuthConfig> = {
        providers: {
          google: {
            clientId: "test-client-id",
            usePKCE: true,
          },
        },
      };

      const customPlugin = new OAuthPlugin(config);
      customPlugin.initialize(mockCore);

      expect(MockOAuthConnector).toHaveBeenCalledWith(config);
    });
  });

  describe("configure", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should configure plugin with new settings", () => {
      const newConfig: Partial<OAuthConfig> = {
        providers: {
          github: {
            clientId: "github-client-id",
            usePKCE: true,
          },
        },
      };

      plugin.configure(newConfig);

      expect(MockOAuthConnector).toHaveBeenCalledWith(
        expect.objectContaining({
          providers: expect.objectContaining({
            github: expect.objectContaining({
              clientId: "github-client-id",
            }),
          }),
        }),
      );
    });

    it("should merge configuration with existing config", () => {
      const initialConfig: Partial<OAuthConfig> = {
        providers: {
          google: {
            clientId: "google-client-id",
            usePKCE: true,
          },
        },
      };

      const pluginWithConfig = new OAuthPlugin(initialConfig);
      pluginWithConfig.initialize(mockCore);

      const additionalConfig: Partial<OAuthConfig> = {
        providers: {
          github: {
            clientId: "github-client-id",
            usePKCE: true,
          },
        },
      };

      pluginWithConfig.configure(additionalConfig);

      expect(MockOAuthConnector).toHaveBeenCalledWith(
        expect.objectContaining({
          providers: expect.objectContaining({
            google: expect.objectContaining({
              clientId: "google-client-id",
            }),
            github: expect.objectContaining({
              clientId: "github-client-id",
            }),
          }),
        }),
      );
    });
  });

  describe("destroy", () => {
    it("should destroy plugin and cleanup resources", () => {
      plugin.initialize(mockCore);
      plugin.destroy();

      expect(plugin["oauthConnector"]).toBeNull();
      expect(plugin["storage"]).toBeNull();
    });
  });

  describe("isSupported", () => {
    it("should return true when connector is available", () => {
      plugin.initialize(mockCore);
      expect(plugin.isSupported()).toBe(true);
    });

    it("should return false when connector is not available", () => {
      // Create a new plugin without initialization to test the fallback
      const uninitializedPlugin = new OAuthPlugin();
      expect(uninitializedPlugin.isSupported()).toBe(false);
    });
  });

  describe("getAvailableProviders", () => {
    it("should return available providers from connector", () => {
      plugin.initialize(mockCore);
      const providers = plugin.getAvailableProviders();

      expect(providers).toEqual(["google", "github"]);
      expect(mockConnector.getAvailableProviders).toHaveBeenCalled();
    });

    it("should return empty array when connector is not available", () => {
      // Create a new plugin without initialization to test the fallback
      const uninitializedPlugin = new OAuthPlugin();
      expect(uninitializedPlugin.getAvailableProviders()).toEqual([]);
    });
  });

  describe("initiateOAuth", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should initiate OAuth flow", async () => {
      const mockResult = {
        authUrl: "https://oauth.provider.com/auth",
        state: "test-state",
      };

      mockConnector.initiateOAuth.mockResolvedValue(mockResult);

      const result = await plugin.initiateOAuth("google");

      expect(mockConnector.initiateOAuth).toHaveBeenCalledWith("google");
      expect(result).toEqual(mockResult);
    });

    it("should throw error when connector is not available", async () => {
      plugin.destroy();

      await expect(plugin.initiateOAuth("google")).rejects.toThrow();
    });
  });

  describe("completeOAuth", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should complete OAuth flow", async () => {
      const mockResult = {
        accessToken: "test-token",
        userInfo: { id: "user123", email: "test@example.com" },
      };

      mockConnector.completeOAuth.mockResolvedValue(mockResult);

      const result = await plugin.completeOAuth("google", "auth-code", "state");

      expect(mockConnector.completeOAuth).toHaveBeenCalledWith(
        "google",
        "auth-code",
        "state",
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("generateCredentials", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should generate credentials from user info", async () => {
      const userInfo = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      };

      const mockCredentials = {
        username: "test@example.com",
        password: "generated-password",
      };

      mockConnector.generateCredentials.mockResolvedValue(mockCredentials);

      const result = await plugin.generateCredentials(userInfo, "google");

      expect(mockConnector.generateCredentials).toHaveBeenCalledWith(
        userInfo,
        "google",
      );
      expect(result).toEqual(mockCredentials);
    });
  });

  describe("login", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should perform OAuth login", async () => {
      const mockAuthResult = {
        success: true,
        redirectUrl: "https://oauth.provider.com/auth",
        pendingAuth: true,
        message:
          "Redirect to OAuth provider required to complete authentication",
        provider: "google",
        authMethod: "oauth",
      };

      mockConnector.initiateOAuth.mockResolvedValue({
        success: true,
        authUrl: "https://oauth.provider.com/auth",
        state: "test-state",
      });

      const result = await plugin.login("google");

      expect(result).toEqual(mockAuthResult);
    });
  });

  describe("signUp", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should perform OAuth signup", async () => {
      const mockSignUpResult = {
        success: true,
        redirectUrl: "https://oauth.provider.com/auth",
        pendingAuth: true,
        message: "Redirect to OAuth provider required to complete registration",
        provider: "google",
        authMethod: "oauth",
      };

      // Mock the internal flow - fix the initiateOAuth mock to return success
      mockConnector.initiateOAuth.mockResolvedValue({
        success: true,
        authUrl: "https://oauth.provider.com/auth",
        state: "test-state",
      });

      const result = await plugin.signUp("google");

      expect(result).toEqual(mockSignUpResult);
    });
  });

  describe("handleOAuthCallback", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should handle OAuth callback successfully", async () => {
      const mockAuthResult = {
        success: true,
        user: { id: "user123", email: "test@example.com" },
      };

      mockConnector.completeOAuth.mockResolvedValue({
        success: true,
        accessToken: "test-token",
        userInfo: { id: "user123", email: "test@example.com" },
      });

      mockConnector.generateCredentials.mockResolvedValue({
        username: "test@example.com",
        password: "generated-password",
        key: { pub: "test-pub", priv: "test-priv" },
      });

      // Mock core authentication methods
      plugin["core"] = {
        authenticate: jest.fn().mockResolvedValue(mockAuthResult),
        login: jest.fn().mockResolvedValue(mockAuthResult),
        signUp: jest.fn().mockResolvedValue(mockAuthResult),
        setAuthMethod: jest.fn(),
        user: {
          put: jest.fn().mockResolvedValue(undefined),
        },
        emit: jest.fn(),
      } as any;

      const result = await plugin.handleOAuthCallback(
        "google",
        "auth-code",
        "state",
      );

      // The actual result will have additional properties, so we check for the core success
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  // TODO: getCachedUserInfo method has been removed from OAuthPlugin
  // describe("getCachedUserInfo", () => {
  //   beforeEach(() => {
  //     plugin.initialize(mockCore);
  //   });

  //   it("should return cached user info", () => {
  //     const mockUserInfo = {
  //       id: "user123",
  //       email: "test@example.com",
  //       name: "Test User",
  //     };

  //     mockStorage.get.mockReturnValue(mockUserInfo);

  //     const result = plugin.getCachedUserInfo("user123", "google");

  //     expect(mockStorage.get).toHaveBeenCalledWith("oauth_user_google_user123");
  //     expect(result).toEqual(mockUserInfo);
  //   });

  //   it("should return null when no cached info exists", () => {
  //     mockStorage.get.mockReturnValue(null);

  //     const result = plugin.getCachedUserInfo("user123", "google");

  //     expect(result).toBeNull();
  //   });
  // });

  // TODO: clearUserCache method has been removed from OAuthPlugin
  // describe("clearUserCache", () => {
  //   beforeEach(() => {
  //     plugin.initialize(mockCore);
  //   });

  //   it("should clear specific user cache", () => {
  //     plugin.clearUserCache("user123", "google");

  //     expect(mockStorage.remove).toHaveBeenCalledWith(
  //       "oauth_user_google_user123",
  //     );
  //   });

  //   it("should clear all cache when no parameters provided", () => {
  //     plugin.clearUserCache();

  //     expect(mockStorage.remove).toHaveBeenCalledWith("oauth_user_");
  //   });
  // });

  describe("security validation", () => {
    it("should warn when PKCE is not enabled", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const config: Partial<OAuthConfig> = {
        providers: {
          google: {
            clientId: "test-client-id",
            usePKCE: false,
          },
        },
      };

      const customPlugin = new OAuthPlugin(config);
      customPlugin.initialize(mockCore);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("non ha PKCE abilitato"),
      );

      consoleSpy.mockRestore();
    });

    it("should throw error when client secret is used in browser", () => {
      const config: Partial<OAuthConfig> = {
        providers: {
          github: {
            clientId: "test-client-id",
            clientSecret: "test-secret",
            usePKCE: false,
          },
        },
      };

      const customPlugin = new OAuthPlugin(config);

      expect(() => {
        customPlugin.initialize(mockCore);
      }).toThrow("Client secret non può essere usato nel browser");
    });
  });
});
