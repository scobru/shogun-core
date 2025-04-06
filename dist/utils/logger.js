// Default configuration
let logConfig = {
    enabled: process.env.NODE_ENV === "development" || process.env.DEBUG === "true",
    level: "info",
    prefix: "[ShogunSDK]"
};
/**
 * Configure logging behavior
 * @param config - Logging configuration
 */
export function configureLogging(config) {
    logConfig = {
        ...logConfig,
        ...config
    };
}
/**
 * Utility function for logging
 * @param message - Message to log
 * @param args - Additional arguments
 */
export function log(message, ...args) {
    if (logConfig.enabled && (logConfig.level === "info" || logConfig.level === "debug")) {
        console.log(`${logConfig.prefix} ${message}`, ...args);
    }
}
/**
 * Utility function for error logging
 * @param message - Error message to log
 * @param args - Additional arguments, including any Error objects
 */
export function logError(message, ...args) {
    // Always log errors unless logging is explicitly disabled
    if (logConfig.enabled) {
        console.error(`${logConfig.prefix} ERROR: ${message}`, ...args);
    }
}
/**
 * Utility function for warning logging
 * @param message - Warning message to log
 * @param args - Additional arguments
 */
export function logWarn(message, ...args) {
    if (logConfig.enabled && (logConfig.level === "warning" || logConfig.level === "info" || logConfig.level === "debug")) {
        console.warn(`${logConfig.prefix} WARNING: ${message}`, ...args);
    }
}
/**
 * Utility function for debug logging
 * @param message - Debug message to log
 * @param args - Additional arguments
 */
export function logDebug(message, ...args) {
    if (logConfig.enabled && logConfig.level === "debug") {
        console.debug(`${logConfig.prefix} DEBUG: ${message}`, ...args);
    }
}
