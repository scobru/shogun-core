/**
 * GunDB Relay Server Class
 * Instantiates and manages a GunDB relay server with configurable options
 *
 * Note: This module is primarily for Node.js environments.
 * In browser environments, relay functionality is limited.
 */

import type { IGunInstance } from "gun/types";

// Check if we're in a Node.js environment
const isNode =
  typeof process !== "undefined" && process.versions && process.versions.node;

// Gun modules will be loaded dynamically when needed
let Gun: IGunInstance<any>;
let gunModulesLoaded = false;

/**
 * Loads Gun modules dynamically to avoid issues during testing
 */
async function loadGunModules(): Promise<void> {
  if (gunModulesLoaded) return;

  try {
    // For browser environments, load only the modules that are browser-safe.
    // Webpack 5 no longer polyfills Node core modules, and some Gun server-side
    // libs (like wire/rs3) depend on them. To avoid bundling those, we only
    // import browser-safe parts here. For Node, we use a runtime require via
    // eval to prevent webpack from statically analyzing those imports.

    if (!isNode) {
      const gunModule = await import("gun/gun");
      Gun = (gunModule as any).default || gunModule;
      await import("gun/lib/yson");
      gunModulesLoaded = true;
      return;
    }

    // Node.js environment: prefer require, but use eval to avoid webpack
    // from resolving server-only modules in web builds.
    const req = (() => {
      try {
        // eslint-disable-next-line no-eval
        return eval("require");
      } catch {
        return null;
      }
    })();

    if (req) {
      Gun = req("gun/gun");
      // Best-effort load of server-side helpers; ignore if unavailable
      const nodeOnlyLibs = [
        "gun/lib/yson",
        "gun/lib/serve",
        "gun/lib/store",
        "gun/lib/rfs",
        "gun/lib/rs3",
        "gun/lib/wire",
        "gun/lib/multicast",
        "gun/lib/stats",
        "gun/lib/radix",
        "gun/lib/radisk",
      ];
      for (const lib of nodeOnlyLibs) {
        try {
          req(lib);
        } catch (_) {}
      }
      try {
        req("gun/sea");
      } catch (_) {}
      try {
        req("gun/axe");
      } catch (_) {}
    } else {
      // Fallback in rare cases where require isn't available
      const gunModule = await import("gun/gun");
      Gun = (gunModule as any).default || gunModule;
      await import("gun/lib/yson");
    }

    gunModulesLoaded = true;
  } catch (error) {
    // In test environment, don't throw error, just log it
    if (process.env.NODE_ENV === "test") {
      console.warn(`Gun modules not available in test environment: ${error}`);
      // Create a minimal mock Gun for testing
      Gun = () => ({
        on: () => {},
      });
      gunModulesLoaded = true;
    } else {
      throw new Error(`Failed to load Gun modules: ${error}`);
    }
  }
}

/**
 * Creates a server instance - only in Node.js environments
 */
async function createNodeServer(config: any): Promise<any> {
  if (!isNode) {
    return null;
  }

  try {
    const http = await import("http");
    const server = http.createServer();

    // Configure WebSocket server
    if (config.ws) {
      const ws = await import("ws");
      const WebSocketServer = ws.Server;
      const wss = new WebSocketServer({ server });

      wss.on("connection", (ws: any) => {
        console.log("WebSocket connection established");
      });
    }

    // Configure HTTP server
    if (config.http) {
      Object.assign(server, config.http);
    }

    return server;
  } catch (error) {
    console.error("Failed to create Node.js server:", error);
    return null;
  }
}

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
  /** Enable eviction */
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
export class Relay {
  private gun!: IGunInstance<any>;
  private server: any;
  private config: RelayConfig;
  private status: RelayStatus;
  private log: (message: string, ...args: any[]) => void;
  private _isNodeEnvironment: boolean;

  /**
   * Creates a new GunDB relay server instance
   * @param config Configuration options for the relay server
   */
  constructor(config: RelayConfig = {}) {
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
  private async initializeGun(): Promise<void> {
    try {
      // Load Gun modules when the class is instantiated
      await loadGunModules();

      // In browser environment, create a minimal Gun instance
      if (!this._isNodeEnvironment) {
        this.gun = Gun({
          multicast: false,
          ...this.config.gunOptions,
        });
        this.log(
          "Relay initialized in browser mode - server functionality disabled",
        );
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
      (this.gun as any).on("opt", (root: any) => {
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
      (this.gun as any).on("hi", () => {
        this.status.peers++;
        this.log(`Peer connected. Total peers: ${this.status.peers}`);
      });

      (this.gun as any).on("bye", () => {
        this.status.peers = Math.max(0, this.status.peers - 1);
        this.log(`Peer disconnected. Total peers: ${this.status.peers}`);
      });
    } catch (error) {
      // In test environment, create a minimal mock
      if (process.env.NODE_ENV === "test") {
        this.gun = {
          on: () => {},
        } as any;
      } else {
        throw error;
      }
    }
  }

  /**
   * Starts the relay server
   * @returns Promise that resolves when the server is started
   */
  public async start(): Promise<void> {
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

          this.log(
            `GunDB Relay Server started on ${this.config.host}:${this.config.port}`,
          );
          this.log(
            `Super peer mode: ${this.config.super ? "enabled" : "disabled"}`,
          );
          this.log(`Faith mode: ${this.config.faith ? "enabled" : "disabled"}`);

          resolve();
        });

        this.server.on("error", (error: any) => {
          this.log("Server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stops the relay server
   * @returns Promise that resolves when the server is stopped
   */
  public async stop(): Promise<void> {
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
      } else {
        resolve();
      }
    });
  }

  /**
   * Gets the current status of the relay server
   * @returns Current relay status
   */
  public getStatus(): RelayStatus {
    return { ...this.status };
  }

  /**
   * Gets the Gun instance
   * @returns Gun instance
   */
  public getGun(): IGunInstance<any> {
    return this.gun;
  }

  /**
   * Gets the server instance
   * @returns Server instance
   */
  public getServer(): any {
    return this.server;
  }

  /**
   * Updates the relay configuration
   * @param newConfig New configuration options
   */
  public updateConfig(newConfig: Partial<RelayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log("Relay configuration updated");
  }

  /**
   * Gets the relay URL
   * @returns Relay URL string
   */
  public getRelayUrl(): string {
    const protocol = this.config.ws ? "wss" : "http";
    return `${protocol}://${this.config.host}:${this.config.port}/gun`;
  }

  /**
   * Checks if the relay is healthy
   * @returns Promise that resolves to true if healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // In browser environment, return false
      if (!this._isNodeEnvironment) {
        return false;
      }
      return this.status.running && this.server && this.server.listening;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the relay is running in a Node.js environment
   * @returns True if running in Node.js
   */
  public isNodeEnvironment(): boolean {
    return this._isNodeEnvironment;
  }
}

/**
 * Factory function to create a relay server with default configuration
 * @param config Optional configuration overrides
 * @returns Relay instance
 */
export function createRelay(config: RelayConfig = {}): Relay {
  return new Relay(config);
}

/**
 * Default relay configurations for common use cases
 */
export const RelayPresets = {
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
} as const;

export default Relay;
