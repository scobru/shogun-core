"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GunRxJS = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
class GunRxJS {
    gun;
    user;
    /**
     * Initialize GunRxJS with a GunDB instance
     * @param gun - GunDB instance
     */
    constructor(gun) {
        this.gun = gun;
        this.user = gun.user().recall({ sessionStorage: true });
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
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    observe(path) {
        return new rxjs_1.Observable((subscriber) => {
            const node = typeof path === "string" ? this.gun.get(path) : path;
            // Subscribe to changes
            const unsub = node.on((data, key) => {
                if (data === null || data === undefined) {
                    subscriber.next(null);
                    return;
                }
                // Remove Gun metadata before emitting
                if (typeof data === "object" && data !== null) {
                    const cleanData = this.removeGunMeta(data);
                    subscriber.next(cleanData);
                }
                else {
                    subscriber.next(data);
                }
            });
            // Return teardown logic
            return () => {
                if (unsub && typeof unsub === "function") {
                    unsub();
                }
                node.off();
            };
        }).pipe((0, operators_1.distinctUntilChanged)((prev, curr) => {
            return JSON.stringify(prev) === JSON.stringify(curr);
        }));
    }
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    match(path, matchFn) {
        return new rxjs_1.Observable((subscriber) => {
            const node = typeof path === "string" ? this.gun.get(path) : path;
            const results = {};
            const unsub = node.map().on((data, key) => {
                // Skip soul key which is Gun's internal reference
                if (key === "_" || !data)
                    return;
                if (matchFn && !matchFn(data)) {
                    // If matchFn is provided and returns false, remove item
                    if (results[key]) {
                        delete results[key];
                        subscriber.next(Object.values(results));
                    }
                    return;
                }
                const cleanData = typeof data === "object" ? this.removeGunMeta(data) : data;
                results[key] = cleanData;
                subscriber.next(Object.values(results));
            });
            // Return teardown logic
            return () => {
                if (unsub && typeof unsub === "function") {
                    unsub();
                }
                node.off();
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
        const node = typeof path === "string" ? this.gun.get(path) : path;
        return new rxjs_1.Observable((subscriber) => {
            node.put(data, (ack) => {
                if (ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    }
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    set(path, data) {
        const node = typeof path === "string" ? this.gun.get(path) : path;
        return new rxjs_1.Observable((subscriber) => {
            node.set(data, (ack) => {
                if (ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    }
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    once(path) {
        const node = typeof path === "string" ? this.gun.get(path) : path;
        return new rxjs_1.Observable((subscriber) => {
            node.once((data) => {
                if (data === undefined || data === null) {
                    subscriber.next(null);
                    subscriber.complete();
                    return;
                }
                const cleanData = typeof data === "object" ? this.removeGunMeta(data) : data;
                subscriber.next(cleanData);
                subscriber.complete();
            });
        });
    }
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    compute(sources, computeFn) {
        // Convert all sources to observables
        const observables = sources.map((source) => {
            if (typeof source === "string") {
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
    userPut(path, data) {
        return new rxjs_1.Observable((subscriber) => {
            this.gun
                .user()
                .get(path)
                .put(data, (ack) => {
                if (ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    }
    /**
     * Get user data
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    userGet(path) {
        return this.observe(this.gun.user().get(path));
    }
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    observeUser(path) {
        return this.observe(this.gun.user().get(path));
    }
    /**
     * Remove Gun metadata from an object
     * @param obj - Object to clean
     * @returns Cleaned object without Gun metadata
     */
    removeGunMeta(obj) {
        if (!obj || typeof obj !== "object")
            return obj;
        // Create a clean copy
        const cleanObj = Array.isArray(obj) ? [] : {};
        // Copy properties, skipping Gun metadata
        Object.keys(obj).forEach((key) => {
            // Skip Gun metadata
            if (key === "_" || key === "#")
                return;
            const val = obj[key];
            if (val && typeof val === "object") {
                cleanObj[key] = this.removeGunMeta(val);
            }
            else {
                cleanObj[key] = val;
            }
        });
        return cleanObj;
    }
}
exports.GunRxJS = GunRxJS;
