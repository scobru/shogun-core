import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Webauthn } from "./webauthn";
import { WebAuthnSigner, WebAuthnSigningCredential } from "./webauthnSigner";
import {
  WebAuthnCredentials,
  CredentialResult,
  WebauthnPluginInterface,
  WebAuthnUniformCredentials,
} from "./types";
import { AuthResult, SignUpResult } from "../../types/shogun";
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
  private signer: WebAuthnSigner | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Verifica se siamo in ambiente browser
    if (typeof window === "undefined") {
      console.warn(
        "[webauthnPlugin] WebAuthn plugin disabled - not in browser environment",
      );
      return;
    }

    // Verifica se WebAuthn è supportato
    if (!this.isSupported()) {
      console.warn(
        "[webauthnPlugin] WebAuthn not supported in this environment",
      );
      return;
    }

    // Inizializziamo il modulo WebAuthn
    this.webauthn = new Webauthn(core.gun);
    this.signer = new WebAuthnSigner(this.webauthn);

    console.log(
      "[webauthnPlugin] WebAuthn plugin initialized with signer support",
    );
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    this.webauthn = null;
    this.signer = null;
    super.destroy();
    console.log("[webauthnPlugin] WebAuthn plugin destroyed");
  }

  /**
   * Assicura che il modulo Webauthn sia inizializzato
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
   * Assicura che il signer sia inizializzato
   * @private
   */
  private assertSigner(): WebAuthnSigner {
    this.assertInitialized();
    if (!this.signer) {
      throw new Error("WebAuthn signer not initialized");
    }
    return this.signer;
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    // Verifica se siamo in ambiente browser
    if (typeof window === "undefined") {
      return false;
    }

    // Se il plugin non è stato inizializzato, verifica direttamente il supporto
    if (!this.webauthn) {
      return typeof window.PublicKeyCredential !== "undefined";
    }

    return this.webauthn.isSupported();
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials | null,
    isLogin: boolean = false,
  ): Promise<WebAuthnUniformCredentials> {
    return this.assertWebauthn().generateCredentials(
      username,
      existingCredential,
      isLogin,
    ) as Promise<WebAuthnUniformCredentials>;
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
   * @inheritdoc
   */
  async createSigningCredential(
    username: string,
  ): Promise<WebAuthnSigningCredential> {
    try {
      return await this.assertSigner().createSigningCredential(username);
    } catch (error: any) {
      console.error(`Error creating signing credential: ${error.message}`);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  createAuthenticator(
    credentialId: string,
  ): (data: any) => Promise<AuthenticatorAssertionResponse> {
    try {
      return this.assertSigner().createAuthenticator(credentialId);
    } catch (error: any) {
      console.error(`Error creating authenticator: ${error.message}`);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async createDerivedKeyPair(
    credentialId: string,
    username: string,
    extra?: string[],
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }> {
    try {
      return await this.assertSigner().createDerivedKeyPair(
        credentialId,
        username,
        extra,
      );
    } catch (error: any) {
      console.error(`Error creating derived key pair: ${error.message}`);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async signWithDerivedKeys(
    data: any,
    credentialId: string,
    username: string,
    extra?: string[],
  ): Promise<string> {
    try {
      return await this.assertSigner().signWithDerivedKeys(
        data,
        credentialId,
        username,
        extra,
      );
    } catch (error: any) {
      console.error(`Error signing with derived keys: ${error.message}`);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  getSigningCredential(
    credentialId: string,
  ): WebAuthnSigningCredential | undefined {
    return this.assertSigner().getCredential(credentialId);
  }

  /**
   * @inheritdoc
   */
  listSigningCredentials(): WebAuthnSigningCredential[] {
    return this.assertSigner().listCredentials();
  }

  /**
   * @inheritdoc
   */
  removeSigningCredential(credentialId: string): boolean {
    return this.assertSigner().removeCredential(credentialId);
  }

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from WebAuthn signing credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUserFromSigningCredential(
    credentialId: string,
    username: string,
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    try {
      const core = this.assertInitialized();
      return await this.assertSigner().createGunUser(
        credentialId,
        username,
        core.gun,
      );
    } catch (error: any) {
      console.error(
        `Error creating Gun user from signing credential: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get the Gun user public key for a signing credential
   */
  getGunUserPubFromSigningCredential(credentialId: string): string | undefined {
    return this.assertSigner().getGunUserPub(credentialId);
  }

  /**
   * Get the hashed credential ID (for consistency checking)
   */
  getHashedCredentialId(credentialId: string): string | undefined {
    return this.assertSigner().getHashedCredentialId(credentialId);
  }

  /**
   * Verify consistency between oneshot and normal approaches
   * This ensures both approaches create the same Gun user
   */
  async verifyConsistency(
    credentialId: string,
    username: string,
    expectedUserPub?: string,
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    try {
      return await this.assertSigner().verifyConsistency(
        credentialId,
        username,
        expectedUserPub,
      );
    } catch (error: any) {
      console.error(`Error verifying consistency: ${error.message}`);
      return { consistent: false };
    }
  }

  /**
   * Complete oneshot workflow that creates the SAME Gun user as normal approach
   * This is the recommended method for oneshot signing with full consistency
   */
  async setupConsistentOneshotSigning(username: string): Promise<{
    credential: WebAuthnSigningCredential;
    authenticator: (data: any) => Promise<AuthenticatorAssertionResponse>;
    gunUser: { success: boolean; userPub?: string; error?: string };
    pub: string;
    hashedCredentialId: string;
  }> {
    try {
      // 1. Create signing credential (with consistent hashing)
      const credential = await this.createSigningCredential(username);

      // 2. Create authenticator
      const authenticator = this.createAuthenticator(credential.id);

      // 3. Create Gun user (same as normal approach)
      const gunUser = await this.createGunUserFromSigningCredential(
        credential.id,
        username,
      );

      return {
        credential,
        authenticator,
        gunUser,
        pub: credential.pub,
        hashedCredentialId: credential.hashedCredentialId,
      };
    } catch (error: any) {
      console.error(
        `Error setting up consistent oneshot signing: ${error.message}`,
      );
      throw error;
    }
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
    try {
      const core = this.assertInitialized();

      if (!username) {
        throw new Error("Username required for WebAuthn login");
      }

      if (!this.isSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      const credentials: WebAuthnUniformCredentials =
        await this.generateCredentials(username, null, true);

      if (!credentials?.success) {
        throw new Error(credentials?.error || "WebAuthn verification failed");
      }

      // Usa le chiavi derivate per login
      core.setAuthMethod("webauthn");
      const loginResult = await core.login(username, "", credentials.key);

      if (loginResult.success) {
        return {
          ...loginResult,
        };
      } else {
        return loginResult;
      }
    } catch (error: any) {
      console.error(`Error during WebAuthn login: ${error}`);

      ErrorHandler.handle(
        ErrorType.WEBAUTHN,
        "WEBAUTHN_LOGIN_ERROR",
        error.message || "Error during WebAuthn login",
        error,
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
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account using WebAuthn credentials.
   * Requires browser support for WebAuthn.
   */
  async signUp(username: string): Promise<SignUpResult> {
    try {
      const core = this.assertInitialized();

      if (!username) {
        throw new Error("Username required for WebAuthn registration");
      }

      if (!this.isSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      const credentials: WebAuthnUniformCredentials =
        await this.generateCredentials(username, null, false);

      if (!credentials?.success) {
        throw new Error(
          credentials?.error || "Unable to generate WebAuthn credentials",
        );
      }

      // Usa le chiavi derivate per signup
      core.setAuthMethod("webauthn");

      const signupResult = await core.signUp(username, "", "", credentials.key);

      if (signupResult.success) {
        return {
          ...signupResult,
        };
      } else {
        return signupResult;
      }
    } catch (error: any) {
      console.error(`Error during WebAuthn registration: ${error}`);

      ErrorHandler.handle(
        ErrorType.WEBAUTHN,
        "WEBAUTHN_SIGNUP_ERROR",
        error.message || "Error during WebAuthn registration",
        error,
      );

      return {
        success: false,
        error: error.message || "Error during WebAuthn registration",
      };
    }
  }
}

// Export only the interface, not the plugin itself again
export type { WebauthnPluginInterface } from "./types";
