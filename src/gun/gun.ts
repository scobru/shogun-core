/* Updated GunDB class with:
1. Dynamic auth token usage
2. Concurrency-safe authentication
3. Dynamic peer linking
4. Support for remove/unset operations
*/

import Gun from "gun";
import "gun/sea";
import { IGunInstance, IGunUserInstance } from "gun/types";
import CONFIG from "../config";
import { log, logError } from "../utils/logger";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { GunDBOptions } from "../types/gun";

export interface AuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  error?: string;
}

interface RetryConfig {
  attempts: number;
  delay: number;
}

class GunDB {
  public gun: IGunInstance<any>;
  public user: IGunUserInstance<any> | null = null;
  private readonly onAuthCallbacks: Array<(user: any) => void> = [];
  private readonly retryConfig: RetryConfig;
  private _authenticating: boolean = false;
  private authToken?: string;

  constructor(options: Partial<GunDBOptions> = {}) {
    log("Initializing GunDB");

    this.retryConfig = {
      attempts: options.retryAttempts ?? 3,
      delay: options.retryDelay ?? 1000,
    };

    const config = {
      peers: options.peers,
      localStorage: options.localStorage ?? false,
      radisk: options.radisk ?? false,
      multicast: options.multicast ?? false,
      axe: options.axe ?? false,
    };

    this.authToken = options.authToken;

    if (this.authToken) {
      const preview = `${this.authToken.substring(0, 3)}...${this.authToken.slice(-3)}`;
      log(`Auth token received (${preview})`);
    } else {
      log("No auth token received");
    }

    this.gun = new Gun(config);
    this.user = this.gun.user().recall({ sessionStorage: true });

    if (this.authToken) {
      Gun.on("opt", (ctx: any) => {
        if (ctx.once) return;
        ctx.on("out", (msg: any) => {
          msg.headers = { token: this.authToken };
          ctx.to.next(msg);
        });
      });
      log("Auth token handler configured for outgoing messages");
    }

    this.subscribeToAuthEvents();
  }

  private async retry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < this.retryConfig.attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < this.retryConfig.attempts - 1) {
          const delay = this.retryConfig.delay * Math.pow(2, i);
          log(`Retry attempt ${i + 1} for ${context} in ${delay}ms`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError!;
  }

  private subscribeToAuthEvents() {
    this.gun.on("auth", (ack: any) => {
      log("Auth event received:", ack);

      if (ack.err) {
        ErrorHandler.handle(
          ErrorType.GUN,
          "AUTH_EVENT_ERROR",
          ack.err,
          new Error(ack.err)
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

  static withPeers(peers: string[] = CONFIG.PEERS): GunDB {
    return new GunDB({ peers });
  }

  addPeer(peer: string): void {
    this.gun.opt({ peers: [peer] });
    log(`Added new peer: ${peer}`);
  }

  onAuth(callback: (user: any) => void): () => void {
    this.onAuthCallbacks.push(callback);
    const user = this.gun.user();
    if (user && user.is) callback(user);
    return () => {
      const i = this.onAuthCallbacks.indexOf(callback);
      if (i !== -1) this.onAuthCallbacks.splice(i, 1);
    };
  }

  getGun(): IGunInstance<any> {
    return this.gun;
  }

  getUser(): any {
    return this.gun.user();
  }

  get(path: string): any {
    return this.gun.get(path);
  }

  async put(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  async set(path: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).set(data, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  async remove(path: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).put(null, (ack: any) => {
        resolve(
          ack.err ? { success: false, error: ack.err } : { success: true }
        );
      });
    });
  }

  async unset(path: string, node: any): Promise<any> {
    return new Promise((resolve) => {
      this.gun.get(path).unset(node);
      resolve({ success: true });
    });
  }

  async signUp(username: string, password: string): Promise<any> {
    log("Attempting user registration:", username);
    return new Promise((resolve) => {
      this.gun.user().create(username, password, async (ack: any) => {
        if (ack.err) {
          logError(`Registration error: ${ack.err}`);
          resolve({ success: false, error: ack.err });
        } else {
          const loginResult = await this.login(username, password);
          resolve(loginResult);
        }
      });
    });
  }

  async login(
    username: string,
    password: string,
    callback?: (result: any) => void
  ): Promise<any> {
    if (this.isAuthenticating()) {
      const err = "Authentication already in progress";
      log(err);
      return { success: false, error: err };
    }

    this._setAuthenticating(true);
    log(`Attempting login for user: ${username}`);

    return new Promise((resolve) => {
      try {
        this.gun.user().leave();
      } catch {}

      const timeout = setTimeout(() => {
        this._setAuthenticating(false);
        resolve({ success: false, error: "Login timeout" });
      }, 3000);

      this.gun.user().auth(username, password, (ack: any) => {
        clearTimeout(timeout);
        this._setAuthenticating(false);

        if (ack.err) {
          log(`Login error: ${ack.err}`);
          resolve({ success: false, error: ack.err });
        } else {
          this._savePair();
          resolve({
            success: true,
            userPub: this.gun.user().is?.pub,
            username,
          });
        }
      });
    });
  }

  private _savePair(): void {
    try {
      const pair = this.gun.user()?._?.sea;
      if (pair && typeof localStorage !== "undefined") {
        localStorage.setItem("pair", JSON.stringify(pair));
      }
    } catch (error) {
      console.error("Error saving auth pair:", error);
    }
  }

  private isAuthenticating(): boolean {
    return this._authenticating;
  }

  private _setAuthenticating(value: boolean): void {
    this._authenticating = value;
  }

  logout(): void {
    try {
      this.gun.user().leave();
      log("Logout completed");
    } catch (error) {
      logError("Error during logout:", error);
    }
  }

  isLoggedIn(): boolean {
    return !!this.gun.user()?.is?.pub;
  }

  getCurrentUser(): any {
    const pub = this.gun.user()?.is?.pub;
    return pub ? { pub, user: this.gun.user() } : null;
  }

  private async save(node: any, data: any): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve, reject) => {
          node.put(data, (ack: any) =>
            ack.err ? reject(new Error(ack.err)) : resolve(data)
          );
        }),
      "data save operation"
    );
  }

  private async read(node: any): Promise<any> {
    return this.retry(
      () =>
        new Promise((resolve) => {
          node.once((data: any) => resolve(data));
        }),
      "data read operation"
    );
  }

  async saveUserData(path: string, data: any): Promise<any> {
    if (!this.isLoggedIn()) throw new Error("User not authenticated");
    return this.save(this.gun.user().get(path), data);
  }

  async getUserData(path: string): Promise<any> {
    if (!this.isLoggedIn()) throw new Error("User not authenticated");
    const data = await this.read(this.gun.user().get(path));
    return data || null;
  }

  async savePublicData(node: string, key: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gun
        .get(node)
        .get(key)
        .put(data, (ack: any) => {
          ack && ack.err ? reject(new Error(ack.err)) : resolve(data);
        });
    });
  }

  async getPublicData(node: string, key: string): Promise<any> {
    return new Promise((resolve) => {
      this.gun
        .get(node)
        .get(key)
        .once((data) => resolve(data || null));
    });
  }

  async generateKeyPair(): Promise<any> {
    return (Gun as any).SEA.pair();
  }
}

export { GunDB };
