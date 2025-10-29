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
exports.NostrConnectorPlugin = void 0;
var base_1 = require("../base");
var nostrConnector_1 = require("./nostrConnector");
var nostrSigner_1 = require("./nostrSigner");
var errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
var NostrConnectorPlugin = /** @class */ (function (_super) {
    __extends(NostrConnectorPlugin, _super);
    function NostrConnectorPlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "nostr";
        _this.version = "1.0.0";
        _this.description = "Provides Bitcoin wallet connection and authentication for ShogunCore";
        _this.bitcoinConnector = null;
        _this.signer = null;
        return _this;
    }
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.initialize = function (core) {
        _super.prototype.initialize.call(this, core);
        // Initialize the Bitcoin wallet module
        this.bitcoinConnector = new nostrConnector_1.NostrConnector();
        this.signer = new nostrSigner_1.NostrSigner(this.bitcoinConnector);
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.destroy = function () {
        if (this.bitcoinConnector) {
            this.bitcoinConnector.cleanup();
        }
        this.bitcoinConnector = null;
        this.signer = null;
        _super.prototype.destroy.call(this);
    };
    /**
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    NostrConnectorPlugin.prototype.assertBitcoinConnector = function () {
        this.assertInitialized();
        if (!this.bitcoinConnector) {
            throw new Error("Bitcoin wallet module not initialized");
        }
        return this.bitcoinConnector;
    };
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    NostrConnectorPlugin.prototype.assertSigner = function () {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("Nostr signer not initialized");
        }
        return this.signer;
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.isAvailable = function () {
        return this.assertBitcoinConnector().isAvailable();
    };
    /**
     * Check if Nostr extension is available
     */
    NostrConnectorPlugin.prototype.isNostrExtensionAvailable = function () {
        return this.assertBitcoinConnector().isNostrExtensionAvailable();
    };
    /**
     * Connect to Nostr wallet automatically
     * This is a convenience method for easy wallet connection
     */
    NostrConnectorPlugin.prototype.connectNostrWallet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.isNostrExtensionAvailable()) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Nostr extension not available. Please install a Nostr extension like nos2x, Alby, or Coracle.",
                                }];
                        }
                        return [4 /*yield*/, this.connectBitcoinWallet("nostr")];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                        }
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _a.sent();
                        console.error("[nostrConnectorPlugin] Error connecting to Nostr wallet:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message || "Unknown error connecting to Nostr wallet",
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.connectBitcoinWallet = function () {
        return __awaiter(this, arguments, void 0, function (type) {
            if (type === void 0) { type = "nostr"; }
            return __generator(this, function (_a) {
                // Prioritize nostr over alby (since they are functionally identical)
                // If type is alby, try to use nostr instead
                if (type === "alby") {
                    type = "nostr";
                }
                return [2 /*return*/, this.assertBitcoinConnector().connectWallet(type)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.generateCredentials = function (address, signature, message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertBitcoinConnector().generateCredentials(address, signature, message)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.cleanup = function () {
        this.assertBitcoinConnector().cleanup();
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.verifySignature = function (message, signature, address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertBitcoinConnector().verifySignature(message, signature, address)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    NostrConnectorPlugin.prototype.generatePassword = function (signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertBitcoinConnector().generatePassword(signature)];
            });
        });
    };
    // === NOSTR SIGNER METHODS ===
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    NostrConnectorPlugin.prototype.createSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertBitcoinConnector();
                        if (!(typeof conn.createSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.createSigningCredential(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createSigningCredential(address)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error creating Nostr signing credential: ".concat(error_2.message));
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an authenticator function for Nostr signing
     */
    NostrConnectorPlugin.prototype.createAuthenticator = function (address) {
        try {
            var conn = this.assertBitcoinConnector();
            if (typeof conn.createAuthenticator === "function") {
                return conn.createAuthenticator(address);
            }
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            console.error("Error creating Nostr authenticator: ".concat(error.message));
            throw error;
        }
    };
    /**
     * Creates a derived key pair from Nostr credential
     */
    NostrConnectorPlugin.prototype.createDerivedKeyPair = function (address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertBitcoinConnector();
                        if (!(typeof conn.createDerivedKeyPair === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.createDerivedKeyPair(address, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createDerivedKeyPair(address, extra)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error creating derived key pair: ".concat(error_3.message));
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Signs data with derived keys after Nostr verification
     */
    NostrConnectorPlugin.prototype.signWithDerivedKeys = function (data, address, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertBitcoinConnector();
                        if (!(typeof conn.signWithDerivedKeys === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.signWithDerivedKeys(data, address, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().signWithDerivedKeys(data, address, extra)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_4 = _a.sent();
                        console.error("Error signing with derived keys: ".concat(error_4.message));
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get signing credential by address
     */
    NostrConnectorPlugin.prototype.getSigningCredential = function (address) {
        var conn = this.assertBitcoinConnector();
        if (typeof conn.getSigningCredential === "function") {
            return conn.getSigningCredential(address);
        }
        return this.assertSigner().getCredential(address);
    };
    /**
     * List all signing credentials
     */
    NostrConnectorPlugin.prototype.listSigningCredentials = function () {
        var conn = this.assertBitcoinConnector();
        if (typeof conn.listSigningCredentials === "function") {
            return conn.listSigningCredentials();
        }
        return this.assertSigner().listCredentials();
    };
    /**
     * Remove a signing credential
     */
    NostrConnectorPlugin.prototype.removeSigningCredential = function (address) {
        var conn = this.assertBitcoinConnector();
        if (typeof conn.removeSigningCredential === "function") {
            return conn.removeSigningCredential(address);
        }
        return this.assertSigner().removeCredential(address);
    };
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from Nostr signing credential
     * This ensures the SAME user is created as with normal approach
     */
    NostrConnectorPlugin.prototype.createGunUserFromSigningCredential = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, core, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertBitcoinConnector();
                        if (!(typeof conn.createGunUserFromSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.createGunUserFromSigningCredential(address)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        core = this.assertInitialized();
                        return [4 /*yield*/, this.assertSigner().createGunUser(address, core.gun)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_5 = _a.sent();
                        console.error("Error creating Gun user from Nostr signing credential: ".concat(error_5.message));
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a signing credential
     */
    NostrConnectorPlugin.prototype.getGunUserPubFromSigningCredential = function (address) {
        var conn = this.assertBitcoinConnector();
        if (typeof conn.getGunUserPubFromSigningCredential === "function") {
            return conn.getGunUserPubFromSigningCredential(address);
        }
        return this.assertSigner().getGunUserPub(address);
    };
    /**
     * Get the password (for consistency checking)
     */
    NostrConnectorPlugin.prototype.getPassword = function (address) {
        var conn = this.assertBitcoinConnector();
        if (typeof conn.getPassword === "function") {
            return conn.getPassword(address);
        }
        return this.assertSigner().getPassword(address);
    };
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    NostrConnectorPlugin.prototype.verifyConsistency = function (address, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        conn = this.assertBitcoinConnector();
                        if (!(typeof conn.verifyConsistency === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, conn.verifyConsistency(address, expectedUserPub)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().verifyConsistency(address, expectedUserPub)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_6 = _a.sent();
                        console.error("Error verifying Nostr consistency: ".concat(error_6.message));
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
    NostrConnectorPlugin.prototype.setupConsistentOneshotSigning = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var conn, credential, authenticator, gunUser, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        conn = this.assertBitcoinConnector();
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
                                username: credential.username,
                                password: credential.password,
                            }];
                    case 5:
                        error_7 = _a.sent();
                        console.error("Error setting up consistent Nostr oneshot signing: ".concat(error_7.message));
                        throw error_7;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // === EXISTING METHODS ===
    /**
     * Login with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates the user using Bitcoin wallet credentials after signature verification
     */
    NostrConnectorPlugin.prototype.login = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var core, message, signature, credentials, isValid, k, loginResult, error_8, errorType, errorCode, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        core = this.assertInitialized();
                        if (!address) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for login");
                        }
                        if (!this.isAvailable()) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
                        }
                        message = nostrConnector_1.MESSAGE_TO_SIGN;
                        return [4 /*yield*/, this.assertBitcoinConnector().requestSignature(address, message)];
                    case 1:
                        signature = _a.sent();
                        return [4 /*yield*/, this.generateCredentials(address, signature, message)];
                    case 2:
                        credentials = _a.sent();
                        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.username) ||
                            !(credentials === null || credentials === void 0 ? void 0 : credentials.key) ||
                            !credentials.message ||
                            !credentials.signature) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
                        }
                        return [4 /*yield*/, this.verifySignature(credentials.message, credentials.signature, address)];
                    case 3:
                        isValid = _a.sent();
                        if (!isValid) {
                            console.error("Signature verification failed for address: ".concat(address));
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
                        }
                        return [4 /*yield*/, (0, nostrConnector_1.deriveNostrKeys)(address, signature, message)];
                    case 4:
                        k = _a.sent();
                        // Set authentication method to nostr before login
                        core.setAuthMethod("nostr");
                        return [4 /*yield*/, core.login(credentials.username, "", k)];
                    case 5:
                        loginResult = _a.sent();
                        if (!loginResult.success) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_LOGIN_FAILED", loginResult.error || "Failed to log in with Bitcoin credentials");
                        }
                        // Emit login event
                        core.emit("auth:login", {
                            userPub: loginResult.userPub || "",
                            username: credentials.username,
                            method: "nostr",
                        });
                        return [2 /*return*/, loginResult];
                    case 6:
                        error_8 = _a.sent();
                        errorType = (error_8 === null || error_8 === void 0 ? void 0 : error_8.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_8 === null || error_8 === void 0 ? void 0 : error_8.code) || "BITCOIN_LOGIN_ERROR";
                        errorMessage = (error_8 === null || error_8 === void 0 ? void 0 : error_8.message) || "Unknown error during Bitcoin wallet login";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_8);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register new user with Nostr wallet
     * @param address - Nostr address
     * @returns {Promise<SignUpResult>} Registration result
     */
    NostrConnectorPlugin.prototype.signUp = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var core, message, signature, credentials, isValid, k, signupResult, authResult, authResult, error_9, errorType, errorCode, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 11, , 12]);
                        core = this.assertInitialized();
                        if (!address) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for signup");
                        }
                        if (!this.isAvailable()) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
                        }
                        message = nostrConnector_1.MESSAGE_TO_SIGN;
                        return [4 /*yield*/, this.assertBitcoinConnector().requestSignature(address, message)];
                    case 1:
                        signature = _a.sent();
                        return [4 /*yield*/, this.generateCredentials(address, signature, message)];
                    case 2:
                        credentials = _a.sent();
                        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.username) ||
                            !(credentials === null || credentials === void 0 ? void 0 : credentials.key) ||
                            !credentials.message ||
                            !credentials.signature) {
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
                        }
                        return [4 /*yield*/, this.verifySignature(credentials.message, credentials.signature, address)];
                    case 3:
                        isValid = _a.sent();
                        if (!isValid) {
                            console.error("Signature verification failed for address: ".concat(address));
                            throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
                        }
                        return [4 /*yield*/, (0, nostrConnector_1.deriveNostrKeys)(address, signature, message)];
                    case 4:
                        k = _a.sent();
                        // Set authentication method to nostr before signup
                        core.setAuthMethod("nostr");
                        return [4 /*yield*/, core.signUp(credentials.username, undefined, k)];
                    case 5:
                        signupResult = _a.sent();
                        if (!signupResult.success) return [3 /*break*/, 7];
                        return [4 /*yield*/, core.login(credentials.username, "", k)];
                    case 6:
                        authResult = _a.sent();
                        if (authResult.success) {
                            console.log("Bitcoin wallet registration and login completed for user: ".concat(credentials.username));
                            // Emetti eventi
                            core.emit("auth:signup", {
                                userPub: authResult.userPub || "",
                                username: credentials.username,
                                method: "nostr",
                            });
                            return [2 /*return*/, __assign({}, authResult)];
                        }
                        else {
                            return [2 /*return*/, __assign(__assign({}, signupResult), { error: "User created but login failed" })];
                        }
                        return [3 /*break*/, 10];
                    case 7:
                        if (!(signupResult.error &&
                            signupResult.error.toLowerCase().includes("exist"))) return [3 /*break*/, 9];
                        return [4 /*yield*/, core.login(credentials.username, "", k)];
                    case 8:
                        authResult = _a.sent();
                        return [2 /*return*/, __assign({}, authResult)];
                    case 9: return [2 /*return*/, signupResult];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_9 = _a.sent();
                        errorType = (error_9 === null || error_9 === void 0 ? void 0 : error_9.type) || errorHandler_1.ErrorType.AUTHENTICATION;
                        errorCode = (error_9 === null || error_9 === void 0 ? void 0 : error_9.code) || "BITCOIN_SIGNUP_ERROR";
                        errorMessage = (error_9 === null || error_9 === void 0 ? void 0 : error_9.message) || "Unknown error during Bitcoin wallet signup";
                        errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error_9);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convenience method that matches the interface pattern
     */
    NostrConnectorPlugin.prototype.loginWithBitcoinWallet = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.login(address)];
            });
        });
    };
    /**
     * Convenience method that matches the interface pattern
     */
    NostrConnectorPlugin.prototype.signUpWithBitcoinWallet = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.signUp(address)];
            });
        });
    };
    return NostrConnectorPlugin;
}(base_1.BasePlugin));
exports.NostrConnectorPlugin = NostrConnectorPlugin;
