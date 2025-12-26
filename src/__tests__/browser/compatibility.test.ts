/**
 * @jest-environment jsdom
 */

// Mock zkproof to avoid ES module issues with @zk-kit/groth16
jest.mock('../../plugins/zkproof/zkProofConnector');
jest.mock('../../plugins/zkproof/zkProofPlugin');
jest.mock('@semaphore-protocol/proof', () => ({
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
}));

import { ShogunCore, ShogunSDKConfig } from '../../index';
import Gun from 'gun/gun';
import 'gun/lib/then';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import 'gun/lib/webrtc';

describe('Browser Compatibility Tests', () => {
  let originalLocalStorage: Storage | undefined;
  let originalCrypto: Crypto | undefined;
  let originalWindow: Window | undefined;

  // Helper function to create a Gun instance for tests
  const createTestGunInstance = () =>
    Gun({
      peers: [],
      localStorage: false,
      radisk: false,
    });

  beforeEach(() => {
    // Backup delle API originali
    originalLocalStorage = global.localStorage;
    originalCrypto = global.crypto;
    originalWindow = global.window;
  });

  afterEach(() => {
    // Ripristino delle API originali
    if (originalLocalStorage) {
      global.localStorage = originalLocalStorage;
    } else {
      delete (global as any).localStorage;
    }

    if (originalCrypto) {
      global.crypto = originalCrypto;
    } else {
      delete (global as any).crypto;
    }

    if (originalWindow) {
      global.window = originalWindow;
    } else {
      delete (global as any).window;
    }
  });

  describe('localStorage Compatibility', () => {
    it('should work with localStorage available', () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };

      global.localStorage = mockLocalStorage as any;
      global.window = { localStorage: mockLocalStorage } as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without localStorage', () => {
      delete (global as any).localStorage;
      delete (global as any).window;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const mockLocalStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error('localStorage error');
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };

      global.localStorage = mockLocalStorage as any;
      global.window = { localStorage: mockLocalStorage } as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Crypto API Compatibility', () => {
    it('should work with crypto API available', () => {
      const mockCrypto = {
        getRandomValues: jest.fn(),
        subtle: {
          generateKey: jest.fn(),
          encrypt: jest.fn(),
          decrypt: jest.fn(),
        },
      };

      global.crypto = mockCrypto as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without crypto API', () => {
      delete (global as any).crypto;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('WebAuthn Compatibility', () => {
    it('should detect WebAuthn support', () => {
      const mockNavigator = {
        credentials: {
          create: jest.fn(),
          get: jest.fn(),
        },
      };

      global.navigator = mockNavigator as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
        webauthn: { enabled: true },
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without WebAuthn support', () => {
      delete (global as any).navigator;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
        webauthn: { enabled: true },
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Web3 Compatibility', () => {
    it('should detect Web3 provider', () => {
      const mockEthereum = {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn(),
        isMetaMask: true,
      };

      global.window = {
        ethereum: mockEthereum,
      } as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
        web3: { enabled: true },
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without Web3 provider', () => {
      delete (global as any).window;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
        web3: { enabled: true },
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Event System Compatibility', () => {
    it('should work with EventTarget', () => {
      const mockEventTarget = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      global.EventTarget = jest
        .fn()
        .mockImplementation(() => mockEventTarget) as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without EventTarget', () => {
      delete (global as any).EventTarget;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('TextEncoder/TextDecoder Compatibility', () => {
    it('should work with TextEncoder/TextDecoder', () => {
      const mockTextEncoder = jest.fn();
      const mockTextDecoder = jest.fn();

      global.TextEncoder = mockTextEncoder as any;
      global.TextDecoder = mockTextDecoder as any;

      const config: ShogunSDKConfig = {
        appToken: 'test-token',
        oauth: { enabled: false },
        peers: [],
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without TextEncoder/TextDecoder', () => {
      delete (global as any).TextEncoder;
      delete (global as any).TextDecoder;

      const config: ShogunSDKConfig = {
        appToken: 'test-token',
        oauth: { enabled: false },
        peers: [],
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Fetch API Compatibility', () => {
    it('should work with fetch API', () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without fetch API', () => {
      delete (global as any).fetch;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('URL API Compatibility', () => {
    it('should work with URL API', () => {
      const mockURL = jest.fn();
      global.URL = mockURL as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without URL API', () => {
      delete (global as any).URL;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Performance API Compatibility', () => {
    it('should work with Performance API', () => {
      const mockPerformance = {
        now: jest.fn(),
        mark: jest.fn(),
        measure: jest.fn(),
      };

      global.performance = mockPerformance as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without Performance API', () => {
      delete (global as any).performance;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });

  describe('Console API Compatibility', () => {
    it('should work with console API', () => {
      const mockConsole = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      };

      global.console = mockConsole as any;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });

    it('should work without console API', () => {
      delete (global as any).console;

      const config: ShogunSDKConfig = {
        gunInstance: createTestGunInstance(),
      };

      expect(() => {
        new ShogunCore(config);
      }).not.toThrow();
    });
  });
});
