import { ethers } from "ethers";
import { ShogunCore } from "../index";
export interface RelayMembershipConfig {
    contractAddress: string;
    providerUrl?: string;
}
/**
 * RelayMembershipVerifier - A class to verify if an address or public key is part
 * of the Shogun protocol using the RelayMembership contract
 */
export declare class RelayMembershipVerifier {
    private contract;
    private provider;
    private signer;
    private contractAddress;
    private shogun?;
    /**
     * Creates a new RelayMembershipVerifier instance
     *
     * @param config Configuration for the RelayMembership verifier
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional ethers.Signer instance to use for contract interactions
     */
    constructor(config: RelayMembershipConfig, shogun?: ShogunCore, signer?: ethers.Signer);
    /**
     * Checks if an Ethereum address is authorized in the protocol
     *
     * @param address The Ethereum address to check
     * @returns Promise resolving to boolean indicating if address is authorized
     */
    isAddressAuthorized(address: string): Promise<boolean>;
    /**
     * Checks if a public key is authorized in the protocol
     *
     * @param publicKey The public key to check (as a byte array or hex string)
     * @returns Promise resolving to boolean indicating if public key is authorized
     */
    isPublicKeyAuthorized(publicKey: string | Uint8Array): Promise<boolean>;
    /**
     * Gets the address associated with a public key
     *
     * @param publicKey The public key to look up
     * @returns Promise resolving to the associated address or null if not found
     */
    getAddressForPublicKey(publicKey: string | Uint8Array): Promise<string | null>;
    /**
     * Gets user information from the contract
     *
     * @param address The Ethereum address to look up
     * @returns Promise resolving to user info (expiration timestamp and public key)
     */
    getUserInfo(address: string): Promise<{
        expires: bigint;
        pubKey: string;
    } | null>;
    /**
     * Checks if a user's subscription is active (not expired)
     *
     * @param address The Ethereum address to check
     * @returns Promise resolving to boolean indicating if subscription is active
     */
    isUserActive(address: string): Promise<boolean>;
    /**
     * Updates the provider URL for the verifier
     *
     * @param providerUrl New provider URL to use
     * @returns True if provider was updated successfully
     */
    setProviderUrl(providerUrl: string): boolean;
    /**
     * Updates the contract address for the verifier
     *
     * @param contractAddress New contract address to use
     * @returns True if contract address was updated successfully
     */
    setContractAddress(contractAddress: string): boolean;
    /**
     * Updates the signer for the verifier
     *
     * @param signer New ethers.Signer instance to use
     * @returns True if signer was updated successfully
     */
    setSigner(signer: ethers.Signer): boolean;
}
