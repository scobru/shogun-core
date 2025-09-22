"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreInitializer = void 0;
const storage_1 = require("../storage/storage");
const errorHandler_1 = require("../utils/errorHandler");
const webauthnPlugin_1 = require("../plugins/webauthn/webauthnPlugin");
const web3ConnectorPlugin_1 = require("../plugins/web3/web3ConnectorPlugin");
const nostrConnectorPlugin_1 = require("../plugins/nostr/nostrConnectorPlugin");
const oauthPlugin_1 = require("../plugins/oauth/oauthPlugin");
const gundb_1 = require("../gundb");
/**
 * Handles initialization of ShogunCore components
 */
class CoreInitializer {
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
        this.core.storage = new storage_1.ShogunStorage();
        // Setup error handler
        errorHandler_1.ErrorHandler.addListener((error) => {
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
        this.core.rx = new gundb_1.RxJS(this.core.gun);
        // Register built-in plugins
        this.registerBuiltinPlugins(config);
        // Initialize async components
        await this.initializeAsync();
    }
    /**
     * Initialize Gun instance
     */
    async initializeGun(config) {
        console.log("Initialize Gun instance", config);
        try {
            if (config.gunInstance && config.gunOptions === undefined) {
                console.log("Using provided Gun instance");
                this.core._gun = config.gunInstance;
            }
            else if (config.gunOptions && config.gunInstance === undefined) {
                console.log("Creating new Gun instance");
                this.core._gun = (0, gundb_1.createGun)(config.gunOptions);
            }
            else if (config.gunInstance && config.gunOptions) {
                // Both provided, prefer gunInstance
                console.log("Both gunInstance and gunOptions provided, using gunInstance");
                this.core._gun = config.gunInstance;
            }
            else {
                // Neither provided, create a default Gun instance for testing
                console.log("No Gun instance or options provided, creating default instance");
                this.core._gun = (0, gundb_1.createGun)({ peers: config.gunOptions?.peers || [] });
            }
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error creating Gun instance:", error);
            }
            throw new Error(`Failed to create Gun instance: ${error}`);
        }
        try {
            console.log("Initialize Gun instance", this.core.gun);
            this.core.db = new gundb_1.DataBase(this.core._gun, config.gunOptions?.scope || "");
            // Note: user is a getter that returns _user, so we don't need to assign it
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
            this.core._user = this.core.gun.user().recall({ sessionStorage: true });
        }
        catch (error) {
            if (typeof console !== "undefined" && console.error) {
                console.error("Error initializing Gun user:", error);
            }
            throw new Error(`Failed to initialize Gun user: ${error}`);
        }
        this.core.gun.on("auth", (user) => {
            this.core._user = this.core.gun.user().recall({ sessionStorage: true });
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
        this.core.gun.on("auth", async (user) => {
            if (!user)
                return;
            const priv = user._?.sea?.epriv;
            const pub = user._?.sea?.epub;
            this.core.wallets = await (0, gundb_1.derive)(priv, pub, {
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
                const oauthPlugin = new oauthPlugin_1.OAuthPlugin();
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
                const webauthnPlugin = new webauthnPlugin_1.WebauthnPlugin();
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
                const web3Plugin = new web3ConnectorPlugin_1.Web3ConnectorPlugin();
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
                const nostrPlugin = new nostrConnectorPlugin_1.NostrConnectorPlugin();
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
exports.CoreInitializer = CoreInitializer;
