"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.on_stream = on_stream;
exports.to_unique = to_unique;
exports.to_node = to_node;
/**
 *
 * Only Firefox implements async iterable on ReadableStream. This will add polyfill.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
 */
(function enable_async_iterator_polyfill() {
    ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
        const reader = this.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    return;
                yield value;
            }
        }
        finally {
            reader.releaseLock();
        }
    };
})();
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
function on_stream(chain) {
    let ev;
    const stream = new ReadableStream({
        start(controller) {
            console.log("stream started");
            chain.on(function (value, key, _, event) {
                ev = event;
                console.log(`from stream, ${key}`);
                controller.enqueue({ value, key, chain: this });
            });
        },
        cancel() {
            console.log("stream cancelled");
            if (!ev) {
                // TODO log
                return;
            }
            ev.off();
        },
    });
    return stream;
}
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
function to_unique() {
    const map = new Map();
    const transformer = new TransformStream({
        transform(chuck, controller) {
            if (!map.has(chuck.key)) {
                pass(controller, chuck);
                return;
            }
            const old_value = map.get(chuck.key);
            if (chuck.value === null && old_value !== null) {
                pass(controller, chuck);
                return;
            }
            if (chuck.value !== null && old_value === null) {
                pass(controller, chuck);
                return;
            }
            function pass(controller, chuck) {
                map.set(chuck.key, chuck.chain);
                controller.enqueue(chuck);
            }
        },
    });
    return transformer;
}
/**
 * Transoforms a stream of gun chains into a stream of gun nodes.
 */
function to_node(target) {
    const transformer = new TransformStream({
        transform(chunk, controller) {
            const new_chunk = chunk.chain
                ? { value: chunk.value, key: chunk.key, node: new target(chunk.chain) }
                : { value: chunk.value, key: chunk.key, node: chunk.chain };
            controller.enqueue(new_chunk);
        },
    });
    return transformer;
}
