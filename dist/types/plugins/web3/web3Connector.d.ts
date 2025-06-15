/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { EventEmitter } from "../../utils/eventEmitter";
import { ConnectionResult, Web3ConnectorCredentials, EthereumProvider, Web3Config } from "./types";
declare global {
    interface Window {
        ethereum?: EthereumProvider;
        Web3Connector?: typeof Web3Connector;
        _ethereumProviders?: EthereumProvider[];
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            web3Connector?: typeof Web3Connector;
        }
    }
}
/**
 * Class for MetaMask connection
 */
declare class Web3Connector extends EventEmitter {
    private readonly MESSAGE_TO_SIGN;
    private readonly DEFAULT_CONFIG;
    private readonly config;
    private readonly signatureCache;
    private provider;
    private customProvider;
    private customWallet;
    constructor(config?: Partial<Web3Config>);
    /**
     * Initialize the provider synchronously with fallback mechanisms
     * to handle conflicts between multiple wallet providers
     */
    private initProvider;
    /**
     * Get available Ethereum provider from multiple possible sources
     */
    private getAvailableEthereumProvider;
    /**
     * Initialize the BrowserProvider (async method for explicit calls)
     */
    setupProvider(): Promise<void>;
    /**
     * Setup MetaMask event listeners using BrowserProvider
     */
    private setupEventListeners;
    /**
     * Cleanup event listeners
     */
    cleanup(): void;
    /**
     * Get cached signature if valid
     */
    private getCachedSignature;
    /**
     * Cache signature
     */
    private cacheSignature;
    /**
     * Validates that the address is valid
     */
    private validateAddress;
    /**
     * Connects to MetaMask with retry logic using BrowserProvider
     */
    connectMetaMask(): Promise<ConnectionResult>;
    /**
     * Generates credentials with caching
     */
    generateCredentials(address: string): Promise<Web3ConnectorCredentials>;
    /**
     * Generate credentials from signature
     */
    private generateCredentialsFromSignature;
    /**
     * Generate fallback credentials when signature request fails
     * Questo è meno sicuro della firma, ma permette di procedere con l'autenticazione
     */
    private generateFallbackCredentials;
    /**
     * Checks if MetaMask is available in the browser
     * @returns true if MetaMask is available
     */
    static isMetaMaskAvailable(): boolean;
    /**
     * Request signature using BrowserProvider
     */
    private requestSignatureWithTimeout;
    /**
     * Checks if any Ethereum provider is available
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
     * Get active signer instance using BrowserProvider
     */
    getSigner(): Promise<ethers.Signer>;
    /**
     * Get active provider instance using BrowserProvider
     */
    getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
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
export { Web3Connector };
