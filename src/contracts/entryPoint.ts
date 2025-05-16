/**
 * EntryPoint Class - Provides interaction with the Shogun Protocol EntryPoint contract
 */

import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";
import {
  BaseContract,
  ContractConfig,
  ENTRY_POINT_ABI,
  EntryPointStats,
  SubscriptionDetails,
} from "./base";

export interface EntryPointConfig extends ContractConfig {
  entryPointAddress: string;
}

/**
 * EntryPoint - A class to interact with the Shogun Protocol EntryPoint contract
 */
export class EntryPoint extends BaseContract {
  /**
   * Create a new EntryPoint instance
   * @param config - Configuration for the EntryPoint
   */
  constructor(config: EntryPointConfig) {
    super(config.entryPointAddress, ENTRY_POINT_ABI, config);
  }

  /**
   * Get the registry address
   * @returns The registry address or null if the call fails
   */
  async getRegistryAddress(): Promise<string | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.registry();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_GET_REGISTRY_FAILED",
        "Failed to get registry address",
        error,
      );
      return null;
    }
  }

  /**
   * Get the service fee percentage
   * @returns The fee percentage or null if the call fails
   */
  async getServiceFeePercentage(): Promise<number | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      const feePercentage = await this.contract.serviceFeePercentage();
      return Number(feePercentage);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_GET_FEE_PERCENTAGE_FAILED",
        "Failed to get service fee percentage",
        error,
      );
      return null;
    }
  }

  /**
   * Calculate fee amount
   * @param amount - The amount to calculate fee on
   * @returns The fee amount or null if the call fails
   */
  async calculateFee(amount: bigint): Promise<bigint | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.calculateFee(amount);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_CALCULATE_FEE_FAILED",
        "Failed to calculate fee",
        error,
      );
      return null;
    }
  }

  /**
   * Check if a user has an active subscription on a relay
   * @param userAddress - The address of the user
   * @param relayAddress - The address of the relay
   * @returns True if the user has an active subscription, false otherwise
   */
  async checkSubscription(
    userAddress: string,
    relayAddress: string,
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.checkSubscription(userAddress, relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_CHECK_SUBSCRIPTION_FAILED",
        `Failed to check subscription for user ${userAddress} on relay ${relayAddress}`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if a user has a registered public key on a relay
   * @param userAddress - The address of the user
   * @param relayAddress - The address of the relay
   * @returns True if the user has a registered public key, false otherwise
   */
  async hasRegisteredPubKey(
    userAddress: string,
    relayAddress: string,
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.hasRegisteredPubKey(userAddress, relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_HAS_REGISTERED_PUBKEY_FAILED",
        `Failed to check if user ${userAddress} has registered pubkey on relay ${relayAddress}`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if a specific public key is subscribed on a relay
   * @param relayAddress - The address of the relay
   * @param pubKey - The public key to check (hex string or Uint8Array)
   * @returns True if the public key is subscribed, false otherwise
   */
  async isPubKeySubscribed(
    relayAddress: string,
    pubKey: string | Uint8Array,
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      return await this.contract.isPubKeySubscribed(relayAddress, pubKeyHex);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_IS_PUBKEY_SUBSCRIBED_FAILED",
        `Failed to check if pubkey is subscribed on relay ${relayAddress}`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if public keys are subscribed on multiple relays
   * @param relayAddresses - Array of relay addresses
   * @param pubKeys - Array of public keys (hex strings or Uint8Arrays)
   * @returns Array of booleans indicating subscription status for each relay/pubkey pair
   */
  async batchCheckPubKeySubscription(
    relayAddresses: string[],
    pubKeys: (string | Uint8Array)[],
  ): Promise<boolean[]> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (relayAddresses.length !== pubKeys.length) {
        throw new Error("Array lengths must match");
      }

      // Convert Uint8Arrays to hex strings
      const pubKeyHexes = pubKeys.map((pk) =>
        pk instanceof Uint8Array ? ethers.hexlify(pk) : pk,
      );

      return await this.contract.batchCheckPubKeySubscription(
        relayAddresses,
        pubKeyHexes,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_BATCH_CHECK_PUBKEYS_FAILED",
        "Failed to batch check public key subscriptions",
        error,
      );
      return Array(relayAddresses.length).fill(false);
    }
  }

  /**
   * Get detailed subscription information
   * @param userAddress - The address of the user
   * @param relayAddress - The address of the relay
   * @returns The subscription details or null if not found
   */
  async getSubscriptionDetails(
    userAddress: string,
    relayAddress: string,
  ): Promise<SubscriptionDetails | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      const [expires, pubKey] = await this.contract.getSubscriptionDetails(
        userAddress,
        relayAddress,
      );

      return {
        expires,
        pubKey: ethers.hexlify(pubKey),
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_GET_SUBSCRIPTION_DETAILS_FAILED",
        `Failed to get subscription details for user ${userAddress} on relay ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if a user has active subscriptions on multiple relays
   * @param userAddress - The address of the user
   * @param relayAddresses - Array of relay addresses
   * @returns Array of booleans indicating subscription status for each relay
   */
  async batchCheckSubscriptions(
    userAddress: string,
    relayAddresses: string[],
  ): Promise<boolean[]> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.batchCheckSubscriptions(
        userAddress,
        relayAddresses,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_BATCH_CHECK_SUBSCRIPTIONS_FAILED",
        `Failed to batch check subscriptions for user ${userAddress}`,
        error,
      );
      return Array(relayAddresses.length).fill(false);
    }
  }

  /**
   * Check if a user has registered public keys on multiple relays
   * @param userAddress - The address of the user
   * @param relayAddresses - Array of relay addresses
   * @returns Array of booleans indicating if public keys are registered for each relay
   */
  async batchCheckPubKeys(
    userAddress: string,
    relayAddresses: string[],
  ): Promise<boolean[]> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      return await this.contract.batchCheckPubKeys(userAddress, relayAddresses);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_BATCH_CHECK_PUBKEYS_FAILED",
        `Failed to batch check pubkeys for user ${userAddress}`,
        error,
      );
      return Array(relayAddresses.length).fill(false);
    }
  }

  /**
   * Get EntryPoint statistics
   * @returns The EntryPoint statistics or null if the call fails
   */
  async getStatistics(): Promise<EntryPointStats | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      const [
        userCount,
        totalSubscriptions,
        totalViaUrl,
        totalViaDirect,
        totalAmountProcessed,
        totalFeesCollected,
        currentBalance,
      ] = await this.contract.getStatistics();

      return {
        userCount,
        totalSubscriptions,
        totalViaUrl,
        totalViaDirect,
        totalAmountProcessed,
        totalFeesCollected,
        currentBalance,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_GET_STATISTICS_FAILED",
        "Failed to get EntryPoint statistics",
        error,
      );
      return null;
    }
  }

  /**
   * Subscribe to a relay via URL
   * @param relayUrl - The URL of the relay
   * @param months - Number of months to subscribe for
   * @param pubKey - The public key to register (hex string or Uint8Array)
   * @param value - The payment amount (will be calculated if not provided)
   * @returns The transaction response or null if the call fails
   */
  async subscribeViaUrl(
    relayUrl: string,
    months: number,
    pubKey: string | Uint8Array,
    value?: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      // If value is not provided, we need to query the correct amount
      // This is a simplified estimation and may not be accurate
      // In production, you would need to get the price from the relay and add the service fee
      const txOptions: { value: bigint } = {
        value: value || ethers.parseEther("0.01"), // Default value as a placeholder
      };

      return await this.contract.subscribeViaUrl(
        relayUrl,
        months,
        pubKeyHex,
        txOptions,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_SUBSCRIBE_VIA_URL_FAILED",
        `Failed to subscribe via URL ${relayUrl} for ${months} months`,
        error,
      );
      return null;
    }
  }

  /**
   * Subscribe directly to a relay
   * @param relayAddress - The address of the relay
   * @param months - Number of months to subscribe for
   * @param pubKey - The public key to register (hex string or Uint8Array)
   * @param value - The payment amount (will be calculated if not provided)
   * @returns The transaction response or null if the call fails
   */
  async subscribeDirect(
    relayAddress: string,
    months: number,
    pubKey: string | Uint8Array,
    value?: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      // Convert Uint8Array to hex string if needed
      const pubKeyHex =
        pubKey instanceof Uint8Array ? ethers.hexlify(pubKey) : pubKey;

      // If value is not provided, we need to query the correct amount
      // This is a simplified estimation and may not be accurate
      // In production, you would need to get the price from the relay and add the service fee
      const txOptions: { value: bigint } = {
        value: value || ethers.parseEther("0.01"), // Default value as a placeholder
      };

      return await this.contract.subscribeDirect(
        relayAddress,
        months,
        pubKeyHex,
        txOptions,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_SUBSCRIBE_DIRECT_FAILED",
        `Failed to subscribe directly to relay ${relayAddress} for ${months} months`,
        error,
      );
      return null;
    }
  }

  /**
   * Subscribe to multiple relays in a single transaction
   * @param relayAddresses - Array of relay addresses
   * @param months - Number of months to subscribe for
   * @param pubKeys - Array of public keys (hex strings or Uint8Arrays)
   * @param value - The payment amount (will be calculated if not provided)
   * @returns The transaction response or null if the call fails
   */
  async batchSubscribe(
    relayAddresses: string[],
    months: number,
    pubKeys: (string | Uint8Array)[],
    value?: bigint,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      if (relayAddresses.length !== pubKeys.length) {
        throw new Error("Array lengths must match");
      }

      // Convert Uint8Arrays to hex strings
      const pubKeyHexes = pubKeys.map((pk) =>
        pk instanceof Uint8Array ? ethers.hexlify(pk) : pk,
      );

      // If value is not provided, we need to query the correct amount
      // This is a simplified estimation and may not be accurate
      // In production, you would need to calculate based on all relay prices and service fees
      const txOptions: { value: bigint } = {
        value:
          value || ethers.parseEther("0.01") * BigInt(relayAddresses.length),
      };

      return await this.contract.batchSubscribe(
        relayAddresses,
        months,
        pubKeyHexes,
        txOptions,
      );
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_BATCH_SUBSCRIBE_FAILED",
        `Failed to batch subscribe to ${relayAddresses.length} relays for ${months} months`,
        error,
      );
      return null;
    }
  }

  /**
   * Update the registry address (owner only)
   * @param newRegistryAddress - The new registry address
   * @returns The transaction response or null if the call fails
   */
  async updateRegistry(
    newRegistryAddress: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.updateRegistry(newRegistryAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_UPDATE_REGISTRY_FAILED",
        `Failed to update registry to ${newRegistryAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Update the service fee percentage (owner only)
   * @param newFeePercentage - The new fee percentage
   * @returns The transaction response or null if the call fails
   */
  async updateServiceFee(
    newFeePercentage: number,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.updateServiceFee(newFeePercentage);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_UPDATE_SERVICE_FEE_FAILED",
        `Failed to update service fee to ${newFeePercentage}`,
        error,
      );
      return null;
    }
  }

  /**
   * Withdraw accumulated fees (owner only)
   * @returns The transaction response or null if the call fails
   */
  async withdrawFees(): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.withdrawFees();
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_WITHDRAW_FEES_FAILED",
        "Failed to withdraw fees",
        error,
      );
      return null;
    }
  }

  /**
   * Check if a relay is in protocol mode
   * @param relayAddress - The address of the relay
   * @returns True if the relay is in protocol mode, false otherwise
   */
  async isRelayInProtocolMode(relayAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("EntryPoint contract not initialized");
      }

      const mode = await this.contract.isRelayInProtocolMode(relayAddress);
      return mode === 1; // 1 is PROTOCOL
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "ENTRY_POINT_IS_RELAY_IN_PROTOCOL_MODE_FAILED",
        `Failed to check if relay ${relayAddress} is in protocol mode`,
        error,
      );
      return false;
    }
  }
}
