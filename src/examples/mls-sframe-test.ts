// MLS and SFrame test
import {
  createMLSManager,
  demonstrateMLS,
  createSFrameManager,
  demonstrateSFrame,
} from "../crypto";

// Test MLS (Message Layer Security)
async function testMLS() {
  try {
    console.log("🔐 Starting MLS test...");

    const result = await demonstrateMLS();

    if (result.success) {
      console.log("✅ MLS test successful!");
      console.log("Group members:", result.groupInfo.members);
      console.log("Messages exchanged:", result.messagesExchanged);
      console.log("Member count:", result.memberCount);
      console.log("Current epoch:", result.currentEpoch.toString());
      console.log("Forward secrecy:", result.demonstration.forwardSecrecy);
      console.log("Group messaging:", result.demonstration.groupMessaging);
    } else {
      console.log("❌ MLS test failed");
    }

    return result;
  } catch (error) {
    console.error("❌ MLS test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test SFrame (Secure Frame)
async function testSFrame() {
  try {
    console.log("🎥 Starting SFrame test...");

    const result = await demonstrateSFrame();

    if (result.success) {
      console.log("✅ SFrame test successful!");
      console.log("Frames processed:", result.framesProcessed);
      console.log("All frames match:", result.allFramesMatch);
      console.log("Alice stats:", result.aliceStats);
      console.log("Bob stats:", result.bobStats);
      console.log("Media encryption:", result.demonstration.mediaEncryption);
      console.log("Low overhead:", result.demonstration.lowOverhead);
    } else {
      console.log("❌ SFrame test failed");
    }

    return result;
  } catch (error) {
    console.error("❌ SFrame test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test individual MLS functions
async function testMLSIndividual() {
  try {
    console.log("🔐 Testing individual MLS functions...");

    // Create MLS manager
    const manager = await createMLSManager();
    console.log("✅ MLS manager created");

    // Get group info
    const groupInfo = manager.getGroupInfo();
    console.log(
      "✅ Group info retrieved:",
      groupInfo.members.length,
      "members",
    );

    // Export key package
    const keyPackage = await manager.exportKeyPackage();
    console.log("✅ Key package exported");

    // Create another manager and add as member
    const memberManager = await createMLSManager();
    const memberKeyPackage = await memberManager.exportKeyPackage();
    await manager.addMember("member1", memberKeyPackage);
    console.log("✅ Member added to group");

    // Send message
    const message = await manager.encryptMessage("Hello MLS group!", "self");
    console.log("✅ Message encrypted");

    // Decrypt message
    const decrypted = await manager.decryptMessage(message);
    console.log("✅ Message decrypted:", decrypted);

    // Get updated group info
    const updatedGroupInfo = manager.getGroupInfo();
    console.log(
      "✅ Updated group info:",
      updatedGroupInfo.members.length,
      "members",
    );

    return {
      success: true,
      groupMembers: updatedGroupInfo.members.length,
      messageDecrypted: decrypted === "Hello MLS group!",
    };
  } catch (error) {
    console.error("❌ Individual MLS test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test individual SFrame functions
async function testSFrameIndividual() {
  try {
    console.log("🎥 Testing individual SFrame functions...");

    // Create SFrame managers
    const senderManager = await createSFrameManager();
    const receiverManager = await createSFrameManager();
    console.log("✅ SFrame managers created");

    // Export sender's key
    const senderKey = await senderManager.exportCurrentKey();
    await receiverManager.addKey(
      senderKey.keyId,
      senderKey.key,
      senderKey.salt,
    );
    console.log("✅ Key shared between managers");

    // Test frame encryption/decryption
    const testFrame = new TextEncoder().encode("Test video frame data");
    const encryptedFrame = await senderManager.encryptFrame(testFrame);
    console.log("✅ Frame encrypted");

    const decryptedFrame = await receiverManager.decryptFrame(encryptedFrame);
    console.log("✅ Frame decrypted");

    // Verify data integrity
    const originalText = new TextDecoder().decode(testFrame);
    const decryptedText = new TextDecoder().decode(decryptedFrame);
    const dataMatches = originalText === decryptedText;

    // Test key rotation
    const newKeyId = await senderManager.rotateKey();
    console.log("✅ Key rotated to:", newKeyId);

    // Get statistics
    const senderStats = senderManager.getStats();
    const receiverStats = receiverManager.getStats();
    console.log("✅ Statistics retrieved");

    return {
      success: true,
      dataMatches,
      framesEncrypted: senderStats.framesEncrypted,
      framesDecrypted: receiverStats.framesDecrypted,
      newKeyId,
    };
  } catch (error) {
    console.error("❌ Individual SFrame test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Running all MLS and SFrame tests...\n");

  // Test 1: MLS demonstration
  console.log("=== Test 1: MLS Demonstration ===");
  const mlsResult = await testMLS();

  console.log("\n=== Test 2: SFrame Demonstration ===");
  const sframeResult = await testSFrame();

  console.log("\n=== Test 3: Individual MLS Functions ===");
  const mlsIndividualResult = await testMLSIndividual();

  console.log("\n=== Test 4: Individual SFrame Functions ===");
  const sframeIndividualResult = await testSFrameIndividual();

  console.log("\n📊 Final Results:");
  console.log(
    "MLS demonstration:",
    mlsResult.success ? "✅ PASSED" : "❌ FAILED",
  );
  console.log(
    "SFrame demonstration:",
    sframeResult.success ? "✅ PASSED" : "❌ FAILED",
  );
  console.log(
    "MLS individual:",
    mlsIndividualResult.success ? "✅ PASSED" : "❌ FAILED",
  );
  console.log(
    "SFrame individual:",
    sframeIndividualResult.success ? "✅ PASSED" : "❌ FAILED",
  );

  const allPassed =
    mlsResult.success &&
    sframeResult.success &&
    mlsIndividualResult.success &&
    sframeIndividualResult.success;

  if (allPassed) {
    console.log("\n🎉 All MLS and SFrame tests completed successfully!");
  } else {
    console.log("\n❌ Some tests failed");
  }

  return {
    mls: mlsResult,
    sframe: sframeResult,
    mlsIndividual: mlsIndividualResult,
    sframeIndividual: sframeIndividualResult,
    allPassed,
  };
}

// Run the tests
runAllTests()
  .then((result) => {
    console.log("\n📊 Final Test Summary:");
    console.log(
      JSON.stringify(
        result,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );
  })
  .catch((error) => {
    console.error("💥 Test execution failed:", error);
  });
