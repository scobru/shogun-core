import { BasePlugin } from "../base";
import { ShogunCore } from "../../core";
import { ZkIdentityData, ZkProofPluginInterface, ZkProofGenerationOptions, ZkProofVerificationResult, ZkProofConfig } from "./types";
import { AuthResult, SignUpResult, PluginCategory } from "../../interfaces/shogun";
import { ISEAPair } from "gun";
/**
 * Plugin for Zero-Knowledge Proof authentication using Semaphore protocol
 *
 * Features:
 * - Anonymous authentication with ZK proofs
 * - Multi-device support via trapdoor backup
 * - Privacy-preserving identity management
 * - Compatible with Gun decentralized storage
 */
export declare class ZkProofPlugin extends BasePlugin implements ZkProofPluginInterface {
    name: string;
    version: string;
    description: string;
    _category: PluginCategory;
    private connector;
    private config;
    constructor(config?: ZkProofConfig);
    /**
     * Initialize the plugin
     */
    initialize(core: ShogunCore): void;
    /**
     * Clean up resources
     */
    destroy(): void;
    /**
     * Ensure connector is initialized
     */
    private assertConnector;
    /**
     * Generate a new ZK identity
     */
    generateIdentity(seed?: string): Promise<ZkIdentityData>;
    /**
     * Restore identity from trapdoor/seed phrase
     */
    restoreIdentity(trapdoor: string): Promise<ZkIdentityData>;
    /**
     * Generate credentials for Gun authentication
     */
    generateCredentials(identityData: ZkIdentityData): Promise<ISEAPair>;
    /**
     * Generate a zero-knowledge proof
     */
    generateProof(identityData: ZkIdentityData, options?: ZkProofGenerationOptions): Promise<any>;
    /**
     * Verify a zero-knowledge proof
     */
    verifyProof(proof: any, treeDepth?: number): Promise<ZkProofVerificationResult>;
    /**
     * Add identity to a group
     */
    addToGroup(commitment: string, groupId?: string): void;
    /**
     * Login with ZK proof
     * @param trapdoor - User's trapdoor/seed phrase
     * @returns Authentication result
     */
    login(trapdoor: string): Promise<AuthResult>;
    /**
     * Sign up with new ZK identity
     * @param seed - Optional seed for deterministic generation
     * @returns Authentication result with trapdoor for backup
     */
    signUp(seed?: string): Promise<SignUpResult>;
    /**
     * Check if ZK-Proof is available
     */
    isAvailable(): boolean;
}
export type { ZkProofPluginInterface } from "./types";
