"use strict";
/**
 * PGP/OpenPGP Implementation
 * Simple and immediate PGP functionality using openpgp library
 * Provides encryption, decryption, signing, and key management
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstratePGP = exports.verifyPGPSignature = exports.signPGPMessage = exports.decryptPGPMessage = exports.encryptPGPMessage = exports.generatePGPKeyPair = exports.createPGPManager = exports.PGPManager = void 0;
var PGPManager = /** @class */ (function () {
    function PGPManager() {
        this.openpgp = null;
        this.initialized = false;
        console.log("🔐 [PGP] Manager created");
    }
    /**
     * Initialize PGP manager with openpgp library
     */
    PGPManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.initialized) {
                            console.warn("[PGP] Already initialized");
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log("🔐 [PGP] Initializing...");
                        // Dynamic import of openpgp
                        _a = this;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("openpgp"); })];
                    case 2:
                        // Dynamic import of openpgp
                        _a.openpgp = _b.sent();
                        // Configure openpgp
                        this.openpgp.config.preferredHashAlgorithm =
                            this.openpgp.enums.hash.sha256;
                        this.openpgp.config.preferredSymmetricAlgorithm =
                            this.openpgp.enums.symmetric.aes256;
                        this.openpgp.config.preferredCompressionAlgorithm =
                            this.openpgp.enums.compression.zlib;
                        this.initialized = true;
                        console.log("✅ [PGP] Initialized successfully");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error("❌ [PGP] Initialization failed:", error_1);
                        throw new Error("PGP initialization failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a new PGP key pair
     */
    PGPManager.prototype.generateKeyPair = function (name, email, passphrase) {
        return __awaiter(this, void 0, void 0, function () {
            var keyOptions, _a, privateKey, publicKey, privateKeyObj, keyId, fingerprint, keyPair, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.ensureInitialized();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        console.log("\uD83D\uDD11 [PGP] Generating key pair for ".concat(name, " <").concat(email, ">"));
                        keyOptions = {
                            type: "rsa",
                            rsaBits: 4096,
                            userIDs: [{ name: name, email: email }],
                            passphrase: passphrase || undefined,
                            format: "armored",
                        };
                        return [4 /*yield*/, this.openpgp.generateKey(keyOptions)];
                    case 2:
                        _a = _b.sent(), privateKey = _a.privateKey, publicKey = _a.publicKey;
                        return [4 /*yield*/, this.openpgp.readPrivateKey({
                                armoredKey: privateKey,
                            })];
                    case 3:
                        privateKeyObj = _b.sent();
                        keyId = privateKeyObj.getKeyID().toHex();
                        fingerprint = privateKeyObj.getFingerprint();
                        keyPair = {
                            publicKey: publicKey,
                            privateKey: privateKey,
                            keyId: keyId,
                            fingerprint: fingerprint,
                            created: new Date(),
                        };
                        console.log("\u2705 [PGP] Key pair generated: ".concat(keyId));
                        return [2 /*return*/, keyPair];
                    case 4:
                        error_2 = _b.sent();
                        console.error("❌ [PGP] Key generation failed:", error_2);
                        throw new Error("PGP key generation failed: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encrypt a message with public key
     */
    PGPManager.prototype.encryptMessage = function (message, publicKeyArmored, privateKeyArmored, passphrase) {
        return __awaiter(this, void 0, void 0, function () {
            var publicKey, messageObj, encryptOptions, privateKey, encrypted, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        console.log("🔒 [PGP] Encrypting message");
                        return [4 /*yield*/, this.openpgp.readKey({
                                armoredKey: publicKeyArmored,
                            })];
                    case 2:
                        publicKey = _a.sent();
                        return [4 /*yield*/, this.openpgp.createMessage({ text: message })];
                    case 3:
                        messageObj = _a.sent();
                        encryptOptions = {
                            message: messageObj,
                            encryptionKeys: publicKey,
                            format: "armored",
                        };
                        if (!privateKeyArmored) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.openpgp.readPrivateKey({
                                armoredKey: privateKeyArmored,
                            })];
                    case 4:
                        privateKey = _a.sent();
                        if (passphrase) {
                            // In OpenPGP v6, private keys are automatically decrypted when needed
                            // No need to call decrypt explicitly
                        }
                        encryptOptions.signingKeys = privateKey;
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.openpgp.encrypt(encryptOptions)];
                    case 6:
                        encrypted = _a.sent();
                        result = {
                            message: encrypted,
                            encrypted: true,
                            signed: !!privateKeyArmored,
                        };
                        console.log("✅ [PGP] Message encrypted");
                        return [2 /*return*/, result];
                    case 7:
                        error_3 = _a.sent();
                        console.error("❌ [PGP] Encryption failed:", error_3);
                        throw new Error("PGP encryption failed: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Decrypt a message with private key
     */
    PGPManager.prototype.decryptMessage = function (encryptedMessage, privateKeyArmored, passphrase) {
        return __awaiter(this, void 0, void 0, function () {
            var privateKey, message, decrypted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        console.log("🔓 [PGP] Decrypting message");
                        return [4 /*yield*/, this.openpgp.readPrivateKey({
                                armoredKey: privateKeyArmored,
                            })];
                    case 2:
                        privateKey = _a.sent();
                        if (passphrase) {
                            // In OpenPGP v6, private keys are automatically decrypted when needed
                            // No need to call decrypt explicitly
                        }
                        return [4 /*yield*/, this.openpgp.readMessage({
                                armoredMessage: encryptedMessage,
                            })];
                    case 3:
                        message = _a.sent();
                        return [4 /*yield*/, this.openpgp.decrypt({
                                message: message,
                                decryptionKeys: privateKey,
                                format: "text",
                            })];
                    case 4:
                        decrypted = (_a.sent()).data;
                        console.log("✅ [PGP] Message decrypted");
                        return [2 /*return*/, decrypted];
                    case 5:
                        error_4 = _a.sent();
                        console.error("❌ [PGP] Decryption failed:", error_4);
                        throw new Error("PGP decryption failed: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sign a message with private key
     */
    PGPManager.prototype.signMessage = function (message, privateKeyArmored, passphrase) {
        return __awaiter(this, void 0, void 0, function () {
            var privateKey, messageObj, signature, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        console.log("✍️ [PGP] Signing message");
                        return [4 /*yield*/, this.openpgp.readPrivateKey({
                                armoredKey: privateKeyArmored,
                            })];
                    case 2:
                        privateKey = _a.sent();
                        if (passphrase) {
                            // In OpenPGP v6, private keys are automatically decrypted when needed
                            // No need to call decrypt explicitly
                        }
                        return [4 /*yield*/, this.openpgp.createMessage({ text: message })];
                    case 3:
                        messageObj = _a.sent();
                        return [4 /*yield*/, this.openpgp.sign({
                                message: messageObj,
                                signingKeys: privateKey,
                                format: "armored",
                            })];
                    case 4:
                        signature = _a.sent();
                        result = {
                            message: message,
                            signature: signature,
                            valid: true,
                            keyId: privateKey.getKeyID().toHex(),
                        };
                        console.log("✅ [PGP] Message signed");
                        return [2 /*return*/, result];
                    case 5:
                        error_5 = _a.sent();
                        console.error("❌ [PGP] Signing failed:", error_5);
                        throw new Error("PGP signing failed: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify a message signature
     */
    PGPManager.prototype.verifySignature = function (message, signature, publicKeyArmored) {
        return __awaiter(this, void 0, void 0, function () {
            var publicKey, messageObj, signatureObj, verificationResult, verified, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        console.log("🔍 [PGP] Verifying signature");
                        return [4 /*yield*/, this.openpgp.readKey({
                                armoredKey: publicKeyArmored,
                            })];
                    case 2:
                        publicKey = _a.sent();
                        return [4 /*yield*/, this.openpgp.createMessage({ text: message })];
                    case 3:
                        messageObj = _a.sent();
                        return [4 /*yield*/, this.openpgp.readSignature({
                                armoredSignature: signature,
                            })];
                    case 4:
                        signatureObj = _a.sent();
                        return [4 /*yield*/, this.openpgp.verify({
                                message: messageObj,
                                signature: signatureObj,
                                verificationKeys: publicKey,
                            })];
                    case 5:
                        verificationResult = _a.sent();
                        verified = verificationResult.verified;
                        return [4 /*yield*/, verified];
                    case 6:
                        _a.sent();
                        result = {
                            message: message,
                            signature: signature,
                            valid: true,
                            keyId: publicKey.getKeyID().toHex(),
                        };
                        console.log("✅ [PGP] Signature verified");
                        return [2 /*return*/, result];
                    case 7:
                        error_6 = _a.sent();
                        console.error("❌ [PGP] Signature verification failed:", error_6);
                        return [2 /*return*/, {
                                message: message,
                                signature: signature,
                                valid: false,
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get key information from armored key
     */
    PGPManager.prototype.getKeyInfo = function (keyArmored) {
        return __awaiter(this, void 0, void 0, function () {
            var key, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("🔍 [PGP] Getting key information");
                        return [4 /*yield*/, this.openpgp.readKey({ armoredKey: keyArmored })];
                    case 2:
                        key = _a.sent();
                        return [2 /*return*/, {
                                keyId: key.getKeyID().toHex(),
                                fingerprint: key.getFingerprint(),
                                algorithm: key.getAlgorithmInfo(),
                                created: key.getCreationTime(),
                                expires: key.getExpirationTime(),
                                isPrivate: key.isPrivate(),
                                isPublic: key.isPublic(),
                            }];
                    case 3:
                        error_7 = _a.sent();
                        console.error("❌ [PGP] Failed to get key info:", error_7);
                        throw new Error("PGP key info failed: ".concat(error_7 instanceof Error ? error_7.message : String(error_7)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Export key in different formats
     */
    PGPManager.prototype.exportKey = function (keyArmored_1) {
        return __awaiter(this, arguments, void 0, function (keyArmored, format) {
            var key, error_8;
            if (format === void 0) { format = "armored"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("\uD83D\uDCE4 [PGP] Exporting key in ".concat(format, " format"));
                        return [4 /*yield*/, this.openpgp.readKey({ armoredKey: keyArmored })];
                    case 2:
                        key = _a.sent();
                        if (format === "binary") {
                            return [2 /*return*/, key.toBytes()];
                        }
                        else {
                            return [2 /*return*/, key.armor()];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        console.error("❌ [PGP] Key export failed:", error_8);
                        throw new Error("PGP key export failed: ".concat(error_8 instanceof Error ? error_8.message : String(error_8)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Import key from different formats
     */
    PGPManager.prototype.importKey = function (keyData_1) {
        return __awaiter(this, arguments, void 0, function (keyData, format) {
            var key, error_9;
            if (format === void 0) { format = "armored"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        console.log("\uD83D\uDCE5 [PGP] Importing key in ".concat(format, " format"));
                        key = void 0;
                        if (!(format === "binary")) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.openpgp.readKey({ binaryKey: keyData })];
                    case 2:
                        key = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.openpgp.readKey({ armoredKey: keyData })];
                    case 4:
                        key = _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, key.armor()];
                    case 6:
                        error_9 = _a.sent();
                        console.error("❌ [PGP] Key import failed:", error_9);
                        throw new Error("PGP key import failed: ".concat(error_9 instanceof Error ? error_9.message : String(error_9)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up resources
     */
    PGPManager.prototype.destroy = function () {
        this.openpgp = null;
        this.initialized = false;
        console.log("✅ [PGP] Manager destroyed");
    };
    /**
     * Ensure the manager is initialized
     */
    PGPManager.prototype.ensureInitialized = function () {
        if (!this.initialized) {
            throw new Error("PGP Manager not initialized. Call initialize() first.");
        }
    };
    return PGPManager;
}());
exports.PGPManager = PGPManager;
// Factory function for creating PGP managers
var createPGPManager = function () { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                manager = new PGPManager();
                return [4 /*yield*/, manager.initialize()];
            case 1:
                _a.sent();
                return [2 /*return*/, manager];
        }
    });
}); };
exports.createPGPManager = createPGPManager;
// Utility functions for PGP
var generatePGPKeyPair = function (name, email, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                return [4 /*yield*/, manager.generateKeyPair(name, email, passphrase)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.generatePGPKeyPair = generatePGPKeyPair;
var encryptPGPMessage = function (message, publicKey, privateKey, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                return [4 /*yield*/, manager.encryptMessage(message, publicKey, privateKey, passphrase)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.encryptPGPMessage = encryptPGPMessage;
var decryptPGPMessage = function (encryptedMessage, privateKey, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                return [4 /*yield*/, manager.decryptMessage(encryptedMessage, privateKey, passphrase)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.decryptPGPMessage = decryptPGPMessage;
var signPGPMessage = function (message, privateKey, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                return [4 /*yield*/, manager.signMessage(message, privateKey, passphrase)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.signPGPMessage = signPGPMessage;
var verifyPGPSignature = function (message, signature, publicKey) { return __awaiter(void 0, void 0, void 0, function () {
    var manager;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                return [4 /*yield*/, manager.verifySignature(message, signature, publicKey)];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.verifyPGPSignature = verifyPGPSignature;
// Demonstrate PGP functionality
var demonstratePGP = function () { return __awaiter(void 0, void 0, void 0, function () {
    var manager, aliceKeys, bobKeys, message, encrypted, decrypted, signedMessage, signature, verification, aliceKeyInfo, bobKeyInfo, result, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                console.log("🚀 Starting PGP demonstration...");
                return [4 /*yield*/, (0, exports.createPGPManager)()];
            case 1:
                manager = _a.sent();
                console.log("✅ PGP manager created");
                return [4 /*yield*/, manager.generateKeyPair("Alice", "alice@example.com", "alice123")];
            case 2:
                aliceKeys = _a.sent();
                return [4 /*yield*/, manager.generateKeyPair("Bob", "bob@example.com", "bob123")];
            case 3:
                bobKeys = _a.sent();
                console.log("✅ Key pairs generated");
                message = "Hello Bob! This is a secret message. 🔐";
                return [4 /*yield*/, manager.encryptMessage(message, bobKeys.publicKey)];
            case 4:
                encrypted = _a.sent();
                console.log("✅ Message encrypted");
                return [4 /*yield*/, manager.decryptMessage(encrypted.message, bobKeys.privateKey, "bob123")];
            case 5:
                decrypted = _a.sent();
                console.log("✅ Message decrypted:", decrypted);
                signedMessage = "This message is from Alice. ✍️";
                return [4 /*yield*/, manager.signMessage(signedMessage, aliceKeys.privateKey, "alice123")];
            case 6:
                signature = _a.sent();
                console.log("✅ Message signed");
                return [4 /*yield*/, manager.verifySignature(signedMessage, signature.signature, aliceKeys.publicKey)];
            case 7:
                verification = _a.sent();
                console.log("✅ Signature verified:", verification.valid);
                return [4 /*yield*/, manager.getKeyInfo(aliceKeys.publicKey)];
            case 8:
                aliceKeyInfo = _a.sent();
                return [4 /*yield*/, manager.getKeyInfo(bobKeys.publicKey)];
            case 9:
                bobKeyInfo = _a.sent();
                console.log("✅ Key information retrieved");
                result = {
                    success: true,
                    messageDecrypted: decrypted === message,
                    signatureValid: verification.valid,
                    aliceKeyInfo: aliceKeyInfo,
                    bobKeyInfo: bobKeyInfo,
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
                return [2 /*return*/, result];
            case 10:
                error_10 = _a.sent();
                console.error("❌ PGP demonstration failed:", error_10);
                throw error_10;
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.demonstratePGP = demonstratePGP;
exports.default = PGPManager;
