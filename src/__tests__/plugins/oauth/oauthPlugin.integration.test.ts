import { OAuthPlugin } from "../../../plugins/oauth/oauthPlugin";
import { ShogunCore } from "../../../types/shogun";

// Mock semplificato per OAuthConnector - solo le API esterne
jest.mock("../../../plugins/oauth/oauthConnector", () => ({
  OAuthConnector: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    updateConfig: jest.fn(),
    cleanup: jest.fn(),
    isSupported: jest.fn(() => true),
    getAvailableProviders: jest.fn(() => ["google", "github", "twitter"]),
    initiateOAuth: jest.fn(() => "auth-url"),
    completeOAuth: jest.fn(() => ({
      success: true,
      userInfo: { id: "123", username: "testuser" },
    })),
    generateCredentials: jest.fn(() => ({
      username: "testuser",
      email: "test@example.com",
    })),
    login: jest.fn(() => ({
      success: true,
      user: { id: "123", username: "testuser" },
    })),
    signUp: jest.fn(() => ({
      success: true,
      user: { id: "123", username: "testuser" },
    })),
    getCachedUserInfo: jest.fn(() => ({ id: "123", username: "testuser" })),
    clearUserCache: jest.fn(),
  })),
}));

// Mock semplificato per storage - solo le API esterne
jest.mock("../../../storage/storage", () => ({
  ShogunStorage: jest.fn().mockImplementation(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

// Mock semplificato per errorHandler - solo le API esterne
jest.mock("../../../utils/errorHandler", () => ({
  ErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
  })),
}));

describe("OAuthPlugin Integration Tests", () => {
  let plugin: OAuthPlugin;
  let mockCore: ShogunCore;

  beforeEach(() => {
    // Mock core semplificato
    mockCore = {
      gun: {} as any,
      db: {} as any,
      rx: {} as any,
      storage: {} as any,
      config: {} as any,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };

    plugin = new OAuthPlugin();
  });

  describe("Plugin Initialization", () => {
    it("should initialize plugin successfully", () => {
      plugin.initialize(mockCore);

      expect(plugin["core"]).toBe(mockCore);
      expect(plugin["oauthConnector"]).toBeDefined();
    });

    it("should initialize with custom configuration", () => {
      const customConfig = {
        clientId: "custom-client-id",
        redirectUri: "http://localhost:3000/callback",
        providers: ["google", "github"],
        enablePKCE: true,
      };

      const customPlugin = new OAuthPlugin(customConfig);
      customPlugin.initialize(mockCore);

      expect(customPlugin["config"]).toEqual(customConfig);
    });
  });

  describe("Configuration Management", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should configure plugin with new settings", () => {
      const newConfig = {
        clientId: "new-client-id",
        redirectUri: "http://localhost:3000/new-callback",
      };

      plugin.configure(newConfig);

      expect(plugin["config"].clientId).toBe("new-client-id");
      expect(plugin["config"].redirectUri).toBe(
        "http://localhost:3000/new-callback"
      );
    });

    it("should merge configuration with existing config", () => {
      const initialConfig = {
        clientId: "initial-client-id",
        providers: ["google"],
      };

      const newConfig = {
        clientId: "new-client-id",
        providers: ["github"],
      };

      plugin.configure(initialConfig);
      plugin.configure(newConfig);

      expect(plugin["config"].clientId).toBe("new-client-id");
      expect(plugin["config"].providers).toEqual(["github"]);
    });
  });

  describe("Plugin Lifecycle", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should destroy plugin and cleanup resources", () => {
      plugin.destroy();

      expect(plugin["oauthConnector"]).toBeNull();
      expect(plugin["storage"]).toBeNull();
    });
  });

  describe("OAuth Functionality", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should check if OAuth is supported", () => {
      const isSupported = plugin.isSupported();

      expect(isSupported).toBe(true);
    });

    it("should get available providers", () => {
      const providers = plugin.getAvailableProviders();

      expect(providers).toEqual(["google", "github", "twitter"]);
    });

    it("should initiate OAuth flow", () => {
      const authUrl = plugin.initiateOAuth("google");

      expect(authUrl).toBe("auth-url");
    });

    it("should complete OAuth flow", async () => {
      const result = await plugin.completeOAuth("google", "auth-code");

      expect(result.success).toBe(true);
      expect(result.userInfo).toEqual({ id: "123", username: "testuser" });
    });

    it("should generate credentials from user info", () => {
      const userInfo = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      };
      const credentials = plugin.generateCredentials(userInfo);

      expect(credentials.username).toBe("testuser");
      expect(credentials.email).toBe("test@example.com");
    });
  });

  describe("Authentication Methods", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should perform OAuth login", async () => {
      const result = await plugin.login("google");

      expect(result.success).toBe(true);
      expect(result.user).toEqual({ id: "123", username: "testuser" });
    });

    it("should perform OAuth signup", async () => {
      const result = await plugin.signUp("google");

      expect(result.success).toBe(true);
      expect(result.user).toEqual({ id: "123", username: "testuser" });
    });
  });

  describe("User Management", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should handle OAuth callback", async () => {
      const result = await plugin.handleOAuthCallback("google", "auth-code");

      expect(result.success).toBe(true);
    });

    it("should get cached user info", () => {
      const userInfo = plugin.getCachedUserInfo("123", "google");

      expect(userInfo).toEqual({ id: "123", username: "testuser" });
    });

    it("should clear specific user cache", () => {
      expect(() => {
        plugin.clearUserCache("123", "google");
      }).not.toThrow();
    });

    it("should clear all cache when no parameters provided", () => {
      expect(() => {
        plugin.clearUserCache();
      }).not.toThrow();
    });
  });

  describe("Security Validation", () => {
    it("should warn when PKCE is not enabled", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const customPlugin = new OAuthPlugin({
        clientId: "test-client-id",
        enablePKCE: false,
      });
      customPlugin.initialize(mockCore);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("non ha PKCE abilitato")
      );

      consoleSpy.mockRestore();
    });

    it("should throw error when client secret is used in browser", () => {
      const customPlugin = new OAuthPlugin({
        clientId: "test-client-id",
        clientSecret: "test-secret", // Questo dovrebbe causare un errore
      });

      expect(() => {
        customPlugin.initialize(mockCore);
      }).toThrow("Client secret non può essere usato nel browser");
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should handle OAuth errors gracefully", async () => {
      // Mock OAuthConnector per simulare un errore
      const mockConnector = plugin["oauthConnector"];
      mockConnector.initiateOAuth = jest.fn(() => {
        throw new Error("OAuth error");
      });

      expect(() => {
        plugin.initiateOAuth("google");
      }).toThrow("OAuth error");
    });

    it("should handle initialization errors", () => {
      const invalidPlugin = new OAuthPlugin();

      expect(() => {
        invalidPlugin.isSupported();
      }).toThrow("Plugin oauth not initialized");
    });
  });

  describe("Integration Scenarios", () => {
    beforeEach(() => {
      plugin.initialize(mockCore);
    });

    it("should handle complete OAuth flow", async () => {
      // 1. Check if supported
      expect(plugin.isSupported()).toBe(true);

      // 2. Get available providers
      const providers = plugin.getAvailableProviders();
      expect(providers).toContain("google");

      // 3. Initiate OAuth
      const authUrl = plugin.initiateOAuth("google");
      expect(authUrl).toBe("auth-url");

      // 4. Complete OAuth
      const result = await plugin.completeOAuth("google", "auth-code");
      expect(result.success).toBe(true);

      // 5. Login
      const loginResult = await plugin.login("google");
      expect(loginResult.success).toBe(true);
    });

    it("should handle user management flow", () => {
      // 1. Get cached user info
      const userInfo = plugin.getCachedUserInfo("123", "google");
      expect(userInfo).toBeDefined();

      // 2. Clear specific cache
      plugin.clearUserCache("123", "google");

      // 3. Clear all cache
      plugin.clearUserCache();
    });

    it("should handle configuration updates", () => {
      // 1. Initial configuration
      plugin.configure({
        clientId: "initial-client",
        providers: ["google"],
      });

      // 2. Update configuration
      plugin.configure({
        clientId: "updated-client",
        providers: ["github"],
        enablePKCE: true,
      });

      // 3. Verify configuration
      expect(plugin["config"].clientId).toBe("updated-client");
      expect(plugin["config"].providers).toEqual(["github"]);
      expect(plugin["config"].enablePKCE).toBe(true);
    });

    it("should handle plugin lifecycle", () => {
      // 1. Initialize
      expect(plugin["oauthConnector"]).toBeDefined();
      expect(plugin["storage"]).toBeDefined();

      // 2. Destroy
      plugin.destroy();
      expect(plugin["oauthConnector"]).toBeNull();
      expect(plugin["storage"]).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty configuration", () => {
      const emptyPlugin = new OAuthPlugin({});
      emptyPlugin.initialize(mockCore);

      expect(emptyPlugin["config"]).toEqual({});
    });

    it("should handle multiple configuration updates", () => {
      plugin.initialize(mockCore);

      plugin.configure({ clientId: "first" });
      plugin.configure({ clientId: "second" });
      plugin.configure({ clientId: "third" });

      expect(plugin["config"].clientId).toBe("third");
    });

    it("should handle invalid provider", () => {
      plugin.initialize(mockCore);

      // Should not throw for invalid provider
      expect(() => {
        plugin.initiateOAuth("invalid-provider");
      }).not.toThrow();
    });
  });
});
