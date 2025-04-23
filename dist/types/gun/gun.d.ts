/**
 * GunDB class with enhanced features:
 * - Dynamic auth token usage
 * - Concurrency-safe authentication
 * - Dynamic peer linking
 * - Support for remove/unset operations
 */
import "gun/sea";
import { IGunInstance, IGunUserInstance } from "gun/types";
import { GunDBOptions } from "../types/gun";
import { GunCollections } from "./collections";
import { GunConsensus } from "./consensus";
import * as GunErrors from "./errors";
import { GunRepository } from "./repository";
import { GunRxJS } from "./rxjs-integration";
export interface AuthResult {
    success: boolean;
    userPub?: string;
    username?: string;
    error?: string;
}
declare class GunDB {
    gun: IGunInstance<any>;
    user: IGunUserInstance<any> | null;
    private readonly onAuthCallbacks;
    private readonly retryConfig;
    private _authenticating;
    private readonly authToken?;
    private _collections?;
    private _consensus?;
    private _rxjs?;
    constructor(options?: Partial<GunDBOptions>);
    private retry;
    private subscribeToAuthEvents;
    private notifyAuthListeners;
    /**
     * Creates a new GunDB instance with specified peers
     * @param peers Array of peer URLs to connect to
     * @returns New GunDB instance
     */
    static withPeers(peers?: string[]): GunDB;
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
     * Unsets a node at the specified path
     * @param path Path to unset
     * @param node Node to unset
     * @returns Promise resolving to operation result
     */
    unset(path: string, node: any): Promise<any>;
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
    private save;
    private read;
    /**
     * Saves data to user's space
     * @param path Path in user space
     * @param data Data to save
     * @returns Promise resolving to saved data
     */
    saveUserData(path: string, data: any): Promise<any>;
    /**
     * Gets data from user's space
     * @param path Path in user space
     * @returns Promise resolving to retrieved data
     */
    getUserData(path: string): Promise<any>;
    /**
     * Saves data to public space
     * @param node Node name
     * @param key Key to store at
     * @param data Data to save
     * @returns Promise resolving to saved data
     */
    savePublicData(node: string, key: string, data: any): Promise<any>;
    /**
     * Gets data from public space
     * @param node Node name
     * @param key Key to retrieve
     * @returns Promise resolving to retrieved data
     */
    getPublicData(node: string, key: string): Promise<any>;
    /**
     * Aggiunge dati allo spazio Frozen
     * Frozen Space contiene dati che possono essere solo aggiunti, non modificati o rimossi.
     * Utilizza un pattern specifico con ::: per indicare dati immutabili.
     * @param node Node name
     * @param key Key to store at
     * @param data Data to save
     * @returns Promise resolving to operation result
     */
    addToFrozenSpace(node: string, key: string, data: any): Promise<any>;
    /**
     * Aggiunge dati allo spazio Frozen utilizzando l'hash del contenuto come chiave
     * Combina content addressing e immutabilità per massima integrità dei dati
     * @param node Nome del nodo
     * @param data Dati da salvare
     * @returns Promise che risolve con l'hash generato
     */
    addHashedToFrozenSpace(node: string, data: any): Promise<string>;
    /**
     * Recupera dati hash-addressable dallo spazio Frozen
     * @param node Nome del nodo
     * @param hash Hash del contenuto
     * @param verifyIntegrity Se true, verifica che l'hash corrisponda ai dati recuperati
     * @returns Promise che risolve con i dati recuperati
     */
    getHashedFrozenData(node: string, hash: string, verifyIntegrity?: boolean): Promise<any>;
    /**
     * Ottiene dati dallo spazio Frozen
     * @param node Node name
     * @param key Key to retrieve
     * @returns Promise resolving to retrieved data
     */
    getFrozenData(node: string, key: string): Promise<any>;
    /**
     * Genera un nuovo set di coppie di chiavi
     * @returns Promise resolving to generated key pair
     */
    generateKeyPair(): Promise<any>;
    /**
     * Accesses the Collections module for collection management
     * @returns GunCollections instance
     */
    collections(): GunCollections;
    /**
     * Accesses the Consensus module for distributed consensus
     * @param config Optional consensus configuration
     * @returns GunConsensus instance
     */
    consensus(config?: any): GunConsensus;
    /**
     * Accesses the RxJS module for reactive programming
     * @returns GunRxJS instance
     */
    rx(): GunRxJS;
    /**
     * Creates a typed repository
     * @param collection Collection name
     * @param repository Repository constructor
     * @param options Repository options
     * @returns Typed repository instance
     */
    repository<T, R extends GunRepository<T>>(collection: string, repository: new (gun: GunDB, collection: string, options?: any) => R, options?: any): R;
    /**
     * Encrypts a value
     * @param value Value to encrypt
     * @param epriv Private key
     * @returns Promise resolving to encrypted value
     */
    encrypt(value: any, epriv: any): Promise<string>;
    /**
     * Decrypts a value
     * @param value Value to decrypt
     * @param epriv Private key
     * @returns Promise resolving to decrypted value
     */
    decrypt(value: string, epriv: any): Promise<any>;
    /**
     * Signs data
     * @param data Data to sign
     * @param pair Key pair
     * @returns Promise resolving to signed data
     */
    sign(data: any, pair: {
        priv: string;
        pub: string;
    }): Promise<string>;
    /**
     * Verifies signed data
     * @param signed Signed data
     * @param pub Public key
     * @returns Promise resolving to verified data
     */
    verify(signed: string, pub: string | {
        pub: string;
    }): Promise<any>;
    /**
     * Clears the encryption cache
     */
    clearCryptoCache(): void;
    /**
     * Checks if a string is a hash
     * @param str String to check
     * @returns True if valid hash
     */
    isHash(str: any): boolean;
    /**
     * Encrypts data between sender and receiver
     * @param data Data to encrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to encrypted data
     */
    encFor(data: any, sender: any, receiver: any): Promise<any>;
    /**
     * Decrypts data between sender and receiver
     * @param data Data to decrypt
     * @param sender Sender
     * @param receiver Receiver
     * @returns Promise resolving to decrypted data
     */
    decFrom(data: any, sender: any, receiver: any): Promise<any>;
    /**
     * Generates a hash for text
     * @param text Text to hash
     * @returns Promise resolving to generated hash
     */
    hashText(text: string): Promise<string>;
    /**
     * Generates a hash for an object
     * @param obj Object to hash
     * @returns Promise resolving to hash and serialized object
     */
    hashObj(obj: any): Promise<any>;
    /**
     * Generates a short hash
     * @param text Text to hash
     * @param salt Optional salt
     * @returns Promise resolving to short hash
     */
    getShortHash(text: string, salt?: string): Promise<string>;
    /**
     * Converts a hash to URL-safe format
     * @param unsafe Hash to convert
     * @returns Safe hash
     */
    safeHash(unsafe: string | undefined): string | undefined;
    /**
     * Converts a safe hash back to original format
     * @param safe Safe hash
     * @returns Original hash
     */
    unsafeHash(safe: string | undefined): string | undefined;
    /**
     * Safely parses JSON
     * @param input Input to parse
     * @param def Default value
     * @returns Parsed object
     */
    safeJSONParse(input: any, def?: {}): any;
    /**
     * Issues a certificate
     * @param options Certificate options
     * @returns Promise resolving to generated certificate
     */
    issueCert(options: {
        pair: any;
        tag?: string;
        dot?: string;
        users?: string;
        personal?: boolean;
    }): Promise<string>;
    /**
     * Generates multiple certificates
     * @param options Generation options
     * @returns Promise resolving to generated certificates
     */
    generateCerts(options: {
        pair: any;
        list: Array<{
            tag: string;
            dot?: string;
            users?: string;
            personal?: boolean;
        }>;
    }): Promise<Record<string, string>>;
    /**
     * Verifies a certificate
     * @param cert Certificate to verify
     * @param pub Public key
     * @returns Promise resolving to verification result
     */
    verifyCert(cert: string, pub: string | {
        pub: string;
    }): Promise<any>;
    /**
     * Extracts policy from a certificate
     * @param cert Certificate
     * @returns Promise resolving to extracted policy
     */
    extractCertPolicy(cert: string): Promise<any>;
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
    static Errors: typeof GunErrors;
}
export { GunDB };
