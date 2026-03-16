import {
  generateSeedPhrase,
  validateSeedPhrase,
  mnemonicToSeed,
  mnemonicToSeedAsync,
  seedToPassword,
  deriveCredentialsFromMnemonic,
  formatSeedPhrase,
  normalizeSeedPhrase,
  seedToKeyPair,
} from '../../utils/seedPhrase';

// Mock gundb/crypto for seedToKeyPair
jest.mock('../../gundb/crypto', () => ({
  generatePairFromMnemonic: jest.fn().mockResolvedValue({ pub: 'test-pub', priv: 'test-priv' }),
}));

describe('seedPhrase Utility', () => {
  const validMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const invalidMnemonic = 'invalid mnemonic phrase';
  const username = 'testuser';

  describe('generateSeedPhrase', () => {
    it('should generate a 12-word mnemonic', () => {
      const mnemonic = generateSeedPhrase();
      expect(mnemonic.split(' ').length).toBe(12);
      expect(validateSeedPhrase(mnemonic)).toBe(true);
    });
  });

  describe('validateSeedPhrase', () => {
    it('should return true for a valid mnemonic', () => {
      expect(validateSeedPhrase(validMnemonic)).toBe(true);
    });

    it('should return false for an invalid mnemonic', () => {
      expect(validateSeedPhrase(invalidMnemonic)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateSeedPhrase('')).toBe(false);
    });
  });

  describe('mnemonicToSeed', () => {
    it('should derive a 64-byte seed from mnemonic and username', () => {
      const seed = mnemonicToSeed(validMnemonic, username);
      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(64);
    });

    it('should be deterministic', () => {
      const seed1 = mnemonicToSeed(validMnemonic, username);
      const seed2 = mnemonicToSeed(validMnemonic, username);
      expect(seed1).toEqual(seed2);
    });

    it('should produce different seeds for different usernames', () => {
      const seed1 = mnemonicToSeed(validMnemonic, 'user1');
      const seed2 = mnemonicToSeed(validMnemonic, 'user2');
      expect(seed1).not.toEqual(seed2);
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => mnemonicToSeed(invalidMnemonic, username)).toThrow('Invalid mnemonic seed phrase');
    });
  });

  describe('mnemonicToSeedAsync', () => {
    it('should derive a 64-byte seed from mnemonic and username asynchronously', async () => {
      const seed = await mnemonicToSeedAsync(validMnemonic, username);
      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(64);
    });

    it('should match the synchronous version', async () => {
      const seedSync = mnemonicToSeed(validMnemonic, username);
      const seedAsync = await mnemonicToSeedAsync(validMnemonic, username);
      expect(seedAsync).toEqual(seedSync);
    });

    it('should throw error for invalid mnemonic', async () => {
      await expect(mnemonicToSeedAsync(invalidMnemonic, username)).rejects.toThrow('Invalid mnemonic seed phrase');
    });
  });

  describe('seedToPassword', () => {
    it('should convert seed to a 64-character hex string', () => {
      const seed = new Uint8Array(64).fill(1);
      const password = seedToPassword(seed);
      expect(typeof password).toBe('string');
      expect(password.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(password)).toBe(true);
    });

    it('should be deterministic', () => {
      const seed = new Uint8Array(64).fill(1);
      const pass1 = seedToPassword(seed);
      const pass2 = seedToPassword(seed);
      expect(pass1).toBe(pass2);
    });
  });

  describe('deriveCredentialsFromMnemonic', () => {
    it('should derive both password and seed', async () => {
      const credentials = await deriveCredentialsFromMnemonic(validMnemonic, username);
      expect(credentials).toHaveProperty('password');
      expect(credentials).toHaveProperty('seed');
      expect(credentials.seed.length).toBe(64);
      expect(credentials.password.length).toBe(64);
    });
  });

  describe('formatSeedPhrase', () => {
    it('should format mnemonic with word numbers', () => {
      const mnemonic = 'one two three';
      const formatted = formatSeedPhrase(mnemonic);
      expect(formatted).toBe('1. one\n2. two\n3. three');
    });
  });

  describe('normalizeSeedPhrase', () => {
    it('should normalize user input', () => {
      const input = '  ABANDON   abandon  ABOUT!  ';
      const normalized = normalizeSeedPhrase(input);
      expect(normalized).toBe('abandon abandon about');
    });

    it('should remove special characters', () => {
      const input = 'abandon, abandon. about?';
      const normalized = normalizeSeedPhrase(input);
      expect(normalized).toBe('abandon abandon about');
    });
  });

  describe('seedToKeyPair', () => {
    it('should call generatePairFromMnemonic', async () => {
      const { generatePairFromMnemonic } = await import('../../gundb/crypto');
      const pair = await seedToKeyPair(validMnemonic, username);
      expect(generatePairFromMnemonic).toHaveBeenCalledWith(validMnemonic, username);
      expect(pair).toEqual({ pub: 'test-pub', priv: 'test-priv' });
    });
  });
});
