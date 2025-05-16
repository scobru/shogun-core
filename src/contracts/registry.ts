/**
 * Registry Class - Provides interaction with the Shogun Protocol Registry contract
 */

import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { log, logError } from "../utils/logger";
import {
  BaseContract,
  ContractConfig,
  REGISTRY_ABI,
  RelayInfo,
  RelayPage,
} from "./base";

export interface RegistryConfig extends ContractConfig {
  // Registry specific config properties could be added here
}

/**
 * Registry - A class to interact with the Shogun Protocol Registry contract
 */
export class Registry extends BaseContract {
  /**
   * Create a new Registry instance
   * @param config - Configuration for the Registry
   */
  constructor(config: RegistryConfig) {
    super(config.registryAddress, REGISTRY_ABI, config);
  }

  /**
   * Check if a relay is registered
   * @param relayAddress - The address of the relay to check
   * @returns True if the relay is registered, false otherwise
   */
  async isRegisteredRelay(relayAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.contract.isRegisteredRelay(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_IS_REGISTERED_FAILED",
        `Failed to check if relay at ${relayAddress} is registered`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if a relay is active
   * @param relayAddress - The address of the relay to check
   * @returns True if the relay is active, false otherwise
   */
  async isRelayActive(relayAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.contract.isRelayActive(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_IS_ACTIVE_FAILED",
        `Failed to check if relay at ${relayAddress} is active`,
        error,
      );
      return false;
    }
  }

  /**
   * Find a relay by its URL
   * @param url - The URL of the relay to find
   * @returns The address of the relay or zero address if not found
   */
  async findRelayByUrl(url: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      return await this.contract.findRelayByUrl(url);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_FIND_RELAY_FAILED",
        `Failed to find relay with URL ${url}`,
        error,
      );
      return ethers.ZeroAddress;
    }
  }

  /**
   * Get information about a specific relay
   * @param relayAddress - The address of the relay
   * @returns The relay information or null if not found
   */
  async getRelayInfo(relayAddress: string): Promise<RelayInfo | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      const [owner, url, metadata, registrationTime, active] =
        await this.contract.getRelayInfo(relayAddress);

      return {
        owner,
        url,
        metadata,
        registrationTime,
        active,
      };
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_GET_RELAY_INFO_FAILED",
        `Failed to get relay info for ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Get the number of relays owned by a specific address
   * @param ownerAddress - The address of the owner
   * @returns The number of relays or 0 if the call fails
   */
  async getRelayCountByOwner(ownerAddress: string): Promise<number> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      const count = await this.contract.getRelayCountByOwner(ownerAddress);
      return Number(count);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_GET_RELAY_COUNT_FAILED",
        `Failed to get relay count for owner ${ownerAddress}`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get relays owned by a specific address with pagination
   * @param ownerAddress - The address of the owner
   * @param offset - Starting index for pagination
   * @param limit - Maximum number of items to return
   * @returns Page of relay addresses or null if the call fails
   */
  async getRelaysByOwner(
    ownerAddress: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<RelayPage | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      const result = await this.contract.getRelaysByOwner(
        ownerAddress,
        offset,
        limit,
      );
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_GET_RELAYS_BY_OWNER_FAILED",
        `Failed to get relays for owner ${ownerAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all relays with pagination
   * @param onlyActive - If true, only return active relays
   * @param offset - Starting index for pagination
   * @param limit - Maximum number of items to return
   * @returns Page of relay addresses or null if the call fails
   */
  async getAllRelays(
    onlyActive: boolean = true,
    offset: number = 0,
    limit: number = 10,
  ): Promise<RelayPage | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      const result = await this.contract.getAllRelays(
        onlyActive,
        offset,
        limit,
      );
      return result;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_GET_ALL_RELAYS_FAILED",
        "Failed to get all relays",
        error,
      );
      return null;
    }
  }

  /**
   * Register a new relay
   * @param relayAddress - The address of the relay contract
   * @param url - The URL of the relay
   * @param metadata - Additional metadata for the relay (JSON string)
   * @returns The transaction response or null if the call fails
   */
  async registerRelay(
    relayAddress: string,
    url: string,
    metadata: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.registerRelay(relayAddress, url, metadata);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_REGISTER_RELAY_FAILED",
        `Failed to register relay at ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Update relay information
   * @param relayAddress - The address of the relay to update
   * @param newUrl - The new URL (empty to keep current)
   * @param newMetadata - The new metadata (empty to keep current)
   * @returns The transaction response or null if the call fails
   */
  async updateRelay(
    relayAddress: string,
    newUrl: string = "",
    newMetadata: string = "",
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.updateRelay(relayAddress, newUrl, newMetadata);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_UPDATE_RELAY_FAILED",
        `Failed to update relay at ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Deactivate a relay
   * @param relayAddress - The address of the relay to deactivate
   * @returns The transaction response or null if the call fails
   */
  async deactivateRelay(
    relayAddress: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.deactivateRelay(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_DEACTIVATE_RELAY_FAILED",
        `Failed to deactivate relay at ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Reactivate a relay
   * @param relayAddress - The address of the relay to reactivate
   * @returns The transaction response or null if the call fails
   */
  async reactivateRelay(
    relayAddress: string,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.reactivateRelay(relayAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_REACTIVATE_RELAY_FAILED",
        `Failed to reactivate relay at ${relayAddress}`,
        error,
      );
      return null;
    }
  }

  /**
   * Set whether registration is open
   * @param isOpen - Whether registration should be open
   * @returns The transaction response or null if the call fails
   */
  async setRegistrationOpen(
    isOpen: boolean,
  ): Promise<ethers.TransactionResponse | null> {
    try {
      if (!this.contract) {
        throw new Error("Registry contract not initialized");
      }

      if (!this.signer) {
        throw new Error("Signer required for this operation");
      }

      return await this.contract.setRegistrationOpen(isOpen);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.CONTRACT,
        "REGISTRY_SET_REGISTRATION_OPEN_FAILED",
        `Failed to set registration open to ${isOpen}`,
        error,
      );
      return null;
    }
  }
}
