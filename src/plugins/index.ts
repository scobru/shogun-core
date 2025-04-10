// Esporta l'interfaccia di base per i plugin
export { ShogunPlugin, PluginManager } from '../types/plugin';
export { BasePlugin } from './base';

// Esporta i plugin standard
export * from './wallet';
export * from './stealth';
export * from './did';

// Esporta i plugin per gli autenticatori
export { WebauthnPlugin } from './webauthn/webauthnPlugin';
export { WebauthnPluginInterface } from './webauthn/types';

export { MetaMaskPlugin } from './metamask/metamaskPlugin';
export { MetaMaskPluginInterface } from './metamask/types'; 