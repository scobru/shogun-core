import { ISEAPair } from 'gun';
import { ZkIdentityData, ZkProofGenerationOptions, ZkProofVerificationResult, ZkProofCredential, SemaphoreProof } from './types';
/**
 * Connector for ZK-Proof operations using Semaphore protocol
 */
export declare class ZkProofConnector {
    private identityCache;
    private credentialCache;
    private groups;
    /**
     * Generate a new Semaphore identity
     */
    generateIdentity(seed?: string): Promise<ZkIdentityData>;
    /**
     * Restore identity from trapdoor
     */
    restoreIdentity(trapdoor: string): Promise<ZkIdentityData>;
    /**
     * Generate Gun credentials from ZK identity
     */
    generateCredentials(identityData: ZkIdentityData): Promise<ISEAPair>;
    /**
     * Get or create a Semaphore group
     */
    private getOrCreateGroup;
    /**
     * Add identity to a group
     */
    addToGroup(commitment: string, groupId?: string): void;
    /**
     * Generate a Semaphore proof
     */
    generateProof(identityData: ZkIdentityData, options?: ZkProofGenerationOptions): Promise<SemaphoreProof>;
    /**
     * Verify a Semaphore proof
     */
    verifyProof(proof: SemaphoreProof, treeDepth?: number): Promise<ZkProofVerificationResult>;
    /**
     * Get cached credential by commitment
     */
    getCredential(commitment: string): ZkProofCredential | undefined;
    /**
     * Clear all caches
     */
    cleanup(): void;
}
