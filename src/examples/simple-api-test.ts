/**
 * Example showing how to use the simplified ShogunCore API
 *
 * The API has been streamlined:
 * - AutoQuickStart: Quick initialization helper
 * - api.database: Direct access to DataBase for basic operations (get, put, set, remove, auth)
 * - api helper methods: High-level helpers for profile, settings, collections, and array utilities
 */

import { AutoQuickStart } from "../gundb/api";

async function simpleAPITest() {
  console.log("🚀 ShogunCore Simplified API Example\n");

  // === QUICK START ===
  console.log("📦 === INITIALIZATION ===\n");

  // Use AutoQuickStart for easy setup
  const quickStart = new AutoQuickStart({
    peers: ["https://peer.wallie.io/gun"],
    appScope: "simple-test",
  });

  await quickStart.init();

  // Access the API and database
  const api = quickStart.api;
  const db = api.database; // Direct access to DataBase for basic operations

  console.log("Initialized successfully!");
  console.log("- api: provides helper methods");
  console.log("- db (api.database): provides full DataBase functionality\n");

  // === BASIC OPERATIONS (via database) ===
  console.log("💾 === BASIC OPERATIONS (use api.database) ===\n");

  const testData = { message: "Hello World", timestamp: Date.now() };

  // Use db for basic operations
  await db.put("global/data", testData);
  console.log("✓ Saved data with db.put()");

  const retrieved = await db.getData("global/data");
  console.log("✓ Retrieved data with db.getData():", retrieved);

  await db.remove("global/data");
  console.log("✓ Removed data with db.remove()\n");

  // === AUTHENTICATION (via database) ===
  console.log("🔐 === AUTHENTICATION (use api.database) ===\n");

  const username = "testuser_" + Date.now();
  const password = "testpass123";

  const signupResult = await db.signUp(username, password);
  console.log("✓ Signup:", signupResult.success ? "Success" : "Failed");

  if (signupResult.success) {
    const loginResult = await db.login(username, password);
    console.log("✓ Login:", loginResult.success ? "Success" : "Failed");

    if (loginResult.success) {
      console.log("✓ Current user:", db.getCurrentUser()?.alias, "\n");

      // === HELPER METHODS (via api) ===
      console.log("⭐ === HELPER METHODS (use api helpers) ===\n");

      // Profile helper
      await api.updateProfile({
        name: "Test User",
        email: "test@example.com",
        bio: "Testing the simplified API",
      });
      console.log("✓ Profile updated with api.updateProfile()");

      const profile = await api.getProfile();
      console.log("✓ Profile retrieved:", profile);

      // Settings helper
      await api.saveSettings({
        theme: "dark",
        language: "en",
        notifications: true,
      });
      console.log("✓ Settings saved with api.saveSettings()");

      const settings = await api.getSettings();
      console.log("✓ Settings retrieved:", settings);

      // Collections helper
      await api.createCollection("favorites", {
        item1: { id: "item1", title: "First Item" },
        item2: { id: "item2", title: "Second Item" },
      });
      console.log("✓ Collection created with api.createCollection()");

      await api.addToCollection("favorites", "item3", {
        id: "item3",
        title: "Third Item",
      });
      console.log("✓ Item added with api.addToCollection()");

      const collection = await api.getCollection("favorites");
      console.log("✓ Collection retrieved:", collection);

      // === ARRAY UTILITIES ===
      console.log("\n🔧 === ARRAY UTILITIES ===\n");

      const items = [
        { id: "1", name: "Item 1", value: 100 },
        { id: "2", name: "Item 2", value: 200 },
        { id: "3", name: "Item 3", value: 300 },
      ];

      // Convert array to GunDB-friendly indexed object
      const indexed = api.arrayToIndexedObject(items);
      console.log("✓ Array converted to indexed object:", indexed);

      // Convert back to array
      const restored = api.indexedObjectToArray(indexed);
      console.log("✓ Indexed object converted back to array:", restored);

      // Logout
      db.logout();
      console.log("\n✓ Logged out");
    }
  }

  console.log("\n✅ Example completed!");
  console.log("\nSummary:");
  console.log("- Use AutoQuickStart for easy initialization");
  console.log("- Use api.database for basic operations (get, put, auth, etc.)");
  console.log("- Use api helper methods for high-level operations:");
  console.log("  • updateProfile(), getProfile()");
  console.log("  • saveSettings(), getSettings()");
  console.log("  • createCollection(), addToCollection(), getCollection()");
  console.log("  • arrayToIndexedObject(), indexedObjectToArray()");
}

// Esegui il test
if (require.main === module) {
  simpleAPITest().catch(console.error);
}

export { simpleAPITest };
