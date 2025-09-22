"use strict";
/**
 * Core types and interfaces for Shogun SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorePlugins = exports.PluginCategory = void 0;
var PluginCategory;
(function (PluginCategory) {
    PluginCategory["Authentication"] = "authentication";
    PluginCategory["Wallet"] = "wallet";
    PluginCategory["Privacy"] = "privacy";
    PluginCategory["Identity"] = "identity";
    PluginCategory["Utility"] = "utility";
})(PluginCategory || (exports.PluginCategory = PluginCategory = {}));
var CorePlugins;
(function (CorePlugins) {
    CorePlugins["WebAuthn"] = "webauthn";
    CorePlugins["Web3"] = "web3";
    CorePlugins["Nostr"] = "nostr";
    CorePlugins["OAuth"] = "oauth";
})(CorePlugins || (exports.CorePlugins = CorePlugins = {}));
