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
    private readonly usernamesNode;
    private readonly onAuthCallbacks;
    private readonly eventEmitter;
    private _rxjs?;
    private _isDestroyed;
    constructor(gun: IGunInstance, appScope?: string, core?: any, sea?: any);
    initialize(appScope?: string): void;
    private subscribeToAuthEvents;
    private notifyAuthListeners;
    onAuth(callback: AuthCallback): () => void;
    isLoggedIn(): boolean;
    restoreSession(): {
        success: boolean;
        userPub?: string;
        error?: string;
    };
    logout(): void;
    private validatePasswordStrength;
    private validateSignupCredentials;
    private ensureAliasAvailable;
    private isAliasAvailable;
    private registerAlias;
    private resetAuthState;
    private buildLoginResult;
    private saveCredentials;
    signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    getCurrentUser(): {
        pub: string;
        user?: any;
    } | null;
    /**
     * Get current user's public key
     * @returns {string | null} User's public key or null if not logged in
     */
    getUserPub(): string | null;
    /**
     * Login with SEA pair directly
     * @param username - Username for identification
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly without password
     */
    loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
    loginWithPairLegacy(username: string, pair: ISEAPair): Promise<AuthResult>;
    rx(): RxJS;
    destroy(): void;
    aggressiveAuthCleanup(): void;
    on(event: string | symbol, listener: EventListener): void;
    off(event: string | symbol, listener: EventListener): void;
    once(event: string | symbol, listener: EventListener): void;
    emit(event: string | symbol, data?: EventData): boolean;
}
export { DataBase, RxJS, crypto, GunErrors };
export { default as derive, type DeriveOptions } from "./derive";
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData } from "../interfaces/events";
