/**
 * ShogunCore Example with Existing Gun Instance
 *
 * This example shows how to use ShogunCore with an existing Gun instance.
 * ShogunCore now requires an existing Gun instance to be passed in.
 */

import Gun from "gun";
import { ShogunCore } from "../core";

async function shogunCoreExample() {
  console.log("🚀 ShogunCore Example with Existing Gun Instance\n");

  // === STEP 1: CREATE GUN INSTANCE ===
  console.log("📦 === CREATING GUN INSTANCE ===\n");

  const gunInstance = Gun({
    peers: ["https://peer.wallie.io/gun", "https://gunjs.herokuapp.com/gun"],
    radisk: false,
    localStorage: false,
  });

  console.log("✓ Gun instance created");

  // === STEP 2: INITIALIZE SHOGUN CORE ===
  console.log("\n🔧 === INITIALIZING SHOGUN CORE ===\n");

  const shogun = new ShogunCore({
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
  const isLoggedIn = shogun.isLoggedIn();
  console.log("User logged in:", isLoggedIn);

  // Example: Sign up a new user
  console.log("\n--- Sign Up Example ---");
  const username = `testuser_${Date.now()}`;
  const password = "testpass123";

  try {
    const signupResult = await shogun.signUp(username, password);
    if (signupResult.success) {
      console.log("✓ User signed up successfully:", signupResult.username);
    } else {
      console.log("❌ Sign up failed:", signupResult.error);
    }
  } catch (error) {
    console.log("❌ Sign up error:", error);
  }

  // Example: Login
  console.log("\n--- Login Example ---");
  try {
    const loginResult = await shogun.login(username, password);
    if (loginResult.success) {
      console.log("✓ User logged in successfully:", loginResult.username);
    } else {
      console.log("❌ Login failed:", loginResult.error);
    }
  } catch (error) {
    console.log("❌ Login error:", error);
  }

  // Example: Check current user
  console.log("\n--- Current User ---");
  const currentUser = shogun.getCurrentUser();
  console.log("Current user:", currentUser);

  // Example: Logout
  console.log("\n--- Logout Example ---");
  shogun.logout();
  console.log("✓ User logged out");

  console.log("\n🎉 Example completed successfully!");
}

// Run the example
if (require.main === module) {
  shogunCoreExample().catch(console.error);
}

export { shogunCoreExample };
