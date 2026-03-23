/**
 * Performs a deep equality check between two values.
 * Optimized for JSON-compatible data structures (primitives, arrays, objects).
 * Significantly faster than `JSON.stringify(a) === JSON.stringify(b)`.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal, false otherwise
 */
export declare function deepEqual(a: any, b: any): boolean;
