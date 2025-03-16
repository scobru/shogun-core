/**
 * Utility function for logging
 * @param message - Message to log
 * @param args - Additional arguments
 */
export function log(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
    console.log(`[ShogunSDK] ${message}`, ...args);
  }
}

/**
 * Utility function for error logging
 * @param message - Error message to log
 * @param args - Additional arguments, including any Error objects
 */
export function logError(message: string, ...args: any[]) {
  // Always log errors regardless of environment
  console.error(`[ShogunSDK] ERROR: ${message}`, ...args);
}

/**
 * Utility function for warning logging
 * @param message - Warning message to log
 * @param args - Additional arguments
 */
export function logWarning(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
    console.warn(`[ShogunSDK] WARNING: ${message}`, ...args);
  }
}

/**
 * Utility function for debug logging
 * @param message - Debug message to log
 * @param args - Additional arguments
 */
export function logDebug(message: string, ...args: any[]) {
  if (process.env.DEBUG === "true") {
    console.debug(`[ShogunSDK] DEBUG: ${message}`, ...args);
  }
}
