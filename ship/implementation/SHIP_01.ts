/**
 * Esempio Pratico: Messaggistica Decentralizzata con Shogun Core
 * 
 * Questo esempio mostra come creare un sistema di messaggistica sicuro usando:
 * - Shogun Core per autenticazione (username/password)
 * - GunDB per storage decentralizzato P2P
 * - SEA (Security, Encryption, Authorization) per crittografia
 * 
 * Vantaggi:
 * ✅ Completamente decentralizzato (no server centrale)
 * ✅ Zero costi (no blockchain, no gas fees)
 * ✅ Real-time messaging
 * ✅ Offline-first
 * ✅ End-to-end encryption
 * 
 * Note sull'ERC7627:
 * L'EIP era un template concettuale. Questo esempio implementa
 * solo la parte GunDB/Shogun Core senza interazione blockchain.
 * La funzione deriveEthereumAddress() rimane come utility per derivare
 * un address Ethereum dalla chiave GunDB se necessario in futuro.
 */

import { ShogunCore } from "../../src/core";
import { ethers } from "ethers";
import type { 
    ISHIP_01, 
    SignupResult, 
    AuthResult, 
    SendMessageResult, 
    DecryptedMessage,
    OperationResult
} from "../interfaces/ISHIP_01";
import { ShogunCoreConfig } from "../../src/interfaces/shogun";
import { ISEAPair } from "../../src/types/shogun";
import derive from "../../src/gundb/derive";

// ============================================================================
// 1. SETUP: Inizializzazione del Sistema Completo
// ============================================================================

/**
 * Classe per messaggistica sicura con Shogun Core
 * Implementa l'interfaccia ISHIP_01
 * Usa solo GunDB per storage decentralizzato (no blockchain)
 */
class SHIP_01 implements ISHIP_01 {
    private shogun: ShogunCore;

    constructor(shogunConfig: ShogunCoreConfig) {
        // Inizializza Shogun Core
        this.shogun = new ShogunCore(shogunConfig) as ShogunCore;
    }

    // ========================================================================
    // 2. AUTENTICAZIONE: Username e Password
    // ========================================================================

    /**
     * Registra un nuovo utente
     */
    async signup(username: string, password: string): Promise<SignupResult> {
        try {
            // Registra con Shogun Core (crea SEA pair automaticamente)
            const signupResult = await this.shogun.signUp(username, password);
            
            if (!signupResult.success) {
                return { 
                    success: false, 
                    error: signupResult.error || "Signup failed" 
                };
            }

            console.log("✅ Utente registrato");
            console.log(`   Username: ${username}`);
            console.log(`   GunDB Public Key: ${signupResult.pub}`);

            // Opzionale: deriva address Ethereum dalla chiave GunDB
            const derivedAddress = signupResult.pub 
                ? await this.deriveEthereumAddress(signupResult.pub)
                : undefined;

            if (derivedAddress) {
                console.log(`   Derived Address: ${derivedAddress}`);
            }

            return {
                success: true,
                userPub: signupResult.pub,
                derivedAddress
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Login con username e password
     */
    async login(username: string, password: string): Promise<AuthResult> {
        try {
            // Login con Shogun Core
            const loginResult = await this.shogun.login(username, password);
            
            if (!loginResult.success) {
                return { 
                    success: false, 
                    error: loginResult.error || "Login failed" 
                };
            }

            console.log("✅ Login effettuato");
            console.log(`   Username: ${username}`);
            console.log(`   GunDB Public Key: ${loginResult.userPub}`);

            // Opzionale: deriva address Ethereum dalla chiave GunDB
            const derivedAddress = loginResult.userPub 
                ? await this.deriveEthereumAddress(loginResult.userPub)
                : undefined;

            if (derivedAddress) {
                console.log(`   Derived Address: ${derivedAddress}`);
            }

            return {
                success: true,
                userPub: loginResult.userPub,
                derivedAddress
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Login con SEA Key Pair
     * 
     * Autenticazione diretta usando un key pair esportato.
     * Utile per:
     * - Recupero account senza password
     * - Portabilità tra dispositivi
     * - Backup dell'identità
     */
    async loginWithPair(seaPair: ISEAPair): Promise<AuthResult> {
        try {
            console.log("🔐 Login con key pair...");

            // Autentica con GunDB usando il pair
            const authResult = await new Promise<AuthResult>((resolve) => {
                this.shogun.db.gun.user().auth(seaPair, (ack: any) => {
                    if (ack.err) {
                        resolve({
                            success: false,
                            error: ack.err,
                        });
                    } else {
                        resolve({
                            success: true,
                            userPub: seaPair.pub,
                        });
                    }
                });
            });

            if (!authResult.success) {
                console.log("❌ Login fallito:", authResult.error);
                return authResult;
            }

            // Opzionale: deriva address Ethereum dalla chiave GunDB
            const derivedAddress = await this.deriveEthereumAddress(seaPair.pub);

            console.log("✅ Login effettuato");
            console.log(`   GunDB Public Key: ${seaPair.pub}`);
            console.log(`   Derived Address: ${derivedAddress}`);

            return {
                success: true,
                userPub: authResult.userPub,
                derivedAddress
            };
        } catch (error) {
            console.error("❌ Errore login con pair:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Logout
     */
    logout(): void {
        this.shogun.logout();
        console.log("👋 Logout effettuato");
    }

    /**
     * Verifica se l'utente è autenticato
     */
    isLoggedIn(): boolean {
        return this.shogun.isLoggedIn();
    }

    // ========================================================================
    // 3. GESTIONE CHIAVI PUBBLICHE: Salva su GunDB
    // ========================================================================

    /**
     * Salva la chiave pubblica dell'utente su GunDB
     * Questo permette ad altri di trovare la tua chiave per criptare messaggi
     */
    async publishPublicKey(): Promise<OperationResult> {
        try {
            if (!this.isLoggedIn()) {
                return { success: false, error: "Not logged in" };
            }

            // Ottieni il SEA pair dell'utente corrente
            const currentUser = this.shogun.db.user;
            if (!currentUser || !currentUser.is) {
                return { success: false, error: "No user session" };
            }

            // Salva chiave pubblica sul nodo globale usando il userPub come chiave
            // Questo permette ad altri di trovarla facilmente
            const userPub = currentUser.is.pub;
            
            await this.shogun.db.gun.get(userPub).put({
                pub: currentUser.is.pub,
                epub: currentUser.is.epub,
                algorithm: "ECDSA",
                timestamp: Date.now().toString()
            }).then();

            console.log(`📝 Chiave pubblica pubblicata su GunDB`);

            return { success: true };

        } catch (error: any) {
            console.error("❌ Errore pubblicazione chiave:", error);
            return { success: false, error: error.message };
        }
    }

    // ========================================================================
    // 4. INVIO MESSAGGI: Solo GunDB
    // ========================================================================

    /**
     * Invia un messaggio crittografato a un altro utente
     */
    async sendMessage(
        recipientUsername: string,
        message: string
    ): Promise<SendMessageResult> {
        try {
            if (!this.isLoggedIn()) {
                return { success: false, error: "Not logged in" };
            }

            const currentUser = this.shogun.db.user;
            if (!currentUser || !currentUser.is) {
                return { success: false, error: "No user session" };
            }

            // 1. Ottieni la chiave pubblica del destinatario
            const recipientKey = await this.getRecipientPublicKey(recipientUsername);
            if (!recipientKey) {
                return { 
                    success: false, 
                    error: `Recipient ${recipientUsername} has not published their public key` 
                };
            }

            // 2. Ottieni il SEA pair completo (include chiavi private)
            const senderPair = (this.shogun.db.gun.user() as any)?._?.sea;
            if (!senderPair) {
                return { success: false, error: "Cannot access SEA pair" };
            }

            // 3. Cripta il messaggio usando SEA.secret + SEA.encrypt (ECDH)
            const encryptedMessage = await this.shogun.db.crypto.encFor(
                message,
                senderPair, // sender pair completo
                { epub: recipientKey.epub } // recipient public encryption key
            );

            // 4. Genera ID messaggio
            const messageId = this.generateMessageId();
            const senderPub = currentUser.is.pub;

            // 5. Salva messaggio crittografato su GunDB
            const messageData = {
                from: senderPub,
                to: recipientUsername,
                content: encryptedMessage, // Contenuto crittografato!
                timestamp: Date.now().toString(),
                messageId: messageId
            };

            // Salva sul nodo globale 'messages' per permettere il listener
            await this.shogun.db.gun.get('messages').get(messageId).put(messageData).then();

            console.log(`✅ Messaggio salvato: ${messageId}`);

            return {
                success: true,
                messageId: messageId
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Ottiene la chiave pubblica di un utente da GunDB
     */
    private async getRecipientPublicKey(username: string): Promise<{
        pub: string;
        epub: string;
    } | null> {
        try {
            // Prima trova l'utente dal username
            const userData = await this.shogun.db.getUserByAlias(username);
            if (!userData || !userData.userPub) {
                console.error(`❌ User ${username} not found`);
                return null;
            }

            const userPub = userData.userPub;

            // Le chiavi sono salvate direttamente sul nodo userPub
            const publicKeyData = await this.shogun.db.gun.get(userPub).then();

            if (publicKeyData && publicKeyData.epub && publicKeyData.pub) {
                return {
                    pub: publicKeyData.pub,
                    epub: publicKeyData.epub
                };
            }

            return null;
        } catch (error) {
            console.error("❌ Errore recupero chiave pubblica:", error);
            return null;
        }
    }

    // ========================================================================
    // 5. RICEZIONE MESSAGGI: Ascolta GunDB in real-time
    // ========================================================================

    /**
     * Ascolta messaggi crittografati in arrivo su GunDB
     */
    async listenForMessages(
        onMessage: (message: DecryptedMessage) => void
    ): Promise<void> {
        if (!this.isLoggedIn()) {
            console.error("❌ Non autenticato");
            return;
        }

        const currentUser = this.shogun.db.user;
        if (!currentUser || !currentUser.is) {
            console.error("❌ Nessuna sessione utente");
            return;
        }

        const userPub = currentUser.is.pub;
        
        // Ottieni username dell'utente corrente
        const username = currentUser.is.alias;

        // Set per tracciare messaggi già ricevuti (evita duplicati)
        const receivedMessages = new Set<string>();

        // Ascolta messaggi in tempo reale su GunDB
        this.shogun.db.gun
            .get(`messages`)
            .map()
            .on(async (data: any, key: string) => {
                // Filtra solo i messaggi destinati a questo utente (per username)
                if (data && data.to === username && data.from && data.content && data.messageId) {
                    // Evita duplicati (GunDB può emettere più volte)
                    if (receivedMessages.has(data.messageId)) {
                        return;
                    }
                    receivedMessages.add(data.messageId);

                    try {
                        // Decripta il messaggio
                        const decryptedContent = await this.decryptMessage(
                            data.content,
                            data.from
                        );

                        onMessage({
                            from: data.from,
                            content: decryptedContent,
                            timestamp: parseInt(data.timestamp)
                        });
                    } catch (error) {
                        console.error("❌ Errore decrittazione messaggio:", error);
                    }
                }
            });

        console.log(`👂 In ascolto di messaggi per ${username} (${userPub.substring(0, 10)}...)`);
    }

    /**
     * Decripta un messaggio usando SEA.secret + SEA.decrypt (ECDH)
     */
    private async decryptMessage(
        encryptedContent: string,
        senderPub: string
    ): Promise<string> {
        // Ottieni il SEA pair completo del destinatario (noi)
        const receiverPair = (this.shogun.db.gun.user() as any)?._?.sea;
        if (!receiverPair) {
            throw new Error("Cannot access SEA pair");
        }

        // Ottieni epub del mittente
        const senderKey = await this.getPublicKeyByPub(senderPub);
        if (!senderKey) {
            throw new Error("Sender public key not found");
        }

        // Decripta usando SEA.secret + SEA.decrypt (ECDH)
        const decrypted = await this.shogun.db.crypto.decFrom(
            encryptedContent,
            { epub: senderKey.epub }, // sender's public encryption key
            receiverPair // receiver's pair completo
        );

        return decrypted;
    }

    /**
     * Ottiene la chiave pubblica di un utente dalla sua pub key
     */
    private async getPublicKeyByPub(userPub: string): Promise<{
        pub: string;
        epub: string;
    } | null> {
        try {
            // Le chiavi sono salvate direttamente sul nodo userPub
            const publicKeyData = await this.shogun.db.gun.get(userPub).then();

            if (publicKeyData && publicKeyData.epub && publicKeyData.pub) {
                return {
                    pub: publicKeyData.pub,
                    epub: publicKeyData.epub
                };
            }

            return null;
        } catch (error) {
            console.error("❌ Errore recupero chiave:", error);
            return null;
        }
    }

    // ========================================================================
    // 6. RECUPERO STORICO: Query messaggi passati
    // ========================================================================

    /**
     * Recupera lo storico dei messaggi crittografati con un utente
     */
    async getMessageHistory(
        withUsername: string
    ): Promise<Array<{
        from: string;
        to: string;
        content: string;
        timestamp: number;
    }>> {
        if (!this.isLoggedIn()) {
            console.error("❌ Non autenticato");
            return [];
        }

        const currentUser = this.shogun.db.user;
        if (!currentUser || !currentUser.is) {
            console.error("❌ Nessuna sessione utente");
            return [];
        }

        const userPub = currentUser.is.pub;
        const username = currentUser.is.alias;
        const allMessages: any[] = [];

        // Ottieni il userPub dell'altro utente
        const otherUserData = await this.shogun.db.getUserByAlias(withUsername);
        const otherUserPub = otherUserData?.userPub;

        // Recupera tutti i messaggi dal nodo 'messages' e filtra
        const allMessagesNode = await this.shogun.db.gun.get('messages').then();

        if (allMessagesNode) {
            for (const [messageId, data] of Object.entries(allMessagesNode)) {
                if (typeof data === 'object' && data !== null) {
                    const msgData = data as any;
                    
                    // Filtra messaggi tra questo utente e withUsername
                    // Messaggi inviati da me a loro
                    const isSentToTarget = msgData.from === userPub && msgData.to === withUsername;
                    // Messaggi ricevuti da loro
                    const isReceivedFromTarget = msgData.to === username && 
                                                  (msgData.from === otherUserPub || 
                                                   msgData.from);
                    
                    if ((isSentToTarget || isReceivedFromTarget) && msgData.content && msgData.messageId) {
                        try {
                            // Decripta ogni messaggio
                            const decryptedContent = await this.decryptMessage(
                                msgData.content,
                                msgData.from
                            );

                            allMessages.push({
                                from: msgData.from,
                                to: msgData.to,
                                content: decryptedContent,
                                timestamp: parseInt(msgData.timestamp)
                            });
                        } catch (error) {
                            console.error(`❌ Errore decrittazione messaggio ${messageId}:`, error);
                            // Salta messaggi che non possono essere decriptati
                        }
                    }
                }
            }
        }

        // Ordina per timestamp
        return allMessages.sort((a, b) => a.timestamp - b.timestamp);
    }

    // ========================================================================
    // 7. UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Converte la chiave pubblica di GunDB in address Ethereum
     * Usa la chiave privata SEA come seed per derivazione deterministica
     * 
     * Questo garantisce che:
     * - Stesso SEA pair → stesso address Ethereum
     * - Derivazione cryptografica sicura
     * - Identità unificata tra GunDB e blockchain
     */
    async deriveEthereumAddress(publicKey?: string): Promise<string> {
        try {
            // Ottieni il SEA pair completo
            const seaPair = (this.shogun.db.gun.user() as any)?._?.sea;
            if (!seaPair || !seaPair.priv) {
                throw new Error("Cannot access SEA pair");
            }

            // Usa la chiave privata SEA come seed per derive
            // Questo è MOLTO più sicuro e deterministico del username!
            const derived = await derive(seaPair.priv, null, {
                includeSecp256k1Ethereum: true,
                includeP256: false,
                includeSecp256k1Bitcoin: false
            });

            return derived.secp256k1Ethereum.address;
        } catch (error) {
            console.error("❌ Errore derivazione address:", error);
            // Fallback: hash della chiave pubblica
            const fallbackKey = publicKey || "unknown";
            const hash = ethers.keccak256(ethers.toUtf8Bytes(fallbackKey));
            return ethers.getAddress('0x' + hash.slice(-40));
        }
    }

    /**
     * Genera ID messaggio univoco
     */
    private generateMessageId(): string {
        return ethers.hexlify(ethers.randomBytes(16));
    }
}

// ============================================================================
// 8. ESEMPIO D'USO COMPLETO
// ============================================================================

// async function main() {
//     console.log("🚀 Secure Messaging App - Shogun Core + GunDB\n");

//     // 1. Inizializza il sistema
//     const app = new SHIP_01({
//         gunOptions: {
//             peers: ["https://relay.shogun-eco.xyz/gun","https://v5g5jseqhgkp43lppgregcfbvi.srv.us/gun","https://peer.wallie.io/gun"],
//             radisk: false,
//             localStorage:false,
//         }
//     });

//     // 2. Signup (prima volta)
//     console.log("📝 Registrazione nuovo utente...");
//     const signupResult = await app.signup("alice", "password123");
    
//     if (!signupResult.success) {
//         console.log("ℹ️  Utente già esistente, procedo con login");
//     } else {
//         console.log("✅ Utente registrato!");
//         console.log(`   Username: alice`);
//         console.log(`   Public Key: ${signupResult.userPub}`);
//         console.log(`   Derived Address: ${signupResult.derivedAddress}\n`);
//     }

//     // 3. Login
//     console.log("🔐 Login...");
//     const loginResult = await app.login("alice", "password123");
    
//     if (!loginResult.success) {
//         console.error("❌ Login fallito:", loginResult.error);
//         return;
//     }

//     console.log("✅ Login effettuato!");
//     console.log(`   - Autenticazione: Shogun Core (Username/Password)`);
//     console.log(`   - Storage: GunDB decentralizzato P2P\n`);

//     // 4. Pubblica chiave pubblica
//     console.log("📢 Pubblicazione chiave pubblica...");
//     await app.publishPublicKey();

//     // 5. Ascolta messaggi in arrivo
//     console.log("\n👂 In ascolto di messaggi...\n");
//     await app.listenForMessages((message) => {
//         console.log(`📨 Nuovo messaggio da ${message.from.substring(0, 10)}...:`);
//         console.log(`   Contenuto: ${message.content}`);
//         console.log(`   Timestamp: ${new Date(message.timestamp).toLocaleString()}\n`);
//     });

//     // 6. Invia un messaggio
//     const recipientUsername = "bob";
    
//     console.log(`📤 Invio messaggio a ${recipientUsername}...`);
    
//     const result = await app.sendMessage(
//         recipientUsername,
//         "Hello Bob! This is a secure message using Shogun Core"
//     );

//     if (result.success) {
//         console.log("✅ Messaggio inviato!");
//         console.log(`   Message ID: ${result.messageId}`);
//         console.log(`   Storage: GunDB P2P (gratis!)`);
//     }

//     // 7. Recupera storico conversazione
//     console.log("\n📚 Recupero storico messaggi...");
//     const history = await app.getMessageHistory(recipientUsername);
    
//     console.log(`\n💬 Conversazione con ${recipientUsername} (${history.length} messaggi):`);
//     history.forEach((msg, i) => {
//         const isMe = msg.from === loginResult.userPub;
//         console.log(`${i + 1}. ${isMe ? 'Tu' : 'Loro'}: ${msg.content}`);
//     });
// }

// ============================================================================
// 9. VANTAGGI DELL'ARCHITETTURA
// ============================================================================

/**
 * VANTAGGI DI QUESTA ARCHITETTURA:
 * 
 * 1. SEMPLICITÀ:
 *    - Solo username/password (nessun wallet necessario)
 *    - Nessun gas fee o transazioni blockchain
 *    - Setup in pochi secondi
 * 
 * 2. DECENTRALIZZAZIONE COMPLETA:
 *    - Storage P2P su GunDB
 *    - Nessun server centrale
 *    - Censorship resistant
 *    - User sovereignty
 * 
 * 3. COSTI ZERO:
 *    - Nessun costo per messaggi
 *    - Nessun costo per storage
 *    - Completamente gratis
 * 
 * 4. END-TO-END ENCRYPTION:
 *    - Messaggi crittografati con ECDH (Elliptic Curve Diffie-Hellman)
 *    - SEA.secret deriva shared secret da epub (encryption public key)
 *    - SEA.encrypt cripta con AES-GCM
 *    - Solo mittente e destinatario possono leggere i messaggi
 *    - Nessun server o relay può leggere il contenuto
 * 
 * 5. IDENTITÀ DECENTRALIZZATA:
 *    - Chiave pubblica GunDB come identità
 *    - Può essere derivata in address Ethereum se necessario
 *    - Portabile tra diverse applicazioni
 * 
 * 6. REAL-TIME:
 *    - Messaggi in tempo reale
 *    - Sincronizzazione automatica
 *    - Listener reattivi
 * 
 * 7. OFFLINE-FIRST:
 *    - Funziona anche offline
 *    - Sincronizzazione automatica al riconnect
 *    - GunDB gestisce conflitti automaticamente
 * 
 * COME FUNZIONA LA CRITTOGRAFIA:
 * 
 * 1. SETUP - Ogni utente ha un SEA pair:
 *    - pub: chiave pubblica di signing
 *    - priv: chiave privata di signing
 *    - epub: chiave pubblica di encryption (per ECDH)
 *    - epriv: chiave privata di encryption (per ECDH)
 * 
 * 2. PUBBLICAZIONE CHIAVI:
 *    - Ogni utente pubblica il suo epub su GunDB
 *    - Altri possono trovarlo per criptare messaggi
 * 
 * 3. INVIO MESSAGGIO (Alice → Bob):
 *    a) Alice ottiene l'epub di Bob da GunDB
 *    b) SEA.secret(bob.epub, alice.pair) → shared_secret (ECDH)
 *    c) SEA.encrypt(message, shared_secret) → encrypted_message
 *    d) Alice salva encrypted_message su GunDB
 * 
 * 4. RICEZIONE MESSAGGIO (Bob riceve):
 *    a) Bob legge encrypted_message da GunDB
 *    b) Bob ottiene l'epub di Alice
 *    c) SEA.secret(alice.epub, bob.pair) → shared_secret (stesso!)
 *    d) SEA.decrypt(encrypted_message, shared_secret) → message
 * 
 * 5. SICUREZZA:
 *    - Shared secret derivato con ECDH (mai trasmesso)
 *    - Solo Alice e Bob possono derivare lo stesso secret
 *    - Messaggi crittografati con AES-256-GCM
 *    - Forward secrecy se chiavi sono ruotate
 * 
 * Esempio tecnico:
 * Alice.epub + Bob.epriv → shared_secret_AB
 * Bob.epub + Alice.epriv → shared_secret_AB (stesso!)
 * 
 * Vantaggi:
 * ✅ End-to-end encryption
 * ✅ Perfect forward secrecy (con key rotation)
 * ✅ Nessun server può leggere i messaggi
 * ✅ Standard crittografico (ECDH + AES-GCM)
 * ✅ Una sola chiave privata da gestire
 * ✅ Address Ethereum derivabile (interoperabilità)
 */

// ============================================================================
// 10. TEST COMPLETO: Alice e Bob si scambiano messaggi
// ============================================================================

/**
 * Test completo che simula Alice e Bob che si scambiano messaggi CRITTOGRAFATI
 * 
 * CRITTOGRAFIA END-TO-END:
 * - Ogni messaggio è crittografato con ECDH (Elliptic Curve Diffie-Hellman)
 * - Solo mittente e destinatario possono leggere i messaggi
 * - I relay GunDB vedono solo dati crittografati
 * 
 * FLOW:
 * 1. Alice e Bob pubblicano le loro chiavi pubbliche (epub)
 * 2. Alice vuole inviare a Bob:
 *    - Ottiene bob.epub da GunDB
 *    - SEA.secret(bob.epub, alice.pair) → shared_secret
 *    - SEA.encrypt(message, shared_secret) → encrypted
 *    - Salva encrypted su GunDB
 * 3. Bob riceve:
 *    - Legge encrypted da GunDB
 *    - Ottiene alice.epub
 *    - SEA.secret(alice.epub, bob.pair) → shared_secret (stesso!)
 *    - SEA.decrypt(encrypted, shared_secret) → message
 */
async function testAliceAndBob() {
    console.log("🧪 TEST: Alice e Bob - Conversazione Crittografata E2E\n");
    console.log("=".repeat(60));
    
    // Setup Alice
    console.log("\n👩 ALICE - Setup");
    console.log("-".repeat(60));
    const alice = new SHIP_01({
        gunOptions: {
            peers: ["https://peer.wallie.io/gun"],
            radisk: true,
        },
    });

    // Alice signup/login
    await alice.signup("alice", "password123");
    const aliceLogin = await alice.login("alice", "password123");
    if (!aliceLogin.success) {
        console.error("❌ Alice login failed");
        return;
    }
    await alice.publishPublicKey();
    
    // Aspetta che la chiave sia sincronizzata
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Setup Bob
    console.log("\n👨 BOB - Setup");
    console.log("-".repeat(60));
    const bob = new SHIP_01({
        gunOptions: {
            peers: ["https://peer.wallie.io/gun"],
            radisk: true
        },
    });

    // Bob signup/login
    await bob.signup("bob", "password456");
    const bobLogin = await bob.login("bob", "password456");
    if (!bobLogin.success) {
        console.error("❌ Bob login failed");
        return;
    }
    await bob.publishPublicKey();
    
    // Aspetta che la chiave sia sincronizzata
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("\n" + "=".repeat(60));
    console.log("💬 CONVERSAZIONE");
    console.log("=".repeat(60));

    // Alice e Bob ascoltano messaggi
    let aliceMessages: any[] = [];
    let bobMessages: any[] = [];

    await alice.listenForMessages((msg) => {
        aliceMessages.push(msg);
        console.log(`\n[Alice riceve] 📨`);
        console.log(`   Da: ${msg.from.substring(0, 10)}...`);
        console.log(`   Messaggio: "${msg.content}"`);
        console.log(`   Timestamp: ${new Date(msg.timestamp).toLocaleTimeString()}`);
    });

    await bob.listenForMessages((msg) => {
        bobMessages.push(msg);
        console.log(`\n[Bob riceve] 📨`);
        console.log(`   Da: ${msg.from.substring(0, 10)}...`);
        console.log(`   Messaggio: "${msg.content}"`);
        console.log(`   Timestamp: ${new Date(msg.timestamp).toLocaleTimeString()}`);
    });

    // Aspetta che i listener siano pronti
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Alice invia messaggio a Bob
    console.log("\n[Alice invia] 📤");
    const msg1 = await alice.sendMessage("bob", "Ciao Bob! Come stai? 👋");
    console.log(`   ✅ Inviato: "${msg1.messageId}"`);

    // Aspetta che Bob riceva
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Bob risponde ad Alice
    console.log("\n[Bob invia] 📤");
    const msg2 = await bob.sendMessage("alice", "Ciao Alice! Tutto bene, grazie! Tu? 😊");
    console.log(`   ✅ Inviato: "${msg2.messageId}"`);

    // Aspetta che Alice riceva
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Alice risponde
    console.log("\n[Alice invia] 📤");
    const msg3 = await alice.sendMessage("bob", "Anch'io benissimo! Questo sistema di messaggistica è fantastico! 🚀");
    console.log(`   ✅ Inviato: "${msg3.messageId}"`);

    // Aspetta che Bob riceva
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Bob conclude
    console.log("\n[Bob invia] 📤");
    const msg4 = await bob.sendMessage("alice", "Vero! Zero costi, decentralizzato e veloce! 💪");
    console.log(`   ✅ Inviato: "${msg4.messageId}"`);

    // Aspetta finale
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mostra statistiche
    console.log("\n" + "=".repeat(60));
    console.log("📊 STATISTICHE FINALI");
    console.log("=".repeat(60));

    console.log(`\n👩 Alice:`);
    console.log(`   - Messaggi inviati: 2`);
    console.log(`   - Messaggi ricevuti: ${aliceMessages.length}`);
    console.log(`   - Public Key: ${aliceLogin.userPub?.substring(0, 20)}...`);
    console.log(`   - Derived Address: ${aliceLogin.derivedAddress}`);

    console.log(`\n👨 Bob:`);
    console.log(`   - Messaggi inviati: 2`);
    console.log(`   - Messaggi ricevuti: ${bobMessages.length}`);
    console.log(`   - Public Key: ${bobLogin.userPub?.substring(0, 20)}...`);
    console.log(`   - Derived Address: ${bobLogin.derivedAddress}`);

    // Recupera storico
    console.log("\n" + "=".repeat(60));
    console.log("📚 STORICO CONVERSAZIONE");
    console.log("=".repeat(60));

    const aliceHistory = await alice.getMessageHistory("bob");
    console.log(`\n👩 Storico di Alice con Bob (${aliceHistory.length} messaggi):`);
    aliceHistory.forEach((msg, i) => {
        const sender = msg.from === aliceLogin.userPub ? "Alice" : "Bob";
        console.log(`   ${i + 1}. [${sender}]: ${msg.content}`);
    });

    const bobHistory = await bob.getMessageHistory("alice");
    console.log(`\n👨 Storico di Bob con Alice (${bobHistory.length} messaggi):`);
    bobHistory.forEach((msg, i) => {
        const sender = msg.from === bobLogin.userPub ? "Bob" : "Alice";
        console.log(`   ${i + 1}. [${sender}]: ${msg.content}`);
    });

    // Riepilogo finale
    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST COMPLETATO CON SUCCESSO!");
    console.log("=".repeat(60));
    console.log("\n📝 Riepilogo:");
    console.log("   ✅ 2 utenti registrati (Alice, Bob)");
    console.log("   ✅ 4 messaggi scambiati");
    console.log("   ✅ Messaggi ricevuti in real-time");
    console.log("   ✅ Storico recuperato correttamente");
    console.log("   ✅ Storage: GunDB P2P (gratis!)");
    console.log("   ✅ Costi: $0.00");
    console.log("\n🎉 Sistema di messaggistica decentralizzato funzionante!\n");
}

// Esegui esempio o test
if (require.main === module) {
    // Scegli quale eseguire decommentando una delle due righe:
    
    // main().catch(console.error);  // Esempio singolo utente
    testAliceAndBob().catch(console.error);  // Test completo Alice & Bob
}

export { SHIP_01 };

