import { Observable } from "rxjs";
import { GunInstance, GunUserInstance } from "./types";
/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
export declare class RxJS {
    private readonly gun;
    private readonly user;
    /**
     * Initialize GunRxJS with a GunDB instance
     * @param gun - GunDB instance
     */
    constructor(gun: GunInstance);
    /**
     * Get the current user
     * @returns The current user
     */
    getUser(): GunUserInstance;
    /**
     * Get the current user's public key
     * @returns The current user's public key
     */
    getUserPub(): string | undefined;
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    observe<T>(path: string | any): Observable<T>;
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match<T>(path: string | any, matchFn?: (data: any) => boolean): Observable<T[]>;
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    put<T>(path: string | any, data?: T): Observable<T>;
    /**
     * Backward-compatible overload that accepts optional callback like tests expect
     */
    putCompat<T extends Partial<any> & Record<string, any>>(data: T, callback?: (ack: any) => void): Observable<T>;
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    set<T>(path: string | any, data?: T): Observable<T>;
    setCompat<T>(data: T, callback?: (ack: any) => void): Observable<T>;
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once<T>(path?: string | any): Observable<T>;
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute<T, R>(sources: Array<string | Observable<any>>, computeFn: (...values: T[]) => R): Observable<R>;
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    userPut<T extends Partial<any> & Record<string, any>>(dataOrPath: string | T, maybeData?: T, callback?: (ack: any) => void): Observable<T>;
    /**
     * User set data and return an Observable (for authenticated users)
     * @param dataOrPath - Data to set or path where to set the data
     * @param maybeData - Data to set (if first parameter is path)
     * @param callback - Optional callback function
     * @returns Observable that completes when the set is acknowledged
     */
    userSet<T extends Partial<any> & Record<string, any>>(dataOrPath: string | T, maybeData?: T, callback?: (ack: any) => void): Observable<T>;
    /**
     * User once data and return an Observable (for authenticated users)
     * @param path - Optional path to get data from
     * @param callback - Optional callback function
     * @returns Observable that emits the data once
     */
    userOnce<T>(path?: string, callback?: (ack: any) => void): Observable<T>;
    /**
     * Get user data
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    userGet<T>(path: string): Observable<T>;
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser<T>(path?: string): Observable<T>;
    /**
     * Remove Gun metadata from an object
     * @param obj - Object to clean
     * @returns Cleaned object without Gun metadata
     */
    private removeGunMeta;
}
