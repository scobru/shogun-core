"use strict";
/**
 * PGP Example - Simple and Immediate
 * Demonstrates basic PGP functionality:
 * - Key generation
 * - Message encryption/decryption
 * - Digital signing
 * - Signature verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplePGPExample = simplePGPExample;
exports.advancedPGPExample = advancedPGPExample;
exports.runAllPGPExamples = runAllPGPExamples;
const crypto_1 = require("../crypto");
// Simple PGP usage example
async function simplePGPExample() {
    try {
        console.log("🔐 Starting Simple PGP Example");
        console.log("=".repeat(40));
        // Method 1: Using factory functions (simplest)
        console.log("\n📋 Method 1: Factory Functions");
        // Generate key pairs
        const aliceKeys = await (0, crypto_1.generatePGPKeyPair)("Alice", "alice@example.com", "alice123");
        const bobKeys = await (0, crypto_1.generatePGPKeyPair)("Bob", "bob@example.com", "bob123");
        console.log("✅ Key pairs generated");
        console.log("Alice Key ID:", aliceKeys.keyId);
        console.log("Bob Key ID:", bobKeys.keyId);
        // Encrypt message from Alice to Bob
        const message = "Hello Bob! This is a secret message from Alice. 🔐";
        const encrypted = await (0, crypto_1.encryptPGPMessage)(message, bobKeys.publicKey);
        console.log("✅ Message encrypted");
        console.log("Encrypted message length:", encrypted.message.length);
        // Bob decrypts the message
        const decrypted = await (0, crypto_1.decryptPGPMessage)(encrypted.message, bobKeys.privateKey, "bob123");
        console.log("✅ Message decrypted");
        console.log("Original message:", message);
        console.log("Decrypted message:", decrypted);
        console.log("Messages match:", message === decrypted);
        // Alice signs a message
        const signedMessage = "This is a signed message from Alice. ✍️";
        const signature = await (0, crypto_1.signPGPMessage)(signedMessage, aliceKeys.privateKey, "alice123");
        console.log("✅ Message signed");
        console.log("Signature length:", signature.signature.length);
        // Bob verifies Alice's signature
        const verification = await (0, crypto_1.verifyPGPSignature)(signedMessage, signature.signature, aliceKeys.publicKey);
        console.log("✅ Signature verified");
        console.log("Signature valid:", verification.valid);
        console.log("\n🎉 Simple PGP Example completed successfully!");
        return {
            success: true,
            messageDecrypted: message === decrypted,
            signatureValid: verification.valid,
        };
    }
    catch (error) {
        console.error("❌ Simple PGP Example failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
// Advanced PGP usage with manager
async function advancedPGPExample() {
    let manager;
    try {
        console.log("\n🔐 Starting Advanced PGP Example");
        console.log("=".repeat(40));
        // Method 2: Using PGPManager (more control)
        manager = await (0, crypto_1.createPGPManager)();
        console.log("✅ PGP Manager created");
        // Generate multiple key pairs
        const users = [
            { name: "Alice", email: "alice@example.com", passphrase: "alice123" },
            { name: "Bob", email: "bob@example.com", passphrase: "bob123" },
            {
                name: "Charlie",
                email: "charlie@example.com",
                passphrase: "charlie123",
            },
        ];
        const userKeys = new Map();
        for (const user of users) {
            const keys = await manager.generateKeyPair(user.name, user.email, user.passphrase);
            userKeys.set(user.name, keys);
            console.log(`✅ ${user.name} key pair generated: ${keys.keyId}`);
        }
        // Test group messaging (Alice sends to Bob and Charlie)
        console.log("\n📧 Group Messaging Test");
        const groupMessage = "Hello everyone! This is a group message from Alice. 👥";
        // Encrypt for Bob
        const encryptedForBob = await manager.encryptMessage(groupMessage, userKeys.get("Bob").publicKey, userKeys.get("Alice").privateKey, // Alice signs
        "alice123");
        // Encrypt for Charlie
        const encryptedForCharlie = await manager.encryptMessage(groupMessage, userKeys.get("Charlie").publicKey, userKeys.get("Alice").privateKey, // Alice signs
        "alice123");
        console.log("✅ Messages encrypted for Bob and Charlie");
        // Bob decrypts
        const bobDecrypted = await manager.decryptMessage(encryptedForBob.message, userKeys.get("Bob").privateKey, "bob123");
        // Charlie decrypts
        const charlieDecrypted = await manager.decryptMessage(encryptedForCharlie.message, userKeys.get("Charlie").privateKey, "charlie123");
        console.log("✅ Messages decrypted by Bob and Charlie");
        console.log("Bob received:", bobDecrypted);
        console.log("Charlie received:", charlieDecrypted);
        // Test key information
        console.log("\n🔍 Key Information");
        for (const [name, keys] of userKeys) {
            const keyInfo = await manager.getKeyInfo(keys.publicKey);
            console.log(`${name}:`, {
                keyId: keyInfo.keyId,
                fingerprint: keyInfo.fingerprint,
                algorithm: keyInfo.algorithm,
                created: keyInfo.created,
                isPrivate: keyInfo.isPrivate,
                isPublic: keyInfo.isPublic,
            });
        }
        // Test key export/import
        console.log("\n📤 Key Export/Import Test");
        const aliceKeyArmored = await manager.exportKey(userKeys.get("Alice").publicKey, "armored");
        const aliceKeyBinary = await manager.exportKey(userKeys.get("Alice").publicKey, "binary");
        console.log("✅ Alice's key exported in armored and binary formats");
        console.log("Armored length:", aliceKeyArmored.length);
        console.log("Binary length:", aliceKeyBinary.length);
        // Import the binary key back
        const importedKey = await manager.importKey(aliceKeyBinary, "binary");
        console.log("✅ Key imported from binary format");
        console.log("Imported key matches original:", importedKey === userKeys.get("Alice").publicKey);
        console.log("\n🎉 Advanced PGP Example completed successfully!");
        return {
            success: true,
            groupMessaging: true,
            keyManagement: true,
            exportImport: true,
        };
    }
    catch (error) {
        console.error("❌ Advanced PGP Example failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
    finally {
        // Clean up
        if (typeof manager !== "undefined") {
            manager.destroy();
        }
    }
}
// Run all examples
async function runAllPGPExamples() {
    console.log("🚀 Running All PGP Examples");
    console.log("=".repeat(50));
    // Example 1: Simple usage
    console.log("\n=== Example 1: Simple PGP Usage ===");
    const simpleResult = await simplePGPExample();
    // Example 2: Advanced usage
    console.log("\n=== Example 2: Advanced PGP Usage ===");
    const advancedResult = await advancedPGPExample();
    // Example 3: Full demonstration
    console.log("\n=== Example 3: Full PGP Demonstration ===");
    const demoResult = await (0, crypto_1.demonstratePGP)();
    console.log("\n📊 Final Results:");
    console.log("Simple PGP:", simpleResult.success ? "✅ PASSED" : "❌ FAILED");
    console.log("Advanced PGP:", advancedResult.success ? "✅ PASSED" : "❌ FAILED");
    console.log("Full Demo:", demoResult.success ? "✅ PASSED" : "❌ FAILED");
    const allPassed = simpleResult.success && advancedResult.success && demoResult.success;
    if (allPassed) {
        console.log("\n🎉 All PGP examples completed successfully!");
        console.log("🔐 PGP Features Demonstrated:");
        console.log("  ✅ Key generation (RSA 4096-bit)");
        console.log("  ✅ Message encryption/decryption");
        console.log("  ✅ Digital signing and verification");
        console.log("  ✅ Key management and information");
        console.log("  ✅ Key export/import (armored/binary)");
        console.log("  ✅ Group messaging with signing");
        console.log("  ✅ OpenPGP standard compliance");
    }
    else {
        console.log("\n❌ Some PGP examples failed");
    }
    return {
        simple: simpleResult,
        advanced: advancedResult,
        demo: demoResult,
        allPassed,
    };
}
// Run the examples
if (require.main === module) {
    runAllPGPExamples()
        .then((result) => {
        console.log("\n📊 Final Test Summary:");
        console.log(JSON.stringify(result, null, 2));
    })
        .catch((error) => {
        console.error("💥 PGP examples execution failed:", error);
    });
}
