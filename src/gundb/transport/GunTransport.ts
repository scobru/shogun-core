/**
 * GunDB Transport Layer Implementation
 * Wraps Gun instance to implement the generic TransportLayer interface
 */

import Gun from "gun/gun";
import SEA from "gun/sea";
import type { IGunInstance, IGunUserInstance, IGunChain } from "gun/types";
import type { TransportLayer, IUserInstance, IChain } from "./TransportLayer";

/**
 * GunDB User Instance Wrapper
 */
class GunUserInstance implements IUserInstance {
  constructor(private gunUser: IGunUserInstance) {}

  get is() {
    return this.gunUser.is;
  }

  get _() {
    return this.gunUser._;
  }

  auth(username: string, password: string, callback?: (ack: any) => void): void;
  auth(pair: any, callback?: (ack: any) => void): void;
  auth(
    usernameOrPair: string | any,
    passwordOrCallback?: string | ((ack: any) => void),
    callback?: (ack: any) => void,
  ): void {
    if (typeof usernameOrPair === "string") {
      this.gunUser.auth(usernameOrPair, passwordOrCallback as string, callback);
    } else {
      this.gunUser.auth(
        usernameOrPair,
        passwordOrCallback as (ack: any) => void,
      );
    }
  }

  create(
    username: string,
    password: string,
    callback?: (ack: any) => void,
  ): void {
    this.gunUser.create(username, password, callback || (() => {}));
  }

  leave(): void {
    this.gunUser.leave();
  }

  recall(options?: { sessionStorage?: boolean }): IUserInstance {
    const recalled = this.gunUser.recall({
      sessionStorage: options?.sessionStorage || false,
    });
    return new GunUserInstance(recalled);
  }

  put(data: any): void {
    this.gunUser.put(data);
  }

  get(key: string): IChain {
    return new GunChain(this.gunUser.get(key));
  }
}

/**
 * GunDB Chain/Node Wrapper
 */
class GunChain implements IChain {
  constructor(private gunChain: IGunChain<any>) {}

  get(key: string): IChain {
    return new GunChain(this.gunChain.get(key));
  }

  async put(data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gunChain.put(data, resolve);
    });
  }

  async set(data: any): Promise<any> {
    return await this.gunChain.set(data).then();
  }

  once(callback: (data: any) => void): void {
    this.gunChain.once(callback);
  }

  on(callback: (data: any) => void): void {
    this.gunChain.on(callback);
  }

  off(callback: (data: any) => void): void {
    // Gun doesn't have off method, we'll implement a simple version
    // In a real implementation, you'd need to track listeners
  }

  async then(): Promise<any> {
    return await this.gunChain.then();
  }
}

/**
 * GunDB Transport Layer Implementation
 */
export class GunTransport implements TransportLayer {
  public readonly name = "gundb";
  public readonly version = "1.0.0";

  private gun: IGunInstance;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnectedState = false;

  constructor(options?: any) {
    // Initialize Gun with provided options
    this.gun = Gun(options || {});
    this.isConnectedState = true;

    // Setup default event forwarding
    this.setupEventForwarding();
  }

  /**
   * Get user instance
   */
  user(): IUserInstance {
    return new GunUserInstance(this.gun.user());
  }

  /**
   * Get chain/node at path
   */
  get(path: string): IChain {
    return new GunChain(this.gun.get(path));
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Forward Gun events (only for supported events)
    if (event === "auth") {
      this.gun.on("auth", callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      // Gun doesn't have off method, so we can't remove from Gun
    }
  }

  /**
   * Emit event
   */
  emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Connect to Gun network
   */
  async connect(config?: any): Promise<boolean> {
    try {
      if (config?.peers) {
        this.gun.opt({ peers: config.peers });
      }
      this.isConnectedState = true;
      return true;
    } catch (error) {
      console.error("GunTransport connection error:", error);
      this.isConnectedState = false;
      return false;
    }
  }

  /**
   * Disconnect from Gun network
   */
  async disconnect(): Promise<boolean> {
    try {
      // Clear all peers
      this.gun.opt({ peers: {} });
      this.isConnectedState = false;
      return true;
    } catch (error) {
      console.error("GunTransport disconnection error:", error);
      return false;
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.isConnectedState;
  }

  /**
   * Configure transport
   */
  configure(options: any): void {
    try {
      this.gun.opt(options);
    } catch (error) {
      console.error("GunTransport configuration error:", error);
    }
  }

  /**
   * Destroy transport and cleanup
   */
  destroy(): void {
    try {
      // Clear all event listeners
      this.eventListeners.clear();

      // Disconnect
      this.disconnect();

      // Clear Gun instance
      this.gun = null as any;
    } catch (error) {
      console.error("GunTransport destroy error:", error);
    }
  }

  /**
   * Setup event forwarding from Gun to our event system
   */
  private setupEventForwarding(): void {
    // Forward Gun auth events
    this.gun.on("auth", (ack: any) => {
      this.emit("auth", ack);
    });

    // Forward Gun data events
    this.gun.on("put", (data: any) => {
      this.emit("put", data);
    });

    this.gun.on("get", (data: any) => {
      this.emit("get", data);
    });

    // Forward peer events (Gun doesn't have peer events, so we'll skip this)
    // this.gun.on('peer', (peer: any) => {
    //   this.emit('peer', peer);
    // });
  }

  async put(data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.put(data, resolve);
    });
  }

  async getData(): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get("data").once(resolve);
    });
  }

  /**
   * Get underlying Gun instance (for backward compatibility)
   */
  getGunInstance(): IGunInstance {
    return this.gun;
  }

  /**
   * Add peer to Gun network
   */
  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
  }

  /**
   * Remove peer from Gun network
   */
  removePeer(peer: string): void {
    try {
      const gunOpts = this.gun._.opt as any;
      if (gunOpts && gunOpts.peers) {
        delete gunOpts.peers[peer];
      }
    } catch (error) {
      console.error("Error removing peer:", error);
    }
  }

  /**
   * Get current peers
   */
  getCurrentPeers(): string[] {
    try {
      const gunOpts = this.gun._.opt as any;
      if (gunOpts && gunOpts.peers) {
        return Object.keys(gunOpts.peers).filter((peer: string) => {
          const peerObj = gunOpts.peers[peer];
          return peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
        });
      }
      return [];
    } catch (error) {
      console.error("Error getting current peers:", error);
      return [];
    }
  }
}

export { GunUserInstance, GunChain };
