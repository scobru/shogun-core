export declare const CONFIG: {
    TIMEOUT: {
        AUTH: number;
        GUN: number;
        WALLET: number;
    };
    PATHS: {
        DERIVATION_BASE: string;
        DEFAULT_INDEX: number;
    };
    STORAGE_KEYS: {
        ENTROPY: string;
        GUN_PAIR: string;
        WALLET_PATHS: string;
        SESSION: string;
    };
    GUN_TABLES: {
        USERS: string;
        WALLET_PATHS: string;
        AUTHENTICATIONS: string;
        WEBAUTHN: string;
        STEALTH: string;
    };
    AUTH: {
        MIN_PASSWORD_LENGTH: number;
        MAX_USERNAME_LENGTH: number;
        MIN_USERNAME_LENGTH: number;
    };
    PREFIX: string;
    PEERS: never[];
    MESSAGE_TO_SIGN: string;
};
export default CONFIG;
