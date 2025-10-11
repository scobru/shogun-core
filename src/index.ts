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

export { SHIP_00 } from "../ship/implementation/SHIP_00";
export type { ISHIP_00 } from "../ship/interfaces/ISHIP_00";

export { SHIP_01 } from "../ship/implementation/SHIP_01";
export type { ISHIP_01 } from "../ship/interfaces/ISHIP_01";

export { SHIP_02 } from "../ship/implementation/SHIP_02";
export type { ISHIP_02 } from "../ship/interfaces/ISHIP_02";

export { SHIP_03 } from "../ship/implementation/SHIP_03";
export type { ISHIP_03 } from "../ship/interfaces/ISHIP_03";

// Export CLI tools only in Node.js environment (not browser)
// This prevents "readline is not a function" errors in browser builds
export { MessengerCLI } from "../ship/examples/messenger-cli";
export { WalletCLI } from "../ship/examples/wallet-cli";

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
