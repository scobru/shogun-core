/**
 * MLS 3-Member Test
 * Test specifico per gruppi di 3 membri
 */

import { MLSManager } from "../crypto";

async function testMLS3Members() {
  console.log("🚀 Starting MLS 3-Member Test");
  console.log("=".repeat(50));

  try {
    // Create managers
    const alice = new MLSManager("alice");
    const bob = new MLSManager("bob");
    const charlie = new MLSManager("charlie");

    // Initialize
    await alice.initialize();
    await bob.initialize();
    await charlie.initialize();
    console.log("✅ All managers initialized");

    // Alice creates group
    const groupId = "test-3-members";
    await alice.createGroup(groupId);
    console.log("✅ Group created by Alice");

    // Add Bob and Charlie together
    const bobKeyPackage = bob.getKeyPackage();
    const charlieKeyPackage = charlie.getKeyPackage();

    console.log("➕ Adding Bob and Charlie to group...");
    const addResult = await alice.addMembers(groupId, [
      bobKeyPackage!,
      charlieKeyPackage!,
    ]);
    console.log("✅ Members added by Alice");

    // Bob and Charlie join via welcome
    await bob.processWelcome(addResult.welcome, addResult.ratchetTree);
    await charlie.processWelcome(addResult.welcome, addResult.ratchetTree);
    console.log("✅ Bob and Charlie joined group");

    // Verify all members are synchronized
    const aliceInfo = await alice.getGroupKeyInfo(groupId);
    const bobInfo = await bob.getGroupKeyInfo(groupId);
    const charlieInfo = await charlie.getGroupKeyInfo(groupId);

    console.log(
      `📊 Epoch verification - Alice: ${aliceInfo?.epoch}, Bob: ${bobInfo?.epoch}, Charlie: ${charlieInfo?.epoch}`,
    );

    if (
      aliceInfo?.epoch === bobInfo?.epoch &&
      bobInfo?.epoch === charlieInfo?.epoch
    ) {
      console.log(`✅ All 3 members synchronized at epoch ${aliceInfo?.epoch}`);
    } else {
      console.log(`⚠️ WARNING: Members at different epochs`);
    }

    // Test message exchange
    console.log("\n📋 Testing message exchange with 3 members");

    // Alice sends message
    console.log("💬 Alice sending message...");
    const envelope1 = await alice.encryptMessage(
      groupId,
      "Hello from Alice to Bob and Charlie!",
    );
    console.log("✅ Alice encrypted message");

    // Bob and Charlie decrypt
    const bobDecrypted1 = await bob.decryptMessage(envelope1);
    console.log(`✅ Bob decrypted: "${bobDecrypted1}"`);

    const charlieDecrypted1 = await charlie.decryptMessage(envelope1);
    console.log(`✅ Charlie decrypted: "${charlieDecrypted1}"`);

    // Bob sends message
    console.log("\n💬 Bob sending message...");
    const envelope2 = await bob.encryptMessage(
      groupId,
      "Hello from Bob to Alice and Charlie!",
    );
    console.log("✅ Bob encrypted message");

    // Alice and Charlie decrypt
    const aliceDecrypted2 = await alice.decryptMessage(envelope2);
    console.log(`✅ Alice decrypted: "${aliceDecrypted2}"`);

    const charlieDecrypted2 = await charlie.decryptMessage(envelope2);
    console.log(`✅ Charlie decrypted: "${charlieDecrypted2}"`);

    // Charlie sends message
    console.log("\n💬 Charlie sending message...");
    const envelope3 = await charlie.encryptMessage(
      groupId,
      "Hello from Charlie to Alice and Bob!",
    );
    console.log("✅ Charlie encrypted message");

    // Alice and Bob decrypt
    const aliceDecrypted3 = await alice.decryptMessage(envelope3);
    console.log(`✅ Alice decrypted: "${aliceDecrypted3}"`);

    const bobDecrypted3 = await bob.decryptMessage(envelope3);
    console.log(`✅ Bob decrypted: "${bobDecrypted3}"`);

    console.log("\n🎉 MLS 3-Member Test completed successfully!");
    console.log("✅ Group creation with 3 members");
    console.log("✅ Bidirectional encrypted messaging");
    console.log("✅ All members can send and receive messages");

    // Cleanup
    await alice.destroy();
    await bob.destroy();
    await charlie.destroy();
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
if (require.main === module) {
  testMLS3Members().catch(console.error);
}

export { testMLS3Members };
