import { ethers } from "ethers";
import { ShogunCore } from "../index";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the RelayRegistry contract
const RELAY_REGISTRY_ABI = [
  "function getRelayDetails(address _relayContractAddress) external view returns (address owner_, string memory url_)",
  "function getAllRelayContracts() external view returns (address[] memory)",
  "function getRelayCount() external view returns (uint256)",
  "function isRegistered(address _relayContractAddress) external view returns (bool)",
  "function isUserSubscribedToRelay(address _relayContractAddress, address _user) external view returns (bool)",
  "function subscribeToRelay(address _relayContractAddress, uint256 _months, bytes calldata _pubKey) external payable",
  "function getRelaySubscriptionPrice(address _relayContractAddress) external view returns (uint256)",
  "function getUserActiveRelays(address _user) external view returns (address[] memory)"
];

// ABI for the IndividualRelay contract
const INDIVIDUAL_RELAY_ABI = [
  "function isSubscriptionActive(address _user) external view returns (bool)",
  "function subscribe(uint256 _months, bytes calldata _pubKey) external payable",
  "function getUserSubscriptionInfo(address _user) external view returns (uint256 expires, bytes memory pubKey)",
  "function isAuthorizedByPubKey(bytes calldata _pubKey) external view returns (bool)",
  "function pricePerMonth() external view returns (uint256)",
  "function getRelayOperationalConfig() external view returns (string memory _url, uint256 _price, uint256 _daysInMonth)",
  "function getOwner() external view returns (address)"
];

export interface RelayConfig {
  registryAddress: string;
  providerUrl?: string;
}

export interface RelayInfo {
  address: string;
  owner: string;
  url: string;
  price: bigint;
  daysPerMonth: number;
}

export interface UserSubscriptionInfo {
  expires: bigint;
  pubKey: string;
  active: boolean;
}

/**
 * RelayVerifier - A class to interact with the Shogun relay network
 * using the RelayRegistry and IndividualRelay contracts
 */
export class RelayVerifier {
  private registryContract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private registryAddress: string;
  private relayContracts: Map<string, ethers.Contract> = new Map();
  private shogun?: ShogunCore;

  /**
   * Creates a new RelayVerifier instance
   *
   * @param config Configuration for the relay verifier
   * @param shogun Optional ShogunCore instance to reuse its provider
   * @param signer Optional ethers.Signer instance to use for contract interactions
   */
  constructor(
    config: RelayConfig,
    shogun?: ShogunCore,
    signer?: ethers.Signer,
  ) {
    this.registryAddress = config.registryAddress;
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

      // Initialize the registry contract if we have a provider
      if (this.signer && this.provider) {
        this.registryContract = new ethers.Contract(
          this.registryAddress,
          RELAY_REGISTRY_ABI,
          this.signer,
        );
        log(
          `RelayVerifier initialized with signer at registry ${this.registryAddress}`,
        );
      } else if (this.provider) {
        this.registryContract = new ethers.Contract(
          this.registryAddress,
          RELAY_REGISTRY_ABI,
          this.provider,
        );
        log(
          `RelayVerifier initialized in read-only mode at registry ${this.registryAddress}`,
        );
      }

      // Check if debug mode is enabled via environment variable
      this.debugMode = process.env.RELAY_DEBUG_MODE === "true";
      if (this.debugMode) {
        console.warn("[WARNING] RelayVerifier running in DEBUG MODE - all authorizations will pass!");
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_VERIFIER_INIT_FAILED",
        "Failed to initialize RelayVerifier",
        error,
      );
    }
  }

  /**
   * Enable debug mode - WARNING: all authorization checks will pass
   */
  public enableDebugMode() {
    this.debugMode = true;
    console.warn("[WARNING] RelayVerifier DEBUG MODE enabled - all authorizations will pass!");
  }

  /**
   * Disable debug mode - authorization checks will work normally
   */
  public disableDebugMode() {
    this.debugMode = false;
    console.log("RelayVerifier DEBUG MODE disabled - authorization checks restored");
  }

  /**
   * Gets an instance of the IndividualRelay contract
   * 
   * @param relayAddress The address of the relay contract
   * @returns The contract instance or null if not found
   */
  private async getRelayContract(relayAddress: string): Promise<ethers.Contract | null> {
    try {
      // Check if we already have this contract instance
      if (this.relayContracts.has(relayAddress)) {
        return this.relayContracts.get(relayAddress)!;
      }

      // Verify this is a valid relay contract through the registry
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      const isRegistered = await this.registryContract.isRegistered(relayAddress);
      if (!isRegistered) {
        throw new Error(`Address ${relayAddress} is not a registered relay`);
      }

      // Create and store the contract instance
      const contract = this.signer 
        ? new ethers.Contract(relayAddress, INDIVIDUAL_RELAY_ABI, this.signer)
        : new ethers.Contract(relayAddress, INDIVIDUAL_RELAY_ABI, this.provider);
      
      this.relayContracts.set(relayAddress, contract);
      return contract;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_CONTRACT_INIT_FAILED",
        `Failed to initialize relay contract at ${relayAddress}`,
        error
      );
      return null;
    }
  }

  /**
   * Gets all registered relay contracts from the registry
   * 
   * @returns Array of relay contract addresses
   */
  async getAllRelays(): Promise<string[]> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.registryContract.getAllRelayContracts();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_ALL_RELAYS_FAILED",
        "Failed to get all relay contracts",
        error
      );
      return [];
    }
  }

  /**
   * Gets detailed information about a relay
   * 
   * @param relayAddress The address of the relay to query
   * @returns Detailed relay information or null if not found
   */
  async getRelayInfo(relayAddress: string): Promise<RelayInfo | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      const relayContract = await this.getRelayContract(relayAddress);
      if (!relayContract) {
        throw new Error(`Failed to get relay contract at ${relayAddress}`);
      }

      // Get owner and URL from registry
      const [owner, url] = await this.registryContract.getRelayDetails(relayAddress);
      
      // Get additional details from the relay contract
      const [_url, price, daysPerMonth] = await relayContract.getRelayOperationalConfig();

      return {
        address: relayAddress,
        owner,
        url,
        price,
        daysPerMonth
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_RELAY_INFO_FAILED",
        `Failed to get relay info for ${relayAddress}`,
        error
      );
      return null;
    }
  }

  /**
   * Gets all relays a user is actively subscribed to
   * 
   * @param userAddress The Ethereum address to check
   * @returns Array of relay addresses the user is subscribed to
   */
  async getUserActiveRelays(userAddress: string): Promise<string[]> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      if (!ethers.isAddress(userAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      return await this.registryContract.getUserActiveRelays(userAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_USER_ACTIVE_RELAYS_FAILED",
        `Failed to get active relays for user ${userAddress}`,
        error
      );
      return [];
    }
  }

  /**
   * Checks if a user is subscribed to a specific relay
   * 
   * @param relayAddress The relay contract address to check
   * @param userAddress The user's Ethereum address
   * @returns True if the user is subscribed, false otherwise
   */
  async isUserSubscribedToRelay(relayAddress: string, userAddress: string): Promise<boolean> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      if (!ethers.isAddress(userAddress) || !ethers.isAddress(relayAddress)) {
        throw new Error("Invalid address format");
      }

      return await this.registryContract.isUserSubscribedToRelay(relayAddress, userAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "USER_SUBSCRIPTION_CHECK_FAILED",
        `Failed to check subscription for user ${userAddress} to relay ${relayAddress}`,
        error
      );
      return false;
    }
  }

  /**
   * Gets user subscription information for a specific relay
   * 
   * @param relayAddress The relay contract address
   * @param userAddress The user's Ethereum address
   * @returns Subscription information or null if failed
   */
  async getUserSubscriptionInfo(
    relayAddress: string,
    userAddress: string
  ): Promise<UserSubscriptionInfo | null> {
    try {
      const relayContract = await this.getRelayContract(relayAddress);
      if (!relayContract) {
        throw new Error(`Failed to get relay contract at ${relayAddress}`);
      }

      if (!ethers.isAddress(userAddress)) {
        throw new Error("Invalid Ethereum address format");
      }

      const [expires, pubKey] = await relayContract.getUserSubscriptionInfo(userAddress);
      const active = expires > BigInt(Math.floor(Date.now() / 1000));

      return { expires, pubKey, active };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_USER_SUBSCRIPTION_INFO_FAILED",
        `Failed to get subscription info for user ${userAddress} on relay ${relayAddress}`,
        error
      );
      return null;
    }
  }

  /**
   * Checks if a public key is authorized in a specific relay
   * 
   * @param relayAddress The relay contract address
   * @param publicKey The public key to check (as a byte array or hex string)
   * @returns True if authorized, false otherwise
   */
  async isPublicKeyAuthorized(
    relayAddress: string,
    publicKey: string | Uint8Array,
  ): Promise<boolean> {
    try {
      // If debug mode is enabled, always return true
      if (this.debugMode) {
        console.log(`[DEBUG MODE] Auto-authorizing pubKey: ${publicKey.toString().substring(0, 10)}...`);
        return true;
      }

      const relayContract = await this.getRelayContract(relayAddress);
      if (!relayContract) {
        throw new Error(`Failed to get relay contract at ${relayAddress}`);
      }

      // Convert to properly formatted bytes if needed
      const formattedPubKey =
        typeof publicKey === "string"
          ? publicKey.startsWith("0x")
            ? publicKey
            : `0x${publicKey}`
          : `0x${Buffer.from(publicKey).toString("hex")}`;

      return await relayContract.isAuthorizedByPubKey(formattedPubKey);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "PUBKEY_AUTH_CHECK_FAILED",
        "Failed to check if public key is authorized",
        error
      );
      return false;
    }
  }

  /**
   * Gets the subscription price for a relay
   * 
   * @param relayAddress The relay contract address
   * @returns The price per month in wei (as BigInt) or null if failed
   */
  async getRelayPrice(relayAddress: string): Promise<bigint | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.registryContract.getRelaySubscriptionPrice(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_RELAY_PRICE_FAILED",
        `Failed to get price for relay ${relayAddress}`,
        error
      );
      return null;
    }
  }

  /**
   * Subscribes to a relay (requires a signer)
   * 
   * @param relayAddress The relay contract address to subscribe to
   * @param months Number of months to subscribe for
   * @param pubKey Optional public key to associate with the subscription
   * @returns Transaction response or null if failed
   */
  async subscribeToRelay(
    relayAddress: string,
    months: number,
    pubKey?: string | Uint8Array
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error("Registry contract not initialized or no signer available");
      }

      // Get the subscription price
      const pricePerMonth = await this.getRelayPrice(relayAddress);
      if (!pricePerMonth) {
        throw new Error(`Failed to get price for relay ${relayAddress}`);
      }

      // Format public key if provided
      let formattedPubKey = "0x";
      if (pubKey) {
        formattedPubKey = typeof pubKey === "string"
          ? pubKey.startsWith("0x")
            ? pubKey
            : `0x${pubKey}`
          : `0x${Buffer.from(pubKey).toString("hex")}`;
      }

      // Calculate total payment
      const totalPayment = pricePerMonth * BigInt(months);

      // Subscribe through the registry
      return await this.registryContract.subscribeToRelay(
        relayAddress,
        months,
        formattedPubKey,
        { value: totalPayment }
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SUBSCRIBE_TO_RELAY_FAILED",
        `Failed to subscribe to relay ${relayAddress}`,
        error
      );
      return null;
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
        // Reinitialize the registry contract with the new provider
        this.registryContract = this.signer
          ? new ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer)
          : new ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.provider);
        
        // Clear cached relay contracts to force recreation with new provider
        this.relayContracts.clear();
        
        log(`Updated provider URL to ${providerUrl}`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "PROVIDER_UPDATE_FAILED",
        "Failed to update provider URL",
        error
      );
      return false;
    }
  }

  /**
   * Updates the registry address for the verifier
   *
   * @param registryAddress New registry address to use
   * @returns True if registry address was updated successfully
   */
  setRegistryAddress(registryAddress: string): boolean {
    try {
      if (!ethers.isAddress(registryAddress)) {
        throw new Error("Invalid registry address format");
      }

      this.registryAddress = registryAddress;

      if (this.provider) {
        // Reinitialize the registry contract with the new address
        this.registryContract = this.signer
          ? new ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.signer)
          : new ethers.Contract(this.registryAddress, RELAY_REGISTRY_ABI, this.provider);
        
        // Clear cached relay contracts as they might no longer be valid
        this.relayContracts.clear();
        
        log(`Updated registry address to ${registryAddress}`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_ADDRESS_UPDATE_FAILED",
        "Failed to update registry address",
        error
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
        // Reinitialize the registry contract with the new signer
        this.registryContract = new ethers.Contract(
          this.registryAddress,
          RELAY_REGISTRY_ABI,
          this.signer
        );
        
        // Update all cached relay contracts with the new signer
        for (const [address, _] of this.relayContracts) {
          this.relayContracts.set(
            address,
            new ethers.Contract(address, INDIVIDUAL_RELAY_ABI, this.signer)
          );
        }
        
        log(`Updated signer for RelayVerifier`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SIGNER_UPDATE_FAILED",
        "Failed to update signer",
        error
      );
      return false;
    }
  }
}
