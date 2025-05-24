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
    // READING AND PUTTING SIMPLE VALUES
    /**
     * Put a value at this node. Will use certificate if available.
     */
    put(value) {
        const options = this.certificate
            ? { opt: { cert: this.certificate } }
            : undefined;
        return this.chain.put(value, undefined, options);
    }
    /**
     * Wrapper around gun.get. If iterates is specified, this will be used here. Carries options.
     */
    get(key) {
        return new this.iterates(this.chain.get(key), this.options);
    }
    /**
     * Use to add something to an array-like structure.
     *
     * This will very simply do `chain.get(key).put(value)` where key is generated using `GunPlus.instance.id_generator` if not specified.
     */
    add(value, key) {
        const id = key || gun_plus_1.default.instance.id_generator();
        this.chain.get(id).put(value);
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
