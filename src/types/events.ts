import { EventEmitter } from "../utils/eventEmitter";

/**
 * Interface representing authentication event data
 * @interface AuthEventData
 * @property {string} [userPub] - The user's public key (optional)
 * @property {string} [username] - Optional username
 * @property {"password" | "webauthn" | "web3" | "nostr" | "oauth" | "bitcoin" } method - Authentication method used
 * @property {string} [provider] - Optional provider name (for OAuth)
 */
export interface AuthEventData {
  userPub?: string;
  username?: string;
  method: "password" | "webauthn" | "web3" | "nostr" | "oauth" | "bitcoin";
  provider?: string;
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
 * @property {string} action - Error action/code
 * @property {string} message - Error message
 * @property {string} type - Error type
 * @property {unknown} [details] - Optional additional error details
 */
export interface ErrorEventData {
  action: string;
  message: string;
  type: string;
  details?: unknown;
}

/**
 * Interface representing Gun data operation event data
 * @interface GunDataEventData
 * @property {string} path - The path where the operation occurred
 * @property {any} [data] - The data involved in the operation
 * @property {boolean} success - Whether the operation was successful
 * @property {string} [error] - Error message if operation failed
 * @property {number} timestamp - Timestamp of the operation
 */
export interface GunDataEventData {
  path: string;
  data?: any;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Interface representing Gun peer event data
 * @interface GunPeerEventData
 * @property {string} peer - The peer URL
 * @property {string} action - The action performed (add, remove, connect, disconnect)
 * @property {number} timestamp - Timestamp of the event
 */
export interface GunPeerEventData {
  peer: string;
  action: "add" | "remove" | "connect" | "disconnect";
  timestamp: number;
}

/**
 * Interface representing Holster data operation event data
 * @interface HolsterDataEventData
 * @property {string} path - The path where the operation occurred
 * @property {any} [data] - The data involved in the operation
 * @property {boolean} success - Whether the operation was successful
 * @property {string} [error] - Error message if operation failed
 * @property {number} timestamp - Timestamp of the operation
 */
export interface HolsterDataEventData {
  path: string;
  data?: any;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Interface representing Holster peer event data
 * @interface HolsterPeerEventData
 * @property {string} peer - The peer URL
 * @property {string} action - The action performed (add, remove, connect, disconnect)
 * @property {number} timestamp - Timestamp of the event
 */
export interface HolsterPeerEventData {
  peer: string;
  action: "add" | "remove" | "connect" | "disconnect";
  timestamp: number;
}

/**
 * Type defining all available Shogun event listeners
 */
export type ShogunEventMap = {
  "auth:login": AuthEventData;
  "auth:logout": void;
  "auth:signup": AuthEventData;
  "auth:username_changed": {
    oldUsername?: string;
    newUsername?: string;
    userPub?: string;
  };
  "wallet:created": WalletEventData;
  "gun:put": GunDataEventData;
  "gun:get": GunDataEventData;
  "gun:set": GunDataEventData;
  "gun:remove": GunDataEventData;
  "gun:peer:add": GunPeerEventData;
  "gun:peer:remove": GunPeerEventData;
  "gun:peer:connect": GunPeerEventData;
  "gun:peer:disconnect": GunPeerEventData;
  "holster:put": HolsterDataEventData;
  "holster:get": HolsterDataEventData;
  "holster:set": HolsterDataEventData;
  "holster:remove": HolsterDataEventData;
  "holster:peer:add": HolsterPeerEventData;
  "holster:peer:remove": HolsterPeerEventData;
  "holster:peer:connect": HolsterPeerEventData;
  "holster:peer:disconnect": HolsterPeerEventData;
  "plugin:registered": { name: string; version?: string; category?: string };
  "plugin:unregistered": { name: string };
  debug: { action: string; [key: string]: any };
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
   * @returns {boolean} - Returns true if the event had listeners, false otherwise
   */
  emit<K extends keyof ShogunEventMap>(
    event: K,
    data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K],
  ): boolean {
    return super.emit(event as string, data);
  }

  /**
   * Register a listener for a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function
   */
  on<K extends keyof ShogunEventMap>(
    event: K,
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
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
    listener: ShogunEventMap[K] extends void
      ? () => void
      : (data: ShogunEventMap[K]) => void,
  ): void {
    super.off(event as string, listener as (data: unknown) => void);
  }
}
