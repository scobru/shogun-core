/**
 * Registry Class - Provides interaction with the Shogun Protocol Registry contract
 */
import { ethers } from "ethers";
import { BaseContract, ContractConfig, RelayInfo, RelayPage } from "./base";
export interface RegistryConfig extends ContractConfig {
}
/**
 * Registry - A class to interact with the Shogun Protocol Registry contract
 */
export declare class Registry extends BaseContract {
    /**
     * Create a new Registry instance
     * @param config - Configuration for the Registry
     */
    constructor(config: RegistryConfig);
    /**
     * Check if a relay is registered
     * @param relayAddress - The address of the relay to check
     * @returns True if the relay is registered, false otherwise
     */
    isRegisteredRelay(relayAddress: string): Promise<boolean>;
    /**
     * Check if a relay is active
     * @param relayAddress - The address of the relay to check
     * @returns True if the relay is active, false otherwise
     */
    isRelayActive(relayAddress: string): Promise<boolean>;
    /**
     * Find a relay by its URL
     * @param url - The URL of the relay to find
     * @returns The address of the relay or zero address if not found
     */
    findRelayByUrl(url: string): Promise<string>;
    /**
     * Get information about a specific relay
     * @param relayAddress - The address of the relay
     * @returns The relay information or null if not found
     */
    getRelayInfo(relayAddress: string): Promise<RelayInfo | null>;
    /**
     * Get the number of relays owned by a specific address
     * @param ownerAddress - The address of the owner
     * @returns The number of relays or 0 if the call fails
     */
    getRelayCountByOwner(ownerAddress: string): Promise<number>;
    /**
     * Get relays owned by a specific address with pagination
     * @param ownerAddress - The address of the owner
     * @param offset - Starting index for pagination
     * @param limit - Maximum number of items to return
     * @returns Page of relay addresses or null if the call fails
     */
    getRelaysByOwner(ownerAddress: string, offset?: number, limit?: number): Promise<RelayPage | null>;
    /**
     * Get all relays with pagination
     * @param onlyActive - If true, only return active relays
     * @param offset - Starting index for pagination
     * @param limit - Maximum number of items to return
     * @returns Page of relay addresses or null if the call fails
     */
    getAllRelays(onlyActive?: boolean, offset?: number, limit?: number): Promise<RelayPage | null>;
    /**
     * Register a new relay
     * @param relayAddress - The address of the relay contract
     * @param url - The URL of the relay
     * @param metadata - Additional metadata for the relay (JSON string)
     * @returns The transaction response or null if the call fails
     */
    registerRelay(relayAddress: string, url: string, metadata: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Update relay information
     * @param relayAddress - The address of the relay to update
     * @param newUrl - The new URL (empty to keep current)
     * @param newMetadata - The new metadata (empty to keep current)
     * @returns The transaction response or null if the call fails
     */
    updateRelay(relayAddress: string, newUrl?: string, newMetadata?: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Deactivate a relay
     * @param relayAddress - The address of the relay to deactivate
     * @returns The transaction response or null if the call fails
     */
    deactivateRelay(relayAddress: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Reactivate a relay
     * @param relayAddress - The address of the relay to reactivate
     * @returns The transaction response or null if the call fails
     */
    reactivateRelay(relayAddress: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Set whether registration is open
     * @param isOpen - Whether registration should be open
     * @returns The transaction response or null if the call fails
     */
    setRegistrationOpen(isOpen: boolean): Promise<ethers.TransactionResponse | null>;
}
