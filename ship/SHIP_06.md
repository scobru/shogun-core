# SHIP-06: Ephemeral P2P Messaging

> **Status**: ✅ Implemented  
> **Author**: Shogun Team  
> **Created**: 2025-01-11  
> **Updated**: 2025-01-12  
> **Dependencies**: **OPTIONAL** [SHIP-00](./SHIP_00.md) (Identity & Authentication)  
> **Inspired by**: [Bugoff](https://github.com/draeder/bugoff)

---

## Abstract

SHIP-06 defines a standard for **ephemeral P2P messaging** using GunDB relay for real-time communication between peers. Unlike SHIP-01 which stores messages permanently, SHIP-06 provides **completely ephemeral** messaging with no persistent storage. Messages are encrypted using Gun's SEA suite (ECDH + AES-GCM) and transmitted via Gun relay peers.

**Key Features**:
- 🚀 **Standalone Mode**: No SHIP-00 required - works with just nickname + room
- ❌ **No Storage**: Pure relay-only, no radisk/localStorage
- ✅ **Real-time Messaging**: Via Gun relay network
- ✅ **End-to-End Encrypted**: Using Gun SEA (ECDH + AES-GCM)
- ✅ **Deterministic Room IDs**: SHA-256 hash ensures same room across peers
- 🔕 **Silent Mode**: ShogunCore with `silent: true` - zero initialization logs
- ✅ **Perfect for**: Real-time chat, gaming, live streaming

**Key Differences from SHIP-01**:
- ❌ No persistent storage - relay-only communication
- ✅ Real-time messaging via Gun relay
- ✅ No trace left - ephemeral by design
- ✅ Perfect for real-time chat, gaming, live streaming
- ✅ No message history - privacy by design
- ✅ Works standalone OR with SHIP-00 identity

---

## Motivation

### Why SHIP-06?

While SHIP-01 provides excellent persistent messaging, some use cases require **true ephemeral communication**:

- 🎮 **Gaming**: Real-time game chat that doesn't need history
- 🎥 **Live Streaming**: Viewer chat during live events
- 💬 **Temporary Rooms**: Chat rooms that disappear when everyone leaves
- 🔒 **Maximum Privacy**: Messages that leave no trace
- ⚡ **Ultra-Low Latency**: Direct P2P without database roundtrips

### Comparison with SHIP-01

| Feature             | SHIP-06 (Ephemeral) | SHIP-01 (Persistent) |
| ------------------- | ------------------- | -------------------- |
| **Storage**         | 🟢 Ephemeral (30s)  | 🔴 Permanent GunDB   |
| **Latency**         | 🟢 Real-time        | 🟡 Normal            |
| **Privacy**         | 🟢 Maximum          | 🟡 Good              |
| **History**         | 🔴 No history       | 🟢 Full history      |
| **Use Case**        | Real-time chat      | Persistent messaging |
| **Message Replay**  | 🔴 Not possible     | 🟢 Possible          |
| **Offline Delivery**| 🔴 No               | 🟢 Yes               |
| **Auto-cleanup**    | 🟢 Yes (30s)        | 🔴 No                |

---

## Relationship with SHIP-00

SHIP-06 can work in **two modes**:

### 🚀 **Standalone Mode** (Recommended for quick start)

No authentication required - just nickname and room!

```typescript
import { SHIP_06 } from "./implementation/SHIP_06";

// Just pass Gun peers array and room ID!
const GUN_PEERS = [
  "https://relay.shogun-eco.xyz/gun",
  "https://peer.wallie.io/gun",
  "https://v5g5jseqhgkp43lppgregcfbvi.srv.us/gun",
];

// Creates ShogunCore internally with silent: true, disableAutoRecall: true
const ephemeral = new SHIP_06(GUN_PEERS, "my-chat-room");
await ephemeral.connect();
// Ready to chat! ✅

// Zero logs, zero authentication, zero storage!
```

### 🔐 **Identity Mode** (With SHIP-00 authentication)

For use cases requiring authenticated users:

```typescript
import { SHIP_00 } from "./implementation/SHIP_00";
import { SHIP_06 } from "./implementation/SHIP_06";

// Setup identity with SHIP-00
const identity = new SHIP_00(config);
await identity.login("alice", "password123");

// Use identity in SHIP-06 for ephemeral messaging
const ephemeral = new SHIP_06(identity, "my-chat-room");
await ephemeral.connect();
```

---

## Specification

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│          SHIP-06 EPHEMERAL MESSAGING PROTOCOL                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   GUN SEA    │    │    GunDB     │    │   Cleanup    │  │
│  │ (Encryption) │    │   (P2P DB)   │    │ (Auto-delete)│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│    ┌────▼────────────────────▼────────────────────▼────┐    │
│    │                                                    │    │
│    │  1. Hash room ID (SHA-256)                        │    │
│    │  2. Create ephemeral GunDB nodes                  │    │
│    │  3. Generate ephemeral SEA pair per session       │    │
│    │  4. Announce presence with heartbeat (5s)         │    │
│    │  5. Encrypt message with shared secret (ECDH)     │    │
│    │  6. Publish encrypted message to GunDB            │    │
│    │  7. Auto-delete message after 30s                 │    │
│    │  8. Recipient receives & decrypts in real-time    │    │
│    │                                                    │    │
│    └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology         | Role                                |
| ------------------ | ------------------ | ----------------------------------- |
| **Core**           | ShogunCore (silent)| Gun wrapper with silent initialization |
| **Authentication** | GUN SEA            | Ephemeral key generation & encryption |
| **P2P Network**    | Gun Relay          | Real-time relay-based messaging     |
| **Transport**      | WebSocket          | Gun relay connections               |
| **Encryption**     | ECDH + AES-GCM     | End-to-end message encryption       |
| **Room Discovery** | SHA-256 (Web Crypto)| Deterministic hashed room IDs      |
| **Storage**        | None (relay-only)  | Zero persistence by design          |

### Message Flow

```
Alice                          GunDB (ephemeral node)           Bob
  │                                │                              │
  │  1. Join "chat-room"           │                              │
  ├───────────────────────────────►│                              │
  │     SHA256("chat-room")        │                              │
  │     Announce presence          │                              │
  │     (heartbeat every 5s)       │                              │
  │                                │                              │
  │                                │  2. Bob joins same room      │
  │                                │◄─────────────────────────────┤
  │                                │     Announce presence        │
  │                                │     (heartbeat every 5s)     │
  │                                │                              │
  │  3. Detect Bob's presence      │                              │
  │◄──────────────────────────────────────────────────────────────►│
  │     Exchange SEA public keys via presence                     │
  │                                │                              │
  │  4. Send encrypted message     │                              │
  ├────────────────────────────────►│                              │
  │     (published to GunDB)       │                              │
  │     Auto-delete after 30s      │                              │
  │                                │  5. Bob receives message     │
  │                                ├─────────────────────────────►│
  │                                │     Decrypt & display        │
  │                                │                              │
```

### Security Properties

- ✅ **End-to-End Encryption**: All messages encrypted with ECDH
- ✅ **Perfect Forward Secrecy**: New SEA pair per session
- ✅ **Room Privacy**: Room names hashed with SHA-256
- ✅ **Auto-Delete**: Messages automatically removed after 30s
- ✅ **Ephemeral Keys**: Session keypairs discarded on disconnect
- ✅ **No History**: Messages cannot be replayed
- ⚠️ **Gun Relays**: Messages pass through Gun relay nodes (encrypted)

---

## Core Interface

```typescript
/**
 * SHIP-06: Ephemeral P2P Messaging Interface
 */
interface ISHIP_06 {
  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Get the identity provider
   * @returns ISHIP_00 instance
   */
  getIdentity(): ISHIP_00;

  /**
   * Connect to ephemeral swarm
   * Joins WebTorrent swarm and establishes P2P connections
   */
  connect(): Promise<void>;

  /**
   * Disconnect from swarm
   * Closes all P2P connections
   */
  disconnect(): void;

  /**
   * Check if connected to swarm
   */
  isConnected(): boolean;

  /**
   * Get swarm identifier (SHA-256 hash)
   */
  getSwarmId(): string;

  /**
   * Get own peer address in swarm
   */
  getAddress(): string;

  // ============================================
  // MESSAGING
  // ============================================

  /**
   * Send broadcast message to all peers in swarm
   * @param message Plain text message
   */
  sendBroadcast(message: string): Promise<void>;

  /**
   * Send direct message to specific peer
   * @param peerAddress Target peer address
   * @param message Plain text message
   */
  sendDirect(peerAddress: string, message: string): Promise<void>;

  /**
   * Listen for decrypted messages
   * @param callback Called for each received message
   */
  onMessage(callback: (msg: EphemeralMessage) => void): void;

  /**
   * Listen for encrypted messages (debugging)
   * @param callback Called for each encrypted message
   */
  onEncryptedMessage(callback: (address: string, data: any) => void): void;

  // ============================================
  // PEER MANAGEMENT
  // ============================================

  /**
   * Listen for peer join events
   * @param callback Called when peer joins
   */
  onPeerSeen(callback: (address: string) => void): void;

  /**
   * Listen for peer leave events
   * @param callback Called when peer leaves
   */
  onPeerLeft(callback: (address: string) => void): void;

  /**
   * Get list of connected peers
   */
  getPeers(): string[];

  // ============================================
  // ENCRYPTION
  // ============================================

  /**
   * Get current ephemeral SEA pair
   * New pair generated per session
   */
  getEphemeralPair(): Promise<SEAPair>;

  /**
   * Manually set SEA pair (optional)
   * By default, SHIP-06 generates ephemeral pair
   */
  setEphemeralPair(pair: SEAPair): Promise<void>;
}
```

### Type Definitions

```typescript
/**
 * Ephemeral message structure
 */
interface EphemeralMessage {
  from: string; // Sender peer address
  fromPubKey: string; // Sender's public key
  content: string; // Decrypted content
  timestamp: number; // Unix timestamp (ms)
  type: "broadcast" | "direct"; // Message type
}

/**
 * Configuration for ephemeral messaging
 */
interface EphemeralConfig {
  identity: ISHIP_00; // Identity provider
  roomId: string; // Room identifier (will be hashed)
  debug?: boolean; // Enable debug logging
  timeout?: number; // Operation timeout (ms)
}

/**
 * SEA key pair
 */
interface SEAPair {
  pub: string; // Public key
  priv: string; // Private key
  epub: string; // Encryption public key
  epriv: string; // Encryption private key
}
```

---

## Implementation Details

### Silent Mode Architecture

SHIP-06 uses `ShogunCore` in **silent mode** for standalone operation:

```typescript
// Internal ShogunCore configuration for standalone mode
const shogunCore = new ShogunCore({
  gunOptions: {
    peers: gunPeersArray,     // Your Gun relay peers
    radisk: false,            // ❌ No disk storage
    localStorage: false,      // ❌ No localStorage
    multicast: false,         // ❌ No multicast
    axe: false,              // ❌ No AXE relay logs
  },
  silent: true,               // 🔕 Zero console logs
  disableAutoRecall: true,    // ❌ No auto-login attempts
});
```

**Benefits:**
- ✅ Zero initialization logs
- ✅ No auto-login attempts from ShogunCore
- ✅ Pure relay communication (no local storage)
- ✅ Clean console output - only SHIP-06 messages

### Deterministic Room Hashing

Room IDs are hashed using **Web Crypto API SHA-256** for deterministic results:

```typescript
// This ensures alice and bob get SAME swarm ID for same room!
const encoder = new TextEncoder();
const data = encoder.encode("my-room");
const hashBuffer = await crypto.subtle.digest("SHA-256", data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const swarmId = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
```

**Why not `SEA.work()`?**
- ❌ `SEA.work()` is non-deterministic (uses salt)
- ✅ SHA-256 gives consistent hash across all peers
- ✅ Critical for peer discovery on same Gun node path

---

### Quick Start (Standalone Mode)

```bash
# Install dependencies
cd shogun-core
yarn install

# Start ephemeral chat CLI (NO authentication needed!)
# Terminal 1
yarn ephemeral alice test-room

# Terminal 2
yarn ephemeral bob test-room

# Alice and Bob can now chat in real-time! 🎉
```

**That's it!** No signup, no login, just pure ephemeral P2P chat!

### Complete Example (Standalone Mode)

```typescript
import { SHIP_06 } from "./implementation/SHIP_06";

// ============================================
// 1. CONFIGURE GUN PEERS
// ============================================

const GUN_PEERS = [
  "https://relay.shogun-eco.xyz/gun",
  "https://peer.wallie.io/gun",
  "https://v5g5jseqhgkp43lppgregcfbvi.srv.us/gun",
];

// ============================================
// 2. JOIN EPHEMERAL ROOM (NO LOGIN!)
// ============================================

const roomId = "my-chat-room";
const ephemeral = new SHIP_06(GUN_PEERS, roomId);

// Connect to swarm
await ephemeral.connect();
console.log("✅ Connected to swarm:", ephemeral.getSwarmId());
console.log("📍 My address:", ephemeral.getAddress());

// ============================================
// 4. LISTEN FOR EVENTS
// ============================================

// Peer joined
ephemeral.onPeerSeen((address) => {
  console.log("👋 Peer joined:", address);
});

// Peer left
ephemeral.onPeerLeft((address) => {
  console.log("👋 Peer left:", address);
});

// Messages
ephemeral.onMessage((msg) => {
  const time = new Date(msg.timestamp).toLocaleTimeString();
  const type = msg.type === "broadcast" ? "📢" : "📨";
  console.log(`${type} [${time}] ${msg.from}: ${msg.content}`);
});

// ============================================
// 5. SEND MESSAGES
// ============================================

// Broadcast to all peers
await ephemeral.sendBroadcast("Hello everyone! 👋");

// Direct message to specific peer
const peers = ephemeral.getPeers();
if (peers.length > 0) {
  await ephemeral.sendDirect(peers[0], "Private message!");
}

// ============================================
// 6. CLEANUP
// ============================================

// Disconnect when done
process.on("SIGINT", () => {
  ephemeral.disconnect();
  console.log("👋 Disconnected from swarm");
  process.exit(0);
});
```

---

## Use Cases

### 1. Gaming Chat

```typescript
// Game lobby chat
const lobby = new SHIP_06(identity, `game-lobby-${gameId}`);
await lobby.connect();

lobby.onMessage((msg) => {
  displayChatMessage(msg.content);
});

// Player sends message
await lobby.sendBroadcast("Ready to play!");
```

**Benefits**:
- ⚡ Ultra-low latency for real-time chat
- 💾 No storage costs for chat history
- 🔒 Chat disappears when game ends
- 🎮 Perfect for in-game communication

### 2. Live Streaming Chat

```typescript
// Streamer creates ephemeral room
const streamChat = new SHIP_06(identity, `stream-${streamId}`);
await streamChat.connect();

streamChat.onMessage((msg) => {
  addMessageToLiveChat(msg.content);
});

// Viewer sends message
await streamChat.sendBroadcast("Great stream! 🎉");
```

**Use Case**: Twitch-like live chat without persistent storage

### 3. Temporary Meeting Rooms

```typescript
// Create temporary meeting room
const meetingId = generateMeetingId();
const meeting = new SHIP_06(identity, `meeting-${meetingId}`);
await meeting.connect();

// Share meeting ID with participants
console.log("Meeting room:", meetingId);
console.log("Participants can join with this ID");

// When meeting ends, room disappears
meeting.disconnect();
```

**Use Case**: Private meetings with no message trail

### 4. Anonymous Chat Rooms

```typescript
// Public anonymous room
const anonChat = new SHIP_06(identity, "public-chat");
await anonChat.connect();

// Messages are encrypted but room is public
anonChat.onMessage((msg) => {
  console.log(`Anonymous: ${msg.content}`);
});
```

---

## Security Considerations

### ✅ Security Strengths

1. **End-to-End Encryption**: All messages encrypted with ECDH
2. **Perfect Forward Secrecy**: New SEA pair per session
3. **No Persistence**: Messages never stored on disk
4. **Room Privacy**: Room names hashed (SHA-256)
5. **Direct P2P**: No intermediate servers

### ⚠️ Security Limitations

1. **No Message History**: Cannot verify past messages
2. **Relay-based**: Messages pass through Gun relay nodes (encrypted, but visible metadata)
3. **No Authentication in Standalone**: Anyone with room ID can join
4. **Ephemeral Keys**: Lost on disconnect/refresh
5. **Room Discovery**: Anyone knowing the room name can compute the hash and join

### 🔒 Best Practices

```typescript
// 1. Use strong room identifiers
const roomId = await identity.deriveEthereumAddress(); // Unique per user

// 2. Verify peer identities
ephemeral.onPeerSeen(async (address) => {
  const pubKey = await getPeerPublicKey(address);
  if (!isAuthorizedPeer(pubKey)) {
    console.warn("Unknown peer:", address);
  }
});

// 3. Implement rate limiting
const rateLimiter = new Map();
ephemeral.onMessage((msg) => {
  if (isRateLimited(msg.from)) {
    return; // Ignore spam
  }
  processMessage(msg);
});
```

---

## Comparison with Bugoff

SHIP-06 is inspired by [Bugoff](https://github.com/draeder/bugoff) but simplified for easier use:

| Feature                | Bugoff              | SHIP-06                  |
| ---------------------- | ------------------- | ------------------------ |
| **Identity**           | Required SEA pair   | Optional (standalone!)   |
| **Transport**          | WebRTC/WebTorrent   | Gun Relay (WebSocket)    |
| **Room Discovery**     | WebTorrent swarm    | Deterministic SHA-256    |
| **Encryption**         | SEA encrypt/decrypt | ECDH + AES-GCM (same)    |
| **Message Types**      | Broadcast + Direct  | Broadcast + Direct       |
| **Node.js Support**    | Limited (needs wrtc)| ✅ Full support          |
| **Dependencies**       | Bugout + WebTorrent | Gun only                 |
| **Setup Complexity**   | Medium              | Minimal (2 lines!)       |
| **TypeScript Support** | Partial             | Full TypeScript          |

**Why Gun Relay instead of WebRTC/Bugout?**
- ✅ Works perfectly in Node.js (no `wrtc` needed!)
- ✅ Simpler setup - just provide Gun peers
- ✅ No WebTorrent trackers needed
- ✅ Uses ShogunCore with `silent: true` for zero logs
- ✅ Relay-only ensures no local storage (`radisk: false`)
- ✅ Same encryption (Gun SEA) - still E2E encrypted!
- ✅ Deterministic SHA-256 room hashing via Web Crypto API

**Trade-offs:**
- ⚠️ Messages pass through Gun relays (still encrypted!)
- ⚠️ Requires active Gun relay peers
- ✅ But: Simpler, more reliable, works everywhere

**Technical Implementation:**
- Uses `ShogunCore` in standalone mode with `silent: true` and `disableAutoRecall: true`
- SHA-256 hashing via `crypto.subtle.digest()` for deterministic room IDs
- Gun config: `radisk: false`, `localStorage: false`, `multicast: false`, `axe: false`

**Credits**: Thanks to [@draeder](https://github.com/draeder) for the original Bugoff concept!

---

## Future Improvements

### SHIP-06.1 (Minor Update)

- [ ] Voice messages (WebRTC audio)
- [ ] File sharing (P2P file transfer)
- [ ] Peer presence indicators
- [ ] Typing indicators
- [ ] Message reactions

### Related SHIPs

- ✅ **SHIP-00**: Identity (required)
- ✅ **SHIP-01**: Persistent Messaging (alternative)
- 💡 **SHIP-07**: Secure Vault (proposed)

---

## Testing

### Standalone Mode (No authentication!)

```bash
# Terminal 1: Alice joins room
cd shogun-core
yarn ephemeral alice test-room

# Terminal 2: Bob joins same room
cd shogun-core
yarn ephemeral bob test-room

# They can now chat in real-time! 🎉
```

**Output:**
```
🗡️  SHOGUN EPHEMERAL CHAT
======================================================================
✅ Welcome alice!
📡 Connecting to room: test-room...
🔑 Room ID: "test-room"
🔒 Swarm ID (hashed): 876af21d3bdac6d39b02...
📡 Announcing presence: DX2n8toeuNApB1z_
👂 Listening for peers on: ephemeral/876af21d3bdac6d39b02...
✅ Connected!

💬 COMMANDS: /peers /direct /help /exit
======================================================================

👋 Peer joined: SuDyEPhYh... (Total: 1)

alice> hello bob!
📢 [15:30:00] You: hello bob!

📢 [15:30:05] SuDyEPhYh...: hi alice!
```

---

## References

- **Bugoff**: https://github.com/draeder/bugoff
- **WebTorrent**: https://webtorrent.io/
- **WebRTC**: https://webrtc.org/
- **GUN SEA**: https://gun.eco/docs/SEA

---

## License

MIT License - see [LICENSE](../../LICENSE)

---

<div align="center">

**SHIP-06: Ephemeral P2P Messaging**

_Zero Storage. Maximum Privacy. Real-Time Only._

🗡️ Built with Shogun Core 🗡️

</div>
