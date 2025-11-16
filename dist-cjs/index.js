"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBufferPolyfill = exports.ShogunStorage = exports.normalizeSeedPhrase = exports.formatSeedPhrase = exports.deriveCredentialsFromMnemonic = exports.seedToPassword = exports.mnemonicToSeed = exports.validateSeedPhrase = exports.generateSeedPhrase = exports.RxJSHolster = exports.DataBaseHolster = exports.DataBase = exports.GunErrors = exports.derive = exports.crypto = exports.RxJS = exports.ShogunCore = void 0;
// Import polyfills FIRST before any other imports
// This ensures Buffer and other Node.js polyfills are available
require("./polyfills");
const core_1 = require("./core");
Object.defineProperty(exports, "ShogunCore", { enumerable: true, get: function () { return core_1.ShogunCore; } });
const db_1 = require("./gundb/db");
Object.defineProperty(exports, "RxJS", { enumerable: true, get: function () { return db_1.RxJS; } });
Object.defineProperty(exports, "crypto", { enumerable: true, get: function () { return db_1.crypto; } });
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return db_1.derive; } });
Object.defineProperty(exports, "GunErrors", { enumerable: true, get: function () { return db_1.GunErrors; } });
Object.defineProperty(exports, "DataBase", { enumerable: true, get: function () { return db_1.DataBase; } });
const db_holster_1 = require("./gundb/db-holster");
Object.defineProperty(exports, "DataBaseHolster", { enumerable: true, get: function () { return db_holster_1.DataBaseHolster; } });
const rxjs_holster_1 = require("./gundb/rxjs-holster");
Object.defineProperty(exports, "RxJSHolster", { enumerable: true, get: function () { return rxjs_holster_1.RxJSHolster; } });
// Gun and SEA imports removed - users should import them directly from 'gun' package
// This prevents bundling issues in build systems like Vite
__exportStar(require("./utils/errorHandler"), exports);
__exportStar(require("./plugins"), exports);
__exportStar(require("./interfaces/shogun"), exports);
__exportStar(require("./gundb/gun-es"), exports);
// Note: Gun and SEA are not exported to avoid bundling issues
// Users should import Gun and SEA directly from the 'gun' package
// Export seed phrase utilities for WebAuthn multi-device support
var seedPhrase_1 = require("./utils/seedPhrase");
Object.defineProperty(exports, "generateSeedPhrase", { enumerable: true, get: function () { return seedPhrase_1.generateSeedPhrase; } });
Object.defineProperty(exports, "validateSeedPhrase", { enumerable: true, get: function () { return seedPhrase_1.validateSeedPhrase; } });
Object.defineProperty(exports, "mnemonicToSeed", { enumerable: true, get: function () { return seedPhrase_1.mnemonicToSeed; } });
Object.defineProperty(exports, "seedToPassword", { enumerable: true, get: function () { return seedPhrase_1.seedToPassword; } });
Object.defineProperty(exports, "deriveCredentialsFromMnemonic", { enumerable: true, get: function () { return seedPhrase_1.deriveCredentialsFromMnemonic; } });
Object.defineProperty(exports, "formatSeedPhrase", { enumerable: true, get: function () { return seedPhrase_1.formatSeedPhrase; } });
Object.defineProperty(exports, "normalizeSeedPhrase", { enumerable: true, get: function () { return seedPhrase_1.normalizeSeedPhrase; } });
// Export storage
var storage_1 = require("./storage/storage");
Object.defineProperty(exports, "ShogunStorage", { enumerable: true, get: function () { return storage_1.ShogunStorage; } });
// Export polyfill utilities
var polyfills_1 = require("./polyfills");
Object.defineProperty(exports, "setBufferPolyfill", { enumerable: true, get: function () { return polyfills_1.setBufferPolyfill; } });
