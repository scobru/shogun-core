// Esporta l'interfaccia di base per i plugin
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// Esporta i plugin standard
export * from "./wallet";
export * from "./stealth";
export * from "./did";
export * from "./metamask";
export * from "./webauthn";
export * from "./social/social";

// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";

export { MetaMaskPlugin } from "./metamask/metamaskPlugin";
export type { MetaMaskPluginInterface } from "./metamask/types";

export { WalletPlugin } from "./wallet/walletPlugin";
export type { WalletPluginInterface } from "./wallet/types";

export { DIDPlugin } from "./did/didPlugin";
export type { DIDPluginInterface } from "./did/types";

export { StealthPlugin } from "./stealth/stealthPlugin";
export type { StealthPluginInterface } from "./stealth/types";

export { SocialPlugin } from "./social/socialPlugin";
export type { SocialPluginInterface } from "./social/types";
