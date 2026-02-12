/**
 * Tests for HD Key Derivation
 */

import {
  deriveChildKey,
  deriveChildPublicKey,
  deriveKeyHierarchy,
} from '../../gundb/hd-keys';

// Mock Gun SEA globally
const mockSEA = {
  sign: jest.fn(),
  verify: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  work: jest.fn(),
  pair: jest.fn(),
  secret: jest.fn(),
};

(global as any).Gun = { SEA: mockSEA };
(global as any).SEA = mockSEA;

describe('HD Key Derivation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const masterPair = {
    pub: 'master_pub_key',
    priv: 'master_priv_key',
    epub: 'master_epub_key',
    epriv: 'master_epriv_key',
  };

  describe('deriveChildKey', () => {
    it('should derive a child key for a given purpose', async () => {
      const childPair = {
        pub: 'child_pub_messaging',
        priv: 'child_priv_messaging',
        epub: 'child_epub_messaging',
        epriv: 'child_epriv_messaging',
      };

      mockSEA.pair.mockResolvedValue(childPair);

      const result = await deriveChildKey(masterPair, 'messaging');

      expect(result).toEqual(childPair);
      expect(result.pub).toBe('child_pub_messaging');
    });

    it('should produce different keys for different purposes', async () => {
      const messagingPair = {
        pub: 'msg_pub',
        priv: 'msg_priv',
        epub: 'msg_epub',
        epriv: 'msg_epriv',
      };
      const paymentsPair = {
        pub: 'pay_pub',
        priv: 'pay_priv',
        epub: 'pay_epub',
        epriv: 'pay_epriv',
      };

      mockSEA.pair
        .mockResolvedValueOnce(messagingPair)
        .mockResolvedValueOnce(paymentsPair);

      const key1 = await deriveChildKey(masterPair, 'messaging');
      const key2 = await deriveChildKey(masterPair, 'payments');

      expect(key1.pub).not.toBe(key2.pub);
    });

    it('should throw for invalid master pair', async () => {
      await expect(deriveChildKey({} as any, 'purpose')).rejects.toThrow(
        'Invalid master pair',
      );
    });

    it('should throw for empty purpose string', async () => {
      await expect(deriveChildKey(masterPair, '')).rejects.toThrow(
        'Purpose string is required',
      );
    });

    it('should throw when SEA is not available', async () => {
      (global as any).Gun = {};
      (global as any).SEA = null;

      await expect(deriveChildKey(masterPair, 'messaging')).rejects.toThrow(
        'SEA not available',
      );

      // Restore
      (global as any).Gun = { SEA: mockSEA };
      (global as any).SEA = mockSEA;
    });

    it('should fall back to SEA.work + pair when native derivation fails', async () => {
      const fallbackPair = {
        pub: 'fb_pub',
        priv: 'fb_priv',
        epub: 'fb_epub',
        epriv: 'fb_epriv',
      };

      // First call (native) returns null, second call (fallback with seed) returns pair
      mockSEA.pair
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fallbackPair);
      mockSEA.work.mockResolvedValue('derived_seed');

      const result = await deriveChildKey(masterPair, 'messaging');

      expect(mockSEA.work).toHaveBeenCalledWith(
        'master_priv_key:messaging',
        'shogun-hd-derivation',
        null,
        { name: 'SHA-256' },
      );
      expect(result).toEqual(fallbackPair);
    });
  });

  describe('deriveChildPublicKey', () => {
    it('should derive a deterministic public key identifier', async () => {
      mockSEA.work.mockResolvedValue('derived_pub_identifier');

      const result = await deriveChildPublicKey('master_pub_key', 'messaging');

      expect(result).toBe('derived_pub_identifier');
      expect(mockSEA.work).toHaveBeenCalledWith(
        'master_pub_key:messaging',
        'shogun-hd-pub-derivation',
        null,
        { name: 'SHA-256' },
      );
    });

    it('should throw for missing master public key', async () => {
      await expect(deriveChildPublicKey('', 'messaging')).rejects.toThrow(
        'Master public key is required',
      );
    });
  });

  describe('deriveKeyHierarchy', () => {
    it('should derive keys for multiple purposes', async () => {
      const purposes = ['messaging', 'payments', 'signing'];
      const pairs = purposes.map((p) => ({
        pub: `${p}_pub`,
        priv: `${p}_priv`,
        epub: `${p}_epub`,
        epriv: `${p}_epriv`,
      }));

      pairs.forEach((pair) => {
        mockSEA.pair.mockResolvedValueOnce(pair);
      });

      const result = await deriveKeyHierarchy(masterPair, purposes);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result.messaging.pub).toBe('messaging_pub');
      expect(result.payments.pub).toBe('payments_pub');
      expect(result.signing.pub).toBe('signing_pub');
    });

    it('should return empty object for empty purposes array', async () => {
      const result = await deriveKeyHierarchy(masterPair, []);
      expect(result).toEqual({});
    });
  });
});
