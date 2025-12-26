"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkProofConnector = void 0;
const identity_1 = require("@semaphore-protocol/identity");
const group_1 = require("@semaphore-protocol/group");
const proof_1 = require("@semaphore-protocol/proof");
const ethers_1 = require("ethers");
const derive_1 = __importDefault(require("../../gundb/derive"));
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Connector for ZK-Proof operations using Semaphore protocol
 */
class ZkProofConnector {
    constructor() {
        this.identityCache = new Map();
        this.credentialCache = new Map();
        this.groups = new Map();
    }
    /**
     * Generate a new Semaphore identity
     */
    async generateIdentity(seed) {
        try {
            let identity;
            if (seed) {
                // Deterministic generation from seed
                identity = new identity_1.Identity(seed);
            }
            else {
                // Random generation
                identity = new identity_1.Identity();
            }
            const commitment = identity.commitment.toString();
            const trapdoor = identity.trapdoor.toString();
            const nullifier = identity.nullifier.toString();
            // Cache the identity
            this.identityCache.set(commitment, identity);
            return {
                commitment,
                trapdoor,
                nullifier,
                createdAt: Date.now(),
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, 'ZK_IDENTITY_GENERATION_FAILED', `Failed to generate ZK identity: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Restore identity from trapdoor
     */
    async restoreIdentity(trapdoor) {
        try {
            // Reconstruct identity from trapdoor
            const identity = new identity_1.Identity(trapdoor);
            const commitment = identity.commitment.toString();
            // Cache the identity
            this.identityCache.set(commitment, identity);
            return {
                commitment,
                trapdoor: identity.trapdoor.toString(),
                nullifier: identity.nullifier.toString(),
                createdAt: Date.now(),
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, 'ZK_IDENTITY_RESTORE_FAILED', `Failed to restore ZK identity: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Generate Gun credentials from ZK identity
     */
    async generateCredentials(identityData) {
        try {
            // Use commitment as username and trapdoor as password for Gun
            const username = `zk_${identityData.commitment.slice(0, 16)}`;
            // Derive password from trapdoor and nullifier
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${identityData.trapdoor}_${identityData.nullifier}`));
            // Derive Gun SEA pair
            const gunPair = await (0, derive_1.default)(password, username, {
                includeP256: true,
            });
            // Cache credential
            this.credentialCache.set(identityData.commitment, {
                commitment: identityData.commitment,
                gunPair,
                createdAt: identityData.createdAt,
            });
            return gunPair;
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, 'ZK_CREDENTIAL_GENERATION_FAILED', `Failed to generate credentials from ZK identity: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Get or create a Semaphore group
     */
    getOrCreateGroup(groupId = 'default') {
        if (!this.groups.has(groupId)) {
            // Convert string groupId to BigNumber using keccak256 hash
            const groupIdHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(groupId));
            const groupIdNumber = BigInt(groupIdHash);
            this.groups.set(groupId, new group_1.Group(groupIdNumber));
        }
        return this.groups.get(groupId);
    }
    /**
     * Add identity to a group
     */
    addToGroup(commitment, groupId = 'default') {
        const group = this.getOrCreateGroup(groupId);
        group.addMember(BigInt(commitment));
    }
    /**
     * Generate a Semaphore proof
     */
    async generateProof(identityData, options = {}) {
        try {
            const groupId = options.groupId || 'default';
            const messageString = options.message || 'authenticate';
            const scopeString = options.scope || 'shogun-auth';
            // Convert message and scope to BigNumber (Semaphore requires BigInt)
            const messageHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(messageString));
            const message = BigInt(messageHash);
            const scopeHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(scopeString));
            const scope = BigInt(scopeHash);
            // Get or reconstruct identity
            let identity = this.identityCache.get(identityData.commitment);
            if (!identity && identityData.trapdoor) {
                identity = new identity_1.Identity(identityData.trapdoor);
                this.identityCache.set(identityData.commitment, identity);
            }
            if (!identity) {
                throw new Error('Identity not found and cannot be reconstructed');
            }
            // Get group
            const group = this.getOrCreateGroup(groupId);
            // Add identity to group if not already added
            if (group.indexOf(identity.commitment) === -1) {
                group.addMember(identity.commitment);
            }
            // Generate proof
            const fullProof = await (0, proof_1.generateProof)(identity, group, message, scope);
            return {
                merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
                nullifierHash: fullProof.nullifierHash.toString(),
                signal: fullProof.signal.toString(),
                externalNullifier: fullProof.externalNullifier.toString(),
                proof: fullProof.proof.map((p) => p.toString()),
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, 'ZK_PROOF_GENERATION_FAILED', `Failed to generate ZK proof: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Verify a Semaphore proof
     */
    async verifyProof(proof, treeDepth = 20) {
        try {
            const verified = await (0, proof_1.verifyProof)(proof, treeDepth);
            return {
                success: true,
                verified,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, 'ZK_PROOF_VERIFICATION_FAILED', `Failed to verify ZK proof: ${error.message}`, error);
            return {
                success: false,
                verified: false,
                error: error.message,
            };
        }
    }
    /**
     * Get cached credential by commitment
     */
    getCredential(commitment) {
        return this.credentialCache.get(commitment);
    }
    /**
     * Clear all caches
     */
    cleanup() {
        this.identityCache.clear();
        this.credentialCache.clear();
        this.groups.clear();
    }
}
exports.ZkProofConnector = ZkProofConnector;
