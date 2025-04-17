"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunCore = exports.modules = void 0;
exports.initShogunBrowser = initShogunBrowser;
/**
 * Entry point for the browser version of Shogun Core
 */
const index_1 = require("./index");
Object.defineProperty(exports, "ShogunCore", { enumerable: true, get: function () { return index_1.ShogunCore; } });
const shogun_1 = require("./types/shogun");
const logger_1 = require("./utils/logger");
// Lazy loading dei moduli pesanti
const loadWebAuthnModule = () => Promise.resolve().then(() => __importStar(require("./plugins/webauthn/webauthn")));
const loadStealthModule = () => Promise.resolve().then(() => __importStar(require("./plugins/stealth/stealth")));
const loadDIDModule = () => Promise.resolve().then(() => __importStar(require("./plugins/did/DID")));
const loadWalletModule = () => Promise.resolve().then(() => __importStar(require("./plugins/wallet/walletPlugin")));
const loadMetaMaskModule = () => Promise.resolve().then(() => __importStar(require("./plugins/metamask/metamaskPlugin")));
let shogunCoreInstance;
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
function initShogunBrowser(config) {
    // Apply default browser settings
    const browserConfig = {
        ...config,
    };
    // Assicuriamoci che la configurazione di GunDB esista
    browserConfig.gundb ?? (browserConfig.gundb = {});
    // Warn users who don't provide custom peers or providerUrl
    if (!config.gundb?.peers) {
        (0, logger_1.log)("WARNING: Using default GunDB peers. For production, always configure custom peers.");
    }
    if (!config.providerUrl) {
        (0, logger_1.log)("WARNING: No Ethereum provider URL specified. Using default public endpoint with rate limits.");
    }
    // Create a new ShogunCore instance with browser-optimized configuration
    shogunCoreInstance = new index_1.ShogunCore(browserConfig);
    // Log the plugin status
    if (shogunCoreInstance.hasPlugin(shogun_1.CorePlugins.WebAuthn)) {
        (0, logger_1.log)("WebAuthn plugin initialized", { category: "init", level: "info" });
    }
    if (shogunCoreInstance.hasPlugin(shogun_1.CorePlugins.MetaMask)) {
        (0, logger_1.log)("MetaMask plugin initialized", { category: "init", level: "info" });
    }
    if (shogunCoreInstance.hasPlugin(shogun_1.CorePlugins.WalletManager)) {
        (0, logger_1.log)("Wallet plugin initialized", { category: "init", level: "info" });
    }
    return shogunCoreInstance;
}
// Esportazione lazy loading helpers
exports.modules = {
    loadWebAuthn: loadWebAuthnModule,
    loadStealth: loadStealthModule,
    loadDID: loadDIDModule,
    loadWallet: loadWalletModule,
    loadMetaMask: loadMetaMaskModule,
};
// Export main types as well
__exportStar(require("./types/shogun"), exports);
// Support use as a global variable when included via <script>
if (typeof window !== "undefined") {
    window.ShogunCore = shogunCoreInstance;
    window.initShogunBrowser = initShogunBrowser;
    window.ShogunModules = exports.modules;
}
