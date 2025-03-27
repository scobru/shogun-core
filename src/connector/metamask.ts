/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { log, logDebug, logError, logWarning } from "../utils/logger";
import CONFIG from "../config";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";
import { EventEmitter } from "events";
import {
  ConnectionResult,
  AuthResult,
  MetaMaskCredentials,
  EthereumProvider,
  SignatureCache,
  MetaMaskConfig
} from "../types/metamask";

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
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
 * Class for MetaMask connection
 */
class MetaMask extends EventEmitter {
  public readonly AUTH_DATA_TABLE: string;
  private readonly MESSAGE_TO_SIGN = "I Love Shogun!";
  private readonly DEFAULT_CONFIG: MetaMaskConfig = {
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  };

  private config: MetaMaskConfig;
  private signatureCache: Map<string, SignatureCache> = new Map();
  private customProvider: ethers.JsonRpcProvider | null = null;
  private customWallet: ethers.Wallet | null = null;
  private accountsChangedHandler: ((accounts: string[]) => void) | null = null;

  constructor(config: Partial<MetaMaskConfig> = {}) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.AUTH_DATA_TABLE = CONFIG.GUN_TABLES.AUTHENTICATIONS || "Authentications";
    this.setupEventListeners();
  }

  /**
   * Setup MetaMask event listeners
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined' && window.ethereum?.on) {
      this.accountsChangedHandler = (accounts: string[]) => {
        this.emit('accountsChanged', accounts);
      };
      
      window.ethereum.on('accountsChanged', this.accountsChangedHandler);
      window.ethereum.on('chainChanged', () => this.emit('chainChanged'));
      window.ethereum.on('connect', () => this.emit('connect'));
      window.ethereum.on('disconnect', () => this.emit('disconnect'));
    }
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    if (typeof window !== 'undefined' && window.ethereum?.removeListener && this.accountsChangedHandler) {
      window.ethereum.removeListener('accountsChanged', this.accountsChangedHandler);
    }
    this.removeAllListeners();
  }

  /**
   * Get cached signature if valid
   */
  private getCachedSignature(address: string): string | null {
    const cached = this.signatureCache.get(address);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheDuration!) {
      this.signatureCache.delete(address);
      return null;
    }

    return cached.signature;
  }

  /**
   * Cache signature
   */
  private cacheSignature(address: string, signature: string): void {
    this.signatureCache.set(address, {
      signature,
      timestamp: Date.now(),
      address
    });
  }

  /**
   * Validates that the address is valid
   */
  private validateAddress(address: string | null | undefined): string {
    if (!address) {
      throw new Error("Address not provided");
    }

    try {
      const normalizedAddress = String(address).trim().toLowerCase();
      if (!ethers.isAddress(normalizedAddress)) {
        throw new Error("Invalid address format");
      }
      return ethers.getAddress(normalizedAddress);
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.VALIDATION,
        "INVALID_ADDRESS",
        "Invalid Ethereum address provided",
        error
      );
      throw error;
    }
  }

  /**
   * Connects to MetaMask with retry logic
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    try {
      if (!MetaMask.isMetaMaskAvailable()) {
        const error = "MetaMask is not available. Please install MetaMask extension.";
        ErrorHandler.handle(ErrorType.NETWORK, "METAMASK_NOT_AVAILABLE", error, null);
        return { success: false, error };
      }

      for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
        try {
          const accounts = await window.ethereum!.request({
            method: "eth_requestAccounts"
        });

        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found in MetaMask");
          }

        const address = this.validateAddress(accounts[0]);
        const metamaskUsername = `mm_${address.toLowerCase()}`;

          this.emit('connected', { address });
          return { success: true, address, username: metamaskUsername };
      } catch (error: any) {
          if (attempt === this.config.maxRetries!) throw error;
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay!));
        }
      }

      throw new Error("Failed to connect after retries");
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.NETWORK,
        "METAMASK_CONNECTION_ERROR",
        error.message || "Unknown error while connecting to MetaMask",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Generates credentials with caching
   */
  async generateCredentials(address: string): Promise<MetaMaskCredentials> {
    try {
      const validAddress = this.validateAddress(address);
      
      // Check cache first
      const cachedSignature = this.getCachedSignature(validAddress);
      if (cachedSignature) {
        return this.generateCredentialsFromSignature(validAddress, cachedSignature);
      }

      const signature = await this.requestSignatureWithTimeout(
        validAddress,
        this.MESSAGE_TO_SIGN,
        this.config.timeout!
      );

      // Cache the new signature
      this.cacheSignature(validAddress, signature);
      
      return this.generateCredentialsFromSignature(validAddress, signature);
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "CREDENTIALS_GENERATION_ERROR",
        error.message || "Error generating MetaMask credentials",
        error
      );
      throw error;
    }
  }

  /**
   * Generate credentials from signature
   */
  private generateCredentialsFromSignature(
    address: string,
    signature: string
  ): MetaMaskCredentials {
    const username = `mm_${address.toLowerCase()}`;
    const password = ethers.keccak256(
      ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`)
    );
    return { username, password };
  }

  /**
   * Checks if MetaMask is available in the browser
   * @returns true if MetaMask is available
   */
  public static isMetaMaskAvailable(): boolean {
    const ethereum = window.ethereum as EthereumProvider | undefined;
    return (
      typeof window !== "undefined" &&
      typeof ethereum !== "undefined" &&
      ethereum?.isMetaMask === true
    );
  }

  /**
   * Requests signature with timeout
   */
  private async requestSignatureWithTimeout(
    address: string,
    message: string,
    timeout: number = 30000,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout requesting signature"));
      }, timeout);

      try {
        if (!window.ethereum) {
          throw new Error("MetaMask not found");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Verify address matches
        const signerAddress = await signer.getAddress();
        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error("Signer address does not match");
        }

        const signature = await signer.signMessage(message);
        clearTimeout(timeoutId);
        resolve(signature);
      } catch (error: any) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Checks if MetaMask is available
   */
  isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.ethereum;
  }

  /**
   * Configure custom JSON-RPC provider
   * @param rpcUrl - RPC endpoint URL
   * @param privateKey - Wallet private key
   * @throws {Error} For invalid parameters
   */
  public setCustomProvider(rpcUrl: string, privateKey: string): void {
    if (!rpcUrl || typeof rpcUrl !== "string") {
      throw new Error("Invalid RPC URL");
    }

    if (!privateKey || typeof privateKey !== "string") {
      throw new Error("Invalid private key");
    }

    try {
      this.customProvider = new ethers.JsonRpcProvider(rpcUrl);
      this.customWallet = new ethers.Wallet(privateKey, this.customProvider);
      logDebug("Custom provider configured successfully");
    } catch (error: any) {
      throw new Error(
        `Error configuring provider: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get active signer instance
   * @returns Ethers.js Signer
   * @throws {Error} If no signer available
   */
  public async getSigner(): Promise<ethers.Signer> {
    try {
      if (this.customWallet) {
        return this.customWallet as ethers.Signer;
      }

      const signer = await this.getEthereumSigner();
      if (!signer) {
        throw new Error("No Ethereum signer available");
      }

      return signer;
    } catch (error: any) {
      throw new Error(
        `Unable to get Ethereum signer: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Generate deterministic password from signature
   * @param signature - Cryptographic signature
   * @returns 64-character hex string
   * @throws {Error} For invalid signature
   */
  public async generatePassword(signature: string): Promise<string> {
    if (!signature) {
      throw new Error("Invalid signature");
    }

    const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
    return hash.slice(2, 66); // Remove 0x and use first 32 bytes
  }

  /**
   * Verify message signature
   * @param message - Original signed message
   * @param signature - Cryptographic signature
   * @returns Recovered Ethereum address
   * @throws {Error} For invalid inputs
   */
  public async verifySignature(
    message: string,
    signature: string,
  ): Promise<string> {
    if (!message || !signature) {
      throw new Error("Invalid message or signature");
    }

    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      throw new Error("Invalid message or signature");
    }
  }

  /**
   * Get browser-based Ethereum signer
   * @returns Browser provider signer
   * @throws {Error} If MetaMask not detected
   */
  public async getEthereumSigner(): Promise<ethers.Signer> {
    if (!MetaMask.isMetaMaskAvailable()) {
      throw new Error(
        "MetaMask not found. Please install MetaMask to continue.",
      );
    }

    try {
      const ethereum = window.ethereum as EthereumProvider;
      await ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(ethereum);
      return provider.getSigner();
    } catch (error: any) {
      throw new Error(
        `Error accessing MetaMask: ${error.message || "Unknown error"}`,
      );
    }
  }
}

if (typeof window !== "undefined") {
  window.MetaMask = MetaMask;
} else if (typeof global !== "undefined") {
  (global as any).MetaMask = MetaMask;
}

export { MetaMask };
