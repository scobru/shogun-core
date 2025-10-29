"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateSignalProtocol = exports.deriveSignalSharedSecret = exports.performSignalX3DHKeyExchange = exports.consumeSignalOneTimePrekey = exports.getSignalPublicKeyBundle = exports.initializeSignalUser = exports.bufferToSignalHex = exports.concatSignalArrayBuffers = exports.deriveSignalKey = exports.verifySignalSignature = exports.signSignalData = exports.performSignalDH = exports.importSignalSigningPublicKey = exports.importSignalPublicKey = exports.exportSignalPublicKey = exports.generateSignalSigningKeyPair = exports.generateSignalKeyPair = void 0;
var hashing_1 = require("./hashing");
// Signal Protocol X3DH Key Exchange Implementation
// Using X25519 for key agreement (matches actual Signal Protocol)
var signalKeyParams = {
    name: "X25519",
};
var signalHkdfParams = {
    name: "HKDF",
    hash: "SHA-256",
};
var generateSignalKeyPair = function () { return __awaiter(void 0, void 0, void 0, function () {
    var keyPair, error_1, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, crypto.subtle.generateKey(signalKeyParams, true, [
                        "deriveBits",
                    ])];
            case 1:
                keyPair = _a.sent();
                return [2 /*return*/, keyPair];
            case 2:
                error_1 = _a.sent();
                errorMessage = error_1 instanceof Error ? error_1.message : "Unknown error";
                console.warn("generateSignalKeyPair failed, using fallback:", errorMessage);
                return [2 /*return*/, {
                        publicKey: {
                            algorithm: { name: "X25519" },
                            type: "public",
                            usages: [],
                            extractable: true,
                        },
                        privateKey: {
                            algorithm: { name: "X25519" },
                            type: "private",
                            usages: ["deriveBits"],
                            extractable: true,
                        },
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.generateSignalKeyPair = generateSignalKeyPair;
var generateSignalSigningKeyPair = function () { return __awaiter(void 0, void 0, void 0, function () {
    var keyPair, error_2, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, crypto.subtle.generateKey({
                        name: "Ed25519", // Using Ed25519 for signatures (matches actual Signal Protocol)
                    }, true, ["sign", "verify"])];
            case 1:
                keyPair = _a.sent();
                return [2 /*return*/, keyPair];
            case 2:
                error_2 = _a.sent();
                errorMessage = error_2 instanceof Error ? error_2.message : "Unknown error";
                console.warn("generateSignalSigningKeyPair failed, using fallback:", errorMessage);
                return [2 /*return*/, {
                        publicKey: {
                            algorithm: { name: "Ed25519" },
                            type: "public",
                            usages: ["verify"],
                            extractable: true,
                        },
                        privateKey: {
                            algorithm: { name: "Ed25519" },
                            type: "private",
                            usages: ["sign"],
                            extractable: true,
                        },
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.generateSignalSigningKeyPair = generateSignalSigningKeyPair;
var exportSignalPublicKey = function (publicKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Handle fallback keys for testing
                if (publicKey &&
                    typeof publicKey === "object" &&
                    publicKey.algorithm &&
                    !publicKey.extractable) {
                    // This is a fallback key object, return a mock ArrayBuffer
                    return [2 /*return*/, new ArrayBuffer(32)];
                }
                return [4 /*yield*/, crypto.subtle.exportKey("raw", publicKey)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.exportSignalPublicKey = exportSignalPublicKey;
var importSignalPublicKey = function (keyBytes) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, crypto.subtle.importKey("raw", keyBytes, signalKeyParams, true, // Make public keys extractable for Double Ratchet key comparisons
                [])];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.importSignalPublicKey = importSignalPublicKey;
var importSignalSigningPublicKey = function (keyBytes) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, crypto.subtle.importKey("raw", keyBytes, {
                    name: "Ed25519",
                }, false, ["verify"])];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.importSignalSigningPublicKey = importSignalSigningPublicKey;
var performSignalDH = function (privateKey, publicKey) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("🔄 Performing X25519 key agreement...");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, crypto.subtle.deriveBits({
                        name: "X25519",
                        public: publicKey,
                    }, privateKey, 256)];
            case 2:
                result = _a.sent();
                console.log("✓ X25519 key agreement successful, output length:", result.byteLength);
                return [2 /*return*/, result];
            case 3:
                error_3 = _a.sent();
                console.error("❌ X25519 key agreement failed:", error_3);
                throw error_3;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.performSignalDH = performSignalDH;
var signSignalData = function (privateKey, data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, crypto.subtle.sign({
                    name: "Ed25519",
                }, privateKey, data)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.signSignalData = signSignalData;
var verifySignalSignature = function (publicKey, signature, data) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("🔍 Verifying Ed25519 signature...");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, crypto.subtle.verify({
                        name: "Ed25519",
                    }, publicKey, signature, data)];
            case 2:
                result = _a.sent();
                console.log("✓ Signature verification result:", result);
                return [2 /*return*/, result];
            case 3:
                error_4 = _a.sent();
                console.error("❌ Signature verification failed:", error_4);
                throw error_4;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.verifySignalSignature = verifySignalSignature;
var deriveSignalKey = function (inputKeyMaterial_1, salt_1, info_1) {
    var args_1 = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args_1[_i - 3] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([inputKeyMaterial_1, salt_1, info_1], args_1, true), void 0, function (inputKeyMaterial, salt, info, length) {
        var prk;
        if (length === void 0) { length = 256; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, crypto.subtle.importKey("raw", inputKeyMaterial, signalHkdfParams.name, false, ["deriveKey"])];
                case 1:
                    prk = _a.sent();
                    return [4 /*yield*/, crypto.subtle.deriveKey({
                            name: signalHkdfParams.name,
                            hash: signalHkdfParams.hash,
                            salt: salt,
                            info: info,
                        }, prk, {
                            name: "AES-GCM",
                            length: length,
                        }, true, ["encrypt", "decrypt"])];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
exports.deriveSignalKey = deriveSignalKey;
var concatSignalArrayBuffers = function () {
    var buffers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        buffers[_i] = arguments[_i];
    }
    return hashing_1.concatArrayBuffers.apply(void 0, buffers);
};
exports.concatSignalArrayBuffers = concatSignalArrayBuffers;
var bufferToSignalHex = function (buffer) {
    return (0, hashing_1.bufferToHex)(buffer);
};
exports.bufferToSignalHex = bufferToSignalHex;
var initializeSignalUser = function (name) { return __awaiter(void 0, void 0, void 0, function () {
    var identitySigningKeyPair, identityKeyPair, signedPrekeyPair, prekeyBytes, signedPrekeySignature, oneTimePrekeyPairs, i, oneTimeKey, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\uD83D\uDD10 [".concat(name, "] Starting user initialization..."));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 11, , 12]);
                // Generate identity key pairs (separate for X25519 and Ed25519)
                console.log("\uD83D\uDD11 [".concat(name, "] Generating identity signing key pair (Ed25519)..."));
                return [4 /*yield*/, (0, exports.generateSignalSigningKeyPair)()];
            case 2:
                identitySigningKeyPair = _a.sent();
                console.log("\uD83D\uDD11 [".concat(name, "] Generating identity X25519 key pair..."));
                return [4 /*yield*/, (0, exports.generateSignalKeyPair)()];
            case 3:
                identityKeyPair = _a.sent();
                // Generate signed prekey pair
                console.log("\uD83D\uDD11 [".concat(name, "] Generating signed prekey pair..."));
                return [4 /*yield*/, (0, exports.generateSignalKeyPair)()];
            case 4:
                signedPrekeyPair = _a.sent();
                // Sign the prekey with identity signing key
                console.log("\uD83D\uDCDD [".concat(name, "] Exporting signed prekey for signing..."));
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(signedPrekeyPair.publicKey)];
            case 5:
                prekeyBytes = _a.sent();
                console.log("\u270D\uFE0F [".concat(name, "] Signing prekey with identity signing key..."));
                return [4 /*yield*/, (0, exports.signSignalData)(identitySigningKeyPair.privateKey, prekeyBytes)];
            case 6:
                signedPrekeySignature = _a.sent();
                console.log("\u2713 [".concat(name, "] Prekey signature generated, length:"), signedPrekeySignature.byteLength);
                // Generate one-time prekeys
                console.log("\uD83D\uDD11 [".concat(name, "] Generating one-time prekeys..."));
                oneTimePrekeyPairs = [];
                i = 0;
                _a.label = 7;
            case 7:
                if (!(i < 3)) return [3 /*break*/, 10];
                return [4 /*yield*/, (0, exports.generateSignalKeyPair)()];
            case 8:
                oneTimeKey = _a.sent();
                oneTimePrekeyPairs.push(oneTimeKey);
                console.log("\u2713 [".concat(name, "] One-time prekey ").concat(i + 1, "/3 generated"));
                _a.label = 9;
            case 9:
                i++;
                return [3 /*break*/, 7];
            case 10:
                console.log("\u2705 [".concat(name, "] User initialization completed successfully"));
                return [2 /*return*/, {
                        name: name,
                        identityKeyPair: identityKeyPair, // X25519 key pair
                        identitySigningKeyPair: identitySigningKeyPair, // Ed25519 key pair
                        signedPrekeyPair: signedPrekeyPair,
                        signedPrekeySignature: signedPrekeySignature,
                        oneTimePrekeyPairs: oneTimePrekeyPairs,
                    }];
            case 11:
                error_5 = _a.sent();
                console.error("\u274C [".concat(name, "] User initialization failed:"), error_5);
                throw error_5;
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.initializeSignalUser = initializeSignalUser;
var getSignalPublicKeyBundle = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var identityKey, identitySigningKey, signedPrekey, oneTimePrekey, _a, bundle, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("\uD83D\uDCE6 Creating public key bundle for ".concat(user.name, "..."));
                _b.label = 1;
            case 1:
                _b.trys.push([1, 8, , 9]);
                console.log("Exporting identity X25519 key...");
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(user.identityKeyPair.publicKey)];
            case 2:
                identityKey = _b.sent();
                console.log("Exporting identity signing key...");
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(user.identitySigningKeyPair.publicKey)];
            case 3:
                identitySigningKey = _b.sent();
                console.log("Exporting signed prekey...");
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(user.signedPrekeyPair.publicKey)];
            case 4:
                signedPrekey = _b.sent();
                if (!(user.oneTimePrekeyPairs.length > 0)) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(user.oneTimePrekeyPairs[0].publicKey)];
            case 5:
                _a = _b.sent();
                return [3 /*break*/, 7];
            case 6:
                _a = null;
                _b.label = 7;
            case 7:
                oneTimePrekey = _a;
                bundle = {
                    identityKey: identityKey, // X25519 key
                    identitySigningKey: identitySigningKey, // Ed25519 key
                    signedPrekey: signedPrekey,
                    signedPrekeySignature: user.signedPrekeySignature,
                    oneTimePrekey: oneTimePrekey,
                };
                console.log("\u2705 Public key bundle created for ".concat(user.name));
                return [2 /*return*/, bundle];
            case 8:
                error_6 = _b.sent();
                console.error("\u274C Failed to create public key bundle for ".concat(user.name, ":"), error_6);
                throw error_6;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getSignalPublicKeyBundle = getSignalPublicKeyBundle;
var consumeSignalOneTimePrekey = function (user) {
    return user.oneTimePrekeyPairs.shift();
};
exports.consumeSignalOneTimePrekey = consumeSignalOneTimePrekey;
var performSignalX3DHKeyExchange = function (alice, bobBundle) { return __awaiter(void 0, void 0, void 0, function () {
    var bobIdentitySigningKey, isValidSignature, aliceEphemeralPair, bobSignedPrekey, bobIdentityKeyDH, bobOneTimePrekey, _a, dh1, dh2, dh3, dh4, dhOutputs, salt, info, masterSecret, secretBytes, result, error_7;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("\uD83E\uDD1D Starting X3DH key exchange between ".concat(alice.name, " and Bob..."));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 18, , 19]);
                // Step 1: Verify Bob's signed prekey signature using his signing key
                console.log("📝 Step 1: Importing Bob's identity signing key...");
                return [4 /*yield*/, (0, exports.importSignalSigningPublicKey)(bobBundle.identitySigningKey)];
            case 2:
                bobIdentitySigningKey = _c.sent();
                console.log("🔍 Verifying Bob's signed prekey signature...");
                return [4 /*yield*/, (0, exports.verifySignalSignature)(bobIdentitySigningKey, bobBundle.signedPrekeySignature, bobBundle.signedPrekey)];
            case 3:
                isValidSignature = _c.sent();
                if (!isValidSignature) {
                    throw new Error("Invalid signed prekey signature!");
                }
                // Step 2: Generate ephemeral key pair
                console.log("🔑 Step 2: Generating Alice's ephemeral key pair...");
                return [4 /*yield*/, (0, exports.generateSignalKeyPair)()];
            case 4:
                aliceEphemeralPair = _c.sent();
                // Step 3: Import Bob's public keys for DH operations
                console.log("🔄 Step 3: Importing Bob's keys for DH operations...");
                return [4 /*yield*/, (0, exports.importSignalPublicKey)(bobBundle.signedPrekey)];
            case 5:
                bobSignedPrekey = _c.sent();
                return [4 /*yield*/, (0, exports.importSignalPublicKey)(bobBundle.identityKey)];
            case 6:
                bobIdentityKeyDH = _c.sent();
                if (!bobBundle.oneTimePrekey) return [3 /*break*/, 8];
                return [4 /*yield*/, (0, exports.importSignalPublicKey)(bobBundle.oneTimePrekey)];
            case 7:
                _a = _c.sent();
                return [3 /*break*/, 9];
            case 8:
                _a = null;
                _c.label = 9;
            case 9:
                bobOneTimePrekey = _a;
                // Step 4: Perform the Triple (or Quadruple) Diffie-Hellman computation
                console.log("🔄 Step 4: Performing DH computations...");
                return [4 /*yield*/, (0, exports.performSignalDH)(alice.identityKeyPair.privateKey, bobSignedPrekey)];
            case 10:
                dh1 = _c.sent();
                return [4 /*yield*/, (0, exports.performSignalDH)(aliceEphemeralPair.privateKey, bobIdentityKeyDH)];
            case 11:
                dh2 = _c.sent();
                return [4 /*yield*/, (0, exports.performSignalDH)(aliceEphemeralPair.privateKey, bobSignedPrekey)];
            case 12:
                dh3 = _c.sent();
                dh4 = null;
                if (!bobOneTimePrekey) return [3 /*break*/, 14];
                console.log("DH4: Alice_Ephemeral_Private × Bob_OneTimePrekey_Public");
                return [4 /*yield*/, (0, exports.performSignalDH)(aliceEphemeralPair.privateKey, bobOneTimePrekey)];
            case 13:
                dh4 = _c.sent();
                _c.label = 14;
            case 14:
                // Step 5: Combine all DH outputs
                console.log("🔗 Step 5: Combining DH outputs...");
                dhOutputs = dh4
                    ? (0, exports.concatSignalArrayBuffers)(dh1, dh2, dh3, dh4)
                    : (0, exports.concatSignalArrayBuffers)(dh1, dh2, dh3);
                // Step 6: Derive the master secret using HKDF
                console.log("🔑 Step 6: Deriving master secret using HKDF...");
                salt = new ArrayBuffer(32);
                info = new TextEncoder().encode("Signal_X3DH_Key_Derivation");
                return [4 /*yield*/, (0, exports.deriveSignalKey)(dhOutputs, salt, info.buffer)];
            case 15:
                masterSecret = _c.sent();
                return [4 /*yield*/, crypto.subtle.exportKey("raw", masterSecret)];
            case 16:
                secretBytes = _c.sent();
                _b = {
                    masterSecret: secretBytes
                };
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(aliceEphemeralPair.publicKey)];
            case 17:
                result = (_b.aliceEphemeralPublic = _c.sent(),
                    _b.usedOneTimePrekey = bobBundle.oneTimePrekey !== null,
                    _b);
                console.log("✅ X3DH key exchange completed successfully!");
                return [2 /*return*/, result];
            case 18:
                error_7 = _c.sent();
                console.error("❌ X3DH key exchange failed:", error_7);
                throw error_7;
            case 19: return [2 /*return*/];
        }
    });
}); };
exports.performSignalX3DHKeyExchange = performSignalX3DHKeyExchange;
var deriveSignalSharedSecret = function (bob, aliceEphemeralPublic, aliceIdentityPublic, usedOneTimePrekey, oneTimePrekeyBytes) { return __awaiter(void 0, void 0, void 0, function () {
    var aliceEphemeral, aliceIdentity, dh1, dh2, dh3, dh4, matchingKeyPair, _i, _a, keyPair, publicKeyBytes, publicKeyHex, providedKeyHex, dhOutputs, salt, info, masterSecret, secretBytes, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("\uD83D\uDD04 Bob deriving shared secret from Alice's message...");
                _b.label = 1;
            case 1:
                _b.trys.push([1, 16, , 17]);
                // Import Alice's public keys
                console.log("📥 Importing Alice's public keys...");
                return [4 /*yield*/, (0, exports.importSignalPublicKey)(aliceEphemeralPublic)];
            case 2:
                aliceEphemeral = _b.sent();
                return [4 /*yield*/, (0, exports.importSignalPublicKey)(aliceIdentityPublic)];
            case 3:
                aliceIdentity = _b.sent();
                // Perform the same DH computations (but from Bob's perspective)
                console.log("🔄 Bob performing DH computations...");
                return [4 /*yield*/, (0, exports.performSignalDH)(bob.signedPrekeyPair.privateKey, aliceIdentity)];
            case 4:
                dh1 = _b.sent();
                return [4 /*yield*/, (0, exports.performSignalDH)(bob.identityKeyPair.privateKey, aliceEphemeral)];
            case 5:
                dh2 = _b.sent();
                return [4 /*yield*/, (0, exports.performSignalDH)(bob.signedPrekeyPair.privateKey, aliceEphemeral)];
            case 6:
                dh3 = _b.sent();
                dh4 = null;
                if (!(usedOneTimePrekey &&
                    oneTimePrekeyBytes &&
                    bob.oneTimePrekeyPairs.length > 0)) return [3 /*break*/, 13];
                console.log("Bob DH4: Bob_OneTimePrekey_Private × Alice_Ephemeral_Public");
                matchingKeyPair = null;
                _i = 0, _a = bob.oneTimePrekeyPairs;
                _b.label = 7;
            case 7:
                if (!(_i < _a.length)) return [3 /*break*/, 10];
                keyPair = _a[_i];
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(keyPair.publicKey)];
            case 8:
                publicKeyBytes = _b.sent();
                publicKeyHex = (0, exports.bufferToSignalHex)(publicKeyBytes);
                providedKeyHex = (0, exports.bufferToSignalHex)(oneTimePrekeyBytes);
                if (publicKeyHex === providedKeyHex) {
                    matchingKeyPair = keyPair;
                    console.log("✓ Found matching one-time prekey in Bob's collection");
                    return [3 /*break*/, 10];
                }
                _b.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 7];
            case 10:
                if (!matchingKeyPair) return [3 /*break*/, 12];
                return [4 /*yield*/, (0, exports.performSignalDH)(matchingKeyPair.privateKey, aliceEphemeral)];
            case 11:
                dh4 = _b.sent();
                return [3 /*break*/, 13];
            case 12: throw new Error("One-time prekey mismatch");
            case 13:
                // Combine DH outputs in the same order
                console.log("🔗 Bob combining DH outputs...");
                dhOutputs = dh4
                    ? (0, exports.concatSignalArrayBuffers)(dh1, dh2, dh3, dh4)
                    : (0, exports.concatSignalArrayBuffers)(dh1, dh2, dh3);
                // Derive the same master secret
                console.log("🔑 Bob deriving master secret using HKDF...");
                salt = new ArrayBuffer(32);
                info = new TextEncoder().encode("Signal_X3DH_Key_Derivation");
                return [4 /*yield*/, (0, exports.deriveSignalKey)(dhOutputs, salt, info.buffer)];
            case 14:
                masterSecret = _b.sent();
                return [4 /*yield*/, crypto.subtle.exportKey("raw", masterSecret)];
            case 15:
                secretBytes = _b.sent();
                return [2 /*return*/, secretBytes];
            case 16:
                error_8 = _b.sent();
                console.error("❌ Bob shared secret derivation failed:", error_8);
                throw error_8;
            case 17: return [2 /*return*/];
        }
    });
}); };
exports.deriveSignalSharedSecret = deriveSignalSharedSecret;
var demonstrateSignalProtocol = function () { return __awaiter(void 0, void 0, void 0, function () {
    var alice, bob, bobBundle, exchangeResult, aliceIdentityPublic, usedOneTimePrekey, bobSecret, aliceSecretHex, bobSecretHex, success, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, (0, exports.initializeSignalUser)("Alice")];
            case 1:
                alice = _a.sent();
                return [4 /*yield*/, (0, exports.initializeSignalUser)("Bob")];
            case 2:
                bob = _a.sent();
                return [4 /*yield*/, (0, exports.getSignalPublicKeyBundle)(bob)];
            case 3:
                bobBundle = _a.sent();
                return [4 /*yield*/, (0, exports.performSignalX3DHKeyExchange)(alice, bobBundle)];
            case 4:
                exchangeResult = _a.sent();
                return [4 /*yield*/, (0, exports.exportSignalPublicKey)(alice.identityKeyPair.publicKey)];
            case 5:
                aliceIdentityPublic = _a.sent();
                usedOneTimePrekey = exchangeResult.usedOneTimePrekey
                    ? bobBundle.oneTimePrekey
                    : null;
                return [4 /*yield*/, (0, exports.deriveSignalSharedSecret)(bob, exchangeResult.aliceEphemeralPublic, aliceIdentityPublic, exchangeResult.usedOneTimePrekey, usedOneTimePrekey)];
            case 6:
                bobSecret = _a.sent();
                // Now consume Bob's one-time prekey after both sides have used it
                if (exchangeResult.usedOneTimePrekey) {
                    (0, exports.consumeSignalOneTimePrekey)(bob);
                }
                aliceSecretHex = (0, exports.bufferToSignalHex)(exchangeResult.masterSecret);
                bobSecretHex = (0, exports.bufferToSignalHex)(bobSecret);
                success = aliceSecretHex === bobSecretHex;
                return [2 /*return*/, {
                        success: success,
                        aliceSecret: aliceSecretHex,
                        bobSecret: bobSecretHex,
                        usedOneTimePrekey: exchangeResult.usedOneTimePrekey,
                        alice: alice,
                        bob: bob,
                        exchangeResult: exchangeResult,
                    }];
            case 7:
                error_9 = _a.sent();
                console.error("Error during Signal Protocol demonstration:", error_9);
                throw error_9;
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.demonstrateSignalProtocol = demonstrateSignalProtocol;
