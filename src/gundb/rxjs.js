"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RxJS = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
var RxJS = /** @class */ (function () {
    /**
     * Initialize GunRxJS with a GunDB instance
     * @param gun - GunDB instance
     */
    function RxJS(gun) {
        this.gun = gun;
        this.user = gun.user();
    }
    /**
     * Get the current user
     * @returns The current user
     */
    RxJS.prototype.getUser = function () {
        return this.user;
    };
    /**
     * Get the current user's public key
     * @returns The current user's public key
     */
    RxJS.prototype.getUserPub = function () {
        var _a;
        return (_a = this.user.is) === null || _a === void 0 ? void 0 : _a.pub;
    };
    /**
     * Observe a Gun node for changes
     * @param path - Path to observe (can be a string or a Gun chain)
     * @returns Observable that emits whenever the node changes
     */
    RxJS.prototype.observe = function (path) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var node;
            if (Array.isArray(path)) {
                // Support array paths by chaining get calls
                node = _this.gun.get(path[0]);
                for (var i = 1; i < path.length; i++) {
                    node = node.get(path[i]);
                }
            }
            else if (typeof path === "string") {
                node = _this.gun.get(path);
            }
            else {
                node = path;
            }
            // Subscribe to changes
            var unsub = node.on(function (data, key) {
                if (data === null || data === undefined) {
                    subscriber.next(null);
                    return;
                }
                // Remove Gun metadata before emitting
                if (typeof data === "object" && data !== null) {
                    var cleanData = _this.removeGunMeta(data);
                    subscriber.next(cleanData);
                }
                else {
                    subscriber.next(data);
                }
            });
            // Return teardown logic
            return function () {
                if (unsub && typeof unsub === "function") {
                    unsub();
                }
                node.off();
            };
        }).pipe((0, operators_1.distinctUntilChanged)(function (prev, curr) {
            return JSON.stringify(prev) === JSON.stringify(curr);
        }));
    };
    /**
     * Match data based on Gun's '.map()' and convert to Observable
     * @param path - Path to the collection
     * @param matchFn - Optional function to filter results
     * @returns Observable array of matched items
     */
    RxJS.prototype.match = function (path, matchFn) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            if (!path) {
                subscriber.next([]);
                subscriber.complete();
                return;
            }
            var node = typeof path === "string" ? _this.gun.get(path) : path;
            var results = {};
            var unsub = node.map().on(function (data, key) {
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
                var cleanData = typeof data === "object" ? _this.removeGunMeta(data) : data;
                results[key] = cleanData;
                subscriber.next(Object.values(results));
            });
            // Return teardown logic
            return function () {
                if (unsub && typeof unsub === "function") {
                    unsub();
                }
                node.off();
            };
        });
    };
    /**
     * Put data and return an Observable
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    RxJS.prototype.put = function (path, data) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var performPut = function (target, value) {
                target.put(value, function (ack) {
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(value);
                        subscriber.complete();
                    }
                });
            };
            if (typeof path === "string" || Array.isArray(path)) {
                // Path-based put
                var node = void 0;
                if (Array.isArray(path)) {
                    node = _this.gun.get(path[0]);
                    for (var i = 1; i < path.length; i++)
                        node = node.get(path[i]);
                }
                else {
                    node = _this.gun.get(path);
                }
                performPut(node, data);
            }
            else {
                // Root-level put
                performPut(_this.gun, path);
            }
        });
    };
    /**
     * Backward-compatible overload that accepts optional callback like tests expect
     */
    RxJS.prototype.putCompat = function (data, callback) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            _this.gun.put(data, function (ack) {
                if (callback)
                    callback(ack);
                if (ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    };
    /**
     * Set data on a node and return an Observable
     * @param path - Path to the collection
     * @param data - Data to set
     * @returns Observable that completes when the set is acknowledged
     */
    RxJS.prototype.set = function (path, data) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var performSet = function (target, value) {
                target.set(value, function (ack) {
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(value);
                        subscriber.complete();
                    }
                });
            };
            if (typeof path === "string" || Array.isArray(path)) {
                var node = void 0;
                if (Array.isArray(path)) {
                    node = _this.gun.get(path[0]);
                    for (var i = 1; i < path.length; i++)
                        node = node.get(path[i]);
                }
                else {
                    node = _this.gun.get(path);
                }
                performSet(node, data);
            }
            else {
                performSet(_this.gun, path);
            }
        });
    };
    RxJS.prototype.setCompat = function (data, callback) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            _this.gun.set(data, function (ack) {
                if (callback)
                    callback(ack);
                if (ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    };
    /**
     * Get data once and return as Observable
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    RxJS.prototype.once = function (path) {
        var _this = this;
        var node;
        if (typeof path === "string") {
            node = this.gun.get(path);
        }
        else if (path) {
            node = path;
        }
        else {
            node = this.gun;
        }
        return new rxjs_1.Observable(function (subscriber) {
            node.once(function (data) {
                if (data === undefined || data === null) {
                    subscriber.next(null);
                    subscriber.complete();
                    return;
                }
                var cleanData = typeof data === "object" ? _this.removeGunMeta(data) : data;
                subscriber.next(cleanData);
                subscriber.complete();
            });
        });
    };
    /**
     * Compute derived values from gun data
     * @param sources - Array of paths or observables to compute from
     * @param computeFn - Function that computes a new value from the sources
     * @returns Observable of computed values
     */
    RxJS.prototype.compute = function (sources, computeFn) {
        var _this = this;
        // Convert all sources to observables
        var observables = sources.map(function (source) {
            if (typeof source === "string") {
                return _this.observe(source);
            }
            return source;
        });
        // Combine the latest values from all sources
        return new rxjs_1.Observable(function (subscriber) {
            var values = new Array(sources.length).fill(undefined);
            var completed = new Array(sources.length).fill(false);
            var subscriptions = observables.map(function (obs, index) {
                return obs.subscribe({
                    next: function (value) {
                        values[index] = value;
                        // Only compute if we have all values
                        if (values.every(function (v) { return v !== undefined; })) {
                            try {
                                var result = computeFn.apply(void 0, values);
                                subscriber.next(result);
                            }
                            catch (error) {
                                subscriber.error(error);
                            }
                        }
                    },
                    error: function (err) { return subscriber.error(err); },
                    complete: function () {
                        completed[index] = true;
                        if (completed.every(function (c) { return c; })) {
                            subscriber.complete();
                        }
                    },
                });
            });
            // Return teardown logic
            return function () {
                subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
            };
        });
    };
    /**
     * User put data and return an Observable (for authenticated users)
     * @param path - Path where to put the data
     * @param data - Data to put
     * @returns Observable that completes when the put is acknowledged
     */
    RxJS.prototype.userPut = function (dataOrPath, maybeData, callback) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var user = _this.gun.user();
            if (typeof dataOrPath === "string") {
                user.get(dataOrPath).put(maybeData, function (ack) {
                    if (callback)
                        callback(ack);
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(maybeData);
                        subscriber.complete();
                    }
                });
            }
            else {
                user.put(dataOrPath, function (ack) {
                    if (callback)
                        callback(ack);
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(dataOrPath);
                        subscriber.complete();
                    }
                });
            }
        });
    };
    /**
     * User set data and return an Observable (for authenticated users)
     * @param dataOrPath - Data to set or path where to set the data
     * @param maybeData - Data to set (if first parameter is path)
     * @param callback - Optional callback function
     * @returns Observable that completes when the set is acknowledged
     */
    RxJS.prototype.userSet = function (dataOrPath, maybeData, callback) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var user = _this.gun.user();
            if (typeof dataOrPath === "string") {
                user.get(dataOrPath).set(maybeData, function (ack) {
                    if (callback)
                        callback(ack);
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(maybeData);
                        subscriber.complete();
                    }
                });
            }
            else {
                user.set(dataOrPath, function (ack) {
                    if (callback)
                        callback(ack);
                    if (ack.err) {
                        subscriber.error(new Error(ack.err));
                    }
                    else {
                        subscriber.next(dataOrPath);
                        subscriber.complete();
                    }
                });
            }
        });
    };
    /**
     * User once data and return an Observable (for authenticated users)
     * @param path - Optional path to get data from
     * @param callback - Optional callback function
     * @returns Observable that emits the data once
     */
    RxJS.prototype.userOnce = function (path, callback) {
        var _this = this;
        return new rxjs_1.Observable(function (subscriber) {
            var user = _this.gun.user();
            var target = path ? user.get(path) : user;
            target.once(function (data, ack) {
                if (callback)
                    callback(ack);
                if (ack && ack.err) {
                    subscriber.error(new Error(ack.err));
                }
                else {
                    subscriber.next(data);
                    subscriber.complete();
                }
            });
        });
    };
    /**
     * Get user data
     * @param path - Path to get data from
     * @returns Observable that emits the data once
     */
    RxJS.prototype.userGet = function (path) {
        return this.observe(this.gun.user().get(path));
    };
    /**
     * Observe user data
     * @param path - Path to observe in user space
     * @returns Observable that emits whenever the user data changes
     */
    RxJS.prototype.observeUser = function (path) {
        if (path) {
            return this.observe(this.gun.user().get(path));
        }
        return this.observe(this.gun.user().get("~"));
    };
    /**
     * Remove Gun metadata from an object
     * @param obj - Object to clean
     * @returns Cleaned object without Gun metadata
     */
    RxJS.prototype.removeGunMeta = function (obj) {
        var _this = this;
        if (!obj || typeof obj !== "object")
            return obj;
        // Create a clean copy
        var cleanObj = Array.isArray(obj) ? [] : {};
        // Copy properties, skipping Gun metadata
        Object.keys(obj).forEach(function (key) {
            // Skip Gun metadata
            if (key === "_" || key === "#")
                return;
            var val = obj[key];
            if (val && typeof val === "object") {
                cleanObj[key] = _this.removeGunMeta(val);
            }
            else {
                cleanObj[key] = val;
            }
        });
        return cleanObj;
    };
    return RxJS;
}());
exports.RxJS = RxJS;
