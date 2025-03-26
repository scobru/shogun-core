/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { log, logDebug, logError, logWarning } from "../utils/logger";
import CONFIG from "../config";
import { ErrorHandler, ErrorType } from "../utils/errorHandler";

// Extend the Window interface to include ethereum
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

interface AuthResult {
  success: boolean;
  username?: string;
  password?: string;
  error?: string;
  nonce?: string;
  timestamp?: number;
  messageToSign?: string;
}

interface MetaMaskCredentials {
  username: string;
  password: string;
}

// Definition of EthereumProvider for TypeScript
interface EthereumProvider {
  request: (args: any) => Promise<any>;
  isMetaMask?: boolean;
}

/**
 * Class for MetaMask connection
 */
class MetaMask {
  public readonly AUTH_DATA_TABLE: string;
  private static readonly TIMEOUT_MS = 5000;

  /** Custom JSON-RPC provider */
  private customProvider: ethers.JsonRpcProvider | null = null;

  /** Wallet for custom provider */
  private customWallet: ethers.Wallet | null = null;

  /** Fixed message for signing */
  private MESSAGE_TO_SIGN = "I Love Shogun!";

  private MAX_RETRIES = 3;
  private RETRY_DELAY = 1000;

  constructor() {
    this.AUTH_DATA_TABLE =
      CONFIG.GUN_TABLES.AUTHENTICATIONS || "Authentications";
  }

  /**
   * Validates that the address is valid
   * @param address Address to validate
   * @returns Normalized address
   * @throws Error if address is not valid
   */
  private validateAddress(address: string | null | undefined): string {
    if (!address) {
      throw new Error("Address not provided");
    }

    // Normalize address
    const normalizedAddress = String(address).trim().toLowerCase();

    try {
      // Verify if it's a valid address with ethers
      if (!ethers.isAddress(normalizedAddress)) {
        throw new Error("Invalid address format");
      }

      // Format address correctly
      return ethers.getAddress(normalizedAddress);
    } catch (e) {
      throw new Error("Invalid Ethereum address");
    }
  }

  /**
   * Generates a secure password from signature
   * @param signature Signature to generate password from
   * @returns Generated password
   */
  public generateSecurePassword(signature: string): string {
    if (!signature) {
      throw new Error("Invalid signature");
    }

    // hash the signature
    const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
    return hash.slice(2, 66);
  }

  /**
   * Connects to MetaMask
   * @returns Connection result
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    try {
      // Check if MetaMask is available
      if (!MetaMask.isMetaMaskAvailable()) {
        const error =
          "MetaMask is not available. Please install MetaMask extension.";

        ErrorHandler.handle(
          ErrorType.NETWORK,
          "METAMASK_NOT_AVAILABLE",
          error,
          null,
        );

        return {
          success: false,
          error,
        };
      }

      const ethereum = window.ethereum as EthereumProvider;

      try {
        // Request authorization to access accounts
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        // Verify if there are available accounts
        if (!accounts || accounts.length === 0) {
          const error = "No accounts found in MetaMask";

          ErrorHandler.handle(
            ErrorType.NETWORK,
            "NO_METAMASK_ACCOUNTS",
            error,
            null,
          );

          return {
            success: false,
            error,
          };
        }

        // Validate and normalize address
        const address = this.validateAddress(accounts[0]);
        const metamaskUsername = `mm_${address.toLowerCase()}`;

        return {
          success: true,
          address,
          username: metamaskUsername,
        };
      } catch (error: any) {
        logError("Error accessing MetaMask:", error);

        ErrorHandler.handle(
          ErrorType.NETWORK,
          "METAMASK_ACCESS_ERROR",
          error.message || "Error connecting to MetaMask",
          error,
        );

        return {
          success: false,
          error: error.message || "Error connecting to MetaMask",
        };
      }
    } catch (error: any) {
      logError("General error in connectMetaMask:", error);

      ErrorHandler.handle(
        ErrorType.NETWORK,
        "METAMASK_CONNECTION_ERROR",
        error.message || "Unknown error while connecting to MetaMask",
        error,
      );

      return {
        success: false,
        error: error.message || "Unknown error while connecting to MetaMask",
      };
    }
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
   * Generates credentials for MetaMask authentication
   */
  async generateCredentials(
    address: string,
  ): Promise<{ username: string; password: string }> {
    try {
      if (!address) {
        throw new Error("Ethereum address required");
      }

      log("Requesting message signature: " + this.MESSAGE_TO_SIGN);

      let signature = null;
      let retries = 0;

      while (!signature && retries < this.MAX_RETRIES) {
        try {
          // Request signature with timeout
          signature = await this.requestSignatureWithTimeout(
            address,
            this.MESSAGE_TO_SIGN,
          );
        } catch (error) {
          retries++;
          if (retries < this.MAX_RETRIES) {
            log(`Attempt ${retries + 1} of ${this.MAX_RETRIES}...`);
            await new Promise((resolve) =>
              setTimeout(resolve, this.RETRY_DELAY),
            );
          } else {
            throw error;
          }
        }
      }

      if (!signature) {
        throw new Error("Unable to get signature after attempts");
      }

      log("Signature obtained, generating password...");

      // Generate deterministic username and password
      const username = `mm_${address.toLowerCase()}`;
      const password = ethers.keccak256(
        ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`),
      );

      return {
        username,
        password,
      };
    } catch (error: any) {
      logError("Error generating MetaMask credentials:", error);
      throw new Error(`MetaMask error: ${error.message}`);
    }
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
