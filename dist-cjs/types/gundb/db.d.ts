import type { AuthCallback, EventData, EventListener } from "./types";
import type { IGunUserInstance, IGunInstance, ISEAPair } from "gun/types";
import type { AuthResult, SignUpResult } from "../interfaces/shogun";
import { RxJS } from "./rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
/**
 * DataBase
 *
 * Manages GunDB user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 */
declare class DataBase {
    /** GunDB instance */
    gun: IGunInstance;
    /** Cached user instance or `null` if not logged in */
    user: IGunUserInstance | null;
    /** Crypto utilities used internally */
    crypto: typeof crypto;
    /** Gun SEA cryptography context (usually gun.SEA) */
    sea: any;
    /** Gun node dedicated to mapping usernames to pubkeys */
    private readonly usernamesNode;
    /** Registered callbacks for auth state changes */
    private readonly onAuthCallbacks;
    /** EventEmitter for app-specific event management */
    private readonly eventEmitter;
    /** RxJS-based GunDB observable/stream helper */
    private _rxjs?;
    /** Whether the database instance has been destroyed */
    private _isDestroyed;
    /**
     * Constructs a new DataBase instance connected to a GunDB instance.
     * @param gun The main GunDB instance.
     * @param core Optionally, the root Gun instance (unused in this context).
     * @param sea Optional cryptography (Gun SEA) instance; will be auto-discovered if not provided.
     * @throws If gun or gun.user() is not provided.
     */
    constructor(gun: IGunInstance, core?: any, sea?: any);
    /**
     * Initialize the database instance.
     */
    initialize(): void;
    /**
     * Internal: subscribe to GunDB "auth" events and notify listeners.
     * Listeners are invoked on authentication status change.
     * @internal
     */
    private subscribeToAuthEvents;
    /**
     * Internal: notify all onAuth callbacks with current user.
     * @param pub User's public key (pub).
     * @internal
     */
    private notifyAuthListeners;
    /**
     * Listen for authentication/sign-in events (login, logout, etc).
     * @param callback Function to call with new user instance.
     * @returns Function to remove the registered callback.
     */
    onAuth(callback: AuthCallback): () => void;
    /**
     * Check if a user is currently logged in (there is a valid session).
     * @returns `true` if logged in; otherwise `false`.
     */
    isLoggedIn(): boolean;
    /**
     * Attempt to restore a previously saved session from sessionStorage.
     * @returns Object indicating success, error, and userPub if restored.
     */
    restoreSession(): {
        success: boolean;
        userPub?: string;
        error?: string;
    };
    /**
     * Log out the current user, clear local state and remove session from storage.
     */
    logout(): void;
    /**
     * Validate that a provided password meets minimum length requirements.
     * @param password Password string to validate.
     * @returns Object indicating validity and, if invalid, an error.
     */
    private validatePasswordStrength;
    /**
     * Validate a signup request's username, password, and/or cryptographic pair.
     * @param username Username string.
     * @param password Password string.
     * @param pair Optional cryptographic SEA pair.
     * @returns Object with validation status and optional error.
     */
    private validateSignupCredentials;
    /**
     * Ensures that an alias/username is available in GunDB for registration.
     * @param alias Username to check.
     * @param timeout Timeout in milliseconds (default 5000ms).
     * @throws If the alias is already taken.
     */
    private ensureAliasAvailable;
    /**
     * Checks if a given alias/username is available on GunDB.
     * @param alias Username to check for availability.
     * @param timeout Timeout in ms (default: 5000).
     * @returns Promise resolving to `true` if available; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    private isAliasAvailable;
    /**
     * Checks if a given alias/username is taken on GunDB.
     * @param alias Username to check for availability.
     * @returns Promise resolving to `true` if taken; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    private isAliasTaken;
    /**
     * Register a new alias (username) → public key mapping on GunDB.
     * @param alias The username/alias to register.
     * @param userPub The user's public key.
     * @param timeout Timeout in ms (default 5000).
     * @throws If alias/userPub is invalid or the alias cannot be registered.
     */
    private registerAlias;
    /**
     * Reset gun.user() authentication state and clear cached user.
     * @internal
     */
    private resetAuthState;
    /**
     * Assemble a standard AuthResult object after a successful login.
     * @param username Resulting username.
     * @param userPub Public key (pub) for logged-in user.
     * @returns AuthResult.
     * @internal
     */
    private buildLoginResult;
    /**
     * Save credentials for the current session to sessionStorage, if available.
     * @param userInfo The credentials and user identity to store.
     */
    private saveCredentials;
    /**
     * Register and authenticate a new user account.
     * @param username The username to create/account for.
     * @param password The user's password.
     * @param pair Optional cryptographic pair (for `auth` instead of password).
     * @returns SignUpResult Promise.
     */
    signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Sign in (authenticate) as an existing user by username/password or SEA pair.
     * @param username Username to log in as.
     * @param password User's password (or "" if using pair).
     * @param pair Optional cryptographic SEA pair.
     * @returns AuthResult Promise.
     */
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Returns the currently authenticated user's public key and Gun user instance, if logged in.
     * @returns Object containing `pub` (public key) and optionally `user`, or `null`.
     */
    getCurrentUser(): {
        pub: string;
        user?: any;
    } | null;
    /**
     * Get current user's public key.
     * @returns User's public key or null if not logged in.
     */
    getUserPub(): string | null;
    /**
     * Authenticate using a SEA pair directly (no password required).
     * @param username The user's username for identification (not cryptographically enforced).
     * @param pair GunDB SEA pair for authentication.
     * @returns Promise with authentication result.
     * @description Authenticates user using a GunDB pair directly without password.
     */
    loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Legacy API: Sign in using a username and SEA pair (password parameter is unused).
     * @param username Username to sign in as.
     * @param pair SEA key pair.
     * @returns AuthResult Promise.
     */
    loginWithPairLegacy(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Returns the bound RxJS GunDB helper (reactive streams).
     * @returns RxJS instance.
     */
    rx(): RxJS;
    /**
     * Tears down the DataBase instance and performs cleanup of all resources/listeners.
     * No further actions should be performed on this instance after destruction.
     */
    destroy(): void;
    /**
     * Aggressively clean up authentication state and session. Typically used for error recovery.
     */
    aggressiveAuthCleanup(): void;
    /**
     * Register an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    on(event: string | symbol, listener: EventListener): void;
    /**
     * Remove an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    off(event: string | symbol, listener: EventListener): void;
    /**
     * Register an event handler for a single event occurrence.
     * @param event Event name.
     * @param listener Listener function.
     */
    once(event: string | symbol, listener: EventListener): void;
    /**
     * Emit a custom event.
     * @param event Event name.
     * @param data Optional associated data.
     * @returns `true` if listeners were notified; otherwise `false`.
     */
    emit(event: string | symbol, data?: EventData): boolean;
}
export { DataBase, RxJS, crypto, GunErrors };
export { default as derive, type DeriveOptions } from "./derive";
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData } from "../interfaces/events";
