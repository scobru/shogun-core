import { ethers } from "ethers";
import { IShogunCore, AuthResult } from "../types/shogun";
/**
 * DID Document structure following W3C standard
 */
export interface DIDDocument {
    "@context": string | string[];
    id: string;
    controller?: string | string[];
    verificationMethod?: Array<{
        id: string;
        type: string;
        controller: string;
        publicKeyMultibase?: string;
        publicKeyJwk?: Record<string, any>;
    }>;
    authentication?: Array<string | {
        id: string;
        type: string;
        controller: string;
    }>;
    assertionMethod?: Array<string | {
        id: string;
        type: string;
        controller: string;
    }>;
    service?: Array<{
        id: string;
        type: string;
        serviceEndpoint: string | Record<string, any>;
    }>;
}
/**
 * DID resolution result
 */
export interface DIDResolutionResult {
    didResolutionMetadata: {
        contentType?: string;
        error?: string;
    };
    didDocument: DIDDocument | null;
    didDocumentMetadata: {
        created?: string;
        updated?: string;
        deactivated?: boolean;
    };
}
/**
 * DID creation options
 */
export interface DIDCreateOptions {
    network?: string;
    controller?: string;
    services?: Array<{
        type: string;
        endpoint: string;
    }>;
}
/**
 * ShogunDID class for decentralized identity management
 */
export declare class ShogunDID {
    private core;
    private methodName;
    /**
     * Initialize ShogunDID manager
     * @param shogunCore - Instance of ShogunCore
     */
    constructor(shogunCore: IShogunCore);
    /**
     * Create a new Shogun DID for the current user
     * @param options - DID creation options
     * @returns The created DID string
     */
    createDID(options?: DIDCreateOptions): Promise<string>;
    /**
     * Get the current user's DID
     * @returns The user's DID or null if not found
     */
    getCurrentUserDID(): Promise<string | null>;
    /**
     * Resolve a DID to get its DID Document
     * @param did - The DID to resolve
     * @returns DID resolution result
     */
    resolveDID(did: string): Promise<DIDResolutionResult>;
    /**
     * Authenticate using a DID
     * @param did - The DID to authenticate
     * @param challenge - Optional challenge for authentication
     * @returns Authentication result
     */
    authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
    /**
     * Update a DID Document
     * @param did - The DID to update
     * @param documentUpdates - Updates to apply to the DID Document
     * @returns Whether the update was successful
     */
    updateDIDDocument(did: string, documentUpdates: Partial<DIDDocument>): Promise<boolean>;
    /**
     * Deactivate a DID
     * @param did - The DID to deactivate
     * @returns Whether the deactivation was successful
     */
    deactivateDID(did: string): Promise<boolean>;
    /**
     * Validate if a string is a properly formatted DID
     * @param did - The DID to validate
     * @returns Whether the DID is valid
     */
    isValidDID(did: string): boolean;
    /**
     * Generate a DID Document from a DID
     * @param did - The DID to create a document for
     * @param options - DID creation options
     * @returns The created DID Document
     */
    generateDIDDocument(did: string, options?: DIDCreateOptions): DIDDocument;
    private getUserPublicKey;
    private storeDID;
    private createErrorResolution;
    private parseOrCreateDIDDocument;
    private extractAuthenticationMethod;
    private authenticateWithEthereum;
    private authenticateWithWebAuthn;
    private authenticateWithGunDB;
    /**
     * Registra il DID dell'utente sulla blockchain
     * @param did - Il DID da registrare
     * @param signer - Il signer da utilizzare per la transazione
     * @returns Promise con il risultato della registrazione
     */
    registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    /**
     * Verifica se un DID è registrato sulla blockchain
     * @param did - Il DID da verificare
     * @returns Promise con il risultato della verifica
     */
    verifyDIDOnChain(did: string): Promise<{
        isRegistered: boolean;
        controller?: string;
        error?: string;
    }>;
}
