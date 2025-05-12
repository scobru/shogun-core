import { ethers } from "ethers";
import { ShogunCore } from "../index";
export interface OracleBridgeConfig {
    contractAddress: string;
    providerUrl?: string;
}
/**
 * OracleBridge - A class to interact with the OracleBridge contract
 * which publishes Merkle roots for each epoch
 */
export declare class OracleBridge {
    private contract;
    private provider;
    private signer;
    private contractAddress;
    private shogun?;
    /**
     * Creates a new OracleBridge instance
     *
     * @param config Configuration for the OracleBridge
     * @param shogun Optional ShogunCore instance to reuse its provider
     * @param signer Optional signer to use for transactions
     */
    constructor(config: OracleBridgeConfig, shogun?: ShogunCore, signer?: ethers.Signer);
    /**
     * Gets the current epoch ID
     *
     * @returns Promise resolving to the current epoch ID
     */
    getEpochId(): Promise<bigint>;
    /**
     * Gets the Merkle root for a specific epoch
     *
     * @param epochId The epoch ID to get the root for
     * @returns Promise resolving to the Merkle root for the specified epoch
     */
    getRootForEpoch(epochId: number | bigint): Promise<string>;
    /**
     * Gets the admin address of the OracleBridge contract
     *
     * @returns Promise resolving to the admin address
     */
    getAdmin(): Promise<string>;
    /**
     * Verifies if an epoch's Merkle root matches an expected value
     *
     * @param epochId The epoch ID to verify
     * @param expectedRoot The expected Merkle root to check against
     * @returns Promise resolving to boolean indicating if the roots match
     */
    verifyRoot(epochId: number | bigint, expectedRoot: string): Promise<boolean>;
    /**
     * Publishes a new Merkle root for an epoch (admin only)
     *
     * @param epochId The epoch ID to publish the root for
     * @param root The Merkle root to publish
     * @param externalSigner Optional signer to use for the transaction (must be admin)
     * @returns Promise resolving to the transaction receipt
     */
    publishRoot(epochId: number | bigint, root: string, externalSigner?: ethers.Signer): Promise<ethers.TransactionReceipt | null>;
    /**
     * Sets a signer to use for transactions
     *
     * @param signer The signer to set
     */
    setSigner(signer: ethers.Signer): void;
    /**
     * Updates the provider URL for the bridge
     *
     * @param providerUrl New provider URL to use
     * @returns True if provider was updated successfully
     */
    setProviderUrl(providerUrl: string): boolean;
    /**
     * Updates the contract address for the bridge
     *
     * @param contractAddress New contract address to use
     * @returns True if contract address was updated successfully
     */
    setContractAddress(contractAddress: string): boolean;
}
