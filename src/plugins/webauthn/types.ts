import { CredentialResult, WebAuthnCredentials, WebAuthnConfig } from "../../types/webauthn";

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
  generateCredentials(
    username: string,
    existingCredential?: WebAuthnCredentials | null,
    isLogin?: boolean
  ): Promise<CredentialResult>;
  
  /**
   * Crea un nuovo account WebAuthn
   * @param username Nome utente
   * @param credentials Credenziali WebAuthn
   * @param isNewDevice Flag che indica se è un nuovo dispositivo
   * @returns Promise con il risultato dell'operazione
   */
  createAccount(
    username: string,
    credentials: WebAuthnCredentials | null,
    isNewDevice?: boolean
  ): Promise<CredentialResult>;
  
  /**
   * Autentica un utente con WebAuthn
   * @param username Nome utente
   * @param salt Salt per l'autenticazione
   * @param options Opzioni per l'operazione
   * @returns Promise con il risultato dell'autenticazione
   */
  authenticateUser(
    username: string,
    salt: string | null,
    options?: any
  ): Promise<CredentialResult>;
  
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
  removeDevice(
    username: string,
    credentialId: string,
    credentials: WebAuthnCredentials
  ): Promise<{ success: boolean; updatedCredentials?: WebAuthnCredentials }>;
} 