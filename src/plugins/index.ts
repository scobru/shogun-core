// Esporta l'interfaccia di base per i plugin
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// Esporta i plugin standard
export * from "./wallet";
export * from "./stealth";
export * from "./metamask";
export * from "./webauthn";
// Export Bitcoin plugin components individually to avoid naming conflicts
export { BitcoinWallet } from "./bitcoin/bitcoinWallet";
export { BitcoinWalletPlugin } from "./bitcoin/bitcoinPlugin";

// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";

export { MetaMaskPlugin } from "./metamask/metamaskPlugin";
export type { MetaMaskPluginInterface } from "./metamask/types";

export { WalletPlugin } from "./wallet/walletPlugin";
export type { WalletPluginInterface } from "./wallet/types";

export { StealthPlugin } from "./stealth/stealthPlugin";
export type { StealthPluginInterface } from "./stealth/types";

// Export Bitcoin types explicitly
export type {
  BitcoinPluginInterface,
  BitcoinCredentials,
  BitcoinKeyPair,
  BitcoinWalletConfig,
  AlbyProvider,
  NostrProvider,
} from "./bitcoin/types";
