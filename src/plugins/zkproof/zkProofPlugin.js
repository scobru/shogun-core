"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ZkProofPlugin = void 0;
var base_1 = require("../base");
var zkProofConnector_1 = require("./zkProofConnector");
var shogun_1 = require("../../interfaces/shogun");
var errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin for Zero-Knowledge Proof authentication using Semaphore protocol
 *
 * Features:
 * - Anonymous authentication with ZK proofs
 * - Multi-device support via trapdoor backup
 * - Privacy-preserving identity management
 * - Compatible with Gun decentralized storage
 */
var ZkProofPlugin = /** @class */ (function (_super) {
    __extends(ZkProofPlugin, _super);
    function ZkProofPlugin(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.name = "zkproof";
        _this.version = "1.0.0";
        _this.description = "Zero-Knowledge Proof authentication using Semaphore protocol for ShogunCore";
        _this._category = shogun_1.PluginCategory.Authentication;
        _this.connector = null;
        _this.config = __assign({ defaultGroupId: "shogun-users", deterministic: false, minEntropy: 128 }, config);
        return _this;
    }
    /**
     * Initialize the plugin
     */
    ZkProofPlugin.prototype.initialize = function (core) {
        _super.prototype.initialize.call(this, core);
        this.connector = new zkProofConnector_1.ZkProofConnector();
    };
    /**
     * Clean up resources
     */
    ZkProofPlugin.prototype.destroy = function () {
        if (this.connector) {
            this.connector.cleanup();
        }
        this.connector = null;
        _super.prototype.destroy.call(this);
    };
    /**
     * Ensure connector is initialized
     */
    ZkProofPlugin.prototype.assertConnector = function () {
        this.assertInitialized();
        if (!this.connector) {
            throw new Error("ZK-Proof connector not initialized");
        }
        return this.connector;
    };
    /**
     * Generate a new ZK identity
     */
    ZkProofPlugin.prototype.generateIdentity = function (seed) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.assertConnector().generateIdentity(seed)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENCRYPTION, "ZK_IDENTITY_GENERATION_FAILED", "Failed to generate ZK identity: ".concat(error_1.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Restore identity from trapdoor/seed phrase
     */
    ZkProofPlugin.prototype.restoreIdentity = function (trapdoor) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!trapdoor || trapdoor.trim().length === 0) {
                            throw new Error("Trapdoor is required");
                        }
                        return [4 /*yield*/, this.assertConnector().restoreIdentity(trapdoor)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENCRYPTION, "ZK_IDENTITY_RESTORE_FAILED", "Failed to restore ZK identity: ".concat(error_2.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate credentials for Gun authentication
     */
    ZkProofPlugin.prototype.generateCredentials = function (identityData) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.assertConnector().generateCredentials(identityData)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENCRYPTION, "ZK_CREDENTIAL_GENERATION_FAILED", "Failed to generate credentials: ".concat(error_3.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a zero-knowledge proof
     */
    ZkProofPlugin.prototype.generateProof = function (identityData, options) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.assertConnector().generateProof(identityData, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENCRYPTION, "ZK_PROOF_GENERATION_FAILED", "Failed to generate ZK proof: ".concat(error_4.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify a zero-knowledge proof
     */
    ZkProofPlugin.prototype.verifyProof = function (proof_1) {
        return __awaiter(this, arguments, void 0, function (proof, treeDepth) {
            var error_5;
            if (treeDepth === void 0) { treeDepth = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.assertConnector().verifyProof(proof, treeDepth)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_5 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                verified: false,
                                error: error_5.message,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add identity to a group
     */
    ZkProofPlugin.prototype.addToGroup = function (commitment, groupId) {
        var group = groupId || this.config.defaultGroupId || "default";
        this.assertConnector().addToGroup(commitment, group);
    };
    /**
     * Login with ZK proof
     * @param trapdoor - User's trapdoor/seed phrase
     * @returns Authentication result
     */
    ZkProofPlugin.prototype.login = function (trapdoor) {
        return __awaiter(this, void 0, void 0, function () {
            var core, connector, identityData, gunPair, username, loginResult, authError_1, result, error_6, errorType, errorCode, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        core = this.assertInitialized();
                        connector = this.assertConnector();
                        if (!trapdoor || trapdoor.trim().length === 0) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "TRAPDOOR_REQUIRED", "Trapdoor is required for ZK-Proof login");
                        }
                        console.log("🔐 ZK-Proof login - restoring identity from trapdoor");
                        return [4 /*yield*/, connector.restoreIdentity(trapdoor)];
                    case 1:
                        identityData = _a.sent();
                        console.log("\uD83D\uDD10 ZK-Proof login - identity restored, commitment: ".concat(identityData.commitment.slice(0, 16), "..."));
                        return [4 /*yield*/, connector.generateCredentials(identityData)];
                    case 2:
                        gunPair = _a.sent();
                        console.log("\uD83D\uDD10 ZK-Proof login - Gun credentials generated, pub: ".concat(gunPair.pub.slice(0, 16), "..."));
                        username = "zk_".concat(identityData.commitment.slice(0, 16));
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, core.loginWithPair(username, gunPair)];
                    case 4:
                        loginResult = _a.sent();
                        if (!loginResult.success) {
                            console.log("🔐 ZK-Proof login - existing account not found, this might be first login");
                        }
                        else {
                            console.log("🔐 ZK-Proof login - Gun authentication successful");
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        authError_1 = _a.sent();
                        console.log("🔐 ZK-Proof login - existing account not found, this might be first login");
                        return [3 /*break*/, 6];
                    case 6:
                        // Set authentication method
                        core.setAuthMethod("zkproof");
                        // Add to default group
                        this.addToGroup(identityData.commitment);
                        result = {
                            success: true,
                            userPub: gunPair.pub,
                            username: username,
                            authMethod: "zkproof",
                            sea: {
                                pub: gunPair.pub,
                                priv: gunPair.priv,
                                epub: gunPair.epub,
                                epriv: gunPair.epriv,
                            },
                        };
                        // Emit login event
                        core.emit("auth:login", {
                            userPub: gunPair.pub,
                            username: username,
                            method: "zkproof",
                        });
                        console.log("🔐 ZK-Proof login - complete");
                        return [2 /*return*/, result];
                    case 7:
                        error_6 = _a.sent();
                        errorType = (error_6 === null || error_6 === void 0 ? void 0 : error_6.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_6 === null || error_6 === void 0 ? void 0 : error_6.code) || "ZK_LOGIN_ERROR";
                        errorMessage = (error_6 === null || error_6 === void 0 ? void 0 : error_6.message) || "Unknown error during ZK-Proof login";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_6);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sign up with new ZK identity
     * @param seed - Optional seed for deterministic generation
     * @returns Authentication result with trapdoor for backup
     */
    ZkProofPlugin.prototype.signUp = function (seed) {
        return __awaiter(this, void 0, void 0, function () {
            var core, connector, identityData, gunPair, username, signUpResult, loginResult, createError_1, result, error_7, errorType, errorCode, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        core = this.assertInitialized();
                        connector = this.assertConnector();
                        console.log("🔐 ZK-Proof signup - generating new identity");
                        return [4 /*yield*/, connector.generateIdentity(seed)];
                    case 1:
                        identityData = _a.sent();
                        console.log("\uD83D\uDD10 ZK-Proof signup - identity generated, commitment: ".concat(identityData.commitment.slice(0, 16), "..."));
                        return [4 /*yield*/, connector.generateCredentials(identityData)];
                    case 2:
                        gunPair = _a.sent();
                        console.log("\uD83D\uDD10 ZK-Proof signup - Gun credentials generated, pub: ".concat(gunPair.pub.slice(0, 16), "..."));
                        username = "zk_".concat(identityData.commitment.slice(0, 16));
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, core.signUp(username, undefined, gunPair)];
                    case 4:
                        signUpResult = _a.sent();
                        if (!!signUpResult.success) return [3 /*break*/, 6];
                        return [4 /*yield*/, core.loginWithPair(username, gunPair)];
                    case 5:
                        loginResult = _a.sent();
                        if (!loginResult.success) {
                            throw new Error(loginResult.error || "Failed to authenticate");
                        }
                        _a.label = 6;
                    case 6:
                        console.log("🔐 ZK-Proof signup - Gun user created/authenticated");
                        return [3 /*break*/, 8];
                    case 7:
                        createError_1 = _a.sent();
                        throw createError_1;
                    case 8:
                        // Set authentication method
                        core.setAuthMethod("zkproof");
                        // Add to default group
                        this.addToGroup(identityData.commitment);
                        result = {
                            success: true,
                            userPub: gunPair.pub,
                            username: username,
                            authMethod: "zkproof",
                            isNewUser: true,
                            // CRITICAL: Include trapdoor for user backup (like seed phrase in WebAuthn)
                            seedPhrase: identityData.trapdoor,
                            sea: {
                                pub: gunPair.pub,
                                priv: gunPair.priv,
                                epub: gunPair.epub,
                                epriv: gunPair.epriv,
                            },
                        };
                        // Emit signup event
                        core.emit("auth:signup", {
                            userPub: gunPair.pub,
                            username: username,
                            method: "zkproof",
                        });
                        console.log("🔐 ZK-Proof signup - complete");
                        console.log("\u26A0\uFE0F  IMPORTANT: Save the trapdoor (seed phrase) for account recovery!");
                        return [2 /*return*/, result];
                    case 9:
                        error_7 = _a.sent();
                        errorType = (error_7 === null || error_7 === void 0 ? void 0 : error_7.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_7 === null || error_7 === void 0 ? void 0 : error_7.code) || "ZK_SIGNUP_ERROR";
                        errorMessage = (error_7 === null || error_7 === void 0 ? void 0 : error_7.message) || "Unknown error during ZK-Proof signup";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_7);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if ZK-Proof is available
     */
    ZkProofPlugin.prototype.isAvailable = function () {
        return typeof window !== "undefined" || typeof global !== "undefined";
    };
    return ZkProofPlugin;
}(base_1.BasePlugin));
exports.ZkProofPlugin = ZkProofPlugin;
