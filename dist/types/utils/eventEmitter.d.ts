/**
 * Type for any event data
 */
export type EventData = Record<string, unknown>;
/**
 * Generic event listener type
 */
export type Listener<T = unknown> = (data: T) => void;
/**
 * Simple event emitter implementation with generic event types
 */
export declare class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
    private events;
    constructor();
    /**
     * Registers an event listener
     */
    on(event: string, listener: (data: unknown) => void): void;
    /**
     * Emits an event with arguments
     */
    emit(event: string, data?: unknown): void;
    /**
     * Removes an event listener
     */
    off(event: string, listener: (data: unknown) => void): void;
    /**
     * Registers a one-time event listener
     */
    once(event: string, listener: (data: unknown) => void): void;
    /**
     * Removes all listeners for an event or all events
     */
    removeAllListeners(event?: string): void;
}
