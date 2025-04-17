// Esporta l'interfaccia di base per i plugin
export { ShogunPlugin, PluginManager } from "../types/plugin";
export { BasePlugin } from "./base";

// Esporta i plugin standard
export * from "./wallet";
export * from "./stealth";
export * from "./did";
export * from "./metamask";
export * from "./webauthn";

// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export { WebauthnPluginInterface } from "./webauthn/types";

export { MetaMaskPlugin } from "./metamask/metamaskPlugin";
export { MetaMaskPluginInterface } from "./metamask/types";

export { WalletPlugin } from "./wallet/walletPlugin";
export { WalletPluginInterface } from "./wallet/types";

export { DIDPlugin } from "./did/didPlugin";
export { DIDPluginInterface } from "./did/types";

export { StealthPlugin } from "./stealth/stealthPlugin";
export { StealthPluginInterface } from "./stealth/types";
