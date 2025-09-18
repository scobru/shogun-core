/**
 * GunDB Relay Server Class
 * Instantiates and manages a GunDB relay server with configurable options
 *
 * Note: This module is primarily for Node.js environments.
 * In browser environments, relay functionality is limited.
 */
import type { IGunInstance } from "gun/types";
/**
 * Configuration options for the GunDB relay server
 */
export interface RelayConfig {
    /** Port to run the relay server on */
    port?: number;
    /** Host to bind the relay server to */
    host?: string;
    /** Enable super peer mode */
    super?: boolean;
    /** Enable faith mode for performance improvements */
    faith?: boolean;
    /** Custom logging function */
    log?: (message: string, ...args: any[]) => void;
    /** Additional Gun options */
    gunOptions?: any;
    /** Enable file storage */
    enableFileStorage?: boolean;
    /** Enable eviction - automatically removes old data when memory usage is high */
    enableEviction?: boolean;
    /** Custom store configuration */
    store?: any;
    /** WebSocket server options */
    ws?: any;
    /** HTTP server options */
    http?: any;
}
/**
 * Relay server status
 */
export interface RelayStatus {
    /** Whether the relay is running */
    running: boolean;
    /** Port the relay is running on */
    port?: number;
    /** Host the relay is bound to */
    host?: string;
    /** Number of connected peers */
    peers: number;
    /** Server start time */
    startTime?: Date;
}
/**
 * GunDB Relay Server Class
 *
 * This class creates and manages a GunDB relay server that can:
 * - Serve as a peer for other GunDB instances
 * - Store and relay data between connected peers
 * - Provide persistence and caching
 * - Handle authentication and encryption
 *
 * Note: This class is primarily designed for Node.js environments.
 * In browser environments, most functionality will be limited.
 */
export declare class Relay {
    private gun;
    private server;
    private config;
    private status;
    private log;
    private _isNodeEnvironment;
    /**
     * Creates a new GunDB relay server instance
     * @param config Configuration options for the relay server
     */
    constructor(config?: RelayConfig);
    /**
     * Initialize Gun instance asynchronously
     */
    private initializeGun;
    /**
     * Starts the relay server
     * @returns Promise that resolves when the server is started
     */
    start(): Promise<void>;
    /**
     * Stops the relay server
     * @returns Promise that resolves when the server is stopped
     */
    stop(): Promise<void>;
    /**
     * Gets the current status of the relay server
     * @returns Current relay status
     */
    getStatus(): RelayStatus;
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun(): IGunInstance<any>;
    /**
     * Gets the server instance
     * @returns Server instance
     */
    getServer(): any;
    /**
     * Updates the relay configuration
     * @param newConfig New configuration options
     */
    updateConfig(newConfig: Partial<RelayConfig>): void;
    /**
     * Gets the relay URL
     * @returns Relay URL string
     */
    getRelayUrl(): string;
    /**
     * Checks if the relay is healthy
     * @returns Promise that resolves to true if healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Checks if the relay is running in a Node.js environment
     * @returns True if running in Node.js
     */
    isNodeEnvironment(): boolean;
}
/**
 * Factory function to create a relay server with default configuration
 * @param config Optional configuration overrides
 * @returns Relay instance
 */
export declare function createRelay(config?: RelayConfig): Relay;
/**
 * Default relay configurations for common use cases
 */
export declare const RelayPresets: {
    /** Development relay with basic configuration */
    readonly development: {
        readonly port: 8765;
        readonly host: "localhost";
        readonly super: false;
        readonly faith: false;
        readonly enableFileStorage: true;
    };
    /** Production relay with enhanced configuration */
    readonly production: {
        readonly port: 8765;
        readonly host: "0.0.0.0";
        readonly super: true;
        readonly faith: true;
        readonly enableFileStorage: true;
        readonly enableEviction: true;
    };
    /** Test relay with minimal configuration */
    readonly test: {
        readonly port: 8766;
        readonly host: "localhost";
        readonly super: false;
        readonly faith: false;
        readonly enableFileStorage: false;
    };
};
export default Relay;
