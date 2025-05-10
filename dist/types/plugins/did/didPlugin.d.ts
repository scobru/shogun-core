import { ethers } from "ethers";
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { DIDPluginInterface, DIDCreateOptions } from "./types";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin per la gestione delle identità decentralizzate (DID) in ShogunCore
 */
export declare class DIDPlugin extends BasePlugin implements DIDPluginInterface {
    name: string;
    version: string;
    description: string;
    private did;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo DID sia inizializzato
     * @private
     */
    private assertDID;
    /**
     * @inheritdoc
     */
    getCurrentUserDID(): Promise<string | null>;
    /**
     * @inheritdoc
     */
    resolveDID(did: string): Promise<any>;
    /**
     * @inheritdoc
     */
    authenticateWithDID(did: string, challenge?: string): Promise<AuthResult>;
    /**
     * @inheritdoc
     */
    createDID(options?: DIDCreateOptions): Promise<string>;
    /**
     * @inheritdoc
     */
    updateDIDDocument(did: string, documentUpdates: any): Promise<boolean>;
    /**
     * @inheritdoc
     */
    deactivateDID(did: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    registerDIDOnChain(did: string, signer?: ethers.Signer): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    /**
     * @inheritdoc
     */
    verifyDIDOnChain(did: string): Promise<{
        isRegistered: boolean;
        controller?: string | undefined;
        error?: string | undefined;
    }>;
    /**
     * @inheritdoc
     */
    ensureUserHasDID(options?: DIDCreateOptions): Promise<string | null>;
    /**
     * Implementation of the ensureUserHasDID with timeout handling
     * @param options DID creation options
     * @returns The DID identifier or null if failed
     * @private
     */
    private _ensureUserHasDIDWithTimeout;
}
