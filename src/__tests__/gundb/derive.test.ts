// Mock @noble/curves libraries
jest.mock('@noble/curves/p256', () => ({
  p256: {
    getPublicKey: jest.fn((privateKey: Uint8Array) => {
      // Simula una chiave pubblica P-256 valida in formato uncompressed
      const mockPublicKey = new Uint8Array(65);
      mockPublicKey[0] = 4; // Formato uncompressed
      // Usa la chiave privata per generare coordinate diverse
      for (let i = 1; i < 33; i++) {
        mockPublicKey[i] = (privateKey[i - 1] + i * 5) % 256;
      }
      for (let i = 33; i < 65; i++) {
        mockPublicKey[i] = (privateKey[i - 33] + i * 7) % 256;
      }
      return mockPublicKey;
    }),
    utils: {
      isValidPrivateKey: jest.fn(() => true),
    },
  },
}));

jest.mock('@noble/curves/secp256k1', () => ({
  secp256k1: {
    getPublicKey: jest.fn(
      (privateKey: Uint8Array, compressed: boolean = true) => {
        if (compressed) {
          // Simula una chiave pubblica secp256k1 valida in formato compressed
          const mockPublicKey = new Uint8Array(33);
          mockPublicKey[0] = 0x02; // Formato compressed (02 per y pari)
          // Usa la chiave privata per generare una chiave pubblica diversa
          for (let i = 1; i < 33; i++) {
            mockPublicKey[i] = (privateKey[i - 1] + i * 7) % 256;
          }
          return mockPublicKey;
        } else {
          // Simula una chiave pubblica secp256k1 valida in formato uncompressed
          const mockPublicKey = new Uint8Array(65);
          mockPublicKey[0] = 0x04; // Formato uncompressed
          // Usa la chiave privata per generare coordinate x e y diverse
          for (let i = 1; i < 33; i++) {
            mockPublicKey[i] = (privateKey[i - 1] + i * 7) % 256;
          }
          for (let i = 33; i < 65; i++) {
            mockPublicKey[i] = (privateKey[i - 33] + i * 11) % 256;
          }
          return mockPublicKey;
        }
      },
    ),
    utils: {
      isValidPrivateKey: jest.fn(() => true),
    },
  },
}));

import derive, { DeriveOptions } from '../../gundb/derive';

// Use the crypto mock from setup.ts instead of overriding it

describe('Derive Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should derive keys with default options (P-256 only)', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';

      const result = await derive(password, extra);

      expect(result).toHaveProperty('pub');
      expect(result).toHaveProperty('priv');
      expect(result).toHaveProperty('epub');
      expect(result).toHaveProperty('epriv');
      expect(result).toHaveProperty('secp256k1Bitcoin');
      expect(result).toHaveProperty('secp256k1Ethereum');
      expect(typeof result.pub).toBe('string');
      expect(typeof result.priv).toBe('string');
    });

    it('should derive keys with custom options', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
      const options: DeriveOptions = {
        includeP256: true,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: true,
      };

      const result = await derive(password, extra, options);

      expect(result).toHaveProperty('pub');
      expect(result).toHaveProperty('priv');
      expect(result).toHaveProperty('epub');
      expect(result).toHaveProperty('epriv');
      expect(result.secp256k1Bitcoin).toHaveProperty('privateKey');
      expect(result.secp256k1Bitcoin).toHaveProperty('publicKey');
      expect(result.secp256k1Bitcoin).toHaveProperty('address');
      expect(result.secp256k1Ethereum).toHaveProperty('privateKey');
      expect(result.secp256k1Ethereum).toHaveProperty('publicKey');
      expect(result.secp256k1Ethereum).toHaveProperty('address');
    });

    it('should derive keys with only Bitcoin enabled', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
      const options: DeriveOptions = {
        includeP256: false,
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: false,
      };

      const result = await derive(password, extra, options);

      expect(result.pub).toBeUndefined();
      expect(result.priv).toBeUndefined();
      expect(result.epub).toBeUndefined();
      expect(result.epriv).toBeUndefined();
      expect(result.secp256k1Bitcoin).toHaveProperty('privateKey');
      expect(result.secp256k1Bitcoin).toHaveProperty('publicKey');
      expect(result.secp256k1Bitcoin).toHaveProperty('address');
      expect(result.secp256k1Ethereum).toBeUndefined();
    });

    it('should derive keys with only Ethereum enabled', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
      const options: DeriveOptions = {
        includeP256: false,
        includeSecp256k1Bitcoin: false,
        includeSecp256k1Ethereum: true,
      };

      const result = await derive(password, extra, options);

      expect(result.pub).toBeUndefined();
      expect(result.priv).toBeUndefined();
      expect(result.epub).toBeUndefined();
      expect(result.epriv).toBeUndefined();
      expect(result.secp256k1Bitcoin).toBeUndefined();
      expect(result.secp256k1Ethereum).toHaveProperty('privateKey');
      expect(result.secp256k1Ethereum).toHaveProperty('publicKey');
      expect(result.secp256k1Ethereum).toHaveProperty('address');
    });
  });

  describe('Input handling', () => {
    it('should handle string password', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle Uint8Array password', async () => {
      const password = new Uint8Array(32).fill(1);
      const extra = 'testextra';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle null/undefined password (uses random)', async () => {
      const extra = 'testextra';

      const result = await derive(null, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle array extra', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = ['extra1', 'extra2', 'extra3'];

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle null/undefined extra', async () => {
      const password = 'testpassword12345678901234567890';

      const result = await derive(password, null);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle number extra', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 12345;

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should throw error for insufficient input entropy', async () => {
      const password = 'short';
      const extra = '';

      await expect(derive(password, extra)).rejects.toThrow(
        'Insufficient input entropy',
      );
    });

    it('should handle invalid private key errors', async () => {
      const mockP256 = require('@noble/curves/p256');
      mockP256.p256.utils.isValidPrivateKey = jest.fn().mockReturnValue(false);

      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';

      await expect(derive(password, extra)).rejects.toThrow(
        /Invalid private key for (signing|encryption)/,
      );

      // Restore
      mockP256.p256.utils.isValidPrivateKey = jest.fn().mockReturnValue(true);
    });

    it('should handle invalid secp256k1 private key for Bitcoin', async () => {
      const mockSecp256k1 = require('@noble/curves/secp256k1');
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(false);

      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
      const options: DeriveOptions = {
        includeSecp256k1Bitcoin: true,
      };

      await expect(derive(password, extra, options)).rejects.toThrow(
        /Invalid (private key for (signing|encryption)|secp256k1 private key for Bitcoin)/,
      );

      // Restore
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(true);
    });

    it('should handle invalid secp256k1 private key for Ethereum', async () => {
      const mockSecp256k1 = require('@noble/curves/secp256k1');
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(false);

      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
      const options: DeriveOptions = {
        includeSecp256k1Bitcoin: false,
        includeSecp256k1Ethereum: true,
      };

      await expect(derive(password, extra, options)).rejects.toThrow(
        /Invalid (private key for (signing|encryption)|secp256k1 private key for Ethereum)/,
      );

      // Restore
      mockSecp256k1.secp256k1.utils.isValidPrivateKey = jest
        .fn()
        .mockReturnValue(true);
    });
  });

  describe('Key format validation', () => {
    it('should generate valid P-256 key format', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';

      const result = await derive(password, extra);

      // P-256 keys should be base64url encoded
      expect(result.pub).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      expect(result.priv).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result.epub).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      expect(result.epriv).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate valid Bitcoin key format', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
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
        /^[1-9A-HJ-NP-Za-km-z]{26,35}$/,
      );
    });

    it('should generate valid Ethereum key format', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';
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

  describe('String normalization', () => {
    it('should normalize unicode strings', async () => {
      const password = 'café123456789012345678901234567890';
      const extra = 'testextra';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should trim whitespace', async () => {
      const password = '  testpassword12345678901234567890  ';
      const extra = '  testextra  ';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string password', async () => {
      const password = '';
      const extra = 'testextra12345678901234567890';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle empty string extra', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = '';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const extra = 'testextra';

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });

    it('should handle very long extra', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'a'.repeat(1000);

      const result = await derive(password, extra);

      expect(result).toBeDefined();
      expect(result.pub).toBeDefined();
    });
  });

  describe('Consistency', () => {
    it('should generate consistent results for same input', async () => {
      const password = 'testpassword12345678901234567890';
      const extra = 'testextra';

      const result1 = await derive(password, extra);
      const result2 = await derive(password, extra);

      expect(result1.pub).toBe(result2.pub);
      expect(result1.priv).toBe(result2.priv);
      expect(result1.epub).toBe(result2.epub);
      expect(result1.epriv).toBe(result2.epriv);
    });

    it('should generate different results for different inputs', async () => {
      const password1 = 'testpassword12345678901234567890';
      const password2 = 'differentpassword12345678901234567890';
      const extra = 'testextra';

      const result1 = await derive(password1, extra, {
        includeP256: false,
        includeSecp256k1Bitcoin: true,
      });
      const result2 = await derive(password2, extra, {
        includeP256: false,
        includeSecp256k1Bitcoin: true,
      });

      expect(result1.secp256k1Bitcoin.privateKey).not.toBe(
        result2.secp256k1Bitcoin.privateKey,
      );
      expect(result1.secp256k1Bitcoin.publicKey).not.toBe(
        result2.secp256k1Bitcoin.publicKey,
      );
    });
  });
});
