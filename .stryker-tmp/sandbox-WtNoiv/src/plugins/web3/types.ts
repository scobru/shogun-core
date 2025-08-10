// @ts-nocheck
import { ISEAPair } from "gun";
import { BaseConfig, BaseResult, BaseAuthResult, BaseCacheEntry } from "../../types/common";
import { AuthResult, SignUpResult } from "../../types/shogun";

/**
 * Result of connection attempt
 */
export interface ConnectionResult extends BaseResult {
  address?: string;
  username?: string;
  randomPassword?: string;
}

/**
 * Structure for credentials generated via MetaMask
 */
export interface Web3ConnectorCredentials {
  /** Generated username based on the address */
  username: string;
  /** Generated password based on the signature */
  password: string;
  /** Original message signed by the user */
  message: string;
  /** Signature provided by MetaMask */
  signature: string;
}

/**
 * Ethereum provider interface
 */
export interface EthereumProvider {
  request: (args: any) => Promise<any>;
  isMetaMask?: boolean;
  on?: (event: string, handler: (params: any) => void) => void;
  removeListener?: (event: string, handler: (params: any) => void) => void;
}

/**
 * Cache entry for signatures
 */
export interface SignatureCache extends BaseCacheEntry<string> {
  signature: string;
  address: string;
}

/**
 * MetaMask configuration options
 */
export interface Web3Config extends BaseConfig {
  cacheDuration?: number; // Duration in milliseconds for signature cache
}

/**
 * Interfaccia per il plugin MetaMask
 */
export interface Web3ConectorPluginInterface {
  /**
   * Verifica se MetaMask è disponibile nel browser
   * @returns true se MetaMask è disponibile, false altrimenti
   */
  isAvailable(): boolean;

  /**
   * Connette a MetaMask
   * @returns Promise con il risultato della connessione
   */
  connectMetaMask(): Promise<ConnectionResult>;

  /**
   * Genera credenziali utilizzando MetaMask
   * @param address Indirizzo Ethereum
   * @returns Promise con le credenziali generate
   */
  generateCredentials(address: string): Promise<ISEAPair>;

  /**
   * Rilascia le risorse e pulisce gli event listener
   */
  cleanup(): void;

  /**
   * Imposta un provider personalizzato
   * @param rpcUrl URL del provider RPC
   * @param privateKey Chiave privata
   */
  setCustomProvider(rpcUrl: string, privateKey: string): void;

  /**
   * Ottiene il signer Ethereum
   * @returns Promise con il signer
   */
  getSigner(): Promise<any>;

  /**
   * Genera una password basata su una firma
   * @param signature Firma
   * @returns Promise con la password generata
   */
  generatePassword(signature: string): Promise<string>;

  /**
   * Verifica una firma
   * @param message Messaggio firmato
   * @param signature Firma da verificare
   * @returns Promise con l'indirizzo che ha generato la firma
   */
  verifySignature(message: string, signature: string): Promise<string>;

  /**
   * Login con MetaMask
   * @param address Indirizzo Ethereum
   * @returns Promise con il risultato dell'operazione
   */
  login(address: string): Promise<AuthResult>;

  /**
   * Sign up with Web3 wallet
   * @param address Ethereum address
   * @returns Promise with authentication result
   */
  signUp(address: string): Promise<SignUpResult>;
}