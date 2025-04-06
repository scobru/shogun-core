import { BaseConfig, BaseEvent, BaseCacheEntry, BaseBackupOptions, BaseImportOptions } from "./common";
/**
 * Wallet types definitions
 */
/**
 * Interface defining a wallet's derivation path and creation timestamp
 */
export interface WalletPath {
    path: string;
    created: number;
}
/**
 * Interface for caching wallet balances
 */
export interface BalanceCache extends BaseCacheEntry<string> {
    balance: string;
}
/**
 * Interface for exporting wallet data
 */
export interface WalletExport {
    address: string;
    privateKey: string;
    path: string;
    created: number;
}
/**
 * Wallet configuration options
 */
export interface WalletConfig extends BaseConfig {
    rpcUrl?: string;
    defaultGasLimit?: number;
    balanceCacheTTL?: number;
}
/**
 * Transaction options
 */
export interface TransactionOptions extends BaseConfig {
    gasLimit?: number;
    gasPrice?: string;
    nonce?: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}
/**
 * Wallet backup options
 */
export interface WalletBackupOptions extends BaseBackupOptions {
    includePrivateKeys?: boolean;
}
/**
 * Wallet import options
 */
export interface WalletImportOptions extends BaseImportOptions {
    validateAddresses?: boolean;
}
/**
 * Wallet event types
 */
export declare enum WalletEventType {
    WALLET_CREATED = "walletCreated",
    WALLET_IMPORTED = "walletImported",
    BALANCE_UPDATED = "balanceUpdated",
    TRANSACTION_SENT = "transactionSent",
    TRANSACTION_CONFIRMED = "transactionConfirmed",
    ERROR = "error"
}
/**
 * Wallet event data
 */
export interface WalletEvent extends BaseEvent {
    type: WalletEventType;
}
