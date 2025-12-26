import { Web3Connector } from './web3Connector';
/**
 * Web3 Signing Credential for oneshot signing
 */
export interface Web3SigningCredential {
    address: string;
    signature: string;
    message: string;
    username: string;
    password: string;
    gunUserPub?: string;
}
/**
 * Web3 Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Web3/MetaMask
 * CONSISTENT with normal Web3 approach
 */
export declare class Web3Signer {
    private web3Connector;
    private credentials;
    private readonly MESSAGE_TO_SIGN;
    constructor(web3Connector?: Web3Connector);
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    createSigningCredential(address: string): Promise<Web3SigningCredential>;
    /**
     * Request signature from MetaMask
     * Uses the same approach as normal Web3Connector
     */
    private requestSignature;
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Web3
     */
    createAuthenticator(address: string): (data: any) => Promise<string>;
    /**
     * Creates a derived key pair from Web3 credential
     * CONSISTENT with normal approach: uses password as seed
     */
    createDerivedKeyPair(address: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Authenticate with existing pair (for login)
     * This generates the deterministic pair from address and authenticates with GunDB
     * GunDB will recognize the user because the pair is deterministic
     */
    authenticateWithExistingPair(address: string, gunInstance: any): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Creates a derived key pair directly from address (deterministic)
     * This ensures the same pair is generated every time for the same address
     */
    createDerivedKeyPairFromAddress(address: string, extra?: string[]): Promise<{
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    }>;
    /**
     * Creates a Gun user from Web3 credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    createGunUser(address: string, gunInstance: any): Promise<{
        success: boolean;
        userPub?: string;
        error?: string;
    }>;
    /**
     * Signs data using Web3 + derived keys
     * This provides a hybrid approach: Web3 for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string>;
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    getGunUserPub(address: string): Promise<string | undefined>;
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
    getCredential(address: string): Web3SigningCredential | undefined;
    /**
     * List all stored credentials
     */
    listCredentials(): Web3SigningCredential[];
    /**
     * Remove a credential
     */
    removeCredential(address: string): boolean;
}
export default Web3Signer;
