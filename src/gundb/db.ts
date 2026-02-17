import type { AuthCallback, EventData, EventListener } from './types';
import type {
  IGunUserInstance,
  IGunChain,
  IGunInstance,
  ISEAPair,
} from 'gun/types';
import type { AuthResult, SignUpResult } from '../interfaces/shogun';
import { RxJS } from './rxjs';
import { EventEmitter } from '../utils/eventEmitter';
import * as GunErrors from './errors';
import * as crypto from './crypto';

/**
 * GunDB configuration constants.
 * @internal
 */
const CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;

/**
 * DataBase
 *
 * Manages GunDB user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 */
class DataBase {
  /** GunDB instance */
  public gun: IGunInstance;
  /** Cached user instance or `null` if not logged in */
  public user: IGunUserInstance | null = null;
  /** Crypto utilities used internally */
  public crypto: typeof crypto;
  /** Gun SEA cryptography context (usually gun.SEA) */
  public sea: any;
  /** Gun node dedicated to mapping usernames to pubkeys */
  private readonly usernamesNode: IGunChain<any, any, any, any>;
  /** ShogunCore instance for emitting events */
  private readonly core?: any;

  /** Registered callbacks for auth state changes */
  private readonly onAuthCallbacks: Array<AuthCallback> = [];
  /** EventEmitter for app-specific event management */
  private readonly eventEmitter: EventEmitter;
  /** RxJS-based GunDB observable/stream helper */
  private _rxjs?: RxJS;
  /** Whether the database instance has been destroyed */
  private _isDestroyed: boolean = false;

  /**
   * Constructs a new DataBase instance connected to a GunDB instance.
   * @param gun The main GunDB instance.
   * @param core Optionally, the root Gun instance (unused in this context).
   * @param sea Optional cryptography (Gun SEA) instance; will be auto-discovered if not provided.
   * @throws If gun or gun.user() is not provided.
   */
  constructor(gun: IGunInstance, core?: any, sea?: any) {
    this.eventEmitter = new EventEmitter();
    this.core = core;

    if (!gun) {
      throw new Error('Gun instance is required but was not provided');
    }
    if (typeof gun.user !== 'function') {
      throw new Error('Gun instance is invalid: gun.user is not a function');
    }

    this.gun = gun;

    this.user = this.gun.user().recall({ sessionStorage: true });
    this.subscribeToAuthEvents();

    this.crypto = crypto;
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

    this.usernamesNode = this.gun.get('usernames') as IGunChain<
      any,
      any,
      any,
      any
    >;

    console.log('[DB] DataBase initialization completed');
  }

  /**
   * Initialize the database instance.
   */
  initialize(): void {
    // Database is already initialized in constructor
  }

  /**
   * Internal: subscribe to GunDB "auth" events and notify listeners.
   * Listeners are invoked on authentication status change.
   * @internal
   */
  private subscribeToAuthEvents(): void {
    this.gun.on('auth', (ack: any) => {
      if (ack.err) {
        console.error('[DB] Auth event error:', ack.err);
      } else {
        this.notifyAuthListeners(ack.sea?.pub || '');
      }
    });
  }

  /**
   * Internal: notify all onAuth callbacks with current user.
   * @param pub User's public key (pub).
   * @internal
   */
  private notifyAuthListeners(pub: string): void {
    const user = this.gun.user();
    this.onAuthCallbacks.forEach((cb) => cb(user));
  }

  /**
   * Listen for authentication/sign-in events (login, logout, etc).
   * @param callback Function to call with new user instance.
   * @returns Function to remove the registered callback.
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
   * Check if a user is currently logged in (there is a valid session).
   * @returns `true` if logged in; otherwise `false`.
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
   * Attempt to restore a previously saved session from sessionStorage.
   * @returns Object indicating success, error, and userPub if restored.
   */
  async restoreSession(): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    try {
      if (typeof sessionStorage === 'undefined') {
        return { success: false, error: 'sessionStorage not available' };
      }

      const sessionData = sessionStorage.getItem('gunSessionData');
      if (!sessionData) {
        return { success: false, error: 'No saved session' };
      }

      const session = JSON.parse(sessionData);

      // Handle legacy plaintext sessions (no version or version < 2)
      if (!session.version || session.version < 2) {
        sessionStorage.removeItem('gunSessionData');
        return { success: false, error: 'Legacy session expired' };
      }

      // Check required fields for encrypted session
      if (
        !session.encrypted ||
        !session.integrity ||
        !session.salt ||
        !session.pub
      ) {
        return { success: false, error: 'Invalid encrypted session format' };
      }

      // 1. Verify integrity hash
      // We hash the encrypted string itself to verify it hasn't been tampered with
      const integrityCheck = await this.sea.work(
        session.encrypted,
        null,
        null,
        { name: 'SHA-256' },
      );
      if (integrityCheck !== session.integrity) {
        sessionStorage.removeItem('gunSessionData');
        return { success: false, error: 'Session integrity check failed' };
      }

      // 2. Derive decryption key
      // Key = SEA.work(username + salt, pub)
      // This ensures the key is tied to the user and the specific session salt
      const key = await this.deriveSessionKey(
        session.username,
        session.salt,
        session.pub,
      );

      // 3. Decrypt payload
      const decryptedData = await this.sea.decrypt(session.encrypted, key);

      if (!decryptedData) {
        sessionStorage.removeItem('gunSessionData');
        return { success: false, error: 'Session decryption failed' };
      }

      // 4. Validate session content
      if (decryptedData.pub !== session.pub) {
        return { success: false, error: 'Session public key mismatch' };
      }

      // Check if session is expired
      if (decryptedData.expiresAt && Date.now() > decryptedData.expiresAt) {
        sessionStorage.removeItem('gunSessionData');
        return { success: false, error: 'Session expired' };
      }

      // Verify session restoration
      const user = this.gun.user();
      if (user.is && user.is.pub === session.pub) {
        this.user = user;
        return { success: true, userPub: session.pub };
      }

      return { success: false, error: 'Session verification failed' };
    } catch (error) {
      console.error('[DB] Restore session error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Log out the current user, clear local state and remove session from storage.
   */
  logout(): void {
    try {
      const wasLoggedIn = !!this.user;
      const currentUser = this.gun.user();
      if (currentUser && currentUser.is) {
        currentUser.leave();
      }
      this.user = null;

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('gunSessionData');
      }

      // Emit auth:logout event if core is available and user was logged in
      if (wasLoggedIn && this.core && typeof this.core.emit === 'function') {
        this.core.emit('auth:logout', undefined);
      }
    } catch (error) {
      console.error('[DB] Error during logout:', error);
    }
  }

  /**
   * Validate that a provided password meets minimum length requirements.
   * @param password Password string to validate.
   * @returns Object indicating validity and, if invalid, an error.
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

    // Sentinel Security Fix: Enforce password complexity
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }
    // eslint-disable-next-line no-useless-escape
    if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }

    return { valid: true };
  }

  /**
   * Validate a signup request's username, password, and/or cryptographic pair.
   * @param username Username string.
   * @param password Password string.
   * @param pair Optional cryptographic SEA pair.
   * @returns Object with validation status and optional error.
   */
  private validateSignupCredentials(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): { valid: boolean; error?: string } {
    if (!username || username.length < 1) {
      return {
        valid: false,
        error: 'Username must be more than 0 characters long',
      };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return {
        valid: false,
        error:
          'Username can only contain letters, numbers, dots, underscores, and hyphens',
      };
    }

    if (pair) {
      if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        return { valid: false, error: 'Invalid pair provided' };
      }
      return { valid: true };
    }

    return this.validatePasswordStrength(password);
  }

  /**
   * Ensures that an alias/username is available in GunDB for registration.
   * @param alias Username to check.
   * @param timeout Timeout in milliseconds (default 5000ms).
   * @throws If the alias is already taken.
   */
  private async ensureAliasAvailable(
    alias: string,
    timeout = 5000,
  ): Promise<void> {
    const available = await this.isAliasAvailable(alias, timeout);
    if (!available) {
      throw new Error(`Alias "${alias}" is already registered in Gun`);
    }
  }

  /**
   * Checks if a given alias/username is available on GunDB.
   * @param alias Username to check for availability.
   * @param timeout Timeout in ms (default: 5000).
   * @returns Promise resolving to `true` if available; otherwise `false`.
   * @throws If alias is invalid or on I/O error.
   */
  private async isAliasAvailable(
    alias: string,
    timeout = 5000,
  ): Promise<boolean> {
    if (typeof alias !== 'string' || !alias.trim()) {
      throw new Error('Alias must be a non-empty string');
    }

    const normalizedAlias = alias.trim().toLowerCase();

    return new Promise<boolean>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Timeout while checking alias availability'));
      }, timeout);

      this.usernamesNode.get(normalizedAlias).once((existingPub: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(!existingPub);
      });
    });
  }

  /**
   * Checks if a given alias/username is taken on GunDB.
   * @param alias Username to check for availability.
   * @returns Promise resolving to `true` if taken; otherwise `false`.
   * @throws If alias is invalid or on I/O error.
   */
  private async isAliasTaken(alias: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Check if username exists by looking up ~@username
      this.gun.get(`~@${alias}`).once((user) => {
        // If user exists, alias is taken (return true)
        // If user is null/undefined, alias is available (return false)
        resolve(!!user);
      });
    });
  }

  /**
   * Register a new alias (username) → public key mapping on GunDB.
   * @param alias The username/alias to register.
   * @param userPub The user's public key.
   * @param timeout Timeout in ms (default 5000).
   * @throws If alias/userPub is invalid or the alias cannot be registered.
   */
  private async registerAlias(
    alias: string,
    userPub: string,
    timeout = 5000,
  ): Promise<void> {
    if (!alias || !alias.trim()) {
      throw new Error('Alias must be provided for registration');
    }
    if (!userPub) {
      throw new Error('userPub must be provided for alias registration');
    }

    const normalizedAlias = alias.trim().toLowerCase();

    const available = await this.isAliasAvailable(
      normalizedAlias,
      timeout,
    ).catch((error) => {
      console.error('[DB] Alias availability check failed:', error);
      throw error;
    });

    const taken = await this.isAliasTaken(normalizedAlias);

    if (taken) {
      throw new Error(`Alias "${normalizedAlias}" is already taken`);
    }

    if (!available) {
      throw new Error(
        `Alias "${normalizedAlias}" is no longer available for registration`,
      );
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Timeout while registering alias'));
      }, timeout);

      this.usernamesNode.get(normalizedAlias).put(userPub, (ack: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (ack && ack.err) {
          reject(new Error(String(ack.err)));
          return;
        }

        resolve();
      });
    }).catch((error) => {
      console.error('[DB] Failed to register alias:', error);
      throw error;
    });
  }

  /**
   * Reset gun.user() authentication state and clear cached user.
   * @internal
   */
  private resetAuthState(): void {
    try {
      const user = this.gun.user();
      if (user && (user as any)._) {
        const cat = (user as any)._;
        cat.ing = false;
        cat.auth = null;
        cat.act = null;
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
   * Assemble a standard AuthResult object after a successful login.
   * @param username Resulting username.
   * @param userPub Public key (pub) for logged-in user.
   * @returns AuthResult.
   * @internal
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
   * Derive a unique encryption key for the session.
   * @param username Username to derive key from
   * @param salt Random salt for this session
   * @param pub User's public key
   */
  private async deriveSessionKey(
    username: string,
    salt: string,
    pub: string,
  ): Promise<string> {
    // We use SEA.work to derive a key from username + salt + pub
    // This makes the key unique per session (due to salt) and user
    if (!this.sea) throw new Error('SEA not available');
    const input = `${username}:${salt}:${pub}`;
    return await this.sea.work(input, null, null, { name: 'SHA-256' });
  }

  /**
   * Save credentials for the current session to sessionStorage, if available.
   * Encrypts sensitive data using a derived session key.
   * @param userInfo The credentials and user identity to store.
   */
  private async saveCredentials(userInfo: {
    alias: string;
    pair: ISEAPair;
    userPub: string;
  }): Promise<void> {
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (!this.sea) return;

        // 1. Generate a random salt for this session
        const salt = await this.sea.work(this.crypto.randomUUID(), null, null, {
          name: 'SHA-256',
        });

        // 2. Derive encryption key
        const key = await this.deriveSessionKey(
          userInfo.alias,
          salt,
          userInfo.userPub,
        );

        // 3. Prepare payload
        const payload = {
          username: userInfo.alias,
          pair: userInfo.pair,
          pub: userInfo.userPub,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        // 4. Encrypt payload
        const encrypted = await this.sea.encrypt(payload, key);

        // 5. Compute integrity hash of the encrypted string
        const integrity = await this.sea.work(encrypted, null, null, {
          name: 'SHA-256',
        });

        // 6. Store envelope
        const sessionInfo = {
          version: 2,
          username: userInfo.alias,
          pub: userInfo.userPub,
          salt: salt,
          encrypted: encrypted,
          integrity: integrity,
        };

        sessionStorage.setItem('gunSessionData', JSON.stringify(sessionInfo));
      }
    } catch (error) {
      console.error('[DB] Error saving credentials:', error);
    }
  }

  /**
   * Register and authenticate a new user account.
   * @param username The username to create/account for.
   * @param password The user's password.
   * @param pair Optional cryptographic pair (for `auth` instead of password).
   * @returns SignUpResult Promise.
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
    const user = this.gun.user() as IGunUserInstance;

    if (pair) {
      try {
        const loginResult = await new Promise<SignUpResult>((resolve) => {
          let callbackInvoked = false;

          user.auth(pair, async (ack: any) => {
            if (callbackInvoked) {
              return;
            }
            callbackInvoked = true;

            if (ack.err) {
              resolve({ success: false, error: ack.err });
              return;
            }
            const userPub = user?.is?.pub;
            if (!userPub) {
              this.resetAuthState();
              resolve({ success: false, error: 'No userPub available' });
              return;
            }
            this.user = user;
            const alias = user?.is?.alias as string;
            const userPair = (user as any)?._?.sea as ISEAPair;
            await this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });

            // Emit auth:signup event if core is available (pair-based signup)
            if (this.core && typeof this.core.emit === 'function') {
              this.core.emit('auth:signup', {
                userPub: userPub,
                username: normalizedUsername,
                method: 'pair' as const,
              });
            }

            resolve(
              this.buildLoginResult(alias || normalizedUsername, userPub),
            );
          });
        });

        if (loginResult && loginResult.success) {
          return loginResult;
        }
      } catch (e) {
        // fallback to create user
        // (continue below)
      }
    }

    try {
      await this.ensureAliasAvailable(normalizedUsername);
    } catch (aliasError) {
      return {
        success: false,
        error:
          aliasError instanceof Error ? aliasError.message : String(aliasError),
      };
    }

    const result: SignUpResult = await new Promise<SignUpResult>((resolve) => {
      let callbackInvoked = false;

      user.create(normalizedUsername, password, (createAck: any) => {
        if (callbackInvoked) {
          return;
        }

        if (
          createAck.err ||
          (createAck.ok !== undefined && createAck.ok !== 0)
        ) {
          callbackInvoked = true;
          this.resetAuthState();
          resolve({ success: false, error: createAck.err || 'Signup failed' });
          return;
        }

        const userPub = createAck.pub;

        if (!userPub) {
          callbackInvoked = true;
          this.resetAuthState();
          resolve({
            success: false,
            error: 'No userPub available from signup',
          });
          return;
        }

        user.auth(normalizedUsername, password, async (authAck: any) => {
          if (callbackInvoked) {
            return;
          }
          callbackInvoked = true;

          if (authAck.err) {
            this.resetAuthState();
            resolve({
              success: false,
              error: authAck.err || 'Authentication after signup failed',
            });
            return;
          }

          const authenticatedUserPub = user?.is?.pub;
          if (!authenticatedUserPub) {
            this.resetAuthState();
            resolve({
              success: false,
              error: 'User not authenticated after signup',
            });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            await this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: authenticatedUserPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          try {
            await this.registerAlias(
              alias || normalizedUsername,
              authenticatedUserPub,
            );
          } catch (registerError) {
            console.error('[DB] Alias registration failed:', registerError);
          }

          // Emit auth:signup event if core is available
          if (this.core && typeof this.core.emit === 'function') {
            this.core.emit('auth:signup', {
              userPub: authenticatedUserPub,
              username: normalizedUsername,
              method: pair ? ('pair' as const) : ('password' as const),
            });
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
   * Sign in (authenticate) as an existing user by username/password or SEA pair.
   * @param username Username to log in as.
   * @param password User's password (or "" if using pair).
   * @param pair Optional cryptographic SEA pair.
   * @returns AuthResult Promise.
   */
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.gun.user();

    return new Promise<AuthResult>((resolve) => {
      if (pair) {
        user.auth(pair, async (ack: any) => {
          if (ack.err) {
            this.resetAuthState();
            resolve({ success: false, error: ack.err });
            return;
          }

          const userPub = user?.is?.pub;
          if (!userPub) {
            this.resetAuthState();
            resolve({ success: false, error: 'No userPub available' });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            await this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          // Emit auth:login event if core is available (pair-based login)
          if (this.core && typeof this.core.emit === 'function') {
            this.core.emit('auth:login', {
              userPub: userPub,
              username: alias || normalizedUsername,
              method: 'pair' as const,
            });
          }

          resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
        });
      } else {
        user.auth(normalizedUsername, password, async (ack: any) => {
          if (ack.err) {
            this.resetAuthState();
            resolve({ success: false, error: ack.err });
            return;
          }

          const userPub = user?.is?.pub;
          if (!userPub) {
            this.resetAuthState();
            resolve({ success: false, error: 'No userPub available' });
            return;
          }

          this.user = user;
          const alias = user?.is?.alias as string;
          const userPair = (user as any)?._?.sea as ISEAPair;

          try {
            await this.saveCredentials({
              alias: alias || normalizedUsername,
              pair: pair ?? userPair,
              userPub: userPub,
            });
          } catch (saveError) {
            // Ignore save errors
          }

          // Emit auth:login event if core is available (password-based login)
          if (this.core && typeof this.core.emit === 'function') {
            this.core.emit('auth:login', {
              userPub: userPub,
              username: alias || normalizedUsername,
              method: 'password' as const,
            });
          }

          resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
        });
      }
    });
  }

  /**
   * Returns the currently authenticated user's public key and Gun user instance, if logged in.
   * @returns Object containing `pub` (public key) and optionally `user`, or `null`.
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
   * Get current user's public key.
   * @returns User's public key or null if not logged in.
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
   * Authenticate using a SEA pair directly (no password required).
   * @param username The user's username for identification (not cryptographically enforced).
   * @param pair GunDB SEA pair for authentication.
   * @returns Promise with authentication result.
   * @description Authenticates user using a GunDB pair directly without password.
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
    // Validate pair structure
    if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
      return {
        success: false,
        error: 'Invalid pair structure - missing required keys',
      };
    }

    this.resetAuthState();
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.gun.user();

    console.log('[DB] Login with pair for username:', normalizedUsername);

    return new Promise<AuthResult>((resolve) => {
      user.auth(pair, async (ack: any) => {
        if (ack.err) {
          this.resetAuthState();
          resolve({ success: false, error: ack.err });
          return;
        }

        const userPub = user?.is?.pub;
        if (!userPub) {
          this.resetAuthState();
          resolve({ success: false, error: 'No userPub available' });
          return;
        }

        this.user = user;
        const alias = user?.is?.alias as string;
        const userPair = (user as any)?._?.sea as ISEAPair;

        try {
          await this.saveCredentials({
            alias: alias || normalizedUsername,
            pair: pair ?? userPair,
            userPub: userPub,
          });
        } catch (saveError) {
          // Ignore save errors
        }

        // Emit auth:login event if core is available (loginWithPair)
        if (this.core && typeof this.core.emit === 'function') {
          this.core.emit('auth:login', {
            userPub: userPub,
            username: alias || normalizedUsername,
            method: 'pair' as const,
          });
        }

        resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
      });
    });
  }

  /**
   * Legacy API: Sign in using a username and SEA pair (password parameter is unused).
   * @param username Username to sign in as.
   * @param pair SEA key pair.
   * @returns AuthResult Promise.
   */
  async loginWithPairLegacy(
    username: string,
    pair: ISEAPair,
  ): Promise<AuthResult> {
    return this.login(username, '', pair);
  }

  /**
   * Returns the bound RxJS GunDB helper (reactive streams).
   * @returns RxJS instance.
   */
  rx(): RxJS {
    return this._rxjs as RxJS;
  }

  /**
   * Tears down the DataBase instance and performs cleanup of all resources/listeners.
   * No further actions should be performed on this instance after destruction.
   */
  public destroy(): void {
    if (this._isDestroyed) return;

    console.log('[DB] Destroying DataBase instance...');
    this._isDestroyed = true;

    this.onAuthCallbacks.length = 0;

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
    console.log('[DB] DataBase instance destroyed');
  }

  /**
   * Aggressively clean up authentication state and session. Typically used for error recovery.
   */
  public aggressiveAuthCleanup(): void {
    console.log('🧹 Performing aggressive auth cleanup...');
    this.resetAuthState();
    this.logout();
    console.log('✓ Aggressive auth cleanup completed');
  }

  /**
   * Register an event handler.
   * @param event Event name.
   * @param listener Listener function.
   */
  on(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove an event handler.
   * @param event Event name.
   * @param listener Listener function.
   */
  off(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Register an event handler for a single event occurrence.
   * @param event Event name.
   * @param listener Listener function.
   */
  once(event: string | symbol, listener: EventListener): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Emit a custom event.
   * @param event Event name.
   * @param data Optional associated data.
   * @returns `true` if listeners were notified; otherwise `false`.
   */
  emit(event: string | symbol, data?: EventData): boolean {
    return this.eventEmitter.emit(event, data);
  }
}

export { DataBase, RxJS, crypto, GunErrors };
export { default as derive, type DeriveOptions } from './derive';
export type { IGunUserInstance, IGunInstance, IGunChain } from 'gun/types';
export type { GunDataEventData, GunPeerEventData } from '../interfaces/events';
