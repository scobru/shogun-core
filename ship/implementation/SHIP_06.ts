/**
 * SHIP-06: Ephemeral P2P Messaging Implementation
 *
 * Two modes:
 * 1. Standalone: new SHIP_06(gunPeers[], roomId) - NO authentication!
 *    - Uses ShogunCore internally with silent: true, disableAutoRecall: true
 *    - Zero logs, zero storage, pure relay communication
 *    - Room hashed with Web Crypto API SHA-256 for deterministic IDs
 * 
 * 2. With Identity: new SHIP_06(ISHIP_00, roomId) - Authenticated sessions
 *    - Uses existing Gun instance from SHIP-00
 *    - All ShogunCore features available
 * 
 * Architecture:
 * - Gun Relay for P2P communication (no WebRTC complexity!)
 * - SEA for ephemeral key generation and ECDH encryption
 * - Pure relay mode: radisk: false, localStorage: false, multicast: false
 */

import type { ISHIP_00 } from "../interfaces/ISHIP_00";
import type {
  ISHIP_06,
  EphemeralMessage,
  EphemeralConfig,
  PeerInfo,
} from "../interfaces/ISHIP_06";
import type { SEAPair } from "../interfaces/ISHIP_00";

import { ShogunCore } from "../../src/core";  // ← Import diretto, NON da index!

// ============================================================================
// IMPLEMENTATION - STANDALONE VERSION (No ShogunCore dependency!)
// ============================================================================

class SHIP_06 implements ISHIP_06 {
  private identity: ISHIP_00 | null = null;
  private roomId: string;
  private config: Partial<EphemeralConfig>;

  // State
  private connected: boolean = false;
  private swarmId: string = "";
  private myAddress: string = "";
  private myPair: SEAPair | null = null;

  // Gun nodes
  private gun: any = null;
  private sea: any = null;
  private roomNode: any = null;
  private presenceNode: any = null;
  private messagesNode: any = null;

  // Peers
  private peers: Map<string, PeerInfo & { pub: string; epub: string }> =
    new Map();

  // Event handlers
  private messageHandlers: ((msg: EphemeralMessage) => void)[] = [];
  private encryptedMessageHandlers: ((address: string, data: any) => void)[] =
    [];
  private peerSeenHandlers: ((address: string) => void)[] = [];
  private peerLeftHandlers: ((address: string) => void)[] = [];

  // Heartbeat & cleanup
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private processedMessages = new Set<string>();

  // Constructor overload: with identity OR standalone
  constructor(
    identityOrPeers: ISHIP_00 | string[],
    roomId: string,
    config?: Partial<EphemeralConfig> | { debug?: boolean }
  ) {
    this.roomId = roomId;
    this.config = {
      debug: config?.debug || false,
      timeout: 30000,
    };

    if (Array.isArray(identityOrPeers)) {
      // STANDALONE MODE - ShogunCore with silent mode
      const shogunCore = new ShogunCore({
        gunOptions: {
          peers: identityOrPeers,
          radisk: false,
          localStorage: false,
          multicast: false,
          axe: false,
        },
        silent: true,
        disableAutoRecall: true,
      });

      this.gun = shogunCore.db.gun;
      this.sea = shogunCore.db.sea;
      this.identity = null;
    } else {
      // WITH IDENTITY MODE - use existing Gun from SHIP-00
      if (!identityOrPeers.isLoggedIn()) {
        throw new Error("User must be authenticated via SHIP-00");
      }
      this.identity = identityOrPeers;
      const shogun = identityOrPeers.getShogun();
      this.gun = shogun.db.gun;
    }
  }

  getIdentity(): ISHIP_00 {
    if (!this.identity) {
      throw new Error("No identity - SHIP-06 running in standalone mode");
    }
    return this.identity;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // Generate ephemeral pair
    this.myPair = await this.sea.pair();

    if (!this.myPair) {
      throw new Error("Failed to generate SEA pair");
    }

    this.myAddress = this.myPair.pub.substring(0, 16);

    // Hash room ID DETERMINISTICAMENTE - Simple SHA256 hash
    if (this.identity) {
      const shogun = this.identity.getShogun();
      this.swarmId = await shogun.db.crypto.hashText(this.roomId);
    } else {
      // Standalone: use simple deterministic hash
      // SEA.work with different calls produces different results, so we use a simple hash
      const encoder = new TextEncoder();
      const data = encoder.encode(this.roomId);

      // Use Web Crypto API for deterministic SHA-256 hash
      if (typeof crypto !== "undefined" && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        this.swarmId = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } else {
        // Fallback: simple deterministic hash
        let hash = "";
        for (let i = 0; i < this.roomId.length; i++) {
          hash += this.roomId.charCodeAt(i).toString(16);
        }
        this.swarmId = hash;
      }
    }

    if (this.config.debug) {
      console.log(`🔑 Room ID: "${this.roomId}"`);
      console.log(`🔒 Swarm ID (hashed): ${this.swarmId.substring(0, 32)}...`);
    }

    // Setup Gun nodes
    this.roomNode = this.gun.get("ephemeral").get(this.swarmId);
    this.presenceNode = this.roomNode.get("presence");
    this.messagesNode = this.roomNode.get("messages");

    // Announce presence
    await this.announcePresence();

    // Start listening
    this.listenForPeers();
    this.listenForMessages();

    // Start heartbeat
    this.startHeartbeat();

    this.connected = true;
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.presenceNode && this.myAddress) {
      this.presenceNode.get(this.myAddress).put(null);
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSwarmId(): string {
    return this.swarmId;
  }

  getAddress(): string {
    return this.myAddress;
  }

  // ========================================================================
  // PRESENCE
  // ========================================================================

  private async announcePresence(): Promise<void> {
    if (!this.myPair) return;

    const presenceData = {
      address: this.myAddress,
      pub: this.myPair.pub,
      epub: this.myPair.epub,
      timestamp: Date.now(),
    };

    if (this.config.debug) {
      console.log(`📡 Announcing presence: ${this.myAddress}`);
    }
    await this.presenceNode.get(this.myAddress).put(presenceData);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.myPair) {
        this.presenceNode.get(this.myAddress).put({
          address: this.myAddress,
          pub: this.myPair.pub,
          epub: this.myPair.epub,
          timestamp: Date.now(),
        });
      }
    }, 3000);
  }

  private listenForPeers(): void {
    if (this.config.debug) {
      console.log(
        `👂 Listening for peers on: ephemeral/${this.swarmId.substring(0, 20)}...`
      );
    }

    this.presenceNode.map().on((data: any, address: string) => {
      if (!data || !address || address === "_" || address === this.myAddress) {
        return;
      }
      if (!data.pub || !data.epub || !data.timestamp) {
        return;
      }

      const age = Date.now() - (data.timestamp || 0);
      const isOnline = age < 10000;

      if (!this.peers.has(address)) {
        this.peers.set(address, {
          address,
          pubKey: data.pub,
          epub: data.epub,
          pub: data.pub,
          connectedAt: data.timestamp,
        });

        if (isOnline) {
          this.peerSeenHandlers.forEach((h) => h(address));
        }
      } else {
        const peer = this.peers.get(address);
        if (peer && data.timestamp > peer.connectedAt) {
          peer.connectedAt = data.timestamp;
          peer.pubKey = data.pub;
          peer.epub = data.epub;
          peer.pub = data.pub;
        }
      }
    });
  }

  // ========================================================================
  // MESSAGING
  // ========================================================================

  async sendBroadcast(message: string): Promise<void> {
    if (!this.connected || !this.myPair) {
      throw new Error("Not connected");
    }

    if (this.peers.size === 0) {
      console.warn("⚠️  No peers connected");
      return;
    }

    for (const [address, peer] of this.peers.entries()) {
      try {
        const secret = await this.sea.secret(peer.epub, this.myPair);
        const encrypted = await this.sea.encrypt(message, secret as string);
        const msgId = `${Date.now()}-${this.myAddress}-${Math.random().toString(36).substring(2, 9)}`;

        await this.messagesNode.get(msgId).put({
          from: this.myAddress,
          fromPub: this.myPair.pub,
          fromEpub: this.myPair.epub,
          to: address,
          content: encrypted,
          timestamp: Date.now(),
          type: "broadcast",
        });
      } catch (error) {
        console.error(
          `   ❌ Error sending to ${address.substring(0, 8)}:`,
          error
        );
      }
    }
  }

  async sendDirect(peerAddress: string, message: string): Promise<void> {
    const peer = this.peers.get(peerAddress);
    if (!peer) throw new Error(`Peer ${peerAddress} not found`);
    if (!this.myPair) throw new Error("No SEA pair");

    const secret = await this.sea.secret(peer.epub, this.myPair);
    const encrypted = await this.sea.encrypt(message, secret as string);
    const msgId = `${Date.now()}-${this.myAddress}-${Math.random().toString(36).substring(2, 9)}`;

    await this.messagesNode.get(msgId).put({
      from: this.myAddress,
      fromPub: this.myPair.pub,
      fromEpub: this.myPair.epub,
      to: peerAddress,
      content: encrypted,
      timestamp: Date.now(),
      type: "direct",
    });
  }

  private listenForMessages(): void {
    this.messagesNode.map().on(async (data: any, msgId: string) => {
      if (!data || msgId === "_" || this.processedMessages.has(msgId)) return;
      if (data.to !== this.myAddress || data.from === this.myAddress) return;

      this.processedMessages.add(msgId);

      console.log(`\n📬 MESSAGE RECEIVED!`);
      console.log(`   From: ${data.from.substring(0, 12)}...`);

      try {
        let peer = this.peers.get(data.from);
        if (!peer && data.fromPub && data.fromEpub) {
          peer = {
            address: data.from,
            pubKey: data.fromPub,
            epub: data.fromEpub,
            pub: data.fromPub,
            connectedAt: data.timestamp,
          };
          this.peers.set(data.from, peer);
        }

        if (!peer || !this.myPair) return;

        const senderEpub = data.fromEpub || peer.epub;
        const secret = await this.sea.secret(senderEpub, this.myPair);
        const decrypted = await this.sea.decrypt(
          data.content,
          secret as string
        );

        if (!decrypted) return;

        console.log(`   Content: "${decrypted}"`);

        const ephemeralMsg: EphemeralMessage = {
          from: data.from,
          fromPubKey: data.fromPub || peer.pubKey || "",
          content: decrypted,
          timestamp: data.timestamp,
          type: data.type,
        };

        this.messageHandlers.forEach((h) => h(ephemeralMsg));
      } catch (error) {
        if (this.config.debug) {
          console.error(`   ❌ Error:`, error);
        }
      }
    });
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  onMessage(callback: (message: EphemeralMessage) => void): void {
    this.messageHandlers.push(callback);
  }

  onPeerSeen(callback: (address: string) => void): void {
    this.peerSeenHandlers.push(callback);
  }

  onPeerLeft(callback: (address: string) => void): void {
    this.peerLeftHandlers.push(callback);
  }

  onEncryptedMessage(callback: (address: string, data: any) => void): void {
    this.encryptedMessageHandlers.push(callback);
  }

  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  getPeerInfo(address: string): PeerInfo | null {
    return this.peers.get(address) || null;
  }

  async getEphemeralPair(): Promise<SEAPair> {
    if (!this.myPair) throw new Error("No ephemeral pair");
    return this.myPair;
  }

  async setEphemeralPair(pair: SEAPair): Promise<void> {
    this.myPair = pair;
  }
}

export { SHIP_06 };
