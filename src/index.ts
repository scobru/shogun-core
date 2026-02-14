// Import polyfills FIRST before any other imports
// This ensures Buffer and other Node.js polyfills are available
import './polyfills';

// Gun and SEA imports removed - users should import them directly from 'gun' package
// This prevents bundling issues in build systems like Vite

export * from './utils/errorHandler';

export * from './plugins';

export * from './interfaces/shogun';

export * from './gundb/gun-es';

export type * from './interfaces/plugin';
export type { IAuthPlugin } from './interfaces/auth';

// Type alias for backward compatibility
export type { ShogunCoreConfig as ShogunSDKConfig } from './interfaces/shogun';

export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
  TypedGunOperationResult,
  TypedAuthResult,
} from './gundb';

export { generatePairFromMnemonic } from './gundb/crypto';

export {
  deriveChildKey,
  deriveChildPublicKey,
  deriveKeyHierarchy,
} from './gundb/hd-keys';

export { ShogunCore } from './core';

export { RxJS, crypto, derive, GunErrors, DataBase } from './gundb/db';

export { DataBaseHolster } from './gundb/db-holster';
export { RxJSHolster } from './gundb/rxjs-holster';

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
  seedToKeyPair,
} from './utils/seedPhrase';

// Export storage
export { ShogunStorage } from './storage/storage';

// Export polyfill utilities
export { setBufferPolyfill } from './polyfills';
