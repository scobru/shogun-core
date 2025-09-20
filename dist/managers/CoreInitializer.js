import { ShogunStorage } from "../storage/storage";
import { ErrorHandler } from "../utils/errorHandler";
import { WebauthnPlugin } from "../plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "../plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "../plugins/nostr/nostrConnectorPlugin";
import { OAuthPlugin } from "../plugins/oauth/oauthPlugin";
import { restrictedPut, DataBase, RxJS, createGun, Gun, derive, } from "../gundb";
/**
 * Handles initialization of ShogunCore components
 */
export class CoreInitializer {
    core;
    constructor(core) {
        this.core = core;
    }
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    async initialize(config) {
        // Polyfill console for environments where it might be missing
        if (typeof console === "undefined") {
            global.console = {
                log: () => { },
                warn: () => { },
                error: () => { },
                info: () => { },
                debug: () => { },
            };
        }
        // Initialize storage
        this.core.storage = new ShogunStorage();
        // Setup error handler
        ErrorHandler.addListener((error) => {
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
        this.core.rx = new RxJS(this.core._gun);
        // Register built-in plugins
        this.registerBuiltinPlugins(config);
        // Initialize async components
        await this.initializeAsync();
    }
    /**
     * Initialize Gun instance
     */
    async initializeGun(config) {
        if (config.gunOptions.authToken) {
            restrictedPut(Gun, config.gunOptions.authToken);
        }
        try {
            if (config.gunInstance) {
                this.core._gun = config.gunInstance;
            }
            else {
                this.core._gun = createGun(config.gunOptions);
            }
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error creating Gun instance:", error);
            }
            throw new Error(`Failed to create Gun instance: ${error}`);
        }
        try {
            this.core.db = new DataBase(this.core._gun, config.gunOptions.scope || "");
            this.core._gun = this.core.db.gun;
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error initializing GunInstance:", error);
            }
            throw new Error(`Failed to initialize GunInstance: ${error}`);
        }
    }
    /**
     * Initialize Gun user
     */
    async initializeGunUser() {
        try {
            this.core._user = this.core._gun
                .user()
                .recall({ sessionStorage: true });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error initializing Gun user:", error);
            }
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this.core._gun.on("auth", (user) => {
            this.core._user = this.core._gun
                .user()
                .recall({ sessionStorage: true });
            this.core.emit("auth:login", {
                userPub: user.pub,
                method: "password",
            });
        });
    }
    /**
     * Setup Gun event forwarding
     */
    setupGunEventForwarding() {
        const gunEvents = ["gun:put", "gun:get", "gun:set", "gun:remove"];
        gunEvents.forEach((eventName) => {
            this.core.db.on(eventName, (data) => {
                this.core.emit(eventName, data);
            });
        });
        const peerEvents = [
            "gun:peer:add",
            "gun:peer:remove",
            "gun:peer:connect",
            "gun:peer:disconnect",
        ];
        peerEvents.forEach((eventName) => {
            this.core.db.on(eventName, (data) => {
                this.core.emit(eventName, data);
            });
        });
    }
    /**
     * Setup wallet derivation
     */
    setupWalletDerivation() {
        this.core._gun.on("auth", async (user) => {
            if (!user)
                return;
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
    registerBuiltinPlugins(config) {
        try {
            // Register OAuth plugin if configuration is provided
            if (config.oauth) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("OAuth plugin will be registered with provided configuration");
                }
                const oauthPlugin = new OAuthPlugin();
                if (typeof oauthPlugin.configure === "function") {
                    oauthPlugin.configure(config.oauth);
                }
                this.core.pluginManager.register(oauthPlugin);
            }
            // Register WebAuthn plugin if configuration is provided
            if (config.webauthn) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("WebAuthn plugin will be registered with provided configuration");
                }
                const webauthnPlugin = new WebauthnPlugin();
                if (typeof webauthnPlugin.configure === "function") {
                    webauthnPlugin.configure(config.webauthn);
                }
                this.core.pluginManager.register(webauthnPlugin);
            }
            // Register Web3 plugin if configuration is provided
            if (config.web3) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Web3 plugin will be registered with provided configuration");
                }
                const web3Plugin = new Web3ConnectorPlugin();
                if (typeof web3Plugin.configure === "function") {
                    web3Plugin.configure(config.web3);
                }
                this.core.pluginManager.register(web3Plugin);
            }
            // Register Nostr plugin if configuration is provided
            if (config.nostr) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("Nostr plugin will be registered with provided configuration");
                }
                const nostrPlugin = new NostrConnectorPlugin();
                if (typeof nostrPlugin.configure === "function") {
                    nostrPlugin.configure(config.nostr);
                }
                this.core.pluginManager.register(nostrPlugin);
            }
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error registering builtin plugins:", error);
            }
        }
    }
    /**
     * Initialize async components
     */
    async initializeAsync() {
        try {
            await this.core.db.initialize();
            this.core.emit("debug", {
                action: "core_initialized",
                timestamp: Date.now(),
            });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error during Shogun Core initialization:", error);
            }
            throw error;
        }
    }
}
