import { ShogunCore } from "./core";
import { SEA, RxJS, crypto, derive, GunErrors, DataBase } from "./gundb/db";
// Import Simple API and improved types
import { SimpleGunAPI, QuickStart, quickStart, createSimpleAPI, } from "./gundb";
// Import Gun as default export
import Gun from "./gundb/db";
export * from "./utils/errorHandler";
export * from "./plugins";
export * from "./interfaces/shogun";
// Export simplified configuration
export * from "./config/simplified-config";
export { SEA, RxJS, crypto, derive, GunErrors, DataBase, 
// Simple API exports
SimpleGunAPI, QuickStart, quickStart, createSimpleAPI, };
export { Gun };
export { ShogunCore };
