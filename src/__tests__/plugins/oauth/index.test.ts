import {
  OAuthConnector,
  OAuthPlugin,
  OAuthPluginInterface,
  OAuthConfig,
  OAuthProvider,
  OAuthCredentials,
  OAuthConnectionResult,
  OAuthUserInfo,
} from "../../../plugins/oauth/index";

describe("OAuth Plugin Index", () => {
  describe("Class exports", () => {
    it("should export OAuthConnector class", () => {
      expect(OAuthConnector).toBeDefined();
      expect(typeof OAuthConnector).toBe("function");
    });

    it("should export OAuthPlugin class", () => {
      expect(OAuthPlugin).toBeDefined();
      expect(typeof OAuthPlugin).toBe("function");
    });
  });

  describe("Type exports", () => {
    it("should export OAuthPluginInterface type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockInterface: OAuthPluginInterface = {
        name: "oauth",
        version: "1.0.0",
        initialize: jest.fn(),
        destroy: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        getUserInfo: jest.fn(),
      };
      expect(mockInterface).toBeDefined();
    });

    it("should export OAuthConfig type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockConfig: OAuthConfig = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "https://example.com/callback",
        scope: "read write",
      };
      expect(mockConfig).toBeDefined();
    });

    it("should export OAuthProvider type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockProvider: OAuthProvider = {
        name: "google",
        authUrl: "https://accounts.google.com/oauth/authorize",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      };
      expect(mockProvider).toBeDefined();
    });

    it("should export OAuthCredentials type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockCredentials: OAuthCredentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      };
      expect(mockCredentials).toBeDefined();
    });

    it("should export OAuthConnectionResult type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockResult: OAuthConnectionResult = {
        success: true,
        credentials: {
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
          expiresIn: 3600,
          tokenType: "Bearer",
        },
        userInfo: {
          id: "user123",
          email: "user@example.com",
          name: "Test User",
          picture: "https://example.com/avatar.jpg",
        },
      };
      expect(mockResult).toBeDefined();
    });

    it("should export OAuthUserInfo type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockUserInfo: OAuthUserInfo = {
        id: "user123",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };
      expect(mockUserInfo).toBeDefined();
    });
  });

  describe("Module structure", () => {
    it("should export all expected classes and types", () => {
      const moduleExports = require("../../../plugins/oauth/index");

      // Class exports
      expect(moduleExports.OAuthConnector).toBeDefined();
      expect(moduleExports.OAuthPlugin).toBeDefined();

      // Type exports are TypeScript types, not runtime exports
      // expect(moduleExports.OAuthPluginInterface).toBeDefined();
      // expect(moduleExports.OAuthConfig).toBeDefined();
      // expect(moduleExports.OAuthProvider).toBeDefined();
      // expect(moduleExports.OAuthCredentials).toBeDefined();
      // expect(moduleExports.OAuthConnectionResult).toBeDefined();
      // expect(moduleExports.OAuthUserInfo).toBeDefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow plugin classes to be instantiated", () => {
      // Test that we can create instances of the exported classes
      // These will fail due to missing dependencies, but we can test the exports
      // OAuthConnector should not throw when instantiated without dependencies
      expect(() => {
        new OAuthConnector();
      }).not.toThrow();

      // OAuthPlugin should not throw when instantiated without dependencies
      expect(() => {
        new OAuthPlugin();
      }).not.toThrow();
    });
  });
});
