// ZK-OAuth plugin exports
export { ZKOAuthConnectorMinimal as ZKOAuthConnector } from "./zkOAuthConnector";
export { ZKOAuthPlugin } from "./zkOAuthPlugin";
export type {
  ZKOAuthPluginInterface,
  ZKOAuthConfig,
  OAuthProvider,
  ZKOAuthCredentials,
  ZKOAuthConnectionResult,
  ZKProofResult,
  ZKProof,
  OAuthUserInfo,
  PaillierKeyPair,
  ZKCircuitInputs,
} from "./types";
export { default as zkOAuthChain } from "./zkOAuthChain";
