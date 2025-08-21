import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { NostrSigningCredential } from "./nostrSigner";
import { NostrConnectorCredentials, ConnectionResult, NostrConnectorPluginInterface } from "./types";
import { AuthResult, SignUpResult } from "../../types/shogun";
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export declare class NostrConnectorPlugin extends BasePlugin implements NostrConnectorPluginInterface {
    name: string;
    version: string;
    description: string;
    private bitcoinConnector;
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
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    private assertBitcoinConnector;
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    private assertSigner;
    /**
     * @inheritdoc
     */
    isAvailable(): boolean;
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable(): boolean;
    /**
     * Connect to Nostr wallet automatically
     * This is a convenience method for easy wallet connection
     */
    connectNostrWallet(): Promise<ConnectionResult>;
    /**
     * @inheritdoc
     */
    connectBitcoinWallet(type?: "alby" | "nostr" | "manual"): Promise<ConnectionResult>;
    /**
     * @inheritdoc
     */
    generateCredentials(address: string, signature: string, message: string): Promise<NostrConnectorCredentials>;
    /**
     * @inheritdoc
     */
    cleanup(): void;
    /**
     * @inheritdoc
     */
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    createSigningCredential(address: string): Promise<NostrSigningCredential>;
    /**
     * Creates an authenticator function for Nostr signing
     */
    createAuthenticator(address: string): (data: any) => Promise<string>;
    /**
     * Creates a derived key pair from Nostr credential
     */
    createDerivedKeyPair(address: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Signs data with derived keys after Nostr verification
     */
    signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string>;
    /**
     * Get signing credential by address
     */
    getSigningCredential(address: string): NostrSigningCredential | undefined;
    /**
     * List all signing credentials
     */
    listSigningCredentials(): NostrSigningCredential[];
    /**
     * Remove a signing credential
     */
    removeSigningCredential(address: string): boolean;
    /**
     * Creates a Gun user from Nostr signing credential
     * This ensures the SAME user is created as with normal approach
     */
    createGunUserFromSigningCredential(address: string): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(address: string): string | undefined;
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address: string): string | undefined;
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    verifyConsistency(address: string, expectedUserPub?: string): Promise<{
        consistent: boolean;
        actualUserPub?: string;
        expectedUserPub?: string;
    }>;
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    setupConsistentOneshotSigning(address: string): Promise<{
        credential: NostrSigningCredential;
        authenticator: (data: any) => Promise<string>;
        gunUser: {
            success: boolean;
            userPub?: string;
            error?: string;
        };
        username: string;
        password: string;
    }>;
    /**
     * Login with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates the user using Bitcoin wallet credentials after signature verification
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Register new user with Nostr wallet
     * @param address - Nostr address
     * @returns {Promise<SignUpResult>} Registration result
     */
    signUp(address: string): Promise<SignUpResult>;
    /**
     * Convenience method that matches the interface pattern
     */
    loginWithBitcoinWallet(address: string): Promise<AuthResult>;
    /**
     * Convenience method that matches the interface pattern
     */
    signUpWithBitcoinWallet(address: string): Promise<AuthResult>;
}
