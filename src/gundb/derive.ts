import { p256 } from "@noble/curves/p256";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { keccak_256 } from "@noble/hashes/sha3";
import { ripemd160 } from "@noble/hashes/ripemd160";

export interface DeriveOptions {
  includeSecp256k1Bitcoin?: boolean; // Bitcoin P2PKH using secp256k1
  includeSecp256k1Ethereum?: boolean; // Ethereum using secp256k1 + Keccak256
  includeP256?: boolean; // Default existing behavior (P-256)
}

export default async function (
  pwd: any,
  extra: any,
  options: DeriveOptions = {},
): Promise<{
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
  secp256k1Bitcoin: { privateKey: string; publicKey: string; address: string };
  secp256k1Ethereum: { privateKey: string; publicKey: string; address: string };
}> {
  const TEXT_ENCODER = new TextEncoder();
  const pwdBytes = pwd
    ? typeof pwd === "string"
      ? TEXT_ENCODER.encode(normalizeString(pwd))
      : pwd
    : crypto.getRandomValues(new Uint8Array(32));

  const extras = extra
    ? (Array.isArray(extra) ? extra : [extra]).map((e) =>
        normalizeString(e.toString()),
      )
    : [];
  const extraBuf = TEXT_ENCODER.encode(extras.join("|"));

  const combinedInput = new Uint8Array(pwdBytes.length + extraBuf.length);
  combinedInput.set(pwdBytes);
  combinedInput.set(extraBuf, pwdBytes.length);

  if (combinedInput.length < 16) {
    throw new Error(`Insufficient input entropy (${combinedInput.length})`);
  }

  const version = "v1";
  const result: any = {};

  // Mantieni comportamento esistente (P-256) come default
  const {
    includeP256 = true,
    includeSecp256k1Bitcoin = false,
    includeSecp256k1Ethereum = false,
  } = options;

  if (includeP256) {
    const salts = [
      { label: "signing", type: "pub/priv" },
      { label: "encryption", type: "epub/epriv" },
    ];

    const [signingKeys, encryptionKeys] = await Promise.all(
      salts.map(async ({ label }) => {
        const salt = TEXT_ENCODER.encode(`${label}-${version}`);
        const privateKey = await stretchKey(combinedInput, salt);

        if (!p256.utils.isValidPrivateKey(privateKey)) {
          throw new Error(`Invalid private key for ${label}`);
        }

        const publicKey = p256.getPublicKey(privateKey, false);
        return {
          pub: keyBufferToJwk(publicKey),
          priv: arrayBufToBase64UrlEncode(privateKey),
        };
      }),
    );

    // Chiavi P-256 esistenti
    result.pub = signingKeys.pub;
    result.priv = signingKeys.priv;
    result.epub = encryptionKeys.pub;
    result.epriv = encryptionKeys.priv;
  }

  // Derivazione Bitcoin P2PKH (secp256k1 + SHA256 + RIPEMD160 + Base58)
  if (includeSecp256k1Bitcoin) {
    const bitcoinSalt = TEXT_ENCODER.encode(`secp256k1-bitcoin-${version}`);
    const bitcoinPrivateKey = await stretchKey(combinedInput, bitcoinSalt);

    if (!secp256k1.utils.isValidPrivateKey(bitcoinPrivateKey)) {
      throw new Error("Invalid secp256k1 private key for Bitcoin");
    }

    const bitcoinPublicKey = secp256k1.getPublicKey(bitcoinPrivateKey, true); // Compressed
    result.secp256k1Bitcoin = {
      privateKey: bytesToHex(bitcoinPrivateKey),
      publicKey: bytesToHex(bitcoinPublicKey),
      address: deriveP2PKHAddress(bitcoinPublicKey),
    };
  }

  // Derivazione Ethereum (secp256k1 + Keccak256)
  if (includeSecp256k1Ethereum) {
    const ethereumSalt = TEXT_ENCODER.encode(`secp256k1-ethereum-${version}`);
    const ethereumPrivateKey = await stretchKey(combinedInput, ethereumSalt);

    if (!secp256k1.utils.isValidPrivateKey(ethereumPrivateKey)) {
      throw new Error("Invalid secp256k1 private key for Ethereum");
    }

    const ethereumPublicKey = secp256k1.getPublicKey(ethereumPrivateKey, false); // Uncompressed
    result.secp256k1Ethereum = {
      privateKey: "0x" + bytesToHex(ethereumPrivateKey),
      publicKey: "0x" + bytesToHex(ethereumPublicKey),
      address: deriveKeccak256Address(ethereumPublicKey),
    };
  }

  return result;
}

function arrayBufToBase64UrlEncode(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf))
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .replace(/\+/g, "-");
}

function keyBufferToJwk(publicKeyBuffer: Uint8Array) {
  if (publicKeyBuffer[0] !== 4)
    throw new Error("Invalid uncompressed public key format");
  return [
    arrayBufToBase64UrlEncode(publicKeyBuffer.slice(1, 33)), // x
    arrayBufToBase64UrlEncode(publicKeyBuffer.slice(33, 65)), // y
  ].join(".");
}

function normalizeString(str: string) {
  return str.normalize("NFC").trim();
}

async function stretchKey(
  input: BufferSource,
  salt: Uint8Array,
  iterations = 300_000,
) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    input,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const keyBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    256,
  );
  return new Uint8Array(keyBits);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Base58 encoding per Bitcoin
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  // Count leading zeros
  let zeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    zeros++;
  }

  // Convert to base58
  const digits = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  // Convert to string
  let result = "";
  for (let i = 0; i < zeros; i++) {
    result += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }

  return result;
}

function deriveP2PKHAddress(publicKey: Uint8Array): string {
  // Bitcoin P2PKH address derivation
  // 1. SHA256 hash del public key
  const sha256Hash = sha256(publicKey);

  // 2. RIPEMD160 hash del risultato
  const ripemd160Hash = ripemd160(sha256Hash);

  // 3. Aggiungi version byte (0x00 per mainnet P2PKH)
  const versionedHash = new Uint8Array(21);
  versionedHash[0] = 0x00; // Mainnet P2PKH version
  versionedHash.set(ripemd160Hash, 1);

  // 4. Double SHA256 per checksum
  const checksum = sha256(sha256(versionedHash));

  // 5. Aggiungi i primi 4 byte del checksum
  const addressBytes = new Uint8Array(25);
  addressBytes.set(versionedHash);
  addressBytes.set(checksum.slice(0, 4), 21);

  // 6. Base58 encode
  return base58Encode(addressBytes);
}

function deriveKeccak256Address(publicKey: Uint8Array): string {
  // Ethereum address derivation usando Keccak256
  // 1. Rimuovi il prefix byte (0x04) dalla chiave pubblica non compressa
  const publicKeyWithoutPrefix = publicKey.slice(1);

  // 2. Calcola Keccak256 hash
  const hash = keccak_256(publicKeyWithoutPrefix);

  // 3. Prendi gli ultimi 20 byte
  const address = hash.slice(-20);

  // 4. Aggiungi '0x' prefix e converti in hex
  return "0x" + bytesToHex(address);
}
