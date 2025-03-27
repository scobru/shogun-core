/**
 * Common types shared across modules
 */
/**
 * Base event interface
 */
export interface BaseEvent {
    type: string;
    data: any;
    timestamp: number;
}
/**
 * Base configuration interface
 */
export interface BaseConfig {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}
/**
 * Base cache entry interface
 */
export interface BaseCacheEntry<T = any> {
    timestamp: number;
    data?: T;
}
/**
 * Base operation result
 */
export interface BaseResult {
    success: boolean;
    error?: string;
}
/**
 * Base authentication result
 */
export interface BaseAuthResult extends BaseResult {
    username?: string;
    password?: string;
}
/**
 * Common log levels
 */
export type LogLevel = 'info' | 'error' | 'debug' | 'warn';
/**
 * Base log message
 */
export interface BaseLogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}
/**
 * Base device info
 */
export interface BaseDeviceInfo {
    deviceId: string;
    timestamp: number;
    name: string;
    platform: string;
    lastUsed?: number;
}
/**
 * Base backup options
 */
export interface BaseBackupOptions {
    encryptionPassword?: string;
    includeHistory?: boolean;
}
/**
 * Base import options
 */
export interface BaseImportOptions {
    decryptionPassword?: string;
    validateData?: boolean;
    overwriteExisting?: boolean;
}
