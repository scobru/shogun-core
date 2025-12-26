"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RxJSHolster = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * RxJS Integration for Holster
 * Provides reactive programming capabilities for Holster data
 */
class RxJSHolster {
    /**
     * Initialize RxJSHolster with a Holster instance
     * @param holster - Holster instance
     */
    constructor(holsterInstance) {
        this.holster = holsterInstance;
        this.user = holsterInstance.user();
    }
    /**
     * Get the current user
     * @returns The current user
     */
    getUser() {
        return this.user;
    }
    /**
     * Get the current user's public key
     * @returns The current user's public key
     */
    getUserPub() {
        return this.user.is?.pub;
    }
    /**
     * Observe a Holster node for changes
     * Uses Holster's .get().next() API instead of chained .get()
     * @param path - Path to observe (can be a string, array, or a Holster chain)
     * @returns Observable that emits whenever the node changes
     */
    observe(path) {
        return new rxjs_1.Observable((subscriber) => {
            let node;
            if (Array.isArray(path)) {
                // Support array paths by chaining next calls
                node = this.holster.get(path[0]);
                for (let i = 1; i < path.length; i++) {
                    node = node.next(path[i]);
                }
            }
            else if (typeof path === 'string') {
                node = this.holster.get(path);
            }
            else {
                node = path;
            }
            // Subscribe to changes using Holster's .on()
            const unsub = node.on((data) => {
                if (data === null || data === undefined) {
                    subscriber.next(null);
                    return;
                }
                // Remove Holster metadata before emitting
                if (typeof data === 'object' && data !== null) {
                    const cleanData = this.removeHolsterMeta(data);
                    subscriber.next(cleanData);
                }
                else {
                    subscriber.next(data);
                }
            });
            // Return teardown logic
            return () => {
                if (unsub && typeof unsub === 'function') {
                    unsub();
                }
                else {
                    node.off();
                }
            };
        }).pipe((0, operators_1.distinctUntilChanged)((prev, curr) => {
            return JSON.stringify(prev) === JSON.stringify(curr);
        }));
    }
    /**
     * Match data based on Holster collections and convert to Observable
     * Note: Holster doesn't have .map(), so we implement it using .on()
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match(path, matchFn) {
        return new rxjs_1.Observable((subscriber) => {
            if (!path) {
                subscriber.next([]);
                subscriber.complete();
                return;
            }
            const node = typeof path === 'string' ? this.holster.get(path) : path;
            const results = {};
            // Holster doesn't have .map(), so we use .on() and track keys manually
            const unsub = node.on((data, key) => {
                // Skip internal keys
                if (key === '_' || !data)
                    return;
                const itemKey = key || String(Object.keys(results).length);
                if (matchFn && !matchFn(data)) {
                    // If matchFn is provided and returns false, remove item
                    if (results[itemKey]) {
                        delete results[itemKey];
                        subscriber.next(Object.values(results));
                    }
                    return;
                }
                const cleanData = typeof data === 'object' ? this.removeHolsterMeta(data) : data;
                results[itemKey] = cleanData;
                subscriber.next(Object.values(results));
            });
            // Return teardown logic
            return () => {
                if (unsub && typeof unsub === 'function') {
                    unsub();
                }
                else {
                    node.off();
                }
            };
        });
    }
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    put(path, data) {
        return new rxjs_1.Observable((subscriber) => {
            const performPut = (target, value) => {
                target.put(value, (ack) => {
                    if (ack && ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(value);
                        subscriber.complete();
                    }
                });
            };
            if (typeof path === 'string' || Array.isArray(path)) {
                // Path-based put
                let node;
                if (Array.isArray(path)) {
                    node = this.holster.get(path[0]);
                    for (let i = 1; i < path.length; i++) {
                        node = node.next(path[i]);
                    }
                }
                else {
                    node = this.holster.get(path);
                }
                performPut(node, data);
            }
            else {
                // Root-level put
                performPut(this.holster, path);
            }
        });
    }
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once(path) {
        let node;
        if (typeof path === 'string') {
            node = this.holster.get(path);
        }
        else if (path) {
            node = path;
        }
        else {
            node = this.holster;
        }
        return new rxjs_1.Observable((subscriber) => {
            let called = false;
            const wrappedCallback = (data) => {
                if (!called) {
                    called = true;
                    if (data === undefined || data === null) {
                        subscriber.next(null);
                        subscriber.complete();
                        return;
                    }
                    const cleanData = typeof data === 'object' ? this.removeHolsterMeta(data) : data;
                    subscriber.next(cleanData);
                    subscriber.complete();
                }
            };
            node.on(wrappedCallback);
            // Auto-unsubscribe after first call
            setTimeout(() => {
                node.off(wrappedCallback);
            }, 0);
        });
    }
    /**
     * Compute derived values from holster data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute(sources, computeFn) {
        // Convert all sources to observables
        const observables = sources.map((source) => {
            if (typeof source === 'string') {
                return this.observe(source);
            }
            return source;
        });
        // Combine the latest values from all sources
        return new rxjs_1.Observable((subscriber) => {
            let values = new Array(sources.length).fill(undefined);
            let completed = new Array(sources.length).fill(false);
            const subscriptions = observables.map((obs, index) => {
                return obs.subscribe({
                    next: (value) => {
                        values[index] = value;
                        // Only compute if we have all values
                        if (values.every((v) => v !== undefined)) {
                            try {
                                const result = computeFn(...values);
                                subscriber.next(result);
                            }
                            catch (error) {
                                subscriber.error(error);
                            }
                        }
                    },
                    error: (err) => subscriber.error(err),
                    complete: () => {
                        completed[index] = true;
                        if (completed.every((c) => c)) {
                            subscriber.complete();
                        }
                    },
                });
            });
            // Return teardown logic
            return () => {
                subscriptions.forEach((sub) => sub.unsubscribe());
            };
        });
    }
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    userPut(dataOrPath, maybeData, callback) {
        return new rxjs_1.Observable((subscriber) => {
            const user = this.holster.user();
            if (typeof dataOrPath === 'string') {
                user.get(dataOrPath).put(maybeData, (ack) => {
                    if (callback)
                        callback(ack);
                    if (ack && ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(maybeData);
                        subscriber.complete();
                    }
                });
            }
            else {
                user.put(dataOrPath, (ack) => {
                    if (callback)
                        callback(ack);
                    if (ack && ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(dataOrPath);
                        subscriber.complete();
                    }
                });
            }
        });
    }
    /**
     * Get user data
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    userGet(path) {
        return this.observe(this.holster.user().get(path));
    }
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser(path) {
        const user = this.holster.user();
        if (path) {
            return this.observe(user.get(path));
        }
        return this.observe(user.get('~'));
    }
    /**
     * Remove Holster-specific metadata from data objects
     * @param obj - Object to clean
     * @returns Cleaned object without Holster metadata
     */
    removeHolsterMeta(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        // Create a clean copy
        const cleanObj = Array.isArray(obj) ? [] : {};
        // Copy properties, skipping Holster metadata
        Object.keys(obj).forEach((key) => {
            // Skip Holster metadata
            if (key === '_' || key.startsWith('~'))
                return;
            const val = obj[key];
            if (val && typeof val === 'object') {
                cleanObj[key] = this.removeHolsterMeta(val);
            }
            else {
                cleanObj[key] = val;
            }
        });
        return cleanObj;
    }
}
exports.RxJSHolster = RxJSHolster;
