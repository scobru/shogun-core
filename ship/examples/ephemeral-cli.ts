#!/usr/bin/env tsx

/**
 * SHIP-06 Ephemeral Chat - STANDALONE
 * 
 * NO login/password required!
 * 
 * Usage:
 *   tsx ship/examples/ephemeral-cli.ts <nickname> <room>
 * 
 * Example:
 *   tsx ship/examples/ephemeral-cli.ts alice test-room
 */

import { SHIP_06 } from "../implementation/SHIP_06";
import * as readline from "readline";

// ============================================================================
// GUN PEERS
// ============================================================================

const GUN_PEERS = [
  "https://v5g5jseqhgkp43lppgregcfbvi.srv.us/gun",
  "https://relay.shogun-eco.xyz/gun",
  "https://peer.wallie.io/gun",
];

// ============================================================================
// CLI
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
  console.log("🗡️  SHOGUN EPHEMERAL CHAT");
  console.log("=".repeat(70));

  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: tsx ephemeral-cli.ts <nickname> <room>");
    console.log();
    console.log("Example:");
    console.log("  tsx ephemeral-cli.ts alice test-room");
    console.log();
    process.exit(1);
  }

  const [nickname, roomId] = args;

  try {
    console.log(`✅ Welcome ${nickname}!`);
    console.log(`📡 Connecting to room: ${roomId}...`);

    // Create ephemeral chat (NO login required!)
    const ephemeral = new SHIP_06(GUN_PEERS, roomId, { debug: false });
    await ephemeral.connect();
    
    console.log(`✅ Connected!`);
    console.log();

    // ========================================================================
    // EVENTS
    // ========================================================================

    ephemeral.onPeerSeen((address) => {
      console.log(`\n👋 Peer joined: ${address.substring(0, 12)}... (Total: ${ephemeral.getPeers().length})`);
      displayPrompt();
    });

    ephemeral.onPeerLeft((address) => {
      console.log(`\n👋 Peer left: ${address.substring(0, 12)}... (Total: ${ephemeral.getPeers().length})`);
      displayPrompt();
    });

    ephemeral.onMessage((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const icon = msg.type === "broadcast" ? "📢" : "📨";
      console.log(`\n${icon} [${time}] ${msg.from.substring(0, 8)}...: ${msg.content}`);
      displayPrompt();
    });

    // ========================================================================
    // CHAT
    // ========================================================================

    console.log("💬 COMMANDS: /peers /direct /help /exit");
    console.log("=".repeat(70));
    console.log();

    let running = true;

    function displayPrompt() {
      if (running) {
        process.stdout.write(`\n${nickname}> `);
      }
    }

    displayPrompt();

    while (running) {
      const input = await prompt("");

      if (!input.trim()) {
        displayPrompt();
        continue;
      }

      // Commands
      if (input.startsWith("/")) {
        const command = input.toLowerCase();

        if (command === "/exit" || command === "/quit") {
          console.log("\n👋 Bye!");
          ephemeral.disconnect();
          running = false;
          break;
        }

        else if (command === "/peers") {
          const peers = ephemeral.getPeers();
          console.log(`\n👥 Peers (${peers.length}):`);
          if (peers.length === 0) {
            console.log("   No peers");
          } else {
            peers.forEach((peer, i) => {
              console.log(`   ${i + 1}. ${peer}`);
            });
          }
          console.log(); // Add blank line
          displayPrompt(); // Show prompt again
          continue; // Continue to next iteration
        }
        
        else if (command === "/debug") {
          console.log("\n🔍 DEBUG INFO:");
          console.log(`   My address: ${ephemeral.getAddress()}`);
          console.log(`   Swarm ID: ${ephemeral.getSwarmId().substring(0, 32)}...`);
          console.log(`   Peers: ${ephemeral.getPeers().length}`);
          console.log();
          displayPrompt();
          continue;
        }

        else if (command.startsWith("/direct")) {
          const peers = ephemeral.getPeers();
          if (peers.length === 0) {
            console.log("\n❌ No peers");
            console.log();
            displayPrompt();
            continue;
          } else {
            console.log("\n👥 Select peer:");
            peers.forEach((peer, i) => {
              console.log(`   ${i + 1}. ${peer}`);
            });
            const peerIndex = await prompt("\nPeer number: ");
            const selectedPeer = peers[parseInt(peerIndex) - 1];
            
            if (selectedPeer) {
              const message = await prompt("Message: ");
              if (message.trim()) {
                await ephemeral.sendDirect(selectedPeer, message);
                console.log(`✅ Sent to ${selectedPeer.substring(0, 8)}...`);
              }
            } else {
              console.log("❌ Invalid");
            }
            console.log();
            displayPrompt();
            continue;
          }
        }

        else if (command === "/help") {
          console.log("\n💬 COMMANDS:");
          console.log("  /peers  - List peers");
          console.log("  /direct - Direct message");
          console.log("  /help   - This help");
          console.log("  /exit   - Exit");
          console.log();
          displayPrompt();
          continue;
        }

        else {
          console.log(`\n❌ Unknown: ${command}`);
          displayPrompt();
          continue;
        }
      }

      // Send broadcast
      try {
        await ephemeral.sendBroadcast(input);
        const time = new Date().toLocaleTimeString();
        console.log(`📢 [${time}] You: ${input}`);
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

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
