import { BasePlugin } from "../base";
import { ShogunCore } from "../../core";
import { ZkProofConnector } from "./zkProofConnector";
import {
  ZkIdentityData,
  ZkProofPluginInterface,
  ZkProofGenerationOptions,
  ZkProofVerificationResult,
  ZkProofConfig,
} from "./types";
import {
  AuthResult,
  SignUpResult,
  PluginCategory,
} from "../../interfaces/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
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
export class ZkProofPlugin
  extends BasePlugin
  implements ZkProofPluginInterface
{
  name = "zkproof";
  version = "1.0.0";
  description =
    "Zero-Knowledge Proof authentication using Semaphore protocol for ShogunCore";
  _category = PluginCategory.Authentication;

  private connector: ZkProofConnector | null = null;
  private config: ZkProofConfig;

  constructor(config: ZkProofConfig = {}) {
    super();
    this.config = {
      defaultGroupId: "shogun-users",
      deterministic: false,
      minEntropy: 128,
      ...config,
    };
  }

  /**
   * Initialize the plugin
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);
    this.connector = new ZkProofConnector();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.connector) {
      this.connector.cleanup();
    }
    this.connector = null;
    super.destroy();
  }

  /**
   * Ensure connector is initialized
   */
  private assertConnector(): ZkProofConnector {
    this.assertInitialized();
    if (!this.connector) {
      throw new Error("ZK-Proof connector not initialized");
    }
    return this.connector;
  }

  /**
   * Generate a new ZK identity
   */
  async generateIdentity(seed?: string): Promise<ZkIdentityData> {
    try {
      return await this.assertConnector().generateIdentity(seed);
    } catch (error: any) {
      throw createError(
        ErrorType.ENCRYPTION,
        "ZK_IDENTITY_GENERATION_FAILED",
        `Failed to generate ZK identity: ${error.message}`,
      );
    }
  }

  /**
   * Restore identity from trapdoor/seed phrase
   */
  async restoreIdentity(trapdoor: string): Promise<ZkIdentityData> {
    try {
      if (!trapdoor || trapdoor.trim().length === 0) {
        throw new Error("Trapdoor is required");
      }

      return await this.assertConnector().restoreIdentity(trapdoor);
    } catch (error: any) {
      throw createError(
        ErrorType.ENCRYPTION,
        "ZK_IDENTITY_RESTORE_FAILED",
        `Failed to restore ZK identity: ${error.message}`,
      );
    }
  }

  /**
   * Generate credentials for Gun authentication
   */
  async generateCredentials(identityData: ZkIdentityData): Promise<ISEAPair> {
    try {
      return await this.assertConnector().generateCredentials(identityData);
    } catch (error: any) {
      throw createError(
        ErrorType.ENCRYPTION,
        "ZK_CREDENTIAL_GENERATION_FAILED",
        `Failed to generate credentials: ${error.message}`,
      );
    }
  }

  /**
   * Generate a zero-knowledge proof
   */
  async generateProof(
    identityData: ZkIdentityData,
    options?: ZkProofGenerationOptions,
  ): Promise<any> {
    try {
      return await this.assertConnector().generateProof(identityData, options);
    } catch (error: any) {
      throw createError(
        ErrorType.ENCRYPTION,
        "ZK_PROOF_GENERATION_FAILED",
        `Failed to generate ZK proof: ${error.message}`,
      );
    }
  }

  /**
   * Verify a zero-knowledge proof
   */
  async verifyProof(
    proof: any,
    treeDepth: number = 20,
  ): Promise<ZkProofVerificationResult> {
    try {
      return await this.assertConnector().verifyProof(proof, treeDepth);
    } catch (error: any) {
      return {
        success: false,
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Add identity to a group
   */
  addToGroup(commitment: string, groupId?: string): void {
    const group = groupId || this.config.defaultGroupId || "default";
    this.assertConnector().addToGroup(commitment, group);
  }

  /**
   * Login with ZK proof
   * @param trapdoor - User's trapdoor/seed phrase
   * @returns Authentication result
   */
  async login(trapdoor: string): Promise<AuthResult> {
    try {
      const core = this.assertInitialized();
      const connector = this.assertConnector();

      if (!trapdoor || trapdoor.trim().length === 0) {
        throw createError(
          ErrorType.VALIDATION,
          "TRAPDOOR_REQUIRED",
          "Trapdoor is required for ZK-Proof login",
        );
      }

      console.log("🔐 ZK-Proof login - restoring identity from trapdoor");

      // Restore identity from trapdoor
      const identityData = await connector.restoreIdentity(trapdoor);

      console.log(
        `🔐 ZK-Proof login - identity restored, commitment: ${identityData.commitment.slice(0, 16)}...`,
      );

      // Generate credentials for Gun
      const gunPair = await connector.generateCredentials(identityData);

      console.log(
        `🔐 ZK-Proof login - Gun credentials generated, pub: ${gunPair.pub.slice(0, 16)}...`,
      );

      // Authenticate with Gun using the derived pair via ShogunCore
      const username = `zk_${identityData.commitment.slice(0, 16)}`;

      try {
        // Try to authenticate with existing account using ShogunCore
        const loginResult = await core.loginWithPair(username, gunPair);

        if (!loginResult.success) {
          console.log(
            "🔐 ZK-Proof login - existing account not found, this might be first login",
          );
        } else {
          console.log("🔐 ZK-Proof login - Gun authentication successful");
        }
      } catch (authError: any) {
        console.log(
          "🔐 ZK-Proof login - existing account not found, this might be first login",
        );
      }

      // Set authentication method
      core.setAuthMethod("zkproof");

      // Add to default group
      this.addToGroup(identityData.commitment);

      const result: AuthResult = {
        success: true,
        userPub: gunPair.pub,
        username: username,
        authMethod: "zkproof",
        sea: {
          pub: gunPair.pub,
          priv: gunPair.priv,
          epub: gunPair.epub,
          epriv: gunPair.epriv,
        },
      };

      // Emit login event
      core.emit("auth:login", {
        userPub: gunPair.pub,
        username: username,
        method: "zkproof",
      });

      console.log("🔐 ZK-Proof login - complete");

      return result;
    } catch (error: any) {
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "ZK_LOGIN_ERROR";
      const errorMessage =
        error?.message || "Unknown error during ZK-Proof login";

      ErrorHandler.handle(errorType, errorCode, errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign up with new ZK identity
   * @param seed - Optional seed for deterministic generation
   * @returns Authentication result with trapdoor for backup
   */
  async signUp(seed?: string): Promise<SignUpResult> {
    try {
      const core = this.assertInitialized();
      const connector = this.assertConnector();

      console.log("🔐 ZK-Proof signup - generating new identity");

      // Generate new identity
      const identityData = await connector.generateIdentity(seed);

      console.log(
        `🔐 ZK-Proof signup - identity generated, commitment: ${identityData.commitment.slice(0, 16)}...`,
      );

      // Generate credentials for Gun
      const gunPair = await connector.generateCredentials(identityData);

      console.log(
        `🔐 ZK-Proof signup - Gun credentials generated, pub: ${gunPair.pub.slice(0, 16)}...`,
      );

      // Create Gun user account using ShogunCore methods
      const username = `zk_${identityData.commitment.slice(0, 16)}`;

      try {
        // Try to create user with signUp
        const signUpResult = await core.signUp(username, undefined, gunPair);

        if (!signUpResult.success) {
          // If user already exists, login with the pair
          const loginResult = await core.loginWithPair(username, gunPair);
          if (!loginResult.success) {
            throw new Error(loginResult.error || "Failed to authenticate");
          }
        }

        console.log("🔐 ZK-Proof signup - Gun user created/authenticated");
      } catch (createError: any) {
        throw createError;
      }

      // Set authentication method
      core.setAuthMethod("zkproof");

      // Add to default group
      this.addToGroup(identityData.commitment);

      const result: SignUpResult = {
        success: true,
        userPub: gunPair.pub,
        username: username,
        authMethod: "zkproof",
        isNewUser: true,
        // CRITICAL: Include trapdoor for user backup (like seed phrase in WebAuthn)
        seedPhrase: identityData.trapdoor,
        sea: {
          pub: gunPair.pub,
          priv: gunPair.priv,
          epub: gunPair.epub,
          epriv: gunPair.epriv,
        },
      };

      // Emit signup event
      core.emit("auth:signup", {
        userPub: gunPair.pub,
        username: username,
        method: "zkproof",
      });

      console.log("🔐 ZK-Proof signup - complete");
      console.log(
        `⚠️  IMPORTANT: Save the trapdoor (seed phrase) for account recovery!`,
      );

      return result;
    } catch (error: any) {
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "ZK_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during ZK-Proof signup";

      ErrorHandler.handle(errorType, errorCode, errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if ZK-Proof is available
   */
  isAvailable(): boolean {
    return typeof window !== "undefined" || typeof global !== "undefined";
  }
}

export type { ZkProofPluginInterface } from "./types";
