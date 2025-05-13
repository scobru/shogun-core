import { ethers } from "ethers";
import { ShogunCore } from "../index";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the OracleBridge contract
const ORACLE_BRIDGE_ABI = [
  "function roots(uint256) public view returns (bytes32)",
  "function rootTimestamps(uint256) public view returns (uint256)",
  "function admin() public view returns (address)",
  "function epochId() public view returns (uint256)",
  "function getEpochId() external view returns (uint256)",
  "function publishRoot(uint256 _epochId, bytes32 root) external",
];

export interface OracleBridgeConfig {
  contractAddress: string;
  providerUrl?: string;
}

/**
 * OracleBridge - A class to interact with the OracleBridge contract
 * which publishes Merkle roots for each epoch
 */
export class OracleBridge {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contractAddress: string;
  private shogun?: ShogunCore;

  /**
   * Creates a new OracleBridge instance
   *
   * @param config Configuration for the OracleBridge
   * @param shogun Optional ShogunCore instance to reuse its provider
   * @param signer Optional signer to use for transactions
   */
  constructor(
    config: OracleBridgeConfig,
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

      // Initialize the contract if we have a provider and a signer
      if (this.signer && this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          ORACLE_BRIDGE_ABI,
          this.signer,
        );
        log(`OracleBridge initialized with signer at ${this.contractAddress}`);
      } else if (this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          ORACLE_BRIDGE_ABI,
          this.provider,
        );
        log(
          `OracleBridge initialized in read-only mode at ${this.contractAddress}`,
        );
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ORACLE_BRIDGE_INIT_FAILED",
        "Failed to initialize OracleBridge",
        error,
      );
    }
  }

  /**
   * Gets the current epoch ID
   *
   * @returns Promise resolving to the current epoch ID
   */
  async getEpochId(): Promise<bigint> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const result = await this.contract.getFunction("getEpochId")();
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_EPOCH_ID_FAILED",
        "Failed to get current epoch ID",
        error,
      );
      return BigInt(0);
    }
  }

  /**
   * Gets the Merkle root for a specific epoch
   *
   * @param epochId The epoch ID to get the root for
   * @returns Promise resolving to the Merkle root for the specified epoch
   */
  async getRootForEpoch(epochId: number | bigint): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const result = await this.contract.getFunction("roots")(epochId);
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_ROOT_FAILED",
        `Failed to get root for epoch ${epochId}`,
        error,
      );
      return ethers.ZeroHash;
    }
  }

  /**
   * Gets the admin address of the OracleBridge contract
   *
   * @returns Promise resolving to the admin address
   */
  async getAdmin(): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const result = await this.contract.getFunction("admin")();
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_ADMIN_FAILED",
        "Failed to get admin address",
        error,
      );
      return ethers.ZeroAddress;
    }
  }

  /**
   * Verifies if an epoch's Merkle root matches an expected value
   *
   * @param epochId The epoch ID to verify
   * @param expectedRoot The expected Merkle root to check against
   * @returns Promise resolving to boolean indicating if the roots match
   */
  async verifyRoot(
    epochId: number | bigint,
    expectedRoot: string,
  ): Promise<boolean> {
    try {
      const actualRoot = await this.getRootForEpoch(epochId);
      return actualRoot.toLowerCase() === expectedRoot.toLowerCase();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "VERIFY_ROOT_FAILED",
        `Failed to verify root for epoch ${epochId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Publishes a new Merkle root for an epoch (admin only)
   *
   * @param epochId The epoch ID to publish the root for
   * @param root The Merkle root to publish
   * @param externalSigner Optional signer to use for the transaction (must be admin)
   * @returns Promise resolving to the transaction receipt
   */
  async publishRoot(
    epochId: number | bigint,
    root: string,
    externalSigner?: ethers.Signer,
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Usa il signer fornito o quello memorizzato
      const signer = externalSigner || this.signer;

      if (!signer) {
        throw new Error(
          "No signer available. Please provide a signer or set one with setSigner()",
        );
      }

      // Connect the contract to the signer
      const contractWithSigner = this.contract.connect(signer);

      // Get the address of the signer
      const signerAddress = await signer.getAddress();

      // Get the admin address
      const adminAddress = await this.getAdmin();

      // Check if the signer is the admin
      if (signerAddress.toLowerCase() !== adminAddress.toLowerCase()) {
        throw new Error("Only admin can publish roots");
      }

      // Call the function explicitly using the function method
      const tx = await contractWithSigner.getFunction("publishRoot")(
        epochId,
        root,
      );

      // Wait for the transaction to be mined
      return await tx.wait();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "PUBLISH_ROOT_FAILED",
        `Failed to publish root for epoch ${epochId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Sets a signer to use for transactions
   *
   * @param signer The signer to set
   */
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
    log("Signer set for OracleBridge");
  }

  /**
   * Updates the provider URL for the bridge
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
          ORACLE_BRIDGE_ABI,
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
   * Updates the contract address for the bridge
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
          ORACLE_BRIDGE_ABI,
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
   * Gets the timestamp of when a root was published for a specific epoch
   *
   * @param epochId The epoch ID to get the timestamp for
   * @returns Promise resolving to the timestamp when the root was published or 0 if not found
   */
  async getRootTimestamp(epochId: number | bigint): Promise<bigint> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      const result = await this.contract.getFunction("rootTimestamps")(epochId);
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_ROOT_TIMESTAMP_FAILED",
        `Failed to get timestamp for root of epoch ${epochId}`,
        error,
      );
      return BigInt(0);
    }
  }
}
