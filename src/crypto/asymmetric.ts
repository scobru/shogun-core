import { JWKKeyPair } from "./types";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./hashing";

// RSA Key Generation and Encryption/Decryption Methods
export const generateKeyPair = async (): Promise<JWKKeyPair> => {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096, // Can be 1024, 2048, or 4096
        publicExponent: new Uint8Array([1, 0, 1]), // 65537 in bytes
        hash: "SHA-256", // Can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
      },
      true, // Whether the key is extractable
      ["encrypt", "decrypt"], // Key usages
    );

    // Export keys to JWK format for storage/transmission
    const publicKeyJWK = await crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    );
    const privateKeyJWK = await crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );

    return {
      publicKey: publicKeyJWK,
      privateKey: privateKeyJWK,
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
};

export const deserializePublicKey = async (
  key: JsonWebKey | string,
): Promise<CryptoKey> => {
  try {
    // If key is already a JWK object, use it directly
    // If it's a string, parse it first
    const jwkKey = typeof key === "string" ? JSON.parse(key) : key;

    // Validate that required JWK properties exist
    if (!jwkKey.kty) {
      throw new Error('Invalid JWK: missing "kty" property');
    }

    const publicKey = await crypto.subtle.importKey(
      "jwk", // Import format
      jwkKey, // The key in JWK format
      {
        name: "RSA-OAEP", // Algorithm name
        hash: "SHA-256", // Hash algorithm
      },
      true, // Extractable flag
      ["encrypt"], // Key usages
    );

    return publicKey;
  } catch (error) {
    console.error("Error deserializing public key:", error);
    throw error;
  }
};

export const deserializePrivateKey = async (
  key: JsonWebKey | string,
): Promise<CryptoKey> => {
  try {
    // If key is already a JWK object, use it directly
    // If it's a string, parse it first
    const jwkKey = typeof key === "string" ? JSON.parse(key) : key;

    // Validate that required JWK properties exist
    if (!jwkKey.kty) {
      throw new Error('Invalid JWK: missing "kty" property');
    }

    const privateKey = await crypto.subtle.importKey(
      "jwk", // Import format
      jwkKey, // The key in JWK format
      {
        name: "RSA-OAEP", // Algorithm name
        hash: "SHA-256", // Hash algorithm
      },
      true, // Extractable flag
      ["decrypt"], // Key usages
    );

    return privateKey;
  } catch (error) {
    console.error("Error deserializing private key:", error);
    throw error;
  }
};

export const encrypt = async (
  message: string,
  publicKey: CryptoKey,
): Promise<string> => {
  const encodedMessage = new TextEncoder().encode(message);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedMessage,
  );

  return arrayBufferToBase64(encrypted);
};

export const decrypt = async (
  encryptedMessage: string,
  privateKey: CryptoKey,
): Promise<string> => {
  const buffer = base64ToArrayBuffer(encryptedMessage);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      buffer,
    );
    const message = new TextDecoder().decode(decrypted);
    return message;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Unable to decrypt message. Incorrect private key.");
  }
};
