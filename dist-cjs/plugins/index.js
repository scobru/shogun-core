"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialType = exports.ZkCredentials = exports.ZkProofPlugin = exports.ZkProofConnector = exports.NostrConnectorPlugin = exports.NostrConnector = exports.Web3ConnectorPlugin = exports.Web3Connector = exports.WebauthnPlugin = exports.Webauthn = exports.BasePlugin = void 0;
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
// ZK-Proof plugin exports
var zkProofConnector_1 = require("./zkproof/zkProofConnector");
Object.defineProperty(exports, "ZkProofConnector", { enumerable: true, get: function () { return zkProofConnector_1.ZkProofConnector; } });
var zkProofPlugin_1 = require("./zkproof/zkProofPlugin");
Object.defineProperty(exports, "ZkProofPlugin", { enumerable: true, get: function () { return zkProofPlugin_1.ZkProofPlugin; } });
var zkCredentials_1 = require("./zkproof/zkCredentials");
Object.defineProperty(exports, "ZkCredentials", { enumerable: true, get: function () { return zkCredentials_1.ZkCredentials; } });
Object.defineProperty(exports, "CredentialType", { enumerable: true, get: function () { return zkCredentials_1.CredentialType; } });
