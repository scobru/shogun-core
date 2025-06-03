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
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
export class Web3ConnectorPlugin
  extends BasePlugin
  implements Web3ConectorPluginInterface
{
  name = "web3";
  version = "1.0.0";
  description =
    "Provides Ethereum wallet connection and authentication for ShogunCore";

  private Web3: Web3Connector | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Inizializziamo il modulo Web3
    this.Web3 = new Web3Connector();

    log("Web3 plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.Web3) {
      this.Web3.cleanup();
    }
    this.Web3 = null;
    super.destroy();
    log("Web3 plugin destroyed");
  }

  /**
   * Assicura che il modulo Web3 sia inizializzato
   * @private
   */
  private assertMetaMask(): Web3Connector {
    this.assertInitialized();
    if (!this.Web3) {
      throw new Error("Web3 module not initialized");
    }
    return this.Web3;
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
   * Login con Web3
   * @param address - Indirizzo Ethereum
   * @returns {Promise<AuthResult>} Risultato dell'autenticazione
   * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
   */
  async login(address: string): Promise<AuthResult> {
    log("Login with Web3");

    try {
      const core = this.assertInitialized();
      log(`Web3 login attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for Web3 login",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "WEB3_UNAVAILABLE",
          "Web3 is not available in the browser",
        );
      }

      log("Generating credentials for Web3 login...");
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
          "Web3 credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying Web3 signature...");
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
          "Web3 signature verification failed. Address mismatch.",
        );
      }
      log("Web3 signature verified successfully.");

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
          "WEB3_LOGIN_FAILED",
          loginResult.error || "Failed to log in with Web3 credentials",
        );
      }

      // Emit login event
      core.emit("auth:login", {
        userPub: loginResult.userPub,
        username: credentials.username,
        method: "web3",
      });

      return loginResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "WEB3_LOGIN_ERROR";
      const errorMessage = error?.message || "Unknown error during Web3 login";

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
   * Registra un nuovo utente con Web3
   * @param address - Indirizzo Ethereum
   * @returns {Promise<AuthResult>} Risultato della registrazione
   * @description Crea un nuovo account utente usando le credenziali del wallet Web3 dopo la verifica della firma
   */
  async signUp(address: string): Promise<AuthResult> {
    log("Sign up with Web3");

    try {
      const core = this.assertInitialized();
      log(`Web3 registration attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for Web3 registration",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "WEB3_UNAVAILABLE",
          "Web3 is not available in the browser",
        );
      }

      log("Generating credentials for Web3 registration...");
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
          "Web3 credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying Web3 signature...");
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
          "Web3 signature verification failed. Address mismatch.",
        );
      }
      log("Web3 signature verified successfully.");

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
          "WEB3_SIGNUP_FAILED",
          signUpResult.error || "Failed to sign up with Web3 credentials",
        );
      }

      // Emit signup event
      core.emit("auth:signup", {
        userPub: signUpResult.userPub,
        username: credentials.username,
        method: "web3",
      });

      return signUpResult;
    } catch (error: any) {
      // Handle both ShogunError and generic errors
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "WEB3_SIGNUP_ERROR";
      const errorMessage =
        error?.message || "Unknown error during Web3 registration";

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
}

// Export only the interface, not the plugin itself again
export type { Web3ConectorPluginInterface } from "./types";
