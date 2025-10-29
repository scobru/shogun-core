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
exports.Web3Signer = void 0;
var web3Connector_1 = require("./web3Connector");
var ethers_1 = require("ethers");
var derive_1 = require("../../gundb/derive");
/**
 * Web3 Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Web3/MetaMask
 * CONSISTENT with normal Web3 approach
 */
var Web3Signer = /** @class */ (function () {
    function Web3Signer(web3Connector) {
        this.credentials = new Map();
        this.MESSAGE_TO_SIGN = "I Love Shogun!"; // Same as normal approach
        this.web3Connector = web3Connector || new web3Connector_1.Web3Connector();
    }
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    Web3Signer.prototype.createSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var validAddress, signature, username, password, signingCredential, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
                        return [4 /*yield*/, this.requestSignature(validAddress)];
                    case 1:
                        signature = _a.sent();
                        username = "".concat(validAddress.toLowerCase());
                        password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("".concat(validAddress.toLowerCase(), ":shogun-web3")));
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
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error creating Web3 signing credential:", error_1);
                        throw new Error("Failed to create Web3 signing credential: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Request signature from MetaMask
     * Uses the same approach as normal Web3Connector
     */
    Web3Signer.prototype.requestSignature = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var signer, signerAddress, signature, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.web3Connector.getSigner()];
                    case 1:
                        signer = _a.sent();
                        return [4 /*yield*/, signer.getAddress()];
                    case 2:
                        signerAddress = _a.sent();
                        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                            throw new Error("Signer address (".concat(signerAddress, ") does not match expected address (").concat(address, ")"));
                        }
                        return [4 /*yield*/, signer.signMessage(this.MESSAGE_TO_SIGN)];
                    case 3:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Failed to request signature:", error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Web3
     */
    Web3Signer.prototype.createAuthenticator = function (address) {
        var _this = this;
        var credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error("Credential for address ".concat(address, " not found"));
        }
        return function (data) { return __awaiter(_this, void 0, void 0, function () {
            var signer, signerAddress, dataToSign, signature, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.web3Connector.getSigner()];
                    case 1:
                        signer = _a.sent();
                        return [4 /*yield*/, signer.getAddress()];
                    case 2:
                        signerAddress = _a.sent();
                        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                            throw new Error("Address mismatch during authentication");
                        }
                        dataToSign = JSON.stringify(data);
                        return [4 /*yield*/, signer.signMessage(dataToSign)];
                    case 3:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Web3 authentication error:", error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Creates a derived key pair from Web3 credential
     * CONSISTENT with normal approach: uses password as seed
     */
    Web3Signer.prototype.createDerivedKeyPair = function (address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Use the deterministic approach instead of stored credentials
                return [2 /*return*/, this.createDerivedKeyPairFromAddress(address, extra)];
            });
        });
    };
    /**
     * Authenticate with existing pair (for login)
     * This generates the deterministic pair from address and authenticates with GunDB
     * GunDB will recognize the user because the pair is deterministic
     */
    Web3Signer.prototype.authenticateWithExistingPair = function (address, gunInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var derivedPair_1, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDD27 Web3Signer - authenticating with deterministic pair for address:", address);
                        return [4 /*yield*/, this.createDerivedKeyPairFromAddress(address)];
                    case 1:
                        derivedPair_1 = _a.sent();
                        console.log("\uD83D\uDD27 Web3Signer - deterministic pair created, attempting auth with GunDB");
                        return [2 /*return*/, new Promise(function (resolve) {
                                // Authenticate directly with GunDB using the deterministic pair
                                gunInstance.user().auth(derivedPair_1, function (authAck) {
                                    if (authAck.err) {
                                        console.log("\uD83D\uDD27 Web3Signer - auth failed:", authAck.err);
                                        resolve({ success: false, error: authAck.err });
                                    }
                                    else {
                                        var userPub = authAck.pub;
                                        console.log("\uD83D\uDD27 Web3Signer - auth successful, userPub:", userPub ? userPub.slice(0, 8) + "..." : "null");
                                        resolve({ success: true, userPub: userPub });
                                    }
                                });
                            })];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error authenticating with deterministic pair:", error_4);
                        return [2 /*return*/, { success: false, error: error_4.message }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a derived key pair directly from address (deterministic)
     * This ensures the same pair is generated every time for the same address
     */
    Web3Signer.prototype.createDerivedKeyPairFromAddress = function (address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var validAddress, password, derivedKeys, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
                        password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("".concat(validAddress.toLowerCase(), ":shogun-web3")));
                        console.log("\uD83D\uDD27 Web3Signer - generating deterministic pair for address:", validAddress);
                        return [4 /*yield*/, (0, derive_1.default)(password, // Deterministic password from address
                            extra, { includeP256: true })];
                    case 1:
                        derivedKeys = _a.sent();
                        return [2 /*return*/, {
                                pub: derivedKeys.pub,
                                priv: derivedKeys.priv,
                                epub: derivedKeys.epub,
                                epriv: derivedKeys.epriv,
                            }];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Error creating derived key pair from address:", error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a Gun user from Web3 credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    Web3Signer.prototype.createGunUser = function (address, gunInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var derivedPair_2, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDD27 Web3Signer - creating Gun user with deterministic pair for address:", address);
                        return [4 /*yield*/, this.createDerivedKeyPairFromAddress(address)];
                    case 1:
                        derivedPair_2 = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve) {
                                // Use the derived pair directly for GunDB auth
                                gunInstance.user().create(derivedPair_2, function (ack) {
                                    if (ack.err) {
                                        console.log("\uD83D\uDD27 Web3Signer - user creation failed, trying auth:", ack.err);
                                        // Try to login if user already exists
                                        gunInstance.user().auth(derivedPair_2, function (authAck) {
                                            if (authAck.err) {
                                                console.log("\uD83D\uDD27 Web3Signer - auth also failed:", authAck.err);
                                                resolve({ success: false, error: authAck.err });
                                            }
                                            else {
                                                var userPub = authAck.pub;
                                                console.log("\uD83D\uDD27 Web3Signer - auth successful, userPub:", userPub ? userPub.slice(0, 8) + "..." : "null");
                                                resolve({ success: true, userPub: userPub });
                                            }
                                        });
                                    }
                                    else {
                                        console.log("\uD83D\uDD27 Web3Signer - user created successfully, now logging in");
                                        // User created, now login
                                        gunInstance.user().auth(derivedPair_2, function (authAck) {
                                            if (authAck.err) {
                                                console.log("\uD83D\uDD27 Web3Signer - login after creation failed:", authAck.err);
                                                resolve({ success: false, error: authAck.err });
                                            }
                                            else {
                                                var userPub = authAck.pub;
                                                console.log("\uD83D\uDD27 Web3Signer - login successful, userPub:", userPub ? userPub.slice(0, 8) + "..." : "null");
                                                resolve({ success: true, userPub: userPub });
                                            }
                                        });
                                    }
                                });
                            })];
                    case 2:
                        error_6 = _a.sent();
                        console.error("Error creating Gun user:", error_6);
                        return [2 /*return*/, { success: false, error: error_6.message }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs data using Web3 + derived keys
     * This provides a hybrid approach: Web3 for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    Web3Signer.prototype.signWithDerivedKeys = function (data, address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var authenticator, keyPair, message, messageHash, wallet, signature, seaSignature, error_7;
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
                        messageHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(message));
                        wallet = new ethers_1.ethers.Wallet(keyPair.priv);
                        return [4 /*yield*/, wallet.signMessage(message)];
                    case 3:
                        signature = _a.sent();
                        seaSignature = {
                            m: message,
                            s: signature,
                        };
                        return [2 /*return*/, "SEA" + JSON.stringify(seaSignature)];
                    case 4:
                        error_7 = _a.sent();
                        console.error("Error signing with derived keys:", error_7);
                        throw error_7;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    Web3Signer.prototype.getGunUserPub = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var derivedPair, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createDerivedKeyPairFromAddress(address)];
                    case 1:
                        derivedPair = _a.sent();
                        return [2 /*return*/, derivedPair.pub];
                    case 2:
                        error_8 = _a.sent();
                        console.error("Error getting Gun user pub:", error_8);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the password (for consistency checking)
     */
    Web3Signer.prototype.getPassword = function (address) {
        try {
            // Generate deterministic password from address (same as createSigningCredential)
            var validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
            var password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("".concat(validAddress.toLowerCase(), ":shogun-web3")));
            return password;
        }
        catch (error) {
            console.error("Error getting password:", error);
            return undefined;
        }
    };
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    Web3Signer.prototype.verifyConsistency = function (address, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var derivedKeys, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createDerivedKeyPairFromAddress(address)];
                    case 1:
                        derivedKeys = _a.sent();
                        return [2 /*return*/, {
                                consistent: expectedUserPub
                                    ? derivedKeys.pub === expectedUserPub
                                    : true,
                                actualUserPub: derivedKeys.pub,
                                expectedUserPub: expectedUserPub,
                            }];
                    case 2:
                        error_9 = _a.sent();
                        console.error("Error verifying consistency:", error_9);
                        return [2 /*return*/, { consistent: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get credential by address
     */
    Web3Signer.prototype.getCredential = function (address) {
        return this.credentials.get(address.toLowerCase());
    };
    /**
     * List all stored credentials
     */
    Web3Signer.prototype.listCredentials = function () {
        return Array.from(this.credentials.values());
    };
    /**
     * Remove a credential
     */
    Web3Signer.prototype.removeCredential = function (address) {
        return this.credentials.delete(address.toLowerCase());
    };
    return Web3Signer;
}());
exports.Web3Signer = Web3Signer;
exports.default = Web3Signer;
