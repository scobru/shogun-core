"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.logError = logError;
exports.logWarning = logWarning;
exports.logDebug = logDebug;
/**
 * Utility function for logging
 * @param message - Message to log
 * @param args - Additional arguments
 */
function log(message, ...args) {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
        console.log(`[ShogunSDK] ${message}`, ...args);
    }
}
/**
 * Utility function for error logging
 * @param message - Error message to log
 * @param args - Additional arguments, including any Error objects
 */
function logError(message, ...args) {
    // Always log errors regardless of environment
    console.error(`[ShogunSDK] ERROR: ${message}`, ...args);
}
/**
 * Utility function for warning logging
 * @param message - Warning message to log
 * @param args - Additional arguments
 */
function logWarning(message, ...args) {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
        console.warn(`[ShogunSDK] WARNING: ${message}`, ...args);
    }
}
/**
 * Utility function for debug logging
 * @param message - Debug message to log
 * @param args - Additional arguments
 */
function logDebug(message, ...args) {
    if (process.env.DEBUG === "true") {
        console.debug(`[ShogunSDK] DEBUG: ${message}`, ...args);
    }
}
