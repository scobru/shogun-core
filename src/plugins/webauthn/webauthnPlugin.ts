import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Webauthn } from "./webauthn";
import { WebauthnPluginInterface } from "./types";
import { WebAuthnCredentials, CredentialResult } from "../../types/webauthn";
import { log, logError } from "../../utils/logger";

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
}

// Export only the interface, not the plugin itself again
export { WebauthnPluginInterface } from "./types";
