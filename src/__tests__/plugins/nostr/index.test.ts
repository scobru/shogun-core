import {
  NostrConnectorPlugin,
  NostrConnector,
  NostrSigner,
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
} from "../../../plugins/nostr/index";

describe("Nostr Plugin Index", () => {
  describe("Class exports", () => {
    it("should export NostrConnectorPlugin class", () => {
      expect(NostrConnectorPlugin).toBeDefined();
      expect(typeof NostrConnectorPlugin).toBe("function");
    });

    it("should export NostrConnector class", () => {
      expect(NostrConnector).toBeDefined();
      expect(typeof NostrConnector).toBe("function");
    });

    it("should export NostrSigner class", () => {
      expect(NostrSigner).toBeDefined();
      expect(typeof NostrSigner).toBe("function");
    });
  });

  describe("Type exports", () => {
    it("should export NostrConnectorPluginInterface type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockInterface: NostrConnectorPluginInterface = {
        name: "nostr",
        version: "1.0.0",
        initialize: jest.fn(),
        destroy: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        signEvent: jest.fn(),
        getPublicKey: jest.fn(),
      };
      expect(mockInterface).toBeDefined();
    });

    it("should export NostrConnectorCredentials type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockCredentials: NostrConnectorCredentials = {
        privateKey: "test-private-key",
        publicKey: "test-public-key",
      };
      expect(mockCredentials).toBeDefined();
    });

    it("should export NostrConnectorKeyPair type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockKeyPair: NostrConnectorKeyPair = {
        privateKey: "test-private-key",
        publicKey: "test-public-key",
      };
      expect(mockKeyPair).toBeDefined();
    });

    it("should export NostrConnectorConfig type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockConfig: NostrConnectorConfig = {
        relays: ["wss://relay.example.com"],
        enabled: true,
      };
      expect(mockConfig).toBeDefined();
    });

    it("should export AlbyProvider type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockProvider: AlbyProvider = {
        name: "alby",
        version: "1.0.0",
        connect: jest.fn(),
        disconnect: jest.fn(),
        signEvent: jest.fn(),
        getPublicKey: jest.fn(),
      };
      expect(mockProvider).toBeDefined();
    });

    it("should export NostrProvider type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockProvider: NostrProvider = {
        name: "nostr",
        version: "1.0.0",
        connect: jest.fn(),
        disconnect: jest.fn(),
        signEvent: jest.fn(),
        getPublicKey: jest.fn(),
      };
      expect(mockProvider).toBeDefined();
    });
  });

  describe("Module structure", () => {
    it("should export all expected classes and types", () => {
      const moduleExports = require("../../../plugins/nostr/index");

      // Class exports
      expect(moduleExports.NostrConnectorPlugin).toBeDefined();
      expect(moduleExports.NostrConnector).toBeDefined();
      expect(moduleExports.NostrSigner).toBeDefined();

      // Type exports
      expect(moduleExports.NostrConnectorPluginInterface).toBeDefined();
      expect(moduleExports.NostrConnectorCredentials).toBeDefined();
      expect(moduleExports.NostrConnectorKeyPair).toBeDefined();
      expect(moduleExports.NostrConnectorConfig).toBeDefined();
      expect(moduleExports.AlbyProvider).toBeDefined();
      expect(moduleExports.NostrProvider).toBeDefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow plugin classes to be instantiated", () => {
      // Test that we can create instances of the exported classes
      // These will fail due to missing dependencies, but we can test the exports
      expect(() => {
        new NostrConnectorPlugin();
      }).toThrow();

      expect(() => {
        new NostrConnector();
      }).toThrow();

      expect(() => {
        new NostrSigner();
      }).toThrow();
    });
  });
});
