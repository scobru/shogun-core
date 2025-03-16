/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
declare global {
    interface Window {
        ethereum?: any;
        MetaMask?: typeof MetaMask;
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            MetaMask?: typeof MetaMask;
        }
    }
}
/**
 * Definition of interfaces with standard types
 */
interface ConnectionResult {
    success: boolean;
    address?: string;
    username?: string;
    randomPassword?: string;
    error?: string;
}
/**
 * Class for MetaMask connection
 */
declare class MetaMask {
    readonly AUTH_DATA_TABLE: string;
    private static readonly TIMEOUT_MS;
    /** Custom JSON-RPC provider */
    private customProvider;
    /** Wallet for custom provider */
    private customWallet;
    /** Fixed message for signing */
    private MESSAGE_TO_SIGN;
    private MAX_RETRIES;
    private RETRY_DELAY;
    constructor();
    /**
     * Validates that the address is valid
     * @param address Address to validate
     * @returns Normalized address
     * @throws Error if address is not valid
     */
    private validateAddress;
    /**
     * Generates a secure password from signature
     * @param signature Signature to generate password from
     * @returns Generated password
     */
    generateSecurePassword(signature: string): string;
    /**
     * Connects to MetaMask
     * @returns Connection result
     */
    connectMetaMask(): Promise<ConnectionResult>;
    /**
     * Checks if MetaMask is available in the browser
     * @returns true if MetaMask is available
     */
    static isMetaMaskAvailable(): boolean;
    /**
     * Generates credentials for MetaMask authentication
     */
    generateCredentials(address: string): Promise<{
        username: string;
        password: string;
    }>;
    /**
     * Requests signature with timeout
     */
    private requestSignatureWithTimeout;
    /**
     * Checks if MetaMask is available
     */
    isAvailable(): boolean;
    /**
     * Configure custom JSON-RPC provider
     * @param rpcUrl - RPC endpoint URL
     * @param privateKey - Wallet private key
     * @throws {Error} For invalid parameters
     */
    setCustomProvider(rpcUrl: string, privateKey: string): void;
    /**
     * Get active signer instance
     * @returns Ethers.js Signer
     * @throws {Error} If no signer available
     */
    getSigner(): Promise<ethers.Signer>;
    /**
     * Generate deterministic password from signature
     * @param signature - Cryptographic signature
     * @returns 64-character hex string
     * @throws {Error} For invalid signature
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Verify message signature
     * @param message - Original signed message
     * @param signature - Cryptographic signature
     * @returns Recovered Ethereum address
     * @throws {Error} For invalid inputs
     */
    verifySignature(message: string, signature: string): Promise<string>;
    /**
     * Get browser-based Ethereum signer
     * @returns Browser provider signer
     * @throws {Error} If MetaMask not detected
     */
    getEthereumSigner(): Promise<ethers.Signer>;
}
export { MetaMask };
