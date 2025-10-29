"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunEventEmitter = void 0;
var eventEmitter_1 = require("../utils/eventEmitter");
/**
 * Extended EventEmitter class with typed events for Shogun
 * @class ShogunEventEmitter
 * @extends EventEmitter
 */
var ShogunEventEmitter = /** @class */ (function (_super) {
    __extends(ShogunEventEmitter, _super);
    function ShogunEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Emit a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEventMap[K]} data - Event data
     * @returns {boolean} - Returns true if the event had listeners, false otherwise
     */
    ShogunEventEmitter.prototype.emit = function (event, data) {
        return _super.prototype.emit.call(this, event, data);
    };
    /**
     * Register a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function
     */
    ShogunEventEmitter.prototype.on = function (event, listener) {
        _super.prototype.on.call(this, event, listener);
    };
    /**
     * Remove a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function to remove
     */
    ShogunEventEmitter.prototype.off = function (event, listener) {
        _super.prototype.off.call(this, event, listener);
    };
    return ShogunEventEmitter;
}(eventEmitter_1.EventEmitter));
exports.ShogunEventEmitter = ShogunEventEmitter;
