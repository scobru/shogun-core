import Gun from "gun/gun";
import "gun/lib/then.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";
import SEA from "gun/sea";

import { ShogunCore, ShogunSDKConfig } from "../../index";

describe("Final Integration Tests - User Manager", () => {
  let shogunCore: ShogunCore;

  beforeEach(() => {
    const config: ShogunSDKConfig = {
      appToken: "test-token",
      oauth: { enabled: false },
      peers: [],
    };

    shogunCore = new ShogunCore(config);
  });

  describe("Core Functionality Tests", () => {
    it("should initialize ShogunCore correctly", () => {
      expect(shogunCore).toBeDefined();
      expect(shogunCore.db).toBeDefined();
      expect(typeof shogunCore.signUp).toBe("function");
      expect(typeof shogunCore.login).toBe("function");
    });

    it("should validate credentials correctly", () => {
      const testUsername = "final_test_" + Date.now();
      const strongPassword = "TestPass123!@#";
      const weakPassword = "123";

      // Test valid credentials
      const validResult = shogunCore.db.validateSignupCredentials(
        testUsername,
        strongPassword,
      );
      expect(validResult.valid).toBe(true);

      // Test weak password
      const weakResult = shogunCore.db.validateSignupCredentials(
        testUsername,
        weakPassword,
      );
      expect(weakResult.valid).toBe(false);
      expect(weakResult.error).toContain("password");

      // Test empty username
      const emptyUsernameResult = shogunCore.db.validateSignupCredentials(
        "",
        strongPassword,
      );
      expect(emptyUsernameResult.valid).toBe(false);
      expect(emptyUsernameResult.error).toContain("username");
    });

    it("should validate password strength correctly", () => {
      const strongPassword = "TestPass123!@#";
      const weakPassword = "123";
      const mediumPassword = "testpass";

      // Test strong password
      const strongResult =
        shogunCore.db.validatePasswordStrength(strongPassword);
      expect(strongResult.valid).toBe(true);

      // Test weak password
      const weakResult = shogunCore.db.validatePasswordStrength(weakPassword);
      expect(weakResult.valid).toBe(false);

      // Test medium password (should fail due to strict requirements)
      const mediumResult =
        shogunCore.db.validatePasswordStrength(mediumPassword);
      expect(mediumResult.valid).toBe(false);
    });

    it("should check rate limiting correctly", () => {
      const testUsername = "rate_test_" + Date.now();

      // First check should be allowed
      const firstCheck = shogunCore.db.checkRateLimit(testUsername);
      expect(firstCheck.allowed).toBe(true);

      // Multiple checks should still be allowed (rate limiting is per session)
      const secondCheck = shogunCore.db.checkRateLimit(testUsername);
      expect(secondCheck.allowed).toBe(true);
    });

    it("should check username existence correctly", async () => {
      const testUsername = "existence_test_" + Date.now();

      // Username should not exist initially
      const existsResult =
        await shogunCore.db.checkUsernameExists(testUsername);
      expect(existsResult.exists).toBe(false);
    });
  });

  describe("GunDB Integration Tests", () => {
    it("should create a real GunDB instance", () => {
      const gun = Gun({
        file: false,
        localStorage: false,
        multicast: false,
        axe: false,
        axe_in: false,
        axe_out: false,
      });

      expect(gun).toBeDefined();
      expect(gun.user).toBeDefined();
      expect(typeof gun.user.create).toBe("function");
      expect(typeof gun.user.auth).toBe("function");
    });

    it("should have working SEA encryption", () => {
      const testData = "test message";
      const testPass = "testpass";

      // Test SEA encryption/decryption
      const encrypted = SEA.encrypt(testData, testPass);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");

      const decrypted = SEA.decrypt(encrypted, testPass);
      expect(decrypted).toBe(testData);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle invalid configurations gracefully", () => {
      const invalidConfig = {
        appToken: "",
        oauth: { enabled: false },
        peers: [],
      };

      // Should not throw error with invalid config
      expect(() => {
        new ShogunCore(invalidConfig as any);
      }).not.toThrow();
    });

    it("should handle validation errors gracefully", () => {
      const result = shogunCore.db.validateSignupCredentials("", "");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    });
  });
});
