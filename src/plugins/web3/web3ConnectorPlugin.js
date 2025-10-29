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
exports.Web3ConnectorPlugin = void 0;
var base_1 = require("../base");
var web3Connector_1 = require("./web3Connector");
var web3Signer_1 = require("./web3Signer");
var errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
var Web3ConnectorPlugin = /** @class */ (function (_super) {
    __extends(Web3ConnectorPlugin, _super);
    function Web3ConnectorPlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "web3";
        _this.version = "1.0.0";
        _this.description = "Provides Ethereum wallet connection and authentication for ShogunCore";
        _this.Web3 = null;
        _this.signer = null;
        return _this;
    }
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.initialize = function (core) {
        _super.prototype.initialize.call(this, core);
        // Inizializziamo il modulo Web3
        this.Web3 = new web3Connector_1.Web3Connector();
        this.signer = new web3Signer_1.Web3Signer(this.Web3);
        // Rimuovo i console.log superflui
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.destroy = function () {
        if (this.Web3) {
            this.Web3.cleanup();
        }
        this.Web3 = null;
        this.signer = null;
        _super.prototype.destroy.call(this);
        // Linea 50
    };
    /**
     * Assicura che il modulo Web3 sia inizializzato
     * @private
     */
    Web3ConnectorPlugin.prototype.assertMetaMask = function () {
        this.assertInitialized();
        if (!this.Web3) {
            throw new Error("Web3 module not initialized");
        }
        return this.Web3;
    };
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    Web3ConnectorPlugin.prototype.assertSigner = function () {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("Web3 signer not initialized");
        }
        return this.signer;
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.isAvailable = function () {
        return this.assertMetaMask().isAvailable();
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.connectMetaMask = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertMetaMask().connectMetaMask()];
            });
        });
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.generateCredentials = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Rimuovo i console.log superflui
                return [2 /*return*/, this.assertMetaMask().generateCredentials(address)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.cleanup = function () {
        this.assertMetaMask().cleanup();
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.setCustomProvider = function (rpcUrl, privateKey) {
        this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.getSigner = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertMetaMask().getSigner()];
            });
        });
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.getProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertMetaMask().getProvider()];
            });
        });
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.generatePassword = function (signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertMetaMask().generatePassword(signature)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    Web3ConnectorPlugin.prototype.verifySignature = function (message, signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertMetaMask().verifySignature(message, signature)];
            });
        });
    };
    // === WEB3 SIGNER METHODS ===
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    Web3ConnectorPlugin.prototype.createSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.createSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.createSigningCredential(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createSigningCredential(address)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error creating Web3 signing credential: ".concat(error_1.message));
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an authenticator function for Web3 signing
     */
    Web3ConnectorPlugin.prototype.createAuthenticator = function (address) {
        try {
            var conn = this.assertMetaMask();
            if (typeof conn.createAuthenticator === "function") {
                return conn.createAuthenticator(address);
            }
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            console.error("Error creating Web3 authenticator: ".concat(error.message));
            throw error;
        }
    };
    /**
     * Creates a derived key pair from Web3 credential
     */
    Web3ConnectorPlugin.prototype.createDerivedKeyPair = function (address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.createDerivedKeyPair === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.createDerivedKeyPair(address, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createDerivedKeyPair(address, extra)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error creating derived key pair: ".concat(error_2.message));
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs data with derived keys after Web3 verification
     */
    Web3ConnectorPlugin.prototype.signWithDerivedKeys = function (data, address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.signWithDerivedKeys === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.signWithDerivedKeys(data, address, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().signWithDerivedKeys(data, address, extra)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error signing with derived keys: ".concat(error_3.message));
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get signing credential by address
     */
    Web3ConnectorPlugin.prototype.getSigningCredential = function (address) {
        var conn = this.assertMetaMask();
        if (typeof conn.getSigningCredential === "function") {
            return conn.getSigningCredential(address);
        }
        return this.assertSigner().getCredential(address);
    };
    /**
     * List all signing credentials
     */
    Web3ConnectorPlugin.prototype.listSigningCredentials = function () {
        var conn = this.assertMetaMask();
        if (typeof conn.listSigningCredentials === "function") {
            return conn.listSigningCredentials();
        }
        return this.assertSigner().listCredentials();
    };
    /**
     * Remove a signing credential
     */
    Web3ConnectorPlugin.prototype.removeSigningCredential = function (address) {
        var conn = this.assertMetaMask();
        if (typeof conn.removeSigningCredential === "function") {
            return conn.removeSigningCredential(address);
        }
        return this.assertSigner().removeCredential(address);
    };
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from Web3 signing credential
     * This ensures the SAME user is created as with normal approach
     */
    Web3ConnectorPlugin.prototype.createGunUserFromSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, result_1, core, authResult, result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log("\uD83D\uDD27 createGunUserFromSigningCredential called with address:", address);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.createGunUserFromSigningCredential === "function")) return [3 /*break*/, 2];
                        console.log("\uD83D\uDD27 Using connector's createGunUserFromSigningCredential");
                        return [4 /*yield*/, conn.createGunUserFromSigningCredential(address)];
                    case 1:
                        result_1 = _a.sent();
                        console.log("\uD83D\uDD27 Connector result:", result_1);
                        return [2 /*return*/, result_1];
                    case 2:
                        console.log("\uD83D\uDD27 Using fallback createGunUser");
                        core = this.assertInitialized();
                        // FIX: Use deterministic approach - try to authenticate first, then create if needed
                        console.log("\uD83D\uDD27 Attempting authentication with deterministic pair");
                        return [4 /*yield*/, this.assertSigner().authenticateWithExistingPair(address, core.gun)];
                    case 3:
                        authResult = _a.sent();
                        if (authResult.success) {
                            console.log("\uD83D\uDD27 Authentication successful with existing user");
                            return [2 /*return*/, authResult];
                        }
                        console.log("\uD83D\uDD27 Authentication failed, creating new user");
                        return [4 /*yield*/, this.assertSigner().createGunUser(address, core.gun)];
                    case 4:
                        result = _a.sent();
                        console.log("\uD83D\uDD27 User creation result:", result);
                        return [2 /*return*/, result];
                    case 5:
                        error_4 = _a.sent();
                        console.error("Error creating Gun user from Web3 signing credential: ".concat(error_4.message));
                        throw error_4;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a signing credential
     */
    Web3ConnectorPlugin.prototype.getGunUserPubFromSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conn = this.assertMetaMask();
                        if (!(typeof conn.getGunUserPubFromSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.getGunUserPubFromSigningCredential(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().getGunUserPub(address)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Get the password (for consistency checking)
     */
    Web3ConnectorPlugin.prototype.getPassword = function (address) {
        var conn = this.assertMetaMask();
        if (typeof conn.getPassword === "function") {
            return conn.getPassword(address);
        }
        return this.assertSigner().getPassword(address);
    };
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    Web3ConnectorPlugin.prototype.verifyConsistency = function (address, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.verifyConsistency === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.verifyConsistency(address, expectedUserPub)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().verifyConsistency(address, expectedUserPub)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_5 = _a.sent();
                        console.error("Error verifying Web3 consistency: ".concat(error_5.message));
                        return [2 /*return*/, { consistent: false }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    Web3ConnectorPlugin.prototype.setupConsistentOneshotSigning = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, credential, authenticator, gunUser, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        conn = this.assertMetaMask();
                        if (!(typeof conn.setupConsistentOneshotSigning === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.setupConsistentOneshotSigning(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.createSigningCredential(address)];
                    case 3:
                        credential = _a.sent();
                        authenticator = this.createAuthenticator(address);
                        return [4 /*yield*/, this.createGunUserFromSigningCredential(address)];
                    case 4:
                        gunUser = _a.sent();
                        return [2 /*return*/, {
                                credential: credential,
                                authenticator: authenticator,
                                gunUser: gunUser,
                                username: address,
                                password: "web3-generated-password",
                            }];
                    case 5:
                        error_6 = _a.sent();
                        console.error("Error setting up consistent Web3 oneshot signing: ".concat(error_6.message));
                        throw error_6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // === EXISTING METHODS ===
    /**
     * Login con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    Web3ConnectorPlugin.prototype.login = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var core, existingCredential, gunUser_1, loginResult_1, gunUser, loginResult, error_7, errorType, errorCode, errorMessage;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        core = this.assertInitialized();
                        if (!address) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 login");
                        }
                        if (!this.isAvailable()) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
                        }
                        console.log("\uD83D\uDD27 Web3 login - starting login for address:", address);
                        existingCredential = this.getSigningCredential(address);
                        if (!existingCredential) return [3 /*break*/, 2];
                        console.log("\uD83D\uDD27 Web3 login - found existing credential, using it");
                        return [4 /*yield*/, this.createGunUserFromSigningCredential(address)];
                    case 1:
                        gunUser_1 = _c.sent();
                        console.log("\uD83D\uDD27 Web3 login - existing credential result:", gunUser_1);
                        if (gunUser_1.success && gunUser_1.userPub) {
                            // Set authentication method to web3
                            core.setAuthMethod("web3");
                            loginResult_1 = {
                                success: true,
                                user: {
                                    userPub: gunUser_1.userPub,
                                    username: address,
                                },
                                userPub: gunUser_1.userPub,
                            };
                            console.log("\uD83D\uDD27 Web3 login - returning result:", {
                                success: loginResult_1.success,
                                userPub: loginResult_1.userPub
                                    ? loginResult_1.userPub.slice(0, 8) + "..."
                                    : "null",
                                username: (_a = loginResult_1.user) === null || _a === void 0 ? void 0 : _a.username,
                            });
                            // Emit login event
                            core.emit("auth:login", {
                                userPub: gunUser_1.userPub || "",
                                username: address,
                                method: "web3",
                            });
                            return [2 /*return*/, loginResult_1];
                        }
                        _c.label = 2;
                    case 2:
                        // If no existing credential or it failed, create a new one (for first-time login)
                        console.log("\uD83D\uDD27 Web3 login - no existing credential, creating new one");
                        return [4 /*yield*/, this.setupConsistentOneshotSigning(address)];
                    case 3:
                        gunUser = (_c.sent()).gunUser;
                        console.log("\uD83D\uDD27 Web3 login - setupConsistentOneshotSigning result:", {
                            gunUser: gunUser,
                            address: address,
                        });
                        if (!gunUser.success) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_LOGIN_FAILED", gunUser.error || "Failed to log in with Web3 credentials");
                        }
                        console.log("\uD83D\uDD27 Web3 login - gunUser success, userPub:", gunUser.userPub ? gunUser.userPub.slice(0, 8) + "..." : "null");
                        // Set authentication method to web3
                        core.setAuthMethod("web3");
                        loginResult = {
                            success: true,
                            user: {
                                userPub: gunUser.userPub,
                                username: address,
                            },
                            userPub: gunUser.userPub,
                        };
                        console.log("\uD83D\uDD27 Web3 login - returning result:", {
                            success: loginResult.success,
                            userPub: loginResult.userPub
                                ? loginResult.userPub.slice(0, 8) + "..."
                                : "null",
                            username: (_b = loginResult.user) === null || _b === void 0 ? void 0 : _b.username,
                        });
                        // Emit login event
                        core.emit("auth:login", {
                            userPub: gunUser.userPub || "",
                            username: address,
                            method: "web3",
                        });
                        return [2 /*return*/, loginResult];
                    case 4:
                        error_7 = _c.sent();
                        errorType = (error_7 === null || error_7 === void 0 ? void 0 : error_7.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_7 === null || error_7 === void 0 ? void 0 : error_7.code) || "WEB3_LOGIN_ERROR";
                        errorMessage = (error_7 === null || error_7 === void 0 ? void 0 : error_7.message) || "Unknown error during Web3 login";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_7);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register new user with Web3 wallet
     * @param address - Ethereum address
     * @returns {Promise<SignUpResult>} Registration result
     */
    Web3ConnectorPlugin.prototype.signUp = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var core, gunUser, signupResult, error_8, errorType, errorCode, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        core = this.assertInitialized();
                        if (!address) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 registration");
                        }
                        if (!this.isAvailable()) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
                        }
                        return [4 /*yield*/, this.setupConsistentOneshotSigning(address)];
                    case 1:
                        gunUser = (_a.sent()).gunUser;
                        if (!gunUser.success) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_SIGNUP_FAILED", gunUser.error || "Failed to sign up with Web3 credentials");
                        }
                        // Set authentication method to web3
                        core.setAuthMethod("web3");
                        signupResult = {
                            success: true,
                            user: {
                                userPub: gunUser.userPub,
                                username: address,
                            },
                            userPub: gunUser.userPub,
                        };
                        return [2 /*return*/, signupResult];
                    case 2:
                        error_8 = _a.sent();
                        errorType = (error_8 === null || error_8 === void 0 ? void 0 : error_8.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_8 === null || error_8 === void 0 ? void 0 : error_8.code) || "WEB3_SIGNUP_ERROR";
                        errorMessage = (error_8 === null || error_8 === void 0 ? void 0 : error_8.message) || "Unknown error during Web3 registration";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_8);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Web3ConnectorPlugin;
}(base_1.BasePlugin));
exports.Web3ConnectorPlugin = Web3ConnectorPlugin;
