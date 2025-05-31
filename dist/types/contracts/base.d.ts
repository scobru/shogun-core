/**
 * Shogun Protocol Contracts SDK
 * This file provides interfaces and ABIs for interacting with the Shogun Protocol smart contracts
 */
import { ethers } from "ethers";
declare const REGISTRY_ABI: string[];
declare const SIMPLE_RELAY_ABI: string[];
declare const ENTRY_POINT_ABI: string[];
export interface RelayInfo {
    owner: string;
    url: string;
    metadata: string;
    registrationTime: bigint;
    active: boolean;
}
export interface RelayPage {
    relays: string[];
    total: bigint;
    offset: bigint;
    limit: bigint;
}
export interface SubscriptionDetails {
    expires: bigint;
    pubKey: string;
}
export interface RelayConfig {
    url: string;
    price: bigint;
    daysInMonth: bigint;
}
export declare enum RelayOperatingMode {
    SINGLE = 0,
    PROTOCOL = 1
}
export interface RelayModeInfo {
    mode: RelayOperatingMode;
    registryAddress: string;
    entryPointAddress: string;
    isRegistered: boolean;
}
export interface EntryPointStats {
    userCount: bigint;
    totalSubscriptions: bigint;
    totalViaUrl: bigint;
    totalViaDirect: bigint;
    totalAmountProcessed: bigint;
    totalFeesCollected: bigint;
    currentBalance: bigint;
}
export interface ContractConfig {
    providerUrl?: string;
    provider?: ethers.Provider;
    signer?: ethers.Signer;
    registryAddress: string;
    entryPointAddress?: string;
}
declare abstract class BaseContract {
    protected provider: ethers.Provider | null;
    protected signer: ethers.Signer | null;
    protected contract: ethers.Contract | null;
    protected contractAddress: string;
    constructor(address: string, abi: string[], config: ContractConfig);
    /**
     * Set a new provider
     * @param provider - The new provider
     */
    setProvider(provider: ethers.Provider): void;
    /**
     * Set a new signer
     * @param signer - The new signer
     */
    setSigner(signer: ethers.Signer): void;
    /**
     * Get the contract address
     * @returns The contract address
     */
    getAddress(): string;
}
/**
 * Export all the ABIs and interfaces for use in other modules
 */
export { REGISTRY_ABI, SIMPLE_RELAY_ABI, ENTRY_POINT_ABI, BaseContract };
