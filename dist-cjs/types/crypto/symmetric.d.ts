import { EncryptedData } from "./types";
export declare const generateSymmetricKey: () => Promise<JsonWebKey>;
export declare const deserializeSymmetricKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
export declare const encryptWithSymmetricKey: (message: string, key: CryptoKey) => Promise<EncryptedData>;
export declare const decryptWithSymmetricKey: (encryptedData: EncryptedData, key: CryptoKey) => Promise<string>;
export declare const deriveKeyFromPassword: (password: string, salt?: ArrayBuffer) => Promise<{
    key: CryptoKey;
    salt: ArrayBuffer;
}>;
