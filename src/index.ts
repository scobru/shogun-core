// Import polyfills FIRST before any other imports
// This ensures Buffer and other Node.js polyfills are available
import "./polyfills";

import { ShogunCore } from "./core";

import {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
} from "./gundb/db";

import { RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";

// Import improved types
import { TypedGunOperationResult, TypedAuthResult } from "./gundb";

// Gun and SEA imports removed - users should import them directly from 'gun' package
// This prevents bundling issues in build systems like Vite

export * from "./utils/errorHandler";

export * from "./plugins";

export * from "./interfaces/shogun";

export * from "./gundb/gun-es";

// export * from "./config/simplified-config"; // Deprecated - removed to avoid Gun.js import issues

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

export { ShogunCore, RxJS, crypto, derive, GunErrors, DataBase };

// Note: Gun and SEA are not exported to avoid bundling issues
// Users should import Gun and SEA directly from the 'gun' package

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
export type {
  CryptoIdentities,
  IdentityGenerationResult,
} from "./managers/CryptoIdentityManager";

// Export storage
export { ShogunStorage } from "./storage/storage";

// Export polyfill utilities
export { setBufferPolyfill } from "./polyfills";
