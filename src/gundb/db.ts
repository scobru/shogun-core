/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */

import type { UserInfo, AuthCallback, EventData, EventListener } from "./types";
import type {
  IGunUserInstance,
  IGunChain,
  IGunInstance,
  ISEAPair,
  GunMessagePut,
} from "gun/types";

import type { AuthResult, SignUpResult } from "../interfaces/shogun";
import type {
  TransportLayer,
  IUserInstance,
  IChain,
} from "./transport/TransportLayer";
import Gun from "gun/gun";
import SEA from "gun/sea";
import "gun/lib/then";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";
import derive, { DeriveOptions } from "./derive";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";
import { GunDataEventData, GunPeerEventData } from "../interfaces/events";
import { RxJS } from "./rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";

/**
 * Storage Provider Interfaces
 */
export interface StorageProvider {
  name: string;
  save(key: string, data: any): Promise<boolean>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}

export interface SEAStorageProvider extends StorageProvider {
  savePair(userPub: string, pair: ISEAPair): Promise<boolean>;
  loadPair(userPub: string): Promise<ISEAPair | null>;
  removePair(userPub: string): Promise<boolean>;
}

/**
 * GunDB Storage Provider Implementation
 */
class GunDBStorage implements SEAStorageProvider {
  name = "gundb";

  constructor(
    private gun: IGunInstance,
    private node: IGunChain<any>,
  ) {}

  async savePair(userPub: string, pair: ISEAPair): Promise<boolean> {
    try {
      await this.node.get(userPub).get("sea").put(pair).then();
      return true;
    } catch (error) {
      console.error("Error saving pair to GunDB:", error);
      return false;
    }
  }

  async loadPair(userPub: string): Promise<ISEAPair | null> {
    try {
      const pair = await this.node.get(userPub).get("sea").then();
      return pair || null;
    } catch (error) {
      console.error("Error loading pair from GunDB:", error);
      return null;
    }
  }

  async removePair(userPub: string): Promise<boolean> {
    try {
      await this.node.get(userPub).get("sea").put(null).then();
      return true;
    } catch (error) {
      console.error("Error removing pair from GunDB:", error);
      return false;
    }
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      await this.node.get(key).put(data).then();
      return true;
    } catch (error) {
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      return await this.node.get(key).then();
    } catch (error) {
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      await this.node.get(key).put(null).then();
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const data = await this.node.get(key).then();
      return data !== null && data !== undefined;
    } catch (error) {
      return false;
    }
  }
}

/**
 * LocalStorage Provider Implementation
 */
class LocalStorageProvider implements SEAStorageProvider {
  name = "localStorage";
  private prefix = "shogun_";

  async savePair(userPub: string, pair: ISEAPair): Promise<boolean> {
    try {
      const key = `${this.prefix}pair_${userPub}`;
      localStorage.setItem(key, JSON.stringify(pair));
      return true;
    } catch (error) {
      console.error("Error saving pair to localStorage:", error);
      return false;
    }
  }

  async loadPair(userPub: string): Promise<ISEAPair | null> {
    try {
      const key = `${this.prefix}pair_${userPub}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error loading pair from localStorage:", error);
      return null;
    }
  }

  async removePair(userPub: string): Promise<boolean> {
    try {
      const key = `${this.prefix}pair_${userPub}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(`${this.prefix}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(`${this.prefix}${key}`) !== null;
  }
}

/**
 * Multi-Storage Manager
 */
class MultiStorageManager {
  private providers: Map<string, SEAStorageProvider> = new Map();
  private primaryProvider: string = "gundb";

  constructor() {}

  addProvider(provider: SEAStorageProvider): void {
    this.providers.set(provider.name, provider);
  }

  setPrimaryProvider(name: string): void {
    if (this.providers.has(name)) {
      this.primaryProvider = name;
    }
  }

  async savePair(
    userPub: string,
    pair: ISEAPair,
    providers?: string[],
  ): Promise<boolean> {
    const targetProviders = providers || [this.primaryProvider];
    let success = false;

    for (const providerName of targetProviders) {
      const provider = this.providers.get(providerName);
      if (provider) {
        try {
          const result = await provider.savePair(userPub, pair);
          if (result) success = true;
        } catch (error) {
          // Log error but continue with other providers
          console.warn(`Error saving pair to ${providerName}:`, error);
        }
      }
    }

    return success;
  }

  async loadPair(
    userPub: string,
    providers?: string[],
  ): Promise<ISEAPair | null> {
    const targetProviders = providers || [this.primaryProvider];

    for (const providerName of targetProviders) {
      const provider = this.providers.get(providerName);
      if (provider) {
        try {
          const pair = await provider.loadPair(userPub);
          if (pair) return pair;
        } catch (error) {
          // Log error but continue with other providers
          console.warn(`Error loading pair from ${providerName}:`, error);
        }
      }
    }

    return null;
  }

  async removePair(userPub: string, providers?: string[]): Promise<boolean> {
    const targetProviders = providers || [this.primaryProvider];
    let success = false;

    for (const providerName of targetProviders) {
      const provider = this.providers.get(providerName);
      if (provider) {
        try {
          const result = await provider.removePair(userPub);
          if (result) success = true;
        } catch (error) {
          // Log error but continue with other providers
          console.warn(`Error removing pair from ${providerName}:`, error);
        }
      }
    }

    return success;
  }
}

/**
 * Configuration constants for timeouts and security
 */
const CONFIG = {
  TIMEOUTS: {
    USER_DATA_OPERATION: 5000,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SPECIAL_CHARS: false,
  },
} as const;

class DataBase {
  public transport: TransportLayer;
  public user: IUserInstance | null = null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: IChain;

  private readonly onAuthCallbacks: Array<AuthCallback> = [];
  private readonly eventEmitter: EventEmitter;

  // Integrated modules
  private _rxjs?: RxJS;

  // Multi-storage support
  private storageManager: MultiStorageManager;
  private customPairGenerator?: (username: string) => Promise<ISEAPair>;

  constructor(
    transport: TransportLayer,
    appScope: string = "shogun",
    storageConfig?: {
      providers?: SEAStorageProvider[];
      primaryProvider?: string;
      customPairGenerator?: (username: string) => Promise<ISEAPair>;
    },
  ) {
    console.log("[DB] Initializing DataBase with transport:", transport.name);

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Validate transport instance
    if (!transport) {
      throw new Error("Transport layer is required but was not provided");
    }

    if (typeof transport !== "object") {
      throw new Error(
        `Transport layer must be an object, received: ${typeof transport}`,
      );
    }

    if (typeof transport.user !== "function") {
      throw new Error(
        `Transport layer is invalid: transport.user is not a function. Received transport.user type: ${typeof transport.user}`,
      );
    }

    if (typeof transport.get !== "function") {
      throw new Error(
        `Transport layer is invalid: transport.get is not a function. Received transport.get type: ${typeof transport.get}`,
      );
    }

    this.transport = transport;
    console.log("[DB] Transport layer validated");

    // Initialize storage manager
    this.storageManager = new MultiStorageManager();

    // Add default providers
    this.storageManager.addProvider(new LocalStorageProvider());

    // Add custom providers if provided
    if (storageConfig?.providers) {
      storageConfig.providers.forEach((provider) => {
        this.storageManager.addProvider(provider);
      });
    }

    // Set primary provider
    if (storageConfig?.primaryProvider) {
      this.storageManager.setPrimaryProvider(storageConfig.primaryProvider);
    }

    // Set custom pair generator
    this.customPairGenerator = storageConfig?.customPairGenerator;

    // Recall user session if transport supports it
    this.user = this.transport.user().recall({ sessionStorage: true });
    console.log("[DB] User recall completed");

    this.subscribeToAuthEvents();
    console.log("[DB] Auth events subscribed");

    this.crypto = crypto;
    this.sea = SEA;
    this._rxjs = new RxJS(this.transport as any); // Cast for backward compatibility
    this.node = null as unknown as IChain;

    console.log("[DB] DataBase initialization completed");
  }

  /**
   * Initialize the Transport Layer asynchronously
   * This method should be called after construction to perform async operations
   */
  initialize(appScope: string = "shogun"): void {
    console.log(`[DB] Initializing with appScope: ${appScope}`);
    try {
      const sessionResult = this.restoreSession();
      console.log(
        `[DB] Session restore result: ${sessionResult.success ? "success" : "failed"}`,
      );

      this.node = this.transport.get(appScope);
      console.log("[DB] App scope node initialized");

      // Add GunDB storage provider if using Gun transport
      if (this.transport.name === "gundb") {
        const gunTransport = this.transport as any;
        this.storageManager.addProvider(
          new GunDBStorage(gunTransport.getGunInstance(), this.node as any),
        );
      }

      if (sessionResult.success) {
        console.log("[DB] Session automatically restored");
      } else {
        console.log("[DB] No previous session to restore");
      }
    } catch (error) {
      console.error("[DB] Error during automatic session restoration:", error);
    }
  }

  private subscribeToAuthEvents() {
    // Only subscribe to auth events if transport supports events
    if (this.transport.on) {
      this.transport.on("auth", (ack: any) => {
        // Auth event received
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
  }

  private notifyAuthListeners(pub: string): void {
    const user = this.transport.user();
    this.onAuthCallbacks.forEach((cb) => cb(user as any)); // Cast for backward compatibility
  }

  /**
   * Adds a new peer to the network (Gun-specific)
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    console.log(`[PEER] Adding peer: ${peer}`);

    // Only add peers if using Gun transport
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      gunTransport.addPeer(peer);
      console.log(`[PEER] Peer added successfully`);
    } else {
      console.log(
        `[PEER] Peer management not supported by ${this.transport.name} transport`,
      );
    }
  }

  /**
   * Removes a peer from the network (Gun-specific)
   * @param peer URL of the peer to remove
   */
  removePeer(peer: string): void {
    console.log(`[PEER] Removing peer: ${peer}`);

    // Only remove peers if using Gun transport
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      gunTransport.removePeer(peer);
      console.log(`[PEER] Peer removed successfully`);
    } else {
      console.log(
        `[PEER] Peer management not supported by ${this.transport.name} transport`,
      );
    }
  }

  /**
   * Gets the list of currently connected peers (Gun-specific)
   * @returns Array of peer URLs
   */
  getCurrentPeers(): string[] {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      return gunTransport.getCurrentPeers();
    }
    return [];
  }

  /**
   * Gets the list of all configured peers (Gun-specific)
   * @returns Array of peer URLs
   */
  getAllConfiguredPeers(): string[] {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      return gunTransport.getAllConfiguredPeers();
    }
    return [];
  }

  /**
   * Gets detailed information about all peers (Gun-specific)
   * @returns Object with peer information
   */
  getPeerInfo(): { [peer: string]: { connected: boolean; status: string } } {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      return gunTransport.getPeerInfo();
    }
    return {};
  }

  /**
   * Reconnects to a specific peer (Gun-specific)
   * @param peer URL of the peer to reconnect
   */
  reconnectToPeer(peer: string): void {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      gunTransport.reconnectToPeer(peer);
    } else {
      console.log(
        `[PEER] Peer reconnection not supported by ${this.transport.name} transport`,
      );
    }
  }

  /**
   * Clears all peers and optionally adds new ones (Gun-specific)
   * @param newPeers Optional array of new peers to add
   */
  resetPeers(newPeers?: string[]): void {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      gunTransport.resetPeers(newPeers);
    } else {
      console.log(
        `[PEER] Peer reset not supported by ${this.transport.name} transport`,
      );
    }
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: AuthCallback): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.transport.user();
    if (user && user.is) callback(user as any); // Cast for backward compatibility
    return () => {
      const i = this.onAuthCallbacks.indexOf(callback);
      if (i !== -1) this.onAuthCallbacks.splice(i, 1);
    };
  }

  /**
   * Helper method to navigate to a nested path by splitting and chaining .get() calls
   * @param node Starting chain node
   * @param path Path string (e.g., "test/data/marco")
   * @returns Chain node at the specified path
   */
  private navigateToPath(node: IChain, path: string): IChain {
    if (!path || typeof path !== "string") return node as IChain;

    // Split path by '/' and filter out empty segments
    const pathSegments = path
      .split("/")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    // Chain .get() calls for each path segment
    let currentNode: IChain = node as IChain;
    for (const segment of pathSegments) {
      currentNode = currentNode.get(segment);
    }
    return currentNode;
  }

  /**
   * Gets the transport layer instance
   * @returns Transport layer instance
   */
  getTransport(): TransportLayer {
    return this.transport;
  }

  /**
   * Gets the Gun instance (for backward compatibility)
   * @returns Gun instance if using Gun transport, null otherwise
   */
  getGun(): IGunInstance | null {
    if (this.transport.name === "gundb") {
      const gunTransport = this.transport as any;
      return gunTransport.getGunInstance();
    }
    return null;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): UserInfo | null {
    try {
      const _user = this.transport.user();
      return _user?.is?.pub
        ? {
            pub: _user?.is?.pub!,
            epub: _user?.is?.epub,
            alias: _user?.is?.alias as string | undefined,
            user: _user as any, // Cast for backward compatibility
          }
        : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): IUserInstance {
    return this.transport.user();
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Chain node
   */
  get(path: string): IChain {
    return this.navigateToPath(this.node, path);
  }

  /**
   * Gets data at the specified path (one-time read)
   * @param path Path to get the data from
   * @returns Promise resolving to the data
   */
  async getData(path: string): Promise<any> {
    const node = this.navigateToPath(this.node, path);
    return new Promise<any>((resolve, reject) => {
      node.once((data: any) => {
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
    const node = this.navigateToPath(this.node, path);
    return await node.put(data);
  }

  /**
   * Sets data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async set(path: string, data: any): Promise<any> {
    const node = this.navigateToPath(this.node, path);
    return await node.set(data);
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<any> {
    const node = this.navigateToPath(this.node, path);
    return await node.put(null);
  }

  /**
   * Checks if a user is currently logged in
   * @returns True if logged in
   */
  isLoggedIn(): boolean {
    try {
      const user = this.transport.user();
      return !!(user && user.is && user.is.pub);
    } catch (error) {
      console.error("Error checking login status:", error);
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

      // Check for session data in sessionStorage first (new format)
      let sessionData = sessionStorage.getItem("gunSessionData");

      if (!sessionData) {
        // Fallback to old localStorage format
        const sessionInfo = localStorage.getItem("gun/session");
        const pairInfo = localStorage.getItem("gun/pair");

        if (!sessionInfo || !pairInfo) {
          // No saved session found
          return { success: false, error: "No saved session" };
        }

        let session, pair;
        try {
          session = JSON.parse(sessionInfo);
          pair = JSON.parse(pairInfo);
        } catch (parseError) {
          console.error("Error parsing session data:", parseError);
          // Clear corrupted data
          localStorage.removeItem("gun/session");
          localStorage.removeItem("gun/pair");
          return { success: false, error: "Corrupted session data" };
        }

        // Convert old format to new format
        sessionData = JSON.stringify({
          username: session.username,
          pair: pair,
          userPub: session.userPub,
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      let session;
      try {
        session = JSON.parse(sessionData);
      } catch (parseError) {
        console.error("Error parsing session data:", parseError);
        // Clear corrupted data
        sessionStorage.removeItem("gunSessionData");
        return { success: false, error: "Corrupted session data" };
      }

      // Validate session data structure
      if (!session.username || !session.userPub) {
        // Invalid session data, clearing storage
        sessionStorage.removeItem("gunSessionData");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Incomplete session data" };
      }

      // Check if session is expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        // Session expired, clearing storage
        sessionStorage.removeItem("gunSessionData");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session expired" };
      }

      // Attempt to restore user session
      try {
        const userInstance = this.transport.user();
        if (!userInstance) {
          console.error("Transport user instance not available");
          sessionStorage.removeItem("gunSessionData");
          localStorage.removeItem("gun/session");
          localStorage.removeItem("gun/pair");
          return {
            success: false,
            error: "Transport user instance not available",
          };
        }

        // Set the user pair if available
        if (session.pair) {
          try {
            (userInstance as any)._ = { ...userInstance._, sea: session.pair };
          } catch (pairError) {
            console.error("Error setting user pair:", pairError);
          }
        }

        // Attempt to recall user session
        try {
          if (
            typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("pair")
          ) {
            const recallResult = userInstance.recall({ sessionStorage: true });
          } else {
            const recallResult = userInstance;
          }
        } catch (recallError) {
          console.error("Error during recall:", recallError);
        }

        // Verify session restoration success
        if (userInstance.is && userInstance.is.pub === session.userPub) {
          this.user = userInstance;
          // Session restored successfully for user
          return {
            success: true,
            userPub: session.userPub,
          };
        } else {
          // Session restoration verification failed
          sessionStorage.removeItem("gunSessionData");
          localStorage.removeItem("gun/session");
          localStorage.removeItem("gun/pair");
          return { success: false, error: "Session verification failed" };
        }
      } catch (error) {
        console.error(`Error restoring session: ${error}`);
        return {
          success: false,
          error: `Session restoration failed: ${error}`,
        };
      }
    } catch (mainError) {
      console.error(`Error in restoreSession: ${mainError}`);
      return {
        success: false,
        error: `Session restoration failed: ${mainError}`,
      };
    }

    return { success: false, error: "No session data available" };
  }

  /**
   * Aggiunge un nuovo provider di storage
   */
  addStorageProvider(provider: SEAStorageProvider): void {
    this.storageManager.addProvider(provider);
  }

  /**
   * Imposta il provider primario per lo storage
   */
  setPrimaryStorageProvider(name: string): void {
    this.storageManager.setPrimaryProvider(name);
  }

  /**
   * Ottiene la lista dei provider di storage disponibili
   */
  getStorageProviders(): string[] {
    return Array.from(this.storageManager["providers"].keys());
  }

  /**
   * Salva un pair in storage specifici
   */
  async savePairToStorage(
    userPub: string,
    pair: ISEAPair,
    providers?: string[],
  ): Promise<boolean> {
    return await this.saveUserPair(userPub, pair, providers);
  }

  /**
   * Carica un pair da storage specifici
   */
  async loadPairFromStorage(
    userPub: string,
    providers?: string[],
  ): Promise<ISEAPair | null> {
    return await this.loadUserPair(userPub, providers);
  }

  /**
   * Rimuove un pair da storage specifici
   */
  async removePairFromStorage(
    userPub: string,
    providers?: string[],
  ): Promise<boolean> {
    return await this.storageManager.removePair(userPub, providers);
  }

  logout(): void {
    try {
      const currentUser = this.transport.user();
      if (!currentUser || !currentUser.is) {
        return;
      }

      // Log out user
      try {
        currentUser.leave();
      } catch (logoutError) {
        console.error("Error during logout:", logoutError);
      }

      // Clear user reference
      this.user = null;

      // Clear local session data
      try {
        // Clear session data if needed
      } catch (error) {
        console.error("Error clearing local session data:", error);
      }

      // Clear session storage
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("gunSessionData");
          // Session storage cleared
        }
      } catch (error) {
        console.error("Error clearing session storage:", error);
      }

      // Logout completed successfully
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  /**
   * Accesses the RxJS module for reactive programming
   * @returns GunRxJS instance
   */
  rx(): RxJS {
    return this._rxjs as RxJS;
  }

  /**
   * Validates password strength according to security requirements
   */
  private validatePasswordStrength(password: string): {
    valid: boolean;
    error?: string;
  } {
    if (password.length < CONFIG.PASSWORD.MIN_LENGTH) {
      return {
        valid: false,
        error: `Password must be at least ${CONFIG.PASSWORD.MIN_LENGTH} characters long`,
      };
    }

    const validations = [];

    if (CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      validations.push("uppercase letter");
    }

    if (CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      validations.push("lowercase letter");
    }

    if (CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      validations.push("number");
    }

    if (
      CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      validations.push("special character");
    }

    if (validations.length > 0) {
      return {
        valid: false,
        error: `Password must contain at least one: ${validations.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates signup credentials with enhanced security
   */
  private validateSignupCredentials(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): { valid: boolean; error?: string } {
    // Validate username
    if (!username || username.length < 1) {
      return {
        valid: false,
        error: "Username must be more than 0 characters long!",
      };
    }

    // Validate username format (alphanumeric and some special chars only)
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return {
        valid: false,
        error:
          "Username can only contain letters, numbers, dots, underscores, and hyphens",
      };
    }

    // If using pair authentication, skip password validation
    if (pair) {
      if (
        !(pair as ISEAPair).pub ||
        !(pair as ISEAPair).priv ||
        !(pair as ISEAPair).epub ||
        !(pair as ISEAPair).epriv
      ) {
        return {
          valid: false,
          error: "Invalid pair provided",
        };
      }

      if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        return {
          valid: false,
          error: "Invalid pair provided",
        };
      }

      return { valid: true };
    }

    // Validate password strength
    return this.validatePasswordStrength(password);
  }

  /**
   * Genera un nuovo pair SEA personalizzato
   */
  private async generateCustomPair(username: string): Promise<ISEAPair> {
    if (this.customPairGenerator) {
      return await this.customPairGenerator(username);
    }

    // Fallback to standard SEA pair generation
    return await SEA.pair();
  }

  /**
   * Salva il pair in tutti gli storage configurati
   */
  private async saveUserPair(
    userPub: string,
    pair: ISEAPair,
    storageProviders?: string[],
  ): Promise<boolean> {
    return await this.storageManager.savePair(userPub, pair, storageProviders);
  }

  /**
   * Carica il pair da qualsiasi storage disponibile
   */
  private async loadUserPair(
    userPub: string,
    storageProviders?: string[],
  ): Promise<ISEAPair | null> {
    return await this.storageManager.loadPair(userPub, storageProviders);
  }

  /**
   * Creates a new user in Gun
   */
  private async createNewUser(
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; userPub?: string }> {
    return new Promise<{ success: boolean; error?: string; userPub?: string }>(
      (resolve) => {
        // Validate inputs before creating user
        if (
          !username ||
          typeof username !== "string" ||
          username.trim().length === 0
        ) {
          resolve({ success: false, error: "Invalid username provided" });
          return;
        }

        if (
          !password ||
          typeof password !== "string" ||
          password.length === 0
        ) {
          resolve({ success: false, error: "Invalid password provided" });
          return;
        }

        // Normalize username
        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername.length === 0) {
          resolve({
            success: false,
            error: "Username cannot be empty",
          });
          return;
        }

        this.transport
          .user()
          .create(normalizedUsername, password, (ack: any) => {
            if (ack.err) {
              console.error(`User creation error: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Validate that we got a userPub from creation
              const userPub = ack.pub;
              if (
                !userPub ||
                typeof userPub !== "string" ||
                userPub.trim().length === 0
              ) {
                console.error(
                  "User creation successful but no userPub returned:",
                  ack,
                );
                resolve({
                  success: false,
                  error: "User creation successful but no userPub returned",
                });
              } else {
                resolve({ success: true, userPub: userPub });
              }
            }
          });
      },
    );
  }

  /**
   * Authenticates user after creation
   */
  private async authenticateNewUser(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<{ success: boolean; error?: string; userPub?: string }> {
    return new Promise<{ success: boolean; error?: string; userPub?: string }>(
      (resolve) => {
        // Validate inputs before authentication
        if (
          !username ||
          typeof username !== "string" ||
          username.trim().length === 0
        ) {
          resolve({ success: false, error: "Invalid username provided" });
          return;
        }

        // Skip password validation when using pair authentication
        if (
          !pair &&
          (!password || typeof password !== "string" || password.length === 0)
        ) {
          resolve({ success: false, error: "Invalid password provided" });
          return;
        }

        // Normalize username to match what was used in creation
        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername.length === 0) {
          resolve({
            success: false,
            error: "Username cannot be empty",
          });
          return;
        }

        if (pair) {
          this.transport.user().auth(pair, (ack: any) => {
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Add a small delay to ensure user state is properly set
              setTimeout(() => {
                // Extract userPub from multiple possible sources
                const userPub =
                  ack.pub || this.transport.user().is?.pub || ack.user?.pub;

                if (!userPub) {
                  console.error(
                    "Authentication successful but no userPub found",
                  );
                  resolve({
                    success: false,
                    error: "No userPub returned from authentication",
                  });
                } else {
                  resolve({ success: true, userPub: userPub });
                }
              }, 100);
            }
          });
        } else {
          this.transport
            .user()
            .auth(normalizedUsername, password, (ack: any) => {
              if (ack.err) {
                console.error(
                  `Authentication after creation failed: ${ack.err}`,
                );
                resolve({ success: false, error: ack.err });
              } else {
                // Add a small delay to ensure user state is properly set
                setTimeout(() => {
                  // Extract userPub from multiple possible sources
                  const userPub =
                    ack.pub || this.transport.user().is?.pub || ack.user?.pub;

                  if (!userPub) {
                    console.error(
                      "Authentication successful but no userPub found",
                    );
                    resolve({
                      success: false,
                      error: "No userPub returned from authentication",
                    });
                  } else {
                    resolve({ success: true, userPub: userPub });
                  }
                }, 100);
              }
            });
        }
      },
    );
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
  ): Promise<SignUpResult> {
    console.log(
      `[DEBUG] DataBase.signUp called for username: ${username}, hasPair: ${!!pair}`,
    );
    try {
      // Validate credentials with enhanced security
      const validation = this.validateSignupCredentials(
        username,
        password,
        pair,
      );
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      let createResult;

      if (pair) {
        // For Web3/plugin authentication, use pair-based creation
        createResult = await this.createNewUserWithPair(username, pair);
      } else {
        // For password authentication, use standard creation
        createResult = await this.createNewUser(username, password);
      }

      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }

      // Add a small delay to ensure user is properly registered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Authenticate the newly created user
      const authResult = await this.authenticateNewUser(
        username,
        password,
        pair,
      );

      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      // Validate that we have a userPub
      if (
        !authResult.userPub ||
        typeof authResult.userPub !== "string" ||
        authResult.userPub.trim().length === 0
      ) {
        console.error(
          "Authentication successful but no valid userPub returned:",
          authResult,
        );
        return {
          success: false,
          error: "Authentication successful but no valid userPub returned",
        };
      }

      // Set the user instance
      this.user = this.transport.user();

      console.log(
        `[SIGNUP] Signup completed successfully for user: ${username}`,
      );

      // Return the signup result
      return {
        success: true,
        userPub: authResult.userPub,
        username: username,
        isNewUser: true,
        sea: (this.transport.user() as any)?._?.sea
          ? {
              pub: (this.transport.user() as any)._?.sea.pub,
              priv: (this.transport.user() as any)._?.sea.priv,
              epub: (this.transport.user() as any)._?.sea.epub,
              epriv: (this.transport.user() as any)._?.sea.epriv,
            }
          : undefined,
      };
    } catch (error) {
      console.error(`Exception during signup for ${username}: ${error}`);
      return { success: false, error: `Signup failed: ${error}` };
    }
  }

  /**
   * Creates a new user in Gun with pair-based authentication (for Web3/plugins)
   */
  private async createNewUserWithPair(
    username: string,
    pair: ISEAPair,
  ): Promise<{ success: boolean; error?: string; userPub?: string }> {
    return new Promise<{ success: boolean; error?: string; userPub?: string }>(
      (resolve) => {
        // Validate inputs before creating user
        if (
          !username ||
          typeof username !== "string" ||
          username.trim().length === 0
        ) {
          resolve({ success: false, error: "Invalid username provided" });
          return;
        }

        if (!pair || !pair.pub || !pair.priv) {
          resolve({ success: false, error: "Invalid pair provided" });
          return;
        }

        // Normalize username
        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername.length === 0) {
          resolve({
            success: false,
            error: "Username cannot be empty",
          });
          return;
        }

        // For pair-based authentication, we don't need to call gun.user().create()
        // because the pair already contains the cryptographic credentials
        // We just need to validate that the pair is valid and return success

        resolve({ success: true, userPub: pair.pub });
      },
    );
  }

  /**
   * Updates user's last seen timestamp
   * @param userPub User's public key
   */
  async updateUserLastSeen(userPub: string): Promise<void> {
    try {
      if (!userPub || typeof userPub !== "string") {
        return;
      }

      const timestamp = Date.now();

      // Update in user registry
      try {
        await this.node
          .get("users")
          .get(userPub)
          .get("lastSeen")
          .put(timestamp)
          .then();
      } catch (error) {
        console.error(`Failed to update lastSeen in user registry:`, error);
      }

      // Update in user's own node
      try {
        await this.transport.get(userPub).get("lastSeen").put(timestamp);
      } catch (error) {
        console.error(`Failed to update lastSeen in user node:`, error);
      }
    } catch (error) {
      console.error(`Error updating user last seen for ${userPub}:`, error);
    }
  }

  /**
   * Performs authentication with Gun
   */
  private async performAuthentication(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<{ success: boolean; error?: string; ack?: any }> {
    console.log(
      `[DEBUG] performAuthentication called for username: ${username}, hasPair: ${!!pair}`,
    );

    return new Promise<{ success: boolean; error?: string; ack?: any }>(
      (resolve) => {
        if (pair) {
          console.log(`[DEBUG] Authenticating with pair for user: ${username}`);
          this.transport.user().auth(pair, (ack: any) => {
            console.log(`[DEBUG] Pair auth callback received:`, ack);
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, ack });
            }
          });
        } else {
          console.log(
            `[DEBUG] Authenticating with username/password for user: ${username}`,
          );
          this.transport.user().auth(username, password, (ack: any) => {
            console.log(
              `[DEBUG] Username/password auth callback received:`,
              ack,
            );
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, ack });
            }
          });
        }
      },
    );
  }

  /**
   * Builds login result object
   */
  private buildLoginResult(username: string, userPub: string): AuthResult {
    // Get the SEA pair from the user object
    const seaPair = (this.transport.user() as any)?._?.sea;

    return {
      success: true,
      userPub,
      username,
      // Include SEA pair for consistency with AuthResult interface
      sea: seaPair
        ? {
            pub: seaPair.pub,
            priv: seaPair.priv,
            epub: seaPair.epub,
            epriv: seaPair.epriv,
          }
        : undefined,
    };
  }

  /**
   * Performs login with username and password
   * @param username Username
   * @param password Password
   * @param pair SEA pair (optional)
   * @returns Promise resolving to AuthResult object
   */
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
    console.log(
      `[DEBUG] DataBase.login called for username: ${username}, hasPair: ${!!pair}`,
    );
    try {
      const loginResult = await this.performAuthentication(
        username,
        password,
        pair,
      );

      if (!loginResult.success) {
        return {
          success: false,
          error: `User '${username}' not found. Please check your username or register first.`,
        };
      }

      // Add a small delay to ensure user state is properly set
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userPub = this.transport.user().is?.pub;

      let alias = this.transport.user().is?.alias as string;
      let userPair = (this.transport.user() as any)?._?.sea as ISEAPair;

      if (!alias) {
        alias = username;
      }

      if (!userPub) {
        return {
          success: false,
          error: "Authentication failed: No user pub returned.",
        };
      }

      console.log(`[LOGIN] Login completed successfully for user: ${username}`);

      // Update user's last seen timestamp
      try {
        await this.updateUserLastSeen(userPub);
      } catch (lastSeenError) {
        console.error(`Error updating last seen: ${lastSeenError}`);
        // Continue with login even if last seen update fails
      }

      // Save credentials for future sessions
      try {
        const userInfo = {
          alias: username,
          pair: pair ?? userPair,
          userPub: userPub,
        };

        this.saveCredentials(userInfo);
      } catch (saveError) {
        console.error(`Error saving credentials:`, saveError);
      }

      return this.buildLoginResult(username, userPub);
    } catch (error) {
      console.error(`Exception during login for ${username}: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Performs login with GunDB pair directly
   * @param username Username
   * @param pair SEA pair
   * @returns Promise resolving to AuthResult object
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
    try {
      const loginResult = await this.performAuthentication(username, "", pair);
      if (!loginResult.success) {
        return {
          success: false,
          error: `User '${username}' not found. Please check your username or register first.`,
        };
      }

      console.log(`[LOGIN] Login with pair completed for user: ${username}`);

      try {
        await this.updateUserLastSeen(pair.pub);
      } catch (lastSeenError) {
        console.error(`Error updating last seen: ${lastSeenError}`);
        // Continue with login even if last seen update fails
      }

      return this.buildLoginResult(
        username,
        this.transport.user().is?.pub || "",
      );
    } catch (error) {
      console.error(`Exception during login with pair: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Versione modificata di createNewUser che usa storage personalizzato
   */
  private async createNewUserWithCustomStorage(
    username: string,
    password: string,
    storageProviders?: string[],
  ): Promise<{
    success: boolean;
    error?: string;
    userPub?: string;
    pair?: ISEAPair;
  }> {
    return new Promise(async (resolve) => {
      try {
        // Genera pair personalizzato
        const pair = await this.generateCustomPair(username);

        // Crea utente senza chiamare gun.user().create() automaticamente
        // Invece, gestisci manualmente la creazione
        const normalizedUsername = username.trim().toLowerCase();

        // Salva il pair negli storage specificati
        const saveResult = await this.saveUserPair(
          pair.pub,
          pair,
          storageProviders,
        );

        if (!saveResult) {
          resolve({ success: false, error: "Failed to save user pair" });
          return;
        }

        // Ora crea l'utente in GunDB con il pair personalizzato
        this.transport
          .user()
          .create(normalizedUsername, password, (ack: any) => {
            if (ack.err) {
              resolve({ success: false, error: ack.err });
            } else {
              resolve({
                success: true,
                userPub: ack.pub || pair.pub,
                pair: pair,
              });
            }
          });
      } catch (error) {
        resolve({ success: false, error: String(error) });
      }
    });
  }

  /**
   * Versione modificata di signUp che supporta storage multipli
   */
  async signUpWithCustomStorage(
    username: string,
    password: string,
    options?: {
      storageProviders?: string[];
      skipGunDBCreation?: boolean;
    },
  ): Promise<SignUpResult> {
    console.log(
      `[DEBUG] signUpWithCustomStorage called for username: ${username}`,
    );

    try {
      const validation = this.validateSignupCredentials(username, password);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Genera pair personalizzato
      const pair = await this.generateCustomPair(username);

      // Salva pair negli storage specificati
      const saveResult = await this.saveUserPair(
        pair.pub,
        pair,
        options?.storageProviders,
      );

      if (!saveResult) {
        return { success: false, error: "Failed to save user credentials" };
      }

      let createResult;

      if (options?.skipGunDBCreation) {
        // Solo salva il pair, non crea utente in GunDB
        createResult = { success: true, userPub: pair.pub, pair: pair };
      } else {
        // Crea utente anche in GunDB
        createResult = await this.createNewUserWithCustomStorage(
          username,
          password,
          options?.storageProviders,
        );
      }

      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }

      // Autentica l'utente
      const authResult = await this.authenticateNewUser(
        username,
        password,
        pair,
      );

      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      this.user = this.transport.user();

      return {
        success: true,
        userPub: authResult.userPub || pair.pub,
        username: username,
        isNewUser: true,
        sea: pair,
      };
    } catch (error) {
      console.error(`Exception during custom signup for ${username}: ${error}`);
      return { success: false, error: `Signup failed: ${error}` };
    }
  }

  /**
   * Login che carica pair da storage personalizzato
   */
  async loginWithCustomStorage(
    username: string,
    password: string,
    options?: {
      storageProviders?: string[];
      loadPairFromStorage?: boolean;
    },
  ): Promise<AuthResult> {
    console.log(
      `[DEBUG] loginWithCustomStorage called for username: ${username}`,
    );

    try {
      let pair: ISEAPair | null = null;

      // Se richiesto, carica pair da storage personalizzato
      if (options?.loadPairFromStorage) {
        // Prima trova il userPub dell'utente
        const normalizedUsername = username.trim().toLowerCase();
        const userPub = await this.node
          .get("usernames")
          .get(normalizedUsername)
          .then();

        if (userPub) {
          pair = await this.loadUserPair(userPub, options?.storageProviders);
        }
      }

      // Esegui autenticazione
      const loginResult = await this.performAuthentication(
        username,
        password,
        pair,
      );

      if (!loginResult.success) {
        return {
          success: false,
          error: `User '${username}' not found. Please check your username or register first.`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const userPub = this.transport.user().is?.pub;
      const alias = (this.transport.user().is?.alias as string) || username;

      if (!userPub) {
        return {
          success: false,
          error: "Authentication failed: No user pub returned.",
        };
      }

      // Aggiorna last seen
      try {
        await this.updateUserLastSeen(userPub);
      } catch (lastSeenError) {
        console.error(`Error updating last seen: ${lastSeenError}`);
      }

      // Salva credenziali se necessario
      if (pair) {
        try {
          const userInfo = {
            alias: username,
            pair: pair,
            userPub: userPub,
          };
          this.saveCredentials(userInfo);
        } catch (saveError) {
          console.error(`Error saving credentials:`, saveError);
        }
      }

      return this.buildLoginResult(username, userPub);
    } catch (error) {
      console.error(`Exception during custom login for ${username}: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  private saveCredentials(userInfo: {
    alias: string;
    pair: ISEAPair;
    userPub: string;
  }): void {
    try {
      const sessionInfo = {
        username: userInfo.alias,
        pair: userInfo.pair,
        userPub: userInfo.userPub,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      if (typeof sessionStorage !== "undefined") {
        // Save session data directly (unencrypted)
        sessionStorage.setItem("gunSessionData", JSON.stringify(sessionInfo));
      }
    } catch (error) {
      console.error(`Error saving credentials: ${error}`);
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
  async setPasswordHintWithSecurity(
    username: string,
    password: string,
    hint: string,
    securityQuestions: string[],
    securityAnswers: string[],
  ): Promise<{ success: boolean; error?: string }> {
    // Setting password hint for

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

      const ack = await (this.node.get(userPub) as any)
        .get("security")
        .put(securityPayload);

      if (ack.err) {
        console.error("Error saving security data to public graph:", ack.err);
        throw new Error(ack.err);
      }

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
    // Attempting password recovery for

    try {
      // Find the user's data using direct lookup
      const normalizedUsername = username.trim().toLowerCase();
      const userPub =
        (await this.node.get("usernames").get(normalizedUsername).then()) ||
        null;

      if (!userPub) {
        return { success: false, error: "User not found" };
      }

      // Access the user's security data directly from their public key node
      const securityData = await (this.node.get(userPub) as any).get(
        "security",
      );

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

  // Errors
  static Errors = GunErrors;

  /**
   * Adds an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  on(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Removes an event listener
   * @param event Event name
   * @param listener Event listener function
   */
  off(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Adds a one-time event listener
   * @param event Event name
   * @param listener Event listener function
   */
  once(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Emits an event
   * @param event Event name
   * @param data Event data
   */
  emit(event: string | symbol, data?: EventData): boolean {
    return this.eventEmitter.emit(event, data);
  }

  /**
   * Recall user session
   */
  public recall(options?: { sessionStorage?: boolean }): void {
    if (this.user) {
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("pair")
      ) {
        this.user.recall({ sessionStorage: true });
      } else {
        this.user;
      }
    }
  }

  /**
   * Leave user session
   */
  public leave(): void {
    if (this.user) {
      this.user.leave();
    }
  }

  /**
   * Set user data
   */
  public setUserData(data: any): void {
    if (this.user) {
      this.user.put(data);
    }
  }

  /**
   * Set password hint
   */
  public setPasswordHint(hint: string): void {
    if (this.user) {
      try {
        this.user.get("passwordHint").put(hint);
      } catch (error) {
        // Handle case where user.get returns undefined
        console.warn("Could not set password hint:", error);
      }
    }
  }

  /**
   * Get password hint
   */
  public getPasswordHint(): string | null {
    if (this.user) {
      // Access passwordHint from user data, not from is object
      return (this.user as any).passwordHint || null;
    }
    return null;
  }

  /**
   * Save session to storage
   */
  public saveSession(session: any): void {
    if (this.user) {
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("pair")
      ) {
        this.user.recall({ sessionStorage: true });
      } else {
        this.user;
      }
    }
  }

  /**
   * Load session from storage
   */
  public loadSession(): any {
    if (this.user) {
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("pair")
      ) {
        return this.user.recall({ sessionStorage: true });
      } else {
        return this.user;
      }
    }
    return null;
  }

  /**
   * Clear session
   */
  public clearSession(): void {
    if (this.user) {
      this.user.leave();
    }
  }

  /**
   * Get app scope
   */
  public getAppScope(): string {
    return (this.node as any)?._?.soul || "shogun";
  }

  /**
   * Get user public key
   */
  public getUserPub(): string | null {
    if (this.user) {
      return this.user.is?.pub || null;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.user?.is?.pub ? true : false;
  }
}

const createGun = (config: any) => {
  const gunInstance = Gun(config);
  return gunInstance;
};

export {
  Gun,
  DataBase,
  SEA,
  RxJS,
  crypto,
  GunErrors,
  derive,
  createGun,
  GunDBStorage,
  LocalStorageProvider,
  MultiStorageManager,
};

// Export transport layer components
export type {
  TransportLayer,
  IUserInstance,
  IChain,
  TransportConfig,
} from "./transport/TransportLayer";
export { TransportFactory } from "./transport/TransportLayer";

export { GunTransport } from "./transport/GunTransport";
export { SqliteTransport } from "./transport/SqliteTransport";
export { PostgresqlTransport } from "./transport/PostgresqlTransport";
export { MongodbTransport } from "./transport/MongodbTransport";

export default Gun;

export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
