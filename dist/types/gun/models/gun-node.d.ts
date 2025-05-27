import type { GunValueSimple, IGunChain } from "gun";
import { type GunNodeClassSimple } from "../gun_plus";
type DynamicClass<T> = T extends GunNode ? GunNode extends T ? GunNode<T> : T : never;
/**
 * A GunNode wrapping normal gun chain.
 */
export default class GunNode<T extends GunNode<any> = GunNode<any>> {
    chain: IGunChain<any>;
    private options;
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
    constructor(chain: IGunChain<any>, options?: {
        certificate?: string;
        iterates?: GunNodeClassSimple<T>;
    });
    get certificate(): string | undefined;
    set certificate(certificate: string | undefined);
    private get iterates();
    /**
     * Private helper method to get the authentication token
     * @returns The authentication token
     */
    private getAuthToken;
    /**
     * Private helper method to create options with auth
     * @param withCert Whether to include certificate
     * @returns Options object with auth
     */
    private createOptionsWithAuth;
    /**
     * Put a value at this node. Will use certificate if available.
     */
    put(value: GunValueSimple | IGunChain<any>): IGunChain<any, any, any, any>;
    /**
     * Wrapper around gun.get. If iterates is specified, this will be used here. Carries options.
     */
    get(key: string): DynamicClass<T>;
    /**
     * Use to add something to an array-like structure.
     *
     * This will very simply do `chain.get(key).put(value)` where key is generated using `GunPlus.instance.id_generator` if not specified.
     */
    add(value: GunValueSimple | IGunChain<any>, key?: string): void;
    /**
     * **Example:**
     *
     * ```
     * const unsubscribe = node.watch("").subscribe(({value, key, chain}) => {
     *      console.log({value, key, chain});
     * })
     * ```
     */
    watch<T2>(initial: T2): {
        subscribe: (cb: (response: {
            value: T2 | null;
            key: string;
            chain: null | IGunChain<any>;
        }) => any) => () => void;
    };
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
    bind<T2 extends GunValueSimple>(intial: T2): {
        subscribe: (cb: (new_value: T2 | null) => any) => () => void;
        set: (new_value: T2) => void;
        update: (cb: (new_value: T2 | null) => T2) => void;
    };
    /**
     * Wrapps guns map and iterates GunNodes of the correc type.
     */
    map(): DynamicClass<T>;
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
    stream(): ReadableStream<import("./streams").NullGunNodeChunk | import("./streams").ValidGunNodeChunk<T>>;
}
export {};
