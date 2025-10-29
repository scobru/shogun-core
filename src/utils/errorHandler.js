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
exports.ErrorHandler = exports.ErrorType = void 0;
exports.createError = createError;
/**
 * Types of errors that can occur in the application
 */
var ErrorType;
(function (ErrorType) {
    ErrorType["AUTHENTICATION"] = "AuthenticationError";
    ErrorType["AUTHORIZATION"] = "AuthorizationError";
    ErrorType["VALIDATION"] = "ValidationError";
    ErrorType["NETWORK"] = "NetworkError";
    ErrorType["DATABASE"] = "DatabaseError";
    ErrorType["WALLET"] = "WalletError";
    ErrorType["STORAGE"] = "StorageError";
    ErrorType["ENCRYPTION"] = "EncryptionError";
    ErrorType["SIGNATURE"] = "SignatureError";
    ErrorType["ENVIRONMENT"] = "EnvironmentError";
    ErrorType["SECURITY"] = "SecurityError";
    ErrorType["GUN"] = "GunError";
    ErrorType["STEALTH"] = "StealthError";
    ErrorType["WEBAUTHN"] = "WebAuthnError";
    ErrorType["PLUGIN"] = "PluginError";
    ErrorType["UNKNOWN"] = "UnknownError";
    ErrorType["CONNECTOR"] = "ConnectorError";
    ErrorType["GENERAL"] = "GeneralError";
    ErrorType["CONTRACT"] = "ContractError";
    ErrorType["BIP32"] = "BIP32Error";
    ErrorType["ETHEREUM"] = "EthereumError";
    ErrorType["BITCOIN"] = "BitcoinError";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
/**
 * Wrapper to standardize errors
 * @param type - Error type
 * @param code - Error code
 * @param message - Error message
 * @param originalError - Original error
 * @returns A structured error object
 */
function createError(type, code, message, originalError) {
    return {
        type: type,
        code: code,
        message: message,
        originalError: originalError,
        timestamp: Date.now(),
    };
}
/**
 * Centralized error handler
 */
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
    }
    /**
     * Set an external logging service for production error monitoring
     * @param logger - External logger function to send errors to a monitoring service
     */
    ErrorHandler.setExternalLogger = function (logger) {
        this.externalLogger = logger;
    };
    /**
     * Handles an error by logging it and notifying listeners
     * @param error - The error to handle
     */
    ErrorHandler.handleError = function (error) {
        // Log essential errors only
        if (error.type === ErrorType.AUTHENTICATION ||
            error.type === ErrorType.AUTHORIZATION ||
            error.type === ErrorType.SECURITY) {
            // Ensure console.error is available and safe to use
            if (typeof console !== "undefined" && console.error) {
                console.error("[".concat(error.type, "] ").concat(error.code, ": ").concat(error.message));
            }
        }
        // Store the error in memory
        this.errors.push(error);
        // Keep only the last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
        // Send to external logger if set (for production monitoring)
        if (this.externalLogger) {
            try {
                this.externalLogger(error);
            }
            catch (e) {
                // Fallback logging for external logger errors
                console.error("Failed to send error to external logger:", e);
            }
        }
        // Notify all listeners
        this.listeners.forEach(function (listener) {
            try {
                listener(error);
            }
            catch (e) {
                // Silent error to prevent infinite loops
            }
        });
    };
    /**
     * Handles a raw error by converting it to ShogunError
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     * @param logLevel - Log level for the error
     */
    ErrorHandler.handle = function (type, code, message, originalError, logLevel) {
        if (logLevel === void 0) { logLevel = "error"; }
        // Create a formatted error message (tests expect the plain message)
        var finalMessage = message;
        // Log the error
        switch (logLevel) {
            case "debug":
                console.log("[".concat(type, "] ").concat(code, ": ").concat(finalMessage));
                break;
            case "warn":
                console.log("[".concat(type, "] ").concat(code, ": ").concat(finalMessage));
                break;
            case "info":
                console.log("[".concat(type, "] ").concat(code, ": ").concat(finalMessage));
                break;
            case "error":
            default:
                console.log("[".concat(type, "] ").concat(code, ": ").concat(finalMessage));
                break;
        }
        var error = createError(type, code, finalMessage, originalError);
        this.handleError(error);
        return error;
    };
    /**
     * Handles errors and throws them as standardized ShogunError objects
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     * @throws ShogunError
     */
    ErrorHandler.handleAndThrow = function (type, code, message, originalError) {
        var error = this.handle(type, code, message, originalError);
        throw error;
    };
    /**
     * Retrieves the last N errors
     * @param count - Number of errors to retrieve
     * @returns List of most recent errors
     */
    ErrorHandler.getRecentErrors = function (count) {
        if (count === void 0) { count = 10; }
        return this.errors.slice(-Math.min(count, this.errors.length));
    };
    /**
     * Adds a listener for errors
     * @param listener - Function that will be called when an error occurs
     */
    ErrorHandler.addListener = function (listener) {
        this.listeners.push(listener);
    };
    /**
     * Removes an error listener
     * @param listener - Function to remove
     */
    ErrorHandler.removeListener = function (listener) {
        var index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    };
    /**
     * Notifies all listeners of an error
     * @param error - Error to notify
     */
    ErrorHandler.notifyListeners = function (error) {
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            try {
                listener(error);
            }
            catch (listenerError) {
                console.error("Error in error listener: ".concat(listenerError));
            }
        }
    };
    /**
     * Helper function to format error messages from native errors
     * @param error - Error to format
     * @returns Formatted error message
     */
    ErrorHandler.formatError = function (error) {
        if (!error) {
            return "Unknown error";
        }
        if (error instanceof Error) {
            return "".concat(error.name, ": ").concat(error.message);
        }
        if (typeof error === "string") {
            return error;
        }
        if (typeof error === "object") {
            try {
                return JSON.stringify(error);
            }
            catch (e) {
                return "Object: ".concat(Object.prototype.toString.call(error));
            }
        }
        return String(error);
    };
    /**
     * Error handling with retry logic
     */
    ErrorHandler.withRetry = function (fn_1, errorType_1, errorCode_1) {
        return __awaiter(this, arguments, void 0, function (fn, errorType, errorCode, maxRetries, retryDelay) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (retryDelay === void 0) { retryDelay = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var _b, error_1, delay_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        _b = {};
                                        return [4 /*yield*/, fn()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_1 = _c.sent();
                                        lastError = error_1;
                                        delay_1 = retryDelay * attempt;
                                        if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                                        console.log("Retrying operation after ".concat(delay_1, "ms (attempt ").concat(attempt, "/").concat(maxRetries, ")"));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _c.sent();
                                        _c.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4:
                        // If we got here, all retries failed.
                        // Log the failure and rethrow the last error message for test expectations compatibility.
                        this.handle(errorType, errorCode, "Operation failed after ".concat(maxRetries, " attempts"), lastError);
                        // Prefer the original error message if available
                        if (lastError instanceof Error) {
                            throw new Error(lastError.message);
                        }
                        throw new Error(this.formatError(lastError));
                }
            });
        });
    };
    /**
     * Clear all stored errors
     */
    ErrorHandler.clearErrors = function () {
        this.errors = [];
    };
    ErrorHandler.errors = [];
    ErrorHandler.maxErrors = 100;
    ErrorHandler.listeners = [];
    ErrorHandler.externalLogger = null;
    return ErrorHandler;
}());
exports.ErrorHandler = ErrorHandler;
