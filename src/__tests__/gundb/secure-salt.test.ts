import { DataBase } from '../../gundb/db';
import * as crypto from '../../gundb/crypto';

// Mock crypto module
jest.mock('../../gundb/crypto', () => {
  const original = jest.requireActual('../../gundb/crypto');
  return {
    ...original,
    randomUUID: jest.fn(() => 'mock-uuid-for-salt'),
  };
});

describe('Secure Salt Generation', () => {
  let db: DataBase;
  let mockGun: any;
  let mockUser: any;
  let mockSEA: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock sessionStorage
    const mockStorage: Record<string, string> = {};
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, val) => {
          mockStorage[key] = val;
        }),
        removeItem: jest.fn((key) => {
          delete mockStorage[key];
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock Gun User
    mockUser = {
      auth: jest.fn((arg1, arg2, cb) => {
        // Handle both (alias, pass, cb) and (pair, cb)
        const callback = typeof arg2 === 'function' ? arg2 : cb;

        // Simulate successful auth
        mockUser.is = { pub: 'testpub', alias: 'testuser' };
        mockUser._ = {
          sea: {
            pub: 'testpub',
            priv: 'testpriv',
            epub: 'testepub',
            epriv: 'testepriv',
          },
        };

        if (callback) {
          callback({ err: undefined });
        }
      }),
      create: jest.fn(),
      leave: jest.fn(),
      recall: jest.fn().mockReturnThis(),
      // Initial state
      is: undefined,
    };

    // Mock Gun Instance
    mockGun = {
      user: jest.fn(() => mockUser),
      get: jest.fn().mockReturnThis(),
      on: jest.fn(),
      opt: jest.fn(),
    };

    // Mock SEA
    mockSEA = {
      work: jest.fn().mockResolvedValue('mock-hash'),
      encrypt: jest.fn().mockResolvedValue('mock-encrypted'),
      decrypt: jest.fn().mockResolvedValue({ pub: 'testpub' }),
    };

    // Initialize DB
    db = new DataBase(mockGun, undefined, mockSEA);
  });

  it('should use crypto.randomUUID() for salt generation during login', async () => {
    await db.login('testuser', 'password');

    // Check if saveCredentials was called by checking sessionStorage usage
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'gunSessionData',
      expect.any(String),
    );

    // Check if randomUUID was called
    expect(crypto.randomUUID).toHaveBeenCalled();
  });
});
