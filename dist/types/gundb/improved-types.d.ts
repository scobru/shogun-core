/**
 * Improved type definitions to reduce 'any' usage while maintaining GunDB compatibility
 */
import type { IGunUserInstance, IGunInstance, IGunChain, ISEAPair } from "gun/types";
export type GunInstance = IGunInstance<any>;
export type GunUserInstance = IGunUserInstance<any>;
export type GunChain = IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
export interface GunData {
    [key: string]: unknown;
}
export interface GunNodeData {
    [key: string]: unknown;
    _?: {
        "#": string;
        ">": Record<string, number>;
    };
}
export interface GunAckCallback {
    (ack: {
        err?: string;
        ok?: number;
        pub?: string;
    }): void;
}
export interface GunDataCallback<T = unknown> {
    (data: T, key: string): void;
}
export interface GunMapCallback<T = unknown> {
    (data: T, key: string): void;
}
export interface TypedGunOperationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    ack?: {
        err?: string;
        ok?: number;
        pub?: string;
    };
}
export interface TypedUserInfo {
    pub: string;
    alias?: string;
    timestamp?: number;
    user?: GunUserInstance;
    metadata?: Record<string, unknown>;
}
export interface TypedAuthCallback {
    (user: GunUserInstance): void;
}
export interface TypedAuthResult {
    success: boolean;
    userPub?: string;
    username?: string;
    error?: string;
    ack?: {
        err?: string;
        ok?: number;
        pub?: string;
        sea?: ISEAPair;
    };
    sea?: ISEAPair;
}
export interface TypedGunConfig {
    peers?: string[];
    localStorage?: boolean;
    radisk?: boolean;
    file?: string;
    uuid?: () => string;
    [key: string]: unknown;
}
export interface TypedEventData {
    type: string;
    data: unknown;
    timestamp: number;
    source?: string;
}
export type GunPath = string | string[];
export interface PathOperation<T = unknown> {
    path: GunPath;
    data?: T;
    callback?: GunAckCallback;
}
export interface TypedRxJSObservable<T = unknown> {
    subscribe: (observer: {
        next: (value: T) => void;
        error?: (error: Error) => void;
        complete?: () => void;
    }) => {
        unsubscribe: () => void;
    };
}
export interface TypedPluginConfig {
    name: string;
    version: string;
    enabled: boolean;
    config?: Record<string, unknown>;
}
export interface TypedStorageData {
    key: string;
    value: unknown;
    timestamp: number;
    ttl?: number;
}
export interface TypedGunError extends Error {
    code?: string;
    type: "GUN_ERROR" | "AUTH_ERROR" | "NETWORK_ERROR" | "VALIDATION_ERROR";
    context?: Record<string, unknown>;
}
export type GunOperation = "get" | "put" | "set" | "remove" | "once" | "on" | "off";
export type GunAuthMethod = "password" | "pair" | "webauthn" | "web3" | "nostr";
export interface TypedGunWrapper<T = Record<string, unknown>> {
    gun: GunInstance;
    user: GunUserInstance | null;
    get(path: GunPath): Promise<T>;
    put(path: GunPath, data: T): Promise<TypedGunOperationResult<T>>;
    set(path: GunPath, data: T): Promise<TypedGunOperationResult<T>>;
    remove(path: GunPath): Promise<TypedGunOperationResult>;
    getUserData(path: string): Promise<T>;
    putUserData(path: string, data: T): Promise<void>;
    login(username: string, password: string): Promise<TypedAuthResult>;
    signUp(username: string, password: string): Promise<TypedAuthResult>;
}
