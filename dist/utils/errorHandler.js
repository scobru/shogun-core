"use strict";
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
        type,
        code,
        message,
        originalError,
        timestamp: Date.now(),
    };
}
/**
 * Centralized error handler
 */
class ErrorHandler {
    static errors = [];
    static maxErrors = 100;
    static listeners = [];
    static externalLogger = null;
    /**
     * Set an external logging service for production error monitoring
     * @param logger - External logger function to send errors to a monitoring service
     */
    static setExternalLogger(logger) {
        this.externalLogger = logger;
    }
    /**
     * Handles an error by logging it and notifying listeners
     * @param error - The error to handle
     */
    static handleError(error) {
        // Log essential errors only
        if (error.type === ErrorType.AUTHENTICATION ||
            error.type === ErrorType.AUTHORIZATION ||
            error.type === ErrorType.SECURITY) {
            console.error(`[${error.type}] ${error.code}: ${error.message}`);
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
        this.listeners.forEach((listener) => {
            try {
                listener(error);
            }
            catch (e) {
                // Silent error to prevent infinite loops
            }
        });
    }
    /**
     * Handles a raw error by converting it to ShogunError
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     * @param logLevel - Log level for the error
     */
    static handle(type, code, message, originalError, logLevel = "error") {
        // Create a formatted error message
        const finalMessage = originalError
            ? `${message} - ${this.formatError(originalError)}`
            : message;
        // Log the error
        switch (logLevel) {
            case "debug":
                console.log(`[${type}.${code}] (DEBUG) ${finalMessage}`);
                break;
            case "warn":
                console.log(`[${type}.${code}] (WARN) ${finalMessage}`);
                break;
            case "info":
                console.log(`[${type}.${code}] (INFO) ${finalMessage}`);
                break;
            case "error":
            default:
                console.log(`[${type}.${code}] (ERROR) ${finalMessage}`);
                if (originalError && originalError instanceof Error) {
                    console.log(originalError.stack || "No stack trace available");
                }
                break;
        }
        const error = createError(type, code, finalMessage, originalError);
        this.handleError(error);
        return error;
    }
    /**
     * Handles errors and throws them as standardized ShogunError objects
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     * @throws ShogunError
     */
    static handleAndThrow(type, code, message, originalError) {
        const error = this.handle(type, code, message, originalError);
        throw error;
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
                console.error(`Error in error listener: ${listenerError}`);
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
                    console.log(`Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        // If we got here, all retries failed
        throw this.handle(errorType, errorCode, `Operation failed after ${maxRetries} attempts`, lastError);
    }
    /**
     * Clear all stored errors
     */
    static clearErrors() {
        this.errors = [];
    }
    /**
     * Get error statistics
     */
    static getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            byCode: {},
        };
        for (const error of this.errors) {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
        }
        return stats;
    }
    /**
     * Debug helper - logs messages only in development
     */
    static debug(type, code, message, level = "debug") {
        // Only log debug messages in development environment
        if (process.env.NODE_ENV === "development") {
            const finalMessage = `${message}`;
            switch (level) {
                case "error":
                    console.error(`[${type}.${code}] ${finalMessage}`);
                    break;
                case "warn":
                    console.warn(`[${type}.${code}] ${finalMessage}`);
                    break;
                case "info":
                    console.log(`[${type}.${code}] ${finalMessage}`);
                    break;
                case "debug":
                    console.log(`[${type}.${code}] (DEBUG) ${finalMessage}`);
                    break;
            }
        }
    }
}
exports.ErrorHandler = ErrorHandler;
