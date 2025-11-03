import { SignalUser, SignalPublicKeyBundle, X3DHExchangeResult } from "./types";
export declare const generateSignalKeyPair: () => Promise<CryptoKeyPair>;
export declare const generateSignalSigningKeyPair: () => Promise<CryptoKeyPair>;
export declare const exportSignalPublicKey: (publicKey: CryptoKey) => Promise<ArrayBuffer>;
export declare const importSignalPublicKey: (keyBytes: ArrayBuffer) => Promise<CryptoKey>;
export declare const exportSignalPrivateKey: (privateKey: CryptoKey) => Promise<ArrayBuffer>;
export declare const importSignalPrivateKey: (keyBytes: ArrayBuffer) => Promise<CryptoKey>;
export declare const importSignalSigningPublicKey: (keyBytes: ArrayBuffer) => Promise<CryptoKey>;
export declare const performSignalDH: (privateKey: CryptoKey, publicKey: CryptoKey) => Promise<ArrayBuffer>;
export declare const signSignalData: (privateKey: CryptoKey, data: ArrayBuffer) => Promise<ArrayBuffer>;
export declare const verifySignalSignature: (publicKey: CryptoKey, signature: ArrayBuffer, data: ArrayBuffer) => Promise<boolean>;
export declare const deriveSignalKey: (inputKeyMaterial: ArrayBuffer, salt: ArrayBuffer, info: ArrayBuffer, length?: number) => Promise<CryptoKey>;
export declare const concatSignalArrayBuffers: (...buffers: ArrayBuffer[]) => ArrayBuffer;
export declare const bufferToSignalHex: (buffer: ArrayBuffer) => string;
export declare const initializeSignalUser: (name: string) => Promise<SignalUser>;
export declare const getSignalPublicKeyBundle: (user: SignalUser) => Promise<SignalPublicKeyBundle>;
export declare const consumeSignalOneTimePrekey: (user: SignalUser) => CryptoKeyPair | undefined;
export declare const performSignalX3DHKeyExchange: (alice: SignalUser, bobBundle: SignalPublicKeyBundle) => Promise<X3DHExchangeResult>;
export declare const deriveSignalSharedSecret: (bob: SignalUser, aliceEphemeralPublic: ArrayBuffer, aliceIdentityPublic: ArrayBuffer, usedOneTimePrekey: boolean, oneTimePrekeyBytes?: ArrayBuffer | null) => Promise<ArrayBuffer>;
export declare const demonstrateSignalProtocol: () => Promise<{
    success: boolean;
    aliceSecret: string;
    bobSecret: string;
    usedOneTimePrekey: boolean;
    alice: SignalUser;
    bob: SignalUser;
    exchangeResult: X3DHExchangeResult;
}>;
/**
 * Generate a key pair in legacy ArrayBuffer format for compatibility with Signal implementations
 * Uses @noble/curves if available, otherwise generates and exports CryptoKeyPair
 */
export declare const generateSignalKeyPairLegacy: (privKey?: ArrayBuffer) => Promise<{
    pubKey: ArrayBuffer;
    privKey: ArrayBuffer;
}>;
/**
 * Perform ECDH in legacy ArrayBuffer format for compatibility with Signal implementations
 * Uses @noble/curves if available, otherwise uses Web Crypto API
 */
export declare const performSignalDHLegacy: (pubKey: ArrayBuffer, privKey: ArrayBuffer) => Promise<ArrayBuffer>;
/**
 * Sign data with Ed25519 in legacy ArrayBuffer format for compatibility with Signal implementations
 * Uses @noble/curves if available, otherwise uses Web Crypto API
 */
export declare const signSignalDataLegacy: (privKey: ArrayBuffer, message: ArrayBuffer) => Promise<ArrayBuffer>;
/**
 * Verify Ed25519 signature in legacy ArrayBuffer format for compatibility with Signal implementations
 * Uses @noble/curves if available, otherwise uses Web Crypto API
 */
export declare const verifySignalSignatureLegacy: (pubKey: ArrayBuffer, msg: ArrayBuffer, sig: ArrayBuffer) => Promise<boolean>;
