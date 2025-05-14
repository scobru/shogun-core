import { ethers } from "ethers";
import { ShogunCore } from "../index";
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
export declare class RelayVerifier {
    private registryContract;
    private provider;
    private signer;
    private registryAddress;
    private relayContracts;
    private shogun?;
    /**
     * Creates a new RelayVerifier instance
     *
     * @param config Configuration for the relay verifier
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional ethers.Signer instance to use for contract interactions
     */
    constructor(config: RelayConfig, shogun?: ShogunCore, signer?: ethers.Signer);
    /**
     * Gets an instance of the IndividualRelay contract
     *
     * @param relayAddress The address of the relay contract
     * @returns The contract instance or null if not found
     */
    private getRelayContract;
    /**
     * Gets all registered relay contracts from the registry
     *
     * @returns Array of relay contract addresses
     */
    getAllRelays(): Promise<string[]>;
    /**
     * Gets detailed information about a relay
     *
     * @param relayAddress The address of the relay to query
     * @returns Detailed relay information or null if not found
     */
    getRelayInfo(relayAddress: string): Promise<RelayInfo | null>;
    /**
     * Gets all relays a user is actively subscribed to
     *
     * @param userAddress The Ethereum address to check
     * @returns Array of relay addresses the user is subscribed to
     */
    getUserActiveRelays(userAddress: string): Promise<string[]>;
    /**
     * Checks if a user is subscribed to a specific relay
     *
     * @param relayAddress The relay contract address to check
     * @param userAddress The user's Ethereum address
     * @returns True if the user is subscribed, false otherwise
     */
    isUserSubscribedToRelay(relayAddress: string, userAddress: string): Promise<boolean>;
    /**
     * Gets user subscription information for a specific relay
     *
     * @param relayAddress The relay contract address
     * @param userAddress The user's Ethereum address
     * @returns Subscription information or null if failed
     */
    getUserSubscriptionInfo(relayAddress: string, userAddress: string): Promise<UserSubscriptionInfo | null>;
    /**
     * Checks if a public key is authorized in a specific relay
     *
     * @param relayAddress The relay contract address
     * @param publicKey The public key to check (as a byte array or hex string)
     * @returns True if authorized, false otherwise
     */
    isPublicKeyAuthorized(relayAddress: string, publicKey: string | Uint8Array): Promise<boolean>;
    /**
     * Gets the subscription price for a relay
     *
     * @param relayAddress The relay contract address
     * @returns The price per month in wei (as BigInt) or null if failed
     */
    getRelayPrice(relayAddress: string): Promise<bigint | null>;
    /**
     * Subscribes to a relay (requires a signer)
     *
     * @param relayAddress The relay contract address to subscribe to
     * @param months Number of months to subscribe for
     * @param pubKey Optional public key to associate with the subscription
     * @returns Transaction response or null if failed
     */
    subscribeToRelay(relayAddress: string, months: number, pubKey?: string | Uint8Array): Promise<ethers.TransactionResponse | null>;
    /**
     * Updates the provider URL for the verifier
     *
     * @param providerUrl New provider URL to use
     * @returns True if provider was updated successfully
     */
    setProviderUrl(providerUrl: string): boolean;
    /**
     * Updates the registry address for the verifier
     *
     * @param registryAddress New registry address to use
     * @returns True if registry address was updated successfully
     */
    setRegistryAddress(registryAddress: string): boolean;
    /**
     * Updates the signer for the verifier
     *
     * @param signer New ethers.Signer instance to use
     * @returns True if signer was updated successfully
     */
    setSigner(signer: ethers.Signer): boolean;
}
