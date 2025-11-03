import { JWKKeyPair } from "./types";
export declare const generateKeyPair: () => Promise<JWKKeyPair>;
export declare const deserializePublicKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
export declare const deserializePrivateKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
export declare const encrypt: (message: string, publicKey: CryptoKey) => Promise<string>;
export declare const decrypt: (encryptedMessage: string, privateKey: CryptoKey) => Promise<string>;
