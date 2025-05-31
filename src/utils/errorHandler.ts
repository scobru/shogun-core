import { log, logError } from "./logger";
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
  CONNECTOR = "CONNECTOR",
  GENERAL = "GENERAL",
  CONTRACT = "CONTRACT",
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
 * Configuration options for the error handler
 */
export interface ErrorOptions {
  message?: string;
  throwError?: boolean;
  logError?: boolean;
  callback?: ErrorCallback;
}

/**
 * Error callback function type
 */
export type ErrorCallback = (error: any) => any;

/**
 * Standardized result for error handling
 */
export interface ErrorResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Utility function to handle errors consistently
 * @param error - The error to handle
 * @param options - Configuration options
 * @returns Operation result or callback result
 */
export function handleError(
  error: any,
  options: ErrorOptions = {},
): ErrorResult | any {
  // Default settings
  const {
    message = error instanceof Error ? error.message : String(error),
    throwError = false,
    logError = true,
    callback,
  } = options;

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
    } else {
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
export class ErrorHandler {
  private static errors: ShogunError[] = [];
  private static maxErrors: number = 100;
  private static listeners: Array<(error: ShogunError) => void> = [];

  /**
   * Handles an error by logging it and notifying listeners
   * @param error - The error to handle
   */
  static handleError(error: ShogunError): void {
    // Log the error
    logError(`[${error.type}] ${error.code}: ${error.message}`);

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
  static handle(
    type: ErrorType,
    code: string,
    message: string,
    originalError?: Error | unknown,
    logLevel: LogLevel = "error",
  ): ShogunError {
    // Create a formatted error message
    const finalMessage = originalError
      ? `${message} - ${this.formatError(originalError)}`
      : message;

    // Log the error
    switch (logLevel) {
      case "debug":
        log(`[${type}.${code}] (DEBUG) ${finalMessage}`);
        break;
      case "warn":
        log(`[${type}.${code}] (WARN) ${finalMessage}`);
        break;
      case "info":
        log(`[${type}.${code}] (INFO) ${finalMessage}`);
        break;
      case "error":
      default:
        log(`[${type}.${code}] (ERROR) ${finalMessage}`);
        if (originalError && originalError instanceof Error) {
          log(originalError.stack || "No stack trace available");
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
        logError(`Error in error listener: ${listenerError}`);
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
          log(
            `Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we got here, all retries failed
    throw this.handle(
      errorType,
      errorCode,
      `Operation failed after ${maxRetries} attempts`,
      lastError,
    );
  }
}
