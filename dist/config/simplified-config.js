/**
 * Simplified configuration options to reduce complexity
 * Provides sensible defaults and easy-to-use presets
 */
/**
 * Preset configurations for common use cases
 */
export const ShogunPresets = {
    /**
     * Minimal configuration for simple apps
     */
    minimal: () => ({
        gunOptions: {
            peers: ["https://relay.shogun-eco.xyz/gun"],
            localStorage: true,
        },
    }),
    /**
     * Development configuration with local storage
     */
    development: () => ({
        gunOptions: {
            peers: ["https://relay.shogun-eco.xyz/gun"],
            localStorage: true,
            radisk: false,
        },
        timeouts: {
            login: 5000,
            signup: 5000,
            operation: 3000,
        },
    }),
    /**
     * Production configuration with multiple peers
     */
    production: (customPeers) => ({
        gunOptions: {
            peers: customPeers || [
                "https://relay.shogun-eco.xyz/gun",
                "https://peer.wallie.io/gun",
            ],
            localStorage: true,
            radisk: true,
        },
        timeouts: {
            login: 10000,
            signup: 10000,
            operation: 5000,
        },
    }),
    /**
     * Offline-first configuration
     */
    offline: () => ({
        gunOptions: {
            peers: [],
            localStorage: true,
            radisk: true,
        },
    }),
    /**
     * Web3-enabled configuration
     */
    web3: () => ({
        gunOptions: {
            peers: ["https://relay.shogun-eco.xyz/gun"],
            localStorage: true,
        },
        web3: {
            enabled: true,
        },
    }),
    /**
     * WebAuthn-enabled configuration
     */
    webauthn: () => ({
        gunOptions: {
            peers: ["https://relay.shogun-eco.xyz/gun"],
            localStorage: true,
        },
        webauthn: {
            enabled: true,
            rpName: "My Shogun App",
            rpId: window.location.hostname,
        },
    }),
};
/**
 * Configuration builder for custom setups
 */
export class ShogunConfigBuilder {
    config = {};
    /**
     * Set Gun options
     */
    gunOptions(options) {
        this.config.gunOptions = { ...this.config.gunOptions, ...options };
        return this;
    }
    /**
     * Add peers
     */
    peers(peerList) {
        this.config.gunOptions = {
            ...this.config.gunOptions,
            peers: [...(this.config.gunOptions?.peers || []), ...peerList],
        };
        return this;
    }
    /**
     * Enable WebAuthn
     */
    enableWebAuthn(rpName, rpId) {
        this.config.webauthn = {
            enabled: true,
            rpName: rpName || "My App",
            rpId: rpId || window.location.hostname,
        };
        return this;
    }
    /**
     * Enable Web3
     */
    enableWeb3() {
        this.config.web3 = { enabled: true };
        return this;
    }
    /**
     * Enable Nostr
     */
    enableNostr() {
        this.config.nostr = { enabled: true };
        return this;
    }
    /**
     * Set timeouts
     */
    timeouts(timeouts) {
        this.config.timeouts = { ...this.config.timeouts, ...timeouts };
        return this;
    }
    /**
     * Build the final configuration
     */
    build() {
        return this.config;
    }
}
/**
 * Helper functions for common configuration patterns
 */
export const ConfigHelpers = {
    /**
     * Create a configuration for a specific environment
     */
    forEnvironment(env) {
        switch (env) {
            case "development":
                return ShogunPresets.development();
            case "production":
                return ShogunPresets.production();
            case "test":
                return ShogunPresets.offline();
            default:
                return ShogunPresets.minimal();
        }
    },
    /**
     * Create a configuration with custom peers
     */
    withPeers(peers) {
        return ShogunPresets.production(peers);
    },
    /**
     * Create a configuration for a specific use case
     */
    forUseCase(useCase) {
        const baseConfig = ShogunPresets.production();
        switch (useCase) {
            case "chat":
                return {
                    ...baseConfig,
                    timeouts: { ...baseConfig.timeouts, operation: 2000 },
                };
            case "social":
                return {
                    ...baseConfig,
                    webauthn: { enabled: true, rpName: "Social App" },
                };
            case "gaming":
                return {
                    ...baseConfig,
                    timeouts: { ...baseConfig.timeouts, operation: 1000 },
                };
            case "finance":
                return {
                    ...baseConfig,
                    webauthn: { enabled: true, rpName: "Finance App" },
                    timeouts: { ...baseConfig.timeouts, login: 15000 },
                };
            default:
                return baseConfig;
        }
    },
};
/**
 * Quick configuration functions
 */
export const QuickConfig = {
    /**
     * Minimal setup for quick testing
     */
    test: () => ShogunPresets.minimal(),
    /**
     * Standard setup for most apps
     */
    standard: () => ShogunPresets.production(),
    /**
     * Setup with WebAuthn for secure apps
     */
    secure: () => ShogunPresets.webauthn(),
    /**
     * Setup with Web3 for crypto apps
     */
    crypto: () => ShogunPresets.web3(),
    /**
     * Offline setup for local development
     */
    local: () => ShogunPresets.offline(),
};
