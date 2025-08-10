// @ts-nocheck
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
exports.OAuthPlugin = exports.OAuthConnector = exports.NostrConnectorPlugin = exports.NostrConnector = exports.Web3ConnectorPlugin = exports.Web3Connector = exports.WebauthnPlugin = exports.Webauthn = exports.BasePlugin = void 0;
// Base plugin interface and types
var base_1 = require("./base");
Object.defineProperty(exports, "BasePlugin", { enumerable: true, get: function () { return base_1.BasePlugin; } });
// WebAuthn plugin exports
var webauthn_1 = require("./webauthn/webauthn");
Object.defineProperty(exports, "Webauthn", { enumerable: true, get: function () { return webauthn_1.Webauthn; } });
var webauthnPlugin_1 = require("./webauthn/webauthnPlugin");
Object.defineProperty(exports, "WebauthnPlugin", { enumerable: true, get: function () { return webauthnPlugin_1.WebauthnPlugin; } });
// Ethereum plugin exports
var web3Connector_1 = require("./web3/web3Connector");
Object.defineProperty(exports, "Web3Connector", { enumerable: true, get: function () { return web3Connector_1.Web3Connector; } });
var web3ConnectorPlugin_1 = require("./web3/web3ConnectorPlugin");
Object.defineProperty(exports, "Web3ConnectorPlugin", { enumerable: true, get: function () { return web3ConnectorPlugin_1.Web3ConnectorPlugin; } });
// Bitcoin plugin exports
var nostrConnector_1 = require("./nostr/nostrConnector");
Object.defineProperty(exports, "NostrConnector", { enumerable: true, get: function () { return nostrConnector_1.NostrConnector; } });
var nostrConnectorPlugin_1 = require("./nostr/nostrConnectorPlugin");
Object.defineProperty(exports, "NostrConnectorPlugin", { enumerable: true, get: function () { return nostrConnectorPlugin_1.NostrConnectorPlugin; } });
// OAuth plugin exports
var oauthConnector_1 = require("./oauth/oauthConnector");
Object.defineProperty(exports, "OAuthConnector", { enumerable: true, get: function () { return oauthConnector_1.OAuthConnector; } });
var oauthPlugin_1 = require("./oauth/oauthPlugin");
Object.defineProperty(exports, "OAuthPlugin", { enumerable: true, get: function () { return oauthPlugin_1.OAuthPlugin; } });
__exportStar(require("./oauth/types"), exports);
