"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableDebug = enableDebug;
exports.disableDebug = disableDebug;
exports.configureLogging = configureLogging;
exports.log = log;
exports.logError = logError;
exports.logWarn = logWarn;
exports.logDebug = logDebug;
exports.logWithLevel = logWithLevel;
// Default configuration
let logConfig = {
    enabled: process.env.NODE_ENV === "development" || process.env.DEBUG === "true",
    level: "info",
    prefix: "[ShogunSDK]",
};
/**
 * Indicates whether debug mode is enabled
 */
let debugMode = false;
/**
 * Enables debug mode for logging
 */
function enableDebug() {
    debugMode = true;
    log("Debug mode enabled");
}
/**
 * Disables debug mode for logging
 */
function disableDebug() {
    debugMode = false;
}
/**
 * Configure logging behavior
 * @param config - Logging configuration
 */
function configureLogging(config) {
    logConfig = {
        ...logConfig,
        ...config,
    };
}
/**
 * Logs a message to the console with timestamp and optional data
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
function log(message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[SHOGUN CORE] [${timestamp}] ${message}`;
    console.log(formattedMessage, ...args);
}
/**
 * Logs an error message to the console
 * @param message - The error message
 * @param args - Additional arguments, including any Error objects
 */
function logError(message, ...args) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, ...args);
}
/**
 * Logs a warning message to the console
 * @param message - The warning message
 * @param args - Additional arguments
 */
function logWarn(message, ...args) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARNING: ${message}`, ...args);
}
/**
 * Logs a debug message to the console if debug mode is enabled
 * @param message - The debug message
 * @param args - Additional arguments
 */
function logDebug(message, ...args) {
    if (!debugMode)
        return;
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, ...args);
}
/**
 * Generic logging function that accepts a log level
 * @param level - The log level
 * @param message - The message to log
 * @param args - Additional arguments
 */
function logWithLevel(level, message, ...args) {
    switch (level) {
        case "error":
            logError(message, ...args);
            break;
        case "warn":
            logWarn(message, ...args);
            break;
        case "debug":
            logDebug(message, ...args);
            break;
        case "info":
        default:
            log(message, ...args);
            break;
    }
}
