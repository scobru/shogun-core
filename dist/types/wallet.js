"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletEventType = void 0;
/**
 * Wallet event types
 */
var WalletEventType;
(function (WalletEventType) {
    WalletEventType["WALLET_CREATED"] = "walletCreated";
    WalletEventType["WALLET_IMPORTED"] = "walletImported";
    WalletEventType["BALANCE_UPDATED"] = "balanceUpdated";
    WalletEventType["TRANSACTION_SENT"] = "transactionSent";
    WalletEventType["TRANSACTION_CONFIRMED"] = "transactionConfirmed";
    WalletEventType["ERROR"] = "error";
})(WalletEventType || (exports.WalletEventType = WalletEventType = {}));
