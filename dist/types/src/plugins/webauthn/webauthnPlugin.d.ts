import { BasePlugin } from '../base';
import { ShogunCore } from '../../core';
import { WebAuthnSigningCredential } from './webauthnSigner';
import { WebAuthnCredentials, CredentialResult, WebauthnPluginInterface, WebAuthnUniformCredentials } from './types';
import { AuthResult, SignUpResult } from '../../interfaces/shogun';
import { IAuthPlugin } from '../../interfaces/auth';
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export declare class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface, IAuthPlugin {
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
     * Genera un pair SEA dalle credenziali WebAuthn
     * @private
     */
    private generatePairFromCredentials;
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
     * @param options - Optional signup options (seed phrase support)
     * @returns {Promise<SignUpResult>} Registration result with optional seed phrase
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     * If generateSeedPhrase is true, returns a BIP39 mnemonic for multi-device support.
     */
    signUp(username: string, options?: {
        seedPhrase?: string;
        generateSeedPhrase?: boolean;
    }): Promise<SignUpResult>;
    /**
     * Import existing account from seed phrase
     * Allows accessing the same account across multiple devices
     * @param username - Username
     * @param seedPhrase - 12-word BIP39 mnemonic seed phrase
     * @returns {Promise<SignUpResult>} Registration result
     */
    importFromSeed(username: string, seedPhrase: string): Promise<SignUpResult>;
    /**
     * Get seed phrase for current user (if stored)
     * Note: Seed phrases are NOT stored by default for security
     * Users should save their seed phrase during registration
     * @param username - Username
     * @returns {Promise<string | null>} Seed phrase or null
     */
    getSeedPhrase(username: string): Promise<string | null>;
}
export type { WebauthnPluginInterface } from './types';
