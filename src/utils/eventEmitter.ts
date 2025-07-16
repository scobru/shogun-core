/**
 * Type for any event data
 */
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
export class EventEmitter<
  Events extends Record<string, unknown> = Record<string, unknown>,
> {
  private events: Map<EventType, Array<(data: unknown) => void>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Registers an event listener
   */
  on(event: EventType, listener: (data: unknown) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(listener);
  }

  /**
   * Emits an event with arguments
   */
  emit(event: EventType, data?: unknown): boolean {
    if (!this.events.has(event)) return false;

    const listeners = this.events.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });

    return true;
  }

  /**
   * Removes an event listener
   */
  off(event: EventType, listener: (data: unknown) => void): void {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event) || [];
    const index = listeners.indexOf(listener);

    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, listeners);
      }
    }
  }

  /**
   * Registers a one-time event listener
   */
  once(event: EventType, listener: (data: unknown) => void): void {
    const onceWrapper = (data: unknown) => {
      listener(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Removes all listeners for an event or all events
   */
  removeAllListeners(event?: EventType): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
