import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import {
  NostrConnector,
  MESSAGE_TO_SIGN,
  deriveNostrKeys,
} from "./nostrConnector";
import { NostrSigner, NostrSigningCredential } from "./nostrSigner";
import {
  NostrConnectorCredentials,
  ConnectionResult,
  NostrConnectorPluginInterface,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
import { generateUsernameFromIdentity } from "../../utils/validation";

/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export class NostrConnectorPlugin
  extends BasePlugin
  implements NostrConnectorPluginInterface
{
  name = "nostr";
  version = "1.0.0";
  description =
    "Provides Bitcoin wallet connection and authentication for ShogunCore";

  private bitcoinConnector: NostrConnector | null = null;
  private signer: NostrSigner | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize the Bitcoin wallet module
    this.bitcoinConnector = new NostrConnector();
    this.signer = new NostrSigner(this.bitcoinConnector);

    log("Bitcoin wallet plugin initialized with signer support");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.bitcoinConnector) {
      this.bitcoinConnector.cleanup();
    }
    this.bitcoinConnector = null;
    this.signer = null;
    super.destroy();
    log("Bitcoin wallet plugin destroyed");
  }

  /**
   * Ensure that the Bitcoin wallet module is initialized
   * @private
   */
  private assertBitcoinConnector(): NostrConnector {
    this.assertInitialized();
    if (!this.bitcoinConnector) {
      throw new Error("Bitcoin wallet module not initialized");
    }
    return this.bitcoinConnector;
  }

  /**
   * Assicura che il signer sia inizializzato
   * @private
   */
  private assertSigner(): NostrSigner {
    this.assertInitialized();
    if (!this.signer) {
      throw new Error("Nostr signer not initialized");
    }
    return this.signer;
  }

  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    return this.assertBitcoinConnector().isAvailable();
  }

  /**
   * Check if Alby extension is available
   * Note: Alby is deprecated in favor of Nostr
   */
  isAlbyAvailable(): boolean {
    log("Alby is deprecated, using Nostr instead");
    return this.isNostrExtensionAvailable();
  }

  /**
   * Check if Nostr extension is available
   */
  isNostrExtensionAvailable(): boolean {
    return this.assertBitcoinConnector().isNostrExtensionAvailable();
  }

  /**
   * @inheritdoc
   */
  async connectBitcoinWallet(
    type: "alby" | "nostr" | "manual" = "nostr",
  ): Promise<ConnectionResult> {
    // Prioritize nostr over alby (since they are functionally identical)
    // If type is alby, try to use nostr instead
    if (type === "alby") {
      log("Alby is deprecated, using Nostr instead");
      type = "nostr";
    }
    return this.assertBitcoinConnector().connectWallet(type);
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    address: string,
    signature: string,
    message: string,
  ): Promise<NostrConnectorCredentials> {
    log("Calling credential generation for Bitcoin wallet");
    return this.assertBitcoinConnector().generateCredentials(
      address,
      signature,
      message,
    );
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    this.assertBitcoinConnector().cleanup();
  }

  /**
   * Clear signature cache for better user recovery
   * @param address - Optional specific address to clear, or clear all if not provided
   */
  clearSignatureCache(address?: string): void {
    this.assertBitcoinConnector().clearSignatureCache(address);
  }

  /**
   * @inheritdoc
   */
  async verifySignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    return this.assertBitcoinConnector().verifySignature(
      message,
      signature,
      address,
    );
  }

  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    return this.assertBitcoinConnector().generatePassword(signature);
  }

  // === NOSTR SIGNER METHODS ===

  /**
   * Creates a new Nostr signing credential
   * CONSISTENT with normal Nostr approach
   */
  async createSigningCredential(
    address: string,
  ): Promise<NostrSigningCredential> {
    try {
      log(`Creating Nostr signing credential for address: ${address}`);
      return await this.assertSigner().createSigningCredential(address);
    } catch (error: any) {
      logError(`Error creating Nostr signing credential: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates an authenticator function for Nostr signing
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    try {
      log(`Creating Nostr authenticator for address: ${address}`);
      return this.assertSigner().createAuthenticator(address);
    } catch (error: any) {
      logError(`Error creating Nostr authenticator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a derived key pair from Nostr credential
   */
  async createDerivedKeyPair(
    address: string,
    extra?: string[],
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }> {
    try {
      log(`Creating derived key pair for address: ${address}`);
      return await this.assertSigner().createDerivedKeyPair(address, extra);
    } catch (error: any) {
      logError(`Error creating derived key pair: ${error.message}`);
      throw error;
    }
  }

  /**
   * Signs data with derived keys after Nostr verification
   */
  async signWithDerivedKeys(
    data: any,
    address: string,
    extra?: string[],
  ): Promise<string> {
    try {
      log(`Signing data with derived keys for address: ${address}`);
      return await this.assertSigner().signWithDerivedKeys(
        data,
        address,
        extra,
      );
    } catch (error: any) {
      logError(`Error signing with derived keys: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get signing credential by address
   */
  getSigningCredential(address: string): NostrSigningCredential | undefined {
    return this.assertSigner().getCredential(address);
  }

  /**
   * List all signing credentials
   */
  listSigningCredentials(): NostrSigningCredential[] {
    return this.assertSigner().listCredentials();
  }

  /**
   * Remove a signing credential
   */
  removeSigningCredential(address: string): boolean {
    return this.assertSigner().removeCredential(address);
  }

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from Nostr signing credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUserFromSigningCredential(
    address: string,
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    try {
      const core = this.assertInitialized();
      log(`Creating Gun user from Nostr signing credential: ${address}`);
      return await this.assertSigner().createGunUser(address, core.gun);
    } catch (error: any) {
      logError(
        `Error creating Gun user from Nostr signing credential: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get the Gun user public key for a signing credential
   */
  getGunUserPubFromSigningCredential(address: string): string | undefined {
    return this.assertSigner().getGunUserPub(address);
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    return this.assertSigner().getPassword(address);
  }

  /**
   * Verify consistency between oneshot and normal approaches
   * This ensures both approaches create the same Gun user
   */
  async verifyConsistency(
    address: string,
    expectedUserPub?: string,
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    try {
      log(`Verifying Nostr consistency for address: ${address}`);
      return await this.assertSigner().verifyConsistency(
        address,
        expectedUserPub,
      );
    } catch (error: any) {
      logError(`Error verifying Nostr consistency: ${error.message}`);
      return { consistent: false };
    }
  }

  /**
   * Complete oneshot workflow that creates the SAME Gun user as normal approach
   * This is the recommended method for oneshot signing with full consistency
   */
  async setupConsistentOneshotSigning(address: string): Promise<{
    credential: NostrSigningCredential;
    authenticator: (data: any) => Promise<string>;
    gunUser: { success: boolean; userPub?: string; error?: string };
    username: string;
    password: string;
  }> {
    try {
      log(`Setting up consistent Nostr oneshot signing for: ${address}`);

      // 1. Create signing credential (with consistent password generation)
      const credential = await this.createSigningCredential(address);

      // 2. Create authenticator
      const authenticator = this.createAuthenticator(address);

      // 3. Create Gun user (same as normal approach)
      const gunUser = await this.createGunUserFromSigningCredential(address);

      return {
        credential,
        authenticator,
        gunUser,
        username: credential.username,
        password: credential.password,
      };
    } catch (error: any) {
      logError(
        `Error setting up consistent Nostr oneshot signing: ${error.message}`,
      );
      throw error;
    }
  }

  // === EXISTING METHODS ===

  /**
   * Login with Bitcoin wallet
   * @param address - Bitcoin address
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates the user using Bitcoin wallet credentials after signature verification
   */
  async login(address: string): Promise<AuthResult> {
    log("Login with Bitcoin wallet");

    try {
      const core = this.assertInitialized();
      log(`Bitcoin wallet login attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Bitcoin address required for login",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "BITCOIN_WALLET_UNAVAILABLE",
          "No Bitcoin wallet available in the browser",
        );
      }

      const message = MESSAGE_TO_SIGN;
      const signature = await this.assertBitcoinConnector().requestSignature(
        address,
        message,
      );

      log("Generating credentials for Bitcoin wallet login...");
      const credentials = await this.generateCredentials(
        address,
        signature,
        message,
      );
      if (
        !credentials?.username ||
        !credentials?.key ||
        !credentials.message ||
        !credentials.signature
      ) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "Bitcoin wallet credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying Bitcoin wallet signature...");
      const isValid = await this.verifySignature(
        credentials.message,
        credentials.signature,
        address,
      );

      if (!isValid) {
        logError(`Signature verification failed for address: ${address}`);
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "Bitcoin wallet signature verification failed",
        );
      }
      log("Bitcoin wallet signature verified successfully.");

      // Deriva le chiavi da address, signature, message
      const k = await deriveNostrKeys(address, signature, message);

      // Set authentication method to nostr before login
      core.setAuthMethod("nostr");

      // Usa le chiavi derivate per login
      const loginResult = await core.login(credentials.username, "", k);

      if (!loginResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "BITCOIN_LOGIN_FAILED",
          loginResult.error || "Failed to log in with Bitcoin credentials",
        );
      }

      // Emit login event
      core.emit("auth:login", {
        userPub: loginResult.userPub,
        username: credentials.username,
        method: "bitcoin",
      });

      return loginResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "BITCOIN_LOGIN_ERROR";
      const errorMessage =
        error?.message || "Unknown error during Bitcoin wallet login";

      const handledError = ErrorHandler.handle(
        errorType,
        errorCode,
        errorMessage,
        error,
      );

      return {
        success: false,
        error: handledError.message,
      };
    }
  }

  /**
   * Register a new user with Bitcoin wallet
   * @param address - Bitcoin address
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account with Bitcoin wallet credentials
   */
  async signUp(address: string): Promise<AuthResult> {
    log("Sign up with Bitcoin wallet");

    try {
      const core = this.assertInitialized();
      log(`Bitcoin wallet signup attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Bitcoin address required for signup",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "BITCOIN_WALLET_UNAVAILABLE",
          "No Bitcoin wallet available in the browser",
        );
      }

      const message = MESSAGE_TO_SIGN;
      const signature = await this.assertBitcoinConnector().requestSignature(
        address,
        message,
      );

      log("Generating credentials for Bitcoin wallet signup...");
      const credentials = await this.generateCredentials(
        address,
        signature,
        message,
      );
      if (
        !credentials?.username ||
        !credentials?.key ||
        !credentials.message ||
        !credentials.signature
      ) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "Bitcoin wallet credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      // Verify signature
      log("Verifying Bitcoin wallet signature...");
      const isValid = await this.verifySignature(
        credentials.message,
        credentials.signature,
        address,
      );

      if (!isValid) {
        logError(`Signature verification failed for address: ${address}`);
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "Bitcoin wallet signature verification failed",
        );
      }
      log("Bitcoin wallet signature verified successfully.");

      // Deriva le chiavi da address, signature, message
      const k = await deriveNostrKeys(address, signature, message);

      // Set authentication method to nostr before signup
      core.setAuthMethod("nostr");

      // Usa le chiavi derivate per signup
      const signupResult = await core.signUp(credentials.username, "", "", k);

      if (signupResult.success) {
        // Dopo la creazione, autentica subito
        const authResult = await core.login(credentials.username, "", k);
        if (authResult.success) {
          log(
            `Bitcoin wallet registration and login completed for user: ${credentials.username}`,
          );
          // Emetti eventi
          core.emit("auth:signup", {
            userPub: authResult.userPub,
            username: credentials.username,
            method: "bitcoin",
          });
          return { ...authResult };
        } else {
          return { ...signupResult, error: "User created but login failed" };
        }
      } else {
        // Se l'errore è che l'utente esiste già, prova direttamente l'auth
        if (
          signupResult.error &&
          signupResult.error.toLowerCase().includes("exist")
        ) {
          const authResult = await core.login(credentials.username, "", k);
          return { ...authResult };
        }
        return signupResult;
      }
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "BITCOIN_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during Bitcoin wallet signup";

      const handledError = ErrorHandler.handle(
        errorType,
        errorCode,
        errorMessage,
        error,
      );

      return {
        success: false,
        error: handledError.message,
      };
    }
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async loginWithBitcoinWallet(address: string): Promise<AuthResult> {
    return this.login(address);
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async signUpWithBitcoinWallet(address: string): Promise<AuthResult> {
    return this.signUp(address);
  }
}
