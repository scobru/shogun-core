#!/usr/bin/env node
/**
 * Shogun Chat - CLI Interface
 *
 * End-to-end encrypted decentralized chat
 * Simple and functional CLI interface
 */

import { SHIP_00 } from "../implementation/SHIP_00";
import { SHIP_01 } from "../implementation/SHIP_01";

// Only import readline in Node.js environment
let readline: any;
try {
  if (typeof window === 'undefined') {
    readline = require("readline");
  }
} catch (e) {
  // Browser environment - readline not available
}

// ============================================================================
// COLORS
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const c = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`;

// ============================================================================
// CHAT CLI
// ============================================================================

export class MessengerCLI {
  private identity: SHIP_00;
  private messaging: SHIP_01 | null = null;
  private rl: any; // readline.Interface
  private currentUser: string = "";
  private recipient: string = "";
  private derivedAddress: string = "";
  private isAuthenticated: boolean = false;
  private channelToken: string = ""; // Token for channel messages
  private currentChannel: string = ""; // Current channel name

  constructor() {
    // Initialize identity layer (SHIP-00)
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

    // Don't initialize readline in browser environment
    if (typeof window !== 'undefined' || !readline) {
      console.warn('MessengerCLI is designed for Node.js CLI usage only');
      return;
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: c("green", "➤ "),
    });

    this.setupHandlers();
  }

  // ========================================================================
  // SETUP
  // ========================================================================

  private setupHandlers(): void {
    this.rl.on("line", async (line: string) => {
      const input = line.trim();

      if (!input) {
        this.rl.prompt();
        return;
      }

      if (input.startsWith("/")) {
        await this.handleCommand(input);
      } else {
        await this.sendMessage(input);
      }

      this.rl.prompt();
    });

    this.rl.on("close", () => {
      console.log("\n" + c("yellow", "👋 Arrivederci!"));
      process.exit(0);
    });

    // Ctrl+C handler
    process.on("SIGINT", () => {
      this.rl.close();
    });
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  }

  // ========================================================================
  // AUTH
  // ========================================================================

  async login(username: string, password: string): Promise<boolean> {
    console.log(c("cyan", "🔐 Login in corso..."));

    // Loading indicator
    const loadingInterval = setInterval(() => {
      process.stdout.write(c("gray", "."));
    }, 500);

    try {
      // Prova login con timeout (SHIP-00)
      let result = await this.withTimeout(
        this.identity.login(username, password),
        15000,
        "Login timeout - verifica connessione ai peers"
      );

      clearInterval(loadingInterval);
      console.log(""); // Nuova linea dopo i dots

      // Se fallisce, prova signup (SHIP-00)
      if (!result.success) {
        console.log(
          c("yellow", "📝 Utente non trovato, creazione in corso...")
        );

        const signupResult = await this.identity.signup(username, password);

        if (signupResult.success) {
          // Aspetta un momento per evitare race condition
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Riprova login
          result = await this.identity.login(username, password);
        } else {
          console.log(c("red", `❌ Signup fallito: ${signupResult.error}`));
          return false;
        }
      }

      if (result.success) {
        this.currentUser = username;
        this.derivedAddress = result.derivedAddress || "";
        this.isAuthenticated = true;

        console.log("");
        console.log(c("green", "✅ Login effettuato!"));
        console.log(c("gray", `   Username: ${c("bold", username)}`));
        console.log(
          c("gray", `   Public Key: ${result.userPub?.substring(0, 40)}...`)
        );
        console.log(
          c(
            "gray",
            `   Derived Address: ${c("cyan", result.derivedAddress || "")}`
          )
        );
        console.log("");

        console.log(c("yellow", "📢 Pubblicazione chiave pubblica..."));
        await this.identity.publishPublicKey();

        // Aspetta che la chiave sia sincronizzata
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(c("green", "✅ Chiave pubblicata su GunDB"));
        console.log("");

        // Inizializza messaging layer (SHIP-01)
        this.messaging = new SHIP_01(this.identity);
        console.log(c("green", "✅ Messaging inizializzato"));

        // Ascolta messaggi (SHIP-01)
        await this.messaging.listenForMessages((msg) => {
          this.onMessageReceived(msg);
        });

        console.log(
          c("cyan", "💬 Chat pronta! Scrivi /help per i comandi disponibili")
        );
        console.log("");

        return true;
      } else {
        console.log(c("red", `❌ Login fallito: ${result.error}`));
        return false;
      }
    } catch (error: any) {
      clearInterval(loadingInterval);
      console.log("");
      console.log(c("red", `❌ Errore: ${error.message}`));
      return false;
    } finally {
      clearInterval(loadingInterval);
    }
  }

  // ========================================================================
  // MESSAGING
  // ========================================================================

  private async sendMessage(content: string): Promise<void> {
    if (!this.isAuthenticated || !this.messaging) {
      console.log(c("red", "❌ Non autenticato. Usa /login"));
      return;
    }

    try {
      let result;

      // Check if in channel mode or direct message mode
      if (this.currentChannel && this.channelToken) {
        // Send to channel with token encryption
        result = await this.messaging.sendMessageWithToken(
          this.channelToken,
          content,
          this.currentChannel
        );

        if (result.success) {
          const time = new Date().toLocaleTimeString();
          console.log(
            c("gray", `[${time}]`) +
              " " +
              c("magenta", `#${this.currentChannel}`) +
              " " +
              c("green", `${this.currentUser}:`) +
              " " +
              content
          );
        }
      } else if (this.recipient) {
        // Send direct message with ECDH encryption
        result = await this.messaging.sendMessage(this.recipient, content);

        if (result.success) {
          const time = new Date().toLocaleTimeString();
          console.log(
            c("gray", `[${time}]`) +
              " " +
              c("green", `${this.currentUser}:`) +
              " " +
              content
          );
        }
      } else {
        console.log(c("yellow", "⚠️  Usa /to <username> per messaggi diretti o /channel <nome> <token> per canali"));
        return;
      }

      if (!result.success) {
        console.log(c("red", `❌ Errore invio: ${result.error}`));
      }
    } catch (error: any) {
      console.log(c("red", `❌ Errore: ${error.message}`));
    }
  }

  private onMessageReceived(message: {
    from: string;
    content: string;
    timestamp: number;
  }): void {
    const time = new Date(message.timestamp).toLocaleTimeString();
    const fromUser = message.from.substring(0, 10) + "...";

    console.log("");
    console.log(c("cyan", "📨 Nuovo messaggio!"));
    console.log(
      c("gray", `[${time}]`) +
        " " +
        c("cyan", `${fromUser}:`) +
        " " +
        message.content
    );
    console.log("");
    this.rl.prompt();
  }

  private onChannelMessageReceived(message: {
    from: string;
    content: string;
    channel: string;
    timestamp: number;
  }): void {
    const time = new Date(message.timestamp).toLocaleTimeString();
    const fromUser = message.from.substring(0, 10) + "...";

    console.log("");
    console.log(c("magenta", `📡 #${message.channel}`));
    console.log(
      c("gray", `[${time}]`) +
        " " +
        c("cyan", `${fromUser}:`) +
        " " +
        message.content
    );
    console.log("");
    this.rl.prompt();
  }

  // ========================================================================
  // KEY PAIR MANAGEMENT
  // ========================================================================

  private async exportKeyPair(): Promise<void> {
    try {
      // Ottieni il SEA pair completo da SHIP-00
      const seaPair = this.identity.exportKeyPair();
      
      if (!seaPair) {
        console.log(c("red", "❌ Impossibile accedere al SEA pair"));
        return;
      }

      // Converti in base64 per facilità di copia
      const exportData = {
        ...seaPair,
        alias: this.currentUser,
        exportedAt: Date.now()
      };
      const jsonString = JSON.stringify(exportData);
      const base64 = Buffer.from(jsonString).toString('base64');

      console.log("");
      console.log(c("green", "✅ KEY PAIR ESPORTATO"));
      console.log(c("yellow", "═".repeat(60)));
      console.log("");
      console.log(c("bold", "🔑 SEA PAIR (Base64):"));
      console.log("");
      console.log(c("cyan", base64));
      console.log("");
      console.log(c("yellow", "═".repeat(60)));
      console.log("");
      console.log(c("gray", "💾 SALVA QUESTO KEY PAIR IN UN LUOGO SICURO!"));
      console.log(c("gray", "   Puoi usarlo per:"));
      console.log(c("gray", "   - Fare login: /login-pair <keypair>"));
      console.log(c("gray", "   - Importare: /import <keypair>"));
      console.log(c("gray", "   - Backup della tua identità"));
      console.log("");
      console.log(c("red", "⚠️  NON CONDIVIDERE MAI QUESTO KEY PAIR!"));
      console.log(c("red", "   Contiene le tue chiavi private!"));
      console.log("");

      // Salva anche su file (opzionale)
      const fs = await import('fs');
      const filename = `shogun-keypair-${this.currentUser}-${Date.now()}.txt`;
      fs.writeFileSync(filename, base64);
      console.log(c("green", `💾 Key pair salvato anche in: ${filename}`));
      console.log("");

    } catch (error: any) {
      console.log(c("red", `❌ Errore export: ${error.message}`));
    }
  }

  private async importKeyPair(base64KeyPair: string): Promise<void> {
    try {
      // Decodifica da base64
      const jsonString = Buffer.from(base64KeyPair, 'base64').toString('utf-8');
      const keyPairData = JSON.parse(jsonString);

      // Verifica che abbia tutti i campi necessari
      if (!keyPairData.pub || !keyPairData.priv || !keyPairData.epub || !keyPairData.epriv) {
        console.log(c("red", "❌ Key pair invalido. Mancano campi obbligatori."));
        return;
      }

      console.log(c("cyan", "📥 Key pair importato con successo!"));
      console.log(c("gray", `   Utente: ${keyPairData.alias || 'unknown'}`));
      console.log(c("gray", `   Public Key: ${keyPairData.pub.substring(0, 30)}...`));
      console.log("");
      console.log(c("yellow", "💡 Usa /login-pair <keypair> per fare login"));
      console.log("");

    } catch (error: any) {
      console.log(c("red", `❌ Errore import: ${error.message}`));
      console.log(c("gray", "   Verifica che il key pair sia valido"));
    }
  }

  private async loginWithPair(base64KeyPair: string): Promise<void> {
    console.log(c("cyan", "🔐 Login con key pair..."));

    const loadingInterval = setInterval(() => {
      process.stdout.write(c("gray", "."));
    }, 500);

    try {
      // Decodifica key pair
      const jsonString = Buffer.from(base64KeyPair, 'base64').toString('utf-8');
      const keyPairData = JSON.parse(jsonString);

      // Verifica validità
      if (!keyPairData.pub || !keyPairData.priv || !keyPairData.epub || !keyPairData.epriv) {
        throw new Error("Key pair invalido");
      }

      // Crea SEA pair object
      const seaPair = {
        pub: keyPairData.pub,
        priv: keyPairData.priv,
        epub: keyPairData.epub,
        epriv: keyPairData.epriv
      };

      // Login con pair (SHIP-00)
      const result = await this.withTimeout(
        this.identity.loginWithPair(seaPair),
        15000,
        "Login timeout"
      );

      clearInterval(loadingInterval);
      console.log("");

      if (result.success) {
        this.currentUser = keyPairData.alias || result.username || 'unknown';
        this.derivedAddress = await this.identity.deriveEthereumAddress(seaPair.pub);
        this.isAuthenticated = true;

        console.log("");
        console.log(c("green", "✅ Login con key pair effettuato!"));
        console.log(c("gray", `   Username: ${c("bold", this.currentUser)}`));
        console.log(c("gray", `   Public Key: ${seaPair.pub.substring(0, 40)}...`));
        console.log(c("gray", `   Derived Address: ${c("cyan", this.derivedAddress)}`));
        console.log("");

        console.log(c("yellow", "📢 Pubblicazione chiave pubblica..."));
        await this.identity.publishPublicKey();

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(c("green", "✅ Chiave pubblicata su GunDB"));
        console.log("");

        // Inizializza messaging (SHIP-01)
        this.messaging = new SHIP_01(this.identity);

        // Ascolta messaggi
        await this.messaging.listenForMessages((msg) => {
          this.onMessageReceived(msg);
        });

        console.log(c("cyan", "💬 Chat pronta!"));
        console.log("");

        this.updatePrompt();
      } else {
        console.log(c("red", `❌ Login fallito: ${result.error}`));
      }

    } catch (error: any) {
      clearInterval(loadingInterval);
      console.log("");
      console.log(c("red", `❌ Errore: ${error.message}`));
    } finally {
      clearInterval(loadingInterval);
    }
  }

  private async wipeAllMessages(): Promise<void> {
    console.log("");
    console.log(c("yellow", "⚠️  ATTENZIONE: Stai per cancellare TUTTI i messaggi dal nodo GunDB"));
    console.log(c("yellow", "   Questa operazione è IRREVERSIBILE!"));
    console.log("");

    // Conferma
    this.rl.question(c("red", "Sei sicuro? Scrivi 'CONFERMA' per procedere: "), (answer: string) => {
      if (answer.trim() === "CONFERMA") {
        console.log(c("yellow", "🗑️  Cancellazione messaggi in corso..."));

        // Ottieni tutti i messaggi (access GunDB through identity)
        const gun = (this.identity as any).shogun?.db?.gun;
        if (!gun) {
          console.log(c("red", "❌ Impossibile accedere a GunDB"));
          this.rl.prompt();
          return;
        }

        gun.get(SHIP_01.NODES.MESSAGES).once((allMessages: any) => {
          if (allMessages && typeof allMessages === 'object') {
            let count = 0;

            // Cancella ogni messaggio
            for (const [messageId, data] of Object.entries(allMessages)) {
              if (typeof data === "object" && data !== null && messageId !== '_') {
                gun.get(SHIP_01.NODES.MESSAGES).get(messageId).put(null);
                count++;
              }
            }

            console.log(c("green", `✅ ${count} messaggi cancellati dal nodo GunDB`));
          } else {
            console.log(c("gray", "ℹ️  Nessun messaggio da cancellare"));
          }

          console.log("");
          this.rl.prompt();
        });
      } else {
        console.log(c("gray", "❌ Cancellazione annullata"));
        console.log("");
        this.rl.prompt();
      }
    });
  }

  // ========================================================================
  // COMMANDS
  // ========================================================================

  private async handleCommand(cmd: string): Promise<void> {
    const parts = cmd.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "/login":
        if (args.length >= 2) {
          const [username, password] = args;
          await this.login(username, password);
          this.updatePrompt();
        } else {
          console.log(c("yellow", "⚠️  Uso: /login <username> <password>"));
        }
        break;

      case "/to":
      case "/chat":
        if (!this.isAuthenticated) {
          console.log(
            c("red", "❌ Prima fai login: /login <username> <password>")
          );
          break;
        }

        if (args[0]) {
          this.recipient = args[0];
          console.log(
            c("cyan", `💬 Chattando con ${c("bold", this.recipient)}`)
          );

          // Carica storico (SHIP-01)
          if (!this.messaging) {
            console.log(c("red", "❌ Messaging non inizializzato"));
            break;
          }

          const history = await this.messaging.getMessageHistory(this.recipient);
          if (history.length > 0) {
            console.log(
              c(
                "gray",
                `\n📚 Storico conversazione (${history.length} messaggi):\n`
              )
            );
            history.forEach((msg, i) => {
              const time = new Date(msg.timestamp).toLocaleTimeString();
              const isMe = msg.from === this.currentUser;
              const from = isMe ? this.currentUser : this.recipient;
              const color = isMe ? "green" : "cyan";
              console.log(
                c("gray", `[${time}]`) +
                  " " +
                  c(color, `${from}:`) +
                  " " +
                  msg.content
              );
            });
            console.log("");
          }

          this.updatePrompt();
        } else {
          console.log(c("yellow", "⚠️  Uso: /to <username>"));
        }
        break;

      case "/help":
        this.showHelp();
        break;

      case "/clear":
        console.clear();
        this.showHeader();
        break;

      case "/status":
        this.showStatus();
        break;

      case "/logout":
        this.identity.logout();
        this.messaging = null;
        this.isAuthenticated = false;
        this.currentUser = "";
        this.recipient = "";
        console.log(c("yellow", "👋 Disconnesso"));
        this.updatePrompt();
        break;

      case "/export":
      case "/backup":
        if (!this.isAuthenticated) {
          console.log(c("red", "❌ Prima fai login"));
          break;
        }
        await this.exportKeyPair();
        break;

      case "/import":
      case "/restore":
        if (args[0]) {
          await this.importKeyPair(args[0]);
        } else {
          console.log(c("yellow", "⚠️  Uso: /import <keypair-json-base64>"));
        }
        break;

      case "/login-pair":
        if (args[0]) {
          await this.loginWithPair(args[0]);
        } else {
          console.log(c("yellow", "⚠️  Uso: /login-pair <keypair-json-base64>"));
        }
        break;

      case "/wipe":
      case "/delete-all":
        if (!this.isAuthenticated) {
          console.log(c("red", "❌ Prima fai login"));
          break;
        }
        await this.wipeAllMessages();
        break;

      case "/channel":
      case "/join":
        if (!this.isAuthenticated) {
          console.log(c("red", "❌ Prima fai login"));
          break;
        }
        if (args.length >= 2) {
          const [channelName, token] = args;
          await this.joinChannel(channelName, token);
        } else {
          console.log(c("yellow", "⚠️  Uso: /channel <nome> <token>"));
        }
        break;

      case "/leave":
        this.leaveChannel();
        break;

      case "/exit":
      case "/quit":
        this.rl.close();
        break;

      default:
        console.log(c("red", `❌ Comando sconosciuto: ${command}`));
        console.log(c("gray", "   Scrivi /help per aiuto"));
    }
  }

  private async joinChannel(channelName: string, token: string): Promise<void> {
    if (!this.messaging) {
      console.log(c("red", "❌ Messaging non inizializzato"));
      return;
    }

    this.currentChannel = channelName;
    this.channelToken = token;
    this.recipient = ""; // Clear direct message recipient

    console.log("");
    console.log(c("magenta", `📡 Connesso al canale #${channelName}`));
    console.log(c("gray", "   Token: " + "*".repeat(token.length)));
    console.log("");

    // Listen for channel messages
    await this.messaging.listenForTokenMessages(
      token,
      (msg) => this.onChannelMessageReceived(msg),
      channelName
    );

    this.updatePrompt();
  }

  private leaveChannel(): void {
    if (!this.currentChannel) {
      console.log(c("yellow", "⚠️  Non sei in un canale"));
      return;
    }

    console.log(c("yellow", `👋 Uscito dal canale #${this.currentChannel}`));
    this.currentChannel = "";
    this.channelToken = "";
    this.updatePrompt();
  }

  private showHelp(): void {
    console.log("");
    console.log(c("bold", c("cyan", "📖 COMANDI DISPONIBILI")));
    console.log("");
    console.log(c("bold", "AUTENTICAZIONE:"));
    console.log("  " + c("bold", "/login <user> <pass>") + "  - Login/Signup con password");
    console.log("  " + c("bold", "/login-pair <keypair>") + "  - Login con SEA key pair");
    console.log("");
    console.log(c("bold", "MESSAGGISTICA:"));
    console.log("  " + c("bold", "/to <username>") + "        - Chat diretta con utente");
    console.log("  " + c("bold", "/channel <nome> <token>") + " - Entra in canale criptato");
    console.log("  " + c("bold", "/leave") + "                - Esci dal canale");
    console.log("");
    console.log(c("bold", "KEY MANAGEMENT:"));
    console.log("  " + c("bold", "/export") + "                - Esporta il tuo key pair (backup)");
    console.log("  " + c("bold", "/import <keypair>") + "     - Mostra info su key pair");
    console.log("");
    console.log(c("bold", "UTILITÀ:"));
    console.log("  " + c("bold", "/help") + "                 - Mostra questo aiuto");
    console.log("  " + c("bold", "/status") + "               - Mostra stato connessione");
    console.log("  " + c("bold", "/clear") + "                - Pulisci schermo");
    console.log("  " + c("bold", "/wipe") + "                 - Cancella TUTTI i messaggi (⚠️)");
    console.log("  " + c("bold", "/logout") + "               - Disconnetti");
    console.log("  " + c("bold", "/exit") + "                 - Esci dall'app");
    console.log("");
    console.log(c("bold", c("green", "🔐 SICUREZZA")));
    console.log("");
    console.log("  ✅ Crittografia end-to-end (ECDH + AES-GCM)");
    console.log("  ✅ Canali con token condiviso (AES-256)");
    console.log("  ✅ Storage decentralizzato P2P (GunDB)");
    console.log("  ✅ Nessun server può leggere i messaggi");
    console.log("  ✅ Key pair portabile (export/import)");
    console.log("  ✅ Zero costi, completamente gratis");
    console.log("");
    console.log(c("bold", c("yellow", "💡 ESEMPI")));
    console.log("");
    console.log("  " + c("gray", "# Login normale"));
    console.log("  " + c("gray", "/login alice password123"));
    console.log("");
    console.log("  " + c("gray", "# Chat diretta (ECDH)"));
    console.log("  " + c("gray", "/to bob"));
    console.log("  " + c("gray", "Ciao Bob! Come stai?"));
    console.log("");
    console.log("  " + c("gray", "# Canale criptato (token)"));
    console.log("  " + c("gray", "/channel dev-team mySecretToken123"));
    console.log("  " + c("gray", "Messaggio nel canale #dev-team"));
    console.log("");
    console.log("  " + c("gray", "# Export key pair (backup)"));
    console.log("  " + c("gray", "/export"));
    console.log("");
  }

  private showStatus(): void {
    console.log("");
    console.log(c("bold", c("cyan", "📊 STATO SISTEMA")));
    console.log("");
    console.log(
      "  " + c("gray", "Utente:") + " " + c("green", this.currentUser)
    );
    
    if (this.currentChannel) {
      console.log(
        "  " +
          c("gray", "Canale:") +
          " " +
          c("magenta", `#${this.currentChannel}`)
      );
    } else if (this.recipient) {
      console.log(
        "  " +
          c("gray", "Chat con:") +
          " " +
          c("yellow", this.recipient)
      );
    } else {
      console.log(
        "  " +
          c("gray", "Destinatario:") +
          " " +
          c("gray", "(nessuno)")
      );
    }
    
    console.log(
      "  " + c("gray", "Address:") + " " + c("cyan", this.derivedAddress)
    );
    console.log(
      "  " +
        c("gray", "Autenticato:") +
        " " +
        (this.isAuthenticated ? c("green", "✅ Sì") : c("red", "❌ No"))
    );
    console.log("");
  }

  private showHeader(): void {
    console.log("");
    console.log(
      c(
        "bold",
        c("cyan", "═══════════════════════════════════════════════════════")
      )
    );
    console.log(
      c(
        "bold",
        c("cyan", "       🗡️  SHOGUN CHAT - Decentralized E2E Messaging")
      )
    );
    console.log(
      c(
        "bold",
        c("cyan", "═══════════════════════════════════════════════════════")
      )
    );
    console.log("");
    console.log(c("gray", "  Powered by Shogun Core + GunDB"));
    console.log(c("gray", "  Zero-cost encrypted messaging over P2P network"));
    console.log("");
  }

  private updatePrompt(): void {
    let prompt = "";

    if (this.currentChannel) {
      prompt =
        c("green", `[${this.currentUser}]`) +
        c("white", " → ") +
        c("magenta", `#${this.currentChannel}`) +
        c("green", " ➤ ");
    } else if (this.recipient) {
      prompt =
        c("green", `[${this.currentUser}]`) +
        c("white", " → ") +
        c("yellow", this.recipient) +
        c("green", " ➤ ");
    } else if (this.currentUser) {
      prompt = c("green", `[${this.currentUser}]`) + c("green", " ➤ ");
    } else {
      prompt = c("gray", "➤ ");
    }

    this.rl.setPrompt(prompt);
  }

  // ========================================================================
  // START
  // ========================================================================

  async start(): Promise<void> {
    this.showHeader();

    const args = process.argv.slice(2);

    if (args.length >= 2) {
      // Auto-login
      const [username, password] = args;
      const success = await this.login(username, password);

      if (success) {
        this.updatePrompt();
        this.rl.prompt();
      } else {
        console.log(c("red", "❌ Auto-login fallito"));
        this.rl.close();
      }
    } else {
      // Login manuale
      console.log(c("cyan", "💡 Comandi disponibili:"));
      console.log(
        c("yellow", "   /login <username> <password>") +
          c("gray", " - Login o crea account")
      );
      console.log(
        c("yellow", "   /help") +
          c("gray", "                       - Mostra tutti i comandi")
      );
      console.log("");
      console.log(
        c("gray", "   Oppure avvia con: yarn chat <username> <password>")
      );
      console.log("");

      this.updatePrompt();
      this.rl.prompt();
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const cli = new MessengerCLI();
cli.start().catch(console.error);
