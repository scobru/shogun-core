// Random Generation test
import {
  generateRandomString,
  randomBytes,
  randomInt,
  randomFloat,
  randomBool,
  randomUUID,
  createDeterministicRandom,
  chance,
  randomChoice,
  randomShuffle,
  randomColor,
  randomPassword,
  randomSeedPhrase,
} from "../crypto";

// Test Random Generation
async function testRandomGeneration() {
  try {
    console.log("🎲 Starting Random Generation test...");

    // Test 1: Basic random string generation
    console.log("\n1. Testing basic random string generation...");
    const randomStr = generateRandomString(16, "test-");
    console.log("✅ Random string:", randomStr);

    // Test 2: Random bytes
    console.log("\n2. Testing random bytes...");
    const bytes = randomBytes(8);
    console.log(
      "✅ Random bytes:",
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );

    // Test 3: Random integer
    console.log("\n3. Testing random integer...");
    const randomNum = randomInt(1, 100);
    console.log("✅ Random integer (1-100):", randomNum);

    // Test 4: Random float
    console.log("\n4. Testing random float...");
    const randomFloatVal = randomFloat();
    console.log("✅ Random float:", randomFloatVal);

    // Test 5: Random boolean
    console.log("\n5. Testing random boolean...");
    const randomBoolVal = randomBool();
    console.log("✅ Random boolean:", randomBoolVal);

    // Test 6: Random UUID
    console.log("\n6. Testing random UUID...");
    const uuid = randomUUID();
    console.log("✅ Random UUID:", uuid);

    // Test 7: Deterministic random
    console.log("\n7. Testing deterministic random...");
    const detRandom = createDeterministicRandom("test-seed");
    const detInt1 = detRandom.integer(1, 100);
    const detInt2 = detRandom.integer(1, 100);
    const detFloat = detRandom.floating(0, 1, 4);
    const detBool = detRandom.bool();
    const detString = detRandom.string(10);
    const detGuid = detRandom.guid();

    console.log("✅ Deterministic integer 1:", detInt1);
    console.log("✅ Deterministic integer 2:", detInt2);
    console.log("✅ Deterministic float:", detFloat);
    console.log("✅ Deterministic boolean:", detBool);
    console.log("✅ Deterministic string:", detString);
    console.log("✅ Deterministic GUID:", detGuid);

    // Test 8: Chance.js compatibility
    console.log("\n8. Testing Chance.js compatibility...");
    const chanceInstance = chance("chance-seed");
    const chanceInt = chanceInstance.integer(1, 50);
    const chanceFloat = chanceInstance.floating(0, 10, 2);
    const chanceBool = chanceInstance.bool();

    console.log("✅ Chance integer:", chanceInt);
    console.log("✅ Chance float:", chanceFloat);
    console.log("✅ Chance boolean:", chanceBool);

    // Test 9: Array utilities
    console.log("\n9. Testing array utilities...");
    const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const choice = randomChoice(testArray);
    const shuffled = randomShuffle(testArray);

    console.log("✅ Random choice from array:", choice);
    console.log("✅ Shuffled array:", shuffled);

    // Test 10: Random color
    console.log("\n10. Testing random color...");
    const color = randomColor();
    console.log("✅ Random color:", color);

    // Test 11: Random password
    console.log("\n11. Testing random password...");
    const password = randomPassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
    });
    console.log("✅ Random password:", password);

    // Test 12: Random seed phrase
    console.log("\n12. Testing random seed phrase...");
    const seedPhrase = randomSeedPhrase(12);
    console.log("✅ Random seed phrase:", seedPhrase.join(" "));

    // Test 13: Deterministic consistency
    console.log("\n13. Testing deterministic consistency...");
    const det1 = createDeterministicRandom("consistency-test");
    const det2 = createDeterministicRandom("consistency-test");

    const val1_1 = det1.integer(1, 100);
    const val1_2 = det1.integer(1, 100);
    const val2_1 = det2.integer(1, 100);
    const val2_2 = det2.integer(1, 100);

    console.log("✅ Deterministic consistency test:");
    console.log(
      "  Same seed, first value:",
      val1_1 === val2_1 ? "✅ MATCH" : "❌ MISMATCH",
    );
    console.log(
      "  Same seed, second value:",
      val1_2 === val2_2 ? "✅ MATCH" : "❌ MISMATCH",
    );

    console.log("\n🎉 All Random Generation tests completed successfully!");

    return {
      success: true,
      tests: {
        randomString: randomStr,
        randomBytes: Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        randomInt: randomNum,
        randomFloat: randomFloatVal,
        randomBool: randomBoolVal,
        randomUUID: uuid,
        deterministic: {
          int1: detInt1,
          int2: detInt2,
          float: detFloat,
          bool: detBool,
          string: detString,
          guid: detGuid,
        },
        chance: {
          int: chanceInt,
          float: chanceFloat,
          bool: chanceBool,
        },
        arrayUtils: {
          choice,
          shuffledLength: shuffled.length,
        },
        color,
        password,
        seedPhrase: seedPhrase.join(" "),
        consistency: {
          firstMatch: val1_1 === val2_1,
          secondMatch: val1_2 === val2_2,
        },
      },
    };
  } catch (error) {
    console.error("❌ Random Generation test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run the test
testRandomGeneration()
  .then((result) => {
    console.log("\n📊 Final Result:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("💥 Test execution failed:", error);
  });
