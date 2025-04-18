import "gun/sea";
import { IGunInstance, IGunUserInstance } from "gun/types";
import { GunDBOptions } from "../types/gun";
/**
 * Authentication result
 */
export interface AuthResult {
    success: boolean;
    userPub?: string;
    username?: string;
    error?: string;
}
/**
 * GunDB - Simplified Gun management with advanced Auth
 *
 * Uses the Auth class for optimized authentication handling
 */
declare class GunDB {
    gun: IGunInstance<any>;
    user: IGunUserInstance<any> | null;
    private certificato;
    private onAuthCallbacks;
    private retryConfig;
    private _authenticating;
    /**
     * @param options - GunDBOptions
     */
    constructor(options?: Partial<GunDBOptions>);
    /**
     * Retry operation with exponential backoff
     */
    private retry;
    /**
     * Subscribe to Gun authentication events
     */
    private subscribeToAuthEvents;
    /**
     * Notify all authentication listeners
     * @param pub - Public key of authenticated user
     */
    private notifyAuthListeners;
    /**
     * Create new GunDB instance with specified peers
     * @param peers - Array of peer URLs
     * @returns New GunDB instance
     */
    static withPeers(peers?: string[]): GunDB;
    /**
     * Add listener for authentication events
     * @param callback - Function to call when user authenticates
     * @returns Function to remove the listener
     */
    onAuth(callback: (user: any) => void): () => void;
    /**
     * Get underlying Gun instance
     * @returns Gun instance
     */
    getGun(): IGunInstance<any>;
    /**
     * Get current user
     * @returns Gun user or null if not authenticated
     */
    getUser(): any;
    /**
     * Get data from a specific path
     * @param path - Path to get data from
     * @returns Node reference
     */
    get(path: string): any;
    /**
     * Put data at a specific path
     * @param path - Path to put data at
     * @param data - Data to put
     * @returns Promise with success result
     */
    put(path: string, data: any): Promise<any>;
    /**
     * Set data in a collection
     * @param path - Path to collection
     * @param data - Data to set
     * @returns Promise with success result
     */
    set(path: string, data: any): Promise<any>;
    /**
     * Set certificate for current user
     * @param certificate - Certificate to use
     */
    setCertificate(certificate: string): void;
    /**
     * Get current user's certificate
     * @returns Certificate or null if not available
     */
    getCertificate(): string | null;
    /**
     * Register a new user
     * @param username - Username
     * @param password - Password
     * @returns Promise resolving with user's public key
     */
    signUp(username: string, password: string): Promise<any>;
    /**
     * Perform user login
     * @param username - Username
     * @param password - Password
     * @param callback - Optional callback function
     * @returns Promise that resolves with login result
     */
    login(username: string, password: string, callback?: (result: any) => void): Promise<any>;
    /**
     * Salva la coppia di autenticazione dell'utente
     * @private
     */
    private _savePair;
    /**
     * Verifica se un processo di autenticazione è già in corso
     */
    private isAuthenticating;
    /**
     * Imposta il flag di autenticazione
     */
    private _setAuthenticating;
    /**
     * Logout current user
     */
    logout(): void;
    /**
     * Check if a user is currently authenticated
     * @returns true if a user is authenticated
     */
    isLoggedIn(): boolean;
    /**
     * Get currently authenticated user
     * @returns Current user or null if not authenticated
     */
    getCurrentUser(): any;
    /**
     * Save data with retry logic
     */
    private saveWithRetry;
    /**
     * Read data with retry logic
     */
    private readWithRetry;
    /**
     * Save data to user node with improved error handling
     */
    saveUserData(path: string, data: any): Promise<any>;
    /**
     * Retrieve data from user node with improved error handling
     */
    getUserData(path: string): Promise<any>;
    /**
     * Save data to public node
     */
    savePublicData(node: string, key: string, data: any): Promise<any>;
    /**
     * Retrieve data from public node
     */
    getPublicData(node: string, key: string): Promise<any>;
    /**
     * Generate new SEA key pair
     */
    generateKeyPair(): Promise<any>;
}
declare global {
    interface Window {
        GunDB: typeof GunDB;
    }
    namespace NodeJS {
        interface Global {
            GunDB: typeof GunDB;
        }
    }
}
export { GunDB };
