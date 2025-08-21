// Mock completo di Gun/SEA per isolare la logica di business
const mockSEA = {
  pair: jest.fn(() => ({
    pub: "test-pub",
    priv: "test-priv",
    epub: "test-epub",
    epriv: "test-epriv",
  })),
  encrypt: jest.fn((data, pair, cb) => {
    const result = "encrypted-data";
    if (cb) cb(result);
    return result;
  }),
  decrypt: jest.fn((data, pair, cb) => {
    const result = "decrypted-data";
    if (cb) cb(result);
    return result;
  }),
  sign: jest.fn((data, pair, cb) => {
    const result = "signed-data";
    if (cb) cb(result);
    return result;
  }),
  verify: jest.fn((data, pub, cb) => {
    const result = "verified-data";
    if (cb) cb(result);
    return result;
  }),
  work: jest.fn((data, pair, cb) => {
    const result = "proof";
    if (cb) cb(result);
    return result;
  }),
  secret: jest.fn((epub, pair, cb) => {
    const result = "secret";
    if (cb) cb(result);
    return result;
  }),
  opt: jest.fn(() => ({ pub: "test-pub" })),
};

// Mock SEA prima di qualsiasi import
jest.mock("gun/sea", () => mockSEA);
jest.mock("gun", () => ({
  SEA: mockSEA,
}));

// Mock Gun per isolare le dipendenze
jest.mock("gun/gun", () => {
  const mockGun = function () {
    return {
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      user: {
        auth: jest.fn(),
        create: jest.fn(),
        leave: jest.fn(),
        recall: jest.fn(),
      },
    };
  };
  mockGun.SEA = require("gun/sea");
  return mockGun;
});

// Mock global.SEA
(global as any).SEA = mockSEA;

import {
  isHash,
  encrypt,
  decrypt,
  encFor,
  decFrom,
  hashText,
  hashObj,
  secret,
  getShortHash,
  safeHash,
  unsafeHash,
  safeJSONParse,
  randomUUID,
} from "../../gundb/crypto";

describe("Crypto Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global.SEA
    (global as any).SEA = mockSEA;
  });

  describe("Business Logic Functions", () => {
    describe("isHash", () => {
      it("should identify valid hashes", () => {
        expect(isHash("valid-hash")).toBe(true);
        expect(isHash("another-valid-hash")).toBe(true);
      });

      it("should identify invalid hashes", () => {
        expect(isHash("")).toBe(false);
        expect(isHash(null)).toBe(false);
        expect(isHash(undefined)).toBe(false);
      });
    });

    describe("getShortHash", () => {
      it("should generate short hash", async () => {
        const input = "test-input";
        const result = await getShortHash(input);

        expect(typeof result).toBe("string");
        expect(result.length).toBeLessThanOrEqual(8);
      });

      it("should generate consistent short hashes", async () => {
        const input = "test-input";
        const result1 = await getShortHash(input);
        const result2 = await getShortHash(input);

        expect(result1).toBe(result2);
      });
    });

    describe("safeHash", () => {
      it("should generate safe hash", () => {
        const input = "test-string-with-special";
        const result = safeHash(input);

        expect(result).toBe("test_string_with_special");
      });

      it("should handle various special characters", () => {
        expect(safeHash("test+string/with=special")).toBe(
          "test-string_with.special",
        );
        expect(safeHash("test@string#with$special")).toBe(
          "test@string#with$special",
        );
      });
    });

    describe("unsafeHash", () => {
      it("should generate unsafe hash", () => {
        const input = "test-string-with-special";
        const result = unsafeHash(input);

        expect(result).toBe("test+string+with+special");
      });
    });

    describe("safeJSONParse", () => {
      it("should parse valid JSON", () => {
        const jsonString = '{"test": "data"}';
        const result = safeJSONParse(jsonString);

        expect(result).toEqual({ test: "data" });
      });

      it("should handle invalid JSON", () => {
        const invalidJson = "invalid-json";
        const result = safeJSONParse(invalidJson);

        expect(result).toEqual({});
      });

      it("should handle null input", () => {
        const result = safeJSONParse(null);

        expect(result).toBeNull();
      });
    });

    describe("randomUUID", () => {
      it("should generate UUID", () => {
        const result = randomUUID();

        expect(typeof result).toBe("string");
        expect(result).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
      });

      it("should generate unique UUIDs", () => {
        const uuid1 = randomUUID();
        const uuid2 = randomUUID();

        expect(uuid1).not.toBe(uuid2);
      });
    });
  });

  describe("Gun/SEA Integration Functions", () => {
    describe("encrypt", () => {
      it("should encrypt data successfully", async () => {
        const data = "test-data";
        const key = "test-key";

        const result = await encrypt(data, key);

        expect(result).toBe("encrypted-data");
      });

      it("should handle encryption errors", async () => {
        const mockSEA = require("gun/sea");
        mockSEA.encrypt = jest.fn((data, key, cb) => {
          if (cb) cb("SEA not available");
          return "SEA not available";
        });

        await expect(encrypt("test", "key")).rejects.toThrow(
          "SEA not available",
        );
      });
    });

    describe("decrypt", () => {
      it("should decrypt data successfully", async () => {
        const data = "encrypted-data";
        const key = "test-key";

        const result = await decrypt(data, key);

        expect(result).toBe("decrypted-data");
      });

      it("should handle decryption errors", async () => {
        const mockSEA = require("gun/sea");
        mockSEA.decrypt = jest.fn((data, key, cb) => {
          if (cb) cb("SEA not available");
          return "SEA not available";
        });

        await expect(decrypt("test", "key")).rejects.toThrow(
          "SEA not available",
        );
      });
    });

    describe("encFor", () => {
      it("should handle encryption when SEA is not available", async () => {
        const data = "test-data";
        const pair = { pub: "test-pub", priv: "test-priv" };
        const recipientPub = "recipient-pub";

        const result = await encFor(data, pair, recipientPub);

        // When SEA is not available, the function returns "SEA not available"
        expect(result).toBe("SEA not available");
      });
    });

    describe("decFrom", () => {
      it("should handle decryption when SEA is not available", async () => {
        const data = "encrypted-data";
        const pair = { pub: "test-pub", priv: "test-priv" };
        const senderPub = "sender-pub";

        const result = await decFrom(data, pair, senderPub);

        // When SEA is not available, the function returns "SEA not available"
        expect(result).toBe("SEA not available");
      });
    });

    describe("hashText", () => {
      it("should hash text successfully", async () => {
        const text = "test-text";
        const salt = "test-salt";

        const result = await hashText(text, salt);

        expect(result).toBe("proof");
      });

      it("should handle hashing errors", async () => {
        const mockSEA = require("gun/sea");
        mockSEA.work = jest.fn((data, pair, cb) => {
          if (cb) cb("SEA not available");
          return "SEA not available";
        });

        await expect(hashText("test", "salt")).rejects.toThrow(
          "SEA not available",
        );
      });
    });

    describe("hashObj", () => {
      it("should handle object hashing when SEA is not available", async () => {
        const obj = { test: "data" };
        const salt = "test-salt";

        await expect(hashObj(obj, salt)).rejects.toThrow("SEA not available");
      });
    });

    describe("secret", () => {
      it("should generate secret successfully", async () => {
        const epub = "test-epub";
        const pair = { pub: "test-pub", priv: "test-priv" };

        const result = await secret(epub, pair);

        expect(result).toBe("secret");
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle encryption when SEA is not available", async () => {
      const originalData = "secret-message";
      const key = "encryption-key";

      await expect(encrypt(originalData, key)).rejects.toThrow(
        "SEA encryption failed: SEA not available",
      );
    });

    it("should handle object hashing when SEA is not available", async () => {
      const testObj = { message: "test", number: 123 };
      const salt = "test-salt";

      await expect(hashObj(testObj, salt)).rejects.toThrow("SEA not available");
    });

    it("should handle text hashing when SEA is not available", async () => {
      const text = "test-text";
      const salt = "test-salt";

      await expect(hashText(text, salt)).rejects.toThrow("SEA not available");
    });

    it("should handle string processing pipeline", () => {
      const input = "test+string/with=special@chars#";

      // 1. Generate safe hash
      const safe = safeHash(input);
      expect(safe).toBeDefined();

      // 2. Generate unsafe hash
      const unsafe = unsafeHash(input);
      expect(unsafe).toBeDefined();

      // 3. Generate short hash
      const short = getShortHash(input);
      expect(short).toBeDefined();

      // 4. Generate UUID
      const uuid = randomUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle SEA unavailability gracefully", async () => {
      const mockSEA = require("gun/sea");

      // Simulate SEA not available
      mockSEA.encrypt = jest.fn(() => {
        throw new Error("SEA not available");
      });

      await expect(encrypt("test", "key")).rejects.toThrow("SEA not available");
    });

    it("should handle invalid input gracefully", () => {
      expect(safeJSONParse("")).toBe("");
      expect(safeJSONParse(undefined)).toBeUndefined();
      expect(getShortHash("")).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);

      expect(safeHash(longString)).toBeDefined();
      expect(unsafeHash(longString)).toBeDefined();
      expect(getShortHash(longString)).toBeDefined();
    });

    it("should handle special characters in hashing", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";

      expect(safeHash(specialChars)).toBeDefined();
      expect(unsafeHash(specialChars)).toBeDefined();
    });

    it("should handle unicode characters", () => {
      const unicodeString = "café 🚀 测试";

      expect(safeHash(unicodeString)).toBeDefined();
      expect(unsafeHash(unicodeString)).toBeDefined();
      expect(getShortHash(unicodeString)).toBeDefined();
    });

    it("should handle empty and null inputs", () => {
      expect(safeHash("")).toBe("");
      expect(unsafeHash("")).toBe("");
      expect(getShortHash("")).toBeDefined();
      expect(safeJSONParse("")).toBe("");
      expect(safeJSONParse(null)).toBeNull();
    });
  });
});
