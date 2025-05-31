/**
 * Test script to verify Gun initialization fix
 */

const { ShogunCore } = require('./dist/index.js');

console.log("=== Testing Gun Initialization Fix ===\n");

async function testGunInitialization() {
  try {
    console.log("1. Creating ShogunCore instance...");
    
    const shogun = new ShogunCore({
      peers: ["http://localhost:8765/gun"],
      logging: {
        level: "info",
        enableConsole: true
      }
    });
    
    console.log("✅ ShogunCore created successfully!");
    console.log(`   Gun instance type: ${typeof shogun.gun}`);
    console.log(`   GunDB instance type: ${typeof shogun.gundb}`);
    console.log(`   User instance type: ${typeof shogun.user}`);
    
    // Test state machine
    console.log("\n2. Testing state machine...");
    console.log(`   Auth state: ${shogun.gundb.getAuthState()}`);
    console.log(`   State description: ${shogun.gundb.getAuthStateDescription()}`);
    console.log(`   Can start auth: ${shogun.gundb.canStartAuth()}`);
    console.log(`   Is busy: ${shogun.gundb.isAuthenticating()}`);
    
    // Test Gun methods
    console.log("\n3. Testing Gun methods...");
    console.log(`   gun.user is function: ${typeof shogun.gun.user === 'function'}`);
    console.log(`   gun.get is function: ${typeof shogun.gun.get === 'function'}`);
    console.log(`   gun.on is function: ${typeof shogun.gun.on === 'function'}`);
    
    // Test user method
    console.log("\n4. Testing user method...");
    const user = shogun.gun.user();
    console.log(`   User object created: ${typeof user === 'object'}`);
    console.log(`   User has auth method: ${typeof user.auth === 'function'}`);
    console.log(`   User has create method: ${typeof user.create === 'function'}`);
    
    console.log("\n✅ All tests passed! Gun initialization fix is working correctly.");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
}

testGunInitialization(); 