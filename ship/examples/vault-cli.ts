#!/usr/bin/env tsx

/**
 * SHIP-07 Secure Vault CLI Example
 * 
 * Test secure encrypted vault with SHIP-07
 * 
 * Usage:
 *   tsx ship/examples/vault-cli.ts <username> <password>
 * 
 * Example:
 *   tsx ship/examples/vault-cli.ts alice pass123
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import { SHIP_07 } from "../implementation/SHIP_07";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  gunOptions: {
    peers: [
      "https://relay.shogun-eco.xyz/gun",
      "https://peer.wallie.io/gun",
    ],
    radisk: true, // Enable persistence for vault
    localStorage: false,
    multicast: false,
  },
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.clear();
  console.log("=".repeat(70));
  console.log("🗡️  SHOGUN SECURE VAULT - SHIP-07 Demo");
  console.log("=".repeat(70));
  console.log();

  // Parse arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: tsx vault-cli.ts <username> <password>");
    console.log();
    console.log("Example:");
    console.log("  tsx vault-cli.ts alice password123");
    console.log();
    process.exit(1);
  }

  const [username, password] = args;

  try {
    // ========================================================================
    // 1. IDENTITY SETUP (SHIP-00)
    // ========================================================================

    console.log("📝 AUTHENTICATION (SHIP-00)");
    console.log("-".repeat(70));

    const identity = new SHIP_00(CONFIG);

    // Try login first
    let authResult = await identity.login(username, password);

    // If login fails, try signup
    if (!authResult.success) {
      console.log("⚠️  User not found, creating new account...");
      authResult = await identity.signup(username, password);
    }

    if (!authResult.success) {
      console.error("❌ Authentication failed:", authResult.error);
      process.exit(1);
    }

    console.log("✅ Authenticated");
    console.log(`   Username: ${username}`);
    console.log(`   Public Key: ${authResult.userPub?.substring(0, 40)}...`);
    if (authResult.derivedAddress) {
      console.log(`   Derived Address: ${authResult.derivedAddress}`);
    }
    console.log();

    // ========================================================================
    // 2. INITIALIZE VAULT (SHIP-07)
    // ========================================================================

    console.log("🔐 INITIALIZING VAULT (SHIP-07)");
    console.log("-".repeat(70));

    const vault = new SHIP_07(identity);
    await vault.initialize();
    
    console.log("✅ Vault initialized");
    console.log();

    // Show stats
    const stats = await vault.getStats();
    console.log("📊 VAULT STATISTICS");
    console.log("-".repeat(70));
    console.log(`   Total Records: ${stats.totalRecords}`);
    console.log(`   Active Records: ${stats.activeRecords}`);
    console.log(`   Deleted Records: ${stats.deletedRecords}`);
    console.log(`   Created: ${new Date(stats.created).toLocaleString()}`);
    
    if (stats.recordsByType && Object.keys(stats.recordsByType).length > 0) {
      console.log(`   Records by Type:`);
      Object.entries(stats.recordsByType).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`);
      });
    }
    console.log();

    // ========================================================================
    // 3. INTERACTIVE VAULT MANAGER
    // ========================================================================

    console.log("💬 VAULT COMMANDS");
    console.log("-".repeat(70));
    console.log("  put <name>              - Store encrypted data");
    console.log("  get <name>              - Retrieve decrypted data");
    console.log("  list                    - List all records");
    console.log("  delete <name>           - Delete record (soft delete)");
    console.log("  update <name>           - Update existing record");
    console.log("  search <query>          - Search records");
    console.log("  export [password]       - Export vault backup");
    console.log("  import <file> [pass]    - Import vault backup");
    console.log("  stats                   - Show vault statistics");
    console.log("  compact                 - Permanently remove deleted");
    console.log("  clear                   - Delete all records");
    console.log("  help                    - Show this help");
    console.log("  exit                    - Exit vault manager");
    console.log();
    console.log("=".repeat(70));
    console.log();

    // Command loop
    let running = true;

    function displayPrompt() {
      if (running) {
        process.stdout.write(`\nvault> `);
      }
    }

    displayPrompt();

    while (running) {
      const input = await prompt("");

      if (!input.trim()) {
        displayPrompt();
        continue;
      }

      const parts = input.trim().split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      try {
        // ====================================================================
        // COMMANDS
        // ====================================================================

        if (command === "exit" || command === "quit") {
          console.log("\n👋 Exiting vault manager...");
          running = false;
          break;
        }

        else if (command === "help") {
          console.log("\n💬 AVAILABLE COMMANDS:");
          console.log("  put <name>              - Store encrypted data");
          console.log("  get <name>              - Retrieve decrypted data");
          console.log("  list                    - List all records");
          console.log("  delete <name>           - Delete record");
          console.log("  update <name>           - Update existing record");
          console.log("  search <query>          - Search records");
          console.log("  export [password]       - Export vault");
          console.log("  import <file> [pass]    - Import vault");
          console.log("  stats                   - Show statistics");
          console.log("  compact                 - Remove deleted permanently");
          console.log("  clear                   - Delete all records");
          console.log("  exit                    - Exit");
        }

        else if (command === "put") {
          if (args.length === 0) {
            console.log("\n❌ Usage: put <name>");
          } else {
            const name = args[0];
            const data = await prompt("Data: ");
            const type = await prompt("Type (password/apiKey/privateKey/note): ");
            const description = await prompt("Description: ");
            const tags = await prompt("Tags (comma-separated): ");

            const metadata = {
              type: type || undefined,
              description: description || undefined,
              tags: tags ? tags.split(",").map(t => t.trim()) : undefined,
            };

            const result = await vault.put(name, data, metadata);
            
            if (result.success) {
              console.log(`\n✅ Record stored: ${name}`);
            } else {
              console.log(`\n❌ Error: ${result.error}`);
            }
          }
        }

        else if (command === "get") {
          if (args.length === 0) {
            console.log("\n❌ Usage: get <name>");
          } else {
            const name = args[0];
            const record = await vault.get(name);
            
            if (record) {
              console.log(`\n📄 RECORD: ${name}`);
              console.log("-".repeat(70));
              console.log(`   Data: ${JSON.stringify(record.data, null, 2)}`);
              console.log(`   Created: ${new Date(record.created).toLocaleString()}`);
              console.log(`   Updated: ${new Date(record.updated).toLocaleString()}`);
              
              if (record.metadata) {
                console.log(`   Metadata:`);
                console.log(`      Type: ${record.metadata.type || "N/A"}`);
                console.log(`      Description: ${record.metadata.description || "N/A"}`);
                console.log(`      Tags: ${record.metadata.tags?.join(", ") || "N/A"}`);
              }
            } else {
              console.log(`\n❌ Record not found: ${name}`);
            }
          }
        }

        else if (command === "list") {
          const filter = args[0];
          const records = filter
            ? await vault.list({ filterByType: filter })
            : await vault.list();
          
          console.log(`\n📚 RECORDS (${records.length}):`);
          
          if (records.length === 0) {
            console.log("   No records found");
          } else {
            records.forEach((name, i) => {
              console.log(`   ${i + 1}. ${name}`);
            });
          }
        }

        else if (command === "delete") {
          if (args.length === 0) {
            console.log("\n❌ Usage: delete <name>");
          } else {
            const name = args[0];
            const confirm = await prompt(`Delete record "${name}"? (y/n): `);
            
            if (confirm.toLowerCase() === "y") {
              const result = await vault.delete(name);
              
              if (result.success) {
                console.log(`\n✅ Record deleted (soft): ${name}`);
                console.log("   Use 'compact' to permanently remove");
              } else {
                console.log(`\n❌ Error: ${result.error}`);
              }
            } else {
              console.log("\n❌ Cancelled");
            }
          }
        }

        else if (command === "update") {
          if (args.length === 0) {
            console.log("\n❌ Usage: update <name>");
          } else {
            const name = args[0];
            const exists = await vault.exists(name);
            
            if (!exists) {
              console.log(`\n❌ Record not found: ${name}`);
            } else {
              const newData = await prompt("New data: ");
              const result = await vault.update(name, newData);
              
              if (result.success) {
                console.log(`\n✅ Record updated: ${name}`);
              } else {
                console.log(`\n❌ Error: ${result.error}`);
              }
            }
          }
        }

        else if (command === "search") {
          if (args.length === 0) {
            console.log("\n❌ Usage: search <query>");
          } else {
            const query = args.join(" ");
            const matches = await vault.search(query);
            
            console.log(`\n🔍 SEARCH RESULTS (${matches.length}):`);
            
            if (matches.length === 0) {
              console.log("   No matches found");
            } else {
              matches.forEach((name, i) => {
                console.log(`   ${i + 1}. ${name}`);
              });
            }
          }
        }

        else if (command === "export") {
          const exportPassword = args[0];
          const backup = await vault.export(exportPassword);
          
          const filename = `vault-backup-${username}-${Date.now()}.enc`;
          fs.writeFileSync(filename, backup);
          
          console.log(`\n✅ VAULT EXPORTED`);
          console.log(`   File: ${filename}`);
          console.log(`   Size: ${backup.length} characters`);
          console.log(`   Encrypted: ${exportPassword ? "Yes" : "No"}`);
        }

        else if (command === "import") {
          if (args.length === 0) {
            console.log("\n❌ Usage: import <file> [password]");
          } else {
            const filename = args[0];
            const importPassword = args[1];
            
            if (!fs.existsSync(filename)) {
              console.log(`\n❌ File not found: ${filename}`);
            } else {
              const backup = fs.readFileSync(filename, "utf-8");
              const result = await vault.import(backup, importPassword, {
                merge: true,
              });
              
              if (result.success) {
                console.log(`\n✅ VAULT IMPORTED`);
                console.log(`   Records: ${result.recordCount || 0}`);
              } else {
                console.log(`\n❌ Error: ${result.error}`);
              }
            }
          }
        }

        else if (command === "stats") {
          const stats = await vault.getStats();
          
          console.log("\n📊 VAULT STATISTICS");
          console.log("-".repeat(70));
          console.log(`   Total Records: ${stats.totalRecords}`);
          console.log(`   Active Records: ${stats.activeRecords}`);
          console.log(`   Deleted Records: ${stats.deletedRecords}`);
          console.log(`   Created: ${new Date(stats.created).toLocaleString()}`);
          console.log(`   Last Modified: ${new Date(stats.lastModified).toLocaleString()}`);
          
          if (stats.recordsByType && Object.keys(stats.recordsByType).length > 0) {
            console.log(`   Records by Type:`);
            Object.entries(stats.recordsByType).forEach(([type, count]) => {
              console.log(`      ${type}: ${count}`);
            });
          }
        }

        else if (command === "compact") {
          const confirm = await prompt("Permanently remove deleted records? (y/n): ");
          
          if (confirm.toLowerCase() === "y") {
            const result = await vault.compact();
            
            if (result.success) {
              console.log(`\n✅ Vault compacted`);
              console.log(`   Removed: ${result.recordCount || 0} records`);
            } else {
              console.log(`\n❌ Error: ${result.error}`);
            }
          } else {
            console.log("\n❌ Cancelled");
          }
        }

        else if (command === "clear") {
          const confirm = await prompt("Delete ALL records? (y/n): ");
          
          if (confirm.toLowerCase() === "y") {
            const result = await vault.clear();
            
            if (result.success) {
              console.log(`\n✅ Vault cleared`);
              console.log(`   Deleted: ${result.recordCount || 0} records`);
            } else {
              console.log(`\n❌ Error: ${result.error}`);
            }
          } else {
            console.log("\n❌ Cancelled");
          }
        }

        else {
          console.log(`\n❌ Unknown command: ${command}`);
          console.log("Type 'help' for available commands");
        }

      } catch (error: any) {
        console.error(`\n❌ Error: ${error.message}`);
      }

      displayPrompt();
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

// ============================================================================
// RUN
// ============================================================================

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

