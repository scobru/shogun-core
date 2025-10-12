/**
 * SHIP-00: Decentralized Identity & Authentication Interface
 * 
 * @title ISHIP_00 - Identity Foundation
 * @notice Base interface for decentralized identity in Shogun ecosystem
 * 
 * ## Abstract
 * 
 * This standard defines the foundational interface for identity that enables:
 * - Username/password authentication with deterministic key generation
 * - SEA key pair management (export, import, backup)
 * - Public key publication and discovery on GunDB
 * - User registry and lookup system
 * - Blockchain address derivation (Ethereum, Bitcoin, etc.)
 * 
 * ## Specification
 * 
 * Based on:
 * - GunDB for P2P identity storage
 * - SEA (Security, Encryption, Authorization) for key management
 * - Shogun Core DataBase API for authentication
 * - BIP32-like derivation for blockchain addresses
 * 
 * ## Usage
 * 
 * SHIP-00 serves as the foundation for all other SHIPs:
 * - SHIP-01 (Messaging) depends on SHIP-00 for identity
 * - SHIP-02 (Address Derivation) extends SHIP-00
 * - SHIP-03 (Multi-Modal Auth) extends SHIP-00
 * - SHIP-04 (File Storage) uses SHIP-00 for ACL
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @notice Authentication result
 */
export interface AuthResult {
    success: boolean;
    userPub?: string;           // SEA public key
    username?: string;          // Username/alias
    derivedAddress?: string;    // Derived Ethereum address (optional)
    error?: string;
}

/**
 * @notice Signup result
 */
export interface SignupResult {
    success: boolean;
    userPub?: string;
    username?: string;
    derivedAddress?: string;
    error?: string;
}

/**
 * @notice SEA key pair structure
 * Complete keypair for authentication and encryption
 */
export interface SEAPair {
    pub: string;      // Public signing key
    priv: string;     // Private signing key
    epub: string;     // Encryption public key (ECDH)
    epriv: string;    // Encryption private key
}

/**
 * @notice User identity information
 * Current authenticated user data
 */
export interface UserIdentity {
    pub: string;               // Public key
    alias?: string;            // Username
    epub?: string;             // Encryption public key
    derivedAddress?: string;   // Ethereum address
}

/**
 * @notice User data from registry
 * Information about registered users
 */
export interface UserData {
    userPub: string;
    username?: string;
    epub?: string;
    registeredAt?: number;
    lastSeen?: number;
}

/**
 * @notice Public key data
 * User's public keys for encryption
 */
export interface PublicKeyData {
    pub: string;            // Public signing key
    epub: string;           // Encryption public key
    algorithm?: string;     // Algorithm (ECDSA)
    timestamp?: string;     // Publication timestamp
}

/**
 * @notice Operation result
 */
export interface OperationResult {
    success: boolean;
    error?: string;
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

/**
 * @title ISHIP_00 - Decentralized Identity
 * @notice Main interface for identity and authentication system
 * @dev This is the foundation interface that other SHIPs depend on
 */
export interface ISHIP_00 {
    
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    /**
     * @notice Register a new user
     * @dev Creates new SEA keypair deterministically from credentials
     * @param username Desired username (must be unique)
     * @param password Password for key derivation
     * @return Result with userPub and derivedAddress
     * 
     * Process:
     * 1. Validate username uniqueness
     * 2. Generate SEA keypair via PBKDF2
     * 3. Store user in GunDB registry
     * 4. Return user public key
     */
    signup(username: string, password: string): Promise<SignupResult>;

    /**
     * @notice Login with username and password
     * @dev Derives SEA keypair from credentials
     * @param username Username
     * @param password Password
     * @return Result with userPub and derivedAddress
     * 
     * Process:
     * 1. Derive SEA keypair from credentials
     * 2. Authenticate with GunDB
     * 3. Restore session
     * 4. Return authentication result
     */
    login(username: string, password: string): Promise<AuthResult>;

    /**
     * @notice Login with exported SEA key pair
     * @dev Direct authentication using exported keypair
     * @param seaPair Exported SEA key pair (contains pub, priv, epub, epriv)
     * @return Result with userPub and derivedAddress
     * 
     * Use cases:
     * - Account recovery without password
     * - Multi-device identity sync
     * - Identity backup/restore
     * 
     * Security: SEA pair must be kept secure (contains private keys)
     */
    loginWithPair(seaPair: SEAPair): Promise<AuthResult>;

    /**
     * @notice Logout current user
     * @dev Clears session but keeps data on GunDB
     */
    logout(): void;

    /**
     * @notice Check if user is authenticated
     * @return True if user has active session
     */
    isLoggedIn(): boolean;

    // ========================================================================
    // CORE ACCESS
    // ========================================================================

    /**
     * @notice Get underlying ShogunCore instance
     * @dev Provides access to Gun, SEA, and crypto utilities
     * @return ShogunCore instance
     * 
     * Use cases:
     * - Access Gun database directly
     * - Use SEA encryption utilities
     * - Use crypto helpers (hash, encrypt, etc.)
     * 
     * Note: This is used by other SHIP implementations (SHIP-01, SHIP-06, etc.)
     */
    getShogun(): any; // ShogunCore type

    // ========================================================================
    // KEY MANAGEMENT
    // ========================================================================

    /**
     * @notice Publish public key on GunDB
     * @dev Makes user's public key discoverable by others
     * @return Operation result
     * 
     * Published data includes:
     * - pub: Public signing key
     * - epub: Encryption public key
     * - algorithm: ECDSA
     * - timestamp: Publication time
     */
    publishPublicKey(): Promise<OperationResult>;

    /**
     * @notice Export current user's SEA key pair
     * @dev For backup and multi-device usage
     * @return SEA key pair or null if not logged in
     * 
     * Security warnings:
     * - Contains private keys in plain text
     * - Must be stored securely
     * - Consider additional encryption layer
     * - Never share or expose backups
     */
    exportKeyPair(): SEAPair | null;

    /**
     * @notice Get current user's key pair
     * @return SEA pair or null if not logged in
     */
    getKeyPair(): SEAPair | null;

    // ========================================================================
    // USER DISCOVERY
    // ========================================================================

    /**
     * @notice Get user information by username
     * @dev Looks up user in GunDB registry
     * @param username Username to look up
     * @return User data or null if not found
     * 
     * Returned data includes:
     * - userPub: User's public key
     * - username: Username/alias
     * - epub: Encryption public key
     * - registeredAt: Registration timestamp
     * - lastSeen: Last activity timestamp
     */
    getUserByAlias(username: string): Promise<UserData | null>;

    /**
     * @notice Get user information by public key
     * @param userPub User's public key
     * @return User data or null if not found
     */
    getUserByPub(userPub: string): Promise<UserData | null>;

    /**
     * @notice Check if user exists in registry
     * @param username Username to check
     * @return True if user exists
     */
    userExists(username: string): Promise<boolean>;

    /**
     * @notice Get public key by username
     * @dev Returns both signing and encryption keys
     * @param username Username
     * @return Public keys or null if not found
     */
    getPublicKey(username: string): Promise<PublicKeyData | null>;

    // ========================================================================
    // IDENTITY
    // ========================================================================

    /**
     * @notice Get current authenticated user info
     * @return Current user identity or null if not logged in
     * 
     * Returned data includes:
     * - pub: Public key
     * - alias: Username
     * - epub: Encryption public key
     * - derivedAddress: Ethereum address (if derived)
     */
    getCurrentUser(): UserIdentity | null;

    /**
     * @notice Derive Ethereum address from SEA keypair
     * @dev Uses deterministic derivation for consistent results
     * @param publicKey Optional public key (uses current user if not provided)
     * @return Ethereum address (0x...)
     * 
     * Process:
     * 1. Get SEA private key
     * 2. Use derive function with secp256k1Ethereum
     * 3. Return address with EIP-55 checksum
     * 
     * Properties:
     * - Deterministic: Same keypair → same address
     * - Secure: Uses proven cryptographic derivation
     * - Compatible: Standard Ethereum address format
     */
    deriveEthereumAddress(publicKey?: string): Promise<string>;
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * @notice Identity system configuration
 */
export interface IdentityConfig {
    /**
     * @notice GunDB peers for P2P network
     */
    peers: string[];

    /**
     * @notice Application scope/namespace
     */
    scope?: string;

    /**
     * @notice Operation timeout (ms)
     */
    timeout?: number;

    /**
     * @notice Enable debug logging
     */
    debug?: boolean;

    /**
     * @notice Enable local storage
     */
    localStorage?: boolean;

    /**
     * @notice Enable radisk (persistent storage)
     */
    radisk?: boolean;
}

/**
 * @notice Key derivation options
 */
export interface DerivationOptions {
    /**
     * @notice Include Ethereum address derivation
     */
    includeEthereum?: boolean;

    /**
     * @notice Include Bitcoin address derivation
     */
    includeBitcoin?: boolean;

    /**
     * @notice Include Solana address derivation
     */
    includeSolana?: boolean;

    /**
     * @notice Custom derivation path
     */
    customPath?: string;
}

// ============================================================================
// IMPLEMENTATION EXAMPLE
// ============================================================================

/**
 * Example of how to implement ISHIP_00
 * 
 * ```typescript
 * import { ShogunCore } from 'shogun-core';
 * import { ISHIP_00, SEAPair, AuthResult, SignupResult } from './interfaces/ISHIP_00';
 * 
 * class IdentityManager implements ISHIP_00 {
 *     private shogun: ShogunCore;
 * 
 *     constructor(config: IdentityConfig) {
 *         this.shogun = new ShogunCore({
 *             gunOptions: {
 *                 peers: config.peers,
 *                 radisk: config.radisk,
 *                 localStorage: config.localStorage
 *             },
 *             scope: config.scope
 *         });
 *     }
 * 
 *     async signup(username: string, password: string): Promise<SignupResult> {
 *         // Use Shogun Core signUp method
 *         const result = await this.shogun.signUp(username, password);
 *         
 *         if (result.success) {
 *             // Publish public key
 *             await this.publishPublicKey();
 *             
 *             // Derive Ethereum address
 *             const derivedAddress = await this.deriveEthereumAddress(result.userPub);
 *             
 *             return {
 *                 success: true,
 *                 userPub: result.userPub,
 *                 username: username,
 *                 derivedAddress: derivedAddress
 *             };
 *         }
 *         
 *         return {
 *             success: false,
 *             error: result.error || 'Signup failed'
 *         };
 *     }
 * 
 *     async login(username: string, password: string): Promise<AuthResult> {
 *         // Use Shogun Core login method
 *         const result = await this.shogun.login(username, password);
 *         
 *         if (result.success) {
 *             const derivedAddress = await this.deriveEthereumAddress(result.userPub);
 *             
 *             return {
 *                 success: true,
 *                 userPub: result.userPub,
 *                 username: username,
 *                 derivedAddress: derivedAddress
 *             };
 *         }
 *         
 *         return {
 *             success: false,
 *             error: result.error || 'Login failed'
 *         };
 *     }
 * 
 *     exportKeyPair(): SEAPair | null {
 *         if (!this.isLoggedIn()) return null;
 *         
 *         const seaPair = (this.shogun.db.gun.user() as any)?._?.sea;
 *         if (!seaPair) return null;
 *         
 *         return {
 *             pub: seaPair.pub,
 *             priv: seaPair.priv,
 *             epub: seaPair.epub,
 *             epriv: seaPair.epriv
 *         };
 *     }
 * 
 *     async getUserByAlias(username: string): Promise<UserData | null> {
 *         // Use Shogun Core getUserByAlias method
 *         return await this.shogun.db.getUserByAlias(username);
 *     }
 * 
 *     async deriveEthereumAddress(publicKey?: string): Promise<string> {
 *         // Use shogun-derive package
 *         const derived = await derive(seaPair.priv, null, {
 *             includeSecp256k1Ethereum: true
 *         });
 *         
 *         return derived.secp256k1Ethereum.address;
 *     }
 * 
 *     // ... implement other methods
 * }
 * ```
 */

