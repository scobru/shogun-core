import {
  SignalUser,
  SignalPublicKeyBundle,
  X3DHExchangeResult,
  DoubleRatchetState,
  MessageEnvelope,
} from "./types";
import {
  bufferToHex,
  concatArrayBuffers,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "./hashing";

// Signal Protocol X3DH Key Exchange Implementation
// Using X25519 for key agreement (matches actual Signal Protocol)
const signalKeyParams = {
  name: "X25519",
};

const signalHkdfParams = {
  name: "HKDF",
  hash: "SHA-256",
};

export const generateSignalKeyPair = async (): Promise<CryptoKeyPair> => {
  try {
    const keyPair = await crypto.subtle.generateKey(signalKeyParams, true, [
      "deriveBits",
    ]);
    return keyPair as CryptoKeyPair;
  } catch (error) {
    // Fallback for testing when crypto API is mocked
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn("generateSignalKeyPair failed, using fallback:", errorMessage);
    return {
      publicKey: {
        algorithm: { name: "X25519" },
        type: "public",
        usages: [],
        extractable: true,
      } as unknown as CryptoKey,
      privateKey: {
        algorithm: { name: "X25519" },
        type: "private",
        usages: ["deriveBits"],
        extractable: true,
      } as unknown as CryptoKey,
    };
  }
};

export const generateSignalSigningKeyPair =
  async (): Promise<CryptoKeyPair> => {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "Ed25519", // Using Ed25519 for signatures (matches actual Signal Protocol)
        },
        true,
        ["sign", "verify"],
      );
      return keyPair as CryptoKeyPair;
    } catch (error) {
      // Fallback for testing when crypto API is mocked
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(
        "generateSignalSigningKeyPair failed, using fallback:",
        errorMessage,
      );
      return {
        publicKey: {
          algorithm: { name: "Ed25519" },
          type: "public",
          usages: ["verify"],
          extractable: true,
        } as unknown as CryptoKey,
        privateKey: {
          algorithm: { name: "Ed25519" },
          type: "private",
          usages: ["sign"],
          extractable: true,
        } as unknown as CryptoKey,
      };
    }
  };

export const exportSignalPublicKey = async (
  publicKey: CryptoKey,
): Promise<ArrayBuffer> => {
  try {
    // Check key properties
    const algorithmName = publicKey?.algorithm?.name;
    const isExtractable = publicKey?.extractable;

    if (!isExtractable) {
      throw new Error(
        `Cannot export non-extractable key. Algorithm: ${algorithmName}, Type: ${publicKey?.type}`,
      );
    }

    // For Ed25519 keys, try raw format first, fallback to spki if needed
    let exported: ArrayBuffer;
    if (algorithmName === "Ed25519") {
      try {
        exported = await crypto.subtle.exportKey("raw", publicKey);
        // Validate that we got actual data (not all zeros)
        const bytes = new Uint8Array(exported);
        const isAllZeros = bytes.every((byte) => byte === 0);
        if (isAllZeros) {
          throw new Error("Export returned all zeros");
        }
      } catch (rawError) {
        // Try SPKI format as fallback for Ed25519
        try {
          const spki = await crypto.subtle.exportKey("spki", publicKey);
          // Extract the raw 32-byte key from SPKI format (Ed25519 public key is last 32 bytes)
          // SPKI structure: [header bytes...][32-byte public key]
          const spkiBytes = new Uint8Array(spki);
          if (spkiBytes.length < 32) {
            throw new Error(`SPKI format too short: ${spkiBytes.length} bytes`);
          }
          // Extract last 32 bytes (Ed25519 public key)
          exported = spkiBytes.slice(-32).buffer;
        } catch (spkiError) {
          throw new Error(
            `Failed to export Ed25519 key in both raw and spki formats. Raw error: ${rawError instanceof Error ? rawError.message : rawError}, SPKI error: ${spkiError instanceof Error ? spkiError.message : spkiError}`,
          );
        }
      }
    } else {
      // For X25519 and other keys, use raw format
      exported = await crypto.subtle.exportKey("raw", publicKey);
    }

    // Final validation
    const finalBytes = new Uint8Array(exported);
    const isAllZeros = finalBytes.every((byte) => byte === 0);
    if (isAllZeros) {
      throw new Error(
        `Exported key is all zeros. Algorithm: ${algorithmName}, Size: ${exported.byteLength} bytes`,
      );
    }

    return exported;
  } catch (error) {
    // If export fails, it might be a fallback/mock key
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const algorithmName = publicKey?.algorithm?.name;

    console.error("exportSignalPublicKey failed:", errorMessage, {
      algorithm: algorithmName,
      type: publicKey?.type,
      extractable: publicKey?.extractable,
    });

    // Check if this is a fallback key object (doesn't have standard CryptoKey properties)
    // Fallback keys are just plain objects, not real CryptoKey instances
    if (
      publicKey &&
      typeof publicKey === "object" &&
      publicKey.algorithm &&
      (!publicKey.extractable || !(publicKey instanceof CryptoKey))
    ) {
      // This is a fallback key object - we can't export it, so we need to generate a proper key
      // This should not happen in production - it means Ed25519 is not supported
      throw new Error(
        `Cannot export fallback ${algorithmName} key. ${algorithmName} is not supported in this environment. Error: ${errorMessage}`,
      );
    }

    // Re-throw if it's not a fallback key issue
    throw error;
  }
};

export const importSignalPublicKey = async (
  keyBytes: ArrayBuffer,
): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    signalKeyParams,
    true, // Make public keys extractable for Double Ratchet key comparisons
    [],
  );
};

export const importSignalSigningPublicKey = async (
  keyBytes: ArrayBuffer,
): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "Ed25519",
    },
    true, // Make public keys extractable for re-export in bundles
    ["verify"],
  );
};

export const performSignalDH = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<ArrayBuffer> => {
  console.log("🔄 Performing X25519 key agreement...");

  try {
    const result = await crypto.subtle.deriveBits(
      {
        name: "X25519",
        public: publicKey,
      },
      privateKey,
      256, // X25519 always produces 256 bits (32 bytes)
    );
    console.log(
      "✓ X25519 key agreement successful, output length:",
      result.byteLength,
    );
    return result;
  } catch (error) {
    console.error("❌ X25519 key agreement failed:", error);
    throw error;
  }
};

export const signSignalData = async (
  privateKey: CryptoKey,
  data: ArrayBuffer,
): Promise<ArrayBuffer> => {
  return await crypto.subtle.sign(
    {
      name: "Ed25519",
    },
    privateKey,
    data,
  );
};

export const verifySignalSignature = async (
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer,
): Promise<boolean> => {
  console.log("🔍 Verifying Ed25519 signature...");

  try {
    const result = await crypto.subtle.verify(
      {
        name: "Ed25519",
      },
      publicKey,
      signature,
      data,
    );
    console.log("✓ Signature verification result:", result);
    return result;
  } catch (error) {
    console.error("❌ Signature verification failed:", error);
    throw error;
  }
};

export const deriveSignalKey = async (
  inputKeyMaterial: ArrayBuffer,
  salt: ArrayBuffer,
  info: ArrayBuffer,
  length = 256,
): Promise<CryptoKey> => {
  const prk = await crypto.subtle.importKey(
    "raw",
    inputKeyMaterial,
    signalHkdfParams.name,
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: signalHkdfParams.name,
      hash: signalHkdfParams.hash,
      salt: salt,
      info: info,
    },
    prk,
    {
      name: "AES-GCM",
      length: length,
    },
    true,
    ["encrypt", "decrypt"],
  );
};

export const concatSignalArrayBuffers = (
  ...buffers: ArrayBuffer[]
): ArrayBuffer => {
  return concatArrayBuffers(...buffers);
};

export const bufferToSignalHex = (buffer: ArrayBuffer): string => {
  return bufferToHex(buffer);
};

export const initializeSignalUser = async (
  name: string,
): Promise<SignalUser> => {
  console.log(`🔐 [${name}] Starting user initialization...`);

  try {
    // Generate identity key pairs (separate for X25519 and Ed25519)
    console.log(
      `🔑 [${name}] Generating identity signing key pair (Ed25519)...`,
    );
    const identitySigningKeyPair = await generateSignalSigningKeyPair();

    console.log(`🔑 [${name}] Generating identity X25519 key pair...`);
    const identityKeyPair = await generateSignalKeyPair();

    // Generate signed prekey pair
    console.log(`🔑 [${name}] Generating signed prekey pair...`);
    const signedPrekeyPair = await generateSignalKeyPair();

    // Sign the prekey with identity signing key
    console.log(`📝 [${name}] Exporting signed prekey for signing...`);
    const prekeyBytes = await exportSignalPublicKey(signedPrekeyPair.publicKey);

    console.log(`✍️ [${name}] Signing prekey with identity signing key...`);
    const signedPrekeySignature = await signSignalData(
      identitySigningKeyPair.privateKey,
      prekeyBytes,
    );
    console.log(
      `✓ [${name}] Prekey signature generated, length:`,
      signedPrekeySignature.byteLength,
    );

    // Generate one-time prekeys
    console.log(`🔑 [${name}] Generating one-time prekeys...`);
    const oneTimePrekeyPairs: CryptoKeyPair[] = [];
    for (let i = 0; i < 3; i++) {
      const oneTimeKey = await generateSignalKeyPair();
      oneTimePrekeyPairs.push(oneTimeKey);
      console.log(`✓ [${name}] One-time prekey ${i + 1}/3 generated`);
    }

    console.log(`✅ [${name}] User initialization completed successfully`);
    return {
      name,
      identityKeyPair, // X25519 key pair
      identitySigningKeyPair, // Ed25519 key pair
      signedPrekeyPair,
      signedPrekeySignature,
      oneTimePrekeyPairs,
    };
  } catch (error) {
    console.error(`❌ [${name}] User initialization failed:`, error);
    throw error;
  }
};

export const getSignalPublicKeyBundle = async (
  user: SignalUser,
): Promise<SignalPublicKeyBundle> => {
  console.log(`📦 Creating public key bundle for ${user.name}...`);

  try {
    console.log("Exporting identity X25519 key...");
    const identityKey = await exportSignalPublicKey(
      user.identityKeyPair.publicKey,
    );
    console.log(
      `✓ Identity X25519 key exported: ${identityKey.byteLength} bytes`,
    );

    console.log("Exporting identity signing key...");
    const identitySigningKeyBefore = user.identitySigningKeyPair.publicKey;
    console.log("Identity signing key properties:", {
      algorithm: identitySigningKeyBefore?.algorithm?.name,
      type: identitySigningKeyBefore?.type,
      extractable: identitySigningKeyBefore?.extractable,
    });

    const identitySigningKey = await exportSignalPublicKey(
      user.identitySigningKeyPair.publicKey,
    );
    const signingKeyBytes = new Uint8Array(identitySigningKey);
    console.log(
      `✓ Identity signing key exported: ${identitySigningKey.byteLength} bytes, first 8 bytes:`,
      Array.from(signingKeyBytes.slice(0, 8)),
    );

    const isAllZeros = signingKeyBytes.every((byte) => byte === 0);
    if (isAllZeros) {
      throw new Error(
        "Identity signing key export returned all zeros - this should have been caught by exportSignalPublicKey",
      );
    }

    console.log("Exporting signed prekey...");
    const signedPrekey = await exportSignalPublicKey(
      user.signedPrekeyPair.publicKey,
    );
    console.log(`✓ Signed prekey exported: ${signedPrekey.byteLength} bytes`);

    const oneTimePrekey =
      user.oneTimePrekeyPairs.length > 0
        ? await exportSignalPublicKey(user.oneTimePrekeyPairs[0].publicKey)
        : null;
    if (oneTimePrekey) {
      console.log(
        `✓ One-time prekey exported: ${oneTimePrekey.byteLength} bytes`,
      );
    }

    const bundle = {
      identityKey, // X25519 key
      identitySigningKey, // Ed25519 key
      signedPrekey,
      signedPrekeySignature: user.signedPrekeySignature,
      oneTimePrekey,
    };

    console.log(`✅ Public key bundle created for ${user.name}`);
    return bundle;
  } catch (error) {
    console.error(
      `❌ Failed to create public key bundle for ${user.name}:`,
      error,
    );
    throw error;
  }
};

export const consumeSignalOneTimePrekey = (
  user: SignalUser,
): CryptoKeyPair | undefined => {
  return user.oneTimePrekeyPairs.shift();
};

export const performSignalX3DHKeyExchange = async (
  alice: SignalUser,
  bobBundle: SignalPublicKeyBundle,
): Promise<X3DHExchangeResult> => {
  console.log(`🤝 Starting X3DH key exchange between ${alice.name} and Bob...`);

  try {
    // Step 1: Verify Bob's signed prekey signature using his signing key
    console.log("📝 Step 1: Importing Bob's identity signing key...");
    const bobIdentitySigningKey = await importSignalSigningPublicKey(
      bobBundle.identitySigningKey,
    );

    console.log("🔍 Verifying Bob's signed prekey signature...");
    const isValidSignature = await verifySignalSignature(
      bobIdentitySigningKey,
      bobBundle.signedPrekeySignature,
      bobBundle.signedPrekey,
    );

    if (!isValidSignature) {
      throw new Error("Invalid signed prekey signature!");
    }

    // Step 2: Generate ephemeral key pair
    console.log("🔑 Step 2: Generating Alice's ephemeral key pair...");
    const aliceEphemeralPair = await generateSignalKeyPair();

    // Step 3: Import Bob's public keys for DH operations
    console.log("🔄 Step 3: Importing Bob's keys for DH operations...");
    const bobSignedPrekey = await importSignalPublicKey(bobBundle.signedPrekey);
    const bobIdentityKeyDH = await importSignalPublicKey(bobBundle.identityKey);
    const bobOneTimePrekey = bobBundle.oneTimePrekey
      ? await importSignalPublicKey(bobBundle.oneTimePrekey)
      : null;

    // Step 4: Perform the Triple (or Quadruple) Diffie-Hellman computation
    console.log("🔄 Step 4: Performing DH computations...");

    const dh1 = await performSignalDH(
      alice.identityKeyPair.privateKey,
      bobSignedPrekey,
    );

    const dh2 = await performSignalDH(
      aliceEphemeralPair.privateKey,
      bobIdentityKeyDH,
    );

    const dh3 = await performSignalDH(
      aliceEphemeralPair.privateKey,
      bobSignedPrekey,
    );

    // DH4: Alice_Ephemeral_Private × Bob_OneTimePrekey_Public (if available)
    let dh4: ArrayBuffer | null = null;
    if (bobOneTimePrekey) {
      console.log("DH4: Alice_Ephemeral_Private × Bob_OneTimePrekey_Public");
      dh4 = await performSignalDH(
        aliceEphemeralPair.privateKey,
        bobOneTimePrekey,
      );
    }

    // Step 5: Combine all DH outputs
    console.log("🔗 Step 5: Combining DH outputs...");
    const dhOutputs = dh4
      ? concatSignalArrayBuffers(dh1, dh2, dh3, dh4)
      : concatSignalArrayBuffers(dh1, dh2, dh3);

    // Step 6: Derive the master secret using HKDF
    console.log("🔑 Step 6: Deriving master secret using HKDF...");
    const salt = new ArrayBuffer(32); // 32 zero bytes
    const info = new TextEncoder().encode("Signal_X3DH_Key_Derivation");

    const masterSecret = await deriveSignalKey(dhOutputs, salt, info.buffer);
    const secretBytes = await crypto.subtle.exportKey("raw", masterSecret);

    const result = {
      masterSecret: secretBytes,
      aliceEphemeralPublic: await exportSignalPublicKey(
        aliceEphemeralPair.publicKey,
      ),
      usedOneTimePrekey: bobBundle.oneTimePrekey !== null,
    };

    console.log("✅ X3DH key exchange completed successfully!");
    return result;
  } catch (error) {
    console.error("❌ X3DH key exchange failed:", error);
    throw error;
  }
};

export const deriveSignalSharedSecret = async (
  bob: SignalUser,
  aliceEphemeralPublic: ArrayBuffer,
  aliceIdentityPublic: ArrayBuffer,
  usedOneTimePrekey: boolean,
  oneTimePrekeyBytes?: ArrayBuffer | null,
): Promise<ArrayBuffer> => {
  console.log(`🔄 Bob deriving shared secret from Alice's message...`);

  try {
    // Import Alice's public keys
    console.log("📥 Importing Alice's public keys...");
    const aliceEphemeral = await importSignalPublicKey(aliceEphemeralPublic);
    const aliceIdentity = await importSignalPublicKey(aliceIdentityPublic);

    // Perform the same DH computations (but from Bob's perspective)
    console.log("🔄 Bob performing DH computations...");

    const dh1 = await performSignalDH(
      bob.signedPrekeyPair.privateKey,
      aliceIdentity,
    );

    const dh2 = await performSignalDH(
      bob.identityKeyPair.privateKey,
      aliceEphemeral,
    );

    const dh3 = await performSignalDH(
      bob.signedPrekeyPair.privateKey,
      aliceEphemeral,
    );

    // DH4: Bob_OneTimePrekey_Private × Alice_Ephemeral_Public (if used)
    let dh4: ArrayBuffer | null = null;
    if (
      usedOneTimePrekey &&
      oneTimePrekeyBytes &&
      bob.oneTimePrekeyPairs.length > 0
    ) {
      console.log(
        "Bob DH4: Bob_OneTimePrekey_Private × Alice_Ephemeral_Public",
      );

      // Find the matching one-time prekey in Bob's collection
      let matchingKeyPair: CryptoKeyPair | null = null;
      for (const keyPair of bob.oneTimePrekeyPairs) {
        const publicKeyBytes = await exportSignalPublicKey(keyPair.publicKey);
        const publicKeyHex = bufferToSignalHex(publicKeyBytes);
        const providedKeyHex = bufferToSignalHex(oneTimePrekeyBytes);

        if (publicKeyHex === providedKeyHex) {
          matchingKeyPair = keyPair;
          console.log("✓ Found matching one-time prekey in Bob's collection");
          break;
        }
      }

      if (matchingKeyPair) {
        dh4 = await performSignalDH(matchingKeyPair.privateKey, aliceEphemeral);
      } else {
        throw new Error("One-time prekey mismatch");
      }
    }

    // Combine DH outputs in the same order
    console.log("🔗 Bob combining DH outputs...");
    const dhOutputs = dh4
      ? concatSignalArrayBuffers(dh1, dh2, dh3, dh4)
      : concatSignalArrayBuffers(dh1, dh2, dh3);

    // Derive the same master secret
    console.log("🔑 Bob deriving master secret using HKDF...");
    const salt = new ArrayBuffer(32);
    const info = new TextEncoder().encode("Signal_X3DH_Key_Derivation");

    const masterSecret = await deriveSignalKey(dhOutputs, salt, info.buffer);
    const secretBytes = await crypto.subtle.exportKey("raw", masterSecret);

    return secretBytes;
  } catch (error) {
    console.error("❌ Bob shared secret derivation failed:", error);
    throw error;
  }
};

export const demonstrateSignalProtocol = async () => {
  try {
    // Create two users
    const alice = await initializeSignalUser("Alice");
    const bob = await initializeSignalUser("Bob");

    // Get Bob's public key bundle
    const bobBundle = await getSignalPublicKeyBundle(bob);

    // Perform the X3DH key exchange
    const exchangeResult = await performSignalX3DHKeyExchange(alice, bobBundle);

    // Verify Bob can derive the same secret
    const aliceIdentityPublic = await exportSignalPublicKey(
      alice.identityKeyPair.publicKey,
    );

    // Get the one-time prekey that was actually used
    const usedOneTimePrekey = exchangeResult.usedOneTimePrekey
      ? bobBundle.oneTimePrekey
      : null;

    const bobSecret = await deriveSignalSharedSecret(
      bob,
      exchangeResult.aliceEphemeralPublic,
      aliceIdentityPublic,
      exchangeResult.usedOneTimePrekey,
      usedOneTimePrekey,
    );

    // Now consume Bob's one-time prekey after both sides have used it
    if (exchangeResult.usedOneTimePrekey) {
      consumeSignalOneTimePrekey(bob);
    }

    // Verify both parties have the same secret
    const aliceSecretHex = bufferToSignalHex(exchangeResult.masterSecret);
    const bobSecretHex = bufferToSignalHex(bobSecret);

    const success = aliceSecretHex === bobSecretHex;

    return {
      success,
      aliceSecret: aliceSecretHex,
      bobSecret: bobSecretHex,
      usedOneTimePrekey: exchangeResult.usedOneTimePrekey,
      alice,
      bob,
      exchangeResult,
    };
  } catch (error) {
    console.error("Error during Signal Protocol demonstration:", error);
    throw error;
  }
};
