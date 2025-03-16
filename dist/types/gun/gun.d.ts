import "gun/sea";
import { IGunInstance } from "gun/types";
/**
 * GunDB options definition
 */
interface GunDBOptions {
    peers?: string[];
    localStorage?: boolean;
    sessionStorage?: boolean;
    radisk?: boolean;
    multicast?: boolean;
    axe?: boolean;
}
/**
 * GunDB - Simplified Gun management with advanced Auth
 *
 * Uses the Auth class for optimized authentication handling
 */
declare class GunDB {
    gun: IGunInstance<any>;
    private certificato;
    private onAuthCallbacks;
    /**
     * @param options - GunDBOptions
     */
    constructor(options?: Partial<GunDBOptions>);
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
     * Login a user
     * @param username - Username
     * @param password - Password
     * @returns Promise resolving with login result
     */
    login(username: string, password: string): Promise<any>;
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
     * Save data to user node
     */
    saveUserData(path: string, data: any): Promise<any>;
    /**
     * Retrieve data from user node
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
