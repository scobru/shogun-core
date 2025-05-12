/**
 * Checks if the application is running in a web environment
 */
export declare const isPlatformWeb: () => boolean;
/**
 * Delays execution for the specified time
 * @param ms - Milliseconds to delay
 * @param passthrough - Optional value to pass through the promise
 * @returns Promise that resolves with the passthrough value
 */
export declare function delay<T>(ms: number, passthrough?: T): Promise<T>;
/**
 * Creates a timeout that rejects with an error
 */
export declare function errorAfter<T = void>(ms: number, error: Error): Promise<T>;
/**
 * Generates a random string with specified length
 * @param length - Length of the string
 * @returns Random string
 */
export declare function randomString(length?: number): string;
