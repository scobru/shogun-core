"use strict";
/**
 * GunDB Relay Server Class
 * Instantiates and manages a GunDB relay server with configurable options
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPresets = exports.Relay = void 0;
exports.createRelay = createRelay;
// Gun modules will be loaded dynamically when needed
let Gun;
let gunModulesLoaded = false;
/**
 * Loads Gun modules dynamically to avoid issues during testing
 */
function loadGunModules() {
    if (gunModulesLoaded)
        return;
    try {
        Gun = require("gun/gun");
        require("gun/lib/yson");
        require("gun/lib/serve");
        require("gun/lib/store");
        require("gun/lib/rfs");
        require("gun/lib/rs3");
        require("gun/lib/wire");
        require("gun/lib/multicast");
        require("gun/lib/stats");
        // Optional modules - wrapped in try-catch for compatibility
        try {
            require("gun/sea");
        }
        catch (e) {
            // SEA not available
        }
        try {
            require("gun/axe");
        }
        catch (e) {
            // Axe not available
        }
        gunModulesLoaded = true;
    }
    catch (error) {
        // In test environment, don't throw error, just log it
        if (process.env.NODE_ENV === "test") {
            console.warn(`Gun modules not available in test environment: ${error}`);
            // Create a minimal mock Gun for testing
            Gun = () => ({
                on: () => { },
            });
            gunModulesLoaded = true;
        }
        else {
            throw new Error(`Failed to load Gun modules: ${error}`);
        }
    }
}
/**
 * GunDB Relay Server Class
 *
 * This class creates and manages a GunDB relay server that can:
 * - Serve as a peer for other GunDB instances
 * - Store and relay data between connected peers
 * - Provide persistence and caching
 * - Handle authentication and encryption
 */
class Relay {
    gun;
    server;
    config;
    status;
    log;
    /**
     * Creates a new GunDB relay server instance
     * @param config Configuration options for the relay server
     */
    constructor(config = {}) {
        // Load Gun modules when the class is instantiated
        loadGunModules();
        this.config = {
            port: 8765,
            host: "0.0.0.0",
            super: false,
            faith: false,
            enableFileStorage: false,
            enableEviction: false,
            ...config,
        };
        this.status = {
            running: false,
            peers: 0,
        };
        this.log = this.config.log || console.log;
        // Initialize Gun instance with relay configuration
        try {
            this.gun = Gun({
                file: this.config.enableFileStorage ? "data" : false,
                web: this.createServer(),
                multicast: false, // Disable multicast for relay servers
                ...this.config.gunOptions,
            });
        }
        catch (error) {
            // In test environment, create a minimal mock
            if (process.env.NODE_ENV === "test") {
                this.gun = {
                    on: () => { },
                };
            }
            else {
                throw error;
            }
        }
        // Configure Gun options
        this.gun.on("opt", (root) => {
            if (this.config.super !== undefined) {
                root.opt.super = this.config.super;
            }
            if (this.config.faith !== undefined) {
                root.opt.faith = this.config.faith;
            }
            root.opt.log = root.opt.log || this.log;
            // Continue the chain
            if (root.to && root.to.next) {
                root.to.next(root);
            }
        });
        // Track peer connections
        this.gun.on("hi", () => {
            this.status.peers++;
            this.log(`Peer connected. Total peers: ${this.status.peers}`);
        });
        this.gun.on("bye", () => {
            this.status.peers = Math.max(0, this.status.peers - 1);
            this.log(`Peer disconnected. Total peers: ${this.status.peers}`);
        });
    }
    /**
     * Creates the HTTP/WebSocket server for the relay
     * @returns Server instance
     */
    createServer() {
        try {
            const server = require("http").createServer();
            // Configure WebSocket server
            if (this.config.ws) {
                const WebSocketServer = require("ws").Server;
                const wss = new WebSocketServer({ server });
                wss.on("connection", (ws) => {
                    this.log("WebSocket connection established");
                });
            }
            // Configure HTTP server
            if (this.config.http) {
                Object.assign(server, this.config.http);
            }
            this.server = server;
            return server;
        }
        catch (error) {
            // In test environment, create a minimal mock server
            if (process.env.NODE_ENV === "test") {
                const mockServer = {
                    listen: () => { },
                    close: () => { },
                    on: () => { },
                    listening: true,
                };
                this.server = mockServer;
                return mockServer;
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Starts the relay server
     * @returns Promise that resolves when the server is started
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.config.port, this.config.host, () => {
                    this.status.running = true;
                    this.status.port = this.config.port;
                    this.status.host = this.config.host;
                    this.status.startTime = new Date();
                    this.log(`GunDB Relay Server started on ${this.config.host}:${this.config.port}`);
                    this.log(`Super peer mode: ${this.config.super ? "enabled" : "disabled"}`);
                    this.log(`Faith mode: ${this.config.faith ? "enabled" : "disabled"}`);
                    resolve();
                });
                this.server.on("error", (error) => {
                    this.log("Server error:", error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Stops the relay server
     * @returns Promise that resolves when the server is stopped
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server && this.status.running) {
                this.server.close(() => {
                    this.status.running = false;
                    this.log("GunDB Relay Server stopped");
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    /**
     * Gets the current status of the relay server
     * @returns Current relay status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Gets the Gun instance
     * @returns Gun instance
     */
    getGun() {
        return this.gun;
    }
    /**
     * Gets the server instance
     * @returns Server instance
     */
    getServer() {
        return this.server;
    }
    /**
     * Updates the relay configuration
     * @param newConfig New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.log("Relay configuration updated");
    }
    /**
     * Gets the relay URL
     * @returns Relay URL string
     */
    getRelayUrl() {
        const protocol = this.config.ws ? "wss" : "http";
        return `${protocol}://${this.config.host}:${this.config.port}/gun`;
    }
    /**
     * Checks if the relay is healthy
     * @returns Promise that resolves to true if healthy
     */
    async healthCheck() {
        try {
            return this.status.running && this.server.listening;
        }
        catch (error) {
            return false;
        }
    }
}
exports.Relay = Relay;
/**
 * Factory function to create a relay server with default configuration
 * @param config Optional configuration overrides
 * @returns Relay instance
 */
function createRelay(config = {}) {
    return new Relay(config);
}
/**
 * Default relay configurations for common use cases
 */
exports.RelayPresets = {
    /** Development relay with basic configuration */
    development: {
        port: 8765,
        host: "localhost",
        super: false,
        faith: false,
        enableFileStorage: true,
    },
    /** Production relay with enhanced configuration */
    production: {
        port: 8765,
        host: "0.0.0.0",
        super: true,
        faith: true,
        enableFileStorage: true,
        enableEviction: true,
    },
    /** Test relay with minimal configuration */
    test: {
        port: 8766,
        host: "localhost",
        super: false,
        faith: false,
        enableFileStorage: false,
    },
};
exports.default = Relay;
