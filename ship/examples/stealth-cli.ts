#!/usr/bin/env tsx
/**
 * SHIP-03 Stealth Address CLI Example
 *
 * Demonstrates dual-key stealth addresses with Fluidkey integration
 *
 * Usage:
 *   yarn stealth <username> <password>
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import { SHIP_02 } from "../implementation/SHIP_02";
import { SHIP_03 } from "../implementation/SHIP_03";
import * as readline from "readline";

// ============================================================================
// CLI Interface
// ============================================================================

class StealthCLI {
  private identity: SHIP_00;
  private eth: SHIP_02;
  private stealth: SHIP_03;
  private rl: readline.Interface;

  constructor() {
    // Initialize SHIP-00 with local peer
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

    // Will be initialized after login
    this.eth = null as any;
    this.stealth = null as any;

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

    const result = await this.identity.login(username, password);

    if (!result.success) {
      console.error(`❌ Login failed: ${result.error}`);
      return false;
    }

    console.log(`✅ Logged in as ${username}`);

    // Initialize SHIP-02 (HD Wallet)
    this.eth = new SHIP_02(this.identity);
    await this.eth.initialize();
    console.log("✅ SHIP-02 (HD Wallet) initialized");

    // Initialize SHIP-03 (Stealth Addresses)
    this.stealth = new SHIP_03(this.identity, this.eth);
    await this.stealth.initialize();
    console.log("✅ SHIP-03 (Stealth Addresses) initialized");

    return true;
  }

  async register(username: string, password: string): Promise<boolean> {
    console.log(`\n📝 Registering new user: ${username}...`);

    const result = await this.identity.signup(username, password);

    if (!result.success) {
      console.error(`❌ Registration failed: ${result.error}`);
      return false;
    }

    console.log(`✅ User registered: ${username}`);

    // Login after signup
    await this.identity.login(username, password);

    // Publish public key
    await this.identity.publishPublicKey();
    console.log("✅ Public key published");

    // Initialize SHIP-02 and SHIP-03
    this.eth = new SHIP_02(this.identity);
    await this.eth.initialize();

    this.stealth = new SHIP_03(this.identity, this.eth);
    await this.stealth.initialize();

    console.log("✅ Wallet and stealth systems initialized");

    return true;
  }

  // ==========================================================================
  // Stealth Operations
  // ==========================================================================

  async showStealthKeys(): Promise<void> {
    console.log("\n📋 Your Stealth Keys:");
    console.log("━".repeat(60));

    const keys = await this.stealth.getStealthKeys();

    console.log("\n🔍 Viewing Key:");
    console.log(`  Public:  ${keys.viewingKey.publicKey}`);
    console.log(`  Private: ${keys.viewingKey.privateKey.slice(0, 10)}...`);

    console.log("\n💰 Spending Key:");
    console.log(`  Public:  ${keys.spendingKey.publicKey}`);
    console.log(`  Private: ${keys.spendingKey.privateKey.slice(0, 10)}...`);

    console.log("\n💡 Share the PUBLIC keys with others to receive stealth payments");
    console.log("━".repeat(60));
  }

  async generateStealthAddress(): Promise<void> {
    console.log("\n🎭 Generate Stealth Address");
    console.log("━".repeat(60));

    const recipientInput = await this.prompt(
      "Recipient username (or leave empty for self): "
    );

    let viewingKey: string;
    let spendingKey: string;

    if (recipientInput.trim()) {
      // Generate for another user
      console.log(`\n🔍 Looking up stealth keys for: ${recipientInput}`);
      
      const recipientKeys = await this.stealth.getPublicStealthKeysByUsername(
        recipientInput.trim()
      );

      if (!recipientKeys) {
        console.error(`❌ Stealth keys not found for user: ${recipientInput}`);
        console.log("\n💡 The user needs to:");
        console.log("  1. Run: yarn stealth ${recipientInput} <password>");
        console.log("  2. Initialize SHIP-03 (happens automatically on login)");
        console.log("  3. Their keys will be published to Gun network");
        return;
      }

      viewingKey = recipientKeys.viewingPublicKey;
      spendingKey = recipientKeys.spendingPublicKey;

      console.log(`✅ Found keys for ${recipientInput}`);
    } else {
      // Generate for self
      console.log("\n📍 Generating for yourself (self-payment)");
      const keys = await this.stealth.getStealthKeys();
      viewingKey = keys.viewingKey.publicKey;
      spendingKey = keys.spendingKey.publicKey;
    }

    const result = await this.stealth.generateStealthAddress(
      viewingKey,
      spendingKey
    );

    if (!result.success) {
      console.error(`❌ Failed: ${result.error}`);
      return;
    }

    console.log("\n✅ Stealth Address Generated:");
    console.log(`  Address:     ${result.stealthAddress}`);
    console.log(`  Ephemeral:   ${result.ephemeralPublicKey}`);
    console.log(`  View Tag:    ${result.viewTag}`);
    console.log("\n📤 Send payment to this address");
    console.log("📤 Share ephemeral key with recipient for scanning");
    console.log("━".repeat(60));
  }

  async openStealthAddress(): Promise<void> {
    console.log("\n🔓 Open Stealth Address");
    console.log("━".repeat(60));

    const stealthAddress = await this.prompt(
      "Enter stealth address to open: "
    );
    const ephemeralPubKey = await this.prompt(
      "Enter ephemeral public key: "
    );

    try {
      const wallet = await this.stealth.openStealthAddress(
        stealthAddress.trim(),
        ephemeralPubKey.trim()
      );

      console.log("\n✅ Stealth Address Opened:");
      console.log(`  Address:     ${wallet.address}`);
      console.log(`  Private Key: ${wallet.privateKey.slice(0, 10)}...`);
      console.log("\n💰 You can now spend funds from this address");
      console.log("━".repeat(60));
    } catch (error: any) {
      console.error(`\n❌ Failed to open: ${error.message}`);
      console.log("This address may not belong to you.");
    }
  }

  async batchGenerateStealthAddresses(): Promise<void> {
    console.log("\n🎯 Batch Generate Stealth Addresses");
    console.log("━".repeat(60));

    const count = parseInt(await this.prompt("How many addresses? "), 10);

    if (isNaN(count) || count < 1 || count > 10) {
      console.error("❌ Please enter a number between 1 and 10");
      return;
    }

    // For demo, generate all for self
    const keys = await this.stealth.getStealthKeys();
    const recipients = Array(count).fill({
      viewingKey: keys.viewingKey.publicKey,
      spendingKey: keys.spendingKey.publicKey,
    });

    console.log(`\n🔄 Generating ${count} stealth addresses...`);

    const results = await this.stealth.generateMultipleStealthAddresses(recipients);

    console.log("\n✅ Generated addresses:");
    results.forEach((r, i) => {
      if (r.success) {
        console.log(`  ${i + 1}. ${r.stealthAddress}`);
        console.log(`     Ephemeral: ${r.ephemeralPublicKey?.slice(0, 20)}...`);
        console.log(`     View Tag:  ${r.viewTag}`);
      }
    });

    console.log("━".repeat(60));
  }

  async scanForStealthPayments(): Promise<void> {
    console.log("\n🔍 Scan for Stealth Payments");
    console.log("━".repeat(60));

    // Example announcements (in production, fetch from blockchain)
    console.log("\n💡 In production, this would scan blockchain for Announcement events");
    console.log("For demo, enter announcement data manually:\n");

    const stealthAddr = await this.prompt("Stealth address: ");
    const ephemeralKey = await this.prompt("Ephemeral public key: ");

    const isMine = await this.stealth.isStealthAddressMine(
      stealthAddr.trim(),
      ephemeralKey.trim()
    );

    if (isMine) {
      console.log("\n✅ This stealth address belongs to you!");

      const owned = await this.stealth.getAllOwnedStealthAddresses();
      console.log(`\n💰 Total owned stealth addresses: ${owned.length}`);
      owned.forEach((addr, i) => {
        console.log(`  ${i + 1}. ${addr.stealthAddress}`);
      });
    } else {
      console.log("\n❌ This stealth address does not belong to you");
    }

    console.log("━".repeat(60));
  }

  // ==========================================================================
  // Menu
  // ==========================================================================

  async showMenu(): Promise<void> {
    console.log("\n🎭 SHIP-03 Stealth Address Manager");
    console.log("━".repeat(60));
    console.log("1. Show my stealth keys");
    console.log("2. Generate stealth address (for anyone)");
    console.log("3. Open stealth address (spend)");
    console.log("4. Batch generate stealth addresses");
    console.log("5. Scan for stealth payments");
    console.log("6. Lookup user's stealth keys");
    console.log("7. Export stealth keys");
    console.log("8. Show wallet info (SHIP-02)");
    console.log("9. Publish Stealth Keys (to Gun network)");
    console.log("10. Logout");
    console.log("━".repeat(60));

    const choice = await this.prompt("\nChoose option: ");

    switch (choice.trim()) {
      case "1":
        await this.showStealthKeys();
        break;
      case "2":
        await this.generateStealthAddress();
        break;
      case "3":
        await this.openStealthAddress();
        break;
      case "4":
        await this.batchGenerateStealthAddresses();
        break;
      case "5":
        await this.scanForStealthPayments();
        break;
      case "6":
        await this.lookupUserKeys();
        break;
      case "7":
        await this.exportKeys();
        break;
      case "8":
        await this.showWalletInfo();
        break;
      case "9":
        await this.publishKeys();
        break;
      case "10":
        console.log("\n👋 Goodbye!");
        this.rl.close();
        process.exit(0);
        return;
      default:
        console.log("❌ Invalid choice");
    }

    // Show menu again
    setTimeout(() => this.showMenu(), 100);
  }

  async lookupUserKeys(): Promise<void> {
    console.log("\n🔍 Lookup User's Stealth Keys");
    console.log("━".repeat(60));

    const username = await this.prompt("Enter username to lookup: ");

    if (!username.trim()) {
      console.log("❌ Username required");
      return;
    }

    console.log(`\n🔍 Searching for ${username}...`);

    const keys = await this.stealth.getPublicStealthKeysByUsername(
      username.trim()
    );

    if (!keys) {
      console.log(`\n❌ No stealth keys found for ${username}`);
      console.log("\n💡 Possible reasons:");
      console.log("  • User hasn't initialized SHIP-03");
      console.log("  • Username doesn't exist");
      console.log("  • Keys not yet synced to Gun network");
      return;
    }

    console.log(`\n✅ Stealth Keys for ${username}:`);
    console.log("━".repeat(60));
    console.log(`Viewing Public Key:`);
    console.log(`  ${keys.viewingPublicKey}`);
    console.log(`\nSpending Public Key:`);
    console.log(`  ${keys.spendingPublicKey}`);
    console.log("\n💡 You can now generate stealth addresses for this user");
    console.log("━".repeat(60));
  }

  async exportKeys(): Promise<void> {
    console.log("\n📤 Export Stealth Keys");
    console.log("━".repeat(60));

    const encrypted = await this.stealth.exportStealthKeys();
    console.log("\n🔐 Encrypted keys (store safely):");
    console.log(encrypted);
    console.log("━".repeat(60));
  }

  async publishKeys(): Promise<void> {
    console.log("\n📡 Publish Stealth Keys");
    console.log("━".repeat(60));

    try {
      await this.stealth.publishStealthKeys();
      console.log("✅ Stealth keys published successfully!");
      console.log("💡 Others can now generate stealth addresses for you");
      
      // Verify publication by reading back
      const currentUser = this.identity.getCurrentUser();
      if (currentUser?.pub) {
        console.log("\n🔍 Verifying publication...");
        const keys = await this.stealth.getPublicStealthKeys(currentUser.pub);
        if (keys) {
          console.log("✅ Verification successful - keys are accessible!");
          console.log(`   Viewing: ${keys.viewingPublicKey.slice(0, 30)}...`);
          console.log(`   Spending: ${keys.spendingPublicKey.slice(0, 30)}...`);
        } else {
          console.log("⚠️  Verification failed - keys may need time to propagate");
          console.log("💡 Wait a few seconds and try looking up your own keys");
        }
      }
      
      console.log("━".repeat(60));
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  async showWalletInfo(): Promise<void> {
    console.log("\n💼 Wallet Info (SHIP-02)");
    console.log("━".repeat(60));

    const primaryAddr = await this.eth.getPrimaryAddress();
    console.log(`  Primary Address: ${primaryAddr}`);

    const masterPubKey = await this.eth.getMasterPublicKey();
    console.log(`  Master Pub Key:  ${masterPubKey.slice(0, 20)}...`);

    const allAddrs = await this.eth.getAllAddresses();
    console.log(`  Total Addresses: ${allAddrs.length}`);

    console.log("━".repeat(60));
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("\n🎭 SHIP-03 Stealth Address CLI");
    console.log("━".repeat(60));
    console.log("\nUsage:");
    console.log("  yarn stealth <username> <password>");
    console.log("\nExample:");
    console.log("  yarn stealth alice password123");
    console.log("\n━".repeat(60));
    process.exit(1);
  }

  const [username, password] = args;

  const cli = new StealthCLI();

  try {
    // Try login first
    let success = await cli.login(username, password);

    // If login fails, offer to register
    if (!success) {
      const shouldRegister = await cli.prompt(
        `\nUser ${username} not found. Register? (y/n): `
      );

      if (shouldRegister.toLowerCase() === "y") {
        success = await cli.register(username, password);
      }
    }

    if (success) {
      // Show menu
      await cli.showMenu();
    } else {
      console.log("\n❌ Authentication failed");
      cli.close();
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    cli.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { StealthCLI };

