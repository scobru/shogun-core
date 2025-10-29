"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
/**
 * Simple event emitter implementation with generic event types
 */
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.events = new Map();
    }
    /**
     * Registers an event listener
     */
    EventEmitter.prototype.on = function (event, listener) {
        var _a;
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        (_a = this.events.get(event)) === null || _a === void 0 ? void 0 : _a.push(listener);
    };
    /**
     * Emits an event with arguments
     */
    EventEmitter.prototype.emit = function (event, data) {
        if (!this.events.has(event))
            return false;
        var listeners = this.events.get(event) || [];
        listeners.forEach(function (listener) {
            try {
                listener(data);
            }
            catch (error) {
                // Ensure error is properly formatted for console.error and pass Error instance
                var err = error instanceof Error ? error : new Error(String(error));
                console.error("Error in event listener for ".concat(String(event), ":"), err);
            }
        });
        return true;
    };
    /**
     * Removes an event listener
     */
    EventEmitter.prototype.off = function (event, listener) {
        if (!this.events.has(event))
            return;
        var listeners = this.events.get(event) || [];
        var index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            if (listeners.length === 0) {
                this.events.delete(event);
            }
            else {
                this.events.set(event, listeners);
            }
        }
    };
    /**
     * Registers a one-time event listener
     */
    EventEmitter.prototype.once = function (event, listener) {
        var _this = this;
        var onceWrapper = function (data) {
            listener(data);
            _this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    };
    /**
     * Removes all listeners for an event or all events
     */
    EventEmitter.prototype.removeAllListeners = function (event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
