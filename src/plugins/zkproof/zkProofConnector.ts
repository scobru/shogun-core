import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof } from '@semaphore-protocol/proof';
import { ethers } from 'ethers';
import { ISEAPair } from 'gun';
import derive from '../../gundb/derive';
import {
  ZkIdentityData,
  ZkProofAuthResult,
  ZkProofGenerationOptions,
  ZkProofVerificationResult,
  ZkProofCredential,
  SemaphoreProof,
} from './types';
import { ErrorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * Connector for ZK-Proof operations using Semaphore protocol
 */
export class ZkProofConnector {
  private identityCache: Map<string, Identity> = new Map();
  private credentialCache: Map<string, ZkProofCredential> = new Map();
  private groups: Map<string, Group> = new Map();

  /**
   * Generate a new Semaphore identity
   */
  async generateIdentity(seed?: string): Promise<ZkIdentityData> {
    try {
      let identity: Identity;

      if (seed) {
        // Deterministic generation from seed
        identity = new Identity(seed);
      } else {
        // Random generation
        identity = new Identity();
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
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        'ZK_IDENTITY_GENERATION_FAILED',
        `Failed to generate ZK identity: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Restore identity from trapdoor
   */
  async restoreIdentity(trapdoor: string): Promise<ZkIdentityData> {
    try {
      // Reconstruct identity from trapdoor
      const identity = new Identity(trapdoor);
      const commitment = identity.commitment.toString();

      // Cache the identity
      this.identityCache.set(commitment, identity);

      return {
        commitment,
        trapdoor: identity.trapdoor.toString(),
        nullifier: identity.nullifier.toString(),
        createdAt: Date.now(),
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        'ZK_IDENTITY_RESTORE_FAILED',
        `Failed to restore ZK identity: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate Gun credentials from ZK identity
   */
  async generateCredentials(identityData: ZkIdentityData): Promise<ISEAPair> {
    try {
      // Use commitment as username and trapdoor as password for Gun
      const username = `zk_${identityData.commitment.slice(0, 16)}`;

      // Derive password from trapdoor and nullifier
      const password = ethers.keccak256(
        ethers.toUtf8Bytes(
          `${identityData.trapdoor}_${identityData.nullifier}`,
        ),
      );

      // Derive Gun SEA pair
      const gunPair = await derive(password, username, {
        includeP256: true,
      });

      // Cache credential
      this.credentialCache.set(identityData.commitment, {
        commitment: identityData.commitment,
        gunPair,
        createdAt: identityData.createdAt,
      });

      return gunPair;
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        'ZK_CREDENTIAL_GENERATION_FAILED',
        `Failed to generate credentials from ZK identity: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get or create a Semaphore group
   */
  private getOrCreateGroup(groupId: string = 'default'): Group {
    if (!this.groups.has(groupId)) {
      // Convert string groupId to BigNumber using keccak256 hash
      const groupIdHash = ethers.keccak256(ethers.toUtf8Bytes(groupId));
      const groupIdNumber = BigInt(groupIdHash);
      this.groups.set(groupId, new Group(groupIdNumber));
    }
    return this.groups.get(groupId)!;
  }

  /**
   * Add identity to a group
   */
  addToGroup(commitment: string, groupId: string = 'default'): void {
    const group = this.getOrCreateGroup(groupId);
    group.addMember(BigInt(commitment));
  }

  /**
   * Generate a Semaphore proof
   */
  async generateProof(
    identityData: ZkIdentityData,
    options: ZkProofGenerationOptions = {},
  ): Promise<SemaphoreProof> {
    try {
      const groupId = options.groupId || 'default';
      const messageString = options.message || 'authenticate';
      const scopeString = options.scope || 'shogun-auth';

      // Convert message and scope to BigNumber (Semaphore requires BigInt)
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(messageString));
      const message = BigInt(messageHash);

      const scopeHash = ethers.keccak256(ethers.toUtf8Bytes(scopeString));
      const scope = BigInt(scopeHash);

      // Get or reconstruct identity
      let identity = this.identityCache.get(identityData.commitment);
      if (!identity && identityData.trapdoor) {
        identity = new Identity(identityData.trapdoor);
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
      const fullProof = await generateProof(identity, group, message, scope);

      return {
        merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
        nullifierHash: fullProof.nullifierHash.toString(),
        signal: fullProof.signal.toString(),
        externalNullifier: fullProof.externalNullifier.toString(),
        proof: fullProof.proof.map((p: any) => p.toString()),
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        'ZK_PROOF_GENERATION_FAILED',
        `Failed to generate ZK proof: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verify a Semaphore proof
   */
  async verifyProof(
    proof: SemaphoreProof,
    treeDepth: number = 20,
  ): Promise<ZkProofVerificationResult> {
    try {
      const verified = await verifyProof(proof as any, treeDepth);

      return {
        success: true,
        verified,
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        'ZK_PROOF_VERIFICATION_FAILED',
        `Failed to verify ZK proof: ${error.message}`,
        error,
      );

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
  getCredential(commitment: string): ZkProofCredential | undefined {
    return this.credentialCache.get(commitment);
  }

  /**
   * Clear all caches
   */
  cleanup(): void {
    this.identityCache.clear();
    this.credentialCache.clear();
    this.groups.clear();
  }
}
