import { ShogunCore } from "./index";
import { ShogunSDKConfig } from "./types/shogun";
/**
 * Function to initialize Shogun in a browser environment
 *
 * @param config - Configuration for the Shogun SDK
 * @returns A new instance of ShogunCore
 *
 * @important For production use:
 * - Always set custom GunDB peers via config.gundb.peers or config.peers
 * - Always set a valid Ethereum RPC provider URL via config.providerUrl
 * - Default values are provided only for development and testing
 */
export declare function initShogunBrowser(config: ShogunSDKConfig): ShogunCore;
export declare const modules: {
    loadWebAuthn: () => Promise<typeof import("./plugins/webauthn/webauthn")>;
    loadStealth: () => Promise<typeof import("./plugins/stealth/stealth")>;
    loadWallet: () => Promise<typeof import("./plugins/wallet/walletPlugin")>;
    loadMetaMask: () => Promise<typeof import("./plugins/metamask/metamaskPlugin")>;
};
export { ShogunCore };
export * from "./types/shogun";
