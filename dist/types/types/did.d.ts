import { BaseConfig, BaseEvent, BaseCacheEntry } from './common';
/**
 * DID types definitions
 */
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
