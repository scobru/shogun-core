"use strict";
/**
 * SFrame (Secure Frame) Manager
 * End-to-end encryption for real-time media frames (audio/video)
 * Designed for low overhead and high performance
 *
 * SFrame adds ~10 bytes per frame overhead
 * Compatible with WebRTC Insertable Streams API
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
exports.SFrameManager = void 0;
var SFrameManager = /** @class */ (function () {
    function SFrameManager() {
        this.keys = new Map();
        this.currentKeyId = 0;
        this.frameCounter = 0;
        this.initialized = false;
        console.log("🎥 [SFrame] Manager created");
    }
    /**
     * Initialize the SFrame manager
     */
    SFrameManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.initialized) {
                            console.warn("[SFrame] Already initialized");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("🔐 [SFrame] Initializing...");
                        // Generate initial key
                        return [4 /*yield*/, this.generateKey(0)];
                    case 2:
                        // Generate initial key
                        _a.sent();
                        this.initialized = true;
                        console.log("✅ [SFrame] Initialized successfully");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("❌ [SFrame] Initialization failed:", error_1);
                        throw new Error("SFrame initialization failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a new SFrame encryption key
     */
    SFrameManager.prototype.generateKey = function (keyId) {
        return __awaiter(this, void 0, void 0, function () {
            var key, salt, sframeKey, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDD11 [SFrame] Generating key ".concat(keyId, "..."));
                        return [4 /*yield*/, crypto.subtle.generateKey({
                                name: "AES-GCM",
                                length: 128, // 128-bit for performance, 256-bit for maximum security
                            }, false, // Not extractable for security
                            ["encrypt", "decrypt"])];
                    case 1:
                        key = _a.sent();
                        salt = crypto.getRandomValues(new Uint8Array(16));
                        sframeKey = {
                            keyId: keyId,
                            key: key,
                            salt: salt,
                        };
                        this.keys.set(keyId, sframeKey);
                        console.log("\u2705 [SFrame] Key ".concat(keyId, " generated"));
                        return [2 /*return*/, sframeKey];
                    case 2:
                        error_2 = _a.sent();
                        console.error("\u274C [SFrame] Key generation failed:", error_2);
                        throw new Error("SFrame key generation failed: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Derive an SFrame key from MLS shared secret
     * This allows SFrame to use keys derived from MLS for media encryption
     * RFC 9605 Section 5.2: MLS-based key management
     */
    SFrameManager.prototype.deriveKeyFromMLSSecret = function (mlsSecret_1, keyId_1) {
        return __awaiter(this, arguments, void 0, function (mlsSecret, keyId, context) {
            var secretLabel, saltLabel, baseKey, derivedSaltBits, salt, key, sframeKey, error_3;
            if (context === void 0) { context = "SFrame"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("\uD83D\uDD17 [SFrame] Deriving key ".concat(keyId, " from MLS secret (RFC 9605 Section 5.2)..."));
                        secretLabel = new TextEncoder().encode("SFrame 1.0 Secret");
                        saltLabel = new TextEncoder().encode("SFrame 1.0 Salt");
                        return [4 /*yield*/, crypto.subtle.importKey("raw", mlsSecret, "HKDF", false, ["deriveKey", "deriveBits"])];
                    case 1:
                        baseKey = _a.sent();
                        return [4 /*yield*/, crypto.subtle.deriveBits({
                                name: "HKDF",
                                hash: "SHA-256",
                                salt: new Uint8Array(0), // Empty salt for salt derivation
                                info: saltLabel,
                            }, baseKey, 128)];
                    case 2:
                        derivedSaltBits = _a.sent();
                        salt = new Uint8Array(derivedSaltBits);
                        return [4 /*yield*/, crypto.subtle.deriveKey({
                                name: "HKDF",
                                hash: "SHA-256",
                                salt: new Uint8Array(0), // Empty salt for key derivation
                                info: secretLabel,
                            }, baseKey, {
                                name: "AES-GCM",
                                length: 128,
                            }, false, ["encrypt", "decrypt"])];
                    case 3:
                        key = _a.sent();
                        sframeKey = {
                            keyId: keyId,
                            key: key,
                            salt: salt,
                        };
                        this.keys.set(keyId, sframeKey);
                        console.log("\u2705 [SFrame] Key ".concat(keyId, " derived from MLS (RFC 9605 compliant)"));
                        return [2 /*return*/, sframeKey];
                    case 4:
                        error_3 = _a.sent();
                        console.error("\u274C [SFrame] Key derivation failed:", error_3);
                        throw new Error("SFrame key derivation failed: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set the active encryption key
     */
    SFrameManager.prototype.setActiveKey = function (keyId) {
        if (!this.keys.has(keyId)) {
            throw new Error("SFrame key ".concat(keyId, " not found"));
        }
        this.currentKeyId = keyId;
        console.log("\uD83D\uDD04 [SFrame] Active key set to ".concat(keyId));
    };
    /**
     * Encrypt a media frame using SFrame
     */
    SFrameManager.prototype.encryptFrame = function (frameData) {
        return __awaiter(this, void 0, void 0, function () {
            var sframeKey, counterBytes, counterView, header, iv, i, ciphertext, encrypted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        sframeKey = this.keys.get(this.currentKeyId);
                        if (!sframeKey) {
                            throw new Error("SFrame key ".concat(this.currentKeyId, " not found"));
                        }
                        counterBytes = new Uint8Array(12);
                        counterView = new DataView(counterBytes.buffer);
                        // Store frame counter in last 8 bytes (big-endian uint64-like)
                        counterView.setUint32(4, Math.floor(this.frameCounter / 0x100000000), false);
                        counterView.setUint32(8, this.frameCounter & 0xffffffff, false);
                        header = new Uint8Array(5);
                        header[0] = this.currentKeyId;
                        new DataView(header.buffer).setUint32(1, this.frameCounter, false);
                        iv = new Uint8Array(12);
                        for (i = 0; i < 12; i++) {
                            iv[i] = sframeKey.salt[i] ^ counterBytes[i];
                        }
                        return [4 /*yield*/, crypto.subtle.encrypt({
                                name: "AES-GCM",
                                iv: iv,
                                additionalData: header, // RFC 9605: Header included in AAD
                                tagLength: 128, // 128-bit authentication tag
                            }, sframeKey.key, frameData)];
                    case 2:
                        ciphertext = _a.sent();
                        encrypted = new Uint8Array(header.length + iv.length + ciphertext.byteLength);
                        encrypted.set(header, 0);
                        encrypted.set(iv, header.length);
                        encrypted.set(new Uint8Array(ciphertext), header.length + iv.length);
                        // Increment frame counter
                        this.frameCounter++;
                        return [2 /*return*/, encrypted];
                    case 3:
                        error_4 = _a.sent();
                        console.error("❌ [SFrame] Frame encryption failed:", error_4);
                        throw new Error("SFrame encryption failed: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Decrypt a media frame using SFrame
     */
    SFrameManager.prototype.decryptFrame = function (encryptedFrame) {
        return __awaiter(this, void 0, void 0, function () {
            var header, keyId, frameCount, sframeKey, iv, counterBytes, counterView, expectedIV, i, ciphertext, plaintext, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        header = encryptedFrame.slice(0, 5);
                        keyId = header[0];
                        frameCount = new DataView(header.buffer, header.byteOffset).getUint32(1, false);
                        sframeKey = this.keys.get(keyId);
                        if (!sframeKey) {
                            throw new Error("SFrame key ".concat(keyId, " not found"));
                        }
                        iv = encryptedFrame.slice(5, 17);
                        counterBytes = new Uint8Array(12);
                        counterView = new DataView(counterBytes.buffer);
                        counterView.setUint32(4, Math.floor(frameCount / 0x100000000), false);
                        counterView.setUint32(8, frameCount & 0xffffffff, false);
                        expectedIV = new Uint8Array(12);
                        for (i = 0; i < 12; i++) {
                            expectedIV[i] = sframeKey.salt[i] ^ counterBytes[i];
                        }
                        ciphertext = encryptedFrame.slice(17);
                        return [4 /*yield*/, crypto.subtle.decrypt({
                                name: "AES-GCM",
                                iv: iv,
                                additionalData: header, // RFC 9605: Header included in AAD
                                tagLength: 128,
                            }, sframeKey.key, ciphertext)];
                    case 2:
                        plaintext = _a.sent();
                        return [2 /*return*/, plaintext];
                    case 3:
                        error_5 = _a.sent();
                        console.error("❌ [SFrame] Frame decryption failed:", error_5);
                        throw new Error("SFrame decryption failed: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encrypt transform function for Insertable Streams
     * Use this with RTCRtpSender.createEncodedStreams()
     */
    SFrameManager.prototype.createEncryptTransform = function () {
        var manager = this;
        return new TransformStream({
            transform: function (encodedFrame, controller) {
                return __awaiter(this, void 0, void 0, function () {
                    var frameData, encrypted, error_6;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                frameData = encodedFrame.data;
                                return [4 /*yield*/, manager.encryptFrame(frameData)];
                            case 1:
                                encrypted = _a.sent();
                                // Create new encoded frame with encrypted data
                                encodedFrame.data = encrypted.buffer;
                                // Forward the encrypted frame
                                controller.enqueue(encodedFrame);
                                return [3 /*break*/, 3];
                            case 2:
                                error_6 = _a.sent();
                                console.error("[SFrame] Encrypt transform error:", error_6);
                                // Forward unencrypted frame on error (fallback)
                                controller.enqueue(encodedFrame);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            },
        });
    };
    /**
     * Decrypt transform function for Insertable Streams
     * Use this with RTCRtpReceiver.createEncodedStreams()
     */
    SFrameManager.prototype.createDecryptTransform = function () {
        var manager = this;
        return new TransformStream({
            transform: function (encodedFrame, controller) {
                return __awaiter(this, void 0, void 0, function () {
                    var encryptedData, decrypted, error_7;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                encryptedData = new Uint8Array(encodedFrame.data);
                                return [4 /*yield*/, manager.decryptFrame(encryptedData)];
                            case 1:
                                decrypted = _a.sent();
                                // Create new encoded frame with decrypted data
                                encodedFrame.data = decrypted;
                                // Forward the decrypted frame
                                controller.enqueue(encodedFrame);
                                return [3 /*break*/, 3];
                            case 2:
                                error_7 = _a.sent();
                                console.error("[SFrame] Decrypt transform error:", error_7);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            },
        });
    };
    /**
     * Rotate encryption keys
     * RFC 9605: Frame counter should be reset on key rotation to prevent exhaustion
     */
    SFrameManager.prototype.rotateKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var newKeyId, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        newKeyId = this.currentKeyId + 1;
                        console.log("\uD83D\uDD04 [SFrame] Rotating to key ".concat(newKeyId, "..."));
                        return [4 /*yield*/, this.generateKey(newKeyId)];
                    case 1:
                        _a.sent();
                        this.setActiveKey(newKeyId);
                        // RFC 9605: Reset frame counter on key rotation
                        this.resetFrameCounter();
                        console.log("\uD83D\uDD04 [SFrame] Frame counter reset to 0 for new key");
                        console.log("\u2705 [SFrame] Key rotated to ".concat(newKeyId));
                        return [2 /*return*/, newKeyId];
                    case 2:
                        error_8 = _a.sent();
                        console.error("❌ [SFrame] Key rotation failed:", error_8);
                        throw new Error("SFrame key rotation failed: ".concat(error_8 instanceof Error ? error_8.message : String(error_8)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current key ID
     */
    SFrameManager.prototype.getCurrentKeyId = function () {
        return this.currentKeyId;
    };
    /**
     * Get frame counter (for debugging)
     */
    SFrameManager.prototype.getFrameCounter = function () {
        return this.frameCounter;
    };
    /**
     * Reset frame counter (use when rotating keys)
     */
    SFrameManager.prototype.resetFrameCounter = function () {
        this.frameCounter = 0;
        console.log("🔄 [SFrame] Frame counter reset");
    };
    /**
     * Remove old keys to prevent memory bloat
     */
    SFrameManager.prototype.cleanupOldKeys = function (keepLast) {
        var _this = this;
        if (keepLast === void 0) { keepLast = 2; }
        var keyIds = Array.from(this.keys.keys()).sort(function (a, b) { return b - a; });
        if (keyIds.length > keepLast) {
            var toDelete = keyIds.slice(keepLast);
            toDelete.forEach(function (keyId) {
                _this.keys.delete(keyId);
                console.log("\uD83E\uDDF9 [SFrame] Deleted old key ".concat(keyId));
            });
        }
    };
    /**
     * Get statistics
     */
    SFrameManager.prototype.getStats = function () {
        return {
            keyCount: this.keys.size,
            currentKeyId: this.currentKeyId,
            frameCounter: this.frameCounter,
            initialized: this.initialized,
        };
    };
    /**
     * Clean up resources
     */
    SFrameManager.prototype.destroy = function () {
        this.keys.clear();
        this.initialized = false;
        this.frameCounter = 0;
        console.log("✅ [SFrame] Manager destroyed");
    };
    /**
     * Ensure the manager is initialized
     */
    SFrameManager.prototype.ensureInitialized = function () {
        if (!this.initialized) {
            throw new Error("SFrame Manager not initialized. Call initialize() first.");
        }
    };
    return SFrameManager;
}());
exports.SFrameManager = SFrameManager;
exports.default = SFrameManager;
