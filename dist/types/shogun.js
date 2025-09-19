/**
 * Standard plugin categories in ShogunCore
 */
export var PluginCategory;
(function (PluginCategory) {
    /** Authentication plugins (WebAuthn, MetaMask, Bitcoin) */
    PluginCategory["Authentication"] = "authentication";
    /** Wallet management plugins */
    PluginCategory["Wallet"] = "wallet";
    /** Privacy and anonymity plugins */
    PluginCategory["Privacy"] = "privacy";
    /** Decentralized identity plugins */
    PluginCategory["Identity"] = "identity";
    /** Other utility plugins */
    PluginCategory["Utility"] = "utility";
    /** Messages plugins */
    PluginCategory["Messages"] = "messages";
    /** Messaging plugins */
    PluginCategory["Other"] = "other";
})(PluginCategory || (PluginCategory = {}));
/**
 * Standard names for built-in plugins
 */
export var CorePlugins;
(function (CorePlugins) {
    /** WebAuthn plugin */
    CorePlugins["WebAuthn"] = "webauthn";
    /** Ethereum plugin */
    CorePlugins["Web3"] = "web3";
    /** Bitcoin wallet plugin */
    CorePlugins["Nostr"] = "nostr";
    /** OAuth plugin */
    CorePlugins["OAuth"] = "oauth";
})(CorePlugins || (CorePlugins = {}));
