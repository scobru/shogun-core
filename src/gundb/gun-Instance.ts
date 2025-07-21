/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */

let Gun: any;
let SEA: any;

if (typeof window !== "undefined") {
  Gun = require("gun/gun");
  SEA = require("gun/sea");
} else {
  Gun = import("gun/gun").then((module) => module.default);
  SEA = import("gun/sea").then((module) => module.default);
}

import "gun/lib/then.js";
import "gun/lib/radix.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";

import { restrictedPut } from "./restricted-put";
import derive, { DeriveOptions } from "./derive";

import type {
  IGunUserInstance,
  IGunInstance,
  IGunChain,
  ISEAPair,
} from "gun/types";

import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";
import { GunDataEventData, GunPeerEventData } from "../types/events";
import { GunRxJS } from "./gun-rxjs";

import * as GunErrors from "./errors";
import * as crypto from "./crypto";

class GunInstance {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;

  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private readonly eventEmitter: EventEmitter;

  // Integrated modules
  private _rxjs?: GunRxJS;

  constructor(gun: IGunInstance<any>, appScope: string = "shogun") {
    console.log("[gunInstance]  Initializing GunDB");

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Validate Gun instance
    if (!gun) {
      throw new Error("Gun instance is required but was not provided");
    }

    if (typeof gun !== "object") {
      throw new Error(
        `Gun instance must be an object, received: ${typeof gun}`,
      );
    }

    if (typeof gun.user !== "function") {
      throw new Error(
        `Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof gun.user}`,
      );
    }

    if (typeof gun.get !== "function") {
      throw new Error(
        `Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof gun.get}`,
      );
    }

    if (typeof gun.on !== "function") {
      throw new Error(
        `Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof gun.on}`,
      );
    }

    this.gun = gun;

    this.user = this.gun.user().recall({ sessionStorage: true });

    this.subscribeToAuthEvents();

    this.crypto = crypto;

    this.sea = SEA;

    this.node = null as unknown as IGunChain<
      any,
      IGunInstance<any>,
      IGunInstance<any>,
      string
    >;
  }

  /**
   * Initialize the GunInstance asynchronously
   * This method should be called after construction to perform async operations
   */
  async initialize(appScope: string = "shogun"): Promise<void> {
    try {
      const sessionResult = this.restoreSession();

      this.node = this.gun.get(appScope);

      if (sessionResult.success) {
        console.log(
          `Session automatically restored for user: ${sessionResult.userPub}`,
        );
      } else {
        console.log(`No previous session to restore: ${sessionResult.error}`);
      }
    } catch (error) {
      console.error("Error during automatic session restoration:", error);
    }
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
      console.log("[gunInstance]  Auth event received:", ack);

      if (ack.err) {
        ErrorHandler.handle(
          ErrorType.GUN,
          "AUTH_EVENT_ERROR",
          ack.err,
          new Error(ack.err),
        );
      } else {
        this.notifyAuthListeners(ack.sea?.pub || "");
      }
    });
  }

  private notifyAuthListeners(pub: string): void {
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Emits a Gun data event
   * @private
   */
  private emitDataEvent(
    eventType: "gun:put" | "gun:get" | "gun:set" | "gun:remove",
    path: string,
    data?: any,
    success: boolean = true,
    error?: string,
  ): void {
    const eventData: GunDataEventData = {
      path,
      data,
      success,
      error,
      timestamp: Date.now(),
    };
    this.eventEmitter.emit(eventType, eventData);
  }

  /**
   * Emits a Gun peer event
   * @private
   */
  private emitPeerEvent(
    action: "add" | "remove" | "connect" | "disconnect",
    peer: string,
  ): void {
    const eventData: GunPeerEventData = {
      peer,
      action,
      timestamp: Date.now(),
    };
    this.eventEmitter.emit(`gun:peer:${action}`, eventData);
  }

  /**
   * Adds an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  on(event: string | symbol, listener: (data: unknown) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Removes an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  off(event: string | symbol, listener: (data: unknown) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Adds a one-time event listener
   * @param event Event name
   * @param listener Event listener function
   */
  once(event: string | symbol, listener: (data: unknown) => void): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Emits an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string | symbol, data?: unknown): boolean {
    return this.eventEmitter.emit(event, data);
  }

  /**
   * Adds a new peer to the network
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
    this.emitPeerEvent("add", peer);
    console.log(`Added new peer: ${peer}`);
  }

  /**
   * Removes a peer from the network
   * @param peer URL of the peer to remove
   */
  removePeer(peer: string): void {
    try {
      // Get current peers from Gun instance
      const gunOpts = (this.gun as any)._.opt;
      if (gunOpts && gunOpts.peers) {
        // Remove the peer from the peers object
        delete gunOpts.peers[peer];

        // Also try to close the connection if it exists
        const peerConnection = gunOpts.peers[peer];
        if (peerConnection && typeof peerConnection.close === "function") {
          peerConnection.close();
        }

        this.emitPeerEvent("remove", peer);
        console.log(`Removed peer: ${peer}`);
      } else {
        console.log(`Peer not found in current connections: ${peer}`);
      }
    } catch (error) {
      console.error(`Error removing peer ${peer}:`, error);
    }
  }

  /**
   * Gets the list of currently connected peers
   * @returns Array of peer URLs
   */
  getCurrentPeers(): string[] {
    try {
      const gunOpts = (this.gun as any)._.opt;
      if (gunOpts && gunOpts.peers) {
        return Object.keys(gunOpts.peers).filter((peer) => {
          const peerObj = gunOpts.peers[peer];
          // Check if peer is actually connected (not just configured)
          return peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
        });
      }
      return [];
    } catch (error) {
      console.error("Error getting current peers:", error);
      return [];
    }
  }

  /**
   * Gets the list of all configured peers (connected and disconnected)
   * @returns Array of peer URLs
   */
  getAllConfiguredPeers(): string[] {
    try {
      const gunOpts = (this.gun as any)._.opt;
      if (gunOpts && gunOpts.peers) {
        return Object.keys(gunOpts.peers);
      }
      return [];
    } catch (error) {
      console.error("Error getting configured peers:", error);
      return [];
    }
  }

  /**
   * Gets detailed information about all peers
   * @returns Object with peer information
   */
  getPeerInfo(): { [peer: string]: { connected: boolean; status: string } } {
    try {
      const gunOpts = (this.gun as any)._.opt;
      const peerInfo: {
        [peer: string]: { connected: boolean; status: string };
      } = {};

      if (gunOpts && gunOpts.peers) {
        Object.keys(gunOpts.peers).forEach((peer) => {
          const peerObj = gunOpts.peers[peer];
          const isConnected =
            peerObj && peerObj.wire && peerObj.wire.hied !== "bye";
          const status = isConnected
            ? "connected"
            : peerObj && peerObj.wire
              ? "disconnected"
              : "not_initialized";

          peerInfo[peer] = {
            connected: isConnected,
            status: status,
          };
        });
      }

      return peerInfo;
    } catch (error) {
      console.error("Error getting peer info:", error);
      return {};
    }
  }

  /**
   * Reconnects to a specific peer
   * @param peer URL of the peer to reconnect
   */
  reconnectToPeer(peer: string): void {
    try {
      // First remove the peer
      this.removePeer(peer);

      // Add it back immediately instead of with timeout
      this.addPeer(peer);
      console.log(`Reconnected to peer: ${peer}`);
    } catch (error) {
      console.error(`Error reconnecting to peer ${peer}:`, error);
    }
  }

  /**
   * Clears all peers and optionally adds new ones
   * @param newPeers Optional array of new peers to add
   */
  resetPeers(newPeers?: string[]): void {
    try {
      const gunOpts = (this.gun as any)._.opt;
      if (gunOpts && gunOpts.peers) {
        // Clear all existing peers
        Object.keys(gunOpts.peers).forEach((peer) => {
          this.removePeer(peer);
        });

        // Add new peers if provided
        if (newPeers && newPeers.length > 0) {
          newPeers.forEach((peer) => {
            this.addPeer(peer);
          });
        }

        console.log(
          `Reset peers. New peers: ${newPeers ? newPeers.join(", ") : "none"}`,
        );
      }
    } catch (error) {
      console.error("Error resetting peers:", error);
    }
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: (user: any) => void): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.gun.user();
    if (user && user.is) callback(user);
    return () => {
      const i = this.onAuthCallbacks.indexOf(callback);
      if (i !== -1) this.onAuthCallbacks.splice(i, 1);
    };
  }

  /**
   * Helper method to navigate to a nested path by splitting and chaining .get() calls
   * @param node Starting Gun node
   * @param path Path string (e.g., "test/data/marco")
   * @returns Gun node at the specified path
   */
  private navigateToPath(node: any, path: string): any {
    if (!path) return node;

    // Split path by '/' and filter out empty segments
    const pathSegments = path
      .split("/")
      .filter((segment) => segment.length > 0);

    // Chain .get() calls for each path segment
    return pathSegments.reduce((currentNode, segment) => {
      return currentNode.get(segment);
    }, node);
  }

  /**
   * Gets the Gun instance
   * @returns Gun instance
   */
  getGun(): IGunInstance<any> {
    return this.gun;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): any {
    try {
      const user = this.gun.user();
      const pub = user?.is?.pub;
      return pub ? { pub, user } : null;
    } catch (error) {
      console.error("[gunInstance]  Error getting current user:", error);
      return null;
    }
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): any {
    return this.gun.user();
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Gun node
   */
  get(path: string): any {
    return this.navigateToPath(this.gun, path);
  }

  /**
   * Gets data at the specified path (one-time read)
   * @param path Path to get the data from
   * @returns Promise resolving to the data
   */
  async getData(path: string): Promise<any> {
    return new Promise((resolve) => {
      this.navigateToPath(this.gun, path).once((data: any) => {
        // Emit event for the operation
        this.emitDataEvent("gun:get", path, data, true);
        resolve(data);
      });
    });
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.navigateToPath(this.gun, path).put(data, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

        // Emit event for the operation
        this.emitDataEvent("gun:put", path, data, !ack.err, ack.err);

        resolve(result);
      });
    });
  }

  /**
   * Sets data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async set(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.navigateToPath(this.gun, path).set(data, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

        // Emit event for the operation
        this.emitDataEvent("gun:set", path, data, !ack.err, ack.err);

        resolve(result);
      });
    });
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<any> {
    return new Promise((resolve) => {
      this.navigateToPath(this.gun, path).put(null, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

        // Emit event for the operation
        this.emitDataEvent("gun:remove", path, null, !ack.err, ack.err);

        resolve(result);
      });
    });
  }

  /**
   * Checks if a user is currently logged in
   * @returns True if logged in
   */
  isLoggedIn(): boolean {
    try {
      const user = this.gun.user();
      return !!(user && user.is && user.is.pub);
    } catch (error) {
      console.error("[gunInstance]  Error checking login status:", error);
      return false;
    }
  }

  /**
   * Attempts to restore user session from local storage
   * @returns Promise resolving to session restoration result
   */
  restoreSession(): {
    success: boolean;
    userPub?: string;
    error?: string;
  } {
    try {
      if (typeof localStorage === "undefined") {
        return { success: false, error: "localStorage not available" };
      }

      const sessionInfo = localStorage.getItem("gun/session");
      const pairInfo = localStorage.getItem("gun/pair");

      if (!sessionInfo || !pairInfo) {
        console.log("[gunInstance]  No saved session found");
        return { success: false, error: "No saved session" };
      }

      let session, pair;
      try {
        session = JSON.parse(sessionInfo);
        pair = JSON.parse(pairInfo);
      } catch (parseError) {
        console.error("[gunInstance]  Error parsing session data:", parseError);
        // Clear corrupted data
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Corrupted session data" };
      }

      // Validate session data
      if (!session.pub || !pair.pub || !pair.priv) {
        console.log("[gunInstance]  Invalid session data, clearing storage");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Invalid session data" };
      }

      // Check if session is not too old (optional - you can adjust this)
      const sessionAge = Date.now() - session.timestamp;
      const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxSessionAge) {
        console.log("[gunInstance]  Session expired, clearing storage");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session expired" };
      }

      console.log(
        `Attempting to restore session for user: ${session.alias || session.pub}`,
      );

      // Try to restore the session with Gun
      const user = this.gun.user();

      if (!user) {
        console.error("[gunInstance]  Gun user instance not available");
        return { success: false, error: "Gun user instance not available" };
      }

      // Set the pair directly with error handling
      try {
        (user as any)._ = { sea: pair };
      } catch (pairError) {
        console.error("[gunInstance]  Error setting user pair:", pairError);
        return { success: false, error: "Failed to set user credentials" };
      }

      // Try to recall the session with better error handling
      let recallResult;
      try {
        recallResult = user.recall({ sessionStorage: true });
        console.log("recallResult", recallResult);
      } catch (recallError) {
        console.error("[gunInstance]  Error during recall:", recallError);
        // Clear corrupted session data
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session recall failed" };
      }

      // Check if recall was successful
      if (recallResult && user.is?.pub === session.pub) {
        console.log(
          `Session restored successfully for: ${session.alias || session.pub}`,
        );
        return { success: true, userPub: session.pub };
      } else {
        console.log(
          "[gunInstance]  Session restoration failed, clearing storage",
        );
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session restoration failed" };
      }
    } catch (error) {
      console.error(`Error restoring session: ${error}`);
      // Clear potentially corrupted data on any error
      try {
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
      } catch (clearError) {
        console.error(
          "[gunInstance]  Error clearing corrupted session data:",
          clearError,
        );
      }
      return { success: false, error: String(error) };
    }
  }

  /**
   * Logs out the current user using direct Gun authentication
   */
  logout(): void {
    try {
      // Check if the user is actually logged in before attempting to logout
      if (!this.isLoggedIn()) {
        console.log("[gunInstance]  No user logged in, skipping logout");
        return;
      }

      const currentUser = this.getCurrentUser();
      console.log(`Logging out user: ${currentUser?.pub || "unknown"}`);

      // Direct logout using Gun with error handling
      try {
        const user = this.gun.user();
        if (user && typeof user.leave === "function") {
          user.leave();
        }
      } catch (gunError) {
        console.error("[gunInstance]  Error during Gun logout:", gunError);
        // Continue with storage cleanup even if Gun logout fails
      }

      // Clear local storage session data
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem("gun/pair");
          localStorage.removeItem("gun/session");

          // Also clear old format for backward compatibility
          localStorage.removeItem("pair");

          console.log("[gunInstance]  Local session data cleared");
        } catch (storageError) {
          console.error(
            "[gunInstance]  Error clearing localStorage:",
            storageError,
          );
        }
      }

      // Clear sessionStorage as well
      if (typeof sessionStorage !== "undefined") {
        try {
          sessionStorage.removeItem("gun/");
          sessionStorage.removeItem("gun/user");
          sessionStorage.removeItem("gun/auth");
          sessionStorage.removeItem("gun/pair");
          sessionStorage.removeItem("gun/session");

          console.log("[gunInstance]  Session storage cleared");
        } catch (sessionError) {
          console.error(
            "[gunInstance]  Error clearing sessionStorage:",
            sessionError,
          );
        }
      }

      console.log("[gunInstance]  Logout completed successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  /**
   * Debug method: Clears all Gun-related data from local and session storage
   * This is useful for debugging and testing purposes
   */
  clearAllStorageData(): void {
    try {
      console.log("[gunInstance]  Clearing all Gun-related storage data...");

      // Clear localStorage
      if (typeof localStorage !== "undefined") {
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("gun/") || key === "pair")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
          console.log(`Cleared ${keysToRemove.length} items from localStorage`);
        } catch (localError) {
          console.error(
            "[gunInstance]  Error clearing localStorage:",
            localError,
          );
        }
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== "undefined") {
        try {
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("gun/")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => sessionStorage.removeItem(key));
          console.log(
            `Cleared ${keysToRemove.length} items from sessionStorage`,
          );
        } catch (sessionError) {
          console.error(
            "[gunInstance]  Error clearing sessionStorage:",
            sessionError,
          );
        }
      }

      // Also logout if currently logged in
      if (this.isLoggedIn()) {
        try {
          const user = this.gun.user();
          if (user && typeof user.leave === "function") {
            user.leave();
            console.log("[gunInstance]  User logged out");
          }
        } catch (logoutError) {
          console.error("[gunInstance]  Error during logout:", logoutError);
        }
      }

      console.log("[gunInstance]  All Gun-related storage data cleared");
    } catch (error) {
      console.error("Error clearing storage data:", error);
    }
  }

  /**
   * Debug method: Tests Gun connectivity and returns status information
   * This is useful for debugging connection issues
   */
  async testConnectivity(): Promise<{
    peers: { [peer: string]: { connected: boolean; status: string } };
    gunInstance: boolean;
    userInstance: boolean;
    canWrite: boolean;
    canRead: boolean;
    testWriteResult?: any;
    testReadResult?: any;
  }> {
    try {
      console.log("[gunInstance]  Testing Gun connectivity...");

      const result = {
        peers: this.getPeerInfo(),
        gunInstance: !!this.gun,
        userInstance: !!this.gun.user(),
        canWrite: false,
        canRead: false,
        testWriteResult: null as any,
        testReadResult: null as any,
      };

      // Test basic write operation
      try {
        const testData = { test: true, timestamp: Date.now() };
        const writeResult = await new Promise<any>((resolve) => {
          this.gun
            .get("test")
            .get("connectivity")
            .put(testData, (ack: any) => {
              resolve(ack);
            });
        });
        result.canWrite = !writeResult?.err;
        result.testWriteResult = writeResult;
        console.log("[gunInstance]  Write test result:", writeResult);
      } catch (writeError) {
        console.error("Write test failed:", writeError);
        result.testWriteResult = { error: String(writeError) };
      }

      // Test basic read operation
      try {
        const readResult = await new Promise<any>((resolve) => {
          this.gun
            .get("test")
            .get("connectivity")
            .once((data: any) => {
              resolve(data);
            });
        });
        result.canRead = !!readResult;
        result.testReadResult = readResult;
        console.log("[gunInstance]  Read test result:", readResult);
      } catch (readError) {
        console.error("Read test failed:", readError);
        result.testReadResult = { error: String(readError) };
      }

      console.log("[gunInstance]  Connectivity test completed:", result);
      return result;
    } catch (error) {
      console.error("Error testing connectivity:", error);
      return {
        peers: {},
        gunInstance: false,
        userInstance: false,
        canWrite: false,
        canRead: false,
        testWriteResult: { error: String(error) },
        testReadResult: { error: String(error) },
      };
    }
  }

  /**
   * Accesses the RxJS module for reactive programming
   * @returns GunRxJS instance
   */
  rx(): GunRxJS {
    if (!this._rxjs) {
      this._rxjs = new GunRxJS(this.gun);
    }
    return this._rxjs;
  }

  /**
   * Signs up a new user using direct Gun authentication
   * @param username Username
   * @param password Password
   * @param pair Optional SEA pair for Web3 login
   * @returns Promise resolving to signup result
   */
  async signUp(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<any> {
    console.log("[gunInstance]  Attempting user registration:", username);

    try {
      // Validate credentials
      if (password.length < 8 && !pair) {
        const err = "Passwords must be more than 8 characters long!";
        console.log(err);
        return { success: false, error: err };
      }

      if (username.length < 1) {
        const err = "Username must be more than 0 characters long!";
        console.log(err);
        return { success: false, error: err };
      }

      // First, try to authenticate with Gun's native system to check if user exists
      console.log(
        `Checking if user ${username} exists in Gun's native system...`,
      );
      const authTestResult = await new Promise<any>((resolve) => {
        if (pair) {
          this.gun.user().auth(pair, (ack: any) => {
            if (ack.err) {
              // User doesn't exist or password is wrong - this is expected for new users
              resolve({ exists: false, error: ack.err });
            } else {
              // User exists and password is correct
              resolve({ exists: true, userPub: this.gun.user().is?.pub });
            }
          });
        } else {
          this.gun.user().auth(username, password, (ack: any) => {
            if (ack.err) {
              resolve({ exists: false, error: ack.err });
            } else {
              resolve({ exists: true, userPub: this.gun.user().is?.pub });
            }
          });
        }
      });

      if (authTestResult.exists) {
        // Await the call to runPostAuthOnAuthResult
        return await this.runPostAuthOnAuthResult(authTestResult, username);
      }

      // User doesn't exist, attempt to create new user
      console.log(`Creating new user: ${username}`);

      const createResult = await new Promise<any>((resolve) => {
        if (pair) {
          resolve({ success: true, pub: pair.pub });
        } else {
          this.gun.user().create(username, password, (ack: any) => {
            if (ack.err) {
              console.error(`User creation error: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              console.log(`User created successfully: ${username}`);
              resolve({ success: true, pub: ack.pub });
            }
          });
        }
      });

      if (!createResult.success) {
        return createResult;
      }

      // User created successfully, now authenticate to get the userPub
      const authResult = await new Promise<any>((resolve) => {
        if (pair) {
          this.gun.user().auth(pair, (ack: any) => {
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, userPub: this.gun.user().is?.pub });
            }
          });
        } else {
          this.gun.user().auth(username, password, (ack: any) => {
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, userPub: this.gun.user().is?.pub });
            }
          });
        }
      });

      if (!authResult.success) {
        return {
          success: false,
          error: "User created but authentication failed",
        };
      }

      const userPub = authResult.userPub;
      console.log(
        `User authentication successful after creation: ${username} (${userPub})`,
      );

      await this.runPostAuthOnAuthResult(authResult, username);

      this.savePair();

      return {
        success: true,
        userPub,
        username,
        message: "User created successfully",
      };
    } catch (error) {
      console.error(`Exception during signup for ${username}: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  public async runPostAuthOnAuthResult(
    authTestResult: any,
    username: string,
  ): Promise<any> {
    console.log(
      `User ${username} already exists and password is correct, syncing with tracking system...`,
    );

    // L'utente esiste e può autenticarsi, sincronizza con il sistema di tracciamento
    const userPub = authTestResult.userPub;

    if (!userPub) {
      console.error(
        "La chiave pubblica dell'utente (userPub) non è definita in runPostAuthOnAuthResult.",
      );
      return {
        success: false,
        error: "La chiave pubblica dell'utente è mancante.",
      };
    }

    // Controlla se l'utente esiste nel nostro sistema di tracciamento
    const existingUser = await this.checkUsernameExists(username);

    console.log("[gunInstance]  existingUser", existingUser);

    if (!existingUser) {
      console.log(
        `L'utente ${username} non è nel sistema di tracciamento, lo aggiungo...`,
      );

      // Aggiungi l'utente al nostro sistema di tracciamento
      const userMetadata = {
        username: username,
        pub: userPub,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };

      try {
        // Salva i metadati dell'utente con sincronizzazione migliorata
        await new Promise<void>((resolve, reject) => {
          const userNode = this.node.get(userPub);

          userNode.put(userMetadata, (ack: any) => {
            if (ack.err) {
              console.error(
                `Impossibile salvare i metadati dell'utente: ${ack.err}`,
              );
              reject(ack.err);
            } else {
              console.log(`Metadati utente salvati per: ${username}`);
              resolve();
            }
          });
        });

        // Crea il mapping del nome utente con sincronizzazione avanzata
        // Ristrutturato per usare async/await per un flusso più chiaro e correggere problemi di sintassi/tipo
        await new Promise<void>((resolve, reject) => {
          // Rendi la callback della promise esterna async
          const usernamesNode = this.node.get("usernames");
          const mappingKey = "#" + username;

          try {
            // 1. Mappa il nome utente alla chiave pubblica dell'utente
            new Promise<void>((putResolve, putReject) => {
              usernamesNode.get(mappingKey).put(userPub, (ack: any) => {
                if (ack.err) {
                  console.error(
                    `Impossibile creare il mapping del nome utente: ${ack.err}`,
                  );
                  putReject(ack.err);
                } else {
                  console.log(
                    `Mapping del nome utente creato per: ${username}`,
                  );
                  putResolve();
                }
              });
            });

            // 2. Crea una voce hash per i dati di mapping
            const mappingData = {
              username: username,
              userPub: userPub,
              createdAt: Date.now(),
            };

            const hash = SEA.work(JSON.stringify(mappingData), null, null, {
              name: "SHA-256",
            });

            new Promise<void>((putResolve, putReject) => {
              this.node
                .get("usernames")
                .get("#" + hash)
                .put(mappingData, (ack: any) => {
                  // Tipizza esplicitamente ack come any
                  if (ack.err) {
                    console.error(
                      `Impossibile salvare i dati di mapping hash: ${ack.err}`,
                    );
                    putReject(ack.err);
                  } else {
                    console.log(
                      `Dati di mapping hash salvati per: ${username}`,
                    );
                    putResolve();
                  }
                });
            });

            // 3. Verifica avanzata con retry basato su promise
            const verifyMapping = () => {
              return new Promise<void>((verifyResolve, verifyReject) => {
                // Molteplici strategie per verificare il mapping
                const verificationAttempts = [
                  // Ricerca diretta
                  () =>
                    new Promise<boolean>((res) => {
                      usernamesNode.get(mappingKey).once((pub: any) => {
                        res(pub === userPub);
                      });
                    }),

                  // Scansione completa
                  () =>
                    new Promise<boolean>((res) => {
                      let found = false;
                      usernamesNode.map().once((pub: any, key: string) => {
                        if (key === mappingKey && pub === userPub) {
                          found = true;
                          res(true);
                        }
                      });

                      // Timeout per garantire una scansione approfondita
                      setTimeout(() => res(found), 500);
                    }),
                ];

                // Esegui le strategie di verifica in sequenza
                const runVerifications = async () => {
                  for (const strategy of verificationAttempts) {
                    try {
                      const result = await strategy();
                      if (result) {
                        console.log(
                          `Mapping del nome utente verificato con successo per ${username}`,
                        );
                        verifyResolve();
                        return;
                      }
                    } catch (error) {
                      console.error(`Strategia di verifica fallita: ${error}`);
                    }
                  }

                  // Se tutte le strategie falliscono
                  console.error(
                    `Impossibile verificare il mapping del nome utente per ${username}`,
                  );
                  verifyReject(
                    new Error("Verifica del mapping del nome utente fallita"),
                  );
                };

                runVerifications();
              });
            };

            // Esegui la verifica con timeout
            Promise.race([
              // Attendi la promise di verifica
              verifyMapping(),
              new Promise<void>((_, rej) =>
                setTimeout(() => rej(new Error("Timeout di verifica")), 5000),
              ),
            ]);

            // Se tutti i passaggi precedenti hanno successo, risolvi la promise esterna
            resolve();
          } catch (error) {
            // Se un qualsiasi passaggio fallisce, rifiuta la promise esterna
            console.error(
              `Errore durante il mapping o la verifica del nome utente: ${error}`,
            );
            reject(error);
          }
        });

        // Aggiungi alla collezione di utenti (non bloccante)
        this.node.get("users").set(this.node.get(userPub), (ack: any) => {
          if (ack.err) {
            console.error(
              `Avviso: Impossibile aggiungere l'utente alla collezione: ${ack.err}`,
            );
          } else {
            console.log(`Utente aggiunto alla collezione: ${username}`);
          }
        });

        this.savePair();

        return {
          success: true,
          userPub: userPub,
          username: username,
          message:
            "Utente sincronizzato con successo con il sistema di tracciamento",
        };
      } catch (trackingError) {
        console.error(
          `Critico: Impossibile aggiornare il sistema di tracciamento: ${trackingError}`,
        );
        return {
          success: false,
          userPub: userPub,
          username: username,
          error:
            "Impossibile sincronizzare il sistema di tracciamento dell'utente",
        };
      }
    }

    return existingUser;
  }

  public async checkUsernameExists(username: string): Promise<any> {
    try {
      // Normalize username to handle variations
      const normalizedUsername = username.trim().toLowerCase();
      const frozenKey = `#${normalizedUsername}`;
      const alternateKey = normalizedUsername;

      // Define result interface for better type safety
      interface UsernameLookupResult {
        pub?: string;
        userPub?: string;
        username?: string;
        source: string;
        immutable: boolean;
        hash?: string;
        [key: string]: any;
      }

      // Multiple lookup strategies with frozen space priority
      const lookupStrategies = [
        // 1. Frozen space scan (HIGHEST PRIORITY - immutable data)
        async (): Promise<UsernameLookupResult | null> => {
          return new Promise((resolve) => {
            let found = false;
            this.node
              .get("usernames")
              .map()
              .once((mappingData: any, hash: string) => {
                if (
                  mappingData &&
                  mappingData.username === normalizedUsername &&
                  !found
                ) {
                  found = true;
                  // Return enriched data with hash for integrity verification
                  resolve({
                    ...mappingData,
                    hash,
                    source: "frozen_space",
                    immutable: true,
                  });
                }
              });

            // Timeout per evitare blocchi infiniti
            setTimeout(() => {
              if (!found) resolve(null);
            }, 2000);
          });
        },

        // 2. Direct frozen mapping (legacy compatibility)
        async (): Promise<UsernameLookupResult | null> => {
          return new Promise((resolve) => {
            this.node
              .get("usernames")
              .get(frozenKey)
              .once((data: any) => {
                if (data) {
                  resolve({
                    pub: data,
                    username: normalizedUsername,
                    source: "direct_mapping",
                    immutable: false,
                  });
                } else {
                  resolve(null);
                }
              });
          });
        },

        // 3. Alternate key lookup (fallback)
        async (): Promise<UsernameLookupResult | null> => {
          return new Promise((resolve) => {
            this.node
              .get("usernames")
              .get(alternateKey)
              .once((data: any) => {
                if (data) {
                  resolve({
                    pub: data,
                    username: normalizedUsername,
                    source: "alternate_key",
                    immutable: false,
                  });
                } else {
                  resolve(null);
                }
              });
          });
        },

        // 4. Comprehensive scan fallback (last resort)
        async (): Promise<UsernameLookupResult | null> => {
          return new Promise((resolve) => {
            let found = false;
            this.node
              .get("usernames")
              .map()
              .once((data: any, key: string) => {
                if (
                  (key === frozenKey || key === alternateKey) &&
                  data &&
                  !found
                ) {
                  found = true;
                  resolve({
                    pub: data,
                    username: normalizedUsername,
                    source: "comprehensive_scan",
                    immutable: false,
                  });
                }
              });

            // Timeout per evitare blocchi infiniti
            setTimeout(() => {
              if (!found) resolve(null);
            }, 1500);
          });
        },
      ];

      // Sequential strategy execution with timeout
      for (const strategy of lookupStrategies) {
        try {
          const result = await Promise.race([
            strategy(),
            new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error("Lookup timeout")), 3000),
            ),
          ]);

          if (result) {
            console.debug(
              `[checkUsernameExists] Found user via ${result.source}:`,
              result,
            );

            // If we found a pub, try to fetch user data
            if (typeof result.pub === "string" && result.pub) {
              const pubKey = result.pub as string; // Cast esplicito per TypeScript
              const userData = await new Promise<any>((resolve) => {
                this.node.get(pubKey).once((data: any) => {
                  console.debug(
                    `[checkUsernameExists] User data for pub ${pubKey}:`,
                    data,
                  );
                  resolve(data || null);
                });
              });

              // Always return an object with pub and username if possible
              if (userData && userData.username) {
                return {
                  ...userData,
                  source: result.source,
                  immutable: result.immutable,
                  hash: result.hash,
                };
              }
              return {
                pub: result.pub,
                username: normalizedUsername,
                source: result.source,
                immutable: result.immutable,
                hash: result.hash,
              };
            }

            // If result is already a complete object (from frozen space)
            if (result.userPub && result.username) {
              return result;
            }

            return result;
          }
        } catch (error) {
          // Silenzioso per errori di timeout o rete
          console.debug(
            `Username lookup strategy failed: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
          );
        }
      }

      return null;
    } catch (error) {
      console.debug(
        `Username existence check failed: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      );
      return null;
    }
  }

  /**
   * Logs in a user using direct Gun authentication
   * @param username Username
   * @param password Password
   * @param pair Optional SEA pair for Web3 login
   * @param callback Optional callback for login result
   * @returns Promise resolving to login result
   */
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
    callback?: (result: any) => void,
  ): Promise<any> {
    console.log(`Attempting login for user: ${username}`);

    try {
      // Attempt Gun.js authentication directly first
      // This allows login even if our custom tracking system is out of sync
      const authResult = await new Promise<any>((resolve) => {
        if (pair) {
          this.gun.user().auth(pair, (ack: any) => {
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              console.log(`Login successful for: ${username}`);
              resolve({ success: true, ack });
            }
          });
        } else {
          this.gun.user().auth(username, password, (ack: any) => {
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              console.log(`Login successful for: ${username}`);
              resolve({ success: true, ack });
            }
          });
        }
      });

      if (!authResult.success) {
        // If Gun.js auth fails, the user likely doesn't exist or password is wrong
        const result = {
          success: false,
          error: `User '${username}' not found. Please check your username or register first.`,
        };
        if (callback) callback(result);
        return result;
      }

      const userPub = this.gun.user().is?.pub;

      if (!userPub) {
        const result = {
          success: false,
          error: "Authentication failed: No user pub returned.",
        };
        if (callback) callback(result);
        return result;
      }

      console.log(
        `Gun.js authentication successful for: ${username} (${userPub})`,
      );

      // Pass the userPub to runPostAuthOnAuthResult
      this.runPostAuthOnAuthResult(
        { success: true, userPub: userPub },
        username,
      );

      console.log(`Login completed successfully for: ${username} (${userPub})`);

      // IMPORTANTE: Salva sempre le credenziali dopo un login riuscito
      // Questo è cruciale per Web3 login e session restoration
      try {
        this.savePair();
        console.log(`[gunInstance] Credenziali salvate per: ${username}`);
      } catch (saveError) {
        console.error(
          `[gunInstance] Errore nel salvare le credenziali:`,
          saveError,
        );
        // Non bloccare il login se il salvataggio fallisce
      }

      const result = {
        success: true,
        userPub,
        username,
      };

      if (callback) callback(result);
      return result;
    } catch (error) {
      console.error(`Exception during login for ${username}: ${error}`);
      const result = { success: false, error: String(error) };
      if (callback) callback(result);
      return result;
    }
  }

  /**
   * Updates the user's alias (username) in Gun and saves the updated credentials
   * @param newAlias New alias/username to set
   * @returns Promise resolving to update result
   */
  async updateUserAlias(
    newAlias: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[gunInstance] Updating user alias to: ${newAlias}`);

      const user = this.gun.user();
      if (!user || !user.is) {
        return { success: false, error: "User not authenticated" };
      }

      // Update the alias in Gun's user object
      user.is.alias = newAlias;

      // Save the updated credentials
      this.savePair();

      console.log(
        `[gunInstance] User alias updated successfully to: ${newAlias}`,
      );
      return { success: true };
    } catch (error) {
      console.error(`[gunInstance] Error updating user alias:`, error);
      return { success: false, error: String(error) };
    }
  }

  public savePair(): void {
    try {
      const user = this.gun.user();
      const pair = (user as any)?._?.sea;
      const userInfo = user?.is;

      console.log("[gunInstance] Tentativo di salvataggio credenziali...");
      console.log("[gunInstance] User info:", userInfo);
      console.log("[gunInstance] Pair disponibile:", !!pair);

      if (pair && userInfo) {
        // Save the crypto pair and session info
        const sessionInfo = {
          pub: userInfo.pub,
          alias: userInfo.alias || "",
          timestamp: Date.now(),
        };

        console.log("[gunInstance] Session info da salvare:", sessionInfo);

        // Save to localStorage if available
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem("gun/pair", JSON.stringify(pair));
            localStorage.setItem("gun/session", JSON.stringify(sessionInfo));
            console.log("[gunInstance] Credenziali salvate in localStorage");
          } catch (localError) {
            console.error(
              "[gunInstance] Errore nel salvare in localStorage:",
              localError,
            );
          }
        } else {
          console.warn("[gunInstance] localStorage non disponibile");
        }

        // Also save to sessionStorage for cross-app sharing
        if (typeof sessionStorage !== "undefined") {
          try {
            sessionStorage.setItem("gun/pair", JSON.stringify(pair));
            sessionStorage.setItem("gun/session", JSON.stringify(sessionInfo));
            console.log("[gunInstance] Credenziali salvate in sessionStorage");
          } catch (sessionError) {
            console.error(
              "[gunInstance] Errore nel salvare in sessionStorage:",
              sessionError,
            );
          }
        } else {
          console.warn("[gunInstance] sessionStorage non disponibile");
        }

        console.log(
          `Session saved for user: ${userInfo.alias || userInfo.pub}`,
        );
      } else {
        console.warn(
          "[gunInstance] Impossibile salvare credenziali: pair o userInfo mancanti",
        );
        console.log("[gunInstance] Pair:", pair);
        console.log("[gunInstance] UserInfo:", userInfo);
      }
    } catch (error) {
      console.error("Error saving auth pair and session:", error);
    }
  }

  /**
   * Sets up security questions and password hint
   * @param username Username
   * @param password Current password
   * @param hint Password hint
   * @param securityQuestions Array of security questions
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the operation result
   */
  async setPasswordHint(
    username: string,
    password: string,
    hint: string,
    securityQuestions: string[],
    securityAnswers: string[],
  ): Promise<{ success: boolean; error?: string }> {
    console.log("[gunInstance]  Setting password hint for:", username);

    // Verify that the user is authenticated with password
    const loginResult = await this.login(username, password);
    if (!loginResult.success) {
      return { success: false, error: "Authentication failed" };
    }

    // Check if user was authenticated with password (not with other methods)
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.pub) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Generate a proof of work from security question answers
      const answersText = securityAnswers.join("|");
      let proofOfWork;

      try {
        // Use SEA directly if available
        if (SEA && SEA.work) {
          proofOfWork = await SEA.work(answersText, null, null, {
            name: "SHA-256",
          });
        } else if (this.crypto && this.crypto.hashText) {
          proofOfWork = await this.crypto.hashText(answersText);
        } else {
          throw new Error("Cryptographic functions not available");
        }

        if (!proofOfWork) {
          throw new Error("Failed to generate hash");
        }
      } catch (hashError) {
        console.error("Error generating hash:", hashError);
        return { success: false, error: "Failed to generate security hash" };
      }

      // Encrypt the password hint with the proof of work
      let encryptedHint;
      try {
        if (SEA && SEA.encrypt) {
          encryptedHint = await SEA.encrypt(hint, proofOfWork);
        } else if (this.crypto && this.crypto.encrypt) {
          encryptedHint = await this.crypto.encrypt(hint, proofOfWork);
        } else {
          throw new Error("Encryption functions not available");
        }

        if (!encryptedHint) {
          throw new Error("Failed to encrypt hint");
        }
      } catch (encryptError) {
        console.error("Error encrypting hint:", encryptError);
        return { success: false, error: "Failed to encrypt password hint" };
      }

      // Save to the public graph, readable by anyone but only decryptable with the right answers.
      const userPub = currentUser.pub;
      const securityPayload = {
        questions: JSON.stringify(securityQuestions),
        hint: encryptedHint,
      };

      await new Promise<void>((resolve, reject) => {
        (this.node.get(userPub) as any)
          .get("security")
          .put(securityPayload, (ack: any) => {
            if (ack.err) {
              console.error(
                "Error saving security data to public graph:",
                ack.err,
              );
              reject(new Error(ack.err));
            } else {
              console.log(`Security data saved to public graph for ${userPub}`);
              resolve();
            }
          });
      });

      return { success: true };
    } catch (error) {
      console.error("Error setting password hint:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Recovers password hint using security question answers
   * @param username Username
   * @param securityAnswers Array of answers to security questions
   * @returns Promise resolving with the password hint
   */
  async forgotPassword(
    username: string,
    securityAnswers: string[],
  ): Promise<{ success: boolean; hint?: string; error?: string }> {
    console.log("[gunInstance]  Attempting password recovery for:", username);

    try {
      // Find the user's data
      let userData = await this.checkUsernameExists(username);

      console.log("[gunInstance]  userData", userData);

      // Patch: if userData is a string, treat as pub
      if (typeof userData === "string") {
        userData = { pub: userData, username };
      }

      if (!userData || !userData.pub) {
        return { success: false, error: "User not found" };
      }

      // Extract the public key from user data
      const userPub = userData.pub;
      console.log(`Found user public key for password recovery: ${userPub}`);

      // Access the user's security data directly from their public key node
      const securityData = await new Promise<any>((resolve) => {
        (this.node.get(userPub) as any).get("security").once((data: any) => {
          console.log(
            `Retrieved security data for user ${username}:`,
            data ? "found" : "not found",
          );
          resolve(data);
        });
      });

      if (!securityData || !securityData.hint) {
        return {
          success: false,
          error: "No password hint found",
        };
      }

      // Generate hash from security answers
      const answersText = securityAnswers.join("|");
      let proofOfWork;

      try {
        // Use SEA directly if available
        if (SEA && SEA.work) {
          proofOfWork = await SEA.work(answersText, null, null, {
            name: "SHA-256",
          });
        } else if (this.crypto && this.crypto.hashText) {
          proofOfWork = await this.crypto.hashText(answersText);
        } else {
          throw new Error("Cryptographic functions not available");
        }

        if (!proofOfWork) {
          throw new Error("Failed to generate hash");
        }
      } catch (hashError) {
        console.error("Error generating hash:", hashError);
        return { success: false, error: "Failed to generate security hash" };
      }

      // Decrypt the password hint with the proof of work
      let hint;
      try {
        if (SEA && SEA.decrypt) {
          hint = await SEA.decrypt(securityData.hint, proofOfWork);
        } else if (this.crypto && this.crypto.decrypt) {
          hint = await this.crypto.decrypt(securityData.hint, proofOfWork);
        } else {
          throw new Error("Decryption functions not available");
        }
      } catch (decryptError) {
        return {
          success: false,
          error: "Incorrect answers to security questions",
        };
      }

      if (hint === undefined) {
        return {
          success: false,
          error: "Incorrect answers to security questions",
        };
      }

      return { success: true, hint: hint as string };
    } catch (error) {
      console.error("Error recovering password hint:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Hashes text with Gun.SEA
   * @param text Text to hash
   * @returns Promise that resolves with the hashed text
   */
  async hashText(text: string): Promise<string | any> {
    return this.crypto.hashText(text);
  }

  /**
   * Encrypts data with Gun.SEA
   * @param data Data to encrypt
   * @param key Encryption key
   * @returns Promise that resolves with the encrypted data
   */
  async encrypt(data: any, key: string): Promise<string> {
    return this.crypto.encrypt(data, key);
  }

  /**
   * Decrypts data with Gun.SEA
   * @param encryptedData Encrypted data
   * @param key Decryption key
   * @returns Promise that resolves with the decrypted data
   */
  async decrypt(encryptedData: string, key: string): Promise<string | any> {
    return this.crypto.decrypt(encryptedData, key);
  }

  /**
   * Saves user data at the specified path
   * @param path Path to save the data (supports nested paths like "test/data/marco")
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async putUserData(path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.gun.user();
      if (!user.is) {
        this.emitDataEvent(
          "gun:put",
          `user/${path}`,
          data,
          false,
          "User not authenticated",
        );
        reject(new Error("User not authenticated"));
        return;
      }

      this.navigateToPath(user, path).put(data, (ack: any) => {
        if (ack.err) {
          this.emitDataEvent("gun:put", `user/${path}`, data, false, ack.err);
          reject(new Error(ack.err));
        } else {
          this.emitDataEvent("gun:put", `user/${path}`, data, true);
          resolve(ack);
        }
      });
    });
  }

  /**
   * Gets user data from the specified path
   * @param path Path to get the data from (supports nested paths like "test/data/marco")
   * @returns Promise that resolves with the data
   */
  async getUserData(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Validazione del path
      if (!path || typeof path !== "string") {
        const error = "Path must be a non-empty string";
        this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
        reject(new Error(error));
        return;
      }

      const user = this.gun.user();
      if (!user.is) {
        const error = "User not authenticated";
        this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
        reject(new Error(error));
        return;
      }

      // Timeout per evitare attese infinite
      const timeout = setTimeout(() => {
        const error = "Operation timeout";
        this.emitDataEvent("gun:get", `user/${path}`, null, false, error);
        reject(new Error(error));
      }, 10000); // 10 secondi di timeout

      try {
        this.navigateToPath(user, path).once((data: any) => {
          clearTimeout(timeout);

          // Gestisci i riferimenti GunDB
          if (data && typeof data === "object" && data["#"]) {
            // È un riferimento GunDB, carica i dati effettivi
            const referencePath = data["#"];
            this.navigateToPath(this.gun, referencePath).once(
              (actualData: any) => {
                this.emitDataEvent("gun:get", `user/${path}`, actualData, true);
                resolve(actualData);
              },
            );
          } else {
            // Dati diretti, restituisci così come sono
            this.emitDataEvent("gun:get", `user/${path}`, data, true);
            resolve(data);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        this.emitDataEvent("gun:get", `user/${path}`, null, false, errorMsg);
        reject(error);
      }
    });
  }

  /**
   * Derive cryptographic keys from password and optional extras
   * Supports multiple key derivation algorithms: P-256, secp256k1 (Bitcoin), secp256k1 (Ethereum)
   * @param password - Password or seed for key derivation
   * @param extra - Additional entropy (string or array of strings)
   * @param options - Derivation options to specify which key types to generate
   * @returns Promise resolving to derived keys object
   */
  async derive(
    password: any,
    extra?: any,
    options?: DeriveOptions,
  ): Promise<any> {
    try {
      console.log(
        "[gunInstance]  Deriving cryptographic keys with options:",
        options,
      );

      // Call the derive function with the provided parameters
      const derivedKeys = await derive(password, extra, options);

      console.log("[gunInstance]  Key derivation completed successfully");
      return derivedKeys;
    } catch (error) {
      console.error("Error during key derivation:", error);

      // Use centralized error handler
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "KEY_DERIVATION_FAILED",
        error instanceof Error
          ? error.message
          : "Failed to derive cryptographic keys",
        error,
      );

      throw error;
    }
  }

  /**
   * Derive P-256 keys (default Gun.SEA behavior)
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to P-256 keys
   */
  async deriveP256(password: any, extra?: any): Promise<any> {
    return this.derive(password, extra, { includeP256: true });
  }

  /**
   * Derive Bitcoin secp256k1 keys with P2PKH address
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to Bitcoin keys and address
   */
  async deriveBitcoin(password: any, extra?: any): Promise<any> {
    return this.derive(password, extra, { includeSecp256k1Bitcoin: true });
  }

  /**
   * Derive Ethereum secp256k1 keys with Keccak256 address
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to Ethereum keys and address
   */
  async deriveEthereum(password: any, extra?: any): Promise<any> {
    return this.derive(password, extra, { includeSecp256k1Ethereum: true });
  }

  /**
   * Derive all supported key types
   * @param password - Password for key derivation
   * @param extra - Additional entropy
   * @returns Promise resolving to all key types
   */
  async deriveAll(password: any, extra?: any): Promise<any> {
    return this.derive(password, extra, {
      includeP256: true,
      includeSecp256k1Bitcoin: true,
      includeSecp256k1Ethereum: true,
    });
  }

  /**
   * Creates a frozen space entry for immutable data
   * @param data Data to freeze
   * @param options Optional configuration
   * @returns Promise resolving to the frozen data hash
   */
  async createFrozenSpace(
    data: any,
    options?: {
      namespace?: string;
      path?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ hash: string; fullPath: string; data: any }> {
    return new Promise((resolve, reject) => {
      try {
        // Prepara i dati da congelare
        const frozenData = {
          data: data,
          timestamp: Date.now(),
          description: options?.description || "",
          metadata: options?.metadata || {},
        };

        // Genera hash dei dati usando SEA
        const dataString = JSON.stringify(frozenData);
        SEA.work(
          dataString,
          null,
          null,
          { name: "SHA-256" },
          (hash: string) => {
            if (!hash) {
              reject(new Error("Failed to generate hash for frozen data"));
              return;
            }

            // Costruisci il percorso completo
            const namespace = options?.namespace || "default";
            const customPath = options?.path || "";
            const fullPath = customPath
              ? `${namespace}/${customPath}/${hash}`
              : `${namespace}/${hash}`;

            // Usa navigateToPath per gestire correttamente i percorsi con /
            const targetNode = this.navigateToPath(this.gun, fullPath);

            targetNode.put(frozenData, (ack: any) => {
              if (ack.err) {
                reject(new Error(`Failed to create frozen space: ${ack.err}`));
              } else {
                console.log(
                  `[createFrozenSpace] Created frozen entry: ${fullPath}`,
                );
                resolve({
                  hash: hash,
                  fullPath: fullPath,
                  data: frozenData,
                });
              }
            });
          },
        );
      } catch (error) {
        reject(new Error(`Error creating frozen space: ${error}`));
      }
    });
  }

  /**
   * Retrieves data from frozen space
   * @param hash Hash of the frozen data
   * @param namespace Optional namespace
   * @param path Optional custom path
   * @returns Promise resolving to the frozen data
   */
  async getFrozenSpace(
    hash: string,
    namespace: string = "default",
    path?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Costruisci il percorso completo
      const fullPath = path
        ? `${namespace}/${path}/${hash}`
        : `${namespace}/${hash}`;

      // Usa navigateToPath per gestire correttamente i percorsi con /
      const targetNode = this.navigateToPath(this.gun, fullPath);

      targetNode.once((data: any) => {
        if (!data) {
          reject(new Error(`Frozen data not found: ${fullPath}`));
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Verifies if data matches a frozen space entry
   * @param data Data to verify
   * @param hash Expected hash
   * @param namespace Optional namespace
   * @param path Optional custom path
   * @returns Promise resolving to verification result
   */
  async verifyFrozenSpace(
    data: any,
    hash: string,
    namespace: string = "default",
    path?: string,
  ): Promise<{ verified: boolean; frozenData?: any; error?: string }> {
    try {
      // Genera hash dei dati forniti
      const dataString = JSON.stringify(data);
      const generatedHash = await new Promise<string>((resolve, reject) => {
        SEA.work(
          dataString,
          null,
          null,
          { name: "SHA-256" },
          (hash: string) => {
            if (hash) {
              resolve(hash);
            } else {
              reject(new Error("Failed to generate hash"));
            }
          },
        );
      });

      // Confronta gli hash
      if (generatedHash !== hash) {
        return { verified: false, error: "Hash mismatch" };
      }

      // Verifica che esista nel frozen space
      const frozenData = await this.getFrozenSpace(hash, namespace, path);

      return {
        verified: true,
        frozenData: frozenData,
      };
    } catch (error) {
      return {
        verified: false,
        error: `Verification failed: ${error}`,
      };
    }
  }

  // Errors
  static Errors = GunErrors;
}

export {
  GunInstance,
  SEA,
  Gun,
  GunRxJS,
  crypto,
  GunErrors,
  derive,
  restrictedPut,
};

export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
