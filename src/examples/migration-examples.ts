/**
 * Migration Example: From GunDB to SQLite
 *
 * This example shows how to migrate an application from GunDB to SQLite
 * using the same ShogunCore API, demonstrating the power of the transport layer abstraction.
 */

import { ShogunCore } from "../core";

/**
 * Example application that works with any transport layer
 */
class UserManager {
  private shogun: ShogunCore;

  constructor(shogun: ShogunCore) {
    this.shogun = shogun;
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(username: string, email: string, profile: any) {
    console.log(`👤 Creating profile for ${username}...`);

    // Sign up user
    const signupResult = await this.shogun.db.signUp(username, "password123");
    if (!signupResult.success) {
      throw new Error(`Signup failed: ${signupResult.error}`);
    }

    // Store user profile
    await this.shogun.db.put(`users/${username}/profile`, {
      email,
      ...profile,
      createdAt: Date.now(),
      transport: this.shogun.transport.name,
    });

    console.log(
      `✅ Profile created for ${username} using ${this.shogun.transport.name}`,
    );
    return signupResult.userPub;
  }

  /**
   * Get user profile
   */
  async getUserProfile(username: string) {
    console.log(`📖 Getting profile for ${username}...`);

    const profile = await this.shogun.db.getData(`users/${username}/profile`);
    if (profile) {
      console.log(`✅ Profile found for ${username}:`, profile);
    } else {
      console.log(`❌ Profile not found for ${username}`);
    }

    return profile;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(username: string, updates: any) {
    console.log(`✏️ Updating profile for ${username}...`);

    const currentProfile = await this.getUserProfile(username);
    if (!currentProfile) {
      throw new Error(`User ${username} not found`);
    }

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.shogun.db.put(`users/${username}/profile`, updatedProfile);
    console.log(`✅ Profile updated for ${username}`);

    return updatedProfile;
  }

  /**
   * List all users (transport-specific implementation)
   */
  async listAllUsers() {
    console.log(`📋 Listing all users...`);

    if (
      this.shogun.transport.name === "sqlite" &&
      this.shogun.transport.query
    ) {
      // SQLite-specific query
      const users = await this.shogun.transport.query(
        "SELECT path, value FROM data WHERE path LIKE 'users/%/profile'",
      );
      console.log(`✅ Found ${users.length} users using SQLite query`);
      return users.map((row: any) => JSON.parse(row.value));
    } else {
      // Generic approach (works with any transport)
      console.log(
        `ℹ️ Using generic approach for ${this.shogun.transport.name}`,
      );
      // In a real implementation, you might iterate through known users
      return [];
    }
  }
}

/**
 * Example 1: Using GunDB Transport
 */
async function gunDbExample() {
  console.log("🌐 Example 1: GunDB Transport");
  console.log("==============================");

  const shogun = new ShogunCore({
    transport: {
      type: "gun",
      options: {
        peers: ["https://gun-server.herokuapp.com/gun"],
        localStorage: true,
      },
    },
  });

  await shogun.initialize();

  const userManager = new UserManager(shogun);

  try {
    // Create user profiles
    await userManager.createUserProfile("alice", "alice@example.com", {
      name: "Alice Smith",
      age: 30,
      city: "New York",
    });

    await userManager.createUserProfile("bob", "bob@example.com", {
      name: "Bob Johnson",
      age: 25,
      city: "San Francisco",
    });

    // Get user profile
    await userManager.getUserProfile("alice");

    // Update user profile
    await userManager.updateUserProfile("alice", {
      age: 31,
      city: "Boston",
    });

    // List users
    await userManager.listAllUsers();
  } catch (error) {
    console.error("❌ GunDB example failed:", error);
  } finally {
    shogun.transport.destroy();
    console.log("🧹 GunDB example cleaned up\n");
  }
}

/**
 * Example 2: Using SQLite Transport
 */
async function sqliteExample() {
  console.log("🗄️ Example 2: SQLite Transport");
  console.log("===============================");

  const shogun = new ShogunCore({
    transport: {
      type: "sqlite",
      options: {
        database: "./migration-example.db",
        verbose: true,
      },
    },
  });

  await shogun.initialize();

  const userManager = new UserManager(shogun);

  try {
    // Create user profiles (same API!)
    await userManager.createUserProfile("charlie", "charlie@example.com", {
      name: "Charlie Brown",
      age: 28,
      city: "Chicago",
    });

    await userManager.createUserProfile("diana", "diana@example.com", {
      name: "Diana Prince",
      age: 32,
      city: "Seattle",
    });

    // Get user profile (same API!)
    await userManager.getUserProfile("charlie");

    // Update user profile (same API!)
    await userManager.updateUserProfile("charlie", {
      age: 29,
      city: "Portland",
    });

    // List users (SQLite-specific implementation)
    await userManager.listAllUsers();
  } catch (error) {
    console.error("❌ SQLite example failed:", error);
  } finally {
    shogun.transport.destroy();
    console.log("🧹 SQLite example cleaned up\n");
  }
}

/**
 * Example 3: Migration Script
 */
async function migrationExample() {
  console.log("🔄 Example 3: Migration Script");
  console.log("===============================");

  // Step 1: Export data from GunDB
  console.log("📤 Step 1: Exporting data from GunDB...");

  const gunDbShogun = new ShogunCore({
    transport: {
      type: "gun",
      options: { localStorage: true },
    },
  });

  await gunDbShogun.initialize();

  // Simulate exporting data
  const exportedData = [
    {
      username: "alice",
      email: "alice@example.com",
      profile: { name: "Alice Smith", age: 30 },
    },
    {
      username: "bob",
      email: "bob@example.com",
      profile: { name: "Bob Johnson", age: 25 },
    },
  ];

  console.log(`✅ Exported ${exportedData.length} users from GunDB`);
  gunDbShogun.transport.destroy();

  // Step 2: Import data to SQLite
  console.log("\n📥 Step 2: Importing data to SQLite...");

  const sqliteShogun = new ShogunCore({
    transport: {
      type: "sqlite",
      options: { database: "./migrated.db" },
    },
  });

  await sqliteShogun.initialize();

  const userManager = new UserManager(sqliteShogun);

  for (const userData of exportedData) {
    await userManager.createUserProfile(
      userData.username,
      userData.email,
      userData.profile,
    );
  }

  console.log(`✅ Imported ${exportedData.length} users to SQLite`);

  // Step 3: Verify migration
  console.log("\n🔍 Step 3: Verifying migration...");
  await userManager.listAllUsers();

  sqliteShogun.transport.destroy();
  console.log("🧹 Migration example cleaned up\n");
}

/**
 * Example 4: Transport-Agnostic Application
 */
async function transportAgnosticExample() {
  console.log("🔀 Example 4: Transport-Agnostic Application");
  console.log("=============================================");

  // This function works with any transport layer
  async function runApplication(transportConfig: any) {
    const shogun = new ShogunCore({ transport: transportConfig });
    await shogun.initialize();

    const userManager = new UserManager(shogun);

    console.log(
      `🚀 Running application with ${shogun.transport.name} transport`,
    );

    // Application logic (same for all transports)
    await userManager.createUserProfile("testuser", "test@example.com", {
      name: "Test User",
      age: 25,
    });

    await userManager.getUserProfile("testuser");

    shogun.transport.destroy();
    console.log(`✅ Application completed with ${shogun.transport.name}\n`);
  }

  // Run with different transports
  const transports = [
    { type: "gun", options: {} },
    { type: "sqlite", options: { database: "./agnostic.db" } },
  ];

  for (const transportConfig of transports) {
    await runApplication(transportConfig);
  }
}

/**
 * Main function to run all migration examples
 */
async function runMigrationExamples() {
  console.log("🎯 ShogunCore Migration Examples");
  console.log("=================================");
  console.log(
    "This example shows how to migrate between different transport layers\n",
  );

  try {
    await gunDbExample();
    await sqliteExample();
    await migrationExample();
    await transportAgnosticExample();

    console.log("🎉 All migration examples completed successfully!");
    console.log("\n📚 Key Benefits Demonstrated:");
    console.log("• Same API works across different databases");
    console.log("• Easy migration between transport layers");
    console.log("• Transport-specific optimizations available");
    console.log("• Application code remains unchanged");
    console.log("• Database-agnostic development possible");
  } catch (error) {
    console.error("❌ Migration examples failed:", error);
  }
}

// Export for use in other files
export {
  UserManager,
  gunDbExample,
  sqliteExample,
  migrationExample,
  transportAgnosticExample,
  runMigrationExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runMigrationExamples().catch(console.error);
}
