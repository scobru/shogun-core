/**
 * Simplified configuration options to reduce complexity
 * Provides sensible defaults and easy-to-use presets
 */
import { ShogunCoreConfig } from "../interfaces/shogun";
/**
 * Preset configurations for common use cases
 */
export declare const ShogunPresets: {
    /**
     * Minimal configuration for simple apps
     */
    minimal: () => ShogunCoreConfig;
    /**
     * Development configuration with local storage
     */
    development: () => ShogunCoreConfig;
    /**
     * Production configuration with multiple peers
     */
    production: (customPeers?: string[]) => ShogunCoreConfig;
    /**
     * Offline-first configuration
     */
    offline: () => ShogunCoreConfig;
    /**
     * Web3-enabled configuration
     */
    web3: () => ShogunCoreConfig;
    /**
     * WebAuthn-enabled configuration
     */
    webauthn: () => ShogunCoreConfig;
};
/**
 * Configuration builder for custom setups
 */
export declare class ShogunConfigBuilder {
    private config;
    /**
     * Set Gun options
     */
    gunOptions(options: any): this;
    /**
     * Add peers
     */
    peers(peerList: string[]): this;
    /**
     * Enable WebAuthn
     */
    enableWebAuthn(rpName?: string, rpId?: string): this;
    /**
     * Enable Web3
     */
    enableWeb3(): this;
    /**
     * Enable Nostr
     */
    enableNostr(): this;
    /**
     * Set timeouts
     */
    timeouts(timeouts: {
        login?: number;
        signup?: number;
        operation?: number;
    }): this;
    /**
     * Build the final configuration
     */
    build(): ShogunCoreConfig;
}
/**
 * Helper functions for common configuration patterns
 */
export declare const ConfigHelpers: {
    /**
     * Create a configuration for a specific environment
     */
    forEnvironment(env: "development" | "production" | "test"): ShogunCoreConfig;
    /**
     * Create a configuration with custom peers
     */
    withPeers(peers: string[]): ShogunCoreConfig;
    /**
     * Create a configuration for a specific use case
     */
    forUseCase(useCase: "chat" | "social" | "gaming" | "finance"): ShogunCoreConfig;
};
/**
 * Quick configuration functions
 */
export declare const QuickConfig: {
    /**
     * Minimal setup for quick testing
     */
    test: () => ShogunCoreConfig;
    /**
     * Standard setup for most apps
     */
    standard: () => ShogunCoreConfig;
    /**
     * Setup with WebAuthn for secure apps
     */
    secure: () => ShogunCoreConfig;
    /**
     * Setup with Web3 for crypto apps
     */
    crypto: () => ShogunCoreConfig;
    /**
     * Offline setup for local development
     */
    local: () => ShogunCoreConfig;
};
