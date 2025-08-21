import {
  WebauthnPlugin,
  Webauthn,
  WebauthnPluginInterface,
} from "../../../plugins/webauthn/index";

describe("WebAuthn Plugin Index", () => {
  describe("Class exports", () => {
    it("should export WebauthnPlugin class", () => {
      expect(WebauthnPlugin).toBeDefined();
      expect(typeof WebauthnPlugin).toBe("function");
    });

    it("should export Webauthn class", () => {
      expect(Webauthn).toBeDefined();
      expect(typeof Webauthn).toBe("function");
    });
  });

  describe("Type exports", () => {
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

  describe("Module structure", () => {
    it("should export all expected classes and types", () => {
      const moduleExports = require("../../../plugins/webauthn/index");

      // Class exports
      expect(moduleExports.WebauthnPlugin).toBeDefined();
      expect(moduleExports.Webauthn).toBeDefined();

      // Type exports are TypeScript types, not runtime exports
      // expect(moduleExports.WebauthnPluginInterface).toBeDefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow plugin classes to be instantiated", () => {
      // Test that we can create instances of the exported classes
      // These will fail due to missing dependencies, but we can test the exports
      // WebauthnPlugin should not throw when instantiated without dependencies
      expect(() => {
        new WebauthnPlugin();
      }).not.toThrow();

      expect(() => {
        new Webauthn();
      }).not.toThrow();
    });
  });
});
