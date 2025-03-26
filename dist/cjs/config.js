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
    STORAGE_KEYS: {
        ENTROPY: "hedgehog-entropy-key",
        GUN_PAIR: "gun-current-pair",
        WALLET_PATHS: "walletPaths_",
        SESSION: "gun-current-session",
    },
    GUN_TABLES: {
        USERS: "users",
        WALLET_PATHS: "walletPathsV2",
        AUTHENTICATIONS: "authenticationsV2",
        WEBAUTHN: "webauthn",
        STEALTH: "stealth",
    },
    AUTH: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_USERNAME_LENGTH: 64,
        MIN_USERNAME_LENGTH: 3,
    },
    PREFIX: "⚔️ ShogunSDK:",
    PEERS: ["https://gun-relay.scobrudot.dev/gun"],
    MESSAGE_TO_SIGN: "Access With Shogun",
};
exports.default = exports.CONFIG;
