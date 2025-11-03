"use strict";
// Double Ratchet Protocol Implementation for shogun-core
// Based on the Signal Protocol specification for ongoing secure messaging
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateDoubleRatchet = exports.cleanupSkippedMessageKeys = exports.serializeDoubleRatchetState = exports.doubleRatchetDecrypt = exports.doubleRatchetEncrypt = exports.initializeDoubleRatchet = void 0;
const signal_protocol_1 = require("./signal-protocol");
// Double Ratchet Protocol Constants
const DOUBLE_RATCHET_INFO_MESSAGE_KEY = new TextEncoder().encode("DoubleRatchet_MessageKey");
const DOUBLE_RATCHET_INFO_CHAIN_KEY = new TextEncoder().encode("DoubleRatchet_ChainKey");
const DOUBLE_RATCHET_INFO_ROOT_KEY = new TextEncoder().encode("DoubleRatchet_RootKey");
const DOUBLE_RATCHET_CHAIN_KEY_CONSTANT = new Uint8Array(1).fill(0x02);
const DOUBLE_RATCHET_MESSAGE_KEY_CONSTANT = new Uint8Array(1).fill(0x01);
const MAX_SKIPPED_MESSAGE_KEYS = 1000;
// HKDF implementation for Double Ratchet
const doubleRatchetHKDF = async (salt, inputKeyMaterial, info, length = 32) => {
    // Extract phase
    const saltKey = await crypto.subtle.importKey("raw", salt.length > 0 ? salt.buffer : new ArrayBuffer(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prk = await crypto.subtle.sign("HMAC", saltKey, inputKeyMaterial);
    // Expand phase
    const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
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
const doubleRatchetHMAC = async (key, data) => {
    const hmacKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return await crypto.subtle.sign("HMAC", hmacKey, data.buffer);
};
// Initialize Double Ratchet state from X3DH shared secret
const initializeDoubleRatchet = async (sharedSecret, isInitiator, remotePublicKey = null, x3dhEphemeralPublic) => {
    console.log(`🔄 Initializing Double Ratchet (${isInitiator ? "Initiator" : "Responder"})`);
    // Derive initial root key from X3DH shared secret
    const initialRootKey = await doubleRatchetHKDF(new Uint8Array(0), // Empty salt
    sharedSecret, DOUBLE_RATCHET_INFO_ROOT_KEY, 32);
    const rootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(initialRootKey);
    console.log("✓ Initial root key derived from X3DH secret", {
        role: isInitiator ? "Initiator" : "Responder",
        rootKeyHex: rootKeyHex.substring(0, 16) + "...",
        rootKeyLength: initialRootKey.byteLength,
    });
    const state = {
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
        // X3DH ephemeral (only for initiator)
        x3dhEphemeralPublic,
    };
    if (isInitiator) {
        // Initiator: Generate initial DH key pair and derive sending chain directly from root key
        console.log("🔑 Generating initial DH key pair for initiator");
        state.sendingDHKeyPair = await (0, signal_protocol_1.generateSignalKeyPair)();
        const initialRootKeyHexBeforeDerivation = (0, signal_protocol_1.bufferToSignalHex)(initialRootKey);
        console.log("🔍 Initiator - root key before sending chain derivation:", {
            rootKeyHex: initialRootKeyHexBeforeDerivation.substring(0, 16) + "...",
            rootKeyLength: initialRootKey.byteLength,
        });
        // Derive initial sending chain directly from root key for first message
        const hkdfOutput = await doubleRatchetHKDF(new Uint8Array(0), // Empty salt for direct derivation
        initialRootKey, DOUBLE_RATCHET_INFO_CHAIN_KEY, 64);
        const newRootKey = hkdfOutput.slice(0, 32);
        const sendingChainKey = hkdfOutput.slice(32, 64);
        const newRootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(newRootKey);
        const sendingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(sendingChainKey);
        state.rootKey = newRootKey;
        state.sendingChainKey = sendingChainKey;
        console.log("✓ Initial sending chain derived directly from root key", {
            oldRootKeyHex: initialRootKeyHexBeforeDerivation.substring(0, 16) + "...",
            newRootKeyHex: newRootKeyHex.substring(0, 16) + "...",
            sendingChainKeyHex: sendingChainKeyHex.substring(0, 16) + "...",
            sendingChainKeyLength: sendingChainKey.byteLength,
        });
    }
    else {
        // Responder: Start with receiving mode, will derive receiving chain from root key on first message
        console.log("📥 Responder initialized, waiting for first message");
    }
    console.log("✅ Double Ratchet state initialized successfully");
    return state;
};
exports.initializeDoubleRatchet = initializeDoubleRatchet;
// Derive message key from chain key
const deriveMessageKey = async (chainKey) => {
    const messageKey = await doubleRatchetHMAC(chainKey, DOUBLE_RATCHET_MESSAGE_KEY_CONSTANT);
    return new Uint8Array(messageKey);
};
// Derive next chain key from current chain key
const deriveNextChainKey = async (chainKey) => {
    const nextChainKey = await doubleRatchetHMAC(chainKey, DOUBLE_RATCHET_CHAIN_KEY_CONSTANT);
    return nextChainKey;
};
// Perform DH ratchet step (when receiving new DH public key)
const performDHRatchetStep = async (state, newRemotePublicKey) => {
    console.log("🔄 Performing DH ratchet step");
    // Save current receiving chain info for skipped messages BEFORE checking first receive
    // IMPORTANT: Save the OLD values before modifying them for the check
    const wasReceivingMessageNumber = state.receivingMessageNumber;
    const wasPreviousChainLength = state.previousChainLength;
    // Check if this is the responder's first message from the initiator
    // This MUST be checked BEFORE modifying state or generating sendingDHKeyPair
    // otherwise the condition will never be true for the first message
    const isResponderFirstReceive = !state.isInitiator &&
        !state.receivingChainKey &&
        wasReceivingMessageNumber === 0 &&
        wasPreviousChainLength === 0; // previousChainLength should be 0 for first message
    // Update state for ratchet step (after check)
    state.previousChainLength = state.receivingMessageNumber;
    state.receivingDHPublicKey = newRemotePublicKey;
    // Note: receivingMessageNumber is reset to 0 AFTER the isResponderFirstReceive check
    // because we need to check wasReceivingMessageNumber === 0
    console.log("🔍 Checking isResponderFirstReceive:", {
        isResponder: !state.isInitiator,
        hasReceivingChainKey: !!state.receivingChainKey,
        wasReceivingMessageNumber,
        wasPreviousChainLength,
        isResponderFirstReceive,
        hasSendingDHKeyPair: !!state.sendingDHKeyPair,
        conditionBreakdown: {
            notInitiator: !state.isInitiator,
            noReceivingChainKey: !state.receivingChainKey,
            receivingMessageNumberIsZero: wasReceivingMessageNumber === 0,
            previousChainLengthIsZero: wasPreviousChainLength === 0,
            allConditionsMet: !state.isInitiator &&
                !state.receivingChainKey &&
                wasReceivingMessageNumber === 0 &&
                wasPreviousChainLength === 0,
        },
    });
    if (isResponderFirstReceive) {
        console.log("🔄 First receive: matching initiator's direct root key derivation (responder only)");
        const initialRootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey);
        console.log("🔍 Responder first receive - root key before derivation:", {
            rootKeyHex: initialRootKeyHex.substring(0, 16) + "...",
            rootKeyLength: state.rootKey.byteLength,
        });
        // Alice derived: HKDF(empty_salt, rootKey, CHAIN_KEY_INFO) -> [newRootKey, sendingChain]
        // Bob must derive the exact same way to get the matching receiving chain
        const hkdfResult = await doubleRatchetHKDF(new Uint8Array(0), // Empty salt - same as initiator used
        state.rootKey, // Same root key as initiator had
        DOUBLE_RATCHET_INFO_CHAIN_KEY, 64);
        // Update our root key to match initiator's updated root key
        const newRootKey = hkdfResult.slice(0, 32);
        const receivingChainKey = hkdfResult.slice(32, 64);
        const newRootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(newRootKey);
        const receivingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(receivingChainKey);
        state.rootKey = newRootKey;
        // Set receiving chain to match initiator's sending chain
        state.receivingChainKey = receivingChainKey;
        // Reset receiving message number for the new chain
        state.receivingMessageNumber = 0;
        console.log("🔄 Receiving chain set to match initiator's sending chain", {
            oldRootKeyHex: initialRootKeyHex.substring(0, 16) + "...",
            newRootKeyHex: newRootKeyHex.substring(0, 16) + "...",
            receivingChainKeyHex: receivingChainKeyHex.substring(0, 16) + "...",
            receivingChainKeyLength: receivingChainKey.byteLength,
        });
        // Generate our sending key pair for future messages
        console.log("🔑 Generating DH key pair for responder's future sending");
        state.sendingDHKeyPair = await (0, signal_protocol_1.generateSignalKeyPair)();
        // For responder's first receive, we don't derive a sending chain yet
        // because we haven't sent anything. The sending chain will be derived
        // when we send our first message.
        console.log("✓ DH ratchet step completed (responder first receive)");
        return;
    }
    // Reset receiving message number for new chain (for non-first receive cases)
    state.receivingMessageNumber = 0;
    // Generate a receiving DH key pair if we don't have one
    // NOTE: If state was restored, sendingDHKeyPair should now be properly restored
    // with both public and private keys. If it's still null, we need to generate one,
    // but this might cause chain derivation issues if we're in the middle of a conversation.
    if (!state.sendingDHKeyPair) {
        console.log("⚠️ Warning: No sendingDHKeyPair found, generating new one. This might cause chain derivation issues if state was restored.");
        state.sendingDHKeyPair = await (0, signal_protocol_1.generateSignalKeyPair)();
    }
    // Derive receiving chain from existing sendingDHKeyPair
    if (state.sendingDHKeyPair) {
        console.log("🔄 Deriving receiving chain from: DH(our_current_private, their_public)");
        // Log the DH keys being used for debugging
        const ourPublicKeyHex = (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.sendingDHKeyPair.publicKey));
        const theirPublicKeyHex = (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(newRemotePublicKey));
        // Also check what receivingDHPublicKey we currently have (this should match ourPublicKeyHex if we're synchronized)
        const currentReceivingDHPublicKeyHex = state.receivingDHPublicKey
            ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
            : "null";
        console.log("🔍 DH key derivation details:", {
            ourPublicKeyHex: ourPublicKeyHex.substring(0, 16) + "...",
            theirPublicKeyHex: theirPublicKeyHex.substring(0, 16) + "...",
            currentReceivingDHPublicKeyHex: currentReceivingDHPublicKeyHex !== "null"
                ? currentReceivingDHPublicKeyHex.substring(0, 16) + "..."
                : "null",
            rootKeyLength: state.rootKey.byteLength,
            rootKeyHex: (0, signal_protocol_1.bufferToSignalHex)(state.rootKey).substring(0, 16) + "...",
            previousChainLength: state.previousChainLength,
            receivingMessageNumber: state.receivingMessageNumber,
        });
        const receivingDHOutput = await (0, signal_protocol_1.performSignalDH)(state.sendingDHKeyPair.privateKey, newRemotePublicKey);
        // Derive receiving chain key from the DH output
        // IMPORTANT: Use the CURRENT root key (before updating) for HKDF
        const rootKeyBeforeReceivingDerivation = state.rootKey;
        const rootKeyBeforeReceivingHex = (0, signal_protocol_1.bufferToSignalHex)(rootKeyBeforeReceivingDerivation);
        const hkdfReceiving = await doubleRatchetHKDF(new Uint8Array(rootKeyBeforeReceivingDerivation), receivingDHOutput, DOUBLE_RATCHET_INFO_CHAIN_KEY, 64);
        const oldRootKeyHex = rootKeyBeforeReceivingHex.substring(0, 16) + "...";
        state.rootKey = hkdfReceiving.slice(0, 32);
        state.receivingChainKey = hkdfReceiving.slice(32, 64);
        const newRootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey).substring(0, 16) + "...";
        const receivingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.receivingChainKey).substring(0, 16) + "...";
        console.log("🔄 DH ratchet step - receiving chain established", {
            oldRootKeyHex,
            newRootKeyHex,
            receivingChainKeyHex,
            receivingChainKeyLength: state.receivingChainKey.byteLength,
            previousChainLength: state.previousChainLength,
        });
    }
    // Step 2: Generate NEW DH key pair and derive sending chain
    // This only executes for subsequent ratchet steps (not responder's first receive)
    console.log("🔑 Generating NEW DH key pair for ratchet step", {
        rootKeyBeforeSendingDerivation: (0, signal_protocol_1.bufferToSignalHex)(state.rootKey).substring(0, 16) + "...",
        previousChainLength: state.previousChainLength,
    });
    state.sendingDHKeyPair = await (0, signal_protocol_1.generateSignalKeyPair)();
    state.sendingMessageNumber = 0;
    // Derive sending chain from our NEW DH key pair
    // IMPORTANT: Use the CURRENT root key (after receiving chain derivation if applicable) for HKDF
    const rootKeyBeforeSendingDerivation = state.rootKey;
    const rootKeyBeforeSendingHex = (0, signal_protocol_1.bufferToSignalHex)(rootKeyBeforeSendingDerivation);
    const sendingDHOutput = await (0, signal_protocol_1.performSignalDH)(state.sendingDHKeyPair.privateKey, newRemotePublicKey);
    const hkdfSending = await doubleRatchetHKDF(new Uint8Array(rootKeyBeforeSendingDerivation), sendingDHOutput, DOUBLE_RATCHET_INFO_CHAIN_KEY, 64);
    state.rootKey = hkdfSending.slice(0, 32);
    state.sendingChainKey = hkdfSending.slice(32, 64);
    const rootKeyAfterHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey);
    const sendingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.sendingChainKey);
    console.log("🔄 DH ratchet step - sending chain established", {
        rootKeyBeforeHex: rootKeyBeforeSendingHex.substring(0, 16) + "...",
        rootKeyAfterHex: rootKeyAfterHex.substring(0, 16) + "...",
        sendingChainKeyHex: sendingChainKeyHex.substring(0, 16) + "...",
        previousChainLength: state.previousChainLength,
    });
    console.log("✓ DH ratchet step completed");
};
// Skip message keys for out-of-order messages
const skipMessageKeys = async (state, until) => {
    console.log(`⏭️ Skipping message keys from ${state.receivingMessageNumber} to ${until}`);
    if (state.receivingChainKey && state.receivingMessageNumber < until) {
        if (until - state.receivingMessageNumber > MAX_SKIPPED_MESSAGE_KEYS) {
            throw new Error(`Too many skipped message keys: ${until - state.receivingMessageNumber}`);
        }
        const dhPublicKeyHex = state.receivingDHPublicKey
            ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
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
const doubleRatchetEncrypt = async (state, plaintext) => {
    console.log(`🔒 Encrypting message #${state.sendingMessageNumber} with Double Ratchet`);
    // If responder is sending first message, derive sending chain
    if (!state.sendingChainKey) {
        if (!state.isInitiator &&
            state.receivingDHPublicKey &&
            state.sendingDHKeyPair) {
            console.log("🔄 Responder's first send: Deriving sending chain");
            // Derive sending chain from our sending DH key pair and their receiving DH public key
            const sendingDHOutput = await (0, signal_protocol_1.performSignalDH)(state.sendingDHKeyPair.privateKey, state.receivingDHPublicKey);
            const hkdfSending = await doubleRatchetHKDF(new Uint8Array(state.rootKey), sendingDHOutput, DOUBLE_RATCHET_INFO_CHAIN_KEY, 64);
            state.rootKey = hkdfSending.slice(0, 32);
            state.sendingChainKey = hkdfSending.slice(32, 64);
            state.sendingMessageNumber = 0;
            state.previousChainLength = state.receivingMessageNumber;
            console.log("✅ Sending chain derived for responder's first message");
        }
        else {
            throw new Error("No sending chain key available - cannot encrypt");
        }
    }
    // Derive message key
    const messageKey = await deriveMessageKey(state.sendingChainKey);
    // Get DH public key for logging
    const dhPublicKeyBuffer = await (0, signal_protocol_1.exportSignalPublicKey)(state.sendingDHKeyPair.publicKey);
    const dhPublicKeyBytes = new Uint8Array(dhPublicKeyBuffer);
    // Log encryption state for debugging
    const sendingDHPublicKeyHex = (0, signal_protocol_1.bufferToSignalHex)(dhPublicKeyBuffer);
    const rootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey);
    const sendingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.sendingChainKey);
    const receivingDHPublicKeyHex = state.receivingDHPublicKey
        ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
        : "null";
    console.log("🔑 Alice encryption - Chain and message keys", {
        sendingDHPublicKeyHex: sendingDHPublicKeyHex.substring(0, 16) + "...",
        receivingDHPublicKeyHex: receivingDHPublicKeyHex !== "null"
            ? receivingDHPublicKeyHex.substring(0, 16) + "..."
            : "null",
        rootKeyHex: rootKeyHex.substring(0, 16) + "...",
        sendingChainKeyHex: sendingChainKeyHex.substring(0, 16) + "...",
        sendingMessageNumber: state.sendingMessageNumber,
        previousChainLength: state.previousChainLength,
    });
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
    const cryptoKey = await crypto.subtle.importKey("raw", messageKey.buffer, { name: "AES-GCM" }, false, ["encrypt"]);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, cryptoKey, plaintextBytes);
    console.log("🔍 Encryption details:", {
        messageNumber: state.sendingMessageNumber,
        previousChainLength: state.previousChainLength,
        dhPublicKeyLength: dhPublicKeyBytes.length,
        plaintextLength: plaintextBytes.length,
        ciphertextLength: ciphertext.byteLength,
        ivLength: iv.length,
        aadLength: aad.length,
        messageKeyLength: messageKey.length,
    });
    // Update sending chain key
    state.sendingChainKey = await deriveNextChainKey(state.sendingChainKey);
    const messageEnvelope = {
        dhPublicKey: dhPublicKeyBytes,
        messageNumber: state.sendingMessageNumber,
        previousChainLength: state.previousChainLength,
        ciphertext: new Uint8Array(ciphertext),
        iv: iv,
        timestamp: Date.now(),
    };
    // Include X3DH ephemeral public key in the first message from initiator
    if (state.isInitiator &&
        state.sendingMessageNumber === 0 &&
        state.x3dhEphemeralPublic) {
        console.log("📤 Including X3DH ephemeral public key in first message");
        messageEnvelope.x3dhEphemeralPublic = new Uint8Array(state.x3dhEphemeralPublic);
    }
    state.sendingMessageNumber++;
    console.log(`✅ Message encrypted successfully (msg #${state.sendingMessageNumber - 1})`);
    // Securely delete message key
    messageKey.fill(0);
    return messageEnvelope;
};
exports.doubleRatchetEncrypt = doubleRatchetEncrypt;
// Decrypt message using Double Ratchet
const doubleRatchetDecrypt = async (state, messageEnvelope) => {
    console.log(`🔓 Decrypting message #${messageEnvelope.messageNumber} with Double Ratchet`);
    // Log initial state for debugging
    console.log("🔍 Initial decrypt state:", {
        receivingMessageNumber: state.receivingMessageNumber,
        sendingMessageNumber: state.sendingMessageNumber,
        previousChainLength: state.previousChainLength,
        hasReceivingChainKey: !!state.receivingChainKey,
        hasReceivingDHPublicKey: !!state.receivingDHPublicKey,
        hasSendingDHKeyPair: !!state.sendingDHKeyPair,
        isInitiator: state.isInitiator,
    });
    const { dhPublicKey, messageNumber, previousChainLength, ciphertext, iv } = messageEnvelope;
    const dhPublicKeyHex = (0, signal_protocol_1.bufferToSignalHex)(dhPublicKey.buffer);
    // Check for skipped message key first
    const skippedKeyId = `${dhPublicKeyHex}:${messageNumber}`;
    let messageKey = state.skippedMessageKeys.get(skippedKeyId);
    if (messageKey) {
        console.log(`📋 Using skipped message key for message ${messageNumber}`);
        state.skippedMessageKeys.delete(skippedKeyId);
    }
    else {
        // Check if this is a new DH ratchet step
        const currentDhKeyHex = state.receivingDHPublicKey
            ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
            : null;
        console.log("🔍 DH key comparison:", {
            messageDhKeyHex: dhPublicKeyHex.substring(0, 16) + "...",
            currentDhKeyHex: currentDhKeyHex
                ? currentDhKeyHex.substring(0, 16) + "..."
                : "null",
            match: dhPublicKeyHex === currentDhKeyHex,
            receivingMessageNumber: state.receivingMessageNumber,
        });
        if (dhPublicKeyHex !== currentDhKeyHex) {
            console.log("🔄 New DH public key detected, performing ratchet step");
            // Skip message keys for current chain if needed
            await skipMessageKeys(state, state.receivingMessageNumber);
            // Perform DH ratchet step
            const remotePublicKey = await (0, signal_protocol_1.importSignalPublicKey)(dhPublicKey.buffer);
            await performDHRatchetStep(state, remotePublicKey);
        }
        // Skip message keys if needed (for out-of-order messages)
        if (messageNumber > state.receivingMessageNumber) {
            await skipMessageKeys(state, messageNumber);
        }
        // Validate message number matches after skipping
        if (messageNumber !== state.receivingMessageNumber) {
            // Check if we have this message in skipped keys
            const skippedKeyCheck = state.skippedMessageKeys.get(skippedKeyId);
            if (!skippedKeyCheck) {
                throw new Error(`Message number mismatch: expected ${state.receivingMessageNumber}, got ${messageNumber}. This may indicate a missing message or synchronization issue.`);
            }
            // If we found it in skipped keys, we should have handled it earlier
            // This shouldn't happen, but if it does, use the skipped key
            messageKey = skippedKeyCheck;
            state.skippedMessageKeys.delete(skippedKeyId);
            console.log(`📋 Using skipped message key for message ${messageNumber} (late catch)`);
        }
        else {
            // Derive message key
            if (!state.receivingChainKey) {
                throw new Error("No receiving chain key available - cannot decrypt");
            }
            // Store original chain key for logging
            const originalChainKey = state.receivingChainKey;
            const receivingChainKeyHex = (0, signal_protocol_1.bufferToSignalHex)(originalChainKey);
            const rootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey);
            const receivingDHPublicKeyHex = state.receivingDHPublicKey
                ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
                : "null";
            messageKey = await deriveMessageKey(originalChainKey);
            state.receivingChainKey = await deriveNextChainKey(originalChainKey);
            const currentMessageNumber = state.receivingMessageNumber;
            state.receivingMessageNumber++;
            console.log("🔑 Bob decryption - Chain and message keys", {
                messageNumber: currentMessageNumber,
                chainKeyLength: originalChainKey.byteLength,
                messageKeyLength: messageKey.length,
                nextReceivingMessageNumber: state.receivingMessageNumber,
                receivingDHPublicKeyHex: receivingDHPublicKeyHex.substring(0, 16) + "...",
                rootKeyHex: rootKeyHex.substring(0, 16) + "...",
                receivingChainKeyHex: receivingChainKeyHex.substring(0, 16) + "...",
                previousChainLength: state.previousChainLength,
            });
        }
    }
    // Prepare AAD for verification
    // IMPORTANT: The AAD must match EXACTLY what was used during encryption
    // This includes: dhPublicKey, messageNumber, and previousChainLength
    const aad = new Uint8Array(dhPublicKey.length + 8);
    aad.set(dhPublicKey);
    const view = new DataView(aad.buffer, dhPublicKey.length);
    view.setUint32(0, messageNumber, true);
    view.setUint32(4, previousChainLength, true);
    // Log AAD details for debugging (before decryption attempt)
    console.log("🔍 AAD details for decryption:", {
        dhPublicKeyHex: dhPublicKeyHex.substring(0, 16) + "...",
        messageNumber,
        previousChainLength,
        statePreviousChainLength: state.previousChainLength,
        receivingMessageNumber: state.receivingMessageNumber,
        aadLength: aad.length,
        messageKeyLength: messageKey.length,
    });
    // Decrypt with AES-GCM
    const cryptoKey = await crypto.subtle.importKey("raw", messageKey.buffer, { name: "AES-GCM" }, false, ["decrypt"]);
    try {
        // Log AAD details for debugging
        const aadDetails = {
            dhPublicKeyPrefix: Array.from(dhPublicKey.slice(0, 8))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
            messageNumberBytes: Array.from(new Uint8Array(aad.slice(dhPublicKey.length, dhPublicKey.length + 4)))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
            previousChainLengthBytes: Array.from(new Uint8Array(aad.slice(dhPublicKey.length + 4)))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""),
        };
        // Log root key and chain key for comparison with encryption
        const rootKeyHex = (0, signal_protocol_1.bufferToSignalHex)(state.rootKey);
        const messageKeyHex = (0, signal_protocol_1.bufferToSignalHex)(messageKey.buffer);
        const receivingChainKeyHex = state.receivingChainKey
            ? (0, signal_protocol_1.bufferToSignalHex)(state.receivingChainKey)
            : "null";
        console.log("🔍 Decryption attempt details:", {
            messageNumber,
            previousChainLength,
            statePreviousChainLength: state.previousChainLength,
            dhPublicKeyLength: dhPublicKey.length,
            ciphertextLength: ciphertext.length,
            ivLength: iv.length,
            aadLength: aad.length,
            messageKeyLength: messageKey.length,
            rootKeyHex: rootKeyHex.substring(0, 32) + "...", // Show more for comparison
            receivingChainKeyHex: receivingChainKeyHex !== "null"
                ? receivingChainKeyHex.substring(0, 32) + "..."
                : "null",
            messageKeyHex: messageKeyHex.substring(0, 32) + "...",
            receivingMessageNumber: state.receivingMessageNumber,
            aadDetails,
        });
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv), additionalData: aad }, cryptoKey, new Uint8Array(ciphertext));
        const plaintextString = new TextDecoder().decode(plaintext);
        console.log(`✅ Message decrypted successfully: "${plaintextString}"`);
        // Securely delete message key
        messageKey.fill(0);
        return plaintextString;
    }
    catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error("❌ Message decryption failed:", errorObj);
        console.error("❌ Decryption error details:", {
            errorName: errorObj.name,
            errorMessage: errorObj.message,
            messageNumber,
            previousChainLength,
            dhPublicKeyLength: dhPublicKey.length,
            ciphertextLength: ciphertext.length,
            ivLength: iv.length,
            aadLength: aad.length,
            messageKeyLength: messageKey.length,
        });
        throw new Error(`Message decryption failed - authentication failed: ${errorObj.message}`);
    }
};
exports.doubleRatchetDecrypt = doubleRatchetDecrypt;
// Serialize Double Ratchet state for storage
const serializeDoubleRatchetState = async (state) => {
    const serialized = {
        rootKey: (0, signal_protocol_1.bufferToSignalHex)(state.rootKey),
        sendingChainKey: state.sendingChainKey
            ? (0, signal_protocol_1.bufferToSignalHex)(state.sendingChainKey)
            : null,
        receivingChainKey: state.receivingChainKey
            ? (0, signal_protocol_1.bufferToSignalHex)(state.receivingChainKey)
            : null,
        sendingDHPublicKey: state.sendingDHKeyPair
            ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.sendingDHKeyPair.publicKey))
            : null,
        receivingDHPublicKey: state.receivingDHPublicKey
            ? (0, signal_protocol_1.bufferToSignalHex)(await (0, signal_protocol_1.exportSignalPublicKey)(state.receivingDHPublicKey))
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
exports.serializeDoubleRatchetState = serializeDoubleRatchetState;
// Clean up old skipped message keys to prevent memory bloat
const cleanupSkippedMessageKeys = (state, maxAge = 7 * 24 * 60 * 60 * 1000) => {
    const now = Date.now();
    const keysToDelete = [];
    // In a real implementation, you'd track the age of each skipped key
    // For now, just limit the total number
    if (state.skippedMessageKeys.size > MAX_SKIPPED_MESSAGE_KEYS * 0.8) {
        const keys = Array.from(state.skippedMessageKeys.keys());
        const deleteCount = state.skippedMessageKeys.size - MAX_SKIPPED_MESSAGE_KEYS / 2;
        for (let i = 0; i < deleteCount; i++) {
            keysToDelete.push(keys[i]);
        }
    }
    keysToDelete.forEach((key) => {
        state.skippedMessageKeys.delete(key);
    });
    if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${keysToDelete.length} old skipped message keys`);
    }
};
exports.cleanupSkippedMessageKeys = cleanupSkippedMessageKeys;
// Demonstrate Double Ratchet conversation
const demonstrateDoubleRatchet = async () => {
    try {
        console.log("🚀 Starting Double Ratchet demonstration...");
        // Initialize X3DH for shared secret
        const { initializeSignalUser, getSignalPublicKeyBundle, performSignalX3DHKeyExchange, } = await Promise.resolve().then(() => __importStar(require("./signal-protocol")));
        const alice = await initializeSignalUser("Alice");
        const bob = await initializeSignalUser("Bob");
        const bobBundle = await getSignalPublicKeyBundle(bob);
        const exchangeResult = await performSignalX3DHKeyExchange(alice, bobBundle);
        // Initialize Double Ratchet states
        // Alice starts as initiator, Bob as responder - both start fresh
        const aliceState = await (0, exports.initializeDoubleRatchet)(exchangeResult.masterSecret, true);
        const bobState = await (0, exports.initializeDoubleRatchet)(exchangeResult.masterSecret, false);
        console.log("📊 Double Ratchet states initialized");
        // Simulate conversation
        const conversation = [];
        // Alice sends first message
        const msg1 = await (0, exports.doubleRatchetEncrypt)(aliceState, "Hello Bob! This is our first Double Ratchet message! 🔒");
        conversation.push({ from: "Alice", envelope: msg1 });
        const decrypted1 = await (0, exports.doubleRatchetDecrypt)(bobState, msg1);
        console.log(`Bob decrypted: "${decrypted1}"`);
        // Bob replies (he now has sending chain from DH ratchet)
        const msg2 = await (0, exports.doubleRatchetEncrypt)(bobState, "Hi Alice! The Double Ratchet is working perfectly! 🎉");
        conversation.push({ from: "Bob", envelope: msg2 });
        const decrypted2 = await (0, exports.doubleRatchetDecrypt)(aliceState, msg2);
        console.log(`Alice decrypted: "${decrypted2}"`);
        console.log("✅ Double Ratchet basic exchange completed successfully");
        const result = {
            success: true,
            aliceState: await (0, exports.serializeDoubleRatchetState)(aliceState),
            bobState: await (0, exports.serializeDoubleRatchetState)(bobState),
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
    }
    catch (error) {
        console.error("❌ Double Ratchet demonstration failed:", error);
        throw error;
    }
};
exports.demonstrateDoubleRatchet = demonstrateDoubleRatchet;
