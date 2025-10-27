import { IShogunCore, ShogunCoreConfig } from "../interfaces/shogun";
import { ShogunStorage } from "../storage/storage";
import { ErrorHandler, ShogunError } from "../utils/errorHandler";
import { WebauthnPlugin } from "../plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../plugins/nostr/nostrConnectorPlugin";
import { ZkProofPlugin } from "../plugins/zkproof/zkProofPlugin";
import { DataBase, RxJS, createGun, derive } from "../gundb";
import {
  TransportFactory,
  TransportConfig,
} from "../gundb/transport/TransportLayer";

/**
 * Handles initialization of ShogunCore components
 */
export class CoreInitializer {
  private core: IShogunCore;

  constructor(core: IShogunCore) {
    this.core = core;
  }

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunInstance connection,
   * and plugin system.
   */
  async initialize(config: ShogunCoreConfig): Promise<void> {
    // Polyfill console for environments where it might be missing
    if (typeof console === "undefined") {
      (global as any).console = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
      };
    }

    // Initialize storage
    this.core.storage = new ShogunStorage(config.silent);

    // Setup error handler
    ErrorHandler.addListener((error: ShogunError) => {
      this.core.emit("error", {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    // Setup transport layer
    this.initializeTransport(config);

    // Setup user
    this.initializeUser();

    // Setup event forwarding
    this.setupEventForwarding();

    // Setup wallet derivation
    this.setupWalletDerivation();

    // Initialize RxJS
    this.core.rx = new RxJS(this.core.transport as any); // Cast for backward compatibility

    // Register built-in plugins
    this.registerBuiltinPlugins(config);

    // Initialize async components
    this.initializeDb();
  }

  /**
   * Initialize transport layer
   */
  private initializeTransport(config: ShogunCoreConfig): boolean {
    try {
      let transportConfig: TransportConfig;

      if (config.transport) {
        // Use custom transport configuration
        transportConfig = config.transport;
      } else if (config.gunInstance) {
        // Use existing Gun instance (backward compatibility)
        transportConfig = {
          type: "gun",
          options: { gunInstance: config.gunInstance },
        };
      } else if (config.gunOptions) {
        // Use Gun options (backward compatibility)
        transportConfig = {
          type: "gun",
          options: config.gunOptions,
        };
      } else {
        // Default to Gun transport
        transportConfig = {
          type: "gun",
          options: {},
        };
      }

      // Create transport layer
      this.core.transport = TransportFactory.create(transportConfig);

      // Connect transport
      this.core.transport.connect(transportConfig.options);

      // Create DataBase with transport
      this.core.db = new DataBase(
        this.core.transport,
        config.gunOptions?.scope || "shogun",
      );

      return true;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error creating transport layer:", error);
      }
      throw new Error(`Failed to initialize transport layer: ${error}`);
    }
  }

  /**
   * Initialize user
   */
  private initializeUser(): void {
    try {
      this.core._user = this.core.transport
        .user()
        .recall({ sessionStorage: true }) as any;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error initializing user:", error);
      }
      throw new Error(`Failed to initialize user: ${error}`);
    }

    // Setup auth event listener
    if (this.core.transport.on) {
      this.core.transport.on("auth", (user: any) => {
        this.core._user = this.core.transport
          .user()
          .recall({ sessionStorage: true }) as any;
        this.core.emit("auth:login", {
          userPub: user.pub,
          method: "password" as const,
        });
      });
    }
  }

  /**
   * Setup event forwarding
   */
  private setupEventForwarding(): void {
    const dataEvents = ["put", "get", "set", "remove"] as const;
    dataEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName as any, data);
      });
    });

    const peerEvents = [
      "peer:add",
      "peer:remove",
      "peer:connect",
      "peer:disconnect",
    ] as const;

    peerEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName as any, data);
      });
    });
  }

  /**
   * Setup wallet derivation
   */
  private setupWalletDerivation(): void {
    if (this.core.transport.on) {
      this.core.transport.on("auth", async (user: any) => {
        if (!user.is) return;
        const priv = user._?.sea?.epriv;
        const pub = user._?.sea?.epub;
        this.core.wallets = await derive(priv, pub, {
          includeSecp256k1Bitcoin: true,
          includeSecp256k1Ethereum: true,
        });
      });
    }
  }

  /**
   * Register built-in plugins based on configuration
   */
  private registerBuiltinPlugins(config: ShogunCoreConfig): void {
    try {
      // Register WebAuthn plugin if configuration is provided
      if (config.webauthn) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "WebAuthn plugin will be registered with provided configuration",
          );
        }

        const webauthnPlugin = new WebauthnPlugin();
        if (typeof (webauthnPlugin as any).configure === "function") {
          (webauthnPlugin as any).configure(config.webauthn);
        }
        this.core.pluginManager.register(webauthnPlugin);
      }

      // Register Web3 plugin if configuration is provided
      if (config.web3) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "Web3 plugin will be registered with provided configuration",
          );
        }

        const web3Plugin = new Web3ConnectorPlugin();
        if (typeof (web3Plugin as any).configure === "function") {
          (web3Plugin as any).configure(config.web3);
        }
        this.core.pluginManager.register(web3Plugin);
      }

      // Register Nostr plugin if configuration is provided
      if (config.nostr) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "Nostr plugin will be registered with provided configuration",
          );
        }

        const nostrPlugin = new NostrConnectorPlugin();
        if (typeof (nostrPlugin as any).configure === "function") {
          (nostrPlugin as any).configure(config.nostr);
        }
        this.core.pluginManager.register(nostrPlugin);
      }

      // Register ZK-Proof plugin if configuration is provided
      if (config.zkproof) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "ZK-Proof plugin will be registered with provided configuration",
          );
        }

        const zkproofPlugin = new ZkProofPlugin(config.zkproof);
        this.core.pluginManager.register(zkproofPlugin);
      }
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error registering builtin plugins:", error);
      }
    }
  }

  /**
   * Initialize async components
   */
  private initializeDb(): boolean {
    try {
      this.core.db.initialize();

      this.core.emit("debug", {
        action: "core_initialized",
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error during Shogun Core initialization:", error);
      }
      return false;
    }
  }
}
