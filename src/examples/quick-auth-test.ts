/**
 * Quick Auth Test Script
 *
 * Simple script to quickly test signup and login functionality
 * Run this to verify that the authentication system is working
 */

import Gun from "gun";
import { AutoQuickStart } from "../gundb/api";

async function quickAuthTest() {
  console.log("🚀 Quick Authentication Test\n");

  // Create Gun instance first
  const gunInstance = Gun({
    peers: ["https://peer.wallie.io/gun"],
  });

  // Initialize ShogunCore with existing Gun instance
  const quickStart = new AutoQuickStart(gunInstance, "quick-test");

  try {
    await quickStart.init();
    console.log("✓ ShogunCore initialized");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    return;
  }

  const db = quickStart.api.database;
  const username = `quicktest_${Date.now()}`;
  const password = "testpass123";

  console.log(`Testing with username: ${username}\n`);

  // Test signup
  console.log("🔄 Testing signup...");
  const signupResult = await db.signUp(username, password);

  if (signupResult.success) {
    console.log("✓ Signup successful");
  } else {
    console.error("❌ Signup failed:", signupResult.error);
    return;
  }

  // Test login
  console.log("🔄 Testing login...");
  const loginResult = await db.login(username, password);

  if (loginResult.success) {
    console.log("✓ Login successful");
    console.log("✓ User is logged in:", db.isLoggedIn());
  } else {
    console.error("❌ Login failed:", loginResult.error);
    return;
  }

  // Test logout
  console.log("🔄 Testing logout...");
  db.logout();
  console.log("✓ Logout completed");
  console.log("✓ User is logged out:", !db.isLoggedIn());

  console.log(
    "\n✅ All tests passed! Authentication system is working correctly.",
  );
}

// Run the test
if (require.main === module) {
  quickAuthTest().catch(console.error);
}

export { quickAuthTest };
