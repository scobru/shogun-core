/**
 * CryptoIdentityManager - Wrapper per la generazione delle identità crypto
 * Genera tutte le identità crypto disponibili. Il salvataggio sarà gestito lato frontend.
 */
import type { ISEAPair } from "gun/types";
import type { JWKKeyPair, SignalUser } from "../crypto/types";
import type { PGPKeyPair } from "../crypto/pgp";
/**
 * Interfaccia per le identità crypto generate
 */
export interface CryptoIdentities {
    rsa?: JWKKeyPair;
    aes?: JsonWebKey;
    signal?: SignalUser;
    pgp?: PGPKeyPair;
    mls?: {
        groupId: string;
        memberId: string;
    };
    sframe?: {
        keyId: number;
    };
    createdAt: number;
    version: string;
}
/**
 * Risultato dell'operazione di generazione identità
 */
export interface IdentityGenerationResult {
    success: boolean;
    identities?: CryptoIdentities;
    error?: string;
}
/**
 * Manager per la generazione delle identità crypto
 * Genera tutte le identità crypto disponibili. Il salvataggio sarà gestito lato frontend.
 */
export declare class CryptoIdentityManager {
    private pgpManager;
    private mlsManager;
    private sframeManager;
    constructor();
    /**
     * Genera tutte le identità crypto disponibili per un utente
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente
     * @returns Promise con le identità generate
     */
    generateAllIdentities(username: string, seaPair: ISEAPair): Promise<IdentityGenerationResult>;
    /**
     * Genera le identità crypto per un utente
     * Wrapper che chiama generateAllIdentities (mantenuto per compatibilità)
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente (opzionale, non più utilizzato ma mantenuto per compatibilità)
     * @param forceRegenerate - Ignorato, genera sempre nuove identità
     * @returns Promise con le identità generate
     */
    setupCryptoIdentities(username: string, seaPair: ISEAPair, forceRegenerate?: boolean): Promise<IdentityGenerationResult>;
}
