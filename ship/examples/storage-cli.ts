#!/usr/bin/env tsx
/**
 * SHIP-05 Storage CLI Example
 *
 * Interactive CLI demonstrating SHIP-05 encrypted file storage on IPFS
 *
 * Usage:
 *   yarn storage <username> <password>
 *
 * Features:
 * - Encrypted file upload to IPFS (uses SEA from SHIP-00)
 * - Multiple IPFS services (Pinata, IPFS Client, Custom Gateway)
 * - File download and decryption
 * - File metadata management
 * - Storage statistics
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import { SHIP_05 } from "../implementation/SHIP_05";
import * as readline from "readline";
import * as fs from "fs";
import { ethers } from "ethers";

// ============================================================================
// CLI Interface
// ============================================================================

class StorageCLI {
  private identity: SHIP_00;
  private storage: SHIP_05;
  private rl: readline.Interface;
  private username: string = "";
  private running: boolean = false;
  
  // IPFS configuration
  private ipfsService: "PINATA" | "IPFS-CLIENT" | "CUSTOM" = "CUSTOM";
  private ipfsConfig: any = {};
  private configFile: string = ".shogun-ipfs-config.json";

  constructor() {
    // Initialize SHIP-00 with peers
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

    // Will initialize SHIP-05 after login
    this.storage = null as any;

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
      // Login with SHIP-00
      let result = await this.identity.login(username, password);

      if (!result.success) {
        console.log("📝 User not found, creating new identity...");
        const signupResult = await this.identity.signup(username, password);

        if (!signupResult.success) {
          console.error(`❌ Registration failed: ${signupResult.error}`);
          return false;
        }

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

        // Publish public key
        await this.identity.publishPublicKey();
        console.log("✅ Public key published!");

        // Configure IPFS storage
        await this.configureIPFS();

        // Initialize SHIP-05
        console.log("\n🔐 Initializing SHIP-05 (Storage)...");
        console.log(`   Service: ${this.ipfsService}`);
        console.log("   Using SEA keypair from SHIP-00 for encryption");
        
        this.storage = new SHIP_05(this.identity, {
          ipfsService: this.ipfsService,
          ipfsConfig: this.ipfsConfig,
          maxFileSizeMB: 100,
        });

        await this.storage.initialize();
        console.log("✅ SHIP-05 initialized!");

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

  // ==========================================================================
  // IPFS Configuration
  // ==========================================================================

  async configureIPFS(): Promise<void> {
    // Try to load existing config
    if (this.loadIPFSConfig()) {
      console.log(`\n✅ Loaded IPFS config: ${this.ipfsService}`);
      const reconfig = await this.prompt("Use saved config? (y/n, default: y): ");
      if (reconfig.toLowerCase().trim() !== "n") {
        return;
      }
    }

    console.log("\n📦 Configure IPFS Storage");
    console.log("━".repeat(60));
    console.log("Available services:");
    console.log("1. Pinata (recommended - managed IPFS)");
    console.log("2. IPFS Client (local node)");
    console.log("3. Custom Gateway");
    console.log("━".repeat(60));

    const choice = await this.prompt("Choose IPFS service (1-3, default: 3): ");

    switch (choice.trim() || "3") {
      case "1":
        await this.configurePinata();
        break;
      case "2":
        await this.configureIPFSClient();
        break;
      case "3":
      default:
        await this.configureCustomGateway();
        break;
    }

    // Save config
    this.saveIPFSConfig();
  }

  async configurePinata(): Promise<void> {
    console.log("\n🔑 Pinata Configuration");
    console.log("━".repeat(60));
    console.log("Get your JWT from: https://app.pinata.cloud/");

    const jwt = await this.prompt("Pinata JWT (or press Enter to skip): ");

    if (jwt.trim()) {
      this.ipfsService = "PINATA";
      this.ipfsConfig = {
        pinataJwt: jwt.trim(),
        pinataGateway: "https://gateway.pinata.cloud",
      };
      console.log("✅ Pinata configured!");
    } else {
      console.log("⚠️  No JWT provided, using public IPFS gateway");
      await this.configureCustomGateway();
    }
  }

  async configureIPFSClient(): Promise<void> {
    console.log("\n🖥️  IPFS Client Configuration");
    console.log("━".repeat(60));
    console.log("💡 For local IPFS node: http://localhost:5001");
    console.log("⚠️  For Shogun Relay, use option 3 (Custom Gateway) instead!");
    
    const url = await this.prompt("\nIPFS API URL (default: http://localhost:5001): ");

    this.ipfsService = "IPFS-CLIENT";
    this.ipfsConfig = {
      url: url.trim() || "http://localhost:5001",
    };

    console.log(`✅ IPFS Client configured: ${this.ipfsConfig.url}`);
  }

  async configureCustomGateway(): Promise<void> {
    console.log("\n🌐 Custom Gateway/Relay Configuration");
    console.log("━".repeat(60));
    console.log("💡 Examples:");
    console.log("   Shogun Relay (local):  http://localhost:3000/api/v1/ipfs");
    console.log("   Shogun Relay (remote): https://relay.shogun-eco.xyz/api/v1/ipfs");
    console.log("   Public IPFS Gateway:   https://ipfs.io");
    console.log("━".repeat(60));
    console.log("⚠️  BASE URL only - don't include /upload or /add!");
    console.log("   The system will automatically try /upload then /add");
    
    const url = await this.prompt("\nGateway/Relay URL: ");
    const token = await this.prompt("Auth Token (REQUIRED for relay): ");

    this.ipfsService = "CUSTOM";
    this.ipfsConfig = {
      customApiUrl: url.trim() || "https://ipfs.io",
    };

    if (token.trim()) {
      this.ipfsConfig.customToken = token.trim();
      console.log(`✅ Auth token configured: ${token.substring(0, 5)}...`);
    } else {
      console.log("⚠️  WARNING: No auth token - relay uploads will fail!");
    }

    console.log(`✅ Custom gateway configured: ${this.ipfsConfig.customApiUrl}`);
  }

  saveIPFSConfig(): void {
    try {
      const config = {
        service: this.ipfsService,
        config: this.ipfsConfig,
      };
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      console.log(`💾 IPFS config saved to ${this.configFile}`);
    } catch (error) {
      console.warn("⚠️  Could not save config:", error);
    }
  }

  loadIPFSConfig(): boolean {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf-8');
        const config = JSON.parse(data);
        this.ipfsService = config.service;
        this.ipfsConfig = config.config;
        return true;
      }
    } catch (error) {
      console.warn("⚠️  Could not load config:", error);
    }
    return false;
  }

  // ==========================================================================
  // File Operations
  // ==========================================================================

  async uploadFile(): Promise<void> {
    console.log("\n📤 Upload File to IPFS");
    console.log("━".repeat(60));

    const filepath = await this.prompt("Enter file path: ");

    if (!filepath.trim()) {
      console.log("❌ File path required");
      return;
    }

    // Check if file exists
    if (!fs.existsSync(filepath.trim())) {
      console.log(`❌ File not found: ${filepath}`);
      return;
    }

    const encryptStr = await this.prompt("Encrypt file? (y/n, default: y): ");
    const encrypt = encryptStr.toLowerCase().trim() !== "n";

    try {
      console.log("\n🔄 Reading file...");
      const fileBuffer = fs.readFileSync(filepath.trim());
      const filename = filepath.split("/").pop() || filepath.split("\\").pop() || "file";

      console.log(`📁 File: ${filename}`);
      console.log(`📊 Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🔐 Encrypt: ${encrypt ? "YES" : "NO"}`);

      console.log("\n⏳ Uploading to IPFS...");

      const result = await this.storage.uploadFile(fileBuffer, { encrypt });

      if (result.success) {
        console.log("\n✅ Upload Successful!");
        console.log("━".repeat(60));
        console.log(`  IPFS Hash: ${result.hash}`);
        console.log(`  Size: ${((result.size || 0) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Encrypted: ${result.encrypted ? "YES" : "NO"}`);
        console.log("━".repeat(60));

        // Save hash to file for easy retrieval
        const hashFile = `ipfs-hash-${Date.now()}.txt`;
        fs.writeFileSync(hashFile, result.hash || "");
        console.log(`\n💾 Hash saved to: ${hashFile}`);
      } else {
        console.error(`❌ Upload failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  async downloadFile(): Promise<void> {
    console.log("\n📥 Download File from IPFS");
    console.log("━".repeat(60));

    const hash = await this.prompt("Enter IPFS hash: ");

    if (!hash.trim()) {
      console.log("❌ IPFS hash required");
      return;
    }

    const decryptStr = await this.prompt("Decrypt file? (y/n, default: y): ");
    const decrypt = decryptStr.toLowerCase().trim() !== "n";

    try {
      console.log("\n⏳ Downloading from IPFS...");
      console.log(`📍 Hash: ${hash.trim()}`);
      console.log(`🔓 Decrypt: ${decrypt ? "YES" : "NO"}`);

      const data = await this.storage.downloadFile(hash.trim(), {
        decrypt,
        returnBlob: true,
      });

      if (data) {
        // Save to file
        const outputFile = `downloaded-${hash.substring(0, 10)}-${Date.now()}.bin`;
        
        if (data instanceof Blob) {
          const buffer = Buffer.from(await data.arrayBuffer());
          fs.writeFileSync(outputFile, buffer);
        } else {
          fs.writeFileSync(outputFile, data);
        }

        console.log("\n✅ Download Successful!");
        console.log("━".repeat(60));
        console.log(`  Saved to: ${outputFile}`);
        console.log(`  Size: ${fs.statSync(outputFile).size} bytes`);
        console.log("━".repeat(60));
      } else {
        console.log("❌ Download failed - file not found");
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  async viewUserFiles(): Promise<void> {
    console.log("\n📂 Your Files");
    console.log("━".repeat(60));

    try {
      const files = await this.storage.getUserFiles();

      if (files.length === 0) {
        console.log("No files uploaded yet");
        return;
      }

      console.log(`Found ${files.length} files:\n`);

      files.forEach((file, i) => {
        console.log(`${i + 1}. ${file.name}`);
        console.log(`   Hash: ${file.hash}`);
        console.log(`   Size: ${file.sizeMB} MB`);
        console.log(`   Encrypted: ${file.encrypted ? "YES 🔒" : "NO"}`);
        console.log(`   Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`);
        console.log("");
      });
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  async deleteFile(): Promise<void> {
    console.log("\n🗑️ Delete File");
    console.log("━".repeat(60));

    const hash = await this.prompt("Enter IPFS hash to delete: ");

    if (!hash.trim()) {
      console.log("❌ IPFS hash required");
      return;
    }

    const confirm = await this.prompt("Are you sure? (yes/no): ");
    if (confirm.toLowerCase() !== "yes") {
      console.log("❌ Deletion cancelled");
      return;
    }

    try {
      const result = await this.storage.deleteFile(hash.trim());

      if (result.success) {
        console.log("✅ File deleted successfully");
      } else {
        console.error(`❌ Deletion failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  async showStorageStats(): Promise<void> {
    console.log("\n📊 Storage Statistics");
    console.log("━".repeat(60));

    try {
      const stats = await this.storage.getStorageStats();

      console.log(`  Total Files:     ${stats.totalFiles}`);
      console.log(`  Total Size:      ${stats.totalMB.toFixed(2)} MB`);
      console.log(`  Encrypted:       ${stats.encryptedFiles} 🔒`);
      console.log(`  Plain:           ${stats.plainFiles} 📄`);
      console.log("━".repeat(60));
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  async testEncryption(): Promise<void> {
    console.log("\n🔐 Test SEA Encryption System");
    console.log("━".repeat(60));

    try {
      // Test data
      const testData = "Hello, SHIP-05! This is a secret message.";
      console.log(`\n📝 Original data: "${testData}"`);

      // Encrypt using SEA (from SHIP-00)
      console.log("🔐 Encrypting with SEA keypair...");
      const encrypted = await this.storage.encryptData(testData);
      console.log(`   Encrypted: ${encrypted.substring(0, 60)}...`);

      // Decrypt using SEA
      console.log("🔓 Decrypting with SEA keypair...");
      const decrypted = await this.storage.decryptData(encrypted);
      console.log(`   Decrypted: "${decrypted}"`);

      // Verify
      if (testData === decrypted) {
        console.log("\n✅ SEA Encryption test PASSED!");
        console.log("   Using SHIP-00 keypair for encryption/decryption");
      } else {
        console.log("\n❌ Encryption test FAILED!");
      }

      console.log("━".repeat(60));
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  // ==========================================================================
  // Menu
  // ==========================================================================

  async showMenu(): Promise<void> {
    while (this.running) {
      console.log("\n🗡️  SHIP-05 Storage Manager");
      console.log("━".repeat(60));
      console.log("1. Upload File (Encrypted)");
      console.log("2. Download File");
      console.log("3. View Your Files");
      console.log("4. Delete File");
      console.log("5. Storage Statistics");
      console.log("6. Test Encryption System");
      console.log("7. Change IPFS Service");
      console.log("8. Logout");
      console.log("9. Exit");
      console.log("━".repeat(60));
      console.log("\n💡 For on-chain storage tracking, see SHIP-06 (coming soon)");

      const choice = await this.prompt("\nChoose option: ");

      switch (choice.trim()) {
        case "1":
          await this.uploadFile();
          break;
        case "2":
          await this.downloadFile();
          break;
        case "3":
          await this.viewUserFiles();
          break;
        case "4":
          await this.deleteFile();
          break;
        case "5":
          await this.showStorageStats();
          break;
        case "6":
          await this.testEncryption();
          break;
        case "7":
          await this.reconfigureIPFS();
          break;
        case "8":
          await this.logout();
          break;
        case "9":
          this.running = false;
          console.log("\n👋 Goodbye!");
          this.cleanup();
          return;
        default:
          console.log("❌ Invalid choice");
      }
    }
  }

  async reconfigureIPFS(): Promise<void> {
    console.log("\n🔄 Reconfigure IPFS Service");
    console.log(`   Current: ${this.ipfsService}`);
    
    // Force reconfiguration
    console.log("\n📦 Configure IPFS Storage");
    console.log("━".repeat(60));
    console.log("Available services:");
    console.log("1. Pinata (recommended - managed IPFS)");
    console.log("2. IPFS Client (local node)");
    console.log("3. Custom Gateway");
    console.log("━".repeat(60));

    const choice = await this.prompt("Choose IPFS service (1-3): ");

    switch (choice.trim()) {
      case "1":
        await this.configurePinata();
        break;
      case "2":
        await this.configureIPFSClient();
        break;
      case "3":
        await this.configureCustomGateway();
        break;
      default:
        console.log("❌ Invalid choice");
        return;
    }

    // Save new config
    this.saveIPFSConfig();
    
    // Re-initialize SHIP-05 with new config
    this.storage = new SHIP_05(this.identity, {
      ipfsService: this.ipfsService,
      ipfsConfig: this.ipfsConfig,
      maxFileSizeMB: 100,
    });
    
    await this.storage.initialize();
    console.log("✅ IPFS service updated!");
  }

  async logout(): Promise<void> {
    this.identity.logout();
    this.username = "";
    console.log("\n✅ Logged out successfully");
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private printHeader(): void {
    console.log("\n╔" + "═".repeat(58) + "╗");
    console.log("║" + " ".repeat(10) + "🗡️  SHOGUN STORAGE (SHIP-05) 🗡️" + " ".repeat(10) + "║");
    console.log("║" + " ".repeat(8) + "Encrypted Decentralized File Storage" + " ".repeat(8) + "║");
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
      console.log("  yarn storage <username> <password> - Auto-login");
      console.log("  yarn storage                        - Manual login");

      const user = await this.prompt("\nUsername: ");
      const pass = await this.prompt("Password: ");
      const success = await this.login(user, pass);

      if (success) {
        this.running = true;
        await this.showMenu();
      } else {
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

  const cli = new StorageCLI();

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

export { StorageCLI };
