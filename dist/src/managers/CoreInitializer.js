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
import { ShogunStorage } from '../storage/storage.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { WebauthnPlugin } from '../plugins/webauthn/webauthnPlugin.js';
import { Web3ConnectorPlugin } from '../plugins/web3/web3ConnectorPlugin.js';
import { NostrConnectorPlugin } from '../plugins/nostr/nostrConnectorPlugin.js';
import { DataBase, derive } from '../gundb/db.js';
/**
 * Handles initialization of ShogunCore components
 */
var CoreInitializer = /** @class */ (function () {
    function CoreInitializer(core) {
        this.core = core;
    }
    /**
     * Initialize the Shogun SDK
     * @param config - SDK Configuration object
     * @description Creates a new instance of ShogunCore with the provided configuration.
     * Initializes all required components including storage, event emitter, GunInstance connection,
     * and plugin system.
     */
    CoreInitializer.prototype.initialize = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // Polyfill console for environments where it might be missing
                if (typeof console === 'undefined') {
                    global.console = {
                        log: function () { },
                        warn: function () { },
                        error: function () { },
                        info: function () { },
                        debug: function () { },
                    };
                }
                // Initialize storage
                this.core.storage = new ShogunStorage(config.silent);
                // Setup error handler
                ErrorHandler.addListener(function (error) {
                    _this.core.emit('error', {
                        action: error.code,
                        message: error.message,
                        type: error.type,
                    });
                });
                // Setup Gun instance
                this.initializeGun(config);
                // Setup Gun user
                this.initializeGunUser();
                // Setup Gun event forwarding
                this.setupGunEventForwarding();
                // Setup wallet derivation
                this.setupWalletDerivation();
                // Register built-in plugins
                this.registerBuiltinPlugins(config);
                // Initialize async components
                this.initializeDb();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Initialize Gun or Holster instance
     */
    CoreInitializer.prototype.initializeGun = function (config) {
        try {
            if (!config.gunInstance) {
                throw new Error('gunInstance is required but was not provided');
            }
            // Validate Gun instance
            if (typeof config.gunInstance !== 'object') {
                throw new Error("Gun instance must be an object, received: ".concat(typeof config.gunInstance));
            }
            if (typeof config.gunInstance.user !== 'function') {
                throw new Error("Gun instance is invalid: gun.user is not a function. Received gun.user type: ".concat(typeof config.gunInstance.user));
            }
            if (typeof config.gunInstance.get !== 'function') {
                throw new Error("Gun instance is invalid: gun.get is not a function. Received gun.get type: ".concat(typeof config.gunInstance.get));
            }
            if (typeof config.gunInstance.on !== 'function') {
                throw new Error("Gun instance is invalid: gun.on is not a function. Received gun.on type: ".concat(typeof config.gunInstance.on));
            }
            this.core._gun = config.gunInstance;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error validating Gun instance:', error);
            }
            throw new Error("Failed to validate Gun instance: ".concat(error));
        }
        try {
            // Resolve SEA
            var sea = this.resolveSEA(this.core._gun);
            this.core.db = new DataBase(this.core._gun, this.core, sea);
            return true;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error initializing DataBase:', error);
            }
            throw new Error("Failed to initialize DataBase: ".concat(error));
        }
    };
    CoreInitializer.prototype.resolveSEA = function (instance) {
        // Get SEA from instance
        var sea = instance.SEA || null;
        if (sea)
            return sea;
        // Try to find SEA in various global locations
        var namespace = 'Gun';
        var g = globalThis;
        var w = (typeof window !== 'undefined' ? window : {});
        var glob = (typeof global !== 'undefined' ? global : {});
        if (w[namespace] && w[namespace].SEA) {
            sea = w[namespace].SEA;
        }
        else if (g[namespace] && g[namespace].SEA) {
            sea = g[namespace].SEA;
        }
        else if (glob[namespace] && glob[namespace].SEA) {
            sea = glob[namespace].SEA;
        }
        else if (g.SEA) {
            sea = g.SEA;
        }
        else if (w.SEA) {
            sea = w.SEA;
        }
        return sea;
    };
    /**
     * Initialize Gun/Holster user
     */
    CoreInitializer.prototype.initializeGunUser = function () {
        var _this = this;
        try {
            var userInstance = this.core.gun.user();
            if (typeof userInstance.recall === 'function') {
                if (userInstance.recall.length > 0) {
                    // Gun API: recall takes options
                    this.core._user = userInstance.recall({ sessionStorage: true });
                }
                else {
                    userInstance.recall();
                    this.core._user = userInstance.is ? userInstance : null;
                }
            }
            else {
                this.core._user = userInstance;
            }
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error initializing user:', error);
            }
            throw new Error("Failed to initialize user: ".concat(error));
        }
        // Setup auth event listener
        if (typeof this.core.gun.on === 'function') {
            // Gun has native "auth" events
            try {
                this.core.gun.on('auth', function (user) {
                    var _a;
                    var userInstance = _this.core.gun.user();
                    if (typeof userInstance.recall === 'function') {
                        if (userInstance.recall.length > 0) {
                            _this.core._user = userInstance.recall({ sessionStorage: true });
                        }
                        else {
                            userInstance.recall();
                            _this.core._user = userInstance.is ? userInstance : null;
                        }
                    }
                    else {
                        _this.core._user = userInstance;
                    }
                    _this.core.emit('auth:login', {
                        userPub: user.pub || ((_a = user.is) === null || _a === void 0 ? void 0 : _a.pub),
                        method: 'password',
                    });
                });
            }
            catch (error) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[CoreInitializer] Failed to register auth event listener:', error);
                }
            }
        }
    };
    /**
     * Setup Gun event forwarding
     */
    CoreInitializer.prototype.setupGunEventForwarding = function () {
        var _this = this;
        var gunEvents = ['gun:put', 'gun:get', 'gun:set', 'gun:remove'];
        gunEvents.forEach(function (eventName) {
            _this.core.db.on(eventName, function (data) {
                _this.core.emit(eventName, data);
            });
        });
        var peerEvents = [
            'gun:peer:add',
            'gun:peer:remove',
            'gun:peer:connect',
            'gun:peer:disconnect',
        ];
        peerEvents.forEach(function (eventName) {
            _this.core.db.on(eventName, function (data) {
                _this.core.emit(eventName, data);
            });
        });
    };
    /**
     * Setup wallet derivation
     */
    CoreInitializer.prototype.setupWalletDerivation = function () {
        var _this = this;
        if (typeof this.core.gun.on === 'function') {
            // Gun has native "auth" events
            try {
                this.core.gun.on('auth', function (user) { return __awaiter(_this, void 0, void 0, function () {
                    var priv, pub, _a;
                    var _b, _c, _d, _e, _f, _g;
                    return __generator(this, function (_h) {
                        switch (_h.label) {
                            case 0:
                                if (!user.is)
                                    return [2 /*return*/];
                                priv = ((_c = (_b = user._) === null || _b === void 0 ? void 0 : _b.sea) === null || _c === void 0 ? void 0 : _c.epriv) || ((_d = user.is) === null || _d === void 0 ? void 0 : _d.epriv);
                                pub = ((_f = (_e = user._) === null || _e === void 0 ? void 0 : _e.sea) === null || _f === void 0 ? void 0 : _f.epub) || ((_g = user.is) === null || _g === void 0 ? void 0 : _g.epub);
                                if (!(priv && pub)) return [3 /*break*/, 2];
                                _a = this.core;
                                return [4 /*yield*/, derive(priv, pub, {
                                        includeSecp256k1Bitcoin: true,
                                        includeSecp256k1Ethereum: true,
                                    })];
                            case 1:
                                _a.wallets = _h.sent();
                                _h.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); });
            }
            catch (error) {
                // If gun.on("auth") fails, log and continue
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[CoreInitializer] Failed to register wallet derivation listener:', error);
                }
            }
        }
    };
    /**
     * Register built-in plugins based on configuration
     */
    CoreInitializer.prototype.registerBuiltinPlugins = function (config) {
        try {
            // Register WebAuthn plugin if configuration is provided
            if (config.webauthn) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('WebAuthn plugin will be registered with provided configuration');
                }
                var webauthnPlugin = new WebauthnPlugin();
                if (typeof webauthnPlugin.configure === 'function') {
                    webauthnPlugin.configure(config.webauthn);
                }
                this.core.pluginManager.register(webauthnPlugin);
            }
            // Register Web3 plugin if configuration is provided
            if (config.web3) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Web3 plugin will be registered with provided configuration');
                }
                var web3Plugin = new Web3ConnectorPlugin();
                if (typeof web3Plugin.configure === 'function') {
                    web3Plugin.configure(config.web3);
                }
                this.core.pluginManager.register(web3Plugin);
            }
            // Register Nostr plugin if configuration is provided
            if (config.nostr) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Nostr plugin will be registered with provided configuration');
                }
                var nostrPlugin = new NostrConnectorPlugin();
                if (typeof nostrPlugin.configure === 'function') {
                    nostrPlugin.configure(config.nostr);
                }
                this.core.pluginManager.register(nostrPlugin);
            }
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error registering builtin plugins:', error);
            }
        }
    };
    /**
     * Initialize async components
     */
    CoreInitializer.prototype.initializeDb = function () {
        try {
            this.core.db.initialize();
            this.core.emit('debug', {
                action: 'core_initialized',
                timestamp: Date.now(),
            });
            return true;
        }
        catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('Error during Shogun Core initialization:', error);
            }
            return false;
        }
    };
    return CoreInitializer;
}());
export { CoreInitializer };
