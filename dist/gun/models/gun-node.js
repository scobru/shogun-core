"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gun_plus_1 = __importDefault(require("../gun_plus"));
const streams_1 = require("./streams");
/**
 * A GunNode wrapping normal gun chain.
 */
class GunNode {
    chain;
    options;
    /**
     * Using .map on the GunNode will correctly map to specified node in type argument.
     *
     * **Usage**
     * ```js
     *  const a = new GunNode<UserNode>(GunPlus.instance.node, {iterates: UserNode});
     *  const b = new GunNode(GunPlus.instance.node, {});
     *
     *  a.map().hello; // hello from UserNode.
     *  b.map().hello // not availble on normal GunNode so will not work.
     * ```
     */
    constructor(chain, options = {}) {
        this.chain = chain;
        this.options = options;
    }
    get certificate() {
        return this.options.certificate;
    }
    set certificate(certificate) {
        this.options.certificate = certificate;
    }
    get iterates() {
        return this.options.iterates ?? (GunNode);
    }
    /**
     * Private helper method to get the authentication token
     * @returns The authentication token
     */
    getAuthToken() {
        // Default fallback token
        const defaultToken = "automa25";
        try {
            // Try to get the authentication token from GunPlus instance
            if (gun_plus_1.default.instance && gun_plus_1.default.instance.gun && gun_plus_1.default.instance.gun._) {
                // Try to get from gun instance's internal state
                const gunInternalState = gun_plus_1.default.instance.gun._;
                if (gunInternalState.opt && gunInternalState.opt.headers) {
                    const headerToken = gunInternalState.opt.headers.token;
                    if (headerToken)
                        return headerToken;
                }
            }
        }
        catch (e) {
            console.warn("Error getting auth token:", e);
        }
        return defaultToken;
    }
    /**
     * Private helper method to create options with auth
     * @param withCert Whether to include certificate
     * @returns Options object with auth
     */
    createOptionsWithAuth(withCert = true) {
        // Create options object with certificate if available
        const options = withCert && this.certificate
            ? { opt: { cert: this.certificate } }
            : { opt: {} };
        // Add authentication token
        try {
            const authToken = this.getAuthToken();
            // Add to headers
            if (!options.opt.headers) {
                options.opt.headers = {};
            }
            options.opt.headers.token = authToken;
            options.opt.headers.Authorization = `Bearer ${authToken}`;
            // Also add token at top level for different Gun versions
            options.token = authToken;
        }
        catch (e) {
            console.warn("Failed to add auth token to Gun options:", e);
        }
        return options;
    }
    // READING AND PUTTING SIMPLE VALUES
    /**
     * Put a value at this node. Will use certificate if available.
     */
    put(value) {
        const options = this.createOptionsWithAuth();
        return this.chain.put(value, undefined, options);
    }
    /**
     * Wrapper around gun.get. If iterates is specified, this will be used here. Carries options.
     */
    get(key) {
        // Add authentication token to internal chain if possible
        try {
            const authToken = this.getAuthToken();
            // Try to set options if possible using internal Gun methods
            if (this.chain && this.chain._) {
                const chainInternal = this.chain._;
                if (!chainInternal.opt)
                    chainInternal.opt = {};
                if (!chainInternal.opt.headers)
                    chainInternal.opt.headers = {};
                chainInternal.opt.headers.token = authToken;
                chainInternal.opt.headers.Authorization = `Bearer ${authToken}`;
            }
        }
        catch (e) {
            console.warn("Failed to add auth token to Gun get options:", e);
        }
        return new this.iterates(this.chain.get(key), this.options);
    }
    /**
     * Use to add something to an array-like structure.
     *
     * This will very simply do `chain.get(key).put(value)` where key is generated using `GunPlus.instance.id_generator` if not specified.
     */
    add(value, key) {
        const id = key || gun_plus_1.default.instance.id_generator();
        const options = this.createOptionsWithAuth();
        this.chain.get(id).put(value, undefined, options);
    }
    /**
     * **Example:**
     *
     * ```
     * const unsubscribe = node.watch("").subscribe(({value, key, chain}) => {
     *      console.log({value, key, chain});
     * })
     * ```
     */
    watch(initial) {
        const subscribe = (cb) => {
            const stream = (0, streams_1.on_stream)(this.chain);
            cb({ value: initial, key: "", chain: null });
            (async () => {
                for await (const chunk of stream) {
                    cb(chunk);
                }
            })();
            return () => {
                // return unsubscriber
                stream.cancel();
            };
        };
        return { subscribe };
    }
    /**
     * Two way data-binding for gun.
     * This will return only value in the subscribe callback.
     * If you need more advanced functionality you need to use a combination of `node.watch` and `node.put`.
     *
     * @example
     * const store = node.bind("");
     * store.set("hello");
     * store.subscribe(value => console.log(value));
     */
    bind(intial) {
        const store = this.watch(intial);
        let value = intial;
        const subscribe = (cb) => {
            const unsubscriber = store.subscribe((response) => {
                value = response.value;
                cb(response.value);
            });
            return unsubscriber;
        };
        const set = (new_value) => {
            value = new_value;
            this.put(value);
        };
        const update = (cb) => {
            value = cb(value);
            this.put(value);
        };
        return { subscribe, set, update };
    }
    // ITERATION LOGIC
    /**
     * Wrapps guns map and iterates GunNodes of the correc type.
     */
    map() {
        return new this.iterates(this.chain.map(), this.options);
    }
    /**
     * Get a readable stream for the data at this code.
     * Data is updated if it becomes null.
     *
     * **Usage:**
     * ```js
     * for await (const chunk of node.stream()) {
     *      chunk.value === null ? map.delete(chunk.key) : map.set(chunk.key, chunk.chain);
     *      items.splice(0, items.length, ...map.values());
     * }
     * ```
     */
    stream() {
        const stream = (0, streams_1.on_stream)(this.map().chain)
            .pipeThrough((0, streams_1.to_unique)())
            .pipeThrough((0, streams_1.to_node)(this.iterates));
        return stream;
    }
}
exports.default = GunNode;
