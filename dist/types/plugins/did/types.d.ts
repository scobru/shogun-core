import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
import { BaseConfig, BaseEvent, BaseCacheEntry } from "../../types/common";
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
    document?: DIDDocument;
}
/**
 * DID Registry configuration
 */
export interface DIDRegistryConfig extends BaseConfig {
    address: string;
    network: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}
/**
 * DID Cache entry
 */
export interface DIDCacheEntry extends BaseCacheEntry<DIDDocument> {
    network: string;
    document?: DIDDocument;
}
/**
 * DID Resolution options
 */
export interface DIDResolutionOptions extends BaseConfig {
    accept?: string;
    cacheDuration?: number;
}
/**
 * DID Event types
 */
export declare enum DIDEventType {
    CREATED = "didCreated",
    UPDATED = "didUpdated",
    DEACTIVATED = "didDeactivated",
    REGISTERED = "didRegistered",
    ERROR = "didError"
}
/**
 * DID Event data
 */
export interface DIDEvent extends BaseEvent {
    type: DIDEventType;
    data: {
        did: string;
        document?: DIDDocument;
        error?: string;
    };
}
/**
 * Interfaccia per il plugin DID
 */
export interface DIDPluginInterface {
    /**
     * Ottiene il DID dell'utente corrente
     * @returns Promise con il DID dell'utente o null se non disponibile
     */
    getCurrentUserDID(): Promise<string | null>;
    /**
     * Risolve un DID recuperando il documento associato
     * @param did Identificatore DID da risolvere
     * @returns Promise con il documento DID risolto
     */
    resolveDID(did: string): Promise<any>;
    /**
     * Autentica un utente utilizzando un DID
     * @param did Identificatore DID per l'autenticazione
     * @param challenge Challenge opzionale per l'autenticazione
     * @returns Promise con il risultato dell'autenticazione
     */
    authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
    /**
     * Crea un nuovo DID
     * @param options Opzioni per la creazione del DID
     * @returns Promise con l'identificatore DID creato
     */
    createDID(options?: DIDCreateOptions): Promise<string>;
    /**
     * Aggiorna un documento DID
     * @param did Identificatore DID da aggiornare
     * @param documentUpdates Aggiornamenti da applicare al documento
     * @returns Promise che indica se l'aggiornamento è riuscito
     */
    updateDIDDocument(did: string, documentUpdates: any): Promise<boolean>;
    /**
     * Disattiva un DID
     * @param did Identificatore DID da disattivare
     * @returns Promise che indica se la disattivazione è riuscita
     */
    deactivateDID(did: string): Promise<boolean>;
    /**
     * Registra un DID sulla blockchain
     * @param did Identificatore DID da registrare
     * @param signer Signer opzionale per la transazione
     * @returns Promise con il risultato della registrazione
     */
    registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    /**
     * Assicura che l'utente corrente abbia un DID, creandone uno se necessario
     * @param options Opzioni opzionali per la creazione del DID
     * @returns Promise con l'identificatore DID dell'utente o null se l'operazione fallisce
     */
    ensureUserHasDID(options?: DIDCreateOptions): Promise<string | null>;
}
