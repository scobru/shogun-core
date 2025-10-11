/**
 * Shogun Messaging Protocol Interface
 * 
 * @title ISHIP_01 - Decentralized Encrypted Messaging
 * @notice Interface for decentralized encrypted messaging on GunDB
 * 
 * ## Abstract
 * 
 * This standard defines an interface for decentralized messaging that allows:
 * - Username/password authentication
 * - Public key publication on GunDB
 * - End-to-end encrypted message sending (ECDH)
 * - Real-time message reception
 * - Decentralized message history
 * 
 * ## Specification
 * 
 * Based on:
 * - GunDB for P2P storage
 * - SEA (Security, Encryption, Authorization) for cryptography
 * - ECDH (Elliptic Curve Diffie-Hellman) for key agreement
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Authentication result
 */
export interface AuthResult {
    success: boolean;
    userPub?: string;
    derivedAddress?: string;
    error?: string;
}

/**
 * @notice Signup result
 */
export interface SignupResult {
    success: boolean;
    userPub?: string;
    derivedAddress?: string;
    error?: string;
}

/**
 * @notice Message structure
 */
export interface Message {
    from: string;           // Sender's public key
    to: string;             // Recipient's username
    content: string;        // Encrypted content
    timestamp: string;      // Message timestamp
    messageId: string;      // Unique ID
}

/**
 * @notice Decrypted message structure (for UI)
 */
export interface DecryptedMessage {
    from: string;           // Sender's public key
    content: string;        // Plain text content
    timestamp: number;      // Timestamp as number
}

/**
 * @notice User public key
 */
export interface UserPublicKey {
    pub: string;            // Public signing key
    epub: string;           // Encryption public key
    algorithm: string;      // Algorithm (ECDSA)
    timestamp: string;      // Publication timestamp
}

/**
 * @notice Operation result
 */
export interface OperationResult {
    success: boolean;
    error?: string;
}

/**
 * @notice Send message result
 */
export interface SendMessageResult extends OperationResult {
    messageId?: string;
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_01 - Decentralized Messaging
 * @notice Main interface for the messaging system
 */
export interface ISHIP_01 {
    
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    /**
     * @notice Register a new user
     * @param username Desired username
     * @param password Password
     * @return Result with userPub and derivedAddress
     */
    signup(username: string, password: string): Promise<SignupResult>;

    /**
     * @notice Login with username and password
     * @param username Username
     * @param password Password
     * @return Result with userPub and derivedAddress
     */
    login(username: string, password: string): Promise<AuthResult>;

    /**
     * @notice Logout current user
     */
    logout(): void;

    /**
     * @notice Check if user is authenticated
     * @return True if authenticated
     */
    isLoggedIn(): boolean;

    // ========================================================================
    // PUBLIC KEY MANAGEMENT
    // ========================================================================

    /**
     * @notice Publish public key on GunDB
     * @dev Allows others to find your key to encrypt messages
     * @return Operation result
     */
    publishPublicKey(): Promise<OperationResult>;

    // ========================================================================
    // MESSAGING
    // ========================================================================

    /**
     * @notice Send encrypted message
     * @dev Uses ECDH to derive shared secret, then AES-GCM for encryption
     * @param recipientUsername Recipient's username
     * @param message Plain text message content
     * @return Result with messageId
     * 
     * Flow:
     * 1. Retrieve recipient's epub from GunDB
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
     * Decryption flow:
     * 1. Receive encrypted message from GunDB
     * 2. Retrieve sender's epub
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
     */
    getMessageHistory(
        withUsername: string
    ): Promise<Array<{
        from: string;
        to: string;
        content: string;
        timestamp: number;
    }>>;
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * @notice Interface for GunDB → Ethereum identity conversion
 */
export interface IAddressDerivation {
    /**
     * @notice Convert GunDB public key to Ethereum address
     * @param publicKey Public key in base64 format (GunDB)
     * @return Ethereum address with checksum
     * 
     * Process:
     * 1. Decode from base64 (GunDB format)
     * 2. Convert to bytes
     * 3. keccak256(bytes)
     * 4. Take last 20 bytes
     * 5. Apply EIP-55 checksum
     */
    pubKeyToAddress(publicKey: string): string;
}

/**
 * @notice Messaging system configuration
 */
export interface MessagingConfig {
    /**
     * @notice GunDB peers
     */
    peers: string[];

    /**
     * @notice Application scope
     */
    scope: string;

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
 * Example of how to implement ISHIP_01
 * 
 * ```typescript
 * class SecureMessagingApp implements ISHIP_01 {
 *     private shogun: ShogunCore;
 * 
 *     constructor(config: MessagingConfig) {
 *         this.shogun = new ShogunCore(config);
 *     }
 * 
 *     async signup(username: string, password: string): Promise<SignupResult> {
 *         const result = await this.shogun.signUp(username, password);
 *         return {
 *             success: result.success,
 *             userPub: result.pub,
 *             derivedAddress: this.pubKeyToAddress(result.pub || "")
 *         };
 *     }
 * 
 *     async sendMessage(recipientUsername: string, message: string): Promise<SendMessageResult> {
 *         // 1. Get recipient's epub
 *         const recipientKey = await this.getRecipientPublicKey(recipientUsername);
 *         
 *         // 2. Encrypt with ECDH
 *         const encrypted = await this.shogun.db.crypto.encFor(
 *             message,
 *             this.shogun.db.user.is, // sender
 *             { epub: recipientKey.epub } // receiver
 *         );
 *         
 *         // 3. Save to GunDB
 *         await this.shogun.db.user.get('messages/...').put({
 *             content: encrypted,
 *             from: this.shogun.db.user.is.pub,
 *             to: recipientUsername,
 *             timestamp: Date.now().toString()
 *         });
 *         
 *         return { success: true, messageId: '...' };
 *     }
 * }
 * ```
 */

