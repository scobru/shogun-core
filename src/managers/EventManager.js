"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
var events_1 = require("../interfaces/events");
/**
 * Manages event operations for ShogunCore
 */
var EventManager = /** @class */ (function () {
    function EventManager() {
        this.eventEmitter = new events_1.ShogunEventEmitter();
    }
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     * @returns {boolean} Indicates if the event had listeners.
     */
    EventManager.prototype.emit = function (eventName, data) {
        return this.eventEmitter.emit(eventName, data);
    };
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    EventManager.prototype.on = function (eventName, listener) {
        this.eventEmitter.on(eventName, listener);
        return this;
    };
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    EventManager.prototype.once = function (eventName, listener) {
        this.eventEmitter.once(eventName, listener);
        return this;
    };
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     * @returns {this} Returns this instance for method chaining
     */
    EventManager.prototype.off = function (eventName, listener) {
        this.eventEmitter.off(eventName, listener);
        return this;
    };
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     * @returns {this} Returns this instance for method chaining
     */
    EventManager.prototype.removeAllListeners = function (eventName) {
        this.eventEmitter.removeAllListeners(eventName);
        return this;
    };
    /**
     * Get the underlying event emitter instance
     * @returns The ShogunEventEmitter instance
     */
    EventManager.prototype.getEventEmitter = function () {
        return this.eventEmitter;
    };
    return EventManager;
}());
exports.EventManager = EventManager;
