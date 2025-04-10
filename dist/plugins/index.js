export { BasePlugin } from './base';
// Esporta i plugin standard
export * from './wallet';
export * from './stealth';
export * from './did';
// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from './webauthn/webauthnPlugin';
export { MetaMaskPlugin } from './metamask/metamaskPlugin';
