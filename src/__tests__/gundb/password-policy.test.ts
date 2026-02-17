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
  create: jest.fn().mockImplementation((alias, pass, cb) => {
    if (cb) cb({ ok: 0, pub: 'testpub' });
  }),
  recall: jest.fn().mockReturnThis(),
  leave: jest.fn(),
  _: { sea: { pub: 'pub', priv: 'priv', epub: 'epub', epriv: 'epriv' } }
};

const mockChain = {
  get: jest.fn().mockReturnThis(),
  put: jest.fn().mockImplementation((val, cb) => {
      if (cb) cb({ err: undefined, ok: 1 });
  }),
  once: jest.fn().mockImplementation((cb) => cb(undefined)), // Simulate alias available (undefined)
  map: jest.fn().mockReturnThis(),
  on: jest.fn(),
};

const mockGun = {
  user: jest.fn().mockReturnValue(mockUser),
  get: jest.fn().mockReturnValue(mockChain),
  on: jest.fn(),
};

// Mock SEA
const mockSEA = {
  work: jest.fn().mockResolvedValue('mocked-hash'),
  encrypt: jest.fn().mockResolvedValue('mocked-encrypted-data'),
  decrypt: jest.fn().mockResolvedValue({ pub: 'testpub' }),
  pair: jest.fn().mockResolvedValue({ pub: 'pub', priv: 'priv', epub: 'epub', epriv: 'epriv' }),
};

describe('Password Policy Tests', () => {
  let db: DataBase;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks behavior if needed
    mockChain.once.mockImplementation((cb) => cb(undefined));
    mockChain.put.mockImplementation((val, cb) => {
      if (cb) cb({ err: undefined, ok: 1 });
    });

    // Mock sessionStorage
    const mockStorage: Record<string, string> = {};
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
        removeItem: jest.fn((key) => { delete mockStorage[key]; }),
      },
      writable: true,
      configurable: true,
    });

    // Initialize DB with mocks
    db = new DataBase(mockGun as any, undefined, mockSEA);
  });

  it('should reject passwords shorter than 8 characters', async () => {
    const result = await db.signUp('validuser', 'short');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Password must be at least 8 characters long');
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('should reject passwords without uppercase letters', async () => {
    const result = await db.signUp('validuser', 'lowercase1!');
    expect(result.success).toBe(false);
    expect(result.error).toContain('uppercase');
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('should reject passwords without lowercase letters', async () => {
    const result = await db.signUp('validuser', 'UPPERCASE1!');
    expect(result.success).toBe(false);
    expect(result.error).toContain('lowercase');
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('should reject passwords without numbers', async () => {
    const result = await db.signUp('validuser', 'NoNumbers!');
    expect(result.success).toBe(false);
    expect(result.error).toContain('number');
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('should reject passwords without special characters', async () => {
    const result = await db.signUp('validuser', 'NoSpecial1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('special character');
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('should accept strong passwords', async () => {
    const strongPass = 'Str0ngP@ss!';

    const result = await db.signUp('validuser', strongPass);

    // Verify success
    expect(result.success).toBe(true);
    expect(mockUser.create).toHaveBeenCalledWith('validuser', strongPass, expect.any(Function));
  });
});
