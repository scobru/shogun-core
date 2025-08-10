// @ts-nocheck
import { EventEmitter } from "../../utils/eventEmitter";
import { DeviceInfo, WebAuthnCredentials, CredentialResult, WebAuthnConfig, WebAuthnOperationOptions } from "./types";
import { IGunInstance } from "gun";
/**
 * Extends Window interface to include WebauthnAuth
 */
declare global {
    interface Window {
        Webauthn?: typeof Webauthn;
    }
}
/**
 * Extends NodeJS Global interface to include WebauthnAuth
 */
declare global {
    namespace NodeJS {
        interface Global {
            Webauthn?: typeof Webauthn;
        }
    }
}
/**
 * Main WebAuthn class for authentication management
 */
export declare class Webauthn extends EventEmitter {
    private readonly config;
    private readonly gunInstance?;
    private credential;
    private abortController;
    /**
     * Creates a new WebAuthn instance
     */
    constructor(gunInstance?: IGunInstance, config?: Partial<WebAuthnConfig>);
    /**
     * Validates a username
     */
    validateUsername(username: string): void;
    /**
     * Creates a new WebAuthn account with retry logic
     */
    createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice?: boolean): Promise<CredentialResult>;
    /**
     * Authenticates a user with timeout and abort handling
     */
    authenticateUser(username: string, salt: string | null, options?: WebAuthnOperationOptions): Promise<CredentialResult>;
    /**
     * Aborts current authentication attempt
     */
    abortAuthentication(): void;
    /**
     * Gets device information
     */
    private getDeviceInfo;
    /**
     * Gets platform information
     */
    private getPlatformInfo;
    /**
     * Generates a challenge for WebAuthn operations
     */
    private generateChallenge;
    /**
     * Gets cryptographically secure random bytes
     */
    private getRandomBytes;
    /**
     * Converts Uint8Array to hexadecimal string
     */
    private uint8ArrayToHex;
    /**
     * Converts ArrayBuffer to URL-safe base64 string
     */
    private bufferToBase64;
    /**
     * Generates credentials from username and salt
     */
    private generateCredentialsFromSalt;
    /**
     * Checks if WebAuthn is supported
     */
    isSupported(): boolean;
    /**
     * Creates a WebAuthn credential for registration
     */
    private createCredential;
    /**
     * Generates WebAuthn credentials (uniforme con altri plugin)
     */
    generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin?: boolean): Promise<{
        success: boolean;
        username: string;
        key: any;
        credentialId: string;
        publicKey?: ArrayBuffer | null;
        error?: string;
    }>;
    /**
     * Verifies a credential
     */
    private verifyCredential;
    /**
     * Removes device credentials
     */
    removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
        success: boolean;
        updatedCredentials?: WebAuthnCredentials;
    }>;
    /**
     * Signs data with the credential
     */
    sign(data: Record<string, unknown>): Promise<unknown>;
}
export type { WebAuthnCredentials, DeviceInfo, CredentialResult };
export declare function deriveWebauthnKeys(username: string, credentialId: string): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
    secp256k1Bitcoin: {
        privateKey: string;
        publicKey: string;
        address: string;
    };
    secp256k1Ethereum: {
        privateKey: string;
        publicKey: string;
        address: string;
    };
}>;
