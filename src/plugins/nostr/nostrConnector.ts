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
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ConnectionResult,
  AlbyProvider,
  NostrProvider,
  SignatureCache,
  NostrConnectorConfig,
  NostrConnectorKeyPair,
} from "./types";
import derive from "../../gundb/derive";
import { generateUsernameFromIdentity } from "../../utils/validation";

// Extend the Window interface to include bitcoin wallet providers
declare global {
  interface Window {
    alby?: AlbyProvider;
    nostr?: NostrProvider;
    NostrConnector?: typeof NostrConnector;
  }
}

export const MESSAGE_TO_SIGN = "I Love Shogun!";

/**
 * Class for Bitcoin wallet connections and operations
 */
class NostrConnector extends EventEmitter {
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
   * Clear signature cache for a specific address or all addresses
   */
  public clearSignatureCache(address?: string): void {
    if (address) {
      // Clear cache for specific address
      this.signatureCache.delete(address);
      try {
        const localStorageKey = `shogun_bitcoin_sig_${address}`;
        localStorage.removeItem(localStorageKey);
        console.log(
          `Cleared signature cache for address: ${address.substring(0, 10)}...`,
        );
      } catch (error) {
        console.error(
          "Error clearing signature cache from localStorage:",
          error,
        );
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
        console.log(
          `Cleared all signature caches (${keysToRemove.length} entries)`,
        );
      } catch (error) {
        console.error(
          "Error clearing all signature caches from localStorage:",
          error,
        );
      }
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
    console.log(`Connecting to Bitcoin wallet via ${type}...`);

    try {
      let result: ConnectionResult;

      // Attempt to connect to the specified wallet type
      switch (type) {
        case "alby":
          console.log(
            "[nostrConnector] Alby is deprecated, redirecting to Nostr",
          );
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
        console.log(
          `Successfully connected to ${type} wallet: ${result.address}`,
        );
        this.emit("wallet_connected", {
          address: result.address,
          type: this.connectedType,
        });
      }

      return result;
    } catch (error: any) {
      console.error(`Error connecting to ${type} wallet:`, error);
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
          "Nostr extension is not available. Please install a Nostr compatible extension like nos2x, Alby, or Coracle.",
      };
    }

    try {
      console.log(
        "[nostrConnector] Attempting to connect to Nostr extension...",
      );

      // Get public key from Nostr extension
      const pubKey = await window.nostr!.getPublicKey();

      if (!pubKey) {
        throw new Error("Could not get public key from Nostr extension");
      }

      console.log(
        `[nostrConnector] Successfully connected to Nostr extension: ${pubKey.substring(0, 10)}...`,
      );

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
      console.error("[nostrConnector] Nostr connection error:", error);

      // Provide more specific error messages
      if (error.message && error.message.includes("User rejected")) {
        throw new Error("Nostr connection was rejected by the user");
      } else if (error.message && error.message.includes("not available")) {
        throw new Error(
          "Nostr extension is not available or not properly installed",
        );
      } else {
        throw new Error(`Nostr connection error: ${error.message}`);
      }
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
   * Generate credentials using Nostr: username deterministico e chiave GunDB derivata dall'address
   */
  async generateCredentials(
    address: string,
    signature: string,
    message: string,
  ) {
    const username = generateUsernameFromIdentity("nostr", { id: address });
    // Usa un hashing robusto di address con keccak256
    const hashedAddress = ethers.keccak256(ethers.toUtf8Bytes(address));
    // Include la signature nel salt per aggiungere un ulteriore livello di sicurezza
    const salt = `${username}_${address}_${message}_${signature}`;
    const key = await derive(hashedAddress, salt, { includeP256: true });
    return { username, key, message, signature };
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
      console.error("Error generating password:", error);
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

      console.log(`Verifying signature for address: ${addressStr}`);

      if (!signature || !message || !addressStr) {
        console.error(
          "Invalid message, signature, or address for verification",
        );
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
          console.error("Error in Nostr signature verification:", verifyError);
          return false;
        }
      } else if (this.connectedType === "manual" && this.manualKeyPair) {
        console.log("[nostrConnector] Manual verification for keypair");
        // For manual keypairs, we MUST use a secure verification method.
        if (!this.manualKeyPair.privateKey) {
          console.error("Manual verification failed: private key is missing.");
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
          console.error(
            "Error in manual signature verification:",
            manualVerifyError,
          );
          return false;
        }
      }

      console.warn(
        "No specific verification method available, signature cannot be fully verified",
      );
      return false;
    } catch (error) {
      console.error("Error verifying signature:", error);
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
   * Request a signature from the connected wallet
   */
  public async requestSignature(
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
            console.warn(
              "Alby is deprecated, using Nostr functionality for signature request",
            );
          }
          console.log(
            "[nostrConnector] Requesting Nostr signature for message:",
            message,
          );

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
          console.log(
            "Received Nostr signature:",
            signedEvent.sig.substring(0, 20) + "...",
          );

          return signedEvent.sig;

        case "manual":
          console.log("[nostrConnector] Using manual key pair for signature");
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
          console.log(
            "Generated manual signature:",
            signedEventManual.sig.substring(0, 20) + "...",
          );
          return signedEventManual.sig;

        default:
          throw new Error(`Unsupported wallet type: ${this.connectedType}`);
      }
    } catch (error: any) {
      console.error("Error requesting signature:", error);
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

// Funzione helper per derivare chiavi Nostr/Bitcoin (come per Web3/WebAuthn)
export async function deriveNostrKeys(
  address: string,
  signature: string,
  message: string,
) {
  // Usa solo l'address per rendere le credenziali deterministiche
  const salt = `${address}_${message}`;
  return await derive(address, salt, {
    includeP256: true,
  });
}

if (typeof window !== "undefined") {
  window.NostrConnector = NostrConnector;
} else if (typeof global !== "undefined") {
  (global as any).NostrConnector = NostrConnector;
}

export { NostrConnector };
