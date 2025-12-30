import type { AuthCallback, EventData, EventListener } from './types';
import type { AuthResult, SignUpResult } from '../interfaces/shogun';
import type { ISEAPair } from 'gun';
import { RxJSHolster } from './rxjs-holster';
import * as crypto from './crypto';
/**
 * DataBaseHolster
 *
 * Manages Holster user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 * This is a native Holster implementation that doesn't require Gun compatibility layer.
 */
declare class DataBaseHolster {
    /** Holster instance */
    holster: any;
    /** Cached user instance or `null` if not logged in */
    user: any;
    /** Crypto utilities used internally */
    crypto: typeof crypto;
    /** Holster SEA cryptography context */
    sea: any;
    /** Holster node dedicated to mapping usernames to pubkeys */
    private readonly usernamesNode;
    /** ShogunCore instance for emitting events */
    private readonly core?;
    /** Registered callbacks for auth state changes */
    private readonly onAuthCallbacks;
    /** EventEmitter for app-specific event management */
    private readonly eventEmitter;
    /** RxJS-based Holster observable/stream helper */
    private _rxjs?;
    /** Whether the database instance has been destroyed */
    private _isDestroyed;
    /** Polling interval for auth state changes */
    private authPollInterval;
    /** Last known user state */
    private lastUserState;
    /**
     * Constructs a new DataBaseHolster instance connected to a Holster instance.
     * @param holster The main Holster instance.
     * @param sea Optional cryptography (Holster SEA) instance; will be auto-discovered if not provided.
     * @throws If holster or holster.user() is not provided.
     */
    constructor(holster: any, core?: any, sea?: any);
    /**
     * Initialize the database instance.
     */
    initialize(): void;
    /**
     * Internal: subscribe to Holster auth state changes and notify listeners.
     * Since Holster doesn't have native auth events, we poll for changes.
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
     */
    private validatePasswordStrength;
    /**
     * Validate a signup request's username, password, and/or cryptographic pair.
     */
    private validateSignupCredentials;
    /**
     * Ensures that an alias/username is available in Holster for registration.
     */
    private ensureAliasAvailable;
    /**
     * Checks if a given alias/username is available on Holster.
     * Uses the same approach as isAliasTaken but returns the inverse.
     */
    private isAliasAvailable;
    /**
     * Checks if a given alias/username is taken on Holster.
     */
    private isAliasTaken;
    /**
     * Register a new alias (username) → public key mapping on Holster.
     */
    private registerAlias;
    /**
     * Reset holster.user() authentication state and clear cached user.
     * @internal
     */
    private resetAuthState;
    /**
     * Assemble a standard AuthResult object after a successful login.
     */
    private buildLoginResult;
    /**
     * Save credentials for the current session to sessionStorage, if available.
     */
    private saveCredentials;
    /**
     * Register and authenticate a new user account.
     */
    signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Sign in (authenticate) as an existing user by username/password or SEA pair.
     */
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Returns the currently authenticated user's public key and Holster user instance.
     */
    getCurrentUser(): {
        pub: string;
        user?: any;
    } | null;
    /**
     * Get current user's public key.
     */
    getUserPub(): string | null;
    /**
     * Authenticate using a SEA pair directly.
     * If username doesn't exist, creates a new user with the provided pair.
     */
    loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Helper to create a user with pair and register alias.
     * @internal
     */
    private createUserWithPair;
    /**
     * Helper to create a graph structure compatible with Holster.
     * @internal
     */
    private createGraph;
    /**
     * Legacy API: Sign in using a username and SEA pair.
     */
    loginWithPairLegacy(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Returns the bound RxJS Holster helper (reactive streams).
     */
    rx(): RxJSHolster;
    /**
     * Tears down the DataBaseHolster instance and performs cleanup.
     */
    destroy(): void;
    /**
     * Aggressively clean up authentication state and session.
     */
    aggressiveAuthCleanup(): void;
    /**
     * Register an event handler.
     */
    on(event: string | symbol, listener: EventListener): void;
    /**
     * Remove an event handler.
     */
    off(event: string | symbol, listener: EventListener): void;
    /**
     * Register an event handler for a single event occurrence.
     */
    once(event: string | symbol, listener: EventListener): void;
    /**
     * Emit a custom event.
     */
    emit(event: string | symbol, data?: EventData): boolean;
    /**
     * Get the Holster instance (for backward compatibility with gun property).
     * Returns a proxy that provides Gun-like API on top of Holster.
     */
    get gun(): any;
    /**
     * Create a proxy that makes Holster look like Gun for compatibility.
     */
    private createGunProxy;
}
export { DataBaseHolster };
