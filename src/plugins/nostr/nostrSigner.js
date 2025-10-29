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
exports.NostrSigner = void 0;
var nostrConnector_1 = require("./nostrConnector");
var derive_1 = require("../../gundb/derive");
var ethers_1 = require("ethers");
/**
 * Nostr Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Nostr/Bitcoin wallets
 * CONSISTENT with normal Nostr approach
 */
var NostrSigner = /** @class */ (function () {
    function NostrSigner(nostrConnector) {
        this.credentials = new Map();
        this.MESSAGE_TO_SIGN = "I Love Shogun!"; // Same as normal approach
        this.nostrConnector = nostrConnector || new nostrConnector_1.NostrConnector();
    }
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    NostrSigner.prototype.createSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var validAddress, signature, username, password, signingCredential, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        validAddress = this.validateAddress(address);
                        return [4 /*yield*/, this.generateDeterministicSignature(validAddress)];
                    case 1:
                        signature = _a.sent();
                        username = "".concat(validAddress.toLowerCase());
                        return [4 /*yield*/, this.generatePassword(signature)];
                    case 2:
                        password = _a.sent();
                        signingCredential = {
                            address: validAddress,
                            signature: signature,
                            message: this.MESSAGE_TO_SIGN,
                            username: username,
                            password: password,
                        };
                        // Store credential for later use
                        this.credentials.set(validAddress.toLowerCase(), signingCredential);
                        return [2 /*return*/, signingCredential];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error creating Nostr signing credential:", error_1);
                        throw new Error("Failed to create Nostr signing credential: ".concat(error_1.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validates address using the same logic as NostrConnector
     */
    NostrSigner.prototype.validateAddress = function (address) {
        if (!address) {
            throw new Error("Address not provided");
        }
        try {
            var normalizedAddress = String(address).trim();
            // Basic validation for Bitcoin addresses and Nostr pubkeys (same as normal approach)
            if (!/^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/.test(normalizedAddress)) {
                // More lenient validation for Nostr addresses
                if (normalizedAddress.length < 10) {
                    throw new Error("Invalid Nostr/Bitcoin address format");
                }
            }
            return normalizedAddress;
        }
        catch (error) {
            throw new Error("Invalid Nostr/Bitcoin address provided");
        }
    };
    /**
     * Generate deterministic signature using the SAME approach as NostrConnector
     */
    NostrSigner.prototype.generateDeterministicSignature = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var baseString, hash, runningValue, i, charCode, deterministicSignature;
            return __generator(this, function (_a) {
                baseString = "".concat(address, "_").concat(this.MESSAGE_TO_SIGN, "_shogun_deterministic");
                hash = "";
                runningValue = 0;
                for (i = 0; i < baseString.length; i++) {
                    charCode = baseString.charCodeAt(i);
                    runningValue = (runningValue * 31 + charCode) & 0xffffffff;
                    if (i % 4 === 3) {
                        hash += runningValue.toString(16).padStart(8, "0");
                    }
                }
                // Ensure we have exactly 128 characters (64 bytes in hex)
                while (hash.length < 128) {
                    runningValue = (runningValue * 31 + hash.length) & 0xffffffff;
                    hash += runningValue.toString(16).padStart(8, "0");
                }
                deterministicSignature = hash.substring(0, 128);
                // Double-check that it's a valid hex string
                deterministicSignature = deterministicSignature
                    .toLowerCase()
                    .replace(/[^0-9a-f]/g, "0");
                // Ensure it's exactly 128 characters
                if (deterministicSignature.length < 128) {
                    deterministicSignature = deterministicSignature.padEnd(128, "0");
                }
                else if (deterministicSignature.length > 128) {
                    deterministicSignature = deterministicSignature.substring(0, 128);
                }
                return [2 /*return*/, deterministicSignature];
            });
        });
    };
    /**
     * Generate password using the SAME approach as NostrConnector
     */
    NostrSigner.prototype.generatePassword = function (signature) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedSig, passwordHash;
            return __generator(this, function (_a) {
                if (!signature) {
                    throw new Error("Invalid signature");
                }
                try {
                    normalizedSig = signature.toLowerCase().replace(/[^a-f0-9]/g, "");
                    passwordHash = ethers_1.ethers.sha256(ethers_1.ethers.toUtf8Bytes(normalizedSig));
                    return [2 /*return*/, passwordHash];
                }
                catch (error) {
                    console.error("Error generating password:", error);
                    throw new Error("Failed to generate password from signature");
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Nostr
     */
    NostrSigner.prototype.createAuthenticator = function (address) {
        var _this = this;
        var credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error("Credential for address ".concat(address, " not found"));
        }
        return function (data) { return __awaiter(_this, void 0, void 0, function () {
            var dataToSign, signature, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        dataToSign = JSON.stringify(data);
                        return [4 /*yield*/, this.signData(dataToSign, credential)];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Nostr authentication error:", error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Sign data using the credential
     */
    NostrSigner.prototype.signData = function (data, credential) {
        return __awaiter(this, void 0, void 0, function () {
            var signatureBase;
            return __generator(this, function (_a) {
                signatureBase = "".concat(credential.signature, "_").concat(data);
                return [2 /*return*/, this.generateDeterministicSignature(signatureBase)];
            });
        });
    };
    /**
     * Creates a derived key pair from Nostr credential
     * CONSISTENT with normal approach: uses password as seed
     */
    NostrSigner.prototype.createDerivedKeyPair = function (address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedKeys, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(address.toLowerCase());
                        if (!credential) {
                            throw new Error("Credential for address ".concat(address, " not found"));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, derive_1.default)(credential.password, // This is the key consistency point!
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
                        console.error("Error deriving keys from Nostr credential:", error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a Gun user from Nostr credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    NostrSigner.prototype.createGunUser = function (address, gunInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedPair_1, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(address.toLowerCase());
                        if (!credential) {
                            throw new Error("Credential for address ".concat(address, " not found"));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.createDerivedKeyPair(address)];
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
                                                _this.credentials.set(address.toLowerCase(), credential);
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
                                                _this.credentials.set(address.toLowerCase(), credential);
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
     * Signs data using Nostr + derived keys
     * This provides a hybrid approach: Nostr for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    NostrSigner.prototype.signWithDerivedKeys = function (data, address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var authenticator, keyPair, message, signature, seaSignature, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        authenticator = this.createAuthenticator(address);
                        return [4 /*yield*/, authenticator(data)];
                    case 1:
                        _a.sent(); // This verifies the user
                        return [4 /*yield*/, this.createDerivedKeyPair(address, extra)];
                    case 2:
                        keyPair = _a.sent();
                        message = JSON.stringify(data);
                        return [4 /*yield*/, this.generateDeterministicSignature("".concat(keyPair.priv, "_").concat(message))];
                    case 3:
                        signature = _a.sent();
                        seaSignature = {
                            m: message,
                            s: signature,
                        };
                        return [2 /*return*/, "SEA" + JSON.stringify(seaSignature)];
                    case 4:
                        error_5 = _a.sent();
                        console.error("Error signing with derived keys:", error_5);
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    NostrSigner.prototype.getGunUserPub = function (address) {
        var credential = this.credentials.get(address.toLowerCase());
        return credential === null || credential === void 0 ? void 0 : credential.gunUserPub;
    };
    /**
     * Get the password (for consistency checking)
     */
    NostrSigner.prototype.getPassword = function (address) {
        var credential = this.credentials.get(address.toLowerCase());
        return credential === null || credential === void 0 ? void 0 : credential.password;
    };
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    NostrSigner.prototype.verifyConsistency = function (address, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var credential, derivedKeys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credential = this.credentials.get(address.toLowerCase());
                        if (!credential) {
                            return [2 /*return*/, { consistent: false }];
                        }
                        return [4 /*yield*/, this.createDerivedKeyPair(address)];
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
     * Get credential by address
     */
    NostrSigner.prototype.getCredential = function (address) {
        return this.credentials.get(address.toLowerCase());
    };
    /**
     * List all stored credentials
     */
    NostrSigner.prototype.listCredentials = function () {
        return Array.from(this.credentials.values());
    };
    /**
     * Remove a credential
     */
    NostrSigner.prototype.removeCredential = function (address) {
        return this.credentials.delete(address.toLowerCase());
    };
    return NostrSigner;
}());
exports.NostrSigner = NostrSigner;
exports.default = NostrSigner;
