import { ShogunCore } from "./core";
import { RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";
// Import Simple API and improved types
import { SimpleGunAPI, QuickStart, quickStart, createSimpleAPI, AutoQuickStart, autoQuickStart, } from "./gundb";
import { SEA } from "./gundb/db";
import Gun from "./gundb/db";
export * from "./utils/errorHandler";
export * from "./plugins";
export * from "./interfaces/shogun";
// Export simplified configuration
export * from "./config/simplified-config";
export { Gun, ShogunCore, SEA, RxJS, crypto, derive, GunErrors, DataBase, 
// Simple API exports
SimpleGunAPI, QuickStart, quickStart, createSimpleAPI, AutoQuickStart, autoQuickStart, };
