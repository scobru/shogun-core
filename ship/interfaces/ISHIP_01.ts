/**
 * Shogun Messaging Protocol Interface
 * 
 * @title ISHIP_01 - Decentralized Encrypted Messaging
 * @notice Interface for decentralized encrypted messaging on GunDB
 * @dev This interface depends on ISHIP_00 for identity and authentication
 * 
 * ## Abstract
 * 
 * This standard defines an interface for decentralized messaging that allows:
 * - End-to-end encrypted message sending (ECDH)
 * - Real-time message reception
 * - Decentralized message history
 * 
 * ## Dependencies
 * 
 * - ISHIP_00: Identity and authentication layer
 * - GunDB: P2P storage
 * - SEA: Cryptography (ECDH + AES-GCM)
 * 
 * ## Specification
 * 
 * Based on:
 * - SHIP-00 for identity management
 * - GunDB for P2P storage
 * - SEA (Security, Encryption, Authorization) for cryptography
 * - ECDH (Elliptic Curve Diffie-Hellman) for key agreement
 */

import type { ISHIP_00 } from "./ISHIP_00";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Decrypted message structure (for UI)
 */
export interface DecryptedMessage {
    from: string;           // Sender's public key
    content: string;        // Plain text content
    timestamp: number;      // Timestamp as number
}

/**
 * @notice Message history entry
 */
export interface MessageHistoryEntry {
    from: string;           // Sender's public key
    to: string;             // Recipient's username
    content: string;        // Decrypted content
    timestamp: number;      // Message timestamp
}

/**
 * @notice Send message result
 */
export interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * @notice Token-encrypted message (for channels/groups)
 */
export interface TokenMessage {
    content: string;        // Encrypted content
    from: string;           // Sender's public key
    channel?: string;       // Optional channel name
    timestamp: number;      // Message timestamp
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_01 - Decentralized Messaging
 * @notice Main interface for the messaging system
 * @dev Depends on ISHIP_00 for all identity operations
 * 
 * Constructor pattern:
 * ```typescript
 * class MessagingApp implements ISHIP_01 {
 *     constructor(private identity: ISHIP_00) {}
 * }
 * ```
 */
export interface ISHIP_01 {
    
    /**
     * @notice Get the identity provider
     * @dev Returns the ISHIP_00 instance used for identity operations
     * @return Identity provider instance
     */
    getIdentity(): ISHIP_00;
    
    // ========================================================================
    // MESSAGING - Core Operations
    // ========================================================================

    /**
     * @notice Send encrypted message
     * @dev Uses ECDH to derive shared secret, then AES-GCM for encryption
     * @param recipientUsername Recipient's username
     * @param message Plain text message content
     * @return Result with messageId
     * 
     * Prerequisites:
     * - User must be authenticated (via ISHIP_00)
     * - Recipient must have published their public key
     * 
     * Flow:
     * 1. Get recipient's epub from identity provider
     * 2. SEA.secret(recipient.epub, sender.pair) → shared_secret
     * 3. SEA.encrypt(message, shared_secret) → encrypted
     * 4. Save encrypted on GunDB
     */
    sendMessage(
        recipientUsername: string,
        message: string
    ): Promise<SendMessageResult>;

    /**
     * @notice Listen for incoming messages in real-time
     * @dev Automatically decrypts received messages
     * @param onMessage Callback called for each message
     * 
     * Prerequisites:
     * - User must be authenticated (via ISHIP_00)
     * 
     * Decryption flow:
     * 1. Receive encrypted message from GunDB
     * 2. Retrieve sender's epub from identity provider
     * 3. SEA.secret(sender.epub, receiver.pair) → shared_secret
     * 4. SEA.decrypt(encrypted, shared_secret) → message
     * 5. Call callback with decrypted message
     */
    listenForMessages(
        onMessage: (message: DecryptedMessage) => void
    ): Promise<void>;

    /**
     * @notice Retrieve message history with a user
     * @dev Decrypts all messages in history
     * @param withUsername Username of the other user
     * @return Array of decrypted messages sorted by timestamp
     * 
     * Prerequisites:
     * - User must be authenticated (via ISHIP_00)
     */
    getMessageHistory(
        withUsername: string
    ): Promise<MessageHistoryEntry[]>;

    // ========================================================================
    // TOKEN-BASED MESSAGING (Channels/Groups)
    // ========================================================================

    /**
     * @notice Send message encrypted with a shared token/password
     * @dev Uses symmetric encryption with provided token
     * @param token Shared secret/password for encryption
     * @param message Plain text message content
     * @param channel Optional channel name for organization
     * @return Result with messageId
     * 
     * Use cases:
     * - Group chats with shared password
     * - Broadcast channels
     * - Private communities
     * 
     * Flow:
     * 1. Hash token for key derivation
     * 2. SEA.encrypt(message, hashedToken) → encrypted
     * 3. Save encrypted on GunDB with channel tag
     */
    sendMessageWithToken(
        token: string,
        message: string,
        channel?: string
    ): Promise<SendMessageResult>;

    /**
     * @notice Listen for token-encrypted messages
     * @dev Automatically decrypts received messages with provided token
     * @param token Shared secret/password for decryption
     * @param onMessage Callback called for each message
     * @param channel Optional channel filter
     * 
     * Prerequisites:
     * - User must be authenticated (via ISHIP_00)
     * 
     * Decryption flow:
     * 1. Receive encrypted message from GunDB
     * 2. Hash token
     * 3. SEA.decrypt(encrypted, hashedToken) → message
     * 4. Call callback with decrypted message
     */
    listenForTokenMessages(
        token: string,
        onMessage: (message: TokenMessage) => void,
        channel?: string
    ): Promise<void>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * @notice Messaging system configuration
 */
export interface MessagingConfig {
    /**
     * @notice Identity provider (SHIP-00 instance)
     */
    identity: ISHIP_00;

    /**
     * @notice Operation timeout (ms)
     */
    timeout?: number;

    /**
     * @notice Enable debug logging
     */
    debug?: boolean;
}

// ============================================================================
// CRYPTOGRAPHY (SEA - Security, Encryption, Authorization)
// ============================================================================

/**
 * @notice Cryptographic functions provided by Shogun Core
 * @dev Wrapper for GunDB SEA
 */
export interface ISEACrypto {
    /**
     * @notice Encrypt data for a recipient (ECDH)
     * @param data Data to encrypt
     * @param senderPair Sender's key pair
     * @param receiverEpub Recipient's encryption public key
     * @return Encrypted data
     */
    encFor(
        data: any,
        senderPair: { pub: string; priv: string; epub: string; epriv: string },
        receiverEpub: { epub: string }
    ): Promise<string>;

    /**
     * @notice Decrypt data from a sender (ECDH)
     * @param encryptedData Encrypted data
     * @param senderEpub Sender's encryption public key
     * @param receiverPair Recipient's key pair
     * @return Decrypted data
     */
    decFrom(
        encryptedData: string,
        senderEpub: { epub: string },
        receiverPair: { pub: string; priv: string; epub: string; epriv: string }
    ): Promise<any>;

    /**
     * @notice Derive shared secret between two parties (ECDH)
     * @param epub Other party's encryption public key
     * @param pair Own key pair
     * @return Shared secret
     */
    secret(
        epub: string,
        pair: { pub: string; priv: string; epub: string; epriv: string }
    ): Promise<string>;

    /**
     * @notice Encrypt with symmetric key
     * @param data Data to encrypt
     * @param key Symmetric key
     * @return Encrypted data
     */
    encrypt(data: any, key: string): Promise<string>;

    /**
     * @notice Decrypt with symmetric key
     * @param encryptedData Encrypted data
     * @param key Symmetric key
     * @return Decrypted data
     */
    decrypt(encryptedData: string, key: string): Promise<any>;

    /**
     * @notice Hash text with SHA-256
     * @param text Text to hash
     * @return Hash
     */
    hashText(text: string): Promise<string>;
}

// ============================================================================
// IMPLEMENTATION EXAMPLE
// ============================================================================

/**
 * Example of how to implement ISHIP_01 with ISHIP_00 dependency
 * 
 * ```typescript
 * import { ISHIP_00 } from './ISHIP_00';
 * import { ISHIP_01, DecryptedMessage, SendMessageResult } from './ISHIP_01';
 * 
 * class SecureMessagingApp implements ISHIP_01 {
 *     constructor(private identity: ISHIP_00) {
 *         // Verify identity is authenticated
 *         if (!identity.isLoggedIn()) {
 *             throw new Error('User must be authenticated');
 *         }
 *     }
 * 
 *     getIdentity(): ISHIP_00 {
 *         return this.identity;
 *     }
 * 
 *     async sendMessage(recipientUsername: string, message: string): Promise<SendMessageResult> {
 *         // 1. Get recipient's public key from identity provider
 *         const recipientKey = await this.identity.getPublicKey(recipientUsername);
 *         if (!recipientKey) {
 *             return { success: false, error: 'Recipient not found' };
 *         }
 *         
 *         // 2. Get sender's key pair from identity provider
 *         const senderPair = this.identity.getKeyPair();
 *         if (!senderPair) {
 *             return { success: false, error: 'Not authenticated' };
 *         }
 *         
 *         // 3. Encrypt with ECDH
 *         const encrypted = await crypto.encFor(
 *             message,
 *             senderPair,
 *             { epub: recipientKey.epub }
 *         );
 *         
 *         // 4. Save to GunDB
 *         const messageId = generateId();
 *         await gun.get('messages').get(messageId).put({
 *             content: encrypted,
 *             from: senderPair.pub,
 *             to: recipientUsername,
 *             timestamp: Date.now().toString()
 *         });
 *         
 *         return { success: true, messageId };
 *     }
 * 
 *     async listenForMessages(onMessage: (message: DecryptedMessage) => void): Promise<void> {
 *         const currentUser = this.identity.getCurrentUser();
 *         if (!currentUser) {
 *             throw new Error('Not authenticated');
 *         }
 *         
 *         gun.get('messages').map().on(async (data, key) => {
 *             if (data && data.to === currentUser.alias) {
 *                 // Decrypt message
 *                 const senderKey = await this.identity.getPublicKey(data.from);
 *                 const receiverPair = this.identity.getKeyPair();
 *                 
 *                 if (senderKey && receiverPair) {
 *                     const decrypted = await crypto.decFrom(
 *                         data.content,
 *                         { epub: senderKey.epub },
 *                         receiverPair
 *                     );
 *                     
 *                     onMessage({
 *                         from: data.from,
 *                         content: decrypted,
 *                         timestamp: parseInt(data.timestamp)
 *                     });
 *                 }
 *             }
 *         });
 *     }
 * 
 *     async getMessageHistory(withUsername: string): Promise<MessageHistoryEntry[]> {
 *         // Implementation here
 *         return [];
 *     }
 * }
 * 
 * // Usage
 * const identity = new SHIP_00(config);
 * await identity.login('alice', 'password123');
 * await identity.publishPublicKey();
 * 
 * const messaging = new SecureMessagingApp(identity);
 * await messaging.sendMessage('bob', 'Hello Bob!');
 * ```
 */
