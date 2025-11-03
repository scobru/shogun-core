"use strict";
/**
 * Simple MLS Test
 * Minimal test to verify MLS functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMLS = testMLS;
const crypto_1 = require("../crypto");
async function testMLS() {
    console.log("🚀 Starting Simple MLS Test");
    console.log("=".repeat(50));
    try {
        // Create managers
        const alice = new crypto_1.MLSManager("alice");
        const bob = new crypto_1.MLSManager("bob");
        // Initialize
        await alice.initialize();
        await bob.initialize();
        console.log("✅ Managers initialized");
        // Alice creates group
        const groupId = "test-group";
        await alice.createGroup(groupId);
        console.log("✅ Group created");
        // Add Bob
        const bobKeyPackage = bob.getKeyPackage();
        const addResult = await alice.addMembers(groupId, [bobKeyPackage]);
        console.log("✅ Members added");
        // Bob joins via welcome
        await bob.processWelcome(addResult.welcome, addResult.ratchetTree);
        console.log("✅ Bob joined group");
        // Test message exchange
        console.log("\n📋 Testing message exchange");
        // Alice sends message
        const envelope1 = await alice.encryptMessage(groupId, "Hello from Alice!");
        console.log("✅ Alice encrypted message");
        // Bob decrypts
        const decrypted1 = await bob.decryptMessage(envelope1);
        console.log(`✅ Bob decrypted: "${decrypted1}"`);
        // Bob sends message
        const envelope2 = await bob.encryptMessage(groupId, "Hello from Bob!");
        console.log("✅ Bob encrypted message");
        // Alice decrypts
        const decrypted2 = await alice.decryptMessage(envelope2);
        console.log(`✅ Alice decrypted: "${decrypted2}"`);
        console.log("\n🎉 Simple MLS Test completed successfully!");
        // Cleanup
        await alice.destroy();
        await bob.destroy();
        console.log("✅ Cleanup completed");
    }
    catch (error) {
        console.error("❌ Test failed:", error);
    }
}
// Run the test
if (require.main === module) {
    testMLS().catch(console.error);
}
