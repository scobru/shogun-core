/**
 * Event types and interfaces for Shogun SDK
 */
/**
 * Event emitter class for Shogun SDK
 */
export class ShogunEventEmitter {
    listeners = new Map();
    on(eventName, listener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(listener);
        return this;
    }
    off(eventName, listener) {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
        return this;
    }
    once(eventName, listener) {
        const onceListener = (...args) => {
            this.off(eventName, onceListener);
            listener(...args);
        };
        return this.on(eventName, onceListener);
    }
    emit(eventName, data) {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners || eventListeners.length === 0) {
            return false;
        }
        eventListeners.forEach((listener) => {
            try {
                listener(data);
            }
            catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
        return true;
    }
    removeAllListeners(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        }
        else {
            this.listeners.clear();
        }
        return this;
    }
    listenerCount(eventName) {
        const eventListeners = this.listeners.get(eventName);
        return eventListeners ? eventListeners.length : 0;
    }
    eventNames() {
        return Array.from(this.listeners.keys());
    }
}
