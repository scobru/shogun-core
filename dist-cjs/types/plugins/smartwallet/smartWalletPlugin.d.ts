import { BasePlugin } from "../base";
import { ShogunCore } from "../../core";
import { SmartWalletPluginInterface, SmartWalletConfig, WalletCreateResult, WalletInfo, ExecutionResult, ProposalInfo, RecoveryRequest } from "./types";
/**
 * Smart Wallet Plugin for Shogun Core
 * Provides integration with Smart Wallet contracts for account abstraction
 */
export declare class SmartWalletPlugin extends BasePlugin implements SmartWalletPluginInterface {
    name: string;
    version: string;
    description: string;
    private config;
    private factoryContract;
    private signer;
    constructor(config?: SmartWalletConfig);
    /**
     * Initialize the plugin
     */
    initialize(core: ShogunCore): void;
    /**
     * Destroy the plugin and cleanup resources
     */
    destroy(): void;
    /**
     * Initialize provider and signer
     */
    private initProvider;
    /**
     * Set signer with private key or wallet instance
     * This should be called after deriving the EOA from seed phrase
     */
    setSigner(privateKeyOrAddress: string): Promise<void>;
    /**
     * Connect to MetaMask or other injected provider
     */
    connectWallet(): Promise<void>;
    /**
     * Initialize factory contract
     */
    private initFactoryContract;
    /**
     * Ensure signer is available
     */
    private assertSigner;
    /**
     * Ensure factory is initialized
     */
    private assertFactory;
    createWallet(owner: string, requiredSignatures?: number, requiredGuardians?: number): Promise<WalletCreateResult>;
    createWalletWithGuardians(owner: string, guardians: string[], requiredSignatures?: number, requiredGuardians?: number): Promise<WalletCreateResult>;
    getWalletInfo(walletAddress: string): Promise<WalletInfo | null>;
    getOwnerWallets(ownerAddress: string): Promise<string[]>;
    addSigner(walletAddress: string, signer: string): Promise<ExecutionResult>;
    removeSigner(walletAddress: string, signer: string): Promise<ExecutionResult>;
    setRequiredSignatures(walletAddress: string, required: number): Promise<ExecutionResult>;
    addGuardian(walletAddress: string, guardian: string): Promise<ExecutionResult>;
    removeGuardian(walletAddress: string, guardian: string): Promise<ExecutionResult>;
    executeTransaction(walletAddress: string, target: string, data: string, value?: string): Promise<ExecutionResult>;
    executeBatch(walletAddress: string, targets: string[], dataArray: string[], values: string[]): Promise<ExecutionResult>;
    proposeExecution(walletAddress: string, target: string, data: string): Promise<ExecutionResult>;
    approveProposal(walletAddress: string, proposalId: number): Promise<ExecutionResult>;
    getProposalInfo(walletAddress: string, proposalId: number): Promise<ProposalInfo | null>;
    initiateRecovery(walletAddress: string, newOwner: string): Promise<ExecutionResult>;
    approveRecovery(walletAddress: string): Promise<ExecutionResult>;
    executeRecovery(walletAddress: string): Promise<ExecutionResult>;
    getRecoveryRequest(walletAddress: string): Promise<RecoveryRequest | null>;
}
