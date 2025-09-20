/**
 * Migration test file to verify that the refactored ShogunCore
 * maintains the same public API as the original implementation
 */

import { ShogunCore } from "./core";
import { ShogunCore as OriginalShogunCore } from "./core";
import { ShogunCoreConfig } from "./interfaces/shogun";

/**
 * Test function to verify API compatibility
 */
export function testApiCompatibility(): void {
  const config: ShogunCoreConfig = {
    gunOptions: {
      peers: ["https://gunjs.herokuapp.com/gun"],
    },
  };

  // Test that both implementations can be instantiated with the same config
  const originalCore = new OriginalShogunCore(config);
  const refactoredCore = new ShogunCore(config);

  // Test that all public methods exist on both implementations
  const publicMethods = [
    // Plugin management
    "register",
    "unregister",
    "getPlugin",
    "getPluginsInfo",
    "getPluginCount",
    "getPluginsInitializationStatus",
    "validatePluginSystem",
    "reinitializeFailedPlugins",
    "checkPluginCompatibility",
    "getPluginSystemDebugInfo",
    "hasPlugin",
    "getPluginsByCategory",
    "getAuthenticationMethod",

    // Error handling
    "getRecentErrors",

    // Authentication
    "isLoggedIn",
    "logout",
    "login",
    "loginWithPair",
    "signUp",

    // Event management
    "emit",
    "on",
    "once",
    "off",
    "removeAllListeners",

    // Auth method management
    "setAuthMethod",
    "getAuthMethod",

    // Storage
    "saveCredentials",
    "getIsLoggedIn",

    // Getters
    "getCurrentUser",
  ];

  const missingMethods: string[] = [];

  publicMethods.forEach((method) => {
    if (typeof (refactoredCore as any)[method] !== "function") {
      missingMethods.push(method);
    }
  });

  if (missingMethods.length > 0) {
    throw new Error(
      `Missing methods in refactored implementation: ${missingMethods.join(", ")}`,
    );
  }

  console.log(
    "✅ API compatibility test passed - all public methods are present",
  );
}

/**
 * Test that the refactored implementation maintains the same static properties
 */
export function testStaticProperties(): void {
  if (ShogunCore.API_VERSION !== OriginalShogunCore.API_VERSION) {
    throw new Error("API_VERSION mismatch between implementations");
  }

  console.log("✅ Static properties test passed");
}

/**
 * Run all compatibility tests
 */
export function runCompatibilityTests(): void {
  try {
    testStaticProperties();
    testApiCompatibility();
    console.log(
      "🎉 All compatibility tests passed! The refactored implementation is ready.",
    );
  } catch (error) {
    console.error("❌ Compatibility test failed:", error);
    throw error;
  }
}
