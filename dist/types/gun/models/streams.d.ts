import type { IGunChain } from "gun";
import GunNode from "./gun-node";
import type { GunNodeClassSimple } from "../gun_plus";
export type ValidGunChunk = {
    key: string;
    value: any;
    chain: IGunChain<any>;
};
export type NullGunChunk = {
    key: string;
    value: null;
    chain: null;
};
export type ValidGunNodeChunk<T extends GunNode> = {
    key: string;
    value: any;
    node: T;
};
export type NullGunNodeChunk = {
    key: string;
    value: any;
    node: null;
};
declare global {
    interface ReadableStream<R> {
        [Symbol.asyncIterator](): AsyncIterableIterator<R>;
    }
}
/**
 *
 * Wraps .on call in a stream. Cancelling the stream will unsubscribe from updates from gun.
 *
 * **Usage:**
 * ```
 * const stream = on_stream(node)
 * for await (const chunk of stream) {
 *    // Do something with each 'chunk'
 * }
 * ```
 */
export declare function on_stream(chain: IGunChain<any>): ReadableStream<ValidGunChunk | NullGunChunk>;
/**
 *
 * Takes an incoming stream, but only issues updates if the data changes from valid data to null data.
 * You can use this to keep a list in sync with the gun state. If data is tombstoned, it can be removed from the list.
 *
 * **Example:**
 * ```
 * const map = new Map();
 * const items = [];
 * const stream = on_stream(node).pipeThrough(unique_transformer());
 * for await (const chunk of stream) {
 *      chunk.value === null ? map.delete(chunk.key) : map.set(chunk.key, chunk.chain);
        items.splice(0, items.length, ...map.values());
 * }
 * ```
 */
export declare function to_unique(): TransformStream<ValidGunChunk | NullGunChunk, ValidGunChunk | NullGunChunk>;
/**
 * Transoforms a stream of gun chains into a stream of gun nodes.
 */
export declare function to_node<T extends GunNode = GunNode>(target: GunNodeClassSimple<T>): TransformStream<ValidGunChunk | NullGunChunk, ValidGunNodeChunk<T> | NullGunNodeChunk>;
