/**
 * Core types and interfaces for Shogun SDK
 */

export enum PluginCategory {
  Authentication = "authentication",
  Wallet = "wallet",
  Privacy = "privacy",
  Identity = "identity",
  Utility = "utility",
}

export enum CorePlugins {
  WebAuthn = "webauthn",
  Web3 = "web3",
  Nostr = "nostr",
  OAuth = "oauth",
}

export type AuthMethod =
  | "password"
  | "webauthn"
  | "web3"
  | "nostr"
  | "oauth"
  | "bitcoin"
  | "pair";

export interface ISEAPair {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
}

export interface AuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  sessionToken?: string;
  authMethod: AuthMethod;
  sea?: ISEAPair;
  error?: string;
  provider?: string;
  redirectUrl?: string;
  pendingAuth?: boolean;
  message?: string;
  isNewUser?: boolean;
  user?: {
    userPub: string;
    username: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email: string;
      name: string;
      picture: string;
      lastLogin: number;
    };
  };
}

export interface SignUpResult {
  success: boolean;
  userPub?: string;
  username?: string;
  pub?: string;
  authMethod?: AuthMethod;
  sessionToken?: string;
  isNewUser?: boolean;
  sea?: ISEAPair;
  error?: string;
  message?: string;
  provider?: string;
  redirectUrl?: string;
  pendingAuth?: boolean;
  user?: {
    userPub: string;
    username: string;
    email?: string;
    name?: string;
    picture?: string;
    oauth?: {
      provider: string;
      id: string;
      email: string;
      name: string;
      picture: string;
      lastLogin: number;
    };
  };
}

export interface WebauthnConfig {
  enabled: boolean;
  rpName?: string;
  rpId?: string;
}

export interface Web3Config {
  enabled: boolean;
}

export interface NostrConfig {
  enabled: boolean;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret?: string;
}

export interface OAuthConfig {
  enabled: boolean;
  usePKCE?: boolean;
  allowUnsafeClientSecret?: boolean;
  providers?: {
    google?: OAuthProviderConfig;
    github?: OAuthProviderConfig;
    [key: string]: OAuthProviderConfig | undefined;
  };
}

export interface TimeoutsConfig {
  login?: number;
  signup?: number;
  operation?: number;
}

export interface PluginsConfig {
  autoRegister?: string[];
}

export interface ShogunSDKConfig {
  gunInstance?: any;
  authToken?: string;
  scope?: string;
  peers?: string[];
  webauthn?: WebauthnConfig;
  web3?: Web3Config;
  nostr?: NostrConfig;
  oauth?: OAuthConfig;
  timeouts?: TimeoutsConfig;
  plugins?: PluginsConfig;
  appToken?: string;
  gunOptions?: any;
  disableAutoRecall?: boolean;
  silent?: boolean;
}

export interface ShogunEvents {
  error: (data: any) => void;
  "auth:signup": (data: any) => void;
  "auth:login": (data: any) => void;
  "auth:logout": () => void;
  "auth:username_changed": (data: any) => void;
  "wallet:created": (data: any) => void;
  "gun:put": (data: any) => void;
  "gun:get": (data: any) => void;
  "gun:set": (data: any) => void;
  "gun:remove": (data: any) => void;
  "gun:peer:add": (data: any) => void;
  "gun:peer:remove": (data: any) => void;
  "gun:peer:connect": (data: any) => void;
  "gun:peer:disconnect": (data: any) => void;
  "plugin:registered": (data: any) => void;
  "plugin:unregistered": (data: any) => void;
  debug: (data: any) => void;
}

export interface Wallets {
  secp256k1Bitcoin?: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
  secp256k1Ethereum?: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
}

export interface IShogunCore {
  // PluginManager methods
  registerPlugin: (plugin: any) => void;
  unregisterPlugin: (pluginName: string) => void;
  getPlugin: (name: string) => any;
  getPlugins: () => any[];
  hasPlugin: (name: string) => boolean;

  // Core properties
  gun: any;
  db: any;
  rx: any;
  storage: any;
  config: any;

  // Event emitter methods
  on: (eventName: string, listener: Function) => any;
  off: (eventName: string, listener: Function) => any;
  once: (eventName: string, listener: Function) => any;
  removeAllListeners: (eventName?: string) => any;
  emit: (eventName: string, data?: any) => boolean;

  // Error handling methods
  getRecentErrors: (count?: number) => any[];

  // Authentication methods
  login: (
    username: string,
    password: string,
    pair?: any,
  ) => Promise<AuthResult>;
  signUp: (
    username: string,
    password?: string,
    pair?: any,
  ) => Promise<SignUpResult>;
  getAuthenticationMethod: (type: AuthMethod) => any;

  // User management methods
  getCurrentUser: () => any;
  changeUsername: (newUsername: string) => Promise<any>;

  // Utility methods
  logout: () => void;
  isLoggedIn: () => boolean;
}

// Re-export from interfaces for backward compatibility
export type ShogunCoreConfig = ShogunSDKConfig;
