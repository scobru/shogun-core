/**
 * Generic utility functions
 */
import { IGunChainReference } from "../types/gun";
/**
 * Checks if an object is a Gun instance
 */
export declare const isGunInstance: (gun: any) => gun is IGunChainReference;
/**
 * Checks if the application is running in a web environment
 */
export declare const isPlatformWeb: () => boolean;
/**
 * Creates a timeout that resolves with a passthrough value
 */
export declare function delay<T = any>(ms: number, passthrough?: T): Promise<T>;
/**
 * Creates a timeout that rejects with an error
 */
export declare function errorAfter<T = void>(ms: number, error: Error): Promise<T>;
