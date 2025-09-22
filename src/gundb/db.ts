/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */

import type {
  GunUser,
  UserInfo,
  AuthCallback,
  GunData,
  GunNode,
  EventData,
  EventListener,
  GunOperationResult,
} from "./types";
import type { GunInstance, GunUserInstance, GunChain } from "./types";

import type { AuthResult, SignUpResult } from "../interfaces/shogun";

import Gun from "gun/gun";
import SEA from "gun/sea";

import "gun/lib/then";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";

import derive, { DeriveOptions } from "./derive";

import type { ISEAPair } from "gun/types";

import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";
import { GunDataEventData, GunPeerEventData } from "../interfaces/events";
import { RxJS } from "./rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";

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
  public gun: GunInstance;
  public user: GunUserInstance | null = null;
  public crypto: typeof crypto;
  public sea: typeof SEA;
  public node: GunChain;

  private readonly onAuthCallbacks: Array<AuthCallback> = [];
  private readonly eventEmitter: EventEmitter;

  // Integrated modules
  private _rxjs?: RxJS;

  constructor(gun: GunInstance, appScope: string = "shogun") {
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

    this.node = null as any;

    this._rxjs = new RxJS(this.gun);
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
        // Session automatically restored
      } else {
        // No previous session to restore
      }
    } catch (error) {
      console.error("Error during automatic session restoration:", error);
    }
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
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

  private notifyAuthListeners(pub: string): void {
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Adds a new peer to the network
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
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
          `Gun database reset with ${newPeers ? newPeers.length : 0} peers: ${newPeers ? newPeers.join(", ") : "none"}`,
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
  onAuth(callback: AuthCallback): () => void {
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
  private navigateToPath(node: GunNode, path: string): GunNode {
    if (!path || typeof path !== "string") return node;

    // Sanitize path to remove any control characters or invalid characters
    const sanitizedPath = path
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/[^\w\-._/]/g, "") // Only allow alphanumeric, hyphens, dots, underscores, and slashes
      .trim();

    if (!sanitizedPath) return node;

    // Split path by '/' and filter out empty segments
    const pathSegments = sanitizedPath
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => segment.trim())
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
  getGun(): GunInstance {
    return this.gun;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): UserInfo | null {
    try {
      const _user = this.gun.user();
      return _user?.is?.pub
        ? {
            pub: _user?.is?.pub!,
            epub: _user?.is?.epub,
            alias: _user?.is?.alias as string | undefined,
            user: _user,
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
  getUser(): GunUser {
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
  async getData(path: string): Promise<GunData> {
    const node = await this.navigateToPath(this.gun, path).then();
    return node;
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: GunData): Promise<GunOperationResult> {
    const ack = await this.navigateToPath(this.gun, path).put(data).then();
    const result = ack.err
      ? { success: false, error: ack.err }
      : { success: true };

    return result;
  }

  /**
   * Sets data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async set(path: string, data: GunData): Promise<GunOperationResult> {
    const ack = await this.navigateToPath(this.gun, path).set(data).then();
    const result = ack.err
      ? { success: false, error: ack.err }
      : { success: true };

    return result;
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<GunOperationResult> {
    const ack = await this.navigateToPath(this.gun, path).put(null).then();
    const result = ack.err
      ? { success: false, error: ack.err }
      : { success: true };

    return result;
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

      // Validate session data structure
      if (!session.username || !session.pair || !session.userPub) {
        // Invalid session data, clearing storage
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Incomplete session data" };
      }

      // Check if session is expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        // Session expired, clearing storage
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session expired" };
      }

      // Attempt to restore user session
      try {
        const userInstance = this.gun.user();
        if (!userInstance) {
          console.error("Gun user instance not available");
          localStorage.removeItem("gun/session");
          localStorage.removeItem("gun/pair");
          return { success: false, error: "Gun user instance not available" };
        }

        // Set the user pair
        try {
          (userInstance as any)._ = { ...userInstance._, sea: session.pair };
        } catch (pairError) {
          console.error("Error setting user pair:", pairError);
        }

        // Attempt to recall user session
        try {
          const recallResult = userInstance.recall({ sessionStorage: true });
          // console.log("recallResult", recallResult);
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

  logout(): void {
    try {
      const currentUser = this.gun.user();
      if (!currentUser || !currentUser.is) {
        console.log("No user logged in, skipping logout");
        return;
      }

      // Log out user
      try {
        currentUser.leave();
      } catch (gunError) {
        console.error("Error during Gun logout:", gunError);
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

        this.gun.user().create(normalizedUsername, password, (ack: any) => {
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
              console.log(`User created successfully with userPub: ${userPub}`);
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
          this.gun.user().auth(pair, (ack: any) => {
            console.log(`Pair authentication after creation result:`, ack);
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Add a small delay to ensure user state is properly set
              setTimeout(() => {
                // Extract userPub from multiple possible sources
                const userPub =
                  ack.pub || this.gun.user().is?.pub || ack.user?.pub;
                console.log(`Extracted userPub after pair auth: ${userPub}`);
                console.log(`User object after pair auth:`, this.gun.user());
                console.log(`User.is after pair auth:`, this.gun.user().is);

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
          this.gun.user().auth(normalizedUsername, password, (ack: any) => {
            console.log(`Password authentication after creation result:`, ack);
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Add a small delay to ensure user state is properly set
              setTimeout(() => {
                // Extract userPub from multiple possible sources
                const userPub =
                  ack.pub || this.gun.user().is?.pub || ack.user?.pub;
                console.log(
                  `Extracted userPub after password auth: ${userPub}`,
                );
                console.log(
                  `User object after password auth:`,
                  this.gun.user(),
                );
                console.log(`User.is after password auth:`, this.gun.user().is);

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
      this.user = this.gun.user();

      // Run post-authentication tasks
      try {
        console.log(
          `Running post-auth setup with userPub: ${authResult.userPub}`,
        );
        const postAuthResult = await this.runPostAuthOnAuthResult(
          username,
          authResult.userPub,
          authResult,
        );

        // Return the post-auth result which includes the complete user data
        return postAuthResult;
      } catch (postAuthError) {
        console.error(`Post-auth error: ${postAuthError}`);
        // Even if post-auth fails, the user was created and authenticated successfully
        return {
          success: true,
          userPub: authResult.userPub,
          username: username,
          isNewUser: true,
          sea: (this.gun.user() as any)?._?.sea
            ? {
                pub: (this.gun.user() as any)._?.sea.pub,
                priv: (this.gun.user() as any)._?.sea.priv,
                epub: (this.gun.user() as any)._?.sea.epub,
                epriv: (this.gun.user() as any)._?.sea.epriv,
              }
            : undefined,
        };
      }
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
        console.log(
          `User created successfully with pair for: ${normalizedUsername}`,
        );
        resolve({ success: true, userPub: pair.pub });
      },
    );
  }

  private async runPostAuthOnAuthResult(
    username: string,
    userPub: string,
    authResult: any,
  ): Promise<SignUpResult> {
    // Setting up user profile after authentication

    try {
      // Validate required parameters
      if (
        !username ||
        typeof username !== "string" ||
        username.trim().length === 0
      ) {
        throw new Error("Invalid username provided");
      }

      if (
        !userPub ||
        typeof userPub !== "string" ||
        userPub.trim().length === 0
      ) {
        console.error("Invalid userPub provided:", {
          userPub,
          type: typeof userPub,
          authResult,
        });
        throw new Error("Invalid userPub provided");
      }

      // Additional validation for userPub format
      if (!userPub.includes(".") || userPub.length < 10) {
        console.error("Invalid userPub format:", userPub);
        throw new Error("Invalid userPub format");
      }

      // Normalize username to prevent path issues
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername.length === 0) {
        throw new Error("Username cannot be empty");
      }

      console.log(
        `Setting up user profile for ${normalizedUsername} with userPub: ${userPub}`,
      );

      const existingUser = await this.gun.get(userPub).once().then();
      const isNewUser = !existingUser || !existingUser.alias;

      // Get user's encryption public key (epub) for comprehensive tracking
      const userInstance = this.gun.user();
      const userSea = (userInstance as any)?._?.sea;
      const epub = userSea?.epub || null;

      // Enhanced user tracking system
      const trackingResult = await this.setupComprehensiveUserTracking(
        normalizedUsername,
        userPub,
        epub,
        isNewUser,
      );

      if (!trackingResult) {
        return {
          success: false,
          error: "Comprehensive user tracking setup failed",
        };
      }

      return {
        success: true,
        userPub: userPub,
        username: normalizedUsername,
        isNewUser: isNewUser,
        // Get the SEA pair from the user object
        sea: userSea
          ? {
              pub: userSea.pub,
              priv: userSea.priv,
              epub: userSea.epub,
              epriv: userSea.epriv,
            }
          : undefined,
      };
    } catch (error) {
      console.error(`Error in post-authentication setup: ${error}`);
      return {
        success: false,
        error: `Post-authentication setup failed: ${error}`,
      };
    }
  }

  /**
   * Sets up comprehensive user tracking system for agile user lookup
   * Creates multiple indexes for efficient user discovery
   */
  private async setupComprehensiveUserTracking(
    username: string,
    userPub: string,
    epub: string,
    isNewUser: boolean,
  ): Promise<boolean> {
    if (isNewUser) {
      return true;
    }
    try {
      // 1. Create alias index: ~@alias -> userPub (for GunDB compatibility)
      await this.createAliasIndex(username, userPub);

      // 2. Create username mapping: usernames/alias -> userPub
      await this.createUsernameMapping(username, userPub);

      // 3. Create user registry: users/userPub -> user data
      await this.createUserRegistry(username, userPub, epub);

      // 4. Create reverse lookup: userPub -> alias
      await this.createReverseLookup(username, userPub);

      // 5. Create epub index: epubKeys/epub -> userPub (for encryption lookups)
      if (epub) {
        await this.createEpubIndex(epub, userPub);
      }

      // 6. Create user metadata in user's own node
      await this.createUserMetadata(username, userPub, epub);

      console.log(
        `Comprehensive user tracking setup completed for ${username}`,
      );
      return true;
    } catch (error) {
      console.error(`Error in comprehensive user tracking setup: ${error}`);
      // Don't throw - continue with other operations
      return false;
    }
  }

  /**
   * Creates alias index following GunDB pattern: ~@alias -> userPub
   */
  private async createAliasIndex(
    username: string,
    userPub: string,
  ): Promise<void> {
    try {
      const aliasNode = this.gun.get(`~@${username}`);
      // For Gun.js alias validation to pass, the data must be exactly equal to the key
      // The key is `~@${username}`, so we store that as the data
      const ack = await aliasNode.put(`~@${username}`).then();

      if (ack.err) {
        console.error(`Error creating alias index: ${ack.err}`);
      } else {
        console.log(`Alias index created: ~@${username} -> ${userPub}`);
      }
    } catch (error) {
      console.error(`Error creating alias index: ${error}`);
    }
  }

  /**
   * Creates username mapping: usernames/alias -> userPub
   */
  private async createUsernameMapping(
    username: string,
    userPub: string,
  ): Promise<void> {
    try {
      const ack = await this.node
        .get("usernames")
        .get(username)
        .put(userPub)
        .then();

      if (ack.err) {
        console.error(`Error creating username mapping: ${ack.err}`);
      } else {
        console.log(`Username mapping created: ${username} -> ${userPub}`);
      }
    } catch (error) {
      console.error(`Error creating username mapping: ${error}`);
    }
  }

  /**
   * Creates user registry: users/userPub -> user data
   */
  private async createUserRegistry(
    username: string,
    userPub: string,
    epub: string | null,
  ): Promise<void> {
    try {
      const userData = {
        username: username,
        userPub: userPub,
        epub: epub,
        registeredAt: Date.now(),
        lastSeen: Date.now(),
      };

      const ack = await this.node
        .get("users")
        .get(userPub)
        .put(userData)
        .then();

      if (ack.err) {
        console.error(`Error creating user registry: ${ack.err}`);
      } else {
        console.log(`User registry created: ${userPub}`);
      }
    } catch (error) {
      console.error(`Error creating user registry: ${error}`);
    }
  }

  /**
   * Creates reverse lookup: userPub -> alias
   */
  private async createReverseLookup(
    username: string,
    userPub: string,
  ): Promise<void> {
    try {
      const ack = await this.node
        .get("userAliases")
        .get(userPub)
        .put(username)
        .then();

      if (ack.err) {
        console.error(`Error creating reverse lookup: ${ack.err}`);
      } else {
        console.log(`Reverse lookup created: ${userPub} -> ${username}`);
      }
    } catch (error) {
      console.error(`Error creating reverse lookup: ${error}`);
    }
  }

  /**
   * Creates epub index: epubKeys/epub -> userPub
   */
  private async createEpubIndex(epub: string, userPub: string): Promise<void> {
    try {
      const ack = await this.node.get("epubKeys").get(epub).put(userPub).then();

      if (ack.err) {
        console.error(`Error creating epub index: ${ack.err}`);
      } else {
        console.log(`Epub index created: ${epub} -> ${userPub}`);
      }
    } catch (error) {
      console.error(`Error creating epub index: ${error}`);
    }
  }

  /**
   * Creates user metadata in user's own node
   */
  private async createUserMetadata(
    username: string,
    userPub: string,
    epub: string | null,
  ): Promise<void> {
    try {
      const userMetadata = {
        username: username,
        epub: epub,
        registeredAt: Date.now(),
        lastSeen: Date.now(),
      };

      const ack = await this.gun.get(userPub).put(userMetadata).then();

      if (ack.err) {
        console.error(`Error creating user metadata: ${ack.err}`);
      } else {
        console.log(`User metadata created for ${userPub}`);
      }
    } catch (error) {
      console.error(`Error creating user metadata: ${error}`);
    }
  }

  /**
   * Gets user information by alias using the comprehensive tracking system
   * @param alias Username/alias to lookup
   * @returns Promise resolving to user information or null if not found
   */
  async getUserByAlias(alias: string): Promise<{
    userPub: string;
    epub: string | null;
    username: string;
    registeredAt: number;
    lastSeen: number;
  } | null> {
    try {
      const normalizedAlias = alias.trim().toLowerCase();
      if (!normalizedAlias) {
        return null;
      }

      // Method 1: Try GunDB standard alias lookup (~@alias)
      try {
        const aliasData = await this.gun
          .get(`~@${normalizedAlias}`)
          .once()
          .then();
        if (aliasData && aliasData["~pubKeyOfUser"]) {
          const userPub =
            aliasData["~pubKeyOfUser"]["#"] || aliasData["~pubKeyOfUser"];
          if (userPub) {
            const userData = await this.getUserDataByPub(userPub);
            if (userData) {
              return userData;
            }
          }
        }
      } catch (error) {
        console.log(`GunDB alias lookup failed for ${normalizedAlias}:`, error);
      }

      // Method 2: Try username mapping (usernames/alias -> userPub)
      try {
        const userPub = await this.node
          .get("usernames")
          .get(normalizedAlias)
          .once()
          .then();

        if (userPub) {
          const userData = await this.getUserDataByPub(userPub);
          if (userData) {
            return userData;
          }
        }
      } catch (error) {
        console.log(
          `Username mapping lookup failed for ${normalizedAlias}:`,
          error,
        );
      }

      return null;
    } catch (error) {
      console.error(`Error looking up user by alias ${alias}:`, error);
      return null;
    }
  }

  /**
   * Gets user information by public key
   * @param userPub User's public key
   * @returns Promise resolving to user information or null if not found
   */
  async getUserDataByPub(userPub: string): Promise<{
    userPub: string;
    epub: string | null;
    username: string;
    registeredAt: number;
    lastSeen: number;
  } | null> {
    try {
      if (!userPub || typeof userPub !== "string") {
        return null;
      }

      // Method 1: Try user registry (users/userPub -> user data)
      try {
        const userData = await this.node
          .get("users")
          .get(userPub)
          .once()
          .then();

        if (userData && userData.username) {
          return {
            userPub: userData.userPub || userPub,
            epub: userData.epub || null,
            username: userData.username,
            registeredAt: userData.registeredAt || 0,
            lastSeen: userData.lastSeen || 0,
          };
        }
      } catch (error) {
        console.log(`User registry lookup failed for ${userPub}:`, error);
      }

      // Method 2: Try user's own node
      try {
        const userNodeData = await this.gun.get(userPub).once().then();
        if (userNodeData && userNodeData.username) {
          return {
            userPub: userPub,
            epub: userNodeData.epub || null,
            username: userNodeData.username,
            registeredAt: userNodeData.registeredAt || 0,
            lastSeen: userNodeData.lastSeen || 0,
          };
        }
      } catch (error) {
        console.log(`User node lookup failed for ${userPub}:`, error);
      }

      return null;
    } catch (error) {
      console.error(`Error looking up user data by pub ${userPub}:`, error);
      return null;
    }
  }

  /**
   * Gets user public key by encryption public key (epub)
   * @param epub User's encryption public key
   * @returns Promise resolving to user public key or null if not found
   */
  async getUserPubByEpub(epub: string): Promise<string | null> {
    try {
      if (!epub || typeof epub !== "string") {
        return null;
      }

      const userPub = await this.node.get("epubKeys").get(epub).once().then();

      return userPub || null;
    } catch (error) {
      console.error(`Error looking up user pub by epub ${epub}:`, error);
      return null;
    }
  }

  /**
   * Gets user alias by public key
   * @param userPub User's public key
   * @returns Promise resolving to user alias or null if not found
   */
  async getUserAliasByPub(userPub: string): Promise<string | null> {
    try {
      if (!userPub || typeof userPub !== "string") {
        return null;
      }

      const alias = await this.node
        .get("userAliases")
        .get(userPub)
        .once()
        .then();

      return alias || null;
    } catch (error) {
      console.error(`Error looking up user alias by pub ${userPub}:`, error);
      return null;
    }
  }

  /**
   * Gets all registered users (for admin purposes)
   * @returns Promise resolving to array of user information
   */
  async getAllRegisteredUsers(): Promise<
    Array<{
      userPub: string;
      epub: string | null;
      username: string;
      registeredAt: number;
      lastSeen: number;
    }>
  > {
    try {
      const users: Array<{
        userPub: string;
        epub: string | null;
        username: string;
        registeredAt: number;
        lastSeen: number;
      }> = [];

      // Get all users from the users registry
      const usersNode = this.node.get("users");

      // Note: This is a simplified approach. In a real implementation,
      // you might want to use Gun's map functionality or iterate through
      // known user public keys
      return users;
    } catch (error) {
      console.error(`Error getting all registered users:`, error);
      return [];
    }
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
        console.log(`Failed to update lastSeen in user registry:`, error);
      }

      // Update in user's own node
      try {
        await this.gun.get(userPub).get("lastSeen").put(timestamp).then();
      } catch (error) {
        console.log(`Failed to update lastSeen in user node:`, error);
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
    return new Promise<{ success: boolean; error?: string; ack?: any }>(
      (resolve) => {
        console.log(`Attempting authentication for user: ${username}`);

        if (pair) {
          this.gun.user().auth(pair, (ack: any) => {
            console.log(`Pair authentication result:`, ack);
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, ack });
            }
          });
        } else {
          this.gun.user().auth(username, password, (ack: any) => {
            console.log(`Password authentication result:`, ack);
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
    const seaPair = (this.gun.user() as any)?._?.sea;

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

  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
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

      const userPub = this.gun.user().is?.pub;

      let alias = this.gun.user().is?.alias as string;

      if (!alias) {
        alias = username;
      }

      console.log(
        `Login authentication successful, extracted userPub: ${userPub}`,
      );
      console.log(`User object:`, this.gun.user());
      console.log(`User.is:`, this.gun.user().is);

      if (!userPub) {
        return {
          success: false,
          error: "Authentication failed: No user pub returned.",
        };
      }

      // Pass the userPub to runPostAuthOnAuthResult
      try {
        await this.runPostAuthOnAuthResult(alias, userPub, {
          success: true,
          userPub: userPub,
        });
      } catch (postAuthError) {
        console.error(`Post-auth error during login: ${postAuthError}`);
        // Continue with login even if post-auth fails
      }

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
          pair: pair ?? null,
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
   * Encrypts session data before storage
   */
  private async encryptSessionData(data: any): Promise<string> {
    try {
      // Use a derived key from device fingerprint for encryption
      const deviceInfo =
        navigator.userAgent +
        (typeof screen !== "undefined"
          ? screen.width + "x" + screen.height
          : "");
      const encryptionKey = await SEA.work(deviceInfo, null, null, {
        name: "SHA-256",
      });

      if (!encryptionKey) {
        throw new Error("Failed to generate encryption key");
      }

      const encryptedData = await SEA.encrypt(
        JSON.stringify(data),
        encryptionKey,
      );
      if (!encryptedData) {
        throw new Error("Failed to encrypt session data");
      }

      return encryptedData;
    } catch (error) {
      console.error("Error encrypting session data:", error);
      throw error;
    }
  }

  /**
   * Decrypts session data from storage
   */
  private async decryptSessionData(encryptedData: string): Promise<any> {
    try {
      // Use the same device fingerprint for decryption
      const deviceInfo =
        navigator.userAgent +
        (typeof screen !== "undefined"
          ? screen.width + "x" + screen.height
          : "");
      const encryptionKey = await SEA.work(deviceInfo, null, null, {
        name: "SHA-256",
      });

      if (!encryptionKey) {
        throw new Error("Failed to generate decryption key");
      }

      const decryptedData = await SEA.decrypt(encryptedData, encryptionKey);
      if (decryptedData === undefined) {
        throw new Error("Failed to decrypt session data");
      }

      return JSON.parse(decryptedData);
    } catch (error) {
      console.error("Error decrypting session data:", error);
      throw error;
    }
  }

  private saveCredentials(userInfo: {
    alias: string;
    pair: ISEAPair | null;
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
        // Encrypt session data before storage
        this.encryptSessionData(sessionInfo)
          .then((encryptedData) => {
            sessionStorage.setItem("gunSessionData", encryptedData);
          })
          .catch((error) => {
            console.error("Failed to encrypt and save session data:", error);
            // Fallback to unencrypted storage (less secure)
            sessionStorage.setItem(
              "gunSessionData",
              JSON.stringify(sessionInfo),
            );
          });
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
        .put(securityPayload)
        .then();

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
        (await this.node
          .get("usernames")
          .get(normalizedUsername)
          .once()
          .then()) || null;

      if (!userPub) {
        return { success: false, error: "User not found" };
      }
      // console.log(`Found user public key for password recovery: ${userPub}`);

      // Access the user's security data directly from their public key node
      const securityData = await (this.node.get(userPub) as any)
        .get("security")
        .once()
        .then();

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
   * Saves user data at the specified path
   * @param path Path to save the data (supports nested paths like "test/data/marco")
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async putUserData(path: string, data: any): Promise<void> {
    const user = this.gun.user();
    if (!user.is) {
      throw new Error("User not authenticated");
    }

    const ack = await this.navigateToPath(user, path).put(data).then();
    if (ack.err) {
      throw new Error(ack.err);
    }
  }

  /**
   * Gets user data from the specified path
   * @param path Path to get the data from (supports nested paths like "test/data/marco")
   * @returns Promise that resolves with the data
   */
  async getUserData(path: string): Promise<any> {
    // Validazione del path
    if (!path || typeof path !== "string") {
      throw new Error("Path must be a non-empty string");
    }

    const user = this.gun.user();
    if (!user.is) {
      throw new Error("User not authenticated");
    }

    try {
      const data = await this.navigateToPath(user, path).once().then();

      // Gestisci i riferimenti GunDB
      if (data && typeof data === "object" && data["#"]) {
        // È un riferimento GunDB, carica i dati effettivi
        const referencePath = data["#"];
        const actualData = await this.navigateToPath(this.gun, referencePath)
          .once()
          .then();
        return actualData;
      } else {
        // Dati diretti, restituisci così come sono
        return data;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      throw new Error(errorMsg);
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
  public recall(): void {
    if (this.user) {
      this.user.recall({ sessionStorage: true });
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
      this.user.recall({ sessionStorage: true });
    }
  }

  /**
   * Load session from storage
   */
  public loadSession(): any {
    if (this.user) {
      return this.user.recall({ sessionStorage: true });
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
  console.log("Creating Gun instance with config:", config);
  console.log("Config peers:", config?.peers);

  const gunInstance = Gun(config);

  console.log("Created Gun instance:", gunInstance);
  return gunInstance;
};

export { Gun, DataBase, SEA, RxJS, crypto, GunErrors, derive, createGun };

export default Gun;

export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
