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
exports.StealthPlugin = exports.WalletPlugin = exports.MetaMaskPlugin = exports.WebauthnPlugin = exports.BitcoinWalletPlugin = exports.BitcoinWallet = exports.BasePlugin = void 0;
// Esporta l'interfaccia di base per i plugin
var base_1 = require("./base");
Object.defineProperty(exports, "BasePlugin", { enumerable: true, get: function () { return base_1.BasePlugin; } });
// Esporta i plugin standard
__exportStar(require("./wallet"), exports);
__exportStar(require("./stealth"), exports);
__exportStar(require("./metamask"), exports);
__exportStar(require("./webauthn"), exports);
// Export Bitcoin plugin components individually to avoid naming conflicts
var bitcoinWallet_1 = require("./bitcoin/bitcoinWallet");
Object.defineProperty(exports, "BitcoinWallet", { enumerable: true, get: function () { return bitcoinWallet_1.BitcoinWallet; } });
var bitcoinPlugin_1 = require("./bitcoin/bitcoinPlugin");
Object.defineProperty(exports, "BitcoinWalletPlugin", { enumerable: true, get: function () { return bitcoinPlugin_1.BitcoinWalletPlugin; } });
// Esporta i plugin per gli autenticatori
var webauthnPlugin_1 = require("./webauthn/webauthnPlugin");
Object.defineProperty(exports, "WebauthnPlugin", { enumerable: true, get: function () { return webauthnPlugin_1.WebauthnPlugin; } });
var metamaskPlugin_1 = require("./metamask/metamaskPlugin");
Object.defineProperty(exports, "MetaMaskPlugin", { enumerable: true, get: function () { return metamaskPlugin_1.MetaMaskPlugin; } });
var walletPlugin_1 = require("./wallet/walletPlugin");
Object.defineProperty(exports, "WalletPlugin", { enumerable: true, get: function () { return walletPlugin_1.WalletPlugin; } });
var stealthPlugin_1 = require("./stealth/stealthPlugin");
Object.defineProperty(exports, "StealthPlugin", { enumerable: true, get: function () { return stealthPlugin_1.StealthPlugin; } });
