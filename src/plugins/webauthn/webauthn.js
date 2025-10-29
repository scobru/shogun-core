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
exports.Webauthn = void 0;
exports.deriveWebauthnKeys = deriveWebauthnKeys;
/**
 * Constants for WebAuthn configuration
 */
var MIN_USERNAME_LENGTH = 3;
var MAX_USERNAME_LENGTH = 64;
var ethers_1 = require("ethers");
var errorHandler_1 = require("../../utils/errorHandler");
var eventEmitter_1 = require("../../utils/eventEmitter");
var types_1 = require("./types");
var derive_1 = require("../../gundb/derive");
var seedPhrase_1 = require("../../utils/seedPhrase");
/**
 * Constants for WebAuthn configuration
 */
var DEFAULT_CONFIG = {
    rpName: "Shogun Wallet",
    timeout: 60000,
    userVerification: "preferred",
    attestation: "none",
    authenticatorAttachment: "platform",
    requireResidentKey: false,
};
/**
 * Main WebAuthn class for authentication management
 */
var Webauthn = /** @class */ (function (_super) {
    __extends(Webauthn, _super);
    /**
     * Creates a new WebAuthn instance
     */
    function Webauthn(gunInstance, config) {
        var _a;
        var _this = _super.call(this) || this;
        _this.abortController = null;
        _this.gunInstance = gunInstance;
        _this.credential = null;
        // Merge default config with provided config
        _this.config = __assign(__assign(__assign({}, DEFAULT_CONFIG), config), { rpId: (_a = config === null || config === void 0 ? void 0 : config.rpId) !== null && _a !== void 0 ? _a : (typeof window !== "undefined" &&
                window.location &&
                window.location.hostname
                ? window.location.hostname.split(":")[0]
                : "localhost") });
        return _this;
    }
    /**
     * Validates a username
     */
    Webauthn.prototype.validateUsername = function (username) {
        if (!username || typeof username !== "string") {
            throw new Error("Username must be a non-empty string");
        }
        if (username.length < MIN_USERNAME_LENGTH ||
            username.length > MAX_USERNAME_LENGTH) {
            throw new Error("Username must be between ".concat(MIN_USERNAME_LENGTH, " and ").concat(MAX_USERNAME_LENGTH, " characters"));
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new Error("Username can only contain letters, numbers, underscores and hyphens");
        }
    };
    /**
     * Creates a new WebAuthn account with retry logic
     */
    Webauthn.prototype.createAccount = function (username_1, credentials_1) {
        return __awaiter(this, arguments, void 0, function (username, credentials, isNewDevice) {
            var maxRetries, lastError, _loop_1, this_1, attempt, state_1, error_1;
            var _a;
            if (isNewDevice === void 0) { isNewDevice = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        this.validateUsername(username);
                        maxRetries = 3;
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var result, error_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        return [4 /*yield*/, this_1.generateCredentials(username, credentials, isNewDevice)];
                                    case 1:
                                        result = _c.sent();
                                        if (result.success) {
                                            this_1.emit(types_1.WebAuthnEventType.DEVICE_REGISTERED, {
                                                type: types_1.WebAuthnEventType.DEVICE_REGISTERED,
                                                data: { username: username },
                                                timestamp: Date.now(),
                                            });
                                            return [2 /*return*/, { value: result }];
                                        }
                                        lastError = new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Unknown error");
                                        return [3 /*break*/, 5];
                                    case 2:
                                        error_2 = _c.sent();
                                        lastError = error_2;
                                        if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000 * attempt); })];
                                    case 3:
                                        _c.sent();
                                        return [2 /*return*/, "continue"];
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 1;
                        _b.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _b.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _b.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError || new Error("Failed to create account after retries");
                    case 5:
                        error_1 = _b.sent();
                        this.emit(types_1.WebAuthnEventType.ERROR, {
                            type: types_1.WebAuthnEventType.ERROR,
                            data: { error: error_1.message },
                            timestamp: Date.now(),
                        });
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Authenticates a user with timeout and abort handling
     */
    Webauthn.prototype.authenticateUser = function (username_1, salt_1) {
        return __awaiter(this, arguments, void 0, function (username, salt, options) {
            var error, timeout, timeoutId, challenge, assertionOptions, assertion, password, deviceInfo, result, error_3, errorMessage;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        this.validateUsername(username);
                        if (!salt) {
                            error = new Error("No WebAuthn credentials found for this username");
                            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "NO_CREDENTIALS", error.message, error);
                            return [2 /*return*/, { success: false, error: error.message }];
                        }
                        // Cancel any existing authentication attempt
                        this.abortAuthentication();
                        // Create new abort controller
                        this.abortController = new AbortController();
                        timeout = options.timeout || this.config.timeout;
                        timeoutId = setTimeout(function () { var _a; return (_a = _this.abortController) === null || _a === void 0 ? void 0 : _a.abort(); }, timeout);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        challenge = this.generateChallenge(username);
                        assertionOptions = {
                            challenge: challenge,
                            allowCredentials: [],
                            timeout: timeout,
                            userVerification: options.userVerification || this.config.userVerification,
                            rpId: this.config.rpId,
                        };
                        return [4 /*yield*/, navigator.credentials.get({
                                publicKey: assertionOptions,
                                signal: this.abortController.signal,
                            })];
                    case 2:
                        assertion = (_a.sent());
                        if (!assertion) {
                            throw new Error("WebAuthn verification failed");
                        }
                        password = this.generateCredentialsFromSalt(username, salt).password;
                        deviceInfo = this.getDeviceInfo(assertion.id);
                        result = {
                            success: true,
                            username: username,
                            password: password,
                            credentialId: this.bufferToBase64(assertion.rawId),
                            deviceInfo: deviceInfo,
                        };
                        this.emit(types_1.WebAuthnEventType.AUTHENTICATION_SUCCESS, {
                            type: types_1.WebAuthnEventType.AUTHENTICATION_SUCCESS,
                            data: { username: username, deviceInfo: deviceInfo },
                            timestamp: Date.now(),
                        });
                        return [2 /*return*/, result];
                    case 3:
                        clearTimeout(timeoutId);
                        this.abortController = null;
                        return [7 /*endfinally*/];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : "Unknown WebAuthn error";
                        this.emit(types_1.WebAuthnEventType.AUTHENTICATION_FAILED, {
                            type: types_1.WebAuthnEventType.AUTHENTICATION_FAILED,
                            data: { username: username, error: errorMessage },
                            timestamp: Date.now(),
                        });
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "AUTH_ERROR", errorMessage, error_3);
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aborts current authentication attempt
     */
    Webauthn.prototype.abortAuthentication = function () {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    };
    /**
     * Gets device information
     */
    Webauthn.prototype.getDeviceInfo = function (credentialId) {
        var platformInfo = this.getPlatformInfo();
        return {
            deviceId: credentialId,
            timestamp: Date.now(),
            name: platformInfo.name,
            platform: platformInfo.platform,
            lastUsed: Date.now(),
        };
    };
    /**
     * Gets platform information
     */
    Webauthn.prototype.getPlatformInfo = function () {
        if (typeof navigator === "undefined") {
            return { name: "unknown", platform: "unknown" };
        }
        var platform = navigator.platform;
        var userAgent = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(platform)) {
            return { name: "iOS Device", platform: platform };
        }
        if (/Android/.test(userAgent)) {
            return { name: "Android Device", platform: platform };
        }
        if (/Win/.test(platform)) {
            return { name: "Windows Device", platform: platform };
        }
        if (/Mac/.test(platform)) {
            return { name: "Mac Device", platform: platform };
        }
        if (/Linux/.test(platform)) {
            return { name: "Linux Device", platform: platform };
        }
        return { name: "Unknown Device", platform: platform };
    };
    /**
     * Generates a challenge for WebAuthn operations
     */
    Webauthn.prototype.generateChallenge = function (username) {
        var timestamp = Date.now().toString();
        var randomBytes = this.getRandomBytes(32);
        var challengeData = "".concat(username, "-").concat(timestamp, "-").concat(this.uint8ArrayToHex(randomBytes));
        return new TextEncoder().encode(challengeData);
    };
    /**
     * Gets cryptographically secure random bytes
     */
    Webauthn.prototype.getRandomBytes = function (length) {
        if (typeof window !== "undefined" && window.crypto) {
            return window.crypto.getRandomValues(new Uint8Array(length));
        }
        throw new Error("No cryptographic implementation available");
    };
    /**
     * Converts Uint8Array to hexadecimal string
     */
    Webauthn.prototype.uint8ArrayToHex = function (arr) {
        return Array.from(arr)
            .map(function (b) { return b.toString(16).padStart(2, "0"); })
            .join("");
    };
    /**
     * Converts ArrayBuffer to URL-safe base64 string
     */
    Webauthn.prototype.bufferToBase64 = function (buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = bytes.reduce(function (str, byte) { return str + String.fromCharCode(byte); }, "");
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    };
    /**
     * Generates credentials from username and salt
     */
    Webauthn.prototype.generateCredentialsFromSalt = function (username, salt) {
        var data = ethers_1.ethers.toUtf8Bytes(username + salt);
        return {
            password: ethers_1.ethers.sha256(data),
        };
    };
    /**
     * Checks if WebAuthn is supported
     */
    Webauthn.prototype.isSupported = function () {
        return (typeof window !== "undefined" && window.PublicKeyCredential !== undefined);
    };
    /**
     * Creates a WebAuthn credential for registration
     */
    Webauthn.prototype.createCredential = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var challenge, userId, publicKeyCredentialCreationOptions, credential, webAuthnCredential, credentialData, error_4, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        challenge = crypto.getRandomValues(new Uint8Array(32));
                        userId = new TextEncoder().encode(username);
                        publicKeyCredentialCreationOptions = {
                            challenge: challenge,
                            rp: __assign({ name: "Shogun Wallet" }, (this.config.rpId !== "localhost" && { id: this.config.rpId })),
                            user: {
                                id: userId,
                                name: username,
                                displayName: username,
                            },
                            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                            timeout: this.config.timeout,
                            attestation: this.config.attestation,
                            authenticatorSelection: {
                                authenticatorAttachment: this.config.authenticatorAttachment,
                                userVerification: this.config.userVerification,
                                requireResidentKey: this.config.requireResidentKey,
                            },
                        };
                        return [4 /*yield*/, navigator.credentials.create({
                                publicKey: publicKeyCredentialCreationOptions,
                            })];
                    case 1:
                        credential = _a.sent();
                        if (!credential) {
                            throw new Error("Credential creation failed");
                        }
                        webAuthnCredential = credential;
                        credentialData = {
                            id: webAuthnCredential.id,
                            rawId: webAuthnCredential.rawId,
                            type: webAuthnCredential.type,
                            response: {
                                clientDataJSON: webAuthnCredential.response.clientDataJSON,
                            },
                            getClientExtensionResults: webAuthnCredential.getClientExtensionResults,
                        };
                        // Add additional response properties if available
                        if ("attestationObject" in webAuthnCredential.response) {
                            credentialData.response.attestationObject = webAuthnCredential.response.attestationObject;
                        }
                        this.credential = credentialData;
                        return [2 /*return*/, credentialData];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Detailed error in credential creation:", error_4);
                        errorMessage = error_4 instanceof Error ? error_4.message : "Unknown error";
                        throw new Error("Error creating credentials: ".concat(errorMessage));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates WebAuthn credentials (uniforme con altri plugin)
     */
    Webauthn.prototype.generateCredentials = function (username_1, existingCredential_1) {
        return __awaiter(this, arguments, void 0, function (username, existingCredential, isLogin) {
            var verificationResult, key, credential, credentialId, publicKey, key, error_5, errorMessage;
            var _a;
            if (isLogin === void 0) { isLogin = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        if (!isLogin) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.verifyCredential(username)];
                    case 1:
                        verificationResult = _b.sent();
                        if (!verificationResult.success || !verificationResult.credentialId) {
                            return [2 /*return*/, {
                                    success: false,
                                    username: username,
                                    key: undefined,
                                    credentialId: "",
                                    error: verificationResult.error,
                                    publicKey: null,
                                }];
                        }
                        return [4 /*yield*/, deriveWebauthnKeys(username, verificationResult.credentialId)];
                    case 2:
                        key = _b.sent();
                        return [2 /*return*/, {
                                success: true,
                                username: username,
                                key: key,
                                credentialId: verificationResult.credentialId,
                                publicKey: null,
                            }];
                    case 3: return [4 /*yield*/, this.createCredential(username)];
                    case 4:
                        credential = _b.sent();
                        credentialId = credential.id;
                        publicKey = null;
                        if ((_a = credential === null || credential === void 0 ? void 0 : credential.response) === null || _a === void 0 ? void 0 : _a.getPublicKey) {
                            publicKey = credential.response.getPublicKey();
                        }
                        return [4 /*yield*/, deriveWebauthnKeys(username, credentialId)];
                    case 5:
                        key = _b.sent();
                        return [2 /*return*/, {
                                success: true,
                                username: username,
                                key: key,
                                credentialId: credentialId,
                                publicKey: publicKey,
                            }];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_5 = _b.sent();
                        console.error("Error in generateCredentials:", error_5);
                        errorMessage = error_5 instanceof Error
                            ? error_5.message
                            : "Unknown error during WebAuthn operation";
                        return [2 /*return*/, {
                                success: false,
                                username: username,
                                key: undefined,
                                credentialId: "",
                                error: errorMessage,
                                publicKey: null,
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verifies a credential
     */
    Webauthn.prototype.verifyCredential = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var challenge, options, assertion, error_6, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        challenge = crypto.getRandomValues(new Uint8Array(32));
                        options = __assign({ challenge: challenge, timeout: this.config.timeout, userVerification: this.config.userVerification }, (this.config.rpId !== "localhost" && { rpId: this.config.rpId }));
                        if ((_a = this.credential) === null || _a === void 0 ? void 0 : _a.rawId) {
                            options.allowCredentials = [
                                {
                                    id: this.credential.rawId,
                                    type: "public-key",
                                },
                            ];
                        }
                        return [4 /*yield*/, navigator.credentials.get({
                                publicKey: options,
                            })];
                    case 1:
                        assertion = _b.sent();
                        if (!assertion) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Credential verification failed",
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                credentialId: assertion.id,
                                username: username,
                            }];
                    case 2:
                        error_6 = _b.sent();
                        console.error("Error verifying credentials:", error_6);
                        errorMessage = error_6 instanceof Error
                            ? error_6.message
                            : "Unknown error verifying credentials";
                        return [2 /*return*/, {
                                success: false,
                                error: errorMessage,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes device credentials
     */
    Webauthn.prototype.removeDevice = function (username, credentialId, credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedCreds;
            return __generator(this, function (_a) {
                if (!credentials ||
                    !credentials.credentials ||
                    !credentials.credentials[credentialId]) {
                    return [2 /*return*/, { success: false }];
                }
                updatedCreds = __assign({}, credentials);
                // Make sure credentials exists before modifying it
                if (updatedCreds.credentials) {
                    delete updatedCreds.credentials[credentialId];
                }
                return [2 /*return*/, {
                        success: true,
                        updatedCredentials: updatedCreds,
                    }];
            });
        });
    };
    /**
     * Signs data with the credential
     */
    Webauthn.prototype.sign = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.credentials.get({
                            publicKey: {
                                challenge: new Uint8Array(16),
                                rpId: this.config.rpId,
                            },
                        })];
                    case 1:
                        signature = _a.sent();
                        return [2 /*return*/, signature];
                }
            });
        });
    };
    return Webauthn;
}(eventEmitter_1.EventEmitter));
exports.Webauthn = Webauthn;
// Add to global scope if available
if (typeof window !== "undefined") {
    window.Webauthn = Webauthn;
}
else if (typeof global !== "undefined") {
    global.Webauthn = Webauthn;
}
// Funzione helper per derivare chiavi WebAuthn
// Supporta sia credentialId (legacy) che seed phrase (nuovo, multi-device)
function deriveWebauthnKeys(username_1, credentialIdOrSeedPhrase_1) {
    return __awaiter(this, arguments, void 0, function (username, credentialIdOrSeedPhrase, useSeedPhrase) {
        var _a, password, seed, hashedCredentialId, salt;
        if (useSeedPhrase === void 0) { useSeedPhrase = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!useSeedPhrase) return [3 /*break*/, 2];
                    _a = (0, seedPhrase_1.deriveCredentialsFromMnemonic)(credentialIdOrSeedPhrase, username), password = _a.password, seed = _a.seed;
                    return [4 /*yield*/, (0, derive_1.default)(password, username, {
                            includeP256: true,
                        })];
                case 1: 
                // Use the seed phrase-derived password for Gun key derivation
                return [2 /*return*/, _b.sent()];
                case 2:
                    hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credentialIdOrSeedPhrase));
                    salt = "".concat(username, "_").concat(credentialIdOrSeedPhrase);
                    return [4 /*yield*/, (0, derive_1.default)(hashedCredentialId, salt, {
                            includeP256: true,
                        })];
                case 3: return [2 /*return*/, _b.sent()];
            }
        });
    });
}
