// Signal Protocol test
import { demonstrateSignalProtocol } from "../crypto";

// Test Signal Protocol
async function testSignalProtocol() {
  try {
    console.log("📡 Starting Signal Protocol test...");

    const result = await demonstrateSignalProtocol();

    if (result.success) {
      console.log("✅ Signal Protocol test successful!");
      console.log(
        "Alice and Bob have the same secret:",
        result.aliceSecret === result.bobSecret,
      );
      console.log("One-time prekey used:", result.usedOneTimePrekey);
      console.log(
        "Alice secret (first 20 chars):",
        result.aliceSecret.substring(0, 20) + "...",
      );
      console.log(
        "Bob secret (first 20 chars):",
        result.bobSecret.substring(0, 20) + "...",
      );
    } else {
      console.log("❌ Signal Protocol test failed");
    }

    return result;
  } catch (error) {
    console.error("❌ Signal Protocol test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run the test
testSignalProtocol()
  .then((result) => {
    console.log("\n📊 Signal Protocol Result:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("💥 Signal Protocol test execution failed:", error);
  });
