"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
exports.CONFIG = {
    TIMEOUT: {
        AUTH: 60000,
        GUN: 5000,
        WALLET: 30000,
    },
    PATHS: {
        DERIVATION_BASE: "m/44'/60'/0'/0/",
        DEFAULT_INDEX: 0,
    },
    PREFIX: "⚔️ ShogunSDK:",
    PEERS: [],
    MESSAGE_TO_SIGN: "Access With Shogun",
};
exports.default = exports.CONFIG;
