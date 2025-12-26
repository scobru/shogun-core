import { ShogunEventEmitter, ShogunEventMap } from '../interfaces/events';
/**
 * Manages event operations for ShogunCore
 */
export declare class EventManager {
    private eventEmitter;
    constructor();
    /**
     * Emits an event through the core's event emitter.
     * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
     * @param eventName The name of the event to emit.
     * @param data The data to pass with the event.
     * @returns {boolean} Indicates if the event had listeners.
     */
    emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K]): boolean;
    /**
     * Add an event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    on<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Add a one-time event listener
     * @param eventName The name of the event to listen for
     * @param listener The callback function to execute when the event is emitted
     * @returns {this} Returns this instance for method chaining
     */
    once<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Remove an event listener
     * @param eventName The name of the event to stop listening for
     * @param listener The callback function to remove
     * @returns {this} Returns this instance for method chaining
     */
    off<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this;
    /**
     * Remove all listeners for a specific event or all events
     * @param eventName Optional. The name of the event to remove listeners for.
     * If not provided, all listeners for all events are removed.
     * @returns {this} Returns this instance for method chaining
     */
    removeAllListeners(eventName?: string | symbol): this;
    /**
     * Get the underlying event emitter instance
     * @returns The ShogunEventEmitter instance
     */
    getEventEmitter(): ShogunEventEmitter;
}
