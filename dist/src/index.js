// Import polyfills FIRST before any other imports
// This ensures Buffer and other Node.js polyfills are available
import './polyfills.js';
// Gun and SEA imports removed - users should import them directly from 'gun' package
// This prevents bundling issues in build systems like Vite
export * from './utils/errorHandler.js';
export * from './plugins/index.js';
export * from './interfaces/shogun.js';
export * from './gundb/gun-es.js';
export { generatePairFromMnemonic } from './gundb/crypto.js';
export { deriveChildKey, deriveChildPublicKey, deriveKeyHierarchy, } from './gundb/hd-keys.js';
export { ShogunCore } from './core.js';
export { crypto, derive, GunErrors, DataBase } from './gundb/db.js';
// Note: Gun and SEA are not exported to avoid bundling issues
// Users should import Gun and SEA directly from the 'gun' package
// Export seed phrase utilities for WebAuthn multi-device support
export { generateSeedPhrase, validateSeedPhrase, mnemonicToSeed, mnemonicToSeedAsync, seedToPassword, deriveCredentialsFromMnemonic, formatSeedPhrase, normalizeSeedPhrase, seedToKeyPair, } from './utils/seedPhrase.js';
// Export storage
export { ShogunStorage } from './storage/storage.js';
// Export polyfill utilities
export { setBufferPolyfill } from './polyfills.js';
