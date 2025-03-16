/**
 * Type definitions for Gun and SEA
 */

/**
 * Interface for a Gun chain reference
 */
export interface IGunChainReference<T = any> {
  /**
   * Gets a specific node in the chain
   */
  get(path: string): IGunChainReference;

  /**
   * Puts data into a node
   */
  put(data: any, callback?: (ack: any) => void, options?: any): IGunChainReference;

  /**
   * Gets the current node's value once
   */
  once(callback: (data: T) => void): IGunChainReference;

  /**
   * Gets the Gun user
   */
  user(): IGunChainReference;
  user(pub?: string): IGunChainReference;

  /**
   * Retrieves the user session
   */
  recall(options?: any, callback?: (ack: any) => void): IGunChainReference;

  /**
   * Logs out the user
   */
  leave(): void;

  /**
   * Authenticates the user
   */
  auth(username: string, password: string, callback?: (ack: any) => void, options?: any): IGunChainReference;
  auth(pair: IGunCryptoKeyPair, callback?: (ack: any) => void, options?: any): IGunChainReference;

  /**
   * Creates a new user
   */
  create(username: string, password: string, callback?: (ack: any) => void): IGunChainReference;
  create(username: string, password: any, pair: any, callback?: (ack: any) => void): IGunChainReference;

  /**
   * Deletes a user
   */
  delete(username: string, password: string, callback?: (ack: any) => void): IGunChainReference;

  /**
   * Registers an event
   */
  on(event: string, callback: (...args: any[]) => void): IGunChainReference;
  on(callback: (data: T) => void): IGunChainReference;
}

/**
 * Interface for a SEA cryptographic key pair
 */
export interface IGunCryptoKeyPair {
  /**
   * Public key
   */
  pub: string;

  /**
   * Encrypted public key
   */
  epub: string;

  /**
   * Private key
   */
  priv?: string;

  /**
   * Encrypted private key
   */
  epriv?: string;
}
