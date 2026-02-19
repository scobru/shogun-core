import { DataBase } from '../../gundb/db';
import Gun from 'gun/gun';
import 'gun/sea';

describe('Username Policy', () => {
  let db: DataBase;
  let gun: any;

  beforeAll(() => {
    gun = Gun({ radisk: false });
    db = new DataBase(gun);
  });

  afterAll(() => {
    db.destroy();
  });

  // Helper function to access private method for testing
  const validateUsername = (username: string) => {
    // validateSignupCredentials checks username first, then password strength.
    // We pass a valid password to ensure only username validation fails.
    return (db as any).validateSignupCredentials(username, 'ValidPass1!');
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
});
