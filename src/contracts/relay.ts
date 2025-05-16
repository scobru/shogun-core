/**
 * SimpleRelay Class - Provides interaction with the Shogun Protocol SimpleRelay contract
 */

import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";
import {
  BaseContract,
  ContractConfig,
  RelayConfig,
  RelayOperatingMode,
  RelayModeInfo,
  SIMPLE_RELAY_ABI,
} from "./base";

export interface SimpleRelayConfig extends ContractConfig {
  relayAddress: string;
}

export interface SubscriptionInfo {
  expires: bigint;
  pubKey: string;
  isActive: boolean;
}

/**
 * SimpleRelay - A class to interact with the Shogun Protocol SimpleRelay contract
 */
export class SimpleRelay extends BaseContract {
  /**
   * Create a new SimpleRelay instance
   * @param config - Configuration for the SimpleRelay
   */
  constructor(config: SimpleRelayConfig) {
    super(config.relayAddress, SIMPLE_RELAY_ABI, config);
  }

  /**
   * Check if a user's subscription is active
   * @param userAddress - The address of the user
   * @returns True if the subscription is active, false otherwise
   */
  async isSubscriptionActive(userAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.isSubscriptionActive(userAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_IS_SUBSCRIPTION_ACTIVE_FAILED",
        `Failed to check if subscription is active for user ${userAddress}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get detailed subscription information for a user
   * @param userAddress - The address of the user
   * @returns The subscription information or null if not found
   */
  async getUserSubscriptionInfo(
    userAddress: string,
  ): Promise<SubscriptionInfo | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      const [expires, pubKey] =
        await this.contract.getUserSubscriptionInfo(userAddress);
      const isActive = await this.contract.isSubscriptionActive(userAddress);

      return {
        expires,
        pubKey: ethers.hexlify(pubKey),
        isActive,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_SUBSCRIPTION_INFO_FAILED",
        `Failed to get subscription info for user ${userAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if a public key is authorized
   * @param pubKey - The public key to check (hex string or Uint8Array)
   * @returns True if the public key is authorized, false otherwise
   */
  async isAuthorizedByPubKey(pubKey: string | Uint8Array): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      return await this.contract.isAuthorizedByPubKey(pubKeyHex);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_IS_AUTHORIZED_FAILED",
        "Failed to check if public key is authorized",
        error,
      );
      return false;
    }
  }

  /**
   * Check if a public key is subscribed (alias for isAuthorizedByPubKey)
   * @param pubKey - The public key to check (hex string or Uint8Array)
   * @returns True if the public key is subscribed, false otherwise
   */
  async isSubscribed(pubKey: string | Uint8Array): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      return await this.contract.isSubscribed(pubKeyHex);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_IS_SUBSCRIBED_FAILED",
        "Failed to check if public key is subscribed",
        error,
      );
      return false;
    }
  }

  /**
   * Get the monthly subscription price
   * @returns The price in wei or null if the call fails
   */
  async getPricePerMonth(): Promise<bigint | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.pricePerMonth();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_PRICE_FAILED",
        "Failed to get price per month",
        error,
      );
      return null;
    }
  }

  /**
   * Get the number of days per month used for subscription calculations
   * @returns The days per month or null if the call fails
   */
  async getDaysPerMonth(): Promise<number | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      const days = await this.contract.daysPerMonth();
      return Number(days);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_DAYS_PER_MONTH_FAILED",
        "Failed to get days per month",
        error,
      );
      return null;
    }
  }

  /**
   * Get the relay URL
   * @returns The relay URL or null if the call fails
   */
  async getRelayUrl(): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.relayUrl();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_URL_FAILED",
        "Failed to get relay URL",
        error,
      );
      return null;
    }
  }

  /**
   * Get complete relay operational configuration
   * @returns The relay configuration or null if the call fails
   */
  async getRelayOperationalConfig(): Promise<RelayConfig | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      const [url, price, daysInMonth] =
        await this.contract.getRelayOperationalConfig();

      return {
        url,
        price,
        daysInMonth,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_CONFIG_FAILED",
        "Failed to get relay operational config",
        error,
      );
      return null;
    }
  }

  /**
   * Subscribe to the relay
   * @param months - Number of months to subscribe for
   * @param pubKey - The public key to register (hex string or Uint8Array)
   * @returns The transaction response or null if the call fails
   */
  async subscribe(
    months: number,
    pubKey: string | Uint8Array,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      // Get price
      const pricePerMonth = await this.contract.pricePerMonth();
      const totalAmount = pricePerMonth * BigInt(months);

      // Send transaction
      return await this.contract.subscribe(months, pubKeyHex, {
        value: totalAmount,
      });
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SUBSCRIBE_FAILED",
        `Failed to subscribe for ${months} months`,
        error,
      );
      return null;
    }
  }

  /**
   * Set new price per month (owner only)
   * @param newPrice - The new price in wei
   * @returns The transaction response or null if the call fails
   */
  async setPrice(newPrice: bigint): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.setPrice(newPrice);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SET_PRICE_FAILED",
        "Failed to set new price",
        error,
      );
      return null;
    }
  }

  /**
   * Set new days per month for subscription calculations (owner only)
   * @param days - The new number of days (1-31)
   * @returns The transaction response or null if the call fails
   */
  async setDaysPerMonth(
    days: number,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      if (days < 1 || days > 31) {
        throw new Error("Days must be between 1 and 31");
      }

      return await this.contract.setDaysPerMonth(days);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SET_DAYS_PER_MONTH_FAILED",
        `Failed to set days per month to ${days}`,
        error,
      );
      return null;
    }
  }

  /**
   * Update the relay URL (owner only)
   * @param newUrl - The new URL
   * @returns The transaction response or null if the call fails
   */
  async updateRelayUrl(
    newUrl: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.updateRelayUrl(newUrl);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_UPDATE_URL_FAILED",
        `Failed to update URL to ${newUrl}`,
        error,
      );
      return null;
    }
  }

  /**
   * Withdraw accumulated funds (owner only)
   * @returns The transaction response or null if the call fails
   */
  async withdrawFunds(): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.withdrawFunds();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_WITHDRAW_FUNDS_FAILED",
        "Failed to withdraw funds",
        error,
      );
      return null;
    }
  }

  /**
   * Decommission the relay and withdraw all funds (owner only)
   * @returns The transaction response or null if the call fails
   */
  async decommissionAndWithdrawAllFunds(): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.decommissionAndWithdrawAllFunds();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_DECOMMISSION_FAILED",
        "Failed to decommission relay",
        error,
      );
      return null;
    }
  }

  /**
   * Execute a generic transaction (owner only)
   * @param to - The destination address
   * @param value - The amount of ETH to send
   * @param data - The calldata to send
   * @returns The transaction response and result or null if the call fails
   */
  async execute(
    to: string,
    value: bigint,
    data: string,
  ): Promise<{ success: boolean; result: string } | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      const [success, result] = await this.contract.execute(to, value, data);
      return { success, result: ethers.hexlify(result) };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_EXECUTE_FAILED",
        `Failed to execute transaction to ${to}`,
        error,
      );
      return null;
    }
  }

  // --- Protocol Integration Functions ---

  /**
   * Get the current operating mode of the relay
   * @returns The operating mode (SINGLE or PROTOCOL) or null if the call fails
   */
  async getOperatingMode(): Promise<RelayOperatingMode | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      const mode = await this.contract.mode();
      return mode as RelayOperatingMode;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_MODE_FAILED",
        "Failed to get relay operating mode",
        error,
      );
      return null;
    }
  }

  /**
   * Get the registry address set in the relay
   * @returns The registry address or null if the call fails
   */
  async getRegistryAddress(): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.registryAddress();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_REGISTRY_ADDRESS_FAILED",
        "Failed to get registry address",
        error,
      );
      return null;
    }
  }

  /**
   * Get the entry point address set in the relay
   * @returns The entry point address or null if the call fails
   */
  async getEntryPointAddress(): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.entryPointAddress();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_ENTRY_POINT_ADDRESS_FAILED",
        "Failed to get entry point address",
        error,
      );
      return null;
    }
  }

  /**
   * Check if the relay is registered in the registry
   * @returns True if the relay is registered, false otherwise
   */
  async isRegisteredInRegistry(): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      return await this.contract.isRegisteredInRegistry();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_IS_REGISTERED_FAILED",
        "Failed to check if relay is registered in registry",
        error,
      );
      return false;
    }
  }

  /**
   * Get complete relay mode information
   * @returns The relay mode information or null if the call fails
   */
  async getRelayMode(): Promise<RelayModeInfo | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      const [mode, registry, entryPoint, isRegistered] =
        await this.contract.getRelayMode();

      return {
        mode: mode as RelayOperatingMode,
        registryAddress: registry,
        entryPointAddress: entryPoint,
        isRegistered,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_GET_MODE_INFO_FAILED",
        "Failed to get relay mode information",
        error,
      );
      return null;
    }
  }

  /**
   * Set the registry address for the relay
   * @param registryAddress - The registry contract address
   * @param autoRegister - Whether to automatically register the relay in the registry
   * @param metadata - Metadata for registry registration (only used if autoRegister is true)
   * @returns The transaction response or null if the call fails
   */
  async setRegistry(
    registryAddress: string,
    autoRegister: boolean = false,
    metadata: string = "",
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.setRegistry(
        registryAddress,
        autoRegister,
        metadata,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SET_REGISTRY_FAILED",
        `Failed to set registry to ${registryAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Set the entry point address for the relay
   * @param entryPointAddress - The entry point contract address
   * @param enableProtocolMode - Whether to enable PROTOCOL mode automatically
   * @returns The transaction response or null if the call fails
   */
  async setEntryPoint(
    entryPointAddress: string,
    enableProtocolMode: boolean = false,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.setEntryPoint(
        entryPointAddress,
        enableProtocolMode,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SET_ENTRY_POINT_FAILED",
        `Failed to set entry point to ${entryPointAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Set the operating mode for the relay
   * @param mode - The new operating mode (SINGLE or PROTOCOL)
   * @returns The transaction response or null if the call fails
   */
  async setOperatingMode(
    mode: RelayOperatingMode,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.setOperatingMode(mode);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_SET_MODE_FAILED",
        `Failed to set operating mode to ${mode}`,
        error,
      );
      return null;
    }
  }

  /**
   * Register the relay in the registry
   * @param metadata - Metadata for registry registration
   * @returns The transaction response or null if the call fails
   */
  async registerInRegistry(
    metadata: string = "",
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("SimpleRelay contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.registerInRegistry(metadata);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "RELAY_REGISTER_IN_REGISTRY_FAILED",
        "Failed to register relay in registry",
        error,
      );
      return null;
    }
  }
}
