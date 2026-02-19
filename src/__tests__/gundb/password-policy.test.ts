import { DataBase } from '../../gundb/db';
import Gun from 'gun/gun';
import 'gun/sea';

describe('Password Policy', () => {
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
  const validatePassword = (pwd: string) => {
    return (db as any).validatePasswordStrength(pwd);
  };

  it('should reject passwords that are too short', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 8 characters/);
  });

  it('should reject passwords that are too long', () => {
    const longPassword = 'A'.repeat(1025) + '1a!';
    const result = validatePassword(longPassword);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/1024 characters or fewer/);
  });

  it('should reject passwords without uppercase letters', () => {
    const result = validatePassword('password123!');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/uppercase/);
  });

  it('should reject passwords without lowercase letters', () => {
    const result = validatePassword('PASSWORD123!');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/lowercase/);
  });

  it('should reject passwords without numbers', () => {
    const result = validatePassword('Password!');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/number/);
  });

  it('should reject passwords without special characters', () => {
    const result = validatePassword('Password123');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/special character/);
  });

  it('should accept valid complex passwords', () => {
    const result = validatePassword('StrongP@ssw0rd!');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
