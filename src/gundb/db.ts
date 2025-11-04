/**
 * GunDB - Simplified database wrapper for Gun.js
 * Provides only essential signup and login functionality
 * Based on Gun.js User Authentication: https://deepwiki.com/amark/gun/6.1-user-authentication
 */

import type { AuthCallback, EventData, EventListener } from "./types";
import type {
  IGunUserInstance,
  IGunChain,
  IGunInstance,
  ISEAPair,
} from "gun/types";
import type { AuthResult, SignUpResult } from "../interfaces/shogun";
import { RxJS } from "./rxjs";
import { EventEmitter } from "../utils/eventEmitter";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";

/**
 * Configuration constants
 */
const CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 8,
  },
  TIMEOUT: 11000, // 30 seconds
} as const;

class DataBase {
  public gun: IGunInstance;
  public user: IGunUserInstance | null = null;
  public crypto: typeof crypto;
  public sea: any;
  public node: IGunChain<any, any, any, any>;

  private readonly onAuthCallbacks: Array<AuthCallback> = [];
  private readonly eventEmitter: EventEmitter;
  private _rxjs?: RxJS;
  private _isDestroyed: boolean = false;

  constructor(
    gun: IGunInstance,
    appScope: string = "shogun",
    core?: any,
    sea?: any,
  ) {
    console.log("[DB] Initializing DataBase");

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Validate Gun instance
    if (!gun) {
      throw new Error("Gun instance is required but was not provided");
    }

    if (typeof gun.user !== "function") {
      throw new Error("Gun instance is invalid: gun.user is not a function");
    }

    this.gun = gun;
    console.log("[DB] Gun instance validated");

    // Recall user session if available
    this.user = this.gun.user().recall({ sessionStorage: true });
    console.log("[DB] User recall completed");

    this.subscribeToAuthEvents();
    console.log("[DB] Auth events subscribed");

    this.crypto = crypto;

    // Get SEA from gun instance or global
    this.sea = sea || null;
    if (!this.sea) {
      if ((this.gun as any).SEA) {
        this.sea = (this.gun as any).SEA;
      } else if ((globalThis as any).Gun?.SEA) {
        this.sea = (globalThis as any).Gun.SEA;
      } else if ((globalThis as any).SEA) {
        this.sea = (globalThis as any).SEA;
      }
    }

    this._rxjs = new RxJS(this.gun);
    this.node = this.gun.get(appScope) as IGunChain<any, any, any, any>;

    console.log("[DB] DataBase initialization completed");
  }

  /**
   * Initialize with app scope
   */
  initialize(appScope: string = "shogun"): void {
    console.log(`[DB] Initializing with appScope: ${appScope}`);
    this.node = this.gun.get(appScope) as IGunChain<any, any, any, any>;
    console.log("[DB] App scope node initialized");
  }

  /**
   * Subscribe to Gun auth events
   */
  private subscribeToAuthEvents(): void {
    this.gun.on("auth", (ack: any) => {
      if (ack.err) {
        console.error("[DB] Auth event error:", ack.err);
      } else {
        this.notifyAuthListeners(ack.sea?.pub || "");
      }
    });
  }

  /**
   * Notify all auth callbacks
   */
  private notifyAuthListeners(pub: string): void {
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Register authentication callback
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
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    try {
      const user = this.gun.user();
      return !!(user && user.is && user.is.pub);
    } catch (error) {
      return false;
    }
  }

  /**
   * Restore session from storage
   */
  restoreSession(): {
    success: boolean;
    userPub?: string;
    error?: string;
  } {
    try {
      if (typeof sessionStorage === "undefined") {
        return { success: false, error: "sessionStorage not available" };
      }

      const sessionData = sessionStorage.getItem("gunSessionData");
      if (!sessionData) {
        return { success: false, error: "No saved session" };
      }

      const session = JSON.parse(sessionData);
      if (!session.userPub) {
        return { success: false, error: "Invalid session data" };
      }

      // Check if session is expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        sessionStorage.removeItem("gunSessionData");
        return { success: false, error: "Session expired" };
      }

      // Verify session restoration
      const user = this.gun.user();
      if (user.is && user.is.pub === session.userPub) {
        this.user = user;
        return { success: true, userPub: session.userPub };
      }

      return { success: false, error: "Session verification failed" };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    try {
      const currentUser = this.gun.user();
      if (currentUser && currentUser.is) {
        currentUser.leave();
      }
      this.user = null;

      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("gunSessionData");
      }
    } catch (error) {
      console.error("[DB] Error during logout:", error);
    }
  }

  /**
   * Validate password strength
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
    return { valid: true };
  }

  /**
   * Validate signup credentials
   */
  private validateSignupCredentials(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): { valid: boolean; error?: string } {
    if (!username || username.length < 1) {
      return {
        valid: false,
        error: "Username must be more than 0 characters long",
      };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return {
        valid: false,
        error:
          "Username can only contain letters, numbers, dots, underscores, and hyphens",
      };
    }

    if (pair) {
      if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        return { valid: false, error: "Invalid pair provided" };
      }
      return { valid: true };
    }

    return this.validatePasswordStrength(password);
  }

  /**
   * Reset authentication state
   */
  private resetAuthState(): void {
    try {
      const user = this.gun.user();
      if (user && (user as any)._) {
        const cat = (user as any)._;
        // Reset Gun's internal auth state
        cat.ing = false;
        cat.auth = null;
        cat.act = null;
        // Clear any pending auth operations
        if (cat.auth) {
          cat.auth = null;
        }
      }
      try {
        user.leave();
      } catch (leaveError) {
        // Ignore leave errors
      }
      this.user = null;
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Build login result
   */
  private buildLoginResult(username: string, userPub: string): AuthResult {
    const seaPair = (this.gun.user() as any)?._?.sea;
    return {
      success: true,
      userPub,
      username,
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
   * Save credentials to session storage
   */
  private saveCredentials(userInfo: {
    alias: string;
    pair: ISEAPair;
    userPub: string;
  }): void {
    try {
      if (typeof sessionStorage !== "undefined") {
        const sessionInfo = {
          username: userInfo.alias,
          pair: userInfo.pair,
          userPub: userInfo.userPub,
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };
        sessionStorage.setItem("gunSessionData", JSON.stringify(sessionInfo));
      }
    } catch (error) {
      console.error("[DB] Error saving credentials:", error);
    }
  }

  /**
   * Sign up a new user
   * Based on Gun.js user().create() - https://deepwiki.com/amark/gun/6.1-user-authentication
   */
  async signUp(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<SignUpResult> {
    const validation = this.validateSignupCredentials(username, password, pair);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    console.log("[DB] Signup validation:", validation);

    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.gun.user() as IGunUserInstance;

    // If the caller provides a key pair, try direct auth first (pair-based signup)
    // Gun's API doesn't natively allow us to register with a pair directly,
    // but we can try creating and then authenticating immediately with the pair,
    // to allow for direct access for known keys.
    if (pair) {
      // Try to directly authenticate with the pair FIRST
      // If this user already exists and the pair is valid, just log in
      try {
        const loginResult = await new Promise<SignUpResult>((resolve) => {
          let callbackInvoked = false;
          const timeoutId = setTimeout(() => {
            if (!callbackInvoked) {
              callbackInvoked = true;
              resolve({ success: false, error: "Pair auth timeout" });
            }
          }, CONFIG.TIMEOUT);

          user.auth(pair, (ack: any) => {
            if (callbackInvoked) {
              return;
            }
            callbackInvoked = true;
            clearTimeout(timeoutId);

            if (ack.err) {
              // Could not login with pair, try to create user with username/password
              resolve({ success: false, error: ack.err });
              return;
            }
            const userPub = user?.is?.pub;
            if (!userPub) {
              this.resetAuthState();
              resolve({ success: false, error: "No userPub available" });
              return;
            }
            this.user = user;
            const alias = user?.is?.alias as string;
            const userPair = (user as any)?._?.sea as ISEAPair;
            this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });
            resolve(
              this.buildLoginResult(alias || normalizedUsername, userPub),
            );
          });
        });

        // If we got a successful result, return it
        if (loginResult && loginResult.success) {
          return loginResult;
        }
        // If pair auth failed, continue to create user with username/password
      } catch (e) {
        // fallback to create user
        // (continue below)
      }
    }

    console.log(
      "[DB] Falling back to classic username/password account creation",
    );
    // Fallback to classic username/password account creation
    const result: SignUpResult = await new Promise<SignUpResult>((resolve) => {
      let callbackInvoked = false;
      const timeoutId = setTimeout(() => {
        if (!callbackInvoked) {
          callbackInvoked = true;
          console.log("[DB] Signup timeout");
          this.resetAuthState();
          resolve({ success: false, error: "Signup timeout" });
        }
      }, CONFIG.TIMEOUT);

      user.create(normalizedUsername, password, (createAck: any) => {
        if (callbackInvoked) {
          return;
        }

        console.log(
          "[DB] Signup callback received:",
          JSON.stringify(createAck),
        );

        // Check for error: ack.err or ack.ok !== 0 means error
        if (
          createAck.err ||
          (createAck.ok !== undefined && createAck.ok !== 0)
        ) {
          callbackInvoked = true;
          clearTimeout(timeoutId);
          this.resetAuthState();
          resolve({ success: false, error: createAck.err || "Signup failed" });
          return;
        }

        // After create, we need to authenticate to get the user fully logged in
        // Use ack.pub if available for the userPub
        const userPub = createAck.pub;

        if (!userPub) {
          callbackInvoked = true;
          clearTimeout(timeoutId);
          this.resetAuthState();
          resolve({
            success: false,
            error: "No userPub available from signup",
          });
          return;
        }

        // Now authenticate with the username/password to complete the login
        user.auth(normalizedUsername, password, (authAck: any) => {
          if (callbackInvoked) {
            return;
          }
          callbackInvoked = true;
          clearTimeout(timeoutId);

          if (authAck.err) {
            this.resetAuthState();
            resolve({
              success: false,
              error: authAck.err || "Authentication after signup failed",
            });
            return;
          }

          // Verify user is authenticated
          const authenticatedUserPub = user?.is?.pub;
          if (!authenticatedUserPub) {
            this.resetAuthState();
            resolve({
              success: false,
              error: "User not authenticated after signup",
            });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: authenticatedUserPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          const sea = (user as any)?._?.sea;
          resolve({
            success: true,
            userPub: authenticatedUserPub,
            username: normalizedUsername,
            isNewUser: true,
            sea: sea
              ? {
                  pub: sea.pub,
                  priv: sea.priv,
                  epub: sea.epub,
                  epriv: sea.epriv,
                }
              : undefined,
          });
        });
      });
    });

    return result;
  }

  /**
   * Login with username and password
   * Based on Gun.js user().auth() - https://deepwiki.com/amark/gun/6.1-user-authentication
   */
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.gun.user();

    console.log("[DB] Login with username:", normalizedUsername);

    return new Promise<AuthResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.resetAuthState();
        resolve({ success: false, error: "Login timeout" });
      }, CONFIG.TIMEOUT);

      if (pair) {
        user.auth(pair, (ack: any) => {
          clearTimeout(timeoutId);

          if (ack.err) {
            this.resetAuthState();
            resolve({ success: false, error: ack.err });
            return;
          }

          const userPub = user?.is?.pub;
          if (!userPub) {
            this.resetAuthState();
            resolve({ success: false, error: "No userPub available" });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
        });
      } else {
        user.auth(normalizedUsername, password, (ack: any) => {
          clearTimeout(timeoutId);

          if (ack.err) {
            this.resetAuthState();
            resolve({ success: false, error: ack.err });
            return;
          }

          const userPub = user?.is?.pub;
          if (!userPub) {
            this.resetAuthState();
            resolve({ success: false, error: "No userPub available" });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
        });
      }
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): { pub: string; user?: any } | null {
    try {
      const user = this.gun.user();
      if (user && user.is && user.is.pub) {
        return {
          pub: user.is.pub,
          user: user,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user's public key
   * @returns {string | null} User's public key or null if not logged in
   */
  getUserPub(): string | null {
    try {
      const user = this.gun.user();
      return user?.is?.pub || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Login with SEA pair directly
   * @param username - Username for identification
   * @param pair - GunDB SEA pair for authentication
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Authenticates user using a GunDB pair directly without password
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
    // Validate pair structure
    if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
      return {
        success: false,
        error: "Invalid pair structure - missing required keys",
      };
    }

    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.gun.user();

    console.log("[DB] Login with pair for username:", normalizedUsername);

    return new Promise<AuthResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.resetAuthState();
        resolve({ success: false, error: "Login with pair timeout" });
      }, CONFIG.TIMEOUT);

      user.auth(pair, (ack: any) => {
        clearTimeout(timeoutId);

        if (ack.err) {
          this.resetAuthState();
          resolve({ success: false, error: ack.err });
          return;
        }

        const userPub = user?.is?.pub;
        if (!userPub) {
          this.resetAuthState();
          resolve({ success: false, error: "No userPub available" });
          return;
        }

        this.user = user;
        const alias = user?.is?.alias as string;
        const userPair = (user as any)?._?.sea as ISEAPair;

        try {
          this.saveCredentials({
            alias: alias || normalizedUsername,
            pair: pair ?? userPair,
            userPub: userPub,
          });
        } catch (saveError) {
          // Ignore save errors
        }

        resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
      });
    });
  }

  /**
   * Login with SEA pair
   */
  // Legacy method - kept for backward compatibility
  async loginWithPairLegacy(
    username: string,
    pair: ISEAPair,
  ): Promise<AuthResult> {
    return this.login(username, "", pair);
  }

  /**
   * Get RxJS module
   */
  rx(): RxJS {
    return this._rxjs as RxJS;
  }

  /**
   * Destroy database instance
   */
  public destroy(): void {
    if (this._isDestroyed) return;

    console.log("[DB] Destroying DataBase instance...");
    this._isDestroyed = true;

    this.onAuthCallbacks.length = 0;

    // Clear event listeners
    this.eventEmitter.removeAllListeners();

    if (this.user) {
      try {
        this.user.leave();
      } catch (error) {
        // Ignore
      }
      this.user = null;
    }

    this._rxjs = undefined;
    console.log("[DB] DataBase instance destroyed");
  }

  /**
   * Aggressive auth cleanup (kept for compatibility with tests)
   */
  public aggressiveAuthCleanup(): void {
    console.log("🧹 Performing aggressive auth cleanup...");
    this.resetAuthState();
    this.logout();
    console.log("✓ Aggressive auth cleanup completed");
  }

  /**
   * Event emitter methods for CoreInitializer compatibility
   */
  on(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.off(event, listener);
  }

  once(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.once(event, listener);
  }

  emit(event: string | symbol, data?: EventData): boolean {
    return this.eventEmitter.emit(event, data);
  }
}

export { DataBase, RxJS, crypto, GunErrors };
export { default as derive, type DeriveOptions } from "./derive";
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData } from "../interfaces/events";
