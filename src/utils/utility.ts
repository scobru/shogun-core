/**
 * Checks if the application is running in a web environment
 */
export const isPlatformWeb = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Delays execution for the specified time
 * @param ms - Milliseconds to delay
 * @param passthrough - Optional value to pass through the promise
 * @returns Promise that resolves with the passthrough value
 */
export function delay<T>(ms: number, passthrough?: T): Promise<T> {
  return new Promise<T>((resolve) =>
    setTimeout(() => resolve(passthrough as T), ms),
  );
}

/**
 * Creates a timeout that rejects with an error
 */
export async function errorAfter<T = void>(
  ms: number,
  error: Error,
): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(error);
    }, ms);
  });
}

/**
 * Generates a random string with specified length
 * @param length - Length of the string
 * @returns Random string
 */
export function randomString(length = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  const randValues = new Uint8Array(length);
  crypto.getRandomValues(randValues);

  for (let i = 0; i < length; i++) {
    result += chars.charAt(randValues[i] % chars.length);
  }

  return result;
}
