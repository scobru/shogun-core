/**
 * Cryptographic utilities for GunDB integration.
 * Based on GunDB's SEA (Security, Encryption, Authorization) module.
 * @see https://github.com/amark/gun/wiki/Snippets
 */

import { ISEAPair } from "gun";
import { SEA } from "gun";
import { v4 as uuidv4 } from "uuid";

/**
 * Checks if a string is a valid GunDB hash
 * @param str - String to check
 * @returns True if string matches GunDB hash format (44 chars ending with =)
 */
export function isHash(str: string) {
  return typeof str === "string" && str.length === 44 && str.charAt(43) === "=";
}

/**
 * Encrypts data with Gun.SEA
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Promise that resolves with the encrypted data
 */
export async function encrypt(data: any, key: string): Promise<string> {
  if (!SEA || !SEA.encrypt) {
    throw new Error("SEA is not available");
  }
  return SEA.encrypt(data, key);
}

/**
 * Decrypts data with Gun.SEA
 * @param encryptedData Encrypted data
 * @param key Decryption key
 * @returns Promise that resolves with the decrypted data
 */
export async function decrypt(
  encryptedData: string,
  key: string
): Promise<string | any> {
  if (!SEA || !SEA.decrypt) {
    throw new Error("SEA is not available");
  }
  return SEA.decrypt(encryptedData, key);
}

/**
 * Encrypts data from a sender to a receiver using their public keys
 * @param data - Data to encrypt
 * @param sender - Sender's key pair
 * @param receiver - Receiver's public encryption key
 * @returns Promise resolving to encrypted data
 */
export async function encFor(
  data: any,
  sender: ISEAPair,
  receiver: { epub: string }
) {
  const secret = (await SEA.secret(receiver.epub, sender)) as string;
  const encryptedData = await SEA.encrypt(data, secret);
  return encryptedData;
}

/**
 * Decrypts data from a sender using receiver's private key
 * @param data - Data to decrypt
 * @param sender - Sender's public encryption key
 * @param receiver - Receiver's key pair
 * @returns Promise resolving to decrypted data
 */
export async function decFrom(
  data: any,
  sender: { epub: string },
  receiver: ISEAPair
) {
  const secret = (await SEA.secret(sender.epub, receiver)) as string;
  const decryptedData = await SEA.decrypt(data, secret);
  return decryptedData;
}

/**
 * Creates a SHA-256 hash of text
 * @param text - Text to hash
 * @returns Promise resolving to hash string
 */
export async function hashText(text: string) {
  if (!SEA || !SEA.work) {
    throw new Error("SEA is not available");
  }
  let hash = await SEA.work(text, null, null, { name: "SHA-256" });
  return hash;
}

/**
 * Creates a hash of an object by stringifying it first
 * @param obj - Object to hash
 * @returns Promise resolving to hash and original stringified data
 */
export async function hashObj(obj: any) {
  let hashed = typeof obj === "string" ? obj : JSON.stringify(obj);
  let hash = await hashText(hashed);
  return { hash, hashed };
}

/**
 * Generates a shared secret between two parties
 * @param epub - Public encryption key
 * @param pair - Key pair
 * @returns Promise resolving to shared secret
 */
export async function secret(epub: string, pair: ISEAPair) {
  const secret = await SEA.secret(epub, pair);
  return secret;
}

/**
 * Creates a short hash using PBKDF2
 * @param text - Text to hash
 * @param salt - Salt for hashing
 * @returns Promise resolving to hex-encoded hash
 */
export async function getShortHash(text: string, salt: string) {
  return await SEA.work(text, null, null, {
    name: "PBKDF2",
    encode: "hex",
    salt,
  });
}

/**
 * Converts unsafe characters in hash to URL-safe versions
 * @param unsafe - String containing unsafe characters
 * @returns URL-safe string with encoded characters
 */
export function safeHash(unsafe: {
  replace: (arg0: RegExp, arg1: (c: any) => "-" | "." | "_" | undefined) => any;
}) {
  if (!unsafe) return;
  const encode_regex = /[+=/]/g;
  return unsafe.replace(encode_regex, encodeChar);
}

/**
 * Helper function to encode individual characters
 * @param c - Character to encode
 * @returns Encoded character
 */
//@ts-ignore
function encodeChar(c: any) {
  switch (c) {
    case "+":
      return "-";
    case "=":
      return ".";
    case "/":
      return "_";
  }
}

/**
 * Converts URL-safe characters back to original hash characters
 * @param safe - URL-safe string
 * @returns Original string with decoded characters
 */
export function unsafeHash(safe: {
  replace: (arg0: RegExp, arg1: (c: any) => "=" | "+" | "/" | undefined) => any;
}) {
  if (!safe) return;
  const decode_regex = /[._-]/g;
  return safe.replace(decode_regex, decodeChar);
}

/**
 * Helper function to decode individual characters
 * @param c - Character to decode
 * @returns Decoded character
 */
//@ts-ignore
function decodeChar(c: any) {
  switch (c) {
    case "-":
      return "+";
    case ".":
      return "=";
    case "_":
      return "/";
  }
}

/**
 * Safely parses JSON with fallback to default value
 * @param input - String to parse as JSON
 * @param def - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJSONParse(input: string, def = {}) {
  if (!input) {
    return def;
  } else if (typeof input === "object") {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch (e) {
    return def;
  }
}

export function randomUUID() {
  const c = (globalThis as any)?.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  try {
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      const b = Array.from(bytes).map(toHex).join("");
      return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}`;
    }
  } catch {}
  return uuidv4();
}
