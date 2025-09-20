/**
 * Type definitions for GunDB to replace 'any' usage
 */
export type GunType = (config?: any) => IGunInstance<any>;
export type SEAType = any;
export type GunUser = IGunUserInstance<any>;
export type UserInfo = {
    pub: string;
    alias?: string;
    timestamp?: number;
    user?: GunUser;
};
export type AuthCallback = (user: GunUser) => void;
export type AuthResult = {
    success: boolean;
    userPub?: string;
    error?: string;
    ack?: any;
    sea?: {
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    };
};
export type GunData = any;
export type GunNode = any;
export type GunCallback = any;
export type GunDataCallback = any;
export type GunMapCallback = any;
export interface UsernameLookupResult {
    pub?: string;
    userPub?: string;
    username?: string;
    source: string;
    immutable: boolean;
    hash?: string;
    [key: string]: any;
}
export interface UserMetadata {
    username: string;
    pub: string;
    createdAt: number;
    lastLogin: number;
}
export interface MappingData {
    username: string;
    userPub: string;
    createdAt: number;
}
export interface SecurityData {
    questions: string;
    hint: string;
}
export interface FrozenData {
    data: any;
    timestamp: number;
    description: string;
    metadata: Record<string, any>;
}
export interface FrozenSpaceOptions {
    namespace?: string;
    path?: string;
    description?: string;
    metadata?: Record<string, any>;
}
export interface ConnectivityTestResult {
    peers: {
        [peer: string]: {
            connected: boolean;
            status: string;
        };
    };
    gunInstance: boolean;
    userInstance: boolean;
    canWrite: boolean;
    canRead: boolean;
    testWriteResult?: any;
    testReadResult?: any;
}
export interface LoginResult {
    success: boolean;
    userPub?: string;
    username?: string;
    error?: string;
}
export interface SignupResult {
    success: boolean;
    userPub?: string;
    username?: string;
    message?: string;
    error?: string;
    sea?: {
        pub: string;
        priv: string;
        epub: string;
        epriv: string;
    };
}
export interface PostAuthResult {
    success: boolean;
    userPub?: string;
    username?: string;
    error?: string;
}
export interface PasswordHintResult {
    success: boolean;
    hint?: string;
    error?: string;
}
export interface P256Keys {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
}
export interface Secp256k1Keys {
    pub: string;
    priv: string;
    address: string;
}
export interface DeriveResult {
    p256?: P256Keys;
    secp256k1Bitcoin?: Secp256k1Keys;
    secp256k1Ethereum?: Secp256k1Keys;
}
export interface FrozenSpaceResult {
    hash: string;
    fullPath: string;
    data: FrozenData;
}
export interface VerificationResult {
    verified: boolean;
    frozenData?: FrozenData;
    error?: string;
}
export interface SessionRestorationResult {
    success: boolean;
    userPub?: string;
    error?: string;
}
export interface UserExistenceResult {
    exists: boolean;
    userPub?: string;
    error?: string;
}
export interface UserCreationResult {
    success: boolean;
    pub?: string;
    error?: string;
}
export type EventData = any;
export type EventListener = (data: EventData) => void;
export interface GunOperationResult {
    success: boolean;
    error?: string;
}
/**
 * Improved type definitions to reduce 'any' usage while maintaining GunDB compatibility
 */
import type { IGunUserInstance, IGunInstance, IGunChain, ISEAPair } from "gun/types";
export type GunInstance = IGunInstance<any>;
export type GunUserInstance = IGunUserInstance<any>;
export type GunChain = IGunChain<any, IGunInstance<any>, IGunInstance<any>, string>;
export interface GunAckCallback {
    (ack: {
        err?: string;
        ok?: number;
        pub?: string;
    }): void;
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
