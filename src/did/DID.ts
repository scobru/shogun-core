import { ethers } from "ethers";
import { IShogunCore, AuthResult } from "../types/shogun";
import { log, logError } from "../utils/logger";

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
  authentication?: Array<string | { id: string; type: string; controller: string }>;
  assertionMethod?: Array<string | { id: string; type: string; controller: string }>;
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
export class ShogunDID {
  private core: IShogunCore;
  private methodName: string = "shogun";

  /**
   * Initialize ShogunDID manager
   * @param shogunCore - Instance of ShogunCore
   */
  constructor(shogunCore: IShogunCore) {
    this.core = shogunCore;
    log("ShogunDID initialized");
  }

  /**
   * Create a new Shogun DID for the current user
   * @param options - DID creation options
   * @returns The created DID string
   */
  async createDID(options: DIDCreateOptions = {}): Promise<string> {
    try {
      if (!this.core.isLoggedIn()) {
        throw new Error("User must be logged in to create a DID");
      }

      // Get user's public key from GunDB
      const userPub = this.getUserPublicKey();
      if (!userPub) {
        throw new Error("Cannot retrieve user's public key");
      }

      // Create a base method-specific ID using the user's GunDB public key
      let methodSpecificId = ethers.keccak256(ethers.toUtf8Bytes(userPub)).slice(2, 42);

      // Add network prefix if specified
      if (options.network) {
        methodSpecificId = `${options.network}:${methodSpecificId}`;
      }

      // Construct the full DID
      const did = `did:${this.methodName}:${methodSpecificId}`;

      // Store DID and create DID Document in GunDB
      await this.storeDID(did, options);

      log(`Created DID: ${did}`);
      return did;
    } catch (error) {
      logError("Error creating DID:", error);
      throw error;
    }
  }

  /**
   * Get the current user's DID
   * @returns The user's DID or null if not found
   */
  async getCurrentUserDID(): Promise<string | null> {
    try {
      if (!this.core.isLoggedIn()) {
        return null;
      }

      const userPub = this.getUserPublicKey();
      if (!userPub) {
        return null;
      }

      return new Promise<string | null>((resolve) => {
        // Try to find existing DID in user's space
        this.core.gun.user().get("did").once((data: any) => {
          if (data && typeof data === "string") {
            resolve(data);
          } else {
            resolve(null);
          }
        });

        // Set timeout to avoid hanging
        setTimeout(() => resolve(null), 5000);
      });
    } catch (error) {
      logError("Error getting current user DID:", error);
      return null;
    }
  }

  /**
   * Resolve a DID to get its DID Document
   * @param did - The DID to resolve
   * @returns DID resolution result
   */
  async resolveDID(did: string): Promise<DIDResolutionResult> {
    try {
      log(`Resolving DID: ${did}`);

      // Validate DID format
      if (!this.isValidDID(did)) {
        return this.createErrorResolution("invalidDid", "Invalid DID format");
      }

      // Extract method and ID
      const [_, method, methodSpecificId] = did.split(":");
      
      // Ensure it's a Shogun DID
      if (method !== this.methodName) {
        return this.createErrorResolution(
          "unsupportedDidMethod", 
          `Unsupported DID method: ${method}`
        );
      }

      // Parse network if present
      let network = "main";
      let idWithoutNetwork = methodSpecificId;
      
      if (methodSpecificId.includes(":")) {
        [network, idWithoutNetwork] = methodSpecificId.split(":");
      }

      // Try to find the DID Document in GunDB
      return new Promise<DIDResolutionResult>((resolve) => {
        this.core.gun.get("dids").get(did).once((didDocData: any) => {
          if (!didDocData) {
            resolve(this.createErrorResolution("notFound", "DID Document not found"));
            return;
          }

          try {
            // Parse stored DID Document or construct a basic one
            const didDocument = this.parseOrCreateDIDDocument(did, didDocData);
            
            resolve({
              didResolutionMetadata: {
                contentType: "application/did+json",
              },
              didDocument,
              didDocumentMetadata: {
                created: didDocData.created,
                updated: didDocData.updated,
                deactivated: didDocData.deactivated || false,
              },
            });
          } catch (parseError) {
            resolve(this.createErrorResolution(
              "invalidDidDocument", 
              "Error parsing DID Document"
            ));
          }
        });

        // Set timeout to avoid hanging
        setTimeout(() => {
          resolve(this.createErrorResolution(
            "timeout", 
            "DID resolution timeout"
          ));
        }, 10000);
      });
    } catch (error) {
      logError("Error resolving DID:", error);
      return this.createErrorResolution(
        "internalError", 
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Authenticate using a DID
   * @param did - The DID to authenticate
   * @param challenge - Optional challenge for authentication
   * @returns Authentication result
   */
  async authenticateWithDID(did: string, challenge?: string): Promise<AuthResult> {
    try {
      log(`Authenticating with DID: ${did}`);

      // Verify DID format
      if (!this.isValidDID(did)) {
        return {
          success: false,
          error: "Invalid DID format",
        };
      }

      // Resolve DID to get document
      const resolution = await this.resolveDID(did);
      if (resolution.didResolutionMetadata.error || !resolution.didDocument) {
        return {
          success: false,
          error: `DID resolution failed: ${resolution.didResolutionMetadata.error}`,
        };
      }

      // Extract authentication details from DID Document
      const authMethod = this.extractAuthenticationMethod(resolution.didDocument);
      if (!authMethod) {
        return {
          success: false,
          error: "No valid authentication method found in DID Document",
        };
      }

      // Determine which authentication method to use
      if (authMethod.type.includes("EcdsaSecp256k1")) {
        // Handle Ethereum/MetaMask authentication
        return this.authenticateWithEthereum(authMethod, challenge);
      } else if (authMethod.type.includes("WebAuthn")) {
        // Handle WebAuthn authentication
        return this.authenticateWithWebAuthn(authMethod, challenge);
      } else {
        // Default to GunDB authentication
        return this.authenticateWithGunDB(authMethod, challenge);
      }
    } catch (error) {
      logError("Error authenticating with DID:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during authentication",
      };
    }
  }

  /**
   * Update a DID Document
   * @param did - The DID to update
   * @param documentUpdates - Updates to apply to the DID Document
   * @returns Whether the update was successful
   */
  async updateDIDDocument(
    did: string, 
    documentUpdates: Partial<DIDDocument>
  ): Promise<boolean> {
    try {
      if (!this.core.isLoggedIn()) {
        throw new Error("User must be logged in to update a DID Document");
      }

      // Verify DID format and ownership
      if (!this.isValidDID(did)) {
        throw new Error("Invalid DID format");
      }

      const currentUserDID = await this.getCurrentUserDID();
      if (did !== currentUserDID) {
        throw new Error("Cannot update a DID Document you don't control");
      }

      // Get current DID Document
      const resolution = await this.resolveDID(did);
      if (resolution.didResolutionMetadata.error || !resolution.didDocument) {
        throw new Error(`Cannot update DID Document: ${resolution.didResolutionMetadata.error}`);
      }

      // Apply updates to DID Document
      const updatedDocument = {
        ...resolution.didDocument,
        ...documentUpdates,
        // Ensure these fields aren't overwritten
        "@context": resolution.didDocument["@context"],
        id: resolution.didDocument.id,
      };

      // Update the DID Document in GunDB
      return new Promise<boolean>((resolve) => {
        this.core.gun.get("dids").get(did).put(
          {
            document: JSON.stringify(updatedDocument),
            updated: new Date().toISOString(),
          },
          (ack: any) => {
            if (ack.err) {
              logError(`Error updating DID Document: ${ack.err}`);
              resolve(false);
            } else {
              log(`Successfully updated DID Document for ${did}`);
              resolve(true);
            }
          }
        );

        // Set timeout
        setTimeout(() => resolve(false), 10000);
      });
    } catch (error) {
      logError("Error updating DID Document:", error);
      return false;
    }
  }

  /**
   * Deactivate a DID
   * @param did - The DID to deactivate
   * @returns Whether the deactivation was successful
   */
  async deactivateDID(did: string): Promise<boolean> {
    try {
      if (!this.core.isLoggedIn()) {
        throw new Error("User must be logged in to deactivate a DID");
      }

      const currentUserDID = await this.getCurrentUserDID();
      if (did !== currentUserDID) {
        throw new Error("Cannot deactivate a DID you don't control");
      }

      return new Promise<boolean>((resolve) => {
        this.core.gun.get("dids").get(did).put(
          {
            deactivated: true,
            updated: new Date().toISOString(),
          },
          (ack: any) => {
            if (ack.err) {
              logError(`Error deactivating DID: ${ack.err}`);
              resolve(false);
            } else {
              log(`Successfully deactivated DID: ${did}`);
              resolve(true);
            }
          }
        );

        // Set timeout
        setTimeout(() => resolve(false), 10000);
      });
    } catch (error) {
      logError("Error deactivating DID:", error);
      return false;
    }
  }

  /**
   * Validate if a string is a properly formatted DID
   * @param did - The DID to validate
   * @returns Whether the DID is valid
   */
  isValidDID(did: string): boolean {
    // Basic DID format validation
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9.:%]+$/;
    return didRegex.test(did);
  }

  /**
   * Generate a DID Document from a DID
   * @param did - The DID to create a document for
   * @param options - DID creation options
   * @returns The created DID Document
   */
  generateDIDDocument(did: string, options: DIDCreateOptions = {}): DIDDocument {
    // Get user's public key
    const userPub = this.getUserPublicKey();
    
    // Basic DID Document following W3C standards
    const document: DIDDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      id: did,
      controller: options.controller || did,
      verificationMethod: [
        {
          id: `${did}#keys-1`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: `z${userPub}`
        }
      ],
      authentication: [`${did}#keys-1`],
      assertionMethod: [`${did}#keys-1`]
    };

    // Add services if provided
    if (options.services && options.services.length > 0) {
      document.service = options.services.map((service, index) => ({
        id: `${did}#service-${index + 1}`,
        type: service.type,
        serviceEndpoint: service.endpoint
      }));
    }

    return document;
  }

  // Private helper methods

  private getUserPublicKey(): string {
    const user = this.core.gun.user();
    // @ts-ignore - Accessing internal Gun property
    return user && user._ && user._.sea ? user._.sea.pub : "";
  }

  private async storeDID(did: string, options: DIDCreateOptions): Promise<void> {
    // Create DID Document
    const didDocument = this.generateDIDDocument(did, options);
    const timestamp = new Date().toISOString();

    // Store DID as the current user's DID
    await new Promise<void>((resolve, reject) => {
      this.core.gun.user().get("did").put(did, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });

    // Store DID Document in public space
    await new Promise<void>((resolve, reject) => {
      this.core.gun.get("dids").get(did).put({
        document: JSON.stringify(didDocument),
        created: timestamp,
        updated: timestamp,
        deactivated: false
      }, (ack: any) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve();
      });
    });
  }

  private createErrorResolution(
    error: string, 
    message: string
  ): DIDResolutionResult {
    return {
      didResolutionMetadata: {
        error,
        contentType: "application/did+json",
      },
      didDocument: null,
      didDocumentMetadata: {},
    };
  }

  private parseOrCreateDIDDocument(
    did: string, 
    data: any
  ): DIDDocument {
    if (data.document) {
      try {
        // Parse stored document
        return JSON.parse(data.document);
      } catch (e) {
        // If parsing fails, create a new basic document
        logError("Error parsing stored DID Document, creating a basic one", e);
      }
    }
    
    // Create a basic DID Document if none exists or parsing failed
    return {
      "@context": "https://www.w3.org/ns/did/v1",
      id: did,
      authentication: []
    };
  }

  private extractAuthenticationMethod(
    document: DIDDocument
  ): { id: string; type: string; controller: string } | null {
    // Get authentication methods
    const authMethods = document.authentication || [];
    
    // Process authentication references or embedded methods
    for (const auth of authMethods) {
      if (typeof auth === "string") {
        // Reference to a verification method
        const methodId = auth;
        const method = document.verificationMethod?.find(vm => vm.id === methodId);
        if (method) {
          return {
            id: method.id,
            type: method.type,
            controller: method.controller
          };
        }
      } else {
        // Embedded verification method
        return auth;
      }
    }
    
    return null;
  }

  private async authenticateWithEthereum(
    authMethod: { id: string; type: string; controller: string },
    challenge?: string
  ): Promise<AuthResult> {
    // Extract Ethereum address from DID or authMethod
    const address = authMethod.id.split("#")[0].split(":").pop() || "";
    
    // Use MetaMask for authentication
    return this.core.loginWithMetaMask(address);
  }

  private async authenticateWithWebAuthn(
    authMethod: { id: string; type: string; controller: string },
    challenge?: string
  ): Promise<AuthResult> {
    // Extract username from controller or other means
    const username = authMethod.controller.split(":").pop() || "";
    
    // Use WebAuthn for authentication
    return this.core.loginWithWebAuthn(username);
  }

  private async authenticateWithGunDB(
    authMethod: { id: string; type: string; controller: string },
    challenge?: string
  ): Promise<AuthResult> {
    try {
      // Estrai username dal controller o altre informazioni
      const username = authMethod.controller.split(":").pop() || "";
      
      // Tenta di recuperare la password o altre informazioni necessarie dal DID document
      const didDoc = await this.resolveDID(authMethod.id.split("#")[0]);
      
      if (didDoc.didResolutionMetadata.error || !didDoc.didDocument) {
        return {
          success: false,
          error: "Impossibile recuperare il documento DID per l'autenticazione"
        };
      }
      
      // Cerca nei servizi se ci sono credenziali o informazioni di autenticazione
      const gunAuthService = didDoc.didDocument.service?.find(
        service => service.type === "GunDBAuthentication"
      );
      
      if (!gunAuthService) {
        return {
          success: false,
          error: "Nessun servizio di autenticazione GunDB trovato nel documento DID"
        };
      }
      
      // Cerca di estrarre la password o altri dati di autenticazione
      const serviceEndpoint = gunAuthService.serviceEndpoint;
      const authData: Record<string, any> = typeof serviceEndpoint === "string" 
        ? { username } 
        : { ...(serviceEndpoint as Record<string, any>), username };
      
      if (!authData.hasOwnProperty('password')) {
        // Se non c'è una password esplicita, proviamo ad usare una derivata dal DID
        // Questo è solo un esempio, in un caso reale si dovrebbe usare un metodo più sicuro
        const derivedPassword = ethers.keccak256(
          ethers.toUtf8Bytes(`${authMethod.id}:${challenge || ""}`)
        );
        
        // Prova ad autenticarsi con username e password derivata
        return this.core.login(username, derivedPassword);
      }
      
      // Altrimenti usa la password dal service endpoint
      return this.core.login(username, authData.password);
    } catch (error) {
      logError("Errore durante l'autenticazione con GunDB:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto durante l'autenticazione GunDB"
      };
    }
  }

  /**
   * Registra il DID dell'utente sulla blockchain
   * @param did - Il DID da registrare
   * @param signer - Il signer da utilizzare per la transazione
   * @returns Promise con il risultato della registrazione
   */
  async registerDIDOnChain(
    did: string, 
    signer?: ethers.Signer
  ): Promise<{success: boolean, txHash?: string, error?: string}> {
    try {
      if (!this.core.isLoggedIn()) {
        throw new Error("User must be logged in to register DID on chain");
      }
      
      // Se non viene fornito un signer, utilizza il wallet principale dell'utente
      let effectiveSigner = signer;
      if (!effectiveSigner) {
        const wallet = this.core.getMainWallet();
        if (!wallet) {
          throw new Error("No signer provided and main wallet not available");
        }
        effectiveSigner = wallet;
      }
      
      // Definire l'interfaccia del contratto
      const didRegistryABI = [
        "function registerDID(string did, string controller) public returns (bool)"
      ];
      
      // Indirizzo del contratto di registro DID (configurabile)
      const didRegistryAddress = "0x1234..."; // Da configurare
      
      // Creare un'istanza del contratto con il signer fornito
      const didRegistryContract = new ethers.Contract(
        didRegistryAddress,
        didRegistryABI,
        effectiveSigner
      );
      
      // Registrare il DID sul contratto
      const tx = await didRegistryContract.registerDID(
        did,
        this.getUserPublicKey()
      );
      
      // Attendere la conferma della transazione
      const receipt = await tx.wait();
      
      log(`DID registered on blockchain: ${did}, tx: ${receipt.hash}`);
      
      return {
        success: true,
        txHash: receipt.hash
      };
    } catch (error) {
      logError("Error registering DID on blockchain:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Verifica se un DID è registrato sulla blockchain
   * @param did - Il DID da verificare
   * @returns Promise con il risultato della verifica
   */
  async verifyDIDOnChain(did: string): Promise<{isRegistered: boolean, controller?: string, error?: string}> {
    try {
      // Definire l'interfaccia del contratto (ABI semplificato per esempio)
      const didRegistryABI = [
        "function isDIDRegistered(string did) public view returns (bool)",
        "function getDIDController(string did) public view returns (string)"
      ];
      
      // Indirizzo del contratto di registro DID
      const didRegistryAddress = "0x1234..."; // Da sostituire con l'indirizzo reale
      
      // Se non c'è un provider in ShogunCore, usiamo il signer del wallet
      const provider = this.core.getMainWallet()?.provider;
      
      if (!provider) {
        throw new Error("Provider non disponibile per verificare il DID on-chain");
      }
      
      // Creare un'istanza del contratto con il provider
      const didRegistryContract = new ethers.Contract(
        didRegistryAddress,
        didRegistryABI,
        provider
      );
      
      // Verificare se il DID è registrato
      const isRegistered = await didRegistryContract.isDIDRegistered(did);
      
      if (!isRegistered) {
        return { isRegistered: false };
      }
      
      // Ottenere il controller del DID
      const controller = await didRegistryContract.getDIDController(did);
      
      return {
        isRegistered: true,
        controller
      };
    } catch (error) {
      logError("Error verifying DID on blockchain:", error);
      return { 
        isRegistered: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
