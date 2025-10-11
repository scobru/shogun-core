/**
 * SHIP-00 Test Suite
 * 
 * Tests for Decentralized Identity & Authentication
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import type { AuthResult, SignupResult } from "../interfaces/ISHIP_00";

// Mock configuration
const TEST_CONFIG = {
  gunOptions: {
    peers: ["http://localhost:8765/gun"], // Local test peer
    radisk: false,
    localStorage: false,
  },
};

describe("SHIP-00: Decentralized Identity & Authentication", () => {
  let identity: SHIP_00;

  beforeEach(() => {
    identity = new SHIP_00(TEST_CONFIG);
  });

  afterEach(() => {
    if (identity.isLoggedIn()) {
      identity.logout();
    }
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe("Authentication", () => {
    test("should signup a new user", async () => {
      const username = `test_user_${Date.now()}`;
      const result: SignupResult = await identity.signup(username, "password123");

      expect(result.success).toBe(true);
      expect(result.userPub).toBeDefined();
      expect(result.username).toBe(username);
      expect(result.derivedAddress).toBeDefined();
      expect(result.derivedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }, 15000);

    test("should login with correct credentials", async () => {
      const username = `test_user_${Date.now()}`;
      
      // First signup
      await identity.signup(username, "password123");
      identity.logout();

      // Then login
      const result: AuthResult = await identity.login(username, "password123");

      expect(result.success).toBe(true);
      expect(result.userPub).toBeDefined();
      expect(result.username).toBe(username);
      expect(result.derivedAddress).toBeDefined();
    }, 15000);

    test("should fail login with wrong password", async () => {
      const username = `test_user_${Date.now()}`;
      
      await identity.signup(username, "correct_password");
      identity.logout();

      const result = await identity.login(username, "wrong_password");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 15000);

    test("should logout successfully", async () => {
      const username = `test_user_${Date.now()}`;
      
      await identity.signup(username, "password123");
      expect(identity.isLoggedIn()).toBe(true);

      identity.logout();
      expect(identity.isLoggedIn()).toBe(false);
    }, 15000);

    test("should check if user is logged in", async () => {
      expect(identity.isLoggedIn()).toBe(false);

      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      expect(identity.isLoggedIn()).toBe(true);
    }, 15000);
  });

  // ==========================================================================
  // KEY MANAGEMENT TESTS
  // ==========================================================================

  describe("Key Management", () => {
    test("should publish public key", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const result = await identity.publishPublicKey();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    }, 15000);

    test("should export key pair", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const keyPair = identity.exportKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair).toHaveProperty("pub");
      expect(keyPair).toHaveProperty("priv");
      expect(keyPair).toHaveProperty("epub");
      expect(keyPair).toHaveProperty("epriv");
    }, 15000);

    test("should return null when exporting key pair without login", () => {
      const keyPair = identity.exportKeyPair();

      expect(keyPair).toBeNull();
    });

    test("should get key pair", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const keyPair = identity.getKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair).toHaveProperty("pub");
      expect(keyPair).toHaveProperty("priv");
    }, 15000);

    test("should login with key pair", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      // Export key pair
      const keyPair = identity.exportKeyPair();
      expect(keyPair).toBeDefined();

      // Logout
      identity.logout();
      expect(identity.isLoggedIn()).toBe(false);

      // Login with key pair
      if (keyPair) {
        const result = await identity.loginWithPair(keyPair);

        expect(result.success).toBe(true);
        expect(result.userPub).toBe(keyPair.pub);
        expect(identity.isLoggedIn()).toBe(true);
      }
    }, 15000);
  });

  // ==========================================================================
  // USER DISCOVERY TESTS
  // ==========================================================================

  describe("User Discovery", () => {
    test("should get user by alias", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");
      await identity.publishPublicKey();

      // Wait for publication
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userData = await identity.getUserByAlias(username);

      expect(userData).toBeDefined();
      expect(userData?.username).toBe(username);
      expect(userData?.userPub).toBeDefined();
    }, 20000);

    test("should return null for non-existent user", async () => {
      const userData = await identity.getUserByAlias("non_existent_user_12345");

      expect(userData).toBeNull();
    }, 10000);

    test("should check if user exists", async () => {
      const username = `test_user_${Date.now()}`;
      
      // User doesn't exist yet
      let exists = await identity.userExists(username);
      expect(exists).toBe(false);

      // Create user
      await identity.signup(username, "password123");

      // User now exists
      exists = await identity.userExists(username);
      expect(exists).toBe(true);
    }, 15000);

    test("should get public key by username", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");
      await identity.publishPublicKey();

      // Wait for publication
      await new Promise(resolve => setTimeout(resolve, 1000));

      const publicKey = await identity.getPublicKey(username);

      expect(publicKey).toBeDefined();
      expect(publicKey?.pub).toBeDefined();
      expect(publicKey?.epub).toBeDefined();
    }, 20000);
  });

  // ==========================================================================
  // IDENTITY TESTS
  // ==========================================================================

  describe("Identity", () => {
    test("should get current user", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const currentUser = identity.getCurrentUser();

      expect(currentUser).toBeDefined();
      expect(currentUser?.alias).toBe(username);
      expect(currentUser?.pub).toBeDefined();
      expect(currentUser?.epub).toBeDefined();
    }, 15000);

    test("should return null when no user is logged in", () => {
      const currentUser = identity.getCurrentUser();

      expect(currentUser).toBeNull();
    });

    test("should derive Ethereum address", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const address = await identity.deriveEthereumAddress();

      expect(address).toBeDefined();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }, 15000);

    test("should derive consistent Ethereum address", async () => {
      const username = `test_user_${Date.now()}`;
      await identity.signup(username, "password123");

      const address1 = await identity.deriveEthereumAddress();
      const address2 = await identity.deriveEthereumAddress();

      expect(address1).toBe(address2);
    }, 15000);
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe("Integration", () => {
    test("complete signup → publish → discover flow", async () => {
      // Create two users
      const alice = new SHIP_00(TEST_CONFIG);
      const bob = new SHIP_00(TEST_CONFIG);

      // Alice signs up and publishes key
      await alice.signup("alice_test", "password123");
      await alice.publishPublicKey();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Bob signs up
      await bob.signup("bob_test", "password456");

      // Bob discovers Alice
      const aliceData = await bob.getUserByAlias("alice_test");
      expect(aliceData).toBeDefined();
      expect(aliceData?.username).toBe("alice_test");

      // Bob gets Alice's public key
      const aliceKey = await bob.getPublicKey("alice_test");
      expect(aliceKey).toBeDefined();
      expect(aliceKey?.epub).toBeDefined();

      // Cleanup
      alice.logout();
      bob.logout();
    }, 25000);

    test("identity backup and restore flow", async () => {
      const username = `test_user_${Date.now()}`;
      
      // Create and authenticate user
      await identity.signup(username, "password123");
      const originalAddress = await identity.deriveEthereumAddress();

      // Export identity
      const backup = identity.exportKeyPair();
      expect(backup).toBeDefined();

      // Logout
      identity.logout();
      expect(identity.isLoggedIn()).toBe(false);

      // Restore from backup
      if (backup) {
        const result = await identity.loginWithPair(backup);
        expect(result.success).toBe(true);

        // Verify same identity
        const restoredAddress = await identity.deriveEthereumAddress();
        expect(restoredAddress).toBe(originalAddress);
      }
    }, 20000);
  });
});

