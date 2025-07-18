// Base plugin interface and types
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// WebAuthn plugin exports
export { Webauthn } from "./webauthn/webauthn";
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";

// Ethereum plugin exports
export { Web3Connector } from "./web3/web3Connector";
export { Web3ConnectorPlugin } from "./web3/web3ConnectorPlugin";
export type { Web3ConectorPluginInterface } from "./web3/types";

// Bitcoin plugin exports
export { NostrConnector } from "./nostr/nostrConnector";
export { NostrConnectorPlugin } from "./nostr/nostrConnectorPlugin";
export type {
  NostrConnectorPluginInterface,
  NostrConnectorCredentials,
  NostrConnectorKeyPair,
  NostrConnectorConfig,
  AlbyProvider,
  NostrProvider,
} from "./nostr/types";

// OAuth plugin exports
export { OAuthConnector } from "./oauth/oauthConnector";
export { OAuthPlugin } from "./oauth/oauthPlugin";
export * from "./oauth/types";
