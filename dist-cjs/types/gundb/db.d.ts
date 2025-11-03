/**
 * GunDB - Simplified database wrapper for Gun.js
 * Provides only essential signup and login functionality
 * Based on Gun.js User Authentication: https://deepwiki.com/amark/gun/6.1-user-authentication
 */
import type { AuthCallback, EventData, EventListener } from "./types";
import type { IGunUserInstance, IGunChain, IGunInstance, ISEAPair } from "gun/types";
import type { AuthResult, SignUpResult } from "../interfaces/shogun";
import { RxJS } from "./rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
declare class DataBase {
    gun: IGunInstance;
    user: IGunUserInstance | null;
    crypto: typeof crypto;
    sea: any;
    node: IGunChain<any, any, any, any>;
    private readonly onAuthCallbacks;
    private readonly eventEmitter;
    private _rxjs?;
    private _isDestroyed;
    constructor(gun: IGunInstance, appScope?: string, core?: any, sea?: any);
    /**
     * Initialize with app scope
     */
    initialize(appScope?: string): void;
    /**
     * Subscribe to Gun auth events
     */
    private subscribeToAuthEvents;
    /**
     * Notify all auth callbacks
     */
    private notifyAuthListeners;
    /**
     * Register authentication callback
     */
    onAuth(callback: AuthCallback): () => void;
    /**
     * Check if user is logged in
     */
    isLoggedIn(): boolean;
    /**
     * Restore session from storage
     */
    restoreSession(): {
        success: boolean;
        userPub?: string;
        error?: string;
    };
    /**
     * Logout user
     */
    logout(): void;
    /**
     * Validate password strength
     */
    private validatePasswordStrength;
    /**
     * Validate signup credentials
     */
    private validateSignupCredentials;
    /**
     * Reset authentication state
     */
    private resetAuthState;
    /**
     * Build login result
     */
    private buildLoginResult;
    /**
     * Save credentials to session storage
     */
    private saveCredentials;
    /**
     * Sign up a new user
     * Based on Gun.js user().create() - https://deepwiki.com/amark/gun/6.1-user-authentication
     */
    signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Login with username and password
     * Based on Gun.js user().auth() - https://deepwiki.com/amark/gun/6.1-user-authentication
     */
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Get current user
     */
    getCurrentUser(): {
        pub: string;
        user?: any;
    } | null;
    /**
     * Login with SEA pair
     */
    loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Get RxJS module
     */
    rx(): RxJS;
    /**
     * Destroy database instance
     */
    destroy(): void;
    /**
     * Aggressive auth cleanup (kept for compatibility with tests)
     */
    aggressiveAuthCleanup(): void;
    /**
     * Event emitter methods for CoreInitializer compatibility
     */
    on(event: string | symbol, listener: EventListener): void;
    off(event: string | symbol, listener: EventListener): void;
    once(event: string | symbol, listener: EventListener): void;
    emit(event: string | symbol, data?: EventData): boolean;
}
export { DataBase, RxJS, crypto, GunErrors };
export { default as derive, type DeriveOptions } from "./derive";
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData } from "../interfaces/events";
