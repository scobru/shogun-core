/**
 * Entry point for the browser version of Shogun Core
 */
import { ShogunCore } from "./index";
import { ShogunSDKConfig } from "./types/shogun";

/**
 * Function to initialize Shogun in a browser environment
 *
 * @param config - Configuration for the Shogun SDK
 * @returns A new instance of ShogunCore
 */
export function initShogunBrowser(config: ShogunSDKConfig): ShogunCore {
  // Apply default browser settings
  const browserConfig: ShogunSDKConfig = {
    ...config,
    // Make sure browser default settings are applied
    localStorage: config.localStorage ?? true,
    radisk: config.radisk ?? true,
    // WebAuthn specific settings (if not specified)
    webauthn: {
      ...config.webauthn,
      rpId: config.webauthn?.rpId || window.location.hostname,
      enabled: config.webauthn?.enabled ?? true,
    },
  };

  // Create a new ShogunCore instance with browser-optimized configuration
  return new ShogunCore(browserConfig);
}

// Export main class for those who prefer to use it directly
export { ShogunCore };

// Export main types as well
export * from "./types/shogun";

// Support use as a global variable when included via <script>
if (typeof window !== "undefined") {
  (window as any).ShogunCore = ShogunCore;
  (window as any).initShogunBrowser = initShogunBrowser;
}
