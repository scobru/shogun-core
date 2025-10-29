/**
 * Debug Authentication Script
 * 
 * This script helps debug authentication issues by providing detailed logging
 * and testing different scenarios to identify the root cause of timeouts.
 */

import Gun from "gun";

async function debugAuth() {
  console.log("🔍 GUN Authentication Debug Script\n");

  // Test 1: Basic GUN connection test
  console.log("=== TEST 1: BASIC GUN CONNECTION ===");
  
  const gunInstance = Gun({
    peers: ["https://shogunnode.scobrudot.dev/gun"],
    radisk: false,
  });

  // Test peer connectivity
  console.log("🔗 Testing peer connectivity...");
  
  const peerTest = new Promise((resolve) => {
    let connected = false;
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log("❌ Peer connection timeout (10s)");
        resolve(false);
      }
    }, 10000);

    gunInstance.on('hi', (peer: any) => {
      console.log("✅ Peer connected:", peer);
      connected = true;
      clearTimeout(timeout);
      resolve(true);
    });

    // Trigger connection
    gunInstance.get('test').put({ timestamp: Date.now() });
  });

  const isConnected = await peerTest;
  console.log("Peer connection status:", isConnected ? "✅ Connected" : "❌ Failed");
  console.log("");

  // Test 2: Simple data operations
  console.log("=== TEST 2: SIMPLE DATA OPERATIONS ===");
  
  try {
    console.log("📝 Testing simple put/get...");
    
    const testData = { message: "Hello from debug script", timestamp: Date.now() };
    
    // Put data
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Put operation timeout"));
      }, 5000);
      
      gunInstance.get('debug/test').put(testData, (ack: any) => {
        clearTimeout(timeout);
        if (ack.err) {
          console.log("❌ Put error:", ack.err);
          reject(new Error(ack.err));
        } else {
          console.log("✅ Put successful");
          resolve(ack);
        }
      });
    });

    // Get data
    const retrievedData = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Get operation timeout"));
      }, 5000);
      
      gunInstance.get('debug/test').once((data: any) => {
        clearTimeout(timeout);
        console.log("✅ Get successful:", data);
        resolve(data);
      });
    });

    console.log("Data operations: ✅ Success");
  } catch (error) {
    console.log("❌ Data operations failed:", error);
  }
  console.log("");

  // Test 3: User authentication with detailed logging
  console.log("=== TEST 3: USER AUTHENTICATION DEBUG ===");
  
  const username = "scobru";
  const password = "francos88";
  
  console.log(`🔐 Testing authentication for user: ${username}`);
  
  // Clear any existing user state
  gunInstance.user().leave();
  
  // Test user creation with detailed logging
  console.log("🔄 Attempting user creation...");
  
  const createResult = await new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log("❌ User creation timeout (15s)");
        resolve({ success: false, error: "Timeout" });
      }
    }, 15000);

    const user = gunInstance.user();
    
    // Add detailed logging for user creation
    user.create(username, password, (ack: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      
      console.log("📊 User creation response:", ack);
      
      if (ack.err) {
        console.log("❌ User creation error:", ack.err);
        resolve({ success: false, error: ack.err });
      } else {
        console.log("✅ User creation successful");
        resolve({ success: true, ack });
      }
    });
  });

  console.log("User creation result:", createResult);
  console.log("");

  // Test 4: User authentication
  console.log("=== TEST 4: USER AUTHENTICATION ===");
  
  if (createResult.success) {
    console.log("🔄 Attempting user authentication...");
    
    const authResult = await new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log("❌ Authentication timeout (15s)");
          resolve({ success: false, error: "Timeout" });
        }
      }, 15000);

      const user = gunInstance.user();
      
      user.auth(username, password, (ack: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        
        console.log("📊 Authentication response:", ack);
        
        if (ack.err) {
          console.log("❌ Authentication error:", ack.err);
          resolve({ success: false, error: ack.err });
        } else {
          console.log("✅ Authentication successful");
          console.log("User pub:", user.is?.pub);
          console.log("User alias:", user.is?.alias);
          resolve({ success: true, ack });
        }
      });
    });

    console.log("Authentication result:", authResult);
  } else {
    console.log("⏭️ Skipping authentication test due to creation failure");
  }
  console.log("");

  // Test 5: Check user data in the network
  console.log("=== TEST 5: CHECK USER DATA IN NETWORK ===");
  
  console.log("🔍 Checking if user exists in network...");
  
  const userCheck = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("⏰ User check timeout (10s)");
      resolve(null);
    }, 10000);
    
    gunInstance.get(`~@${username}`).once((data: any) => {
      clearTimeout(timeout);
      console.log("📊 User data found:", data);
      resolve(data);
    });
  });

  if (userCheck) {
    console.log("✅ User data exists in network");
    console.log("User keys:", Object.keys(userCheck));
    if (userCheck.pub) {
      console.log("User pub:", userCheck.pub.substring(0, 20) + "...");
    }
  } else {
    console.log("❌ No user data found in network");
  }
  console.log("");

  // Test 6: Network diagnostics
  console.log("=== TEST 6: NETWORK DIAGNOSTICS ===");
  
  console.log("🌐 Gun instance info:");
  console.log("- Peers:", (gunInstance as any)._?.opt?.peers);
  console.log("- User state:", gunInstance.user().is);
  console.log("- Gun version:", (gunInstance as any)._?.version);
  
  // Check if there are any pending operations
  const user = gunInstance.user();
  console.log("- User pending operations:", (user as any)._?.ing);
  console.log("- User state details:", user._);
  
  console.log("\n✅ Debug script completed");
}

// Run the debug script
if (require.main === module) {
  debugAuth().catch(console.error);
}

export { debugAuth };
