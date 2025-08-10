// @ts-nocheck
import {
  validateUsername,
  validateEmail,
  validateProvider,
  generateUsernameFromIdentity,
  generateDeterministicPassword,
} from "../../utils/validation";

describe("Validation Utils", () => {
  describe("validateUsername", () => {
    it("should validate correct usernames", () => {
      expect(validateUsername("john")).toBe(true);
      expect(validateUsername("john_doe")).toBe(true);
      expect(validateUsername("john.doe")).toBe(true);
      expect(validateUsername("john123")).toBe(true);
      expect(validateUsername("a".repeat(64))).toBe(true);
    });

    it("should reject invalid usernames", () => {
      expect(validateUsername("")).toBe(false);
      expect(validateUsername("ab")).toBe(false); // troppo corto
      expect(validateUsername("a".repeat(65))).toBe(false); // troppo lungo
      expect(validateUsername("john@doe")).toBe(false); // caratteri non permessi
      expect(validateUsername("john doe")).toBe(false); // spazi non permessi
      expect(validateUsername("john!doe")).toBe(false); // caratteri speciali
    });

    it("should handle non-string inputs", () => {
      expect(validateUsername(null as any)).toBe(false);
      expect(validateUsername(undefined as any)).toBe(false);
      expect(validateUsername(123 as any)).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct emails", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@example.org")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@.com")).toBe(false);
    });

    it("should handle non-string inputs", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
    });
  });

  describe("validateProvider", () => {
    it("should validate supported providers", () => {
      expect(validateProvider("google")).toBe(true);
      expect(validateProvider("github")).toBe(true);
      expect(validateProvider("discord")).toBe(true);
      expect(validateProvider("twitter")).toBe(true);
      expect(validateProvider("custom")).toBe(true);
    });

    it("should reject unsupported providers", () => {
      expect(validateProvider("facebook")).toBe(false);
      expect(validateProvider("linkedin")).toBe(false);
      expect(validateProvider("")).toBe(false);
      expect(validateProvider("invalid")).toBe(false);
    });
  });

  describe("generateUsernameFromIdentity", () => {
    it("should generate web3 usernames correctly", () => {
      const result = generateUsernameFromIdentity("web3", {
        id: "0x1234567890abcdef",
      });
      expect(result).toBe("web3_0x1234567890abcdef");
    });

    it("should generate nostr usernames correctly", () => {
      const result = generateUsernameFromIdentity("nostr", {
        id: "npub1234567890abcdef",
      });
      expect(result).toBe("nostr_npub1234567890abcdef");
    });

    it("should generate webauthn usernames correctly", () => {
      const result = generateUsernameFromIdentity("webauthn", {
        id: "credential123",
      });
      expect(result).toBe("webauthn_credential123");
    });

    it("should use email when available", () => {
      const result = generateUsernameFromIdentity("google", {
        email: "john.doe@example.com",
        name: "John Doe",
        id: "12345",
      });
      expect(result).toBe("google_john.doe");
    });

    it("should use name when email not available", () => {
      const result = generateUsernameFromIdentity("github", {
        name: "John Doe",
        id: "12345",
      });
      expect(result).toBe("github_John_Doe");
    });

    it("should use id when name and email not available", () => {
      const result = generateUsernameFromIdentity("discord", { id: "12345" });
      expect(result).toBe("discord_12345");
    });

    it("should fallback to generic username", () => {
      const result = generateUsernameFromIdentity("twitter", {});
      expect(result).toBe("twitter_user");
    });
  });

  describe("generateDeterministicPassword", () => {
    it("should generate consistent passwords for same salt", () => {
      const salt = "test-salt";
      const password1 = generateDeterministicPassword(salt);
      const password2 = generateDeterministicPassword(salt);

      expect(password1).toBe(password2);
      expect(password1).toHaveLength(32);
      expect(password1).toMatch(/^[a-f0-9]+$/); // hex string
    });

    it("should generate different passwords for different salts", () => {
      const password1 = generateDeterministicPassword("salt1");
      const password2 = generateDeterministicPassword("salt2");

      expect(password1).not.toBe(password2);
    });

    it("should handle empty salt", () => {
      const password = generateDeterministicPassword("");
      expect(password).toHaveLength(32);
      expect(password).toMatch(/^[a-f0-9]+$/);
    });
  });
});
