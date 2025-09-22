/**
 * Core types and interfaces for Shogun SDK
 */
export var PluginCategory;
(function (PluginCategory) {
    PluginCategory["Authentication"] = "authentication";
    PluginCategory["Wallet"] = "wallet";
    PluginCategory["Privacy"] = "privacy";
    PluginCategory["Identity"] = "identity";
    PluginCategory["Utility"] = "utility";
})(PluginCategory || (PluginCategory = {}));
export var CorePlugins;
(function (CorePlugins) {
    CorePlugins["WebAuthn"] = "webauthn";
    CorePlugins["Web3"] = "web3";
    CorePlugins["Nostr"] = "nostr";
    CorePlugins["OAuth"] = "oauth";
})(CorePlugins || (CorePlugins = {}));
