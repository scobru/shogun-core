import { ethers } from "ethers";
import { DIDCreateOptions } from "../../types/did";
import { AuthResult } from "../../types/shogun";

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
  registerDIDOnChain(
    did: string,
    signer?: ethers.Signer,
  ): Promise<{ success: boolean; txHash?: string; error?: string }>;
  
  /**
   * Assicura che l'utente corrente abbia un DID, creandone uno se necessario
   * @param options Opzioni opzionali per la creazione del DID
   * @returns Promise con l'identificatore DID dell'utente o null se l'operazione fallisce
   */
  ensureUserHasDID(options?: DIDCreateOptions): Promise<string | null>;
} 