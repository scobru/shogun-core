/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 * This is a faster alternative to JSON.stringify(a) === JSON.stringify(b) for reactive streams.
 *
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns True if the values are equivalent, false otherwise
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (a instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }

    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // Handle NaN
  return Number.isNaN(a) && Number.isNaN(b);
}
