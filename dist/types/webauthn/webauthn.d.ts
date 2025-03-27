import { EventEmitter } from "events";
import { DeviceInfo, WebAuthnCredentials, CredentialResult, WebAuthnConfig, WebAuthnOperationOptions } from "../types/webauthn";
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
    private config;
    private gunInstance;
    private credential;
    private abortController;
    /**
     * Creates a new WebAuthn instance
     */
    constructor(gunInstance?: any, config?: Partial<WebAuthnConfig>);
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
     * Creates a new credential
     */
    private createCredential;
    /**
     * Generates or verifies credentials
     */
    generateCredentials(username: string, existingCredential?: any, isLogin?: boolean): Promise<any>;
    /**
     * Verifies an existing credential
     */
    private verifyCredential;
    /**
     * Saves the credential to Gun database
     */
    private saveToGun;
    /**
     * Removes device credentials
     */
    removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
        success: boolean;
        updatedCredentials?: WebAuthnCredentials;
    }>;
    /**
     * Signs data using WebAuthn
     */
    sign(data: any): Promise<Credential | null>;
}
export { WebAuthnCredentials, DeviceInfo, CredentialResult };
