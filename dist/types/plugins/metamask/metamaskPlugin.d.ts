import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { MetaMaskPluginInterface } from "./types";
import { MetaMaskCredentials, ConnectionResult } from "../../types/metamask";
import { ethers } from "ethers";
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
    generatePassword(signature: string): Promise<string>;
    /**
     * @inheritdoc
     */
    verifySignature(message: string, signature: string): Promise<string>;
}
export { MetaMaskPluginInterface } from './types';
