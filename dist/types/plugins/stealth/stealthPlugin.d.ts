import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { StealthPluginInterface } from "./types";
import { StealthAddressResult, StealthData, EphemeralKeyPair } from "../../types/stealth";
import { ethers } from "ethers";
/**
 * Plugin per la gestione delle funzionalità Stealth in ShogunCore
 */
export declare class StealthPlugin extends BasePlugin implements StealthPluginInterface {
    name: string;
    version: string;
    description: string;
    private stealth;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il modulo Stealth sia inizializzato
     * @private
     */
    private assertStealth;
    /**
     * @inheritdoc
     */
    generateEphemeralKeyPair(): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    /**
     * @inheritdoc
     */
    generateStealthAddress(publicKey: string, ephemeralPrivateKey: string): Promise<StealthAddressResult>;
    /**
     * @inheritdoc
     */
    scanStealthAddresses(addresses: StealthData[], privateKeyOrSpendKey: string): Promise<StealthData[]>;
    /**
     * @inheritdoc
     */
    isStealthAddressMine(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    getStealthPrivateKey(stealthData: StealthData, privateKeyOrSpendKey: string): Promise<string>;
    /**
     * @inheritdoc
     */
    openStealthAddress(stealthAddress: string, ephemeralPublicKey: string, pair: EphemeralKeyPair): Promise<ethers.Wallet>;
}
