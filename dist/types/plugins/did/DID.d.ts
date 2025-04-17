import { ethers } from "ethers";
import { AuthResult, IShogunCore } from "../../types/shogun";
import { EventEmitter } from "../../utils/eventEmitter";
import { DIDDocument, DIDResolutionResult, DIDCreateOptions, DIDRegistryConfig, DIDResolutionOptions } from "../../types/did";
export type { DIDDocument, DIDResolutionResult, DIDCreateOptions };
/**
 * ShogunDID class for decentralized identity management
 */
export declare class ShogunDID extends EventEmitter {
    private readonly core;
    private readonly methodName;
    private readonly didCache;
    private readonly DEFAULT_CACHE_DURATION;
    private readonly DEFAULT_TIMEOUT;
    private readonly DEFAULT_MAX_RETRIES;
    private readonly DEFAULT_RETRY_DELAY;
    private readonly options;
    private readonly registryConfig;
    /**
     * Initialize ShogunDID manager
     */
    constructor(shogunCore: IShogunCore, registryConfig?: Partial<DIDRegistryConfig>, options?: {
        useSecureRandomPassword?: boolean;
        [key: string]: any;
    });
    /**
     * Create a new Shogun DID
     */
    createDID(options?: DIDCreateOptions): Promise<string>;
    /**
     * Store DID document
     * @param did DID identifier
     * @param options DID creation options or document
     * @returns Promise that resolves when DID is stored
     */
    private storeDID;
    /**
     * Create a DID Document from options
     * @param did DID identifier
     * @param options Creation options
     * @returns DID Document
     */
    private createDidDocument;
    /**
     * Helper to get public key of current user
     */
    private getUserPublicKey;
    /**
     * Resolve a DID with caching
     */
    resolveDID(did: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
    /**
     * Register DID on blockchain with retry logic
     */
    registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    /**
     * Get the current user's DID
     * @returns The user's DID or null if not found
     */
    getCurrentUserDID(): Promise<string | null>;
    /**
     * Authenticate using a DID
     * @param did - The DID to authenticate
     * @param challenge - Optional challenge for authentication
     * @returns Authentication result
     */
    authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
    /**
     * Update DID Document
     * @param did DID to update
     * @param updates Partial DID Document to merge with existing document
     * @returns True if the document was updated successfully
     */
    updateDIDDocument(did: string, updates: Partial<DIDDocument>): Promise<boolean>;
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
    private createErrorResolution;
    private parseOrCreateDIDDocument;
    private extractAuthenticationMethod;
    private getWallet;
    private authenticateWithEthereum;
    private authenticateWithWebAuthn;
    private authenticateWithGunDB;
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
    /**
     * Clear DID cache
     */
    clearCache(): void;
    /**
     * Remove specific DID from cache
     */
    removeFromCache(did: string): void;
    /**
     * Helper to get document from cache entry (compatibility)
     */
    private getDocumentFromCache;
}
