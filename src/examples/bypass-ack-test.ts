/**
 * Bypass Acknowledgment Test
 * 
 * This test bypasses the acknowledgment system to see if we can get
 * basic GUN functionality working without waiting for server responses
 */

import Gun from "gun";

async function bypassAckTest() {
  console.log("🔧 GUN Bypass Acknowledgment Test\n");

  const gun = Gun({
    peers: ["https://shogunnode.scobrudot.dev/gun"],
    radisk: false,
    localStorage: false,
  });

  console.log("📡 Gun instance created");

  // Wait for connection
  console.log("⏳ Waiting for connection...");
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("⚠️ Connection timeout, proceeding anyway...");
      resolve(false);
    }, 3000);

    gun.on('hi', (peer: any) => {
      console.log("✅ Connected to:", peer.id || peer.url);
      clearTimeout(timeout);
      resolve(true);
    });
  });

  // Test 1: Put data without waiting for acknowledgment
  console.log("\n📝 Test 1: Put data without waiting for ack");
  
  const testData = { 
    message: "Test data", 
    timestamp: Date.now(),
    testId: Math.random().toString(36).substring(7)
  };
  
  console.log("Putting data:", testData);
  
  // Put data and don't wait for acknowledgment
  gun.get('test/bypass').put(testData);
  console.log("✅ Data put (no ack wait)");

  // Test 2: Get data with timeout
  console.log("\n📖 Test 2: Get data with timeout");
  
  const retrievedData = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("⏰ Get timeout, but this is expected");
      resolve(null);
    }, 2000);

    gun.get('test/bypass').once((data: any) => {
      clearTimeout(timeout);
      console.log("✅ Data retrieved:", data);
      resolve(data);
    });
  });

  if (retrievedData) {
    console.log("✅ Data retrieval successful");
  } else {
    console.log("⚠️ Data retrieval timeout (expected)");
  }

  // Test 3: User creation without waiting for ack
  console.log("\n👤 Test 3: User creation without waiting for ack");
  
  const username = "testuser" + Math.random().toString(36).substring(7);
  const password = "testpass";
  
  console.log("Creating user:", username);
  
  // Create user without waiting for acknowledgment
  gun.user().create(username, password);
  console.log("✅ User creation initiated (no ack wait)");

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: User authentication without waiting for ack
  console.log("\n🔑 Test 4: User authentication without waiting for ack");
  
  console.log("Authenticating user:", username);
  
  // Auth without waiting for acknowledgment
  gun.user().auth(username, password);
  console.log("✅ User authentication initiated (no ack wait)");

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if user is authenticated
  console.log("\n🔍 Test 5: Check authentication state");
  const user = gun.user();
  console.log("User state:", user.is);
  console.log("Is authenticated:", !!user.is);
  
  if (user.is) {
    console.log("✅ Authentication successful!");
    console.log("User pub:", user.is.pub);
    console.log("User alias:", user.is.alias);
  } else {
    console.log("❌ Authentication failed or still pending");
  }

  // Test 6: Try to get user data from network
  console.log("\n🌐 Test 6: Check user data in network");
  
  const userData = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("⏰ User data check timeout");
      resolve(null);
    }, 3000);

    gun.get(`~@${username}`).once((data: any) => {
      clearTimeout(timeout);
      console.log("✅ User data found:", data);
      resolve(data);
    });
  });

  if (userData) {
    console.log("✅ User data exists in network");
  } else {
    console.log("❌ User data not found in network");
  }

  console.log("\n✅ Bypass ack test completed");
  console.log("\n📊 Summary:");
  console.log("- If you see 'Authentication successful!' above, the issue is with acknowledgments");
  console.log("- If you see 'Authentication failed', the issue is with the authentication flow itself");
  console.log("- If you see 'User data not found', the server might not be storing data properly");
}

// Run the test
if (require.main === module) {
  bypassAckTest().catch(console.error);
}

export { bypassAckTest };
