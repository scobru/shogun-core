import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Web3ConnectorCredentials, ConnectionResult, Web3ConectorPluginInterface } from "./types";
import { ethers } from "ethers";
import { AuthResult } from "../../types/shogun";
/**
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
export declare class Web3ConnectorPlugin extends BasePlugin implements Web3ConectorPluginInterface {
    name: string;
    version: string;
    description: string;
    private Web3;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo Web3 sia inizializzato
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
    generateCredentials(address: string): Promise<Web3ConnectorCredentials>;
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
     * Login con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    login(address: string): Promise<AuthResult>;
    /**
     * Registra un nuovo utente con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato della registrazione
     * @description Crea un nuovo account utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    signUp(address: string): Promise<AuthResult>;
}
export type { Web3ConectorPluginInterface } from "./types";
