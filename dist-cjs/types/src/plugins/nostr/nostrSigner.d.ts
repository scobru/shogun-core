import { NostrConnector } from './nostrConnector';
/**
 * Nostr Signing Credential for oneshot signing
 */
export interface NostrSigningCredential {
    address: string;
    signature: string;
    message: string;
    username: string;
    password: string;
    gunUserPub?: string;
}
/**
 * Nostr Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Nostr/Bitcoin wallets
 * CONSISTENT with normal Nostr approach
 */
export declare class NostrSigner {
    private nostrConnector;
    private credentials;
    private readonly MESSAGE_TO_SIGN;
    constructor(nostrConnector?: NostrConnector);
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    createSigningCredential(address: string): Promise<NostrSigningCredential>;
    /**
     * Validates address using the same logic as NostrConnector
     */
    private validateAddress;
    /**
     * Generate deterministic signature using the SAME approach as NostrConnector
     */
    private generateDeterministicSignature;
    /**
     * Generate password using the SAME approach as NostrConnector
     */
    private generatePassword;
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Nostr
     */
    createAuthenticator(address: string): (data: any) => Promise<string>;
    /**
     * Sign data using the credential
     */
    private signData;
    /**
     * Creates a derived key pair from Nostr credential
     * CONSISTENT with normal approach: uses password as seed
     */
    createDerivedKeyPair(address: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Creates a Gun user from Nostr credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    createGunUser(address: string, gunInstance: any): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Signs data using Nostr + derived keys
     * This provides a hybrid approach: Nostr for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string>;
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    getGunUserPub(address: string): string | undefined;
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address: string): string | undefined;
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    verifyConsistency(address: string, expectedUserPub?: string): Promise<{
        consistent: boolean;
        actualUserPub?: string;
        expectedUserPub?: string;
    }>;
    /**
     * Get credential by address
     */
    getCredential(address: string): NostrSigningCredential | undefined;
    /**
     * List all stored credentials
     */
    listCredentials(): NostrSigningCredential[];
    /**
     * Remove a credential
     */
    removeCredential(address: string): boolean;
}
export default NostrSigner;
