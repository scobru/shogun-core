// @ts-nocheck
import { AuthResult, SignUpResult } from "../../types/shogun";
import { BaseEvent, BaseConfig, BaseDeviceInfo, BaseResult, BaseAuthResult } from "../../types/common";

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
export interface WebAuthnCredentialCreationOptions extends PublicKeyCredentialCreationOptions {
  signal?: AbortSignal;
}

/**
 * Interfaccia per il plugin WebAuthn
 */
export interface WebauthnPluginInterface {
  /**
   * Verifica se WebAuthn è supportato nel browser corrente
   * @returns true se WebAuthn è supportato, false altrimenti
   */
  isSupported(): boolean;

  /**
   * Genera credenziali WebAuthn
   * @param username Nome utente
   * @param existingCredential Credenziali esistenti (opzionale)
   * @param isLogin Flag che indica se è per login
   * @returns Promise con il risultato dell'operazione
   */
  generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin?: boolean): Promise<CredentialResult>;

  /**
   * Crea un nuovo account WebAuthn
   * @param username Nome utente
   * @param credentials Credenziali WebAuthn
   * @param isNewDevice Flag che indica se è un nuovo dispositivo
   * @returns Promise con il risultato dell'operazione
   */
  createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice?: boolean): Promise<CredentialResult>;

  /**
   * Autentica un utente con WebAuthn
   * @param username Nome utente
   * @param salt Salt per l'autenticazione
   * @param options Opzioni per l'operazione
   * @returns Promise con il risultato dell'autenticazione
   */
  authenticateUser(username: string, salt: string | null, options?: any): Promise<CredentialResult>;

  /**
   * Interrompe un tentativo di autenticazione in corso
   */
  abortAuthentication(): void;

  /**
   * Rimuove un dispositivo WebAuthn
   * @param username Nome utente
   * @param credentialId ID della credenziale
   * @param credentials Credenziali WebAuthn
   * @returns Promise con il risultato dell'operazione
   */
  removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
    success: boolean;
    updatedCredentials?: WebAuthnCredentials;
  }>;

  /**
   * Login con WebAuthn
   * @param username Nome utente
   * @returns Promise con il risultato dell'operazione
   */
  login(username: string): Promise<AuthResult>;

  /**
   * Signup con WebAuthn
   * @param username Nome utente
   * @returns Promise con il risultato dell'operazione
   */
  signUp(username: string): Promise<SignUpResult>;
}
export interface WebAuthnUniformCredentials {
  success: boolean;
  username: string;
  key: any;
  credentialId: string;
  publicKey?: ArrayBuffer | null;
  error?: string;
}