import { LogLevel } from "../types/common";
/**
 * Types of errors that can occur in the application
 */
export declare enum ErrorType {
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
    BITCOIN = "BitcoinError"
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
export declare function createError(type: ErrorType, code: string, message: string, originalError?: Error | unknown): ShogunError;
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
export declare function handleError(error: any, options?: ErrorOptions): ErrorResult | any;
/**
 * Centralized error handler
 */
export declare class ErrorHandler {
    private static errors;
    private static maxErrors;
    private static listeners;
    /**
     * Handles an error by logging it and notifying listeners
     * @param error - The error to handle
     */
    static handleError(error: ShogunError): void;
    /**
     * Handles a raw error by converting it to ShogunError
     * @param type - Error type
     * @param code - Error code
     * @param message - Error message
     * @param originalError - Original error
     */
    static handle(type: ErrorType, code: string, message: string, originalError?: Error | unknown, logLevel?: LogLevel): ShogunError;
    /**
     * Retrieves the last N errors
     * @param count - Number of errors to retrieve
     * @returns List of most recent errors
     */
    static getRecentErrors(count?: number): ShogunError[];
    /**
     * Adds a listener for errors
     * @param listener - Function that will be called when an error occurs
     */
    static addListener(listener: (error: ShogunError) => void): void;
    /**
     * Removes an error listener
     * @param listener - Function to remove
     */
    static removeListener(listener: (error: ShogunError) => void): void;
    /**
     * Notifies all listeners of an error
     * @param error - Error to notify
     */
    private static notifyListeners;
    /**
     * Helper function to format error messages from native errors
     * @param error - Error to format
     * @returns Formatted error message
     */
    static formatError(error: Error | unknown): string;
    /**
     * Error handling with retry logic
     */
    static withRetry<T>(fn: () => Promise<T>, errorType: ErrorType, errorCode: string, maxRetries?: number, retryDelay?: number): Promise<T>;
}
