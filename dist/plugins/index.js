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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StealthPlugin = exports.HDWalletPlugin = exports.Web3ConnectorPlugin = exports.WebauthnPlugin = exports.NostrConnectorPlugin = exports.NostrConnector = exports.BasePlugin = void 0;
// Esporta l'interfaccia di base per i plugin
var base_1 = require("./base");
Object.defineProperty(exports, "BasePlugin", { enumerable: true, get: function () { return base_1.BasePlugin; } });
// Esporta i plugin standard
__exportStar(require("./bip32"), exports);
__exportStar(require("./stealth-address"), exports);
__exportStar(require("./ethereum"), exports);
__exportStar(require("./webauthn"), exports);
// Export Bitcoin plugin components individually to avoid naming conflicts
var nostrConnector_1 = require("./bitcoin/nostrConnector");
Object.defineProperty(exports, "NostrConnector", { enumerable: true, get: function () { return nostrConnector_1.NostrConnector; } });
var nostrConnectorPlugin_1 = require("./bitcoin/nostrConnectorPlugin");
Object.defineProperty(exports, "NostrConnectorPlugin", { enumerable: true, get: function () { return nostrConnectorPlugin_1.NostrConnectorPlugin; } });
// Esporta i plugin per gli autenticatori
var webauthnPlugin_1 = require("./webauthn/webauthnPlugin");
Object.defineProperty(exports, "WebauthnPlugin", { enumerable: true, get: function () { return webauthnPlugin_1.WebauthnPlugin; } });
var web3ConnectorPlugin_1 = require("./ethereum/web3ConnectorPlugin");
Object.defineProperty(exports, "Web3ConnectorPlugin", { enumerable: true, get: function () { return web3ConnectorPlugin_1.Web3ConnectorPlugin; } });
var hdwalletPlugin_1 = require("./bip32/hdwalletPlugin");
Object.defineProperty(exports, "HDWalletPlugin", { enumerable: true, get: function () { return hdwalletPlugin_1.HDWalletPlugin; } });
var stealthPlugin_1 = require("./stealth-address/stealthPlugin");
Object.defineProperty(exports, "StealthPlugin", { enumerable: true, get: function () { return stealthPlugin_1.StealthPlugin; } });
