/**
 * Generic utility functions
 */
import { IGunChainReference } from "../types/gun";

/**
 * Checks if an object is a Gun instance
 */
export const isGunInstance = (gun: any): gun is IGunChainReference => {
  return !!gun?.user && !!gun?.constructor?.SEA;
};

/**
 * Checks if the application is running in a web environment
 */
export const isPlatformWeb = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Creates a timeout that resolves with a passthrough value
 */
export function delay<T = any>(ms: number, passthrough?: T): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(passthrough as T);
    }, ms);
  });
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
