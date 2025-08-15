import Gun from "gun/gun";
import "gun/lib/then.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";
import SEA from "gun/sea";

import { ShogunCore, ShogunSDKConfig } from "../../index";

describe("Quick Integration Tests - User Manager", () => {
  let shogunCore: ShogunCore;
  let testUsername: string;
  let testPassword: string;

  beforeEach(() => {
    const config: ShogunSDKConfig = {
      appToken: "test-token",
      oauth: { enabled: false },
      peers: [],
    };

    shogunCore = new ShogunCore(config);
    testUsername = "quick_test_" + Date.now();
    testPassword = "TestPass123!@#";
  });

  describe("Synchronous Methods", () => {
    it("should validate credentials correctly", () => {
      console.log("Testing credential validation...");

      // Test valid credentials
      const validValidation = shogunCore.db.validateSignupCredentials(
        testUsername,
        testPassword,
      );
      expect(validValidation.valid).toBe(true);
      expect(validValidation.error).toBeUndefined();

      // Test invalid username
      const invalidUsernameValidation = shogunCore.db.validateSignupCredentials(
        "",
        testPassword,
      );
      expect(invalidUsernameValidation.valid).toBe(false);
      expect(invalidUsernameValidation.error).toBeDefined();

      // Test weak password
      const weakPasswordValidation = shogunCore.db.validateSignupCredentials(
        testUsername,
        "123",
      );
      expect(weakPasswordValidation.valid).toBe(false);
      expect(weakPasswordValidation.error).toBeDefined();

      console.log("✅ Credential validation tests passed");
    });

    it("should handle rate limiting correctly", () => {
      console.log("Testing rate limiting...");

      // Test first signup attempt
      const signupRateLimit = shogunCore.db.checkRateLimit(
        testUsername,
        "signup",
      );
      expect(signupRateLimit.allowed).toBe(true);
      expect(signupRateLimit.error).toBeUndefined();

      // Test first login attempt
      const loginRateLimit = shogunCore.db.checkRateLimit(
        testUsername,
        "login",
      );
      expect(loginRateLimit.allowed).toBe(true);
      expect(loginRateLimit.error).toBeUndefined();

      // Test with different username
      const differentUserRateLimit = shogunCore.db.checkRateLimit(
        testUsername + "_2",
        "signup",
      );
      expect(differentUserRateLimit.allowed).toBe(true);
      expect(differentUserRateLimit.error).toBeUndefined();

      console.log("✅ Rate limiting tests passed");
    });

    it("should validate password strength correctly", () => {
      console.log("Testing password strength validation...");

      const strongPasswords = [
        "TestPass123!@#",
        "MySecureP@ssw0rd",
        "Complex!Password#2024",
        "Str0ng!P@ssw0rd$",
      ];

      const weakPasswords = [
        "123", // Too short
        "password", // No uppercase, numbers, or special chars
        "PASSWORD", // No lowercase, numbers, or special chars
        "Password", // No numbers or special chars
        "Password123", // No special chars
        "pass@word", // No uppercase or numbers
      ];

      // Test strong passwords
      strongPasswords.forEach((password) => {
        const validation = shogunCore.db.validateSignupCredentials(
          testUsername,
          password,
        );
        expect(validation.valid).toBe(true);
      });

      // Test weak passwords
      weakPasswords.forEach((password) => {
        const validation = shogunCore.db.validateSignupCredentials(
          testUsername,
          password,
        );
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });

      console.log("✅ Password strength validation tests passed");
    });

    it("should validate usernames correctly", () => {
      console.log("Testing username validation...");

      const validUsernames = [
        "testuser",
        "test_user",
        "test.user",
        "test-user",
        "TestUser123",
        "user_123",
      ];

      const invalidUsernames = [
        "", // Empty
        "test@user", // Invalid character
        "test user", // Space
        "test/user", // Invalid character
        "test\\user", // Invalid character
      ];

      // Test valid usernames
      validUsernames.forEach((username) => {
        const validation = shogunCore.db.validateSignupCredentials(
          username,
          testPassword,
        );
        expect(validation.valid).toBe(true);
      });

      // Test invalid usernames
      invalidUsernames.forEach((username) => {
        const validation = shogunCore.db.validateSignupCredentials(
          username,
          testPassword,
        );
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });

      console.log("✅ Username validation tests passed");
    });

    it("should check authentication status correctly", () => {
      console.log("Testing authentication status...");

      // Initially user should not be authenticated
      const initialAuthStatus = shogunCore.db.isAuthenticated();
      expect(initialAuthStatus).toBe(false);

      // User public key should be null initially
      const initialUserPub = shogunCore.db.getUserPub();
      expect(initialUserPub).toBeNull();

      console.log("✅ Authentication status tests passed");
    });
  });

  describe("Bug Fix Verification", () => {
    it("should verify that the checkRateLimit bug is fixed", () => {
      console.log("Verifying checkRateLimit bug fix...");

      const rateLimitResult = shogunCore.db.checkRateLimit(
        testUsername,
        "signup",
      );

      // Verify it returns an object with 'allowed' property (not a boolean)
      expect(typeof rateLimitResult).toBe("object");
      expect(rateLimitResult).toHaveProperty("allowed");
      expect(typeof rateLimitResult.allowed).toBe("boolean");
      expect(rateLimitResult.allowed).toBe(true);

      console.log("✅ checkRateLimit bug fix verified");
    });

    it("should verify that validateSignupCredentials works correctly", () => {
      console.log("Verifying validateSignupCredentials...");

      const validationResult = shogunCore.db.validateSignupCredentials(
        testUsername,
        testPassword,
      );

      // Verify it returns valid result
      expect(validationResult.valid).toBe(true);
      expect(validationResult.error).toBeUndefined();

      console.log("✅ validateSignupCredentials verified");
    });
  });
});
