/**
 * HolsterDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Holster.user()
 */

import type {
  HolsterUser,
  UserInfo,
  AuthCallback,
  HolsterData,
  HolsterNode,
  UserExistenceResult,
  EventData,
  EventListener,
  HolsterOperationResult,
} from "./types";

import type { AuthResult, SignUpResult } from "../types/shogun";

// Import Holster
import Holster from "@mblaney/holster";
// SEA is available on the holster instance
// import SEA from "@mblaney/holster/sea";

import { restrictedPut } from "./restricted-put";
import derive, { DeriveOptions } from "./derive";

// import type {
//   IHolsterUserInstance,
//   IHolsterInstance,
//   IHolsterChain,
//   ISEAPair,
// } from "holster/types";

import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "../utils/eventEmitter";
import { HolsterDataEventData, HolsterPeerEventData } from "../types/events";
import { HolsterRxJS } from "./holster-rxjs";

import * as HolsterErrors from "./errors";
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

class HolsterInstance {
  public holster: any; //IHolsterInstance<any>;
  public user: any | null = null; //IHolsterUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public sea: any; //typeof SEA;
  public node: any; //IHolsterChain<any, IHolsterInstance<any>, IHolsterInstance<any>, string>;

  private readonly onAuthCallbacks: Array<AuthCallback> = [];
  private readonly eventEmitter: EventEmitter;
  private peers: string[] = [];

  // Integrated modules
  private _rxjs?: HolsterRxJS;

  constructor(holster: any, appScope: string = "shogun") {
    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Validate Holster instance
    if (!holster) {
      throw new Error("Holster instance is required but was not provided");
    }
    this.holster = holster;
    this.peers = holster.opt?.peers || [];

    if (typeof holster !== "object") {
      throw new Error(
        `Holster instance must be an object, received: ${typeof holster}`,
      );
    }

    if (typeof holster.user !== "function") {
      throw new Error(
        `Holster instance is invalid: holster.user is not a function. Received holster.user type: ${typeof holster.user}`,
      );
    }

    if (typeof holster.get !== "function") {
      throw new Error(
        `Holster instance is invalid: holster.get is not a function. Received holster.get type: ${typeof holster.get}`,
      );
    }

    if (typeof holster.on !== "function") {
      throw new Error(
        `Holster instance is invalid: holster.on is not a function. Received holster.on type: ${typeof holster.on}`,
      );
    }

    this.user = this.holster.user(); // .recall({ sessionStorage: true }); // recall is not in the docs

    this.subscribeToAuthEvents();

    this.crypto = crypto;

    this.sea = this.holster.SEA;

    this.node = null as any;
  }

  /**
   * Initialize the HolsterInstance asynchronously
   * This method should be called after construction to perform async operations
   */
  // async initialize(appScope: string = "shogun"): Promise<void> {
  //   try {
  //     // const sessionResult = this.restoreSession(); // I will implement this later

  //     this.node = this.holster.get(appScope);

  //     // if (sessionResult.success) {
  //     //   // Session automatically restored
  //     // } else {
  //     //   // No previous session to restore
  //     // }
  //   } catch (error) {
  //     console.error("Error during automatic session restoration:", error);
  //   }
  // }

  private subscribeToAuthEvents() {
    this.holster.on("auth", (ack: any) => {
      // Auth event received

      if (ack.err) {
        ErrorHandler.handle(
          ErrorType.GUN, // TODO: Change to HOLSTER
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
    const user = this.holster.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Registers an authentication callback
   * @param callback Function to call on auth events
   * @returns Function to unsubscribe the callback
   */
  onAuth(callback: AuthCallback): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.holster.user();
    if (user && user.is) callback(user);
    return () => {
      const i = this.onAuthCallbacks.indexOf(callback);
      if (i !== -1) this.onAuthCallbacks.splice(i, 1);
    };
  }

  /**
   * Helper method to navigate to a nested path by splitting and chaining .get() calls
   * @param node Starting Holster node
   * @param path Path string (e.g., "test/data/marco")
   * @returns Holster node at the specified path
   */
  private navigateToPath(node: HolsterNode, path: string): HolsterNode {
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
   * Gets the Holster instance
   * @returns Holster instance
   */
  getHolster(): any {
    return this.holster;
  }

  /**
   * Gets the current user
   * @returns Current user object or null
   */
  getCurrentUser(): UserInfo | null {
    try {
      const user = this.holster.user();
      const pub = user?.is?.pub;
      return pub ? { pub, user } : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Gets the current user instance
   * @returns User instance
   */
  getUser(): HolsterUser {
    return this.holster.user();
  }

  /**
   * Gets a node at the specified path
   * @param path Path to the node
   * @returns Holster node
   */
  get(path: string): any {
    return this.navigateToPath(this.holster, path);
  }

  /**
   * Gets data at the specified path (one-time read)
   * @param path Path to get the data from
   * @returns Promise resolving to the data
   */
  async getData(path: string): Promise<HolsterData> {
    return new Promise((resolve) => {
      this.navigateToPath(this.holster, path).once((data: HolsterData) => {
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
  async put(path: string, data: HolsterData): Promise<HolsterOperationResult> {
    return new Promise((resolve) => {
      this.navigateToPath(this.holster, path).put(data, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

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
  async set(path: string, data: HolsterData): Promise<HolsterOperationResult> {
    return new Promise((resolve) => {
      this.navigateToPath(this.holster, path).set(data, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

        resolve(result);
      });
    });
  }

  /**
   * Removes data at the specified path
   * @param path Path to remove
   * @returns Promise resolving to operation result
   */
  async remove(path: string): Promise<HolsterOperationResult> {
    return new Promise((resolve) => {
      this.navigateToPath(this.holster, path).put(null, (ack: any) => {
        const result = ack.err
          ? { success: false, error: ack.err }
          : { success: true };

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
      const user = this.holster.user();
      return !!(user && user.is && user.is.pub);
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }

  logout(): void {
    try {
      const currentUser = this.holster.user();
      if (!currentUser || !currentUser.is) {
        console.log("No user logged in, skipping logout");
        return;
      }

      // Log out user
      try {
        currentUser.leave();
      } catch (holsterError) {
        console.error("Error during Holster logout:", holsterError);
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
          sessionStorage.removeItem("holsterSessionData");
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
   * Adds a new peer to the network. Not supported by Holster.
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    console.warn("Holster does not support dynamically adding peers.");
  }

  /**
   * Removes a peer from the network. Not supported by Holster.
   * @param peer URL of the peer to remove
   */
  removePeer(peer: string): void {
    console.warn("Holster does not support dynamically removing peers.");
  }

  /**
   * Gets the list of currently connected peers
   * @returns Array of peer URLs
   */
  getCurrentPeers(): string[] {
    return this.peers;
  }

  /**
   * Gets the list of all configured peers (connected and disconnected)
   * @returns Array of peer URLs
   */
  getAllConfiguredPeers(): string[] {
    return this.peers;
  }

  /**
   * Gets detailed information about all peers
   * @returns Object with peer information
   */
  getPeerInfo(): { [peer: string]: { connected: boolean; status: string } } {
    const peerInfo: {
      [peer: string]: { connected: boolean; status: string };
    } = {};
    for (const peer of this.peers) {
        peerInfo[peer] = {
            connected: false, // Cannot determine status
            status: "unknown"
        }
    }
    return peerInfo;
  }

  /**
   * Reconnects to a specific peer. Not supported by Holster.
   * @param peer URL of the peer to reconnect
   */
  reconnectToPeer(peer: string): void {
    console.warn("Holster does not support dynamically reconnecting to peers.");
  }

  /**
   * Clears all peers and optionally adds new ones. Not supported by Holster.
   * @param newPeers Optional array of new peers to add
   */
  resetPeers(newPeers?: string[]): void {
    console.warn("Holster does not support dynamically resetting peers. Please create a new HolsterInstance.");
  }

  /**
   * Signs up a new user using direct Holster authentication
   * @param username Username
   * @param password Password
   * @param pair Optional SEA pair for Web3 login
   * @returns Promise resolving to signup result
   */
  async signUp(
    username: string,
    password: string,
    pair?: any | null,
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

      // Create new user - use different method based on authentication type
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
      this.user = this.holster.user();

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
          sea: (this.holster.user() as any)?._?.sea
            ? {
                pub: (this.holster.user() as any)._?.sea.pub,
                priv: (this.holster.user() as any)._?.sea.priv,
                epub: (this.holster.user() as any)._?.sea.epub,
                epriv: (this.holster.user() as any)._?.sea.epriv,
              }
            : undefined,
        };
      }
    } catch (error) {
      console.error(`Exception during signup for ${username}: ${error}`);
      return { success: false, error: `Signup failed: ${error}` };
    }
  }

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

  private validateSignupCredentials(
    username: string,
    password: string,
    pair?: any | null,
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
      return { valid: true };
    }

    // Validate password strength
    return this.validatePasswordStrength(password);
  }

  private async checkUserExistence(
    username: string,
    password: string,
    pair?: any | null,
  ): Promise<UserExistenceResult> {
    return new Promise<UserExistenceResult>((resolve) => {
      if (pair) {
        this.holster.user().auth(pair, (ack: any) => {
          if (ack.err) {
            resolve({ exists: false, error: ack.err });
          } else {
            resolve({ exists: true, userPub: this.holster.user().is?.pub });
          }
        });
      } else {
        this.holster.user().auth(username, password, (ack: any) => {
          if (ack.err) {
            resolve({ exists: false, error: ack.err });
          } else {
            resolve({ exists: true, userPub: this.holster.user().is?.pub });
          }
        });
      }
    });
  }

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

        this.holster.user().create(normalizedUsername, password, (ack: any) => {
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

  private async authenticateNewUser(
    username: string,
    password: string,
    pair?: any | null,
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
          this.holster.user().auth(pair, (ack: any) => {
            console.log(`Pair authentication after creation result:`, ack);
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Add a small delay to ensure user state is properly set
              setTimeout(() => {
                // Extract userPub from multiple possible sources
                const userPub =
                  ack.pub || this.holster.user().is?.pub || ack.user?.pub;
                console.log(`Extracted userPub after pair auth: ${userPub}`);
                console.log(`User object after pair auth:`, this.holster.user());
                console.log(`User.is after pair auth:`, this.holster.user().is);

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
          this.holster.user().auth(normalizedUsername, password, (ack: any) => {
            console.log(`Password authentication after creation result:`, ack);
            if (ack.err) {
              console.error(`Authentication after creation failed: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              // Add a small delay to ensure user state is properly set
              setTimeout(() => {
                // Extract userPub from multiple possible sources
                const userPub =
                  ack.pub || this.holster.user().is?.pub || ack.user?.pub;
                console.log(
                  `Extracted userPub after password auth: ${userPub}`,
                );
                console.log(
                  `User object after password auth:`,
                  this.holster.user(),
                );
                console.log(`User.is after password auth:`, this.holster.user().is);

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

      const existingUser = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(
            `⚠️ Timeout getting user data for ${userPub} - proceeding with null`,
          );
          resolve(null);
        }, 5000); // 5 second timeout

        this.holster.get(userPub).once((data: any) => {
          clearTimeout(timeout);
          resolve(data);
        });
      });

      // Check if user already has metadata to avoid overwriting
      if (!existingUser) {
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn(
                `⚠️ Timeout saving user metadata for ${userPub} - continuing`,
              );
              resolve({ ok: 0 }); // Resolve with mock success to continue
            }, 5000); // 5 second timeout

            this.holster
              .get(userPub)
              .put({ username: normalizedUsername }, (ack: any) => {
                clearTimeout(timeout);
                if (ack.err) {
                  console.error(`Error saving user metadata: ${ack.err}`);
                  reject(ack.err);
                } else {
                  // User metadata saved successfully
                  resolve(ack);
                }
              });
          });
        } catch (metadataError) {
          console.error(`Error saving user metadata: ${metadataError}`);
          // Don't throw here, continue with other operations
        }

        // Create username mapping
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn(
                `⚠️ Timeout creating username mapping for ${normalizedUsername} - continuing`,
              );
              resolve({ ok: 0 }); // Resolve with mock success to continue
            }, 5000); // 5 second timeout

            this.node
              .get("usernames")
              .get(normalizedUsername)
              .put(userPub, (ack: any) => {
                clearTimeout(timeout);
                if (ack.err) {
                  reject(ack.err);
                } else {
                  // Username mapping created successfully
                  resolve(ack);
                }
              });
          });
        } catch (mappingError) {
          console.error(`Error creating username mapping: ${mappingError}`);
          // Don't throw here, continue with other operations
        }

        // Add user to users collection
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn(
                `⚠️ Timeout adding user to collection for ${userPub} - continuing`,
              );
              resolve({ ok: 0 }); // Resolve with mock success to continue
            }, 5000); // 5 second timeout

            this.node.get("users").set(this.holster.get(userPub), (ack: any) => {
              clearTimeout(timeout);
              if (ack.err) {
                reject(ack.err);
              } else {
                // User added to collection successfully
                resolve(ack);
              }
            });
          });
        } catch (collectionError) {
          console.error(`Error adding user to collection: ${collectionError}`);
          // Don't throw here, continue with other operations
        }
      }

      return {
        success: true,
        userPub: userPub,
        username: normalizedUsername,
        isNewUser: !existingUser || !(existingUser as any).username,
        // Get the SEA pair from the user object
        sea: (this.holster.user() as any)?._?.sea
          ? {
              pub: (this.holster.user() as any)._?.sea.pub,
              priv: (this.holster.user() as any)._?.sea.priv,
              epub: (this.holster.user() as any)._?.sea.epub,
              epriv: (this.holster.user() as any)._?.sea.epriv,
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

  private async createNewUserWithPair(
    username: string,
    pair: any,
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

        // For pair-based authentication, we don't need to call holster.user().create()
        // because the pair already contains the cryptographic credentials
        // We just need to validate that the pair is valid and return success
        console.log(
          `User created successfully with pair for: ${normalizedUsername}`,
        );
        resolve({ success: true, userPub: pair.pub });
      },
    );
  }

  private async performAuthentication(
    username: string,
    password: string,
    pair?: any | null,
  ): Promise<{ success: boolean; error?: string; ack?: any }> {
    return new Promise<{ success: boolean; error?: string; ack?: any }>(
      (resolve) => {
        console.log(`Attempting authentication for user: ${username}`);

        if (pair) {
          this.holster.user().auth(pair, (ack: any) => {
            console.log(`Pair authentication result:`, ack);
            if (ack.err) {
              console.error(`Login error for ${username}: ${ack.err}`);
              resolve({ success: false, error: ack.err });
            } else {
              resolve({ success: true, ack });
            }
          });
        } else {
          this.holster.user().auth(username, password, (ack: any) => {
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

  private buildLoginResult(username: string, userPub: string): AuthResult {
    // Get the SEA pair from the user object
    const seaPair = (this.holster.user() as any)?._?.sea;

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
    pair?: any | null,
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

      const userPub = this.holster.user().is?.pub;

      console.log(
        `Login authentication successful, extracted userPub: ${userPub}`,
      );
      console.log(`User object:`, this.holster.user());
      console.log(`User.is:`, this.holster.user().is);

      if (!userPub) {
        return {
          success: false,
          error: "Authentication failed: No user pub returned.",
        };
      }

      // Pass the userPub to runPostAuthOnAuthResult
      try {
        await this.runPostAuthOnAuthResult(username, userPub, {
          success: true,
          userPub: userPub,
        });
      } catch (postAuthError) {
        console.error(`Post-auth error during login: ${postAuthError}`);
        // Continue with login even if post-auth fails
      }

      // Save credentials for future sessions
      try {
        const userInfo = {
          username,
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

  private async encryptSessionData(data: any): Promise<string> {
    try {
      // Use a derived key from device fingerprint for encryption
      const deviceInfo =
        navigator.userAgent +
        (typeof screen !== "undefined"
          ? screen.width + "x" + screen.height
          : "");
      const encryptionKey = await this.sea.work(deviceInfo, null, null, {
        name: "SHA-256",
      });

      if (!encryptionKey) {
        throw new Error("Failed to generate encryption key");
      }

      const encryptedData = await this.sea.encrypt(
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

  private async decryptSessionData(encryptedData: string): Promise<any> {
    try {
      // Use the same device fingerprint for decryption
      const deviceInfo =
        navigator.userAgent +
        (typeof screen !== "undefined"
          ? screen.width + "x" + screen.height
          : "");
      const encryptionKey = await this.sea.work(deviceInfo, null, null, {
        name: "SHA-256",
      });

      if (!encryptionKey) {
        throw new Error("Failed to generate decryption key");
      }

      const decryptedData = await this.sea.decrypt(encryptedData, encryptionKey);
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
    username: string;
    pair: any | null;
    userPub: string;
  }): void {
    try {
      const sessionInfo = {
        username: userInfo.username,
        pair: userInfo.pair,
        userPub: userInfo.userPub,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      if (typeof sessionStorage !== "undefined") {
        // Encrypt session data before storage
        this.encryptSessionData(sessionInfo)
          .then((encryptedData) => {
            sessionStorage.setItem("holsterSessionData", encryptedData);
          })
          .catch((error) => {
            console.error("Failed to encrypt and save session data:", error);
            // Fallback to unencrypted storage (less secure)
            sessionStorage.setItem(
              "holsterSessionData",
              JSON.stringify(sessionInfo),
            );
          });
      }
    } catch (error) {
      console.error(`Error saving credentials: ${error}`);
    }
  }

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
        if (this.sea && this.sea.work) {
          proofOfWork = await this.sea.work(answersText, null, null, {
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
        if (this.sea && this.sea.encrypt) {
          encryptedHint = await this.sea.encrypt(hint, proofOfWork);
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
              // console.log(`Security data saved to public graph for ${userPub}`);
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

  async forgotPassword(
    username: string,
    securityAnswers: string[],
  ): Promise<{ success: boolean; hint?: string; error?: string }> {
    // Attempting password recovery for

    try {
      // Find the user's data using direct lookup
      const normalizedUsername = username.trim().toLowerCase();
      const userPub = await new Promise<string | null>((resolve) => {
        this.node
          .get("usernames")
          .get(normalizedUsername)
          .once((data: any) => {
            resolve(data || null);
          });
      });

      if (!userPub) {
        return { success: false, error: "User not found" };
      }
      // console.log(`Found user public key for password recovery: ${userPub}`);

      // Access the user's security data directly from their public key node
      const securityData = await new Promise<any>((resolve) => {
        (this.node.get(userPub) as any).get("security").once((data: any) => {
          // console.log(
          //   `Retrieved security data for user ${username}:`,
          //   data ? "found" : "not found",
          // );
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
        if (this.sea && this.sea.work) {
          proofOfWork = await this.sea.work(answersText, null, null, {
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
        if (this.sea && this.sea.decrypt) {
          hint = await this.sea.decrypt(securityData.hint, proofOfWork);
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

  restoreSession(): {
    success: boolean;
    userPub?: string;
    error?: string;
  } {
    try {
        this.holster.user().recall();
        const user = this.holster.user();
        if (user && user.is) {
            return { success: true, userPub: user.is.pub };
        }
        return { success: false, error: "No session found" };
    } catch (error) {
        console.error("Error restoring session:", error);
        return { success: false, error: String(error) };
    }
  }

  async putUserData(path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.holster.user();
      if (!user.is) {
        reject(new Error("User not authenticated"));
        return;
      }

      this.navigateToPath(user, path).put(data, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve(ack);
        }
      });
    });
  }

  async getUserData(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Validazione del path
      if (!path || typeof path !== "string") {
        const error = "Path must be a non-empty string";
        reject(new Error(error));
        return;
      }

      const user = this.holster.user();
      if (!user.is) {
        const error = "User not authenticated";
        reject(new Error(error));
        return;
      }

      // Timeout per evitare attese infinite
      const timeout = setTimeout(() => {
        const error = "Operation timeout";
        reject(new Error(error));
      }, CONFIG.TIMEOUTS.USER_DATA_OPERATION); // 10 secondi di timeout

      try {
        this.navigateToPath(user, path).once((data: any) => {
          clearTimeout(timeout);

          // Gestisci i riferimenti HolsterDB
          if (data && typeof data === "object" && data["#"]) {
            // È un riferimento HolsterDB, carica i dati effettivi
            const referencePath = data["#"];
            this.navigateToPath(this.holster, referencePath).once(
              (actualData: any) => {
                resolve(actualData);
              },
            );
          } else {
            // Dati diretti, restituisci così come sono
            resolve(data);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        reject(error);
      }
    });
  }

  rx(): HolsterRxJS {
    if (!this._rxjs) {
      this._rxjs = new HolsterRxJS(this.holster);
    }
    return this._rxjs;
  }
}

const createHolster = (config: any) => {
  return Holster(config);
};

export {
  Holster,
  HolsterInstance,
  // SEA,
  HolsterRxJS,
  crypto,
  HolsterErrors,
  derive,
  restrictedPut,
  createHolster,
};

export default Holster;

// export type { IHolsterUserInstance, IHolsterInstance, IHolsterChain } from "holster/types";
// export type { HolsterDataEventData, HolsterPeerEventData };
export type { DeriveOptions };
