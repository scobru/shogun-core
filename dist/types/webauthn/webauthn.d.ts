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
 * Definition of interfaces with standard types
 */
interface DeviceInfo {
    deviceId: string;
    timestamp: number;
    name: string;
    platform: string;
}
interface WebAuthnCredentials {
    salt: string;
    timestamp: number;
    credentials: Record<string, DeviceInfo>;
}
interface CredentialResult {
    success: boolean;
    username?: string;
    password?: string;
    credentialId?: string;
    deviceInfo?: DeviceInfo;
    error?: string;
    webAuthnCredentials?: WebAuthnCredentials;
}
/**
 * Main WebAuthn class for authentication management
 */
declare class Webauthn {
    private rpId;
    private gunInstance;
    private credential;
    /**
     * Creates a new WebAuthn instance
     */
    constructor(gunInstance?: any);
    /**
     * Validates a username
     */
    validateUsername(username: string): void;
    /**
     * Creates a new WebAuthn account
     */
    createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice?: boolean): Promise<CredentialResult>;
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
     * Authenticates a user
     */
    authenticateUser(username: string, salt: string | null): Promise<CredentialResult>;
    /**
     * Signs data using WebAuthn
     */
    sign(data: any): Promise<Credential | null>;
}
export { Webauthn, WebAuthnCredentials, DeviceInfo, CredentialResult };
