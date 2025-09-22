/**
 * Event types and interfaces for Shogun SDK
 */
export interface AuthEventData {
    userPub?: string;
    username?: string;
    method: "password" | "webauthn" | "web3" | "nostr" | "oauth" | "bitcoin" | "pair";
    provider?: string;
}
export interface WalletEventData {
    address: string;
    path?: string;
}
export interface ErrorEventData {
    action: string;
    message: string;
    type: string;
    details?: any;
}
export interface GunDataEventData {
    path: string;
    data?: any;
    success: boolean;
    error?: string;
    timestamp: number;
}
export interface GunPeerEventData {
    peer: string;
    action: "add" | "remove" | "connect" | "disconnect";
    timestamp: number;
}
export interface PluginEventData {
    name: string;
    version?: string;
    category?: string;
}
export interface DebugEventData {
    action: string;
    data?: any;
    timestamp: number;
}
export interface UsernameChangedEventData {
    oldUsername: string;
    newUsername: string;
    userPub: string;
}
/**
 * Event emitter class for Shogun SDK
 */
export declare class ShogunEventEmitter {
    private listeners;
    on(eventName: string, listener: Function): this;
    off(eventName: string, listener: Function): this;
    once(eventName: string, listener: Function): this;
    emit(eventName: string, data?: any): boolean;
    removeAllListeners(eventName?: string): this;
    listenerCount(eventName: string): number;
    eventNames(): string[];
}
