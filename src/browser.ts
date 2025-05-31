/**
 * Entry point for the browser version of Shogun Core
 */
import { IGunInstance } from "gun";
import { ShogunCore } from "./index";
import { ShogunSDKConfig } from "./types/shogun";

// Lazy loading modules - organized by functionality
const lazyModules = {
  // Authentication modules
  webauthn: {
    webauthn: () => import("./plugins/webauthn/webauthn"),
  },
  // Web3 connection modules
  ethereum: {
    web3Connector: () => import("./plugins/ethereum/web3ConnectorPlugin"),
  },
  bitcoin: {
    nostrConnector: () => import("./plugins/bitcoin/nostrConnectorPlugin"),
  },
};

// Instance tracking
let shogunCoreInstance: ShogunCore | null = null;
let shogunG: IGunInstance | null = null;

/**
 * Function to initialize Shogun in a browser environment
 *
 * @param config - Configuration for the Shogun SDK
 * @returns A new instance of ShogunCore
 *
 * @important For production use:
 * - Always set custom GunDB peers via config.gundb.peers or config.peers
 * - Always set a valid Ethereum RPC provider URL via config.providerUrl
 * - Default values are provided only for development and testing
 */
export function initShogunBrowser(config: ShogunSDKConfig): ShogunCore {
  // Apply default browser settings
  const browserConfig: ShogunSDKConfig = {
    ...config,
  };

  // Create a new ShogunCore instance with browser-optimized configuration
  shogunCoreInstance = new ShogunCore(browserConfig) as ShogunCore;
  shogunG = shogunCoreInstance?.gun;

  // Support use as a global variable when included via <script>
  if (typeof window !== "undefined") {
    (window as any).shogun = shogunCoreInstance;
    (window as any).shogunGun = shogunG;
  }

  return shogunCoreInstance;
}

// Export lazy loading modules in a more organized structure
export const modules = {
  webauthn: {
    loadWebAuthn: lazyModules.webauthn.webauthn,
  },
  ethereum: {
    loadMetaMask: lazyModules.ethereum.web3Connector,
  },
  bitcoin: {
    loadNostrConnector: lazyModules.bitcoin.nostrConnector,
  },
};

// Export main class for direct usage
export { ShogunCore };

// Export types and interfaces
export * from "./types/shogun";

// Make initialization function available globally when in browser
if (typeof window !== "undefined") {
  (window as any).initShogunBrowser = initShogunBrowser;
}
