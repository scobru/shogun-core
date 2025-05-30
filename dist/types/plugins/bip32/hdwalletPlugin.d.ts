import { ethers } from "ethers";
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { HDWalletPluginInterface, WalletInfo } from "./types";
/**
 * Plugin per la gestione dei wallet in ShogunCore
 */
export declare class HDWalletPlugin extends BasePlugin implements HDWalletPluginInterface {
    name: string;
    version: string;
    description: string;
    private hdwallet;
    /**
     * @inheritdoc
     */
    initialize(core: ShogunCore): void;
    /**
     * @inheritdoc
     */
    destroy(): void;
    /**
     * Assicura che il wallet manager sia inizializzato
     * @private
     */
    private assertHDWallet;
    /**
     * @inheritdoc
     */
    getMainWallet(): ethers.Wallet | null;
    /**
     * @inheritdoc
     */
    getMainWalletCredentials(): {
        address: string;
        priv: string;
    };
    /**
     * @inheritdoc
     */
    createWallet(): Promise<WalletInfo>;
    /**
     * @inheritdoc
     */
    loadWallets(): Promise<WalletInfo[]>;
    /**
     * @inheritdoc
     */
    getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
    /**
     * @inheritdoc
     */
    generateNewMnemonic(): string;
    /**
     * @inheritdoc
     */
    signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>;
    /**
     * @inheritdoc
     */
    verifySignature(message: string | Uint8Array, signature: string): string;
    /**
     * @inheritdoc
     */
    signTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>;
    /**
     * @inheritdoc
     */
    exportMnemonic(password?: string): Promise<string>;
    /**
     * @inheritdoc
     */
    exportWalletKeys(password?: string): Promise<string>;
    /**
     * @inheritdoc
     */
    exportGunPair(password?: string): Promise<string>;
    /**
     * @inheritdoc
     */
    exportAllUserData(password: string): Promise<string>;
    /**
     * @inheritdoc
     */
    importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    importWalletKeys(walletsData: string, password?: string): Promise<number>;
    /**
     * @inheritdoc
     */
    importGunPair(pairData: string, password?: string): Promise<boolean>;
    /**
     * @inheritdoc
     */
    importAllUserData(backupData: string, password: string, options?: {
        importMnemonic?: boolean;
        importWallets?: boolean;
        importGunPair?: boolean;
    }): Promise<{
        success: boolean;
        mnemonicImported?: boolean;
        walletsImported?: number;
        gunPairImported?: boolean;
    }>;
    /**
     * @inheritdoc
     */
    setRpcUrl(rpcUrl: string): boolean;
    /**
     * @inheritdoc
     */
    getRpcUrl(): string | null;
    /**
     * @inheritdoc
     */
    setSigner(signer: ethers.Wallet): void;
    /**
     * @inheritdoc
     */
    getSigner(): ethers.Wallet | null;
    /**
     * @inheritdoc
     */
    getProvider(): ethers.JsonRpcProvider | null;
}
