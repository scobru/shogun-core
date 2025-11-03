/**
 * MLS (Message Layer Security) Manager
 * RFC 9420 implementation using ts-mls library
 * Provides end-to-end encrypted group messaging with forward secrecy
 */
import { type PrivateKeyPackage, type KeyPackage, type Welcome } from "ts-mls";
export interface MLSGroupInfo {
    groupId: Uint8Array;
    members: string[];
    epoch: bigint;
}
export interface MLSMessageEnvelope {
    groupId: Uint8Array;
    ciphertext: Uint8Array;
    timestamp: number;
}
export interface MLSKeyPackageBundle {
    publicPackage: KeyPackage;
    privatePackage: PrivateKeyPackage;
    userId: string;
}
/**
 * MLSManager wraps the ts-mls functional API with a class-based interface
 * for easier state management in applications
 */
export declare class MLSManager {
    private userId;
    private cipherSuite;
    private initialized;
    private groups;
    private keyPackage;
    private credential;
    constructor(userId: string);
    /**
     * Initialize the MLS client with a ciphersuite
     */
    initialize(): Promise<void>;
    /**
     * Generate a new key package for joining groups
     */
    generateKeyPackage(): Promise<MLSKeyPackageBundle>;
    /**
     * Get the current key package
     */
    getKeyPackage(): MLSKeyPackageBundle | null;
    /**
     * Create a new MLS group
     */
    createGroup(groupId: string): Promise<MLSGroupInfo>;
    /**
     * Add members to an existing group
     */
    addMembers(groupId: string, keyPackages: MLSKeyPackageBundle[]): Promise<{
        welcome: Welcome;
        ratchetTree: any;
        commit: any;
    }>;
    /**
     * Process a Welcome message to join an MLS group
     *
     * RFC 9420 Compliance:
     * - Interior null nodes represent blank parent nodes (unmerged positions)
     * - These nulls are REQUIRED for proper binary tree structure
     * - Trailing nulls are stripped by sender (per RFC 9420 requirement)
     * - ratchetTree parameter is optional; ts-mls can extract from Welcome extension
     *
     * @param welcome - The Welcome message from group creator
     * @param ratchetTree - Optional ratchet tree (normally provided out-of-band)
     */
    processWelcome(welcome: Welcome, ratchetTree?: Uint8Array[]): Promise<MLSGroupInfo>;
    /**
     * Encrypt a message for a group
     */
    encryptMessage(groupId: string, plaintext: string): Promise<MLSMessageEnvelope>;
    /**
     * Decrypt a message from a group
     */
    decryptMessage(envelope: MLSMessageEnvelope): Promise<string>;
    /**
     * Update the group keys (key rotation)
     */
    updateKey(groupId: string): Promise<any>;
    /**
     * Process a commit message (key rotation, member changes)
     *
     * RFC 9420 Section 12.1.8:
     * - Update commits (key rotation) → PrivateMessage
     * - Add/Remove commits → PublicMessage (for existing group members)
     *
     * This implementation handles both types based on wireformat.
     */
    processCommit(groupId: string, commit: any): Promise<void>;
    /**
     * Remove members from a group
     */
    removeMembers(groupId: string, memberIndices: number[]): Promise<Uint8Array>;
    /**
     * Get list of groups
     */
    getGroups(): Promise<Uint8Array[]>;
    /**
     * Export group state for persistence
     */
    exportGroupState(groupId: string): Promise<any>;
    /**
     * Get user ID
     */
    getUserId(): string;
    /**
     * Get group information
     */
    getGroupKeyInfo(groupId: string): Promise<any>;
    /**
     * Clean up resources
     */
    destroy(): Promise<void>;
    /**
     * Extract member identities from group state
     */
    private extractMembersFromState;
    /**
     * Convert bytes to hex string
     */
    private bytesToHex;
    /**
     * Ensure the manager is initialized
     */
    private ensureInitialized;
}
export default MLSManager;
