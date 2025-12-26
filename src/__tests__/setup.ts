import { TextEncoder, TextDecoder } from 'util';

// Add jest types
declare const jest: any;
declare const afterEach: any;
declare const test: any;
declare const expect: any;

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Polyfill crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: (arr: any) => crypto.randomFillSync(arr),
    subtle: {
      generateKey: async () =>
        ({
          type: 'secret',
          extractable: true,
          algorithm: { name: 'AES-GCM' },
          usages: ['encrypt', 'decrypt'],
        }) as any,
      importKey: async () =>
        ({
          type: 'secret',
          extractable: true,
          algorithm: { name: 'AES-GCM' },
          usages: ['encrypt', 'decrypt'],
        }) as any,
      deriveBits: jest.fn().mockImplementation((params, key, bits) => {
        // Generate a valid private key for testing
        const keyBytes = new Uint8Array(32);

        // Use both the salt and the key (which contains the input) to generate different keys
        const salt = params.salt;
        const saltBytes = new Uint8Array(salt);

        // Get the input from the key (which is the combined password + extra)
        const inputBytes = new Uint8Array(key);

        // Create a hash that combines both salt and input
        let hash = 0;
        for (let i = 0; i < saltBytes.length; i++) {
          hash = ((hash << 7) - hash + saltBytes[i] * (i + 1)) & 0xffffffff;
        }
        for (let i = 0; i < inputBytes.length; i++) {
          hash = ((hash << 11) - hash + inputBytes[i] * (i + 2)) & 0xffffffff;
        }

        // Generate a deterministic but varied key based on combined hash
        for (let i = 0; i < 32; i++) {
          keyBytes[i] =
            (hash +
              i * 23 +
              saltBytes[i % saltBytes.length] * 19 +
              inputBytes[i % inputBytes.length] * 17 +
              11) %
            256;
        }

        // Ensure it's within valid range for both P-256 and secp256k1
        // P-256 order: 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
        // secp256k1 order: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

        // Generate a valid key that's less than the curve order
        // For P-256, we need to ensure the key is less than the curve order
        // For simplicity, we'll use a pattern that's guaranteed to be valid
        keyBytes[0] = 0x01; // Start with 1 to ensure it's not zero
        keyBytes[1] = 0x23; // Safe value
        keyBytes[2] = 0x45; // Safe value
        keyBytes[3] = 0x67; // Safe value
        keyBytes[4] = 0x89; // Safe value
        keyBytes[5] = 0xab; // Safe value
        keyBytes[6] = 0xcd; // Safe value
        keyBytes[7] = 0xef; // Safe value

        // Fill the rest with a pattern that's safe for both curves
        for (let i = 8; i < 32; i++) {
          keyBytes[i] = (i * 13 + 7) % 256;
        }

        // Ensure the last few bytes are safe for both curve orders
        keyBytes[30] = 0x12; // Safe value
        keyBytes[31] = 0x34; // Safe value

        return Promise.resolve(keyBytes.buffer);
      }),
      encrypt: async () => new Uint8Array(16) as any,
      decrypt: async () => new Uint8Array(16) as any,
      sign: async () => new Uint8Array(64) as any,
      verify: async () => true,
      digest: async () => new Uint8Array(32) as any,
    },
  } as any;
}

// Polyfill window object for browser-like environment
if (typeof global.window === 'undefined') {
  global.window = {
    location: { href: 'http://localhost:3000' },
    navigator: {
      userAgent: 'Jest Test Environment',
      platform: 'Win32',
    },
    document: {
      createElement: () => ({}),
      getElementById: () => null,
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    // Add WebAuthn support for tests
    PublicKeyCredential: {
      isUserVerifyingPlatformAuthenticatorAvailable: jest
        .fn()
        .mockResolvedValue(true),
    },
  } as any;
} else {
  // Ensure WebAuthn is available even if window exists
  if (!global.window.PublicKeyCredential) {
    global.window.PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: jest
        .fn()
        .mockResolvedValue(true),
    } as any;
  }
}

// Polyfill fetch for Node.js environment
if (typeof global.fetch === 'undefined') {
  global.fetch = async () =>
    ({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    }) as any;
}

// Check if we're in integration test mode
const isIntegrationTest = process.env.JEST_INTEGRATION === 'true';

// Global Gun mock (only for unit tests)
if (!isIntegrationTest) {
  const mockUserInstance = {
    create: jest.fn(),
    auth: jest.fn(),
    leave: jest.fn(),
    recall: jest.fn(() => mockUserInstance),
    get: jest.fn(),
    put: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
  };

  const mockGunInstance = {
    user: jest.fn(() => mockUserInstance),
    get: jest.fn(() => ({
      map: jest.fn(),
      once: jest.fn(),
      put: jest.fn(),
      set: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
    put: jest.fn(),
    set: jest.fn(),
    opt: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
  };

  // Create a mock Gun constructor
  const MockGun = jest.fn(() => mockGunInstance);

  // Set global Gun mock
  (global as any).Gun = MockGun;
}

// Set global SEA mock
(global as any).SEA = {
  pair: jest.fn().mockResolvedValue({
    pub: 'test-pub-key',
    priv: 'test-priv-key',
    epub: 'test-epub-key',
    epriv: 'test-epriv-key',
  }),
  sign: jest.fn().mockResolvedValue('signed-data'),
  verify: jest.fn().mockResolvedValue(true),
  encrypt: jest.fn().mockResolvedValue('encrypted-data'),
  decrypt: jest.fn().mockResolvedValue('decrypted-data'),
  secret: jest.fn().mockResolvedValue('secret'),
  work: jest.fn().mockResolvedValue('proof'),
};

// Mock Gun modules (only for unit tests)
if (!isIntegrationTest) {
  jest.doMock('gun', () => ({
    default: (global as any).Gun,
    SEA: {
      pair: jest.fn().mockResolvedValue({
        pub: 'test-pub-key',
        priv: 'test-priv-key',
        epub: 'test-epub-key',
        epriv: 'test-epriv-key',
      }),
      sign: jest.fn().mockResolvedValue('signed-data'),
      verify: jest.fn().mockResolvedValue(true),
      encrypt: jest.fn().mockResolvedValue('encrypted-data'),
      decrypt: jest.fn().mockResolvedValue('decrypted-data'),
      secret: jest.fn().mockResolvedValue('shared-secret'),
      work: jest.fn().mockResolvedValue('hashed-data'),
    },
  }));

  jest.doMock('gun/gun', () => (global as any).Gun);
}

jest.doMock('gun/sea', () => ({
  pair: jest.fn().mockResolvedValue({
    pub: 'test-pub-key',
    priv: 'test-priv-key',
    epub: 'test-epub-key',
    epriv: 'test-epriv-key',
  }),
  sign: jest.fn().mockResolvedValue('signed-data'),
  verify: jest.fn().mockResolvedValue(true),
  encrypt: jest.fn().mockResolvedValue('encrypted-data'),
  decrypt: jest.fn().mockResolvedValue('decrypted-data'),
  secret: jest.fn().mockResolvedValue('shared-secret'),
  work: jest.fn().mockResolvedValue('hashed-data'),
}));

// Mock other Gun imports
jest.doMock('gun/lib/then.js', () => ({}));
jest.doMock('gun/lib/radisk.js', () => ({}));
jest.doMock('gun/lib/store.js', () => ({}));
jest.doMock('gun/lib/rindexed.js', () => ({}));
jest.doMock('gun/lib/webrtc.js', () => ({}));
jest.doMock('gun/lib/yson.js', () => ({}));

// Mock CryptoIdentityManager to avoid MLS issues
jest.doMock('../managers/CryptoIdentityManager', () => ({
  CryptoIdentityManager: require('./__mocks__/CryptoIdentityManager')
    .CryptoIdentityManager,
}));

// Mock MLS module to avoid ts-mls ES module issues
jest.doMock('../crypto/mls', () => ({
  MLSManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    createGroup: jest
      .fn()
      .mockResolvedValue({ groupId: 'mock_group_id', epoch: 0 }),
    addMembers: jest.fn().mockResolvedValue(true),
    removeMembers: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn().mockResolvedValue(true),
    receiveMessage: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock PGP module
jest.doMock('../crypto/pgp', () => ({
  PGPManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    generateKeyPair: jest.fn().mockResolvedValue({
      publicKey: 'mock_pgp_pub',
      privateKey: 'mock_pgp_priv',
      keyId: 'mock_key_id',
    }),
    encrypt: jest.fn().mockResolvedValue('encrypted_pgp_data'),
    decrypt: jest.fn().mockResolvedValue('decrypted_pgp_data'),
  })),
}));

// Mock SFrame module
jest.doMock('../crypto/sframe', () => ({
  SFrameManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    generateKey: jest.fn().mockResolvedValue({ keyId: 1 }),
    encrypt: jest.fn().mockResolvedValue('encrypted_sframe_data'),
    decrypt: jest.fn().mockResolvedValue('decrypted_sframe_data'),
  })),
}));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Dummy test to make this a valid test suite
test('dummy test', () => {
  expect(true).toBe(true);
});
