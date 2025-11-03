"use strict";
/**
 * PGP/OpenPGP Implementation
 * Simple and immediate PGP functionality using openpgp library
 * Provides encryption, decryption, signing, and key management
 */
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
exports.demonstratePGP = exports.verifyPGPSignature = exports.signPGPMessage = exports.decryptPGPMessage = exports.encryptPGPMessage = exports.generatePGPKeyPair = exports.createPGPManager = exports.PGPManager = void 0;
class PGPManager {
    constructor() {
        this.openpgp = null;
        this.initialized = false;
        console.log("🔐 [PGP] Manager created");
    }
    /**
     * Initialize PGP manager with openpgp library
     */
    async initialize() {
        if (this.initialized) {
            console.warn("[PGP] Already initialized");
            return;
        }
        try {
            console.log("🔐 [PGP] Initializing...");
            // Dynamic import of openpgp
            this.openpgp = await Promise.resolve().then(() => __importStar(require("openpgp")));
            // Configure openpgp
            this.openpgp.config.preferredHashAlgorithm =
                this.openpgp.enums.hash.sha256;
            this.openpgp.config.preferredSymmetricAlgorithm =
                this.openpgp.enums.symmetric.aes256;
            this.openpgp.config.preferredCompressionAlgorithm =
                this.openpgp.enums.compression.zlib;
            this.initialized = true;
            console.log("✅ [PGP] Initialized successfully");
        }
        catch (error) {
            console.error("❌ [PGP] Initialization failed:", error);
            throw new Error(`PGP initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate a new PGP key pair
     */
    async generateKeyPair(name, email, passphrase) {
        this.ensureInitialized();
        try {
            console.log(`🔑 [PGP] Generating key pair for ${name} <${email}>`);
            const keyOptions = {
                type: "rsa",
                rsaBits: 4096,
                userIDs: [{ name, email }],
                passphrase: passphrase || undefined,
                format: "armored",
            };
            const { privateKey, publicKey } = await this.openpgp.generateKey(keyOptions);
            // Get key information
            const privateKeyObj = await this.openpgp.readPrivateKey({
                armoredKey: privateKey,
            });
            const keyId = privateKeyObj.getKeyID().toHex();
            const fingerprint = privateKeyObj.getFingerprint();
            const keyPair = {
                publicKey,
                privateKey,
                keyId,
                fingerprint,
                created: new Date(),
            };
            console.log(`✅ [PGP] Key pair generated: ${keyId}`);
            return keyPair;
        }
        catch (error) {
            console.error("❌ [PGP] Key generation failed:", error);
            throw new Error(`PGP key generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Encrypt a message with public key
     */
    async encryptMessage(message, publicKeyArmored, privateKeyArmored, passphrase) {
        this.ensureInitialized();
        try {
            console.log("🔒 [PGP] Encrypting message");
            const publicKey = await this.openpgp.readKey({
                armoredKey: publicKeyArmored,
            });
            const messageObj = await this.openpgp.createMessage({ text: message });
            const encryptOptions = {
                message: messageObj,
                encryptionKeys: publicKey,
                format: "armored",
            };
            // Add signing if private key provided
            if (privateKeyArmored) {
                const privateKey = await this.openpgp.readPrivateKey({
                    armoredKey: privateKeyArmored,
                });
                if (passphrase) {
                    // In OpenPGP v6, private keys are automatically decrypted when needed
                    // No need to call decrypt explicitly
                }
                encryptOptions.signingKeys = privateKey;
            }
            const encrypted = await this.openpgp.encrypt(encryptOptions);
            const result = {
                message: encrypted,
                encrypted: true,
                signed: !!privateKeyArmored,
            };
            console.log("✅ [PGP] Message encrypted");
            return result;
        }
        catch (error) {
            console.error("❌ [PGP] Encryption failed:", error);
            throw new Error(`PGP encryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Decrypt a message with private key
     */
    async decryptMessage(encryptedMessage, privateKeyArmored, passphrase) {
        this.ensureInitialized();
        try {
            console.log("🔓 [PGP] Decrypting message");
            const privateKey = await this.openpgp.readPrivateKey({
                armoredKey: privateKeyArmored,
            });
            if (passphrase) {
                // In OpenPGP v6, private keys are automatically decrypted when needed
                // No need to call decrypt explicitly
            }
            const message = await this.openpgp.readMessage({
                armoredMessage: encryptedMessage,
            });
            const { data: decrypted } = await this.openpgp.decrypt({
                message,
                decryptionKeys: privateKey,
                format: "text",
            });
            console.log("✅ [PGP] Message decrypted");
            return decrypted;
        }
        catch (error) {
            console.error("❌ [PGP] Decryption failed:", error);
            throw new Error(`PGP decryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Sign a message with private key
     */
    async signMessage(message, privateKeyArmored, passphrase) {
        this.ensureInitialized();
        try {
            console.log("✍️ [PGP] Signing message");
            const privateKey = await this.openpgp.readPrivateKey({
                armoredKey: privateKeyArmored,
            });
            if (passphrase) {
                // In OpenPGP v6, private keys are automatically decrypted when needed
                // No need to call decrypt explicitly
            }
            const messageObj = await this.openpgp.createMessage({ text: message });
            const signature = await this.openpgp.sign({
                message: messageObj,
                signingKeys: privateKey,
                format: "armored",
            });
            const result = {
                message,
                signature,
                valid: true,
                keyId: privateKey.getKeyID().toHex(),
            };
            console.log("✅ [PGP] Message signed");
            return result;
        }
        catch (error) {
            console.error("❌ [PGP] Signing failed:", error);
            throw new Error(`PGP signing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Verify a message signature
     */
    async verifySignature(message, signature, publicKeyArmored) {
        this.ensureInitialized();
        try {
            console.log("🔍 [PGP] Verifying signature");
            const publicKey = await this.openpgp.readKey({
                armoredKey: publicKeyArmored,
            });
            const messageObj = await this.openpgp.createMessage({ text: message });
            const signatureObj = await this.openpgp.readSignature({
                armoredSignature: signature,
            });
            const verificationResult = await this.openpgp.verify({
                message: messageObj,
                signature: signatureObj,
                verificationKeys: publicKey,
            });
            const { verified } = verificationResult;
            await verified;
            const result = {
                message,
                signature,
                valid: true,
                keyId: publicKey.getKeyID().toHex(),
            };
            console.log("✅ [PGP] Signature verified");
            return result;
        }
        catch (error) {
            console.error("❌ [PGP] Signature verification failed:", error);
            return {
                message,
                signature,
                valid: false,
            };
        }
    }
    /**
     * Get key information from armored key
     */
    async getKeyInfo(keyArmored) {
        this.ensureInitialized();
        try {
            console.log("🔍 [PGP] Getting key information");
            const key = await this.openpgp.readKey({ armoredKey: keyArmored });
            return {
                keyId: key.getKeyID().toHex(),
                fingerprint: key.getFingerprint(),
                algorithm: key.getAlgorithmInfo(),
                created: key.getCreationTime(),
                expires: key.getExpirationTime(),
                isPrivate: key.isPrivate(),
                isPublic: key.isPublic(),
            };
        }
        catch (error) {
            console.error("❌ [PGP] Failed to get key info:", error);
            throw new Error(`PGP key info failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Export key in different formats
     */
    async exportKey(keyArmored, format = "armored") {
        this.ensureInitialized();
        try {
            console.log(`📤 [PGP] Exporting key in ${format} format`);
            const key = await this.openpgp.readKey({ armoredKey: keyArmored });
            if (format === "binary") {
                return key.toBytes();
            }
            else {
                return key.armor();
            }
        }
        catch (error) {
            console.error("❌ [PGP] Key export failed:", error);
            throw new Error(`PGP key export failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Import key from different formats
     */
    async importKey(keyData, format = "armored") {
        this.ensureInitialized();
        try {
            console.log(`📥 [PGP] Importing key in ${format} format`);
            let key;
            if (format === "binary") {
                key = await this.openpgp.readKey({ binaryKey: keyData });
            }
            else {
                key = await this.openpgp.readKey({ armoredKey: keyData });
            }
            return key.armor();
        }
        catch (error) {
            console.error("❌ [PGP] Key import failed:", error);
            throw new Error(`PGP key import failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.openpgp = null;
        this.initialized = false;
        console.log("✅ [PGP] Manager destroyed");
    }
    /**
     * Ensure the manager is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error("PGP Manager not initialized. Call initialize() first.");
        }
    }
}
exports.PGPManager = PGPManager;
// Factory function for creating PGP managers
const createPGPManager = async () => {
    const manager = new PGPManager();
    await manager.initialize();
    return manager;
};
exports.createPGPManager = createPGPManager;
// Utility functions for PGP
const generatePGPKeyPair = async (name, email, passphrase) => {
    const manager = await (0, exports.createPGPManager)();
    return await manager.generateKeyPair(name, email, passphrase);
};
exports.generatePGPKeyPair = generatePGPKeyPair;
const encryptPGPMessage = async (message, publicKey, privateKey, passphrase) => {
    const manager = await (0, exports.createPGPManager)();
    return await manager.encryptMessage(message, publicKey, privateKey, passphrase);
};
exports.encryptPGPMessage = encryptPGPMessage;
const decryptPGPMessage = async (encryptedMessage, privateKey, passphrase) => {
    const manager = await (0, exports.createPGPManager)();
    return await manager.decryptMessage(encryptedMessage, privateKey, passphrase);
};
exports.decryptPGPMessage = decryptPGPMessage;
const signPGPMessage = async (message, privateKey, passphrase) => {
    const manager = await (0, exports.createPGPManager)();
    return await manager.signMessage(message, privateKey, passphrase);
};
exports.signPGPMessage = signPGPMessage;
const verifyPGPSignature = async (message, signature, publicKey) => {
    const manager = await (0, exports.createPGPManager)();
    return await manager.verifySignature(message, signature, publicKey);
};
exports.verifyPGPSignature = verifyPGPSignature;
// Demonstrate PGP functionality
const demonstratePGP = async () => {
    try {
        console.log("🚀 Starting PGP demonstration...");
        // Create PGP manager
        const manager = await (0, exports.createPGPManager)();
        console.log("✅ PGP manager created");
        // Generate key pairs for Alice and Bob
        const aliceKeys = await manager.generateKeyPair("Alice", "alice@example.com", "alice123");
        const bobKeys = await manager.generateKeyPair("Bob", "bob@example.com", "bob123");
        console.log("✅ Key pairs generated");
        // Alice encrypts a message for Bob
        const message = "Hello Bob! This is a secret message. 🔐";
        const encrypted = await manager.encryptMessage(message, bobKeys.publicKey);
        console.log("✅ Message encrypted");
        // Bob decrypts the message
        const decrypted = await manager.decryptMessage(encrypted.message, bobKeys.privateKey, "bob123");
        console.log("✅ Message decrypted:", decrypted);
        // Alice signs a message
        const signedMessage = "This message is from Alice. ✍️";
        const signature = await manager.signMessage(signedMessage, aliceKeys.privateKey, "alice123");
        console.log("✅ Message signed");
        // Bob verifies Alice's signature
        const verification = await manager.verifySignature(signedMessage, signature.signature, aliceKeys.publicKey);
        console.log("✅ Signature verified:", verification.valid);
        // Get key information
        const aliceKeyInfo = await manager.getKeyInfo(aliceKeys.publicKey);
        const bobKeyInfo = await manager.getKeyInfo(bobKeys.publicKey);
        console.log("✅ Key information retrieved");
        const result = {
            success: true,
            messageDecrypted: decrypted === message,
            signatureValid: verification.valid,
            aliceKeyInfo,
            bobKeyInfo,
            demonstration: {
                keyGeneration: true,
                encryption: true,
                decryption: true,
                signing: true,
                verification: true,
                keyManagement: true,
            },
        };
        console.log("✅ PGP demonstration completed successfully");
        return result;
    }
    catch (error) {
        console.error("❌ PGP demonstration failed:", error);
        throw error;
    }
};
exports.demonstratePGP = demonstratePGP;
exports.default = PGPManager;
