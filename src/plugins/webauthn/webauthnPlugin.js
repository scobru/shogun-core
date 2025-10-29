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
exports.WebauthnPlugin = void 0;
var base_1 = require("../base");
var webauthn_1 = require("./webauthn");
var webauthnSigner_1 = require("./webauthnSigner");
var errorHandler_1 = require("../../utils/errorHandler");
var seedPhrase_1 = require("../../utils/seedPhrase");
var webauthn_2 = require("./webauthn");
/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
var WebauthnPlugin = /** @class */ (function (_super) {
    __extends(WebauthnPlugin, _super);
    function WebauthnPlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "webauthn";
        _this.version = "1.0.0";
        _this.description = "Provides WebAuthn authentication functionality for ShogunCore";
        _this.webauthn = null;
        _this.signer = null;
        return _this;
    }
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.initialize = function (core) {
        _super.prototype.initialize.call(this, core);
        // Verifica se siamo in ambiente browser
        if (typeof window === "undefined") {
            console.warn("[webauthnPlugin] WebAuthn plugin disabled - not in browser environment");
            return;
        }
        // Verifica se WebAuthn è supportato
        if (!this.isSupported()) {
            console.warn("[webauthnPlugin] WebAuthn not supported in this environment");
            return;
        }
        // Inizializziamo il modulo WebAuthn
        this.webauthn = new webauthn_1.Webauthn(core.gun);
        this.signer = new webauthnSigner_1.WebAuthnSigner(this.webauthn);
        console.log("[webauthnPlugin] WebAuthn plugin initialized with signer support");
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.destroy = function () {
        this.webauthn = null;
        this.signer = null;
        _super.prototype.destroy.call(this);
        console.log("[webauthnPlugin] WebAuthn plugin destroyed");
    };
    /**
     * Assicura che il modulo Webauthn sia inizializzato
     * @private
     */
    WebauthnPlugin.prototype.assertWebauthn = function () {
        this.assertInitialized();
        if (!this.webauthn) {
            throw new Error("WebAuthn module not initialized");
        }
        return this.webauthn;
    };
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    WebauthnPlugin.prototype.assertSigner = function () {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("WebAuthn signer not initialized");
        }
        return this.signer;
    };
    /**
     * Genera un pair SEA dalle credenziali WebAuthn
     * @private
     */
    WebauthnPlugin.prototype.generatePairFromCredentials = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var pair, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.assertSigner().createDerivedKeyPair(credentials.credentialId, credentials.username)];
                    case 1:
                        pair = _a.sent();
                        return [2 /*return*/, pair];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error generating pair from WebAuthn credentials:", error_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.isSupported = function () {
        // Verifica se siamo in ambiente browser
        if (typeof window === "undefined") {
            return false;
        }
        // Check if PublicKeyCredential is available
        if (typeof window.PublicKeyCredential === "undefined") {
            return false;
        }
        // In test environment, allow initialization if window.PublicKeyCredential is mocked
        if (process.env.NODE_ENV === "test") {
            return typeof window.PublicKeyCredential !== "undefined";
        }
        // Se il plugin non è stato inizializzato, verifica direttamente il supporto
        if (!this.webauthn) {
            return typeof window.PublicKeyCredential !== "undefined";
        }
        return this.webauthn.isSupported();
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.generateCredentials = function (username_1, existingCredential_1) {
        return __awaiter(this, arguments, void 0, function (username, existingCredential, isLogin) {
            if (isLogin === void 0) { isLogin = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertWebauthn().generateCredentials(username, existingCredential, isLogin)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.createAccount = function (username_1, credentials_1) {
        return __awaiter(this, arguments, void 0, function (username, credentials, isNewDevice) {
            if (isNewDevice === void 0) { isNewDevice = false; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertWebauthn().createAccount(username, credentials, isNewDevice)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.authenticateUser = function (username, salt, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertWebauthn().authenticateUser(username, salt, options)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.abortAuthentication = function () {
        this.assertWebauthn().abortAuthentication();
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.removeDevice = function (username, credentialId, credentials) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assertWebauthn().removeDevice(username, credentialId, credentials)];
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.createSigningCredential = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.createSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.createSigningCredential(username)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createSigningCredential(username)];
                    case 3: 
                    // Fallback to signer implementation if available
                    return [2 /*return*/, _a.sent()];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error creating signing credential: ".concat(error_2.message));
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.createAuthenticator = function (credentialId) {
        try {
            var wa = this.assertWebauthn();
            if (typeof wa.createAuthenticator === "function") {
                return wa.createAuthenticator(credentialId);
            }
            return this.assertSigner().createAuthenticator(credentialId);
        }
        catch (error) {
            console.error("Error creating authenticator: ".concat(error.message));
            throw error;
        }
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.createDerivedKeyPair = function (credentialId, username, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.createDerivedKeyPair === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.createDerivedKeyPair(credentialId, username, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().createDerivedKeyPair(credentialId, username, extra)];
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
     * @inheritdoc
     */
    WebauthnPlugin.prototype.signWithDerivedKeys = function (data, credentialId, username, extra) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.signWithDerivedKeys === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.signWithDerivedKeys(data, credentialId, username, extra)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().signWithDerivedKeys(data, credentialId, username, extra)];
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
     * @inheritdoc
     */
    WebauthnPlugin.prototype.getSigningCredential = function (credentialId) {
        var wa = this.assertWebauthn();
        if (typeof wa.getSigningCredential === "function") {
            return wa.getSigningCredential(credentialId);
        }
        return this.assertSigner().getCredential(credentialId);
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.listSigningCredentials = function () {
        var wa = this.assertWebauthn();
        if (typeof wa.listSigningCredentials === "function") {
            return wa.listSigningCredentials();
        }
        return this.assertSigner().listCredentials();
    };
    /**
     * @inheritdoc
     */
    WebauthnPlugin.prototype.removeSigningCredential = function (credentialId) {
        var wa = this.assertWebauthn();
        if (typeof wa.removeSigningCredential === "function") {
            return wa.removeSigningCredential(credentialId);
        }
        return this.assertSigner().removeCredential(credentialId);
    };
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from WebAuthn signing credential
     * This ensures the SAME user is created as with normal approach
     */
    WebauthnPlugin.prototype.createGunUserFromSigningCredential = function (credentialId, username) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, core, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.createGunUserFromSigningCredential === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.createGunUserFromSigningCredential(credentialId, username)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        core = this.assertInitialized();
                        return [4 /*yield*/, this.assertSigner().createGunUser(credentialId, username, core.gun)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_5 = _a.sent();
                        console.error("Error creating Gun user from signing credential: ".concat(error_5.message));
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the Gun user public key for a signing credential
     */
    WebauthnPlugin.prototype.getGunUserPubFromSigningCredential = function (credentialId) {
        var wa = this.assertWebauthn();
        if (typeof wa.getGunUserPubFromSigningCredential === "function") {
            return wa.getGunUserPubFromSigningCredential(credentialId);
        }
        return this.assertSigner().getGunUserPub(credentialId);
    };
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    WebauthnPlugin.prototype.getHashedCredentialId = function (credentialId) {
        var wa = this.assertWebauthn();
        if (typeof wa.getHashedCredentialId === "function") {
            return wa.getHashedCredentialId(credentialId);
        }
        return this.assertSigner().getHashedCredentialId(credentialId);
    };
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    WebauthnPlugin.prototype.verifyConsistency = function (credentialId, username, expectedUserPub) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.verifyConsistency === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.verifyConsistency(credentialId, username, expectedUserPub)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.assertSigner().verifyConsistency(credentialId, username, expectedUserPub)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_6 = _a.sent();
                        console.error("Error verifying consistency: ".concat(error_6.message));
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
    WebauthnPlugin.prototype.setupConsistentOneshotSigning = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var wa, credential, authenticator, gunUser, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        wa = this.assertWebauthn();
                        if (!(typeof wa.setupConsistentOneshotSigning === "function")) return [3 /*break*/, 2];
                        return [4 /*yield*/, wa.setupConsistentOneshotSigning(username)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.createSigningCredential(username)];
                    case 3:
                        credential = _a.sent();
                        authenticator = this.createAuthenticator(credential.id);
                        return [4 /*yield*/, this.createGunUserFromSigningCredential(credential.id, username)];
                    case 4:
                        gunUser = _a.sent();
                        return [2 /*return*/, {
                                credential: credential,
                                authenticator: authenticator,
                                gunUser: gunUser,
                                pub: credential.pub,
                                hashedCredentialId: credential.hashedCredentialId,
                            }];
                    case 5:
                        error_7 = _a.sent();
                        console.error("Error setting up consistent oneshot signing: ".concat(error_7.message));
                        throw error_7;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Login with WebAuthn
     * This is the recommended method for WebAuthn authentication
     * @param username - Username
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates user using WebAuthn credentials.
     * Requires browser support for WebAuthn and existing credentials.
     */
    WebauthnPlugin.prototype.login = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var core, _a, authenticator, pub, credentials, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        core = this.assertInitialized();
                        if (!username) {
                            throw new Error("Username required for WebAuthn login");
                        }
                        if (!this.isSupported()) {
                            throw new Error("WebAuthn is not supported by this browser");
                        }
                        return [4 /*yield*/, this.setupConsistentOneshotSigning(username)];
                    case 1:
                        _a = (_b.sent()), authenticator = _a.authenticator, pub = _a.pub;
                        if (!core.authenticate) return [3 /*break*/, 3];
                        return [4 /*yield*/, core.authenticate(username, authenticator, pub)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.generateCredentials(username, null, true)];
                    case 4:
                        credentials = _b.sent();
                        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.success)) {
                            throw new Error((credentials === null || credentials === void 0 ? void 0 : credentials.error) || "WebAuthn verification failed");
                        }
                        core.setAuthMethod("webauthn");
                        return [4 /*yield*/, core.login(username, "", credentials.key)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6:
                        error_8 = _b.sent();
                        console.error("Error during WebAuthn login: ".concat(error_8));
                        // Log but do not depend on handler return value
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_LOGIN_ERROR", error_8.message || "Error during WebAuthn login", error_8);
                        return [2 /*return*/, {
                                success: false,
                                error: error_8.message || "Error during WebAuthn login",
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register new user with WebAuthn
     * This is the recommended method for WebAuthn registration
     * @param username - Username
     * @param options - Optional signup options (seed phrase support)
     * @returns {Promise<SignUpResult>} Registration result with optional seed phrase
     * @description Creates a new user account using WebAuthn credentials.
     * Requires browser support for WebAuthn.
     * If generateSeedPhrase is true, returns a BIP39 mnemonic for multi-device support.
     */
    WebauthnPlugin.prototype.signUp = function (username, options) {
        return __awaiter(this, void 0, void 0, function () {
            var core, seedPhrase, shouldGenerateSeed, pair, password, derivedKeys, credentials, generatedPair, result, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        core = this.assertInitialized();
                        if (!username) {
                            throw new Error("Username required for WebAuthn registration");
                        }
                        if (!this.isSupported()) {
                            throw new Error("WebAuthn is not supported by this browser");
                        }
                        seedPhrase = void 0;
                        shouldGenerateSeed = (options === null || options === void 0 ? void 0 : options.generateSeedPhrase) !== false;
                        if (options === null || options === void 0 ? void 0 : options.seedPhrase) {
                            // Use provided seed phrase
                            if (!(0, seedPhrase_1.validateSeedPhrase)(options.seedPhrase)) {
                                throw new Error("Invalid seed phrase provided");
                            }
                            seedPhrase = options.seedPhrase;
                        }
                        else if (shouldGenerateSeed) {
                            // Generate new seed phrase for multi-device support
                            seedPhrase = (0, seedPhrase_1.generateSeedPhrase)();
                            console.log("[webauthnPlugin] Generated seed phrase for multi-device support");
                        }
                        pair = void 0;
                        if (!seedPhrase) return [3 /*break*/, 2];
                        password = (0, seedPhrase_1.deriveCredentialsFromMnemonic)(seedPhrase, username).password;
                        return [4 /*yield*/, (0, webauthn_2.deriveWebauthnKeys)(username, seedPhrase, true)];
                    case 1:
                        derivedKeys = _a.sent();
                        pair = {
                            pub: derivedKeys.pub,
                            priv: derivedKeys.priv,
                            epub: derivedKeys.epub,
                            epriv: derivedKeys.epriv,
                        };
                        return [3 /*break*/, 5];
                    case 2: return [4 /*yield*/, this.generateCredentials(username, null, false)];
                    case 3:
                        credentials = _a.sent();
                        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.success)) {
                            throw new Error((credentials === null || credentials === void 0 ? void 0 : credentials.error) || "Unable to generate WebAuthn credentials");
                        }
                        return [4 /*yield*/, this.generatePairFromCredentials(credentials)];
                    case 4:
                        generatedPair = _a.sent();
                        if (!generatedPair) {
                            throw new Error("Failed to generate SEA pair from WebAuthn credentials");
                        }
                        pair = generatedPair;
                        _a.label = 5;
                    case 5:
                        core.setAuthMethod("webauthn");
                        return [4 /*yield*/, core.signUp(username, undefined, pair)];
                    case 6:
                        result = _a.sent();
                        // Add seed phrase to result if generated
                        if (seedPhrase && shouldGenerateSeed) {
                            return [2 /*return*/, __assign(__assign({}, result), { message: seedPhrase
                                        ? "🔑 IMPORTANT: Save your 12-word seed phrase to access your account from other devices!"
                                        : result.message, seedPhrase: seedPhrase })];
                        }
                        return [2 /*return*/, result];
                    case 7:
                        error_9 = _a.sent();
                        console.error("Error during WebAuthn registration: ".concat(error_9));
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_SIGNUP_ERROR", error_9.message || "Error during WebAuthn registration", error_9);
                        return [2 /*return*/, {
                                success: false,
                                error: error_9.message || "Error during WebAuthn registration",
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Import existing account from seed phrase
     * Allows accessing the same account across multiple devices
     * @param username - Username
     * @param seedPhrase - 12-word BIP39 mnemonic seed phrase
     * @returns {Promise<SignUpResult>} Registration result
     */
    WebauthnPlugin.prototype.importFromSeed = function (username, seedPhrase) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedSeed, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!username) {
                            throw new Error("Username required");
                        }
                        normalizedSeed = (0, seedPhrase_1.normalizeSeedPhrase)(seedPhrase);
                        if (!(0, seedPhrase_1.validateSeedPhrase)(normalizedSeed)) {
                            throw new Error("Invalid seed phrase. Please check and try again.");
                        }
                        console.log("[webauthnPlugin] Importing account from seed phrase");
                        return [4 /*yield*/, this.signUp(username, {
                                seedPhrase: normalizedSeed,
                                generateSeedPhrase: false, // Don't generate new seed
                            })];
                    case 1: 
                    // Use signUp with existing seed phrase
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        console.error("Error importing from seed: ".concat(error_10.message));
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "WEBAUTHN_IMPORT_ERROR", error_10.message || "Error importing from seed phrase", error_10);
                        return [2 /*return*/, {
                                success: false,
                                error: error_10.message || "Error importing from seed phrase",
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get seed phrase for current user (if stored)
     * Note: Seed phrases are NOT stored by default for security
     * Users should save their seed phrase during registration
     * @param username - Username
     * @returns {Promise<string | null>} Seed phrase or null
     */
    WebauthnPlugin.prototype.getSeedPhrase = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.warn("[webauthnPlugin] Seed phrases are not stored for security reasons");
                console.warn("[webauthnPlugin] Users must save their seed phrase during registration");
                return [2 /*return*/, null];
            });
        });
    };
    return WebauthnPlugin;
}(base_1.BasePlugin));
exports.WebauthnPlugin = WebauthnPlugin;
