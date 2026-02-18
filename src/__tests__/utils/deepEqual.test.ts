import { deepEqual } from '../../utils/deepEqual';

describe('deepEqual', () => {
  describe('primitives', () => {
    it('should handle numbers', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual(0, 0)).toBe(true);
      expect(deepEqual(-1, -1)).toBe(true);
      expect(deepEqual(1.5, 1.5)).toBe(true);
    });

    it('should handle strings', () => {
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual('a', 'b')).toBe(false);
      expect(deepEqual('', '')).toBe(true);
    });

    it('should handle booleans', () => {
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
      expect(deepEqual(true, false)).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
      expect(deepEqual(undefined, null)).toBe(false);
    });

    it('should handle NaN', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
      expect(deepEqual(NaN, 1)).toBe(false);
      expect(deepEqual(1, NaN)).toBe(false);
    });
  });

  describe('objects', () => {
    it('should handle empty objects', () => {
      expect(deepEqual({}, {})).toBe(true);
    });

    it('should handle simple objects', () => {
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle nested objects', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('should handle object with different key order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });
  });

  describe('arrays', () => {
    it('should handle empty arrays', () => {
      expect(deepEqual([], [])).toBe(true);
    });

    it('should handle simple arrays', () => {
      expect(deepEqual([1, 2], [1, 2])).toBe(true);
      expect(deepEqual([1, 2], [1, 3])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should handle arrays of objects', () => {
      expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
      expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    });
  });

  describe('dates', () => {
    it('should handle dates', () => {
      const d1 = new Date('2023-01-01');
      const d2 = new Date('2023-01-01');
      const d3 = new Date('2023-01-02');
      expect(deepEqual(d1, d2)).toBe(true);
      expect(deepEqual(d1, d3)).toBe(false);
    });
  });

  describe('mixed types', () => {
    it('should return false for different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual([], {})).toBe(false);
      expect(deepEqual(new Date(), {})).toBe(false);
    });
  });
});
