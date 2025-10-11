/**
 * SHIP-02 Example: Ethereum Wallet CLI
 * 
 * Interactive CLI demonstrating SHIP-02 HD wallet derivation
 * Built on top of SHIP-00 identity
 * 
 * Usage:
 *   yarn wallet <username> <password>
 * 
 * Features:
 * - Derive Ethereum addresses from identity (no mnemonics!)
 * - BIP-44 HD wallet support
 * - Sign transactions and messages
 * - Export/import address book
 * - Gun persistence
 * 
 * Note: For stealth addresses, use `yarn stealth` (SHIP-03)
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import { SHIP_02 } from "../implementation/SHIP_02";
import * as readline from "readline";
import { ethers } from "ethers";

// ============================================================================
// CLI INTERFACE
// ============================================================================

class WalletCLI {
  private identity: SHIP_00;
  private wallet: SHIP_02;
  private rl: readline.Interface;
  private username: string;
  private running: boolean = false;

  constructor(username: string, password: string) {
    this.username = username;

    // Initialize SHIP-00 identity
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

    // Initialize SHIP-02 wallet
    this.wallet = new SHIP_02(this.identity);

    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Start the CLI
   */
  async start(password: string): Promise<void> {
    console.clear();
    this.printHeader();

    try {
      // Step 1: Authenticate with SHIP-00
      await this.authenticate(password);

      // Step 2: Initialize SHIP-02
      await this.initializeWallet();

      // Step 3: Show main menu
      this.running = true;
      await this.mainMenu();
    } catch (error: any) {
      console.error("\n❌ Error:", error.message);
      this.cleanup();
    }
  }

  /**
   * Authenticate user with SHIP-00
   */
  private async authenticate(password: string): Promise<void> {
    console.log("\n🔐 STEP 1: Authenticating with SHIP-00");
    console.log("═".repeat(60));

    try {
      // Try login first
      const loginResult = await this.identity.login(this.username, password);

      if (loginResult.success) {
        console.log(`✅ Logged in as: ${this.username}`);
        console.log(`📍 Public Key: ${loginResult.userPub?.substring(0, 20)}...`);
      } else {
        // If login fails, try signup
        console.log("🔄 User not found, creating new identity...");
        const signupResult = await this.identity.signup(this.username, password);

        if (!signupResult.success) {
          throw new Error(signupResult.error || "Authentication failed");
        }

        // Login after signup
        await this.identity.login(this.username, password);
        console.log(`✅ Created new identity: ${this.username}`);

        // Publish public key
        await this.identity.publishPublicKey();
        console.log("✅ Published public key to network");
      }
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Initialize SHIP-02 wallet
   */
  private async initializeWallet(): Promise<void> {
    console.log("\n💼 STEP 2: Initializing SHIP-02 Wallet");
    console.log("═".repeat(60));

    try {
      // Ask if user wants to use mnemonic mode
      const useMnemonicStr = await this.prompt(
        "Use BIP-39 mnemonic for MetaMask compatibility? (y/n, default: n): "
      );
      const useMnemonic = useMnemonicStr.toLowerCase().trim() === "y";

      await this.wallet.initialize(useMnemonic);
      
      if (useMnemonic) {
        const mnemonic = await this.wallet.getMnemonic();
        if (mnemonic) {
          console.log("\n📝 Your BIP-39 Mnemonic (SAVE THIS!):");
          console.log("━".repeat(60));
          console.log(mnemonic);
          console.log("━".repeat(60));
          console.log("💡 You can import this in MetaMask for compatibility");
          
          // Show MetaMask addresses for verification
          const addresses = this.wallet.getStandardBIP44Addresses(mnemonic, 3);
          console.log("\n📍 First 3 MetaMask-compatible addresses:");
          addresses.forEach((addr, i) => {
            console.log(`  ${i}: ${addr}`);
          });
        }
      } else {
        console.log("✅ Wallet derived from SHIP-00 identity (no mnemonic)");
      }

      // Derive primary address
      const primaryAddress = await this.wallet.getPrimaryAddress();
      console.log(`\n✅ Primary address: ${primaryAddress}`);

      // Set label for primary address
      await this.wallet.setAddressLabel(primaryAddress, "Main Wallet");
    } catch (error: any) {
      throw new Error(`Wallet initialization failed: ${error.message}`);
    }
  }

  /**
   * Main menu loop
   */
  private async mainMenu(): Promise<void> {
    while (this.running) {
      console.log("\n" + "═".repeat(60));
      console.log("🗡️  SHOGUN WALLET - Main Menu");
      console.log("═".repeat(60));
      console.log("1. View Addresses");
      console.log("2. Derive New Address");
      console.log("3. Derive BIP-44 Address");
      console.log("4. Derive Multiple Addresses");
      console.log("5. Sign Message");
      console.log("6. Sign Transaction");
      console.log("7. Export Address Book");
      console.log("8. Import Address Book");
      console.log("9. View Master Public Key");
      console.log("10. Export Wallet Data");
      console.log("11. Sync with Gun");
      console.log("12. View/Export Mnemonic");
      console.log("13. Verify MetaMask Addresses");
      console.log("14. Create Wallet (Frontend API)");
      console.log("15. Load All Wallets");
      console.log("16. Get Main Wallet");
      console.log("17. Export All User Data");
      console.log("18. Set RPC Provider");
      console.log("19. Send Transaction (RPC)");
      console.log("20. Exit");
      console.log("\n💡 For stealth addresses, use: yarn stealth");
      console.log("═".repeat(60));

      const choice = await this.prompt("Select option (1-20): ");

      switch (choice.trim()) {
        case "1":
          await this.viewAddresses();
          break;
        case "2":
          await this.deriveNewAddress();
          break;
        case "3":
          await this.deriveBIP44Address();
          break;
        case "4":
          await this.deriveMultipleAddresses();
          break;
        case "5":
          await this.signMessage();
          break;
        case "6":
          await this.signTransaction();
          break;
        case "7":
          await this.exportAddressBook();
          break;
        case "8":
          await this.importAddressBook();
          break;
        case "9":
          await this.viewMasterPublicKey();
          break;
        case "10":
          await this.exportWalletData();
          break;
        case "11":
          await this.syncWithGun();
          break;
        case "12":
          await this.viewExportMnemonic();
          break;
        case "13":
          await this.verifyMetaMaskAddresses();
          break;
        case "14":
          await this.createWalletFrontendAPI();
          break;
        case "15":
          await this.loadAllWallets();
          break;
        case "16":
          await this.viewMainWallet();
          break;
        case "17":
          await this.exportAllUserData();
          break;
        case "18":
          await this.setRpcProvider();
          break;
        case "19":
          await this.sendTransactionRPC();
          break;
        case "20":
          this.running = false;
          console.log("\n👋 Goodbye!");
          this.cleanup();
          break;
        default:
          console.log("❌ Invalid option");
      }
    }
  }

  /**
   * View all addresses
   */
  private async viewAddresses(): Promise<void> {
    console.log("\n📋 Your Addresses");
    console.log("═".repeat(60));

    const addresses = await this.wallet.getAllAddresses();

    if (addresses.length === 0) {
      console.log("No addresses yet. Derive one from the menu!");
      return;
    }

    for (const entry of addresses) {
      const label = entry.label || "Unnamed";

      console.log(`\n💼 Address #${entry.index}: ${label}`);
      console.log(`  Address: ${entry.address}`);
      console.log(`  Path: ${entry.path}`);
      console.log(`  Public Key: ${entry.publicKey.substring(0, 20)}...`);
      console.log(`  Created: ${new Date(entry.createdAt).toLocaleString()}`);
    }
  }

  /**
   * Derive new address with custom index
   */
  private async deriveNewAddress(): Promise<void> {
    console.log("\n🔑 Derive New Address");
    console.log("═".repeat(60));

    const indexStr = await this.prompt("Enter address index (default 0): ");
    const index = parseInt(indexStr) || 0;

    const result = await this.wallet.deriveBIP44Address(60, 0, 0, index);

    if (result.success && result.address) {
      console.log("✅ Address derived successfully!");
      console.log(`   Address: ${result.address}`);
      console.log(`   Path: ${result.path}`);

      const label = await this.prompt("Enter label (optional): ");
      if (label.trim()) {
        await this.wallet.setAddressLabel(result.address, label);
        console.log("✅ Label set");
      }
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
  }

  /**
   * Derive BIP-44 address with custom parameters
   */
  private async deriveBIP44Address(): Promise<void> {
    console.log("\n🔑 Derive BIP-44 Address");
    console.log("═".repeat(60));

    const coinTypeStr = await this.prompt("Coin type (60 for Ethereum): ");
    const accountStr = await this.prompt("Account index (default 0): ");
    const changeStr = await this.prompt("Change chain (0=external, 1=internal): ");
    const indexStr = await this.prompt("Address index: ");

    const coinType = parseInt(coinTypeStr) || 60;
    const account = parseInt(accountStr) || 0;
    const change = parseInt(changeStr) || 0;
    const index = parseInt(indexStr) || 0;

    const result = await this.wallet.deriveBIP44Address(
      coinType,
      account,
      change,
      index
    );

    if (result.success && result.address) {
      console.log("✅ Address derived successfully!");
      console.log(`   Address: ${result.address}`);
      console.log(`   Path: ${result.path}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
  }

  /**
   * Derive multiple addresses at once
   */
  private async deriveMultipleAddresses(): Promise<void> {
    console.log("\n🔢 Derive Multiple Addresses");
    console.log("═".repeat(60));

    const countStr = await this.prompt("How many addresses to derive? ");
    const startIndexStr = await this.prompt("Starting index (default 0): ");

    const count = parseInt(countStr) || 1;
    const startIndex = parseInt(startIndexStr) || 0;

    if (count < 1 || count > 20) {
      console.log("❌ Please enter a number between 1 and 20");
      return;
    }

    console.log(`\n🔄 Deriving ${count} addresses...`);

    const results = await this.wallet.deriveMultipleAddresses(count, startIndex);

    console.log(`✅ Derived ${results.length} addresses:`);
    results.forEach((result, i) => {
      if (result.success && result.address) {
        console.log(`  ${i + 1}. ${result.address}`);
        console.log(`     Path: ${result.path}`);
      }
    });
  }

  /**
   * Import address book
   */
  private async importAddressBook(): Promise<void> {
    console.log("\n📥 Import Address Book");
    console.log("═".repeat(60));

    const jsonStr = await this.prompt("Paste address book JSON: ");

    try {
      const addressBook = JSON.parse(jsonStr);
      await this.wallet.importAddressBook(addressBook);
      console.log("✅ Address book imported successfully!");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Export encrypted wallet data
   */
  private async exportWalletData(): Promise<void> {
    console.log("\n📤 Export Wallet Data (Encrypted)");
    console.log("═".repeat(60));

    try {
      const encrypted = await this.wallet.exportWalletData();
      console.log("✅ Wallet data exported (encrypted with SHIP-00 keys):");
      console.log(encrypted);
      console.log("\n💡 Store this safely - you can restore your wallet with it");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Sync with Gun database
   */
  private async syncWithGun(): Promise<void> {
    console.log("\n🔄 Sync with Gun Database");
    console.log("═".repeat(60));

    try {
      // Enable persistence
      this.wallet.enableGunPersistence();
      
      // Sync
      await this.wallet.syncWithGun();
      
      console.log("✅ Synced successfully with Gun");
      console.log("💡 Address book is now backed up on Gun network");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * View/Export mnemonic
   */
  private async viewExportMnemonic(): Promise<void> {
    console.log("\n📝 Mnemonic Management");
    console.log("═".repeat(60));

    const mnemonic = await this.wallet.getMnemonic();

    if (!mnemonic) {
      console.log("❌ No mnemonic available");
      console.log("💡 This wallet was initialized from SHIP-00 identity");
      console.log("💡 To use mnemonic mode, re-initialize with mnemonic option");
      return;
    }

    console.log("\n🔐 Your BIP-39 Mnemonic:");
    console.log("━".repeat(60));
    console.log(mnemonic);
    console.log("━".repeat(60));
    console.log("\n⚠️  KEEP THIS SAFE! Anyone with this can access your wallet");
    console.log("💡 You can import this in MetaMask, Trust Wallet, etc.");

    // Ask if user wants encrypted export
    const exportStr = await this.prompt("\nExport encrypted version? (y/n): ");
    if (exportStr.toLowerCase().trim() === "y") {
      const encrypted = await this.wallet.exportMnemonic();
      if (encrypted) {
        console.log("\n🔐 Encrypted Mnemonic:");
        console.log(encrypted);
      }
    }
  }

  /**
   * Verify addresses match MetaMask
   */
  private async verifyMetaMaskAddresses(): Promise<void> {
    console.log("\n🔍 Verify MetaMask Compatibility");
    console.log("═".repeat(60));

    const mnemonic = await this.wallet.getMnemonic();

    if (!mnemonic) {
      console.log("❌ No mnemonic available");
      console.log("💡 This feature requires mnemonic mode");
      return;
    }

    console.log("\n📍 Comparing addresses with MetaMask standard...");
    
    const standardAddresses = this.wallet.getStandardBIP44Addresses(mnemonic, 5);
    const derivedAddresses = await this.wallet.deriveMultipleAddresses(5, 0);

    console.log("\n📊 MetaMask Standard (m/44'/60'/0'/0/N):");
    standardAddresses.forEach((addr, i) => {
      console.log(`  ${i}: ${addr}`);
    });

    console.log("\n📊 SHIP-02 Derived:");
    derivedAddresses.forEach((result, i) => {
      if (result.success && result.address) {
        console.log(`  ${i}: ${result.address}`);
        
        // Check if matches
        const matches = result.address === standardAddresses[i];
        console.log(`     ${matches ? "✅ MATCH" : "⚠️  DIFFERENT"}`);
      }
    });

    console.log("\n💡 If using mnemonic mode, addresses should match MetaMask");
  }

  /**
   * Sign message
   */
  private async signMessage(): Promise<void> {
    console.log("\n✍️  Sign Message");
    console.log("═".repeat(60));

    const message = await this.prompt("Enter message to sign: ");
    const addressInput = await this.prompt(
      "Address to sign with (leave empty for primary): "
    );

    const address = addressInput || (await this.wallet.getPrimaryAddress());

    try {
      const signature = await this.wallet.signMessage(message, address);
      console.log("✅ Message signed successfully!");
      console.log(`   Signature: ${signature}`);

      // Verify signature
      const isValid = await this.wallet.verifySignature(
        message,
        signature,
        address
      );
      console.log(`   Verification: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Sign transaction
   */
  private async signTransaction(): Promise<void> {
    console.log("\n✍️  Sign Transaction");
    console.log("═".repeat(60));

    const to = await this.prompt("To address: ");
    const valueStr = await this.prompt("Value in ETH: ");
    const chainIdStr = await this.prompt("Chain ID (1 for mainnet): ");
    const addressInput = await this.prompt(
      "Address to sign with (leave empty for primary): "
    );

    const address = addressInput || (await this.wallet.getPrimaryAddress());

    try {
      const tx = {
        to,
        value: ethers.parseEther(valueStr),
        chainId: parseInt(chainIdStr) || 1,
        gasLimit: BigInt(21000),
      };

      const result = await this.wallet.signTransaction(tx, address);

      if (result.success) {
        console.log("✅ Transaction signed successfully!");
        console.log(`   Transaction Hash: ${result.txHash}`);
        console.log(`   Signed Transaction: ${result.signedTransaction?.substring(0, 50)}...`);
        console.log("\n💡 You can now broadcast this transaction to the network");
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Export address book
   */
  private async exportAddressBook(): Promise<void> {
    console.log("\n📤 Export Address Book");
    console.log("═".repeat(60));

    const addressBook = await this.wallet.exportAddressBook();

    console.log(`✅ Address book exported`);
    console.log(`   Total addresses: ${addressBook.addresses.length}`);
    console.log(`   Master Public Key: ${addressBook.masterPublicKey.substring(0, 20)}...`);
    console.log(`   Derivation Method: ${addressBook.derivationMethod}`);

    console.log("\n📋 Address Book JSON:");
    console.log(JSON.stringify(addressBook, null, 2));
  }

  /**
   * View master public key
   */
  private async viewMasterPublicKey(): Promise<void> {
    console.log("\n🔑 Master Public Key");
    console.log("═".repeat(60));

    const masterPubKey = await this.wallet.getMasterPublicKey();
    console.log(`Master Public Key (xpub):`);
    console.log(masterPubKey);
    console.log("\n💡 This key can derive all public addresses (but not sign)");
  }

  /**
   * Create wallet using frontend API
   */
  private async createWalletFrontendAPI(): Promise<void> {
    console.log("\n🆕 Create Wallet (Frontend API)");
    console.log("═".repeat(60));

    try {
      const walletInfo = await this.wallet.createWallet();
      console.log("✅ Wallet created successfully!");
      console.log(`   Address: ${walletInfo.address}`);
      console.log(`   Path: ${walletInfo.path}`);
      console.log(`   Index: ${walletInfo.index}`);
      console.log(`   Public Key: ${walletInfo.publicKey?.substring(0, 20)}...`);

      const label = await this.prompt("Enter label (optional): ");
      if (label.trim()) {
        await this.wallet.setAddressLabel(walletInfo.address, label);
        console.log("✅ Label set");
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Load all wallets using frontend API
   */
  private async loadAllWallets(): Promise<void> {
    console.log("\n📂 Load All Wallets");
    console.log("═".repeat(60));

    try {
      const wallets = await this.wallet.loadWallets();
      console.log(`✅ Loaded ${wallets.length} wallets:`);
      
      wallets.forEach((wallet, i) => {
        console.log(`\n💼 Wallet #${i}:`);
        console.log(`  Address: ${wallet.address}`);
        console.log(`  Path: ${wallet.path}`);
        console.log(`  Public Key: ${wallet.publicKey?.substring(0, 20)}...`);
      });
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * View main wallet (derived from Gun keys)
   */
  private async viewMainWallet(): Promise<void> {
    console.log("\n🔑 Main Wallet (Gun-Derived)");
    console.log("═".repeat(60));

    try {
      const credentials = this.wallet.getMainWalletCredentials();
      console.log("✅ Main wallet credentials:");
      console.log(`   Address: ${credentials.address}`);
      console.log(`   Private Key: ${credentials.priv.substring(0, 20)}...`);
      console.log("\n💡 This wallet is derived from your Gun SEA keys");
      console.log("💡 It's different from BIP-44 derived wallets");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Export all user data (complete backup)
   */
  private async exportAllUserData(): Promise<void> {
    console.log("\n📦 Export All User Data");
    console.log("═".repeat(60));

    try {
      const backup = await this.wallet.exportAllUserData();
      console.log("✅ Complete backup created (encrypted):");
      console.log(backup.substring(0, 100) + "...");
      console.log("\n💡 This includes:");
      console.log("  - Mnemonic (encrypted)");
      console.log("  - All wallet keys");
      console.log("  - Gun SEA keypair");
      console.log("  - Address book");
      console.log("\n⚠️  KEEP THIS SAFE! Store in secure location.");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Set RPC provider URL
   */
  private async setRpcProvider(): Promise<void> {
    console.log("\n🌐 Set RPC Provider");
    console.log("═".repeat(60));

    console.log("💡 Examples:");
    console.log("  - Mainnet: https://mainnet.infura.io/v3/YOUR_KEY");
    console.log("  - Sepolia: https://sepolia.infura.io/v3/YOUR_KEY");
    console.log("  - Local: http://localhost:8545");

    const rpcUrl = await this.prompt("\nEnter RPC URL: ");

    try {
      await this.wallet.setRpcUrl(rpcUrl);
      console.log("✅ RPC Provider configured successfully");
      console.log("💡 You can now sign and send transactions");
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Send transaction via RPC
   */
  private async sendTransactionRPC(): Promise<void> {
    console.log("\n📤 Send Transaction (via RPC)");
    console.log("═".repeat(60));

    // Check if RPC is configured
    const provider = this.wallet.getProvider();
    if (!provider) {
      console.log("❌ RPC Provider not configured!");
      console.log("💡 Use option 18 to configure RPC first");
      return;
    }

    const to = await this.prompt("To address: ");
    const valueStr = await this.prompt("Value in ETH: ");
    const addressInput = await this.prompt(
      "Address to send from (leave empty for primary): "
    );

    const address = addressInput || (await this.wallet.getPrimaryAddress());

    // Ask for confirmation
    const waitInput = await this.prompt(
      "Wait for confirmation? (y/n, default: y): "
    );
    const waitForConfirmation = waitInput.toLowerCase() !== "n";

    try {
      // Get nonce from network
      const nonce = await provider.getTransactionCount(address);
      
      const tx = {
        to,
        value: ethers.parseEther(valueStr),
        nonce,
        // Let ethers estimate gas
      };

      console.log("\n📝 Transaction Details:");
      console.log(`   From: ${address}`);
      console.log(`   To: ${to}`);
      console.log(`   Value: ${valueStr} ETH`);
      console.log(`   Nonce: ${nonce}`);

      const confirm = await this.prompt("\n⚠️  Confirm send? (yes/no): ");
      
      if (confirm.toLowerCase() !== "yes") {
        console.log("❌ Transaction cancelled");
        return;
      }

      console.log("\n⏳ Sending transaction...");
      
      const result = await this.wallet.sendTransaction(
        tx,
        address,
        waitForConfirmation
      );

      if (result.success) {
        console.log("\n✅ Transaction sent successfully!");
        console.log(`   TX Hash: ${result.txHash}`);
        console.log(`   Etherscan: https://etherscan.io/tx/${result.txHash}`);
        
        if (result.receipt) {
          console.log(`\n📦 Receipt:`);
          console.log(`   Block: ${result.receipt.blockNumber}`);
          console.log(`   Gas Used: ${result.receipt.gasUsed.toString()}`);
          console.log(`   Status: ${result.receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
        }
      } else {
        console.log(`\n❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      console.log(`\n❌ Error: ${error.message}`);
    }
  }

  /**
   * Print header
   */
  private printHeader(): void {
    console.log("╔" + "═".repeat(58) + "╗");
    console.log("║" + " ".repeat(15) + "🗡️  SHOGUN WALLET 🗡️" + " ".repeat(15) + "║");
    console.log("║" + " ".repeat(12) + "SHIP-02: Address Derivation" + " ".repeat(12) + "║");
    console.log("╚" + "═".repeat(58) + "╝");
  }

  /**
   * Prompt user for input
   */
  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Cleanup and exit
   */
  private cleanup(): void {
    this.rl.close();
    process.exit(0);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: yarn tsx ship/examples/wallet-cli.ts <username> <password>");
    console.log("\nExample:");
    console.log("  yarn tsx ship/examples/wallet-cli.ts alice mypassword123");
    process.exit(1);
  }

  const [username, password] = args;

  const cli = new WalletCLI(username, password);
  await cli.start(password);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { WalletCLI };

