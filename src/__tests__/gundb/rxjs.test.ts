import { RxJS } from '../../gundb/rxjs';
import { Gun } from 'gun';

// Mock Gun instance for RxJS constructor
const mockGun = {
  user: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnThis(),
    put: jest.fn(),
    once: jest.fn(),
  }),
  get: jest.fn().mockReturnThis(),
  on: jest.fn(),
  off: jest.fn(),
} as any;

describe('RxJS removeGunMeta', () => {
  let rx: RxJS;
  let removeGunMeta: (obj: any) => any;

  beforeEach(() => {
    rx = new RxJS(mockGun);
    // Access private method for testing
    removeGunMeta = (rx as any).removeGunMeta.bind(rx);
  });

  it('should remove Gun metadata (_) from object', () => {
    const input = {
      foo: 'bar',
      _: { '#': 'soul' },
    };
    const expected = {
      foo: 'bar',
    };
    expect(removeGunMeta(input)).toEqual(expected);
  });

  it('should remove Gun metadata (#) from object', () => {
    const input = {
      foo: 'bar',
      '#': 'soul',
    };
    const expected = {
      foo: 'bar',
    };
    expect(removeGunMeta(input)).toEqual(expected);
  });

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: 'Alice',
        _: { '#': 'user_soul' },
      },
      _: { '#': 'root_soul' },
    };
    const expected = {
      user: {
        name: 'Alice',
      },
    };
    expect(removeGunMeta(input)).toEqual(expected);
  });

  it('should handle arrays', () => {
    const input = [
      { id: 1, _: { '#': 'item1' } },
      { id: 2, _: { '#': 'item2' } },
    ];
    const expected = [
      { id: 1 },
      { id: 2 },
    ];
    expect(removeGunMeta(input)).toEqual(expected);
  });

  it('should handle mixed arrays and objects', () => {
    const input = {
      items: [
        { id: 1, _: { '#': 'soul1' } },
        { id: 2, _: { '#': 'soul2' } },
      ],
      _: { '#': 'root_soul' },
    };
    const expected = {
      items: [
        { id: 1 },
        { id: 2 },
      ],
    };
    expect(removeGunMeta(input)).toEqual(expected);
  });

  it('should not mutate original object', () => {
    const input = {
      foo: 'bar',
      _: { '#': 'soul' },
    };
    const copy = JSON.parse(JSON.stringify(input));
    removeGunMeta(input);
    expect(input).toEqual(copy);
  });

  it('should return null/undefined as is', () => {
    expect(removeGunMeta(null)).toBeNull();
    expect(removeGunMeta(undefined)).toBeUndefined();
  });

  it('should return primitives as is', () => {
    expect(removeGunMeta(123)).toBe(123);
    expect(removeGunMeta('string')).toBe('string');
    expect(removeGunMeta(true)).toBe(true);
  });

  it('should handle empty objects and arrays', () => {
    expect(removeGunMeta({})).toEqual({});
    expect(removeGunMeta([])).toEqual([]);
  });
});
