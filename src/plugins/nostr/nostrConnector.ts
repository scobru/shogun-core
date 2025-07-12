/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
 */
import { ethers } from "ethers";
import {
  verifyEvent,
  finalizeEvent,
  utils as nostrUtils,
  getEventHash,
} from "nostr-tools";
import type { Event } from "nostr-tools";
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
class NostrConnector extends EventEmitter {
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
   * Generate a deterministic password from an address
   */
  private async generateDeterministicPassword(
    address: string,
  ): Promise<string> {
    const salt = "shogun-nostr-password-salt-v2"; // Use a constant salt.
    const saltedAddress = `${address}:${salt}:${this.MESSAGE_TO_SIGN}`;
    return ethers.sha256(ethers.toUtf8Bytes(saltedAddress));
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
        // Nostr pubkeys are hex strings (64 chars) or npub-prefixed keys
        // Just check if it's a non-empty string, as we're getting it directly from the extension
        if (!normalizedAddress) {
          throw new Error("Empty Nostr public key");
        }
      } else if (this.connectedType === "manual") {
        // For manual keys, just ensure we have something
        if (!normalizedAddress) {
          throw new Error("Empty manual key");
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
      // Set the connectedType to nostr if it's not already set
      // This ensures validateAddress will use the correct validation logic
      if (!this.connectedType && address) {
        // If the address looks like a Nostr pubkey (hex string or npub prefix)
        if (/^[0-9a-f]{64}$/.test(address) || address.startsWith("npub")) {
          this.connectedType = "nostr";
          this.connectedAddress = address;
        }
      }

      // Validate the address
      const validAddress = this.validateAddress(address);

      // We still need a signature to prove ownership, but we won't use it for the password.
      // We can check the cache for a signature to avoid prompting the user again.
      let signature = this.getCachedSignature(validAddress);
      if (!signature) {
        signature = await this.requestSignatureWithTimeout(
          validAddress,
          this.MESSAGE_TO_SIGN,
          this.config.timeout,
        );
        this.cacheSignature(validAddress, signature);
        log("Using real Nostr signature for proof, not for password.");
      } else {
        logDebug("Using cached signature for proof.");
      }

      // The password is now generated deterministically from the address.
      const password = await this.generateDeterministicPassword(validAddress);

      const username = `${validAddress.toLowerCase()}`;

      return {
        username,
        password,
        message: this.MESSAGE_TO_SIGN,
        signature,
      };
    } catch (error) {
      logError("Error generating credentials:", error);
      throw error;
    }
  }

  /**
   * Generate a password from a signature
   */
  public async generatePassword(signature: string): Promise<string> {
    if (!signature) {
      throw new Error("Invalid signature");
    }

    try {
      // Create a deterministic hash from the signature using a secure algorithm
      const normalizedSig = signature.toLowerCase().replace(/[^a-f0-9]/g, "");
      const passwordHash = ethers.sha256(ethers.toUtf8Bytes(normalizedSig));
      return passwordHash;
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
    address: any,
  ): Promise<boolean> {
    try {
      // Ensure address is a string
      const addressStr =
        typeof address === "object"
          ? address.address || JSON.stringify(address)
          : String(address);

      log(`Verifying signature for address: ${addressStr}`);

      if (!signature || !message || !addressStr) {
        logError("Invalid message, signature, or address for verification");
        return false;
      }

      // For Nostr wallet type, use nostr-tools for verification
      if (this.connectedType === "nostr" || this.connectedType === "alby") {
        try {
          // Reconstruct the exact event that was signed
          const eventData = {
            kind: 1,
            created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
            tags: [],
            content: message,
            pubkey: addressStr,
          };
          const event: Event = {
            ...eventData,
            id: getEventHash(eventData),
            sig: signature,
          };

          return verifyEvent(event);
        } catch (verifyError) {
          logError("Error in Nostr signature verification:", verifyError);
          return false;
        }
      } else if (this.connectedType === "manual" && this.manualKeyPair) {
        log("Manual verification for keypair");
        // For manual keypairs, we MUST use a secure verification method.
        if (!this.manualKeyPair.privateKey) {
          logError("Manual verification failed: private key is missing.");
          return false;
        }
        try {
          const eventData = {
            kind: 1,
            created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
            tags: [],
            content: message,
            pubkey: addressStr,
          };
          const event: Event = {
            ...eventData,
            id: getEventHash(eventData),
            sig: signature,
          };
          return verifyEvent(event);
        } catch (manualVerifyError) {
          logError(
            "Error in manual signature verification:",
            manualVerifyError,
          );
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
        case "nostr":
          if (this.connectedType === "alby") {
            logWarn(
              "Alby is deprecated, using Nostr functionality for signature request",
            );
          }
          log("Requesting Nostr signature for message:", message);

          if (!window.nostr) {
            throw new Error("Nostr extension not available");
          }

          // For Nostr, we need to create an event to sign with a fixed timestamp
          const eventData = {
            kind: 1,
            created_at: 0, // IMPORTANT: Use a fixed timestamp to make signatures verifiable
            tags: [],
            content: message,
            pubkey: address,
          };
          const nostrEvent: Event = {
            ...eventData,
            id: getEventHash(eventData),
            sig: "", // This will be filled by window.nostr.signEvent
          };

          const signedEvent = await window.nostr!.signEvent(nostrEvent);
          log(
            "Received Nostr signature:",
            signedEvent.sig.substring(0, 20) + "...",
          );

          return signedEvent.sig;

        case "manual":
          log("Using manual key pair for signature");
          if (!this.manualKeyPair || !this.manualKeyPair.privateKey) {
            throw new Error(
              "No manual key pair available or private key missing",
            );
          }
          // Use nostr-tools to sign securely
          const manualEventData = {
            kind: 1,
            created_at: 0, // IMPORTANT: Use a fixed timestamp
            tags: [],
            content: message,
            pubkey: this.manualKeyPair.address,
          };
          const eventTemplate: Event = {
            ...manualEventData,
            id: getEventHash(manualEventData),
            sig: "", // This will be filled by finalizeEvent
          };
          const privateKeyBytes = nostrUtils.hexToBytes(
            this.manualKeyPair.privateKey,
          );
          const signedEventManual = await finalizeEvent(
            eventTemplate,
            privateKeyBytes,
          );
          log(
            "Generated manual signature:",
            signedEventManual.sig.substring(0, 20) + "...",
          );
          return signedEventManual.sig;

        default:
          throw new Error(`Unsupported wallet type: ${this.connectedType}`);
      }
    } catch (error: any) {
      logError("Error requesting signature:", error);
      throw new Error(`Failed to get signature: ${error.message}`);
    }
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
}

if (typeof window !== "undefined") {
  window.NostrConnector = NostrConnector;
} else if (typeof global !== "undefined") {
  (global as any).NostrConnector = NostrConnector;
}

export { NostrConnector };
