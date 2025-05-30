// Base plugin interface and types
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// WebAuthn plugin exports
export { Webauthn } from "./webauthn/webauthn";
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";

// Ethereum plugin exports
export { Web3Connector } from "./ethereum/web3Connector";
export { Web3ConnectorPlugin } from "./ethereum/web3ConnectorPlugin";
export type { Web3ConectorPluginInterface } from "./ethereum/types";

// Bitcoin plugin exports
export { NostrConnector } from "./bitcoin/nostrConnector";
export { NostrConnectorPlugin } from "./bitcoin/nostrConnectorPlugin";
export type {
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
} from "./bitcoin/types";

// BIP32 HD Wallet plugin exports
export { HDWallet } from "./bip32/hdwallet";
export { HDWalletPlugin } from "./bip32/hdwalletPlugin";
export type { HDWalletPluginInterface } from "./bip32/types";

// Stealth address plugin exports
export { Stealth } from "./stealth-address/stealth";
export { StealthPlugin } from "./stealth-address/stealthPlugin";
export type { StealthPluginInterface } from "./stealth-address/types";
