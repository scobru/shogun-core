/**
 * GunDB class with enhanced features:
 * - Dynamic peer linking
 * - Support for remove/unset operations
 * - Direct authentication through Gun.user()
 */
import { IGunUserInstance, IGunInstance, IGunChain } from "gun";
import { GunRxJS } from "./rxjs-integration";
import * as GunErrors from "./errors";
import * as crypto from "./crypto";
import * as utils from "./utils";
import "gun/sea";
declare class GunDB {
    gun: IGunInstance<any>;
    user: IGunUserInstance<any> | null;
    crypto: typeof crypto;
    utils: typeof utils;
    node: IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
    private readonly onAuthCallbacks;
    private _rxjs?;
    constructor(gun: IGunInstance<any>, appScope?: string);
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
    onAuth(callback: (user: any) => void): () => void;
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun(): IGunInstance<any>;
    /**
     * Gets the current user instance
     * @returns User instance
     */
    getUser(): any;
    /**
     * Gets a node at the specified path
     * @param path Path to the node
     * @returns Gun node
     */
    get(path: string): any;
    /**
     * Puts data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    put(path: string, data: any): Promise<any>;
    /**
     * Sets data at the specified path
     * @param path Path to store data
     * @param data Data to store
     * @returns Promise resolving to operation result
     */
    set(path: string, data: any): Promise<any>;
    /**
     * Removes data at the specified path
     * @param path Path to remove
     * @returns Promise resolving to operation result
     */
    remove(path: string): Promise<any>;
    /**
     * Signs up a new user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    signUp(username: string, password: string): Promise<any>;
    /**
     * Logs in a user using direct Gun authentication
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    login(username: string, password: string, callback?: (result: any) => void): Promise<any>;
    private _savePair;
    /**
     * Logs out the current user using direct Gun authentication
     */
    logout(): void;
    /**
     * Checks if a user is currently logged in
     * @returns True if logged in
     */
    isLoggedIn(): boolean;
    /**
     * Gets the current user
     * @returns Current user object or null
     */
    getCurrentUser(): any;
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx(): GunRxJS;
    /**
     * Sets up security questions and password hint
     * @param username Username
     * @param password Current password
     * @param hint Password hint
     * @param securityQuestions Array of security questions
     * @param securityAnswers Array of answers to security questions
     * @returns Promise resolving with the operation result
     */
    setPasswordHint(username: string, password: string, hint: string, securityQuestions: string[], securityAnswers: string[]): Promise<{
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
     * Hashes text with Gun.SEA
     * @param text Text to hash
     * @returns Promise that resolves with the hashed text
     */
    hashText(text: string): Promise<string | any>;
    /**
     * Encrypts data with Gun.SEA
     * @param data Data to encrypt
     * @param key Encryption key
     * @returns Promise that resolves with the encrypted data
     */
    encrypt(data: any, key: string): Promise<string>;
    /**
     * Decrypts data with Gun.SEA
     * @param encryptedData Encrypted data
     * @param key Decryption key
     * @returns Promise that resolves with the decrypted data
     */
    decrypt(encryptedData: string, key: string): Promise<string | any>;
    /**
     * Saves user data at the specified path
     * @param path Path to save the data
     * @param data Data to save
     * @returns Promise that resolves when the data is saved
     */
    saveUserData(path: string, data: any): Promise<void>;
    /**
     * Gets user data from the specified path
     * @param path Path to get the data from
     * @returns Promise that resolves with the data
     */
    getUserData(path: string): Promise<any>;
    static Errors: typeof GunErrors;
}
export { GunDB };
