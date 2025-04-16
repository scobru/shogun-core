import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Webauthn } from "./webauthn";
import { WebauthnPluginInterface } from "./types";
import { WebAuthnCredentials, CredentialResult } from "../../types/webauthn";
import { log, logError } from "../../utils/logger";
import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export class WebauthnPlugin
  extends BasePlugin
  implements WebauthnPluginInterface
{
  name = "webauthn";
  version = "1.0.0";
  description = "Provides WebAuthn authentication functionality for ShogunCore";

  private webauthn: Webauthn | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Inizializziamo il modulo WebAuthn
    this.webauthn = new Webauthn();

    log("WebAuthn plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    this.webauthn = null;
    super.destroy();
    log("WebAuthn plugin destroyed");
  }

  /**
   * Assicura che il modulo WebAuthn sia inizializzato
   * @private
   */
  private assertWebauthn(): Webauthn {
    this.assertInitialized();
    if (!this.webauthn) {
      throw new Error("WebAuthn module not initialized");
    }
    return this.webauthn;
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    return this.assertWebauthn().isSupported();
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials | null,
    isLogin: boolean = false,
  ): Promise<CredentialResult> {
    return this.assertWebauthn().generateCredentials(
      username,
      existingCredential,
      isLogin,
    );
  }

  /**
   * @inheritdoc
   */
  async createAccount(
    username: string,
    credentials: WebAuthnCredentials | null,
    isNewDevice: boolean = false,
  ): Promise<CredentialResult> {
    return this.assertWebauthn().createAccount(
      username,
      credentials,
      isNewDevice,
    );
  }

  /**
   * @inheritdoc
   */
  async authenticateUser(
    username: string,
    salt: string | null,
    options?: any,
  ): Promise<CredentialResult> {
    return this.assertWebauthn().authenticateUser(username, salt, options);
  }

  /**
   * @inheritdoc
   */
  abortAuthentication(): void {
    this.assertWebauthn().abortAuthentication();
  }

  /**
   * @inheritdoc
   */
  async removeDevice(
    username: string,
    credentialId: string,
    credentials: WebAuthnCredentials,
  ): Promise<{ success: boolean; updatedCredentials?: WebAuthnCredentials }> {
    return this.assertWebauthn().removeDevice(
      username,
      credentialId,
      credentials,
    );
  }

  /**
   * Login with WebAuthn
   * This is the recommended method for WebAuthn authentication
   * @param username - Username
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using WebAuthn credentials.
   * Requires browser support for WebAuthn and existing credentials.
   */
  async login(username: string): Promise<AuthResult> {
    log("Login with WebAuthn");

    try {
      const core = this.assertInitialized();
      log(`Attempting WebAuthn login for user: ${username}`);

      if (!username) {
        throw new Error("Username required for WebAuthn login");
      }

      if (!this.isSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      const assertionResult = await this.generateCredentials(
        username,
        null,
        true,
      );

      if (!assertionResult?.success) {
        throw new Error(
          assertionResult?.error || "WebAuthn verification failed",
        );
      }

      const hashedCredentialId = ethers.keccak256(
        ethers.toUtf8Bytes(assertionResult.credentialId || ""),
      );

      const loginResult = await core.login(username, hashedCredentialId);

      if (loginResult.success) {
        log(`WebAuthn login completed successfully for user: ${username}`);

        if (!loginResult.did) {
          try {
            // Utilizziamo il metodo privato del core per la gestione del DID
            const ensureUserHasDID = core["ensureUserHasDID"].bind(core);
            const did = await ensureUserHasDID();
            if (did) {
              loginResult.did = did;
            }
          } catch (didError) {
            logError("Error ensuring DID for WebAuthn user:", didError);
          }
        }

        return {
          ...loginResult,
          username,
          password: hashedCredentialId,
          credentialId: assertionResult.credentialId,
        };
      } else {
        return loginResult;
      }
    } catch (error: any) {
      logError(`Error during WebAuthn login: ${error}`);
      
      ErrorHandler.handle(
        ErrorType.WEBAUTHN,
        "WEBAUTHN_LOGIN_ERROR",
        error.message || "Error during WebAuthn login",
        error
      );
      
      return {
        success: false,
        error: error.message || "Error during WebAuthn login",
      };
    }
  }

  /**
   * Register new user with WebAuthn
   * This is the recommended method for WebAuthn registration 
   * @param username - Username
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account using WebAuthn credentials.
   * Requires browser support for WebAuthn.
   */
  async signUp(username: string): Promise<AuthResult> {
    log("Sign up with WebAuthn");

    try {
      const core = this.assertInitialized();
      log(`Attempting WebAuthn registration for user: ${username}`);

      if (!username) {
        throw new Error("Username required for WebAuthn registration");
      }

      if (!this.isSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      const attestationResult = await this.generateCredentials(
        username,
        null,
        false,
      );

      if (!attestationResult?.success) {
        throw new Error(
          attestationResult?.error || "Unable to generate WebAuthn credentials",
        );
      }

      const hashedCredentialId = ethers.keccak256(
        ethers.toUtf8Bytes(attestationResult.credentialId || ""),
      );

      const signupResult = await core.signUp(username, hashedCredentialId);

      if (signupResult.success) {
        log(
          `WebAuthn registration completed successfully for user: ${username}`,
        );

        if (!signupResult.did) {
          try {
            // Utilizziamo il metodo privato del core per la gestione del DID
            const ensureUserHasDID = core["ensureUserHasDID"].bind(core);
            const did = await ensureUserHasDID({
              services: [
                {
                  type: "WebAuthnVerification",
                  endpoint: `webauthn:${username}`,
                },
              ],
            });

            if (did) {
              signupResult.did = did;
            }
          } catch (didError) {
            logError("Error creating DID for WebAuthn user:", didError);
          }
        }

        // Emettiamo un evento personalizzato per il registrazione WebAuthn
        core.emit("webauthn:register", {
          username,
          credentialId: attestationResult.credentialId,
        });

        // Also emit the standard auth:signup event for consistency
        core.emit("auth:signup", {
          userPub: signupResult.userPub,
          username,
          method: "webauthn",
          did: signupResult.did || undefined
        });

        return {
          ...signupResult,
          username,
          password: '*******',
          credentialId: attestationResult.credentialId,
        };
      } else {
        return signupResult;
      }
    } catch (error: any) {
      logError(`Error during WebAuthn registration: ${error}`);
      
      ErrorHandler.handle(
        ErrorType.WEBAUTHN,
        "WEBAUTHN_SIGNUP_ERROR",
        error.message || "Error during WebAuthn registration",
        error
      );
      
      return {
        success: false,
        error: error.message || "Error during WebAuthn registration",
      };
    }
  }

  /**
   * Legacy method for WebAuthn login - use login() instead
   * @deprecated Use login(username) instead
   */
  async loginWithWebAuthn(username: string): Promise<AuthResult> {
    return this.login(username);
  }

  /**
   * Legacy method for WebAuthn signup - use signUp() instead
   * @deprecated Use signUp(username) instead
   */
  async signUpWithWebAuthn(username: string): Promise<AuthResult> {
    return this.signUp(username);
  }
}

// Export only the interface, not the plugin itself again
export { WebauthnPluginInterface } from "./types";
