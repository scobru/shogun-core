import { LoggingConfig } from "../types/shogun";
import { LogLevel } from "../types/common";

// Default configuration
let logConfig: LoggingConfig = {
  enabled:
    process.env.NODE_ENV === "development" || process.env.DEBUG === "true",
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
export function enableDebug(): void {
  debugMode = true;
  log("Debug mode enabled");
}

/**
 * Disables debug mode for logging
 */
export function disableDebug(): void {
  debugMode = false;
}

/**
 * Configure logging behavior
 * @param config - Logging configuration
 */
export function configureLogging(config: LoggingConfig): void {
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
export function log(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage, ...args);
}

/**
 * Logs an error message to the console
 * @param message - The error message
 * @param args - Additional arguments, including any Error objects
 */
export function logError(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, ...args);
}

/**
 * Logs a warning message to the console
 * @param message - The warning message
 * @param args - Additional arguments
 */
export function logWarn(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] WARNING: ${message}`, ...args);
}

/**
 * Logs a debug message to the console if debug mode is enabled
 * @param message - The debug message
 * @param args - Additional arguments
 */
export function logDebug(message: string, ...args: unknown[]): void {
  if (!debugMode) return;

  const timestamp = new Date().toISOString();
  console.debug(`[${timestamp}] DEBUG: ${message}`, ...args);
}

/**
 * Generic logging function that accepts a log level
 * @param level - The log level
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function logWithLevel(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): void {
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
