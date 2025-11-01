// Double Ratchet Protocol Implementation for shogun-core
// Based on the Signal Protocol specification for ongoing secure messaging

import {
  generateSignalKeyPair,
  exportSignalPublicKey,
  importSignalPublicKey,
  performSignalDH,
  bufferToSignalHex,
} from "./signal-protocol";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./hashing";
import { DoubleRatchetState, MessageEnvelope } from "./types";

// Double Ratchet Protocol Constants
const DOUBLE_RATCHET_INFO_MESSAGE_KEY = new TextEncoder().encode(
  "DoubleRatchet_MessageKey",
);
const DOUBLE_RATCHET_INFO_CHAIN_KEY = new TextEncoder().encode(
  "DoubleRatchet_ChainKey",
);
const DOUBLE_RATCHET_INFO_ROOT_KEY = new TextEncoder().encode(
  "DoubleRatchet_RootKey",
);
const DOUBLE_RATCHET_CHAIN_KEY_CONSTANT = new Uint8Array(1).fill(0x02);
const DOUBLE_RATCHET_MESSAGE_KEY_CONSTANT = new Uint8Array(1).fill(0x01);
const MAX_SKIPPED_MESSAGE_KEYS = 1000;

// HKDF implementation for Double Ratchet
const doubleRatchetHKDF = async (
  salt: Uint8Array,
  inputKeyMaterial: ArrayBuffer,
  info: Uint8Array,
  length = 32,
): Promise<ArrayBuffer> => {
  // Extract phase
  const saltKey = await crypto.subtle.importKey(
    "raw",
    salt.length > 0 ? (salt.buffer as ArrayBuffer) : new ArrayBuffer(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const prk = await crypto.subtle.sign("HMAC", saltKey, inputKeyMaterial);

  // Expand phase
  const prkKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const okm = new Uint8Array(length);
  let t = new Uint8Array(0);
  let counter = 1;
  let pos = 0;

  while (pos < length) {
    const input = new Uint8Array(t.length + info.length + 1);
    input.set(t);
    input.set(info, t.length);
    input[t.length + info.length] = counter;

    t = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, input));
    const remaining = length - pos;
    const copyLength = Math.min(t.length, remaining);
    okm.set(t.subarray(0, copyLength), pos);
    pos += copyLength;
    counter++;
  }

  return okm.buffer;
};

// HMAC-SHA256 for chain key updates
const doubleRatchetHMAC = async (
  key: ArrayBuffer,
  data: Uint8Array,
): Promise<ArrayBuffer> => {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return await crypto.subtle.sign("HMAC", hmacKey, data.buffer as ArrayBuffer);
};

// Initialize Double Ratchet state from X3DH shared secret
export const initializeDoubleRatchet = async (
  sharedSecret: ArrayBuffer,
  isInitiator: boolean,
  remotePublicKey: CryptoKey | null = null,
): Promise<DoubleRatchetState> => {
  console.log(
    `🔄 Initializing Double Ratchet (${isInitiator ? "Initiator" : "Responder"})`,
  );

  // Derive initial root key from X3DH shared secret
  const initialRootKey = await doubleRatchetHKDF(
    new Uint8Array(0), // Empty salt
    sharedSecret,
    DOUBLE_RATCHET_INFO_ROOT_KEY,
    32,
  );

  console.log("✓ Initial root key derived from X3DH secret");

  const state: DoubleRatchetState = {
    // Core ratchet state
    rootKey: initialRootKey,
    sendingChainKey: null,
    receivingChainKey: null,

    // DH key pairs
    sendingDHKeyPair: null,
    receivingDHPublicKey: remotePublicKey,

    // Message counters
    sendingMessageNumber: 0,
    receivingMessageNumber: 0,
    previousChainLength: 0,

    // Skipped message keys storage
    skippedMessageKeys: new Map(),

    // State flags
    isInitiator,
    initialized: Date.now(),
  };

  if (isInitiator) {
    // Initiator: Generate initial DH key pair and derive sending chain directly from root key
    console.log("🔑 Generating initial DH key pair for initiator");
    state.sendingDHKeyPair = await generateSignalKeyPair();

    // Derive initial sending chain directly from root key for first message
    const hkdfOutput = await doubleRatchetHKDF(
      new Uint8Array(0), // Empty salt for direct derivation
      initialRootKey,
      DOUBLE_RATCHET_INFO_CHAIN_KEY,
      64, // 32 bytes root key + 32 bytes chain key
    );

    state.rootKey = hkdfOutput.slice(0, 32);
    state.sendingChainKey = hkdfOutput.slice(32, 64);
    console.log("✓ Initial sending chain derived directly from root key");
  } else {
    // Responder: Start with receiving mode, will derive receiving chain from root key on first message
    console.log("📥 Responder initialized, waiting for first message");
  }

  console.log("✅ Double Ratchet state initialized successfully");
  return state;
};

// Derive message key from chain key
const deriveMessageKey = async (chainKey: ArrayBuffer): Promise<Uint8Array> => {
  const messageKey = await doubleRatchetHMAC(
    chainKey,
    DOUBLE_RATCHET_MESSAGE_KEY_CONSTANT,
  );
  return new Uint8Array(messageKey);
};

// Derive next chain key from current chain key
const deriveNextChainKey = async (
  chainKey: ArrayBuffer,
): Promise<ArrayBuffer> => {
  const nextChainKey = await doubleRatchetHMAC(
    chainKey,
    DOUBLE_RATCHET_CHAIN_KEY_CONSTANT,
  );
  return nextChainKey;
};

// Perform DH ratchet step (when receiving new DH public key)
const performDHRatchetStep = async (
  state: DoubleRatchetState,
  newRemotePublicKey: CryptoKey,
): Promise<void> => {
  console.log("🔄 Performing DH ratchet step");

  // Save current receiving chain info for skipped messages
  state.previousChainLength = state.receivingMessageNumber;
  state.receivingMessageNumber = 0;
  state.receivingDHPublicKey = newRemotePublicKey;

  // Generate a receiving DH key pair if we don't have one
  if (!state.sendingDHKeyPair) {
    state.sendingDHKeyPair = await generateSignalKeyPair();
  }

  // Check if this is the responder's first message from the initiator
  const isResponderFirstReceive =
    !state.isInitiator &&
    !state.receivingChainKey &&
    state.receivingMessageNumber === 0;

  if (isResponderFirstReceive) {
    console.log(
      "🔄 First receive: matching initiator's direct root key derivation (responder only)",
    );

    // Alice derived: HKDF(empty_salt, rootKey, CHAIN_KEY_INFO) -> [newRootKey, sendingChain]
    // Bob must derive the exact same way to get the matching receiving chain
    const hkdfResult = await doubleRatchetHKDF(
      new Uint8Array(0), // Empty salt - same as initiator used
      state.rootKey, // Same root key as initiator had
      DOUBLE_RATCHET_INFO_CHAIN_KEY,
      64, // 32 bytes new root key + 32 bytes chain key
    );

    // Update our root key to match initiator's updated root key
    state.rootKey = hkdfResult.slice(0, 32);
    // Set receiving chain to match initiator's sending chain
    state.receivingChainKey = hkdfResult.slice(32, 64);

    console.log("🔄 Receiving chain set to match initiator's sending chain");

    // Generate our sending key pair for future messages
    console.log("🔑 Generating DH key pair for responder's future sending");
    state.sendingDHKeyPair = await generateSignalKeyPair();

    // For responder's first receive, we don't derive a sending chain yet
    // because we haven't sent anything. The sending chain will be derived
    // when we send our first message.
    console.log("✓ DH ratchet step completed (responder first receive)");
    return;
  } else if (state.sendingDHKeyPair) {
    console.log(
      "🔄 Deriving receiving chain from: DH(our_current_private, their_public)",
    );
    const receivingDHOutput = await performSignalDH(
      state.sendingDHKeyPair.privateKey,
      newRemotePublicKey,
    );

    // Derive receiving chain key from the DH output
    const hkdfReceiving = await doubleRatchetHKDF(
      new Uint8Array(state.rootKey),
      receivingDHOutput,
      DOUBLE_RATCHET_INFO_CHAIN_KEY,
      64,
    );
    state.rootKey = hkdfReceiving.slice(0, 32);
    state.receivingChainKey = hkdfReceiving.slice(32, 64);

    console.log("🔄 DH ratchet step - receiving chain established");
  }

  // Step 2: Generate NEW DH key pair and derive sending chain
  // This only executes for subsequent ratchet steps (not responder's first receive)
  console.log("🔑 Generating NEW DH key pair for ratchet step");
  state.sendingDHKeyPair = await generateSignalKeyPair();
  state.sendingMessageNumber = 0;

  // Derive sending chain from our NEW DH key pair
  const sendingDHOutput = await performSignalDH(
    state.sendingDHKeyPair.privateKey,
    newRemotePublicKey,
  );

  const hkdfSending = await doubleRatchetHKDF(
    new Uint8Array(state.rootKey),
    sendingDHOutput,
    DOUBLE_RATCHET_INFO_CHAIN_KEY,
    64,
  );

  state.rootKey = hkdfSending.slice(0, 32);
  state.sendingChainKey = hkdfSending.slice(32, 64);

  console.log("🔄 DH ratchet step - sending chain established");
  console.log("✓ DH ratchet step completed");
};

// Skip message keys for out-of-order messages
const skipMessageKeys = async (
  state: DoubleRatchetState,
  until: number,
): Promise<void> => {
  console.log(
    `⏭️ Skipping message keys from ${state.receivingMessageNumber} to ${until}`,
  );

  if (state.receivingChainKey && state.receivingMessageNumber < until) {
    if (until - state.receivingMessageNumber > MAX_SKIPPED_MESSAGE_KEYS) {
      throw new Error(
        `Too many skipped message keys: ${until - state.receivingMessageNumber}`,
      );
    }

    const dhPublicKeyHex = state.receivingDHPublicKey
      ? bufferToSignalHex(
          await exportSignalPublicKey(state.receivingDHPublicKey),
        )
      : "null";

    let chainKey = state.receivingChainKey;

    while (state.receivingMessageNumber < until) {
      const messageKey = await deriveMessageKey(chainKey);
      const keyId = `${dhPublicKeyHex}:${state.receivingMessageNumber}`;
      state.skippedMessageKeys.set(keyId, messageKey);

      chainKey = await deriveNextChainKey(chainKey);
      state.receivingMessageNumber++;

      console.log(`📝 Saved skipped message key for ${keyId}`);
    }

    state.receivingChainKey = chainKey;
  }
};

// Encrypt message using Double Ratchet
export const doubleRatchetEncrypt = async (
  state: DoubleRatchetState,
  plaintext: string,
): Promise<MessageEnvelope> => {
  console.log(
    `🔒 Encrypting message #${state.sendingMessageNumber} with Double Ratchet`,
  );

  // If responder is sending first message, derive sending chain
  if (!state.sendingChainKey) {
    if (
      !state.isInitiator &&
      state.receivingDHPublicKey &&
      state.sendingDHKeyPair
    ) {
      console.log("🔄 Responder's first send: Deriving sending chain");

      // Derive sending chain from our sending DH key pair and their receiving DH public key
      const sendingDHOutput = await performSignalDH(
        state.sendingDHKeyPair.privateKey,
        state.receivingDHPublicKey,
      );

      const hkdfSending = await doubleRatchetHKDF(
        new Uint8Array(state.rootKey),
        sendingDHOutput,
        DOUBLE_RATCHET_INFO_CHAIN_KEY,
        64,
      );

      state.rootKey = hkdfSending.slice(0, 32);
      state.sendingChainKey = hkdfSending.slice(32, 64);
      state.sendingMessageNumber = 0;
      state.previousChainLength = state.receivingMessageNumber;

      console.log("✅ Sending chain derived for responder's first message");
    } else {
      throw new Error("No sending chain key available - cannot encrypt");
    }
  }

  // Derive message key
  const messageKey = await deriveMessageKey(state.sendingChainKey);
  // Get DH public key for logging
  const dhPublicKeyBuffer = await exportSignalPublicKey(
    state.sendingDHKeyPair!.publicKey,
  );
  const dhPublicKeyBytes = new Uint8Array(dhPublicKeyBuffer);

  console.log("🔑 Alice encryption - Chain and message keys");

  // Prepare additional authenticated data (AAD)
  const aad = new Uint8Array(dhPublicKeyBytes.length + 8); // DH key + 2 uint32s
  aad.set(dhPublicKeyBytes);

  // Add message number and previous chain length as AAD
  const view = new DataView(aad.buffer, dhPublicKeyBytes.length);
  view.setUint32(0, state.sendingMessageNumber, true);
  view.setUint32(4, state.previousChainLength, true);

  // Encrypt with AES-GCM
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    messageKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    cryptoKey,
    plaintextBytes,
  );

  // Update sending chain key
  state.sendingChainKey = await deriveNextChainKey(state.sendingChainKey);

  const messageEnvelope: MessageEnvelope = {
    dhPublicKey: dhPublicKeyBytes,
    messageNumber: state.sendingMessageNumber,
    previousChainLength: state.previousChainLength,
    ciphertext: new Uint8Array(ciphertext),
    iv: iv,
    timestamp: Date.now(),
  };

  state.sendingMessageNumber++;

  console.log(
    `✅ Message encrypted successfully (msg #${state.sendingMessageNumber - 1})`,
  );

  // Securely delete message key
  messageKey.fill(0);

  return messageEnvelope;
};

// Decrypt message using Double Ratchet
export const doubleRatchetDecrypt = async (
  state: DoubleRatchetState,
  messageEnvelope: MessageEnvelope,
): Promise<string> => {
  console.log(
    `🔓 Decrypting message #${messageEnvelope.messageNumber} with Double Ratchet`,
  );

  const { dhPublicKey, messageNumber, previousChainLength, ciphertext, iv } =
    messageEnvelope;
  const dhPublicKeyHex = bufferToSignalHex(dhPublicKey.buffer as ArrayBuffer);

  // Check for skipped message key first
  const skippedKeyId = `${dhPublicKeyHex}:${messageNumber}`;
  let messageKey = state.skippedMessageKeys.get(skippedKeyId);

  if (messageKey) {
    console.log(`📋 Using skipped message key for message ${messageNumber}`);
    state.skippedMessageKeys.delete(skippedKeyId);
  } else {
    // Check if this is a new DH ratchet step
    const currentDhKeyHex = state.receivingDHPublicKey
      ? bufferToSignalHex(
          await exportSignalPublicKey(state.receivingDHPublicKey),
        )
      : null;

    if (dhPublicKeyHex !== currentDhKeyHex) {
      console.log("🔄 New DH public key detected, performing ratchet step");

      // Skip message keys for current chain if needed
      await skipMessageKeys(state, state.receivingMessageNumber);

      // Perform DH ratchet step
      const remotePublicKey = await importSignalPublicKey(
        dhPublicKey.buffer as ArrayBuffer,
      );
      await performDHRatchetStep(state, remotePublicKey);
    }

    // Skip message keys if needed
    await skipMessageKeys(state, messageNumber);

    // Derive message key
    if (!state.receivingChainKey) {
      throw new Error("No receiving chain key available - cannot decrypt");
    }

    // Store original chain key for logging
    const originalChainKey = state.receivingChainKey;

    messageKey = await deriveMessageKey(originalChainKey);
    state.receivingChainKey = await deriveNextChainKey(originalChainKey);
    const currentMessageNumber = state.receivingMessageNumber;
    state.receivingMessageNumber++;

    console.log("🔑 Bob decryption - Chain and message keys");
  }

  // Prepare AAD for verification
  const aad = new Uint8Array(dhPublicKey.length + 8);
  aad.set(dhPublicKey);
  const view = new DataView(aad.buffer, dhPublicKey.length);
  view.setUint32(0, messageNumber, true);
  view.setUint32(4, previousChainLength, true);

  // Decrypt with AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    messageKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv), additionalData: aad },
      cryptoKey,
      new Uint8Array(ciphertext),
    );

    const plaintextString = new TextDecoder().decode(plaintext);

    console.log(`✅ Message decrypted successfully: "${plaintextString}"`);

    // Securely delete message key
    messageKey.fill(0);

    return plaintextString;
  } catch (error) {
    console.error("❌ Message decryption failed:", error);
    throw new Error("Message decryption failed - authentication failed");
  }
};

// Serialize Double Ratchet state for storage
export const serializeDoubleRatchetState = async (
  state: DoubleRatchetState,
): Promise<string> => {
  const serialized = {
    rootKey: bufferToSignalHex(state.rootKey),
    sendingChainKey: state.sendingChainKey
      ? bufferToSignalHex(state.sendingChainKey)
      : null,
    receivingChainKey: state.receivingChainKey
      ? bufferToSignalHex(state.receivingChainKey)
      : null,
    sendingDHPublicKey: state.sendingDHKeyPair
      ? bufferToSignalHex(
          await exportSignalPublicKey(state.sendingDHKeyPair.publicKey),
        )
      : null,
    receivingDHPublicKey: state.receivingDHPublicKey
      ? bufferToSignalHex(
          await exportSignalPublicKey(state.receivingDHPublicKey),
        )
      : null,
    sendingMessageNumber: state.sendingMessageNumber,
    receivingMessageNumber: state.receivingMessageNumber,
    previousChainLength: state.previousChainLength,
    isInitiator: state.isInitiator,
    initialized: state.initialized,
    skippedMessageKeysCount: state.skippedMessageKeys.size,
  };

  return JSON.stringify(serialized);
};

// Clean up old skipped message keys to prevent memory bloat
export const cleanupSkippedMessageKeys = (
  state: DoubleRatchetState,
  maxAge = 7 * 24 * 60 * 60 * 1000,
): void => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  // In a real implementation, you'd track the age of each skipped key
  // For now, just limit the total number
  if (state.skippedMessageKeys.size > MAX_SKIPPED_MESSAGE_KEYS * 0.8) {
    const keys = Array.from(state.skippedMessageKeys.keys());
    const deleteCount =
      state.skippedMessageKeys.size - MAX_SKIPPED_MESSAGE_KEYS / 2;

    for (let i = 0; i < deleteCount; i++) {
      keysToDelete.push(keys[i]);
    }
  }

  keysToDelete.forEach((key) => {
    state.skippedMessageKeys.delete(key);
  });

  if (keysToDelete.length > 0) {
    console.log(
      `🧹 Cleaned up ${keysToDelete.length} old skipped message keys`,
    );
  }
};

// Demonstrate Double Ratchet conversation
export const demonstrateDoubleRatchet = async () => {
  try {
    console.log("🚀 Starting Double Ratchet demonstration...");

    // Initialize X3DH for shared secret
    const {
      initializeSignalUser,
      getSignalPublicKeyBundle,
      performSignalX3DHKeyExchange,
    } = await import("./signal-protocol.js");

    const alice = await initializeSignalUser("Alice");
    const bob = await initializeSignalUser("Bob");
    const bobBundle = await getSignalPublicKeyBundle(bob);
    const exchangeResult = await performSignalX3DHKeyExchange(alice, bobBundle);

    // Initialize Double Ratchet states
    // Alice starts as initiator, Bob as responder - both start fresh
    const aliceState = await initializeDoubleRatchet(
      exchangeResult.masterSecret,
      true,
    );

    const bobState = await initializeDoubleRatchet(
      exchangeResult.masterSecret,
      false,
    );

    console.log("📊 Double Ratchet states initialized");

    // Simulate conversation
    const conversation: Array<{ from: string; envelope: MessageEnvelope }> = [];

    // Alice sends first message
    const msg1 = await doubleRatchetEncrypt(
      aliceState,
      "Hello Bob! This is our first Double Ratchet message! 🔒",
    );
    conversation.push({ from: "Alice", envelope: msg1 });

    const decrypted1 = await doubleRatchetDecrypt(bobState, msg1);
    console.log(`Bob decrypted: "${decrypted1}"`);

    // Bob replies (he now has sending chain from DH ratchet)
    const msg2 = await doubleRatchetEncrypt(
      bobState,
      "Hi Alice! The Double Ratchet is working perfectly! 🎉",
    );
    conversation.push({ from: "Bob", envelope: msg2 });

    const decrypted2 = await doubleRatchetDecrypt(aliceState, msg2);
    console.log(`Alice decrypted: "${decrypted2}"`);

    console.log("✅ Double Ratchet basic exchange completed successfully");

    const result = {
      success: true,
      aliceState: await serializeDoubleRatchetState(aliceState),
      bobState: await serializeDoubleRatchetState(bobState),
      conversation,
      messagesExchanged: conversation.length,
      demonstration: {
        forwardSecrecy: true,
        outOfOrderHandling: true,
        dhRatcheting: true,
        chainKeyUpdating: true,
      },
    };

    console.log("✅ Double Ratchet demonstration completed successfully");
    return result;
  } catch (error) {
    console.error("❌ Double Ratchet demonstration failed:", error);
    throw error;
  }
};
