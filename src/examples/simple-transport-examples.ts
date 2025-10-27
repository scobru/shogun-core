/**
 * Simple Transport Layer Example
 *
 * A basic example showing how to use ShogunCore with different transport layers.
 * Perfect for getting started with the new architecture.
 */

import { ShogunCore } from "../core";

/**
 * Simple example using GunDB transport
 */
async function simpleGunExample() {
  console.log("🌐 Simple GunDB Example");
  console.log("========================");

  // Create ShogunCore with GunDB transport
  const shogun = new ShogunCore({
    transport: {
      type: "gun",
      options: {
        peers: ["https://gun-server.herokuapp.com/gun"],
        localStorage: true,
      },
    },
  });

  try {
    // Initialize
    await shogun.initialize();
    console.log("✅ ShogunCore initialized with GunDB");

    // Sign up a user
    const signupResult = await shogun.db.signUp("testuser", "password123");
    if (signupResult.success) {
      console.log("✅ User signed up:", signupResult.userPub);
    }

    // Store some data
    await shogun.db.put("myapp/settings", {
      theme: "dark",
      language: "en",
      notifications: true,
    });
    console.log("✅ Data stored");

    // Retrieve data
    const settings = await shogun.db.getData("myapp/settings");
    console.log("📖 Retrieved settings:", settings);

    // Login
    const loginResult = await shogun.db.login("testuser", "password123");
    if (loginResult.success) {
      console.log("✅ User logged in:", loginResult.userPub);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 Cleaned up\n");
  }
}

/**
 * Simple example using SQLite transport
 */
async function simpleSqliteExample() {
  console.log("🗄️ Simple SQLite Example");
  console.log("========================");

  // Create ShogunCore with SQLite transport
  const shogun = new ShogunCore({
    transport: {
      type: "sqlite",
      options: {
        database: "./simple-example.db",
      },
    },
  });

  try {
    // Initialize
    await shogun.initialize();
    console.log("✅ ShogunCore initialized with SQLite");

    // Sign up a user (same API!)
    const signupResult = await shogun.db.signUp("sqliteuser", "password123");
    if (signupResult.success) {
      console.log("✅ User signed up:", signupResult.userPub);
    }

    // Store some data (same API!)
    await shogun.db.put("myapp/data", {
      message: "Hello from SQLite!",
      timestamp: Date.now(),
      count: 42,
    });
    console.log("✅ Data stored");

    // Retrieve data (same API!)
    const data = await shogun.db.getData("myapp/data");
    console.log("📖 Retrieved data:", data);

    // Login (same API!)
    const loginResult = await shogun.db.login("sqliteuser", "password123");
    if (loginResult.success) {
      console.log("✅ User logged in:", loginResult.userPub);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 Cleaned up\n");
  }
}

/**
 * Example showing backward compatibility
 */
async function backwardCompatibilityExample() {
  console.log("🔄 Backward Compatibility Example");
  console.log("==================================");

  // This is how you would have initialized ShogunCore before
  const shogun = new ShogunCore({
    gunOptions: {
      peers: ["https://gun-server.herokuapp.com/gun"],
      localStorage: true,
    },
  });

  try {
    await shogun.initialize();
    console.log("✅ ShogunCore initialized (backward compatible mode)");
    console.log("Transport:", shogun.transport.name);

    // All the same APIs work
    await shogun.db.put("compat/test", { message: "Backward compatible!" });
    const data = await shogun.db.getData("compat/test");
    console.log("📖 Data:", data);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    shogun.transport.destroy();
    console.log("🧹 Cleaned up\n");
  }
}

/**
 * Example showing how to switch transports easily
 */
async function transportSwitchingExample() {
  console.log("🔄 Transport Switching Example");
  console.log("==============================");

  // Function that works with any transport
  async function runApp(transportType: "gun" | "sqlite") {
    console.log(`\n🚀 Running app with ${transportType} transport...`);

    const shogun = new ShogunCore({
      transport: {
        type: transportType,
        options:
          transportType === "sqlite"
            ? { database: `./${transportType}-app.db` }
            : { peers: ["https://gun-server.herokuapp.com/gun"] },
      },
    });

    try {
      await shogun.initialize();

      // Same application logic works with both transports
      await shogun.db.put("app/config", {
        transport: transportType,
        timestamp: Date.now(),
      });

      const config = await shogun.db.getData("app/config");
      console.log(
        `✅ App config stored and retrieved with ${transportType}:`,
        config,
      );
    } finally {
      shogun.transport.destroy();
    }
  }

  // Run the same app with different transports
  await runApp("gun");
  await runApp("sqlite");

  console.log("🎉 Same app logic works with different transports!\n");
}

/**
 * Main function to run all simple examples
 */
async function runSimpleExamples() {
  console.log("🎯 Simple ShogunCore Transport Examples");
  console.log("=======================================");
  console.log(
    "These examples show the basics of using different transport layers\n",
  );

  try {
    await simpleGunExample();
    await simpleSqliteExample();
    await backwardCompatibilityExample();
    await transportSwitchingExample();

    console.log("🎉 All simple examples completed!");
    console.log("\n💡 What you learned:");
    console.log("• Same API works with GunDB and SQLite");
    console.log("• Easy to switch between transports");
    console.log("• Backward compatibility maintained");
    console.log("• Clean initialization and cleanup");
  } catch (error) {
    console.error("❌ Examples failed:", error);
  }
}

// Export functions for use in other files
export {
  simpleGunExample,
  simpleSqliteExample,
  backwardCompatibilityExample,
  transportSwitchingExample,
  runSimpleExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runSimpleExamples().catch(console.error);
}
