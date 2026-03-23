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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { EventEmitter } from '../utils/eventEmitter.js';
import * as GunErrors from './errors.js';
import * as crypto from './crypto.js';
/**
 * GunDB configuration constants.
 * @internal
 */
var CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 1024,
    },
    USERNAME: {
        MAX_LENGTH: 64,
    },
};
/**
 * DataBase
 *
 * Manages GunDB user authentication and various utility helpers for
 * session, alias/username, SEA cryptography, event handling, and reactive streams.
 */
var DataBase = /** @class */ (function () {
    /**
     * Constructs a new DataBase instance connected to a GunDB instance.
     * @param gun The main GunDB instance.
     * @param core Optionally, the root Gun instance (unused in this context).
     * @param sea Optional cryptography (Gun SEA) instance; will be auto-discovered if not provided.
     * @throws If gun or gun.user() is not provided.
     */
    function DataBase(gun, core, sea) {
        var _a;
        /** Cached user instance or `null` if not logged in */
        this.user = null;
        /** Registered callbacks for auth state changes */
        this.onAuthCallbacks = [];
        /** Whether the database instance has been destroyed */
        this._isDestroyed = false;
        /** Node prefix for Firegun compatibility */
        this.prefix = '';
        /** Event handlers for Firegun compatibility */
        this.ev = {};
        this.eventEmitter = new EventEmitter();
        this.core = core;
        if (!gun) {
            throw new Error('Gun instance is required but was not provided');
        }
        if (typeof gun.user !== 'function') {
            throw new Error('Gun instance is invalid: gun.user is not a function');
        }
        this.gun = gun;
        this.user = this.gun.user().recall({ sessionStorage: true });
        this.subscribeToAuthEvents();
        this.crypto = crypto;
        this.sea = sea || null;
        if (!this.sea) {
            if (this.gun.SEA) {
                this.sea = this.gun.SEA;
            }
            else if ((_a = globalThis.Gun) === null || _a === void 0 ? void 0 : _a.SEA) {
                this.sea = globalThis.Gun.SEA;
            }
            else if (globalThis.SEA) {
                this.sea = globalThis.SEA;
            }
        }
        this.usernamesNode = this.gun.get('usernames');
        console.log('[DB] DataBase initialization completed');
    }
    /**
     * Initialize the database instance.
     */
    DataBase.prototype.initialize = function () {
        // Database is already initialized in constructor
    };
    /**
     * Internal: subscribe to GunDB "auth" events and notify listeners.
     * Listeners are invoked on authentication status change.
     * @internal
     */
    DataBase.prototype.subscribeToAuthEvents = function () {
        var _this = this;
        this.gun.on('auth', function (ack) {
            var _a;
            if (ack.err) {
                console.error('[DB] Auth event error:', ack.err);
            }
            else {
                _this.notifyAuthListeners(((_a = ack.sea) === null || _a === void 0 ? void 0 : _a.pub) || '');
            }
        });
    };
    /**
     * Internal: notify all onAuth callbacks with current user.
     * @param pub User's public key (pub).
     * @internal
     */
    DataBase.prototype.notifyAuthListeners = function (pub) {
        var user = this.gun.user();
        this.onAuthCallbacks.forEach(function (cb) { return cb(user); });
    };
    /**
     * Listen for authentication/sign-in events (login, logout, etc).
     * @param callback Function to call with new user instance.
     * @returns Function to remove the registered callback.
     */
    DataBase.prototype.onAuth = function (callback) {
        var _this = this;
        this.onAuthCallbacks.push(callback);
        var user = this.gun.user();
        if (user && user.is)
            callback(user);
        return function () {
            var i = _this.onAuthCallbacks.indexOf(callback);
            if (i !== -1)
                _this.onAuthCallbacks.splice(i, 1);
        };
    };
    /**
     * Check if a user is currently logged in (there is a valid session).
     * @returns `true` if logged in; otherwise `false`.
     */
    DataBase.prototype.isLoggedIn = function () {
        try {
            var user = this.gun.user();
            return !!(user && user.is && user.is.pub);
        }
        catch (error) {
            return false;
        }
    };
    /**
     * Attempt to restore a previously saved session from sessionStorage.
     * @returns Object indicating success, error, and userPub if restored.
     */
    DataBase.prototype.restoreSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionData, session, integrityCheck, key, decryptedData, user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (typeof sessionStorage === 'undefined') {
                            return [2 /*return*/, { success: false, error: 'sessionStorage not available' }];
                        }
                        sessionData = sessionStorage.getItem('gunSessionData');
                        if (!sessionData) {
                            return [2 /*return*/, { success: false, error: 'No saved session' }];
                        }
                        session = JSON.parse(sessionData);
                        // Handle legacy plaintext sessions (no version or version < 2)
                        if (!session.version || session.version < 2) {
                            sessionStorage.removeItem('gunSessionData');
                            return [2 /*return*/, { success: false, error: 'Legacy session expired' }];
                        }
                        // Check required fields for encrypted session
                        if (!session.encrypted ||
                            !session.integrity ||
                            !session.salt ||
                            !session.pub) {
                            return [2 /*return*/, { success: false, error: 'Invalid encrypted session format' }];
                        }
                        return [4 /*yield*/, this.sea.work(session.encrypted, null, null, { name: 'SHA-256' })];
                    case 1:
                        integrityCheck = _a.sent();
                        if (integrityCheck !== session.integrity) {
                            sessionStorage.removeItem('gunSessionData');
                            return [2 /*return*/, { success: false, error: 'Session integrity check failed' }];
                        }
                        return [4 /*yield*/, this.deriveSessionKey(session.username, session.salt, session.pub)];
                    case 2:
                        key = _a.sent();
                        return [4 /*yield*/, this.sea.decrypt(session.encrypted, key)];
                    case 3:
                        decryptedData = _a.sent();
                        if (!decryptedData) {
                            sessionStorage.removeItem('gunSessionData');
                            return [2 /*return*/, { success: false, error: 'Session decryption failed' }];
                        }
                        // 4. Validate session content
                        if (decryptedData.pub !== session.pub) {
                            return [2 /*return*/, { success: false, error: 'Session public key mismatch' }];
                        }
                        // Check if session is expired
                        if (decryptedData.expiresAt && Date.now() > decryptedData.expiresAt) {
                            sessionStorage.removeItem('gunSessionData');
                            return [2 /*return*/, { success: false, error: 'Session expired' }];
                        }
                        user = this.gun.user();
                        if (user.is && user.is.pub === session.pub) {
                            this.user = user;
                            return [2 /*return*/, { success: true, userPub: session.pub }];
                        }
                        return [2 /*return*/, { success: false, error: 'Session verification failed' }];
                    case 4:
                        error_1 = _a.sent();
                        console.error('[DB] Restore session error:', error_1);
                        return [2 /*return*/, { success: false, error: String(error_1) }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Log out the current user, clear local state and remove session from storage.
     */
    DataBase.prototype.logout = function () {
        try {
            var wasLoggedIn = !!this.user;
            var currentUser = this.gun.user();
            if (currentUser && currentUser.is) {
                currentUser.leave();
            }
            this.user = null;
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('gunSessionData');
            }
            // Emit auth:logout event if core is available and user was logged in
            if (wasLoggedIn && this.core && typeof this.core.emit === 'function') {
                this.core.emit('auth:logout', undefined);
            }
        }
        catch (error) {
            console.error('[DB] Error during logout:', error);
        }
    };
    /**
     * Validate that a provided password meets minimum length requirements.
     * @param password Password string to validate.
     * @returns Object indicating validity and, if invalid, an error.
     */
    DataBase.prototype.validatePasswordStrength = function (password) {
        if (password.length < CONFIG.PASSWORD.MIN_LENGTH) {
            return {
                valid: false,
                error: "Password must be at least ".concat(CONFIG.PASSWORD.MIN_LENGTH, " characters long"),
            };
        }
        if (password.length > CONFIG.PASSWORD.MAX_LENGTH) {
            return {
                valid: false,
                error: "Password must be ".concat(CONFIG.PASSWORD.MAX_LENGTH, " characters or fewer"),
            };
        }
        if (!/[A-Z]/.test(password)) {
            return {
                valid: false,
                error: 'Password must contain at least one uppercase letter',
            };
        }
        if (!/[a-z]/.test(password)) {
            return {
                valid: false,
                error: 'Password must contain at least one lowercase letter',
            };
        }
        if (!/[0-9]/.test(password)) {
            return {
                valid: false,
                error: 'Password must contain at least one number',
            };
        }
        if (!/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(password)) {
            return {
                valid: false,
                error: 'Password must contain at least one special character',
            };
        }
        return { valid: true };
    };
    /**
     * Validate a signup request's username, password, and/or cryptographic pair.
     * @param username Username string.
     * @param password Password string.
     * @param pair Optional cryptographic SEA pair.
     * @returns Object with validation status and optional error.
     */
    DataBase.prototype.validateSignupCredentials = function (username, password, pair) {
        if (!username || username.length < 1) {
            return {
                valid: false,
                error: 'Username must be more than 0 characters long',
            };
        }
        if (username.length > CONFIG.USERNAME.MAX_LENGTH) {
            return {
                valid: false,
                error: "Username must be ".concat(CONFIG.USERNAME.MAX_LENGTH, " characters or fewer"),
            };
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return {
                valid: false,
                error: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
            };
        }
        if (pair) {
            if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                return { valid: false, error: 'Invalid pair provided' };
            }
            return { valid: true };
        }
        return this.validatePasswordStrength(password);
    };
    /**
     * Ensures that an alias/username is available in GunDB for registration.
     * @param alias Username to check.
     * @param timeout Timeout in milliseconds (default 5000ms).
     * @throws If the alias is already taken.
     */
    DataBase.prototype.ensureAliasAvailable = function (alias_1) {
        return __awaiter(this, arguments, void 0, function (alias, timeout) {
            var available;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.isAliasAvailable(alias, timeout)];
                    case 1:
                        available = _a.sent();
                        if (!available) {
                            throw new Error("Alias \"".concat(alias, "\" is already registered in Gun"));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a given alias/username is available on GunDB.
     * @param alias Username to check for availability.
     * @param timeout Timeout in ms (default: 5000).
     * @returns Promise resolving to `true` if available; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    DataBase.prototype.isAliasAvailable = function (alias_1) {
        return __awaiter(this, arguments, void 0, function (alias, timeout) {
            var normalizedAlias;
            var _this = this;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_a) {
                if (typeof alias !== 'string' || !alias.trim()) {
                    throw new Error('Alias must be a non-empty string');
                }
                normalizedAlias = alias.trim().toLowerCase();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var settled = false;
                        var timer = setTimeout(function () {
                            if (settled)
                                return;
                            settled = true;
                            reject(new Error('Timeout while checking alias availability'));
                        }, timeout);
                        _this.usernamesNode.get(normalizedAlias).once(function (existingPub) {
                            if (settled)
                                return;
                            settled = true;
                            clearTimeout(timer);
                            resolve(!existingPub);
                        });
                    })];
            });
        });
    };
    /**
     * Checks if a given alias/username is taken on GunDB.
     * @param alias Username to check for availability.
     * @returns Promise resolving to `true` if taken; otherwise `false`.
     * @throws If alias is invalid or on I/O error.
     */
    DataBase.prototype.isAliasTaken = function (alias) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Check if username exists by looking up ~@username
                        _this.gun.get("~@".concat(alias)).once(function (user) {
                            // If user exists, alias is taken (return true)
                            // If user is null/undefined, alias is available (return false)
                            resolve(!!user);
                        });
                    })];
            });
        });
    };
    /**
     * Register a new alias (username) → public key mapping on GunDB.
     * @param alias The username/alias to register.
     * @param userPub The user's public key.
     * @param timeout Timeout in ms (default 5000).
     * @throws If alias/userPub is invalid or the alias cannot be registered.
     */
    DataBase.prototype.registerAlias = function (alias_1, userPub_1) {
        return __awaiter(this, arguments, void 0, function (alias, userPub, timeout) {
            var normalizedAlias, available, taken;
            var _this = this;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!alias || !alias.trim()) {
                            throw new Error('Alias must be provided for registration');
                        }
                        if (!userPub) {
                            throw new Error('userPub must be provided for alias registration');
                        }
                        normalizedAlias = alias.trim().toLowerCase();
                        return [4 /*yield*/, this.isAliasAvailable(normalizedAlias, timeout).catch(function (error) {
                                console.error('[DB] Alias availability check failed:', error);
                                throw error;
                            })];
                    case 1:
                        available = _a.sent();
                        return [4 /*yield*/, this.isAliasTaken(normalizedAlias)];
                    case 2:
                        taken = _a.sent();
                        if (taken) {
                            throw new Error("Alias \"".concat(normalizedAlias, "\" is already taken"));
                        }
                        if (!available) {
                            throw new Error("Alias \"".concat(normalizedAlias, "\" is no longer available for registration"));
                        }
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var settled = false;
                                var timer = setTimeout(function () {
                                    if (settled)
                                        return;
                                    settled = true;
                                    reject(new Error('Timeout while registering alias'));
                                }, timeout);
                                _this.usernamesNode.get(normalizedAlias).put(userPub, function (ack) {
                                    if (settled)
                                        return;
                                    settled = true;
                                    clearTimeout(timer);
                                    if (ack && ack.err) {
                                        reject(new Error(String(ack.err)));
                                        return;
                                    }
                                    resolve();
                                });
                            }).catch(function (error) {
                                console.error('[DB] Failed to register alias:', error);
                                throw error;
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset gun.user() authentication state and clear cached user.
     * @internal
     */
    DataBase.prototype.resetAuthState = function () {
        try {
            var user = this.gun.user();
            if (user && user._) {
                var cat = user._;
                cat.ing = false;
                cat.auth = null;
                cat.act = null;
                if (cat.auth) {
                    cat.auth = null;
                }
            }
            try {
                user.leave();
            }
            catch (leaveError) {
                // Ignore leave errors
            }
            this.user = null;
        }
        catch (e) {
            // Ignore
        }
    };
    /**
     * Assemble a standard AuthResult object after a successful login.
     * @param username Resulting username.
     * @param userPub Public key (pub) for logged-in user.
     * @returns AuthResult.
     * @internal
     */
    DataBase.prototype.buildLoginResult = function (username, userPub) {
        var _a, _b;
        var seaPair = (_b = (_a = this.gun.user()) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea;
        return {
            success: true,
            userPub: userPub,
            username: username,
            sea: seaPair
                ? {
                    pub: seaPair.pub,
                    priv: seaPair.priv,
                    epub: seaPair.epub,
                    epriv: seaPair.epriv,
                }
                : undefined,
        };
    };
    /**
     * Internal: Get or create a device-specific secret stored in localStorage.
     * This binds the session key to the device, preventing decryption of stolen sessionStorage
     * on other devices.
     */
    DataBase.prototype.getDeviceSecret = function () {
        try {
            if (typeof localStorage === 'undefined')
                return '';
            var KEY = 'shogun_device_secret';
            var secret = localStorage.getItem(KEY);
            if (!secret) {
                secret = this.crypto.randomUUID();
                try {
                    localStorage.setItem(KEY, secret);
                }
                catch (e) {
                    console.warn('[DB] Failed to save device secret to localStorage', e);
                    // If we can't save it, we return it anyway so current session works.
                    // Next reload will fail to decrypt, which is secure fail.
                }
            }
            return secret;
        }
        catch (e) {
            return '';
        }
    };
    /**
     * Derive a unique encryption key for the session.
     * @param username Username to derive key from
     * @param salt Random salt for this session
     * @param pub User's public key
     */
    DataBase.prototype.deriveSessionKey = function (username, salt, pub) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceSecret, input;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // We use SEA.work to derive a key from username + salt + pub
                        // This makes the key unique per session (due to salt) and user
                        if (!this.sea)
                            throw new Error('SEA not available');
                        deviceSecret = this.getDeviceSecret();
                        input = "".concat(username, ":").concat(salt, ":").concat(pub, ":").concat(deviceSecret);
                        return [4 /*yield*/, this.sea.work(input, null, null, { name: 'SHA-256' })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Save credentials for the current session to sessionStorage, if available.
     * Encrypts sensitive data using a derived session key.
     * @param userInfo The credentials and user identity to store.
     */
    DataBase.prototype.saveCredentials = function (userInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var salt, key, payload, encrypted, integrity, sessionInfo, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        if (!(typeof sessionStorage !== 'undefined')) return [3 /*break*/, 5];
                        if (!this.sea)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.sea.work(this.crypto.randomUUID(), null, null, {
                                name: 'SHA-256',
                            })];
                    case 1:
                        salt = _a.sent();
                        return [4 /*yield*/, this.deriveSessionKey(userInfo.alias, salt, userInfo.userPub)];
                    case 2:
                        key = _a.sent();
                        payload = {
                            username: userInfo.alias,
                            pair: userInfo.pair,
                            pub: userInfo.userPub,
                            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                        };
                        return [4 /*yield*/, this.sea.encrypt(payload, key)];
                    case 3:
                        encrypted = _a.sent();
                        return [4 /*yield*/, this.sea.work(encrypted, null, null, {
                                name: 'SHA-256',
                            })];
                    case 4:
                        integrity = _a.sent();
                        sessionInfo = {
                            version: 2,
                            username: userInfo.alias,
                            pub: userInfo.userPub,
                            salt: salt,
                            encrypted: encrypted,
                            integrity: integrity,
                        };
                        sessionStorage.setItem('gunSessionData', JSON.stringify(sessionInfo));
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.error('[DB] Error saving credentials:', error_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register and authenticate a new user account.
     * @param username The username to create/account for.
     * @param password The user's password.
     * @param pair Optional cryptographic pair (for `auth` instead of password).
     * @returns SignUpResult Promise.
     */
    DataBase.prototype.signUp = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, normalizedUsername, user, loginResult, e_1, aliasError_1, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validation = this.validateSignupCredentials(username, password, pair);
                        if (!validation.valid) {
                            return [2 /*return*/, { success: false, error: validation.error }];
                        }
                        this.resetAuthState();
                        normalizedUsername = username.trim().toLowerCase();
                        user = this.gun.user();
                        if (!pair) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new Promise(function (resolve) {
                                var callbackInvoked = false;
                                user.auth(pair, function (ack) { return __awaiter(_this, void 0, void 0, function () {
                                    var userPub, alias, userPair;
                                    var _a, _b, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                if (callbackInvoked) {
                                                    return [2 /*return*/];
                                                }
                                                callbackInvoked = true;
                                                if (ack.err) {
                                                    resolve({ success: false, error: ack.err });
                                                    return [2 /*return*/];
                                                }
                                                userPub = (_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub;
                                                if (!userPub) {
                                                    this.resetAuthState();
                                                    resolve({ success: false, error: 'No userPub available' });
                                                    return [2 /*return*/];
                                                }
                                                this.user = user;
                                                alias = (_b = user === null || user === void 0 ? void 0 : user.is) === null || _b === void 0 ? void 0 : _b.alias;
                                                userPair = (_c = user === null || user === void 0 ? void 0 : user._) === null || _c === void 0 ? void 0 : _c.sea;
                                                return [4 /*yield*/, this.saveCredentials({
                                                        alias: alias || normalizedUsername,
                                                        pair: pair !== null && pair !== void 0 ? pair : userPair,
                                                        userPub: userPub,
                                                    })];
                                            case 1:
                                                _d.sent();
                                                // Emit auth:signup event if core is available (pair-based signup)
                                                if (this.core && typeof this.core.emit === 'function') {
                                                    this.core.emit('auth:signup', {
                                                        userPub: userPub,
                                                        username: normalizedUsername,
                                                        method: 'pair',
                                                    });
                                                }
                                                resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            })];
                    case 2:
                        loginResult = _a.sent();
                        if (loginResult && loginResult.success) {
                            return [2 /*return*/, loginResult];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.ensureAliasAvailable(normalizedUsername)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        aliasError_1 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: aliasError_1 instanceof Error ? aliasError_1.message : String(aliasError_1),
                            }];
                    case 7: return [4 /*yield*/, new Promise(function (resolve) {
                            var callbackInvoked = false;
                            user.create(normalizedUsername, password, function (createAck) {
                                if (callbackInvoked) {
                                    return;
                                }
                                if (createAck.err ||
                                    (createAck.ok !== undefined && createAck.ok !== 0)) {
                                    callbackInvoked = true;
                                    _this.resetAuthState();
                                    resolve({ success: false, error: createAck.err || 'Signup failed' });
                                    return;
                                }
                                var userPub = createAck.pub;
                                if (!userPub) {
                                    callbackInvoked = true;
                                    _this.resetAuthState();
                                    resolve({
                                        success: false,
                                        error: 'No userPub available from signup',
                                    });
                                    return;
                                }
                                user.auth(normalizedUsername, password, function (authAck) { return __awaiter(_this, void 0, void 0, function () {
                                    var authenticatedUserPub, alias, userPair, saveError_1, registerError_1, sea;
                                    var _a, _b, _c, _d;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0:
                                                if (callbackInvoked) {
                                                    return [2 /*return*/];
                                                }
                                                callbackInvoked = true;
                                                if (authAck.err) {
                                                    this.resetAuthState();
                                                    resolve({
                                                        success: false,
                                                        error: authAck.err || 'Authentication after signup failed',
                                                    });
                                                    return [2 /*return*/];
                                                }
                                                authenticatedUserPub = (_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub;
                                                if (!authenticatedUserPub) {
                                                    this.resetAuthState();
                                                    resolve({
                                                        success: false,
                                                        error: 'User not authenticated after signup',
                                                    });
                                                    return [2 /*return*/];
                                                }
                                                this.user = user;
                                                alias = (_b = user === null || user === void 0 ? void 0 : user.is) === null || _b === void 0 ? void 0 : _b.alias;
                                                userPair = (_c = user === null || user === void 0 ? void 0 : user._) === null || _c === void 0 ? void 0 : _c.sea;
                                                _e.label = 1;
                                            case 1:
                                                _e.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, this.saveCredentials({
                                                        alias: alias || normalizedUsername,
                                                        pair: pair !== null && pair !== void 0 ? pair : userPair,
                                                        userPub: authenticatedUserPub,
                                                    })];
                                            case 2:
                                                _e.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                saveError_1 = _e.sent();
                                                return [3 /*break*/, 4];
                                            case 4:
                                                _e.trys.push([4, 6, , 7]);
                                                return [4 /*yield*/, this.registerAlias(alias || normalizedUsername, authenticatedUserPub)];
                                            case 5:
                                                _e.sent();
                                                return [3 /*break*/, 7];
                                            case 6:
                                                registerError_1 = _e.sent();
                                                console.error('[DB] Alias registration failed:', registerError_1);
                                                return [3 /*break*/, 7];
                                            case 7:
                                                // Emit auth:signup event if core is available
                                                if (this.core && typeof this.core.emit === 'function') {
                                                    this.core.emit('auth:signup', {
                                                        userPub: authenticatedUserPub,
                                                        username: normalizedUsername,
                                                        method: pair ? 'pair' : 'password',
                                                    });
                                                }
                                                sea = (_d = user === null || user === void 0 ? void 0 : user._) === null || _d === void 0 ? void 0 : _d.sea;
                                                resolve({
                                                    success: true,
                                                    userPub: authenticatedUserPub,
                                                    username: normalizedUsername,
                                                    isNewUser: true,
                                                    sea: sea
                                                        ? {
                                                            pub: sea.pub,
                                                            priv: sea.priv,
                                                            epub: sea.epub,
                                                            epriv: sea.epriv,
                                                        }
                                                        : undefined,
                                                });
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            });
                        })];
                    case 8:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Sign in (authenticate) as an existing user by username/password or SEA pair.
     * @param username Username to log in as.
     * @param password User's password (or "" if using pair).
     * @param pair Optional cryptographic SEA pair.
     * @returns AuthResult Promise.
     */
    DataBase.prototype.login = function (username, password, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedUsername, user;
            var _this = this;
            return __generator(this, function (_a) {
                this.resetAuthState();
                normalizedUsername = username.trim().toLowerCase();
                user = this.gun.user();
                return [2 /*return*/, new Promise(function (resolve) {
                        if (pair) {
                            user.auth(pair, function (ack) { return __awaiter(_this, void 0, void 0, function () {
                                var userPub, alias, userPair, saveError_2;
                                var _a, _b, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            if (ack.err) {
                                                this.resetAuthState();
                                                resolve({ success: false, error: ack.err });
                                                return [2 /*return*/];
                                            }
                                            userPub = (_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub;
                                            if (!userPub) {
                                                this.resetAuthState();
                                                resolve({ success: false, error: 'No userPub available' });
                                                return [2 /*return*/];
                                            }
                                            this.user = user;
                                            alias = (_b = user === null || user === void 0 ? void 0 : user.is) === null || _b === void 0 ? void 0 : _b.alias;
                                            userPair = (_c = user === null || user === void 0 ? void 0 : user._) === null || _c === void 0 ? void 0 : _c.sea;
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, this.saveCredentials({
                                                    alias: alias || normalizedUsername,
                                                    pair: pair !== null && pair !== void 0 ? pair : userPair,
                                                    userPub: userPub,
                                                })];
                                        case 2:
                                            _d.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            saveError_2 = _d.sent();
                                            return [3 /*break*/, 4];
                                        case 4:
                                            // Emit auth:login event if core is available (pair-based login)
                                            if (this.core && typeof this.core.emit === 'function') {
                                                this.core.emit('auth:login', {
                                                    userPub: userPub,
                                                    username: alias || normalizedUsername,
                                                    method: 'pair',
                                                });
                                            }
                                            resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                        }
                        else {
                            user.auth(normalizedUsername, password, function (ack) { return __awaiter(_this, void 0, void 0, function () {
                                var userPub, alias, userPair, saveError_3;
                                var _a, _b, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            if (ack.err) {
                                                this.resetAuthState();
                                                resolve({ success: false, error: ack.err });
                                                return [2 /*return*/];
                                            }
                                            userPub = (_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub;
                                            if (!userPub) {
                                                this.resetAuthState();
                                                resolve({ success: false, error: 'No userPub available' });
                                                return [2 /*return*/];
                                            }
                                            this.user = user;
                                            alias = (_b = user === null || user === void 0 ? void 0 : user.is) === null || _b === void 0 ? void 0 : _b.alias;
                                            userPair = (_c = user === null || user === void 0 ? void 0 : user._) === null || _c === void 0 ? void 0 : _c.sea;
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, this.saveCredentials({
                                                    alias: alias || normalizedUsername,
                                                    pair: pair !== null && pair !== void 0 ? pair : userPair,
                                                    userPub: userPub,
                                                })];
                                        case 2:
                                            _d.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            saveError_3 = _d.sent();
                                            return [3 /*break*/, 4];
                                        case 4:
                                            // Emit auth:login event if core is available (password-based login)
                                            if (this.core && typeof this.core.emit === 'function') {
                                                this.core.emit('auth:login', {
                                                    userPub: userPub,
                                                    username: alias || normalizedUsername,
                                                    method: 'password',
                                                });
                                            }
                                            resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                        }
                    })];
            });
        });
    };
    /**
     * Returns the currently authenticated user's public key and Gun user instance, if logged in.
     * @returns Object containing `pub` (public key) and optionally `user`, or `null`.
     */
    DataBase.prototype.getCurrentUser = function () {
        try {
            var user = this.gun.user();
            if (user && user.is && user.is.pub) {
                return {
                    pub: user.is.pub,
                    user: user,
                };
            }
            return null;
        }
        catch (error) {
            return null;
        }
    };
    /**
     * Get current user's public key.
     * @returns User's public key or null if not logged in.
     */
    DataBase.prototype.getUserPub = function () {
        var _a;
        try {
            var user = this.gun.user();
            return ((_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub) || null;
        }
        catch (error) {
            return null;
        }
    };
    /**
     * Authenticate using a SEA pair directly (no password required).
     * @param username The user's username for identification (not cryptographically enforced).
     * @param pair GunDB SEA pair for authentication.
     * @returns Promise with authentication result.
     * @description Authenticates user using a GunDB pair directly without password.
     */
    DataBase.prototype.loginWithPair = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedUsername, user;
            var _this = this;
            return __generator(this, function (_a) {
                // Validate pair structure
                if (!pair || !pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
                    return [2 /*return*/, {
                            success: false,
                            error: 'Invalid pair structure - missing required keys',
                        }];
                }
                if (username.length > CONFIG.USERNAME.MAX_LENGTH) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Username must be ".concat(CONFIG.USERNAME.MAX_LENGTH, " characters or fewer"),
                        }];
                }
                this.resetAuthState();
                normalizedUsername = username.trim().toLowerCase();
                user = this.gun.user();
                console.log('[DB] Login with pair for username:', normalizedUsername);
                return [2 /*return*/, new Promise(function (resolve) {
                        user.auth(pair, function (ack) { return __awaiter(_this, void 0, void 0, function () {
                            var userPub, alias, userPair, saveError_4;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        if (ack.err) {
                                            this.resetAuthState();
                                            resolve({ success: false, error: ack.err });
                                            return [2 /*return*/];
                                        }
                                        userPub = (_a = user === null || user === void 0 ? void 0 : user.is) === null || _a === void 0 ? void 0 : _a.pub;
                                        if (!userPub) {
                                            this.resetAuthState();
                                            resolve({ success: false, error: 'No userPub available' });
                                            return [2 /*return*/];
                                        }
                                        this.user = user;
                                        alias = (_b = user === null || user === void 0 ? void 0 : user.is) === null || _b === void 0 ? void 0 : _b.alias;
                                        userPair = (_c = user === null || user === void 0 ? void 0 : user._) === null || _c === void 0 ? void 0 : _c.sea;
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, this.saveCredentials({
                                                alias: alias || normalizedUsername,
                                                pair: pair !== null && pair !== void 0 ? pair : userPair,
                                                userPub: userPub,
                                            })];
                                    case 2:
                                        _d.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        saveError_4 = _d.sent();
                                        return [3 /*break*/, 4];
                                    case 4:
                                        // Emit auth:login event if core is available (loginWithPair)
                                        if (this.core && typeof this.core.emit === 'function') {
                                            this.core.emit('auth:login', {
                                                userPub: userPub,
                                                username: alias || normalizedUsername,
                                                method: 'pair',
                                            });
                                        }
                                        resolve(this.buildLoginResult(alias || normalizedUsername, userPub));
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    /**
     * Legacy API: Sign in using a username and SEA pair (password parameter is unused).
     * @param username Username to sign in as.
     * @param pair SEA key pair.
     * @returns AuthResult Promise.
     */
    DataBase.prototype.loginWithPairLegacy = function (username, pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.login(username, '', pair)];
            });
        });
    };
    /**
     * Wait in ms
     * @param ms duration of timeout in ms
     * @returns
     */
    DataBase.prototype._timeout = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    /**
     * Delete On Subscription
     * @param ev On subscription name, default : "default"
     */
    DataBase.prototype.Off = function (ev) {
        if (ev === void 0) { ev = 'default'; }
        if (this.ev[ev] && this.ev[ev].handler) {
            this.ev[ev].handler.off();
        }
        else {
            this.ev[ev] = { handler: null };
        }
    };
    /**
     * Listen changes on path
     *
     * @param path node path
     * @param callback callback
     * @param prefix node prefix, default : ""
     */
    DataBase.prototype.Listen = function (path, callback, prefix) {
        if (prefix === void 0) { prefix = this.prefix; }
        path = "".concat(prefix).concat(path);
        var paths = path.split('/');
        var dataGun = this.gun;
        paths.forEach(function (p) {
            dataGun = dataGun.get(p);
        });
        dataGun.map().once(function (s) {
            callback(s);
        });
    };
    /**
     * New subscription on Path. When data on Path changed, callback is called.
     *
     * @param path node path
     * @param callback callback
     * @param ev On name as identifier, to be called by Off when finished
     * @param different Whether to fetch only differnce, or all of nodes
     * @param prefix node prefix, default : ""
     */
    DataBase.prototype.On = function (path, callback, ev, different, prefix) {
        var _this = this;
        if (ev === void 0) { ev = 'default'; }
        if (different === void 0) { different = true; }
        if (prefix === void 0) { prefix = this.prefix; }
        path = "".concat(prefix).concat(path);
        var paths = path.split('/');
        var dataGun = this.gun;
        paths.forEach(function (p) {
            dataGun = dataGun.get(p);
        });
        var listenerHandler = function (value, key, _msg, _ev) {
            _this.ev[ev] = { handler: _ev };
            if (value)
                callback(JSON.parse(JSON.stringify(value)));
        };
        // @ts-ignore
        dataGun.on(listenerHandler, { change: different });
    };
    /**
     * Insert CONTENT-ADDRESSING Readonly Data.
     *
     * @param key must begin with #
     * @param data If object, it will be stringified automatically
     * @returns
     */
    DataBase.prototype.addContentAdressing = function (key, data) {
        var _this = this;
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        return new Promise(function (resolve, reject) {
            _this.sea
                .work(data, null, undefined, { name: 'SHA-256' })
                .then(function (hash) {
                if (hash) {
                    _this.gun
                        .get("".concat(key))
                        .get(hash)
                        .put(data, function (s) {
                        resolve(s);
                    });
                }
                else {
                    reject(new Error('Hash generation failed'));
                }
            })
                .catch(reject);
        });
    };
    /**
     * Fetch data from userspace
     */
    DataBase.prototype.userGet = function (path, repeat, prefix) {
        if (repeat === void 0) { repeat = 1; }
        if (prefix === void 0) { prefix = this.prefix; }
        var pub = this.getUserPub();
        if (pub) {
            path = "~".concat(pub, "/").concat(path);
            return this.Get(path, repeat, prefix);
        }
        else {
            return Promise.resolve(undefined);
        }
    };
    /**
     * Load Multi Nested Data From Userspace
     */
    DataBase.prototype.userLoad = function (path, async, repeat, prefix) {
        if (async === void 0) { async = false; }
        if (repeat === void 0) { repeat = 1; }
        if (prefix === void 0) { prefix = this.prefix; }
        var pub = this.getUserPub();
        if (pub) {
            path = "~".concat(pub, "/").concat(path);
            return this.Load(path, async, repeat, prefix);
        }
        else {
            return Promise.resolve({
                data: {},
                err: [{ path: path, err: 'User not logged in' }],
            });
        }
    };
    /**
     * Fetching data
     */
    DataBase.prototype.Get = function (path, repeat, prefix) {
        var _this = this;
        if (repeat === void 0) { repeat = 1; }
        if (prefix === void 0) { prefix = this.prefix; }
        var path0 = path;
        path = "".concat(prefix).concat(path);
        var paths = path.split('/');
        var dataGun = this.gun;
        paths.forEach(function (p) {
            dataGun = dataGun.get(p);
        });
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject({
                    err: 'timeout',
                    ket: "TIMEOUT, Possibly Data : ".concat(path, " is corrupt"),
                    data: {},
                    '#': path,
                });
            }, 5000);
            dataGun.once(function (s) { return __awaiter(_this, void 0, void 0, function () {
                var data, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!s) return [3 /*break*/, 1];
                            s = JSON.parse(JSON.stringify(s));
                            resolve(s);
                            return [3 /*break*/, 8];
                        case 1:
                            if (!repeat) return [3 /*break*/, 7];
                            return [4 /*yield*/, this._timeout(1000)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.Get(path0, repeat - 1, prefix)];
                        case 4:
                            data = _a.sent();
                            resolve(data);
                            return [3 /*break*/, 6];
                        case 5:
                            error_3 = _a.sent();
                            reject(error_3);
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 8];
                        case 7:
                            reject({
                                err: 'notfound',
                                ket: "Data Not Found,  Data : ".concat(path, " is undefined"),
                                data: {},
                                '#': path,
                            });
                            _a.label = 8;
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    /**
     * Put data on userspace
     */
    DataBase.prototype.userPut = function (path, data, async, prefix) {
        var _this = this;
        if (async === void 0) { async = false; }
        if (prefix === void 0) { prefix = this.prefix; }
        return new Promise(function (resolve, reject) {
            var pub = _this.getUserPub();
            if (pub) {
                path = "~".concat(pub, "/").concat(path);
                _this.Put(path, data, async, prefix).then(resolve).catch(reject);
            }
            else {
                reject({ err: new Error('User Belum Login'), ok: undefined });
            }
        });
    };
    DataBase.prototype._randomAlphaNumeric = function (length) {
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        var bytes = new Uint8Array(length);
        var c = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto;
        if (!(c === null || c === void 0 ? void 0 : c.getRandomValues)) {
            throw new GunErrors.GunError('Cryptographically secure randomness is not available.');
        }
        try {
            c.getRandomValues(bytes);
        }
        catch (e) {
            throw new GunErrors.GunError("Failed to generate secure random values: ".concat(e instanceof Error ? e.message : String(e)));
        }
        var result = '';
        for (var i = 0; i < length; i++) {
            result += characters.charAt(bytes[i] % charactersLength);
        }
        return result;
    };
    /**
     * Insert new Data into a node with a random key
     */
    DataBase.prototype.Set = function (path, data, async, prefix, opt) {
        var _this = this;
        if (async === void 0) { async = false; }
        if (prefix === void 0) { prefix = this.prefix; }
        if (opt === void 0) { opt = undefined; }
        return new Promise(function (resolve, reject) {
            var token = _this._randomAlphaNumeric(30);
            data.id = token;
            _this.Put("".concat(path, "/").concat(token), data, async, prefix, opt)
                .then(function (s) {
                resolve(s);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Put Data to the gunDB Node
     */
    DataBase.prototype.Put = function (path, data, async, prefix, opt) {
        var e_2, _a;
        if (async === void 0) { async = false; }
        if (prefix === void 0) { prefix = this.prefix; }
        if (opt === void 0) { opt = undefined; }
        path = "".concat(prefix).concat(path);
        var paths = path.split('/');
        var dataGun = this.gun;
        paths.forEach(function (p) {
            dataGun = dataGun.get(p);
        });
        if (typeof data === 'undefined') {
            data = { t: '_' };
        }
        var promises = [];
        var storedObj = { data: [], error: [] };
        if (typeof data == 'object' && data !== null) {
            try {
                for (var _b = __values(Object.keys(data)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var key = _c.value;
                    if (Object.hasOwnProperty.call(data, key)) {
                        var element = data[key];
                        if (typeof element === 'object') {
                            delete data[key];
                            promises.push(this.Put("".concat(path, "/").concat(key), element, async).then(function (s) {
                                storedObj.data = storedObj.data.concat(s.data);
                                storedObj.error = storedObj.error.concat(s.error);
                                return s.data[0];
                            }));
                        }
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return new Promise(function (resolve, reject) {
            Promise.allSettled(promises)
                .then(function () {
                if (data && Object.keys(data).length === 0) {
                    resolve(storedObj);
                }
                else {
                    setTimeout(function () {
                        storedObj.error.push({
                            err: Error('TIMEOUT, Failed to put Data'),
                            ok: path,
                        });
                        resolve(storedObj);
                    }, 2000);
                    dataGun.put(data, function (ack) {
                        if (ack.err === undefined) {
                            storedObj.data.push(ack);
                        }
                        else {
                            storedObj.error.push({
                                err: Error(JSON.stringify(ack)),
                                ok: path,
                            });
                        }
                        resolve(storedObj);
                    }, opt);
                }
            })
                .catch(function (s) {
                storedObj.error.push({
                    err: Error(JSON.stringify(s)),
                    ok: path,
                });
                resolve(storedObj);
            });
        });
    };
    DataBase.prototype.purge = function (path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.Get(path)
                .then(function (data) {
                var e_3, _a;
                var newData = JSON.parse(JSON.stringify(data));
                if (typeof newData === 'object' && newData !== null) {
                    try {
                        for (var _b = __values(Object.keys(newData)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var key = _c.value;
                            if (key != '_' && key != '>' && key != '#' && key != ':')
                                newData[key] = null;
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
                _this.Put(path, newData)
                    .then(function () {
                    resolve('OK');
                })
                    .catch(function (err) {
                    console.log(err);
                    reject(JSON.stringify(err));
                });
            })
                .catch(reject);
        });
    };
    /**
     * Delete form user node
     */
    DataBase.prototype.userDel = function (path, putNull) {
        var _this = this;
        if (putNull === void 0) { putNull = true; }
        return new Promise(function (resolve, reject) {
            var pub = _this.getUserPub();
            if (!pub)
                return reject(new Error('User not logged in'));
            path = "~".concat(pub, "/").concat(path);
            _this.Del(path, putNull)
                .then(function (res) {
                resolve(res);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Delete node Path. It's not really deleted. It's just detached (tombstone). Data without parent.
     */
    DataBase.prototype.Del = function (path, putNull, cert) {
        var _this = this;
        if (putNull === void 0) { putNull = true; }
        if (cert === void 0) { cert = ''; }
        return new Promise(function (resolve, reject) {
            try {
                var randomNode = void 0;
                var paths = path.split('/');
                var dataGun_1 = _this.gun;
                if (putNull) {
                    randomNode = null;
                }
                else {
                    if (paths[0].indexOf('~') >= 0) {
                        randomNode = _this.gun
                            .user()
                            .get('newNode')
                            .set({ t: '_' });
                    }
                    else {
                        randomNode = _this.gun.get('newNode').set({ t: '_' });
                    }
                }
                paths.forEach(function (p) {
                    dataGun_1 = dataGun_1.get(p);
                });
                if (cert) {
                    dataGun_1.put(randomNode, function (s) {
                        if (s.err === undefined) {
                            resolve({
                                data: [{ ok: 'ok', err: undefined }],
                                error: [],
                            });
                        }
                        else {
                            reject({
                                data: [{ ok: '', err: s.err }],
                                error: [],
                            });
                        }
                    }, { opt: { cert: cert } });
                }
                else {
                    dataGun_1.put(randomNode, function (s) {
                        if (s.err === undefined) {
                            resolve({
                                data: [{ ok: 'ok', err: undefined }],
                                error: [],
                            });
                        }
                        else {
                            reject({
                                data: [{ ok: '', err: s.err }],
                                error: [],
                            });
                        }
                    });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    };
    /**
     * Load Multi Nested Data
     */
    DataBase.prototype.Load = function (path, async, repeat, prefix) {
        var _this = this;
        if (async === void 0) { async = false; }
        if (repeat === void 0) { repeat = 1; }
        if (prefix === void 0) { prefix = this.prefix; }
        return new Promise(function (resolve, reject) {
            var promises = [];
            var obj = { data: {}, err: [] };
            _this.Get(path, repeat, prefix)
                .then(function (s) {
                var e_4, _a;
                if (typeof s === 'object' && s !== null) {
                    var _loop_1 = function (key) {
                        if (key != '_' && key != '#' && key != '>') {
                            if (typeof s === 'object') {
                                element = s[key];
                            }
                            else {
                                element = s;
                            }
                            if (typeof element === 'object') {
                                promises.push(_this.Load("".concat(path, "/").concat(key), async)
                                    .then(function (s2) {
                                    obj.data[key] = s2;
                                })
                                    .catch(function (error) {
                                    obj.err.push(error);
                                }));
                            }
                            else {
                                obj.data[key] = element;
                            }
                        }
                    };
                    var element;
                    try {
                        for (var _b = __values(Object.keys(s)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var key = _c.value;
                            _loop_1(key);
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
                Promise.allSettled(promises)
                    .then(function () {
                    resolve(obj);
                })
                    .catch(function (s2) {
                    obj.err.push(s2);
                    resolve(obj);
                });
            })
                .catch(function (s2) {
                obj.err.push(s2);
                resolve(obj);
            });
        });
    };
    /**
     * Generate Public Certificate for Logged in User
     */
    DataBase.prototype.generatePublicCert = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a, _b;
            var pub = _this.getUserPub();
            var seaPair = (_b = (_a = _this.gun.user()) === null || _a === void 0 ? void 0 : _a._) === null || _b === void 0 ? void 0 : _b.sea;
            if (pub && seaPair) {
                _this.sea
                    .certify('*', [{ '*': 'chat-with', '+': '*' }], seaPair, null, {})
                    .then(function (cert) {
                    return _this.userPut('chat-cert', cert);
                })
                    .then(function (ack) { return resolve(ack); })
                    .catch(reject);
            }
            else {
                reject('User belum Login');
            }
        });
    };
    /**
     * Tears down the DataBase instance and performs cleanup of all resources/listeners.
     * No further actions should be performed on this instance after destruction.
     */
    DataBase.prototype.destroy = function () {
        if (this._isDestroyed)
            return;
        console.log('[DB] Destroying DataBase instance...');
        this._isDestroyed = true;
        this.onAuthCallbacks.length = 0;
        this.eventEmitter.removeAllListeners();
        if (this.user) {
            try {
                this.user.leave();
            }
            catch (error) {
                // Ignore
            }
            this.user = null;
        }
        console.log('[DB] DataBase instance destroyed');
    };
    /**
     * Aggressively clean up authentication state and session. Typically used for error recovery.
     */
    DataBase.prototype.aggressiveAuthCleanup = function () {
        console.log('🧹 Performing aggressive auth cleanup...');
        this.resetAuthState();
        this.logout();
        console.log('✓ Aggressive auth cleanup completed');
    };
    /**
     * Register an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    DataBase.prototype.on = function (event, listener) {
        this.eventEmitter.on(event, listener);
    };
    /**
     * Remove an event handler.
     * @param event Event name.
     * @param listener Listener function.
     */
    DataBase.prototype.off = function (event, listener) {
        this.eventEmitter.off(event, listener);
    };
    /**
     * Register an event handler for a single event occurrence.
     * @param event Event name.
     * @param listener Listener function.
     */
    DataBase.prototype.once = function (event, listener) {
        this.eventEmitter.once(event, listener);
    };
    /**
     * Emit a custom event.
     * @param event Event name.
     * @param data Optional associated data.
     * @returns `true` if listeners were notified; otherwise `false`.
     */
    DataBase.prototype.emit = function (event, data) {
        return this.eventEmitter.emit(event, data);
    };
    return DataBase;
}());
export { DataBase, crypto, GunErrors };
export { default as derive } from './derive.js';
