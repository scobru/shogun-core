/**
 * Constants for WebAuthn configuration
 */
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 64;

import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  DeviceInfo,
  WebAuthnCredentials,
  CredentialResult,
  WebAuthnConfig,
  WebAuthnEventType,
  WebAuthnOperationOptions,
  WebAuthnCredentialData,
  WebAuthnVerificationResult,
} from "./types";
import { IGunInstance } from "gun";
import derive from "../../gundb/derive";

/**
 * Extends Window interface to include WebauthnAuth
 */
declare global {
  interface Window {
    Webauthn?: typeof Webauthn;
  }
}

/**
 * Extends NodeJS Global interface to include WebauthnAuth
 */
declare global {
  namespace NodeJS {
    interface Global {
      Webauthn?: typeof Webauthn;
    }
  }
}

/**
 * Constants for WebAuthn configuration
 */
const DEFAULT_CONFIG: WebAuthnConfig = {
  rpName: "Shogun Wallet",
  timeout: 60000,
  userVerification: "preferred",
  attestation: "none",
  authenticatorAttachment: "platform",
  requireResidentKey: false,
};

/**
 * Main WebAuthn class for authentication management
 */
export class Webauthn extends EventEmitter {
  private readonly config: WebAuthnConfig;
  private readonly gunInstance?: IGunInstance;
  private credential: WebAuthnCredentialData | null;
  private abortController: AbortController | null = null;

  /**
   * Creates a new WebAuthn instance
   */
  constructor(gunInstance?: IGunInstance, config?: Partial<WebAuthnConfig>) {
    super();
    this.gunInstance = gunInstance;
    this.credential = null;

    // Merge default config with provided config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      rpId:
        config?.rpId ??
        (typeof window !== "undefined"
          ? window.location.hostname.split(":")[0]
          : "localhost"),
    };
  }

  /**
   * Validates a username
   */
  validateUsername(username: string): void {
    if (!username || typeof username !== "string") {
      throw new Error("Username must be a non-empty string");
    }

    if (
      username.length < MIN_USERNAME_LENGTH ||
      username.length > MAX_USERNAME_LENGTH
    ) {
      throw new Error(
        `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`,
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores and hyphens",
      );
    }
  }

  /**
   * Creates a new WebAuthn account with retry logic
   */
  async createAccount(
    username: string,
    credentials: WebAuthnCredentials | null,
    isNewDevice = false,
  ): Promise<CredentialResult> {
    try {
      this.validateUsername(username);

      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.generateCredentials(
            username,
            credentials,
            isNewDevice,
          );

          if (result.success) {
            this.emit(WebAuthnEventType.DEVICE_REGISTERED, {
              type: WebAuthnEventType.DEVICE_REGISTERED,
              data: { username },
              timestamp: Date.now(),
            });
            return result;
          }

          lastError = new Error(result.error ?? "Unknown error");
        } catch (error: any) {
          lastError = error;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
      }

      throw lastError || new Error("Failed to create account after retries");
    } catch (error: any) {
      this.emit(WebAuthnEventType.ERROR, {
        type: WebAuthnEventType.ERROR,
        data: { error: error.message },
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Authenticates a user with timeout and abort handling
   */
  async authenticateUser(
    username: string,
    salt: string | null,
    options: WebAuthnOperationOptions = {},
  ): Promise<CredentialResult> {
    try {
      this.validateUsername(username);

      if (!salt) {
        const error = new Error(
          "No WebAuthn credentials found for this username",
        );
        ErrorHandler.handle(
          ErrorType.WEBAUTHN,
          "NO_CREDENTIALS",
          error.message,
          error,
        );
        return { success: false, error: error.message };
      }

      // Cancel any existing authentication attempt
      this.abortAuthentication();

      // Create new abort controller
      this.abortController = new AbortController();

      const timeout = options.timeout || this.config.timeout;
      const timeoutId = setTimeout(
        () => this.abortController?.abort(),
        timeout,
      );

      try {
        const challenge = this.generateChallenge(username);
        const assertionOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          allowCredentials: [],
          timeout,
          userVerification:
            options.userVerification || this.config.userVerification,
          rpId: this.config.rpId,
        };

        const assertion = (await navigator.credentials.get({
          publicKey: assertionOptions,
          signal: this.abortController.signal,
        })) as PublicKeyCredential;

        if (!assertion) {
          throw new Error("WebAuthn verification failed");
        }

        const { password } = this.generateCredentialsFromSalt(username, salt);
        const deviceInfo = this.getDeviceInfo(assertion.id);

        const result: CredentialResult = {
          success: true,
          username,
          password,
          credentialId: this.bufferToBase64(assertion.rawId),
          deviceInfo,
        };

        this.emit(WebAuthnEventType.AUTHENTICATION_SUCCESS, {
          type: WebAuthnEventType.AUTHENTICATION_SUCCESS,
          data: { username, deviceInfo },
          timestamp: Date.now(),
        });

        return result;
      } finally {
        clearTimeout(timeoutId);
        this.abortController = null;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown WebAuthn error";

      this.emit(WebAuthnEventType.AUTHENTICATION_FAILED, {
        type: WebAuthnEventType.AUTHENTICATION_FAILED,
        data: { username, error: errorMessage },
        timestamp: Date.now(),
      });

      ErrorHandler.handle(
        ErrorType.WEBAUTHN,
        "AUTH_ERROR",
        errorMessage,
        error,
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Aborts current authentication attempt
   */
  abortAuthentication(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Gets device information
   */
  private getDeviceInfo(credentialId: string): DeviceInfo {
    const platformInfo = this.getPlatformInfo();
    return {
      deviceId: credentialId,
      timestamp: Date.now(),
      name: platformInfo.name,
      platform: platformInfo.platform,
      lastUsed: Date.now(),
    };
  }

  /**
   * Gets platform information
   */
  private getPlatformInfo(): { name: string; platform: string } {
    if (typeof navigator === "undefined") {
      return { name: "unknown", platform: "unknown" };
    }

    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    if (/iPhone|iPad|iPod/.test(platform)) {
      return { name: "iOS Device", platform };
    }

    if (/Android/.test(userAgent)) {
      return { name: "Android Device", platform };
    }

    if (/Win/.test(platform)) {
      return { name: "Windows Device", platform };
    }

    if (/Mac/.test(platform)) {
      return { name: "Mac Device", platform };
    }

    if (/Linux/.test(platform)) {
      return { name: "Linux Device", platform };
    }

    return { name: "Unknown Device", platform };
  }

  /**
   * Generates a challenge for WebAuthn operations
   */
  private generateChallenge(username: string): Uint8Array {
    const timestamp = Date.now().toString();
    const randomBytes = this.getRandomBytes(32);
    const challengeData = `${username}-${timestamp}-${this.uint8ArrayToHex(randomBytes)}`;
    return new TextEncoder().encode(challengeData);
  }

  /**
   * Gets cryptographically secure random bytes
   */
  private getRandomBytes(length: number): Uint8Array {
    if (typeof window !== "undefined" && window.crypto) {
      return window.crypto.getRandomValues(new Uint8Array(length));
    }
    throw new Error("No cryptographic implementation available");
  }

  /**
   * Converts Uint8Array to hexadecimal string
   */
  private uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Converts ArrayBuffer to URL-safe base64 string
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce(
      (str, byte) => str + String.fromCharCode(byte),
      "",
    );
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generates credentials from username and salt
   */
  private generateCredentialsFromSalt(
    username: string,
    salt: string,
  ): { password: string } {
    const data = ethers.toUtf8Bytes(username + salt);
    return {
      password: ethers.sha256(data),
    };
  }

  /**
   * Checks if WebAuthn is supported
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" && window.PublicKeyCredential !== undefined
    );
  }

  /**
   * Creates a WebAuthn credential for registration
   */
  private async createCredential(
    username: string,
  ): Promise<WebAuthnCredentialData> {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(username);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: "Shogun Wallet",
            ...(this.config.rpId !== "localhost" && { id: this.config.rpId }),
          },
          user: {
            id: userId,
            name: username,
            displayName: username,
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          timeout: this.config.timeout,
          attestation: this.config.attestation,
          authenticatorSelection: {
            authenticatorAttachment: this.config.authenticatorAttachment,
            userVerification: this.config.userVerification,
            requireResidentKey: this.config.requireResidentKey,
          },
        };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (!credential) {
        throw new Error("Credential creation failed");
      }

      const webAuthnCredential = credential as PublicKeyCredential;

      // Convert to WebAuthnCredentialData
      const credentialData: WebAuthnCredentialData = {
        id: webAuthnCredential.id,
        rawId: webAuthnCredential.rawId,
        type: webAuthnCredential.type,
        response: {
          clientDataJSON: webAuthnCredential.response.clientDataJSON,
        },
        getClientExtensionResults: webAuthnCredential.getClientExtensionResults,
      };

      // Add additional response properties if available
      if ("attestationObject" in webAuthnCredential.response) {
        credentialData.response.attestationObject = (
          webAuthnCredential.response as AuthenticatorAttestationResponse
        ).attestationObject;
      }

      this.credential = credentialData;
      return credentialData;
    } catch (error: unknown) {
      console.error("Detailed error in credential creation:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error creating credentials: ${errorMessage}`);
    }
  }

  /**
   * Generates WebAuthn credentials (uniforme con altri plugin)
   */
  async generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials | null,
    isLogin = false,
  ): Promise<{
    success: boolean;
    username: string;
    key: any;
    credentialId: string;
    publicKey?: ArrayBuffer | null;
    error?: string;
  }> {
    try {
      if (isLogin) {
        const verificationResult = await this.verifyCredential(username);
        if (!verificationResult.success || !verificationResult.credentialId) {
          return {
            success: false,
            username,
            key: undefined,
            credentialId: "",
            error: verificationResult.error,
            publicKey: null,
          };
        }
        // Deriva la chiave GunDB
        const key = await deriveWebauthnKeys(
          username,
          verificationResult.credentialId,
        );
        return {
          success: true,
          username,
          key,
          credentialId: verificationResult.credentialId,
          publicKey: null,
        };
      } else {
        const credential = await this.createCredential(username);
        const credentialId = credential.id;
        let publicKey: ArrayBuffer | null = null;
        if (credential?.response?.getPublicKey) {
          publicKey = credential.response.getPublicKey();
        }
        // Deriva la chiave GunDB
        const key = await deriveWebauthnKeys(username, credentialId);
        return {
          success: true,
          username,
          key,
          credentialId,
          publicKey,
        };
      }
    } catch (error: unknown) {
      console.error("Error in generateCredentials:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during WebAuthn operation";
      return {
        success: false,
        username,
        key: undefined,
        credentialId: "",
        error: errorMessage,
        publicKey: null,
      };
    }
  }

  /**
   * Verifies a credential
   */
  private async verifyCredential(
    username: string,
  ): Promise<WebAuthnVerificationResult> {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const options: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: this.config.timeout,
        userVerification: this.config.userVerification,
        ...(this.config.rpId !== "localhost" && { rpId: this.config.rpId }),
      };

      if (this.credential?.rawId) {
        options.allowCredentials = [
          {
            id: this.credential.rawId,
            type: "public-key",
          },
        ];
      }

      const assertion = await navigator.credentials.get({
        publicKey: options,
      });

      if (!assertion) {
        return {
          success: false,
          error: "Credential verification failed",
        };
      }

      return {
        success: true,
        credentialId: (assertion as PublicKeyCredential).id,
        username,
      };
    } catch (error: unknown) {
      console.error("Error verifying credentials:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error verifying credentials";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Removes device credentials
   */
  async removeDevice(
    username: string,
    credentialId: string,
    credentials: WebAuthnCredentials,
  ): Promise<{ success: boolean; updatedCredentials?: WebAuthnCredentials }> {
    if (
      !credentials ||
      !credentials.credentials ||
      !credentials.credentials[credentialId]
    ) {
      return { success: false };
    }

    const updatedCreds = { ...credentials };
    // Make sure credentials exists before modifying it
    if (updatedCreds.credentials) {
      delete updatedCreds.credentials[credentialId];
    }

    return {
      success: true,
      updatedCredentials: updatedCreds,
    };
  }

  /**
   * Signs data with the credential
   */
  async sign(data: Record<string, unknown>): Promise<unknown> {
    const signature = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(16),
        rpId: this.config.rpId,
      },
    });
    return signature;
  }
}

// Add to global scope if available
if (typeof window !== "undefined") {
  window.Webauthn = Webauthn;
} else if (typeof global !== "undefined") {
  (global as any).Webauthn = Webauthn;
}

export type { WebAuthnCredentials, DeviceInfo, CredentialResult };

// Funzione helper per derivare chiavi WebAuthn (come per Web3)
export async function deriveWebauthnKeys(
  username: string,
  credentialId: string,
) {
  const hashedCredentialId = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
  const salt = `${username}_${credentialId}`;

  return await derive(hashedCredentialId, salt, {
    includeP256: true,
  });
}
