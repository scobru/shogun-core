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
 * @property {any} [details] - Optional additional error details
 */
export interface ErrorEventData {
    code: string;
    message: string;
    details?: any;
}
/**
 * Interface defining all available Shogun events and their data types
 * @interface ShogunEvents
 */
export interface ShogunEvents {
    "auth:login": (data: AuthEventData) => void;
    "auth:logout": () => void;
    "auth:signup": (data: AuthEventData) => void;
    "wallet:created": (data: WalletEventData) => void;
    error: (data: ErrorEventData) => void;
}
/**
 * Extended EventEmitter class with typed events for Shogun
 * @class ShogunEventEmitter
 * @extends EventEmitter
 */
export declare class ShogunEventEmitter extends EventEmitter {
    /**
     * Emit a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {...Parameters<ShogunEvents[K]>} args - Event arguments
     */
    emit<K extends keyof ShogunEvents>(event: K, ...args: Parameters<ShogunEvents[K]>): void;
    /**
     * Register a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEvents[K]} listener - Event listener function
     */
    on<K extends keyof ShogunEvents>(event: K, listener: ShogunEvents[K]): void;
    /**
     * Remove a listener for a typed Shogun event
     * @template K - Event key type
     * @param {K} event - Event name
     * @param {ShogunEvents[K]} listener - Event listener function to remove
     */
    off<K extends keyof ShogunEvents>(event: K, listener: ShogunEvents[K]): void;
}
