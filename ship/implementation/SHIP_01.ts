/**
 * SHIP-01: Decentralized Encrypted Messaging Implementation
 *
 * Messaggistica decentralizzata E2E che dipende da SHIP-00 per l'identità.
 *
 * Dipendenze:
 * - SHIP-00 (Identity & Authentication) - per gestione utenti e chiavi
 * - GunDB - per storage decentralizzato P2P
 * - SEA - per crittografia ECDH + AES-GCM
 *
 * Vantaggi dell'architettura modulare:
 * ✅ Separazione delle responsabilità (Identity vs Messaging)
 * ✅ Riusabilità di SHIP-00 in altre applicazioni
 * ✅ Testing più semplice e isolato
 * ✅ Manutenibilità migliorata
 */

import type { ISHIP_00 } from "../interfaces/ISHIP_00";
import type {
  ISHIP_01,
  SendMessageResult,
  DecryptedMessage,
  MessageHistoryEntry,
} from "../interfaces/ISHIP_01";
import { ethers } from "ethers";

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * SHIP-01 Reference Implementation
 * 
 * Questa implementazione dipende da ISHIP_00 per tutte le operazioni di identità.
 * Si concentra esclusivamente sulla logica di messaggistica.
 */
class SHIP_01 implements ISHIP_01 {
  private identity: ISHIP_00;

  // GunDB Node Names for messaging
  public static readonly NODES = {
    MESSAGES: "messages",
    TOKEN_MESSAGES: "token_messages", // Token-encrypted messages (channels/groups)
  } as const;

  /**
   * Constructor
   * @param identity ISHIP_00 instance for identity operations
   */
  constructor(identity: ISHIP_00) {
    if (!identity.isLoggedIn()) {
      throw new Error("User must be authenticated via SHIP-00 before using SHIP-01");
    }
    
    this.identity = identity;
    console.log("✅ SHIP-01 initialized with authenticated identity");
  }

  /**
   * Get identity provider
   */
  getIdentity(): ISHIP_00 {
    return this.identity;
  }

  // ========================================================================
  // MESSAGING - Send
  // ========================================================================

  /**
   * Send encrypted message to a user
   * Uses identity provider (SHIP-00) to get keys
   */
  async sendMessage(
    recipientUsername: string,
    message: string
  ): Promise<SendMessageResult> {
    try {
      // Verify authentication
      if (!this.identity.isLoggedIn()) {
        return { success: false, error: "Not authenticated" };
      }

      // 1. Get recipient's public key from SHIP-00
      const recipientKey = await this.identity.getPublicKey(recipientUsername);
      if (!recipientKey) {
        return {
          success: false,
          error: `Recipient ${recipientUsername} has not published their public key`,
        };
      }

      // 2. Get sender's key pair from SHIP-00
      const senderPair = this.identity.getKeyPair();
      if (!senderPair) {
        return { success: false, error: "Cannot access sender key pair" };
      }

      // 3. Get current user from SHIP-00
      const currentUser = this.identity.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "No current user" };
      }

      // 4. Access GunDB through identity provider
      const shogun = this.identity.getShogun();
      if (!shogun || !shogun.db) {
        return { success: false, error: "Cannot access ShogunCore" };
      }

      const gun = shogun.db.gun;
      const crypto = shogun.db.crypto;
      
      if (!gun || !crypto) {
        return { success: false, error: "Cannot access GunDB or crypto" };
      }

      // 5. Encrypt message using ECDH
      const encryptedMessage = await crypto.encFor(
        message,
        senderPair,
        { epub: recipientKey.epub }
      );

      // 6. Generate message ID
      const messageId = this.generateMessageId();

      // 7. Save encrypted message on GunDB
      const messageData = {
        from: currentUser.pub,
        to: recipientUsername,
        content: encryptedMessage,
        timestamp: Date.now().toString(),
        messageId: messageId,
      };

      await gun
        .get(SHIP_01.NODES.MESSAGES)
        .get(messageId)
        .put(messageData)
        .then();

      console.log(`✅ Message sent: ${messageId}`);

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ========================================================================
  // MESSAGING - Listen
  // ========================================================================

  /**
   * Listen for incoming encrypted messages
   * Uses identity provider (SHIP-00) to decrypt messages
   */
  async listenForMessages(
    onMessage: (message: DecryptedMessage) => void
  ): Promise<void> {
    if (!this.identity.isLoggedIn()) {
      console.error("❌ Not authenticated");
      return;
    }

    // Get current user from SHIP-00
    const currentUser = this.identity.getCurrentUser();
    if (!currentUser || !currentUser.alias) {
      console.error("❌ No current user");
      return;
    }

    const username = currentUser.alias;

    // Access GunDB
    const shogun = this.identity.getShogun();
    const gun = shogun?.db?.gun;
    if (!gun) {
      console.error("❌ Cannot access GunDB");
      return;
    }

    // Track received messages to avoid duplicates
    const receivedMessages = new Set<string>();

    // Listen for messages in real-time
    gun
      .get(SHIP_01.NODES.MESSAGES)
      .map()
      .on(async (data: any, key: string) => {
        // Filter messages for this user
        if (
          data &&
          data.to === username &&
          data.from &&
          data.content &&
          data.messageId
        ) {
          // Avoid duplicates
          if (receivedMessages.has(data.messageId)) {
            return;
          }
          receivedMessages.add(data.messageId);

          try {
            // Decrypt message using SHIP-00
            const decryptedContent = await this.decryptMessage(
              data.content,
              data.from
            );

            onMessage({
              from: data.from,
              content: decryptedContent,
              timestamp: parseInt(data.timestamp),
            });
          } catch (error) {
            console.error("❌ Error decrypting message:", error);
          }
        }
      });

    console.log(`👂 Listening for messages to ${username}...`);
  }

  // ========================================================================
  // MESSAGING - History
  // ========================================================================

  /**
   * Get message history with a user
   * Uses identity provider (SHIP-00) to decrypt messages
   */
  async getMessageHistory(withUsername: string): Promise<MessageHistoryEntry[]> {
    if (!this.identity.isLoggedIn()) {
      console.error("❌ Not authenticated");
      return [];
    }

    // Get current user from SHIP-00
    const currentUser = this.identity.getCurrentUser();
    if (!currentUser || !currentUser.alias) {
      console.error("❌ No current user");
      return [];
    }

    const username = currentUser.alias;
    const userPub = currentUser.pub;

    // Get other user's public key from SHIP-00
    const otherUserData = await this.identity.getUserByAlias(withUsername);
    const otherUserPub = otherUserData?.userPub;

    // Access GunDB
    const shogun = this.identity.getShogun();
    const gun = shogun?.db?.gun;
    if (!gun) {
      console.error("❌ Cannot access GunDB");
      return [];
    }

    // Get all messages and filter
    return new Promise((resolve) => {
      const messages: MessageHistoryEntry[] = [];

      gun
        .get(SHIP_01.NODES.MESSAGES)
        .map()
        .once(async (msgData: any, messageId: string) => {
          // Skip metadata
          if (!msgData || typeof msgData !== "object" || messageId === "_") {
            return;
          }

          try {
            // Check if message is part of this conversation
            const isSentToTarget =
              msgData.from === userPub &&
              (msgData.to === withUsername || msgData.to === otherUserPub);
            const isReceivedFromTarget =
              (msgData.to === username || msgData.to === userPub) &&
              msgData.from === otherUserPub;

            if (isSentToTarget || isReceivedFromTarget) {
              // Decrypt message
              const decryptedContent = await this.decryptMessage(
                msgData.content,
                msgData.from
              );

              messages.push({
                from: msgData.from,
                to: msgData.to,
                content: decryptedContent,
                timestamp: parseInt(msgData.timestamp),
              });
            }
          } catch (error) {
            // Silent error - message couldn't be decrypted
          }
        });

      // Wait for GunDB to return all messages, then resolve
      setTimeout(() => {
        const sorted = messages.sort((a, b) => a.timestamp - b.timestamp);
        resolve(sorted);
      }, 2000);
    });
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Decrypt a message using ECDH
   * Uses identity provider (SHIP-00) to get keys
   */
  private async decryptMessage(
    encryptedContent: string,
    senderPub: string
  ): Promise<string> {
    // Get receiver's key pair from SHIP-00
    const receiverPair = this.identity.getKeyPair();
    if (!receiverPair) {
      throw new Error("Cannot access receiver key pair");
    }

    // Get sender's public key
    const senderKeyData = await this.getPublicKeyByPub(senderPub);
    if (!senderKeyData) {
      throw new Error("Sender public key not found");
    }

    // Access crypto
    const shogun = this.identity.getShogun();
    const crypto = shogun?.db?.crypto;
    if (!crypto) {
      throw new Error("Cannot access crypto");
    }

    // Decrypt using ECDH
    const decrypted = await crypto.decFrom(
      encryptedContent,
      { epub: senderKeyData.epub },
      receiverPair
    );

    return decrypted;
  }

  /**
   * Get public key by pub key
   * Uses identity provider internally
   */
  private async getPublicKeyByPub(userPub: string): Promise<{
    pub: string;
    epub: string;
  } | null> {
    try {
      // Access GunDB
      const shogun = this.identity.getShogun();
      const gun = shogun?.db?.gun;
      if (!gun) {
        return null;
      }

      const publicKeyData = await gun.get(userPub).then();

      if (publicKeyData && publicKeyData.epub && publicKeyData.pub) {
        return {
          pub: publicKeyData.pub,
          epub: publicKeyData.epub,
        };
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting public key:", error);
      return null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return ethers.hexlify(ethers.randomBytes(16));
  }

  // ========================================================================
  // TOKEN-BASED MESSAGING (Channels/Groups)
  // ========================================================================

  /**
   * Send message encrypted with shared token/password
   * Useful for group chats, channels, broadcast messages
   */
  async sendMessageWithToken(
    token: string,
    message: string,
    channel?: string
  ): Promise<SendMessageResult> {
    try {
      // Verify authentication
      if (!this.identity.isLoggedIn()) {
        return { success: false, error: "Not authenticated" };
      }

      // Get current user
      const currentUser = this.identity.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "No current user" };
      }

      // Access crypto and GunDB
      const shogun = this.identity.getShogun();
      const crypto = shogun?.db?.crypto;
      const gun = shogun?.db?.gun;
      
      if (!crypto || !gun) {
        return { success: false, error: "Cannot access crypto or GunDB" };
      }

      // Hash token for key derivation (more secure)
      const hashedToken = await crypto.hashText(token);

      // Encrypt message with hashed token
      const encryptedMessage = await crypto.encrypt(message, hashedToken);

      // Generate message ID
      const messageId = this.generateMessageId();

      // Save encrypted message
      const messageData = {
        from: currentUser.pub,
        content: encryptedMessage,
        channel: channel || "default",
        timestamp: Date.now().toString(),
        messageId: messageId,
        type: "token", // Mark as token-encrypted
      };

      await gun
        .get(SHIP_01.NODES.TOKEN_MESSAGES)
        .get(messageId)
        .put(messageData)
        .then();

      console.log(`✅ Token message sent: ${messageId} (channel: ${channel || "default"})`);

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error: any) {
      console.error("❌ Error sending token message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Listen for token-encrypted messages
   * Automatically decrypts with provided token
   */
  async listenForTokenMessages(
    token: string,
    onMessage: (message: any) => void,
    channel?: string
  ): Promise<void> {
    if (!this.identity.isLoggedIn()) {
      console.error("❌ Not authenticated");
      return;
    }

    // Access GunDB and crypto
    const shogun = this.identity.getShogun();
    const gun = shogun?.db?.gun;
    const crypto = shogun?.db?.crypto;

    if (!gun || !crypto) {
      console.error("❌ Cannot access GunDB or crypto");
      return;
    }

    // Hash token for decryption
    const hashedToken = await crypto.hashText(token);

    // Track received messages to avoid duplicates
    const receivedMessages = new Set<string>();

    // Listen for token messages in real-time
    gun
      .get(SHIP_01.NODES.TOKEN_MESSAGES)
      .map()
      .on(async (data: any, key: string) => {
        // Filter by channel if specified
        if (channel && data?.channel !== channel) {
          return;
        }

        // Validate data
        if (
          data &&
          data.type === "token" &&
          data.from &&
          data.content &&
          data.messageId
        ) {
          // Avoid duplicates
          if (receivedMessages.has(data.messageId)) {
            return;
          }
          receivedMessages.add(data.messageId);

          try {
            // Decrypt message with hashed token
            const decryptedContent = await crypto.decrypt(
              data.content,
              hashedToken
            );

            onMessage({
              from: data.from,
              content: decryptedContent,
              channel: data.channel,
              timestamp: parseInt(data.timestamp),
            });
          } catch (error) {
            // Silently skip messages that can't be decrypted
            // (wrong token or corrupted data)
          }
        }
      });

    console.log(`👂 Listening for token messages (channel: ${channel || "all"})...`);
  }
}

export { SHIP_01 };
