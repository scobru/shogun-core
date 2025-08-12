// Mock ethers
const mockKeccak256 = jest.fn(
  (input) =>
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
);
const mockToUtf8Bytes = jest.fn((input) => new Uint8Array([1, 2, 3, 4, 5]));

jest.mock("ethers", () => ({
  ethers: {
    keccak256: mockKeccak256,
    toUtf8Bytes: mockToUtf8Bytes,
  },
}));

import {
  validateUsername,
  validateEmail,
  validateProvider,
  generateUsernameFromIdentity,
  generateDeterministicPassword,
} from "../../utils/validation";
import { OAuthProvider } from "../../plugins/oauth/types";

describe("Validation Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUsername", () => {
    it("should validate valid usernames", () => {
      expect(validateUsername("testuser")).toBe(true);
      expect(validateUsername("test_user")).toBe(true);
      expect(validateUsername("test-user")).toBe(true);
      expect(validateUsername("test.user")).toBe(true);
      expect(validateUsername("test123")).toBe(true);
      expect(validateUsername("TestUser")).toBe(true);
    });

    it("should reject invalid usernames", () => {
      // Too short
      expect(validateUsername("ab")).toBe(false);

      // Too long
      expect(validateUsername("a".repeat(65))).toBe(false);

      // Invalid characters
      expect(validateUsername("test user")).toBe(false); // space
      expect(validateUsername("test@user")).toBe(false); // @
      expect(validateUsername("test/user")).toBe(false); // /
      expect(validateUsername("test\\user")).toBe(false); // backslash
      expect(validateUsername("test*user")).toBe(false); // *
      expect(validateUsername("test+user")).toBe(false); // +
      expect(validateUsername("test=user")).toBe(false); // =
      expect(validateUsername("test[user")).toBe(false); // [
      expect(validateUsername("test]user")).toBe(false); // ]
      expect(validateUsername("test{user")).toBe(false); // {
      expect(validateUsername("test}user")).toBe(false); // }
      expect(validateUsername("test|user")).toBe(false); // |
      expect(validateUsername("test;user")).toBe(false); // ;
      expect(validateUsername("test:user")).toBe(false); // :
      expect(validateUsername('test"user')).toBe(false); // "
      expect(validateUsername("test'user")).toBe(false); // '
      expect(validateUsername("test<user")).toBe(false); // <
      expect(validateUsername("test>user")).toBe(false); // >
      expect(validateUsername("test,user")).toBe(false); // ,
      expect(validateUsername("test?user")).toBe(false); // ?
    });

    it("should handle edge cases", () => {
      // Empty string
      expect(validateUsername("")).toBe(false);

      // Null/undefined
      expect(validateUsername(null as any)).toBe(false);
      expect(validateUsername(undefined as any)).toBe(false);

      // Non-string types
      expect(validateUsername(123 as any)).toBe(false);
      expect(validateUsername({} as any)).toBe(false);
      expect(validateUsername([] as any)).toBe(false);

      // Minimum length (3 characters)
      expect(validateUsername("abc")).toBe(true);
      expect(validateUsername("ab")).toBe(false);

      // Maximum length (64 characters)
      expect(validateUsername("a".repeat(64))).toBe(true);
      expect(validateUsername("a".repeat(65))).toBe(false);
    });

    it("should handle special valid characters", () => {
      expect(validateUsername("test_user123")).toBe(true);
      expect(validateUsername("test-user.123")).toBe(true);
      expect(validateUsername("Test_User-123")).toBe(true);
      expect(validateUsername("test.user_123")).toBe(true);
    });
  });

  describe("validateEmail", () => {
    it("should validate valid email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@example.org")).toBe(true);
      expect(validateEmail("user123@test-domain.com")).toBe(true);
      expect(validateEmail("a@b.c")).toBe(true);
      expect(validateEmail("user@domain.com")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      // Missing @
      expect(validateEmail("testexample.com")).toBe(false);

      // Missing domain
      expect(validateEmail("test@")).toBe(false);

      // Missing local part
      expect(validateEmail("@example.com")).toBe(false);

      // Multiple @
      expect(validateEmail("test@example@domain.com")).toBe(false);

      // Spaces
      expect(validateEmail("test @example.com")).toBe(false);
      expect(validateEmail("test@ example.com")).toBe(false);
      expect(validateEmail("test @ example.com")).toBe(false);

      // Empty parts
      expect(validateEmail("@.com")).toBe(false);
      expect(validateEmail("test@.")).toBe(false);
    });

    it("should handle edge cases", () => {
      // Empty string
      expect(validateEmail("")).toBe(false);

      // Null/undefined
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);

      // Non-string types
      expect(validateEmail(123 as any)).toBe(false);
      expect(validateEmail({} as any)).toBe(false);
      expect(validateEmail([] as any)).toBe(false);

      // Whitespace only
      expect(validateEmail("   ")).toBe(false);
      expect(validateEmail("\t\n")).toBe(false);
    });

    it("should handle complex but valid emails", () => {
      expect(validateEmail("user.name+tag@domain.com")).toBe(true);
      expect(validateEmail("user-name@domain.co.uk")).toBe(true);
      expect(validateEmail("user_name@domain.org")).toBe(true);
      expect(validateEmail("user123@domain123.com")).toBe(true);
    });
  });

  describe("validateProvider", () => {
    it("should validate supported OAuth providers", () => {
      expect(validateProvider("google")).toBe(true);
      expect(validateProvider("github")).toBe(true);
      expect(validateProvider("discord")).toBe(true);
      expect(validateProvider("twitter")).toBe(true);
      expect(validateProvider("custom")).toBe(true);
    });

    it("should reject unsupported providers", () => {
      expect(validateProvider("facebook")).toBe(false);
      expect(validateProvider("linkedin")).toBe(false);
      expect(validateProvider("microsoft")).toBe(false);
      expect(validateProvider("apple")).toBe(false);
      expect(validateProvider("slack")).toBe(false);
      expect(validateProvider("")).toBe(false);
      expect(validateProvider("invalid")).toBe(false);
    });

    it("should handle edge cases", () => {
      // Null/undefined
      expect(validateProvider(null as any)).toBe(false);
      expect(validateProvider(undefined as any)).toBe(false);

      // Non-string types
      expect(validateProvider(123 as any)).toBe(false);
      expect(validateProvider({} as any)).toBe(false);
      expect(validateProvider([] as any)).toBe(false);

      // Case sensitivity
      expect(validateProvider("Google")).toBe(false);
      expect(validateProvider("GITHUB")).toBe(false);
      expect(validateProvider("Discord")).toBe(false);
    });

    it("should have correct type guard behavior", () => {
      const providers: string[] = [
        "google",
        "github",
        "discord",
        "twitter",
        "custom",
      ];

      providers.forEach((provider) => {
        if (validateProvider(provider)) {
          // TypeScript should know this is OAuthProvider
          const typedProvider: OAuthProvider = provider;
          expect(typedProvider).toBe(provider);
        }
      });
    });
  });

  describe("generateUsernameFromIdentity", () => {
    it("should generate username for web3 provider with id", () => {
      const userInfo = { id: "0x1234567890abcdef" };
      const result = generateUsernameFromIdentity("web3", userInfo);
      expect(result).toBe("web3_0x1234567890abcdef");
    });

    it("should generate username for nostr provider with id", () => {
      const userInfo = { id: "npub1234567890abcdef" };
      const result = generateUsernameFromIdentity("nostr", userInfo);
      expect(result).toBe("nostr_npub1234567890abcdef");
    });

    it("should generate username for webauthn provider with id", () => {
      const userInfo = { id: "credential123" };
      const result = generateUsernameFromIdentity("webauthn", userInfo);
      expect(result).toBe("webauthn_credential123");
    });

    it("should generate username from email when available", () => {
      const userInfo = { email: "test@example.com" };
      const result = generateUsernameFromIdentity("google", userInfo);
      expect(result).toBe("google_test");
    });

    it("should generate username from name when available", () => {
      const userInfo = { name: "John Doe" };
      const result = generateUsernameFromIdentity("github", userInfo);
      expect(result).toBe("github_John_Doe");
    });

    it("should generate username from id when other fields not available", () => {
      const userInfo = { id: "12345" };
      const result = generateUsernameFromIdentity("discord", userInfo);
      expect(result).toBe("discord_12345");
    });

    it("should generate fallback username when no user info available", () => {
      const userInfo = {};
      const result = generateUsernameFromIdentity("twitter", userInfo);
      expect(result).toBe("twitter_user");
    });

    it("should handle name with multiple spaces", () => {
      const userInfo = { name: "John  Doe  Smith" };
      const result = generateUsernameFromIdentity("google", userInfo);
      expect(result).toBe("google_John_Doe_Smith");
    });

    it("should prioritize web3 id over other fields", () => {
      const userInfo = {
        id: "0x1234567890abcdef",
        email: "test@example.com",
        name: "John Doe",
      };
      const result = generateUsernameFromIdentity("web3", userInfo);
      expect(result).toBe("web3_0x1234567890abcdef");
    });

    it("should prioritize nostr id over other fields", () => {
      const userInfo = {
        id: "npub1234567890abcdef",
        email: "test@example.com",
        name: "John Doe",
      };
      const result = generateUsernameFromIdentity("nostr", userInfo);
      expect(result).toBe("nostr_npub1234567890abcdef");
    });

    it("should prioritize webauthn id over other fields", () => {
      const userInfo = {
        id: "credential123",
        email: "test@example.com",
        name: "John Doe",
      };
      const result = generateUsernameFromIdentity("webauthn", userInfo);
      expect(result).toBe("webauthn_credential123");
    });

    it("should prioritize email over name and id for other providers", () => {
      const userInfo = {
        id: "12345",
        email: "test@example.com",
        name: "John Doe",
      };
      const result = generateUsernameFromIdentity("google", userInfo);
      expect(result).toBe("google_test");
    });

    it("should prioritize name over id when email not available", () => {
      const userInfo = {
        id: "12345",
        name: "John Doe",
      };
      const result = generateUsernameFromIdentity("github", userInfo);
      expect(result).toBe("github_John_Doe");
    });

    it("should handle edge cases", () => {
      // Empty userInfo
      expect(generateUsernameFromIdentity("google", {})).toBe("google_user");

      // Null/undefined values
      expect(
        generateUsernameFromIdentity("github", {
          id: null,
          email: null,
          name: null,
        } as any)
      ).toBe("github_user");

      // Empty strings
      expect(
        generateUsernameFromIdentity("discord", { id: "", email: "", name: "" })
      ).toBe("discord_user");

      // Whitespace only
      expect(generateUsernameFromIdentity("twitter", { name: "   " })).toBe(
        "twitter__"
      );
    });

    it("should handle complex email addresses", () => {
      const userInfo = { email: "user.name+tag@domain.com" };
      const result = generateUsernameFromIdentity("google", userInfo);
      expect(result).toBe("google_user.name+tag");
    });

    it("should handle complex names", () => {
      const userInfo = { name: "Jean-Pierre O'Connor" };
      const result = generateUsernameFromIdentity("github", userInfo);
      expect(result).toBe("github_Jean-Pierre_O'Connor");
    });
  });

  describe("generateDeterministicPassword", () => {
    it("should generate deterministic password from salt", () => {
      const salt = "test-salt";
      const result = generateDeterministicPassword(salt);

      // Should return 32 character hex string (without 0x prefix)
      expect(result).toBe("1234567890abcdef1234567890abcdef");
      expect(result.length).toBe(32);
      expect(/^[0-9a-f]{32}$/.test(result)).toBe(true);
    });

    it("should generate same password for same salt", () => {
      const salt = "consistent-salt";
      const result1 = generateDeterministicPassword(salt);
      const result2 = generateDeterministicPassword(salt);

      expect(result1).toBe(result2);
    });

    it("should generate different passwords for different salts", () => {
      const salt1 = "salt1";
      const salt2 = "salt2";
      
      // Mock different return values for different salts
      mockKeccak256
        .mockReturnValueOnce("0x1111111111111111111111111111111111111111111111111111111111111111")
        .mockReturnValueOnce("0x2222222222222222222222222222222222222222222222222222222222222222");
      
      const result1 = generateDeterministicPassword(salt1);
      const result2 = generateDeterministicPassword(salt2);

      expect(result1).not.toBe(result2);
    });

    it("should handle various salt types", () => {
      // Empty string
      expect(generateDeterministicPassword("")).toBe(
        "1234567890abcdef1234567890abcdef"
      );

      // Long string
      expect(generateDeterministicPassword("a".repeat(1000))).toBe(
        "1234567890abcdef1234567890abcdef"
      );

      // Special characters
      expect(generateDeterministicPassword("!@#$%^&*()")).toBe(
        "1234567890abcdef1234567890abcdef"
      );

      // Unicode
      expect(generateDeterministicPassword("café")).toBe(
        "1234567890abcdef1234567890abcdef"
      );
    });

    it("should call ethers functions correctly", () => {
      generateDeterministicPassword("test-salt");

      expect(mockToUtf8Bytes).toHaveBeenCalledWith("test-salt");
      expect(mockKeccak256).toHaveBeenCalledWith(new Uint8Array([1, 2, 3, 4, 5]));
    });

    it("should slice the result correctly", () => {
      // Mock keccak256 to return a known value
      mockKeccak256.mockReturnValue(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );

      const result = generateDeterministicPassword("test");

      // Should slice from position 2 to 34 (removing 0x prefix and taking 32 chars)
      expect(result).toBe("1234567890abcdef1234567890abcdef");
    });
  });

  describe("Integration tests", () => {
    it("should work together for a complete user registration flow", () => {
      // Simulate OAuth login
      const provider = "google";
      const userInfo = {
        id: "12345",
        email: "test@example.com",
        name: "John Doe",
      };

      // Validate provider
      expect(validateProvider(provider)).toBe(true);

      // Generate username
      const username = generateUsernameFromIdentity(provider, userInfo);
      expect(username).toBe("google_test");

      // Validate generated username
      expect(validateUsername(username)).toBe(true);

      // Validate email
      expect(validateEmail(userInfo.email!)).toBe(true);

      // Generate deterministic password
      const password = generateDeterministicPassword(
        `${provider}_${userInfo.id}`
      );
      expect(password).toBe("1234567890abcdef1234567890abcdef");
    });

    it("should handle web3 wallet connection flow", () => {
      const provider = "web3";
      const userInfo = { id: "0x1234567890abcdef1234567890abcdef12345678" };

      // Generate username
      const username = generateUsernameFromIdentity(provider, userInfo);
      expect(username).toBe("web3_0x1234567890abcdef1234567890abcdef12345678");

      // Validate username
      expect(validateUsername(username)).toBe(true);

      // Generate password
      const password = generateDeterministicPassword(
        `${provider}_${userInfo.id}`
      );
      expect(password).toBe("1234567890abcdef1234567890abcdef");
    });

    it("should handle nostr connection flow", () => {
      const provider = "nostr";
      const userInfo = {
        id: "npub1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      };

      // Generate username
      const username = generateUsernameFromIdentity(provider, userInfo);
      expect(username).toBe(
        "nostr_npub1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );

      // Validate username (should be false because too long)
      expect(validateUsername(username)).toBe(false);

      // Generate password
      const password = generateDeterministicPassword(
        `${provider}_${userInfo.id}`
      );
      expect(password).toBe("1234567890abcdef1234567890abcdef");
    });
  });
});
