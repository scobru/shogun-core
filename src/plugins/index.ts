// Esporta l'interfaccia di base per i plugin
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// Esporta i plugin standard
export * from "./bip32";
export * from "./stealth-address";
export * from "./ethereum";
export * from "./webauthn";
// Export Bitcoin plugin components individually to avoid naming conflicts
export { NostrConnector } from "./bitcoin/nostrConnector";
export { NostrConnectorPlugin } from "./bitcoin/nostrConnectorPlugin";

// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";

export { Web3ConnectorPlugin } from "./ethereum/web3ConnectorPlugin";
export type { Web3ConectorPluginInterface } from "./ethereum/types";

export { HDWalletPlugin } from "./bip32/hdwalletPlugin";
export type { HDWalletPluginInterface } from "./bip32/types";

export { StealthPlugin } from "./stealth-address/stealthPlugin";
export type { StealthPluginInterface } from "./stealth-address/types";

// Export Bitcoin types explicitly
export type {
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
} from "./bitcoin/types";
