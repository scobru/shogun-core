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
