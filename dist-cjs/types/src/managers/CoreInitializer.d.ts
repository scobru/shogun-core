import { IShogunCore, ShogunCoreConfig } from "../interfaces/shogun";
/**
 * Handles initialization of ShogunCore components
 */
export declare class CoreInitializer {
    private core;
    constructor(core: IShogunCore);
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    initialize(config: ShogunCoreConfig): Promise<void>;
    /**
     * Initialize Gun or Holster instance
     */
    private initializeGun;
    /**
     * Initialize Holster instance
     */
    private initializeHolster;
    /**
     * Initialize Gun/Holster user
     */
    private initializeGunUser;
    /**
     * Setup Gun event forwarding
     */
    private setupGunEventForwarding;
    /**
     * Setup wallet derivation
     */
    private setupWalletDerivation;
    /**
     * Register built-in plugins based on configuration
     */
    private registerBuiltinPlugins;
    /**
     * Initialize async components
     */
    private initializeDb;
}
