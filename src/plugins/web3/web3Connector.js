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
exports.Web3Connector = void 0;
/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
 */
var ethers_1 = require("ethers");
var errorHandler_1 = require("../../utils/errorHandler");
var eventEmitter_1 = require("../../utils/eventEmitter");
var derive_1 = require("../../gundb/derive");
/**
 * Class for MetaMask connection
 */
var Web3Connector = /** @class */ (function (_super) {
    __extends(Web3Connector, _super);
    function Web3Connector(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.MESSAGE_TO_SIGN = "I Love Shogun!";
        _this.DEFAULT_CONFIG = {
            cacheDuration: 30 * 60 * 1000, // 30 minutes
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 60000,
        };
        _this.signatureCache = new Map();
        _this.provider = null;
        _this.customProvider = null;
        _this.customWallet = null;
        _this.config = __assign(__assign({}, _this.DEFAULT_CONFIG), config);
        _this.initProvider();
        _this.setupEventListeners();
        return _this;
    }
    /**
     * Initialize the provider synchronously with fallback mechanisms
     * to handle conflicts between multiple wallet providers
     */
    Web3Connector.prototype.initProvider = function () {
        if (typeof window !== "undefined") {
            try {
                // Check if ethereum is available from any provider
                var ethereumProvider = this.getAvailableEthereumProvider();
                if (ethereumProvider) {
                    this.provider = new ethers_1.ethers.BrowserProvider(ethereumProvider);
                }
                else {
                    console.warn("No compatible Ethereum provider found");
                }
            }
            catch (error) {
                console.error("Failed to initialize BrowserProvider", error);
            }
        }
        else {
            console.warn("Window object not available (non-browser environment)");
        }
    };
    /**
     * Get available Ethereum provider from multiple possible sources
     */
    Web3Connector.prototype.getAvailableEthereumProvider = function () {
        if (typeof window === "undefined")
            return undefined;
        // Define provider sources with priority order
        var providerSources = [
            // Check if we have providers in the _ethereumProviders registry (from index.html)
            {
                source: function () { return window._ethereumProviders && window._ethereumProviders[0]; },
                name: "Registry Primary",
            },
            { source: function () { return window.ethereum; }, name: "Standard ethereum" },
            {
                source: function () { var _a; return (_a = window.web3) === null || _a === void 0 ? void 0 : _a.currentProvider; },
                name: "Legacy web3",
            },
            { source: function () { return window.metamask; }, name: "MetaMask specific" },
            {
                source: function () { var _a, _b; return (_b = (_a = window.ethereum) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b.find(function (p) { return p.isMetaMask; }); },
                name: "MetaMask from providers array",
            },
            {
                source: function () { var _a, _b; return (_b = (_a = window.ethereum) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b[0]; },
                name: "First provider in array",
            },
            // Try known provider names
            {
                source: function () { var _a, _b; return (_b = (_a = window.enkrypt) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b.ethereum; },
                name: "Enkrypt",
            },
            {
                source: function () { return window.coinbaseWalletExtension; },
                name: "Coinbase",
            },
            { source: function () { return window.trustWallet; }, name: "Trust Wallet" },
            // Use special registry if available
            {
                source: function () {
                    return Array.isArray(window._ethereumProviders)
                        ? window._ethereumProviders.find(function (p) { return !p._isProxy; })
                        : undefined;
                },
                name: "Registry non-proxy",
            },
        ];
        // Try each provider source
        for (var _i = 0, providerSources_1 = providerSources; _i < providerSources_1.length; _i++) {
            var _a = providerSources_1[_i], source = _a.source, name_1 = _a.name;
            try {
                var provider = source();
                if (provider && typeof provider.request === "function") {
                    return provider;
                }
            }
            catch (error) {
                // Continue to next provider source
                console.warn("Error checking provider ".concat(name_1, ":"), error);
                continue;
            }
        }
        // No provider found
        console.warn("No compatible Ethereum provider found");
        return undefined;
    };
    /**
     * Initialize the BrowserProvider (async method for explicit calls)
     */
    Web3Connector.prototype.setupProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ethereumProvider;
            return __generator(this, function (_a) {
                try {
                    if (typeof window !== "undefined") {
                        ethereumProvider = this.getAvailableEthereumProvider();
                        if (ethereumProvider) {
                            this.provider = new ethers_1.ethers.BrowserProvider(ethereumProvider);
                        }
                        else {
                            console.warn("No compatible Ethereum provider found");
                        }
                    }
                    else {
                        console.warn("Window object not available (non-browser environment)");
                    }
                }
                catch (error) {
                    console.error("Failed to initialize BrowserProvider", error);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Setup MetaMask event listeners using BrowserProvider
     */
    Web3Connector.prototype.setupEventListeners = function () {
        var _this = this;
        if (this.provider) {
            // Listen for network changes through ethers provider
            this.provider.on("network", function (newNetwork, oldNetwork) {
                _this.emit("chainChanged", newNetwork);
            });
            // Listen for account changes through the detected provider
            try {
                var ethereumProvider = this.getAvailableEthereumProvider();
                if (ethereumProvider === null || ethereumProvider === void 0 ? void 0 : ethereumProvider.on) {
                    ethereumProvider.on("accountsChanged", function (accounts) {
                        _this.emit("accountsChanged", accounts);
                    });
                    // Also listen for chainChanged events directly
                    ethereumProvider.on("chainChanged", function (chainId) {
                        _this.emit("chainChanged", { chainId: chainId });
                    });
                }
            }
            catch (error) {
                console.warn("Failed to setup account change listeners", error);
            }
        }
    };
    /**
     * Cleanup event listeners
     */
    Web3Connector.prototype.cleanup = function () {
        if (this.provider) {
            this.provider.removeAllListeners();
        }
        this.removeAllListeners();
    };
    /**
     * Get cached signature if valid
     */
    Web3Connector.prototype.getCachedSignature = function (address) {
        var cached = this.signatureCache.get(address);
        if (!cached)
            return null;
        var now = Date.now();
        if (now - cached.timestamp > this.config.cacheDuration) {
            this.signatureCache.delete(address);
            return null;
        }
        // Check for invalid/empty signature
        if (!cached.signature ||
            typeof cached.signature !== "string" ||
            cached.signature.length < 16) {
            console.warn("Invalid cached signature for address ".concat(address, " (length: ").concat(cached.signature ? cached.signature.length : 0, "), deleting from cache."));
            this.signatureCache.delete(address);
            return null;
        }
        return cached.signature;
    };
    /**
     * Cache signature
     */
    Web3Connector.prototype.cacheSignature = function (address, signature) {
        this.signatureCache.set(address, {
            signature: signature,
            timestamp: Date.now(),
            address: address,
        });
    };
    /**
     * Validates that the address is valid
     */
    Web3Connector.prototype.validateAddress = function (address) {
        if (!address) {
            throw new Error("Address not provided");
        }
        try {
            var normalizedAddress = String(address).trim().toLowerCase();
            if (!ethers_1.ethers.isAddress(normalizedAddress)) {
                throw new Error("Invalid address format");
            }
            return ethers_1.ethers.getAddress(normalizedAddress);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.VALIDATION, "INVALID_ADDRESS", "Invalid Ethereum address provided", error);
            throw error;
        }
    };
    /**
     * Connects to MetaMask with retry logic using BrowserProvider
     */
    Web3Connector.prototype.connectMetaMask = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ethereumProvider, accounts, requestError_1, fallbackError_1, attempt, signer, address, error_1, error_2;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 19, , 20]);
                        if (!this.provider) {
                            this.initProvider();
                            if (!this.provider) {
                                throw new Error("MetaMask is not available. Please install MetaMask extension.");
                            }
                        }
                        ethereumProvider = this.getAvailableEthereumProvider();
                        if (!ethereumProvider) {
                            throw new Error("No compatible Ethereum provider found");
                        }
                        accounts = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 10]);
                        return [4 /*yield*/, ethereumProvider.request({
                                method: "eth_requestAccounts",
                            })];
                    case 2:
                        // Try the provider we found first
                        accounts = _b.sent();
                        return [3 /*break*/, 10];
                    case 3:
                        requestError_1 = _b.sent();
                        console.warn("First account request failed, trying window.ethereum:", requestError_1);
                        if (!(window.ethereum && window.ethereum !== ethereumProvider)) return [3 /*break*/, 8];
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, window.ethereum.request({
                                method: "eth_requestAccounts",
                            })];
                    case 5:
                        accounts = _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        fallbackError_1 = _b.sent();
                        console.error("All account request methods failed", fallbackError_1);
                        throw new Error("User denied account access");
                    case 7: return [3 /*break*/, 9];
                    case 8: throw new Error("User denied account access");
                    case 9: return [3 /*break*/, 10];
                    case 10:
                        if (!accounts || accounts.length === 0) {
                        }
                        attempt = 1;
                        _b.label = 11;
                    case 11:
                        if (!(attempt <= this.config.maxRetries)) return [3 /*break*/, 18];
                        _b.label = 12;
                    case 12:
                        _b.trys.push([12, 15, , 17]);
                        return [4 /*yield*/, this.provider.getSigner()];
                    case 13:
                        signer = _b.sent();
                        return [4 /*yield*/, signer.getAddress()];
                    case 14:
                        address = _b.sent();
                        if (!address) {
                            console.error("No address returned from signer");
                            throw new Error("No address returned from signer");
                        }
                        this.emit("connected", { address: address });
                        return [2 /*return*/, {
                                success: true,
                                address: address,
                            }];
                    case 15:
                        error_1 = _b.sent();
                        console.error("Attempt ".concat(attempt, " failed:"), error_1);
                        if (attempt === this.config.maxRetries) {
                            throw error_1;
                        }
                        // Wait before retrying
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return setTimeout(resolve, _this.config.retryDelay);
                            })];
                    case 16:
                        // Wait before retrying
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        attempt++;
                        return [3 /*break*/, 11];
                    case 18: throw new Error("Failed to get signer after all attempts");
                    case 19:
                        error_2 = _b.sent();
                        console.error("Failed to connect to MetaMask:", error_2);
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "METAMASK_CONNECTION_ERROR", (_a = error_2.message) !== null && _a !== void 0 ? _a : "Unknown error while connecting to MetaMask", error_2);
                        return [2 /*return*/, { success: false, error: error_2.message }];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates credentials for the given address
     */
    Web3Connector.prototype.generateCredentials = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var validAddress, cachedSignature, signature, signingError_1, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        validAddress = this.validateAddress(address);
                        cachedSignature = this.getCachedSignature(validAddress);
                        if (cachedSignature) {
                            return [2 /*return*/, this.generateCredentialsFromSignature(validAddress, cachedSignature)];
                        }
                        signature = void 0;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.requestSignatureWithTimeout(validAddress, this.MESSAGE_TO_SIGN, this.config.timeout)];
                    case 2:
                        signature = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        signingError_1 = _b.sent();
                        // Gestione del fallimento di firma
                        console.warn("Failed to get signature: ".concat(signingError_1, ". Using fallback method."));
                        throw signingError_1;
                    case 4:
                        // Cache the signature
                        this.cacheSignature(validAddress, signature);
                        return [2 /*return*/, this.generateCredentialsFromSignature(validAddress, signature)];
                    case 5:
                        error_3 = _b.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "CREDENTIALS_GENERATION_ERROR", (_a = error_3.message) !== null && _a !== void 0 ? _a : "Error generating MetaMask credentials", error_3);
                        throw error_3;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates credentials from a signature
     */
    Web3Connector.prototype.generateCredentialsFromSignature = function (address, signature) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedAddress, salt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hashedAddress = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(address));
                        salt = "".concat(address, "_").concat(signature);
                        return [4 /*yield*/, (0, derive_1.default)(hashedAddress, salt, {
                                includeP256: true,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Generates fallback credentials (for testing/development)
     */
    Web3Connector.prototype.generateFallbackCredentials = function (address) {
        console.warn("Using fallback credentials generation for address:", address);
        // Generate a deterministic but insecure fallback
        var fallbackSignature = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(address + "fallback"));
        return {
            username: address.toLowerCase(),
            password: fallbackSignature,
            message: this.MESSAGE_TO_SIGN,
            signature: fallbackSignature,
        };
    };
    /**
     * Checks if MetaMask is available
     */
    Web3Connector.isMetaMaskAvailable = function () {
        if (typeof window === "undefined") {
            return false;
        }
        // Check multiple possible sources
        var sources = [
            function () { return window.ethereum; },
            function () { var _a; return (_a = window.web3) === null || _a === void 0 ? void 0 : _a.currentProvider; },
            function () { return window.metamask; },
            function () { var _a; return (_a = window._ethereumProviders) === null || _a === void 0 ? void 0 : _a[0]; },
        ];
        for (var _i = 0, sources_1 = sources; _i < sources_1.length; _i++) {
            var source = sources_1[_i];
            try {
                var provider = source();
                if (provider && typeof provider.request === "function") {
                    return true;
                }
            }
            catch (_a) {
                // Continue to next source
            }
        }
        return false;
    };
    /**
     * Requests signature with timeout
     */
    Web3Connector.prototype.requestSignatureWithTimeout = function (address, message, timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 30000; }
        return new Promise(function (resolve, reject) {
            var timeoutId = setTimeout(function () {
                reject(new Error("Signature request timed out"));
            }, timeout);
            var cleanup = function () {
                clearTimeout(timeoutId);
            };
            var errorHandler = function (error) {
                cleanup();
                reject(error);
            };
            var initializeAndSign = function () { return __awaiter(_this, void 0, void 0, function () {
                var signer, signerAddress, signature, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.provider.getSigner()];
                        case 1:
                            signer = _a.sent();
                            return [4 /*yield*/, signer.getAddress()];
                        case 2:
                            signerAddress = _a.sent();
                            // Verify the signer address matches the expected address
                            if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                                throw new Error("Signer address (".concat(signerAddress, ") does not match expected address (").concat(address, ")"));
                            }
                            return [4 /*yield*/, signer.signMessage(message)];
                        case 3:
                            signature = _a.sent();
                            cleanup();
                            resolve(signature);
                            return [3 /*break*/, 5];
                        case 4:
                            error_4 = _a.sent();
                            console.error("Failed to request signature:", error_4);
                            errorHandler(error_4);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            initializeAndSign();
        });
    };
    /**
     * Checks if the connector is available
     */
    Web3Connector.prototype.isAvailable = function () {
        return Web3Connector.isMetaMaskAvailable();
    };
    /**
     * Sets a custom provider for testing/development
     */
    Web3Connector.prototype.setCustomProvider = function (rpcUrl, privateKey) {
        var _a;
        try {
            this.customProvider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.customWallet = new ethers_1.ethers.Wallet(privateKey, this.customProvider);
        }
        catch (error) {
            throw new Error("Error configuring provider: ".concat((_a = error.message) !== null && _a !== void 0 ? _a : "Unknown error"));
        }
    };
    /**
     * Get active signer instance using BrowserProvider
     */
    Web3Connector.prototype.getSigner = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (this.customWallet) {
                            return [2 /*return*/, this.customWallet];
                        }
                        if (!this.provider) {
                            this.initProvider();
                        }
                        if (!this.provider) {
                            throw new Error("Provider not initialized");
                        }
                        return [4 /*yield*/, this.provider.getSigner()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_5 = _a.sent();
                        throw new Error("Unable to get Ethereum signer: ".concat(error_5.message || "Unknown error"));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get active provider instance using BrowserProvider
     */
    Web3Connector.prototype.getProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.customProvider) {
                    return [2 /*return*/, this.customProvider];
                }
                if (!this.provider) {
                    this.initProvider();
                }
                return [2 /*return*/, this.provider];
            });
        });
    };
    /**
     * Generate deterministic password from signature
     * @param signature - Cryptographic signature
     * @returns 64-character hex string
     * @throws {Error} For invalid signature
     */
    Web3Connector.prototype.generatePassword = function (signature) {
        return __awaiter(this, void 0, void 0, function () {
            var hash;
            return __generator(this, function (_a) {
                if (!signature) {
                    throw new Error("Invalid signature");
                }
                hash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(signature));
                return [2 /*return*/, hash.slice(2, 66)]; // Remove 0x and use first 32 bytes
            });
        });
    };
    /**
     * Verify message signature
     * @param message - Original signed message
     * @param signature - Cryptographic signature
     * @returns Recovered Ethereum address
     * @throws {Error} For invalid inputs
     */
    Web3Connector.prototype.verifySignature = function (message, signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!message || !signature) {
                    throw new Error("Invalid message or signature");
                }
                try {
                    return [2 /*return*/, ethers_1.ethers.verifyMessage(message, signature)];
                }
                catch (error) {
                    throw new Error("Invalid message or signature");
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get browser-based Ethereum signer
     * @returns Browser provider signer
     * @throws {Error} If MetaMask not detected
     */
    Web3Connector.prototype.getEthereumSigner = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ethereum, provider, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!Web3Connector.isMetaMaskAvailable()) {
                            throw new Error("MetaMask not found. Please install MetaMask to continue.");
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        ethereum = window.ethereum;
                        return [4 /*yield*/, ethereum.request({
                                method: "eth_requestAccounts",
                            })];
                    case 2:
                        _b.sent();
                        provider = new ethers_1.ethers.BrowserProvider(ethereum);
                        return [2 /*return*/, provider.getSigner()];
                    case 3:
                        error_6 = _b.sent();
                        throw new Error("Error accessing MetaMask: ".concat((_a = error_6.message) !== null && _a !== void 0 ? _a : "Unknown error"));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Web3Connector;
}(eventEmitter_1.EventEmitter));
exports.Web3Connector = Web3Connector;
if (typeof window !== "undefined") {
    window.Web3Connector = Web3Connector;
}
else if (typeof global !== "undefined") {
    global.Web3Connector = Web3Connector;
}
