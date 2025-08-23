/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
import type { GunUser, UserInfo, AuthCallback, GunData, EventData, EventListener, GunOperationResult } from "./types";
import type { AuthResult, SignUpResult } from "../types/shogun";
declare const Gun: any;
import SEA from "gun/sea";
import "gun/lib/then.js";
import "gun/lib/radisk.js";
import "gun/lib/store.js";
import "gun/lib/rindexed.js";
import "gun/lib/webrtc.js";
import "gun/lib/yson.js";
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
    private readonly rateLimitStorage;
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
     * Emits a Gun data event
     * @private
     */
    private emitDataEvent;
    /**
     * Emits a Gun peer event
     * @private
     */
    private emitPeerEvent;
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
     * Debug method: Clears all Gun-related data from local and session storage
     * This is useful for debugging and testing purposes
     * @warning This will completely reset the user's local Gun data
     */
    clearGunStorage(): void;
    /**
     * Debug method: Tests Gun connectivity and returns status information
     * This is useful for debugging connection issues
     */
    testConnectivity(): Promise<any>;
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
     * Checks rate limiting for login attempts
     */
    checkRateLimit(username: string, operation: "login" | "signup"): {
        allowed: boolean;
        error?: string;
    };
    /**
     * Resets rate limiting for successful authentication
     */
    private resetRateLimitForUser;
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
     * Normalizes username for consistent lookup
     */
    private normalizeUsername;
    /**
     * Strategy 1: Frozen space scan for immutable data
     */
    private lookupInFrozenSpace;
    /**
     * Strategy 2: Direct frozen mapping lookup
     */
    private lookupDirectMapping;
    /**
     * Strategy 3: Alternate key lookup
     */
    private lookupAlternateKey;
    /**
     * Strategy 4: Comprehensive scan fallback
     */
    private lookupComprehensiveScan;
    /**
     * Creates lookup strategies array
     */
    private createLookupStrategies;
    /**
     * Processes lookup result to get complete user data
     */
    private processLookupResult;
    checkUsernameExists(username: string): Promise<any>;
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
     * Updates the user's alias (username) in Gun and saves the updated credentials
     * @param newAlias New alias/username to set
     * @returns Promise resolving to update result
     */
    updateUserAlias(newAlias: string): Promise<{
        success: boolean;
        error?: string;
    }>;
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
    /**
     * Derive cryptographic keys from password and optional extras
     * Supports multiple key derivation algorithms: P-256, secp256k1 (Bitcoin), secp256k1 (Ethereum)
     * @param password - Password or seed for key derivation
     * @param extra - Additional entropy (string or array of strings)
     * @param options - Derivation options to specify which key types to generate
     * @returns Promise resolving to derived keys object
     */
    derive(password: string | number, extra?: string | string[], options?: DeriveOptions): Promise<{
        p256?: {
            pub: string;
            priv: string;
            epub: string;
            epriv: string;
        };
        secp256k1Bitcoin?: {
            pub: string;
            priv: string;
            address: string;
        };
        secp256k1Ethereum?: {
            pub: string;
            priv: string;
            address: string;
        };
    }>;
    /**
     * Derive P-256 keys (default Gun.SEA behavior)
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to P-256 keys
     */
    deriveP256(password: string | number, extra?: string | string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Derive Bitcoin secp256k1 keys with P2PKH address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Bitcoin keys and address
     */
    deriveBitcoin(password: string | number, extra?: string | string[]): Promise<{
        pub: string;
        priv: string;
        address: string;
    }>;
    /**
     * Derive Ethereum secp256k1 keys with Keccak256 address
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to Ethereum keys and address
     */
    deriveEthereum(password: string | number, extra?: string | string[]): Promise<{
        pub: string;
        priv: string;
        address: string;
    }>;
    /**
     * Derive all supported key types
     * @param password - Password for key derivation
     * @param extra - Additional entropy
     * @returns Promise resolving to all key types
     */
    deriveAll(password: string | number, extra?: string | string[]): Promise<{
        p256: {
            pub: string;
            priv: string;
            epub: string;
            epriv: string;
        };
        secp256k1Bitcoin: {
            pub: string;
            priv: string;
            address: string;
        };
        secp256k1Ethereum: {
            pub: string;
            priv: string;
            address: string;
        };
    }>;
    /**
     * Prepares data for freezing with metadata
     */
    private prepareFrozenData;
    /**
     * Generates hash for frozen data
     */
    private generateFrozenDataHash;
    /**
     * Builds the full path for frozen data
     */
    private buildFrozenPath;
    /**
     * Stores frozen data in Gun
     */
    private storeFrozenData;
    /**
     * Creates a frozen space entry for immutable data
     * @param data Data to freeze
     * @param options Optional configuration
     * @returns Promise resolving to the frozen data hash
     */
    createFrozenSpace(data: any, options?: {
        namespace?: string;
        path?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        hash: string;
        fullPath: string;
        data: any;
    }>;
    /**
     * Retrieves data from frozen space
     * @param hash Hash of the frozen data
     * @param namespace Optional namespace
     * @param path Optional custom path
     * @returns Promise resolving to the frozen data
     */
    getFrozenSpace(hash: string, namespace?: string, path?: string): Promise<any>;
    /**
     * Verifies if data matches a frozen space entry
     * @param data Data to verify
     * @param hash Expected hash
     * @param namespace Optional namespace
     * @param path Optional custom path
     * @returns Promise resolving to verification result
     */
    verifyFrozenSpace(data: any, hash: string, namespace?: string, path?: string): Promise<{
        verified: boolean;
        frozenData?: any;
        error?: string;
    }>;
    static Errors: typeof GunErrors;
    /**
     * Sanitizes username to prevent path construction issues
     * @param username Raw username
     * @returns Sanitized username
     */
    private sanitizeUsername;
    /**
     * Changes the username for the currently authenticated user
     * @param newUsername New username to set
     * @returns Promise resolving to the operation result
     */
    changeUsername(newUsername: string): Promise<{
        success: boolean;
        error?: string;
        oldUsername?: string;
        newUsername?: string;
    }>;
    /**
     * Recall user session
     */
    recall(): void;
    /**
     * Leave user session
     */
    leave(): void;
    /**
     * Set username for the current user
     */
    setUsername(username: string): void;
    /**
     * Get username for the current user
     */
    getUsername(): string | null;
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
    /**
     * Reset rate limit
     */
    resetRateLimit(): void;
}
export { GunInstance, SEA, GunRxJS, crypto, GunErrors, derive, restrictedPut };
export default Gun;
export type { IGunUserInstance, IGunInstance, IGunChain } from "gun/types";
export type { GunDataEventData, GunPeerEventData };
export type { DeriveOptions };
