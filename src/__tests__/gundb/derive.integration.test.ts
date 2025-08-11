import derive, { DeriveOptions } from "../../gundb/derive";

// Mock completo delle librerie @noble/curves
jest.mock("@noble/curves/p256", () => ({
  p256: {
    getPublicKey: jest.fn((privateKey: Uint8Array) => {
      // Simula una chiave pubblica P-256 valida in formato uncompressed
      const mockPublicKey = new Uint8Array(65);
      mockPublicKey[0] = 4; // Formato uncompressed
      mockPublicKey.fill(1, 1, 33); // x coordinate
      mockPublicKey.fill(2, 33, 65); // y coordinate
      return mockPublicKey;
    }),
    utils: {
      isValidPrivateKey: jest.fn(() => true),
    },
  },
}));

jest.mock("@noble/curves/secp256k1", () => ({
  secp256k1: {
    getPublicKey: jest.fn((privateKey: Uint8Array) => {
      // Simula una chiave pubblica secp256k1 valida in formato uncompressed
      const mockPublicKey = new Uint8Array(65);
      mockPublicKey[0] = 4; // Formato uncompressed
      mockPublicKey.fill(3, 1, 33); // x coordinate
      mockPublicKey.fill(4, 33, 65); // y coordinate
      return mockPublicKey;
    }),
    utils: {
      isValidPrivateKey: jest.fn(() => true),
    },
  },
}));

// Mock crypto.getRandomValues per test deterministici
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: jest.fn(() => new Uint8Array(32).fill(1)),
    subtle: {
      importKey: jest.fn().mockResolvedValue("mock-key"),
      deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
  writable: true,
});

describe("Derive Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should derive P-256 keys with default options", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      const result = await derive(password, extra);

      expect(result).toHaveProperty("pub");
      expect(result).toHaveProperty("priv");
      expect(result).toHaveProperty("epub");
      expect(result).toHaveProperty("epriv");
      expect(typeof result.pub).toBe("string");
      expect(typeof result.priv).toBe("string");
    });

    it("should derive keys with all options enabled", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeP256: true,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: true,
      };

      const result = await derive(password, extra, options);

      expect(result).toHaveProperty("pub");
      expect(result).toHaveProperty("priv");
      expect(result).toHaveProperty("epub");
      expect(result).toHaveProperty("epriv");
      expect(result.secp256k1Bitcoin).toHaveProperty("privateKey");
      expect(result.secp256k1Bitcoin).toHaveProperty("publicKey");
      expect(result.secp256k1Bitcoin).toHaveProperty("address");
      expect(result.secp256k1Ethereum).toHaveProperty("privateKey");
      expect(result.secp256k1Ethereum).toHaveProperty("publicKey");
      expect(result.secp256k1Ethereum).toHaveProperty("address");
    });

    it("should derive only Bitcoin keys", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeP256: false,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: false,
      };

      const result = await derive(password, extra, options);

      expect(result.pub).toBeUndefined();
      expect(result.priv).toBeUndefined();
      expect(result.secp256k1Bitcoin).toHaveProperty("privateKey");
      expect(result.secp256k1Bitcoin).toHaveProperty("publicKey");
      expect(result.secp256k1Bitcoin).toHaveProperty("address");
      expect(result.secp256k1Ethereum).toBeUndefined();
    });

    it("should derive only Ethereum keys", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeP256: false,
        includeSecp256k1Bitcoin: false,
        includeSecp256k1Ethereum: true,
      };

      const result = await derive(password, extra, options);

      expect(result.pub).toBeUndefined();
      expect(result.priv).toBeUndefined();
      expect(result.secp256k1Bitcoin).toBeUndefined();
      expect(result.secp256k1Ethereum).toHaveProperty("privateKey");
      expect(result.secp256k1Ethereum).toHaveProperty("publicKey");
      expect(result.secp256k1Ethereum).toHaveProperty("address");
    });
  });

  describe("Input Handling", () => {
    it("should handle string password", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle Uint8Array password", async () => {
      const password = new Uint8Array(32).fill(1);
      const extra = "testextra";

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle null/undefined password", async () => {
      const extra = "testextra";

      const result = await derive(null, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle array extra", async () => {
      const password = "testpassword12345678901234567890";
      const extra = ["extra1", "extra2", "extra3"];

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle null/undefined extra", async () => {
      const password = "testpassword12345678901234567890";

      const result = await derive(password, null);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle number extra", async () => {
      const password = "testpassword12345678901234567890";
      const extra = 12345;

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should throw error for insufficient input entropy", async () => {
      const password = "short";
      const extra = "";

      await expect(derive(password, extra)).rejects.toThrow(
        "Insufficient input entropy"
      );
    });

    it("should handle invalid private key errors", async () => {
      const mockP256 = require("@noble/curves/p256");
      mockP256.p256.utils.isValidPrivateKey = jest.fn().mockReturnValue(false);

      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      await expect(derive(password, extra)).rejects.toThrow(
        "Invalid private key for signing"
      );

      // Restore
      mockP256.p256.utils.isValidPrivateKey = jest.fn().mockReturnValue(true);
    });

    it("should handle invalid secp256k1 private key for Bitcoin", async () => {
      const mockSecp256k1 = require("@noble/curves/secp256k1");
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(false);

      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeSecp256k1Bitcoin: true,
      };

      await expect(derive(password, extra, options)).rejects.toThrow(
        "Invalid secp256k1 private key for Bitcoin"
      );

      // Restore
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(true);
    });

    it("should handle invalid secp256k1 private key for Ethereum", async () => {
      const mockSecp256k1 = require("@noble/curves/secp256k1");
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(false);

      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeSecp256k1Ethereum: true,
      };

      await expect(derive(password, extra, options)).rejects.toThrow(
        "Invalid secp256k1 private key for Ethereum"
      );

      // Restore
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(true);
    });
  });

  describe("Key Format Validation", () => {
    it("should generate valid P-256 key format", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      const result = await derive(password, extra);

      // P-256 keys should be base64url encoded
      expect(result.pub).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      expect(result.priv).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result.epub).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      expect(result.epriv).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should generate valid Bitcoin key format", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeSecp256k1Bitcoin: true,
      };

      const result = await derive(password, extra, options);

      // Bitcoin private key should be hex string
      expect(result.secp256k1Bitcoin.privateKey).toMatch(/^[0-9a-f]{64}$/);
      // Bitcoin public key should be hex string
      expect(result.secp256k1Bitcoin.publicKey).toMatch(/^[0-9a-f]{66}$/); // Compressed
      // Bitcoin address should be base58
      expect(result.secp256k1Bitcoin.address).toMatch(
        /^[1-9A-HJ-NP-Za-km-z]{26,35}$/
      );
    });

    it("should generate valid Ethereum key format", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";
      const options: DeriveOptions = {
        includeSecp256k1Ethereum: true,
      };

      const result = await derive(password, extra, options);

      // Ethereum private key should be hex with 0x prefix
      expect(result.secp256k1Ethereum.privateKey).toMatch(/^0x[0-9a-f]{64}$/);
      // Ethereum public key should be hex with 0x prefix
      expect(result.secp256k1Ethereum.publicKey).toMatch(/^0x[0-9a-f]{130}$/); // Uncompressed
      // Ethereum address should be hex with 0x prefix
      expect(result.secp256k1Ethereum.address).toMatch(/^0x[0-9a-f]{40}$/);
    });
  });

  describe("Consistency", () => {
    it("should generate consistent results for same input", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      const result1 = await derive(password, extra);
      const result2 = await derive(password, extra);

      expect(result1.pub).toBe(result2.pub);
      expect(result1.priv).toBe(result2.priv);
      expect(result1.epub).toBe(result2.epub);
      expect(result1.epriv).toBe(result2.epriv);
    });

    it("should generate different results for different inputs", async () => {
      const password1 = "testpassword12345678901234567890";
      const password2 = "testpassword12345678901234567891";
      const extra = "testextra";

      const result1 = await derive(password1, extra);
      const result2 = await derive(password2, extra);

      expect(result1.pub).not.toBe(result2.pub);
      expect(result1.priv).not.toBe(result2.priv);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long password", async () => {
      const password = "a".repeat(1000);
      const extra = "testextra";

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle very long extra", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "a".repeat(1000);

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it("should handle unicode strings", async () => {
      const password = "café123456789012345678901234567890";
      const extra = "testextra";

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete key derivation flow", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      // 1. Derive P-256 keys
      const p256Result = await derive(password, extra);
      expect(p256Result.pub).toBeDefined();
      expect(p256Result.priv).toBeDefined();

      // 2. Derive Bitcoin keys
      const bitcoinResult = await derive(password, extra, {
        includeP256: false,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: false,
      });
      expect(bitcoinResult.secp256k1Bitcoin).toBeDefined();

      // 3. Derive Ethereum keys
      const ethereumResult = await derive(password, extra, {
        includeP256: false,
        includeSecp256k1Bitcoin: false,
        includeSecp256k1Ethereum: true,
      });
      expect(ethereumResult.secp256k1Ethereum).toBeDefined();

      // 4. Derive all keys
      const allResult = await derive(password, extra, {
        includeP256: true,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: true,
      });
      expect(allResult.pub).toBeDefined();
      expect(allResult.secp256k1Bitcoin).toBeDefined();
      expect(allResult.secp256k1Ethereum).toBeDefined();
    });

    it("should handle different input types consistently", async () => {
      const password = "testpassword12345678901234567890";
      const extra = "testextra";

      // Test with string password
      const stringResult = await derive(password, extra);

      // Test with Uint8Array password
      const uint8Result = await derive(new Uint8Array(32).fill(1), extra);

      // Test with null password
      const nullResult = await derive(null, extra);

      // All should produce valid results
      expect(stringResult.pub).toBeDefined();
      expect(uint8Result.pub).toBeDefined();
      expect(nullResult.pub).toBeDefined();
    });
  });
});
