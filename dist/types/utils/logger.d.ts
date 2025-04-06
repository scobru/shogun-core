import { LoggingConfig } from "../types/shogun";
/**
 * Configure logging behavior
 * @param config - Logging configuration
 */
export declare function configureLogging(config: LoggingConfig): void;
/**
 * Utility function for logging
 * @param message - Message to log
 * @param args - Additional arguments
 */
export declare function log(message: string, ...args: any[]): void;
/**
 * Utility function for error logging
 * @param message - Error message to log
 * @param args - Additional arguments, including any Error objects
 */
export declare function logError(message: string, ...args: any[]): void;
/**
 * Utility function for warning logging
 * @param message - Warning message to log
 * @param args - Additional arguments
 */
export declare function logWarn(message: string, ...args: any[]): void;
/**
 * Utility function for debug logging
 * @param message - Debug message to log
 * @param args - Additional arguments
 */
export declare function logDebug(message: string, ...args: any[]): void;
