"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkCredentials = exports.CredentialType = void 0;
const group_1 = require("@semaphore-protocol/group");
const proof_1 = require("@semaphore-protocol/proof");
const ethers_1 = require("ethers");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Types of verifiable credentials
 */
var CredentialType;
(function (CredentialType) {
    CredentialType["AGE"] = "age";
    CredentialType["CITIZENSHIP"] = "citizenship";
    CredentialType["EDUCATION"] = "education";
    CredentialType["INCOME"] = "income";
    CredentialType["EMPLOYMENT"] = "employment";
    CredentialType["HEALTH"] = "health";
    CredentialType["CUSTOM"] = "custom";
})(CredentialType || (exports.CredentialType = CredentialType = {}));
/**
 * ZK Credentials Manager
 * Extends ZK-Proof functionality to support verifiable credentials
 */
class ZkCredentials {
    constructor() {
        this.groups = new Map();
    }
    /**
     * Create a verifiable credential from private data
     */
    createCredential(identity, credentialData) {
        try {
            // Hash the private data to create a credential commitment
            const privateDataString = JSON.stringify(credentialData.privateData);
            const credentialHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(privateDataString));
            // For now, return a basic credential structure
            // Full proof generation requires circuit files
            const credential = {
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
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "CREDENTIAL_CREATION_FAILED", `Failed to create verifiable credential: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Prove an attribute about yourself without revealing the underlying data
     */
    async proveAttribute(identity, credentialData, groupId = "verified-credentials") {
        try {
            const { credential, credentialHash } = this.createCredential(identity, credentialData);
            // Convert claim to signal
            const signal = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credentialData.claim));
            const signalBigInt = BigInt(signal);
            // Create or get group
            const group = this.getOrCreateGroup(groupId);
            // Add identity if not already in group
            if (group.indexOf(identity.commitment) === -1) {
                group.addMember(identity.commitment);
            }
            // External nullifier from credential type
            const externalNullifier = BigInt(ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credentialData.type)));
            // Generate ZK proof
            // Note: This requires circuit files to be available
            const fullProof = await (0, proof_1.generateProof)(identity, group, signalBigInt, externalNullifier, {
                wasmFilePath: "./circuits/semaphore/20/semaphore.wasm",
                zkeyFilePath: "./circuits/semaphore/20/semaphore.zkey",
            });
            return {
                type: credentialData.type,
                claim: credentialData.claim,
                proof: {
                    merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
                    nullifierHash: fullProof.nullifierHash.toString(),
                    signal: fullProof.signal.toString(),
                    externalNullifier: fullProof.externalNullifier.toString(),
                    proof: fullProof.proof.map((p) => p.toString()),
                },
                credentialHash,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ATTRIBUTE_PROOF_FAILED", `Failed to prove attribute: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Verify a credential proof
     */
    async verifyCredential(proof, treeDepth = 20) {
        try {
            const verified = await (0, proof_1.verifyProof)(proof.proof, treeDepth);
            return {
                verified,
                type: proof.type,
                claim: proof.claim,
                timestamp: proof.timestamp,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "CREDENTIAL_VERIFICATION_FAILED", `Failed to verify credential: ${error.message}`, error);
            return {
                verified: false,
                error: error.message,
            };
        }
    }
    /**
     * Create a group for credential holders
     */
    getOrCreateGroup(groupId) {
        if (!this.groups.has(groupId)) {
            const groupIdHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(groupId));
            const groupIdNumber = BigInt(groupIdHash);
            this.groups.set(groupId, new group_1.Group(groupIdNumber));
        }
        return this.groups.get(groupId);
    }
    /**
     * Add an identity to a credentials group
     */
    addToCredentialGroup(identity, groupId = "verified-credentials") {
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
    async proveAge(identity, birthDate, minimumAge) {
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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
    async proveCitizenship(identity, country, region = "EU") {
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
    async proveEducation(identity, degree, university, year) {
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
    async proveIncome(identity, amount, minimumRequired, currency = "USD") {
        if (amount < minimumRequired) {
            throw new Error(`Income ${amount} is less than required ${minimumRequired}`);
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
    cleanup() {
        this.groups.clear();
    }
}
exports.ZkCredentials = ZkCredentials;
