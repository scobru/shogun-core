/**
 * Entry point for the browser version of Shogun Core
 */
import { ShogunCore } from "./index";
import { ShogunSDKConfig, CorePlugins } from "./types/shogun";
import { log } from "./utils/logger";

// Lazy loading dei moduli pesanti
const loadWebAuthnModule = () => import("./plugins/webauthn/webauthn");
const loadStealthModule = () => import("./plugins/stealth/stealth");
const loadDIDModule = () => import("./plugins/did/DID");
const loadWalletModule = () => import("./plugins/wallet/walletPlugin");
const loadMetaMaskModule = () => import("./plugins/metamask/metamaskPlugin");
let shogunCoreInstance;

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

  // Assicuriamoci che la configurazione di GunDB esista
  browserConfig.gundb ??= {};

  // Warn users who don't provide custom peers or providerUrl
  if (!config.gundb?.peers) {
    log(
      "WARNING: Using default GunDB peers. For production, always configure custom peers."
    );
  }

  if (!config.providerUrl) {
    log(
      "WARNING: No Ethereum provider URL specified. Using default public endpoint with rate limits."
    );
  }

  // Create a new ShogunCore instance with browser-optimized configuration
  shogunCoreInstance = new ShogunCore(browserConfig);

  if (shogunCoreInstance.hasPlugin(CorePlugins.DID)) {
    log("DID plugin initialized", { category: "init", level: "info" });
  }

  // Log the plugin status
  if (shogunCoreInstance.hasPlugin(CorePlugins.WebAuthn)) {
    log("WebAuthn plugin initialized", { category: "init", level: "info" });
  }

  if (shogunCoreInstance.hasPlugin(CorePlugins.MetaMask)) {
    log("MetaMask plugin initialized", { category: "init", level: "info" });
  }

  if (shogunCoreInstance.hasPlugin(CorePlugins.WalletManager)) {
    log("Wallet plugin initialized", { category: "init", level: "info" });
  }


  return shogunCoreInstance;
}

// Esportazione lazy loading helpers
export const modules = {
  loadWebAuthn: loadWebAuthnModule,
  loadStealth: loadStealthModule,
  loadDID: loadDIDModule,
  loadWallet: loadWalletModule,
  loadMetaMask: loadMetaMaskModule,
};

// Export main class for those who prefer to use it directly
export { ShogunCore };

// Export main types as well
export * from "./types/shogun";

// Support use as a global variable when included via <script>
if (typeof window !== "undefined") {
  (window as any).ShogunCore = shogunCoreInstance;
  (window as any).initShogunBrowser = initShogunBrowser;
  (window as any).ShogunModules = modules;
  (window as any).shogun = shogunCoreInstance;
}
