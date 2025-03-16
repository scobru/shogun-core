import { EventEmitter } from "./utils/eventEmitter";
/**
 * Extended EventEmitter class with typed events for Shogun
 * @class ShogunEventEmitter
 * @extends EventEmitter
 */
export class ShogunEventEmitter extends EventEmitter {
    /**
     * Emit a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {...Parameters<ShogunEvents[K]>} args - Event arguments
     */
    emit(event, ...args) {
        super.emit(event, ...args);
    }
    /**
     * Register a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEvents[K]} listener - Event listener function
     */
    on(event, listener) {
        super.on(event, listener);
    }
    /**
     * Remove a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEvents[K]} listener - Event listener function to remove
     */
    off(event, listener) {
        super.off(event, listener);
    }
}
