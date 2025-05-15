/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */
import { IGunUserInstance } from "gun";
import { GunInstance } from "./types";
import * as GunErrors from "./errors";
import { GunRxJS } from "./rxjs-integration";
declare class GunDB {
    gun: GunInstance<any>;
    user: IGunUserInstance<any> | null;
    private readonly onAuthCallbacks;
    private _authenticating;
    private readonly authToken?;
    private _rxjs?;
    private _sea?;
    constructor(gun: GunInstance<any>, authToken?: string);
    private subscribeToAuthEvents;
    private notifyAuthListeners;
    restrictPut(gun: GunInstance<any>, authToken: string): void;
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
     * Signs up a new user
     * @param username Username
     * @param password Password
     * @returns Promise resolving to signup result
     */
    signUp(username: string, password: string): Promise<any>;
    /**
     * Logs in a user
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
     * Logs out the current user
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
