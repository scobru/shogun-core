#!/usr/bin/env tsx
/**
 * SHIP-00 Identity CLI Example
 *
 * Interactive CLI demonstrating SHIP-00 identity and authentication
 *
 * Usage:
 *   yarn identity <username> <password>
 *
 * Features:
 * - User signup and login
 * - Login with keypair (multi-device)
 * - Public key publication
 * - User discovery and lookup
 * - Key pair export/import
 * - Ethereum address derivation
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import * as readline from "readline";
import * as fs from "fs";

// ============================================================================
// CLI Interface
// ============================================================================

class IdentityCLI {
  private identity: SHIP_00;
  private rl: readline.Interface;
  private username: string = "";
  private running: boolean = false;

  constructor() {
    // Initialize SHIP-00 with hardcoded peers
    this.identity = new SHIP_00({
      gunOptions: {
        peers: [
          "https://peer.wallie.io/gun",
          "https://v5g5jseqhgkp43lppgregcfbvi.srv.us/gun",
          "https://relay.shogun-eco.xyz/gun",
        ],
        radisk: true,
        localStorage: false,
      },
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  async login(username: string, password: string): Promise<boolean> {
    console.log(`\n🔐 Logging in as ${username}...`);

    try {
      // Try login first
      let result = await this.identity.login(username, password);

      if (!result.success) {
        // If login fails, offer to register
        console.log("📝 User not found, creating new identity...");
        const signupResult = await this.identity.signup(username, password);

        if (!signupResult.success) {
          console.error(`❌ Registration failed: ${signupResult.error}`);
          return false;
        }

        // Login after signup
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await this.identity.login(username, password);
      }

      if (result.success) {
        this.username = username;

        console.log("\n✅ Authentication Successful!");
        console.log("━".repeat(60));
        console.log(`  Username:        ${username}`);
        console.log(`  Public Key:      ${result.userPub?.substring(0, 40)}...`);
        console.log(`  Derived Address: ${result.derivedAddress}`);
        console.log("━".repeat(60));

        // Publish public key for discovery
        console.log("\n📢 Publishing public key to network...");
        await this.identity.publishPublicKey();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("✅ Public key published!");

        return true;
      } else {
        console.error(`❌ Login failed: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }
  }

  async loginWithKeypair(): Promise<void> {
    console.log("\n🔑 Login with Key Pair");
    console.log("━".repeat(60));

    const keypairStr = await this.prompt(
      "Enter key pair (base64 or JSON): "
    );

    try {
      let seaPair;

      // Try base64 decode
      try {
        const decoded = Buffer.from(keypairStr.trim(), "base64").toString("utf-8");
        seaPair = JSON.parse(decoded);
      } catch {
        // Try direct JSON parse
        seaPair = JSON.parse(keypairStr.trim());
      }

      // Validate keypair
      if (!seaPair.pub || !seaPair.priv || !seaPair.epub || !seaPair.epriv) {
        throw new Error("Invalid keypair structure");
      }

      console.log("\n🔐 Authenticating with keypair...");
      const result = await this.identity.loginWithPair(seaPair);

      if (result.success) {
        this.username = result.username || seaPair.alias || "unknown";

        console.log("\n✅ Login Successful!");
        console.log("━".repeat(60));
        console.log(`  Username:        ${this.username}`);
        console.log(`  Public Key:      ${seaPair.pub.substring(0, 40)}...`);
        console.log(`  Derived Address: ${result.derivedAddress}`);
        console.log("━".repeat(60));

        // Publish public key
        await this.identity.publishPublicKey();
        console.log("✅ Public key published!");
      } else {
        console.error(`❌ Login failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  // ==========================================================================
  // Key Management
  // ==========================================================================

  async exportKeypair(): Promise<void> {
    console.log("\n📤 Export Key Pair");
    console.log("━".repeat(60));

    const keypair = this.identity.exportKeyPair();

    if (!keypair) {
      console.error("❌ Not logged in");
      return;
    }

    // Create export object
    const exportData = {
      ...keypair,
      alias: this.username,
      exportedAt: Date.now(),
    };

    // Base64 encode
    const jsonString = JSON.stringify(exportData);
    const base64 = Buffer.from(jsonString).toString("base64");

    console.log("\n✅ KEY PAIR EXPORTED");
    console.log("═".repeat(60));
    console.log("\n🔑 Base64 Format:");
    console.log(base64);
    console.log("\n🔑 JSON Format:");
    console.log(JSON.stringify(exportData, null, 2));
    console.log("\n═".repeat(60));

    // Save to file
    const filename = `shogun-identity-${this.username}-${Date.now()}.txt`;
    fs.writeFileSync(filename, base64);
    console.log(`\n💾 Saved to: ${filename}`);
    console.log("\n⚠️  KEEP THIS SAFE! Contains your private keys!");
    console.log("━".repeat(60));
  }

  async showCurrentUser(): Promise<void> {
    console.log("\n👤 Current User Info");
    console.log("━".repeat(60));

    const currentUser = this.identity.getCurrentUser();

    if (!currentUser) {
      console.log("❌ Not logged in");
      return;
    }

    console.log(`  Alias:           ${currentUser.alias}`);
    console.log(`  Public Key:      ${currentUser.pub}`);
    console.log(`  Encryption Key:  ${currentUser.epub}`);

    // Derive Ethereum address
    const ethAddress = await this.identity.deriveEthereumAddress();
    console.log(`  Ethereum Address: ${ethAddress}`);

    console.log("━".repeat(60));
  }

  async showPublicKey(): Promise<void> {
    console.log("\n🔑 Your Public Keys");
    console.log("━".repeat(60));

    const keypair = this.identity.getKeyPair();

    if (!keypair) {
      console.log("❌ Not logged in");
      return;
    }

    console.log("\n📝 Signing Keys:");
    console.log(`  Public:  ${keypair.pub}`);
    console.log(`  Private: ${keypair.priv.substring(0, 20)}... (hidden)`);

    console.log("\n🔐 Encryption Keys:");
    console.log(`  Public:  ${keypair.epub}`);
    console.log(`  Private: ${keypair.epriv.substring(0, 20)}... (hidden)`);

    console.log("\n💡 Share the PUBLIC keys only!");
    console.log("━".repeat(60));
  }

  // ==========================================================================
  // User Discovery
  // ==========================================================================

  async lookupUser(): Promise<void> {
    console.log("\n🔍 Lookup User");
    console.log("━".repeat(60));

    const username = await this.prompt("Enter username to lookup: ");

    if (!username.trim()) {
      console.log("❌ Username required");
      return;
    }

    console.log(`\n🔍 Searching for ${username}...`);

    // Check if exists
    const exists = await this.identity.userExists(username.trim());

    if (!exists) {
      console.log(`\n❌ User not found: ${username}`);
      console.log("\n💡 User may not have registered yet");
      return;
    }

    // Get user data
    const userData = await this.identity.getUserByAlias(username.trim());

    if (userData) {
      console.log(`\n✅ User Found:`);
      console.log("━".repeat(60));
      console.log(`  Username:      ${userData.username}`);
      console.log(`  Public Key:    ${userData.userPub}`);
      console.log(`  Encryption Key: ${userData.epub || "Not published"}`);

      if (userData.registeredAt) {
        console.log(`  Registered:    ${new Date(userData.registeredAt).toLocaleString()}`);
      }

      if (userData.lastSeen) {
        console.log(`  Last Seen:     ${new Date(userData.lastSeen).toLocaleString()}`);
      }
    }

    // Get public key data
    const publicKey = await this.identity.getPublicKey(username.trim());

    if (publicKey) {
      console.log("\n📝 Published Keys:");
      console.log(`  Signing:    ${publicKey.pub.substring(0, 40)}...`);
      console.log(`  Encryption: ${publicKey.epub.substring(0, 40)}...`);

      if (publicKey.timestamp) {
        console.log(`  Published:  ${new Date(parseInt(publicKey.timestamp)).toLocaleString()}`);
      }
    } else {
      console.log("\n⚠️  User has not published public keys yet");
    }

    console.log("━".repeat(60));
  }

  async lookupByPublicKey(): Promise<void> {
    console.log("\n🔍 Lookup by Public Key");
    console.log("━".repeat(60));

    const pubKey = await this.prompt("Enter public key: ");

    if (!pubKey.trim()) {
      console.log("❌ Public key required");
      return;
    }

    console.log(`\n🔍 Searching for public key...`);

    const userData = await this.identity.getUserByPub(pubKey.trim());

    if (!userData) {
      console.log(`\n❌ No user found for this public key`);
      return;
    }

    console.log(`\n✅ User Found:`);
    console.log("━".repeat(60));
    console.log(`  Username:      ${userData.username || "Unknown"}`);
    console.log(`  Public Key:    ${userData.userPub}`);
    console.log(`  Encryption Key: ${userData.epub || "Not available"}`);
    console.log("━".repeat(60));
  }

  // ==========================================================================
  // Menu
  // ==========================================================================

  async showMenu(): Promise<void> {
    while (this.running) {
      console.log("\n🗡️  SHIP-00 Identity Manager");
      console.log("━".repeat(60));
      console.log("1. View Current User");
      console.log("2. View Public Keys");
      console.log("3. Export Key Pair (Backup)");
      console.log("4. Login with Key Pair");
      console.log("5. Lookup User by Username");
      console.log("6. Lookup User by Public Key");
      console.log("7. Derive Ethereum Address");
      console.log("8. Publish Public Key");
      console.log("9. Logout");
      console.log("10. Exit");
      console.log("━".repeat(60));

      const choice = await this.prompt("\nChoose option: ");

      switch (choice.trim()) {
        case "1":
          await this.showCurrentUser();
          break;
        case "2":
          await this.showPublicKey();
          break;
        case "3":
          await this.exportKeypair();
          break;
        case "4":
          await this.loginWithKeypair();
          break;
        case "5":
          await this.lookupUser();
          break;
        case "6":
          await this.lookupByPublicKey();
          break;
        case "7":
          await this.deriveAddress();
          break;
        case "8":
          await this.publishPublicKey();
          break;
        case "9":
          await this.logout();
          break;
        case "10":
          this.running = false;
          console.log("\n👋 Goodbye!");
          this.cleanup();
          return;
        default:
          console.log("❌ Invalid choice");
      }
    }
  }

  async deriveAddress(): Promise<void> {
    console.log("\n🔗 Derive Ethereum Address");
    console.log("━".repeat(60));

    if (!this.identity.isLoggedIn()) {
      console.log("❌ Not logged in");
      return;
    }

    const address = await this.identity.deriveEthereumAddress();
    console.log(`\n✅ Ethereum Address: ${address}`);
    console.log("\n💡 This address is deterministically derived from your SHIP-00 identity");
    console.log("💡 Same identity = same address (always)");
    console.log("━".repeat(60));
  }

  async publishPublicKey(): Promise<void> {
    console.log("\n📢 Publish Public Key");
    console.log("━".repeat(60));

    if (!this.identity.isLoggedIn()) {
      console.log("❌ Not logged in");
      return;
    }

    const result = await this.identity.publishPublicKey();

    if (result.success) {
      console.log("✅ Public key published to Gun network!");
      console.log("💡 Other users can now discover you and send encrypted messages");
    } else {
      console.error(`❌ Error: ${result.error}`);
    }

    console.log("━".repeat(60));
  }

  async logout(): Promise<void> {
    console.log("\n👋 Logout");
    console.log("━".repeat(60));

    if (!this.identity.isLoggedIn()) {
      console.log("❌ Not logged in");
      return;
    }

    this.identity.logout();
    this.username = "";
    console.log("✅ Logged out successfully");
    console.log("💡 Your data remains on the Gun network");
    console.log("━".repeat(60));
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private printHeader(): void {
    console.log("\n╔" + "═".repeat(58) + "╗");
    console.log("║" + " ".repeat(12) + "🗡️  SHOGUN IDENTITY 🗡️" + " ".repeat(15) + "║");
    console.log("║" + " ".repeat(10) + "SHIP-00: Decentralized Identity" + " ".repeat(10) + "║");
    console.log("╚" + "═".repeat(58) + "╝");
  }

  async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  cleanup(): void {
    this.rl.close();
    process.exit(0);
  }

  async start(username?: string, password?: string): Promise<void> {
    this.printHeader();

    if (username && password) {
      // Auto-login
      const success = await this.login(username, password);

      if (success) {
        this.running = true;
        await this.showMenu();
      } else {
        console.log("\n❌ Authentication failed");
        this.cleanup();
      }
    } else {
      // Manual login
      console.log("\n💡 Commands:");
      console.log("  yarn identity <username> <password> - Auto-login");
      console.log("  yarn identity                        - Manual login");

      const choice = await this.prompt("\n1. Login\n2. Login with Keypair\n3. Exit\n\nChoose option: ");

      switch (choice.trim()) {
        case "1":
          const user = await this.prompt("Username: ");
          const pass = await this.prompt("Password: ");
          const success = await this.login(user, pass);
          if (success) {
            this.running = true;
            await this.showMenu();
          } else {
            this.cleanup();
          }
          break;
        case "2":
          await this.loginWithKeypair();
          if (this.identity.isLoggedIn()) {
            this.running = true;
            await this.showMenu();
          } else {
            this.cleanup();
          }
          break;
        case "3":
          this.cleanup();
          break;
        default:
          console.log("❌ Invalid choice");
          this.cleanup();
      }
    }
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const cli = new IdentityCLI();

  try {
    if (args.length >= 2) {
      // Auto-login mode
      const [username, password] = args;
      await cli.start(username, password);
    } else {
      // Manual login mode
      await cli.start();
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { IdentityCLI };

