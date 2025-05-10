import { ethers } from "ethers";
import { ShogunCore } from "../index";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the DIDRegistry contract (only the methods we need)
const DID_REGISTRY_ABI = [
  "function registerDID(string memory did, string memory controller) public returns (bool success)",
  "function getController(string memory did) public view returns (string memory controller)",
];

export interface DIDVerifierConfig {
  contractAddress: string;
  providerUrl?: string;
}

/**
 * DIDVerifier - A class to verify and interact with Decentralized Identifiers (DIDs)
 * using the DIDRegistry contract
 */
export class DIDVerifier {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contractAddress: string;
  private shogun?: ShogunCore;

  /**
   * Creates a new DIDVerifier instance
   *
   * @param config Configuration for the DID verifier
   * @param shogun Optional ShogunCore instance to reuse its provider
   * @param signer Optional signer to use for contract interactions
   */
  constructor(
    config: DIDVerifierConfig,
    shogun?: ShogunCore,
    signer?: ethers.Signer,
  ) {
    this.contractAddress = config.contractAddress;
    this.shogun = shogun;
    this.signer = signer || null;

    // Setup the provider
    try {
      if (shogun?.provider) {
        // Reuse the provider from ShogunCore if available
        this.provider = shogun.provider;
        log("Using provider from ShogunCore instance");
      } else if (config.providerUrl) {
        // Or create a new provider with the provided URL
        this.provider = new ethers.JsonRpcProvider(config.providerUrl);
        log(`Created provider with URL: ${config.providerUrl}`);
      } else {
        logError(
          "No provider available. Either pass a ShogunCore instance or providerUrl",
        );
      }

      // Initialize the contract if we have a provider
      if (this.signer && this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          DID_REGISTRY_ABI,
          this.signer,
        );
        log(`DIDVerifier initialized with signer at ${this.contractAddress}`);
      } else if (this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          DID_REGISTRY_ABI,
          this.provider,
        );
        log(
          `DIDVerifier initialized in read-only mode at ${this.contractAddress}`,
        );
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DID_VERIFIER_INIT_FAILED",
        "Failed to initialize DIDVerifier",
        error,
      );
    }
  }

  /**
   * Verifies if a DID is registered and returns its controller
   *
   * @param did The decentralized identifier to verify
   * @returns Promise resolving to the controller of the DID or null if not found
   */
  async verifyDID(did: string): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      if (!did || !did.trim()) {
        throw new Error("Invalid DID format: DID cannot be empty");
      }

      // Call the contract method to get the controller
      const controller = await this.contract.getController(did);

      // If controller is empty, the DID is not registered
      return controller && controller.trim() !== "" ? controller : null;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DID_VERIFICATION_FAILED",
        `Failed to verify DID: ${did}`,
        error,
      );
      return null;
    }
  }

  /**
   * Checks if a DID is controlled by a specific controller
   *
   * @param did The decentralized identifier to check
   * @param expectedController The controller to verify against
   * @returns Promise resolving to boolean indicating if the DID is controlled by the expected controller
   */
  async isDIDControlledBy(
    did: string,
    expectedController: string,
  ): Promise<boolean> {
    try {
      const controller = await this.verifyDID(did);
      return controller === expectedController;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DID_CONTROLLER_CHECK_FAILED",
        `Failed to check if DID ${did} is controlled by ${expectedController}`,
        error,
      );
      return false;
    }
  }

  /**
   * Authenticates a user using their DID and a signed message
   *
   * @param did The decentralized identifier of the user
   * @param message The original message that was signed
   * @param signature The signature to verify
   * @returns Promise resolving to boolean indicating if authentication was successful
   */
  async authenticateWithDID(
    did: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      // First verify the DID exists
      const controller = await this.verifyDID(did);

      if (!controller) {
        log(`DID not found: ${did}`);
        return false;
      }

      // Try to recover the signer's address from the signature
      const signerAddress = ethers.verifyMessage(message, signature);

      // Check if the signer matches the controller (assuming controller is an Ethereum address)
      // This is a simplification - actual implementation might need to handle different controller formats
      if (
        ethers.isAddress(controller) &&
        controller.toLowerCase() === signerAddress.toLowerCase()
      ) {
        log(`Successfully authenticated DID: ${did}`);
        return true;
      }

      log(`Authentication failed for DID: ${did}. Controller mismatch.`);
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DID_AUTHENTICATION_FAILED",
        `Failed to authenticate with DID: ${did}`,
        error,
      );
      return false;
    }
  }

  /**
   * Updates the provider URL for the verifier
   *
   * @param providerUrl New provider URL to use
   * @returns True if provider was updated successfully
   */
  setProviderUrl(providerUrl: string): boolean {
    try {
      this.provider = new ethers.JsonRpcProvider(providerUrl);

      if (this.provider) {
        // Reinitialize the contract with the new provider
        this.contract = new ethers.Contract(
          this.contractAddress,
          DID_REGISTRY_ABI,
          this.provider,
        );
        log(`Updated provider URL to ${providerUrl}`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "PROVIDER_UPDATE_FAILED",
        "Failed to update provider URL",
        error,
      );
      return false;
    }
  }

  /**
   * Updates the contract address for the verifier
   *
   * @param contractAddress New contract address to use
   * @returns True if contract address was updated successfully
   */
  setContractAddress(contractAddress: string): boolean {
    try {
      if (!ethers.isAddress(contractAddress)) {
        throw new Error("Invalid contract address format");
      }

      this.contractAddress = contractAddress;

      // Reinitialize the contract with the new address
      if (this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          DID_REGISTRY_ABI,
          this.provider,
        );
        log(`Updated contract address to ${contractAddress}`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "CONTRACT_ADDRESS_UPDATE_FAILED",
        "Failed to update contract address",
        error,
      );
      return false;
    }
  }

  /**
   * Registers a DID with the contract
   *
   * @param did The decentralized identifier to register
   * @param controller The controller of the DID
   * @returns Promise resolving to boolean indicating if the registration was successful
   */
  async registerDID(did: string, controller: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for registerDID");
      }

      // Usa getFunction per evitare errori TypeScript
      const tx = await this.contract.getFunction("registerDID")(
        did,
        controller,
      );
      const receipt = await tx.wait();

      return receipt.status === 1;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DID_REGISTRATION_FAILED",
        `Failed to register DID: ${did}`,
        error,
      );
      return false;
    }
  }

  /**
   * Updates the signer for the verifier
   *
   * @param signer The new signer to use
   * @returns True if signer was updated successfully
   */
  setSigner(signer: ethers.Signer): boolean {
    try {
      this.signer = signer;

      if (this.provider) {
        // Reinitialize the contract with the signer
        this.contract = new ethers.Contract(
          this.contractAddress,
          DID_REGISTRY_ABI,
          this.signer,
        );
        log(`Updated signer for DIDVerifier`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SIGNER_UPDATE_FAILED",
        "Failed to update signer",
        error,
      );
      return false;
    }
  }
}
