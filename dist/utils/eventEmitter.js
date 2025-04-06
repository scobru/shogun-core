/**
 * Simple event emitter implementation with generic event types
 */
export class EventEmitter {
    constructor() {
        this.events = new Map();
    }
    /**
     * Registers an event listener
     */
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)?.push(listener);
    }
    /**
     * Emits an event with arguments
     */
    emit(event, data) {
        if (!this.events.has(event))
            return;
        const listeners = this.events.get(event) || [];
        listeners.forEach((listener) => {
            try {
                listener(data);
            }
            catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
    /**
     * Removes an event listener
     */
    off(event, listener) {
        if (!this.events.has(event))
            return;
        const listeners = this.events.get(event) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
            if (listeners.length === 0) {
                this.events.delete(event);
            }
            else {
                this.events.set(event, listeners);
            }
        }
    }
    /**
     * Registers a one-time event listener
     */
    once(event, listener) {
        const onceWrapper = (data) => {
            listener(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
    /**
     * Removes all listeners for an event or all events
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
    }
}
