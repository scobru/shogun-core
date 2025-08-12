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
import { SEA } from "gun";

// Mock Gun.SEA
jest.mock("gun", () => ({
  SEA: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    work: jest.fn(),
    secret: jest.fn(),
  },
}));

describe("Crypto Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global.SEA
    (global as any).SEA = SEA;
  });

  describe("isHash", () => {
    it("should return true for valid GunDB hash", () => {
      const validHash = "a".repeat(43) + "=";
      expect(isHash(validHash)).toBe(true);
    });

    it("should return false for invalid hash length", () => {
      expect(isHash("short")).toBe(false);
      expect(isHash("a".repeat(50))).toBe(false);
    });

    it("should return false for hash without = at end", () => {
      const invalidHash = "a".repeat(44);
      expect(isHash(invalidHash)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isHash(null as any)).toBe(false);
      expect(isHash(undefined as any)).toBe(false);
      expect(isHash(123 as any)).toBe(false);
    });
  });

  describe("encrypt", () => {
    it("should encrypt data successfully", async () => {
      const mockEncrypted = "encrypted_data";
      (SEA.encrypt as jest.Mock).mockResolvedValue(mockEncrypted);

      const result = await encrypt("test_data", "test_key");

      expect(SEA.encrypt).toHaveBeenCalledWith("test_data", "test_key");
      expect(result).toBe(mockEncrypted);
    });

    it("should throw error when SEA is not available", async () => {
      (SEA.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error("SEA not available");
      });

      await expect(encrypt("test_data", "test_key")).rejects.toThrow(
        "SEA not available"
      );
    });
  });

  describe("decrypt", () => {
    it("should decrypt data successfully", async () => {
      const mockDecrypted = "decrypted_data";
      (SEA.decrypt as jest.Mock).mockResolvedValue(mockDecrypted);

      const result = await decrypt("encrypted_data", "test_key");

      expect(SEA.decrypt).toHaveBeenCalledWith("encrypted_data", "test_key");
      expect(result).toBe(mockDecrypted);
    });

    it("should throw error when SEA is not available", async () => {
      (SEA.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error("SEA not available");
      });

      await expect(decrypt("encrypted_data", "test_key")).rejects.toThrow(
        "SEA not available"
      );
    });
  });

  describe("encFor", () => {
    it("should encrypt data for receiver", async () => {
      const mockSecret = "shared_secret";
      const mockEncrypted = "encrypted_data";

      (SEA.secret as jest.Mock).mockResolvedValue(mockSecret);
      (SEA.encrypt as jest.Mock).mockResolvedValue(mockEncrypted);

      const sender = { epriv: "sender_priv", epub: "sender_pub" };
      const receiver = { epub: "receiver_pub" };
      const data = "test_data";

      const result = await encFor(data, sender, receiver);

      expect(SEA.secret).toHaveBeenCalledWith(receiver.epub, sender);
      expect(SEA.encrypt).toHaveBeenCalledWith(data, mockSecret);
      expect(result).toBe(mockEncrypted);
    });
  });

  describe("decFrom", () => {
    it("should decrypt data from sender", async () => {
      const mockSecret = "shared_secret";
      const mockDecrypted = "decrypted_data";

      (SEA.secret as jest.Mock).mockResolvedValue(mockSecret);
      (SEA.decrypt as jest.Mock).mockResolvedValue(mockDecrypted);

      const sender = { epub: "sender_pub" };
      const receiver = { epriv: "receiver_priv", epub: "receiver_pub" };
      const data = "encrypted_data";

      const result = await decFrom(data, sender, receiver);

      expect(SEA.secret).toHaveBeenCalledWith(sender.epub, receiver);
      expect(SEA.decrypt).toHaveBeenCalledWith(data, mockSecret);
      expect(result).toBe(mockDecrypted);
    });
  });

  describe("hashText", () => {
    it("should hash text successfully", async () => {
      const mockHash = "hashed_text";
      (SEA.work as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashText("test_text");

      expect(SEA.work).toHaveBeenCalledWith("test_text", null, null, {
        name: "SHA-256",
      });
      expect(result).toBe(mockHash);
    });

    it("should throw error when SEA is not available", async () => {
      (SEA.work as jest.Mock).mockImplementation(() => {
        throw new Error("SEA not available");
      });

      await expect(hashText("test_text")).rejects.toThrow("SEA not available");
    });
  });

  describe("hashObj", () => {
    it("should hash object successfully", async () => {
      const mockHash = "hashed_object";
      (SEA.work as jest.Mock).mockResolvedValue(mockHash);

      const testObj = { key: "value", number: 123 };
      const result = await hashObj(testObj);

      expect(SEA.work).toHaveBeenCalledWith(
        JSON.stringify(testObj),
        null,
        null,
        { name: "SHA-256" }
      );
      expect(result).toEqual({
        hash: mockHash,
        hashed: JSON.stringify(testObj),
      });
    });
  });

  describe("secret", () => {
    it("should generate secret successfully", async () => {
      const mockSecret = "generated_secret";
      (SEA.secret as jest.Mock).mockResolvedValue(mockSecret);

      const epub = "test_epub";
      const pair = { epriv: "priv", epub: "pub" };

      const result = await secret(epub, pair);

      expect(SEA.secret).toHaveBeenCalledWith(epub, pair);
      expect(result).toBe(mockSecret);
    });
  });

  describe("getShortHash", () => {
    it("should generate short hash successfully", async () => {
      const mockHash = "long_hash_value_here";
      (SEA.work as jest.Mock).mockResolvedValue(mockHash);

      const result = await getShortHash("test_text", "salt");

      expect(SEA.work).toHaveBeenCalledWith("test_text", null, null, {
        encode: "hex",
        name: "PBKDF2",
        salt: "salt",
      });
      expect(result).toBe(mockHash.substring(0, 8));
    });
  });

  describe("safeHash", () => {
    it("should convert unsafe string to safe hash", () => {
      const unsafe = "test+string/with=special";
      const result = safeHash(unsafe);

      expect(result).toBe("test-string_with.special");
    });

    it("should handle string without special characters", () => {
      const safe = "normal_string";
      const result = safeHash(safe);

      expect(result).toBe("normal_string");
    });
  });

  describe("unsafeHash", () => {
    it("should convert safe string back to unsafe hash", () => {
      const safe = "test-string-with-special";
      const result = unsafeHash(safe);

      expect(result).toBe("test+string+with+special");
    });

    it("should handle string without special characters", () => {
      const normal = "normal_string";
      const result = unsafeHash(normal);

      // Note: unsafeHash will convert _ to - and then - to +, 
      // so "normal_string" becomes "normal+string"
      expect(result).toBe("normal+string");
    });
  });

  describe("safeJSONParse", () => {
    it("should parse valid JSON", () => {
      const validJson = '{"key": "value"}';
      const result = safeJSONParse(validJson);

      expect(result).toEqual({ key: "value" });
    });

    it("should return default value for invalid JSON", () => {
      const invalidJson = "invalid json";
      const defaultValue = { default: true };
      const result = safeJSONParse(invalidJson, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it("should return empty object as default when no default provided", () => {
      const invalidJson = "invalid json";
      const result = safeJSONParse(invalidJson);

      expect(result).toEqual({});
    });
  });

  describe("randomUUID", () => {
    it("should generate a UUID", () => {
      const uuid1 = randomUUID();
      const uuid2 = randomUUID();

      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(uuid2).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(uuid1).not.toBe(uuid2);
    });
  });
});
