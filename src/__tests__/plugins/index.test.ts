import {
  BasePlugin,
  ShogunPlugin,
  PluginManager,
  Webauthn,
  WebauthnPlugin,
  WebauthnPluginInterface,
  Web3Connector,
  Web3ConnectorPlugin,
  Web3ConnectorPluginInterface,
  NostrConnector,
  NostrConnectorPlugin,
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
  OAuthConnector,
  OAuthPlugin,
} from "../../plugins/index";

describe("Plugins Index", () => {
  describe("Base exports", () => {
    it("should export BasePlugin class", () => {
      expect(BasePlugin).toBeDefined();
      expect(typeof BasePlugin).toBe("function");
    });

    it("should export ShogunPlugin type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockPlugin: ShogunPlugin = {
        name: "test-plugin",
        version: "1.0.0",
        initialize: jest.fn(),
        destroy: jest.fn(),
      };
      expect(mockPlugin).toBeDefined();
    });

    it("should export PluginManager type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockManager: PluginManager = {
        registerPlugin: jest.fn(),
        unregisterPlugin: jest.fn(),
        getPlugin: jest.fn(),
        getPlugins: jest.fn(),
        hasPlugin: jest.fn(),
      };
      expect(mockManager).toBeDefined();
    });
  });

  describe("WebAuthn exports", () => {
    it("should export Webauthn class", () => {
      expect(Webauthn).toBeDefined();
      expect(typeof Webauthn).toBe("function");
    });

    it("should export WebauthnPlugin class", () => {
      expect(WebauthnPlugin).toBeDefined();
      expect(typeof WebauthnPlugin).toBe("function");
    });

    it("should export WebauthnPluginInterface type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockInterface: WebauthnPluginInterface = {
        name: "webauthn",
        version: "1.0.0",
        initialize: jest.fn(),
        destroy: jest.fn(),
        register: jest.fn(),
        authenticate: jest.fn(),
        isSupported: jest.fn(),
      };
      expect(mockInterface).toBeDefined();
    });
  });

  describe("Web3 exports", () => {
    it("should export Web3Connector class", () => {
      expect(Web3Connector).toBeDefined();
      expect(typeof Web3Connector).toBe("function");
    });

    it("should export Web3ConnectorPlugin class", () => {
      expect(Web3ConnectorPlugin).toBeDefined();
      expect(typeof Web3ConnectorPlugin).toBe("function");
    });

    it("should export Web3ConnectorPluginInterface type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockInterface: Web3ConnectorPluginInterface = {
        name: "web3",
        version: "1.0.0",
        initialize: jest.fn(),
        destroy: jest.fn(),
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn(),
        signMessage: jest.fn(),
        getAccount: jest.fn(),
      };
      expect(mockInterface).toBeDefined();
    });
  });

  describe("Nostr exports", () => {
    it("should export NostrConnector class", () => {
      expect(NostrConnector).toBeDefined();
      expect(typeof NostrConnector).toBe("function");
    });

    it("should export NostrConnectorPlugin class", () => {
      expect(NostrConnectorPlugin).toBeDefined();
      expect(typeof NostrConnectorPlugin).toBe("function");
    });

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

  describe("OAuth exports", () => {
    it("should export OAuthConnector class", () => {
      expect(OAuthConnector).toBeDefined();
      expect(typeof OAuthConnector).toBe("function");
    });

    it("should export OAuthPlugin class", () => {
      expect(OAuthPlugin).toBeDefined();
      expect(typeof OAuthPlugin).toBe("function");
    });
  });

  describe("Module structure", () => {
    it("should export all expected classes and types", () => {
      const moduleExports = require("../../plugins/index");

      // Base exports
      expect(moduleExports.BasePlugin).toBeDefined();
      // ShogunPlugin and PluginManager are types, not runtime exports
      // expect(moduleExports.ShogunPlugin).toBeDefined();
      // expect(moduleExports.PluginManager).toBeDefined();

      // WebAuthn exports
      expect(moduleExports.Webauthn).toBeDefined();
      expect(moduleExports.WebauthnPlugin).toBeDefined();
      // WebauthnPluginInterface is a TypeScript type, not a runtime export
      // expect(moduleExports.WebauthnPluginInterface).toBeDefined();

      // Web3 exports
      expect(moduleExports.Web3Connector).toBeDefined();
      expect(moduleExports.Web3ConnectorPlugin).toBeDefined();
      // Web3ConnectorPluginInterface is a TypeScript type, not a runtime export
      // expect(moduleExports.Web3ConnectorPluginInterface).toBeDefined();

      // Nostr exports
      expect(moduleExports.NostrConnector).toBeDefined();
      expect(moduleExports.NostrConnectorPlugin).toBeDefined();
      // These are TypeScript types, not runtime exports
      // expect(moduleExports.NostrConnectorPluginInterface).toBeDefined();
      // expect(moduleExports.NostrConnectorCredentials).toBeDefined();
      // expect(moduleExports.NostrConnectorKeyPair).toBeDefined();
      // expect(moduleExports.NostrConnectorConfig).toBeDefined();
      // expect(moduleExports.AlbyProvider).toBeDefined();
      // expect(moduleExports.NostrProvider).toBeDefined();

      // OAuth exports
      expect(moduleExports.OAuthConnector).toBeDefined();
      expect(moduleExports.OAuthPlugin).toBeDefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow BasePlugin to be used as ShogunPlugin", () => {
      class TestPlugin extends BasePlugin {
        name = "test-plugin";
        version = "1.0.0";
      }

      const plugin: ShogunPlugin = new TestPlugin();
      expect(plugin.name).toBe("test-plugin");
      expect(plugin.version).toBe("1.0.0");
    });

    it("should allow plugin classes to be instantiated", () => {
      // Test that we can create instances of the exported classes
      // These will fail due to missing dependencies, but we can test the exports
      expect(() => {
        new Webauthn();
      }).not.toThrow();

      // WebauthnPlugin should not throw when instantiated without dependencies
      expect(() => {
        new WebauthnPlugin();
      }).not.toThrow();

      expect(() => {
        new Web3Connector();
      }).not.toThrow();

      expect(() => {
        new Web3ConnectorPlugin();
      }).not.toThrow();

      expect(() => {
        new NostrConnector();
      }).not.toThrow();

      expect(() => {
        new NostrConnectorPlugin();
      }).not.toThrow();

      expect(() => {
        new OAuthConnector();
      }).not.toThrow();

      expect(() => {
        new OAuthPlugin();
      }).not.toThrow();
    });
  });
});
