/**
 * Generic Transport Layer Interface
 * Supports different database backends: GunDB, SQLite, PostgreSQL, MongoDB, etc.
 */

import type { ISEAPair } from "gun/types";
// Import transport implementations
import { GunTransport } from "./GunTransport";
import { SqliteTransport } from "./SqliteTransport";
import { PostgresqlTransport } from "./PostgresqlTransport";
import { MongodbTransport } from "./MongodbTransport";

/**
 * Generic user instance interface
 */
export interface IUserInstance {
  is?: {
    pub?: string;
    epub?: string;
    alias?: string | ISEAPair;
  };
  _?: any;

  // Generic authentication methods
  auth(...args: any[]): any;
  create(...args: any[]): any;
  leave(): void;
  recall(options?: any): IUserInstance;
  put(data: any): void;
  get(key: string): IChain;
}

/**
 * Generic chain/node interface for data operations
 */
export interface IChain {
  get(key: string): IChain;
  put(data: any): Promise<any>;
  set(data: any): Promise<any>;
  once(callback: (data: any) => void): void;
  on(callback: (data: any) => void): void;
  off(callback: (data: any) => void): void;
  then(): Promise<any>;

  // Generic methods for different database patterns
  find?(query: any): Promise<any>;
  insert?(data: any): Promise<any>;
  update?(query: any, data: any): Promise<any>;
  delete?(query: any): Promise<any>;
}

/**
 * Generic transport layer interface
 */
export interface TransportLayer {
  readonly name: string;
  readonly version: string;

  // Core operations
  user(): IUserInstance;
  get(path: string): IChain;

  // Event system (optional - not all databases support events)
  on?(event: string, callback: (data: any) => void): void;
  off?(event: string, callback: (data: any) => void): void;
  emit?(event: string, data?: any): void;

  // Connection management
  connect(config?: any): Promise<boolean>;
  disconnect(): Promise<boolean>;
  isConnected(): boolean;

  // Configuration
  configure(options: any): void;

  // Database-specific operations (optional)
  query?(sql: string, params?: any[]): Promise<any>;
  transaction?(callback: (tx: any) => Promise<any>): Promise<any>;

  // Cleanup
  destroy(): void;
}

/**
 * Transport layer configuration
 */
export interface TransportConfig {
  type: "gun" | "sqlite" | "postgresql" | "mongodb" | "custom";
  options?: any;
  customTransport?: TransportLayer;
}

/**
 * Transport layer factory
 */
export class TransportFactory {
  static create(config: TransportConfig): TransportLayer {
    switch (config.type) {
      case "gun":
        return new GunTransport(config.options);
      case "sqlite":
        return new SqliteTransport(config.options);
      case "postgresql":
        return new PostgresqlTransport(config.options);
      case "mongodb":
        return new MongodbTransport(config.options);
      case "custom":
        if (!config.customTransport) {
          throw new Error("Custom transport must be provided");
        }
        return config.customTransport;
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}
