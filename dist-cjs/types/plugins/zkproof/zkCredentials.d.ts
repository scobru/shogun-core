import { Identity } from "@semaphore-protocol/identity";
/**
 * Types of verifiable credentials
 */
export declare enum CredentialType {
    AGE = "age",
    CITIZENSHIP = "citizenship",
    EDUCATION = "education",
    INCOME = "income",
    EMPLOYMENT = "employment",
    HEALTH = "health",
    CUSTOM = "custom"
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
export declare class ZkCredentials {
    private groups;
    /**
     * Create a verifiable credential from private data
     */
    createCredential(identity: Identity, credentialData: CredentialClaim): {
        credential: VerifiableCredentialProof;
        credentialHash: string;
    };
    /**
     * Prove an attribute about yourself without revealing the underlying data
     */
    proveAttribute(identity: Identity, credentialData: CredentialClaim, groupId?: string): Promise<VerifiableCredentialProof>;
    /**
     * Verify a credential proof
     */
    verifyCredential(proof: VerifiableCredentialProof, treeDepth?: number): Promise<CredentialVerificationResult>;
    /**
     * Create a group for credential holders
     */
    private getOrCreateGroup;
    /**
     * Add an identity to a credentials group
     */
    addToCredentialGroup(identity: Identity, groupId?: string): void;
    /**
     * Common credential proofs
     */
    /**
     * Prove age without revealing exact birthdate
     */
    proveAge(identity: Identity, birthDate: Date, minimumAge: number): Promise<VerifiableCredentialProof>;
    /**
     * Prove citizenship without revealing country
     */
    proveCitizenship(identity: Identity, country: string, region?: string): Promise<VerifiableCredentialProof>;
    /**
     * Prove education without revealing institution
     */
    proveEducation(identity: Identity, degree: string, university: string, year: number): Promise<VerifiableCredentialProof>;
    /**
     * Prove income range without revealing exact amount
     */
    proveIncome(identity: Identity, amount: number, minimumRequired: number, currency?: string): Promise<VerifiableCredentialProof>;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
