import { Webauthn } from './webauthn';
/**
 * WebAuthn Credential for oneshot signing
 */
export interface WebAuthnSigningCredential {
    id: string;
    rawId: ArrayBuffer;
    publicKey: {
        x: string;
        y: string;
    };
    pub: string;
    hashedCredentialId: string;
    gunUserPub?: string;
}
/**
 * WebAuthn Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but integrated with our architecture
 * CONSISTENT with normal WebAuthn approach
 */
export declare class WebAuthnSigner {
    private webauthn;
    private credentials;
    constructor(webauthn?: Webauthn);
    /**
     * Creates a new WebAuthn credential for signing
     * Similar to webauthn.js create functionality but CONSISTENT with normal approach
     */
    createSigningCredential(username: string): Promise<WebAuthnSigningCredential>;
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js
     */
    createAuthenticator(credentialId: string): (data: any) => Promise<AuthenticatorAssertionResponse>;
    /**
     * Creates a derived key pair from WebAuthn credential
     * CONSISTENT with normal approach: uses hashedCredentialId as password
     */
    createDerivedKeyPair(credentialId: string, username: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Creates a Gun user from WebAuthn credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    createGunUser(credentialId: string, username: string, gunInstance: any): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Signs data using WebAuthn + derived keys
     * This provides a hybrid approach: WebAuthn for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    signWithDerivedKeys(data: any, credentialId: string, username: string, extra?: string[]): Promise<string>;
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    getGunUserPub(credentialId: string): string | undefined;
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    getHashedCredentialId(credentialId: string): string | undefined;
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    verifyConsistency(credentialId: string, username: string, expectedUserPub?: string): Promise<{
        consistent: boolean;
        actualUserPub?: string;
        expectedUserPub?: string;
    }>;
    /**
     * Get credential by ID
     */
    getCredential(credentialId: string): WebAuthnSigningCredential | undefined;
    /**
     * List all stored credentials
     */
    listCredentials(): WebAuthnSigningCredential[];
    /**
     * Remove a credential
     */
    removeCredential(credentialId: string): boolean;
}
export default WebAuthnSigner;
