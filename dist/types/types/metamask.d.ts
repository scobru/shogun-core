import { BaseConfig, BaseResult, BaseAuthResult, BaseCacheEntry } from './common';
/**
 * MetaMask types definitions
 */
/**
 * Result of connection attempt
 */
export interface ConnectionResult extends BaseResult {
    address?: string;
    username?: string;
    randomPassword?: string;
}
/**
 * Result of authentication attempt
 */
export interface AuthResult extends BaseAuthResult {
    nonce?: string;
    timestamp?: number;
    messageToSign?: string;
}
/**
 * Structure for credentials generated via MetaMask
 */
export interface MetaMaskCredentials {
    /** Generated username based on the address */
    username: string;
    /** Generated password based on the signature */
    password: string;
    /** Original message signed by the user */
    message: string;
    /** Signature provided by MetaMask */
    signature: string;
}
/**
 * Ethereum provider interface
 */
export interface EthereumProvider {
    request: (args: any) => Promise<any>;
    isMetaMask?: boolean;
    on?: (event: string, handler: (params: any) => void) => void;
    removeListener?: (event: string, handler: (params: any) => void) => void;
}
/**
 * Cache entry for signatures
 */
export interface SignatureCache extends BaseCacheEntry<string> {
    signature: string;
    address: string;
}
/**
 * MetaMask configuration options
 */
export interface MetaMaskConfig extends BaseConfig {
    cacheDuration?: number;
}
