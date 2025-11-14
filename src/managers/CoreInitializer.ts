import { IShogunCore, ShogunCoreConfig } from "../interfaces/shogun";
import { ShogunStorage } from "../storage/storage";
import { ErrorHandler, ShogunError } from "../utils/errorHandler";
import { WebauthnPlugin } from "../plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../plugins/nostr/nostrConnectorPlugin";
import { ZkProofPlugin } from "../plugins/zkproof/zkProofPlugin";
import { DataBase, RxJS, derive } from "../gundb/db";

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

    // Setup Gun instance
    this.initializeGun(config);

    // Setup Gun user
    this.initializeGunUser();

    // Setup Gun event forwarding
    this.setupGunEventForwarding();

    // Setup wallet derivation
    this.setupWalletDerivation();

    // Initialize RxJS
    this.core.rx = new RxJS(this.core.gun);

    // Register built-in plugins
    this.registerBuiltinPlugins(config);

    // Initialize async components
    this.initializeDb();
  }

  /**
   * Initialize Gun instance
   */
  private initializeGun(config: ShogunCoreConfig): boolean {
    try {
      if (!config.gunInstance) {
        throw new Error("Gun instance is required but was not provided");
      }

      // Validate Gun instance
      if (typeof config.gunInstance !== "object") {
        throw new Error(
          `Gun instance must be an object, received: ${typeof config.gunInstance}`,
        );
      }

      if (typeof config.gunInstance.user !== "function") {
        throw new Error(
          `Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof config.gunInstance.user}`,
        );
      }

      if (typeof config.gunInstance.get !== "function") {
        throw new Error(
          `Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof config.gunInstance.get}`,
        );
      }

      if (typeof config.gunInstance.on !== "function") {
        throw new Error(
          `Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof config.gunInstance.on}`,
        );
      }

      console.log("Using provided Gun instance:", config.gunInstance);
      this.core._gun = config.gunInstance;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error validating Gun instance:", error);
      }
      throw new Error(`Failed to validate Gun instance: ${error}`);
    }

    try {
      // Get SEA from Gun instance or global
      let sea = (this.core._gun as any).SEA || null;
      if (!sea) {
        // Try to find SEA in various global locations
        if (
          typeof window !== "undefined" &&
          (window as any).Gun &&
          (window as any).Gun.SEA
        ) {
          sea = (window as any).Gun.SEA;
        } else if ((globalThis as any).Gun && (globalThis as any).Gun.SEA) {
          sea = (globalThis as any).Gun.SEA;
        } else if ((global as any).Gun && (global as any).Gun.SEA) {
          sea = (global as any).Gun.SEA;
        }
      }

      this.core.db = new DataBase(this.core._gun, this.core, sea);
      return true;
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error initializing DataBase:", error);
      }
      throw new Error(`Failed to initialize DataBase: ${error}`);
    }
  }

  /**
   * Initialize Gun user
   */
  private initializeGunUser(): void {
    try {
      this.core._user = this.core.gun.user().recall({ sessionStorage: true });
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error initializing Gun user:", error);
      }
      throw new Error(`Failed to initialize Gun user: ${error}`);
    }

    this.core.gun.on("auth", (user: any) => {
      this.core._user = this.core.gun.user().recall({ sessionStorage: true });
      this.core.emit("auth:login", {
        userPub: user.pub,
        method: "password" as const,
      });
    });
  }

  /**
   * Setup Gun event forwarding
   */
  private setupGunEventForwarding(): void {
    const gunEvents = ["gun:put", "gun:get", "gun:set", "gun:remove"] as const;
    gunEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName, data);
      });
    });

    const peerEvents = [
      "gun:peer:add",
      "gun:peer:remove",
      "gun:peer:connect",
      "gun:peer:disconnect",
    ] as const;

    peerEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName, data);
      });
    });
  }

  /**
   * Setup wallet derivation
   */
  private setupWalletDerivation(): void {
    this.core.gun.on("auth", async (user: any) => {
      if (!user.is) return;
      const priv = user._?.sea?.epriv;
      const pub = user._?.sea?.epub;
      this.core.wallets = await derive(priv, pub, {
        includeSecp256k1Bitcoin: true,
        includeSecp256k1Ethereum: true,
      });
    });
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
