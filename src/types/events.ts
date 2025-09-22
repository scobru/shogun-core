/**
 * Event types and interfaces for Shogun SDK
 */

export interface AuthEventData {
  userPub?: string;
  username?: string;
  method:
    | "password"
    | "webauthn"
    | "web3"
    | "nostr"
    | "oauth"
    | "bitcoin"
    | "pair";
  provider?: string;
}

export interface WalletEventData {
  address: string;
  path?: string;
}

export interface ErrorEventData {
  action: string;
  message: string;
  type: string;
  details?: any;
}

export interface GunDataEventData {
  path: string;
  data?: any;
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface GunPeerEventData {
  peer: string;
  action: "add" | "remove" | "connect" | "disconnect";
  timestamp: number;
}

export interface PluginEventData {
  name: string;
  version?: string;
  category?: string;
}

export interface DebugEventData {
  action: string;
  data?: any;
  timestamp: number;
}

export interface UsernameChangedEventData {
  oldUsername: string;
  newUsername: string;
  userPub: string;
}

/**
 * Event emitter class for Shogun SDK
 */
export class ShogunEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(eventName: string, listener: Function): this {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
    return this;
  }

  off(eventName: string, listener: Function): this {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
    return this;
  }

  once(eventName: string, listener: Function): this {
    const onceListener = (...args: any[]) => {
      this.off(eventName, onceListener);
      listener(...args);
    };
    return this.on(eventName, onceListener);
  }

  emit(eventName: string, data?: any): boolean {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners || eventListeners.length === 0) {
      return false;
    }

    eventListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });

    return true;
  }

  removeAllListeners(eventName?: string): this {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  listenerCount(eventName: string): number {
    const eventListeners = this.listeners.get(eventName);
    return eventListeners ? eventListeners.length : 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
