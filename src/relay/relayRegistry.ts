import { ethers } from "ethers";
import { ShogunCore } from "../index";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";

// ABI for the RelayRegistry contract
const RELAY_REGISTRY_ABI = [
  "function getRelayDetails(address _relayContractAddress) external view returns (address owner_, string memory url_, uint256 subscribers_, uint256 pendingRewards_, uint256 stake_, uint256 stakePercentage_)",
  "function getAllRelayContracts() external view returns (address[] memory)",
  "function getRelayCount() external view returns (uint256)",
  "function isRegistered(address _relayContractAddress) external view returns (bool)",
  "function registerRelayContract(address _relayOwner, string calldata _url, uint256 _stake) external",
  "function updateRelayStake(address _relayContract, uint256 _newStake) external",
  "function unregisterRelayContract(address _relayContractAddress) external",
  "function updateRelayUrl(address _relayContractAddress, string calldata _newUrl) external",
  "function isUserSubscribedToRelay(address _relayContractAddress, address _user) external view returns (bool)",
  "function subscribeToRelay(address _relayContractAddress, uint256 _months, bytes calldata _pubKey) external payable",
  "function getRelaySubscriptionPrice() external view returns (uint256)",
  "function getProtocolPrice() external view returns (uint256)",
  "function getUserActiveRelays(address _user) external view returns (address[] memory)",
  "function getSystemStats() external view returns (uint256 totalRelays_, uint256 totalStakedAmount_, uint256 totalSubscribers_, uint256 totalFeesAccumulated_, uint256 totalRewardsDistributed_)",
  "function distributeRewards() external",
  "function isDistributionDue() external view returns (bool)",
  "function protocolPrice() external view returns (uint256)",
  "function protocolFeePercentage() external view returns (uint256)",
  "function setProtocolPrice(uint256 _newPrice) external",
  "function setProtocolFeePercentage(uint256 _newPercentage) external",
  "function setDistributionPeriod(uint256 _newPeriod) external",
  "function setMinimumStake(uint256 _newMinStake) external",
  "function minStakeRequired() external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
  "function withdrawProtocolFees(uint256 _amount) external",
];

export interface RelayRegistryConfig {
  registryAddress: string;
  providerUrl?: string;
}

export interface RegistryRelayInfo {
  address: string;
  owner: string;
  url: string;
  subscribers: number;
  pendingRewards: bigint;
  stake: bigint;
  stakePercentage: number;
}

export interface RegistrySystemStats {
  totalRelays: number;
  totalStakedAmount: bigint;
  totalSubscribers: number;
  totalFeesAccumulated: bigint;
  totalRewardsDistributed: bigint;
}

export interface ProtocolConfig {
  protocolPrice: bigint;
  feePercentage: number;
  distributionPeriod: bigint;
  minimumStake: bigint;
  totalStaked: bigint;
  lastDistributionTimestamp: bigint;
}

/**
 * RelayRegistry - A class to interact with the Shogun Relay Registry contract
 * This provides complete access to all registry functionality
 */
export class RelayRegistry {
  private registryContract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private registryAddress: string;
  private shogun?: ShogunCore;

  /**
   * Creates a new RelayRegistry instance
   *
   * @param config Configuration for the relay registry
   * @param shogun Optional ShogunCore instance to reuse its provider
   * @param signer Optional ethers.Signer instance to use for contract interactions
   */
  constructor(
    config: RelayRegistryConfig,
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
        log(`RelayRegistry initialized with signer at ${this.registryAddress}`);
      } else if (this.provider) {
        this.registryContract = new ethers.Contract(
          this.registryAddress,
          RELAY_REGISTRY_ABI,
          this.provider,
        );
        log(
          `RelayRegistry initialized in read-only mode at ${this.registryAddress}`,
        );
      }
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_REGISTRY_INIT_FAILED",
        "Failed to initialize RelayRegistry",
        error,
      );
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
        error,
      );
      return [];
    }
  }

  /**
   * Gets the total number of registered relays
   *
   * @returns Number of registered relays
   */
  async getRelayCount(): Promise<number> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      const count = await this.registryContract.getRelayCount();
      return Number(count);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_RELAY_COUNT_FAILED",
        "Failed to get relay count",
        error,
      );
      return 0;
    }
  }

  /**
   * Checks if an address is a registered relay
   *
   * @param relayAddress Relay contract address to check
   * @returns True if registered, false otherwise
   */
  async isRegistered(relayAddress: string): Promise<boolean> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      if (!ethers.isAddress(relayAddress)) {
        throw new Error("Invalid relay address format");
      }

      return await this.registryContract.isRegistered(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "IS_REGISTERED_CHECK_FAILED",
        `Failed to check if ${relayAddress} is registered`,
        error,
      );
      return false;
    }
  }

  /**
   * Gets detailed information about a relay
   *
   * @param relayAddress The address of the relay to query
   * @returns Detailed relay information or null if not found
   */
  async getRelayInfo(relayAddress: string): Promise<RegistryRelayInfo | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      if (!ethers.isAddress(relayAddress)) {
        throw new Error("Invalid relay address format");
      }

      const [owner, url, subscribers, pendingRewards, stake, stakePercentage] =
        await this.registryContract.getRelayDetails(relayAddress);

      return {
        address: relayAddress,
        owner,
        url,
        subscribers: Number(subscribers),
        pendingRewards,
        stake,
        stakePercentage: Number(stakePercentage),
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_RELAY_INFO_FAILED",
        `Failed to get relay info for ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Gets system-wide statistics from the relay registry
   *
   * @returns System statistics or null if failed
   */
  async getSystemStats(): Promise<RegistrySystemStats | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      const [
        totalRelays,
        totalStakedAmount,
        totalSubscribers,
        totalFeesAccumulated,
        totalRewardsDistributed,
      ] = await this.registryContract.getSystemStats();

      return {
        totalRelays: Number(totalRelays),
        totalStakedAmount,
        totalSubscribers: Number(totalSubscribers),
        totalFeesAccumulated,
        totalRewardsDistributed,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_SYSTEM_STATS_FAILED",
        "Failed to get system statistics",
        error,
      );
      return null;
    }
  }

  /**
   * Gets the current protocol configuration
   *
   * @returns Protocol configuration or null if failed
   */
  async getProtocolConfig(): Promise<ProtocolConfig | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      const [protocolPrice, feePercentage, minStake, totalStaked] =
        await Promise.all([
          this.registryContract.protocolPrice(),
          this.registryContract.protocolFeePercentage(),
          this.registryContract.minStakeRequired(),
          this.registryContract.totalStaked(),
        ]);

      // Note: lastDistributionTimestamp is not exposed as a public variable in the contract
      // We would need to add it to the contract if needed

      return {
        protocolPrice,
        feePercentage: Number(feePercentage),
        distributionPeriod: BigInt(30 * 24 * 60 * 60), // default 30 days in seconds
        minimumStake: minStake,
        totalStaked,
        lastDistributionTimestamp: BigInt(0), // Not available in current contract
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_PROTOCOL_CONFIG_FAILED",
        "Failed to get protocol configuration",
        error,
      );
      return null;
    }
  }

  /**
   * Checks if a user is subscribed to a specific relay
   *
   * @param relayAddress The relay contract address to check
   * @param userAddress The user's Ethereum address
   * @returns True if the user is subscribed, false otherwise
   */
  async isUserSubscribedToRelay(
    relayAddress: string,
    userAddress: string,
  ): Promise<boolean> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      if (!ethers.isAddress(userAddress) || !ethers.isAddress(relayAddress)) {
        throw new Error("Invalid address format");
      }

      return await this.registryContract.isUserSubscribedToRelay(
        relayAddress,
        userAddress,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "USER_SUBSCRIPTION_CHECK_FAILED",
        `Failed to check subscription for user ${userAddress} to relay ${relayAddress}`,
        error,
      );
      return false;
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
        error,
      );
      return [];
    }
  }

  /**
   * Gets the protocol subscription price
   *
   * @returns The price per month in wei (as BigInt) or null if failed
   */
  async getProtocolPrice(): Promise<bigint | null> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.registryContract.getProtocolPrice();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "GET_PROTOCOL_PRICE_FAILED",
        "Failed to get protocol price",
        error,
      );
      return null;
    }
  }

  /**
   * Subscribes a user to a relay through the registry (requires a signer)
   *
   * @param relayAddress The relay contract address to subscribe to
   * @param months Number of months to subscribe for
   * @param pubKey Optional public key to associate with the subscription
   * @returns Transaction response or null if failed
   */
  async subscribeToRelay(
    relayAddress: string,
    months: number,
    pubKey?: string | Uint8Array,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      // Get the subscription price
      const pricePerMonth = await this.getProtocolPrice();
      if (!pricePerMonth) {
        throw new Error("Failed to get protocol price");
      }

      // Format public key if provided
      let formattedPubKey = "0x";
      if (pubKey) {
        formattedPubKey =
          typeof pubKey === "string"
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
        { value: totalPayment },
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SUBSCRIBE_TO_RELAY_FAILED",
        `Failed to subscribe to relay ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Registers a relay contract in the registry (only callable by relay contract)
   *
   * @param relayOwner Owner address of the relay
   * @param url WebSocket URL of the relay
   * @param stake Amount staked for the relay
   * @returns Transaction response or null if failed
   */
  async registerRelayContract(
    relayOwner: string,
    url: string,
    stake: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (!ethers.isAddress(relayOwner)) {
        throw new Error("Invalid owner address format");
      }

      return await this.registryContract.registerRelayContract(
        relayOwner,
        url,
        stake,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTER_RELAY_FAILED",
        "Failed to register relay contract",
        error,
      );
      return null;
    }
  }

  /**
   * Updates the stake amount for a relay (only callable by relay contract)
   *
   * @param relayContract Relay contract address
   * @param newStake New stake amount
   * @returns Transaction response or null if failed
   */
  async updateRelayStake(
    relayContract: string,
    newStake: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (!ethers.isAddress(relayContract)) {
        throw new Error("Invalid relay address format");
      }

      return await this.registryContract.updateRelayStake(
        relayContract,
        newStake,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "UPDATE_STAKE_FAILED",
        `Failed to update stake for relay ${relayContract}`,
        error,
      );
      return null;
    }
  }

  /**
   * Unregisters a relay contract from the registry (only callable by relay owner)
   *
   * @param relayContractAddress Relay contract address to unregister
   * @returns Transaction response or null if failed
   */
  async unregisterRelayContract(
    relayContractAddress: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (!ethers.isAddress(relayContractAddress)) {
        throw new Error("Invalid relay address format");
      }

      return await this.registryContract.unregisterRelayContract(
        relayContractAddress,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "UNREGISTER_RELAY_FAILED",
        `Failed to unregister relay ${relayContractAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Updates the URL for a relay contract (only callable by relay owner)
   *
   * @param relayContractAddress Relay contract address to update
   * @param newUrl New WebSocket URL
   * @returns Transaction response or null if failed
   */
  async updateRelayUrl(
    relayContractAddress: string,
    newUrl: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (!ethers.isAddress(relayContractAddress)) {
        throw new Error("Invalid relay address format");
      }

      if (!newUrl || newUrl.trim() === "") {
        throw new Error("URL cannot be empty");
      }

      return await this.registryContract.updateRelayUrl(
        relayContractAddress,
        newUrl,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "UPDATE_URL_FAILED",
        `Failed to update URL for relay ${relayContractAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Checks if reward distribution is due
   *
   * @returns True if distribution is due, false otherwise
   */
  async isDistributionDue(): Promise<boolean> {
    try {
      if (!this.registryContract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.registryContract.isDistributionDue();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "IS_DISTRIBUTION_DUE_FAILED",
        "Failed to check if distribution is due",
        error,
      );
      return false;
    }
  }

  /**
   * Distributes rewards to relay owners (can be called by anyone)
   *
   * @returns Transaction response or null if failed
   */
  async distributeRewards(): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      return await this.registryContract.distributeRewards();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "DISTRIBUTE_REWARDS_FAILED",
        "Failed to distribute rewards",
        error,
      );
      return null;
    }
  }

  /**
   * Sets the protocol price (only callable by registry owner)
   *
   * @param newPrice New protocol price in wei
   * @returns Transaction response or null if failed
   */
  async setProtocolPrice(
    newPrice: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      return await this.registryContract.setProtocolPrice(newPrice);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SET_PROTOCOL_PRICE_FAILED",
        "Failed to set protocol price",
        error,
      );
      return null;
    }
  }

  /**
   * Sets the protocol fee percentage (only callable by registry owner)
   *
   * @param newPercentage New fee percentage (1-100)
   * @returns Transaction response or null if failed
   */
  async setProtocolFeePercentage(
    newPercentage: number,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (newPercentage < 1 || newPercentage > 100) {
        throw new Error("Fee percentage must be between 1 and 100");
      }

      return await this.registryContract.setProtocolFeePercentage(
        newPercentage,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SET_FEE_PERCENTAGE_FAILED",
        "Failed to set protocol fee percentage",
        error,
      );
      return null;
    }
  }

  /**
   * Sets the distribution period (only callable by registry owner)
   *
   * @param newPeriod New distribution period in seconds
   * @returns Transaction response or null if failed
   */
  async setDistributionPeriod(
    newPeriod: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (newPeriod < BigInt(24 * 60 * 60)) {
        // At least 1 day
        throw new Error("Distribution period must be at least 1 day");
      }

      return await this.registryContract.setDistributionPeriod(newPeriod);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SET_DISTRIBUTION_PERIOD_FAILED",
        "Failed to set distribution period",
        error,
      );
      return null;
    }
  }

  /**
   * Sets the minimum stake required (only callable by registry owner)
   *
   * @param newMinStake New minimum stake in wei
   * @returns Transaction response or null if failed
   */
  async setMinimumStake(
    newMinStake: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      return await this.registryContract.setMinimumStake(newMinStake);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "SET_MINIMUM_STAKE_FAILED",
        "Failed to set minimum stake",
        error,
      );
      return null;
    }
  }

  /**
   * Withdraws protocol fees (only callable by registry owner)
   *
   * @param amount Amount to withdraw in wei
   * @returns Transaction response or null if failed
   */
  async withdrawProtocolFees(
    amount: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.registryContract || !this.signer) {
        throw new Error(
          "Registry contract not initialized or no signer available",
        );
      }

      if (amount <= BigInt(0)) {
        throw new Error("Amount must be greater than 0");
      }

      return await this.registryContract.withdrawProtocolFees(amount);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "WITHDRAW_FEES_FAILED",
        "Failed to withdraw protocol fees",
        error,
      );
      return null;
    }
  }

  /**
   * Updates the provider URL for the registry
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
          ? new ethers.Contract(
              this.registryAddress,
              RELAY_REGISTRY_ABI,
              this.signer,
            )
          : new ethers.Contract(
              this.registryAddress,
              RELAY_REGISTRY_ABI,
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
   * Updates the registry address
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
          ? new ethers.Contract(
              this.registryAddress,
              RELAY_REGISTRY_ABI,
              this.signer,
            )
          : new ethers.Contract(
              this.registryAddress,
              RELAY_REGISTRY_ABI,
              this.provider,
            );

        log(`Updated registry address to ${registryAddress}`);
        return true;
      }
      return false;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_ADDRESS_UPDATE_FAILED",
        "Failed to update registry address",
        error,
      );
      return false;
    }
  }

  /**
   * Updates the signer for the registry
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
          this.signer,
        );

        log(`Updated signer for RelayRegistry`);
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
