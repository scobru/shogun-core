"use strict";
/**
 * Simplified API layer focused on valuable helper methods.
 * Provides quick-start initialization and high-level convenience methods.
 *
 * For basic operations (get, put, set, remove, auth), use DataBase directly.
 * This class provides:
 * - Quick initialization helpers (QuickStart, AutoQuickStart)
 * - Array/Object conversion utilities for GunDB
 * - High-level user data helpers (profile, settings, collections)
 */
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
exports.AutoQuickStart = exports.QuickStart = exports.SimpleGunAPI = void 0;
exports.createSimpleAPI = createSimpleAPI;
exports.quickStart = quickStart;
exports.autoQuickStart = autoQuickStart;
var db_1 = require("./db");
/**
 * Simple API wrapper that provides high-level helper methods.
 * For basic operations, use the DataBase instance directly via the `database` property.
 */
var SimpleGunAPI = /** @class */ (function () {
    /**
     * Create a new SimpleGunAPI instance.
     * @param db The DataBase instance to use.
     */
    function SimpleGunAPI(db) {
        this.db = db;
    }
    Object.defineProperty(SimpleGunAPI.prototype, "database", {
        /**
         * Get direct access to the DataBase instance for full control.
         * Use this for basic operations like get, put, set, remove, login, etc.
         */
        get: function () {
            return this.db;
        },
        enumerable: false,
        configurable: true
    });
    // =========================
    // Array utilities for GunDB
    // =========================
    /**
     * Convert an array to an indexed object for GunDB storage.
     * GunDB doesn't store arrays natively, so this converts them to objects indexed by ID.
     * Example: [{id: '1', ...}, {id: '2', ...}] => { "1": {...}, "2": {...} }
     * @param arr The array to convert (each item must have an 'id' property).
     * @returns The indexed object suitable for GunDB storage.
     */
    SimpleGunAPI.prototype.arrayToIndexedObject = function (arr) {
        // Filter out null/undefined items and ensure they have valid id
        var validItems = (arr || []).filter(function (item) {
            return item &&
                typeof item === "object" &&
                item.id !== null &&
                item.id !== undefined;
        });
        return validItems.reduce(function (acc, item) {
            var _a;
            return __assign(__assign({}, acc), (_a = {}, _a[item.id] = item, _a));
        }, {});
    };
    /**
     * Convert an indexed object back to an array.
     * Reverses the arrayToIndexedObject conversion.
     * Example: { "1": {...}, "2": {...} } => [{id: '1', ...}, {id: '2', ...}]
     * @param indexedObj The indexed object to convert.
     * @returns The array of items.
     */
    SimpleGunAPI.prototype.indexedObjectToArray = function (indexedObj) {
        if (!indexedObj || typeof indexedObj !== "object") {
            return [];
        }
        // Remove GunDB metadata and convert to array
        var cleanObj = __assign({}, indexedObj);
        delete cleanObj._; // Remove GunDB metadata
        // Filter out null/undefined values and ensure they are valid objects
        return Object.values(cleanObj).filter(function (item) { return item && typeof item === "object"; });
    };
    /**
     * @deprecated This method is unreliable with GunDB. Use direct GunDB operations instead.
     * Store an array at a global path by converting it to an indexed object.
     * @param path The global path to store the array at
     * @param arr The array to store (each item must have an 'id' property)
     * @returns True if successful, false otherwise
     */
    SimpleGunAPI.prototype.putArray = function (path, arr) {
        return __awaiter(this, void 0, void 0, function () {
            var indexed, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn("DEPRECATED: putArray() is unreliable with GunDB. Use direct GunDB operations instead.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        indexed = this.arrayToIndexedObject(arr);
                        return [4 /*yield*/, this.db.put(path, indexed)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.warn("Failed to put array:", error_1);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @deprecated This method is unreliable with GunDB. Use direct GunDB operations instead.
     * Retrieve an array from a global path by converting from indexed object.
     * @param path The global path to retrieve the array from
     * @returns The array of items, or empty array on error
     */
    SimpleGunAPI.prototype.getArray = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var indexedObj, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn("DEPRECATED: getArray() is unreliable with GunDB. Use direct GunDB operations instead.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.getData(path)];
                    case 2:
                        indexedObj = _a.sent();
                        return [2 /*return*/, this.indexedObjectToArray(indexedObj)];
                    case 3:
                        error_2 = _a.sent();
                        console.warn("Failed to get array:", error_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // =========================
    // High-level user data helpers
    // =========================
    /**
     * Get all user data (returns user's entire data tree).
     * Requires user to be logged in.
     * @returns The complete user data tree, or null if not logged in or on error.
     */
    SimpleGunAPI.prototype.getAllUserData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, pubkey, node_1, userData, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, null];
                        }
                        user = this.db.getUser();
                        pubkey = (_a = user.is) === null || _a === void 0 ? void 0 : _a.pub;
                        node_1 = this.db.get("".concat(pubkey));
                        if (!node_1) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                node_1.once(function (data) {
                                    resolve(data);
                                });
                            })];
                    case 1:
                        userData = _b.sent();
                        return [2 /*return*/, userData];
                    case 2: return [2 /*return*/, null];
                    case 3:
                        error_3 = _b.sent();
                        console.warn("Failed to get all user data:", error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update user profile with common fields.
     * Provides a standardized location for user profile data.
     * @param profileData Profile data to save (name, email, bio, avatar, etc.)
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.updateProfile = function (profileData) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("profile").put(profileData).then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        console.warn("Failed to update profile:", error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user profile data.
     * @returns The user profile data, or null if not found or not logged in.
     */
    SimpleGunAPI.prototype.getProfile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, profileData, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, null];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("profile").once().then()];
                    case 1:
                        profileData = _a.sent();
                        return [2 /*return*/, profileData];
                    case 2:
                        error_5 = _a.sent();
                        console.warn("Failed to get profile:", error_5);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save user settings.
     * Provides a standardized location for application settings.
     * @param settings Settings object to save.
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.saveSettings = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("settings").put(settings).then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_6 = _a.sent();
                        console.warn("Failed to save settings:", error_6);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user settings.
     * @returns The user settings, or null if not found or not logged in.
     */
    SimpleGunAPI.prototype.getSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, settingsData, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, null];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("settings").once().then()];
                    case 1:
                        settingsData = _a.sent();
                        return [2 /*return*/, settingsData];
                    case 2:
                        error_7 = _a.sent();
                        console.warn("Failed to get settings:", error_7);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save user preferences.
     * Provides a standardized location for user preferences (distinct from settings).
     * @param preferences Preferences object to save.
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.savePreferences = function (preferences) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("preferences").put(preferences).then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_8 = _a.sent();
                        console.warn("Failed to save preferences:", error_8);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user preferences.
     * @returns The user preferences, or null if not found or not logged in.
     */
    SimpleGunAPI.prototype.getPreferences = function () {
        return __awaiter(this, void 0, void 0, function () {
            var user, preferencesData, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, null];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("preferences").once().then()];
                    case 1:
                        preferencesData = _a.sent();
                        return [2 /*return*/, preferencesData];
                    case 2:
                        error_9 = _a.sent();
                        console.warn("Failed to get preferences:", error_9);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a user collection with initial items.
     * Provides a standardized location for user collections.
     * @param collectionName The name of the collection.
     * @param items The initial items for the collection.
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.createCollection = function (collectionName, items) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user.get("collections/".concat(collectionName)).put(items).then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_10 = _a.sent();
                        console.warn("Failed to create collection ".concat(collectionName, ":"), error_10);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add an item to a user collection.
     * @param collectionName The name of the collection.
     * @param itemId The ID of the item to add.
     * @param item The item data.
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.addToCollection = function (collectionName, itemId, item) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user
                                .get("collections/".concat(collectionName, "/").concat(itemId))
                                .put(item)
                                .then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_11 = _a.sent();
                        console.warn("Failed to add item to collection ".concat(collectionName, ":"), error_11);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a user collection.
     * @param collectionName The name of the collection.
     * @returns The collection data, or null if not found or not logged in.
     */
    SimpleGunAPI.prototype.getCollection = function (collectionName) {
        return __awaiter(this, void 0, void 0, function () {
            var user, collectionData, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, null];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user
                                .get("collections/".concat(collectionName))
                                .once()
                                .then()];
                    case 1:
                        collectionData = _a.sent();
                        return [2 /*return*/, collectionData];
                    case 2:
                        error_12 = _a.sent();
                        console.warn("Failed to get collection ".concat(collectionName, ":"), error_12);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove an item from a user collection.
     * @param collectionName The name of the collection.
     * @param itemId The ID of the item to remove.
     * @returns True if successful, false otherwise.
     */
    SimpleGunAPI.prototype.removeFromCollection = function (collectionName, itemId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.db.isLoggedIn()) {
                            console.warn("User not logged in");
                            return [2 /*return*/, false];
                        }
                        user = this.db.getUser();
                        return [4 /*yield*/, user
                                .get("collections/".concat(collectionName, "/").concat(itemId))
                                .put(null)
                                .then()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_13 = _a.sent();
                        console.warn("Failed to remove item from collection ".concat(collectionName, ":"), error_13);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return SimpleGunAPI;
}());
exports.SimpleGunAPI = SimpleGunAPI;
/**
 * Factory function to create a simple API instance
 */
function createSimpleAPI(db) {
    return new SimpleGunAPI(db);
}
/**
 * Quick start helper - creates a simple API with minimal configuration
 */
var QuickStart = /** @class */ (function () {
    function QuickStart(gunInstance, appScope) {
        if (appScope === void 0) { appScope = "shogun"; }
        this.db = new db_1.DataBase(gunInstance, appScope);
        this.simpleAPI = new SimpleGunAPI(this.db);
    }
    // Initialize the database
    QuickStart.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.initialize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(QuickStart.prototype, "api", {
        // Get the simple API
        get: function () {
            return this.simpleAPI;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(QuickStart.prototype, "database", {
        // Get the full database instance for advanced usage
        get: function () {
            return this.db;
        },
        enumerable: false,
        configurable: true
    });
    return QuickStart;
}());
exports.QuickStart = QuickStart;
/**
 * Auto Quick Start helper - creates a simple API with an existing Gun instance
 * Requires a Gun instance to be passed in
 */
var AutoQuickStart = /** @class */ (function () {
    function AutoQuickStart(gunInstance, appScope) {
        if (appScope === void 0) { appScope = "shogun"; }
        this.gunInstance = gunInstance;
        this.db = new db_1.DataBase(this.gunInstance, appScope);
        this.simpleAPI = new SimpleGunAPI(this.db);
    }
    // Initialize the database
    AutoQuickStart.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.initialize()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(AutoQuickStart.prototype, "api", {
        // Get the simple API
        get: function () {
            return this.simpleAPI;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AutoQuickStart.prototype, "database", {
        // Get the full database instance for advanced usage
        get: function () {
            return this.db;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AutoQuickStart.prototype, "gun", {
        // Get the Gun instance for advanced usage
        get: function () {
            return this.gunInstance;
        },
        enumerable: false,
        configurable: true
    });
    return AutoQuickStart;
}());
exports.AutoQuickStart = AutoQuickStart;
/**
 * Global helper for quick setup
 */
function quickStart(gunInstance, appScope) {
    return new QuickStart(gunInstance, appScope);
}
/**
 * Global helper for auto quick setup - requires existing Gun instance
 */
function autoQuickStart(gunInstance, appScope) {
    if (appScope === void 0) { appScope = "shogun"; }
    return new AutoQuickStart(gunInstance, appScope);
}
