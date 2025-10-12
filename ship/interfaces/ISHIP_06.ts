/**
 * SHIP-06: Ephemeral P2P Messaging Interface
 * 
 * @title ISHIP_06 - Ephemeral P2P Messaging
 * @notice Interface for ephemeral peer-to-peer messaging via Gun Relay
 * @dev Can work standalone OR with ISHIP_00 for authenticated sessions
 * 
 * ## Abstract
 * 
 * This standard defines an interface for ephemeral P2P messaging that allows:
 * - Relay-based connections via Gun network
 * - End-to-end encrypted messages (no storage)
 * - Broadcast and direct messaging
 * - Deterministic room discovery (SHA-256)
 * - Standalone mode (no authentication needed!)
 * 
 * ## Dependencies
 * 
 * - Gun: Relay-based P2P database
 * - Gun SEA: Cryptography (ECDH + AES-GCM)
 * - ISHIP_00 (OPTIONAL): For authenticated sessions
 * 
 * ## Modes
 * 
 * **Standalone**: new SHIP_06(gunPeers[], roomId)
 * **With Identity**: new SHIP_06(ISHIP_00, roomId)
 * 
 * ## Inspiration
 * 
 * Based on Bugoff (https://github.com/draeder/bugoff)
 * Simplified for Gun relay instead of WebRTC
 */

import type { ISHIP_00, SEAPair } from "./ISHIP_00";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Ephemeral message structure
 */
export interface EphemeralMessage {
    from: string;           // Sender peer address
    fromPubKey: string;     // Sender's SEA public key
    content: string;        // Decrypted plain text content
    timestamp: number;      // Unix timestamp (ms)
    type: "broadcast" | "direct"; // Message type
}

/**
 * @notice Encrypted message data (internal)
 */
export interface EncryptedMessageData {
    content: string;        // Encrypted content
    fromPubKey: string;     // Sender's public key
    timestamp: string;      // Timestamp as string
    type: "broadcast" | "direct";
}

/**
 * @notice Peer information
 */
export interface PeerInfo {
    address: string;        // Peer address in swarm
    pubKey?: string;        // Peer's SEA public key
    epub?: string;          // Peer's encryption public key
    connectedAt: number;    // Connection timestamp
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_06 - Ephemeral P2P Messaging
 * @notice Main interface for ephemeral messaging system
 * @dev Can work standalone (array of peers) OR with ISHIP_00 identity
 * 
 * Constructor patterns:
 * ```typescript
 * // Standalone mode (no authentication)
 * class EphemeralMessaging implements ISHIP_06 {
 *     constructor(
 *         peers: string[],           // Gun relay peers
 *         roomId: string,
 *         config?: { debug?: boolean }
 *     ) {}
 * }
 * 
 * // Identity mode (with SHIP-00)
 * class EphemeralMessaging implements ISHIP_06 {
 *     constructor(
 *         identity: ISHIP_00,        // Authenticated identity
 *         roomId: string,
 *         config?: EphemeralConfig
 *     ) {}
 * }
 * ```
 */
export interface ISHIP_06 {
    
    // ========================================================================
    // CONNECTION MANAGEMENT
    // ========================================================================

    /**
     * @notice Connect to ephemeral swarm
     * @dev Joins WebTorrent swarm and establishes P2P connections
     * 
     * Flow:
     * 1. Hash room ID with SHA-256 for swarm identifier
     * 2. Join WebTorrent swarm with hashed ID
     * 3. Listen for peer connections
     * 4. Exchange SEA public keys with peers
     * 5. Establish encrypted channels
     */
    connect(): Promise<void>;

    /**
     * @notice Disconnect from swarm
     * @dev Closes all P2P connections and leaves swarm
     */
    disconnect(): void;

    /**
     * @notice Check if connected to swarm
     * @return True if connected
     */
    isConnected(): boolean;

    /**
     * @notice Get swarm identifier (SHA-256 hash of room ID)
     * @return Hashed swarm identifier
     */
    getSwarmId(): string;

    /**
     * @notice Get own peer address in swarm
     * @return Peer address
     */
    getAddress(): string;

    // ========================================================================
    // MESSAGING - Send
    // ========================================================================

    /**
     * @notice Send broadcast message to all peers in swarm
     * @dev Message is encrypted with each peer's public key
     * @param message Plain text message content
     * 
     * Prerequisites:
     * - Must be connected to swarm
     * - User must be authenticated (via ISHIP_00)
     * 
     * Flow:
     * 1. Get all connected peers
     * 2. For each peer:
     *    a. Derive shared secret (ECDH)
     *    b. Encrypt message
     *    c. Send via WebRTC data channel
     */
    sendBroadcast(message: string): Promise<void>;

    /**
     * @notice Send direct message to specific peer
     * @dev Message encrypted only for target peer
     * @param peerAddress Target peer address
     * @param message Plain text message content
     * 
     * Prerequisites:
     * - Must be connected to swarm
     * - Target peer must be connected
     * - User must be authenticated (via ISHIP_00)
     * 
     * Flow:
     * 1. Get target peer's public key
     * 2. Derive shared secret (ECDH)
     * 3. Encrypt message
     * 4. Send via WebRTC data channel
     */
    sendDirect(peerAddress: string, message: string): Promise<void>;

    // ========================================================================
    // MESSAGING - Receive
    // ========================================================================

    /**
     * @notice Listen for decrypted messages
     * @dev Automatically decrypts received messages
     * @param callback Called for each received message
     * 
     * Prerequisites:
     * - Must be connected to swarm
     * 
     * Decryption flow:
     * 1. Receive encrypted message via WebRTC
     * 2. Retrieve sender's epub from message
     * 3. Derive shared secret (ECDH)
     * 4. Decrypt message content
     * 5. Call callback with decrypted message
     */
    onMessage(callback: (message: EphemeralMessage) => void): void;

    /**
     * @notice Listen for encrypted messages (debugging)
     * @dev Raw encrypted messages before decryption
     * @param callback Called for each encrypted message
     */
    onEncryptedMessage(callback: (address: string, data: any) => void): void;

    // ========================================================================
    // PEER MANAGEMENT
    // ========================================================================

    /**
     * @notice Listen for peer join events
     * @dev Called when a new peer connects to swarm
     * @param callback Called with peer address
     */
    onPeerSeen(callback: (address: string) => void): void;

    /**
     * @notice Listen for peer leave events
     * @dev Called when a peer disconnects from swarm
     * @param callback Called with peer address
     */
    onPeerLeft(callback: (address: string) => void): void;

    /**
     * @notice Get list of connected peers
     * @return Array of peer addresses
     */
    getPeers(): string[];

    /**
     * @notice Get detailed peer information
     * @param address Peer address
     * @return Peer info or null if not found
     */
    getPeerInfo(address: string): PeerInfo | null;

    // ========================================================================
    // ENCRYPTION
    // ========================================================================

    /**
     * @notice Get current ephemeral SEA pair
     * @dev New pair generated per session for perfect forward secrecy
     * @return SEA key pair
     */
    getEphemeralPair(): Promise<SEAPair>;

    /**
     * @notice Manually set SEA pair (optional)
     * @dev By default, SHIP-06 generates ephemeral pair automatically
     * @param pair SEA key pair
     */
    setEphemeralPair(pair: SEAPair): Promise<void>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * @notice Ephemeral messaging configuration
 */
export interface EphemeralConfig {
  

    /**
     * @notice Room identifier (will be hashed)
     */
    roomId: string;

    /**
     * @notice Enable debug logging
     */
    debug?: boolean;

    /**
     * @notice Operation timeout (ms)
     */
    timeout?: number;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * @notice Event emitter interface for SHIP-06
 */
export interface ISHIP_06Events {
    /**
     * Emitted when connected to swarm
     */
    connected: () => void;

    /**
     * Emitted when disconnected from swarm
     */
    disconnected: () => void;

    /**
     * Emitted when a peer joins
     */
    peerSeen: (address: string) => void;

    /**
     * Emitted when a peer leaves
     */
    peerLeft: (address: string) => void;

    /**
     * Emitted when a message is received and decrypted
     */
    message: (message: EphemeralMessage) => void;

    /**
     * Emitted when an encrypted message is received (before decryption)
     */
    encryptedMessage: (address: string, data: any) => void;

    /**
     * Emitted on error
     */
    error: (error: Error) => void;
}

// ============================================================================
// IMPLEMENTATION EXAMPLE
// ============================================================================

/**
 * Example of how to implement ISHIP_06 with ISHIP_00 dependency
 * 
 * ```typescript
 * import { ISHIP_00 } from './ISHIP_00';
 * import { ISHIP_06, EphemeralMessage } from './ISHIP_06';
 * import Bugout from 'bugout';
 * 
 * class EphemeralMessaging implements ISHIP_06 {
 *     private bugout: any;
 *     private ephemeralPair: SEAPair | null = null;
 *     private peers: Map<string, PeerInfo> = new Map();
 *     private messageCallbacks: ((msg: EphemeralMessage) => void)[] = [];
 * 
 *     constructor(
 *         private identity: ISHIP_00,
 *         private roomId: string,
 *         private config?: EphemeralConfig
 *     ) {
 *         if (!identity.isLoggedIn()) {
 *             throw new Error('User must be authenticated via SHIP-00');
 *         }
 *     }
 * 
 *     getIdentity(): ISHIP_00 {
 *         return this.identity;
 *     }
 * 
 *     async connect(): Promise<void> {
 *         // 1. Generate ephemeral SEA pair
 *         const crypto = this.identity.shogun.db.crypto;
 *         this.ephemeralPair = await crypto.pair();
 *         
 *         // 2. Hash room ID
 *         const swarmId = await crypto.hashText(this.roomId);
 *         
 *         // 3. Create Bugout swarm
 *         this.bugout = new Bugout(swarmId, {
 *             iceServers: this.config?.iceServers
 *         });
 *         
 *         // 4. Set SEA pair
 *         await this.bugout.SEA(this.ephemeralPair);
 *         
 *         // 5. Listen for events
 *         this.bugout.on('seen', (address: string) => {
 *             this.handlePeerSeen(address);
 *         });
 *         
 *         this.bugout.on('decrypted', (address: string, pubkeys: any, message: string) => {
 *             this.handleMessage(address, pubkeys, message);
 *         });
 *     }
 * 
 *     disconnect(): void {
 *         if (this.bugout) {
 *             this.bugout.destroy();
 *         }
 *     }
 * 
 *     async sendBroadcast(message: string): Promise<void> {
 *         if (!this.bugout) {
 *             throw new Error('Not connected to swarm');
 *         }
 *         
 *         this.bugout.send(message);
 *     }
 * 
 *     async sendDirect(peerAddress: string, message: string): Promise<void> {
 *         if (!this.bugout) {
 *             throw new Error('Not connected to swarm');
 *         }
 *         
 *         this.bugout.send(peerAddress, message);
 *     }
 * 
 *     onMessage(callback: (message: EphemeralMessage) => void): void {
 *         this.messageCallbacks.push(callback);
 *     }
 * 
 *     private handleMessage(address: string, pubkeys: any, content: string) {
 *         const message: EphemeralMessage = {
 *             from: address,
 *             fromPubKey: pubkeys.pub,
 *             content,
 *             timestamp: Date.now(),
 *             type: 'broadcast'
 *         };
 *         
 *         this.messageCallbacks.forEach(cb => cb(message));
 *     }
 * }
 * 
 * // Usage
 * const identity = new SHIP_00(config);
 * await identity.login('alice', 'password123');
 * 
 * const ephemeral = new EphemeralMessaging(identity, 'my-room');
 * await ephemeral.connect();
 * 
 * ephemeral.onMessage((msg) => {
 *     console.log(`${msg.from}: ${msg.content}`);
 * });
 * 
 * await ephemeral.sendBroadcast('Hello everyone!');
 * ```
 */

