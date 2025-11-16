import { Observable } from "rxjs";
/**
 * RxJS Integration for Holster
 * Provides reactive programming capabilities for Holster data
 */
export declare class RxJSHolster {
    private readonly holster;
    private readonly user;
    /**
     * Initialize RxJSHolster with a Holster instance
     * @param holster - Holster instance
     */
    constructor(holsterInstance: any);
    /**
     * Get the current user
     * @returns The current user
     */
    getUser(): any;
    /**
     * Get the current user's public key
     * @returns The current user's public key
     */
    getUserPub(): string | undefined;
    /**
     * Observe a Holster node for changes
     * Uses Holster's .get().next() API instead of chained .get()
     * @param path - Path to observe (can be a string, array, or a Holster chain)
     * @returns Observable that emits whenever the node changes
     */
    observe<T>(path: string | any): Observable<T>;
    /**
     * Match data based on Holster collections and convert to Observable
     * Note: Holster doesn't have .map(), so we implement it using .on()
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
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once<T>(path?: string | any): Observable<T>;
    /**
     * Compute derived values from holster data
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
     * Remove Holster-specific metadata from data objects
     * @param obj - Object to clean
     * @returns Cleaned object without Holster metadata
     */
    private removeHolsterMeta;
}
