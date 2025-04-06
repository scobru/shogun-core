import { LoggingConfig } from "../types/shogun";
import { LogLevel } from "../types/common";
/**
 * Enables debug mode for logging
 */
export declare function enableDebug(): void;
/**
 * Disables debug mode for logging
 */
export declare function disableDebug(): void;
/**
 * Configure logging behavior
 * @param config - Logging configuration
 */
export declare function configureLogging(config: LoggingConfig): void;
/**
 * Logs a message to the console with timestamp and optional data
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export declare function log(message: string, ...args: unknown[]): void;
/**
 * Logs an error message to the console
 * @param message - The error message
 * @param args - Additional arguments, including any Error objects
 */
export declare function logError(message: string, ...args: unknown[]): void;
/**
 * Logs a warning message to the console
 * @param message - The warning message
 * @param args - Additional arguments
 */
export declare function logWarn(message: string, ...args: unknown[]): void;
/**
 * Logs a debug message to the console if debug mode is enabled
 * @param message - The debug message
 * @param args - Additional arguments
 */
export declare function logDebug(message: string, ...args: unknown[]): void;
/**
 * Generic logging function that accepts a log level
 * @param level - The log level
 * @param message - The message to log
 * @param args - Additional arguments
 */
export declare function logWithLevel(level: LogLevel, message: string, ...args: unknown[]): void;
