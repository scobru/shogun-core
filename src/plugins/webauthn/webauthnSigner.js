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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnSigner = void 0;
var webauthn_1 = require("./webauthn");
var p256_1 = require("@noble/curves/p256");
var sha256_1 = require("@noble/hashes/sha256");
var derive_1 = require("../../gundb/derive");
var ethers_1 = require("ethers");
/**
 * Base64URL encoding utilities
 */
var base64url = {
    encode: function (buffer) {
        var bytes = new Uint8Array(buffer);
        return btoa(String.fromCharCode.apply(String, bytes))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    },
    decode: function (str) {
        str = str.replace(/-/g, "+").replace(/_/g, "/");
        while (str.length % 4)
            str += "=";
        var binary = atob(str);
        return new Uint8Array(binary.split("").map(function (c) { return c.charCodeAt(0); }));
    },
};
/**
 * WebAuthn Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but integrated with our architecture
 * CONSISTENT with normal WebAuthn approach
 */
var WebAuthnSigner = /** @class */ (function () {
    function WebAuthnSigner(webauthn) {
        this.credentials = new Map();
        this.webauthn = webauthn || new webauthn_1.Webauthn();
    }
    /**
     * Creates a new WebAuthn credential for signing
     * Similar to webauthn.js create functionality but CONSISTENT with normal approach
     */
    WebAuthnSigner.prototype.createSigningCredential = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, response, publicKey, rawKey, xCoord, yCoord, x, y, pub, hashedCredentialId, signingCredential, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, navigator.credentials.create({
                                publicKey: {
                                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                                    rp: {
                                        id: window.location.hostname === "localhost"
                                            ? "localhost"
                                            : window.location.hostname,
                                        name: "Shogun Wallet",
                                    },
                                    user: {
                                        id: new TextEncoder().encode(username),
                                        name: username,
                                        displayName: username,
                                    },
                                    // Use the same algorithms as webauthn.js for SEA compatibility
                                    pubKeyCredParams: [
                                        { type: "public-key", alg: -7 }, // ECDSA, P-256 curve, for signing
                                        { type: "public-key", alg: -25 }, // ECDH, P-256 curve, for creating shared secrets
                                        { type: "public-key", alg: -257 },
                                    ],
                                    authenticatorSelection: {
                                        userVerification: "preferred",
                                    },
                                    timeout: 60000,
                                    attestation: "none",
                                },
                            })];
                    case 1:
                        credential = (_a.sent());
                        if (!credential) {
                            throw new Error("Failed to create WebAuthn credential");
                        }
                        response = credential.response;
                        publicKey = response.getPublicKey();
                        if (!publicKey) {
                            throw new Error("Failed to get public key from credential");
                        }
                        rawKey = new Uint8Array(publicKey);
                        xCoord = rawKey.slice(27, 59);
                        yCoord = rawKey.slice(59, 91);
                        x = base64url.encode(xCoord);
                        y = base64url.encode(yCoord);
                        pub = "".concat(x, ".").concat(y);
                        hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credential.id));
                        signingCredential = {
                            id: credential.id,
                            rawId: credential.rawId,
                            publicKey: { x: x, y: y },
                            pub: pub,
                            hashedCredentialId: hashedCredentialId,
                        };
                        // Store credential for later use
                        this.credentials.set(credential.id, signingCredential);
                        return [2 /*return*/, signingCredential];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error creating signing credential:", error_1);
                        throw new Error("Failed to create signing credential: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js
     */
    WebAuthnSigner.prototype.createAuthenticator = function (credentialId) {
        var _this = this;
        var credential = this.credentials.get(credentialId);
        if (!credential) {
            throw new Error("Credential ".concat(credentialId, " not found"));
        }
        return function (data) { return __awaiter(_this, void 0, void 0, function () {
            var challenge, options, assertion, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        challenge = new TextEncoder().encode(JSON.stringify(data));
                        options = {
                            challenge: challenge,
                            rpId: window.location.hostname === "localhost"
                                ? "localhost"
                                : window.location.hostname,
                            userVerification: "preferred",
                            allowCredentials: [
                                {
                                    type: "public-key",
                                    id: credential.rawId,
                                },
                            ],
                            timeout: 60000,
                        };
                        return [4 /*yield*/, navigator.credentials.get({
                                publicKey: options,
                            })];
                    case 1:
                        assertion = (_a.sent());
                        if (!assertion) {
                            throw new Error("WebAuthn assertion failed");
                        }
                        return [2 /*return*/, assertion.response];
                    case 2:
                        error_2 = _a.sent();
                        console.error("WebAuthn assertion error:", error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Creates a derived key pair from WebAuthn credential
     * CONSISTENT with normal approach: uses hashedCredentialId as password
     */
    WebAuthnSigner.prototype.createDerivedKeyPair = function (credentialId, username, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedKeys, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(credentialId);
                        if (!credential) {
                            throw new Error("Credential ".concat(credentialId, " not found"));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, derive_1.default)(credential.hashedCredentialId, // This is the key change!
                            extra, { includeP256: true })];
                    case 2:
                        derivedKeys = _a.sent();
                        return [2 /*return*/, {
                                pub: derivedKeys.pub,
                                priv: derivedKeys.priv,
                                epub: derivedKeys.epub,
                                epriv: derivedKeys.epriv,
                            }];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Error deriving keys from WebAuthn credential:", error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a Gun user from WebAuthn credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    WebAuthnSigner.prototype.createGunUser = function (credentialId, username, gunInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedPair_1, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(credentialId);
                        if (!credential) {
                            throw new Error("Credential ".concat(credentialId, " not found"));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.createDerivedKeyPair(credentialId, username)];
                    case 2:
                        derivedPair_1 = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                // Use the derived pair directly for GunDB auth
                                gunInstance.user().create(derivedPair_1, function (ack) {
                                    if (ack.err) {
                                        // Try to login if user already exists
                                        gunInstance.user().auth(derivedPair_1, function (authAck) {
                                            if (authAck.err) {
                                                resolve({ success: false, error: authAck.err });
                                            }
                                            else {
                                                var userPub = authAck.pub;
                                                // Update credential with Gun user pub
                                                credential.gunUserPub = userPub;
                                                _this.credentials.set(credentialId, credential);
                                                resolve({ success: true, userPub: userPub });
                                            }
                                        });
                                    }
                                    else {
                                        // User created, now login
                                        gunInstance.user().auth(derivedPair_1, function (authAck) {
                                            if (authAck.err) {
                                                resolve({ success: false, error: authAck.err });
                                            }
                                            else {
                                                var userPub = authAck.pub;
                                                // Update credential with Gun user pub
                                                credential.gunUserPub = userPub;
                                                _this.credentials.set(credentialId, credential);
                                                resolve({ success: true, userPub: userPub });
                                            }
                                        });
                                    }
                                });
                            })];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Error creating Gun user:", error_4);
                        return [2 /*return*/, { success: false, error: error_4.message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs data using WebAuthn + derived keys
     * This provides a hybrid approach: WebAuthn for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    WebAuthnSigner.prototype.signWithDerivedKeys = function (data, credentialId, username, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var authenticator, keyPair, message, messageHash, privKeyBytes, signature, seaSignature, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        authenticator = this.createAuthenticator(credentialId);
                        return [4 /*yield*/, authenticator(data)];
                    case 1:
                        _a.sent(); // This verifies the user
                        return [4 /*yield*/, this.createDerivedKeyPair(credentialId, username, extra)];
                    case 2:
                        keyPair = _a.sent();
                        message = JSON.stringify(data);
                        messageHash = (0, sha256_1.sha256)(new TextEncoder().encode(message));
                        privKeyBytes = base64url.decode(keyPair.priv);
                        signature = p256_1.p256.sign(messageHash, privKeyBytes);
                        seaSignature = {
                            m: message,
                            s: base64url.encode(signature.toCompactRawBytes()),
                        };
                        return [2 /*return*/, "SEA" + JSON.stringify(seaSignature)];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Error signing with derived keys:", error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    WebAuthnSigner.prototype.getGunUserPub = function (credentialId) {
        var credential = this.credentials.get(credentialId);
        return credential === null || credential === void 0 ? void 0 : credential.gunUserPub;
    };
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    WebAuthnSigner.prototype.getHashedCredentialId = function (credentialId) {
        var credential = this.credentials.get(credentialId);
        return credential === null || credential === void 0 ? void 0 : credential.hashedCredentialId;
    };
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    WebAuthnSigner.prototype.verifyConsistency = function (credentialId, username, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedKeys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(credentialId);
                        if (!credential) {
                            return [2 /*return*/, { consistent: false }];
                        }
                        return [4 /*yield*/, this.createDerivedKeyPair(credentialId, username)];
                    case 1:
                        derivedKeys = _a.sent();
                        return [2 /*return*/, {
                                consistent: expectedUserPub ? derivedKeys.pub === expectedUserPub : true,
                                actualUserPub: derivedKeys.pub,
                                expectedUserPub: expectedUserPub,
                            }];
                }
            });
        });
    };
    /**
     * Get credential by ID
     */
    WebAuthnSigner.prototype.getCredential = function (credentialId) {
        return this.credentials.get(credentialId);
    };
    /**
     * List all stored credentials
     */
    WebAuthnSigner.prototype.listCredentials = function () {
        return Array.from(this.credentials.values());
    };
    /**
     * Remove a credential
     */
    WebAuthnSigner.prototype.removeCredential = function (credentialId) {
        return this.credentials.delete(credentialId);
    };
    return WebAuthnSigner;
}());
exports.WebAuthnSigner = WebAuthnSigner;
exports.default = WebAuthnSigner;
