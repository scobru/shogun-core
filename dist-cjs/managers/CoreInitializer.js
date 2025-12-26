"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreInitializer = void 0;
const storage_1 = require("../storage/storage");
const errorHandler_1 = require("../utils/errorHandler");
const webauthnPlugin_1 = require("../plugins/webauthn/webauthnPlugin");
const web3ConnectorPlugin_1 = require("../plugins/web3/web3ConnectorPlugin");
const nostrConnectorPlugin_1 = require("../plugins/nostr/nostrConnectorPlugin");
const zkProofPlugin_1 = require("../plugins/zkproof/zkProofPlugin");
const db_1 = require("../gundb/db");
const db_holster_1 = require("../gundb/db-holster");
const rxjs_holster_1 = require("../gundb/rxjs-holster");
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
        if (typeof console === 'undefined') {
            global.console = {
                log: () => { },
                warn: () => { },
                error: () => { },
                info: () => { },
                debug: () => { },
            };
        }
        // Initialize storage
        this.core.storage = new storage_1.ShogunStorage(config.silent);
        // Setup error handler
        errorHandler_1.ErrorHandler.addListener((error) => {
            this.core.emit('error', {
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
        // Initialize RxJS (use appropriate implementation based on instance type)
        if (config.holsterInstance) {
            this.core.rx = new rxjs_holster_1.RxJSHolster(this.core.gun);
        }
        else {
            this.core.rx = new db_1.RxJS(this.core.gun);
        }
        // Register built-in plugins
        this.registerBuiltinPlugins(config);
        // Initialize async components
        this.initializeDb();
    }
    /**
     * Initialize Gun or Holster instance
     */
    initializeGun(config) {
        // Check if Holster instance is provided
        if (config.holsterInstance) {
            return this.initializeHolster(config);
        }
        // Otherwise, use Gun instance
        try {
            if (!config.gunInstance) {
                throw new Error('Either gunInstance or holsterInstance is required but neither was provided');
            }
            // Validate Gun instance
            if (typeof config.gunInstance !== 'object') {
                throw new Error(`Gun instance must be an object, received: ${typeof config.gunInstance}`);
            }
            if (typeof config.gunInstance.user !== 'function') {
                throw new Error(`Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof config.gunInstance.user}`);
            }
            if (typeof config.gunInstance.get !== 'function') {
                throw new Error(`Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof config.gunInstance.get}`);
            }
            if (typeof config.gunInstance.on !== 'function') {
                throw new Error(`Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof config.gunInstance.on}`);
            }
            console.log('Using provided Gun instance:', config.gunInstance);
            this.core._gun = config.gunInstance;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error validating Gun instance:', error);
            }
            throw new Error(`Failed to validate Gun instance: ${error}`);
        }
        try {
            // Get SEA from Gun instance or global
            let sea = this.core._gun.SEA || null;
            if (!sea) {
                // Try to find SEA in various global locations
                if (typeof window !== 'undefined' &&
                    window.Gun &&
                    window.Gun.SEA) {
                    sea = window.Gun.SEA;
                }
                else if (globalThis.Gun && globalThis.Gun.SEA) {
                    sea = globalThis.Gun.SEA;
                }
                else if (global.Gun && global.Gun.SEA) {
                    sea = global.Gun.SEA;
                }
            }
            this.core.db = new db_1.DataBase(this.core._gun, this.core, sea);
            return true;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error initializing DataBase:', error);
            }
            throw new Error(`Failed to initialize DataBase: ${error}`);
        }
    }
    /**
     * Initialize Holster instance
     */
    initializeHolster(config) {
        try {
            if (!config.holsterInstance) {
                throw new Error('Holster instance is required but was not provided');
            }
            // Validate Holster instance
            if (typeof config.holsterInstance !== 'object') {
                throw new Error(`Holster instance must be an object, received: ${typeof config.holsterInstance}`);
            }
            if (typeof config.holsterInstance.user !== 'function') {
                throw new Error(`Holster instance is invalid: holster.user is not a function. Received holster.user type: ${typeof config.holsterInstance.user}`);
            }
            if (typeof config.holsterInstance.get !== 'function') {
                throw new Error(`Holster instance is invalid: holster.get is not a function. Received holster.get type: ${typeof config.holsterInstance.get}`);
            }
            console.log('Using provided Holster instance:', config.holsterInstance);
            // Store holster instance in _gun for compatibility
            this.core._gun = config.holsterInstance;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error validating Holster instance:', error);
            }
            throw new Error(`Failed to validate Holster instance: ${error}`);
        }
        try {
            // Get SEA from Holster instance or global
            let sea = this.core._gun.SEA || null;
            if (!sea) {
                // Try to find SEA in various global locations
                if (typeof window !== 'undefined' &&
                    window.Holster &&
                    window.Holster.SEA) {
                    sea = window.Holster.SEA;
                }
                else if (globalThis.Holster &&
                    globalThis.Holster.SEA) {
                    sea = globalThis.Holster.SEA;
                }
                else if (global.Holster && global.Holster.SEA) {
                    sea = global.Holster.SEA;
                }
                else if (globalThis.SEA) {
                    sea = globalThis.SEA;
                }
            }
            this.core.db = new db_holster_1.DataBaseHolster(this.core._gun, this.core, sea);
            return true;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error initializing DataBaseHolster:', error);
            }
            throw new Error(`Failed to initialize DataBaseHolster: ${error}`);
        }
    }
    /**
     * Check if we're using Holster instead of Gun
     * Holster has a 'next' method that Gun doesn't have
     */
    isHolster() {
        // Check if gun has 'next' method (Holster-specific)
        if (typeof this.core.gun.next === 'function') {
            return true;
        }
        // Check if db is DataBaseHolster instance
        if (this.core.db && this.core.db.constructor.name === 'DataBaseHolster') {
            return true;
        }
        return false;
    }
    /**
     * Initialize Gun/Holster user
     */
    initializeGunUser() {
        try {
            const userInstance = this.core.gun.user();
            // Holster's recall() doesn't take options, Gun's does
            if (typeof userInstance.recall === 'function') {
                if (userInstance.recall.length > 0) {
                    // Gun API: recall takes options
                    this.core._user = userInstance.recall({ sessionStorage: true });
                }
                else {
                    // Holster API: recall takes no arguments
                    userInstance.recall();
                    this.core._user = userInstance.is ? userInstance : null;
                }
            }
            else {
                this.core._user = userInstance;
            }
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error initializing user:', error);
            }
            throw new Error(`Failed to initialize user: ${error}`);
        }
        // Setup auth event listener
        // Gun has native "auth" events, but Holster doesn't support global events
        // Holster uses polling in DataBaseHolster.subscribeToAuthEvents() instead
        if (this.isHolster()) {
            // Holster doesn't support global "auth" events
            // Auth events are handled via polling in DataBaseHolster
            // The DataBaseHolster will emit auth events via its onAuth callbacks
            if (typeof console !== 'undefined' && console.log) {
                console.log('[CoreInitializer] Using Holster - auth events handled via DataBaseHolster polling');
            }
        }
        else if (typeof this.core.gun.on === 'function') {
            // Gun has native "auth" events
            try {
                this.core.gun.on('auth', (user) => {
                    const userInstance = this.core.gun.user();
                    if (typeof userInstance.recall === 'function') {
                        if (userInstance.recall.length > 0) {
                            this.core._user = userInstance.recall({ sessionStorage: true });
                        }
                        else {
                            userInstance.recall();
                            this.core._user = userInstance.is ? userInstance : null;
                        }
                    }
                    else {
                        this.core._user = userInstance;
                    }
                    this.core.emit('auth:login', {
                        userPub: user.pub || user.is?.pub,
                        method: 'password',
                    });
                });
            }
            catch (error) {
                // If gun.on("auth") fails, it might be because we're using Holster
                // but the detection didn't work. Log and continue.
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[CoreInitializer] Failed to register auth event listener:', error);
                }
            }
        }
    }
    /**
     * Setup Gun event forwarding
     */
    setupGunEventForwarding() {
        const gunEvents = ['gun:put', 'gun:get', 'gun:set', 'gun:remove'];
        gunEvents.forEach((eventName) => {
            this.core.db.on(eventName, (data) => {
                this.core.emit(eventName, data);
            });
        });
        const peerEvents = [
            'gun:peer:add',
            'gun:peer:remove',
            'gun:peer:connect',
            'gun:peer:disconnect',
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
        if (this.isHolster()) {
            // For Holster, wallet derivation is handled via onAuth callbacks in DataBaseHolster
            if (this.core.db && typeof this.core.db.onAuth === 'function') {
                this.core.db.onAuth(async (user) => {
                    if (!user.is)
                        return;
                    const priv = user.is?.epriv;
                    const pub = user.is?.epub;
                    if (priv && pub) {
                        this.core.wallets = await (0, db_1.derive)(priv, pub, {
                            includeSecp256k1Bitcoin: true,
                            includeSecp256k1Ethereum: true,
                        });
                    }
                });
            }
        }
        else if (typeof this.core.gun.on === 'function') {
            // Gun has native "auth" events
            try {
                this.core.gun.on('auth', async (user) => {
                    if (!user.is)
                        return;
                    const priv = user._?.sea?.epriv || user.is?.epriv;
                    const pub = user._?.sea?.epub || user.is?.epub;
                    if (priv && pub) {
                        this.core.wallets = await (0, db_1.derive)(priv, pub, {
                            includeSecp256k1Bitcoin: true,
                            includeSecp256k1Ethereum: true,
                        });
                    }
                });
            }
            catch (error) {
                // If gun.on("auth") fails, log and continue
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[CoreInitializer] Failed to register wallet derivation listener:', error);
                }
            }
        }
    }
    /**
     * Register built-in plugins based on configuration
     */
    registerBuiltinPlugins(config) {
        try {
            // Register WebAuthn plugin if configuration is provided
            if (config.webauthn) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('WebAuthn plugin will be registered with provided configuration');
                }
                const webauthnPlugin = new webauthnPlugin_1.WebauthnPlugin();
                if (typeof webauthnPlugin.configure === 'function') {
                    webauthnPlugin.configure(config.webauthn);
                }
                this.core.pluginManager.register(webauthnPlugin);
            }
            // Register Web3 plugin if configuration is provided
            if (config.web3) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Web3 plugin will be registered with provided configuration');
                }
                const web3Plugin = new web3ConnectorPlugin_1.Web3ConnectorPlugin();
                if (typeof web3Plugin.configure === 'function') {
                    web3Plugin.configure(config.web3);
                }
                this.core.pluginManager.register(web3Plugin);
            }
            // Register Nostr plugin if configuration is provided
            if (config.nostr) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Nostr plugin will be registered with provided configuration');
                }
                const nostrPlugin = new nostrConnectorPlugin_1.NostrConnectorPlugin();
                if (typeof nostrPlugin.configure === 'function') {
                    nostrPlugin.configure(config.nostr);
                }
                this.core.pluginManager.register(nostrPlugin);
            }
            // Register ZK-Proof plugin if configuration is provided
            if (config.zkproof) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('ZK-Proof plugin will be registered with provided configuration');
                }
                const zkproofPlugin = new zkProofPlugin_1.ZkProofPlugin(config.zkproof);
                this.core.pluginManager.register(zkproofPlugin);
            }
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error registering builtin plugins:', error);
            }
        }
    }
    /**
     * Initialize async components
     */
    initializeDb() {
        try {
            this.core.db.initialize();
            this.core.emit('debug', {
                action: 'core_initialized',
                timestamp: Date.now(),
            });
            return true;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error during Shogun Core initialization:', error);
            }
            return false;
        }
    }
}
exports.CoreInitializer = CoreInitializer;
