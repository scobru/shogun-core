/**
 * Challenge-Response Authentication Plugin
 *
 * Implements a secure two-step authentication flow where the private key
 * never leaves the client. Flow:
 *
 * 1. Client requests a challenge from the server (sends username + password)
 * 2. Server verifies password, returns a random challenge string
 * 3. Client signs the challenge with its SEA private key
 * 4. Server verifies the signature using the stored public key
 * 5. Server issues a JWT token on success
 *
 * Based on the challenge-response pattern from GunAuth.
 */
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { BasePlugin } from '../base.js';
import { PluginCategory } from '../../interfaces/shogun.js';
var ChallengePlugin = /** @class */ (function (_super) {
    __extends(ChallengePlugin, _super);
    function ChallengePlugin() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.name = 'challenge';
        _this.version = '1.0.0';
        _this.description = 'Challenge-response authentication using Gun SEA signatures';
        _this._category = PluginCategory.Authentication;
        _this.config = {
            serverUrl: '',
            challengeEndpoint: '/login-challenge',
            verifyEndpoint: '/login-verify',
            timeout: 10000,
        };
        return _this;
    }
    /**
     * Configure the challenge plugin
     * @param config - Challenge configuration
     */
    ChallengePlugin.prototype.configure = function (config) {
        this.config = __assign(__assign({}, this.config), config);
    };
    /**
     * Get SEA safely from various sources
     */
    ChallengePlugin.prototype.getSEA = function () {
        var _a, _b;
        var core = this.core;
        if (core) {
            var sea = (_a = core.db) === null || _a === void 0 ? void 0 : _a.sea;
            if (sea)
                return sea;
        }
        if ((_b = globalThis.Gun) === null || _b === void 0 ? void 0 : _b.SEA)
            return globalThis.Gun.SEA;
        if (globalThis.SEA)
            return globalThis.SEA;
        return null;
    };
    /**
     * Request an authentication challenge from the server.
     *
     * @param serverUrl - Base URL of the auth server
     * @param username - Username to authenticate as
     * @param password - Password for initial server-side verification
     * @returns Promise resolving to ChallengeData
     * @throws Error if server rejects the request
     */
    ChallengePlugin.prototype.requestChallenge = function (serverUrl, username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var endpoint, url, controller, timeoutId, response, err, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endpoint = this.config.challengeEndpoint || '/login-challenge';
                        url = "".concat(serverUrl).concat(endpoint);
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, this.config.timeout || 10000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: username, password: password }),
                                signal: controller.signal,
                            })];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response
                                .json()
                                .catch(function () { return ({ error: 'Request failed' }); })];
                    case 3:
                        err = _a.sent();
                        throw new Error(err.error || "Challenge request failed: ".concat(response.status));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Challenge request rejected by server');
                        }
                        return [2 /*return*/, {
                                challengeId: result.challengeId,
                                challenge: result.challenge,
                                pub: result.pub,
                                expiresAt: result.expiresAt,
                            }];
                    case 6:
                        error_1 = _a.sent();
                        clearTimeout(timeoutId);
                        if (error_1.name === 'AbortError') {
                            throw new Error('Challenge request timed out');
                        }
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sign a challenge string with the user's SEA private key.
     * The private key NEVER leaves the client.
     *
     * @param challenge - The challenge string to sign
     * @param pair - The user's key pair (pub + priv)
     * @returns Promise resolving to the signed challenge string
     */
    ChallengePlugin.prototype.signChallenge = function (challenge, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var sea, signed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sea = this.getSEA();
                        if (!sea || !sea.sign) {
                            throw new Error('SEA not available for challenge signing');
                        }
                        return [4 /*yield*/, sea.sign(challenge, pair)];
                    case 1:
                        signed = _a.sent();
                        if (!signed) {
                            throw new Error('Failed to sign challenge');
                        }
                        return [2 /*return*/, signed];
                }
            });
        });
    };
    /**
     * Verify a signed challenge against a public key.
     * This is a helper that can be used server-side or for
     * local verification in peer-to-peer scenarios.
     *
     * @param signedChallenge - The signed challenge data
     * @param pubKey - The signer's public key
     * @param expectedChallenge - The original challenge string
     * @returns Promise resolving to true if valid
     */
    ChallengePlugin.prototype.verifyChallenge = function (signedChallenge, pubKey, expectedChallenge) {
        return __awaiter(this, void 0, void 0, function () {
            var sea, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sea = this.getSEA();
                        if (!sea || !sea.verify) {
                            throw new Error('SEA not available for challenge verification');
                        }
                        return [4 /*yield*/, sea.verify(signedChallenge, pubKey)];
                    case 1:
                        verified = _a.sent();
                        return [2 /*return*/, verified === expectedChallenge];
                }
            });
        });
    };
    /**
     * Execute the full challenge-response login flow.
     *
     * 1. Request challenge from server
     * 2. Sign challenge locally with private key
     * 3. Send signature to server for verification
     * 4. Receive auth token on success
     *
     * @param serverUrl - Base URL of the auth server
     * @param username - Username to authenticate as
     * @param password - Password for initial verification
     * @param pair - The user's key pair
     * @returns Promise with authentication result
     */
    ChallengePlugin.prototype.login = function (serverUrl, username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var challengeData, signedChallenge, verifyEndpoint, url, controller_1, timeoutId, response, result, authResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.requestChallenge(serverUrl, username, password)];
                    case 1:
                        challengeData = _a.sent();
                        return [4 /*yield*/, this.signChallenge(challengeData.challenge, pair)];
                    case 2:
                        signedChallenge = _a.sent();
                        verifyEndpoint = this.config.verifyEndpoint || '/login-verify';
                        url = "".concat(serverUrl).concat(verifyEndpoint);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, this.config.timeout || 10000);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    challengeId: challengeData.challengeId,
                                    signedChallenge: signedChallenge,
                                }),
                                signal: controller_1.signal,
                            })];
                    case 3:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        if (!result.success) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.error || 'Challenge verification failed',
                                }];
                        }
                        authResult = {
                            success: true,
                            userPub: result.pub,
                            username: result.username || username,
                            sessionToken: result.token,
                            authMethod: 'challenge',
                        };
                        // Emit login event if core is available
                        if (this.core) {
                            this.core.emit('auth:login', {
                                userPub: result.pub,
                                method: 'password',
                                username: result.username || username,
                            });
                        }
                        return [2 /*return*/, authResult];
                    case 5:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message || 'Challenge-response login failed',
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return ChallengePlugin;
}(BasePlugin));
export { ChallengePlugin };
