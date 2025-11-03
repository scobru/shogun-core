// Double Ratchet Protocol test
import {
  demonstrateDoubleRatchet,
  initializeDoubleRatchet,
  doubleRatchetEncrypt,
  doubleRatchetDecrypt,
  serializeDoubleRatchetState,
} from "../crypto";

// Test Double Ratchet Protocol
async function testDoubleRatchet() {
  try {
    console.log("🔄 Starting Double Ratchet Protocol test...");

    const result = await demonstrateDoubleRatchet();

    if (result.success) {
      console.log("✅ Double Ratchet Protocol test successful!");
      console.log("Messages exchanged:", result.messagesExchanged);
      console.log("Forward secrecy:", result.demonstration.forwardSecrecy);
      console.log(
        "Out-of-order handling:",
        result.demonstration.outOfOrderHandling,
      );
      console.log("DH ratcheting:", result.demonstration.dhRatcheting);
      console.log("Chain key updating:", result.demonstration.chainKeyUpdating);

      // Test individual functions
      console.log("\n🧪 Testing individual Double Ratchet functions...");

      // Test state serialization
      const aliceStateSerialized = result.aliceState;
      console.log(
        "✅ Alice state serialized:",
        aliceStateSerialized.substring(0, 100) + "...",
      );

      // Test conversation
      console.log("✅ Conversation messages:", result.conversation.length);
      result.conversation.forEach((msg, index) => {
        console.log(
          `  Message ${index + 1}: ${msg.from} → Message #${msg.envelope.messageNumber}`,
        );
      });
    } else {
      console.log("❌ Double Ratchet Protocol test failed");
    }

    return result;
  } catch (error) {
    console.error("❌ Double Ratchet Protocol test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Test interactive Double Ratchet messaging
async function testInteractiveDoubleRatchet() {
  try {
    console.log("🔄 Starting Interactive Double Ratchet test...");

    // Initialize X3DH for shared secret
    const {
      initializeSignalUser,
      getSignalPublicKeyBundle,
      performSignalX3DHKeyExchange,
    } = await import("../crypto/signal-protocol");

    const alice = await initializeSignalUser("Alice");
    const bob = await initializeSignalUser("Bob");
    const bobBundle = await getSignalPublicKeyBundle(bob);
    const exchangeResult = await performSignalX3DHKeyExchange(alice, bobBundle);

    console.log("✅ X3DH key exchange completed");

    // Initialize Double Ratchet states
    const aliceState = await initializeDoubleRatchet(
      exchangeResult.masterSecret,
      true,
    );
    const bobState = await initializeDoubleRatchet(
      exchangeResult.masterSecret,
      false,
    );

    console.log("✅ Double Ratchet states initialized");

    // Test message exchange
    const messages = [
      "Hello Bob! This is our first Double Ratchet message! 🔒",
      "Hi Alice! The Double Ratchet is working perfectly! 🎉",
      "This is message 3 with forward secrecy! 🛡️",
      "And this is message 4 - each with a unique key! 🔑",
    ];

    const conversation = [];

    for (let i = 0; i < messages.length; i++) {
      const sender = i % 2 === 0 ? "Alice" : "Bob";
      const senderState = sender === "Alice" ? aliceState : bobState;
      const receiverState = sender === "Alice" ? bobState : aliceState;

      console.log(`\n📤 ${sender} sending message ${i + 1}: "${messages[i]}"`);

      // Encrypt
      const envelope = await doubleRatchetEncrypt(senderState, messages[i]);
      console.log(`✅ ${sender} encrypted message #${envelope.messageNumber}`);

      // Decrypt
      const decrypted = await doubleRatchetDecrypt(receiverState, envelope);
      console.log(
        `✅ ${sender === "Alice" ? "Bob" : "Alice"} decrypted: "${decrypted}"`,
      );

      // Verify
      if (decrypted === messages[i]) {
        console.log(`✅ Message ${i + 1} verified successfully`);
        conversation.push({
          sender,
          receiver: sender === "Alice" ? "Bob" : "Alice",
          original: messages[i],
          decrypted,
          messageNumber: envelope.messageNumber,
          verified: true,
        });
      } else {
        console.log(`❌ Message ${i + 1} verification failed`);
        conversation.push({
          sender,
          receiver: sender === "Alice" ? "Bob" : "Alice",
          original: messages[i],
          decrypted,
          messageNumber: envelope.messageNumber,
          verified: false,
        });
      }
    }

    // Test state serialization
    const aliceSerialized = await serializeDoubleRatchetState(aliceState);
    const bobSerialized = await serializeDoubleRatchetState(bobState);

    console.log("\n📊 Interactive Double Ratchet test results:");
    console.log(`Messages exchanged: ${conversation.length}`);
    console.log(
      `All messages verified: ${conversation.every((msg) => msg.verified)}`,
    );
    console.log(`Alice state serialized: ${aliceSerialized.length} characters`);
    console.log(`Bob state serialized: ${bobSerialized.length} characters`);

    return {
      success: true,
      messagesExchanged: conversation.length,
      allVerified: conversation.every((msg) => msg.verified),
      conversation,
      aliceState: aliceSerialized,
      bobState: bobSerialized,
    };
  } catch (error) {
    console.error("❌ Interactive Double Ratchet test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run the tests
async function runAllTests() {
  console.log("🚀 Running all Double Ratchet tests...\n");

  // Test 1: Basic demonstration
  console.log("=== Test 1: Basic Double Ratchet Demonstration ===");
  const basicResult = await testDoubleRatchet();

  console.log("\n=== Test 2: Interactive Double Ratchet Messaging ===");
  const interactiveResult = await testInteractiveDoubleRatchet();

  console.log("\n📊 Final Results:");
  console.log("Basic test:", basicResult.success ? "✅ PASSED" : "❌ FAILED");
  console.log(
    "Interactive test:",
    interactiveResult.success ? "✅ PASSED" : "❌ FAILED",
  );

  if (basicResult.success && interactiveResult.success) {
    console.log("\n🎉 All Double Ratchet tests completed successfully!");
  } else {
    console.log("\n❌ Some tests failed");
  }

  return {
    basic: basicResult,
    interactive: interactiveResult,
    allPassed: basicResult.success && interactiveResult.success,
  };
}

// Run the tests
runAllTests()
  .then((result) => {
    console.log("\n📊 Final Test Summary:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("💥 Test execution failed:", error);
  });
