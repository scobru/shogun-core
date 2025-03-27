import { BaseEvent, BaseConfig, BaseDeviceInfo, BaseAuthResult } from './common';
/**
 * WebAuthn types definitions
 */
/**
 * WebAuthn device information
 */
export interface DeviceInfo extends BaseDeviceInfo {
    registeredBy?: string;
}
/**
 * WebAuthn credentials storage
 */
export interface WebAuthnCredentials {
    salt: string;
    timestamp: number;
    credentials: Record<string, DeviceInfo>;
}
/**
 * Result of credential operations
 */
export interface CredentialResult extends BaseAuthResult {
    credentialId?: string;
    deviceInfo?: DeviceInfo;
    webAuthnCredentials?: WebAuthnCredentials;
}
/**
 * WebAuthn configuration options
 */
export interface WebAuthnConfig extends BaseConfig {
    rpName: string;
    rpId?: string;
    userVerification?: UserVerificationRequirement;
    attestation?: AttestationConveyancePreference;
    authenticatorAttachment?: AuthenticatorAttachment;
    requireResidentKey?: boolean;
}
/**
 * WebAuthn event types
 */
export declare enum WebAuthnEventType {
    DEVICE_REGISTERED = "deviceRegistered",
    DEVICE_REMOVED = "deviceRemoved",
    AUTHENTICATION_SUCCESS = "authenticationSuccess",
    AUTHENTICATION_FAILED = "authenticationFailed",
    ERROR = "error"
}
/**
 * WebAuthn event data
 */
export interface WebAuthnEvent extends BaseEvent {
    type: WebAuthnEventType;
}
/**
 * WebAuthn operation options
 */
export interface WebAuthnOperationOptions extends BaseConfig {
    userVerification?: UserVerificationRequirement;
    attestation?: AttestationConveyancePreference;
}
