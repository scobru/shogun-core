import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { MetaMaskCredentials, ConnectionResult, MetaMaskPluginInterface } from "./types";
import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
export declare class MetaMaskPlugin extends BasePlugin implements MetaMaskPluginInterface {
    name: string;
    version: string;
    description: string;
    private metamask;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo MetaMask sia inizializzato
     * @private
     */
    private assertMetaMask;
    /**
     * @inheritdoc
     */
    isAvailable(): boolean;
    /**
     * @inheritdoc
     */
    connectMetaMask(): Promise<ConnectionResult>;
    /**
     * @inheritdoc
     */
    generateCredentials(address: string): Promise<MetaMaskCredentials>;
    /**
     * @inheritdoc
     */
    cleanup(): void;
    /**
     * @inheritdoc
     */
    setCustomProvider(rpcUrl: string, privateKey: string): void;
    /**
     * @inheritdoc
     */
    getSigner(): Promise<ethers.Signer>;
    /**
     * @inheritdoc
     */
    getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider>;
    /**
     * @inheritdoc
     */
    generatePassword(signature: string): Promise<string>;
    /**
     * @inheritdoc
     */
    verifySignature(message: string, signature: string): Promise<string>;
    /**
     * Login con MetaMask
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet MetaMask dopo la verifica della firma
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Registra un nuovo utente con MetaMask
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato della registrazione
     * @description Crea un nuovo account utente usando le credenziali del wallet MetaMask dopo la verifica della firma
     */
    signUp(address: string): Promise<AuthResult>;
    /**
     * Legacy method for MetaMask login - use login() instead
     * @deprecated Use login(address) instead
     */
    loginWithMetaMask(address: string): Promise<AuthResult>;
    /**
     * Legacy method for MetaMask signup - use signUp() instead
     * @deprecated Use signUp(address) instead
     */
    signUpWithMetaMask(address: string): Promise<AuthResult>;
}
export type { MetaMaskPluginInterface } from "./types";
