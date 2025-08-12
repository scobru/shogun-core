import {
  Web3ConnectorPlugin,
  Web3Connector,
  Web3Signer,
  Web3ConectorPluginInterface,
} from "../../../plugins/web3/index";

describe("Web3 Plugin Index", () => {
  describe("Class exports", () => {
    it("should export Web3ConnectorPlugin class", () => {
      expect(Web3ConnectorPlugin).toBeDefined();
      expect(typeof Web3ConnectorPlugin).toBe("function");
    });

    it("should export Web3Connector class", () => {
      expect(Web3Connector).toBeDefined();
      expect(typeof Web3Connector).toBe("function");
    });

    it("should export Web3Signer class", () => {
      expect(Web3Signer).toBeDefined();
      expect(typeof Web3Signer).toBe("function");
    });
  });

  describe("Type exports", () => {
    it("should export Web3ConectorPluginInterface type", () => {
      // This is a type test - we're just ensuring the type is exported
      const mockInterface: Web3ConectorPluginInterface = {
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

  describe("Module structure", () => {
    it("should export all expected classes and types", () => {
      const moduleExports = require("../../../plugins/web3/index");

      // Class exports
      expect(moduleExports.Web3ConnectorPlugin).toBeDefined();
      expect(moduleExports.Web3Connector).toBeDefined();
      expect(moduleExports.Web3Signer).toBeDefined();

      // Type exports are not available at runtime in JavaScript
      // They are only available during TypeScript compilation
    });
  });

  describe("Type compatibility", () => {
    it("should allow plugin classes to be instantiated", () => {
      // Test that we can create instances of the exported classes
      // These might fail due to missing dependencies, but we can test the exports
      expect(() => {
        new Web3ConnectorPlugin();
      }).not.toThrow();

      expect(() => {
        new Web3Connector();
      }).not.toThrow();

      expect(() => {
        new Web3Signer();
      }).not.toThrow();
    });
  });
});
