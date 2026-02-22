/**
 * Performs a deep equality check between two values.
 * Optimized for JSON-compatible data structures (primitives, arrays, objects).
 * Significantly faster than `JSON.stringify(a) === JSON.stringify(b)`.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal, false otherwise
 */
export function deepEqual(a: any, b: any): boolean {
  // Same reference or primitive value
  if (a === b) return true;

  // If either is null or not an object, they are not equal (since a !== b)
  if (
    a === null ||
    typeof a !== 'object' ||
    b === null ||
    typeof b !== 'object'
  ) {
    return false;
  }

  // If constructors are different, they are not equal
  if (a.constructor !== b.constructor) return false;

  // Handle Arrays
  if (Array.isArray(a)) {
    const len = a.length;
    if (len !== b.length) return false;
    for (let i = 0; i < len; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle Objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
