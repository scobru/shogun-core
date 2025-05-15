import { ethers } from "ethers";
import { ShogunCore } from "../index";
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
export declare class RelayRegistry {
    private registryContract;
    private provider;
    private signer;
    private registryAddress;
    private shogun?;
    /**
     * Creates a new RelayRegistry instance
     *
     * @param config Configuration for the relay registry
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional ethers.Signer instance to use for contract interactions
     */
    constructor(config: RelayRegistryConfig, shogun?: ShogunCore, signer?: ethers.Signer);
    /**
     * Gets all registered relay contracts from the registry
     *
     * @returns Array of relay contract addresses
     */
    getAllRelays(): Promise<string[]>;
    /**
     * Gets the total number of registered relays
     *
     * @returns Number of registered relays
     */
    getRelayCount(): Promise<number>;
    /**
     * Checks if an address is a registered relay
     *
     * @param relayAddress Relay contract address to check
     * @returns True if registered, false otherwise
     */
    isRegistered(relayAddress: string): Promise<boolean>;
    /**
     * Gets detailed information about a relay
     *
     * @param relayAddress The address of the relay to query
     * @returns Detailed relay information or null if not found
     */
    getRelayInfo(relayAddress: string): Promise<RegistryRelayInfo | null>;
    /**
     * Gets system-wide statistics from the relay registry
     *
     * @returns System statistics or null if failed
     */
    getSystemStats(): Promise<RegistrySystemStats | null>;
    /**
     * Gets the current protocol configuration
     *
     * @returns Protocol configuration or null if failed
     */
    getProtocolConfig(): Promise<ProtocolConfig | null>;
    /**
     * Checks if a user is subscribed to a specific relay
     *
     * @param relayAddress The relay contract address to check
     * @param userAddress The user's Ethereum address
     * @returns True if the user is subscribed, false otherwise
     */
    isUserSubscribedToRelay(relayAddress: string, userAddress: string): Promise<boolean>;
    /**
     * Gets all relays a user is actively subscribed to
     *
     * @param userAddress The Ethereum address to check
     * @returns Array of relay addresses the user is subscribed to
     */
    getUserActiveRelays(userAddress: string): Promise<string[]>;
    /**
     * Gets the protocol subscription price
     *
     * @returns The price per month in wei (as BigInt) or null if failed
     */
    getProtocolPrice(): Promise<bigint | null>;
    /**
     * Subscribes a user to a relay through the registry (requires a signer)
     *
     * @param relayAddress The relay contract address to subscribe to
     * @param months Number of months to subscribe for
     * @param pubKey Optional public key to associate with the subscription
     * @returns Transaction response or null if failed
     */
    subscribeToRelay(relayAddress: string, months: number, pubKey?: string | Uint8Array): Promise<ethers.TransactionResponse | null>;
    /**
     * Registers a relay contract in the registry (only callable by relay contract)
     *
     * @param relayOwner Owner address of the relay
     * @param url WebSocket URL of the relay
     * @param stake Amount staked for the relay
     * @returns Transaction response or null if failed
     */
    registerRelayContract(relayOwner: string, url: string, stake: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Updates the stake amount for a relay (only callable by relay contract)
     *
     * @param relayContract Relay contract address
     * @param newStake New stake amount
     * @returns Transaction response or null if failed
     */
    updateRelayStake(relayContract: string, newStake: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Unregisters a relay contract from the registry (only callable by relay owner)
     *
     * @param relayContractAddress Relay contract address to unregister
     * @returns Transaction response or null if failed
     */
    unregisterRelayContract(relayContractAddress: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Updates the URL for a relay contract (only callable by relay owner)
     *
     * @param relayContractAddress Relay contract address to update
     * @param newUrl New WebSocket URL
     * @returns Transaction response or null if failed
     */
    updateRelayUrl(relayContractAddress: string, newUrl: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Checks if reward distribution is due
     *
     * @returns True if distribution is due, false otherwise
     */
    isDistributionDue(): Promise<boolean>;
    /**
     * Distributes rewards to relay owners (can be called by anyone)
     *
     * @returns Transaction response or null if failed
     */
    distributeRewards(): Promise<ethers.TransactionResponse | null>;
    /**
     * Sets the protocol price (only callable by registry owner)
     *
     * @param newPrice New protocol price in wei
     * @returns Transaction response or null if failed
     */
    setProtocolPrice(newPrice: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Sets the protocol fee percentage (only callable by registry owner)
     *
     * @param newPercentage New fee percentage (1-100)
     * @returns Transaction response or null if failed
     */
    setProtocolFeePercentage(newPercentage: number): Promise<ethers.TransactionResponse | null>;
    /**
     * Sets the distribution period (only callable by registry owner)
     *
     * @param newPeriod New distribution period in seconds
     * @returns Transaction response or null if failed
     */
    setDistributionPeriod(newPeriod: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Sets the minimum stake required (only callable by registry owner)
     *
     * @param newMinStake New minimum stake in wei
     * @returns Transaction response or null if failed
     */
    setMinimumStake(newMinStake: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Withdraws protocol fees (only callable by registry owner)
     *
     * @param amount Amount to withdraw in wei
     * @returns Transaction response or null if failed
     */
    withdrawProtocolFees(amount: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Updates the provider URL for the registry
     *
     * @param providerUrl New provider URL to use
     * @returns True if provider was updated successfully
     */
    setProviderUrl(providerUrl: string): boolean;
    /**
     * Updates the registry address
     *
     * @param registryAddress New registry address to use
     * @returns True if registry address was updated successfully
     */
    setRegistryAddress(registryAddress: string): boolean;
    /**
     * Updates the signer for the registry
     *
     * @param signer New ethers.Signer instance to use
     * @returns True if signer was updated successfully
     */
    setSigner(signer: ethers.Signer): boolean;
}
