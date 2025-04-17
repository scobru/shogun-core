import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { WebauthnPluginInterface } from "./types";
import { WebAuthnCredentials, CredentialResult } from "../../types/webauthn";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export declare class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
    name: string;
    version: string;
    description: string;
    private webauthn;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo WebAuthn sia inizializzato
     * @private
     */
    private assertWebauthn;
    /**
     * @inheritdoc
     */
    isSupported(): boolean;
    /**
     * @inheritdoc
     */
    generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin?: boolean): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice?: boolean): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    authenticateUser(username: string, salt: string | null, options?: any): Promise<CredentialResult>;
    /**
     * @inheritdoc
     */
    abortAuthentication(): void;
    /**
     * @inheritdoc
     */
    removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
        success: boolean;
        updatedCredentials?: WebAuthnCredentials;
    }>;
    /**
     * Login with WebAuthn
     * This is the recommended method for WebAuthn authentication
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    login(username: string): Promise<AuthResult>;
    /**
     * Register new user with WebAuthn
     * This is the recommended method for WebAuthn registration
     * @param username - Username
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     */
    signUp(username: string): Promise<AuthResult>;
    /**
     * Legacy method for WebAuthn login - use login() instead
     * @deprecated Use login(username) instead
     */
    loginWithWebAuthn(username: string): Promise<AuthResult>;
    /**
     * Legacy method for WebAuthn signup - use signUp() instead
     * @deprecated Use signUp(username) instead
     */
    signUpWithWebAuthn(username: string): Promise<AuthResult>;
}
export type { WebauthnPluginInterface } from "./types";
