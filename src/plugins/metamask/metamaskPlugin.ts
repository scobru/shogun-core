import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { MetaMask } from "./metamask";
import {
  MetaMaskCredentials,
  ConnectionResult,
  MetaMaskPluginInterface,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
export class MetaMaskPlugin
  extends BasePlugin
  implements MetaMaskPluginInterface
{
  name = "metamask";
  version = "1.0.0";
  description =
    "Provides MetaMask wallet connection and authentication for ShogunCore";

  private metamask: MetaMask | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Inizializziamo il modulo MetaMask
    this.metamask = new MetaMask();

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
  private assertMetaMask(): MetaMask {
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
  async generateCredentials(address: string): Promise<MetaMaskCredentials> {
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

      log("Attempting login or user creation with verified credentials...");
      // Utilizziamo il metodo privato del core per la creazione dell'utente in GunDB
      const createUserWithGunDB = core["createUserWithGunDB"].bind(core);
      const result = await createUserWithGunDB(
        credentials.username,
        credentials.password,
      );

      if (!result.success || !result.userPub) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "LOGIN_CREATE_FAILED",
          result.error ??
            "Login or user creation failed after signature verification",
        );
      }

      log(`Login/Creation successful: ${result.userPub}`);

      let did: string | null = null;
      try {
        log("Ensuring user has a DID...");
        // Utilizziamo il metodo privato del core per la gestione del DID
        const ensureUserHasDID = core["ensureUserHasDID"].bind(core);
        did = await ensureUserHasDID({
          services: [
            {
              type: "EcdsaSecp256k1VerificationKey2019",
              endpoint: `ethereum:${address}`,
            },
          ],
        });
        if (did) {
          log(`DID assigned/verified: ${did}`);
        } else {
          logWarn("Could not ensure DID for user after MetaMask login.");
        }
      } catch (didError) {
        ErrorHandler.handle(
          ErrorType.DID,
          "DID_ENSURE_FAILED",
          "Error ensuring DID for MetaMask user",
          didError,
        );
      }

      // Emettiamo l'evento di login tramite il core
      core.emit("auth:login", {
        userPub: result.userPub,
        username: credentials.username,
        method: "metamask",
        did: did || undefined,
      });

      return {
        success: true,
        userPub: result.userPub,
        username: credentials.username,
        did: did || undefined,
      };
    } catch (error: any) {
      // Cattura sia errori conformi a ShogunError che generici
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

      log(
        "Attempting user creation (or login if exists) with verified credentials...",
      );
      // Utilizziamo il metodo privato del core per la creazione dell'utente in GunDB
      const createUserWithGunDB = core["createUserWithGunDB"].bind(core);
      const result = await createUserWithGunDB(
        credentials.username,
        credentials.password,
      );

      if (!result.success || !result.userPub) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "USER_CREATE_LOGIN_FAILED",
          result.error ??
            "User creation or login failed after signature verification",
        );
      }

      log(`User creation/login successful: ${result.userPub}`);

      let did: string | null = null;
      try {
        log("Creating/Ensuring DID with MetaMask verification service...");
        // Utilizziamo il metodo privato del core per la gestione del DID
        const ensureUserHasDID = core["ensureUserHasDID"].bind(core);
        did = await ensureUserHasDID({
          services: [
            {
              type: "EcdsaSecp256k1VerificationKey2019",
              endpoint: `ethereum:${address}`,
            },
          ],
        });
        if (did) {
          log(`DID created/verified: ${did}`);
        } else {
          logWarn("Could not ensure DID for user after MetaMask signup.");
        }
      } catch (didError) {
        ErrorHandler.handle(
          ErrorType.DID,
          "DID_ENSURE_FAILED",
          "Error ensuring DID for MetaMask user during signup",
          didError,
        );
      }

      // Emettiamo l'evento di registrazione tramite il core
      core.emit("auth:signup", {
        userPub: result.userPub,
        username: credentials.username,
        method: "metamask",
        did: did ?? undefined,
      });

      return {
        success: true,
        userPub: result.userPub,
        username: credentials.username,
        did: did ?? undefined,
      };
    } catch (error: any) {
      // Cattura sia errori conformi a ShogunError che generici
      const errorType = error?.type ?? ErrorType.AUTHENTICATION;
      const errorCode = error?.code ?? "METAMASK_SIGNUP_ERROR";
      const errorMessage =
        error?.message ?? "Unknown error during MetaMask registration";

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
export type { MetaMaskPluginInterface } from "./types";
