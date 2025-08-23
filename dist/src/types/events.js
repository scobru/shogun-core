"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunEventEmitter = void 0;
const eventEmitter_1 = require("../utils/eventEmitter");
/**
 * Extended EventEmitter class with typed events for Shogun
 * @class ShogunEventEmitter
 * @extends EventEmitter
 */
class ShogunEventEmitter extends eventEmitter_1.EventEmitter {
    /**
     * Emit a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEventMap[K]} data - Event data
     * @returns {boolean} - Returns true if the event had listeners, false otherwise
     */
    emit(event, data) {
        return super.emit(event, data);
    }
    /**
     * Register a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function
     */
    on(event, listener) {
        super.on(event, listener);
    }
    /**
     * Remove a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function to remove
     */
    off(event, listener) {
        super.off(event, listener);
    }
}
exports.ShogunEventEmitter = ShogunEventEmitter;
