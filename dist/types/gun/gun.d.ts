/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */
import { GunOptions } from "gun";
import { GunInstance } from "./types";
import * as GunErrors from "./errors";
import { GunRxJS } from "./rxjs-integration";
import * as crypto from "./crypto";
import * as utils from "./utils";
import GunPlus from "./gun_plus_instance";
declare class GunDB {
    gunPlus: GunPlus;
    crypto: typeof crypto;
    utils: typeof utils;
    private readonly onAuthCallbacks;
    private _authenticating;
    private readonly authToken?;
    get gun(): GunInstance<any>;
    private _rxjs?;
    constructor(appScopeOrGun: string, optionsOrAuthToken?: GunOptions | string, authTokenParam?: string);
    private subscribeToAuthEvents;
    private notifyAuthListeners;
    /**
     * Gets the current auth token
     * @returns The current auth token
     */
    getAuthToken(): string;
    /**
     * Adds a new peer to the network
     * @param peer URL of the peer to add
     */
    addPeer(peer: string): void;
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
    getGun(): GunInstance<any>;
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
     * Signs up a new user using AuthManager
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    signUp(username: string, password: string): Promise<any>;
    /**
     * Logs in a user using AuthManager
     * @param username Username
     * @param password Password
     * @param callback Optional callback for login result
     * @returns Promise resolving to login result
     */
    login(username: string, password: string, callback?: (result: any) => void): Promise<any>;
    private _savePair;
    private isAuthenticating;
    private _setAuthenticating;
    /**
     * Logs out the current user using AuthManager
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
     * Creates a readable stream from a Gun path or chain
     * @param path Path to stream data from, or a Gun chain
     * @returns ReadableStream that emits changes from the specified path
     */
    stream(path: string | any): ReadableStream<any>;
    /**
     * Creates a GunNode for the specified path
     * @param path Path to create a node for
     * @returns GunNode instance for the specified path
     */
    node(path: string): any;
    /**
     * Creates a certificate that allows other users to write to specific parts of the user's graph
     * @param grantees Array of public keys to grant access to
     * @param policies Array of policies that define what paths/keys can be written to
     * @returns Promise resolving to the certificate string
     * @example
     * // Allow anyone to write to paths containing their public key
     * const cert = await gundb.certify([{pub: "*"}], [gundb.policies.contains_pub]);
     */
    certify(grantees?: {
        pub: string;
    }[], policies?: any[]): Promise<string>;
    /**
     * Access to predefined certificate policies
     */
    get policies(): any;
    /**
     * Imposta le domande di sicurezza e il suggerimento per la password
     * @param username Nome utente
     * @param password Password corrente
     * @param hint Suggerimento per la password
     * @param securityQuestions Array di domande di sicurezza
     * @param securityAnswers Array di risposte alle domande di sicurezza
     * @returns Promise che risolve con il risultato dell'operazione
     */
    setPasswordHint(username: string, password: string, hint: string, securityQuestions: string[], securityAnswers: string[]): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Recupera il suggerimento della password utilizzando le risposte alle domande di sicurezza
     * @param username Nome utente
     * @param securityAnswers Array di risposte alle domande di sicurezza
     * @returns Promise che risolve con il suggerimento della password
     */
    forgotPassword(username: string, securityAnswers: string[]): Promise<{
        success: boolean;
        hint?: string;
        error?: string;
    }>;
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
    /**
     * Hashes text with crypto module
     * @param text Text to hash
     * @returns Promise that resolves with the hashed text
     */
    hashText(text: string): Promise<string | any>;
    /**
     * Encrypts data using SEA
     * @param data Data to encrypt
     * @param key Encryption key
     * @returns Promise that resolves with the encrypted data
     */
    encrypt(data: any, key: string): Promise<string>;
    /**
     * Decrypts data using SEA
     * @param encryptedData Encrypted data
     * @param key Decryption key
     * @returns Promise that resolves with the decrypted data
     */
    decrypt(encryptedData: string, key: string): Promise<string | any>;
    static Errors: typeof GunErrors;
}
export { GunDB };
