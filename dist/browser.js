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
const index_1 = require("./index");
Object.defineProperty(exports, "ShogunCore", { enumerable: true, get: function () { return index_1.ShogunCore; } });
// Lazy loading modules - organized by functionality
const lazyModules = {
    // Authentication modules
    webauthn: {
        webauthn: () => Promise.resolve().then(() => __importStar(require("./plugins/webauthn/webauthn"))),
    },
    // Web3 connection modules
    web3: {
        web3Connector: () => Promise.resolve().then(() => __importStar(require("./plugins/web3/web3ConnectorPlugin"))),
    },
    nostr: {
        nostrConnector: () => Promise.resolve().then(() => __importStar(require("./plugins/nostr/nostrConnectorPlugin"))),
    },
};
// Instance tracking
let shogunCoreInstance = null;
let gun = null;
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
    // Create a new ShogunCore instance with browser-optimized configuration
    shogunCoreInstance = new index_1.ShogunCore(browserConfig);
    gun = shogunCoreInstance?.gun;
    // Support use as a global variable when included via <script>
    if (typeof window !== "undefined") {
        window.shogun = shogunCoreInstance;
        window.gun = gun;
    }
    return shogunCoreInstance;
}
// Export lazy loading modules in a more organized structure
exports.modules = {
    webauthn: {
        loadWebAuthn: lazyModules.webauthn.webauthn,
    },
    web3: {
        loadMetaMask: lazyModules.web3.web3Connector,
    },
    nostr: {
        loadNostrConnector: lazyModules.nostr.nostrConnector,
    },
};
// Export types and interfaces
__exportStar(require("./types/shogun"), exports);
// Make initialization function available globally when in browser
if (typeof window !== "undefined") {
    window.initShogunBrowser = initShogunBrowser;
}
