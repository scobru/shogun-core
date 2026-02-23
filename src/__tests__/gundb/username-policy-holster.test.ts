import { DataBaseHolster } from '../../gundb/db-holster';

describe('Username Policy Holster', () => {
  let dbHolster: DataBaseHolster;
  let mockHolster: any;

  beforeAll(() => {
    // Mock minimal holster instance for constructor and validation
    mockHolster = {
      user: jest.fn().mockReturnValue({
        recall: jest.fn(),
        is: null,
        leave: jest.fn(),
      }),
      get: jest.fn().mockReturnThis(),
      next: jest.fn().mockReturnThis(),
      SEA: {
        work: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
      },
    };

    dbHolster = new DataBaseHolster(mockHolster);
  });

  afterAll(() => {
    dbHolster.destroy();
  });

  // Helper function to access private method for testing
  const validateUsername = (username: string) => {
    // validateSignupCredentials checks username first, then password strength.
    // We pass a valid password to ensure only username validation fails.
    return (dbHolster as any).validateSignupCredentials(
      username,
      'ValidPass1!',
    );
  };

  // Helper function to access private method for testing password
  const validatePassword = (pwd: string) => {
    return (dbHolster as any).validatePasswordStrength(pwd);
  };

  it('should reject usernames that are empty', () => {
    const result = validateUsername('');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/more than 0 characters/);
  });

  it('should reject usernames that are too long', () => {
    const longUsername = 'a'.repeat(65);
    const result = validateUsername(longUsername);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/64 characters or fewer/);
  });

  it('should reject usernames with invalid characters', () => {
    const result = validateUsername('user name');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/only contain letters/);
  });

  it('should accept valid usernames', () => {
    const result = validateUsername('valid_user.123');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'A'.repeat(1025) + '1a!';
    const result = validatePassword(longPassword);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/1024 characters or fewer/);
  });
});
