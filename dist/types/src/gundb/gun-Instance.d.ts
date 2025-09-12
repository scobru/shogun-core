/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
import type { GunUser, UserInfo, AuthCallback, GunData, EventData, EventListener, GunOperationResult } from "./types";
import type { AuthResult, SignUpResult } from "../types/shogun";
declare const Gun: import("gun/types").IGun;
import SEA from "gun/sea";
import "gun/lib/then.js";
import "gun/lib/radix.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";
import "gun/lib/wire.js";
import "gun/axe.js";
import { restrictedPut } from "./restricted-put";
import derive, { DeriveOptions } from "./derive";
import type { IGunUserInstance, IGunInstance, IGunChain, ISEAPair } from "gun/types";
import { GunDataEventData, GunPeerEventData } from "../types/events";
import { GunRxJS } from "./gun-rxjs";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
declare class GunInstance {
    gun: IGunInstance<any>;
    user: IGunUserInstance<any> | null;
    crypto: typeof crypto;
    sea: typeof SEA;
    node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
    private readonly onAuthCallbacks;
    private readonly eventEmitter;
    private _rxjs?;
    constructor(gun: IGunInstance<any>, appScope?: string);
    /**
     * Initialize the GunInstance asynchronously
     * This method should be called after construction to perform async operations
     */
    initialize(appScope?: string): Promise<void>;
    private subscribeToAuthEvents;
    private notifyAuthListeners;
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer: string): void;
    /**
     * Removes a peer from the network
     * @param peer URL of the peer to remove
     */
    removePeer(peer: string): void;
    /**
     * Gets the list of currently connected peers
     * @returns Array of peer URLs
     */
    getCurrentPeers(): string[];
    /**
     * Gets the list of all configured peers (connected and disconnected)
     * @returns Array of peer URLs
     */
    getAllConfiguredPeers(): string[];
    /**
     * Gets detailed information about all peers
     * @returns Object with peer information
     */
    getPeerInfo(): {
        [peer: string]: {
            connected: boolean;
            status: string;
        };
    };
    /**
     * Reconnects to a specific peer
     * @param peer URL of the peer to reconnect
     */
    reconnectToPeer(peer: string): void;
    /**
     * Clears all peers and optionally adds new ones
     * @param newPeers Optional array of new peers to add
     */
    resetPeers(newPeers?: string[]): void;
    /**
     * Registers an authentication callback
     * @param callback Function to call on auth events
     * @returns Function to unsubscribe the callback
     */
    onAuth(callback: AuthCallback): () => void;
    /**
     * Helper method to navigate to a nested path by splitting and chaining .get() calls
     * @param node Starting Gun node
     * @param path Path string (e.g., "test/data/marco")
     * @returns Gun node at the specified path
     */
    private navigateToPath;
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun(): IGunInstance<any>;
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    getCurrentUser(): UserInfo | null;
    /**
     * Gets the current user instance
     * @returns User instance
     */
    getUser(): GunUser;
    /**
     * Gets a node at the specified path
     * @param path Path to the node
     * @returns Gun node
     */
    get(path: string): any;
    /**
     * Gets data at the specified path (one-time read)
     * @param path Path to get the data from
     * @returns Promise resolving to the data
     */
    getData(path: string): Promise<GunData>;
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    put(path: string, data: GunData): Promise<GunOperationResult>;
    /**
     * Sets data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    set(path: string, data: GunData): Promise<GunOperationResult>;
    /**
     * Removes data at the specified path
     * @param path Path to remove
     * @returns Promise resolving to operation result
     */
    remove(path: string): Promise<GunOperationResult>;
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    isLoggedIn(): boolean;
    /**
     * Attempts to restore user session from local storage
     * @returns Promise resolving to session restoration result
     */
    restoreSession(): {
        success: boolean;
        userPub?: string;
        error?: string;
    };
    logout(): void;
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx(): GunRxJS;
    /**
     * Validates password strength according to security requirements
     */
    private validatePasswordStrength;
    /**
     * Validates signup credentials with enhanced security
     */
    private validateSignupCredentials;
    /**
     * Checks if user exists by attempting authentication
     */
    private checkUserExistence;
    /**
     * Creates a new user in Gun
     */
    private createNewUser;
    /**
     * Authenticates user after creation
     */
    private authenticateNewUser;
    /**
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param pair Optional SEA pair for Web3 login
     * @returns Promise resolving to signup result
     */
    signUp(username: string, password: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Creates a new user in Gun with pair-based authentication (for Web3/plugins)
     */
    private createNewUserWithPair;
    private runPostAuthOnAuthResult;
    /**
     * Performs authentication with Gun
     */
    private performAuthentication;
    /**
     * Builds login result object
     */
    private buildLoginResult;
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Encrypts session data before storage
     */
    private encryptSessionData;
    /**
     * Decrypts session data from storage
     */
    private decryptSessionData;
    private saveCredentials;
    /**
     * Sets up security questions and password hint
     * @param username Username
     * @param password Current password
     * @param hint Password hint
     * @param securityQuestions Array of security questions
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the operation result
     */
    setPasswordHintWithSecurity(username: string, password: string, hint: string, securityQuestions: string[], securityAnswers: string[]): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Recovers password hint using security question answers
     * @param username Username
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the password hint
     */
    forgotPassword(username: string, securityAnswers: string[]): Promise<{
        success: boolean;
        hint?: string;
        error?: string;
    }>;
    /**
     * Saves user data at the specified path
     * @param path Path to save the data (supports nested paths like "test/data/marco")
     * @param data Data to save
     * @returns Promise that resolves when the data is saved
     */
    putUserData(path: string, data: any): Promise<void>;
    /**
     * Gets user data from the specified path
     * @param path Path to get the data from (supports nested paths like "test/data/marco")
     * @returns Promise that resolves with the data
     */
    getUserData(path: string): Promise<any>;
    static Errors: typeof GunErrors;
    /**
     * Adds an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    on(event: string | symbol, listener: EventListener): void;
    /**
     * Removes an event listener
     * @param event Event name
     * @param listener Event listener function
     */
    off(event: string | symbol, listener: EventListener): void;
    /**
     * Adds a one-time event listener
     * @param event Event name
     * @param listener Event listener function
     */
    once(event: string | symbol, listener: EventListener): void;
    /**
     * Emits an event
     * @param event Event name
     * @param data Event data
     */
    emit(event: string | symbol, data?: EventData): boolean;
    /**
     * Recall user session
     */
    recall(): void;
    /**
     * Leave user session
     */
    leave(): void;
    /**
     * Set user data
     */
    setUserData(data: any): void;
    /**
     * Set password hint
     */
    setPasswordHint(hint: string): void;
    /**
     * Get password hint
     */
    getPasswordHint(): string | null;
    /**
     * Save session to storage
     */
    saveSession(session: any): void;
    /**
     * Load session from storage
     */
    loadSession(): any;
    /**
     * Clear session
     */
    clearSession(): void;
    /**
     * Get app scope
     */
    getAppScope(): string;
    /**
     * Get user public key
     */
    getUserPub(): string | null;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
}
declare const createGun: (config: any) => IGunInstance<any>;
export { Gun, GunInstance, SEA, GunRxJS, crypto, GunErrors, derive, restrictedPut, createGun, };
export default Gun;
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
