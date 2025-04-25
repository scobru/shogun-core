/**
 * Base event interface
 */
export interface BaseEvent {
  type: string;
  data: Record<string, unknown>;
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
export interface BaseCacheEntry<T = unknown> {
  timestamp: number;
  data?: T; // Reso opzionale per retrocompatibilità
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
export type LogLevel = "info" | "error" | "debug" | "warn";

/**
 * Base log message
 */
export interface BaseLogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
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

/**
 * Basic error information
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  name?: string;
  stack?: string;
  [key: string]: unknown;
}
