/**
 * Server Diagnostic Script
 * 
 * Tests the GUN server directly to see if it's responding to requests
 */

import Gun from "gun";

async function serverDiagnostic() {
  console.log("🔍 GUN Server Diagnostic Script\n");

  // Test with different server configurations
  const servers = [
    "https://shogunnode.scobrudot.dev/gun",
    "https://gun.defucc.me/gun",
    "https://peer.wallie.io/gun"
  ];

  for (const server of servers) {
    console.log(`\n=== Testing Server: ${server} ===`);
    
    const gun = Gun({
      peers: [server],
      radisk: false,
      localStorage: false,
    });

    // Test 1: Connection
    console.log("🔗 Testing connection...");
    const connected = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("❌ Connection timeout");
        resolve(false);
      }, 5000);

      gun.on('hi', (peer: any) => {
        console.log("✅ Connected to:", peer.id || peer.url);
        clearTimeout(timeout);
        resolve(true);
      });
    });

    if (!connected) {
      console.log("❌ Failed to connect to", server);
      continue;
    }

    // Test 2: Simple data operation
    console.log("📝 Testing simple data operation...");
    const dataOp = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("❌ Data operation timeout");
        resolve(false);
      }, 5000);

      gun.get('test').put({ 
        message: `Test from ${server}`, 
        timestamp: Date.now() 
      }, (ack: any) => {
        clearTimeout(timeout);
        if (ack && ack.err) {
          console.log("❌ Data operation error:", ack.err);
          resolve(false);
        } else {
          console.log("✅ Data operation successful");
          resolve(true);
        }
      });
    });

    if (!dataOp) {
      console.log("❌ Data operations failed on", server);
      continue;
    }

    // Test 3: User creation
    console.log("👤 Testing user creation...");
    const userCreate = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("❌ User creation timeout");
        resolve(false);
      }, 10000);

      gun.user().create("testuser", "testpass", (ack: any) => {
        clearTimeout(timeout);
        if (ack && ack.err) {
          console.log("❌ User creation error:", ack.err);
          resolve(false);
        } else {
          console.log("✅ User creation successful");
          resolve(true);
        }
      });
    });

    if (!userCreate) {
      console.log("❌ User creation failed on", server);
      continue;
    }

    // Test 4: User authentication
    console.log("🔑 Testing user authentication...");
    const userAuth = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("❌ User auth timeout");
        resolve(false);
      }, 10000);

      gun.user().auth("testuser", "testpass", (ack: any) => {
        clearTimeout(timeout);
        if (ack && ack.err) {
          console.log("❌ User auth error:", ack.err);
          resolve(false);
        } else {
          console.log("✅ User auth successful");
          console.log("User pub:", gun.user().is?.pub);
          resolve(true);
        }
      });
    });

    if (!userAuth) {
      console.log("❌ User authentication failed on", server);
      continue;
    }

    console.log("✅ All tests passed for", server);
  }

  console.log("\n✅ Server diagnostic completed");
}

// Run the diagnostic
if (require.main === module) {
  serverDiagnostic().catch(console.error);
}

export { serverDiagnostic };
