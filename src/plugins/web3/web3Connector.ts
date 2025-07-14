/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
import { ethers } from "ethers";
import { log, logDebug, logError, logWarn } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ConnectionResult,
  Web3ConnectorCredentials,
  EthereumProvider,
  SignatureCache,
  Web3Config,
} from "./types";
import { ISEAPair } from "gun";
import derive from "../../gundb/derive";

// Extend the Window interface to include ethereum
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
class Web3Connector extends EventEmitter {
  private readonly MESSAGE_TO_SIGN = "I Love Shogun!";
  private readonly DEFAULT_CONFIG: Web3Config = {
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000,
  };

  private readonly config: Web3Config;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null =
    null;
  private customProvider: ethers.JsonRpcProvider | null = null;
  private customWallet: ethers.Wallet | null = null;

  constructor(config: Partial<Web3Config> = {}) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initProvider();
    this.setupEventListeners();
  }

  /**
   * Initialize the provider synchronously with fallback mechanisms
   * to handle conflicts between multiple wallet providers
   */
  private initProvider(): void {
    if (typeof window !== "undefined") {
      try {
        // Check if ethereum is available from any provider
        const ethereumProvider = this.getAvailableEthereumProvider();

        if (ethereumProvider) {
          this.provider = new ethers.BrowserProvider(
            ethereumProvider as ethers.Eip1193Provider,
          );
          logDebug("BrowserProvider initialized successfully");
        } else {
          logWarn("No compatible Ethereum provider found");
        }
      } catch (error) {
        logError("Failed to initialize BrowserProvider", error);
      }
    } else {
      logWarn("Window object not available (non-browser environment)");
    }
  }

  /**
   * Get available Ethereum provider from multiple possible sources
   */
  private getAvailableEthereumProvider(): EthereumProvider | undefined {
    if (typeof window === "undefined") return undefined;

    // Define provider sources with priority order
    const providerSources = [
      // Check if we have providers in the _ethereumProviders registry (from index.html)
      {
        source: () => window._ethereumProviders && window._ethereumProviders[0],
        name: "Registry Primary",
      },
      { source: () => window.ethereum, name: "Standard ethereum" },
      {
        source: () => (window as any).web3?.currentProvider,
        name: "Legacy web3",
      },
      { source: () => (window as any).metamask, name: "MetaMask specific" },
      {
        source: () =>
          (window as any).ethereum?.providers?.find((p: any) => p.isMetaMask),
        name: "MetaMask from providers array",
      },
      {
        source: () => (window as any).ethereum?.providers?.[0],
        name: "First provider in array",
      },
      // Try known provider names
      {
        source: () => (window as any).enkrypt?.providers?.ethereum,
        name: "Enkrypt",
      },
      {
        source: () => (window as any).coinbaseWalletExtension,
        name: "Coinbase",
      },
      { source: () => (window as any).trustWallet, name: "Trust Wallet" },
      // Use special registry if available
      {
        source: () =>
          Array.isArray(window._ethereumProviders)
            ? window._ethereumProviders.find((p: any) => !p._isProxy)
            : undefined,
        name: "Registry non-proxy",
      },
    ];

    // Try each provider source
    for (const { source, name } of providerSources) {
      try {
        const provider = source();

        if (provider && typeof provider.request === "function") {
          logDebug(`Found compatible Ethereum provider: ${name}`);
          return provider;
        }
      } catch (error) {
        // Continue to next provider source
        logWarn(`Error checking provider ${name}:`, error);
        continue;
      }
    }

    // No provider found
    logWarn("No compatible Ethereum provider found");
    return undefined;
  }

  /**
   * Initialize the BrowserProvider (async method for explicit calls)
   */
  public async setupProvider(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        // Check if ethereum is available from any provider
        const ethereumProvider = this.getAvailableEthereumProvider();

        if (ethereumProvider) {
          this.provider = new ethers.BrowserProvider(
            ethereumProvider as ethers.Eip1193Provider,
          );
          logDebug("BrowserProvider initialized successfully");
        } else {
          logWarn("No compatible Ethereum provider found");
        }
      } else {
        logWarn("Window object not available (non-browser environment)");
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
      // Listen for network changes through ethers provider
      this.provider.on("network", (newNetwork: any, oldNetwork: any) => {
        this.emit("chainChanged", newNetwork);
      });

      // Listen for account changes through the detected provider
      try {
        const ethereumProvider = this.getAvailableEthereumProvider();
        if (ethereumProvider?.on) {
          ethereumProvider.on("accountsChanged", (accounts: string[]) => {
            this.emit("accountsChanged", accounts);
          });

          // Also listen for chainChanged events directly
          ethereumProvider.on("chainChanged", (chainId: string) => {
            this.emit("chainChanged", { chainId });
          });
        }
      } catch (error) {
        logWarn("Failed to setup account change listeners", error);
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

    // Check for invalid/empty signature
    if (
      !cached.signature ||
      typeof cached.signature !== "string" ||
      cached.signature.length < 16
    ) {
      logWarn(
        `Invalid cached signature for address ${address} (length: ${cached.signature ? cached.signature.length : 0}), deleting from cache.`,
      );
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

      // First check if we can get the provider
      const ethereumProvider = this.getAvailableEthereumProvider();
      if (!ethereumProvider) {
        throw new Error("No compatible Ethereum provider found");
      }

      // Richiedi esplicitamente l'accesso all'account MetaMask
      logDebug("Requesting account access...");
      let accounts: string[] = [];

      // Try multiple methods of requesting accounts for compatibility
      try {
        // Try the provider we found first
        accounts = await ethereumProvider.request({
          method: "eth_requestAccounts",
        });
      } catch (requestError) {
        logWarn(
          "First account request failed, trying window.ethereum:",
          requestError,
        );

        // Fallback to window.ethereum if available and different
        if (window.ethereum && window.ethereum !== ethereumProvider) {
          try {
            accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
          } catch (fallbackError) {
            logError("All account request methods failed", fallbackError);
            throw new Error("User denied account access");
          }
        } else {
          throw new Error("User denied account access");
        }
      }

      logDebug(
        `Accounts requested successfully: ${accounts.length} accounts returned`,
      );

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
            continue;
          }

          logDebug(
            `Successfully connected to MetaMask with address: ${address}`,
          );
          this.emit("connected", { address });

          return {
            success: true,
            address,
          };
        } catch (error) {
          logError(`Attempt ${attempt} failed:`, error);

          if (attempt === this.config.maxRetries) {
            throw error;
          }

          // Wait before retrying
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
  async generateCredentials(address: string): Promise<ISEAPair> {
    log("[web3Connector] Generating credentials for address:", address);
    try {
      const validAddress = this.validateAddress(address);

      log("[web3Connector] Valid Address:", validAddress);

      // Check cache first
      const cachedSignature = this.getCachedSignature(validAddress);
      if (cachedSignature) {
        log(
          "[web3Connector] Using cached signature for address:",
          validAddress,
        );
        return this.generateCredentialsFromSignature(
          validAddress,
          cachedSignature,
        );
      }

      try {
        log("[web3Connector] Request signature with timeout");
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
        throw signingError;
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
  private async generateCredentialsFromSignature(
    address: string,
    signature: string,
  ): Promise<ISEAPair> {
    log("[web3Connector] Generating credentials from signature");
    const salt = `${address}:${signature}`;
    const k = await derive(salt, null, { includeP256: true });
    return k;
  }

  /**
   * Generate fallback credentials when signature request fails
   * Questo è meno sicuro della firma, ma permette di procedere con l'autenticazione
   */
  private generateFallbackCredentials(
    address: string,
  ): Web3ConnectorCredentials {
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
    if (typeof window === "undefined") return false;

    // Check standard location
    if (window.ethereum?.isMetaMask === true) return true;

    // Check alternate locations (for compatibility with multiple wallet extensions)
    const alternateProviders = [
      (window as any).web3?.currentProvider,
      (window as any).metamask,
    ];

    for (const provider of alternateProviders) {
      if (provider?.isMetaMask === true) return true;
    }

    return false;
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

      log("[web3Connector] Initialize and Sign");

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

          log("[web3Connector] Signer:", signer);
          log("[web3Connector] Signer Address:", signerAddress);

          if (signerAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error(
              `Signer address (${signerAddress}) does not match expected address (${address})`,
            );
          }

          log(`Requesting signature for message: ${message}`);
          const signature = await signer.signMessage(message);
          log("[web3Connector] Signature obtained successfully");

          cleanup();
          resolve(signature);
        } catch (error: any) {
          logError("Failed to request signature:", error);
          cleanup();
          reject(error as Error);
        }
      };

      const signature = initializeAndSign();

      return signature;
    });
  }

  /**
   * Checks if any Ethereum provider is available
   */
  isAvailable(): boolean {
    return (
      typeof window !== "undefined" && !!this.getAvailableEthereumProvider()
    );
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
   * Get active provider instance using BrowserProvider
   */
  public async getProvider(): Promise<
    ethers.JsonRpcProvider | ethers.BrowserProvider
  > {
    if (this.customProvider) {
      return this.customProvider;
    }

    if (!this.provider) {
      this.initProvider();
    }

    return this.provider as ethers.JsonRpcProvider | ethers.BrowserProvider;
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
    if (!Web3Connector.isMetaMaskAvailable()) {
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
  window.Web3Connector = Web3Connector;
} else if (typeof global !== "undefined") {
  (global as any).Web3Connector = Web3Connector;
}

export { Web3Connector };
