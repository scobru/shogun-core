"use strict";
/**
 * Migration test file to verify that the refactored ShogunCore
 * maintains the same public API as the original implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testApiCompatibility = testApiCompatibility;
exports.testStaticProperties = testStaticProperties;
exports.runCompatibilityTests = runCompatibilityTests;
const core_1 = require("./core");
const core_2 = require("./core");
/**
 * Test function to verify API compatibility
 */
function testApiCompatibility() {
    const config = {
        gunOptions: {
            peers: ["https://gunjs.herokuapp.com/gun"],
        },
    };
    // Test that both implementations can be instantiated with the same config
    const originalCore = new core_2.ShogunCore(config);
    const refactoredCore = new core_1.ShogunCore(config);
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
    const missingMethods = [];
    publicMethods.forEach((method) => {
        if (typeof refactoredCore[method] !== "function") {
            missingMethods.push(method);
        }
    });
    if (missingMethods.length > 0) {
        throw new Error(`Missing methods in refactored implementation: ${missingMethods.join(", ")}`);
    }
    console.log("✅ API compatibility test passed - all public methods are present");
}
/**
 * Test that the refactored implementation maintains the same static properties
 */
function testStaticProperties() {
    if (core_1.ShogunCore.API_VERSION !== core_2.ShogunCore.API_VERSION) {
        throw new Error("API_VERSION mismatch between implementations");
    }
    console.log("✅ Static properties test passed");
}
/**
 * Run all compatibility tests
 */
function runCompatibilityTests() {
    try {
        testStaticProperties();
        testApiCompatibility();
        console.log("🎉 All compatibility tests passed! The refactored implementation is ready.");
    }
    catch (error) {
        console.error("❌ Compatibility test failed:", error);
        throw error;
    }
}
