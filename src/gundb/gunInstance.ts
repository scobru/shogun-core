/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
import Gun from "gun/gun";
import { default as SEA } from "gun/sea.js";

import "gun/lib/then";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";

import type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";

import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";

import { GunDataEventData, GunPeerEventData } from "../types/events";
import { GunRxJS } from "./rxjs-integration";

import * as GunErrors from "./errors";
import * as crypto from "./crypto";
import * as utils from "./utils";

import derive, { DeriveOptions } from "./derive";

class GunInstance {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public utils: typeof utils;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;

  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private readonly eventEmitter: EventEmitter;

  // Integrated modules
  private _rxjs?: GunRxJS;

  constructor(gun: IGunInstance<any>, appScope: string = "shogun") {
    log("Initializing GunDB");

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
    if (typeof window !== "undefined") {
      (window as any).ShogunDB = this;
      (window as any).ShogunGun = gun;
    } else if (typeof global !== "undefined") {
      (global as any).ShogunDB = this;
      (global as any).ShogunGun = gun;
    }

    try {
      this.user = this.gun.user().recall({ sessionStorage: true });
    } catch (error) {
      logError("Error initializing Gun user:", error);
      throw new Error(`Failed to initialize Gun user: ${error}`);
    }

    this.subscribeToAuthEvents();

    this.crypto = crypto;

    this.utils = utils;

    this.node = this.gun.get(appScope);

    // Attempt to restore session immediately instead of with timeout
    this.restoreSessionOnInit();
  }

  private async restoreSessionOnInit() {
    try {
      const sessionResult = await this.restoreSession();
      if (sessionResult.success) {
        log(
          `Session automatically restored for user: ${sessionResult.userPub}`,
        );
      } else {
        log(`No previous session to restore: ${sessionResult.error}`);
      }
    } catch (error) {
      logError("Error during automatic session restoration:", error);
    }
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
      log("Auth event received:", ack);

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
    log(`Added new peer: ${peer}`);
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
        log(`Removed peer: ${peer}`);
      } else {
        log(`Peer not found in current connections: ${peer}`);
      }
    } catch (error) {
      logError(`Error removing peer ${peer}:`, error);
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
      logError("Error getting current peers:", error);
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
      logError("Error getting configured peers:", error);
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
      logError("Error getting peer info:", error);
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
      log(`Reconnected to peer: ${peer}`);
    } catch (error) {
      logError(`Error reconnecting to peer ${peer}:`, error);
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

        log(
          `Reset peers. New peers: ${newPeers ? newPeers.join(", ") : "none"}`,
        );
      }
    } catch (error) {
      logError("Error resetting peers:", error);
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
   * Signs up a new user using direct Gun authentication
   * @param username Username
   * @param password Password
   * @returns Promise resolving to signup result
   */
  async signUp(username: string, password: string): Promise<any> {
    log("Attempting user registration:", username);

    try {
      // Validate credentials
      if (password.length < 8) {
        const err = "Passwords must be more than 8 characters long!";
        log(err);
        return { success: false, error: err };
      }

      if (username.length < 1) {
        const err = "Username must be more than 0 characters long!";
        log(err);
        return { success: false, error: err };
      }

      // First, try to authenticate with Gun's native system to check if user exists
      log(`Checking if user ${username} exists in Gun's native system...`);
      const authTestResult = await new Promise<any>((resolve) => {
        this.gun.user().auth(username, password, (ack: any) => {
          if (ack.err) {
            // User doesn't exist or password is wrong - this is expected for new users
            resolve({ exists: false, error: ack.err });
          } else {
            // User exists and password is correct
            resolve({ exists: true, userPub: this.gun.user().is?.pub });
          }
        });
      });

      if (authTestResult.exists) {
        log(
          `User ${username} already exists and password is correct, syncing with tracking system...`,
        );

        // User exists and can authenticate, sync with tracking system
        const userPub = authTestResult.userPub;

        // Check if user exists in our tracking system
        const existingUser = await this.checkUsernameExists(username);

        if (!existingUser) {
          log(`User ${username} not in tracking system, adding them...`);

          // Add user to our tracking system
          const userMetadata = {
            username: username,
            pub: userPub,
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };

          // Save user metadata
          try {
            await new Promise<void>((resolve) => {
              this.node.get(userPub).put(userMetadata, (ack: any) => {
                if (ack.err) {
                  logError(`Warning: Failed to save user metadata: ${ack.err}`);
                } else {
                  log(`User metadata saved for: ${username}`);
                }
                resolve();
              });
            });

            // Add to users collection with timeout
            await new Promise<void>((resolve) => {
              this.node.get("users").set(this.node.get(userPub), (ack: any) => {
                if (ack.err) {
                  logError(
                    `Warning: Failed to add user to collection: ${ack.err}`,
                  );
                } else {
                  log(`User added to collection: ${username}`);
                }
                resolve();
              });
            });

            // Create username mapping with timeout
            await new Promise<void>((resolve) => {
              this.node
                .get("usernames")
                .get(username)
                .put(userPub, (ack: any) => {
                  if (ack.err) {
                    logError(
                      `Warning: Could not create username mapping: ${ack.err}`,
                    );
                  } else {
                    log(`Username mapping created: ${username} -> ${userPub}`);
                  }
                  resolve();
                });
            });
          } catch (trackingError) {
            logError(
              `Warning: Could not update tracking system: ${trackingError}`,
            );
            // Don't fail signup for tracking errors
          }

          this._savePair();

          return {
            success: true,
            userPub: userPub,
            username: username,
            message: "User already exists and was synced with tracking system",
          };
        }

        return {
          success: true,
          userPub: userPub,
          username: username,
          message: "User already exists and was synced with tracking system",
        };
      }

      // User doesn't exist, attempt to create new user
      log(`Creating new user: ${username}`);
      const createResult = await new Promise<any>((resolve) => {
        this.gun.user().create(username, password, (ack: any) => {
          if (ack.err) {
            logError(`User creation error: ${ack.err}`);

            // If user already exists in Gun's system but not accessible with current credentials,
            // this might be a synchronization issue or the user was created in a different session
            if (ack.err.includes("User already created")) {
              resolve({
                success: false,
                error: `User '${username}' already exists in the system but cannot be accessed with the provided credentials. This might be due to a previous incomplete registration or synchronization issue. Please try a different username or contact support.`,
                isUserExistsError: true,
              });
            } else {
              resolve({ success: false, error: ack.err });
            }
          } else {
            log(`User created successfully: ${username}`);
            resolve({ success: true, pub: ack.pub });
          }
        });
      });

      if (!createResult.success) {
        // If it's a "user already exists" error, provide more helpful guidance
        if (createResult.isUserExistsError) {
          log(`User creation failed due to existing user: ${username}`);
          return {
            success: false,
            error: createResult.error,
            suggestion:
              "Try using a different username or clear your browser data if you believe this is an error.",
          };
        }
        return createResult;
      }

      // User created successfully, now authenticate to get the userPub
      const authResult = await new Promise<any>((resolve) => {
        this.gun.user().auth(username, password, (ack: any) => {
          if (ack.err) {
            logError(`Authentication after creation failed: ${ack.err}`);
            resolve({ success: false, error: ack.err });
          } else {
            resolve({ success: true, userPub: this.gun.user().is?.pub });
          }
        });
      });

      if (!authResult.success) {
        return {
          success: false,
          error: "User created but authentication failed",
        };
      }

      const userPub = authResult.userPub;
      log(
        `User authentication successful after creation: ${username} (${userPub})`,
      );

      // Add to tracking system
      const userMetadata = {
        username: username,
        pub: userPub,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };

      // Save user metadata
      try {
        await new Promise<void>((resolve) => {
          this.node.get(userPub).put(userMetadata, (ack: any) => {
            if (ack.err) {
              logError(`Warning: Failed to save user metadata: ${ack.err}`);
            } else {
              log(`User metadata saved for: ${username}`);
            }
            resolve();
          });
        });

        // Add to users collection with timeout
        await new Promise<void>((resolve) => {
          this.node.get("users").set(this.node.get(userPub), (ack: any) => {
            if (ack.err) {
              logError(`Warning: Failed to add user to collection: ${ack.err}`);
            } else {
              log(`User added to collection: ${username}`);
            }
            resolve();
          });
        });

        // Create username mapping with timeout
        await new Promise<void>((resolve) => {
          this.gun
            .get("usernames")
            .get(username)
            .put(userPub, (ack: any) => {
              if (ack.err) {
                logError(
                  `Warning: Could not create username mapping: ${ack.err}`,
                );
              } else {
                log(`Username mapping created: ${username} -> ${userPub}`);
              }
              resolve();
            });
        });
      } catch (trackingError) {
        logError(`Warning: Could not update tracking system: ${trackingError}`);
        // Don't fail signup for tracking errors
      }

      this._savePair();

      return {
        success: true,
        userPub,
        username,
        message: "User created successfully",
      };
    } catch (error) {
      logError(`Exception during signup for ${username}: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check if a username already exists in the system
   * @param username Username to check
   * @returns Promise resolving to user data if exists, null otherwise
   */
  private async checkUsernameExists(username: string): Promise<any> {
    try {
      // First check the username mapping (faster)
      const mappedPub = await new Promise<string | null>((resolve) => {
        this.node
          .get("usernames")
          .get(username)
          .once((pub: any) => {
            resolve(pub || null);
          });
      });

      if (mappedPub) {
        // Get user data from the pub
        const userData = await new Promise<any>((resolve) => {
          this.node.get(mappedPub).once((data: any) => {
            resolve(data);
          });
        });
        return userData;
      }

      // Fallback: Search through all users collection (slower but more reliable)
      const existingUser = await new Promise<any>((resolve) => {
        let found = false;

        this.gun
          .get("users")
          .map()
          .once((userData: any, key: string) => {
            if (!found && userData && userData.username === username) {
              found = true;
              resolve(userData);
            }
          });

        // Resolve with null after a brief delay if nothing found
        // We need some mechanism to resolve when no match is found
        // Using a minimal delay instead of a long timeout
        setTimeout(() => {
          if (!found) {
            resolve(null);
          }
        }, 100);
      });

      return existingUser;
    } catch (error) {
      logError(`Error checking username existence: ${error}`);
      return null;
    }
  }

  /**
   * Logs in a user using direct Gun authentication
   * @param username Username
   * @param password Password
   * @param callback Optional callback for login result
   * @returns Promise resolving to login result
   */
  async login(
    username: string,
    password: string,
    callback?: (result: any) => void,
  ): Promise<any> {
    log(`Attempting login for user: ${username}`);

    try {
      // Attempt Gun.js authentication directly first
      // This allows login even if our custom tracking system is out of sync
      const authResult = await new Promise<any>((resolve) => {
        this.gun.user().auth(username, password, (ack: any) => {
          if (ack.err) {
            logError(`Login error for ${username}: ${ack.err}`);
            resolve({ success: false, error: ack.err });
          } else {
            log(`Login successful for: ${username}`);
            resolve({ success: true, ack });
          }
        });
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

      log(`Gun.js authentication successful for: ${username} (${userPub})`);

      // Now try to sync with our custom tracking system
      // This is best-effort and won't fail the login if it doesn't work
      try {
        // Check if user exists in our tracking system
        const existingUser = await this.checkUsernameExists(username);

        if (!existingUser) {
          log(`User ${username} not found in tracking system, adding them...`);

          // Add user to our tracking system
          const userMetadata = {
            username: username,
            pub: userPub,
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };

          // Save user metadata with timeout
          await new Promise<void>((resolve) => {
            this.node.get(userPub).put(userMetadata, (ack: any) => {
              if (ack.err) {
                logError(`Warning: Failed to save user metadata: ${ack.err}`);
              } else {
                log(`User metadata saved for: ${username}`);
              }
              resolve();
            });
          });

          // Add to users collection with timeout
          await new Promise<void>((resolve) => {
            this.node.get("users").set(this.node.get(userPub), (ack: any) => {
              if (ack.err) {
                logError(
                  `Warning: Failed to add user to collection: ${ack.err}`,
                );
              } else {
                log(`User added to collection: ${username}`);
              }
              resolve();
            });
          });

          // Create username mapping with timeout
          await new Promise<void>((resolve) => {
            this.node
              .get("usernames")
              .get(username)
              .put(userPub, (ack: any) => {
                if (ack.err) {
                  logError(
                    `Warning: Could not create username mapping: ${ack.err}`,
                  );
                } else {
                  log(`Username mapping created: ${username} -> ${userPub}`);
                }
                resolve();
              });
          });
        } else {
          log(
            `User ${username} found in tracking system, updating last login...`,
          );
          // Update last login time (non-blocking)
          this.node.get(userPub).get("lastLogin").put(Date.now());
        }
      } catch (trackingError) {
        // Log but don't fail the login for tracking system errors
        logError(
          `Warning: Could not sync with tracking system: ${trackingError}`,
        );
      }

      log(`Login completed successfully for: ${username} (${userPub})`);
      this._savePair();

      const result = {
        success: true,
        userPub,
        username,
      };

      if (callback) callback(result);
      return result;
    } catch (error) {
      logError(`Exception during login for ${username}: ${error}`);
      const result = { success: false, error: String(error) };
      if (callback) callback(result);
      return result;
    }
  }

  private _savePair(): void {
    try {
      const user = this.gun.user();
      const pair = (user as any)?._?.sea;
      const userInfo = user?.is;

      if (pair && userInfo) {
        // Save the crypto pair and session info
        const sessionInfo = {
          pub: userInfo.pub,
          alias: userInfo.alias || "",
          timestamp: Date.now(),
        };

        // Save to localStorage if available
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("gun/pair", JSON.stringify(pair));
          localStorage.setItem("gun/session", JSON.stringify(sessionInfo));
        }

        // Also save to sessionStorage for cross-app sharing
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("gun/pair", JSON.stringify(pair));
          sessionStorage.setItem("gun/session", JSON.stringify(sessionInfo));
        }

        log(`Session saved for user: ${userInfo.alias || userInfo.pub}`);
      }
    } catch (error) {
      logError("Error saving auth pair and session:", error);
    }
  }

  /**
   * Attempts to restore user session from local storage
   * @returns Promise resolving to session restoration result
   */
  async restoreSession(): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    try {
      if (typeof localStorage === "undefined") {
        return { success: false, error: "localStorage not available" };
      }

      const sessionInfo = localStorage.getItem("gun/session");
      const pairInfo = localStorage.getItem("gun/pair");

      if (!sessionInfo || !pairInfo) {
        log("No saved session found");
        return { success: false, error: "No saved session" };
      }

      const session = JSON.parse(sessionInfo);
      const pair = JSON.parse(pairInfo);

      // Check if session is not too old (optional - you can adjust this)
      const sessionAge = Date.now() - session.timestamp;
      const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxSessionAge) {
        log("Session expired, clearing storage");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session expired" };
      }

      log(
        `Attempting to restore session for user: ${session.alias || session.pub}`,
      );

      // Try to restore the session with Gun
      const user = this.gun.user();

      // Set the pair directly
      (user as any)._ = { sea: pair };

      // Try to recall the session without timeout
      const recallResult = await new Promise<boolean>((resolve) => {
        try {
          user.recall({ sessionStorage: true }, (ack: any) => {
            if (ack.err) {
              logError(`Session recall error: ${ack.err}`);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } catch (error) {
          logError(`Session recall exception: ${error}`);
          resolve(false);
        }
      });

      if (recallResult && user.is?.pub === session.pub) {
        log(
          `Session restored successfully for: ${session.alias || session.pub}`,
        );
        return { success: true, userPub: session.pub };
      } else {
        log("Session restoration failed, clearing storage");
        localStorage.removeItem("gun/session");
        localStorage.removeItem("gun/pair");
        return { success: false, error: "Session restoration failed" };
      }
    } catch (error) {
      logError(`Error restoring session: ${error}`);
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
        log("No user logged in, skipping logout");
        return;
      }

      const currentUser = this.getCurrentUser();
      log(`Logging out user: ${currentUser?.pub || "unknown"}`);

      // Direct logout using Gun
      this.gun.user().leave();

      // Clear local storage session data
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("gun/pair");
        localStorage.removeItem("gun/session");

        // Also clear old format for backward compatibility
        localStorage.removeItem("pair");

        log("Local session data cleared");
      }

      // Clear sessionStorage as well
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("gun/");
        sessionStorage.removeItem("gun/user");
        sessionStorage.removeItem("gun/auth");
        sessionStorage.removeItem("gun/pair");
        sessionStorage.removeItem("gun/session");

        log("Session storage cleared");
      }

      log("Logout completed successfully");
    } catch (error) {
      logError("Error during logout:", error);
    }
  }

  /**
   * Debug method: Clears all Gun-related data from local and session storage
   * This is useful for debugging and testing purposes
   */
  clearAllStorageData(): void {
    try {
      log("Clearing all Gun-related storage data...");

      // Clear localStorage
      if (typeof localStorage !== "undefined") {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("gun/") || key === "pair")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        log(`Cleared ${keysToRemove.length} items from localStorage`);
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== "undefined") {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("gun/")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        log(`Cleared ${keysToRemove.length} items from sessionStorage`);
      }

      // Also logout if currently logged in
      if (this.isLoggedIn()) {
        this.gun.user().leave();
        log("User logged out");
      }

      log("All Gun-related storage data cleared");
    } catch (error) {
      logError("Error clearing storage data:", error);
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
      log("Testing Gun connectivity...");

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
        log("Write test result:", writeResult);
      } catch (writeError) {
        logError("Write test failed:", writeError);
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
        log("Read test result:", readResult);
      } catch (readError) {
        logError("Read test failed:", readError);
        result.testReadResult = { error: String(readError) };
      }

      log("Connectivity test completed:", result);
      return result;
    } catch (error) {
      logError("Error testing connectivity:", error);
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
   * Checks if a user is currently logged in
   * @returns True if logged in
   */
  isLoggedIn(): boolean {
    return !!this.gun.user()?.is?.pub;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): any {
    const pub = this.gun.user()?.is?.pub;
    return pub ? { pub, user: this.gun.user() } : null;
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
    log("Setting password hint for:", username);

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
        logError("Error generating hash:", hashError);
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
        logError("Error encrypting hint:", encryptError);
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
              logError("Error saving security data to public graph:", ack.err);
              reject(new Error(ack.err));
            } else {
              log(`Security data saved to public graph for ${userPub}`);
              resolve();
            }
          });
      });

      return { success: true };
    } catch (error) {
      logError("Error setting password hint:", error);
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
    log("Attempting password recovery for:", username);

    try {
      // Find the user's data
      const userData = await this.checkUsernameExists(username);

      if (!userData || !userData.pub) {
        return { success: false, error: "User not found" };
      }

      // Extract the public key from user data
      const userPub = userData.pub;
      log(`Found user public key for password recovery: ${userPub}`);

      // Access the user's security data directly from their public key node
      // Security data is stored in the user's private space, so we need to access it via their public key
      const securityData = await new Promise<any>((resolve) => {
        (this.node.get(userPub) as any).get("security").once((data: any) => {
          log(
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
        logError("Error generating hash:", hashError);
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
      logError("Error recovering password hint:", error);
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
  async saveUserData(path: string, data: any): Promise<void> {
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
          resolve();
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
    return new Promise((resolve) => {
      const user = this.gun.user();
      if (!user.is) {
        this.emitDataEvent(
          "gun:get",
          `user/${path}`,
          null,
          false,
          "User not authenticated",
        );
        resolve(null);
        return;
      }

      this.navigateToPath(user, path).once((data: any) => {
        this.emitDataEvent("gun:get", `user/${path}`, data, true);
        resolve(data);
      });
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
      log("Deriving cryptographic keys with options:", options);

      // Call the derive function with the provided parameters
      const derivedKeys = await derive(password, extra, options);

      log("Key derivation completed successfully");
      return derivedKeys;
    } catch (error) {
      logError("Error during key derivation:", error);

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

  // Errors
  static Errors = GunErrors;
}

export { GunInstance, SEA, Gun, GunRxJS, crypto, utils, GunErrors, derive };

export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
