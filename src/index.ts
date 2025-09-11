import { ShogunCore } from "./core";

import {
  Relay,
  RelayConfig,
  RelayPresets,
  RelayStatus,
  createRelay,
} from "./gundb/relay";

import {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
} from "./gundb/gun-Instance";

import {
  SEA as GunSEA,
  GunRxJS,
  crypto as gunCrypto,
  derive as deriveGun,
  GunErrors,
  GunInstance,
} from "./gundb/gun-Instance";

import {
    HolsterInstance,
    HolsterRxJS,
    crypto as holsterCrypto,
    derive as deriveHolster,
    HolsterErrors,
} from "./holster";

// Import Gun as default export
import Gun from "./gundb/gun-Instance";
import Holster from "./holster";

export * from "./utils/errorHandler";
export * from "./plugins";
export * from "./types/shogun";
export type * from "./types/plugin";
export type {
  IGunUserInstance,
  IGunInstance,
  GunDataEventData,
  GunPeerEventData,
  DeriveOptions,
};

export { GunSEA, GunRxJS, gunCrypto, deriveGun, GunErrors, GunInstance };
export { HolsterInstance, HolsterRxJS, holsterCrypto, deriveHolster, HolsterErrors };
export { Gun, Holster };
export { ShogunCore, Relay, createRelay, RelayPresets };

export type { RelayConfig, RelayStatus };
