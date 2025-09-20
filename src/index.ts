import { ShogunCore } from "./core";

import {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
} from "./gundb/db";

import { SEA, RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";

// Import Simple API and improved types
import {
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  GunInstance,
  GunUserInstance,
  TypedGunOperationResult,
  TypedAuthResult,
} from "./gundb";

// Import Gun as default export
import Gun from "./gundb/db";

export * from "./utils/errorHandler";

export * from "./plugins";

export * from "./interfaces/shogun";

export type * from "./interfaces/plugin";

// Export simplified configuration
export * from "./config/simplified-config";

export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
  // Improved types
  GunInstance,
  GunUserInstance,
  TypedGunOperationResult,
  TypedAuthResult,
};

export {
  SEA,
  RxJS,
  crypto,
  derive,
  GunErrors,
  DataBase,
  // Simple API exports
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
};
export { Gun };

export { ShogunCore };
