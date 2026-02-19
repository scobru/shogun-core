import { DataBase } from '../../gundb/db';
import * as crypto from '../../gundb/crypto';

// Mock dependencies
const mockUser = {
  is: {
    pub: 'testpub',
    alias: 'testuser',
  },
  auth: jest.fn().mockImplementation((arg1, arg2, cb) => {
    let callback = cb;
    if (typeof arg2 === 'function') {
      callback = arg2;
    }
    // Simulate successful auth
    if (callback) {
      callback({ err: undefined });
    }
  }),
  recall: jest.fn().mockReturnThis(),
  leave: jest.fn(),
  _: { sea: { pub: 'pub', priv: 'priv', epub: 'epub', epriv: 'epriv' } },
};

const mockGun = {
  user: jest.fn().mockReturnValue(mockUser),
  get: jest.fn().mockReturnValue({
    once: jest.fn(),
    put: jest.fn(),
    map: jest.fn(),
  }),
  on: jest.fn(),
};

const mockSEA = {
  work: jest.fn().mockResolvedValue('mocked-hash'),
  encrypt: jest.fn().mockResolvedValue('mocked-encrypted-data'),
  decrypt: jest.fn().mockResolvedValue({ pub: 'testpub' }),
  pair: jest
    .fn()
    .mockResolvedValue({
      pub: 'pub',
      priv: 'priv',
      epub: 'epub',
      epriv: 'epriv',
    }),
};

describe('Security Tests', () => {
  let db: DataBase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock sessionStorage
    const mockStorage: Record<string, string> = {};
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockStorage[key];
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock Math.random
    jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should use crypto.randomUUID instead of Math.random for salt generation', async () => {
    // Spy on crypto.randomUUID
    const randomUUIDSpy = jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('mock-uuid-1234');

    db = new DataBase(mockGun as any, undefined, mockSEA);

    // Trigger login to force saveCredentials
    await db.login('testuser', 'password');

    // Verify Math.random was NOT called
    expect(Math.random).not.toHaveBeenCalled();

    // Verify crypto.randomUUID was called
    expect(randomUUIDSpy).toHaveBeenCalled();
  });
});
