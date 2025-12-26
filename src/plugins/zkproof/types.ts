import { ISEAPair } from 'gun';

/**
 * ZK-Proof identity data
 */
export interface ZkIdentityData {
  /** Semaphore identity commitment (public) */
  commitment: string;
  /** Trapdoor (private - used for recovery/login) */
  trapdoor?: string;
  /** Nullifier (private) */
  nullifier?: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * ZK-Proof authentication result
 */
export interface ZkProofAuthResult {
  success: boolean;
  commitment?: string;
  userPub?: string;
  error?: string;
}

/**
 * ZK-Proof generation options
 */
export interface ZkProofGenerationOptions {
  /** Group ID for Semaphore group */
  groupId?: string;
  /** Custom message to prove */
  message?: string;
  /** Scope for the proof */
  scope?: string;
}

/**
 * ZK-Proof verification result
 */
export interface ZkProofVerificationResult {
  success: boolean;
  verified: boolean;
  commitment?: string;
  error?: string;
}

/**
 * ZK-Proof credential for Gun authentication
 */
export interface ZkProofCredential {
  commitment: string;
  gunPair: ISEAPair;
  createdAt: number;
}

/**
 * ZK-Proof plugin configuration
 */
export interface ZkProofConfig {
  /** Default group ID */
  defaultGroupId?: string;
  /** Enable deterministic identity generation */
  deterministic?: boolean;
  /** Minimum entropy for identity generation */
  minEntropy?: number;
}

/**
 * ZK-Proof plugin interface
 */
export interface ZkProofPluginInterface {
  /**
   * Generate a new ZK identity
   * @param seed - Optional seed for deterministic generation
   * @returns ZK identity data with trapdoor for backup
   */
  generateIdentity(seed?: string): Promise<ZkIdentityData>;

  /**
   * Restore identity from trapdoor/seed phrase
   * @param trapdoor - Trapdoor or seed phrase
   * @returns ZK identity data
   */
  restoreIdentity(trapdoor: string): Promise<ZkIdentityData>;

  /**
   * Generate credentials for Gun authentication
   * @param identityData - ZK identity data
   * @returns Gun SEA pair
   */
  generateCredentials(identityData: ZkIdentityData): Promise<ISEAPair>;

  /**
   * Generate a zero-knowledge proof
   * @param identityData - ZK identity data
   * @param options - Proof generation options
   * @returns Proof data
   */
  generateProof(
    identityData: ZkIdentityData,
    options?: ZkProofGenerationOptions,
  ): Promise<any>;

  /**
   * Verify a zero-knowledge proof
   * @param proof - Proof data to verify
   * @param treeDepth - Merkle tree depth (default: 20)
   * @returns Verification result
   */
  verifyProof(
    proof: any,
    treeDepth?: number,
  ): Promise<ZkProofVerificationResult>;

  /**
   * Login with ZK proof
   * @param trapdoor - User's trapdoor/seed phrase
   * @returns Authentication result
   */
  login(trapdoor: string): Promise<ZkProofAuthResult>;

  /**
   * Sign up with new ZK identity
   * @param seed - Optional seed for deterministic generation
   * @returns Authentication result with trapdoor for backup
   */
  signUp(seed?: string): Promise<ZkProofAuthResult & { trapdoor?: string }>;
}

/**
 * Semaphore proof data structure
 */
export interface SemaphoreProof {
  merkleTreeRoot: string;
  nullifierHash: string;
  signal: string;
  externalNullifier: string;
  proof: string[];
}
