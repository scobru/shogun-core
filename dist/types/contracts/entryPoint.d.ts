/**
 * EntryPoint Class - Provides interaction with the Shogun Protocol EntryPoint contract
 */
import { ethers } from "ethers";
import { BaseContract, ContractConfig, EntryPointStats, SubscriptionDetails } from "./base";
export interface EntryPointConfig extends ContractConfig {
    entryPointAddress: string;
}
/**
 * EntryPoint - A class to interact with the Shogun Protocol EntryPoint contract
 */
export declare class EntryPoint extends BaseContract {
    /**
     * Create a new EntryPoint instance
     * @param config - Configuration for the EntryPoint
     */
    constructor(config: EntryPointConfig);
    /**
     * Get the registry address
     * @returns The registry address or null if the call fails
     */
    getRegistryAddress(): Promise<string | null>;
    /**
     * Get the service fee percentage
     * @returns The fee percentage or null if the call fails
     */
    getServiceFeePercentage(): Promise<number | null>;
    /**
     * Calculate fee amount
     * @param amount - The amount to calculate fee on
     * @returns The fee amount or null if the call fails
     */
    calculateFee(amount: bigint): Promise<bigint | null>;
    /**
     * Check if a user has an active subscription on a relay
     * @param userAddress - The address of the user
     * @param relayAddress - The address of the relay
     * @returns True if the user has an active subscription, false otherwise
     */
    checkSubscription(userAddress: string, relayAddress: string): Promise<boolean>;
    /**
     * Check if a user has a registered public key on a relay
     * @param userAddress - The address of the user
     * @param relayAddress - The address of the relay
     * @returns True if the user has a registered public key, false otherwise
     */
    hasRegisteredPubKey(userAddress: string, relayAddress: string): Promise<boolean>;
    /**
     * Check if a specific public key is subscribed on a relay
     * @param relayAddress - The address of the relay
     * @param pubKey - The public key to check (hex string or Uint8Array)
     * @returns True if the public key is subscribed, false otherwise
     */
    isPubKeySubscribed(relayAddress: string, pubKey: string | Uint8Array): Promise<boolean>;
    /**
     * Check if public keys are subscribed on multiple relays
     * @param relayAddresses - Array of relay addresses
     * @param pubKeys - Array of public keys (hex strings or Uint8Arrays)
     * @returns Array of booleans indicating subscription status for each relay/pubkey pair
     */
    batchCheckPubKeySubscription(relayAddresses: string[], pubKeys: (string | Uint8Array)[]): Promise<boolean[]>;
    /**
     * Get detailed subscription information
     * @param userAddress - The address of the user
     * @param relayAddress - The address of the relay
     * @returns The subscription details or null if not found
     */
    getSubscriptionDetails(userAddress: string, relayAddress: string): Promise<SubscriptionDetails | null>;
    /**
     * Check if a user has active subscriptions on multiple relays
     * @param userAddress - The address of the user
     * @param relayAddresses - Array of relay addresses
     * @returns Array of booleans indicating subscription status for each relay
     */
    batchCheckSubscriptions(userAddress: string, relayAddresses: string[]): Promise<boolean[]>;
    /**
     * Check if a user has registered public keys on multiple relays
     * @param userAddress - The address of the user
     * @param relayAddresses - Array of relay addresses
     * @returns Array of booleans indicating if public keys are registered for each relay
     */
    batchCheckPubKeys(userAddress: string, relayAddresses: string[]): Promise<boolean[]>;
    /**
     * Get EntryPoint statistics
     * @returns The EntryPoint statistics or null if the call fails
     */
    getStatistics(): Promise<EntryPointStats | null>;
    /**
     * Subscribe to a relay via URL
     * @param relayUrl - The URL of the relay
     * @param months - Number of months to subscribe for
     * @param pubKey - The public key to register (hex string or Uint8Array)
     * @param value - The payment amount (will be calculated if not provided)
     * @returns The transaction response or null if the call fails
     */
    subscribeViaUrl(relayUrl: string, months: number, pubKey: string | Uint8Array, value?: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Subscribe directly to a relay
     * @param relayAddress - The address of the relay
     * @param months - Number of months to subscribe for
     * @param pubKey - The public key to register (hex string or Uint8Array)
     * @param value - The payment amount (will be calculated if not provided)
     * @returns The transaction response or null if the call fails
     */
    subscribeDirect(relayAddress: string, months: number, pubKey: string | Uint8Array, value?: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Subscribe to multiple relays in a single transaction
     * @param relayAddresses - Array of relay addresses
     * @param months - Number of months to subscribe for
     * @param pubKeys - Array of public keys (hex strings or Uint8Arrays)
     * @param value - The payment amount (will be calculated if not provided)
     * @returns The transaction response or null if the call fails
     */
    batchSubscribe(relayAddresses: string[], months: number, pubKeys: (string | Uint8Array)[], value?: bigint): Promise<ethers.TransactionResponse | null>;
    /**
     * Update the registry address (owner only)
     * @param newRegistryAddress - The new registry address
     * @returns The transaction response or null if the call fails
     */
    updateRegistry(newRegistryAddress: string): Promise<ethers.TransactionResponse | null>;
    /**
     * Update the service fee percentage (owner only)
     * @param newFeePercentage - The new fee percentage
     * @returns The transaction response or null if the call fails
     */
    updateServiceFee(newFeePercentage: number): Promise<ethers.TransactionResponse | null>;
    /**
     * Withdraw accumulated fees (owner only)
     * @returns The transaction response or null if the call fails
     */
    withdrawFees(): Promise<ethers.TransactionResponse | null>;
    /**
     * Check if a relay is in protocol mode
     * @param relayAddress - The address of the relay
     * @returns True if the relay is in protocol mode, false otherwise
     */
    isRelayInProtocolMode(relayAddress: string): Promise<boolean>;
}
