"use strict";
/**
 * ShogunCore Example with Existing Gun Instance
 *
 * This example shows how to use ShogunCore with an existing Gun instance.
 * ShogunCore now requires an existing Gun instance to be passed in.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shogunCoreExample = shogunCoreExample;
const index_1 = require("../index");
const core_1 = require("../core");
async function shogunCoreExample() {
    console.log("🚀 ShogunCore Example with Existing Gun Instance\n");
    // === STEP 1: CREATE GUN INSTANCE ===
    console.log("📦 === CREATING GUN INSTANCE ===\n");
    const peers = [
        "https://g3ru5bwxmezpuu3ktnoclbpiw4.srv.us/gun",
        "https://5eh4twk2f62autunsje4panime.srv.us/gun",
    ];
    console.log(`Using peers: ${peers.join(", ")}`);
    console.log("ℹ️ Note: If peers are unreachable, operations may timeout.");
    console.log("   Consider using localStorage: true for offline testing.\n");
    const gunInstance = (0, index_1.Gun)({
        peers,
        radisk: false,
        localStorage: true, // Enable localStorage for offline operations and faster testing
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    console.log("✓ Gun instance created");
    // === STEP 2: INITIALIZE SHOGUN CORE ===
    console.log("\n🔧 === INITIALIZING SHOGUN CORE ===\n");
    const shogun = new core_1.ShogunCore({
        gunInstance: gunInstance, // Required: existing Gun instance
        webauthn: {
            enabled: true,
            rpName: "ShogunCore Example",
        },
        web3: {
            enabled: true,
        },
        silent: false, // Enable console logs
    });
    console.log("✓ ShogunCore initialized with existing Gun instance");
    // === STEP 3: USE SHOGUN CORE ===
    console.log("\n🎯 === USING SHOGUN CORE ===\n");
    // Access the database
    const db = shogun.db;
    console.log("Database available:", !!db);
    // Check if user is logged in
    console.log("User logged in:", shogun.isLoggedIn());
    // Example: Sign up a new user
    console.log("\n--- Sign Up Example ---");
    const username = `testuser_${Date.now()}`;
    const password = "testpass123";
    console.log(`Attempting signup for: ${username}`);
    console.log("⏳ This may take up to 30 seconds if peers are unreachable...\n");
    let signupResult;
    try {
        const signupStartTime = Date.now();
        signupResult = await shogun.signUp(username, password);
        const signupDuration = Date.now() - signupStartTime;
        if (signupResult.success) {
            console.log(`✓ User signed up successfully in ${signupDuration}ms`);
            console.log("  Username:", signupResult.username);
            console.log("  UserPub:", signupResult.userPub?.substring(0, 20) + "...");
            console.log("  Has SEA Pair:", !!signupResult.sea);
        }
        else {
            console.log(`❌ Sign up failed after ${signupDuration}ms`);
            console.log("  Error:", signupResult.error);
            console.log("\n💡 Troubleshooting:");
            console.log("  - Check if username already exists");
            console.log("  - Verify network connection to peers");
            console.log("  - Try with localStorage: true for offline testing");
        }
    }
    catch (error) {
        console.log("❌ Sign up exception:", error);
        console.log("  Error type:", error instanceof Error ? error.constructor.name : typeof error);
        signupResult = { success: false, error: String(error) };
    }
    // Example: Login (only if signup succeeded or user already exists)
    console.log("\n--- Login Example ---");
    const canLogin = signupResult?.success || signupResult?.error?.includes("already");
    if (canLogin) {
        if (signupResult?.success) {
            console.log("✓ User created, attempting login...");
        }
        else if (signupResult?.error?.includes("already")) {
            console.log("ℹ️ User already exists, attempting login...");
        }
        try {
            console.log("⏳ Login may take up to 30 seconds if peers are unreachable...");
            const loginStartTime = Date.now();
            const loginResult = await shogun.login(username, password);
            const loginDuration = Date.now() - loginStartTime;
            if (loginResult.success) {
                console.log(`✓ User logged in successfully in ${loginDuration}ms`);
                console.log("  Username:", loginResult.username);
            }
            else {
                console.log(`❌ Login failed after ${loginDuration}ms`);
                console.log("  Error:", loginResult.error);
                console.log("\n💡 Troubleshooting:");
                console.log("  - Verify username and password are correct");
                console.log("  - Check network connection to peers");
                console.log("  - User may not have been created successfully");
            }
        }
        catch (error) {
            console.log("❌ Login exception:", error);
        }
    }
    else {
        console.log("⚠️ Skipping login - signup failed:", signupResult?.error);
    }
    // Example: Check current user
    console.log("\n--- Current User ---");
    const isLoggedInNow = shogun.isLoggedIn();
    const currentUser = shogun.getCurrentUser();
    console.log("Is logged in:", isLoggedInNow);
    if (currentUser) {
        console.log("Current user:", {
            pub: currentUser.pub?.substring(0, 20) + "..." || "N/A",
            hasUser: !!currentUser.user,
        });
    }
    else {
        console.log("Current user: null (not logged in)");
    }
    // Example: Logout
    console.log("\n--- Logout Example ---");
    if (isLoggedInNow) {
        shogun.logout();
        console.log("✓ User logged out");
    }
    else {
        console.log("ℹ️ No user to logout");
    }
    console.log("\n🎉 Example completed!");
    console.log("\n💡 Tips:");
    console.log("  - Enable localStorage: true for offline testing");
    console.log("  - Use unique usernames to avoid conflicts");
    console.log("  - Timeout errors usually indicate peer connectivity issues");
}
// Run the example
if (require.main === module) {
    shogunCoreExample().catch(console.error);
}
