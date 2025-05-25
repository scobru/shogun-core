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

      // For MetaMask authentication, we'll use a direct approach rather than using createUserWithGunDB
      log("Attempting direct auth with GunDB for MetaMask account...");

      // Try to authenticate directly first
      try {
        const gun = core.gun;
        let authSuccess = false;

        await new Promise<void>((resolve) => {
          // Clear any previous auth state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          // Try direct authentication
          gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                log(
                  `Direct auth failed: ${ack.err}, will try creating user first`,
                );
                resolve();
              } else {
                authSuccess = true;
                log("Direct auth successful");
                resolve();
              }
            });
        });

        // If direct auth succeeded, we're done
        if (authSuccess) {
          const userPub = core.gun.user().is?.pub || "";

          // Emit login event
          core.emit("auth:login", {
            userPub: userPub,
            username: credentials.username,
            method: "metamask",
          });

          return {
            success: true,
            userPub: userPub,
            username: credentials.username,
          };
        }

        // If direct auth failed, try to create the user first
        log("Creating MetaMask user account...");
        let createSuccess = false;

        await new Promise<void>((resolve) => {
          gun
            .user()
            .create(credentials.username, credentials.password, (ack: any) => {
              if (ack.err && ack.err !== "User already created!") {
                log(`User creation failed: ${ack.err}`);
                resolve();
              } else {
                // Even if we get "User already created!" consider it a success
                createSuccess = true;
                log("User creation successful or already exists");
                resolve();
              }
            });
        });

        if (!createSuccess) {
          throw createError(
            ErrorType.AUTHENTICATION,
            "METAMASK_USER_CREATION_FAILED",
            "Failed to create MetaMask user account",
          );
        }

        // Now try to authenticate again
        log("Authenticating after create/verify...");
        let loginSuccess = false;
        let userPub = "";

        await new Promise<void>((resolve) => {
          // Clear any previous auth state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                log(`Post-creation auth failed: ${ack.err}`);
                resolve();
              } else {
                loginSuccess = true;
                userPub = gun.user().is?.pub || "";
                log(`Post-creation auth successful: ${userPub}`);
                resolve();
              }
            });
        });

        if (!loginSuccess) {
          throw createError(
            ErrorType.AUTHENTICATION,
            "METAMASK_LOGIN_FAILED",
            "Failed to log in after creating or verifying MetaMask user account",
          );
        }

        // Emit login event
        core.emit("auth:login", {
          userPub: userPub,
          username: credentials.username,
          method: "metamask",
        });

        return {
          success: true,
          userPub: userPub,
          username: credentials.username,
        };
      } catch (authError: any) {
        // Pass the specific authentication error up the chain
        throw authError;
      }
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

      // For MetaMask registration, we'll use a direct approach
      log("Creating MetaMask user account directly...");

      try {
        const gun = core.gun;

        // First, check if the user already exists by trying to authenticate
        let userExists = false;

        await new Promise<void>((resolve) => {
          // Reset user state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          // Try authentication to see if user exists
          gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (!ack.err) {
                userExists = true;
                log("User already exists and credentials are valid");
              }
              resolve();
            });
        });

        // If user already exists, return success
        if (userExists) {
          const userPub = core.gun.user().is?.pub || "";

          // Emit signup event (even though it's more of a login)
          core.emit("auth:signup", {
            userPub: userPub,
            username: credentials.username,
            method: "metamask",
          });

          return {
            success: true,
            userPub: userPub,
            username: credentials.username,
          };
        }

        // Otherwise create the user
        log("Creating new MetaMask user account...");
        let createSuccess = false;

        await new Promise<void>((resolve) => {
          // Reset user state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          gun
            .user()
            .create(credentials.username, credentials.password, (ack: any) => {
              if (ack.err && ack.err !== "User already created!") {
                log(`User creation failed: ${ack.err}`);
                resolve();
              } else {
                createSuccess = true;
                log("User creation successful or already exists");
                resolve();
              }
            });
        });

        if (!createSuccess) {
          throw createError(
            ErrorType.AUTHENTICATION,
            "METAMASK_USER_CREATION_FAILED",
            "Failed to create MetaMask user account",
          );
        }

        // Now authenticate with the new account
        log("Authenticating with new account...");
        let loginSuccess = false;
        let userPub = "";

        await new Promise<void>((resolve) => {
          // Reset user state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                log(`Post-creation auth failed: ${ack.err}`);
                resolve();
              } else {
                loginSuccess = true;
                userPub = gun.user().is?.pub || "";
                log(`Post-creation auth successful: ${userPub}`);
                resolve();
              }
            });
        });

        if (!loginSuccess) {
          throw createError(
            ErrorType.AUTHENTICATION,
            "METAMASK_SIGNUP_AUTH_FAILED",
            "Failed to log in after creating MetaMask user account",
          );
        }

        // Emit signup event
        core.emit("auth:signup", {
          userPub: userPub,
          username: credentials.username,
          method: "metamask",
        });

        return {
          success: true,
          userPub: userPub,
          username: credentials.username,
        };
      } catch (authError: any) {
        // Pass the specific authentication error up the chain
        throw authError;
      }
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
export type { MetaMaskPluginInterface } from "./types";
