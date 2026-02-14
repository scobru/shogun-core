import {
  IShogunCore,
  AuthResult,
  SignUpResult,
  AuthMethod,
} from '../interfaces/shogun';
import { ISEAPair } from 'gun';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';
// Import seed utilities dynamically or statically? Statically is fine as they are in same package.
import {
  deriveCredentialsFromMnemonic,
  mnemonicToSeed,
  seedToPassword,
  validateSeedPhrase,
} from '../utils/seedPhrase';
import { generatePairFromMnemonic } from '../gundb/crypto';
import { IAuthPlugin } from '../interfaces/auth';

/**
 * Manages authentication operations for ShogunCore
 */
export class AuthManager {
  private core: IShogunCore;
  private currentAuthMethod?: AuthMethod;

  constructor(core: IShogunCore) {
    this.core = core;
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in, false otherwise
   * @description Verifies authentication status by checking GunInstance login state
   * and presence of authentication credentials in storage
   */
  isLoggedIn(): boolean {
    return this.core.db.isLoggedIn();
  }

  /**
   * Perform user logout
   * @description Logs out the current user from GunInstance and emits logout event.
   * If user is not authenticated, the logout operation is ignored.
   */
  logout(): void {
    try {
      if (!this.isLoggedIn()) {
        return;
      }
      this.core.db.logout();
      this.core.emit('auth:logout');
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        'LOGOUT_FAILED',
        error instanceof Error ? error.message : 'Error during logout',
        error,
      );
    }
  }

  /**
   * Authenticate user with username and password
   * @param username - Username
   * @param password - User password
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Attempts to log in user with provided credentials.
   * Emits login event on success.
   */
  async login(
    username: string,
    password: string,
    pair?: ISEAPair | null,
  ): Promise<AuthResult> {
    try {
      if (!this.currentAuthMethod) {
        this.currentAuthMethod = 'password';
      }

      const result = await this.core.db.login(username, password, pair);

      if (result.success) {
        // Include SEA pair in the response
        const seaPair = ((this.core as any).user?._ as any)?.sea;
        if (seaPair) {
          (result as any).sea = seaPair;
        }

        this.core.emit('auth:login', {
          userPub: result.userPub ?? '',
          method:
            this.currentAuthMethod === 'pair'
              ? 'password'
              : this.currentAuthMethod || 'password',
        });
      } else {
        result.error = result.error || 'Wrong user or password';
      }

      return result;
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        'LOGIN_FAILED',
        error.message ?? 'Unknown error during login',
        error,
      );

      return {
        success: false,
        error: error.message ?? 'Unknown error during login',
      };
    }
  }

  /**
   * Login with GunDB pair directly
   * @param pair - GunDB SEA pair for authentication
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Authenticates user using a GunDB pair directly.
   * Emits login event on success.
   */
  async loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult> {
    try {
      if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        return {
          success: false,
          error: 'Invalid pair structure - missing required keys',
        };
      }

      // Use the new loginWithPair method from GunInstance
      const result = await this.core.db.loginWithPair(username, pair);

      if (result.success) {
        // Include SEA pair in the response
        const seaPair = ((this.core as any).user?._ as any)?.sea;
        if (seaPair) {
          (result as any).sea = seaPair;
        }

        this.currentAuthMethod = 'pair';
        this.core.emit('auth:login', {
          userPub: result.userPub ?? '',
          method: 'pair',
          username,
        });
      } else {
        result.error =
          result.error || 'Authentication failed with provided pair';
      }

      return result;
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        'PAIR_LOGIN_FAILED',
        error.message ?? 'Unknown error during pair login',
        error,
      );

      return {
        success: false,
        error: error.message ?? 'Unknown error during pair login',
      };
    }
  }

  /**
   * Login with a BIP39 seed phrase (mnemonic).
   * Derives the key pair deterministically and logs in.
   * @param username - Username associated with the seed
   * @param mnemonic - The 12-word seed phrase
   */
  async loginWithSeed(username: string, mnemonic: string): Promise<AuthResult> {
    try {
      if (!validateSeedPhrase(mnemonic)) {
        return { success: false, error: 'Invalid seed phrase' };
      }

      // Generate deterministc pair
      const pair = await generatePairFromMnemonic(mnemonic, username);

      // Login with pair
      const result = await this.loginWithPair(username, pair);

      if (result.success && this.core) {
        // If successful, we might want to store that the method was 'seed' or 'pair'
        // usage of 'pair' method is correct as per underlying mechanic
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Register a new user with provided credentials
   * @param username - Username
   * @param password - Password
   * @param email - Email (optional)
   * @param pair - Pair of keys
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account with the provided credentials.
   * Validates password requirements and emits signup event on success.
   */
  async signUp(
    username: string,
    password?: string,
    pair?: ISEAPair | null,
  ): Promise<SignUpResult> {
    try {
      if (!this.core.db) {
        throw new Error('Database not initialized');
      }

      // For password-based signup, ensure password is provided
      if (!pair && (!password || password.trim() === '')) {
        throw new Error('Password is required for password-based signup');
      }

      const result = await this.core.db.signUp(username, password || '', pair);

      if (result.success) {
        // Update current authentication method
        this.currentAuthMethod = pair ? 'web3' : 'password';

        this.core.emit('auth:signup', {
          userPub: result.userPub!,
          username,
          method: this.currentAuthMethod,
        });

        this.core.emit('debug', {
          action: 'signup_success',
          userPub: result.userPub,
          method: this.currentAuthMethod,
        });
      } else {
        this.core.emit('debug', {
          action: 'signup_failed',
          error: result.error,
          username,
        });
      }

      return result;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error(`Error during registration for user ${username}:`, error);
      }

      this.core.emit('debug', {
        action: 'signup_error',
        error: error instanceof Error ? error.message : String(error),
        username,
      });

      return {
        success: false,
        error: `Registration failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Set the current authentication method
   * This is used by plugins to indicate which authentication method was used
   * @param method The authentication method used
   */
  setAuthMethod(method: AuthMethod): void {
    this.currentAuthMethod = method;
  }

  /**
   * Get the current authentication method
   * @returns The current authentication method or undefined if not set
   */
  getAuthMethod(): AuthMethod | undefined {
    return this.currentAuthMethod;
  }

  /**
   * Get an authentication method plugin by type
   * @param type The type of authentication method
   * @returns The authentication plugin or undefined if not available
   * This is a more modern approach to accessing authentication methods
   */
  getAuthenticationMethod(type: AuthMethod): IAuthPlugin | undefined {
    switch (type) {
      case 'webauthn':
        return this.core.getPlugin<IAuthPlugin>('webauthn');
      case 'web3':
        return this.core.getPlugin<IAuthPlugin>('web3');
      case 'nostr':
        return this.core.getPlugin<IAuthPlugin>('nostr');
      case 'password':
      default:
        // Mock a plugin for password-based authentication to provide a consistent interface
        return {
          name: 'password',
          version: '1.0.0',
          initialize: () => {},
          login: async (
            username: string,
            password?: string,
          ): Promise<AuthResult> => {
            return await this.login(username, password || '');
          },
          signUp: async (
            username: string,
            options?: any,
          ): Promise<SignUpResult> => {
            const { password, confirm } = options || {};
            // For password-based signup, validate password confirmation
            if (confirm && password !== confirm) {
              throw new Error('Password and confirm password do not match');
            }
            return await this.signUp(username, password || '');
          },
        } as IAuthPlugin;
    }
  }
}
