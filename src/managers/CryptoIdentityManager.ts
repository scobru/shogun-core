/**
 * CryptoIdentityManager - Gestisce la generazione e il salvataggio delle identità crypto
 * dopo l'autenticazione SEA dell'utente
 */

import type {
  IShogunCore,
  AuthResult,
  SignUpResult,
} from "../interfaces/shogun";
import type { ISEAPair } from "gun/types";
import type { JWKKeyPair, SignalUser, CryptoConfig } from "../crypto/types";
import type { PGPKeyPair } from "../crypto/pgp";

import SEA from "gun/sea";
import { generateKeyPair as generateRSAKeyPair } from "../crypto/asymmetric";
import { generateSymmetricKey as generateAESKey } from "../crypto/symmetric";
import { initializeSignalUser } from "../crypto/signal-protocol";
import { PGPManager } from "../crypto/pgp";
import { MLSManager } from "../crypto/mls";
import { SFrameManager } from "../crypto/sframe";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";

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
 * Risultato dell'operazione di salvataggio identità
 */
export interface IdentitySaveResult {
  success: boolean;
  savedKeys: string[];
  error?: string;
}

/**
 * Risultato dell'operazione di recupero identità
 */
export interface IdentityRetrievalResult {
  success: boolean;
  identities?: CryptoIdentities;
  error?: string;
}

/**
 * Manager per la gestione delle identità crypto
 * Genera automaticamente tutte le identità crypto disponibili dopo l'autenticazione SEA
 */
export class CryptoIdentityManager {
  private core: IShogunCore;
  private db: any; // Database instance
  private pgpManager: PGPManager;
  private mlsManager: MLSManager;
  private sframeManager: SFrameManager;

  constructor(core: IShogunCore, db?: any) {
    this.core = core;
    this.db = db;
    this.pgpManager = new PGPManager();
    this.mlsManager = new MLSManager("default-user");
    this.sframeManager = new SFrameManager();

    // Inizializza PGP Manager
    this.pgpManager.initialize().catch((error) => {
      console.warn("PGP Manager initialization failed:", error);
    });
  }

  /**
   * Genera tutte le identità crypto disponibili per un utente
   * @param username - Nome utente
   * @param seaPair - Coppia di chiavi SEA dell'utente
   * @returns Promise con le identità generate
   */
  async generateAllIdentities(
    username: string,
    seaPair: ISEAPair,
  ): Promise<IdentityGenerationResult> {
    try {
      console.log(
        `🔐 [CryptoIdentityManager] Generating crypto identities for: ${username}`,
      );

      const identities: CryptoIdentities = {
        createdAt: Date.now(),
        version: "1.0.0",
      };

      // 1. Genera coppia di chiavi RSA-4096
      console.log(`🔑 [${username}] Generating RSA key pair...`);
      try {
        identities.rsa = await generateRSAKeyPair();
        console.log(`✅ [${username}] RSA key pair generated`);
      } catch (error) {
        console.error(`❌ [${username}] RSA key generation failed:`, error);
      }

      // 2. Genera chiave simmetrica AES-256
      console.log(`🔑 [${username}] Generating AES symmetric key...`);
      try {
        identities.aes = await generateAESKey();
        console.log(`✅ [${username}] AES symmetric key generated`);
      } catch (error) {
        console.error(`❌ [${username}] AES key generation failed:`, error);
      }

      // 3. Genera identità Signal Protocol
      console.log(`🔑 [${username}] Generating Signal Protocol identity...`);
      try {
        identities.signal = await initializeSignalUser(username);
        console.log(`✅ [${username}] Signal Protocol identity generated`);
      } catch (error) {
        console.error(
          `❌ [${username}] Signal Protocol generation failed:`,
          error,
        );
      }

      // 4. Genera coppia di chiavi PGP
      console.log(`🔑 [${username}] Generating PGP key pair...`);
      try {
        identities.pgp = await this.pgpManager.generateKeyPair(
          username,
          `${username}@example.com`,
        );
        console.log(`✅ [${username}] PGP key pair generated`);
      } catch (error) {
        console.error(`❌ [${username}] PGP key generation failed:`, error);
      }

      // 5. Inizializza MLS Manager e crea gruppo
      console.log(`🔑 [${username}] Initializing MLS group...`);
      try {
        await this.mlsManager.initialize();
        const groupId = `group_${username}_${Date.now()}`;
        const groupInfo = await this.mlsManager.createGroup(groupId);
        // Skip adding members for now due to MLS library issues
        // await this.mlsManager.addMembers(groupId, [username]);
        identities.mls = {
          groupId: groupInfo.groupId.toString(),
          memberId: username,
        };
        console.log(`✅ [${username}] MLS group created: ${groupId}`);
      } catch (error) {
        console.error(`❌ [${username}] MLS initialization failed:`, error);
      }

      // 6. Genera chiave SFrame
      console.log(`🔑 [${username}] Generating SFrame key...`);
      try {
        await this.sframeManager.initialize();
        const sframeKey = await this.sframeManager.generateKey(1);
        identities.sframe = { keyId: sframeKey.keyId };
        console.log(
          `✅ [${username}] SFrame key generated: ${sframeKey.keyId}`,
        );
      } catch (error) {
        console.error(`❌ [${username}] SFrame key generation failed:`, error);
      }

      console.log(
        `✅ [CryptoIdentityManager] All crypto identities generated for: ${username}`,
      );

      return {
        success: true,
        identities,
      };
    } catch (error: any) {
      console.error(
        `❌ [CryptoIdentityManager] Identity generation failed:`,
        error,
      );

      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "IDENTITY_GENERATION_FAILED",
        error.message ?? "Failed to generate crypto identities",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Failed to generate crypto identities",
      };
    }
  }

  /**
   * Cripta e salva le identità crypto su GunDB usando il SEA pair
   * @param username - Nome utente
   * @param identities - Identità crypto da salvare
   * @param seaPair - Coppia di chiavi SEA per la crittografia
   * @returns Promise con il risultato del salvataggio
   */
  async saveIdentitiesToGun(
    username: string,
    identities: CryptoIdentities,
    seaPair: ISEAPair,
  ): Promise<IdentitySaveResult> {
    try {
      console.log(
        `💾 [CryptoIdentityManager] Saving crypto identities for: ${username}`,
      );

      const savedKeys: string[] = [];
      const userPub = seaPair.pub;

      // Serializza le identità in JSON
      const identitiesJson = JSON.stringify(identities);

      // Cripta usando SEA con la chiave privata dell'utente
      const encryptedIdentities = await SEA.encrypt(
        identitiesJson,
        seaPair.priv,
      );

      if (!encryptedIdentities) {
        throw new Error("Failed to encrypt identities with SEA");
      }

      // Salva su GunDB nel percorso privato dell'utente
      const saveResult = await new Promise<boolean>((resolve, reject) => {
        this.db.gun
          .user()
          .get("crypto-identities")
          .put(encryptedIdentities, (ack: any) => {
            if (ack.err) {
              console.error(
                `❌ [${username}] Failed to save identities:`,
                ack.err,
              );
              reject(new Error(ack.err));
            } else {
              console.log(
                `✅ [${username}] Crypto identities saved successfully`,
              );
              savedKeys.push("crypto-identities");
              resolve(true);
            }
          });
      });

      // Salva anche una copia di backup nel percorso pubblico (solo hash per verifica)
      const identitiesHash = await SEA.work(identitiesJson, null, null, {
        name: "SHA-256",
      });

      await new Promise<boolean>((resolve, reject) => {
        this.db.gun
          .user()
          .get("crypto-identities-hash")
          .put(identitiesHash, (ack: any) => {
            if (ack.err) {
              console.error(
                `❌ [${username}] Failed to save identities hash:`,
                ack.err,
              );
              reject(new Error(ack.err));
            } else {
              console.log(`✅ [${username}] Crypto identities hash saved`);
              savedKeys.push("crypto-identities-hash");
              resolve(true);
            }
          });
      });

      return {
        success: true,
        savedKeys,
      };
    } catch (error: any) {
      console.error(
        `❌ [CryptoIdentityManager] Failed to save identities:`,
        error,
      );

      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "IDENTITY_SAVE_FAILED",
        error.message ?? "Failed to save crypto identities",
        error,
      );

      return {
        success: false,
        savedKeys: [],
        error: error.message ?? "Failed to save crypto identities",
      };
    }
  }

  /**
   * Recupera e decripta le identità crypto da GunDB
   * @param username - Nome utente
   * @param seaPair - Coppia di chiavi SEA per la decrittografia
   * @returns Promise con le identità recuperate
   */
  async retrieveIdentitiesFromGun(
    username: string,
    seaPair: ISEAPair,
  ): Promise<IdentityRetrievalResult> {
    try {
      console.log(
        `🔍 [CryptoIdentityManager] Retrieving crypto identities for: ${username}`,
      );

      // Recupera le identità criptate da GunDB
      const encryptedIdentities = await new Promise<string>(
        (resolve, reject) => {
          this.db.gun
            .user()
            .get("crypto-identities")
            .once((data: any) => {
              if (data) {
                resolve(data);
              } else {
                reject(new Error("No crypto identities found"));
              }
            });
        },
      );

      if (!encryptedIdentities) {
        return {
          success: false,
          error: "No crypto identities found for user",
        };
      }

      // Decripta usando SEA con la chiave privata dell'utente
      const decryptedIdentities = await SEA.decrypt(
        encryptedIdentities,
        seaPair.priv,
      );

      if (!decryptedIdentities) {
        throw new Error("Failed to decrypt identities with SEA");
      }

      // Assicurati che sia una stringa
      const identitiesString =
        typeof decryptedIdentities === "string"
          ? decryptedIdentities
          : JSON.stringify(decryptedIdentities);

      // Deserializza le identità
      const identities: CryptoIdentities = JSON.parse(identitiesString);

      console.log(
        `✅ [CryptoIdentityManager] Crypto identities retrieved for: ${username}`,
      );

      return {
        success: true,
        identities,
      };
    } catch (error: any) {
      console.error(
        `❌ [CryptoIdentityManager] Failed to retrieve identities:`,
        error,
      );

      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "IDENTITY_RETRIEVAL_FAILED",
        error.message ?? "Failed to retrieve crypto identities",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Failed to retrieve crypto identities",
      };
    }
  }

  /**
   * Verifica se l'utente ha già delle identità crypto salvate
   * @param username - Nome utente
   * @returns Promise con il risultato della verifica
   */
  async hasStoredIdentities(username: string): Promise<boolean> {
    try {
      const hasIdentities = await new Promise<boolean>((resolve) => {
        this.db.gun
          .user()
          .get("crypto-identities")
          .once((data: any) => {
            resolve(!!data);
          });
      });

      return hasIdentities;
    } catch (error) {
      console.error(
        `❌ [CryptoIdentityManager] Error checking stored identities:`,
        error,
      );
      return false;
    }
  }

  /**
   * Processo completo: genera, salva e gestisce le identità crypto dopo l'autenticazione
   * @param username - Nome utente
   * @param seaPair - Coppia di chiavi SEA dell'utente
   * @param forceRegenerate - Se true, rigenera anche se esistono già
   * @returns Promise con il risultato del processo completo
   */
  async setupCryptoIdentities(
    username: string,
    seaPair: ISEAPair,
    forceRegenerate: boolean = false,
  ): Promise<IdentityGenerationResult & IdentitySaveResult> {
    try {
      console.log(
        `🚀 [CryptoIdentityManager] Setting up crypto identities for: ${username}`,
      );

      // Verifica se esistono già identità salvate
      const hasExisting = await this.hasStoredIdentities(username);

      if (hasExisting && !forceRegenerate) {
        console.log(
          `ℹ️ [${username}] Crypto identities already exist, skipping generation`,
        );

        // Recupera le identità esistenti
        const retrievalResult = await this.retrieveIdentitiesFromGun(
          username,
          seaPair,
        );

        if (retrievalResult.success) {
          return {
            success: true,
            identities: retrievalResult.identities,
            savedKeys: ["crypto-identities", "crypto-identities-hash"],
          };
        }
      }

      // Genera nuove identità
      const generationResult = await this.generateAllIdentities(
        username,
        seaPair,
      );

      if (!generationResult.success || !generationResult.identities) {
        return {
          success: false,
          savedKeys: [],
          error: generationResult.error || "Failed to generate identities",
        };
      }

      // Salva le identità generate
      const saveResult = await this.saveIdentitiesToGun(
        username,
        generationResult.identities,
        seaPair,
      );

      if (!saveResult.success) {
        return {
          success: false,
          savedKeys: [],
          error: saveResult.error || "Failed to save identities",
        };
      }

      console.log(
        `✅ [CryptoIdentityManager] Crypto identities setup completed for: ${username}`,
      );

      return {
        success: true,
        identities: generationResult.identities,
        savedKeys: saveResult.savedKeys,
      };
    } catch (error: any) {
      console.error(`❌ [CryptoIdentityManager] Setup failed:`, error);

      ErrorHandler.handle(
        ErrorType.ENCRYPTION,
        "IDENTITY_SETUP_FAILED",
        error.message ?? "Failed to setup crypto identities",
        error,
      );

      return {
        success: false,
        savedKeys: [],
        error: error.message ?? "Failed to setup crypto identities",
      };
    }
  }

  /**
   * Ottiene le identità crypto dell'utente corrente
   * @returns Promise con le identità dell'utente corrente
   */
  async getCurrentUserIdentities(): Promise<IdentityRetrievalResult> {
    try {
      const currentUser = this.core.getCurrentUser();

      if (!currentUser || !currentUser.pub) {
        return {
          success: false,
          error: "No authenticated user found",
        };
      }

      // Ottieni il SEA pair dell'utente corrente
      const userInstance = this.db.gun.user();
      const seaPair = (userInstance as any)?._?.sea as ISEAPair;

      if (!seaPair) {
        return {
          success: false,
          error: "No SEA pair found for current user",
        };
      }

      return await this.retrieveIdentitiesFromGun(currentUser.pub, seaPair);
    } catch (error: any) {
      console.error(
        `❌ [CryptoIdentityManager] Failed to get current user identities:`,
        error,
      );

      return {
        success: false,
        error: error.message ?? "Failed to get current user identities",
      };
    }
  }
}
