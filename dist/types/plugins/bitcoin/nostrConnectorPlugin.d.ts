import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { NostrConnectorCredentials, ConnectionResult, NostrConnectorPluginInterface } from "./types";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export declare class NostrConnectorPlugin extends BasePlugin implements NostrConnectorPluginInterface {
    name: string;
    version: string;
    description: string;
    private bitcoinConnector;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    private assertBitcoinConnector;
    /**
     * @inheritdoc
     */
    isAvailable(): boolean;
    /**
     * Check if Alby extension is available
     * Note: Alby is deprecated in favor of Nostr
     */
    isAlbyAvailable(): boolean;
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable(): boolean;
    /**
     * @inheritdoc
     */
    connectBitcoinWallet(type?: "alby" | "nostr" | "manual"): Promise<ConnectionResult>;
    /**
     * @inheritdoc
     */
    generateCredentials(address: string): Promise<NostrConnectorCredentials>;
    /**
     * @inheritdoc
     */
    cleanup(): void;
    /**
     * @inheritdoc
     */
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * Login with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates the user using Bitcoin wallet credentials after signature verification
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Register a new user with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account with Bitcoin wallet credentials
     */
    signUp(address: string): Promise<AuthResult>;
    /**
     * Convenience method that matches the interface pattern
     */
    loginWithBitcoinWallet(address: string): Promise<AuthResult>;
    /**
     * Convenience method that matches the interface pattern
     */
    signUpWithBitcoinWallet(address: string): Promise<AuthResult>;
}
