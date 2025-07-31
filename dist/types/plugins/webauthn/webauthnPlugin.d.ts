import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { WebAuthnSigningCredential } from "./webauthnSigner";
import { WebAuthnCredentials, CredentialResult, WebauthnPluginInterface, WebAuthnUniformCredentials } from "./types";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export declare class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
    name: string;
    version: string;
    description: string;
    private webauthn;
    private signer;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo Webauthn sia inizializzato
     * @private
     */
    private assertWebauthn;
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    private assertSigner;
    /**
     * @inheritdoc
     */
    isSupported(): boolean;
    /**
     * @inheritdoc
     */
    generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin?: boolean): Promise<WebAuthnUniformCredentials>;
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
     * @inheritdoc
     */
    createSigningCredential(username: string): Promise<WebAuthnSigningCredential>;
    /**
     * @inheritdoc
     */
    createAuthenticator(credentialId: string): (data: any) => Promise<AuthenticatorAssertionResponse>;
    /**
     * @inheritdoc
     */
    createDerivedKeyPair(credentialId: string, username: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * @inheritdoc
     */
    signWithDerivedKeys(data: any, credentialId: string, username: string, extra?: string[]): Promise<string>;
    /**
     * @inheritdoc
     */
    getSigningCredential(credentialId: string): WebAuthnSigningCredential | undefined;
    /**
     * @inheritdoc
     */
    listSigningCredentials(): WebAuthnSigningCredential[];
    /**
     * @inheritdoc
     */
    removeSigningCredential(credentialId: string): boolean;
    /**
     * Creates a Gun user from WebAuthn signing credential
     * This ensures the SAME user is created as with normal approach
     */
    createGunUserFromSigningCredential(credentialId: string, username: string): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(credentialId: string): string | undefined;
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    getHashedCredentialId(credentialId: string): string | undefined;
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    verifyConsistency(credentialId: string, username: string, expectedUserPub?: string): Promise<{
        consistent: boolean;
        actualUserPub?: string;
        expectedUserPub?: string;
    }>;
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    setupConsistentOneshotSigning(username: string): Promise<{
        credential: WebAuthnSigningCredential;
        authenticator: (data: any) => Promise<AuthenticatorAssertionResponse>;
        gunUser: {
            success: boolean;
            userPub?: string;
            error?: string;
        };
        pub: string;
        hashedCredentialId: string;
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
}
export type { WebauthnPluginInterface } from "./types";
