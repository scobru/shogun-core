/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
 */
import { log, logDebug, logError, logWarn } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ConnectionResult,
  BitcoinCredentials,
  AlbyProvider,
  NostrProvider,
  SignatureCache,
  BitcoinWalletConfig,
  BitcoinKeyPair,
} from "./types";

// Extend the Window interface to include bitcoin wallet providers
declare global {
  interface Window {
    alby?: AlbyProvider;
    nostr?: NostrProvider;
    Bitcoin?: typeof BitcoinWallet;
  }
}

/**
 * Class for Bitcoin wallet connections and operations
 */
export class BitcoinWallet extends EventEmitter {
  private readonly MESSAGE_TO_SIGN = "I Love Shogun!";
  private readonly DEFAULT_CONFIG: BitcoinWalletConfig = {
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000,
    network: "mainnet",
    useApi: false,
  };

  private readonly config: BitcoinWalletConfig;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();

  // Connection state
  private connectedAddress: string | null = null;
  private connectedType: "alby" | "nostr" | "manual" | null = null;
  private manualKeyPair: BitcoinKeyPair | null = null;

  constructor(config: Partial<BitcoinWalletConfig> = {}) {
    super();
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Currently no global events to listen to
    // This would be the place to add listeners for wallet connections/disconnections
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    this.removeAllListeners();
    this.connectedAddress = null;
    this.connectedType = null;
    this.manualKeyPair = null;
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
      const normalizedAddress = String(address).trim();

      // Basic validation for Bitcoin addresses and Nostr pubkeys
      if (this.connectedType === "nostr") {
        // Nostr pubkeys are typically hex strings starting with 'npub' when encoded
        if (!/^(npub1|[0-9a-f]{64})/.test(normalizedAddress)) {
          throw new Error("Invalid Nostr public key format");
        }
      } else {
        // Simple format check for Bitcoin addresses
        // More sophisticated validation would require a library
        if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/.test(normalizedAddress)) {
          throw new Error("Invalid Bitcoin address format");
        }
      }

      return normalizedAddress;
    } catch (error) {
      ErrorHandler.handle(
        ErrorType.VALIDATION,
        "INVALID_ADDRESS",
        "Invalid Bitcoin address provided",
        error,
      );
      throw error;
    }
  }

  /**
   * Check if Alby extension is available
   * @deprecated Alby support is deprecated, use Nostr instead
   */
  public isAlbyAvailable(): boolean {
    logWarn("Alby support is deprecated, use Nostr instead");
    // Return false to encourage using Nostr
    return false;
  }

  /**
   * Check if Nostr extension is available
   */
  public isNostrExtensionAvailable(): boolean {
    return typeof window !== "undefined" && !!window.nostr;
  }

  /**
   * Check if any Bitcoin wallet is available
   */
  public isAvailable(): boolean {
    return this.isNostrExtensionAvailable() || this.manualKeyPair !== null;
  }

  /**
   * Connect to a Bitcoin wallet
   * @param type Type of wallet to connect to
   */
  async connectWallet(
    type: "alby" | "nostr" | "manual" = "nostr",
  ): Promise<ConnectionResult> {
    try {
      logDebug(`Attempting to connect to ${type} wallet...`);

      // If alby is requested, redirect to nostr and warn
      if (type === "alby") {
        logWarn("Alby support is deprecated, using Nostr instead");
        type = "nostr";
      }

      switch (type) {
        case "nostr":
          return await this.connectNostr();
        case "manual":
          return await this.connectManual();
        default:
          throw new Error(`Unsupported wallet type: ${type}`);
      }
    } catch (error: any) {
      logError(`Failed to connect to ${type} wallet:`, error);
      ErrorHandler.handle(
        ErrorType.NETWORK,
        "BITCOIN_WALLET_CONNECTION_ERROR",
        error.message ?? `Unknown error while connecting to ${type} wallet`,
        error,
      );
      return {
        success: false,
        error: error.message ?? `Failed to connect to ${type} wallet`,
      };
    }
  }

  /**
   * Connect to Alby extension
   * @deprecated Alby support is deprecated, use connectNostr instead
   */
  private async connectAlby(): Promise<ConnectionResult> {
    logWarn("Alby support is deprecated, redirecting to Nostr");
    return this.connectNostr();
  }

  /**
   * Connect to Nostr extension
   */
  private async connectNostr(): Promise<ConnectionResult> {
    if (!this.isNostrExtensionAvailable()) {
      return {
        success: false,
        error:
          "Nostr extension is not available. Please install a Nostr compatible extension.",
      };
    }

    try {
      // Get public key from Nostr extension
      const pubKey = await window.nostr!.getPublicKey();

      if (!pubKey) {
        throw new Error("Could not get public key from Nostr extension");
      }

      this.connectedAddress = pubKey;
      this.connectedType = "nostr";

      // Emit connected event
      this.emit("connected", { address: pubKey, type: "nostr" });

      const username = `nostr_${pubKey.substring(0, 10)}`;

      return {
        success: true,
        address: pubKey,
        username,
        extensionType: "nostr",
      };
    } catch (error: any) {
      throw new Error(`Nostr connection error: ${error.message}`);
    }
  }

  /**
   * Set up manual key pair for connection
   */
  private async connectManual(): Promise<ConnectionResult> {
    // For manual connection, we'd need to have a keypair set
    if (!this.manualKeyPair) {
      return {
        success: false,
        error: "No manual key pair configured. Use setKeyPair() first.",
      };
    }

    this.connectedAddress = this.manualKeyPair.address;
    this.connectedType = "manual";

    // Emit connected event
    this.emit("connected", {
      address: this.manualKeyPair.address,
      type: "manual",
    });

    const username = `btc_${this.manualKeyPair.address.substring(0, 10)}`;

    return {
      success: true,
      address: this.manualKeyPair.address,
      username,
      extensionType: "manual",
    };
  }

  /**
   * Set a manual key pair for use
   */
  public setKeyPair(keyPair: BitcoinKeyPair): void {
    this.manualKeyPair = keyPair;
    if (keyPair.address) {
      this.connectedAddress = keyPair.address;
      this.connectedType = "manual";
    }
  }

  /**
   * Generate credentials using the connected wallet
   */
  async generateCredentials(address: string): Promise<BitcoinCredentials> {
    logDebug(`Generating credentials for address: ${address}`);

    try {
      // Validate the address
      const validAddress = this.validateAddress(address);

      // Check cache first
      const cachedSignature = this.getCachedSignature(validAddress);
      if (cachedSignature) {
        logDebug("Using cached signature");
        return await this.generateCredentialsFromSignature(
          validAddress,
          cachedSignature,
        );
      }

      // Request a new signature
      const message = this.MESSAGE_TO_SIGN;
      let signature: string;

      try {
        signature = await this.requestSignatureWithTimeout(
          validAddress,
          message,
          this.config.timeout,
        );
      } catch (signError) {
        logError("Error requesting signature:", signError);
        // Fallback to a deterministic credential derivation for certain cases
        if (this.connectedType === "manual" && this.manualKeyPair) {
          return await this.generateFallbackCredentials(validAddress);
        }
        throw signError;
      }

      // Cache the signature
      this.cacheSignature(validAddress, signature);

      return await this.generateCredentialsFromSignature(
        validAddress,
        signature,
      );
    } catch (error) {
      logError("Error generating credentials:", error);
      throw error;
    }
  }

  /**
   * Generate credentials from an existing signature
   */
  private async generateCredentialsFromSignature(
    address: string,
    signature: string,
  ): Promise<BitcoinCredentials> {
    // Create deterministic username based on the address
    const username = `btc_${address.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    // Create password from the signature
    const password = await this.generatePassword(signature);

    return {
      username,
      password,
      message: this.MESSAGE_TO_SIGN,
      signature,
    };
  }

  /**
   * Generate fallback credentials when signature is not available
   */
  private async generateFallbackCredentials(
    address: string,
  ): Promise<BitcoinCredentials> {
    // This is a fallback for when we can't get a signature but have the keypair
    // Only use this for manual connections where we control the private key
    if (this.connectedType !== "manual" || !this.manualKeyPair) {
      throw new Error(
        "Fallback credentials only available for manual connections",
      );
    }

    const username = `btc_${address.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    // Create a deterministic password from the private key
    // Note: In a real implementation, this would use a proper key derivation function
    const password = await this.generatePassword(this.manualKeyPair.privateKey);

    // Create a dummy signature - in a real implementation, we'd actually sign with the private key
    const signature = `manual_${this.manualKeyPair.privateKey.slice(-16)}`;

    return {
      username,
      password,
      message: this.MESSAGE_TO_SIGN,
      signature,
    };
  }

  /**
   * Request signature with timeout
   */
  private requestSignatureWithTimeout(
    address: string,
    message: string,
    timeout: number = 30000,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Signature request timed out"));
      }, timeout);

      this.requestSignature(address, message)
        .then((signature) => {
          clearTimeout(timeoutId);
          resolve(signature);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Request a signature from the connected wallet
   */
  private async requestSignature(
    address: string,
    message: string,
  ): Promise<string> {
    if (!this.connectedType) {
      throw new Error("No wallet connected");
    }

    try {
      switch (this.connectedType) {
        case "alby":
          // Redirect Alby requests to Nostr
          logWarn("Alby is deprecated, redirecting signature request to Nostr");

          if (!window.nostr) {
            throw new Error("Nostr extension not available");
          }

          // For Nostr, we need to create an event to sign
          const albyRedirectEvent = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: message,
            pubkey: address,
          };

          const albyRedirectResult =
            await window.nostr.signEvent(albyRedirectEvent);
          return albyRedirectResult.sig;

        case "nostr":
          // For Nostr, we need to create an event to sign
          const nostrEvent = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: message,
            pubkey: address,
          };

          const nostrSignedEvent = await window.nostr!.signEvent(nostrEvent);
          return nostrSignedEvent.sig;

        case "manual":
          if (!this.manualKeyPair) {
            throw new Error("No manual key pair available");
          }
          // In a real implementation, we would use a Bitcoin signing library here
          // For now, we'll just create a dummy signature
          return `manual_signature_${Date.now()}`;

        default:
          throw new Error(`Unsupported wallet type: ${this.connectedType}`);
      }
    } catch (error: any) {
      logError("Error requesting signature:", error);
      throw new Error(`Failed to get signature: ${error.message}`);
    }
  }

  /**
   * Generate a password from a signature
   */
  public async generatePassword(signature: string): Promise<string> {
    // Create a deterministic password from the signature
    // In a real implementation, we would use a proper key derivation function
    // For now, we'll just hash the signature

    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to alphanumeric password
    const hashStr = Math.abs(hash).toString(36);
    return `btc_${hashStr}`;
  }

  /**
   * Verify a signature
   */
  public async verifySignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    try {
      // In a real implementation, this would use actual Bitcoin signature verification
      // or call an API to verify the signature

      // For now, we'll just simulate verification based on the connection type
      if (this.connectedType === "nostr") {
        // For Nostr, we would verify using nostr-tools or similar library
        // Mocking this for demonstration
        return address === this.connectedAddress;
      } else if (this.connectedType === "alby") {
        // Alby is deprecated, redirect to Nostr verification
        logWarn("Alby is deprecated, using Nostr verification logic");
        return address === this.connectedAddress;
      } else if (this.connectedType === "manual" && this.manualKeyPair) {
        // For manual, we're trusting our own keypair
        return address === this.manualKeyPair.address;
      }

      // If using an API for verification, we would do something like:
      if (this.config.useApi && this.config.apiUrl) {
        try {
          // This is a placeholder for an API call to verify the signature
          // const response = await fetch(`${this.config.apiUrl}/verify`, {
          //   method: 'POST',
          //   body: JSON.stringify({ message, signature, address }),
          //   headers: { 'Content-Type': 'application/json' }
          // });
          // const result = await response.json();
          // return result.valid === true;

          // Mocked for demonstration
          return true;
        } catch (apiError) {
          logError("API verification failed:", apiError);
          return false;
        }
      }

      // Default fallback - in a real implementation, we would not reach here
      logWarn("Falling back to trust-based verification");
      return true;
    } catch (error) {
      logError("Error verifying signature:", error);
      return false;
    }
  }

  /**
   * Get the currently connected address
   */
  public getConnectedAddress(): string | null {
    return this.connectedAddress;
  }

  /**
   * Get the currently connected wallet type
   */
  public getConnectedType(): "alby" | "nostr" | "manual" | null {
    return this.connectedType;
  }
}
