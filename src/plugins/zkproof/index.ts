/**
 * ZK-Proof Plugin for Shogun Core
 *
 * Provides Zero-Knowledge Proof authentication using Semaphore protocol
 *
 * Features:
 * - Anonymous authentication without revealing identity
 * - Multi-device support via trapdoor backup
 * - Privacy-preserving group membership proofs
 * - Compatible with Gun decentralized storage
 *
 * @example
 * ```typescript
 * // Initialize Shogun with ZK-Proof plugin
 * const shogun = new ShogunCore({
 *   peers: ['https://gun-manhattan.herokuapp.com/gun'],
 *   zkproof: {
 *     enabled: true,
 *     defaultGroupId: 'my-app-users'
 *   }
 * });
 *
 * await shogun.initialize();
 *
 * // Get the plugin
 * const zkPlugin = shogun.getPlugin<ZkProofPlugin>('zkproof');
 *
 * // Sign up with ZK-Proof
 * const signupResult = await zkPlugin.signUp();
 * if (signupResult.success) {
 *   console.log('Trapdoor (save this!):', signupResult.seedPhrase);
 *   console.log('Public commitment:', signupResult.username);
 * }
 *
 * // Login with trapdoor
 * const loginResult = await zkPlugin.login(trapdoor);
 * if (loginResult.success) {
 *   console.log('Logged in anonymously!');
 * }
 * ```
 *
 * @module zkproof
 */

export { ZkProofPlugin } from "./zkProofPlugin";
export { ZkProofConnector } from "./zkProofConnector";
export { ZkCredentials, CredentialType } from "./zkCredentials";
export type {
  ZkIdentityData,
  ZkProofAuthResult,
  ZkProofGenerationOptions,
  ZkProofVerificationResult,
  ZkProofCredential,
  ZkProofConfig,
  ZkProofPluginInterface,
  SemaphoreProof,
} from "./types";
export type {
  CredentialClaim,
  VerifiableCredentialProof,
  CredentialVerificationResult,
} from "./zkCredentials";
