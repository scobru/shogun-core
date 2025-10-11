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

export * from "./config/simplified-config";

export type * from "./interfaces/plugin";

export { SHIP_01 } from "../ship/implementation/SHIP_01";

export type { ISHIP_01 } from "../ship/interfaces/ISHIP_01";

export { MessengerCLI } from "../ship/examples/messenger-cli";

export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
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
  SimpleGunAPI,
  QuickStart,
  quickStart,
  createSimpleAPI,
  AutoQuickStart,
  autoQuickStart,
};
