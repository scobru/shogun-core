import { deepEqual } from '../../utils/deepEqual';

describe('deepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it('should return false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('should return true for equal objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 3 } };
    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('should return false for objects with different keys', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };
    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('should return true for equal arrays', () => {
    const arr1 = [1, { a: 2 }, [3]];
    const arr2 = [1, { a: 2 }, [3]];
    expect(deepEqual(arr1, arr2)).toBe(true);
  });

  it('should return false for different arrays', () => {
    const arr1 = [1, 2];
    const arr2 = [1, 3];
    expect(deepEqual(arr1, arr2)).toBe(false);
  });

  it('should return false for arrays of different lengths', () => {
    const arr1 = [1, 2];
    const arr2 = [1, 2, 3];
    expect(deepEqual(arr1, arr2)).toBe(false);
  });

  it('should handle complex nested structures', () => {
    const complex1 = {
      users: [
        { id: 1, profile: { name: 'Alice', active: true } },
        { id: 2, profile: { name: 'Bob', active: false } },
      ],
      settings: { theme: 'dark', notifications: { email: true } },
    };
    const complex2 = {
      users: [
        { id: 1, profile: { name: 'Alice', active: true } },
        { id: 2, profile: { name: 'Bob', active: false } },
      ],
      settings: { theme: 'dark', notifications: { email: true } },
    };
    expect(deepEqual(complex1, complex2)).toBe(true);
  });

  it('should return false if types mismatch', () => {
      expect(deepEqual({ a: 1 }, [1])).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
  });
});
