import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { NostrConnector } from "./nostrConnector";
import {
  NostrConnectorCredentials,
  ConnectionResult,
  NostrConnectorPluginInterface,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export class NostrConnectorPlugin
  extends BasePlugin
  implements NostrConnectorPluginInterface
{
  name = "bitcoin";
  version = "1.0.0";
  description =
    "Provides Bitcoin wallet connection and authentication for ShogunCore";

  private bitcoinConnector: NostrConnector | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize the Bitcoin wallet module
    this.bitcoinConnector = new NostrConnector();

    log("Bitcoin wallet plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.bitcoinConnector) {
      this.bitcoinConnector.cleanup();
    }
    this.bitcoinConnector = null;
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
  ): Promise<NostrConnectorCredentials> {
    log("Calling credential generation for Bitcoin wallet");
    return this.assertBitcoinConnector().generateCredentials(address);
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    this.assertBitcoinConnector().cleanup();
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

      log("Generating credentials for Bitcoin wallet login...");
      const credentials = await this.generateCredentials(address);
      if (
        !credentials?.username ||
        !credentials?.password ||
        !credentials.signature ||
        !credentials.message
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

      // Use core's login method directly - simplified approach similar to MetaMask
      log("Logging in using core login method...");
      const loginResult = await core.login(
        credentials.username,
        credentials.password,
      );

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

      // Generate credentials similar to login
      log("Generating credentials for Bitcoin wallet signup...");
      const credentials = await this.generateCredentials(address);
      if (
        !credentials?.username ||
        !credentials?.password ||
        !credentials.signature ||
        !credentials.message
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

      // Use core's signUp method directly - simplified approach similar to MetaMask
      log("Signing up using core signUp method...");
      const signUpResult = await core.signUp(
        credentials.username,
        credentials.password,
      );

      if (!signUpResult.success) {
        // Check if the error is "User already created"
        if (
          signUpResult.error &&
          (signUpResult.error.includes("User already created") ||
            signUpResult.error.includes("already created") ||
            signUpResult.error.includes("già creato"))
        ) {
          // User already exists, suggest login instead
          return {
            success: false,
            error: "User already exists. Please try logging in instead.",
          };
        }

        throw createError(
          ErrorType.AUTHENTICATION,
          "BITCOIN_SIGNUP_FAILED",
          signUpResult.error || "Failed to sign up with Bitcoin credentials",
        );
      }

      // Emit signup event
      core.emit("auth:signup", {
        userPub: signUpResult.userPub,
        username: credentials.username,
        method: "bitcoin",
      });

      return signUpResult;
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
