import { ethers } from "ethers";
import { ShogunCore } from "../index";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the RelayMembership contract (only the methods we need)
const RELAY_MEMBERSHIP_ABI = [
  "function authorizedAddress(address user) external view returns (bool)",
  "function isAuthorized(bytes calldata pubKey) external view returns (bool)",
  "function getUserInfo(address user) external view returns (uint256 expires, bytes memory pubKey)",
  "function userInfoByPubKey(bytes) public view returns (address)",
  "function isActive(address user) external view returns (bool)",
];

export interface RelayMembershipConfig {
  contractAddress: string;
  providerUrl?: string;
}

/**
 * RelayMembershipVerifier - A class to verify if an address or public key is part
 * of the Shogun protocol using the RelayMembership contract
 */
export class RelayMembershipVerifier {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contractAddress: string;
  private shogun?: ShogunCore;

  /**
   * Creates a new RelayMembershipVerifier instance
   *
   * @param config Configuration for the RelayMembership verifier
   * @param shogun Optional ShogunCore instance to reuse its provider
   * @param signer Optional ethers.Signer instance to use for contract interactions
   */
  constructor(
    config: RelayMembershipConfig,
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
          RELAY_MEMBERSHIP_ABI,
          this.signer,
        );
        log(
          `RelayMembershipVerifier initialized with signer at ${this.contractAddress}`,
        );
      } else if (this.provider) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          RELAY_MEMBERSHIP_ABI,
          this.provider,
        );
        log(
          `RelayMembershipVerifier initialized in read-only mode at ${this.contractAddress}`,
        );
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_MEMBERSHIP_INIT_FAILED",
        "Failed to initialize RelayMembershipVerifier",
        error,
      );
    }
  }

  /**
   * Checks if an Ethereum address is authorized in the protocol
   *
   * @param address The Ethereum address to check
   * @returns Promise resolving to boolean indicating if address is authorized
   */
  async isAddressAuthorized(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address format");
      }

      // Call the contract method to check authorization
      return await this.contract.authorizedAddress(address);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ADDRESS_AUTH_CHECK_FAILED",
        `Failed to check if address ${address} is authorized`,
        error,
      );
      return false;
    }
  }

  /**
   * Checks if a public key is authorized in the protocol
   *
   * @param publicKey The public key to check (as a byte array or hex string)
   * @returns Promise resolving to boolean indicating if public key is authorized
   */
  async isPublicKeyAuthorized(
    publicKey: string | Uint8Array,
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Convert to properly formatted bytes if needed
      const formattedPubKey =
        typeof publicKey === "string"
          ? publicKey.startsWith("0x")
            ? publicKey
            : `0x${publicKey}`
          : `0x${Buffer.from(publicKey).toString("hex")}`;

      // Call the contract method to check authorization
      return await this.contract.isAuthorized(formattedPubKey);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "PUBKEY_AUTH_CHECK_FAILED",
        "Failed to check if public key is authorized",
        error,
      );
      return false;
    }
  }

  /**
   * Gets the address associated with a public key
   *
   * @param publicKey The public key to look up
   * @returns Promise resolving to the associated address or null if not found
   */
  async getAddressForPublicKey(
    publicKey: string | Uint8Array,
  ): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Convert to properly formatted bytes if needed
      const formattedPubKey =
        typeof publicKey === "string"
          ? publicKey.startsWith("0x")
            ? publicKey
            : `0x${publicKey}`
          : `0x${Buffer.from(publicKey).toString("hex")}`;

      const address = await this.contract.userInfoByPubKey(formattedPubKey);

      // Return null if the address is the zero address (not found)
      return address === ethers.ZeroAddress ? null : address;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ADDRESS_LOOKUP_FAILED",
        "Failed to get address for public key",
        error,
      );
      return null;
    }
  }

  /**
   * Gets user information from the contract
   *
   * @param address The Ethereum address to look up
   * @returns Promise resolving to user info (expiration timestamp and public key)
   */
  async getUserInfo(
    address: string,
  ): Promise<{ expires: bigint; pubKey: string } | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address format");
      }

      const [expires, pubKey] = await this.contract.getUserInfo(address);
      return { expires, pubKey };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "USER_INFO_LOOKUP_FAILED",
        `Failed to get user info for address ${address}`,
        error,
      );
      return null;
    }
  }

  /**
   * Checks if a user's subscription is active (not expired)
   *
   * @param address The Ethereum address to check
   * @returns Promise resolving to boolean indicating if subscription is active
   */
  async isUserActive(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      if (!ethers.isAddress(address)) {
        throw new Error("Invalid Ethereum address format");
      }

      return await this.contract.isActive(address);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "USER_ACTIVE_CHECK_FAILED",
        `Failed to check if user ${address} is active`,
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
          RELAY_MEMBERSHIP_ABI,
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

      if (this.provider) {
        // Reinitialize the contract with the new address
        this.contract = new ethers.Contract(
          this.contractAddress,
          RELAY_MEMBERSHIP_ABI,
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
   * Updates the signer for the verifier
   *
   * @param signer New ethers.Signer instance to use
   * @returns True if signer was updated successfully
   */
  setSigner(signer: ethers.Signer): boolean {
    try {
      this.signer = signer;

      if (this.provider) {
        // Reinitialize the contract with the new signer
        this.contract = new ethers.Contract(
          this.contractAddress,
          RELAY_MEMBERSHIP_ABI,
          this.signer,
        );
        log(`Updated signer for RelayMembershipVerifier`);
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
