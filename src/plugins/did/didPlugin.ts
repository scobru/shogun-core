import { ethers } from "ethers";
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { ShogunDID } from "./DID";
import { DIDPluginInterface } from "./types";
import { DIDCreateOptions } from "../../types/did";
import { AuthResult } from "../../types/shogun";
import { log, logError } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

/**
 * Plugin per la gestione delle identità decentralizzate (DID) in ShogunCore
 */
export class DIDPlugin extends BasePlugin implements DIDPluginInterface {
  name = "did";
  version = "1.0.0";
  description = "Provides Decentralized Identifiers (DID) functionality for ShogunCore";
  
  private did: ShogunDID | null = null;
  
  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);
    
    // Inizializza il modulo DID
    this.did = new ShogunDID(core);
    
    log("DID plugin initialized");
  }
  
  /**
   * @inheritdoc
   */
  destroy(): void {
    this.did = null;
    super.destroy();
    log("DID plugin destroyed");
  }
  
  /**
   * Assicura che il modulo DID sia inizializzato
   * @private
   */
  private assertDID(): ShogunDID {
    this.assertInitialized();
    if (!this.did) {
      throw new Error("DID module not initialized");
    }
    return this.did;
  }
  
  /**
   * @inheritdoc
   */
  async getCurrentUserDID(): Promise<string | null> {
    return this.assertDID().getCurrentUserDID();
  }
  
  /**
   * @inheritdoc
   */
  async resolveDID(did: string): Promise<any> {
    return this.assertDID().resolveDID(did);
  }
  
  /**
   * @inheritdoc
   */
  async authenticateWithDID(did: string, challenge?: string): Promise<AuthResult> {
    return this.assertDID().authenticateWithDID(did, challenge);
  }
  
  /**
   * @inheritdoc
   */
  async createDID(options?: DIDCreateOptions): Promise<string> {
    return this.assertDID().createDID(options);
  }
  
  /**
   * @inheritdoc
   */
  async updateDIDDocument(did: string, documentUpdates: any): Promise<boolean> {
    return this.assertDID().updateDIDDocument(did, documentUpdates);
  }
  
  /**
   * @inheritdoc
   */
  async deactivateDID(did: string): Promise<boolean> {
    return this.assertDID().deactivateDID(did);
  }
  
  /**
   * @inheritdoc
   */
  async registerDIDOnChain(
    did: string,
    signer?: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return this.assertDID().registerDIDOnChain(did, signer);
  }
  
  /**
   * @inheritdoc
   */
  async ensureUserHasDID(options?: DIDCreateOptions): Promise<string | null> {
    try {
      const core = this.core;
      
      if (!core) {
        throw new Error("Core not available");
      }
      
      if (!core.isLoggedIn()) {
        logError("Cannot ensure DID: user not authenticated");
        return null;
      }

      // Verifica se l'utente ha già un DID
      let did = await this.getCurrentUserDID();

      // Se l'utente ha già un DID, lo restituiamo
      if (did) {
        log(`User already has DID: ${did}`);

        // Se sono state fornite opzioni, aggiorniamo il documento DID
        if (options && Object.keys(options).length > 0) {
          try {
            const updated = await this.updateDIDDocument(did, {
              service: options.services?.map((service, index) => ({
                id: `${did}#service-${index + 1}`,
                type: service.type,
                serviceEndpoint: service.endpoint,
              })),
            });

            if (updated) {
              log(`Updated DID document for: ${did}`);
            }
          } catch (updateError) {
            logError("Error updating DID document:", updateError);
          }
        }

        return did;
      }

      // Se l'utente non ha un DID, ne creiamo uno nuovo
      log("Creating new DID for authenticated user");
      const userPub = core.gundb.gun.user().is?.pub || "";

      const mergedOptions: DIDCreateOptions = {
        network: "main",
        controller: userPub,
        ...options,
      };

      did = await this.createDID(mergedOptions);

      // Emetti evento di creazione DID
      core.emit("did:created", { did, userPub });

      log(`Created new DID for user: ${did}`);
      return did || null;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.DID,
        "ENSURE_DID_FAILED",
        `Error ensuring user has DID: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
      return null;
    }
  }
} 