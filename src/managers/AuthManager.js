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
exports.AuthManager = void 0;
var errorHandler_1 = require("../utils/errorHandler");
/**
 * Manages authentication operations for ShogunCore
 */
var AuthManager = /** @class */ (function () {
    function AuthManager(core) {
        this.core = core;
    }
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunInstance login state
     * and presence of authentication credentials in storage
     */
    AuthManager.prototype.isLoggedIn = function () {
        return this.core.db.isLoggedIn();
    };
    /**
     * Perform user logout
     * @description Logs out the current user from GunInstance and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    AuthManager.prototype.logout = function () {
        try {
            if (!this.isLoggedIn()) {
                return;
            }
            this.core.db.logout();
            this.core.emit("auth:logout");
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGOUT_FAILED", error instanceof Error ? error.message : "Error during logout", error);
        }
    };
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    AuthManager.prototype.login = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var result, seaPair, error_1;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        if (!this.currentAuthMethod) {
                            this.currentAuthMethod = "password";
                        }
                        return [4 /*yield*/, this.core.db.login(username, password, pair)];
                    case 1:
                        result = _f.sent();
                        if (result.success) {
                            seaPair = (_b = (_a = this.core.user) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea;
                            if (seaPair) {
                                result.sea = seaPair;
                            }
                            this.core.emit("auth:login", {
                                userPub: (_c = result.userPub) !== null && _c !== void 0 ? _c : "",
                                method: this.currentAuthMethod === "pair"
                                    ? "password"
                                    : this.currentAuthMethod || "password",
                            });
                        }
                        else {
                            result.error = result.error || "Wrong user or password";
                        }
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _f.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "LOGIN_FAILED", (_d = error_1.message) !== null && _d !== void 0 ? _d : "Unknown error during login", error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: (_e = error_1.message) !== null && _e !== void 0 ? _e : "Unknown error during login",
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Login with GunDB pair directly
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly.
     * Emits login event on success.
     */
    AuthManager.prototype.loginWithPair = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var result, seaPair, error_2;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Invalid pair structure - missing required keys",
                                }];
                        }
                        return [4 /*yield*/, this.core.db.loginWithPair(username, pair)];
                    case 1:
                        result = _f.sent();
                        if (result.success) {
                            seaPair = (_b = (_a = this.core.user) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea;
                            if (seaPair) {
                                result.sea = seaPair;
                            }
                            this.currentAuthMethod = "pair";
                            this.core.emit("auth:login", {
                                userPub: (_c = result.userPub) !== null && _c !== void 0 ? _c : "",
                                method: "pair",
                                username: username,
                            });
                        }
                        else {
                            result.error =
                                result.error || "Authentication failed with provided pair";
                        }
                        return [2 /*return*/, result];
                    case 2:
                        error_2 = _f.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "PAIR_LOGIN_FAILED", (_d = error_2.message) !== null && _d !== void 0 ? _d : "Unknown error during pair login", error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: (_e = error_2.message) !== null && _e !== void 0 ? _e : "Unknown error during pair login",
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param email - Email (optional)
     * @param pair - Pair of keys
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    AuthManager.prototype.signUp = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.core.db) {
                            throw new Error("Database not initialized");
                        }
                        // For password-based signup, ensure password is provided
                        if (!pair && (!password || password.trim() === "")) {
                            throw new Error("Password is required for password-based signup");
                        }
                        return [4 /*yield*/, this.core.db.signUp(username, password || "", pair)];
                    case 1:
                        result = _a.sent();
                        if (result.success) {
                            // Update current authentication method
                            this.currentAuthMethod = pair ? "web3" : "password";
                            this.core.emit("auth:signup", {
                                userPub: result.userPub,
                                username: username,
                                method: this.currentAuthMethod,
                            });
                            this.core.emit("debug", {
                                action: "signup_success",
                                userPub: result.userPub,
                                method: this.currentAuthMethod,
                            });
                        }
                        else {
                            this.core.emit("debug", {
                                action: "signup_failed",
                                error: result.error,
                                username: username,
                            });
                        }
                        return [2 /*return*/, result];
                    case 2:
                        error_3 = _a.sent();
                        if (typeof console !== "undefined" && console.error) {
                            console.error("Error during registration for user ".concat(username, ":"), error_3);
                        }
                        this.core.emit("debug", {
                            action: "signup_error",
                            error: error_3 instanceof Error ? error_3.message : String(error_3),
                            username: username,
                        });
                        return [2 /*return*/, {
                                success: false,
                                error: "Registration failed: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)),
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set the current authentication method
     * This is used by plugins to indicate which authentication method was used
     * @param method The authentication method used
     */
    AuthManager.prototype.setAuthMethod = function (method) {
        this.currentAuthMethod = method;
    };
    /**
     * Get the current authentication method
     * @returns The current authentication method or undefined if not set
     */
    AuthManager.prototype.getAuthMethod = function () {
        return this.currentAuthMethod;
    };
    /**
     * Get an authentication method plugin by type
     * @param type The type of authentication method
     * @returns The authentication plugin or undefined if not available
     * This is a more modern approach to accessing authentication methods
     */
    AuthManager.prototype.getAuthenticationMethod = function (type) {
        var _this = this;
        switch (type) {
            case "webauthn":
                return this.core.getPlugin("webauthn");
            case "web3":
                return this.core.getPlugin("web3");
            case "nostr":
                return this.core.getPlugin("nostr");
            case "password":
            default:
                return {
                    login: function (username, password) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.login(username, password)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); },
                    signUp: function (username, password, confirm) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    // For password-based signup, validate password confirmation
                                    if (confirm && password !== confirm) {
                                        throw new Error("Password and confirm password do not match");
                                    }
                                    return [4 /*yield*/, this.signUp(username, password)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); },
                };
        }
    };
    return AuthManager;
}());
exports.AuthManager = AuthManager;
