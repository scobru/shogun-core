import { Observable } from "rxjs";
import { IGunInstance, IGunUserInstance } from "gun";
/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
export declare class GunRxJS {
    private readonly gun;
    private readonly user;
    /**
     * Initialize GunRxJS with a GunDB instance
     * @param gun - GunDB instance
     */
    constructor(gun: IGunInstance<any>);
    /**
     * Get the current user
     * @returns The current user
     */
    getUser(): IGunUserInstance<any>;
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
    put<T>(path: string | any, data: T): Observable<T>;
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    set<T>(path: string | any, data: T): Observable<T>;
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once<T>(path: string | any): Observable<T>;
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
    userPut<T>(path: string, data: T): Observable<T>;
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
    observeUser<T>(path: string): Observable<T>;
    /**
     * Remove Gun metadata from an object
     * @param obj - Object to clean
     * @returns Cleaned object without Gun metadata
     */
    private removeGunMeta;
}
