"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ErrorType = void 0;
exports.createError = createError;
exports.handleError = handleError;
const logger_1 = require("./logger");
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
    ErrorType["CONNECTOR"] = "CONNECTOR";
    ErrorType["GENERAL"] = "GENERAL";
    ErrorType["CONTRACT"] = "CONTRACT";
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
        type,
        code,
        message,
        originalError,
        timestamp: Date.now(),
    };
}
/**
 * Utility function to handle errors consistently
 * @param error - The error to handle
 * @param options - Configuration options
 * @returns Operation result or callback result
 */
function handleError(error, options = {}) {
    // Default settings
    const { message = error instanceof Error ? error.message : String(error), throwError = false, logError = true, callback, } = options;
    // Log the error if requested
    if (logError) {
        console.error(`[ERROR] ${message}`, error);
    }
    // If a callback was provided, execute it and return its result
    if (typeof callback === "function") {
        return callback(error);
    }
    // If requested to throw the error, throw it
    if (throwError) {
        if (error instanceof Error) {
            throw error;
        }
        else {
            throw new Error(message);
        }
    }
    // Otherwise return a standard result object
    return {
        success: false,
        message,
        error,
    };
}
/**
 * Centralized error handler
 */
class ErrorHandler {
    static errors = [];
    static maxErrors = 100;
    static listeners = [];
    /**
     * Handles an error by logging it and notifying listeners
     * @param error - The error to handle
     */
    static handleError(error) {
        // Log the error
        (0, logger_1.logError)(`[${error.type}] ${error.code}: ${error.message}`);
        // Store the error in memory
        this.errors.push(error);
        // Keep only the last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
        // Notify listeners
        this.notifyListeners(error);
    }
    /**
     * Handles a raw error by converting it to ShogunError
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     */
    static handle(type, code, message, originalError, logLevel = "error") {
        // Create a formatted error message
        const finalMessage = originalError
            ? `${message} - ${this.formatError(originalError)}`
            : message;
        // Log the error
        switch (logLevel) {
            case "debug":
                (0, logger_1.log)(`[${type}.${code}] (DEBUG) ${finalMessage}`);
                break;
            case "warn":
                (0, logger_1.log)(`[${type}.${code}] (WARN) ${finalMessage}`);
                break;
            case "info":
                (0, logger_1.log)(`[${type}.${code}] (INFO) ${finalMessage}`);
                break;
            case "error":
            default:
                (0, logger_1.log)(`[${type}.${code}] (ERROR) ${finalMessage}`);
                if (originalError && originalError instanceof Error) {
                    (0, logger_1.log)(originalError.stack || "No stack trace available");
                }
                break;
        }
        const error = createError(type, code, finalMessage, originalError);
        this.handleError(error);
        return error;
    }
    /**
     * Retrieves the last N errors
     * @param count - Number of errors to retrieve
     * @returns List of most recent errors
     */
    static getRecentErrors(count = 10) {
        return this.errors.slice(-Math.min(count, this.errors.length));
    }
    /**
     * Adds a listener for errors
     * @param listener - Function that will be called when an error occurs
     */
    static addListener(listener) {
        this.listeners.push(listener);
    }
    /**
     * Removes an error listener
     * @param listener - Function to remove
     */
    static removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
     * Notifies all listeners of an error
     * @param error - Error to notify
     */
    static notifyListeners(error) {
        for (const listener of this.listeners) {
            try {
                listener(error);
            }
            catch (listenerError) {
                (0, logger_1.logError)(`Error in error listener: ${listenerError}`);
            }
        }
    }
    /**
     * Helper function to format error messages from native errors
     * @param error - Error to format
     * @returns Formatted error message
     */
    static formatError(error) {
        if (!error) {
            return "Unknown error";
        }
        if (error instanceof Error) {
            return `${error.name}: ${error.message}`;
        }
        if (typeof error === "string") {
            return error;
        }
        if (typeof error === "object") {
            try {
                return JSON.stringify(error);
            }
            catch (e) {
                return `Object: ${Object.prototype.toString.call(error)}`;
            }
        }
        return String(error);
    }
    /**
     * Error handling with retry logic
     */
    static async withRetry(fn, errorType, errorCode, maxRetries = 3, retryDelay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                const delay = retryDelay * attempt;
                if (attempt < maxRetries) {
                    (0, logger_1.log)(`Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        // If we got here, all retries failed
        throw this.handle(errorType, errorCode, `Operation failed after ${maxRetries} attempts`, lastError);
    }
}
exports.ErrorHandler = ErrorHandler;
