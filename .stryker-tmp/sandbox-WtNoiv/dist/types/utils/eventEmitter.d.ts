/**
 * Type for any event data
 */
// @ts-nocheck

export type EventData = Record<string, unknown>;
/**
 * Generic event listener type
 */
export type Listener<T = unknown> = (data: T) => void;
/**
 * Event type che può essere string o symbol per compatibilità con Node.js EventEmitter
 */
export type EventType = string | symbol;
/**
 * Simple event emitter implementation with generic event types
 */
export declare class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
    private events;
    constructor();
    /**
     * Registers an event listener
     */
    on(event: EventType, listener: (data: unknown) => void): void;
    /**
     * Emits an event with arguments
     */
    emit(event: EventType, data?: unknown): boolean;
    /**
     * Removes an event listener
     */
    off(event: EventType, listener: (data: unknown) => void): void;
    /**
     * Registers a one-time event listener
     */
    once(event: EventType, listener: (data: unknown) => void): void;
    /**
     * Removes all listeners for an event or all events
     */
    removeAllListeners(event?: EventType): void;
}
