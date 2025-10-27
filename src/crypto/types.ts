// Types for crypto module
export interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface JWKKeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export interface SymmetricKey {
  key: CryptoKey;
  jwk: JsonWebKey;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
}

export interface EncryptedFilePackage {
  encryptedData: string;
  iv: string;
  salt: string;
  fileName: string;
  timestamp: string;
  originalSize: number;
  mimeType?: string;
  fileSize?: number;
}

export interface DecryptedFileResult {
  data: ArrayBuffer;
  fileName: string;
  originalSize: number;
  decryptedSize: number;
  blob?: Blob;
  mimeType?: string;
  textContent?: string;
  isTextFile?: boolean;
  metadata?: any;
}

export interface SignalUser {
  name: string;
  identityKeyPair: CryptoKeyPair;
  identitySigningKeyPair: CryptoKeyPair;
  signedPrekeyPair: CryptoKeyPair;
  signedPrekeySignature: ArrayBuffer;
  oneTimePrekeyPairs: CryptoKeyPair[];
}

export interface SignalPublicKeyBundle {
  identityKey: ArrayBuffer;
  identitySigningKey: ArrayBuffer;
  signedPrekey: ArrayBuffer;
  signedPrekeySignature: ArrayBuffer;
  oneTimePrekey: ArrayBuffer | null;
}

export interface X3DHExchangeResult {
  masterSecret: ArrayBuffer;
  aliceEphemeralPublic: ArrayBuffer;
  usedOneTimePrekey: boolean;
}

export interface DoubleRatchetState {
  rootKey: ArrayBuffer;
  sendingChainKey: ArrayBuffer | null;
  receivingChainKey: ArrayBuffer | null;
  sendingDHKeyPair: CryptoKeyPair | null;
  receivingDHPublicKey: CryptoKey | null;
  sendingMessageNumber: number;
  receivingMessageNumber: number;
  previousChainLength: number;
  skippedMessageKeys: Map<string, Uint8Array>;
  isInitiator: boolean;
  initialized: number;
}

export interface MessageEnvelope {
  dhPublicKey: Uint8Array;
  messageNumber: number;
  previousChainLength: number;
  ciphertext: Uint8Array;
  iv: Uint8Array;
  timestamp: number;
}

export interface CryptoConfig {
  enabled: boolean;
  algorithms: string[];
  keySize?: number;
  iterations?: number;
}

export interface CryptoMethods {
  // Random generation
  randomString: (additionalSalt?: string) => string;

  // Hashing
  sha256Hash: (input: any) => Promise<string>;
  sha512Hash: (input: any) => Promise<string>;
  sha3_512Hash: (input: any) => Promise<string>;

  // Asymmetric encryption (RSA)
  generateKeyPair: () => Promise<JWKKeyPair>;
  deserializePublicKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
  deserializePrivateKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
  encrypt: (message: string, publicKey: CryptoKey) => Promise<string>;
  decrypt: (encryptedMessage: string, privateKey: CryptoKey) => Promise<string>;

  // Symmetric encryption (AES)
  generateSymmetricKey: () => Promise<JsonWebKey>;
  deserializeSymmetricKey: (key: JsonWebKey | string) => Promise<CryptoKey>;
  encryptWithSymmetricKey: (
    message: string,
    key: CryptoKey,
  ) => Promise<EncryptedData>;
  decryptWithSymmetricKey: (
    encryptedData: EncryptedData,
    key: CryptoKey,
  ) => Promise<string>;

  // File encryption
  deriveKeyFromPassword: (
    password: string,
    salt?: ArrayBuffer,
  ) => Promise<{ key: CryptoKey; salt: ArrayBuffer }>;
  encryptFile: (
    fileContent: string | ArrayBuffer | File,
    password: string,
    fileName?: string,
  ) => Promise<EncryptedFilePackage>;
  decryptFile: (
    encryptedPackage: EncryptedFilePackage,
    password: string,
  ) => Promise<DecryptedFileResult>;
  encryptTextFile: (
    textContent: string,
    password: string,
    fileName?: string,
  ) => Promise<EncryptedFilePackage>;
  decryptTextFile: (
    encryptedPackage: EncryptedFilePackage,
    password: string,
  ) => Promise<DecryptedFileResult & { textContent: string }>;
  encryptBinaryFile: (
    file: File,
    password: string,
  ) => Promise<EncryptedFilePackage>;
  decryptBinaryFile: (
    encryptedPackage: EncryptedFilePackage,
    password: string,
  ) => Promise<DecryptedFileResult & { blob: Blob }>;
  createSecureFileDownload: (
    data: ArrayBuffer | string | Blob,
    fileName: string,
    mimeType?: string,
  ) => void;
  parseEncryptedFilePackage: (file: File) => Promise<{
    isValid: boolean;
    package?: EncryptedFilePackage;
    metadata?: any;
    error?: string;
  }>;
  decryptUploadedFile: (
    encryptedFilePackage: File,
    password: string,
  ) => Promise<DecryptedFileResult>;

  // Signal Protocol
  generateSignalKeyPair: () => Promise<CryptoKeyPair>;
  generateSignalSigningKeyPair: () => Promise<CryptoKeyPair>;
  exportSignalPublicKey: (publicKey: CryptoKey) => Promise<ArrayBuffer>;
  importSignalPublicKey: (keyBytes: ArrayBuffer) => Promise<CryptoKey>;
  importSignalSigningPublicKey: (keyBytes: ArrayBuffer) => Promise<CryptoKey>;
  performSignalDH: (
    privateKey: CryptoKey,
    publicKey: CryptoKey,
  ) => Promise<ArrayBuffer>;
  signSignalData: (
    privateKey: CryptoKey,
    data: ArrayBuffer,
  ) => Promise<ArrayBuffer>;
  verifySignalSignature: (
    publicKey: CryptoKey,
    signature: ArrayBuffer,
    data: ArrayBuffer,
  ) => Promise<boolean>;
  deriveSignalKey: (
    inputKeyMaterial: ArrayBuffer,
    salt: ArrayBuffer,
    info: ArrayBuffer,
    length?: number,
  ) => Promise<CryptoKey>;
  concatSignalArrayBuffers: (...buffers: ArrayBuffer[]) => ArrayBuffer;
  bufferToSignalHex: (buffer: ArrayBuffer) => string;
  initializeSignalUser: (name: string) => Promise<SignalUser>;
  getSignalPublicKeyBundle: (
    user: SignalUser,
  ) => Promise<SignalPublicKeyBundle>;
  consumeSignalOneTimePrekey: (user: SignalUser) => CryptoKeyPair | undefined;
  performSignalX3DHKeyExchange: (
    alice: SignalUser,
    bobBundle: SignalPublicKeyBundle,
  ) => Promise<X3DHExchangeResult>;
  deriveSignalSharedSecret: (
    bob: SignalUser,
    aliceEphemeralPublic: ArrayBuffer,
    aliceIdentityPublic: ArrayBuffer,
    usedOneTimePrekey: boolean,
    oneTimePrekeyBytes?: ArrayBuffer | null,
  ) => Promise<ArrayBuffer>;
  demonstrateSignalProtocol: () => Promise<any>;

  // Double Ratchet Protocol
  initializeDoubleRatchet: (
    sharedSecret: ArrayBuffer,
    isInitiator: boolean,
    remotePublicKey?: CryptoKey | null,
  ) => Promise<DoubleRatchetState>;
  doubleRatchetEncrypt: (
    state: DoubleRatchetState,
    plaintext: string,
  ) => Promise<MessageEnvelope>;
  doubleRatchetDecrypt: (
    state: DoubleRatchetState,
    messageEnvelope: MessageEnvelope,
  ) => Promise<string>;
  serializeDoubleRatchetState: (state: DoubleRatchetState) => Promise<string>;
  demonstrateDoubleRatchet: () => Promise<any>;
  cleanupSkippedMessageKeys: (
    state: DoubleRatchetState,
    maxAge?: number,
  ) => void;
}
