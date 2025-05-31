import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Web3Connector } from "./web3Connector";
import {
  Web3ConnectorCredentials,
  ConnectionResult,
  Web3ConectorPluginInterface,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
export class Web3ConnectorPlugin
  extends BasePlugin
  implements Web3ConectorPluginInterface
{
  name = "web3";
  version = "1.0.0";
  description =
    "Provides Ethereum wallet connection and authentication for ShogunCore";

  private metamask: Web3Connector | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Inizializziamo il modulo MetaMask
    this.metamask = new Web3Connector();

    log("MetaMask plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.metamask) {
      this.metamask.cleanup();
    }
    this.metamask = null;
    super.destroy();
    log("MetaMask plugin destroyed");
  }

  /**
   * Assicura che il modulo MetaMask sia inizializzato
   * @private
   */
  private assertMetaMask(): Web3Connector {
    this.assertInitialized();
    if (!this.metamask) {
      throw new Error("MetaMask module not initialized");
    }
    return this.metamask;
  }

  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    return this.assertMetaMask().isAvailable();
  }

  /**
   * @inheritdoc
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    return this.assertMetaMask().connectMetaMask();
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    address: string,
  ): Promise<Web3ConnectorCredentials> {
    log("Calling credential generation");
    return this.assertMetaMask().generateCredentials(address);
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    this.assertMetaMask().cleanup();
  }

  /**
   * @inheritdoc
   */
  setCustomProvider(rpcUrl: string, privateKey: string): void {
    this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
  }

  /**
   * @inheritdoc
   */
  async getSigner(): Promise<ethers.Signer> {
    return this.assertMetaMask().getSigner();
  }

  /**
   * @inheritdoc
   */
  async getProvider(): Promise<
    ethers.JsonRpcProvider | ethers.BrowserProvider
  > {
    return this.assertMetaMask().getProvider();
  }

  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    return this.assertMetaMask().generatePassword(signature);
  }

  /**
   * @inheritdoc
   */
  async verifySignature(message: string, signature: string): Promise<string> {
    return this.assertMetaMask().verifySignature(message, signature);
  }

  /**
   * Login con MetaMask
   * @param address - Indirizzo Ethereum
   * @returns {Promise<AuthResult>} Risultato dell'autenticazione
   * @description Autentica l'utente usando le credenziali del wallet MetaMask dopo la verifica della firma
   */
  async login(address: string): Promise<AuthResult> {
    log("Login with MetaMask");

    try {
      const core = this.assertInitialized();
      log(`MetaMask login attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for MetaMask login",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "METAMASK_UNAVAILABLE",
          "MetaMask is not available in the browser",
        );
      }

      log("Generating credentials for MetaMask login...");
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
          "MetaMask credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying MetaMask signature...");
      const recoveredAddress = ethers.verifyMessage(
        credentials.message,
        credentials.signature,
      );
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        logError(
          `Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`,
        );
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "MetaMask signature verification failed. Address mismatch.",
        );
      }
      log("MetaMask signature verified successfully.");

      // Set authentication method to web3 before login
      core.setAuthMethod("web3");

      // Use core's login method with direct GunDB authentication
      log("Logging in using core login method...");
      const loginResult = await core.login(
        credentials.username,
        credentials.password,
      );

      if (!loginResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "METAMASK_LOGIN_FAILED",
          loginResult.error || "Failed to log in with MetaMask credentials",
        );
      }

      // Emit login event
      core.emit("auth:login", {
        userPub: loginResult.userPub,
        username: credentials.username,
        method: "metamask",
      });

      return loginResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "METAMASK_LOGIN_ERROR";
      const errorMessage =
        error?.message || "Unknown error during MetaMask login";

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
   * Registra un nuovo utente con MetaMask
   * @param address - Indirizzo Ethereum
   * @returns {Promise<AuthResult>} Risultato della registrazione
   * @description Crea un nuovo account utente usando le credenziali del wallet MetaMask dopo la verifica della firma
   */
  async signUp(address: string): Promise<AuthResult> {
    log("Sign up with MetaMask");

    try {
      const core = this.assertInitialized();
      log(`MetaMask registration attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for MetaMask registration",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "METAMASK_UNAVAILABLE",
          "MetaMask is not available in the browser",
        );
      }

      log("Generating credentials for MetaMask registration...");
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
          "MetaMask credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying MetaMask signature...");
      const recoveredAddress = ethers.verifyMessage(
        credentials.message,
        credentials.signature,
      );
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        logError(
          `Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`,
        );
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "MetaMask signature verification failed. Address mismatch.",
        );
      }
      log("MetaMask signature verified successfully.");

      // Set authentication method to web3 before signup
      core.setAuthMethod("web3");

      // Use core's signUp method with direct GunDB authentication
      log("Signing up using core signUp method...");
      const signUpResult = await core.signUp(
        credentials.username,
        credentials.password,
      );

      if (!signUpResult.success) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "METAMASK_SIGNUP_FAILED",
          signUpResult.error || "Failed to sign up with MetaMask credentials",
        );
      }

      // Emit signup event
      core.emit("auth:signup", {
        userPub: signUpResult.userPub,
        username: credentials.username,
        method: "metamask",
      });

      return signUpResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "METAMASK_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during MetaMask registration";

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
   * Legacy method for MetaMask login - use login() instead
   * @deprecated Use login(address) instead
   */
  async loginWithMetaMask(address: string): Promise<AuthResult> {
    return this.login(address);
  }

  /**
   * Legacy method for MetaMask signup - use signUp() instead
   * @deprecated Use signUp(address) instead
   */
  async signUpWithMetaMask(address: string): Promise<AuthResult> {
    return this.signUp(address);
  }
}

// Export only the interface, not the plugin itself again
export type { Web3ConectorPluginInterface } from "./types";
