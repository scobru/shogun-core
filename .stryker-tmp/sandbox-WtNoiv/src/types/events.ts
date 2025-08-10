// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
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
  "plugin:registered": {
    name: string;
    version?: string;
    category?: string;
  };
  "plugin:unregistered": {
    name: string;
  };
  debug: {
    action: string;
    [key: string]: any;
  };
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
  emit<K extends keyof ShogunEventMap>(event: K, data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K]): boolean {
    if (stryMutAct_9fa48("6177")) {
      {}
    } else {
      stryCov_9fa48("6177");
      return super.emit(event as string, data);
    }
  }

  /**
   * Register a listener for a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function
   */
  on<K extends keyof ShogunEventMap>(event: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): void {
    if (stryMutAct_9fa48("6178")) {
      {}
    } else {
      stryCov_9fa48("6178");
      super.on(event as string, listener as (data: unknown) => void);
    }
  }

  /**
   * Remove a listener for a typed Shogun event
   * @template K - Event key type
   * @param {K} event - Event name
   * @param {(data: ShogunEventMap[K]) => void} listener - Event listener function to remove
   */
  off<K extends keyof ShogunEventMap>(event: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): void {
    if (stryMutAct_9fa48("6179")) {
      {}
    } else {
      stryCov_9fa48("6179");
      super.off(event as string, listener as (data: unknown) => void);
    }
  }
}