/**
 * Type definitions for GunDB to replace 'any' usage
 */
export type GunType = (config?: any) => IGunInstance<any>;
export type SEAType = any;
export type GunUser = IGunUserInstance<any>;
export type UserInfo = {
    pub: string;
    epub?: string;
    alias?: string;
    user?: GunUser;
    timestamp?: number;
};
export type AuthCallback = (user: GunUser) => void;
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
import type { IGunUserInstance, IGunInstance, ISEAPair } from 'gun/types';
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
