import { ethers } from 'ethers';
import { ShogunCore } from '../index';
export interface DIDVerifierConfig {
    contractAddress: string;
    providerUrl?: string;
}
/**
 * DIDVerifier - A class to verify and interact with Decentralized Identifiers (DIDs)
 * using the DIDRegistry contract
 */
export declare class DIDVerifier {
    private contract;
    private provider;
    private signer;
    private contractAddress;
    private shogun?;
    /**
     * Creates a new DIDVerifier instance
     *
     * @param config Configuration for the DID verifier
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional signer to use for contract interactions
     */
    constructor(config: DIDVerifierConfig, shogun?: ShogunCore, signer?: ethers.Signer);
    /**
     * Verifies if a DID is registered and returns its controller
     *
     * @param did The decentralized identifier to verify
     * @returns Promise resolving to the controller of the DID or null if not found
     */
    verifyDID(did: string): Promise<string | null>;
    /**
     * Checks if a DID is controlled by a specific controller
     *
     * @param did The decentralized identifier to check
     * @param expectedController The controller to verify against
     * @returns Promise resolving to boolean indicating if the DID is controlled by the expected controller
     */
    isDIDControlledBy(did: string, expectedController: string): Promise<boolean>;
    /**
     * Authenticates a user using their DID and a signed message
     *
     * @param did The decentralized identifier of the user
     * @param message The original message that was signed
     * @param signature The signature to verify
     * @returns Promise resolving to boolean indicating if authentication was successful
     */
    authenticateWithDID(did: string, message: string, signature: string): Promise<boolean>;
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
     * Registers a DID with the contract
     *
     * @param did The decentralized identifier to register
     * @param controller The controller of the DID
     * @returns Promise resolving to boolean indicating if the registration was successful
     */
    registerDID(did: string, controller: string): Promise<boolean>;
    /**
     * Updates the signer for the verifier
     *
     * @param signer The new signer to use
     * @returns True if signer was updated successfully
     */
    setSigner(signer: ethers.Signer): boolean;
}
