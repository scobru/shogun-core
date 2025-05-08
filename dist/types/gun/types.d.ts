export interface GunDataRecord {
    _: {
        "#": string;
        ">": {
            [key: string]: number;
        };
        [key: string]: any;
    };
    [key: string]: any;
}
/**
 * Interface for a Gun chain referenceGunDataRecord
 */
export interface IGunChainReference<T = unknown> {
    /**
     * Gets a specific node in the chain
     */
    get(path: string): IGunChainReference;
    /**
     * Puts data into a node
     */
    put(data: unknown, callback?: (ack: IGunAck) => void, options?: IGunOptions): IGunChainReference;
    /**
     * Gets the current node's value once
     */
    once(callback: (data: T) => void): IGunChainReference;
    /**
     * Gets the Gun user
     */
    user(): IGunChainReference;
    user(pub?: string): IGunChainReference;
    /**
     * Retrieves the user session
     */
    recall(options?: IGunOptions, callback?: (ack: IGunAck) => void): IGunChainReference;
    /**
     * Logs out the user
     */
    leave(): void;
    /**
     * Authenticates the user
     */
    auth(username: string, password: string, callback?: (ack: IGunAck) => void, options?: IGunOptions): IGunChainReference;
    auth(pair: IGunCryptoKeyPair, callback?: (ack: IGunAck) => void, options?: IGunOptions): IGunChainReference;
    /**
     * Creates a new user
     */
    create(username: string, password: string, callback?: (ack: IGunAck) => void): IGunChainReference;
    create(username: string, password: string, pair: IGunCryptoKeyPair, callback?: (ack: IGunAck) => void): IGunChainReference;
    /**
     * Deletes a user
     */
    delete(username: string, password: string, callback?: (ack: IGunAck) => void): IGunChainReference;
    /**
     * Registers an event
     */
    on(event: string, callback: (...args: unknown[]) => void): IGunChainReference;
    on(callback: (data: T) => void): IGunChainReference;
}
/**
 * Interface for a SEA cryptographic key pair
 */
export interface IGunCryptoKeyPair {
    /**
     * Public key
     */
    pub: string;
    /**
     * Encrypted public key
     */
    epub: string;
    /**
     * Private key
     */
    priv?: string;
    /**
     * Encrypted private key
     */
    epriv?: string;
}
export interface GunDBOptions {
    web?: any;
    peers?: string[];
    localStorage?: boolean;
    sessionStorage?: boolean;
    radisk?: boolean;
    multicast?: boolean;
    axe?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
    authToken?: string;
    websocket?: boolean;
}
/**
 * Interface for Gun instance
 */
export interface IGunInstance<T = unknown> {
    get(path: string): IGunChainReference<T>;
    put(data: unknown): IGunChainReference<T>;
    user(): IGunChainReference<T>;
    on(event: string, callback: (...args: unknown[]) => void): IGunInstance<T>;
    SEA: IGunSEA;
}
/**
 * Interface for GunDB acknowledgment responses
 */
export interface IGunAck {
    err?: string;
    ok?: boolean | number;
    pub?: string;
    lack?: number;
    [key: string]: unknown;
}
/**
 * Interface for Gun options
 */
export interface IGunOptions {
    opt?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * Interface for SEA cryptography module
 */
export interface IGunSEA {
    pair(callback?: (pair: IGunCryptoKeyPair) => void): Promise<IGunCryptoKeyPair>;
    sign(data: unknown, pair: IGunCryptoKeyPair): Promise<string>;
    verify(data: string, pair: IGunCryptoKeyPair): Promise<unknown>;
    encrypt(data: unknown, pair: IGunCryptoKeyPair): Promise<string>;
    decrypt(data: string, pair: IGunCryptoKeyPair): Promise<unknown>;
    secret(key: string, pair: IGunCryptoKeyPair, callback?: Function): Promise<string>;
    work(data: string, salt: string, callback?: Function): Promise<string>;
}
