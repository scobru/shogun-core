import { AuthResult, SignUpResult } from './shogun';
import { ShogunPlugin } from './plugin';

/**
 * Interfaccia unificata per i plugin di autenticazione in ShogunCore.
 * Consente all'AuthManager di interagire con diversi metodi di autenticazione
 * (WebAuthn, MetaMask, ecc.) in modo coerente.
 */
export interface IAuthPlugin extends ShogunPlugin {
  /**
   * Esegue il login utilizzando il metodo di autenticazione specifico del plugin.
   * @param identifier Identificativo dell'utente (username, indirizzo ETH, ecc.)
   * @param options Opzioni extra specifiche per il plugin
   */
  login(identifier: string, options?: any): Promise<AuthResult>;

  /**
   * Esegue la registrazione utilizzando il metodo di autenticazione specifico del plugin.
   * @param identifier Identificativo desiderato per l'utente
   * @param options Opzioni extra specifiche per il plugin
   */
  signUp(identifier: string, options?: any): Promise<SignUpResult>;

  /**
   * Verifica se il metodo di autenticazione è supportato o disponibile nell'ambiente corrente.
   */
  isSupported?(): boolean;

  /**
   * Metodo alias per isSupported (utilizzato da alcuni plugin)
   */
  isAvailable?(): boolean;
}
