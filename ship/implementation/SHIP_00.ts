/**
 * SHIP-00: Decentralized Identity & Authentication Implementation
 *
 * Foundation layer for the Shogun ecosystem.
 * Provides identity and authentication services for all other SHIPs.
 *
 * Based on:
 * - Shogun Core API (see ../API.md)
 * - GunDB for P2P identity storage
 * - SEA for cryptographic operations
 * - shogun-derive for address derivation
 *
 * Features:
 * ✅ Username/password authentication
 * ✅ SEA key pair management
 * ✅ Public key publication and discovery
 * ✅ User registry and lookup
 * ✅ Blockchain address derivation
 * ✅ Multi-device support (export/import)
 */

import { ShogunCore } from "../../src/core";
import { ethers } from "ethers";
import type {
  ISHIP_00,
  SignupResult,
  AuthResult,
  OperationResult,
  SEAPair,
  UserIdentity,
  UserData,
  PublicKeyData,
} from "../interfaces/ISHIP_00";
import { ShogunCoreConfig } from "../../src/interfaces/shogun";
import derive from "../../src/gundb/derive";

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-00 Reference Implementation
 * 
 * Uses Shogun Core as the underlying implementation.
 * This class wraps Shogun Core APIs to provide the ISHIP_00 standard interface.
 */
class SHIP_00 implements ISHIP_00 {
  private shogun: ShogunCore;

  // GunDB Node Names for identity storage
  // Note: Most operations use ShogunCore API which manages nodes internally
  // These are reference names for direct Gun access when needed
  public static readonly NODES = {
    USERS: "users",           // User registry
    PUBLIC_KEYS: "publicKeys", // Public key directory
    REGISTRY: "registry",      // User alias → pub mapping
  } as const;

  constructor(shogunConfig: ShogunCoreConfig) {
    // Initialize Shogun Core with provided config
    this.shogun = new ShogunCore(shogunConfig) as ShogunCore;
  }

  // ========================================================================
  // AUTHENTICATION
  // ========================================================================

  /**
   * Register new user
   * Uses Shogun Core signUp method (see API.md)
   */
  async signup(username: string, password: string): Promise<SignupResult> {
    try {
      // Use Shogun Core signUp (API.md line 315-327)
      const signupResult = await this.shogun.signUp(username, password);

      if (!signupResult.success) {
        return {
          success: false,
          error: signupResult.error || "Signup failed",
        };
      }

      console.log("✅ User registered");
      console.log(`   Username: ${username}`);
      console.log(`   GunDB Public Key: ${signupResult.pub}`);

      // Derive Ethereum address using shogun-derive
      const derivedAddress = signupResult.pub
        ? await this.deriveEthereumAddress(signupResult.pub)
        : undefined;

      if (derivedAddress) {
        console.log(`   Derived Address: ${derivedAddress}`);
      }

      return {
        success: true,
        userPub: signupResult.pub,
        username: username,
        derivedAddress,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Login with username and password
   * Uses Shogun Core login method (see API.md)
   */
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      // Use Shogun Core login (API.md line 309-317)
      const loginResult = await this.shogun.login(username, password);

      if (!loginResult.success) {
        return {
          success: false,
          error: loginResult.error || "Login failed",
        };
      }

      console.log("✅ Login successful");
      console.log(`   Username: ${username}`);
      console.log(`   GunDB Public Key: ${loginResult.userPub}`);

      // Derive Ethereum address
      const derivedAddress = loginResult.userPub
        ? await this.deriveEthereumAddress(loginResult.userPub)
        : undefined;

      if (derivedAddress) {
        console.log(`   Derived Address: ${derivedAddress}`);
      }

      return {
        success: true,
        userPub: loginResult.userPub,
        username: username,
        derivedAddress,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Login with SEA Key Pair
   * Uses Shogun Core loginWithPair method (see API.md)
   */
  async loginWithPair(seaPair: SEAPair): Promise<AuthResult> {
    try {
      console.log("🔐 Login with key pair...");

      // Use Shogun Core loginWithPair (API.md line 324)
      const authResult = await this.shogun.loginWithPair(seaPair);

      if (!authResult.success) {
        console.log("❌ Login failed:", authResult.error);
        return {
          success: false,
          error: authResult.error || "Login with pair failed",
        };
      }

      // Derive Ethereum address
      const derivedAddress = await this.deriveEthereumAddress(seaPair.pub);

      console.log("✅ Login successful");
      console.log(`   GunDB Public Key: ${seaPair.pub}`);
      console.log(`   Derived Address: ${derivedAddress}`);

      return {
        success: true,
        userPub: authResult.userPub,
        username: authResult.username,
        derivedAddress,
      };
    } catch (error) {
      console.error("❌ Error login with pair:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Logout
   * Uses Shogun Core logout method (see API.md line 325)
   */
  logout(): void {
    this.shogun.logout();
    console.log("👋 Logout successful");
  }

  /**
   * Check if user is logged in
   * Uses Shogun Core isLoggedIn method (see API.md line 326)
   */
  isLoggedIn(): boolean {
    return this.shogun.isLoggedIn();
  }

  // ========================================================================
  // CORE ACCESS
  // ========================================================================

  /**
   * Get underlying ShogunCore instance
   * Provides access to Gun, SEA, and crypto utilities
   */
  getShogun(): any {
    return this.shogun;
  }

  // ========================================================================
  // KEY MANAGEMENT
  // ========================================================================

  /**
   * Publish public key on GunDB
   * Makes user's public key discoverable by others
   */
  async publishPublicKey(): Promise<OperationResult> {
    try {
      if (!this.isLoggedIn()) {
        return { success: false, error: "Not logged in" };
      }

      // Get current user from DataBase (API.md line 374)
      const currentUser = this.shogun.db.user;
      if (!currentUser || !currentUser.is) {
        return { success: false, error: "No user session" };
      }

      const userPub = currentUser.is.pub;

      // Save public key to GunDB for discovery
      // Using Gun operations (API.md line 399-406)
      await this.shogun.db.gun
        .get(userPub)
        .put({
          pub: currentUser.is.pub,
          epub: currentUser.is.epub,
          algorithm: "ECDSA",
          timestamp: Date.now().toString(),
        })
        .then();

      console.log(`📝 Public key published on GunDB`);

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error publishing key:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export current user's SEA key pair
   * For backup and multi-device usage
   * Uses Shogun Core exportPair method (see API.md line 354)
   */
  exportKeyPair(): SEAPair | null {
    try {
      if (!this.isLoggedIn()) {
        console.warn("Cannot export key pair: user not logged in");
        return null;
      }

      // Access SEA pair from Gun user node
      const seaPair = (this.shogun.db.gun.user() as any)?._?.sea;
      
      if (!seaPair) {
        console.warn("Cannot access SEA pair");
        return null;
      }

      return {
        pub: seaPair.pub,
        priv: seaPair.priv,
        epub: seaPair.epub,
        epriv: seaPair.epriv,
      };
    } catch (error) {
      console.error("❌ Error exporting key pair:", error);
      return null;
    }
  }

  /**
   * Get current user's key pair
   * Alias for exportKeyPair()
   */
  getKeyPair(): SEAPair | null {
    return this.exportKeyPair();
  }

  // ========================================================================
  // USER DISCOVERY
  // ========================================================================

  /**
   * Get user information by username
   * Uses Shogun Core getUserByAlias method (see API.md line 1141-1148)
   */
  async getUserByAlias(username: string): Promise<UserData | null> {
    try {
      // Use DataBase getUserByAlias (API.md line 1141)
      const userData = await this.shogun.db.getUserByAlias(username);
      
      if (!userData) {
        return null;
      }

      return {
        userPub: userData.userPub || "",
        username: userData.username,
        epub: userData.epub || "",
        registeredAt: userData.registeredAt,
        lastSeen: userData.lastSeen,
      };
    } catch (error) {
      console.error("❌ Error getting user by alias:", error);
      return null;
    }
  }

  /**
   * Get user information by public key
   * Uses Shogun Core getUserDataByPub method (see API.md line 1150-1152)
   */
  async getUserByPub(userPub: string): Promise<UserData | null> {
    try {
      const userData = await this.shogun.db.getUserDataByPub(userPub);
      
      if (!userData) {
        return null;
      }

      return {
        userPub: userPub,
        username: userData.username,
        epub: userData.epub || "",
        registeredAt: userData.registeredAt,
        lastSeen: userData.lastSeen,
      };
    } catch (error) {
      console.error("❌ Error getting user by pub:", error);
      return null;
    }
  }

  /**
   * Check if user exists
   * Uses SimpleGunAPI userExists method (see API.md line 188)
   */
  async userExists(username: string): Promise<boolean> {
    try {
      const userData = await this.getUserByAlias(username);
      return userData !== null;
    } catch (error) {
      console.error("❌ Error checking user existence:", error);
      return false;
    }
  }

  /**
   * Get public key by username
   */
  async getPublicKey(username: string): Promise<PublicKeyData | null> {
    try {
      // Get user data first
      const userData = await this.getUserByAlias(username);
      
      if (!userData || !userData.userPub) {
        console.error(`❌ User ${username} not found`);
        return null;
      }

      const userPub = userData.userPub;

      // Get published public key data
      const publicKeyData = await this.shogun.db.gun.get(userPub).then();

      if (publicKeyData && publicKeyData.epub && publicKeyData.pub) {
        return {
          pub: publicKeyData.pub,
          epub: publicKeyData.epub,
          algorithm: publicKeyData.algorithm,
          timestamp: publicKeyData.timestamp,
        };
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting public key:", error);
      return null;
    }
  }

  // ========================================================================
  // IDENTITY
  // ========================================================================

  /**
   * Get current authenticated user info
   * Uses Shogun Core getCurrentUser method (see API.md line 429)
   */
  getCurrentUser(): UserIdentity | null {
    try {
      if (!this.isLoggedIn()) {
        return null;
      }

      // Use DataBase getCurrentUser (API.md line 429)
      const currentUser = this.shogun.db.getCurrentUser();
      
      if (!currentUser) {
        return null;
      }

      return {
        pub: currentUser.pub,
        alias: currentUser.alias,
        epub: currentUser.epub,
      };
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      return null;
    }
  }

  /**
   * Derive Ethereum address from SEA keypair
   * Uses shogun-derive package for deterministic derivation
   */
  async deriveEthereumAddress(publicKey?: string): Promise<string> {
    try {
      // Get SEA pair
      const seaPair = (this.shogun.db.gun.user() as any)?._?.sea;
      if (!seaPair || !seaPair.priv) {
        throw new Error("Cannot access SEA pair");
      }

      // Use shogun-derive for deterministic address derivation
      const derived = await derive(seaPair.priv, null, {
        includeSecp256k1Ethereum: true,
        includeP256: false,
        includeSecp256k1Bitcoin: false,
      });

      return derived.secp256k1Ethereum.address;
    } catch (error) {
      console.error("❌ Error deriving address:", error);
      // Fallback: hash of public key
      const fallbackKey = publicKey || "unknown";
      const hash = ethers.keccak256(ethers.toUtf8Bytes(fallbackKey));
      return ethers.getAddress("0x" + hash.slice(-40));
    }
  }
}

// ============================================================================
// EXAMPLE & TESTING
// ============================================================================

/**
 * Example usage of SHIP-00
 */
async function exampleUsage() {
  console.log("🧪 SHIP-00 Example: Identity Management\n");
  console.log("=".repeat(60));

  // Initialize
  const identity = new SHIP_00({
    gunOptions: {
      peers: ["https://peer.wallie.io/gun"],
      radisk: true,
    },
  });

  // Signup
  console.log("\n📝 SIGNUP");
  console.log("-".repeat(60));
  const signupResult = await identity.signup("alice", "password123");
  
  if (signupResult.success) {
    console.log("✅ Signup successful");
    console.log(`   Username: ${signupResult.username}`);
    console.log(`   Public Key: ${signupResult.userPub?.substring(0, 40)}...`);
    console.log(`   Ethereum Address: ${signupResult.derivedAddress}`);
  }

  // Publish public key
  console.log("\n📢 PUBLISH PUBLIC KEY");
  console.log("-".repeat(60));
  await identity.publishPublicKey();

  // Export key pair
  console.log("\n💾 EXPORT KEY PAIR");
  console.log("-".repeat(60));
  const keyPair = identity.exportKeyPair();
  if (keyPair) {
    const backup = Buffer.from(JSON.stringify(keyPair)).toString('base64');
    console.log("✅ Key pair exported (base64)");
    console.log(`   Length: ${backup.length} characters`);
  }

  // Current user
  console.log("\n👤 CURRENT USER");
  console.log("-".repeat(60));
  const currentUser = identity.getCurrentUser();
  console.log("Current user:", currentUser?.alias);
  console.log("Public key:", currentUser?.pub.substring(0, 40) + "...");

  // User discovery
  console.log("\n🔍 USER DISCOVERY");
  console.log("-".repeat(60));
  const exists = await identity.userExists("alice");
  console.log("Alice exists:", exists);

  const aliceData = await identity.getUserByAlias("alice");
  console.log("Alice data:", aliceData?.username);

  // Logout
  console.log("\n👋 LOGOUT");
  console.log("-".repeat(60));
  identity.logout();
  console.log("Logged out successfully");

  console.log("\n" + "=".repeat(60));
  console.log("✅ SHIP-00 Example Complete!\n");
}

// Run example if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { SHIP_00 };

