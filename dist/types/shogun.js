/**
 * Categorie di plugin standard in ShogunCore
 */
export var PluginCategory;
(function (PluginCategory) {
    /** Plugin per l'autenticazione (WebAuthn, MetaMask) */
    PluginCategory["Authentication"] = "authentication";
    /** Plugin per la gestione di wallet */
    PluginCategory["Wallet"] = "wallet";
    /** Plugin per la privacy e l'anonimato */
    PluginCategory["Privacy"] = "privacy";
    /** Plugin per l'identità decentralizzata */
    PluginCategory["Identity"] = "identity";
    /** Plugin per altre funzionalità */
    PluginCategory["Utility"] = "utility";
})(PluginCategory || (PluginCategory = {}));
/**
 * Nomi standard dei plugin integrati
 */
export var CorePlugins;
(function (CorePlugins) {
    /** Plugin WebAuthn */
    CorePlugins["WebAuthn"] = "webauthn";
    /** Plugin MetaMask */
    CorePlugins["MetaMask"] = "metamask";
    /** Plugin Stealth */
    CorePlugins["Stealth"] = "stealth";
    /** Plugin DID */
    CorePlugins["DID"] = "did";
    /** Plugin Wallet Manager */
    CorePlugins["WalletManager"] = "wallet";
})(CorePlugins || (CorePlugins = {}));
