/**
 * Wallet event types
 */
export var WalletEventType;
(function (WalletEventType) {
    WalletEventType["WALLET_CREATED"] = "walletCreated";
    WalletEventType["WALLET_IMPORTED"] = "walletImported";
    WalletEventType["BALANCE_UPDATED"] = "balanceUpdated";
    WalletEventType["TRANSACTION_SENT"] = "transactionSent";
    WalletEventType["TRANSACTION_CONFIRMED"] = "transactionConfirmed";
    WalletEventType["ERROR"] = "error";
})(WalletEventType || (WalletEventType = {}));
