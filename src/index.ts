import { ShogunCore } from "./core";

import {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
} from "./gundb/db";

import { RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";

// Import Simple API and improved types
import {
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  TypedGunOperationResult,
  TypedAuthResult,
  AutoQuickStart,
  autoQuickStart,
} from "./gundb";

import { SEA } from "./gundb/db";

import Gun from "./gundb/db";

export * from "./utils/errorHandler";

export * from "./plugins";

export * from "./interfaces/shogun";

export * from "./config/simplified-config";

// Type alias for backward compatibility
import type { ShogunCoreConfig } from "./interfaces/shogun";
export type ShogunSDKConfig = ShogunCoreConfig;

export type * from "./interfaces/plugin";

export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
  TypedGunOperationResult,
  TypedAuthResult,
};

export {
  Gun,
  ShogunCore,
  SEA,
  RxJS,
  crypto,
  derive,
  GunErrors,
  DataBase,
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  AutoQuickStart,
  autoQuickStart,
};

// Export seed phrase utilities for WebAuthn multi-device support
export {
  generateSeedPhrase,
  validateSeedPhrase,
  mnemonicToSeed,
  seedToPassword,
  deriveCredentialsFromMnemonic,
  formatSeedPhrase,
  normalizeSeedPhrase,
} from "./utils/seedPhrase";

// Export crypto module
export * from "./crypto";

// Export managers
export { CryptoIdentityManager } from "./managers/CryptoIdentityManager";
