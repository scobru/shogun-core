/**
 * Improved type definitions to reduce 'any' usage while maintaining GunDB compatibility
 */

import type {
  IGunUserInstance,
  IGunInstance,
  IGunChain,
  ISEAPair,
} from "gun/types";

// Generic type parameters for better type safety
// Using any to avoid GunDB type constraints
export type GunInstance = IGunInstance<any>;
export type GunUserInstance = IGunUserInstance<any>;
export type GunChain = IGunChain<
  any,
  IGunInstance<any>,
  IGunInstance<any>,
  string
>;

// Specific data types instead of 'any'
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

// Typed callback interfaces
export interface GunAckCallback {
  (ack: { err?: string; ok?: number; pub?: string }): void;
}

export interface GunDataCallback<T = unknown> {
  (data: T, key: string): void;
}

export interface GunMapCallback<T = unknown> {
  (data: T, key: string): void;
}

// Typed operation results
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

// User data with proper typing
export interface TypedUserInfo {
  pub: string;
  alias?: string;
  timestamp?: number;
  user?: GunUserInstance;
  metadata?: Record<string, unknown>;
}

// Authentication with better typing
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

// Configuration with proper typing
export interface TypedGunConfig {
  peers?: string[];
  localStorage?: boolean;
  radisk?: boolean;
  file?: string;
  uuid?: () => string;
  [key: string]: unknown;
}

// Event data with proper typing
export interface TypedEventData {
  type: string;
  data: unknown;
  timestamp: number;
  source?: string;
}

// Path operations with better typing
export type GunPath = string | string[];

export interface PathOperation<T = unknown> {
  path: GunPath;
  data?: T;
  callback?: GunAckCallback;
}

// RxJS integration with proper typing
export interface TypedRxJSObservable<T = unknown> {
  subscribe: (observer: {
    next: (value: T) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }) => { unsubscribe: () => void };
}

// Plugin system with better typing
export interface TypedPluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

// Storage with proper typing
export interface TypedStorageData {
  key: string;
  value: unknown;
  timestamp: number;
  ttl?: number;
}

// Error handling with better typing
export interface TypedGunError extends Error {
  code?: string;
  type: "GUN_ERROR" | "AUTH_ERROR" | "NETWORK_ERROR" | "VALIDATION_ERROR";
  context?: Record<string, unknown>;
}

// Utility types for common operations
export type GunOperation =
  | "get"
  | "put"
  | "set"
  | "remove"
  | "once"
  | "on"
  | "off";
export type GunAuthMethod = "password" | "pair" | "webauthn" | "web3" | "nostr";

// Generic wrapper for Gun operations
export interface TypedGunWrapper<T = Record<string, unknown>> {
  gun: GunInstance;
  user: GunUserInstance | null;

  // Typed operations
  get(path: GunPath): Promise<T>;
  put(path: GunPath, data: T): Promise<TypedGunOperationResult<T>>;
  set(path: GunPath, data: T): Promise<TypedGunOperationResult<T>>;
  remove(path: GunPath): Promise<TypedGunOperationResult>;

  // Typed user operations
  getUserData(path: string): Promise<T>;
  putUserData(path: string, data: T): Promise<void>;

  // Typed authentication
  login(username: string, password: string): Promise<TypedAuthResult>;
  signUp(username: string, password: string): Promise<TypedAuthResult>;
}
