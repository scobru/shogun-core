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
exports.ShogunStorage = void 0;
/**
 * Storage implementation based on StorageMock
 * Provides a unified storage interface that works in both browser and non-browser environments
 * In browser environments, data is persisted to localStorage as a backup
 */
var ShogunStorage = /** @class */ (function () {
    /**
     * Initializes storage and loads any existing keypair from localStorage if available
     */
    function ShogunStorage(silent) {
        if (silent === void 0) { silent = false; }
        this.store = new Map();
        this.silent = silent;
        this.isTestMode = process.env.NODE_ENV === "test";
        this.useLocalStorage = false;
        // In test mode, don't use localStorage to avoid test pollution
        if (this.isTestMode) {
            this.useLocalStorage = false;
            return;
        }
        if (typeof localStorage !== "undefined") {
            try {
                // Probe localStorage without polluting expectations in tests
                var testKey = "_shogun_test";
                localStorage.setItem(testKey, testKey);
                localStorage.removeItem(testKey);
                this.useLocalStorage = true;
                if (!this.silent) {
                    console.log("ShogunStorage: localStorage enabled");
                }
                var storedPair = localStorage.getItem("shogun_keypair");
                if (storedPair) {
                    this.store.set("keypair", JSON.parse(storedPair));
                }
            }
            catch (error) {
                this.useLocalStorage = false;
                // Silence logs in tests; tests expect no console.error during constructor
                if (!this.silent) {
                    console.log("ShogunStorage: localStorage error:", error.message);
                }
            }
        }
    }
    /**
     * Gets the stored keypair asynchronously
     * @returns Promise resolving to the keypair or null if not found
     */
    ShogunStorage.prototype.getPair = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPairSync()];
            });
        });
    };
    /**
     * Gets the stored keypair synchronously
     * @returns The keypair or null if not found
     */
    ShogunStorage.prototype.getPairSync = function () {
        return this.store.get("keypair") || null;
    };
    /**
     * Stores a keypair both in memory and localStorage if available
     * @param pair - The keypair to store
     */
    ShogunStorage.prototype.setPair = function (pair) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.store.set("keypair", pair);
                // Also save to localStorage in browser environments
                if (this.useLocalStorage) {
                    try {
                        localStorage.setItem("shogun_keypair", JSON.stringify(pair));
                    }
                    catch (error) {
                        if (!this.isTestMode) {
                            console.error("Error saving data to localStorage:", error);
                        }
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Clears all stored data from both memory and localStorage
     */
    ShogunStorage.prototype.clearAll = function () {
        this.store.clear();
        // Also clear localStorage in browser environments
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem("shogun_keypair");
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error("Error removing data from localStorage:", error);
                }
            }
        }
    };
    /**
     * Gets an item from storage
     * @param key - The key to retrieve
     * @returns The stored value, or null if not found
     */
    ShogunStorage.prototype.getItem = function (key) {
        var value = this.store.get(key);
        if (value === undefined) {
            return null;
        }
        return value;
    };
    /**
     * Stores an item in both memory and localStorage if available
     * @param key - The key to store under
     * @param value - The value to store (must be JSON stringifiable)
     */
    ShogunStorage.prototype.setItem = function (key, value) {
        // Store the raw value as-is to preserve formatting
        this.store.set(key, value);
        if (this.useLocalStorage) {
            try {
                localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error("Error saving ".concat(key, " to localStorage:"), error);
                }
            }
        }
    };
    /**
     * Removes an item from both memory and localStorage if available
     * @param key - The key to remove
     */
    ShogunStorage.prototype.removeItem = function (key) {
        this.store.delete(key);
        if (this.useLocalStorage) {
            try {
                localStorage.removeItem(key);
            }
            catch (error) {
                if (!this.isTestMode) {
                    console.error("Error removing ".concat(key, " from localStorage:"), error);
                }
            }
        }
    };
    return ShogunStorage;
}());
exports.ShogunStorage = ShogunStorage;
