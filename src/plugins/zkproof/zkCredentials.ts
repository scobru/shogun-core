import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

/**
 * Types of verifiable credentials
 */
export enum CredentialType {
  AGE = "age",
  CITIZENSHIP = "citizenship",
  EDUCATION = "education",
  INCOME = "income",
  EMPLOYMENT = "employment",
  HEALTH = "health",
  CUSTOM = "custom",
}

/**
 * Credential claim data
 */
export interface CredentialClaim {
  /** Type of credential */
  type: CredentialType;
  /** Public claim statement */
  claim: string;
  /** Private data that proves the claim */
  privateData: Record<string, any>;
  /** Issuer of the credential (optional) */
  issuer?: string;
  /** Expiration timestamp (optional) */
  expiresAt?: number;
}

/**
 * Verifiable credential proof
 */
export interface VerifiableCredentialProof {
  /** Type of credential being proved */
  type: CredentialType;
  /** Public claim statement */
  claim: string;
  /** ZK proof data */
  proof: {
    merkleTreeRoot: string;
    nullifierHash: string;
    signal: string;
    externalNullifier: string;
    proof: string[];
  };
  /** Credential hash (for verification) */
  credentialHash: string;
  /** Timestamp when proof was generated */
  timestamp: number;
}

/**
 * Credential verification result
 */
export interface CredentialVerificationResult {
  verified: boolean;
  type?: CredentialType;
  claim?: string;
  timestamp?: number;
  error?: string;
}

/**
 * ZK Credentials Manager
 * Extends ZK-Proof functionality to support verifiable credentials
 */
export class ZkCredentials {
  private groups: Map<string, Group> = new Map();

  /**
   * Create a verifiable credential from private data
   */
  createCredential(
    identity: Identity,
    credentialData: CredentialClaim,
  ): {
    credential: VerifiableCredentialProof;
    credentialHash: string;
  } {
    try {
      // Hash the private data to create a credential commitment
      const privateDataString = JSON.stringify(credentialData.privateData);
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(privateDataString),
      );

      // For now, return a basic credential structure
      // Full proof generation requires circuit files
      const credential: VerifiableCredentialProof = {
        type: credentialData.type,
        claim: credentialData.claim,
        proof: {
          merkleTreeRoot: "",
          nullifierHash: "",
          signal: credentialHash,
          externalNullifier: "",
          proof: [],
        },
        credentialHash,
        timestamp: Date.now(),
      };

      return {
        credential,
        credentialHash,
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "CREDENTIAL_CREATION_FAILED",
        `Failed to create verifiable credential: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Prove an attribute about yourself without revealing the underlying data
   */
  async proveAttribute(
    identity: Identity,
    credentialData: CredentialClaim,
    groupId: string = "verified-credentials",
  ): Promise<VerifiableCredentialProof> {
    try {
      const { credential, credentialHash } = this.createCredential(
        identity,
        credentialData,
      );

      // Convert claim to signal
      const signal = ethers.keccak256(ethers.toUtf8Bytes(credentialData.claim));
      const signalBigInt = BigInt(signal);

      // Create or get group
      const group = this.getOrCreateGroup(groupId);

      // Add identity if not already in group
      if (group.indexOf(identity.commitment) === -1) {
        group.addMember(identity.commitment);
      }

      // External nullifier from credential type
      const externalNullifier = BigInt(
        ethers.keccak256(ethers.toUtf8Bytes(credentialData.type)),
      );

      // Generate ZK proof
      // Note: This requires circuit files to be available
      const fullProof = await generateProof(
        identity,
        group,
        signalBigInt,
        externalNullifier,
      );

      return {
        type: credentialData.type,
        claim: credentialData.claim,
        proof: {
          merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
          nullifierHash: fullProof.nullifierHash.toString(),
          signal: fullProof.signal.toString(),
          externalNullifier: fullProof.externalNullifier.toString(),
          proof: fullProof.proof.map((p: any) => p.toString()),
        },
        credentialHash,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "ATTRIBUTE_PROOF_FAILED",
        `Failed to prove attribute: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verify a credential proof
   */
  async verifyCredential(
    proof: VerifiableCredentialProof,
    treeDepth: number = 20,
  ): Promise<CredentialVerificationResult> {
    try {
      const verified = await verifyProof(proof.proof as any, treeDepth);

      return {
        verified,
        type: proof.type,
        claim: proof.claim,
        timestamp: proof.timestamp,
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "CREDENTIAL_VERIFICATION_FAILED",
        `Failed to verify credential: ${error.message}`,
        error,
      );

      return {
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a group for credential holders
   */
  private getOrCreateGroup(groupId: string): Group {
    if (!this.groups.has(groupId)) {
      const groupIdHash = ethers.keccak256(ethers.toUtf8Bytes(groupId));
      const groupIdNumber = BigInt(groupIdHash);
      this.groups.set(groupId, new Group(groupIdNumber));
    }
    return this.groups.get(groupId)!;
  }

  /**
   * Add an identity to a credentials group
   */
  addToCredentialGroup(
    identity: Identity,
    groupId: string = "verified-credentials",
  ): void {
    const group = this.getOrCreateGroup(groupId);
    if (group.indexOf(identity.commitment) === -1) {
      group.addMember(identity.commitment);
    }
  }

  /**
   * Common credential proofs
   */

  /**
   * Prove age without revealing exact birthdate
   */
  async proveAge(
    identity: Identity,
    birthDate: Date,
    minimumAge: number,
  ): Promise<VerifiableCredentialProof> {
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    if (age < minimumAge) {
      throw new Error(`Age ${age} is less than required ${minimumAge}`);
    }

    return this.proveAttribute(identity, {
      type: CredentialType.AGE,
      claim: `Age is ${minimumAge} or older`,
      privateData: {
        birthDate: birthDate.toISOString(),
        actualAge: age,
      },
    });
  }

  /**
   * Prove citizenship without revealing country
   */
  async proveCitizenship(
    identity: Identity,
    country: string,
    region: string = "EU",
  ): Promise<VerifiableCredentialProof> {
    return this.proveAttribute(identity, {
      type: CredentialType.CITIZENSHIP,
      claim: `Citizen of ${region}`,
      privateData: {
        country,
        passportNumber: "hidden",
      },
    });
  }

  /**
   * Prove education without revealing institution
   */
  async proveEducation(
    identity: Identity,
    degree: string,
    university: string,
    year: number,
  ): Promise<VerifiableCredentialProof> {
    return this.proveAttribute(identity, {
      type: CredentialType.EDUCATION,
      claim: `Has ${degree} degree`,
      privateData: {
        university,
        degree,
        year,
      },
    });
  }

  /**
   * Prove income range without revealing exact amount
   */
  async proveIncome(
    identity: Identity,
    amount: number,
    minimumRequired: number,
    currency: string = "USD",
  ): Promise<VerifiableCredentialProof> {
    if (amount < minimumRequired) {
      throw new Error(
        `Income ${amount} is less than required ${minimumRequired}`,
      );
    }

    return this.proveAttribute(identity, {
      type: CredentialType.INCOME,
      claim: `Income ≥ ${minimumRequired} ${currency}`,
      privateData: {
        actualIncome: amount,
        currency,
        verified: true,
      },
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.groups.clear();
  }
}
