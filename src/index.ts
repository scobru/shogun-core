import { ShogunCore } from "./core";

import {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
} from "./gundb/db";

import { RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";

// Import Simple API and improved types
import {
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  TypedGunOperationResult,
  TypedAuthResult,
  AutoQuickStart,
  autoQuickStart,
} from "./gundb";

import { SEA } from "./gundb/db";

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
  TypedGunOperationResult,
  TypedAuthResult,
};

export {
  Gun,
  ShogunCore,
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
  AutoQuickStart,
  autoQuickStart,
};
