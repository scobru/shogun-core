import type { AuthCallback, EventData, EventListener, Ack } from './types';
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
    MAX_LENGTH: 1024,
  },
  USERNAME: {
    MAX_LENGTH: 64,
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

  /** Node prefix for Firegun compatibility */
  public prefix: string = '';
  /** Event handlers for Firegun compatibility */
  public ev: { [key: string]: { handler: any } } = {};

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
    if (password.length > CONFIG.PASSWORD.MAX_LENGTH) {
      return {
        valid: false,
        error: `Password must be ${CONFIG.PASSWORD.MAX_LENGTH} characters or fewer`,
      };
    }
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
    if (!/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(password)) {
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

    if (username.length > CONFIG.USERNAME.MAX_LENGTH) {
      return {
        valid: false,
        error: `Username must be ${CONFIG.USERNAME.MAX_LENGTH} characters or fewer`,
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
   * Internal: Get or create a device-specific secret stored in localStorage.
   * This binds the session key to the device, preventing decryption of stolen sessionStorage
   * on other devices.
   */
  private getDeviceSecret(): string {
    try {
      if (typeof localStorage === 'undefined') return '';
      const KEY = 'shogun_device_secret';
      let secret = localStorage.getItem(KEY);
      if (!secret) {
        secret = this.crypto.randomUUID();
        try {
          localStorage.setItem(KEY, secret);
        } catch (e) {
          console.warn('[DB] Failed to save device secret to localStorage', e);
          // If we can't save it, we return it anyway so current session works.
          // Next reload will fail to decrypt, which is secure fail.
        }
      }
      return secret;
    } catch (e) {
      return '';
    }
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

    // Retrieve device-specific secret (if available) to bind session to this device
    const deviceSecret = this.getDeviceSecret();
    const input = `${username}:${salt}:${pub}:${deviceSecret}`;

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

    if (username.length > CONFIG.USERNAME.MAX_LENGTH) {
      return {
        success: false,
        error: `Username must be ${CONFIG.USERNAME.MAX_LENGTH} characters or fewer`,
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
   * Wait in ms
   * @param ms duration of timeout in ms
   * @returns
   */
  async _timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Delete On Subscription
   * @param ev On subscription name, default : "default"
   */
  Off(ev = 'default'): void {
    if (this.ev[ev] && this.ev[ev].handler) {
      this.ev[ev].handler.off();
    } else {
      this.ev[ev] = { handler: null };
    }
  }

  /**
   * Listen changes on path
   *
   * @param path node path
   * @param callback callback
   * @param prefix node prefix, default : ""
   */
  Listen(
    path: string,
    callback: (result: { [key: string]: any } | string | undefined) => void,
    prefix: string = this.prefix,
  ): void {
    path = `${prefix}${path}`;
    let paths = path.split('/');
    let dataGun: any = this.gun;

    paths.forEach((p) => {
      dataGun = dataGun.get(p);
    });
    dataGun.map().once((s: any) => {
      callback(s);
    });
  }

  /**
   * New subscription on Path. When data on Path changed, callback is called.
   *
   * @param path node path
   * @param callback callback
   * @param ev On name as identifier, to be called by Off when finished
   * @param different Whether to fetch only differnce, or all of nodes
   * @param prefix node prefix, default : ""
   */
  On(
    path: string,
    callback: (result: { [key: string]: any } | string | undefined) => void,
    ev: string = 'default',
    different: boolean = true,
    prefix: string = this.prefix,
  ): void {
    path = `${prefix}${path}`;
    let paths = path.split('/');
    let dataGun: any = this.gun;

    paths.forEach((p) => {
      dataGun = dataGun.get(p);
    });

    let listenerHandler = (value: any, key: any, _msg: any, _ev: any) => {
      this.ev[ev] = { handler: _ev };
      if (value) callback(JSON.parse(JSON.stringify(value)));
    };

    // @ts-ignore
    dataGun.on(listenerHandler, { change: different });
  }

  /**
   * Insert CONTENT-ADDRESSING Readonly Data.
   *
   * @param key must begin with #
   * @param data If object, it will be stringified automatically
   * @returns
   */
  addContentAdressing(key: string, data: string | {}): Promise<Ack> {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    return new Promise((resolve, reject) => {
      this.sea
        .work(data, null, undefined, { name: 'SHA-256' })
        .then((hash: any) => {
          if (hash) {
            this.gun
              .get(`${key}`)
              .get(hash)
              .put(<any>data, (s: any) => {
                resolve(<Ack>s);
              });
          } else {
            reject(new Error('Hash generation failed'));
          }
        })
        .catch(reject);
    });
  }

  /**
   * Fetch data from userspace
   */
  userGet(
    path: string,
    repeat: number = 1,
    prefix: string = this.prefix,
  ): Promise<
    string | { [key: string]: {} } | { [key: string]: string } | undefined
  > {
    const pub = this.getUserPub();
    if (pub) {
      path = `~${pub}/${path}`;
      return this.Get(path, repeat, prefix);
    } else {
      return Promise.resolve(undefined);
    }
  }

  /**
   * Load Multi Nested Data From Userspace
   */
  userLoad(
    path: string,
    async = false,
    repeat: number = 1,
    prefix: string = this.prefix,
  ): Promise<{
    data: { [s: string]: any };
    err: { path: string; err: string }[];
  }> {
    const pub = this.getUserPub();
    if (pub) {
      path = `~${pub}/${path}`;
      return this.Load(path, async, repeat, prefix);
    } else {
      return Promise.resolve({
        data: {},
        err: [{ path: path, err: 'User not logged in' }],
      });
    }
  }

  /**
   * Fetching data
   */
  Get(
    path: string,
    repeat: number = 1,
    prefix: string = this.prefix,
  ): Promise<
    undefined | string | { [key: string]: {} } | { [key: string]: string }
  > {
    let path0 = path;
    path = `${prefix}${path}`;
    let paths = path.split('/');
    let dataGun: any = this.gun;

    paths.forEach((p) => {
      dataGun = dataGun.get(p);
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject({
          err: 'timeout',
          ket: `TIMEOUT, Possibly Data : ${path} is corrupt`,
          data: {},
          '#': path,
        });
      }, 5000);
      dataGun.once(async (s: any) => {
        if (s) {
          s = JSON.parse(JSON.stringify(s));
          resolve(s);
        } else {
          if (repeat) {
            await this._timeout(1000);
            try {
              let data = await this.Get(path0, repeat - 1, prefix);
              resolve(data);
            } catch (error) {
              reject(error);
            }
          } else {
            reject({
              err: 'notfound',
              ket: `Data Not Found,  Data : ${path} is undefined`,
              data: {},
              '#': path,
            });
          }
        }
      });
    });
  }

  /**
   * Put data on userspace
   */
  userPut(
    path: string,
    data: string | { [key: string]: {} },
    async = false,
    prefix = this.prefix,
  ): Promise<{ data: Ack[]; error: Ack[] }> {
    return new Promise((resolve, reject) => {
      const pub = this.getUserPub();
      if (pub) {
        path = `~${pub}/${path}`;
        this.Put(path, data, async, prefix).then(resolve).catch(reject);
      } else {
        reject(<Ack>{ err: new Error('User Belum Login'), ok: undefined });
      }
    });
  }

  private _randomAlphaNumeric(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    const bytes = new Uint8Array(length);

    const c = (globalThis as any)?.crypto as Crypto | undefined;
    if (!c?.getRandomValues) {
      throw new GunErrors.GunError(
        'Cryptographically secure randomness is not available.',
      );
    }

    try {
      c.getRandomValues(bytes);
    } catch (e) {
      throw new GunErrors.GunError(
        `Failed to generate secure random values: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(bytes[i] % charactersLength);
    }
    return result;
  }

  /**
   * Insert new Data into a node with a random key
   */
  Set(
    path: string,
    data: { [key: string]: {} } | { [key: string]: string },
    async = false,
    prefix = this.prefix,
    opt: undefined | { opt: { cert: string } } = undefined,
  ): Promise<{ data: Ack[]; error: Ack[] }> {
    return new Promise((resolve, reject) => {
      var token = this._randomAlphaNumeric(30);
      (data as any).id = token;
      this.Put(`${path}/${token}`, data, async, prefix, opt)
        .then((s) => {
          resolve(s);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Put Data to the gunDB Node
   */
  Put(
    path: string,
    data: null | string | { [key: string]: {} | string },
    async = false,
    prefix: string = this.prefix,
    opt: undefined | { opt: { cert: string } } = undefined,
  ): Promise<{ data: Ack[]; error: Ack[] }> {
    path = `${prefix}${path}`;
    let paths = path.split('/');
    let dataGun: any = this.gun;

    paths.forEach((p) => {
      dataGun = dataGun.get(p);
    });

    if (typeof data === 'undefined') {
      data = { t: '_' } as any;
    }

    let promises: Promise<Ack>[] = [];
    let storedObj = { data: [] as Ack[], error: [] as Ack[] };

    if (typeof data == 'object' && data !== null) {
      for (const key of Object.keys(data)) {
        if (Object.hasOwnProperty.call(data, key)) {
          const element = (data as any)[key];
          if (typeof element === 'object') {
            delete (data as any)[key];
            promises.push(
              this.Put(`${path}/${key}`, element as any, async).then((s) => {
                storedObj.data = storedObj.data.concat(s.data);
                storedObj.error = storedObj.error.concat(s.error);
                return s.data[0];
              }),
            );
          }
        }
      }
    }

    return new Promise((resolve, reject) => {
      Promise.allSettled(promises)
        .then(() => {
          if (data && Object.keys(data).length === 0) {
            resolve(storedObj);
          } else {
            setTimeout(() => {
              storedObj.error.push({
                err: Error('TIMEOUT, Failed to put Data'),
                ok: path,
              } as any);
              resolve(storedObj);
            }, 2000);

            dataGun.put(
              <any>data,
              (ack: any) => {
                if (ack.err === undefined) {
                  storedObj.data.push(ack);
                } else {
                  storedObj.error.push({
                    err: Error(JSON.stringify(ack)),
                    ok: path,
                  } as any);
                }
                resolve(storedObj);
              },
              opt as any,
            );
          }
        })
        .catch((s) => {
          storedObj.error.push({
            err: Error(JSON.stringify(s)),
            ok: path,
          } as any);
          resolve(storedObj);
        });
    });
  }

  purge(path: string) {
    return new Promise((resolve, reject) => {
      this.Get(path)
        .then((data) => {
          let newData = JSON.parse(JSON.stringify(data));
          if (typeof newData === 'object' && newData !== null) {
            for (const key of Object.keys(newData)) {
              if (key != '_' && key != '>' && key != '#' && key != ':')
                newData[key] = null;
            }
          }
          this.Put(path, newData)
            .then(() => {
              resolve('OK');
            })
            .catch((err) => {
              console.log(err);
              reject(JSON.stringify(err));
            });
        })
        .catch(reject);
    });
  }

  /**
   * Delete form user node
   */
  userDel(
    path: string,
    putNull: boolean = true,
  ): Promise<{ data: Ack[]; error: Ack[] }> {
    return new Promise((resolve, reject) => {
      const pub = this.getUserPub();
      if (!pub) return reject(new Error('User not logged in'));
      path = `~${pub}/${path}`;
      this.Del(path, putNull)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * Delete node Path. It's not really deleted. It's just detached (tombstone). Data without parent.
   */
  Del(
    path: string,
    putNull: boolean = true,
    cert: string = '',
  ): Promise<{ data: Ack[]; error: Ack[] }> {
    return new Promise((resolve, reject) => {
      try {
        let randomNode: any;
        let paths = path.split('/');
        let dataGun: any = this.gun;

        if (putNull) {
          randomNode = null;
        } else {
          if (paths[0].indexOf('~') >= 0) {
            randomNode = (this.gun as any)
              .user()
              .get('newNode')
              .set({ t: '_' });
          } else {
            randomNode = this.gun.get('newNode').set({ t: '_' });
          }
        }

        paths.forEach((p) => {
          dataGun = dataGun.get(p);
        });

        if (cert) {
          dataGun.put(
            randomNode,
            (s: any) => {
              if (s.err === undefined) {
                resolve({
                  data: [{ ok: 'ok', err: undefined } as any],
                  error: [],
                });
              } else {
                reject({
                  data: [{ ok: '', err: s.err } as any],
                  error: [],
                });
              }
            },
            { opt: { cert: cert } } as any,
          );
        } else {
          dataGun.put(randomNode, (s: any) => {
            if (s.err === undefined) {
              resolve({
                data: [{ ok: 'ok', err: undefined } as any],
                error: [],
              });
            } else {
              reject({
                data: [{ ok: '', err: s.err } as any],
                error: [],
              });
            }
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load Multi Nested Data
   */
  Load(
    path: string,
    async = false,
    repeat: number = 1,
    prefix: string = this.prefix,
  ): Promise<{
    data: { [s: string]: any };
    err: { path: string; err: string }[];
  }> {
    return new Promise((resolve, reject) => {
      let promises: Promise<any>[] = [];
      let obj: {
        data: { [s: string]: {} };
        err: { path: string; err: string }[];
      } = { data: {}, err: [] };

      this.Get(path, repeat, prefix)
        .then((s) => {
          if (typeof s === 'object' && s !== null) {
            for (const key of Object.keys(s)) {
              if (key != '_' && key != '#' && key != '>') {
                var element;
                if (typeof s === 'object') {
                  element = (s as any)[key];
                } else {
                  element = s;
                }
                if (typeof element === 'object') {
                  promises.push(
                    this.Load(`${path}/${key}`, async)
                      .then((s2) => {
                        obj.data[key] = s2;
                      })
                      .catch((error) => {
                        (obj.err as any).push(error);
                      }),
                  );
                } else {
                  obj.data[key] = element;
                }
              }
            }
          }
          Promise.allSettled(promises)
            .then(() => {
              resolve(obj as any);
            })
            .catch((s2) => {
              obj.err.push(s2 as any);
              resolve(obj as any);
            });
        })
        .catch((s2) => {
          obj.err.push(s2 as any);
          resolve(obj as any);
        });
    });
  }

  /**
   * Generate Public Certificate for Logged in User
   */
  generatePublicCert(): Promise<{ data: Ack[]; error: Ack[] }> {
    return new Promise((resolve, reject) => {
      const pub = this.getUserPub();
      const seaPair = (this.gun.user() as any)?._?.sea;
      if (pub && seaPair) {
        this.sea
          .certify('*', [{ '*': 'chat-with', '+': '*' }], seaPair, null, {})
          .then((cert: any) => {
            return this.userPut('chat-cert', cert);
          })
          .then((ack: any) => resolve(ack))
          .catch(reject);
      } else {
        reject('User belum Login');
      }
    });
  }

  /**
   * Tears down the DataBase instance and performs cleanup of all resources/listeners.
   * No further actions should be performed on this instance after destruction.
   */
  public destroy(): void {
    if (this._isDestroyed) return;

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
