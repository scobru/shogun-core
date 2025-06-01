/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */

import { IGunUserInstance, IGunInstance, IGunChain } from "gun";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunRxJS } from "./rxjs-integration";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
import * as utils from "./utils";

import Gun from "gun";
import "gun/sea";   

class GunDB {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  public crypto: typeof crypto;
  public utils: typeof utils;
  public node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;

  private readonly onAuthCallbacks: Array<(user: any) => void> = [];

  // Integrated modules
  private _rxjs?: GunRxJS;

  constructor(gun: IGunInstance<any>, appScope: string = "shogun") {
    log("Initializing GunDB");

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

    try {
      this.user = this.gun.user().recall({ sessionStorage: true });
    } catch (error) {
      logError("Error initializing Gun user:", error);
      throw new Error(`Failed to initialize Gun user: ${error}`);
    }

    this.subscribeToAuthEvents();

    // bind crypto and utils
    this.crypto = crypto;
    this.utils = utils;

    this.node = this.gun.get(appScope);
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
   * Adds a new peer to the network
   * @param peer URL of the peer to add
   */
  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
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

      // Wait a moment then add it back
      setTimeout(() => {
        this.addPeer(peer);
        log(`Reconnected to peer: ${peer}`);
      }, 1000);
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
    return this.gun.get(path);
  }

  /**
   * Puts data at the specified path
   * @param path Path to store data
   * @param data Data to store
   * @returns Promise resolving to operation result
   */
  async put(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
        );
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
      this.gun.get(path).set(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
        );
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
      this.gun.get(path).put(null, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true },
        );
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

      // Create user directly with Gun
      const createResult = await new Promise<any>((resolve) => {
        this.gun.user().create(username, password, (ack: any) => {
          if (ack.err) {
            logError(`User creation error: ${ack.err}`);
            resolve({ success: false, error: ack.err });
          } else {
            log(`User created successfully: ${username}`);
            resolve({ success: true, pub: ack.pub });
          }
        });
      });

      if (!createResult.success) {
        return createResult;
      }

      // Store user metadata with improved safety
      try {
        const user = this.gun.get(createResult.pub).put({
          username: username,
          pub: createResult.pub,
        });

        this.gun.get("users").set(user);
      } catch (metadataError) {
        logError(`Warning: Could not store user metadata: ${metadataError}`);
        // Continue with login attempt even if metadata storage fails
      }

      // Login after creation
      log(`Attempting login after registration for: ${username}`);
      try {
        const loginResult = await this.login(username, password);

        if (!loginResult.success) {
          logError(`Login after registration failed: ${loginResult.error}`);
          return {
            success: false,
            error: `Registration completed but login failed: ${loginResult.error}`,
          };
        }

        log(`Login after registration successful for: ${username}`);
        return loginResult;
      } catch (loginError) {
        logError(`Exception during post-registration login: ${loginError}`);
        return {
          success: false,
          error: "Exception during post-registration login",
        };
      }
    } catch (error) {
      logError(`Unexpected error during registration flow: ${error}`);
      return {
        success: false,
        error: `Unexpected error during registration: ${error}`,
      };
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
      // Authenticate with Gun directly
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
        const result = { success: false, error: authResult.error };
        if (callback) callback(result);
        return result;
      }

      const userPub = this.gun.user().is?.pub;

      // Update users collection if needed - improved null safety
      try {
        let userExists = false;

        // Check if user already exists in the collection
        await new Promise<void>((resolve) => {
          this.gun
            .get("users")
            .map()
            .once((userData, key) => {
              if (userData && userData.pub === userPub) {
                userExists = true;
              }
            });

          // Give it a moment to check all users
          setTimeout(() => resolve(), 100);
        });

        // Only add user if not already in collection
        if (!userExists && userPub) {
          const newUser = this.gun.get(userPub).put({
            username: username,
            pub: userPub,
          });
          this.gun.get("users").set(newUser);
        }
      } catch (collectionError) {
        // Log but don't fail the login for collection errors
        logError(
          `Warning: Could not update user collection: ${collectionError}`,
        );
      }

      log(`Login successful for: ${username} (${userPub})`);
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
      const pair = (this.gun.user() as any)?._?.sea;
      if (pair && typeof localStorage !== "undefined") {
        localStorage.setItem("pair", JSON.stringify(pair));
      }
    } catch (error) {
      console.error("Error saving auth pair:", error);
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

      // Direct logout using Gun
      this.gun.user().leave();
      log("Logout completed");
    } catch (error) {
      logError("Error during logout:", error);
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

    // Verify that the user is authenticated
    const loginResult = await this.login(username, password);
    if (!loginResult.success) {
      return { success: false, error: "Authentication failed" };
    }

    try {
      // Generate a proof of work from security question answers
      const proofOfWork = (await this.crypto.hashText(
        securityAnswers.join("|"),
      )) as string;

      // Encrypt the password hint with the proof of work
      // The PoW (a string) is used as the encryption key
      const encryptedHint = await this.crypto.encrypt(hint, proofOfWork);

      // Save security questions and encrypted hint
      await this.saveUserData("security", {
        questions: securityQuestions,
        hint: encryptedHint,
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
      // Verify the user exists
      const user = this.gun.user().recall({ sessionStorage: true });
      if (!user || !user.is) {
        return { success: false, error: "User not found" };
      }

      // Retrieve security questions and encrypted hint
      const securityData = await this.getUserData("security");

      if (!securityData || !securityData.hint) {
        return {
          success: false,
          error: "No password hint found",
        };
      }

      // Decrypt the password hint with the proof of work
      const hint = await this.crypto.decrypt(
        securityData.hint,
        (await this.crypto.hashText(securityAnswers.join("|"))) as string,
      );

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
   * @param path Path to save the data
   * @param data Data to save
   * @returns Promise that resolves when the data is saved
   */
  async saveUserData(path: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.gun.user();
      if (!user.is) {
        reject(new Error("User not authenticated"));
        return;
      }

      user.get(path).put(data, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Gets user data from the specified path
   * @param path Path to get the data from
   * @returns Promise that resolves with the data
   */
  async getUserData(path: string): Promise<any> {
    return new Promise((resolve) => {
      const user = this.gun.user();
      if (!user.is) {
        resolve(null);
        return;
      }

      user.get(path).once((data: any) => {
        resolve(data);
      });
    });
  }

  // Errors
  static Errors = GunErrors;
}

export { GunDB };
