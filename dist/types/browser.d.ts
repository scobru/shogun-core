/**
 * Entry point for the browser version of Shogun Core
 */
import { ShogunCore } from "./index";
import { ShogunSDKConfig } from "./types/shogun";
/**
 * Function to initialize Shogun in a browser environment
 *
 * @param config - Configuration for the Shogun SDK
 * @returns A new instance of ShogunCore
 */
export declare function initShogunBrowser(config: ShogunSDKConfig): ShogunCore;
export { ShogunCore };
export * from "./types/shogun";
