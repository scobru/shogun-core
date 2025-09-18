"use strict";
/**
 * GunDB Relay Server Class
 * Instantiates and manages a GunDB relay server with configurable options
 *
 * Note: This module is primarily for Node.js environments.
 * In browser environments, relay functionality is limited.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPresets = exports.Relay = void 0;
exports.createRelay = createRelay;
// Check if we're in a Node.js environment
const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
// Gun modules will be loaded dynamically when needed
let Gun;
let gunModulesLoaded = false;
/**
 * Loads Gun modules dynamically to avoid issues during testing
 */
async function loadGunModules() {
    if (gunModulesLoaded)
        return;
    try {
        const req = (() => {
            try {
                // eslint-disable-next-line no-eval
                return eval("require");
            }
            catch {
                return null;
            }
        })();
        if (req) {
            Gun = req("gun/gun");
            // Best-effort load of server-side helpers; ignore if unavailable
            const nodeOnlyLibs = [
                "gun/lib/yson",
                "gun/lib/serve",
                "gun/lib/stats",
                "gun/lib/webrtc",
                "gun/lib/erase",
                "gun/lib/unset",
                "gun/lib/wire",
                "gun/lib/verify",
                "gun/lib/then",
                "gun/lib/open",
                "gun/lib/bye",
                "gun/lib/shim",
                "gun/lib/les",
                "gun/lib/evict",
                "gun/lib/forget",
            ];
            for (const lib of nodeOnlyLibs) {
                try {
                    req(lib);
                }
                catch (_) { }
            }
            try {
                req("gun/sea");
            }
            catch (_) { }
            try {
                req("gun/axe");
            }
            catch (_) { }
        }
        else {
            // Fallback in rare cases where require isn't available
            const gunModule = await Promise.resolve().then(() => __importStar(require("gun/gun")));
            Gun = gunModule.default || gunModule;
            await Promise.resolve().then(() => __importStar(require("gun/lib/yson")));
        }
        gunModulesLoaded = true;
    }
    catch (error) {
        throw new Error(`Failed to load Gun modules: ${error}`);
    }
}
/**
 * Creates a server instance - only in Node.js environments
 */
async function createNodeServer(config) {
    if (!isNode) {
        return null;
    }
    try {
        const http = await Promise.resolve().then(() => __importStar(require("http")));
        const server = http.createServer();
        // Configure WebSocket server
        if (config.ws) {
            const ws = await Promise.resolve().then(() => __importStar(require("ws")));
            const WebSocketServer = ws.Server;
            const wss = new WebSocketServer({ server });
            wss.on("connection", (ws) => {
                console.log("WebSocket connection established");
            });
        }
        // Configure HTTP server
        if (config.http) {
            Object.assign(server, config.http);
        }
        return server;
    }
    catch (error) {
        console.error("Failed to create Node.js server:", error);
        return null;
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
 *
 * Note: This class is primarily designed for Node.js environments.
 * In browser environments, most functionality will be limited.
 */
class Relay {
    gun;
    server;
    config;
    status;
    log;
    _isNodeEnvironment;
    /**
     * Creates a new GunDB relay server instance
     * @param config Configuration options for the relay server
     */
    constructor(config = {}) {
        this._isNodeEnvironment = Boolean(isNode);
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
        this.initializeGun();
    }
    /**
     * Initialize Gun instance asynchronously
     */
    async initializeGun() {
        try {
            // Load Gun modules when the class is instantiated
            await loadGunModules();
            // In browser environment, create a minimal Gun instance
            if (!this._isNodeEnvironment) {
                this.gun = Gun({
                    multicast: false,
                    ...this.config.gunOptions,
                });
                this.log("Relay initialized in browser mode - server functionality disabled");
                return;
            }
            // Create server only in Node.js environment
            this.server = await createNodeServer(this.config);
            this.gun = Gun({
                file: this.config.enableFileStorage ? "data" : false,
                web: this.server,
                multicast: false, // Disable multicast for relay servers
                ...this.config.gunOptions,
            });
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
    }
    /**
     * Starts the relay server
     * @returns Promise that resolves when the server is started
     */
    async start() {
        // In browser environment, just log and return
        if (!this._isNodeEnvironment) {
            this.log("Relay server cannot be started in browser environment");
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                if (!this.server) {
                    reject(new Error("Server not initialized"));
                    return;
                }
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
        // In browser environment, just log and return
        if (!this._isNodeEnvironment) {
            this.log("Relay server cannot be stopped in browser environment");
            return;
        }
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
            // In browser environment, return false
            if (!this._isNodeEnvironment) {
                return false;
            }
            return this.status.running && this.server && this.server.listening;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Checks if the relay is running in a Node.js environment
     * @returns True if running in Node.js
     */
    isNodeEnvironment() {
        return this._isNodeEnvironment;
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
