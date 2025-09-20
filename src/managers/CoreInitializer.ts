import { IShogunCore, ShogunCoreConfig } from "../interfaces/shogun";
import { ShogunStorage } from "../storage/storage";
import { ErrorHandler, ShogunError } from "../utils/errorHandler";
import { WebauthnPlugin } from "../plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../plugins/nostr/nostrConnectorPlugin";
import { OAuthPlugin } from "../plugins/oauth/oauthPlugin";
import { DataBase, RxJS, createGun, derive } from "../gundb";

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
    this.core.storage = new ShogunStorage();

    // Setup error handler
    ErrorHandler.addListener((error: ShogunError) => {
      this.core.emit("error", {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    // Setup Gun instance
    await this.initializeGun(config);

    // Setup Gun user
    await this.initializeGunUser();

    // Setup Gun event forwarding
    this.setupGunEventForwarding();

    // Setup wallet derivation
    this.setupWalletDerivation();

    // Initialize RxJS
    this.core.rx = new RxJS(this.core.gun);

    // Register built-in plugins
    this.registerBuiltinPlugins(config);

    // Initialize async components
    await this.initializeAsync();
  }

  /**
   * Initialize Gun instance
   */
  private async initializeGun(config: ShogunCoreConfig): Promise<void> {
    console.log("Initialize Gun instance", config);

    try {
      if (config.gunInstance && config.gunOptions === undefined) {
        console.log("Using provided Gun instance");
        this.core._gun = config.gunInstance;
      } else if (config.gunOptions && config.gunInstance === undefined) {
        console.log("Creating new Gun instance");
        this.core._gun = createGun(config.gunOptions);
      } else {
        throw new Error("!!! NO GUN INSTANCE OR GUN OPTIONS PROVIDED !!!");
      }
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error creating Gun instance:", error);
      }
      throw new Error(`Failed to create Gun instance: ${error}`);
    }

    try {
      console.log("Initialize Gun instance", this.core.gun);

      this.core.db = new DataBase(
        this.core._gun,
        config.gunOptions?.scope || "",
      );
      // Note: user is a getter that returns _user, so we don't need to assign it
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error initializing GunInstance:", error);
      }
      throw new Error(`Failed to initialize GunInstance: ${error}`);
    }
  }

  /**
   * Initialize Gun user
   */
  private async initializeGunUser(): Promise<void> {
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
      if (!user) return;
      const priv = (user as any)._?.sea?.epriv;
      const pub = (user as any)._?.sea?.epub;
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
      // Register OAuth plugin if configuration is provided
      if (config.oauth) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "OAuth plugin will be registered with provided configuration",
          );
        }

        const oauthPlugin = new OAuthPlugin();
        if (typeof (oauthPlugin as any).configure === "function") {
          (oauthPlugin as any).configure(config.oauth);
        }
        this.core.pluginManager.register(oauthPlugin);
      }

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
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error registering builtin plugins:", error);
      }
    }
  }

  /**
   * Initialize async components
   */
  private async initializeAsync(): Promise<void> {
    try {
      await this.core.db.initialize();

      this.core.emit("debug", {
        action: "core_initialized",
        timestamp: Date.now(),
      });
    } catch (error) {
      if (typeof console !== "undefined" && console.error) {
        console.error("Error during Shogun Core initialization:", error);
      }
      throw error;
    }
  }
}
