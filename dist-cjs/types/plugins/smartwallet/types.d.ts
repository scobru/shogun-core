/**
 * Configuration options for SmartWallet plugin
 */
export interface SmartWalletConfig {
    enabled?: boolean;
    factoryAddress?: string;
    defaultRequiredSignatures?: number;
    defaultRequiredGuardians?: number;
    privateKey?: string;
}
/**
 * Result of wallet creation
 */
export interface WalletCreateResult {
    success: boolean;
    walletAddress?: string;
    transactionHash?: string;
    error?: string;
}
/**
 * Wallet information
 */
export interface WalletInfo {
    address: string;
    owner: string;
    isSigner: boolean;
    requiredSignatures: number;
    requiredGuardians: number;
}
/**
 * Proposal information
 */
export interface ProposalInfo {
    proposalId: number;
    target: string;
    proposer: string;
    approvals: number;
    executed: boolean;
}
/**
 * Recovery request information
 */
export interface RecoveryRequest {
    newOwner: string;
    unlockTime: number;
    approvals: number;
}
/**
 * Transaction execution result
 */
export interface ExecutionResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}
/**
 * Interface for SmartWallet plugin
 */
export interface SmartWalletPluginInterface {
    setSigner(privateKey: string): Promise<void>;
    connectWallet(): Promise<void>;
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
