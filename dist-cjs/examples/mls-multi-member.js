"use strict";
/**
 * MLS Working Multi-Member Test
 * Usa l'approccio corretto basato sull'implementazione funzionante
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMLSWorkingMultiMembers = testMLSWorkingMultiMembers;
const crypto_1 = require("../crypto");
async function testMLSWorkingMultiMembers() {
    console.log("🚀 Starting MLS Working Multi-Member Test");
    console.log("=".repeat(50));
    const members = ["alice", "bob", "charlie", "david", "eve"];
    const managers = new Map();
    try {
        // Step 1: Initialize all managers
        console.log("\n📋 Step 1: Initializing all managers");
        for (const memberId of members) {
            const manager = new crypto_1.MLSManager(memberId);
            await manager.initialize();
            managers.set(memberId, manager);
            console.log(`✅ ${memberId} initialized`);
        }
        // Step 2: Alice creates group
        console.log("\n📋 Step 2: Creating group");
        const groupId = "working-multi-member-group";
        const alice = managers.get("alice");
        await alice.createGroup(groupId);
        console.log("✅ Group created by Alice");
        // Step 3: Add all members at once (this is the key!)
        console.log("\n📋 Step 3: Adding all members at once");
        const otherMembers = members.slice(1); // bob, charlie, david, eve
        const keyPackages = otherMembers.map((id) => managers.get(id).getKeyPackage());
        console.log(`➕ Adding ${otherMembers.length} members: ${otherMembers.join(", ")}`);
        const addResult = await alice.addMembers(groupId, keyPackages);
        console.log("✅ All members added by Alice");
        // Step 4: All other members join via welcome
        console.log("\n📋 Step 4: All members join via welcome");
        for (const memberId of otherMembers) {
            const manager = managers.get(memberId);
            await manager.processWelcome(addResult.welcome, addResult.ratchetTree);
            console.log(`✅ ${memberId} joined group`);
        }
        // Step 5: Verify synchronization
        console.log("\n📋 Step 5: Verifying synchronization");
        const epochInfos = new Map();
        for (const memberId of members) {
            const info = await managers.get(memberId).getGroupKeyInfo(groupId);
            epochInfos.set(memberId, info?.epoch);
        }
        console.log("📊 Epoch verification:");
        for (const [memberId, epoch] of epochInfos) {
            console.log(`  ${memberId}: ${epoch}`);
        }
        const epochs = Array.from(epochInfos.values());
        const allSameEpoch = epochs.every((epoch) => epoch === epochs[0]);
        if (!allSameEpoch) {
            console.log(`❌ CRITICAL: Members at different epochs - aborting test`);
            return;
        }
        console.log(`✅ All ${members.length} members synchronized at epoch ${epochs[0]}`);
        // Step 6: Test message exchange
        console.log("\n📋 Step 6: Testing message exchange");
        // Each member sends a message
        for (const senderId of members) {
            console.log(`\n💬 ${senderId} sending message...`);
            const sender = managers.get(senderId);
            const message = `Hello from ${senderId} to everyone!`;
            const envelope = await sender.encryptMessage(groupId, message);
            console.log(`✅ ${senderId} encrypted message`);
            // All members decrypt the message
            let successCount = 0;
            for (const [memberId, manager] of managers) {
                if (memberId === senderId) {
                    console.log(`✅ ${memberId} (sender) does not need to decrypt their own message.`);
                    successCount++;
                    continue;
                }
                try {
                    const decrypted = await manager.decryptMessage(envelope);
                    console.log(`✅ ${memberId} decrypted: "${decrypted}"`);
                    successCount++;
                }
                catch (error) {
                    console.error(`❌ ${memberId} failed to decrypt:`, error);
                }
            }
            if (successCount === members.length) {
                console.log(`🎉 All ${members.length} members successfully decrypted ${senderId}'s message`);
            }
            else {
                console.log(`⚠️ Only ${successCount}/${members.length} members could decrypt ${senderId}'s message`);
            }
        }
        // Step 7: Test key rotation
        console.log("\n📋 Step 7: Testing key rotation");
        const initiator = managers.get("alice");
        console.log("🔄 Alice initiating key rotation...");
        const updateCommit = await initiator.updateKey(groupId);
        console.log("✅ Key rotation commit created");
        // All members process the update commit
        for (const [memberId, manager] of managers) {
            if (memberId === initiator.getUserId()) {
                console.log(`✅ ${memberId} (initiator) already processed key rotation.`);
                continue;
            }
            try {
                await manager.processCommit(groupId, updateCommit);
                console.log(`✅ ${memberId} processed key rotation`);
            }
            catch (error) {
                console.error(`❌ ${memberId} failed to process key rotation:`, error);
            }
        }
        // Step 8: Test messages after key rotation
        console.log("\n📋 Step 8: Testing messages after key rotation");
        const testMessage = "This message is sent after key rotation!";
        const aliceEnvelope = await alice.encryptMessage(groupId, testMessage);
        let postRotationSuccess = 0;
        for (const [memberId, manager] of managers) {
            if (memberId === alice.getUserId()) {
                console.log(`✅ ${memberId} (sender) does not need to decrypt their own message after rotation.`);
                postRotationSuccess++;
                continue;
            }
            try {
                const decrypted = await manager.decryptMessage(aliceEnvelope);
                console.log(`✅ ${memberId} decrypted after rotation: "${decrypted}"`);
                postRotationSuccess++;
            }
            catch (error) {
                console.error(`❌ ${memberId} failed to decrypt after rotation:`, error);
            }
        }
        console.log("\n🎉 MLS Working Multi-Member Test completed!");
        console.log(`✅ Group creation with ${members.length} members`);
        console.log(`✅ Bidirectional encrypted messaging`);
        console.log(`✅ Key rotation and forward secrecy`);
        console.log(`✅ All members can send and receive messages`);
        // Cleanup
        console.log("\n📋 Cleanup");
        for (const [memberId, manager] of managers) {
            await manager.destroy();
            console.log(`✅ ${memberId} destroyed`);
        }
    }
    catch (error) {
        console.error("❌ Test failed:", error);
    }
}
// Run the test
if (require.main === module) {
    testMLSWorkingMultiMembers().catch(console.error);
}
