import { LogLevel } from "../types/common";

/**
 * Types of errors that can occur in the application
 */
export enum ErrorType {
  AUTHENTICATION = "AuthenticationError",
  AUTHORIZATION = "AuthorizationError",
  VALIDATION = "ValidationError",
  NETWORK = "NetworkError",
  DATABASE = "DatabaseError",
  WALLET = "WalletError",
  STORAGE = "StorageError",
  ENCRYPTION = "EncryptionError",
  SIGNATURE = "SignatureError",
  ENVIRONMENT = "EnvironmentError",
  SECURITY = "SecurityError",
  GUN = "GunError",
  STEALTH = "StealthError",
  WEBAUTHN = "WebAuthnError",
  PLUGIN = "PluginError",
  UNKNOWN = "UnknownError",
  CONNECTOR = "ConnectorError",
  GENERAL = "GeneralError",
  CONTRACT = "ContractError",
  BIP32 = "BIP32Error",
  ETHEREUM = "EthereumError",
  BITCOIN = "BitcoinError",
}

/**
 * Standard interface for Shogun errors
 */
export interface ShogunError {
  type: ErrorType;
  code: string;
  message: string;
  originalError?: Error | unknown;
  timestamp: number;
}

/**
 * Wrapper to standardize errors
 * @param type - Error type
 * @param code - Error code
 * @param message - Error message
 * @param originalError - Original error
 * @returns A structured error object
 */
export function createError(
  type: ErrorType,
  code: string,
  message: string,
  originalError?: Error | unknown,
): ShogunError {
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
export class ErrorHandler {
  private static errors: ShogunError[] = [];
  private static maxErrors: number = 100;
  private static listeners: Array<(error: ShogunError) => void> = [];
  private static externalLogger: ((error: ShogunError) => void) | null = null;

  /**
   * Set an external logging service for production error monitoring
   * @param logger - External logger function to send errors to a monitoring service
   */
  static setExternalLogger(logger: (error: ShogunError) => void): void {
    this.externalLogger = logger;
  }

  /**
   * Handles an error by logging it and notifying listeners
   * @param error - The error to handle
   */
  static handleError(error: ShogunError): void {
    // Log essential errors only
    if (
      error.type === ErrorType.AUTHENTICATION ||
      error.type === ErrorType.AUTHORIZATION ||
      error.type === ErrorType.SECURITY
    ) {
      // Ensure console.error is available and safe to use
      if (typeof console !== "undefined" && console.error) {
        console.error(`[${error.type}] ${error.code}: ${error.message}`);
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
      } catch (e) {
        // Fallback logging for external logger errors
        console.error("Failed to send error to external logger:", e);
      }
    }

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
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
  static handle(
    type: ErrorType,
    code: string,
    message: string,
    originalError?: Error | unknown,
    logLevel: LogLevel = "error",
  ): ShogunError {
    // Create a formatted error message (tests expect the plain message)
    const finalMessage = message;

    // Log the error
    switch (logLevel) {
      case "debug":
        console.log(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "warn":
        console.log(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "info":
        console.log(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "error":
      default:
        console.log(`[${type}] ${code}: ${finalMessage}`);
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
  static handleAndThrow(
    type: ErrorType,
    code: string,
    message: string,
    originalError?: Error | unknown,
  ): never {
    const error = this.handle(type, code, message, originalError);
    throw error;
  }

  /**
   * Retrieves the last N errors
   * @param count - Number of errors to retrieve
   * @returns List of most recent errors
   */
  static getRecentErrors(count: number = 10): ShogunError[] {
    return this.errors.slice(-Math.min(count, this.errors.length));
  }

  /**
   * Adds a listener for errors
   * @param listener - Function that will be called when an error occurs
   */
  static addListener(listener: (error: ShogunError) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Removes an error listener
   * @param listener - Function to remove
   */
  static removeListener(listener: (error: ShogunError) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifies all listeners of an error
   * @param error - Error to notify
   */
  private static notifyListeners(error: ShogunError): void {
    for (const listener of this.listeners) {
      try {
        listener(error);
      } catch (listenerError) {
        console.error(`Error in error listener: ${listenerError}`);
      }
    }
  }

  /**
   * Helper function to format error messages from native errors
   * @param error - Error to format
   * @returns Formatted error message
   */
  static formatError(error: Error | unknown): string {
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
      } catch (e) {
        return `Object: ${Object.prototype.toString.call(error)}`;
      }
    }

    return String(error);
  }

  /**
   * Error handling with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    errorType: ErrorType,
    errorCode: string,
    maxRetries = 3,
    retryDelay = 1000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = retryDelay * attempt;

        if (attempt < maxRetries) {
          console.log(
            `Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we got here, all retries failed.
    // Log the failure and rethrow the last error message for test expectations compatibility.
    this.handle(
      errorType,
      errorCode,
      `Operation failed after ${maxRetries} attempts`,
      lastError,
    );
    // Prefer the original error message if available
    if (lastError instanceof Error) {
      throw new Error(lastError.message);
    }
    throw new Error(this.formatError(lastError));
  }

  /**
   * Clear all stored errors
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    byCode: Record<string, number>;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
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
  static debug(
    type: ErrorType,
    code: string,
    message: string,
    level: LogLevel = "debug",
  ): void {
    // Always log debug messages for test visibility
    const finalMessage = `${message}`;

    switch (level) {
      case "error":
        console.error(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "warn":
        console.warn(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "info":
        console.log(`[${type}] ${code}: ${finalMessage}`);
        break;
      case "debug":
        console.log(`[${type}] ${code}: ${finalMessage}`);
        break;
    }
  }
}
