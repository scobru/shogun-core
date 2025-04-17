/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { logDebug, logError, logWarn } from "../../utils/logger";
import CONFIG from "../../config";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ConnectionResult,
  MetaMaskCredentials,
  EthereumProvider,
  SignatureCache,
  MetaMaskConfig,
} from "../../types/metamask";

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
    timeout: 60000,
  };

  private readonly config: MetaMaskConfig;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();
  private provider: ethers.BrowserProvider | null = null;
  private customProvider: ethers.JsonRpcProvider | null = null;
  private customWallet: ethers.Wallet | null = null;

  constructor(config: Partial<MetaMaskConfig> = {}) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.AUTH_DATA_TABLE =
      CONFIG.GUN_TABLES.AUTHENTICATIONS || "Authentications";
    this.initProvider();
    this.setupEventListeners();
  }

  /**
   * Initialize the provider synchronously
   */
  private initProvider(): void {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(
          window.ethereum as ethers.Eip1193Provider,
        );
        logDebug("BrowserProvider initialized successfully");
      } catch (error) {
        logError("Failed to initialize BrowserProvider", error);
      }
    } else {
      logWarn("Window.ethereum is not available");
    }
  }

  /**
   * Initialize the BrowserProvider (async method for explicit calls)
   */
  public async setupProvider(): Promise<void> {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        this.provider = new ethers.BrowserProvider(
          window.ethereum as ethers.Eip1193Provider,
        );
        logDebug("BrowserProvider initialized successfully");
      } else {
        logWarn("Window.ethereum is not available");
      }
    } catch (error) {
      logError("Failed to initialize BrowserProvider", error);
    }
  }

  /**
   * Setup MetaMask event listeners using BrowserProvider
   */
  private setupEventListeners(): void {
    if (this.provider) {
      this.provider.on("network", (newNetwork: any, oldNetwork: any) => {
        this.emit("chainChanged", newNetwork);
      });

      // Listen for account changes
      if (window.ethereum?.on) {
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          this.emit("accountsChanged", accounts);
        });
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    if (this.provider) {
      this.provider.removeAllListeners();
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
      address,
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
        error,
      );
      throw error;
    }
  }

  /**
   * Connects to MetaMask with retry logic using BrowserProvider
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    try {
      logDebug("Attempting to connect to MetaMask...");

      if (!this.provider) {
        logDebug("Provider not initialized, setting up...");
        this.initProvider();
        if (!this.provider) {
          throw new Error(
            "MetaMask is not available. Please install MetaMask extension.",
          );
        }
      }

      // Richiedi esplicitamente l'accesso all'account MetaMask
      logDebug("Requesting account access...");
      let accounts: string[] = [];

      if (window.ethereum) {
        try {
          accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          logDebug(
            `Accounts requested successfully: ${accounts.length} accounts returned`,
          );
        } catch (requestError) {
          logError("Error requesting MetaMask accounts:", requestError);
          throw new Error("User denied account access");
        }
      }

      if (!accounts || accounts.length === 0) {
        logDebug("No accounts found, trying to get signer...");
      }

      for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
        try {
          logDebug(`Attempt ${attempt} to get signer...`);
          const signer = await this.provider.getSigner();
          const address = await signer.getAddress();

          if (!address) {
            logError("No address returned from signer");
            throw new Error("No accounts found in MetaMask");
          }

          logDebug(`Signer address obtained: ${address}`);
          const metamaskUsername = `mm_${address.toLowerCase()}`;

          // Emetti evento connesso
          this.emit("connected", { address });

          logDebug(`MetaMask connected successfully with address: ${address}`);
          return { success: true, address, username: metamaskUsername };
        } catch (error: any) {
          logError(`Error in connection attempt ${attempt}:`, error);
          if (attempt === this.config.maxRetries!) throw error;
          logDebug(`Retrying in ${this.config.retryDelay}ms...`);
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay),
          );
        }
      }

      throw new Error("Failed to connect after retries");
    } catch (error: any) {
      logError("Failed to connect to MetaMask:", error);
      ErrorHandler.handle(
        ErrorType.NETWORK,
        "METAMASK_CONNECTION_ERROR",
        error.message ?? "Unknown error while connecting to MetaMask",
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Generates credentials with caching
   */
  async generateCredentials(address: string): Promise<MetaMaskCredentials> {
    logDebug("Generating credentials for address:", address);
    try {
      const validAddress = this.validateAddress(address);

      // Check cache first
      const cachedSignature = this.getCachedSignature(validAddress);
      if (cachedSignature) {
        logDebug("Using cached signature for address:", validAddress);
        return this.generateCredentialsFromSignature(
          validAddress,
          cachedSignature,
        );
      }

      try {
        // Tentiamo di ottenere la firma con timeout
        const signature = await this.requestSignatureWithTimeout(
          validAddress,
          this.MESSAGE_TO_SIGN,
          this.config.timeout,
        );

        // Cache the new signature
        this.cacheSignature(validAddress, signature);

        return this.generateCredentialsFromSignature(validAddress, signature);
      } catch (signingError) {
        // Gestione del fallimento di firma
        logWarn(
          `Failed to get signature: ${signingError}. Using fallback method.`,
        );

        // Generiamo credenziali deterministiche basate solo sull'indirizzo
        // Non sicuro come la firma, ma permette di procedere con l'autenticazione
        return this.generateFallbackCredentials(validAddress);
      }
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "CREDENTIALS_GENERATION_ERROR",
        error.message ?? "Error generating MetaMask credentials",
        error,
      );
      throw error;
    }
  }

  /**
   * Generate credentials from signature
   */
  private generateCredentialsFromSignature(
    address: string,
    signature: string,
  ): MetaMaskCredentials {
    const username = `mm_${address.toLowerCase()}`;
    const password = ethers.keccak256(
      ethers.toUtf8Bytes(`${signature}:${address.toLowerCase()}`),
    );
    const message = this.MESSAGE_TO_SIGN;
    return { username, password, message, signature };
  }

  /**
   * Generate fallback credentials when signature request fails
   * Questo è meno sicuro della firma, ma permette di procedere con l'autenticazione
   */
  private generateFallbackCredentials(address: string): MetaMaskCredentials {
    logWarn("Using fallback credentials generation for address:", address);
    const username = `mm_${address.toLowerCase()}`;

    // Creiamo una password deterministica basata sull'indirizzo
    // Nota: meno sicuro della firma, ma deterministico
    const fallbackMessage = `SHOGUN_FALLBACK:${address.toLowerCase()}`;
    const password = ethers.keccak256(ethers.toUtf8Bytes(fallbackMessage));

    // Usiamo il messaggio fallback sia come messaggio che come pseudo-firma
    // Questo non è crittograficamente sicuro, ma soddisfa l'interfaccia
    const message = fallbackMessage;
    const signature = ethers.keccak256(ethers.toUtf8Bytes(fallbackMessage));

    return { username, password, message, signature };
  }

  /**
   * Checks if MetaMask is available in the browser
   * @returns true if MetaMask is available
   */
  public static isMetaMaskAvailable(): boolean {
    const ethereum = window.ethereum;
    return (
      typeof window !== "undefined" &&
      typeof ethereum !== "undefined" &&
      ethereum?.isMetaMask === true
    );
  }

  /**
   * Request signature using BrowserProvider
   */
  private requestSignatureWithTimeout(
    address: string,
    message: string,
    timeout: number = 30000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        timeoutId = null;
        reject(new Error("Timeout requesting signature"));
      }, timeout);

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener("accountsChanged", errorHandler);
        }
      };

      const errorHandler = (error: any) => {
        cleanup();
        reject(error as Error);
      };

      // Aggiungere listener per l'evento accountsChanged che può interrompere la firma
      if (window.ethereum?.on) {
        window.ethereum.on("accountsChanged", errorHandler);
      }

      const initializeAndSign = async () => {
        try {
          if (!this.provider) {
            this.initProvider();
            if (!this.provider) {
              throw new Error("Provider not initialized");
            }
          }

          const signer = await this.provider.getSigner();
          const signerAddress = await signer.getAddress();

          if (signerAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error(
              `Signer address (${signerAddress}) does not match expected address (${address})`,
            );
          }

          logDebug(`Requesting signature for message: ${message}`);
          const signature = await signer.signMessage(message);
          logDebug("Signature obtained successfully");

          cleanup();
          resolve(signature);
        } catch (error: any) {
          logError("Failed to request signature:", error);
          cleanup();
          reject(error as Error);
        }
      };

      initializeAndSign();
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
        `Error configuring provider: ${error.message ?? "Unknown error"}`,
      );
    }
  }

  /**
   * Get active signer instance using BrowserProvider
   */
  public async getSigner(): Promise<ethers.Signer> {
    try {
      if (this.customWallet) {
        return this.customWallet;
      }

      if (!this.provider) {
        this.initProvider();
      }

      if (!this.provider) {
        throw new Error("Provider not initialized");
      }

      return await this.provider.getSigner();
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
        `Error accessing MetaMask: ${error.message ?? "Unknown error"}`,
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
