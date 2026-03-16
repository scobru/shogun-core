import { DataBase } from '../../gundb/db';

describe('Random AlphaNumeric Security', () => {
  let db: DataBase;
  let mockGun: any;

  beforeEach(() => {
    mockGun = {
      user: jest.fn().mockReturnValue({
        is: { pub: 'test-pub' },
      }),
      get: jest.fn().mockReturnValue({
        put: jest.fn().mockImplementation((data, cb) => cb({ ok: 1 })),
      }),
    };
    db = new DataBase(mockGun as any);

    // Spy on Math.random
    jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('_randomAlphaNumeric should not use Math.random', () => {
    // Accessing private method for testing purposes
    const result = (db as any)._randomAlphaNumeric(30);

    expect(result).toHaveLength(30);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);

    // This is expected to FAIL before the fix
    expect(Math.random).not.toHaveBeenCalled();
  });

  it('Set method should use a cryptographically secure token', async () => {
    // Mock Put to avoid actual GunDB calls
    jest.spyOn(db, 'Put').mockResolvedValue({ data: [], error: [] });

    await db.Set('test/path', { some: 'data' });

    // This is expected to FAIL before the fix
    expect(Math.random).not.toHaveBeenCalled();
  });
});
