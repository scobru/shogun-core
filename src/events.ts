import { EventEmitter } from "./utils/eventEmitter";

/**
 * Interface representing authentication event data
 * @interface AuthEventData
 * @property {string} userPub - The user's public key
 * @property {string} [username] - Optional username
 * @property {"password" | "webauthn" | "metamask"} method - Authentication method used
 */
export interface AuthEventData {
  userPub: string;
  username?: string;
  method: "password" | "webauthn" | "metamask";
}

/**
 * Interface representing wallet event data
 * @interface WalletEventData
 * @property {string} address - The wallet address
 * @property {string} [path] - Optional derivation path
 */
export interface WalletEventData {
  address: string;
  path?: string;
}

/**
 * Interface representing error event data
 * @interface ErrorEventData
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {unknown} [details] - Optional additional error details
 */
export interface ErrorEventData {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Type defining all available Shogun event listeners
 * @type ShogunEventListeners
 */
export type ShogunEventMap = {
  "auth:login": AuthEventData;
  "auth:logout": void;
  "auth:signup": AuthEventData;
  "wallet:created": WalletEventData;
  error: ErrorEventData;
};

/**
 * Extended EventEmitter class with typed events for Shogun
 * @class ShogunEventEmitter
 * @extends EventEmitter
 */
export class ShogunEventEmitter extends EventEmitter<ShogunEventMap> {
  /**
   * Emit a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {ShogunEventMap[K]} data - Event data
   */
  emit<K extends keyof ShogunEventMap>(
    event: K,
    data?: ShogunEventMap[K],
  ): void {
    super.emit(event as string, data);
  }

  /**
   * Register a listener for a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function
   */
  on<K extends keyof ShogunEventMap>(
    event: K,
    listener: (data: ShogunEventMap[K]) => void,
  ): void {
    super.on(event as string, listener as (data: unknown) => void);
  }

  /**
   * Remove a listener for a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function to remove
   */
  off<K extends keyof ShogunEventMap>(
    event: K,
    listener: (data: ShogunEventMap[K]) => void,
  ): void {
    super.off(event as string, listener as (data: unknown) => void);
  }
}
