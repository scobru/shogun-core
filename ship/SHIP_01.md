# SHIP-01: Decentralized Encrypted Messaging

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025  
> **Updated**: 2025-01-11

---

## Abstract

SHIP-01 defines a standard for end-to-end encrypted messaging on a decentralized P2P network (GunDB). The protocol uses **GUN SEA** for authentication, **ECDH** for key agreement, and **AES-GCM** for message encryption, offering zero operational costs and censorship resistance.

---

## Motivation

### Why SHIP-01?

Modern messaging platforms present critical problems:
- ❌ **Centralization**: Servers control data and access
- ❌ **Costs**: Expensive hosting and infrastructure
- ❌ **Privacy**: Servers can read messages
- ❌ **Censorship**: Governments can block services

**SHIP-01 solves all of this** with a pure P2P approach:
- ✅ **Zero Server**: Completely peer-to-peer
- ✅ **Zero Costs**: No infrastructure to pay for
- ✅ **E2E Encryption**: No one can read messages
- ✅ **Censorship Resistant**: Impossible to block

### Comparison with Alternatives

| Feature | SHIP-01 | WhatsApp | Telegram | Blockchain |
|----------------|---------|----------|----------|------------|
| **Costs** | 🟢 Free | 🔴 $$$M infra | 🔴 $$M infra | 🔴 Gas fees |
| **Speed** | 🟢 Real-time | 🟢 Real-time | 🟢 Real-time | 🔴 Block time |
| **Privacy** | 🟢 E2E always | 🟡 E2E optional | 🔴 No E2E default | 🔴 Public |
| **Decentralized** | 🟢 Pure P2P | 🔴 Central servers | 🔴 Central servers | 🟢 Blockchain |
| **Censorship Res.** | 🟢 High | 🔴 Low | 🔴 Low | 🟢 High |
| **Open Source** | 🟢 MIT | 🔴 Proprietary | 🟡 Partial | 🟢 Varies |

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                SHIP-01 MESSAGING PROTOCOL                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GUN SEA    │    │    ECDH      │    │    GunDB     │  │
│  │    (Auth)    │    │ (Key Agree)  │    │    (P2P)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. Login with username/password (SEA)            │    │
│    │  2. Publish public key on GunDB                   │    │
│    │  3. ECDH: derive shared key                       │    │
│    │  4. AES-GCM: encrypt message                      │    │
│    │  5. Save encrypted message on GunDB               │    │
│    │  6. Real-time: recipient receives and decrypts    │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Role |
|------------|------------|-------|
| **Authentication** | GUN SEA | Login/Signup with username/password |
| **Key Agreement** | ECDH (secp256k1) | Shared key derivation |
| **Encryption** | AES-256-GCM | Message encryption |
| **Storage** | GunDB | Distributed P2P database |
| **Transport** | WebRTC/WebSocket | Real-time communication |

---

## Core Interface

```typescript
/**
 * SHIP-01: Decentralized Encrypted Messaging Interface
 */
interface ISHIP_01 {
    // ============================================
    // AUTHENTICATION
    // ============================================
    
    /**
     * Login with username and password
     * Automatically generates keypair if it doesn't exist
     * 
     * @param username - Username (unique)
     * @param password - Password (deterministic derivation)
     * @returns Result with public key and derived address
     */
    login(username: string, password: string): Promise<AuthResult>;
    
    /**
     * Register new user
     * Creates new keypair and saves it on GunDB
     * 
     * @param username - Username (must be unique)
     * @param password - Password for key derivation
     * @returns Registration result
     */
    signup(username: string, password: string): Promise<SignupResult>;
    
    /**
     * Logout current user
     * Removes session but keeps data on GunDB
     */
    logout(): void;
    
    // ============================================
    // KEY MANAGEMENT
    // ============================================
    
    /**
     * Publish public key on GunDB
     * Makes the key available to other users
     * 
     * @returns Publication result
     */
    publishPublicKey(): Promise<Result>;
    
    /**
     * Retrieve public key of a user
     * Necessary to encrypt messages intended for that user
     * 
     * @param username - Username
     * @returns Public key (pub + epub) or null if not found
     */
    getPublicKey(username: string): Promise<PublicKeyData | null>;
    
    // ============================================
    // MESSAGING
    // ============================================
    
    /**
     * Send encrypted message to a user
     * 
     * Flow:
     * 1. Retrieve recipient's public key
     * 2. ECDH: derive shared secret
     * 3. AES-GCM: encrypt message
     * 4. Save on GunDB
     * 5. Recipient receives in real-time
     * 
     * @param toUsername - Recipient
     * @param content - Plain text content
     * @returns Send result
     */
    sendMessage(toUsername: string, content: string): Promise<Result>;
    
    /**
     * Listen for incoming messages
     * Subscribes to messages on own GunDB node
     * 
     * @param callback - Called for each received message
     */
    listenForMessages(
        callback: (message: Message) => void
    ): Promise<void>;
    
    /**
     * Retrieve conversation history with a user
     * Decrypts all found messages
     * 
     * @param withUsername - User conversed with
     * @returns Array of messages sorted by timestamp
     */
    getMessageHistory(withUsername: string): Promise<Message[]>;
}
```

### Type Definitions

```typescript
/**
 * Authentication result
 */
interface AuthResult {
    success: boolean;
    userPub?: string;         // SEA public key
    derivedAddress?: string;  // Derived Ethereum address (optional)
    error?: string;
}

/**
 * Signup result
 */
interface SignupResult {
    success: boolean;
    userPub?: string;
    derivedAddress?: string;
    error?: string;
}

/**
 * Decrypted message
 */
interface Message {
    from: string;      // Sender username
    to: string;        // Recipient username
    content: string;   // Decrypted content
    timestamp: number; // Unix timestamp (ms)
}

/**
 * User public key
 */
interface PublicKeyData {
    pub: string;   // Public key for signature
    epub: string;  // Encryption public key (ECDH)
}

/**
 * Generic operation result
 */
interface Result {
    success: boolean;
    error?: string;
}
```

---

## Security

### 1. Authentication Layer (GUN SEA)

**GUN SEA** provides secure authentication through deterministic derivation:

```typescript
// Password hashing with PBKDF2
const derivedKeys = await SEA.pair();

// Generated key pair:
{
    pub: "...",    // Public key (ECDSA secp256k1)
    priv: "...",   // Private key
    epub: "...",   // Encryption public key (ECDH)
    epriv: "..."   // Encryption private key
}
```

**Security Properties**:
- ✅ **PBKDF2**: Password hashing with salt
- ✅ **Deterministic**: Same username/password → same keypair
- ✅ **No Plain Storage**: Passwords never stored in plain text
- ✅ **secp256k1**: Same curve as Bitcoin/Ethereum

### 2. Key Agreement (ECDH)

**Elliptic Curve Diffie-Hellman** to derive shared secrets:

```typescript
// Alice computes shared secret with Bob
const sharedSecret = await SEA.secret(
    bobPublicKey.epub,  // Bob's encryption public key
    aliceKeyPair        // Alice's keypair
);

// Bob can compute the same secret
const sameSecret = await SEA.secret(
    alicePublicKey.epub, // Alice's encryption public key
    bobKeyPair           // Bob's keypair
);

// sharedSecret === sameSecret (without exchanging private keys!)
```

**Security Properties**:
- ✅ **Perfect Forward Secrecy**: New key for each pair
- ✅ **No Key Exchange**: Secret derived mathematically
- ✅ **Secure Against MITM**: Public keys on GunDB are verifiable

### 3. Message Encryption (AES-GCM)

**AES-256-GCM** for authenticated encryption:

```typescript
// Encrypting
const encrypted = await SEA.encrypt(
    message,      // Plain text
    sharedSecret  // Derived from ECDH
);

// Decrypting
const decrypted = await SEA.decrypt(
    encrypted,    // Cipher text
    sharedSecret  // Same secret
);
```

**Security Properties**:
- ✅ **AES-256**: Industry standard for encryption
- ✅ **GCM Mode**: Authenticated encryption (no tampering)
- ✅ **Unique IV**: Each message has a random IV
- ✅ **Integrity**: Tampering detected automatically

### 4. Portable Identity

**Key Pair Export/Import** for portability between devices:

```typescript
// Export (secure backup)
const keyPairBackup = {
    pub: seaPair.pub,
    priv: seaPair.priv,
    epub: seaPair.epub,
    epriv: seaPair.epriv,
    alias: username,
    exportedAt: Date.now()
};

const base64 = Buffer.from(
    JSON.stringify(keyPairBackup)
).toString('base64');

// Import on another device
const restored = JSON.parse(
    Buffer.from(base64, 'base64').toString('utf-8')
);
await gun.user().auth(restored);
```

**⚠️ SECURITY WARNING**:
- 🔴 The backup contains **private keys in plain text**
- 🔴 Must be protected like a password
- 🔴 Never share the backup
- 🟢 Consider additional encryption of the backup

---

## Implementation

### Quick Start

```bash
# Install dependencies
cd shogun-core
yarn install

# Start chat CLI
yarn chat alice password123
```

### Complete Example

```typescript
import { SHIP_01 } from "./implementation/SHIP_01";

// ============================================
// 1. INITIALIZATION
// ============================================

const app = new SHIP_01({
    gunOptions: {
        peers: [
            "https://relay.shogun-eco.xyz/gun",
            "https://peer.wallie.io/gun"
        ],
        radisk: false,
        localStorage: false,
        multicast: false
    }
});

// ============================================
// 2. AUTHENTICATION
// ============================================

// Login (or automatic signup if doesn't exist)
const result = await app.login("alice", "password123");

if (result.success) {
    console.log("✅ Login successful!");
    console.log("Public Key:", result.userPub);
    console.log("Derived Address:", result.derivedAddress);
} else {
    console.error("❌ Login failed:", result.error);
    process.exit(1);
}

// ============================================
// 3. KEY PUBLICATION
// ============================================

// Publish public key to make it available
await app.publishPublicKey();
console.log("✅ Key published on GunDB");

// ============================================
// 4. RECEIVING MESSAGES
// ============================================

// Listen for incoming messages (real-time)
await app.listenForMessages((message) => {
    const time = new Date(message.timestamp).toLocaleTimeString();
    console.log(`📨 [${time}] ${message.from}: ${message.content}`);
});

// ============================================
// 5. SENDING MESSAGES
// ============================================

// Send message to Bob
const sendResult = await app.sendMessage(
    "bob",
    "Hello Bob! This is encrypted E2E!"
);

if (sendResult.success) {
    console.log("✅ Message sent to bob");
} else {
    console.error("❌ Send error:", sendResult.error);
}

// ============================================
// 6. CONVERSATION HISTORY
// ============================================

// Retrieve history with Bob
const history = await app.getMessageHistory("bob");
console.log(`📚 ${history.length} messages with bob:`);

history.forEach(msg => {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const from = msg.from === "alice" ? "Me" : msg.from;
    console.log(`  [${time}] ${from}: ${msg.content}`);
});
```

---

## Use Cases

### 1. Decentralized Chat CLI

```bash
# Alice logs in
$ yarn chat alice pass123

🗡️  SHOGUN CHAT - Decentralized E2E Messaging

✅ Login successful!
   Username: alice
   Public Key: pW9x2...
   Derived Address: 0x742d...

# Alice starts chat with Bob
> /to bob
💬 Chatting with bob

# Alice sends message
> Hey Bob! How are you?
[14:32:15] alice: Hey Bob! How are you?

# Bob receives in real-time
📨 New message!
[14:32:15] alice: Hey Bob! How are you?
```

**Benefits**:
- ✅ Zero server configuration
- ✅ No operational costs
- ✅ Automatic encryption
- ✅ Persistent P2P history

### 2. Backup and Identity Portability

```bash
# Alice exports key pair
> /export

✅ KEY PAIR EXPORTED
════════════════════════════════════════════

🔑 SEA PAIR (Base64):
eyJwdWIiOiJwVzl4Mi4uLiIsInByaXYiOiIuLi4ifQ==

════════════════════════════════════════════

💾 Key pair saved: shogun-keypair-alice-1234567890.txt

⚠️  NEVER SHARE THIS KEY PAIR!
```

```bash
# Alice logs in on another device
$ yarn chat

> /login-pair eyJwdWIiOiJwVzl4Mi4uLiIsInByaXYiOiIuLi4ifQ==

🔐 Login with key pair...
✅ Login successful!
   Username: alice
   Public Key: pW9x2...

💬 Chat ready!
```

**Use Case**: Multi-device, identity backup, account recovery

### 3. Messaging in dApp

```typescript
// Integration in a dApp
import { SHIP_01 } from "@shogun/ship-01";

class ChatDApp {
    private messaging: SHIP_01;

    async init(username: string, password: string) {
        this.messaging = new SHIP_01({
            gunOptions: { peers: ["https://relay.your-dapp.com/gun"] }
        });

        await this.messaging.login(username, password);
        await this.messaging.publishPublicKey();
        
        // Real-time notifications
        await this.messaging.listenForMessages((msg) => {
            this.showNotification(msg);
        });
    }

    async sendToUser(username: string, message: string) {
        return await this.messaging.sendMessage(username, message);
    }

    private showNotification(message: Message) {
        new Notification(`Message from ${message.from}`, {
            body: message.content
        });
    }
}
```

**Use Case**: Integrated chat in dApp, P2P notifications, community messaging

---

## Testing

### Unit Tests

```bash
# Run all tests
yarn test

# Test specific implementation
yarn test SHIP_01
```

### Manual Testing

```bash
# Terminal 1: Alice
yarn chat alice pass123

# Terminal 2: Bob
yarn chat bob pass456

# Alice: /to bob
# Alice: Hello Bob!

# Bob should receive the message in real-time
```

### Security Audit Checklist

- [x] Password never saved in plain text
- [x] Deterministic key derivation (PBKDF2)
- [x] ECDH for key agreement
- [x] AES-GCM for encryption
- [x] Perfect Forward Secrecy
- [x] Authenticated encryption (no tampering)
- [x] Unique IV per message
- [ ] Rate limiting (TODO)
- [ ] Spam protection (TODO)

---

## Future Improvements

### SHIP-01.1 (Minor Update)
- [ ] Group messaging
- [ ] File attachments (< 1MB)
- [ ] Message reactions (emoji)
- [ ] Read receipts
- [ ] Typing indicators

### SHIP-02 (Next Major)
- [ ] Ethereum address derivation from SEA pair
- [ ] Bitcoin address derivation
- [ ] Multi-chain support
- [ ] BIP44 integration

### Long-term
- [ ] Voice messages
- [ ] P2P video calls
- [ ] Screen sharing
- [ ] End-to-end encrypted file storage

---

## References

- **GunDB**: https://gun.eco/
- **GUN SEA**: https://gun.eco/docs/SEA
- **ECDH**: https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman
- **AES-GCM**: https://en.wikipedia.org/wiki/Galois/Counter_Mode
- **secp256k1**: https://en.bitcoin.it/wiki/Secp256k1

---

## Authors

- **Shogun Team** - Initial work
- **Contributors** - See [GitHub Contributors](https://github.com/scobru/shogun-core/graphs/contributors)

---

## License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**SHIP-01: Decentralized Encrypted Messaging**

*Zero Server. Zero Cost. Maximum Privacy.*

🗡️ Built with Shogun Core 🗡️

</div>

