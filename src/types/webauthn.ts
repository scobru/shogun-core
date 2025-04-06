import {
  BaseEvent,
  BaseConfig,
  BaseDeviceInfo,
  BaseResult,
  BaseAuthResult,
} from "./common";

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
  publicKey?: ArrayBuffer | null;
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
export enum WebAuthnEventType {
  DEVICE_REGISTERED = "deviceRegistered",
  DEVICE_REMOVED = "deviceRemoved",
  AUTHENTICATION_SUCCESS = "authenticationSuccess",
  AUTHENTICATION_FAILED = "authenticationFailed",
  ERROR = "error",
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

/**
 * WebAuthn credential data
 */
export interface WebAuthnCredentialData {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer;
    getPublicKey?: () => ArrayBuffer;
  };
  type: string;
  getClientExtensionResults: () => AuthenticationExtensionsClientOutputs;
}

/**
 * WebAuthn verification result
 */
export interface WebAuthnVerificationResult extends BaseResult {
  username?: string;
  credentialId?: string;
  error?: string;
}

/**
 * WebAuthn credential creation options with extensions
 */
export interface WebAuthnCredentialCreationOptions
  extends PublicKeyCredentialCreationOptions {
  signal?: AbortSignal;
}
