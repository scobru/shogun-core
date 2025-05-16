/**
 * SimpleRelay Class - Provides interaction with the Shogun Protocol SimpleRelay contract
 */
import { ethers } from "ethers";
import { BaseContract, ContractConfig, RelayConfig, RelayOperatingMode, RelayModeInfo } from "./base";
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
export declare class SimpleRelay extends BaseContract {
    /**
     * Create a new SimpleRelay instance
     * @param config - Configuration for the SimpleRelay
     */
    constructor(config: SimpleRelayConfig);
    /**
     * Check if a user's subscription is active
     * @param userAddress - The address of the user
     * @returns True if the subscription is active, false otherwise
     */
    isSubscriptionActive(userAddress: string): Promise<boolean>;
    /**
     * Get detailed subscription information for a user
     * @param userAddress - The address of the user
     * @returns The subscription information or null if not found
     */
    getUserSubscriptionInfo(userAddress: string): Promise<SubscriptionInfo | null>;
    /**
     * Check if a public key is authorized
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the public key is authorized, false otherwise
     */
    isAuthorizedByPubKey(pubKey: string | Uint8Array): Promise<boolean>;
    /**
     * Check if a public key is subscribed (alias for isAuthorizedByPubKey)
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the public key is subscribed, false otherwise
     */
    isSubscribed(pubKey: string | Uint8Array): Promise<boolean>;
    /**
     * Get the monthly subscription price
     * @returns The price in wei or null if the call fails
     */
    getPricePerMonth(): Promise<bigint | null>;
    /**
     * Get the number of days per month used for subscription calculations
     * @returns The days per month or null if the call fails
     */
    getDaysPerMonth(): Promise<number | null>;
    /**
     * Get the relay URL
     * @returns The relay URL or null if the call fails
     */
    getRelayUrl(): Promise<string | null>;
    /**
     * Get complete relay operational configuration
     * @returns The relay configuration or null if the call fails
     */
    getRelayOperationalConfig(): Promise<RelayConfig | null>;
    /**
     * Subscribe to the relay
     * @param months - Number of months to subscribe for
     * @param pubKey - The public key to register (hex string or Uint8Array)
     * @returns The transaction response or null if the call fails
     */
    subscribe(months: number, pubKey: string | Uint8Array): Promise<ethers.TransactionResponse | null>;
    /**
     * Set new price per month (owner only)
     * @param newPrice - The new price in wei
     * @returns The transaction response or null if the call fails
     */
    setPrice(newPrice: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Set new days per month for subscription calculations (owner only)
     * @param days - The new number of days (1-31)
     * @returns The transaction response or null if the call fails
     */
    setDaysPerMonth(days: number): Promise<ethers.TransactionResponse | null>;
    /**
     * Update the relay URL (owner only)
     * @param newUrl - The new URL
     * @returns The transaction response or null if the call fails
     */
    updateRelayUrl(newUrl: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Withdraw accumulated funds (owner only)
     * @returns The transaction response or null if the call fails
     */
    withdrawFunds(): Promise<ethers.TransactionResponse | null>;
    /**
     * Decommission the relay and withdraw all funds (owner only)
     * @returns The transaction response or null if the call fails
     */
    decommissionAndWithdrawAllFunds(): Promise<ethers.TransactionResponse | null>;
    /**
     * Execute a generic transaction (owner only)
     * @param to - The destination address
     * @param value - The amount of ETH to send
     * @param data - The calldata to send
     * @returns The transaction response and result or null if the call fails
     */
    execute(to: string, value: bigint, data: string): Promise<{
        success: boolean;
        result: string;
    } | null>;
    /**
     * Get the current operating mode of the relay
     * @returns The operating mode (SINGLE or PROTOCOL) or null if the call fails
     */
    getOperatingMode(): Promise<RelayOperatingMode | null>;
    /**
     * Get the registry address set in the relay
     * @returns The registry address or null if the call fails
     */
    getRegistryAddress(): Promise<string | null>;
    /**
     * Get the entry point address set in the relay
     * @returns The entry point address or null if the call fails
     */
    getEntryPointAddress(): Promise<string | null>;
    /**
     * Check if the relay is registered in the registry
     * @returns True if the relay is registered, false otherwise
     */
    isRegisteredInRegistry(): Promise<boolean>;
    /**
     * Get complete relay mode information
     * @returns The relay mode information or null if the call fails
     */
    getRelayMode(): Promise<RelayModeInfo | null>;
    /**
     * Set the registry address for the relay
     * @param registryAddress - The registry contract address
     * @param autoRegister - Whether to automatically register the relay in the registry
     * @param metadata - Metadata for registry registration (only used if autoRegister is true)
     * @returns The transaction response or null if the call fails
     */
    setRegistry(registryAddress: string, autoRegister?: boolean, metadata?: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Set the entry point address for the relay
     * @param entryPointAddress - The entry point contract address
     * @param enableProtocolMode - Whether to enable PROTOCOL mode automatically
     * @returns The transaction response or null if the call fails
     */
    setEntryPoint(entryPointAddress: string, enableProtocolMode?: boolean): Promise<ethers.TransactionResponse | null>;
    /**
     * Set the operating mode for the relay
     * @param mode - The new operating mode (SINGLE or PROTOCOL)
     * @returns The transaction response or null if the call fails
     */
    setOperatingMode(mode: RelayOperatingMode): Promise<ethers.TransactionResponse | null>;
    /**
     * Register the relay in the registry
     * @param metadata - Metadata for registry registration
     * @returns The transaction response or null if the call fails
     */
    registerInRegistry(metadata?: string): Promise<ethers.TransactionResponse | null>;
}
