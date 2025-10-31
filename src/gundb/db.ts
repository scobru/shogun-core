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
  TIMEOUT: 30000, // 30 seconds
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
      }
      user.leave();
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

    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();

    return new Promise<SignUpResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.resetAuthState();
        resolve({ success: false, error: "Signup timeout" });
      }, CONFIG.TIMEOUT);

      const callback = (ack: any) => {
        clearTimeout(timeoutId);
        if (ack.err) {
          this.resetAuthState();
          resolve({ success: false, error: ack.err });
          return;
        }

        const user = this.gun.user();
        const userPub = user?.is?.pub;
        if (!userPub) {
          this.resetAuthState();
          resolve({ success: false, error: "No userPub available" });
          return;
        }

        this.user = user;
        const sea = (user as any)?._?.sea;
        resolve({
          success: true,
          userPub,
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
      };

      if (pair) {
        this.gun.user().auth(pair, callback);
      } else {
        this.gun.user().create(normalizedUsername, password, callback);
      }
    });
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

    return new Promise<AuthResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.resetAuthState();
        resolve({ success: false, error: "Login timeout" });
      }, CONFIG.TIMEOUT);

      const callback = (ack: any) => {
        clearTimeout(timeoutId);
        if (ack.err) {
          this.resetAuthState();
          resolve({ success: false, error: ack.err });
          return;
        }

        const user = this.gun.user();
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
      };

      if (pair) {
        this.gun.user().auth(pair, callback);
      } else {
        this.gun.user().auth(normalizedUsername, password, callback);
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
   * Login with SEA pair
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
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
