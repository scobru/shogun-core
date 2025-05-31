"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEvent = exports.AuthState = exports.CorePlugins = exports.PluginCategory = void 0;
/**
 * Standard plugin categories in ShogunCore
 */
var PluginCategory;
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
})(PluginCategory || (exports.PluginCategory = PluginCategory = {}));
/**
 * Standard names for built-in plugins
 */
var CorePlugins;
(function (CorePlugins) {
    /** WebAuthn plugin */
    CorePlugins["WebAuthn"] = "webauthn";
    /** Ethereum plugin */
    CorePlugins["Ethereum"] = "ethereum";
    /** Stealth Address plugin */
    CorePlugins["StealthAddress"] = "stealth";
    /** HD Wallet plugin */
    CorePlugins["Bip44"] = "bip44";
    /** Bitcoin wallet plugin */
    CorePlugins["Bitcoin"] = "bitcoin";
})(CorePlugins || (exports.CorePlugins = CorePlugins = {}));
/**
 * Authentication states for the state machine
 */
var AuthState;
(function (AuthState) {
    AuthState["UNAUTHENTICATED"] = "unauthenticated";
    AuthState["AUTHENTICATING"] = "authenticating";
    AuthState["AUTHENTICATED"] = "authenticated";
    AuthState["AUTHENTICATION_FAILED"] = "authentication_failed";
    AuthState["WALLET_INITIALIZING"] = "wallet_initializing";
    AuthState["WALLET_READY"] = "wallet_ready";
    AuthState["ERROR"] = "error";
})(AuthState || (exports.AuthState = AuthState = {}));
/**
 * Authentication events that trigger state transitions
 */
var AuthEvent;
(function (AuthEvent) {
    AuthEvent["LOGIN_START"] = "login_start";
    AuthEvent["LOGIN_SUCCESS"] = "login_success";
    AuthEvent["LOGIN_FAILED"] = "login_failed";
    AuthEvent["LOGOUT"] = "logout";
    AuthEvent["WALLET_INIT_START"] = "wallet_init_start";
    AuthEvent["WALLET_INIT_SUCCESS"] = "wallet_init_success";
    AuthEvent["WALLET_INIT_FAILED"] = "wallet_init_failed";
    AuthEvent["ERROR"] = "error";
})(AuthEvent || (exports.AuthEvent = AuthEvent = {}));
