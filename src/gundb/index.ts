// Export the main class
export { GunDB } from "./instance";
export { Gun, SEA } from "./gun-es/gun-es";

// Export derive functionality
export { default as derive } from "./derive";
export type { DeriveOptions } from "./derive";

// Export utils
export {
  getId,
  getPub,
  getTargetPub,
  getUUID,
  getSet,
  qs,
  getIndexedObjectFromArray,
  getArrayFromIndexedObject,
  app_scoped,
} from "./utils";
