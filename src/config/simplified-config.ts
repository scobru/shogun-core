/**
 * Simplified configuration options to reduce complexity
 * Provides sensible defaults and easy-to-use presets
 *
 * NOTE: This file is deprecated. ShogunCore now requires an existing Gun instance.
 * Use the examples in the examples/ directory for proper usage.
 */

import { ShogunCoreConfig } from "../interfaces/shogun";
import Gun from "gun/gun";
import "gun/lib/then";
import "gun/lib/radix";
import "gun/lib/radisk";
import "gun/lib/store";
import "gun/lib/rindexed";
import "gun/lib/webrtc";

/**
 * Helper functions to create Gun instances with common configurations
 * These functions create Gun instances that can be passed to ShogunCore
 */
export const GunInstanceHelpers = {
  /**
   * Create a minimal Gun instance for simple apps
   */
  minimal: () =>
    Gun({
      peers: ["https://shogunnode.scobrudot.dev/gun"],
      localStorage: true,
    }),

  /**
   * Create a development Gun instance with local storage
   */
  development: () =>
    Gun({
      peers: ["https://shogunnode.scobrudot.dev/gun"],
      localStorage: true,
      radisk: false,
    }),

  /**
   * Create a production Gun instance with multiple peers
   */
  production: (customPeers?: string[]) =>
    Gun({
      peers: customPeers || [
        "https://shogunnode.scobrudot.dev/gun",
        "https://peer.wallie.io/gun",
      ],
      localStorage: true,
      radisk: true,
    }),

  /**
   * Create an offline-first Gun instance
   */
  offline: () =>
    Gun({
      peers: [],
      localStorage: true,
      radisk: true,
    }),

  /**
   * Create a Gun instance for Web3-enabled apps
   */
  web3: () =>
    Gun({
      peers: ["https://shogunnode.scobrudot.dev/gun"],
      localStorage: true,
    }),

  /**
   * Create a Gun instance for WebAuthn-enabled apps
   */
  webauthn: () =>
    Gun({
      peers: ["https://shogunnode.scobrudot.dev/gun"],
      localStorage: true,
    }),
};

/**
 * Preset configurations for common use cases
 * @deprecated Use GunInstanceHelpers to create Gun instances and pass them to ShogunCore
 */
export const ShogunPresets = {
  /**
   * Minimal configuration for simple apps
   * @deprecated Use GunInstanceHelpers.minimal() instead
   */
  minimal: (): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.minimal(),
  }),

  /**
   * Development configuration with local storage
   * @deprecated Use GunInstanceHelpers.development() instead
   */
  development: (): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.development(),
    timeouts: {
      login: 5000,
      signup: 5000,
      operation: 3000,
    },
  }),

  /**
   * Production configuration with multiple peers
   * @deprecated Use GunInstanceHelpers.production() instead
   */
  production: (customPeers?: string[]): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.production(customPeers),
    timeouts: {
      login: 10000,
      signup: 10000,
      operation: 5000,
    },
  }),

  /**
   * Offline-first configuration
   * @deprecated Use GunInstanceHelpers.offline() instead
   */
  offline: (): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.offline(),
  }),

  /**
   * Web3-enabled configuration
   * @deprecated Use GunInstanceHelpers.web3() instead
   */
  web3: (): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.web3(),
    web3: {
      enabled: true,
    },
  }),

  /**
   * WebAuthn-enabled configuration
   * @deprecated Use GunInstanceHelpers.webauthn() instead
   */
  webauthn: (): ShogunCoreConfig => ({
    gunInstance: GunInstanceHelpers.webauthn(),
    webauthn: {
      enabled: true,
      rpName: "My Shogun App",
      rpId:
        typeof window !== "undefined" ? window.location.hostname : "localhost",
    },
  }),
};

/**
 * Configuration builder for custom setups
 * @deprecated Use GunInstanceHelpers to create Gun instances and pass them to ShogunCore
 */
export class ShogunConfigBuilder {
  private config: Partial<ShogunCoreConfig> = {};
  private gunOptions: any = {};

  /**
   * Set Gun options (deprecated - use GunInstanceHelpers instead)
   * @deprecated Use GunInstanceHelpers to create Gun instances
   */
  setGunOptions(options: any): this {
    this.gunOptions = { ...this.gunOptions, ...options };
    return this;
  }

  /**
   * Add peers (deprecated - use GunInstanceHelpers instead)
   * @deprecated Use GunInstanceHelpers to create Gun instances
   */
  peers(peerList: string[]): this {
    this.gunOptions = {
      ...this.gunOptions,
      peers: [...(this.gunOptions?.peers || []), ...peerList],
    };
    return this;
  }

  /**
   * Enable WebAuthn
   */
  enableWebAuthn(rpName?: string, rpId?: string): this {
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
  enableWeb3(): this {
    this.config.web3 = { enabled: true };
    return this;
  }

  /**
   * Enable Nostr
   */
  enableNostr(): this {
    this.config.nostr = { enabled: true };
    return this;
  }

  /**
   * Set timeouts
   */
  timeouts(timeouts: {
    login?: number;
    signup?: number;
    operation?: number;
  }): this {
    this.config.timeouts = { ...this.config.timeouts, ...timeouts };
    return this;
  }

  /**
   * Build the final configuration
   * @deprecated Use GunInstanceHelpers to create Gun instances and pass them to ShogunCore
   */
  build(): ShogunCoreConfig {
    return {
      ...this.config,
      gunInstance: Gun(this.gunOptions),
    } as ShogunCoreConfig;
  }
}

/**
 * Helper functions for common configuration patterns
 * @deprecated Use GunInstanceHelpers to create Gun instances and pass them to ShogunCore
 */
export const ConfigHelpers = {
  /**
   * Create a configuration for a specific environment
   * @deprecated Use GunInstanceHelpers instead
   */
  forEnvironment(env: "development" | "production" | "test"): ShogunCoreConfig {
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
   * @deprecated Use GunInstanceHelpers.production(peers) instead
   */
  withPeers(peers: string[]): ShogunCoreConfig {
    return ShogunPresets.production(peers);
  },

  /**
   * Create a configuration for a specific use case
   * @deprecated Use GunInstanceHelpers instead
   */
  forUseCase(
    useCase: "chat" | "social" | "gaming" | "finance",
  ): ShogunCoreConfig {
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
 * @deprecated Use GunInstanceHelpers to create Gun instances and pass them to ShogunCore
 */
export const QuickConfig = {
  /**
   * Minimal setup for quick testing
   * @deprecated Use GunInstanceHelpers.minimal() instead
   */
  test: () => ShogunPresets.minimal(),

  /**
   * Standard setup for most apps
   * @deprecated Use GunInstanceHelpers.production() instead
   */
  standard: () => ShogunPresets.production(),

  /**
   * Setup with WebAuthn for secure apps
   * @deprecated Use GunInstanceHelpers.webauthn() instead
   */
  secure: () => ShogunPresets.webauthn(),

  /**
   * Setup with Web3 for crypto apps
   * @deprecated Use GunInstanceHelpers.web3() instead
   */
  crypto: () => ShogunPresets.web3(),

  /**
   * Offline setup for local development
   * @deprecated Use GunInstanceHelpers.offline() instead
   */
  local: () => ShogunPresets.offline(),
};
