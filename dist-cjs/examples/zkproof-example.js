"use strict";
/**
 * Zero-Knowledge Proof Authentication Example
 *
 * This example demonstrates how to use the ZK-Proof plugin with Shogun Core
 * for privacy-preserving authentication using Semaphore protocol.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicExample = basicExample;
exports.deterministicExample = deterministicExample;
exports.proofExample = proofExample;
exports.multiDeviceExample = multiDeviceExample;
const index_1 = require("../index");
const core_1 = require("../core");
// Example 1: Basic ZK-Proof signup and login
async function basicExample() {
    console.log("=== Basic ZK-Proof Authentication Example ===\n");
    const gunInstance = (0, index_1.Gun)({
        peers: [
            "https://g3ru5bwxmezpuu3ktnoclbpiw4.srv.us/gun",
            "https://5eh4twk2f62autunsje4panime.srv.us/gun",
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    // Initialize Shogun with ZK-Proof plugin
    const shogun = new core_1.ShogunCore({
        gunInstance: gunInstance,
        zkproof: {
            enabled: true,
            defaultGroupId: "my-app-users",
        },
    });
    // Wait for plugin initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Get the ZK-Proof plugin
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin) {
        console.error("ZK-Proof plugin not available");
        return;
    }
    // SIGN UP - Generate new anonymous identity
    console.log("1. Creating new ZK identity...");
    const signupResult = await zkPlugin.signUp();
    if (signupResult.success) {
        console.log("✅ Signup successful!");
        console.log(`   Username (commitment): ${signupResult.username}`);
        console.log(`   User Public Key: ${signupResult.userPub?.slice(0, 16)}...`);
        console.log("\n⚠️  CRITICAL: Save this trapdoor for account recovery:");
        console.log(`   Trapdoor: ${signupResult.seedPhrase}\n`);
        // Simulate user saving the trapdoor
        const savedTrapdoor = signupResult.seedPhrase;
        // Logout
        shogun.logout();
        console.log("2. Logged out\n");
        // LOGIN - Authenticate with trapdoor
        console.log("3. Logging in with trapdoor...");
        const loginResult = await zkPlugin.login(savedTrapdoor);
        if (loginResult.success) {
            console.log("✅ Login successful!");
            console.log(`   Username: ${loginResult.username}`);
            console.log(`   User Public Key: ${loginResult.userPub?.slice(0, 16)}...`);
            console.log(`   Auth Method: ${loginResult.authMethod}`);
        }
        else {
            console.error("❌ Login failed:", loginResult.error);
        }
    }
    else {
        console.error("❌ Signup failed:", signupResult.error);
    }
}
// Example 2: Deterministic identity generation
async function deterministicExample() {
    console.log("\n=== Deterministic ZK Identity Example ===\n");
    const gunInstance = (0, index_1.Gun)({
        peers: [
            "https://lindanode.scobrudot.dev/gun",
            "https://shogunnode.scobrudot.dev/gun",
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    const shogun = new core_1.ShogunCore({
        gunInstance: gunInstance,
        zkproof: {
            enabled: true,
            deterministic: true,
        },
    });
    // Wait for plugin initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin) {
        console.error("ZK-Proof plugin not available");
        return;
    }
    // Use a seed for deterministic generation
    const seed = "my-secret-seed-phrase-12345";
    console.log("1. Creating identity from seed...");
    const signupResult = await zkPlugin.signUp(seed);
    if (signupResult.success) {
        console.log("✅ Identity created from seed");
        console.log(`   Commitment: ${signupResult.username}`);
        // With the same seed, you'll always get the same identity
        const identity2 = await zkPlugin.generateIdentity(seed);
        console.log("\n2. Regenerating from same seed...");
        console.log(`   Same commitment? ${identity2.commitment === signupResult.username?.replace("zk_", "")}`);
    }
}
// Example 3: Generate and verify ZK proofs
async function proofExample() {
    console.log("\n=== ZK Proof Generation & Verification Example ===\n");
    const gunInstance = (0, index_1.Gun)({
        peers: [
            "https://lindanode.scobrudot.dev/gun",
            "https://shogunnode.scobrudot.dev/gun",
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    const shogun = new core_1.ShogunCore({
        gunInstance: gunInstance,
        zkproof: {
            enabled: true,
            defaultGroupId: "proof-demo-group",
        },
    });
    // Wait for plugin initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin) {
        console.error("ZK-Proof plugin not available");
        return;
    }
    // Create identity
    console.log("1. Generating identity...");
    const identity = await zkPlugin.generateIdentity();
    console.log(`   Commitment: ${identity.commitment.slice(0, 16)}...`);
    // Add to group
    console.log("\n2. Adding to group...");
    zkPlugin.addToGroup(identity.commitment, "proof-demo-group");
    // Generate proof of membership
    console.log("\n3. Generating ZK proof...");
    const proof = await zkPlugin.generateProof(identity, {
        groupId: "proof-demo-group",
        message: "I am a member of this group",
        scope: "membership-verification",
    });
    console.log("   Proof generated!");
    console.log(`   Merkle root: ${proof.merkleTreeRoot.slice(0, 16)}...`);
    console.log(`   Nullifier hash: ${proof.nullifierHash.slice(0, 16)}...`);
    // Verify the proof
    console.log("\n4. Verifying proof...");
    const verificationResult = await zkPlugin.verifyProof(proof);
    if (verificationResult.verified) {
        console.log("✅ Proof verified successfully!");
        console.log("   User proved group membership without revealing identity");
    }
    else {
        console.error("❌ Proof verification failed");
    }
}
// Example 4: Multi-device scenario
async function multiDeviceExample() {
    console.log("\n=== Multi-Device ZK Authentication Example ===\n");
    // Device 1: Create account
    console.log("📱 DEVICE 1: Creating account...");
    const gunInstance1 = (0, index_1.Gun)({
        peers: [
            "https://lindanode.scobrudot.dev/gun",
            "https://shogunnode.scobrudot.dev/gun",
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    const shogun1 = new core_1.ShogunCore({
        gunInstance: gunInstance1,
        zkproof: { enabled: true },
    });
    // Wait for plugin initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin1 = shogun1.getPlugin("zkproof");
    const signupResult = await zkPlugin1.signUp();
    console.log("✅ Account created on Device 1");
    console.log(`   Commitment: ${signupResult.username}`);
    // User writes down the trapdoor
    const trapdoor = signupResult.seedPhrase;
    console.log(`\n📝 User writes down trapdoor: ${trapdoor.slice(0, 20)}...`);
    // Device 2: Import account
    console.log("\n💻 DEVICE 2: Importing account with trapdoor...");
    const gunInstance2 = (0, index_1.Gun)({
        peers: [
            "https://lindanode.scobrudot.dev/gun",
            "https://shogunnode.scobrudot.dev/gun",
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    const shogun2 = new core_1.ShogunCore({
        gunInstance: gunInstance2,
        zkproof: { enabled: true },
    });
    // Wait for plugin initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin2 = shogun2.getPlugin("zkproof");
    const loginResult = await zkPlugin2.login(trapdoor);
    if (loginResult.success) {
        console.log("✅ Successfully logged in on Device 2");
        console.log(`   Same user: ${loginResult.username === signupResult.username}`);
        console.log("\n🎉 Multi-device authentication working!");
    }
}
// Run examples
async function main() {
    try {
        // Run all examples
        await basicExample();
        await deterministicExample();
        // await proofExample(); // Requires ZK circuit files - see README for setup
        await multiDeviceExample();
        console.log("\n✨ All examples completed successfully!");
    }
    catch (error) {
        console.error("\n❌ Error running examples:", error);
    }
    process.exit(0);
}
// Run if executed directly
if (require.main === module) {
    main();
}
