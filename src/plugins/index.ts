// Base plugin interface and types
export { BasePlugin } from "./base";
export type { ShogunPlugin, PluginManager } from "../types/plugin";

// WebAuthn plugin exports
export { Webauthn } from "./webauthn/webauthn";
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export type { WebauthnPluginInterface } from "./webauthn/types";
export { default as webauthnChain } from "./webauthn/webauthnChain";

// Ethereum plugin exports
export { Web3Connector } from "./web3/web3Connector";
export { Web3ConnectorPlugin } from "./web3/web3ConnectorPlugin";
export type { Web3ConectorPluginInterface } from "./web3/types";
export { default as web3Chain } from "./web3/web3Chain";

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

export { default as nostrChain } from "./nostr/nostrChain";

// OAuth plugin exports
export { OAuthConnector } from "./oauth/oauthConnector";
export { OAuthPlugin } from "./oauth/oauthPlugin";
export * from "./oauth/types";
export { default as oauthChain } from "./oauth/oauthChain";
