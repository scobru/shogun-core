declare const cryptoUtils: {
    generateRandomBytes: (length: number) => Uint8Array;
    generateUUID: () => string;
    hashData: (data: string | Uint8Array) => Promise<Uint8Array>;
    encryptData: (data: string | Uint8Array, key: Uint8Array) => Promise<Uint8Array>;
    decryptData: (encryptedData: Uint8Array, key: Uint8Array) => Promise<Uint8Array>;
    bytesToBase64: (bytes: Uint8Array) => string;
    base64ToBytes: (base64: string) => Uint8Array;
    bytesToHex: (bytes: Uint8Array) => string;
    hexToBytes: (hex: string) => Uint8Array;
    compareBytes: (a: Uint8Array, b: Uint8Array) => boolean;
    deriveKeyFromPassword: (password: string, salt: Uint8Array) => Promise<Uint8Array>;
};
