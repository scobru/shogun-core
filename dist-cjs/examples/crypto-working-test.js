"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple crypto test that actually works
const crypto_1 = require("../crypto");
// Simple test function
async function testCrypto() {
    try {
        console.log("🔐 Starting crypto test...");
        // Test 1: Random string generation
        console.log("\n1. Testing random string generation...");
        const randomStr = (0, crypto_1.randomString)("test-");
        console.log("✅ Random string:", randomStr);
        // Test 2: Hashing
        console.log("\n2. Testing hashing...");
        const hash = await (0, crypto_1.sha256Hash)({
            message: "Hello Crypto!",
            timestamp: Date.now(),
        });
        console.log("✅ SHA-256 hash:", hash.substring(0, 20) + "...");
        // Test 3: RSA key generation and encryption
        console.log("\n3. Testing RSA encryption...");
        const keyPair = await (0, crypto_1.generateKeyPair)();
        console.log("✅ RSA key pair generated");
        const publicKey = await (0, crypto_1.deserializePublicKey)(keyPair.publicKey);
        const privateKey = await (0, crypto_1.deserializePrivateKey)(keyPair.privateKey);
        const encryptedMessage = await (0, crypto_1.encrypt)("Secret RSA message", publicKey);
        const decryptedMessage = await (0, crypto_1.decrypt)(encryptedMessage, privateKey);
        console.log("✅ RSA encrypted:", encryptedMessage.substring(0, 30) + "...");
        console.log("✅ RSA decrypted:", decryptedMessage);
        // Test 4: AES symmetric encryption
        console.log("\n4. Testing AES symmetric encryption...");
        const symmetricKey = await (0, crypto_1.generateSymmetricKey)();
        const deserializedKey = await (0, crypto_1.deserializeSymmetricKey)(symmetricKey);
        const encryptedData = await (0, crypto_1.encryptWithSymmetricKey)("Secret AES message", deserializedKey);
        const decryptedData = await (0, crypto_1.decryptWithSymmetricKey)(encryptedData, deserializedKey);
        console.log("✅ AES encrypted:", encryptedData.ciphertext.substring(0, 30) + "...");
        console.log("✅ AES decrypted:", decryptedData);
        // Test 5: File encryption
        console.log("\n5. Testing file encryption...");
        const fileContent = "This is a secret file content for testing!";
        const password = "testPassword123";
        const encryptedFile = await (0, crypto_1.encryptTextFile)(fileContent, password, "test.txt");
        const decryptedFile = await (0, crypto_1.decryptTextFile)(encryptedFile, password);
        console.log("✅ File encrypted:", encryptedFile.fileName);
        console.log("✅ File decrypted:", decryptedFile.textContent);
        console.log("\n🎉 All crypto tests completed successfully!");
        return {
            success: true,
            tests: {
                randomString: randomStr,
                hash: hash.substring(0, 20) + "...",
                rsaEncryption: {
                    encrypted: encryptedMessage.substring(0, 30) + "...",
                    decrypted: decryptedMessage,
                },
                aesEncryption: {
                    encrypted: encryptedData.ciphertext.substring(0, 30) + "...",
                    decrypted: decryptedData,
                },
                fileEncryption: {
                    fileName: encryptedFile.fileName,
                    decrypted: decryptedFile.textContent,
                },
            },
        };
    }
    catch (error) {
        console.error("❌ Crypto test failed:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
// Run the test
testCrypto()
    .then((result) => {
    console.log("\n📊 Final Result:");
    console.log(JSON.stringify(result, null, 2));
})
    .catch((error) => {
    console.error("💥 Test execution failed:", error);
});
