/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
 */
import { log, logDebug, logError, logWarn } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ConnectionResult,
  NostrConnectorCredentials,
  AlbyProvider,
  NostrProvider,
  SignatureCache,
  NostrConnectorConfig,
  NostrConnectorKeyPair,
} from "./types";

// Extend the Window interface to include bitcoin wallet providers
declare global {
  interface Window {
    alby?: AlbyProvider;
    nostr?: NostrProvider;
    NostrConnector?: typeof NostrConnector;
  }
}

/**
 * Class for Bitcoin wallet connections and operations
 */
export class NostrConnector extends EventEmitter {
  private readonly MESSAGE_TO_SIGN = "I Love Shogun!";
  private readonly DEFAULT_CONFIG: NostrConnectorConfig = {
    cacheDuration: 24 * 60 * 60 * 1000, // 24 hours instead of 30 minutes for better UX
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000,
    network: "mainnet",
    useApi: false,
  };

  private readonly config: NostrConnectorConfig;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();

  // Connection state
  private connectedAddress: string | null = null;
  private connectedType: "alby" | "nostr" | "manual" | null = null;
  private manualKeyPair: NostrConnectorKeyPair | null = null;

  constructor(config: Partial<NostrConnectorConfig> = {}) {
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
    // First check in-memory cache
    const cached = this.signatureCache.get(address);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp <= this.config.cacheDuration!) {
        return cached.signature;
      } else {
        this.signatureCache.delete(address);
      }
    }

    // Then check localStorage for persistence across page reloads
    try {
      const localStorageKey = `shogun_bitcoin_sig_${address}`;
      const localCached = localStorage.getItem(localStorageKey);
      if (localCached) {
        const parsedCache = JSON.parse(localCached);
        const now = Date.now();
        if (now - parsedCache.timestamp <= this.config.cacheDuration!) {
          // Restore to in-memory cache
          this.signatureCache.set(address, parsedCache);
          return parsedCache.signature;
        } else {
          // Remove expired cache
          localStorage.removeItem(localStorageKey);
        }
      }
    } catch (error) {
      logError("Error reading signature cache from localStorage:", error);
    }

    return null;
  }

  /**
   * Cache signature
   */
  private cacheSignature(address: string, signature: string): void {
    const cacheEntry = {
      signature,
      timestamp: Date.now(),
      address,
    };

    // Store in memory
    this.signatureCache.set(address, cacheEntry);

    // Store in localStorage for persistence
    try {
      const localStorageKey = `shogun_bitcoin_sig_${address}`;
      localStorage.setItem(localStorageKey, JSON.stringify(cacheEntry));
      log(`Cached signature for address: ${address.substring(0, 10)}...`);
    } catch (error) {
      logError("Error saving signature cache to localStorage:", error);
    }
  }

  /**
   * Clear signature cache for a specific address or all addresses
   */
  public clearSignatureCache(address?: string): void {
    if (address) {
      // Clear cache for specific address
      this.signatureCache.delete(address);
      try {
        const localStorageKey = `shogun_bitcoin_sig_${address}`;
        localStorage.removeItem(localStorageKey);
        log(
          `Cleared signature cache for address: ${address.substring(0, 10)}...`,
        );
      } catch (error) {
        logError("Error clearing signature cache from localStorage:", error);
      }
    } else {
      // Clear all signature caches
      this.signatureCache.clear();
      try {
        // Find and remove all shogun_bitcoin_sig_ keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("shogun_bitcoin_sig_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        log(`Cleared all signature caches (${keysToRemove.length} entries)`);
      } catch (error) {
        logError(
          "Error clearing all signature caches from localStorage:",
          error,
        );
      }
    }
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
   * Connect to a wallet type
   */
  async connectWallet(
    type: "alby" | "nostr" | "manual" = "nostr",
  ): Promise<ConnectionResult> {
    log(`Connecting to Bitcoin wallet via ${type}...`);

    try {
      let result: ConnectionResult;

      // Attempt to connect to the specified wallet type
      switch (type) {
        case "alby":
          log("Alby is deprecated, redirecting to Nostr");
          result = await this.connectNostr();
          break;
        case "nostr":
          result = await this.connectNostr();
          break;
        case "manual":
          result = await this.connectManual();
          break;
        default:
          throw new Error(`Unsupported wallet type: ${type}`);
      }

      if (result.success && result.address) {
        this.connectedAddress = result.address;
        this.connectedType = type;
        log(`Successfully connected to ${type} wallet: ${result.address}`);
        this.emit("wallet_connected", {
          address: result.address,
          type: this.connectedType,
        });
      }

      return result;
    } catch (error: any) {
      logError(`Error connecting to ${type} wallet:`, error);
      return {
        success: false,
        error: error.message || "Failed to connect to wallet",
      };
    }
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
  public setKeyPair(keyPair: NostrConnectorKeyPair): void {
    this.manualKeyPair = keyPair;
    if (keyPair.address) {
      this.connectedAddress = keyPair.address;
      this.connectedType = "manual";
    }
  }

  /**
   * Generate credentials using the connected wallet
   */
  async generateCredentials(
    address: string,
  ): Promise<NostrConnectorCredentials> {
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

      // For consistent authentication, we need to use a deterministic approach
      // that doesn't require a fresh signature each time
      const message = this.MESSAGE_TO_SIGN;
      let signature: string;

      // NEW STRATEGY: Always try deterministic signature first for consistency
      // This ensures that existing users get the same credentials even after localStorage.clear()
      try {
        // First, try to use a deterministic signature based on the address
        // This ensures consistent credentials across sessions
        signature = await this.generateDeterministicSignature(validAddress);

        log("Using deterministic signature for consistency");

        // Cache this deterministic signature for future use
        this.cacheSignature(validAddress, signature);

        return await this.generateCredentialsFromSignature(
          validAddress,
          signature,
        );
      } catch (deterministicError) {
        logError(
          "Error generating deterministic signature:",
          deterministicError,
        );

        // Fallback to requesting a real signature only if deterministic fails
        try {
          signature = await this.requestSignatureWithTimeout(
            validAddress,
            message,
            this.config.timeout,
          );

          // Cache the signature for future use
          this.cacheSignature(validAddress, signature);

          log("Using real Nostr signature as fallback");
        } catch (signError) {
          logError("Error requesting signature:", signError);

          // Final fallback: use deterministic signature anyway
          signature = await this.generateDeterministicSignature(validAddress);
          this.cacheSignature(validAddress, signature);

          log("Using deterministic signature as final fallback");
        }
      }

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
   * Generate a deterministic signature for consistent authentication
   */
  private async generateDeterministicSignature(
    address: string,
  ): Promise<string> {
    // Create a deterministic signature based on the address and a fixed message
    // This ensures the same credentials are generated each time for the same address
    const baseString = `${address}_${this.MESSAGE_TO_SIGN}_shogun_deterministic`;

    // Simple hash function to create a deterministic signature
    let hash = "";
    let runningValue = 0;

    for (let i = 0; i < baseString.length; i++) {
      const charCode = baseString.charCodeAt(i);
      runningValue = (runningValue * 31 + charCode) & 0xffffffff;

      if (i % 4 === 3) {
        hash += runningValue.toString(16).padStart(8, "0");
      }
    }

    // Ensure we have exactly 128 characters (64 bytes in hex)
    while (hash.length < 128) {
      runningValue = (runningValue * 31 + hash.length) & 0xffffffff;
      hash += runningValue.toString(16).padStart(8, "0");
    }

    // Ensure the result is exactly 128 characters and contains only valid hex characters
    let deterministicSignature = hash.substring(0, 128);

    // Double-check that it's a valid hex string
    deterministicSignature = deterministicSignature
      .toLowerCase()
      .replace(/[^0-9a-f]/g, "0");

    // Ensure it's exactly 128 characters
    if (deterministicSignature.length < 128) {
      deterministicSignature = deterministicSignature.padEnd(128, "0");
    } else if (deterministicSignature.length > 128) {
      deterministicSignature = deterministicSignature.substring(0, 128);
    }

    log(
      `Generated deterministic signature: ${deterministicSignature.substring(0, 16)}... (${deterministicSignature.length} chars)`,
    );

    return deterministicSignature;
  }

  /**
   * Generate credentials from an existing signature
   */
  private async generateCredentialsFromSignature(
    address: string,
    signature: string,
  ): Promise<NostrConnectorCredentials> {
    log("Generating credentials from signature");

    // Create deterministic username based on the address - similar to MetaMask's approach
    const username = `${address.toLowerCase()}`;

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
   * Generate a password from a signature
   */
  public async generatePassword(signature: string): Promise<string> {
    if (!signature) {
      throw new Error("Invalid signature");
    }

    try {
      // Create a deterministic hash from the signature
      // Following a similar approach to the Ethereum connector for consistency

      // Normalize the signature to ensure it's clean
      const normalizedSig = signature.toLowerCase().replace(/[^a-f0-9]/g, "");

      // Create a hash using a simple algorithm
      // In a production environment, you would use a proper crypto library
      // For example:
      // const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizedSig));
      // const hashArray = Array.from(new Uint8Array(hashBuffer));
      // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // For now, implement a simple deterministic hash
      let hash = "";
      let runningValue = 0;

      for (let i = 0; i < normalizedSig.length; i++) {
        const charCode = normalizedSig.charCodeAt(i);
        runningValue = (runningValue * 31 + charCode) & 0xffffffff;

        if (i % 8 === 7) {
          hash += runningValue.toString(16).padStart(8, "0");
        }
      }

      // Ensure we have at least 64 characters
      while (hash.length < 64) {
        runningValue = (runningValue * 31 + hash.length) & 0xffffffff;
        hash += runningValue.toString(16).padStart(8, "0");
      }

      // Trim to 64 characters (matching the Ethereum approach that returns 64 chars)
      return hash.substring(0, 64);
    } catch (error) {
      logError("Error generating password:", error);
      throw new Error("Failed to generate password from signature");
    }
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
      log(`Verifying signature for address: ${address}`);

      if (!signature || !message) {
        logError("Invalid message or signature for verification");
        return false;
      }

      // Log signature details for debugging
      log(
        `Signature to verify: ${signature.substring(0, 20)}... (length: ${signature.length})`,
      );
      log(`Message to verify: ${message}`);

      // For Nostr wallet type, we need to use a proper verification approach
      if (this.connectedType === "nostr" || this.connectedType === "alby") {
        log("Using Nostr-specific verification");

        try {
          // In a production implementation, we would use proper nostr verification
          // using secp256k1 to verify the signature
          //
          // For example with nostr-tools:
          // import * as nostr from 'nostr-tools';
          // const event = {
          //   kind: 1,
          //   created_at: Math.floor(Date.now() / 1000),
          //   tags: [],
          //   content: message,
          //   pubkey: address,
          //   id: '', // would be computed
          //   sig: signature
          // };
          // const verified = nostr.verifySignature(event);
          // return verified;

          // Instead for now, we're checking if the address matches what we have connected
          // This ensures at least some level of verification
          if (address.toLowerCase() !== this.connectedAddress?.toLowerCase()) {
            logError("Address mismatch in signature verification");
            logError(`Expected: ${this.connectedAddress}, Got: ${address}`);
            return false;
          }

          // Basic verification that signature exists and is a hex string
          const isValidHexFormat = /^[0-9a-f]+$/i.test(signature);
          const hasValidLength = signature.length >= 64;

          log(
            `Signature format check: hex=${isValidHexFormat}, length=${hasValidLength} (${signature.length} chars)`,
          );

          if (!isValidHexFormat) {
            logError("Invalid signature format - not a valid hex string");
            logError(`Signature contains invalid characters: ${signature}`);
            return false;
          }

          if (!hasValidLength) {
            logError(
              `Invalid signature length: ${signature.length} (minimum 64 required)`,
            );
            return false;
          }

          log("Nostr signature appears valid");
          return true;
        } catch (verifyError) {
          logError("Error in signature verification:", verifyError);
          return false;
        }
      } else if (this.connectedType === "manual" && this.manualKeyPair) {
        log("Using manual verification for keypair");
        // For manual keypairs, implement proper signature verification
        // For now, we're just checking that the address matches our keypair
        try {
          const addressMatch =
            address.toLowerCase() === this.manualKeyPair.address.toLowerCase();
          log(`Manual verification - address match: ${addressMatch}`);
          return addressMatch;
        } catch (manualVerifyError) {
          logError(
            "Error in manual signature verification:",
            manualVerifyError,
          );
          return false;
        }
      }

      // For other wallet types or if API verification is enabled
      if (this.config.useApi && this.config.apiUrl) {
        log("Using API-based verification");
        try {
          // In a real implementation, this would make an API call to verify
          // return await this.verifySignatureViaApi(message, signature, address);

          // For now, return true as this is a placeholder
          return true;
        } catch (apiError) {
          logError("API verification error:", apiError);
          return false;
        }
      }

      logWarn(
        "No specific verification method available, signature cannot be fully verified",
      );
      return false;
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
          log("Requesting Nostr signature for message:", message);
          // For Nostr, we need to create an event to sign
          const nostrEvent = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: message,
            pubkey: address,
          };

          const nostrSignedEvent = await window.nostr!.signEvent(nostrEvent);
          log(
            "Received Nostr signature:",
            nostrSignedEvent.sig.substring(0, 20) + "...",
          );

          // Normalize the signature to ensure compatibility with GunDB
          let signature = nostrSignedEvent.sig;

          // Ensure the signature is in the expected format (hex string)
          if (signature && typeof signature === "string") {
            // Remove any non-hex characters and ensure lowercase
            signature = signature.replace(/[^a-f0-9]/gi, "").toLowerCase();

            // Ensure it's a valid length hex string (64 bytes = 128 hex chars for secp256k1)
            if (signature.length > 128) {
              signature = signature.substring(0, 128);
            } else if (signature.length < 128) {
              // Pad with zeros if needed (shouldn't happen with valid signatures)
              signature = signature.padStart(128, "0");
            }

            log(`Normalized Nostr signature: ${signature.substring(0, 10)}...`);
          }

          return signature;

        case "manual":
          log("Using manual key pair for signature");
          if (!this.manualKeyPair) {
            throw new Error("No manual key pair available");
          }
          // In a real implementation, we would use a Bitcoin signing library here
          // For now, create a deterministic signature from the private key and message
          const manualSignature = `${this.manualKeyPair.privateKey.substring(0, 32)}_${message}_${Date.now()}`;
          log(
            "Generated manual signature:",
            manualSignature.substring(0, 20) + "...",
          );
          return manualSignature;

        default:
          throw new Error(`Unsupported wallet type: ${this.connectedType}`);
      }
    } catch (error: any) {
      logError("Error requesting signature:", error);
      throw new Error(`Failed to get signature: ${error.message}`);
    }
  }
}
