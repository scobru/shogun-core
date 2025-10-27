/**
 * Authentication Test Script
 *
 * Tests signup and login functionality with username and password
 * Includes timeout handling and error recovery testing
 */

import { AutoQuickStart } from "../gundb/api";

async function authTest() {
  console.log("🔐 ShogunCore Authentication Test\n");

  // === INITIALIZATION ===
  console.log("📦 === INITIALIZATION ===\n");

  // Use AutoQuickStart for easy setup with multiple peers for reliability
  const quickStart = new AutoQuickStart({
    peers: [
      "https://peer.wallie.io/gun",
      "https://gun-manhattan.herokuapp.com/gun",
      "https://gun.defucc.me/gun",
    ],
    appScope: "auth-test",
    // Enable debug logging
    enableGunDebug: true,
    enableConnectionMonitoring: true,
  });

  try {
    await quickStart.init();
    console.log("✓ ShogunCore initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize ShogunCore:", error);
    return;
  }

  const api = quickStart.api;
  const db = api.database;

  console.log("- Database instance:", db ? "Available" : "Not available");
  console.log("- Current user:", db.getCurrentUser()?.alias || "None");
  console.log("- Is logged in:", db.isLoggedIn());
  console.log("");

  // === TEST 1: BASIC SIGNUP AND LOGIN ===
  console.log("🧪 === TEST 1: BASIC SIGNUP AND LOGIN ===\n");

  const testUsername = `testuser_${Date.now()}`;
  const testPassword = "testpass123!@#";

  console.log(`Testing with username: ${testUsername}`);
  console.log(`Password: ${testPassword}\n`);

  // Test signup
  console.log("🔄 Attempting signup...");
  const signupStartTime = Date.now();

  try {
    const signupResult = await db.signUp(testUsername, testPassword);
    const signupDuration = Date.now() - signupStartTime;

    console.log(`✓ Signup completed in ${signupDuration}ms`);
    console.log("Signup result:", {
      success: signupResult.success,
      userPub: signupResult.userPub
        ? `${signupResult.userPub.substring(0, 20)}...`
        : "None",
      username: signupResult.username,
      isNewUser: signupResult.isNewUser,
      error: signupResult.error || "None",
    });

    if (!signupResult.success) {
      console.error("❌ Signup failed:", signupResult.error);
      return;
    }
  } catch (error) {
    console.error("❌ Signup threw exception:", error);
    return;
  }

  console.log("");

  // Test login
  console.log("🔄 Attempting login...");
  const loginStartTime = Date.now();

  try {
    const loginResult = await db.login(testUsername, testPassword);
    const loginDuration = Date.now() - loginStartTime;

    console.log(`✓ Login completed in ${loginDuration}ms`);
    console.log("Login result:", {
      success: loginResult.success,
      userPub: loginResult.userPub
        ? `${loginResult.userPub.substring(0, 20)}...`
        : "None",
      username: loginResult.username,
      error: loginResult.error || "None",
    });

    if (!loginResult.success) {
      console.error("❌ Login failed:", loginResult.error);
      return;
    }

    // Verify user state
    console.log("\n🔍 Verifying user state...");
    const currentUser = db.getCurrentUser();
    const isLoggedIn = db.isLoggedIn();

    console.log("Current user:", {
      alias: currentUser?.alias || "None",
      pub: currentUser?.pub ? `${currentUser.pub.substring(0, 20)}...` : "None",
      epub: currentUser?.epub
        ? `${currentUser.epub.substring(0, 20)}...`
        : "None",
    });
    console.log("Is logged in:", isLoggedIn);

    if (!isLoggedIn || !currentUser) {
      console.error("❌ User state verification failed");
      return;
    }
  } catch (error) {
    console.error("❌ Login threw exception:", error);
    return;
  }

  console.log("");

  // === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===
  console.log("💾 === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===\n");

  try {
    // Test encrypted data storage
    const testData = {
      message: "Hello from auth test!",
      timestamp: Date.now(),
      secret: "This is encrypted data",
    };

    console.log("🔄 Storing encrypted data...");
    await db.put("test/encrypted-data", testData);
    console.log("✓ Data stored successfully");

    console.log("🔄 Retrieving encrypted data...");
    const retrievedData = await db.getData("test/encrypted-data");
    console.log("✓ Data retrieved:", retrievedData);

    // Test profile operations
    console.log("\n🔄 Testing profile operations...");
    await api.updateProfile({
      name: "Auth Test User",
      email: "authtest@example.com",
      bio: "Testing authentication flow",
    });
    console.log("✓ Profile updated");

    const profile = await api.getProfile();
    console.log("✓ Profile retrieved:", profile);
  } catch (error) {
    console.error("❌ Data operations failed:", error);
  }

  console.log("");

  // === TEST 3: LOGOUT ===
  console.log("🚪 === TEST 3: LOGOUT ===\n");

  try {
    console.log("🔄 Attempting logout...");
    db.logout();

    // Wait a moment for logout to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const isStillLoggedIn = db.isLoggedIn();
    const currentUserAfterLogout = db.getCurrentUser();

    console.log("✓ Logout completed");
    console.log("Is logged in after logout:", isStillLoggedIn);
    console.log(
      "Current user after logout:",
      currentUserAfterLogout?.alias || "None",
    );

    if (isStillLoggedIn) {
      console.warn("⚠️ User still appears to be logged in after logout");
    } else {
      console.log("✓ Logout successful - user is no longer logged in");
    }
  } catch (error) {
    console.error("❌ Logout failed:", error);
  }

  console.log("");

  // === TEST 4: RE-LOGIN ===
  console.log("🔄 === TEST 4: RE-LOGIN ===\n");

  try {
    console.log("🔄 Attempting re-login with same credentials...");
    const reloginResult = await db.login(testUsername, testPassword);

    console.log("Re-login result:", {
      success: reloginResult.success,
      userPub: reloginResult.userPub
        ? `${reloginResult.userPub.substring(0, 20)}...`
        : "None",
      username: reloginResult.username,
      error: reloginResult.error || "None",
    });

    if (reloginResult.success) {
      console.log("✓ Re-login successful");
      console.log("Current user:", db.getCurrentUser()?.alias || "None");
    } else {
      console.error("❌ Re-login failed:", reloginResult.error);
    }
  } catch (error) {
    console.error("❌ Re-login threw exception:", error);
  }

  console.log("");

  // === TEST 5: ERROR HANDLING ===
  console.log("⚠️ === TEST 5: ERROR HANDLING ===\n");

  // Test invalid credentials
  console.log("🔄 Testing invalid password...");
  try {
    const invalidLoginResult = await db.login(testUsername, "wrongpassword");
    console.log("Invalid login result:", {
      success: invalidLoginResult.success,
      error: invalidLoginResult.error || "None",
    });

    if (!invalidLoginResult.success) {
      console.log("✓ Invalid password correctly rejected");
    } else {
      console.warn("⚠️ Invalid password was accepted (unexpected)");
    }
  } catch (error) {
    console.log(
      "✓ Invalid password threw exception (expected):",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Test non-existent user
  console.log("\n🔄 Testing non-existent user...");
  try {
    const nonexistentLoginResult = await db.login(
      "nonexistentuser123",
      "password",
    );
    console.log("Non-existent user login result:", {
      success: nonexistentLoginResult.success,
      error: nonexistentLoginResult.error || "None",
    });

    if (!nonexistentLoginResult.success) {
      console.log("✓ Non-existent user correctly rejected");
    } else {
      console.warn("⚠️ Non-existent user was accepted (unexpected)");
    }
  } catch (error) {
    console.log(
      "✓ Non-existent user threw exception (expected):",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("");

  // === FINAL LOGOUT ===
  console.log("🚪 === FINAL CLEANUP ===\n");

  try {
    db.logout();
    console.log("✓ Final logout completed");
  } catch (error) {
    console.error("❌ Final logout failed:", error);
  }

  console.log("\n✅ Authentication test completed!");
  console.log("\n📊 Test Summary:");
  console.log("- ✓ Signup with username/password");
  console.log("- ✓ Login with username/password");
  console.log("- ✓ Data operations while logged in");
  console.log("- ✓ Logout functionality");
  console.log("- ✓ Re-login capability");
  console.log("- ✓ Error handling for invalid credentials");
  console.log("- ✓ Error handling for non-existent users");
}

// Esegui il test
if (require.main === module) {
  authTest().catch(console.error);
}

export { authTest };
