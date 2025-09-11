/**
 * Type definitions for HolsterDB to replace 'any' usage
 */

// User types
export type HolsterUser = any; //IHolsterUserInstance<any>;
export type UserInfo = {
  pub: string;
  alias?: string;
  timestamp?: number;
  user?: HolsterUser; // Add user property for compatibility
};

// Auth callback types
export type AuthCallback = (user: HolsterUser) => void;
export type AuthResult = {
  success: boolean;
  userPub?: string;
  error?: string;
  ack?: any; // Use any for Holster compatibility
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
};

// Data operation types - using any for Holster compatibility
export type HolsterData = any;
export type HolsterNode = any; // Use any for Holster nodes to avoid complex type issues

// Callback types for Holster operations - using any for Holster compatibility
export type HolsterCallback = any;
export type HolsterDataCallback = any;
export type HolsterMapCallback = any;

// Username lookup result
export interface UsernameLookupResult {
  pub?: string;
  userPub?: string;
  username?: string;
  source: string;
  immutable: boolean;
  hash?: string;
  [key: string]: any; // Use any for flexibility
}

// User metadata
export interface UserMetadata {
  username: string;
  pub: string;
  createdAt: number;
  lastLogin: number;
}

// Mapping data
export interface MappingData {
  username: string;
  userPub: string;
  createdAt: number;
}

// Security data
export interface SecurityData {
  questions: string;
  hint: string;
}

// Frozen space data
export interface FrozenData {
  data: any;
  timestamp: number;
  description: string;
  metadata: Record<string, any>;
}

// Frozen space options
export interface FrozenSpaceOptions {
  namespace?: string;
  path?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Connectivity test result
export interface ConnectivityTestResult {
  peers: { [peer: string]: { connected: boolean; status: string } };
  holsterInstance: boolean;
  userInstance: boolean;
  canWrite: boolean;
  canRead: boolean;
  testWriteResult?: any; // Use any for Holster compatibility
  testReadResult?: any;
}

// Login result
export interface LoginResult {
  success: boolean;
  userPub?: string;
  username?: string;
  error?: string;
}

// Signup result
export interface SignupResult {
  success: boolean;
  userPub?: string;
  username?: string;
  message?: string;
  error?: string;
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
}

// Post auth result
export interface PostAuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  error?: string;
}

// Password hint result
export interface PasswordHintResult {
  success: boolean;
  hint?: string;
  error?: string;
}

// Derive result types
export interface P256Keys {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
}

export interface Secp256k1Keys {
  pub: string;
  priv: string;
  address: string;
}

export interface DeriveResult {
  p256?: P256Keys;
  secp256k1Bitcoin?: Secp256k1Keys;
  secp256k1Ethereum?: Secp256k1Keys;
}

// Frozen space result
export interface FrozenSpaceResult {
  hash: string;
  fullPath: string;
  data: FrozenData;
}

// Verification result
export interface VerificationResult {
  verified: boolean;
  frozenData?: FrozenData;
  error?: string;
}

// Session restoration result
export interface SessionRestorationResult {
  success: boolean;
  userPub?: string;
  error?: string;
}

// User existence check result
export interface UserExistenceResult {
  exists: boolean;
  userPub?: string;
  error?: string;
}

// User creation result
export interface UserCreationResult {
  success: boolean;
  pub?: string;
  error?: string;
}

// Event data types
export type EventData = any;
export type EventListener = (data: EventData) => void;

// Holster operation result
export interface HolsterOperationResult {
  success: boolean;
  error?: string;
}
