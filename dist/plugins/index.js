// Esporta l'interfaccia di base per i plugin
export { BasePlugin } from "./base";
// Esporta i plugin standard
export * from "./wallet";
export * from "./stealth";
export * from "./did";
export * from "./metamask";
export * from "./webauthn";
// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from "./webauthn/webauthnPlugin";
export { MetaMaskPlugin } from "./metamask/metamaskPlugin";
export { WalletPlugin } from "./wallet/walletPlugin";
export { DIDPlugin } from "./did/didPlugin";
export { StealthPlugin } from "./stealth/stealthPlugin";
