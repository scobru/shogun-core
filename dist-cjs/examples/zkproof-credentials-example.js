"use strict";
/**
 * ZK-Proof Verifiable Credentials Example
 *
 * This demonstrates how to use ZK-Proof for proving attributes
 * about documents and identity without revealing sensitive data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageVerificationExample = ageVerificationExample;
exports.citizenshipExample = citizenshipExample;
exports.educationExample = educationExample;
exports.incomeExample = incomeExample;
exports.customCredentialExample = customCredentialExample;
const index_1 = require("../index");
const core_1 = require("../core");
const zkCredentials_1 = require("../plugins/zkproof/zkCredentials");
const identity_1 = require("@semaphore-protocol/identity");
// Example 1: Age Verification
async function ageVerificationExample() {
    console.log("=== Age Verification Example ===\n");
    const peers = [
        "https://g3ru5bwxmezpuu3ktnoclbpiw4.srv.us/gun",
        "https://5eh4twk2f62autunsje4panime.srv.us/gun",
    ];
    const shogun = new core_1.ShogunCore({
        gunInstance: (0, index_1.Gun)({ peers: peers }),
        zkproof: { enabled: true },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin)
        return;
    // Create ZK identity
    const identity = await zkPlugin.generateIdentity();
    const semaphoreIdentity = new identity_1.Identity(identity.trapdoor);
    // Create credentials manager
    const zkCreds = new zkCredentials_1.ZkCredentials();
    console.log("Scenario: User wants to prove they're 18+ without revealing birthdate\n");
    // User's actual birthdate (PRIVATE)
    const birthDate = new Date("1990-05-15");
    const actualAge = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    console.log(`Private data (NOT revealed):`);
    console.log(`  Birth date: ${birthDate.toDateString()}`);
    console.log(`  Actual age: ${actualAge}\n`);
    try {
        // Generate proof that age >= 18 WITHOUT revealing exact age
        const ageProof = await zkCreds.proveAge(semaphoreIdentity, birthDate, 18);
        console.log(`Public proof generated:`);
        console.log(`  Claim: "${ageProof.claim}"`);
        console.log(`  Type: ${ageProof.type}`);
        console.log(`  ✅ Birth date NOT revealed!`);
        console.log(`  ✅ Exact age NOT revealed!`);
        // Anyone can verify the proof
        const verification = await zkCreds.verifyCredential(ageProof);
        console.log(`\nVerification result: ${verification.verified ? "✅ VALID" : "❌ INVALID"}`);
    }
    catch (error) {
        console.log(`Note: Full proof generation requires circuit files`);
        console.log(`Run: yarn setup:zkproof`);
    }
}
// Example 2: Citizenship Verification
async function citizenshipExample() {
    console.log("\n=== Citizenship Verification Example ===\n");
    const shogun = new core_1.ShogunCore({
        gunInstance: (0, index_1.Gun)({ peers: ["https://peer.wallie.io/gun"] }),
        zkproof: { enabled: true },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin)
        return;
    const identity = await zkPlugin.generateIdentity();
    const semaphoreIdentity = new identity_1.Identity(identity.trapdoor);
    const zkCreds = new zkCredentials_1.ZkCredentials();
    console.log("Scenario: Prove EU citizenship without revealing country\n");
    console.log(`Private data (NOT revealed):`);
    console.log(`  Country: Italy`);
    console.log(`  Passport: IT123456789\n`);
    try {
        const citizenshipProof = await zkCreds.proveCitizenship(semaphoreIdentity, "Italy", "EU");
        console.log(`Public proof:`);
        console.log(`  Claim: "${citizenshipProof.claim}"`);
        console.log(`  ✅ Specific country NOT revealed!`);
        console.log(`  ✅ Passport number NOT revealed!`);
    }
    catch (error) {
        console.log(`Note: Full proof requires circuit files`);
    }
}
// Example 3: Education Credentials
async function educationExample() {
    console.log("\n=== Education Credential Example ===\n");
    const shogun = new core_1.ShogunCore({
        gunInstance: (0, index_1.Gun)({ peers: ["https://peer.wallie.io/gun"] }),
        zkproof: { enabled: true },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin)
        return;
    const identity = await zkPlugin.generateIdentity();
    const semaphoreIdentity = new identity_1.Identity(identity.trapdoor);
    const zkCreds = new zkCredentials_1.ZkCredentials();
    console.log("Scenario: Prove you have a degree without revealing details\n");
    console.log(`Private data (NOT revealed):`);
    console.log(`  University: MIT`);
    console.log(`  Degree: Computer Science`);
    console.log(`  Year: 2020`);
    console.log(`  Grade: 110/110\n`);
    try {
        const eduProof = await zkCreds.proveEducation(semaphoreIdentity, "Bachelor of Science", "MIT", 2020);
        console.log(`Public proof:`);
        console.log(`  Claim: "${eduProof.claim}"`);
        console.log(`  ✅ University name NOT revealed!`);
        console.log(`  ✅ Grades NOT revealed!`);
        console.log(`  ✅ Only proves you HAVE the degree`);
    }
    catch (error) {
        console.log(`Note: Full proof requires circuit files`);
    }
}
// Example 4: Income Verification
async function incomeExample() {
    console.log("\n=== Income Verification Example ===\n");
    const shogun = new core_1.ShogunCore({
        gunInstance: (0, index_1.Gun)({ peers: ["https://peer.wallie.io/gun"] }),
        zkproof: { enabled: true },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin)
        return;
    const identity = await zkPlugin.generateIdentity();
    const semaphoreIdentity = new identity_1.Identity(identity.trapdoor);
    const zkCreds = new zkCredentials_1.ZkCredentials();
    console.log("Scenario: Apply for loan proving income > 50k without revealing exact salary\n");
    console.log(`Private data (NOT revealed):`);
    console.log(`  Actual salary: 75,000 EUR`);
    console.log(`  Employer: Tech Company XYZ\n`);
    try {
        const incomeProof = await zkCreds.proveIncome(semaphoreIdentity, 75000, 50000, "EUR");
        console.log(`Public proof sent to bank:`);
        console.log(`  Claim: "${incomeProof.claim}"`);
        console.log(`  ✅ Exact salary NOT revealed!`);
        console.log(`  ✅ Only proves income >= 50,000 EUR`);
        console.log(`\n  Bank sees: "This person earns at least 50k"`);
        console.log(`  Bank does NOT see: Actual amount or employer`);
    }
    catch (error) {
        console.log(`Note: Full proof requires circuit files`);
    }
}
// Example 5: Custom Credential
async function customCredentialExample() {
    console.log("\n=== Custom Credential Example ===\n");
    const shogun = new core_1.ShogunCore({
        gunInstance: (0, index_1.Gun)({ peers: ["https://peer.wallie.io/gun"] }),
        zkproof: { enabled: true },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const zkPlugin = shogun.getPlugin("zkproof");
    if (!zkPlugin)
        return;
    const identity = await zkPlugin.generateIdentity();
    const semaphoreIdentity = new identity_1.Identity(identity.trapdoor);
    const zkCreds = new zkCredentials_1.ZkCredentials();
    console.log("Scenario: Prove you're a verified developer without revealing GitHub profile\n");
    console.log(`Private data (NOT revealed):`);
    console.log(`  GitHub: @johndoe`);
    console.log(`  Repositories: 150`);
    console.log(`  Stars: 5,234`);
    console.log(`  Years active: 8\n`);
    try {
        const devProof = await zkCreds.proveAttribute(semaphoreIdentity, {
            type: zkCredentials_1.CredentialType.CUSTOM,
            claim: "Verified GitHub developer with 5+ years experience",
            privateData: {
                githubUsername: "johndoe",
                repositories: 150,
                stars: 5234,
                yearsActive: 8,
                verified: true,
            },
        });
        console.log(`Public proof:`);
        console.log(`  Claim: "${devProof.claim}"`);
        console.log(`  ✅ GitHub username NOT revealed!`);
        console.log(`  ✅ Exact stats NOT revealed!`);
        console.log(`  ✅ Privacy-preserving reputation proof`);
    }
    catch (error) {
        console.log(`Note: Full proof requires circuit files`);
    }
}
// Run all examples
async function main() {
    console.log("🔐 ZK-Proof Verifiable Credentials Examples");
    console.log("==========================================\n");
    try {
        await ageVerificationExample();
        await citizenshipExample();
        await educationExample();
        await incomeExample();
        await customCredentialExample();
        console.log("\n✨ All credential examples completed!");
        console.log("\nℹ️  Note: These examples show the credential structure.");
        console.log("   For full ZK proof generation, run: yarn setup:zkproof");
    }
    catch (error) {
        console.error("\n❌ Error:", error);
    }
    process.exit(0);
}
if (require.main === module) {
    main();
}
