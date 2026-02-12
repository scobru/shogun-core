// Base plugin interface and types
export { BasePlugin } from './base';
export type { ShogunPlugin, PluginManager } from '../interfaces/plugin';

// WebAuthn plugin exports
export { Webauthn } from './webauthn/webauthn';
export { WebauthnPlugin } from './webauthn/webauthnPlugin';
export type { WebauthnPluginInterface } from './webauthn/types';

// Ethereum plugin exports
export { Web3Connector } from './web3/web3Connector';
export { Web3ConnectorPlugin } from './web3/web3ConnectorPlugin';
export type { Web3ConnectorPluginInterface } from './web3/types';

// Bitcoin plugin exports
export { NostrConnector } from './nostr/nostrConnector';
export { NostrConnectorPlugin } from './nostr/nostrConnectorPlugin';
export type {
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
} from './nostr/types';

// ZK-Proof plugin exports
export { ZkProofConnector } from './zkproof/zkProofConnector';
export { ZkProofPlugin } from './zkproof/zkProofPlugin';
export { ZkCredentials, CredentialType } from './zkproof/zkCredentials';
export type {
  ZkProofPluginInterface,
  ZkIdentityData,
  ZkProofAuthResult,
  ZkProofGenerationOptions,
  ZkProofVerificationResult,
  ZkProofCredential,
  ZkProofConfig,
  SemaphoreProof,
} from './zkproof/types';
export type {
  CredentialClaim,
  VerifiableCredentialProof,
  CredentialVerificationResult,
} from './zkproof/zkCredentials';

// Challenge-Response plugin exports
export { ChallengePlugin } from './challenge/challengePlugin';
export type {
  ChallengeData,
  ChallengeConfig,
  ChallengePluginInterface,
} from './challenge/types';
