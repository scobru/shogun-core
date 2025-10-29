"use strict";
/**
 * CryptoIdentityManager - Gestisce la generazione e il salvataggio delle identità crypto
 * dopo l'autenticazione SEA dell'utente
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
exports.CryptoIdentityManager = void 0;
var sea_1 = require("gun/sea");
var asymmetric_1 = require("../crypto/asymmetric");
var symmetric_1 = require("../crypto/symmetric");
var signal_protocol_1 = require("../crypto/signal-protocol");
var pgp_1 = require("../crypto/pgp");
var mls_1 = require("../crypto/mls");
var sframe_1 = require("../crypto/sframe");
var errorHandler_1 = require("../utils/errorHandler");
/**
 * Manager per la gestione delle identità crypto
 * Genera automaticamente tutte le identità crypto disponibili dopo l'autenticazione SEA
 */
var CryptoIdentityManager = /** @class */ (function () {
    function CryptoIdentityManager(core, db) {
        this.core = core;
        this.db = db;
        this.pgpManager = new pgp_1.PGPManager();
        this.mlsManager = new mls_1.MLSManager("default-user");
        this.sframeManager = new sframe_1.SFrameManager();
        // Inizializza PGP Manager
        this.pgpManager.initialize().catch(function (error) {
            console.warn("PGP Manager initialization failed:", error);
        });
    }
    /**
     * Genera tutte le identità crypto disponibili per un utente
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente
     * @returns Promise con le identità generate
     */
    CryptoIdentityManager.prototype.generateAllIdentities = function (username, seaPair) {
        return __awaiter(this, void 0, void 0, function () {
            var identities, _a, error_1, _b, error_2, _c, error_3, _d, error_4, groupId, groupInfo, error_5, sframeKey, error_6, error_7;
            var _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 27, , 28]);
                        console.log("\uD83D\uDD10 [CryptoIdentityManager] Generating crypto identities for: ".concat(username));
                        identities = {
                            createdAt: Date.now(),
                            version: "1.0.0",
                        };
                        // 1. Genera coppia di chiavi RSA-4096
                        console.log("\uD83D\uDD11 [".concat(username, "] Generating RSA key pair..."));
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 3, , 4]);
                        _a = identities;
                        return [4 /*yield*/, (0, asymmetric_1.generateKeyPair)()];
                    case 2:
                        _a.rsa = _g.sent();
                        console.log("\u2705 [".concat(username, "] RSA key pair generated"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _g.sent();
                        console.error("\u274C [".concat(username, "] RSA key generation failed:"), error_1);
                        return [3 /*break*/, 4];
                    case 4:
                        // 2. Genera chiave simmetrica AES-256
                        console.log("\uD83D\uDD11 [".concat(username, "] Generating AES symmetric key..."));
                        _g.label = 5;
                    case 5:
                        _g.trys.push([5, 7, , 8]);
                        _b = identities;
                        return [4 /*yield*/, (0, symmetric_1.generateSymmetricKey)()];
                    case 6:
                        _b.aes = _g.sent();
                        console.log("\u2705 [".concat(username, "] AES symmetric key generated"));
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _g.sent();
                        console.error("\u274C [".concat(username, "] AES key generation failed:"), error_2);
                        return [3 /*break*/, 8];
                    case 8:
                        // 3. Genera identità Signal Protocol
                        console.log("\uD83D\uDD11 [".concat(username, "] Generating Signal Protocol identity..."));
                        _g.label = 9;
                    case 9:
                        _g.trys.push([9, 11, , 12]);
                        _c = identities;
                        return [4 /*yield*/, (0, signal_protocol_1.initializeSignalUser)(username)];
                    case 10:
                        _c.signal = _g.sent();
                        console.log("\u2705 [".concat(username, "] Signal Protocol identity generated"));
                        return [3 /*break*/, 12];
                    case 11:
                        error_3 = _g.sent();
                        console.error("\u274C [".concat(username, "] Signal Protocol generation failed:"), error_3);
                        return [3 /*break*/, 12];
                    case 12:
                        // 4. Genera coppia di chiavi PGP
                        console.log("\uD83D\uDD11 [".concat(username, "] Generating PGP key pair..."));
                        _g.label = 13;
                    case 13:
                        _g.trys.push([13, 15, , 16]);
                        _d = identities;
                        return [4 /*yield*/, this.pgpManager.generateKeyPair(username, "".concat(username, "@example.com"))];
                    case 14:
                        _d.pgp = _g.sent();
                        console.log("\u2705 [".concat(username, "] PGP key pair generated"));
                        return [3 /*break*/, 16];
                    case 15:
                        error_4 = _g.sent();
                        console.error("\u274C [".concat(username, "] PGP key generation failed:"), error_4);
                        return [3 /*break*/, 16];
                    case 16:
                        // 5. Inizializza MLS Manager e crea gruppo
                        console.log("\uD83D\uDD11 [".concat(username, "] Initializing MLS group..."));
                        _g.label = 17;
                    case 17:
                        _g.trys.push([17, 20, , 21]);
                        return [4 /*yield*/, this.mlsManager.initialize()];
                    case 18:
                        _g.sent();
                        groupId = "group_".concat(username, "_").concat(Date.now());
                        return [4 /*yield*/, this.mlsManager.createGroup(groupId)];
                    case 19:
                        groupInfo = _g.sent();
                        // Skip adding members for now due to MLS library issues
                        // await this.mlsManager.addMembers(groupId, [username]);
                        identities.mls = {
                            groupId: groupInfo.groupId.toString(),
                            memberId: username,
                        };
                        console.log("\u2705 [".concat(username, "] MLS group created: ").concat(groupId));
                        return [3 /*break*/, 21];
                    case 20:
                        error_5 = _g.sent();
                        console.error("\u274C [".concat(username, "] MLS initialization failed:"), error_5);
                        return [3 /*break*/, 21];
                    case 21:
                        // 6. Genera chiave SFrame
                        console.log("\uD83D\uDD11 [".concat(username, "] Generating SFrame key..."));
                        _g.label = 22;
                    case 22:
                        _g.trys.push([22, 25, , 26]);
                        return [4 /*yield*/, this.sframeManager.initialize()];
                    case 23:
                        _g.sent();
                        return [4 /*yield*/, this.sframeManager.generateKey(1)];
                    case 24:
                        sframeKey = _g.sent();
                        identities.sframe = { keyId: sframeKey.keyId };
                        console.log("\u2705 [".concat(username, "] SFrame key generated: ").concat(sframeKey.keyId));
                        return [3 /*break*/, 26];
                    case 25:
                        error_6 = _g.sent();
                        console.error("\u274C [".concat(username, "] SFrame key generation failed:"), error_6);
                        return [3 /*break*/, 26];
                    case 26:
                        console.log("\u2705 [CryptoIdentityManager] All crypto identities generated for: ".concat(username));
                        return [2 /*return*/, {
                                success: true,
                                identities: identities,
                            }];
                    case 27:
                        error_7 = _g.sent();
                        console.error("\u274C [CryptoIdentityManager] Identity generation failed:", error_7);
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "IDENTITY_GENERATION_FAILED", (_e = error_7.message) !== null && _e !== void 0 ? _e : "Failed to generate crypto identities", error_7);
                        return [2 /*return*/, {
                                success: false,
                                error: (_f = error_7.message) !== null && _f !== void 0 ? _f : "Failed to generate crypto identities",
                            }];
                    case 28: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cripta e salva le identità crypto su GunDB usando il SEA pair
     * @param username - Nome utente
     * @param identities - Identità crypto da salvare
     * @param seaPair - Coppia di chiavi SEA per la crittografia
     * @returns Promise con il risultato del salvataggio
     */
    CryptoIdentityManager.prototype.saveIdentitiesToGun = function (username, identities, seaPair) {
        return __awaiter(this, void 0, void 0, function () {
            var savedKeys_1, userPub, identitiesJson, encryptedIdentities_1, saveResult, identitiesHash_1, error_8;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        console.log("\uD83D\uDCBE [CryptoIdentityManager] Saving crypto identities for: ".concat(username));
                        savedKeys_1 = [];
                        userPub = seaPair.pub;
                        identitiesJson = JSON.stringify(identities);
                        return [4 /*yield*/, sea_1.default.encrypt(identitiesJson, seaPair.priv)];
                    case 1:
                        encryptedIdentities_1 = _c.sent();
                        if (!encryptedIdentities_1) {
                            throw new Error("Failed to encrypt identities with SEA");
                        }
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.db.gun
                                    .user()
                                    .get("crypto-identities")
                                    .put(encryptedIdentities_1, function (ack) {
                                    if (ack.err) {
                                        console.error("\u274C [".concat(username, "] Failed to save identities:"), ack.err);
                                        reject(new Error(ack.err));
                                    }
                                    else {
                                        console.log("\u2705 [".concat(username, "] Crypto identities saved successfully"));
                                        savedKeys_1.push("crypto-identities");
                                        resolve(true);
                                    }
                                });
                            })];
                    case 2:
                        saveResult = _c.sent();
                        return [4 /*yield*/, sea_1.default.work(identitiesJson, null, null, {
                                name: "SHA-256",
                            })];
                    case 3:
                        identitiesHash_1 = _c.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.db.gun
                                    .user()
                                    .get("crypto-identities-hash")
                                    .put(identitiesHash_1, function (ack) {
                                    if (ack.err) {
                                        console.error("\u274C [".concat(username, "] Failed to save identities hash:"), ack.err);
                                        reject(new Error(ack.err));
                                    }
                                    else {
                                        console.log("\u2705 [".concat(username, "] Crypto identities hash saved"));
                                        savedKeys_1.push("crypto-identities-hash");
                                        resolve(true);
                                    }
                                });
                            })];
                    case 4:
                        _c.sent();
                        return [2 /*return*/, {
                                success: true,
                                savedKeys: savedKeys_1,
                            }];
                    case 5:
                        error_8 = _c.sent();
                        console.error("\u274C [CryptoIdentityManager] Failed to save identities:", error_8);
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "IDENTITY_SAVE_FAILED", (_a = error_8.message) !== null && _a !== void 0 ? _a : "Failed to save crypto identities", error_8);
                        return [2 /*return*/, {
                                success: false,
                                savedKeys: [],
                                error: (_b = error_8.message) !== null && _b !== void 0 ? _b : "Failed to save crypto identities",
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recupera e decripta le identità crypto da GunDB
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA per la decrittografia
     * @returns Promise con le identità recuperate
     */
    CryptoIdentityManager.prototype.retrieveIdentitiesFromGun = function (username, seaPair) {
        return __awaiter(this, void 0, void 0, function () {
            var encryptedIdentities, decryptedIdentities, identitiesString, identities, error_9;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        console.log("\uD83D\uDD0D [CryptoIdentityManager] Retrieving crypto identities for: ".concat(username));
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this.db.gun
                                    .user()
                                    .get("crypto-identities")
                                    .once(function (data) {
                                    if (data) {
                                        resolve(data);
                                    }
                                    else {
                                        reject(new Error("No crypto identities found"));
                                    }
                                });
                            })];
                    case 1:
                        encryptedIdentities = _c.sent();
                        if (!encryptedIdentities) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "No crypto identities found for user",
                                }];
                        }
                        return [4 /*yield*/, sea_1.default.decrypt(encryptedIdentities, seaPair.priv)];
                    case 2:
                        decryptedIdentities = _c.sent();
                        if (!decryptedIdentities) {
                            throw new Error("Failed to decrypt identities with SEA");
                        }
                        identitiesString = typeof decryptedIdentities === "string"
                            ? decryptedIdentities
                            : JSON.stringify(decryptedIdentities);
                        identities = JSON.parse(identitiesString);
                        console.log("\u2705 [CryptoIdentityManager] Crypto identities retrieved for: ".concat(username));
                        return [2 /*return*/, {
                                success: true,
                                identities: identities,
                            }];
                    case 3:
                        error_9 = _c.sent();
                        console.error("\u274C [CryptoIdentityManager] Failed to retrieve identities:", error_9);
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "IDENTITY_RETRIEVAL_FAILED", (_a = error_9.message) !== null && _a !== void 0 ? _a : "Failed to retrieve crypto identities", error_9);
                        return [2 /*return*/, {
                                success: false,
                                error: (_b = error_9.message) !== null && _b !== void 0 ? _b : "Failed to retrieve crypto identities",
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verifica se l'utente ha già delle identità crypto salvate
     * @param username - Nome utente
     * @returns Promise con il risultato della verifica
     */
    CryptoIdentityManager.prototype.hasStoredIdentities = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var hasIdentities, error_10;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, new Promise(function (resolve) {
                                _this.db.gun
                                    .user()
                                    .get("crypto-identities")
                                    .once(function (data) {
                                    resolve(!!data);
                                });
                            })];
                    case 1:
                        hasIdentities = _a.sent();
                        return [2 /*return*/, hasIdentities];
                    case 2:
                        error_10 = _a.sent();
                        console.error("\u274C [CryptoIdentityManager] Error checking stored identities:", error_10);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Processo completo: genera, salva e gestisce le identità crypto dopo l'autenticazione
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente
     * @param forceRegenerate - Se true, rigenera anche se esistono già
     * @returns Promise con il risultato del processo completo
     */
    CryptoIdentityManager.prototype.setupCryptoIdentities = function (username_1, seaPair_1) {
        return __awaiter(this, arguments, void 0, function (username, seaPair, forceRegenerate) {
            var hasExisting, retrievalResult, generationResult, saveResult, error_11;
            var _a, _b;
            if (forceRegenerate === void 0) { forceRegenerate = false; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDE80 [CryptoIdentityManager] Setting up crypto identities for: ".concat(username));
                        return [4 /*yield*/, this.hasStoredIdentities(username)];
                    case 1:
                        hasExisting = _c.sent();
                        if (!(hasExisting && !forceRegenerate)) return [3 /*break*/, 3];
                        console.log("\u2139\uFE0F [".concat(username, "] Crypto identities already exist, skipping generation"));
                        return [4 /*yield*/, this.retrieveIdentitiesFromGun(username, seaPair)];
                    case 2:
                        retrievalResult = _c.sent();
                        if (retrievalResult.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    identities: retrievalResult.identities,
                                    savedKeys: ["crypto-identities", "crypto-identities-hash"],
                                }];
                        }
                        _c.label = 3;
                    case 3: return [4 /*yield*/, this.generateAllIdentities(username, seaPair)];
                    case 4:
                        generationResult = _c.sent();
                        if (!generationResult.success || !generationResult.identities) {
                            return [2 /*return*/, {
                                    success: false,
                                    savedKeys: [],
                                    error: generationResult.error || "Failed to generate identities",
                                }];
                        }
                        return [4 /*yield*/, this.saveIdentitiesToGun(username, generationResult.identities, seaPair)];
                    case 5:
                        saveResult = _c.sent();
                        if (!saveResult.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    savedKeys: [],
                                    error: saveResult.error || "Failed to save identities",
                                }];
                        }
                        console.log("\u2705 [CryptoIdentityManager] Crypto identities setup completed for: ".concat(username));
                        return [2 /*return*/, {
                                success: true,
                                identities: generationResult.identities,
                                savedKeys: saveResult.savedKeys,
                            }];
                    case 6:
                        error_11 = _c.sent();
                        console.error("\u274C [CryptoIdentityManager] Setup failed:", error_11);
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "IDENTITY_SETUP_FAILED", (_a = error_11.message) !== null && _a !== void 0 ? _a : "Failed to setup crypto identities", error_11);
                        return [2 /*return*/, {
                                success: false,
                                savedKeys: [],
                                error: (_b = error_11.message) !== null && _b !== void 0 ? _b : "Failed to setup crypto identities",
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene le identità crypto dell'utente corrente
     * @returns Promise con le identità dell'utente corrente
     */
    CryptoIdentityManager.prototype.getCurrentUserIdentities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentUser, userInstance, seaPair, error_12;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        currentUser = this.core.getCurrentUser();
                        if (!currentUser || !currentUser.pub) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "No authenticated user found",
                                }];
                        }
                        userInstance = this.db.gun.user();
                        seaPair = (_a = userInstance === null || userInstance === void 0 ? void 0 : userInstance._) === null || _a === void 0 ? void 0 : _a.sea;
                        if (!seaPair) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "No SEA pair found for current user",
                                }];
                        }
                        return [4 /*yield*/, this.retrieveIdentitiesFromGun(currentUser.pub, seaPair)];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        error_12 = _c.sent();
                        console.error("\u274C [CryptoIdentityManager] Failed to get current user identities:", error_12);
                        return [2 /*return*/, {
                                success: false,
                                error: (_b = error_12.message) !== null && _b !== void 0 ? _b : "Failed to get current user identities",
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CryptoIdentityManager;
}());
exports.CryptoIdentityManager = CryptoIdentityManager;
