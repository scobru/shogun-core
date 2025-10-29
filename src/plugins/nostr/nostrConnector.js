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
exports.NostrConnector = exports.MESSAGE_TO_SIGN = void 0;
exports.deriveNostrKeys = deriveNostrKeys;
/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
 */
var ethers_1 = require("ethers");
var nostr_tools_1 = require("nostr-tools");
var eventEmitter_1 = require("../../utils/eventEmitter");
var derive_1 = require("../../gundb/derive");
var validation_1 = require("../../utils/validation");
exports.MESSAGE_TO_SIGN = "I Love Shogun!";
/**
 * Class for Bitcoin wallet connections and operations
 */
var NostrConnector = /** @class */ (function (_super) {
    __extends(NostrConnector, _super);
    function NostrConnector(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.DEFAULT_CONFIG = {
            cacheDuration: 24 * 60 * 60 * 1000, // 24 hours instead of 30 minutes for better UX
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 60000,
            network: "mainnet",
            useApi: false,
        };
        _this.signatureCache = new Map();
        // Connection state
        _this.connectedAddress = null;
        _this.connectedType = null;
        _this.manualKeyPair = null;
        _this.config = __assign(__assign({}, _this.DEFAULT_CONFIG), config);
        _this.setupEventListeners();
        return _this;
    }
    /**
     * Setup event listeners
     */
    NostrConnector.prototype.setupEventListeners = function () {
        // Currently no global events to listen to
        // This would be the place to add listeners for wallet connections/disconnections
    };
    /**
     * Clear signature cache for a specific address or all addresses
     */
    NostrConnector.prototype.clearSignatureCache = function (address) {
        if (address) {
            // Clear cache for specific address
            this.signatureCache.delete(address);
            try {
                var localStorageKey = "shogun_bitcoin_sig_".concat(address);
                localStorage.removeItem(localStorageKey);
                console.log("Cleared signature cache for address: ".concat(address.substring(0, 10), "..."));
            }
            catch (error) {
                console.error("Error clearing signature cache from localStorage:", error);
            }
        }
        else {
            // Clear all signature caches
            this.signatureCache.clear();
            try {
                // Find and remove all shogun_bitcoin_sig_ keys
                var keysToRemove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.startsWith("shogun_bitcoin_sig_")) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(function (key) { return localStorage.removeItem(key); });
                console.log("Cleared all signature caches (".concat(keysToRemove.length, " entries)"));
            }
            catch (error) {
                console.error("Error clearing all signature caches from localStorage:", error);
            }
        }
    };
    /**
     * Check if Nostr extension is available
     */
    NostrConnector.prototype.isNostrExtensionAvailable = function () {
        return typeof window !== "undefined" && !!window.nostr;
    };
    /**
     * Check if any Bitcoin wallet is available
     */
    NostrConnector.prototype.isAvailable = function () {
        return this.isNostrExtensionAvailable() || this.manualKeyPair !== null;
    };
    /**
     * Connect to a wallet type
     */
    NostrConnector.prototype.connectWallet = function () {
        return __awaiter(this, arguments, void 0, function (type) {
            var result, _a, error_1;
            if (type === void 0) { type = "nostr"; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Connecting to Bitcoin wallet via ".concat(type, "..."));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        result = void 0;
                        _a = type;
                        switch (_a) {
                            case "alby": return [3 /*break*/, 2];
                            case "nostr": return [3 /*break*/, 4];
                            case "manual": return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2:
                        console.log("[nostrConnector] Alby is deprecated, redirecting to Nostr");
                        return [4 /*yield*/, this.connectNostr()];
                    case 3:
                        result = _b.sent();
                        return [3 /*break*/, 9];
                    case 4: return [4 /*yield*/, this.connectNostr()];
                    case 5:
                        result = _b.sent();
                        return [3 /*break*/, 9];
                    case 6: return [4 /*yield*/, this.connectManual()];
                    case 7:
                        result = _b.sent();
                        return [3 /*break*/, 9];
                    case 8: throw new Error("Unsupported wallet type: ".concat(type));
                    case 9:
                        if (result.success && result.address) {
                            this.connectedAddress = result.address;
                            this.connectedType = type;
                            console.log("Successfully connected to ".concat(type, " wallet: ").concat(result.address));
                            this.emit("wallet_connected", {
                                address: result.address,
                                type: this.connectedType,
                            });
                        }
                        return [2 /*return*/, result];
                    case 10:
                        error_1 = _b.sent();
                        console.error("Error connecting to ".concat(type, " wallet:"), error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message || "Failed to connect to wallet",
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Connect to Nostr extension
     */
    NostrConnector.prototype.connectNostr = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pubKey, username, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isNostrExtensionAvailable()) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Nostr extension is not available. Please install a Nostr compatible extension like nos2x, Alby, or Coracle.",
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("[nostrConnector] Attempting to connect to Nostr extension...");
                        return [4 /*yield*/, window.nostr.getPublicKey()];
                    case 2:
                        pubKey = _a.sent();
                        if (!pubKey) {
                            throw new Error("Could not get public key from Nostr extension");
                        }
                        console.log("[nostrConnector] Successfully connected to Nostr extension: ".concat(pubKey.substring(0, 10), "..."));
                        this.connectedAddress = pubKey;
                        this.connectedType = "nostr";
                        // Emit connected event
                        this.emit("connected", { address: pubKey, type: "nostr" });
                        username = "nostr_".concat(pubKey.substring(0, 10));
                        return [2 /*return*/, {
                                success: true,
                                address: pubKey,
                                username: username,
                                extensionType: "nostr",
                            }];
                    case 3:
                        error_2 = _a.sent();
                        console.error("[nostrConnector] Nostr connection error:", error_2);
                        // Provide more specific error messages
                        if (error_2.message && error_2.message.includes("User rejected")) {
                            throw new Error("Nostr connection was rejected by the user");
                        }
                        else if (error_2.message && error_2.message.includes("not available")) {
                            throw new Error("Nostr extension is not available or not properly installed");
                        }
                        else {
                            throw new Error("Nostr connection error: ".concat(error_2.message));
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set up manual key pair for connection
     */
    NostrConnector.prototype.connectManual = function () {
        return __awaiter(this, void 0, void 0, function () {
            var username;
            return __generator(this, function (_a) {
                // For manual connection, we'd need to have a keypair set
                if (!this.manualKeyPair) {
                    return [2 /*return*/, {
                            success: false,
                            error: "No manual key pair configured. Use setKeyPair() first.",
                        }];
                }
                this.connectedAddress = this.manualKeyPair.address;
                this.connectedType = "manual";
                // Emit connected event
                this.emit("connected", {
                    address: this.manualKeyPair.address,
                    type: "manual",
                });
                username = "btc_".concat(this.manualKeyPair.address.substring(0, 10));
                return [2 /*return*/, {
                        success: true,
                        address: this.manualKeyPair.address,
                        username: username,
                        extensionType: "manual",
                    }];
            });
        });
    };
    /**
     * Set a manual key pair for use
     */
    NostrConnector.prototype.setKeyPair = function (keyPair) {
        this.manualKeyPair = keyPair;
        if (keyPair.address) {
            this.connectedAddress = keyPair.address;
            this.connectedType = "manual";
        }
    };
    /**
     * Generate credentials using Nostr: username deterministico e chiave GunDB derivata dall'address
     */
    NostrConnector.prototype.generateCredentials = function (address, signature, message) {
        return __awaiter(this, void 0, void 0, function () {
            var username, hashedAddress, salt, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = (0, validation_1.generateUsernameFromIdentity)("nostr", { id: address });
                        hashedAddress = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(address));
                        salt = "".concat(username, "_").concat(address, "_").concat(message, "_").concat(signature);
                        return [4 /*yield*/, (0, derive_1.default)(hashedAddress, salt, { includeP256: true })];
                    case 1:
                        key = _a.sent();
                        return [2 /*return*/, { username: username, key: key, message: message, signature: signature }];
                }
            });
        });
    };
    /**
     * Generate a password from a signature
     */
    NostrConnector.prototype.generatePassword = function (signature) {
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
     * Verify a signature
     */
    NostrConnector.prototype.verifySignature = function (message, signature, address) {
        return __awaiter(this, void 0, void 0, function () {
            var addressStr, eventData, event_1, eventData, event_2;
            return __generator(this, function (_a) {
                try {
                    addressStr = typeof address === "object"
                        ? address.address || JSON.stringify(address)
                        : String(address);
                    console.log("Verifying signature for address: ".concat(addressStr));
                    if (!signature || !message || !addressStr) {
                        console.error("Invalid message, signature, or address for verification");
                        return [2 /*return*/, false];
                    }
                    // For Nostr wallet type, use nostr-tools for verification
                    if (this.connectedType === "nostr" || this.connectedType === "alby") {
                        try {
                            eventData = {
                                kind: 1,
                                created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
                                tags: [],
                                content: message,
                                pubkey: addressStr,
                            };
                            event_1 = __assign(__assign({}, eventData), { id: (0, nostr_tools_1.getEventHash)(eventData), sig: signature });
                            return [2 /*return*/, (0, nostr_tools_1.verifyEvent)(event_1)];
                        }
                        catch (verifyError) {
                            console.error("Error in Nostr signature verification:", verifyError);
                            return [2 /*return*/, false];
                        }
                    }
                    else if (this.connectedType === "manual" && this.manualKeyPair) {
                        console.log("[nostrConnector] Manual verification for keypair");
                        // For manual keypairs, we MUST use a secure verification method.
                        if (!this.manualKeyPair.privateKey) {
                            console.error("Manual verification failed: private key is missing.");
                            return [2 /*return*/, false];
                        }
                        try {
                            eventData = {
                                kind: 1,
                                created_at: 0, // IMPORTANT: Use the same fixed timestamp used for signing
                                tags: [],
                                content: message,
                                pubkey: addressStr,
                            };
                            event_2 = __assign(__assign({}, eventData), { id: (0, nostr_tools_1.getEventHash)(eventData), sig: signature });
                            return [2 /*return*/, (0, nostr_tools_1.verifyEvent)(event_2)];
                        }
                        catch (manualVerifyError) {
                            console.error("Error in manual signature verification:", manualVerifyError);
                            return [2 /*return*/, false];
                        }
                    }
                    console.warn("No specific verification method available, signature cannot be fully verified");
                    return [2 /*return*/, false];
                }
                catch (error) {
                    console.error("Error verifying signature:", error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get the currently connected address
     */
    NostrConnector.prototype.getConnectedAddress = function () {
        return this.connectedAddress;
    };
    /**
     * Get the currently connected wallet type
     */
    NostrConnector.prototype.getConnectedType = function () {
        return this.connectedType;
    };
    /**
     * Request a signature from the connected wallet
     */
    NostrConnector.prototype.requestSignature = function (address, message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, eventData, nostrEvent, signedEvent, manualEventData, eventTemplate, privateKeyBytes, signedEventManual, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.connectedType) {
                            throw new Error("No wallet connected");
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        _a = this.connectedType;
                        switch (_a) {
                            case "alby": return [3 /*break*/, 2];
                            case "nostr": return [3 /*break*/, 2];
                            case "manual": return [3 /*break*/, 4];
                        }
                        return [3 /*break*/, 6];
                    case 2:
                        if (this.connectedType === "alby") {
                            console.warn("Alby is deprecated, using Nostr functionality for signature request");
                        }
                        console.log("[nostrConnector] Requesting Nostr signature for message:", message);
                        if (!window.nostr) {
                            throw new Error("Nostr extension not available");
                        }
                        eventData = {
                            kind: 1,
                            created_at: 0, // IMPORTANT: Use a fixed timestamp to make signatures verifiable
                            tags: [],
                            content: message,
                            pubkey: address,
                        };
                        nostrEvent = __assign(__assign({}, eventData), { id: (0, nostr_tools_1.getEventHash)(eventData), sig: "" });
                        return [4 /*yield*/, window.nostr.signEvent(nostrEvent)];
                    case 3:
                        signedEvent = _b.sent();
                        console.log("Received Nostr signature:", signedEvent.sig.substring(0, 20) + "...");
                        return [2 /*return*/, signedEvent.sig];
                    case 4:
                        console.log("[nostrConnector] Using manual key pair for signature");
                        if (!this.manualKeyPair || !this.manualKeyPair.privateKey) {
                            throw new Error("No manual key pair available or private key missing");
                        }
                        manualEventData = {
                            kind: 1,
                            created_at: 0, // IMPORTANT: Use a fixed timestamp
                            tags: [],
                            content: message,
                            pubkey: this.manualKeyPair.address,
                        };
                        eventTemplate = __assign(__assign({}, manualEventData), { id: (0, nostr_tools_1.getEventHash)(manualEventData), sig: "" });
                        privateKeyBytes = nostr_tools_1.utils.hexToBytes(this.manualKeyPair.privateKey);
                        return [4 /*yield*/, (0, nostr_tools_1.finalizeEvent)(eventTemplate, privateKeyBytes)];
                    case 5:
                        signedEventManual = _b.sent();
                        console.log("Generated manual signature:", signedEventManual.sig.substring(0, 20) + "...");
                        return [2 /*return*/, signedEventManual.sig];
                    case 6: throw new Error("Unsupported wallet type: ".concat(this.connectedType));
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_3 = _b.sent();
                        console.error("Error requesting signature:", error_3);
                        throw new Error("Failed to get signature: ".concat(error_3.message));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cleanup event listeners
     */
    NostrConnector.prototype.cleanup = function () {
        this.removeAllListeners();
        this.connectedAddress = null;
        this.connectedType = null;
        this.manualKeyPair = null;
    };
    return NostrConnector;
}(eventEmitter_1.EventEmitter));
exports.NostrConnector = NostrConnector;
// Funzione helper per derivare chiavi Nostr/Bitcoin (come per Web3/WebAuthn)
function deriveNostrKeys(address, signature, message) {
    return __awaiter(this, void 0, void 0, function () {
        var salt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    salt = "".concat(address, "_").concat(message);
                    return [4 /*yield*/, (0, derive_1.default)(address, salt, {
                            includeP256: true,
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
if (typeof window !== "undefined") {
    window.NostrConnector = NostrConnector;
}
else if (typeof global !== "undefined") {
    global.NostrConnector = NostrConnector;
}
